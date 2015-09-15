export const input = `'use strict';

var _extends = require('babel-runtime/helpers/extends')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

exports['default'] = {
  mediaQueries: {
    '@media max-width(120px)': {
      foo: {
        '.bar, #foo, & > .a': {
          img: {
            x: 2
          },
          width: 5
        },
        height: 5
      }
    }
  },
  'foo, .bar': {
    '#x': {
      x: 1
    },
    width: 100
  }
};
module.exports = exports['default'];`;
export const output = `'use strict';

var _extends = require('babel-runtime/helpers/extends')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

exports['default'] = {
  mediaQueries: {
    '@media max-width(120px)': {
      foo: {
        height: 5
      },
      'foo .bar': {
        width: 5
      },
      'foo #foo': {
        width: 5
      },
      'foo > .a': {
        width: 5
      },
      'foo .bar img': {
        x: 2
      },
      'foo #foo img': {
        x: 2
      },
      'foo > .a img': {
        x: 2
      }
    }
  },
  'foo': {
    width: 100
  },
  '.bar': {
    width: 100
  },
  'foo #x': {
    x: 1
  },
  '.bar #x': {
    x: 1
  }
};
module.exports = exports['default'];`;
