function Tag(key, escape) {
	this.type = 'Tag';
	this.key = key;
	this.escape = escape;
}

var uniqueId = (function() {
	var id = 0;
	return function() {
		return 'tag' + (++id);
	};
})();

Tag.prototype.render = function(parent, isSection) {
	isSection = isSection === undefined ? false : isSection;
	var editStr = '',
		tag = {
			key: this.key,
			escape: this.escape,
		},
		dataStr = isSection ? '' : ', data'

	if (parent) {
		if (this.escape) {
			//escape
			editStr += 'shave.a('+parent + ',shave.e(shave.resolve(' + JSON.stringify(tag) + dataStr + '),true));';
		} else {
			if (isSection) {
				//no escape
				editStr += 'shave.append(shave.resolve(' + JSON.stringify(tag) + dataStr + '), '+parent+');';
			} else {
				editStr += parent+'.innerHTML += shave.resolve(' + JSON.stringify(tag) + dataStr + ');';
			}
		}
	} else {
		//escape or no escape handled by calling method
		editStr += 'shave.resolve(' + JSON.stringify(tag) + dataStr + ')';
	}

	return {
		create: '',
		edit: editStr,
		vars: []
	};
}

module.exports = Tag;