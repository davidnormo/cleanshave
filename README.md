# cleanshave v0.1.0
_From a hairy HTML template, to a well groomed DOM based template._  
This is a "proof of concept" to see if we can have best of both worlds; We can continue to write HTML based templates and use DOM based templates at runtime.

cleanshave is a CLI tool that optimises HTML based templates by [transpiling](http://en.wikipedia.org/wiki/Source-to-source_compiler) them into DOM based templates or domplates.
For example, running cleanshave over a template like so:  

```bash
cleanshave -t template.jst -d ./output/
```  

Produces a corresponding domplate (simplified for the sake of clarity):
<table>
<tr><td><code>template.jst</code></td><td>&rarr;</td><td><code>output/template.js</code></td></tr>
<tr>
<td>
<pre>
<code>&lt;div&gt;{{ name }}&lt;/div&gt;</code>
</pre>
</td>
<td>&rarr;<br />&rarr;<br />&rarr;<br /></td>
<td>
<pre>
<code>var domplate = (function(){
   var div1 = document.createElement('div');
   return function(obj){
     div.innerHTML = obj.name;
     return div1.cloneNode(true);
   };
})();</code>
</pre>
</td>
</tr>
</table>

The resulting domplate is simply a function which takes the data you want to display in the template and outputs a DOM node. It can then be used in the following manner:

```javascript 
var div = domplate({ name: 'John Doe' });
document.body.appendChild( div );
``` 

## Aim
To take common templates (Mustache, Handlebars, etc.) and [transpile](http://en.wikipedia.org/wiki/Source-to-source_compiler) them to a function which creates DOM nodes. I like to call the end result a ***domplate***
You may be asking why? Because it avoids us using string based templates at runtime.

## Benefits
- ***Performance:*** `innerHTML` parses the string and creates the nodes every time it is used. Domplate nodes are created once on first use and cloned on every subsequent call.

- ***Templates are viable:*** Template useage may be too much to use in some settings. Having a template that is parsed by a third-party library, then the resulting HTML string parsed by the browser, is costly. Domplates are parsed at compile time, removing the performance hit making template usage more viable.

- ***Keep doing what you're doing:*** No one wants to write domplates by hand. Templates are expressive, familiar and quick to create. Using DOM nodes provides performance. Cleanshave combine both approaches.

## Limitations
- At the moment only a subset of the Mustache templating syntax is supported. This will be extended with time.
