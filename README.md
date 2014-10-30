# Domplate
This is a "proof of concept". To see if we can have best of both worlds. We can write HTML string based templates and use DOM based templates at runtime.

## Aim
To take common templates (Mustache, Handlebars, etc.) and [transpile](http://en.wikipedia.org/wiki/Source-to-source_compiler) them to a function which creates DOM nodes.

_Why?_ It avoids us using string based templates at runtime.