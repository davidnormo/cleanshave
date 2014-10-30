module.exports = function(grunt) {

	grunt.initConfig({
		concat: {
			options: {
				stripBanners: false,
				banner: '/*! @author David Normington */\n(function(factory){if(typeof define === "function" && define.amd){define(["exports"], factory);} else if(typeof exports !== "undefined"){factory(exports);}})(function(exports){\nvar window = {};\n',
				footer: '});'
			},
			dist: {
				src: ['src/*'],
				dest: 'dist/fakeFS.js'
			}
		},
		uglify: {
			options: {
				mangle: false,
			},
			my_target: {
				files: {
					'dist/fakeFS.min.js': ['dist/fakeFS.js']
				}
			}
		},
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

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-mocha-cli');
	grunt.loadNpmTasks('grunt-peg');

	grunt.registerTask('default', ['concat', 'uglify:my_target']);
	grunt.registerTask('parser', ['peg:build']);
	grunt.registerTask('test', ['concat', 'uglify:my_target', 'mochacli']);
};
