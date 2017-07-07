var path = require('path')
var webpack = require('webpack')

module.exports = {
  entry: ['./src/Main.js'],
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'build.js',
    library: ['VueNativeSock'],
    libraryTarget: 'umd'
  },
  devtool: "source-map",
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        }
      }
    ]
  }
}
