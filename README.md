# inline-css-loader
Webpack loader for Radium Style Tag

It only modifies the module.export object.
It allows you to use seperate files for CSS Objects to use in Radiums Style Component.
It allows you to use known Less/Sass Features.

Currently Supported:
* nested Objects
* comma seperator
* &

# Example
```
export default {
  '.foo': {
    '.bar': {
      width: 100
    },
    '&.batz': {
      width: 200
    },
    'img, a': {
      backgroundColor: 'red'
    }
  }
}
```
Radium can not process this Object as it has nested CSS Selector. Once loaded with this loader it will look like this:
```
export default {
  '.foo .bar': {
    width: 100
  },
  '.foo.batz': {
    width: 200
  },
  '.foo img': {
    backgroundColor: 'red'
  },
  '.foo a': {
    backgroundColor: 'red'
  }
}
```
Now you have an Object Radium can use as Rules for a Style tag.

# Note
The loader can only handle ES5.
Please use babel before this loader.
I've just used ES6 export style for readability
