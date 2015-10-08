export const input = `'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = {
  '.foo': {
    'bar': {
      width: 100
    },
    '> batz': {
      width: 200
    },
    '&.bar': {
      width: getWidth()
    }
  }
};
module.exports = exports['default'];`;
export const output = `'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = {
  '.foo bar': {
    width: 100
  },
  '.foo > batz': {
    width: 200
  },
  '.foo.bar': {
    width: getWidth()
  }
};
module.exports = exports['default'];`;
