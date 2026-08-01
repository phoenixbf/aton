const path = require('path');
const fs   = require('fs');
const fg   = require('fast-glob');
//const webpack = require('webpack');

const Core = require("../services/Core.js");

let entries = ["./tools/bundle.js"];


// Flares
//let flares = fg.sync("**/flare.json", Core.FLARES_GLOB_OPTS);
/*
for (let f in flares){
  let fid = path.dirname(flares[f]);
  let entrypath = path.join(Core.DIR_FLARES, fid, "/entry.mjs");

  if (fs.existsSync(entrypath)) entries.push(entrypath);
}

console.log(entries)
*/

module.exports = {
  mode: "production", // enable many optimizations for production build

  entry: "./tools/bundle.js", //entries,
  
  output: {
    path: path.resolve(__dirname, '../public/dist'),
    filename: 'THREE.bundle.js',
    //chunkFilename: 'THREE.bundle.js',
    //clean: true,

    //asyncChunks: false,
    //chunkFormat: false

/*
    // Important if you want a single global variable
    library: {
        name: 'MyThreeBundle',
        type: 'umd'
    },

    globalObject: 'this'
*/
  },

  plugins: [],

/*
  optimization: {
    splitChunks: false, // Disables the SplitChunksPlugin
    runtimeChunk: false, // Prevents creation of a separate runtime file

    //minimize: false,

    splitChunks: { 
      chunks: "initial", //'all',
      minChunks: 5,
    },
  },
*/

/*
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1, // Forces Webpack to output only one chunk (file)
    }),
  ],
*/

};