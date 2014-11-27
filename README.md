# cleanshave v0.2.0
Cleanshave is a CLI tool that optimises Mustache HTML templates by compiling them into DOM based templates or domplates. In this way we can get instant performance gains for our Mustache templates without having to change them or use another templating language.

## Install
Install with npm:

```
npm install -g cleanshave
```

## Benefits
- ***Performance:*** `innerHTML` parses the string and creates the nodes every time it is used. Domplate nodes are created once on first use and cloned on every subsequent call.

- ***Templates are viable:*** Template useage may be too much to use in some settings. Having a template that is parsed by a third-party library, then the resulting HTML string parsed by the browser, is costly. Domplates are parsed at compile time, removing the performance hit making template usage more viable.

- ***Keep doing what you're doing:*** No one wants to write domplates by hand. Templates are expressive, familiar and quick to create. Using DOM nodes provides performance. Cleanshave combines both approaches.

## Supported Features
[x] Comments
[x] Interpolation
[x] Sections
[] Inverted Sections
[] Partials
[] Functions

