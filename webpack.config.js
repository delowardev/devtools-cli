const path = require('path');

module.exports = {
  mode: "development",
  devtool: "inline-source-map",
  target: "node",
  entry: {
    main: "./src/index.ts",
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: "index.js"
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    fallback: {
      fs: false,
      child_process: false
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader"
      }
    ]
  }
};