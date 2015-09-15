export const input = `'use strict';

var _extends = require('babel-runtime/helpers/extends')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
var spread = {
  width: 200
};

exports['default'] = {
  foo: {
    '.bat': _extends({}, spread, {
      display: 'block'
    }),
    width: 100
  },
  bar: {
    '.foo, .bar, &.a, > a': {
      '#x': {
        x: 1
      },
      width: 100
    }
  }
};
module.exports = exports['default'];`;
export const output = `'use strict';

var _extends = require('babel-runtime/helpers/extends')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
var spread = {
  width: 200
};

exports['default'] = {
  foo: {
    width: 100
  },
  'foo .bat': _extends({}, spread, {
    display: 'block'
  }),
  'bar .foo': {
    width: 100
  },
  'bar .bar': {
    width: 100
  },
  'bar.a': {
    width: 100
  },
  'bar > a': {
    width: 100
  },
  'bar .foo #x': {
    x: 1
  },
  'bar .bar #x': {
    x: 1
  },
  'bar.a #x': {
    x: 1
  },
  'bar > a #x': {
    x: 1
  }
};
module.exports = exports['default'];`;
