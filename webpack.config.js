const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: 'script.js', // Main JavaScript entry point
  output: {
    filename: 'bundle.js', // Output file name
    path: path.resolve(__dirname, 'dist'), // Output directory
    clean: true, // Clean 'dist/' folder before every build
  },
  mode: 'production', // Set mode to 'production' or 'development'
  module: {
    rules: [
      {
        test: /\.css$/i, // Rule for processing CSS files
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|gif)$/i, // Rule for handling images
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html', // HTML template file
      minify: {
        collapseWhitespace: true,
      },
    }),
  ],
};
