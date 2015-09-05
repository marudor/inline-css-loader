var path = require('path');
var webpack = require('webpack');

module.exports = {
  eslint: {
    configFile: 'src/.eslintrc',
    failOnWarning: true,
    failOnError: true
  },
  context: __dirname,
  entry: [
    './src/index.js'
  ],
  output: {
    path: './',
    filename: 'index.js',
    publicPath: ''
  },
  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel!eslint', include: path.join(__dirname, 'src')},
      { test: /\.json$/, loader: 'json' }
    ]
  },
  plugins: [
    new webpack.NoErrorsPlugin()
  ]
};
