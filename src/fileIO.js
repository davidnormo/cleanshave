var fs = require('fs'),
	Transpiler = require('./transpiler');

/**
 * FileIO reads in a file, transpiles and outputs to the target dir
 * @param {String} template
 * @param {String} dest
 */
function FileIO(template, dest){
	fs.exists(dest, function(exists){
		if(!exists) fs.mkdir(dest, function(){});
	});

	var outFilename = template.split('/').pop().replace(/\..+$/, '.js');

	if(dest.lastIndexOf('/') !== (dest.length - 1)){
		dest += '/';
	}

	fs.readFile(template, function(err, data){
		if(err) throw err;

		var trans = new Transpiler(data.toString()),
			domplate = trans.compile();

		fs.writeFile(dest+outFilename, domplate, function(){
			console.log('Domplate complete!');
			process.exit(0);
		});
	});
}
FileIO.prototype.constructor = FileIO;

module.exports = FileIO;