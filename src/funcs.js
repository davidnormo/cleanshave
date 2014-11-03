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
 * @param  {[type]} stack [description]
 * @param  {[type]} path  [description]
 * @return {[type]}       [description]
 */
var resolveKey = function(stack, path) {
	var key = '', result = '';

	stackLoop: for (var j = 0; j < stack.length; j++) {
		var target = stack[j];

		pathLoop: for (var i = 0; i < path.length; i++) {
			key = path[i];
			target = target[key];
			if (target === undefined) {
				break pathLoop;
			}
		}

		if(target !== undefined && typeof target !== 'object') return target;
	}

	return '';
};

var getObjectValue = function(stack, starting, dotted) {
	if(starting === '.') return stack.pop();
	if (!dotted.length) return resolveKey(stack, ['' + starting]);

	var path = [starting];
	for (var i = 0; i < dotted.length; i++) {
		path.push(dotted[i]);
	}
	return resolveKey(stack, path);
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
var processSection = function(data, vars, parentEl, contextStack) {
	var key = vars.section;
	var context = data[key];

	//handled dotted notation: {{#a.b.c}}{{/a.b.c}}
	if(vars.dotted.length){
		key = vars.dotted[(vars.dotted.length - 1)];
		context = vars.dotted.reduce(function(ctx, key){
			//if undefined is found whilst resolving, use empty list, which won't evaluate anything
			return ctx[key] ? ctx[key] : [];
		}, context);
	}

	contextStack = contextStack || [];
	if(!(context instanceof Array)){
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
				parentEl.appendChild(that[variable].cloneNode(true));

			} else {
				//is either a tag, a section or some html
				if (variable.section !== undefined) {
					var innerSection = variable.section;
					var innerFrag = document.createDocumentFragment();
					processSection(data, that[innerSection], innerFrag, contextStack);
					contextStack.shift();
					parentEl.appendChild(innerFrag);

				} else {
					//for escape/noescape tags
					var method = Object.keys(variable)[0],
						contextData = contextStack.length ? contextStack : [obj],
						text = escapeHTML(getObjectValue(contextData, variable[method], variable.dotted));
					parentEl.appendChild(document.createTextNode(text));
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

	} else if(context instanceof Array){
		iterate(context);

	} else if (context == true) {
		//if the value is truthy, display the contents
		iterate([data]);
	}
};