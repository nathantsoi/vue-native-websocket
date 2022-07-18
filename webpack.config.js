var path = require('path')
const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
  entry: ['./src/Main.js'],
  mode: 'production',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'build.js',
    library: ['VueNativeSock'],
    libraryTarget: 'umd'
  },
  devtool: 'source-map',
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      }
    ]
  }
}
