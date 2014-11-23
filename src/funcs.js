/* helper functions */

/**
 * Escapes & " ' < and >
 * If input isn't string, returns input
 *
 * @param  {String|Mixed} input The input to escape
 * @return {String} The cleaned string
 */
var escapeHTML = function(input) {
	if (typeof input !== "string") return input;

	return input.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/["]/g, "&quot;")
		.replace(/'/g, "&#039;");
};

/**
 * Resolves a key in a stack of contexts
 *
 * @param  {Array} stack   Array of context objects
 * @param  {Array} path    Array of keys where ['a','b'] => context.a.b
 * @return {String}		   The resulting value or empty string if not found
 */
var resolveKey = function(stack, path) {
	for (var j = 0; j < stack.length; j++) {
		var target = stack[j];

		//cheapest way of getting the objects value;
		try {
			target = eval('target.' + (path.join('.')));
		} catch (e) {};

		if (target !== stack[j] && target !== undefined) return target;
	}

	return '';
};

/**
 * Returns the value in an object, given a key(s)
 *
 * @param  {Array} stack     An array of context objects or values
 * @param  {String} starting The key to search for
 * @param  {Array} [dotted]  Optional array of keys where ['a','b'] => context.a.b
 * @return {String}          The resulting value or empty string if not found
 */
var getObjectValue = function(stack, starting, dotted) {
	//if we are resolving an implicit iterator, return the next value in the array
	if (starting === '.') return stack.pop();

	//else search for value in stack
	return resolveKey(stack, [starting].concat(dotted || []));
};

/**
 * Handles section behaviour for various values
 * @param  {Mixed} value The object/array for this section
 * @param  {Array} vars Variable names and tags to iterate with the section
 * @param  {HTMLElement} parentEl The parent element
 *
 *
 * {
		"a": {
			"one": 1
		},
		"b": {
			"two": 2
		},
		"c": {
			"three": 3
		},
		"d": {
			"four": 4
		},
		"e": {
			"five": 5
		}
	}

	{{#a}}{{ one }}{{#b}}{{one}{{ two }}{{one}}{{/b}}{{ one }}{{/a}} 
		sections => { 'xyz': a, 'yzx': b }
		a => [{ section: a, inner: ['one','yzx','one'] }]
		b => [{ section: b, inner: ['one','two','one'] }]
 */
var sec = {
	init: function(data, tree, parentEl) {
		this.data = data;
		this.tree = tree;
		this.parentEl = parentEl;
		this.sectionKey = tree.section;
		this.sectionValue = this.getSectionValue();

		switch (typeof sectionValue) {
			case 'boolean':
				boolSection();
			case 'object':
				if (sectionValue instanceof Array) {
					//iterating over an array
				} else {
					//using the context of the object
				}
		}
	},

	getSectionValue: function(){
		var sectionValue = this.data[this.sectionKey],
			falseyValues = [[], '', false, undefined];

		var result = falseyValues.some(function(value){
			return sectionValue === falseValue;
		}, this);

		return result;
	},

	boolSection: function(overrideValue) {
		if(overrideValue !== undefined){
			this.sectionValue = overrideValue
		}

		var isInverted = this.tree.inverted || false,
			//if inverted falsey  render, else true allows render
			okToRender = !isInverted;

		if (this.sectionValue === okToRender){
			this.renderBlock();
		}
	},

	renderBlock: function(block) {
		block.forEach(function(blockPart) {
			if (typeof blockPart !== "object") {
				//it is a variable name in the create context
				a(this.parentEl, c(that[blockPart]));

			} else if (blockPart.section !== undefined) {
				//is either a tag, a section or some html
				var innerFrag = document.createDocumentFragment();

				//recursively process inner section
				sec(this.data, that[blockPart.section], innerFrag, contextStack);

				//remove last context from stack
				contextStack.shift();

				a(parentEl, innerFrag);

			} else {
				//for escape/noescape tags
				var method = Object.keys(blockPart)[0],
					contextData = contextStack.length ? contextStack : [this.data],
					text = getObjectValue(contextData, blockPart[method], blockPart.dotted);

				text = method === 'escape' ? escapeHTML(text) : text;

				a(parentEl, document.createTextNode(text));
			}
		}, this);
	}
};

var sec = function(data, vars, parentEl, contextStack) {
	var key = vars.section;
	var context = data[key];

	//handled dotted notation: {{#a.b.c}}{{/a.b.c}}
	if (vars.dotted.length) {
		key = vars.dotted[(vars.dotted.length - 1)];
		context = vars.dotted.reduce(function(ctx, key) {
			//if undefined is found whilst resolving, use empty list, which won't evaluate anything
			return ctx[key] ? ctx[key] : [];
		}, context);
	}

	contextStack = contextStack || [];
	if (!(context instanceof Array)) {
		contextStack.unshift(context);
	}

	//false values aren't processed
	if (context === false) return;

	/**
	 * Builds the inside of the section
	 * @param  {Object} obj The object
	 */
	var iterateVariables = function(obj, variables) {
		variables.forEach(function(variable) {
			if (typeof variable !== "object") {
				//it is a variable name in the create context
				a(parentEl, c(that[variable]));

			} else {
				//is either a tag, a section or some html
				if (variable.section !== undefined) {
					var innerFrag = document.createDocumentFragment();

					//recursively process inner section
					sec(data, that[variable.section], innerFrag, contextStack);

					//remove last context from stack
					contextStack.shift();

					a(parentEl, innerFrag);

				} else {
					//for escape/noescape tags
					var method = Object.keys(variable)[0],
						contextData = contextStack.length ? contextStack : [obj],
						text = getObjectValue(contextData, variable[method], variable.dotted);

					text = method === 'escape' ? escapeHTML(text) : text;

					a(parentEl, document.createTextNode(text));
				}
			}
		});
	};

	/**
	 * Iterate the section, either over the elements of an array
	 * or the context of an object
	 * @param  {Object} context     [description]
	 * @param  {Boolean} recursively Whether to iterate or call recursively
	 */
	var iterate = function(obj, recursively) {
		recursively = recursively === undefined ? false : recursively;
		if (recursively) {
			iterateVariables(obj, vars.inner);

		} else {
			obj.forEach(function(item) {
				iterateVariables(item, vars.inner);
			});
		}
	};

	if (typeof context === 'object' && !(context instanceof Array)) {
		//if data is an object
		iterate(context, true);

	} else if (context instanceof Array) {
		iterate(context);

	} else if (context == true) {
		//if the value is truthy, display the contents
		iterate([data]);
	}
};

/* Minification helpers */

/**
 * Append child
 * @param  {HTMLElement} parent [description]
 * @param  {HTMLElement} child  [description]
 * @return {[type]}        [description]
 */
var a = function(parent, child) {
	parent.appendChild(child);
	return parent;
};

/**
 * Clone node
 * @param  {HTMLElement} node
 * @return {HTMLElement}
 */
var c = function(node) {
	return node.cloneNode(true);
};