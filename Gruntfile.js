module.exports = function(grunt) {

	grunt.initConfig({
		mochacli: {
			options: {
				reporter: 'spec',
				grep: grunt.option('grep')
			},
			all: ['test/*.js']
		},
		peg: {
			build: {
				src: 'src/grammar.peg',
				dest: 'src/parser.js'
			}
		}
	});

	grunt.loadNpmTasks('grunt-mocha-cli');
	grunt.loadNpmTasks('grunt-peg');

	grunt.registerTask('parser', ['peg:build']);
	grunt.registerTask('test', ['mochacli']);
};
