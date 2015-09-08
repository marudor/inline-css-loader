var path = require('path');
var fs = require('fs');
var webpack = require('webpack');

var nodeModules = {};
fs.readdirSync('node_modules')
.filter(function(x) {
  return ['.bin'].indexOf(x) === -1;
})
.forEach(function(mod) {
  nodeModules[mod] = 'commonjs ' + mod;
});

module.exports = {
  eslint: {
    configFile: 'src/.eslintrc',
    failOnWarning: true,
    failOnError: true
  },
  entry: './src/index.js',
  target: 'node',
  output: {
    path: './',
    filename: 'index.js',
    library: 'inlineCssLoader',
    libraryTarget: 'commonjs2'
  },
  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel!eslint', include: path.join(__dirname, 'src')},
      { test: /\.json$/, loader: 'json' }
    ]
  },
  plugins: [
    new webpack.NoErrorsPlugin()
  ],
  externals: nodeModules
};
