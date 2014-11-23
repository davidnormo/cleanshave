/**
 * NodeBuilder
 * @param {Object} options  
 * @param {String} parentEl Variable name of the parent HTMLElement
 * @returns {NodeActions}
 */
function NodeBuilder(options, parentEl){
	//set default options
	var opts = options || {};
	opts.append = opts.append === undefined ? true : opts.append;
	opts.tags = opts.tags === undefined ? true : opts.tags;

	return new NodeActions(opts, parentEl);	
}
module.exports = NodeBuilder;

/**
 * NodeActions
 * @param {[type]} options  [description]
 * @param {[type]} parentEl [description]
 */
function NodeActions(options, parentEl){
	this.options = options;
	this.parentEl = parentEl;
}
NodeActions.prototype.constructor = NodeActions;

/**
 * Creates a text node
 * @param  {String} text Contents of text node
 * @return {String}
 */
NodeActions.prototype.createTextNode = function(text){
	var node = 'document.createTextNode("'+text+'")';

	if(this.options.append){
		node = 'a('+this.parentEl+','+node+');';
	} else {
		var varName = this.uniqueId();
		node = {
			str: 'this.'+varName+ '=' + node +';',
			var: varName
		};
	}

	return node;
};

/**
 * Returns a unique identifier
 * @return {String}
 */
NodeActions.prototype.uniqueId = (function(){
	var id = 0;
	return function(){
		return 'n'+(++id);
	};
})();

/**
 * Builds an appendChild string
 * @param  {String} nodeName The variable name of the node to append
 * @return {String}
 */
NodeActions.prototype.appendChild = function(nodeName){
	return 'a('+this.parentEl+','+nodeName+');';
};

/**
 * Builds a cloneNode string
 * @type {String}
 */
NodeActions.prototype.cloneNode = function(nodeName){
	return 'c('+nodeName+')';
};
