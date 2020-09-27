
const fs = require('fs');
const fsExtra = require('fs-extra');

const glob = require("glob");
const deleteKey = require('key-del');
const commandLineArgs = require('command-line-args');
const path = require('path');

const obj2gltf = require('obj2gltf');
const gltfPipeline = require('gltf-pipeline');
const processGltf = gltfPipeline.processGltf;

// Command-line
const optDefs = [
    { name: 'infolder', alias: 'i', type: String },
    { name: 'outfolder', alias: 'o', type: String },
    { name: 'pattern', alias: 'p', type: String },
    { name: 'opts', type: String },
    { name: 'outformat', type: String },
    { name: 'inup', type: String },
    { name: 'merge', type: Boolean }
];
let atonizerOPTS = commandLineArgs(optDefs);


if (!atonizerOPTS.infolder || !atonizerOPTS.outfolder) return;
if (!atonizerOPTS.pattern) atonizerOPTS.pattern = "*.obj";
if (!atonizerOPTS.outformat) atonizerOPTS.outformat = "gltf";
if (!atonizerOPTS.inup) atonizerOPTS.inup = "Z";
if (!atonizerOPTS.merge) atonizerOPTS.merge = false;

const OPT_CONVERT = {
    //binary : true
    separate : !atonizerOPTS.merge, //true,
    outputDirectory: atonizerOPTS.outfolder,
    inputUpAxis: atonizerOPTS.inup,
    outputUpAxis: 'Y',  // three.js
    packOcclusion: false, // true
    //unlit : true,
}

const OPT_GLTF = {
    separate: !atonizerOPTS.merge, //true,
    separateTextures: !atonizerOPTS.merge, //true,
    separateShaders: !atonizerOPTS.merge, //true,
    separateBuffers: !atonizerOPTS.merge, //true,
    
    separateResources: atonizerOPTS.outfolder,
    resourceDirectory: atonizerOPTS.outfolder,

    dracoOptions: {
        compressMeshes: true,
        compressionLevel: 4, //10,
        quantizeTexcoordBits: 12,
        unifiedQuantization: true // avoid gaps
    }
};

let buildFname = (outfolder, basename)=>{
    return outfolder+basename+"."+atonizerOPTS.outformat;
};

glob(atonizerOPTS.infolder + atonizerOPTS.pattern, undefined, (er, files)=>{
    for (let i in files){
        let filepath = files[i];

        let IFile     = path.parse(filepath);
        let fBasename = IFile.name;    // IFile.dir+
        let fExt      = IFile.ext;     // eg: .obj
        let fName     = IFile.name + IFile.ext; // model.obj

        console.log("Processing file "+filepath);

        // for some reasons, generates wrong mipmappig
        obj2gltf(filepath, OPT_CONVERT).then(function(gltf){
            let outfilepath = buildFname(atonizerOPTS.outfolder, fBasename);

            const data = Buffer.from(JSON.stringify(gltf));
            fs.writeFileSync(outfilepath, data);
            console.log("Model "+outfilepath+" written.");

            processModel(atonizerOPTS.outfolder, fBasename);
        });
    }
});

let processModel = (outfolder, basename)=>{
    let f = fsExtra.readJsonSync( buildFname(outfolder,basename) );

    //basename += "-d";

    let opt = OPT_GLTF;
    opt.name = basename;
    
    processGltf(f, opt).then((results)=>{
            outfolder += "d/";
            if (!fs.existsSync(outfolder)) fs.mkdirSync(outfolder);

            //let outDracoDir = outfolder+"d/";
            //if (!fs.existsSync(outDracoDir)) fs.mkdirSync(outDracoDir);

            fsExtra.writeJsonSync(outfolder+basename+"."+atonizerOPTS.outformat, results.gltf);

            // Save separate resources
            const separateResources = results.separateResources;
            for (const relativePath in separateResources) {
                if (separateResources.hasOwnProperty(relativePath)) {
                    const resource = separateResources[relativePath];
                    fsExtra.writeFileSync(outfolder+relativePath, resource);
                }
            }

            console.log("GLTF draconized.");
        });
};