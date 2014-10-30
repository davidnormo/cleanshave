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
		var fragmentStr = 'var fragment = document.createDocumentFragment();';
		this.parent = 'fragment';
		this.elCount = {};

		//loop through all top layer nodes
		//addNodes() can be called recursively to handle nested elements
		this.parseTree.forEach(function(node){
			fragmentStr += this.addNodes('fragment', node);
		}, this);

		return this.addFunction(fragmentStr);
	};

	/**
	 * Add each node to the fragment string
	 * A node is either some text, an html element or a tag {{ }}
	 * @param {Object} node
	 */
	Domplate.prototype.addNodes = function(parent, node){
		var fragmentStr = '';

		if(node.text){  //is a text node
			fragmentStr += parent+'.appendChild(document.createTextNode("'+node.text+'"));';

		} else if(node.html){ //is an html node
			fragmentStr += this.addElements(node);
			var name = node.html + this.elCount[node.html];
			fragmentStr += parent+'.appendChild('+name+');';

		} else {  //is a tag
			var method = Object.keys(node)[0];
			if(/escape/.test(method)){  //is an escape/noescape tag
				fragmentStr += parent+'.innerHTML += '+this[method](node)+';';

			} else {  // is a section tag
				fragmentStr += this.section(parent, node);
			}
		}

		return fragmentStr;
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
		var name = tagname + num, fragmentStr = '';

		//create new element using el tagname and count as variable name
		fragmentStr += 'var '+name+' = document.createElement("'+tagname+'");';

		//if there are attributes for this element...
		if(el.attributes.length){
			//add them all
			el.attributes.forEach(function(attribute){
				var key = this.compileValue(attribute.key), 
					value = this.compileValue(attribute.value);

				fragmentStr += name+'.setAttribute('+key+', '+value+');';
			}, this);
		}

		//if there is inner content to this element...
		if(el.inner.length){
			var prevParent = this.parent;
			el.inner.forEach(function(node){
				fragmentStr += this.addNodes(name, node);
			}, this);
		}

		return fragmentStr;
	};

	/**
	 * Wraps the template function up
	 * Can prepare for AMD or whatever
	 * 
	 * @param {String} fragmentStr
	 */
	Domplate.prototype.addFunction = function(fragmentStr){
		var helpers = [
			//funcs.js line 10
			'var escapeHTML=function(e){if(typeof e!=="string")return e;return e.replace(/&/g,"&").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/["]/g,"&quot;").replace(/\'/g,"&#039;")};',

         	//funcs.js line 26
         	'var resolveKey=function(e,t){var n=e,r="";for(var i=0;i<t.length;i++){r=t[i];if(n[r]===undefined){return""}n=n[r]}return n};'
		];

		var func  = '(function(){ '+helpers.join('')+'return function(obj, options){'+fragmentStr+
			'return fragment; }; })();';
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
		str = 'tmp=obj;obj=obj["'+node.section+'"];';

		node.inner.forEach(function(node){
			str += this.addNodes(parent, node);
		}, this);

		return str + 'obj=tmp;'
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

	return Domplate;
})();
