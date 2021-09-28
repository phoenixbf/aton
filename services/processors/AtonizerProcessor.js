
const fs = require('fs');
const fsExtra = require('fs-extra');

const fg   = require("fast-glob");
const glob = require("glob");

const deleteKey = require('key-del');
const commandLineArgs = require('command-line-args');
const path = require('path');

//const gbb = require("gltf-bounding-box"); // not supporting bin

const obj2gltf = require('obj2gltf');
const gltfPipeline = require('gltf-pipeline');
const processGltf = gltfPipeline.processGltf;

const Jimp   = require('jimp');
//const sharp  = require('sharp');
const imSize = require('image-size');


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


let Atonizer = {};

Atonizer.args = commandLineArgs(optDefs);

Atonizer.processingTextures = {};


Atonizer.run = ()=>{
    if (!Atonizer.args.infolder || !Atonizer.args.outfolder) return;
    if (Atonizer.args.pattern === undefined) Atonizer.args.pattern = "*.obj";
    if (Atonizer.args.outformat === undefined) Atonizer.args.outformat = "gltf";
    if (Atonizer.args.inup === undefined) Atonizer.args.inup = "Z";
    if (Atonizer.args.merge  === undefined) Atonizer.args.merge = false;
    if (Atonizer.args.compression === undefined) Atonizer.args.compression = 4; // 10
    if (Atonizer.args.texsize === undefined) Atonizer.args.texsize = 4096; //2048;
    if (Atonizer.args.texquality === undefined) Atonizer.args.texquality = 60;


    Atonizer.OPT_CONVERT = {
        //binary : true
        separate : !Atonizer.args.merge, //true,
        outputDirectory: Atonizer.args.outfolder,
        inputUpAxis: Atonizer.args.inup,
        outputUpAxis: 'Y',  // three.js
        packOcclusion: false, // true
        //unlit : true,
    }

    Atonizer.OPT_GLTF = {
        separate: !Atonizer.args.merge, //true,
        separateTextures: !Atonizer.args.merge, //true,
        separateShaders: !Atonizer.args.merge, //true,
        separateBuffers: !Atonizer.args.merge, //true,
        
        separateResources: Atonizer.args.outfolder,
        resourceDirectory: Atonizer.args.outfolder,

        dracoOptions: {
            compressMeshes: true,
            compressionLevel: Atonizer.args.compression,
            quantizeTexcoordBits: 12,
            unifiedQuantization: true // avoid gaps
        }
    };

    console.log(Atonizer.args);

    glob(Atonizer.args.infolder + Atonizer.args.pattern, undefined, (er, files)=>{
        let outfolder = Atonizer.args.outfolder;
        //let outfolder = path.join(Atonizer.args.outfolder, "uncomp/");
        //if (!fs.existsSync(outfolder)) fs.mkdirSync(outfolder);

        for (let i in files){
            let filepath = files[i];

            let IFile     = path.parse(filepath);
            let fBasename = IFile.name;    // IFile.dir+
            let fExt      = IFile.ext;     // eg: .obj
            let fName     = IFile.name + IFile.ext; // model.obj

            console.log("Processing file "+filepath);

            if (Atonizer.args.pattern === "*.glb" || Atonizer.args.pattern === "*.gltf"){
                Atonizer.processModel(outfolder, fBasename);
            }
            else {
                // for some reasons, generates wrong mipmappig
                obj2gltf(filepath, Atonizer.OPT_CONVERT).then(function(gltf){
                    let outfilepath = Atonizer.buildFname(outfolder, fBasename);

                    const data = Buffer.from(JSON.stringify(gltf));
                    fs.writeFileSync(outfilepath, data);
                    console.log("Model "+outfilepath+" written.");

                    if (Atonizer.args.compression > 0) Atonizer.processModel(outfolder, fBasename);
                });
            }
        }
    });
};



Atonizer.buildFname = (outfolder, basename)=>{
    return outfolder+basename+"."+Atonizer.args.outformat;
};

// Texture processing
Atonizer.isJPEG = (imgPath)=>{
    if (imgPath.endsWith(".jpg")) return true;
    if (imgPath.endsWith(".JPG")) return true;
    if (imgPath.endsWith(".jpeg")) return true;
    if (imgPath.endsWith(".JPEG")) return true;

    return false;
};

Atonizer.isPNG = (imgPath)=>{
    if (imgPath.endsWith(".png")) return true;
    if (imgPath.endsWith(".PNG")) return true;

    return false;
};


// With sharp
/*
let processTextureFile = (imgPath)=>{
    if (Atonizer.processingTextures[imgPath] !== undefined) return;

    Atonizer.processingTextures[imgPath] = true;

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

    if (isJPEG(imgPath)) im = im.jpeg({ quality: Atonizer.args.texquality });
    if (isPNG(imgPath))  im = im.png({ quality: Atonizer.args.texquality });

    im = im.toFile(imgPath).then(()=>{
        console.log("Texture "+imgPath+" processed.");
    });

};
*/

Atonizer.processTextureFile = (imgPath)=>{
    if (Atonizer.processingTextures[imgPath] !== undefined) return;

    Atonizer.processingTextures[imgPath] = true;

    let w = imSize(imgPath).width;
    let h = imSize(imgPath).height;

/*
    sharp(imgPath)
        .withMetadata()
        .png({
            quality: Atonizer.args.texquality, // 0-100
            //compression: 6, // this doesn't need to be set
        })
        .jpg({
            quality: Atonizer.args.texquality
        })
*/
    if (w > 4096 || h > 4096){
        console.log("WARNING: Texture '"+imgPath+"' too large. Please reduce this texture resolution.");
        return;
    }

    let image = new Jimp(imgPath, (err, image)=>{
        if (err) throw err;

        //let w = image.bitmap.width;
        //let h = image.bitmap.height;

        let bNeedResize = false;

        if (w > Atonizer.args.texsize){ bNeedResize=true; w=Atonizer.args.texsize; }
        if (h > Atonizer.args.texsize){ bNeedResize=true; h=Atonizer.args.texsize; }

        if (bNeedResize) image = image.resize(w,h);

        image = image.quality( Atonizer.args.texquality );

        image.write(imgPath);
        console.log("Texture "+imgPath+" processed.");
    });
};


// Draconize model
Atonizer.processModel = (outfolder, basename)=>{
    let f = fsExtra.readJsonSync( Atonizer.buildFname(outfolder,basename) );

    //basename += "-d";

    let opt = Atonizer.OPT_GLTF;
    opt.name = basename;
    
    processGltf(f, opt).then((results)=>{
            //outfolder += "../";
            if (!fs.existsSync(outfolder)) fs.mkdirSync(outfolder);

            //let outDracoDir = outfolder+"d/";
            //if (!fs.existsSync(outDracoDir)) fs.mkdirSync(outDracoDir);

            fsExtra.writeJsonSync(outfolder+basename+"."+Atonizer.args.outformat, results.gltf);

            // Save separate resources
            const separateResources = results.separateResources;
            for (const relativePath in separateResources) {
                if (separateResources.hasOwnProperty(relativePath)) {
                    const resource = separateResources[relativePath];

                    let absPathRes = outfolder+relativePath;

                    fsExtra.writeFileSync(absPathRes, resource);
                    //console.log(absPathRes);
                    if (Atonizer.isJPEG(absPathRes) || Atonizer.isPNG(absPathRes)) Atonizer.processTextureFile(absPathRes);
                }
            }

            console.log("GLTF draconized.");
        });
};


Atonizer.run();

module.exports = Atonizer;