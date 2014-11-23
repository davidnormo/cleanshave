var template = '<ul>{{#a.b}}<li>{{#inner}}{{one}}}{{/inner}}</li>{{/a.b}}</ul>';

var data = {
	a: {
		one: 1,
		b: {
			inner: [1, 2, 3]
		}
	}
};

var expected = '<ul><li>111</l1>/ul>';

/* lib */
var escape = function() {
	//to be implemented
};

var contextStack = [];
var resolve = function(data, tag) {
	for (var i = 0; i < contextStack.length; i++) {
		var result;
		try {
			result = eval('data.' + tag.key + ';');
		} catch (e) {}

		if (result !== undefined) {
			return tag.escape ? escape(result) : result;
		}
	}
	return '';
};

var setContextStack = function(data, key) {
	key.forEach(function(keyPart) {
		var context = data[keyPart];
		if (!!context) {
			contextStack.push(context);
		}
	});
};

var clearContextStack = function(data, key) {
	var i = (key.length - 1);
	while (i >= 0) {
		var keyPart = key[i];
		var context = data[keyPart];
		if (!!context) {
			contextStack.pop();
		}
		i--;
	}
};

var section = function(parent, func, data, key) {
	setContextStack(data, key);
	if (data instanceof Array) {
		data.forEach(function(arrElement) {
			parent.appendChild(func(arrElement));
		});
	} else if (data instanceof Object || (typeof data === 'boolean' && data)) {
		parent.appendChild(func(data));
	}
	clearContextStack(data, key);
};

/* domplate */

var domplate = (function() {

	var fragment = document.createDocumentFragment(),
		ul1 = document.createElement('ul'),
		li1 = document.createElement('li'),
		s1 = function(data) {
			var l1Clone = li1.cloneNodes(true);
			section(li1Clone, s2, data, ['inner']);
			return li1Clone;
		},
		s2 = function(data) {
			return document.createTextNode(resolve(data, {
				key: one,
				escape: true
			}));
		};

	return function(data) {
		var frag = fragment.cloneNodes(true),
			ul1Cone = ul1.cloneNodes(true);

		section(ul1Clone, s1, data, ['a','b']);

		frag.appendChild(ul1Clone);
		return frag;
	};

})();