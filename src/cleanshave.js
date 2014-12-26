var parser = require('./parser'),
	NodeBuilder = require('./NodeBuilder'),
	fs = require('fs');

/**
 * Domplate constructor
 * @param {[type]} template [description]
 * @param {[type]} options  [description]
 */
function Domplate(template, options) {
	this.options = options || {};
	this.cleanTemplate = this.filter(template);
	this.parseTree = parser.parse(this.cleanTemplate);
}

/**
 * Removes comments and line breaks
 * @param  {String} template
 * @return {String} The clean template
 */
Domplate.prototype.filter = function(template) {

	return template
		//remove comments
		.replace(/\{\{!.+?\}\}/g, '')
		//remove blank lines and indents
		.replace(/\n[ ]+(?=\n|(\{\{[\/#^][^{]+\}\}\n))/g, '\n')
		//remove whitespace and line breaks around sections
		.replace(/[ ]+(\{\{#[^{]+\}\})\n/g, '$1')
		//umm remove something else
		.replace(/[ ][ ](\{\{(\/|\^)[^{]+\}\})(<\/[a-zA-Z]+>)?/, '$1')
		//remove all new lines
		.replace(/[\n\r]/g, '');
}

/**
 * Build the function string
 *
 * @param  {Object} parseTree
 */
Domplate.prototype.compile = function(parseTree) {
	var createStr = 'var fragment = document.createDocumentFragment();',
		editStr = '';
	this.elCount = {};

	//loop through all top layer nodes
	//addNode() can be called recursively to handle nested elements
	this.parseTree.forEach(function(node) {
		node.options = this.options;
		var strings = node.render('frag');
		createStr += strings.create;
		editStr += strings.edit;
	}, this);

	return this.addFunction(createStr, editStr);
};

/**
 * Wraps the template function up
 * Can prepare for AMD or whatever
 *
 * @param {String} fragmentStr
 */
Domplate.prototype.addFunction = function(createStr, editStr) {
	var func = createStr +
		'return function(data){var frag = shave.c(fragment);' + editStr + 'return frag; };';

	if (this.options.moduleType === 'amd') {
		func = 'define(["shave"],function(){' + func + '});';
	} else if(this.options.moduleType === 'node'){ 
		func = 'var shave = require("shave");module.exports = (function(){' + func +'})();';	
	} else {
		func = 'window.' + this.options.name + '=(function(){' + func + '})();';
	}

	return func;
};

module.exports = Domplate;
