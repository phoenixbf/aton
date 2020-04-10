/*
    ATONIZER processor
    author: bruno.fanini_AT_gmail.com

========================================================*/
const fs = require('fs');
const execSync = require('child_process').execSync;
const path = require('path');
const replace = require("replace");
const commandLineArgs = require('command-line-args');
const { spawn } = require('child_process');
const glob = require("glob");
const deleteKey = require('key-del');
const copy = require('recursive-copy');

const ATONIZER_LOCK_F = "_ALOCK_.txt";
const ATONIZER_COMPL_F = "_ATONIZED_.txt";

const ATONIZER_COPY_OPTS = {
    expand: true,
    overwrite: true,
    filter: ["**/*.jpg","**/*.png","*.jpg","*.png"]
};


// Command-line
const optDefs = [
    { name: 'infolder', alias: 'i', type: String },
    { name: 'outfolder', alias: 'o', type: String },
    { name: 'pattern', alias: 'p', type: String },
    { name: 'opts', type: String }
];
var atonizerOPTS = commandLineArgs(optDefs);





class AtonizerFolderProcessor {
    constructor(args){
        this.inputFolder  = (args.infolder)? args.infolder : "";
        this.outputFolder = (args.outfolder)? args.outfolder : "";
        this.pattern      = (args.pattern)? args.pattern : "*.obj";
        this.options      = (args.options)? args.options : "noRotation";

        this.bGenerateSJSON     = true;
        this.bCompressGeom      = (args.bCompressGeom !== undefined)? args.bCompressGeom : true;
        this.bUseInlineTextures = (args.bUseInlineTextures !== undefined)? args.bUseInlineTextures : false;
        this.resizeTextures     = 4096;

        this._OSGJS_OPTS = "JPEG_QUALITY 60 useExternalBinaryArray mergeAllBinaryFiles";
        this._bRunning = false;

        //console.log(args);
        }

    isRunning(){
        return this._bRunning;
        }

    run(onComplete){
        let inFolder  = this.inputFolder;
        let outFolder = this.outputFolder;

        if (!inFolder || !outFolder || inFolder.length <= 0 || outFolder.length <= 0){
            console.log("Invalid input/output folders.");
            if (onComplete) onComplete();
            return;
            }
        
        let lockfile  = outFolder+ATONIZER_LOCK_F;
        let complfile = outFolder+ATONIZER_COMPL_F;
        if (fs.existsSync(lockfile)){ // already processing
            console.log("Folder is already processing.");
            if (onComplete) onComplete();
            return;
            }
/*
        if (fs.existsSync(complfile)){ // already processed
            console.log("Folder already processed.");
            if (onComplete) onComplete();
            return;
            }
*/
        console.log("Processing folder "+inFolder);
        this._bRunning = true;

        if (!fs.existsSync(outFolder)) fs.mkdirSync(outFolder);
        process.chdir(inFolder); // IMPORTANT: change to input folder

        // Option string
        let addOpts = '';
        if (this.bUseInlineTextures) addOpts += 'inlineImages ';
        if (this.resizeTextures>0) addOpts += 'resizeTextureUpToPowerOf2='+this.resizeTextures+' ';

        let ostr = '-O "'+this.options+' '+this._OSGJS_OPTS+' '+addOpts+'"';

        fs.closeSync(fs.openSync(lockfile, 'w'));

        // ATON root json
        let sjson = {};
        sjson.scenegraph = {};
        sjson.scenegraph.nodes = {};
        sjson.scenegraph.nodes.main = {};
        sjson.scenegraph.nodes.main.urls = [];
        sjson.scenegraph.edges = [];
        sjson.scenegraph.edges.push([".","main"]);


        let self = this;
        glob(inFolder + self.pattern, undefined, function(er, files){
            for (let i in files){
                let filepath = files[i];
                //console.log("Processing file: "+filepath);

                let IFile     = path.parse(filepath);
                let fBasename = IFile.name;    // IFile.dir+
                let fExt      = IFile.ext;     // eg: .obj
                let fName     = IFile.name + IFile.ext; // model.obj

                let outfilepath = outFolder+fBasename+".osgjs";

                let argstr = ostr+' '+fName+'.gles '+outfilepath;
                console.log(argstr);
                
                execSync('osgconv '+argstr, {stdio: 'inherit'});

                // Push into scene json
                console.log(fBasename+".osgjs");
                sjson.scenegraph.nodes.main.urls.push(String(fBasename+".osgjs"));

                // Minify osgjs
                let jsonf = JSON.parse( fs.readFileSync(outfilepath) );
                //TODO: deleteKey(...)
                fs.writeFileSync(outfilepath, JSON.stringify(jsonf));
                
                if (self.bCompressGeom){
                    replace({
                        regex: ".bin",
                        replacement: ".bin.gz",
                        paths: [ outfilepath ],
                        recursive: true,
                        silent: true,
                        });
                    }
                }

            if (self.bCompressGeom && files.length>0){
                console.log("Compressing geometries...");
                execSync('gzip -q -f --best '+outFolder+'/*.bin', {stdio: 'inherit'});
                }

            // Completed
            if (self.bGenerateSJSON) fs.writeFileSync(outFolder+"scene.json", JSON.stringify(sjson));

            fs.unlinkSync(lockfile);
            fs.closeSync(fs.openSync(complfile, 'w'));
            self._bRunning = false;
            
            console.log("COMPLETED");

            // Copy required resources when I/O folders differ
            if (inFolder != outFolder){
                console.log("I/O folders are different. Copying required resources...");

                copy(inFolder, outFolder, ATONIZER_COPY_OPTS, function(error, results) {
                    if (error) console.error('Copy failed: ' + error);
                    else {
                        // results[i].src, results[i].dest
                        console.info('Copied ' + results.length + ' files');
                        if (onComplete) onComplete();
                        }
                    });
                }
            // In-place conversion
            else {
                console.log("Assets converted in-place.");
                if (onComplete) onComplete();
                }
            });
        }
};


let P = undefined;

process.on("message", (m) => {
    if (!m) return;

    if (m.task === "run"){
        P = new AtonizerFolderProcessor(m);
        P.run(()=>{
            process.send({completed: true});
            process.exit(0);
            });
        }
    if (m.task === "status"){
        process.send( P.isRunning() );
        }
});


/*
if (!atonizerOPTS.infolder || !atonizerOPTS.outfolder) return;

let opts = "noRotation";
if (atonizerOPTS.opts) opts = atonizerOPTS.opts;

let pat = "*.obj";
if (atonizerOPTS.pattern) pat = atonizerOPTS.pattern;

let AP = new AtonizerFolderProcessor(atonizerOPTS.infolder,atonizerOPTS.outfolder, pat, opts);
//AP.inputFolder  = atonizerOPTS.infolder;
//AP.outputFolder = atonizerOPTS.outfolder;
//AP.pattern = pat;
//AP.options = opts;
//AP.bUseInlineTextures = true;

AP.run();
*/

module.exports = AtonizerFolderProcessor;