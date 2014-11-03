module.exports = (function() {

	var parser = require('./parser'),
		NodeBuilder = require('./NodeBuilder');
	fs = require('fs');

	function Domplate(template) {
		this.cleanTemplate = this.filter(template);
		try {
			this.parseTree = parser.parse(this.cleanTemplate);
		} catch (e) {
			console.log('error', e);
		}
	}

	/**
	 * Removes comments and line breaks
	 * @param  {String} template
	 * @return {String} The clean template
	 */
	Domplate.prototype.filter = function(template) {
		return template.replace(/\{\{!.+?\}\}/g, '')
			.replace(/\n[ ]+(?=\n|(\{\{[\/#][^{]+\}\}\n))/g, '\n')
			.replace(/[ ]+(\{\{#[^{]+\}\})\n/g, '$1')
			.replace(/[ ]+(\{\{\/[^{]+\}\})(<\/[a-zA-Z]+>)?$/, '$1')
			.replace(/[\n\r]/g, '');
	}

	/**
	 * Build the function string
	 *
	 * @param  {Object} parseTree
	 */
	Domplate.prototype.compile = function(parseTree) {
		var createStr = 'var fragment = document.createDocumentFragment();var sections = {};',
			editStr = '';
		this.parent = 'fragment';
		this.elCount = {};

		//loop through all top layer nodes
		//addNode() can be called recursively to handle nested elements
		this.parseTree.forEach(function(node) {
			var strings = this.addNode('fragment', node);
			createStr += strings.create;
			editStr += strings.edit;
		}, this);

		return this.addFunction(createStr, editStr);
	};

	var uniqueId = (function() {
		var id = 0;
		return function() {
			return 'id' + (++id);
		};
	})();

	/**
	 * Add each node to the fragment string
	 * A node is either some text, an html element or a tag {{ }}
	 * @param {Object} node
	 */
	Domplate.prototype.addNode = function(parent, node, opts) {
		var createStr = '',
			editStr = '',
			vars = [],
			nodeBuilder = NodeBuilder(opts, parent);
		opts = nodeBuilder.options;

		if (node.text) { //is a text node
			var result = nodeBuilder.createTextNode(node.text);

			if (opts.append) {
				createStr += result;
			} else {
				createStr += result.str;
				vars.push(result.var);
			}

		} else if (node.html) { //is an html node
			var strings = this.addElements(node, opts);
			createStr += strings.create;
			editStr += strings.edit;
			var elementVar = strings.elementVar;

			if (!hasTag(node.inner)) {
				var name = node.html + this.elCount[node.html];
				createStr += nodeBuilder.appendChild(name);
			} else {
				name = elementVar;
				editStr += nodeBuilder.appendChild(name);
			}

		} else {
			//is a tag
			var method = Object.keys(node)[0];
			if (/escape/.test(method)) { //is an escape/noescape tag

				//if append the tag is handled normally
				if (opts.append) {
					editStr += parent + '.innerHTML += ' + this[method](node) + ';';
				} else {
					//if !append the tag is within a section and must be handled at runtime
					vars.push(node);
				}

			} else { 
				// is a section tag
				var sectionId = uniqueId();
				//if it is a section without any content, we can ignore it
				//otherwise process the block of the section
				if (node.inner) {
					node.inner.forEach(function(innerNode, key) {
						var results = this.addNode(parent, innerNode, {
							append: false
						});
						createStr += results.create;
						editStr += results.edit;
						var variables = results.vars;

						if (innerNode.section || innerNode.text) {
							node.inner[key] = variables[0];
						}
					}, this);

					//add section to sections object
					createStr += 'this.' + sectionId + ' = ' + JSON.stringify(node) + ';';
					vars.push({
						section: sectionId
					});
				}
			}
		}

		return {
			create: createStr,
			edit: editStr,
			vars: vars
		};
	};

	/**
	 * Adds to the fragment string element creation
	 *
	 * @param {Object} el
	 */
	Domplate.prototype.addElements = function(el, opts) {
		var tagname = el.html;
		//keep count of each element type
		num = this.elCount[tagname] = (this.elCount[tagname] || 0) + 1;
		var name = tagname + num,
			createStr = '',
			editStr = '',
			elementVar = '';

		//create new element using el tagname and count as variable name
		createStr += 'var ' + name + ' = document.createElement("' + tagname + '");';

		//if there are attributes for this element...
		if (el.attributes.length) {
			//add them all
			el.attributes.forEach(function(attribute) {
				var attrStr = '',
					key = this.compileValue(attribute.key),
					value = this.compileValue(attribute.value);

				attrStr = name + '.setAttribute(' + key + ', ' + value + ');';

				if (hasTag(attribute.key) || hasTag(attribute.value)) {
					editStr += attrStr;
				} else {
					createStr += attrStr;
				}
			}, this);
		}

		//if there is inner content to this element...
		if (el.inner.length) {
			var hasTags = hasTag(el.inner);
			if (hasTags) {
				elementVar = name + 'Clone';
				editStr += 'var ' + elementVar + ' = ' + name + '.cloneNode(true);';

			} else {
				elementVar = name;
			}

			el.inner.forEach(function(node) {
				//if the innerHTML has a tag, all of the innerHTML must be added at edit time				
				var nodes = this.addNode(elementVar, node, {
					append: !hasTags
				});

				createStr += nodes.create;
				editStr += nodes.edit;
				var vars = nodes.vars;

				//vars array is passed back giving names of variables and section/tag objects
				vars.forEach(function(singleVar) {
					if (singleVar.section) {
						editStr += 'processSection(obj, that["' + singleVar.section + '"], ' + elementVar + ');';

					} else if (singleVar.escape || singleVar.noescape) {
						var method = Object.keys(singleVar)[0];
						editStr += elementVar+'.innerHTML += '+this[method](singleVar)+';';

					} else if (typeof singleVar === 'string') {
						editStr += elementVar + '.appendChild(' + singleVar + ');';
					}
				}, this);
			}, this);
		}

		return {
			create: createStr,
			edit: editStr,
			elementVar: elementVar
		};
	};

	/**
	 * Wraps the template function up
	 * Can prepare for AMD or whatever
	 *
	 * @param {String} fragmentStr
	 */
	Domplate.prototype.addFunction = function(createStr, editStr) {
		//func.js static helpers
		var helpers = [fs.readFileSync('src/funcs.min.js')];

		//give access to create time context
		helpers.push('var that=this;');

		//build whole domplate
		var func = '(function(){ ' + helpers.join('') + createStr +
			'return function(obj, options){' + editStr +
			'return fragment.cloneNode(true); }; })();';
		return func;
	};

	/**
	 * If data is an object, then evaluates as {{ }}, else prepares as string
	 * @param  {String|Object} data
	 * @return {String}
	 */
	Domplate.prototype.compileValue = function(data) {
		var text = '';
		if (typeof data === 'object' && !(data instanceof Array)) {
			//tag used as an attribute key or value

			//process tag
			var method = Object.keys(data)[0];
			text = this[method](data);

		} else if (data instanceof Array) {
			/*
			 * Building the attribute value string from an array of attribute values
			 * Could be either a simple string or a tag
			 *
			 * If the value is a string, remove quote:
			 * '"value1"' => ' value1'
			 * when completed => '" value1  value2  value3 "'
			 *
			 * If the value is a tag, add string concat:
			 * 'escapeHTML(resolveKey(obj, ["id"]))' => '"+escapeHTML(resolveKey(obj, ["id"]))+"'
			 * when completed => '""+escapeHTML(resolveKey(obj, ["id"]))+" value2 value3"'
			 */
			data.forEach(function(val) {
				var replaceQuotes = (typeof val === 'string');
				val = this.compileValue(val);
				text += replaceQuotes ? val.replace(/"/g, '') + ' ' : '"+' + val + '+" ';
			}, this);

			//finally wrap string in quotes
			text = '"' + text.trim() + '"';

		} else {
			//simple string gets wrapped in quotes
			text = '"' + data + '"';
		}

		return text;
	};

	/*** EVALUATION METHODS ***/

	/**
	 * escape - {{ xyz }}
	 *
	 * @param  {[Object} node
	 * @return {String} The resulting expression
	 */
	Domplate.prototype.escape = function(node) {
		var expression = getObjectValue('"' + node.escape + '"', node.dotted);
		return 'escapeHTML(' + expression + ')';
	};

	/**
	 * no escape - {{{ xyz }}} or {{& xyz }}
	 * @param  {Object} node
	 * @return {String}
	 */
	Domplate.prototype.noescape = function(node) {
		return getObjectValue('"' + node.noescape + '"', node.dotted);
	};

	/**
	 * section {{#xyz}}{{/xyc}}
	 * @param  {Object} node
	 * @return {string}
	 */
	Domplate.prototype.section = function(parent, node) {
		var createStr = '',
			editStr = '',
			vars = [];

		//if there is text or html nodes to be added
		//create them but don't append them, just return their variable names
		node.inner.forEach(function(node) {
			var strings = this.addNode(parent, node, {
				append: false,
				tags: false
			});

			createStr += strings.create;
			editStr += strings.edit;
			vars = vars.concat(strings.vars);
		}, this);

		editStr += 'processSection(obj["' + node.section + '"], ' + JSON.stringify(vars) + ', ' + parent + ');';

		return {
			create: createStr,
			edit: editStr,
			vars: vars
		};
	};

	/**
	 * Handles dotted notation if applicable
	 * @param  {String} starting [description]
	 * @param  {Array} dotted
	 * @return {String}
	 */
	var getObjectValue = function(starting, dotted) {
		if (!dotted.length) return 'resolveKey([obj], [' + starting + '])';
		var path = dotted.reduce(function(reduct, val) {
			return reduct + ',"' + val + '"';
		}, '[' + starting) + ']';
		return 'resolveKey([obj],' + path + ')';
	}

	/**
	 * Checks if the input is a tag or has a tag buried inside
	 * @param  {String|Object|Array}  input
	 * @return {Boolean}       [description]
	 */
	var hasTag = function(input) {
		if (typeof input === 'string') {
			return false;
		} else if (input instanceof Array) {
			for (var i = 0; i < input.length; i++) {
				if (input[i].html === undefined && input[i].text === undefined) {
					return true;
				}
			}
			return false;
		} else if (typeof input === 'object' && (input.html || input.text)) {
			return false;
		}

		return true;
	};

	return Domplate;
})();