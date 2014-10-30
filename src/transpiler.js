module.exports = (function() {

    var parser = require('./parser');

	function Domplate(template){
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
	Domplate.prototype.filter = function(template){
		return template.replace(/{{!(.|[\n\r])+}}/g, '')
					.replace(/[\n\r]/g, '');
	}

	/**
	 * Build the function string
	 * 
	 * @param  {Object} parseTree
	 */
	Domplate.prototype.compile = function(parseTree){
		var createStr = 'var fragment = document.createDocumentFragment();',
			editStr = '';
		this.parent = 'fragment';
		this.elCount = {};

		//loop through all top layer nodes
		//addNodes() can be called recursively to handle nested elements
		this.parseTree.forEach(function(node){
			var strings = this.addNodes('fragment', node);
			createStr += strings.create;
			editStr += strings.edit;
		}, this);

		return this.addFunction(createStr, editStr);
	};

	/**
	 * Add each node to the fragment string
	 * A node is either some text, an html element or a tag {{ }}
	 * @param {Object} node
	 */
	Domplate.prototype.addNodes = function(parent, node){
		var createStr = '', editStr = '';

		if(node.text){  //is a text node
			createStr += parent+'.appendChild(document.createTextNode("'+node.text+'"));';

		} else if(node.html){ //is an html node
			var strings = this.addElements(node);
			createStr += strings.create;
			editStr += strings.edit;

			var name = node.html + this.elCount[node.html];
			createStr += parent+'.appendChild('+name+');';

		} else {  //is a tag
			var method = Object.keys(node)[0];
			if(/escape/.test(method)){  //is an escape/noescape tag
				editStr += parent+'.innerHTML += '+this[method](node)+';';

			} else {  // is a section tag
				editStr += this.section(parent, node);
			}
		}

		return { create: createStr, edit: editStr };
	};

	/**
	 * Adds to the fragment string element creation
	 * 
	 * @param {Object} el
	 */
	Domplate.prototype.addElements = function(el){
		var tagname = el.html;
		//keep count of each element type
		num = this.elCount[tagname] = (this.elCount[tagname] || 0) + 1;
		var name = tagname + num, createStr = '', editStr = '';

		//create new element using el tagname and count as variable name
		createStr += 'var '+name+' = document.createElement("'+tagname+'");';

		//if there are attributes for this element...
		if(el.attributes.length){
			//add them all
			el.attributes.forEach(function(attribute){
				var attrStr = '',
					key = this.compileValue(attribute.key), 
					value = this.compileValue(attribute.value);

				attrStr = name+'.setAttribute('+key+', '+value+');';

				if(hasTag(attribute.key) || hasTag(attribute.value)){
					editStr += attrStr;
				} else {
					createStr += attrStr;
				}
			}, this);
		}

		//if there is inner content to this element...
		if(el.inner.length){
			var prevParent = this.parent;
			//if the innerHTML has a tag, all of the innerHTML must be added at edit time
			var editOnly = hasTag(el.inner);
			el.inner.forEach(function(node){
				var strings = this.addNodes(name, node);

				if(editOnly){
					editStr += strings.create + strings.edit;
				} else {
					createStr += strings.create;
					editStr += strings.edit;
				}
			}, this);
		}

		return { create: createStr, edit: editStr };
	};

	/**
	 * Wraps the template function up
	 * Can prepare for AMD or whatever
	 * 
	 * @param {String} fragmentStr
	 */
	Domplate.prototype.addFunction = function(createStr, editStr){
		var helpers = [
			//funcs.js line 10
			'var escapeHTML=function(e){if(typeof e!=="string")return e;return e.replace(/&/g,"&").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/["]/g,"&quot;").replace(/\'/g,"&#039;")};',

         	//funcs.js line 26
         	'var resolveKey=function(e,t){var n=e,r="";for(var i=0;i<t.length;i++){r=t[i];if(n[r]===undefined){return""}n=n[r]}return n};'
		];

		var func  = '(function(){ '+helpers.join('')+createStr+
			'return function(obj, options){'+editStr+
			'return fragment.cloneNode(true); }; })();';
		return func;
	};

	/**
	 * If data is an object, then evaluates as {{ }}, else prepares as string
	 * @param  {String|Object} data
	 * @return {String}
	 */
	Domplate.prototype.compileValue = function(data){
		var text = '';
		if(typeof data === 'object' && !(data instanceof Array)){
			//tag used as an attribute key or value

			//process tag
			var method = Object.keys(data)[0];
			text = this[method](data);

		} else if(data instanceof Array){
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
			data.forEach(function(val){
				var replaceQuotes = (typeof val === 'string');
				val = this.compileValue(val);
				text += replaceQuotes ? val.replace(/"/g, '')+' ' : '"+'+val+'+" ';
			}, this);

			//finally wrap string in quotes
			text = '"'+text.trim()+'"';

		} else {
			//simple string gets wrapped in quotes
			text = '"'+data+'"';
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
	Domplate.prototype.escape = function(node){
		var expression = this.getObjectValue('"'+node.escape+'"', node.dotted);
		return 'escapeHTML('+expression+')';
	};

	/**
	 * no escape - {{{ xyz }}} or {{& xyz }}
	 * @param  {Object} node 
	 * @return {String}
	 */
	Domplate.prototype.noescape = function(node){
		return this.getObjectValue('"'+node.noescape+'"', node.dotted);
	};

	/**
	 * section {{#xyz}}{{/xyc}}
	 * @param  {Object} node
	 * @return {string}
	 */
	Domplate.prototype.section = function(parent, node){
		var editStr = 'tmp=obj;obj=obj["'+node.section+'"];';

		node.inner.forEach(function(node){
			var strings = this.addNodes(parent, node);
			editStr += strings.create + strings.edit;
		}, this);

		return editStr + 'obj=tmp;'
	};

	/**
	 * Handles dotted notation if applicable
	 * @param  {String} starting [description]
	 * @param  {Array} dotted 
	 * @return {String}
	 */
	Domplate.prototype.getObjectValue = function(starting, dotted){
		//if not using dotted notation, resolve only one key
		if(!dotted.length) return 'resolveKey(obj, ['+starting+'])';

		//build the path array to resolve against the obj: see funcs.js line 26
		var path = dotted.reduce(function(reduct, val){
			return reduct + ',"' + val + '"';
		}, '[' + starting ) + ']';

		return 'resolveKey(obj,'+path+')';
	}

	/**
	 * Checks if the input is a tag or has a tag buried inside
	 * @param  {String|Object|Array}  input
	 * @return {Boolean}       [description]
	 */
	var hasTag = function(input){
		if(typeof input === 'string'){
			return false;
		} else if(input instanceof Array){
			for(var i = 0; i < input.length; i++){
				if(typeof value !== 'string') {
					return true;
				}
			}
			return false;
		} else if(typeof input === 'object' && input.html){
			return false;
		}

		return true;
	}

	return Domplate;
})();
