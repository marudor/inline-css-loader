export default `'use strict';

var _extends = require('babel-runtime/helpers/extends')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
var bar = {
  bar: {
    height: 250
  }
};

exports['default'] = _extends({}, bar, {
  '.foo': {
    width: 100
  }
});
module.exports = exports['default'];`;
