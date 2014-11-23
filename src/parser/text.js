function Text(text) {
	this.type = 'Text';
	this.text = text;
}

var uniqueId = (function() {
	var id = 0;
	return function() {
		return 't' + (++id);
	};
})();

Text.prototype.render = function(parent) {
	var textId = uniqueId(),
		createStr = '',
		editStr = '',
		vars = [];

	createStr += 'var '+textId+' = document.createTextNode("'+this.text+'");';
	editStr += parent+'.appendChild(shave.c('+textId+'));';
	vars = [textId];

	return {
		create: createStr,
		edit: editStr,
		vars: vars
	};
};

module.exports = Text;