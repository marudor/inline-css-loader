var babel = require('babel');
module.exports = function (wallaby) {
  return {
    files: [
      'index.js',
      'test/exportNode/*.js',
      'test/fullObjects/*.js',
      'test/transforms/*'
    ],

    tests: [
      'test/*-spec.js'
    ],
    preprocessors: {
      '**/*.js': file => babel.transform(file.content, { sourceMap: true })
    },
    env: {
      type: 'node'
    }
  };
};
