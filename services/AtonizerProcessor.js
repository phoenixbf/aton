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
    overwrite: false, //true,
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
        //this.options      = (args.options)? args.options : "noRotation";

        this.bYup               = (args.bYup !== undefined)? args.bYup : false;
        this.bGenerateSJSON     = (args.bGenerateSJSON !== undefined)? args.bGenerateSJSON : true;
        this.bCompressGeom      = (args.bCompressGeom !== undefined)? args.bCompressGeom : true;
        this.bUseInlineTextures = (args.bUseInlineTextures !== undefined)? args.bUseInlineTextures : false;
        this.maxTextureRes      = (args.maxTextureRes !== undefined)? args.maxTextureRes : 4096;
        this.bSmoothNormals     = (args.bSmoothNormals !== undefined)? args.bSmoothNormals : false;
        this.simplifyGeom       = (args.simplifyGeom !== undefined)? args.simplifyGeom : 1.0;

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
        //let fdLock = fs.openSync(lockfile, 'w');
        fs.writeFileSync(lockfile, "Processing...");

        console.log("Processing folder "+inFolder);
        this._bRunning = true;

        if (!fs.existsSync(outFolder)) fs.mkdirSync(outFolder);
        process.chdir(inFolder); // IMPORTANT: change to input folder

        // Option string
        let addOpts = '';
        let addOptsJS = this._OSGJS_OPTS+' ';

        if (!this.bYup) addOpts += 'noRotation ';

        if (this.bUseInlineTextures) addOptsJS += 'inlineImages ';
        if (this.maxTextureRes && this.maxTextureRes>0) addOptsJS += 'resizeTextureUpToPowerOf2='+this.maxTextureRes+' ';

        // single pass
        //let ostr = '-O "'+addOptsJS+' '+addOpts+'"';
        
        let ostr   = '-O "'+addOpts+'"';
        let ostrjs = '-O "'+addOptsJS+'"';

        if (this.simplifyGeom && this.simplifyGeom < 1.0) ostr += ' --simplify '+this.simplifyGeom+' ';

        console.log(ostr);
        console.log(ostrjs);

        // ATON root json
        let sjson = {};
        sjson.scenegraph = {};
        sjson.scenegraph.nodes = {};
        sjson.scenegraph.nodes.main = {};
        sjson.scenegraph.nodes.main.urls = [];
        sjson.scenegraph.edges = [];
        sjson.scenegraph.edges.push([".","main"]);

        fs.writeFileSync(lockfile, "Converting data...");

        let self = this;
        glob(inFolder + self.pattern, undefined, function(er, files){
            for (let i in files){
                let filepath = files[i];
                //console.log("Processing file: "+filepath);

                let IFile     = path.parse(filepath);
                let fBasename = IFile.name;    // IFile.dir+
                let fExt      = IFile.ext;     // eg: .obj
                let fName     = IFile.name + IFile.ext; // model.obj

                fs.writeFileSync(lockfile, "Processing "+fName+"...");

                let tmpout      = outFolder+fBasename+"_m_.osg";
                let outfilepath = outFolder+fBasename+".osgjs";

                // single pass
/*
                let argstr = ostr+' '+fName+'.gles '+outfilepath;
                execSync('osgconv '+argstr, {stdio: 'inherit'});
*/
                // tmp
                let argstr = ostr+' '+fName+' '+tmpout;
                execSync('osgconv '+argstr, {stdio: 'inherit'});

                // Dirty, FIXME:
                replace({
                    regex: "Material {",
                    replacement: "xxxMaterial {",
                    paths: [ tmpout ],
                    recursive: true,
                    silent: true,
                });
                replace({
                    regex: "name ",
                    replacement: "xxxname",
                    paths: [ tmpout ],
                    recursive: true,
                    silent: true,
                });

                // final
                argstr = ostrjs+' '+tmpout+'.gles '+outfilepath;
                execSync('osgconv '+argstr, {stdio: 'inherit'});

                // Push into scene json
                console.log(fBasename+".osgjs");
                sjson.scenegraph.nodes.main.urls.push(String(fBasename+".osgjs"));

                // Minify osgjs
                let jsonf = JSON.parse( fs.readFileSync(outfilepath) );
                // Clean...
                //jsonf = deleteKey(jsonf, {key: "Name"});
                //jsonf = deleteKey(jsonf, {key: "osg.Material"});

                if (self.bGenerateSJSON) fs.writeFileSync(outfilepath, JSON.stringify(jsonf));
                
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
                fs.writeFileSync(lockfile, "Compressing geometry...");
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
            if (inFolder != outFolder && !self.bUseInlineTextures){
                console.log("I/O folders are different. Copying required resources...");

                copy(inFolder, outFolder, ATONIZER_COPY_OPTS, function(error, results) {
                    if (error) console.error('Copy failed: ' + error);
                    else {
                        // results[i].src, results[i].dest
                        console.info('Copied ' + results.length + ' files');
                        //if (onComplete) onComplete();
                    }

                    if (onComplete) onComplete();
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