# Cleanshave v0.4.0
Note: There are currently quite a few changes happening, the API isn't stable yet.  

Cleanshave is a CLI tool that optimises Mustache HTML templates by compiling them into DOM based templates or domplates. In this way we can get instant performance gains for our Mustache templates without having to change them or use another templating language.

## Usage
```
$ cleanshave -t templates/ -d domplates/
```

## Install
Install with npm:

```
$ npm install -g cleanshave
```

## Benefits
- ***Ahead of time*** Cleanshaves does the work that the browser would normally have to do at runtime, at compile time.

- ***Performance:*** `innerHTML` parses the HTML and creates the nodes every time it is used. Domplate nodes are created once on first use and cloned on every subsequent call.

- ***Keep doing what you're doing:*** Templates are expressive, familiar and quick to create but using DOM nodes instead of HTML is more performant. Cleanshave combines both approaches.

## Supported Features

[x] AMD  
[x] CommonJS  
[x] Global  

### Mustache

[x] Comments  
[x] Interpolation  
[x] Sections  
[x] Inverted Sections  
[x] Partials  
[ ] Functions  
