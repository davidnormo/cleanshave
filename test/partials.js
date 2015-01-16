var jsonfile = require('jsonfile'),
	specs = jsonfile.readFileSync('specs/partials.json'),
	Cleanshave = require('../src/cleanshave'),
	assert = require('chai').assert,
	jsdom = require('jsdom'),
	shave = require('../src/lib.min.js');

describe('Partials', function() {
	specs.tests.forEach(function(spec) {
		it(spec.name, function() {
			var template = new Cleanshave('<div>' + spec.template + '</div>', {
					name: 'domplate',
					moduleType: 'amd'
				}),
				result = template.compile();

			jsdom.env('<p>hi</p>', function(errs, window) {
				window.shave = shave;
				document = window.document;
				window.domplate = false;

				//requireJS fakes
				var require = function(key) {
					//build partial domlpate
					var temp = new Cleanshave(spec.partials[key], {
						name: key,
						moduleType: 'amd'
					});
					//compile to domplate
					var result = temp.compile();
					//fake loading domplate
					eval(result);
					//return domplate
					return window.partial;
				};
				var define = function(){ 
					if(!window.domplate){
						window.domplate = arguments[1](shave);
					} else {
						window.partial = arguments[1](shave);
					}
				};
				shave.require = require;
		
				//effectively loads domplate
				eval(result);
				//use domplate
				var frag = window.domplate(spec.data);

				document.body.appendChild(frag);
				var div = document.querySelector('div');
				var old = div.innerHTML;
				div.innerHTML = template.filter(spec.expected);
				assert.equal(old, div.innerHTML, spec.desc);
			});
		});
	});
});
