var jsonfile = require('jsonfile'),
    specs = jsonfile.readFileSync('specs/interpolation.json'),
    Domplate = require('../src/transpiler'),
    assert = require('chai').assert,
	jsdom = require('jsdom');

describe('Interpolation', function(){
	// specs.tests = [specs.tests[14]];
    specs.tests.forEach(function(spec) {
		it(spec.name, function(){
			var domplate = new Domplate('<div>'+spec.template+'</div>'),
				result = domplate.compile();
				// console.log(result);

			jsdom.env('<p>hi</p>', function(errs, window) {
				document = window.document;
				var template = eval(result);
				var frag = template(spec.data);

				document.body.appendChild(frag);
				var div = document.querySelector('div');
				var old = div.innerHTML;
				div.innerHTML = domplate.filter(spec.expected);
				assert.equal(old, div.innerHTML, spec.desc);
			});
		});
    });
});