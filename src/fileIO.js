var fs = require('fs'),
	Cleanshave = require('./cleanshave');

/**
 * FileIO reads in a file, transpiles and outputs to the target dir
 * @param {String} template
 * @param {String} dest
 */
function FileIO(options){
	var template = options.template,
		dest = options.dest,
		opts = {};
	opts.moduleType = options.amd  ? 'amd' : 'global';

	fs.exists(dest, function(exists){
		if(!exists) fs.mkdir(dest, function(){});
	});

	var outFilename = opts.name = template.split('/').pop().replace(/\..+$/, '');

	if(dest.lastIndexOf('/') !== (dest.length - 1)){
		dest += '/';
	}

	fs.readFile(template, function(err, data){
		if(err) throw err;

		var template = new Cleanshave(data.toString(), opts),
			domplate = template.compile();

		fs.writeFile(dest+outFilename+'.js', domplate, function(){
			console.log('Domplate complete!');
			process.exit(0);
		});
	});
}
FileIO.prototype.constructor = FileIO;
module.exports = FileIO;