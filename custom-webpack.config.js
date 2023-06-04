module.exports = {
  resolve: {'extensions': ['.wasm']},
  module: {
    rules: [
      {
        test: /encoderWorker\.umd\.js$/,
        use: [{ loader: 'file-loader' }]
      },
      {
        test: /\.wasm$/,
        use: [{ loader: 'wasm-loader' }]
      }
    ]
  }
};
