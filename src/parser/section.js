function Section(key, block, inverted) {
	this.type = 'Section';
	this.key = key;
	this.block = block;
	this.inverted = inverted;
}

var uniqueId = (function() {
	var id = 0;
	return function() {
		return 's' + (++id);
	};
})();

Section.prototype.render = function(parentEl) {
	var sectionId = uniqueId(),
		createStr = '',
		editStr = '',
		vars = [];

	/* no section block */
	if (this.block === null) {
		return {
			create: createStr,
			edit: editStr,
			vars: vars
		};
	}

	var sectionFunction = 'var ' + sectionId + ' = function(data){'+
		'var parent = document.createDocumentFragment();';

	/* handle the section block */
	this.block.forEach(function(innerNode, key) {
		innerNode.options = this.options;
		var results = innerNode.render('parent', true);
		sectionFunction += results.edit;
		createStr += results.create;
	}, this);

	//add section to sections object
	sectionFunction += 'return parent;};';
	createStr += sectionFunction;
	editStr += 'shave.section(' + parentEl + ', ' + sectionId + ', data, ' + JSON.stringify(this.key) + ', '+ this.inverted +');';

	return {
		create: createStr,
		edit: editStr,
		vars: vars
	};
};

module.exports = Section;