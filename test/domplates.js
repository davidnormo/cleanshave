var Cleanshave = require('../src/cleanshave'),
	assert = require('chai').assert,
	jsdom = require('jsdom'),
	shave = require('../src/lib.min.js');

var specs = [{
	desc: 'should compile a simple div',
	template: '<div></div>',
	result: function(window, document){
		var div = document.querySelector('div');
		assert.instanceOf(div, window.HTMLElement);
	}
}, {
	desc: 'should compile a div with an attribute',
	template: '<div id="hello"></div>',
	result: function(window, document){
		var div = document.querySelector('#hello');
		assert.instanceOf(div, window.HTMLElement);
	}
}, {
	desc: 'should compile a simple div with some inner text',
	template: '<div>Hello World!</div>',
	result: function(window, document){
		var div = document.querySelector('div');
		assert.instanceOf(div, window.HTMLElement);
		assert.equal(div.innerHTML, 'Hello World!');
	}
}, {
	desc: 'should compile a div with an escaped value',
	template: '<div>{{ name }}</div>',
	data: { name: 'John Doe' },
	result: function(window, document){
		var div = document.querySelector('div');
		assert.equal(div.innerHTML, 'John Doe');
	},
}, {
	desc: 'should compile a div with an escaped attribute key',
	template: '<div {{ key }}="hello"></div>',
	data: { key: 'id' },
	result: function(window, document){
		var div = document.querySelector('#hello');
		assert.instanceOf(div, window.HTMLElement);
	}
}, {
	desc: 'should compile a div with an escaped attribute value',
	template: '<div id="{{id}}"></div>',
	data: { id: 'new' },
	result: function(window, document){
		var div = document.querySelector('#new');
		assert.instanceOf(div, window.HTMLElement);
	}
}, {
	desc: 'should compile a div with an escaped html value',
	template: '<div>{{ content }}</div>',
	data: { content: '1 is < 2 & 2 > 1' },
	result: function(window, document){
		var div = document.querySelector('div');
		assert.instanceOf(div, window.HTMLElement);
		assert.equal(div.innerHTML, '1 is &lt; 2 &amp; 2 &gt; 1');
	}
}, {
	desc: 'should compile a div with a no-escape value',
	template: '<div>{{{ value }}}</div>',
	data: { value: '<p>Hi there</p>' },
	result: function(window, document){
		var p = document.querySelector('div p');
		assert.instanceOf(p, window.HTMLElement);
		assert.equal(p.innerHTML, 'Hi there');
	}
}, {
	desc: 'the horrible nested section test',
	template: '<div>{{#a}}{{one}}{{#b}}{{one}}{{two}}{{one}}{{/b}}{{one}}{{/a}}</div>',
	data: { a: { one: 1, two: 'x' }, b: { one: 'z', two: 2 }},
	result: function(window, document){
		var div = document.querySelector('div');
		assert.equal(div.innerHTML, '1z2z1');
	}
}];

describe('Domplate', function() {
	specs.forEach(function(spec){
		it(spec.desc, function(){
			var template = new Cleanshave(spec.template, { name: 'domplate' });
			var result = template.compile();

			jsdom.env('<p>hi</p>', function(errs, window) {
				window.shave = shave;
				document = window.document;
				eval(result);
				var frag = window.domplate(spec.data || {});

				document.body.appendChild(frag);
				spec.result(window, document);
			});
		});
	});
});