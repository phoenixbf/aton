const path = require('path');
const fs   = require('fs');
const fg   = require('fast-glob');
const Core = require("../services/Core.js");

let entries = ["./tools/bundle.js"];


// Flares
let flares = fg.sync("**/flare.json", Core.FLARES_GLOB_OPTS);
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

  entry: entries,
  
  output: {
    path: path.resolve(__dirname, '../public/dist'),
    filename: 'THREE.bundle.js',
  },
  //optimization: { minimize: false },
};