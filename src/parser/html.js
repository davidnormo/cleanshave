function HTML(tagname, attributes, inner) {
	this.type = 'HTML';
	this.tagname = tagname;
	this.attributes = attributes;
	this.inner = inner;
}

var uniqueId = (function() {
	var id = 0;
	return function() {
		return 'html' + (++id);
	};
})();

HTML.prototype.render = function(parent) {
	var htmlId = uniqueId(),
		createStr = '',
		editStr = '',
		elementVar = htmlId + 'Clone';

	createStr += 'var ' + htmlId + ' = document.createElement("' + this.tagname + '");';
	editStr += 'var ' +elementVar+' = shave.c(' + htmlId + ');';

	if (this.attributes !== null) {
		//add them all
		this.attributes.forEach(function(attribute) {
			var attrStr = '',
				key = this.compileValue(attribute.key),
				value = this.compileValue(attribute.value);

			attrStr = elementVar + '.setAttribute(' + key + ', ' + value + ');';
			editStr += attrStr;
		}, this);
	}

	if (this.inner !== null) {
		this.inner.forEach(function(node) {
			node.options = this.options;
			var results = node.render(elementVar);
			createStr += results.create;
			editStr += results.edit;
		}, this);
	}

	editStr += parent+'.appendChild('+elementVar+');';

	return {
		create: createStr,
		edit: editStr
	};
};

HTML.prototype.compileValue = function(data) {
	var text = '';
	if (typeof data === 'object' && !(data instanceof Array)) {
		//tag used as an attribute key or value

		//process tag
		return data.render().edit;

	} else if (data instanceof Array) {
		/*
		 * Building the attribute value string from an array of attribute values
		 * Could be either a simple string or a tag
		 *
		 * If the value is a string, remove quote:
		 * '"value1"' => ' value1'
		 * when completed => '" value1  value2  value3 "'
		 *
		 * If the value is a tag, add string concat:
		 * 'escapeHTML(resolveKey(obj, ["id"]))' => '"+escapeHTML(resolveKey(obj, ["id"]))+"'
		 * when completed => '""+escapeHTML(resolveKey(obj, ["id"]))+" value2 value3"'
		 */
		data.forEach(function(val) {
			var replaceQuotes = (typeof val === 'string');
			val = this.compileValue(val);
			text += replaceQuotes ? val.replace(/"/g, '') + ' ' : '"+' + val + '+" ';
		}, this);

		//finally wrap string in quotes
		text = '"' + text.trim() + '"';

	} else {
		//simple string gets wrapped in quotes
		text = '"' + data + '"';
	}

	return text;
};

module.exports = HTML;