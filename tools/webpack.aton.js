const path = require('path');

module.exports = {
  mode: "production", // enable many optimizations for production build

  entry: './public/src/ATON.js',
  
  output: {
    path: path.resolve(__dirname, '../public/dist'),
    filename: 'ATON.min.js',
  }
};