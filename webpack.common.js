const path = require('path');
const DotenvPlugin = require('dotenv-webpack');
const ESLintPlugin = require('eslint-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const RunChromeExtension = require('webpack-run-chrome-extension');
const webpack = require('webpack');

module.exports = {
  entry: {
    serviceWorker: './src/serviceWorker.ts',
    contentScript: './src/contentScript.js',
    webAccessibleResources: './src/webAccessibleResources.js',
    popup: './src/popup.ts',
    options: './src/options.ts',
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)x?$/,
        use: ['babel-loader'],
        exclude: /node_modules/,
      },
      {
        test: /\.(scss|css)$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
      },
      {
        test: /\.html$/i,
        exclude: /node_modules/,
        use: ['html-loader'],
      },
      {
        test: /datatables\.net.*.js$/,
        use: [
          {
            loader: 'imports-loader',
            options: {
              additionalCode:
                'var define = false; /* Disable AMD for misbehaving libraries */',
            },
          },
        ],
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        exclude: /node_modules/,
        loader: 'file-loader',
        options: {
          name: '/static/img/[name].[ext]',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new ESLintPlugin({
      extensions: ['js', 'ts'],
      overrideConfigFile: path.resolve(__dirname, '.eslintrc'),
    }),
    new MiniCssExtractPlugin({
      filename: 'styles/[name].css',
    }),
    new CopyPlugin({
      patterns: [{ from: 'static' }],
    }),
    new RunChromeExtension({
      extensionPath: path.resolve(__dirname, 'dist'),
      startingUrl:
        'https://dashboard.pantheon.io/sites/72e163bd-0054-4332-8bf8-219c50b78581',
      autoReload: true,
      port: 8085,
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      'window.$': 'jquery',
    }),
  ],
};
