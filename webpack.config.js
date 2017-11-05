module.exports = {
  entry: './src/index.ts',
  output: {
    publicPath: 'lfnconnector/',
    path: __dirname + '/dist',
    libraryTarget: 'umd',
    library: 'lfnconnector',
    filename: 'lfnconnector.js'
  },
  devtool: 'source-map',
  target: 'node',

  externals: {
    'core-js/fn/object/assign' : 'commonjs core-js/fn/object/assign',
    'core-js/fn/array/from' : 'commonjs core-js/fn/array/from',
    'core-js/es6/set' : 'commonjs core-js/es6/set',
    'core-js/es6/promise' : 'commonjs core-js/es6/promise',
    'lodash': 'commonjs lodash',
    'redux': 'commonjs redux',
    '@brightsign/baconcore': 'commonjs @brightsign/baconcore',
    '@brightsign/bscore': 'commonjs @brightsign/bscore'
  },
  // target: 'electron',
  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: [".ts", ".js", ".json"]
  },

  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
      { test: /\.tsx?$/, loader: "awesome-typescript-loader" },

      { enforce: "pre", test: /\.js$/, loader: "source-map-loader" }
    ],
  }
}
