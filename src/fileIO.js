var fs = require('fs'),
Cleanshave = require('./cleanshave');

/**
 * FileIO reads in a file, transpiles and outputs to the target dir
 * @param {String} template
 * @param {String} dest
 */
function FileIO(options){
	var dest = options.dest || '';
	this.template = options.template;
	this.opts = {
		moduleType: (options.amd ? 'amd' : (options.node ? 'node' : 'global')),
	};

	if(dest){
		fs.exists(dest, function(exists){
			if(!exists) fs.mkdir(dest, function(){});
		});

		//if destination doesn't end with a trailing slash, add one
		if(dest.lastIndexOf('/') !== (dest.length - 1)){
			dest += '/';
		}
	}

	this.output = dest + this.opts.name + '.js';
}
FileIO.prototype.constructor = FileIO;
module.exports = FileIO;

/**
 * Creates a single domplate and outputs it to a file 
 * @param {Function} onend Callback
 */
FileIO.prototype.createSingle = function(template, outputDir, onend){
	var that = this
	opts = {
		moduleType: this.opts.moduleType,
		name: template.split('/').pop().replace(/\.[^.]+$/, '')
	},
	output = (function(){
		if( typeof outputDir === 'object' ){ 
			return function(domplate, onend){ outputDir = domplate; onend() };
		} else {
			return function(domplate, onend){
				output = outputDir + opts.name + '.js';
				fs.writeFile(output, domplate, function(){
					console.log('Domplate created at: ', output);
					onend();
				});
			}
		}
	})();

	fs.readFile(template, function(err, data){
		if(err) throw err;

		var template = new Cleanshave(data.toString(), opts),
		domplate = template.compile();
		console.log(domplate);return;
		output(domplate, onend);
	});
};

FileIO.prototype.createBatch = function(onend){

};
