/*!
    @preserve

    Processor Asset Injector
    Injects metadata into glTF or Cesium 3D tilesets. Useful to sign or add copyright/licensing information

 	@author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/
const fs = require('fs');
const fsExtra = require('fs-extra');

const fg   = require("fast-glob");

const deleteKey = require('key-del');
const commandLineArgs = require('command-line-args');
const path = require('path');


// Command-line
const optDefs = [
    { name: 'input', alias: 'i', type: String },      // input asset (JSON,glTF) or folder (recursive)

    { name: 'author', type: String },
    { name: 'license', type: String },
    { name: 'copyright', type: String },
];


let AssetInjector = {};

AssetInjector.args = commandLineArgs(optDefs);


AssetInjector.run = ()=>{
    if (!AssetInjector.args.input) return;
    let apath = AssetInjector.args.input;

    if (!fs.existsSync(apath)) return;

    if (apath.endsWith(".json") || apath.endsWith(".gltf")){
        let A = JSON.parse(fs.readFileSync(apath, 'utf8'));
        A = AssetInjector.inject(A);
        fs.writeFileSync(apath, JSON.stringify(A));
        return;
    }

    // Folder
    AssetInjector.injectFolder(apath);
};

// glTF
AssetInjector.injectGLTF = (A)=>{
    A = AssetInjector.inject(A);

    return A;
};

// 3D Tileset (JSON)
AssetInjector.injectTileset = (A)=>{
    A = AssetInjector.inject(A);

    return A;
};

AssetInjector.inject = (A)=>{
    if (!A.asset) A.asset = {};
    if (!A.asset.extras) A.asset.extras = {};

    let args = AssetInjector.args;

    if (args.author)    A.asset.extras.author  = args.author;
    if (args.license)   A.asset.extras.license = args.license;

    if (args.copyright) A.asset.copyright      = args.copyright;

    //TODO: XMP metadata

    console.log(A.asset);

    return A;
};

// Operate on entire folder
AssetInjector.injectFolder = (dir)=>{
    let files = fg.sync("**/{*.gltf,*.json}", {cwd: dir, follow: true});
    //console.log(files);

    for (let f in files){
        let fpath = path.join(dir,files[f]);
        
        let A = JSON.parse(fs.readFileSync(fpath, 'utf8'));
        A = AssetInjector.inject(A);
        fs.writeFileSync(fpath, JSON.stringify(A));
    }
};


AssetInjector.run();

module.exports = AssetInjector;