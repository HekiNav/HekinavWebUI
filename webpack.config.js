const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    main: './script.js',  // Entry point for the main bundle
    nav: './nav/script/main.js' // Entry point for the admin bundle
  },
  output: {
    filename: '[name].bundle.js', // Dynamic filenames based on entry keys
    path: path.resolve(__dirname, 'dist'),
    clean: true, // Clean the output directory before every build
  },
  mode: 'production',
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      chunks: ['main'], // Include only the 'main' bundle
      filename: 'index.html' // Output file name
    }),
    new HtmlWebpackPlugin({
      template: './nav/index.html',
      chunks: ['admin'], // Include only the 'admin' bundle
      filename: './nav/index.html' // Output file name
    })
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'], // Handle CSS files
      },
      {
        test: /\.(png|jpg|gif)$/i,
        type: 'asset/resource', // Handle image files
      },
    ],
  },
};
