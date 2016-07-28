
const APP_ROOT = __dirname + '/public/js';

module.exports = {
  context: APP_ROOT,
  entry: {
    app: './entry.js',
    alternateApp: './entry.js' // for demo only, replace with different entry file.
  },
  output: {
    path: './public/dist/',
    filename: 'bundle.[name].js'
  },
  module: {
    preLoaders: [
      { loader: 'eslint-loader',
        test: /\.js$/,
        exclude: /node_modules/
      }
    ],
    loaders: [
      { test: /\.js$/  , loader: 'babel', exclude: /node_modules/, query: {presets: ['es2015']}},
      { test: /\.less$/, loader: "style!css!less" },

      // Needed to load graphics in less, eg Bootstrap
      { test: /\.(png|woff|woff2|eot|ttf|svg)$/, loader: 'url-loader?limit=100000' }
    ]
  },
  resolve: {
    root: APP_ROOT
  },
  devServer: {
    contentBase: './public/',
    
    // Trying to get hotloading to work.  Not quite there yet.
    //hot: true,
    //inline: true
    // also: need to enable special script in index.html
  },
  jshint: {
        // any jshint option http://www.jshint.com/docs/options/
        // i. e.
        camelcase: true,

        // jshint errors are displayed by default as warnings
        // set emitErrors to true to display them as errors
        emitErrors: true,

        // jshint to not interrupt the compilation
        // if you want any file with jshint errors to fail
        // set failOnHint to true
        failOnHint: true,
  },
  devtool: '#inline-source-map'
};
