function Partial(key){
	this.key = key;
}

Partial.prototype.render = function(){
	var output = '';
	switch(this.options.moduleType){
		case 'amd':
			output = 'require("'+this.key+'")();';
		case 'node':
		default:
	}

	return {
		create: '',
		edit: output
	};
};

module.exports = Partial;