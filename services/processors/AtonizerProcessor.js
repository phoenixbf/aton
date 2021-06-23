
const fs = require('fs');
const fsExtra = require('fs-extra');

const glob = require("glob");
const deleteKey = require('key-del');
const commandLineArgs = require('command-line-args');
const path = require('path');

const obj2gltf = require('obj2gltf');
const gltfPipeline = require('gltf-pipeline');
const processGltf = gltfPipeline.processGltf;

const Jimp   = require('jimp');
//const sharp  = require('sharp');
const imSize = require('image-size');

let bDraco = true;
let processingTextures = {};



// Command-line
const optDefs = [
    { name: 'infolder', alias: 'i', type: String },      // input folder containing multiple files to process (obj, gltf or glb)
    { name: 'outfolder', alias: 'o', type: String },     // output folder
    { name: 'pattern', alias: 'p', type: String },       // input pattern. Default *.obj
    { name: 'compression', alias: 'c', type: Number },   // compression level (0-10). 0 = No compression. Default: 4
    { name: 'opts', type: String },
    { name: 'outformat', type: String },                 // output format. Default 'gltf'
    { name: 'inup', type: String },                      // input up-vector. Default 'Z'
    { name: 'merge', type: Boolean },
    { name: 'texsize', type: Number },                   // max texture size, def. 4096
    { name: 'texquality', type: Number }                 // texture quality, def. 60
];
let atonizerOPTS = commandLineArgs(optDefs);

if (!atonizerOPTS.infolder || !atonizerOPTS.outfolder) return;
if (atonizerOPTS.pattern === undefined) atonizerOPTS.pattern = "*.obj";
if (atonizerOPTS.outformat === undefined) atonizerOPTS.outformat = "gltf";
if (atonizerOPTS.inup === undefined) atonizerOPTS.inup = "Z";
if (atonizerOPTS.merge  === undefined) atonizerOPTS.merge = false;
if (atonizerOPTS.compression === undefined) atonizerOPTS.compression = 4; // 10
if (atonizerOPTS.texsize === undefined) atonizerOPTS.texsize = 4096; //2048;
if (atonizerOPTS.texquality === undefined) atonizerOPTS.texquality = 60;

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
        compressionLevel: atonizerOPTS.compression,
        quantizeTexcoordBits: 12,
        unifiedQuantization: true // avoid gaps
    }
};

let buildFname = (outfolder, basename)=>{
    return outfolder+basename+"."+atonizerOPTS.outformat;
};

glob(atonizerOPTS.infolder + atonizerOPTS.pattern, undefined, (er, files)=>{
    let outfolder = atonizerOPTS.outfolder;
    //let outfolder = path.join(atonizerOPTS.outfolder, "uncomp/");
    //if (!fs.existsSync(outfolder)) fs.mkdirSync(outfolder);

    for (let i in files){
        let filepath = files[i];

        let IFile     = path.parse(filepath);
        let fBasename = IFile.name;    // IFile.dir+
        let fExt      = IFile.ext;     // eg: .obj
        let fName     = IFile.name + IFile.ext; // model.obj

        console.log("Processing file "+filepath);

        if (atonizerOPTS.pattern === "*.glb" || atonizerOPTS.pattern === "*.gltf"){
            processModel(outfolder, fBasename);
        }
        else {
            // for some reasons, generates wrong mipmappig
            obj2gltf(filepath, OPT_CONVERT).then(function(gltf){
                let outfilepath = buildFname(outfolder, fBasename);

                const data = Buffer.from(JSON.stringify(gltf));
                fs.writeFileSync(outfilepath, data);
                console.log("Model "+outfilepath+" written.");

                if (atonizerOPTS.compression > 0) processModel(outfolder, fBasename);
            });
        }
    }
});

// Texture processing
let isJPEG = (imgPath)=>{
    if (imgPath.endsWith(".jpg")) return true;
    if (imgPath.endsWith(".JPG")) return true;
    if (imgPath.endsWith(".jpeg")) return true;
    if (imgPath.endsWith(".JPEG")) return true;

    return false;
};

let isPNG = (imgPath)=>{
    if (imgPath.endsWith(".png")) return true;
    if (imgPath.endsWith(".PNG")) return true;

    return false;
};


// With sharp
/*
let processTextureFile = (imgPath)=>{
    if (processingTextures[imgPath] !== undefined) return;

    processingTextures[imgPath] = true;

    let w = imSize(imgPath).width;
    let h = imSize(imgPath).height;

    if (w > 4096 || h > 4096){
        console.log("ERROR: Texture "+imgPath+" too large.");
        return;
    }

    let im = sharp(imgPath);

    let bNeedResize = false;
    if (w > texMaxSize){ bNeedResize=true; w=texMaxSize; }
    if (h > texMaxSize){ bNeedResize=true; h=texMaxSize; }

    if (bNeedResize) im = im.resize(w,h);

    if (isJPEG(imgPath)) im = im.jpeg({ quality: atonizerOPTS.texquality });
    if (isPNG(imgPath))  im = im.png({ quality: atonizerOPTS.texquality });

    im = im.toFile(imgPath).then(()=>{
        console.log("Texture "+imgPath+" processed.");
    });

};
*/


let processTextureFile = (imgPath)=>{
    if (processingTextures[imgPath] !== undefined) return;

    processingTextures[imgPath] = true;

    let w = imSize(imgPath).width;
    let h = imSize(imgPath).height;

    if (w > 4096 || h > 4096){
        console.log("WARNING: Texture '"+imgPath+"' too large. Please reduce this texture resolution.");
        return;
    }

    let image = new Jimp(imgPath, (err, image)=>{
        if (err) throw err;

        //let w = image.bitmap.width;
        //let h = image.bitmap.height;

        let bNeedResize = false;

        if (w > atonizerOPTS.texsize){ bNeedResize=true; w=atonizerOPTS.texsize; }
        if (h > atonizerOPTS.texsize){ bNeedResize=true; h=atonizerOPTS.texsize; }

        if (bNeedResize) image = image.resize(w,h);

        image = image.quality( atonizerOPTS.texquality );

        image.write(imgPath);
        console.log("Texture "+imgPath+" processed.");
    });
};


// Draconize model
let processModel = (outfolder, basename)=>{
    let f = fsExtra.readJsonSync( buildFname(outfolder,basename) );

    //basename += "-d";

    let opt = OPT_GLTF;
    opt.name = basename;
    
    processGltf(f, opt).then((results)=>{
            //outfolder += "../";
            if (!fs.existsSync(outfolder)) fs.mkdirSync(outfolder);

            //let outDracoDir = outfolder+"d/";
            //if (!fs.existsSync(outDracoDir)) fs.mkdirSync(outDracoDir);

            fsExtra.writeJsonSync(outfolder+basename+"."+atonizerOPTS.outformat, results.gltf);

            // Save separate resources
            const separateResources = results.separateResources;
            for (const relativePath in separateResources) {
                if (separateResources.hasOwnProperty(relativePath)) {
                    const resource = separateResources[relativePath];

                    let absPathRes = outfolder+relativePath;

                    fsExtra.writeFileSync(absPathRes, resource);
                    //console.log(absPathRes);
                    if (isJPEG(absPathRes) || isPNG(absPathRes)) processTextureFile(absPathRes);
                }
            }

            console.log("GLTF draconized.");
        });
};