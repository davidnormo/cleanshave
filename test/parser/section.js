var Section = require('../../src/parser/section'),
	Text = require('../../src/parser/text'),
	Tag = require('../../src/parser/tag'),
	assert = require('chai').assert,
	jsdom = require('jsdom'),
	shave = require('../../src/lib.min.js');

describe('Section', function(){
	it('should render nothing for an empty section', function(){
		//{{#list}}{{/list}}
		
		var sec = new Section(['list'], null, false);
		var results = sec.render();

		assert.equal(results.create, '');
		assert.equal(results.edit, '');
		assert.equal(results.vars.length, 0);
	});

	it('should render a text node correctly', function(done){
		//{{#list}}Hi there{{/list}}
		
		var sec = new Section(['list'], [new Text('Hi there')], false);
		var results = sec.render('frag');

		jsdom.env('<html></html>', function(err, window){
			window.shave = shave;
			var document = window.document;
			eval(results.create);
			shave.section(document.body, s2, {list:true}, ['list']);
			assert.equal(document.body.innerHTML, 'Hi there');
			done();
		});
	});

	it('should render a tag correctly', function(done){
		//{{#list}}{{name}}{{/list}}
		
		var sec = new Section(['list'], [new Tag(['name'], true)], false);
		var results = sec.render('frag');

		jsdom.env('<html></html>', function(err, window){
			window.shave = shave;
			var document = window.document;
			eval(results.create);
			shave.section(document.body, s3, {list: [{name: 'george'}] }, ['list']);
			assert.equal(document.body.innerHTML, 'george');
			done();
		});
	});
});