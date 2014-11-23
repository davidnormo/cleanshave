var NodeBuilder = require('../src/NodeBuilder'),
	assert = require('chai').assert;

describe('NodeBuilder', function(){

	it('should return a NodeActions object', function(){
		var obj = NodeBuilder();
		assert.isObject(obj);
		assert.ok(/NodeActions/.test(obj.__proto__.constructor));
	});

	it('should set the default options object', function(){
		var actions = NodeBuilder(),
			options = actions.options;
		assert.equal(options.append, true);
	});

	it('should set the parent var name', function(){
		var actions = NodeBuilder({}, 'div1');
		assert.equal(actions.parentEl, 'div1');
	});

	it('usable multiple times', function(){
		var one = NodeBuilder({}, 'div1'),
			two = NodeBuilder({}, 'div2');

		assert.equal(one.parentEl, 'div1');
		assert.equal(two.parentEl, 'div2');
	});

	describe('createTextNode()', function(){
		it('should make the createTextNode string', function(){
			var result = NodeBuilder({}, 'div1').createTextNode('Hello world!');
			assert.equal(result, 'a(div1,document.createTextNode("Hello world!"));');
		});

		it('should return the node if append is false', function(){
			var result = NodeBuilder({ append: false }, 'div1').createTextNode('Hi there');
			assert.ok(/this.n[0-9]+=document\.createTextNode\("Hi there"\);/.test(result.str));
		});
	});

	describe('appendChild()', function(){
		it('should make the appendChild string', function(){
			var result = NodeBuilder({}, 'div1').appendChild('someNode');
			assert.equal(result, 'a(div1,someNode);');
		});
	});
});