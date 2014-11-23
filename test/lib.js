var shave = require('../src/lib'),
	assert = require('chai').assert;

describe('Lib', function() {
	describe('escape()', function() {
		var escape = shave.escape;

		it('should escape html tags', function() {
			var result = escape('<li class="yes" id=\'no\'>this & that</li>');

			assert.equal(result, '&lt;li class=&quot;yes&quot; id=&#039;no&#039;&gt;this &amp; that&lt;/li&gt;');
		});

		it('should return non strings, unchanged', function() {
			var input = {};
			var result = escape(input);
			assert.equal(result, input);
		});
	});

	describe('setContextStack()', function() {
		var data = {
			a: {
				b: {
					c: {
						one: 'one'
					}
				}
			}
		};

		afterEach(function() {
			shave.contextStack = [];
		});

		it('should add a single context', function() {
			shave.setContextStack(data, ['a']);

			assert.equal(shave.contextStack[0], data.a);
			assert.equal(shave.contextStack[1], undefined);
		});

		it('should add nested contexts', function() {
			shave.setContextStack(data, ['a', 'b', 'c']);

			assert.equal(shave.contextStack[0], data.a);
			assert.equal(shave.contextStack[1], data.a.b);
			assert.equal(shave.contextStack[2], data.a.b.c);
			assert.equal(shave.contextStack[3], undefined);
		});
	});

	describe('clearContextStack()', function() {
		var data = {
			a: {
				b: {
					c: {
						one: 'one'
					}
				}
			}
		};

		beforeEach(function() {
			shave.contextStack = [];
			shave.setContextStack(data, ['a', 'b', 'c']);
		});

		it('should clear a single context', function() {
			shave.clearContextStack(data.a.b, ['c']);

			assert.equal(shave.contextStack[0], data.a);
			assert.equal(shave.contextStack[1], data.a.b);
			assert.equal(shave.contextStack[2], undefined);
		});

		it('should clear multiple contexts in the right order', function() {
			shave.clearContextStack(data, ['a', 'b', 'c']);

			assert.instanceOf(shave.contextStack, Array);
			assert.equal(shave.contextStack.length, 0);
		});
	});

	describe('resolve()', function() {
		after(function() {
			shave.contextStack = [];
		});
		before(function() {
			shave.contextStack = [];
			var data = {
				a: {
					b: {
						c: "<b>Hi there</b>",
						d: 'another',
						z: false
					},
					d: 'Wrong!',
					z: 'yes'
				}
			};
			shave.setContextStack(data, ['a', 'b', 'c']);
		});

		it('should resolve a string', function() {
			var result = shave.resolve({
				key: ['c']
			});
			assert.equal(result, "<b>Hi there</b>");
		});

		it('should return an empty string for missing/falsey values', function() {
			var result = shave.resolve({
				key: ['x']
			});
			assert.equal(result, '');
		});

		it('should traverse the context stack correctly', function() {
			var result = shave.resolve({
				key: ['d']
			});

			assert.equal(result, 'another');

			result = shave.resolve({
				key: ['z']
			});
			assert.equal(result, 'yes');
		});
	});

	describe('section()', function() {
		var fakeElement = {
			children: [],

			appendChild: function(child) {
				this.children.push(child);
			}
		};

		afterEach(function() {
			fakeElement.children = [];
		});

		it('should render a truthy section key', function() {
			//{{#list}}Hello world!{{/list}}
			var data = {
				list: true
			};
			shave.section(fakeElement, function() {
				return 'Hello world!';
			}, data, ['list']);

			assert.equal(fakeElement.children.length, 1);
			assert.equal(fakeElement.children[0], 'Hello world!');
		});

		it('should return empty string for falsey section key', function() {
			//{{#list}}Hello world!{{/list}}
			var data = {
				list: false
			};
			shave.section(fakeElement, function() {
				return 'Hello world!';
			}, data, ['list']);

			assert.equal(fakeElement.children.length, 0);
		});

		it('should iterate over an array', function() {
			//{{#list}}1{{/list}}
			var data = {
				list: [1, 2, 3]
			};
			shave.section(fakeElement, function() {
				return '1';
			}, data, ['list']);

			assert.equal(fakeElement.children.length, 3);
			assert.equal(fakeElement.children[0], '1');
			assert.equal(fakeElement.children[1], '1');
			assert.equal(fakeElement.children[2], '1');
		});

		it('should expand into an object context', function() {
			//{{#list}}{{a}}{{b}}{{/list}}
			var data = {
				list: {
					a: 'one',
					b: 'two'
				}
			};
			shave.section(fakeElement, function(data) {
				return this.resolve({
					key: ['a']
				}) + this.resolve({
					key: ['b']
				});
			}, data, ['list']);

			assert.equal(fakeElement.children.length, 1);
			assert.equal(fakeElement.children[0], 'onetwo');
		});

		it('should handled dotted notation', function() {
			//{{#a.b.c}}Hello world!{{/a.b.c}}
			var data = {
				a: {
					b: {
						c: true
					},
					c: false
				}
			};
			shave.section(fakeElement, function() {
				return 'Hello world!';
			}, data, ['a', 'b', 'c']);

			assert.equal(fakeElement.children.length, 1);
			assert.equal(fakeElement.children[0], 'Hello world!');
		});
	});
});