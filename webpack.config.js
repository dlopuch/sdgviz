
const APP_ROOT = __dirname + '/public/js';

module.exports = {
  context: APP_ROOT,
  entry: {
    app: './entry.js'
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
  devtool: '#inline-source-map'
};
