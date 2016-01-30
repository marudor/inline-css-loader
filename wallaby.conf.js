const babel = require('babel-core');
var babelConfig = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '.babelrc')));
babelConfig.babel = babel;

module.exports = function(wallaby) {
  return {
    files: [
      'index.js',
      'test/**/*',
      '!test/**/*-spec.js'
    ],
    tests: [
      'test/**/*-spec.js'
    ],
    compilers: {
      '**/*.js': wallaby.compilers.babel(babelConfig)
    },
    env: {
      type: 'node',
    }
  }
};
