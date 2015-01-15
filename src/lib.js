(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['require'], factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory(require);
	} else {
		// Browser globals (root is window)
		root.shave = factory();
	}
}(this, function(require) {
	var shave = {};

	shave.require = require;

	/**
	 * Escapes & " ' < and >
	 * If input isn't string, returns input
	 *
	 * @param  {String|Mixed} input The input to escape
	 * @return {String} The cleaned string
	 */
	shave.escape = function(input) {
		if (typeof input !== "string") return input;

		return input.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/["]/g, "&quot;")
			.replace(/'/g, "&#039;");
	};

	shave.contextStack = [];

	/**
	 * Pushes contexts to search onto the context stack
	 * @param {Object} data
	 * @param {Array} key  Array of keys to add recursively
	 */
	shave.setContextStack = function(data, key) {
		var context = data;
		key.forEach(function(keyPart) {
			try {
				context = context[keyPart];
			} catch(e){ return false; }

			if (context instanceof Array) {
				this.contextStack = context.slice(0);
				this.contextStack.reverse();
			} else if (context) {
				this.contextStack.push(context);
			}
		}, this);
	};

	/**
	 * Removes contexts from the stack
	 * @param  {Object} data
	 * @param  {Array} key Keys of contexts to remove
	 */
	shave.clearContextStack = function(data, key) {
		var i = (key.length - 1);
		while (i >= 0) {
			try {
				var context = eval('data.' + key.join('.'));
			} catch (e) {}

			if (context instanceof Array) {
				this.contextStack = [];
				return;
			}
			if (context) {
				this.contextStack.pop();
			}

			key.pop();
			i--;
		}
	};

	/**
	 * Renders a tag
	 * @param  {Object} tag  Simple object, describing the tag
	 * @param  {Object} [data] The object to render the tag against
	 * @return {Mixed}
	 */
	shave.resolve = function(tag, data) {
		var stack = data !== undefined ? [data] : this.contextStack;
		var i = stack.length - 1;
		while (i >= 0) {
			var result, data = stack[i];

			if (tag.key[0] === '.') {
				//implicity iterator
				result = data;
			} else {
				try {
					result = eval('data.' + tag.key.join('.'));
				} catch (e) {}
			}

			if (result !== undefined && result) {
				return result;
			}
			i--;
		}

		return '';
	};

	/**
	 * Handles generating a section block
	 * @param  {HTMLElement} parent The parent element of the section
	 * @param  {Function} func The function handles generating the section block
	 * @param  {Mixed} data  The data for the section
	 * @param  {Bool} Inverted Are we dealing with an inverted section?
	 * @param  {Array} key   Keys to traverse the data object
	 */
	shave.section = function(parent, func, data, key, inverted) {
		inverted = inverted || false;
		this.setContextStack(data, key);
		var isValid = function(value){
			if(value instanceof Array) value = value.length !== 0;
			//not inverted: true, non-empty object, non-empty array
			//invert: false, empty object, empty array
			return inverted ? !value : !!value;
		};

        //resolve the value of the section key
		var sectionValue;
		try {
			sectionValue = eval('data.' + key.join('.'));
		} catch (e) {
			if(!inverted){
				return false;
			} else{
				sectionValue = false;
			}
		};

		//bind section function to the context of this library
		func = func.bind(this);
		if (sectionValue instanceof Array && !inverted) {
			//iterate over array
			sectionValue.forEach(function(arrElement) {
				parent.appendChild(func(arrElement));
				this.contextStack.pop();
			}, this);

		} else if (isValid(sectionValue)) {
			//use objects context or resolve bool
			parent.appendChild(func(data));
		}

		this.clearContextStack(data, key);
	};

	/**
	 * [append description]
	 * @param  {[type]} data   [description]
	 * @param  {[type]} parent [description]
	 * @return {[type]}        [description]
	 */
	shave.append = function(data, parent) {
		var tmp = document.createElement('div');
		tmp.innerHTML = data;

		for (var i = 0; i < tmp.childNodes.length; i++) {
			parent.appendChild(tmp.childNodes[i]);
		}
	};

	/* Minification helpers */

	/**
	 * Append child
	 * @param  {HTMLElement} parent [description]
	 * @param  {HTMLElement} child  [description]
	 * @return {[type]}        [description]
	 */
	shave.a = function(parent, child) {
		parent.appendChild(child);
		return parent;
	};

	/**
	 * Clone node
	 * @param  {HTMLElement} node
	 * @return {HTMLElement}
	 */
	shave.c = function(node) {
		return node.cloneNode(true);
	};

	shave.d = function(){
		return document.createDocumentFragment();
	};

	/**
	 * Create a node
	 * @param  {string} el   Tag name or text content if text node
	 * @param  {bool} text   Create a text node?
	 * @return {Node}
	 */
	shave.e = function(el, text){
		return text ? document.createTextNode(el) : document.createElement(el);
	};

	/**
	 * Require partial, handles require miss errors
	 * @param  {string} key 
	 * @param  {Object} data
	 * @return {Node}
	 */
	shave.r = function(key, data){
		try {
			return this.require(key)(data);
		} catch(e){
			return document.createTextNode('');
		}
	};

	return shave;
}));