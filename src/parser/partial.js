function Partial(key){
	this.key = key;
}

Partial.prototype.render = function(parentEl){
	var output = '';
	switch(this.options.moduleType){
		case 'amd':
			output = parentEl+'.appendChild(shave.r("'+this.key+'", data));';
		case 'node':
		default:
	}

	return {
		create: '',
		edit: output
	};
};

module.exports = Partial;