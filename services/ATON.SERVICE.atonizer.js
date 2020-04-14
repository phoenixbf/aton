/*
    ATONIZER service
    author: bruno.fanini_AT_gmail.com

========================================================*/
const PORT_ATONIZER = process.env.PORT_ATONIZER || 8085;

const ATONIZER_SUBDIR_SEP = ":";


const express = require('express')
const app  = express();
const fork = require('child_process').fork;
const fs   = require('fs');
const path = require('path');
//const { spawn } = require('child_process').spawn;

const { readdirSync, statSync } = require('fs');
//const { join } = require('path');
const deleteKey = require('key-del');


//let processList = [];
let numRunning = 0;
let aConfig = require("./config.json");

if (!aConfig){
    console.log("No 'atonizer-config.json' config file found.");
    exit(0);
}

/*
const walkSync = (dir, filelist = []) => {
    fs.readdirSync(dir).forEach(file => {
        filelist = fs.statSync(path.join(dir, file)).isDirectory()
            ? walkSync(path.join(dir, file), filelist)
            : filelist.concat(path.join(dir, file));

        });

return filelist;
};


const listSubDirs = function(dir, subdir="", filelist=[]){
    fs.readdirSync(dir).forEach(file => {
        let absp = dir+"/"+file; //path.join(dir, file);

        if (fs.statSync(absp).isDirectory()){
            subdir += file+"/";
            filelist.push(subdir);

            listSubDirs(dir+subdir, subdir, filelist);
            }

        });

    return filelist;
};
*/
let listSubDirs = function(absdir, subdir=""){
    let results = [];
    let list    = fs.readdirSync(absdir);
    
    list.forEach(function(file){
        
        let absub = absdir+"/"+file;
        let stat = fs.statSync(absub);

        if (stat && stat.isDirectory()){ // Dir
            let S = subdir+file+"/";
            results.push(S);

            results = results.concat( listSubDirs(absub, S) );
            }
        else { // File
            }
        });

    return results;
}


let populateInputFolders = function(){

    for (let k in aConfig.inputRootFolders){
        let entry = aConfig.inputRootFolders[k];
        entry.subdirs = listSubDirs(entry.path);
        //console.log(entry);
        }
};


let fireAtonizerProcessor = function(args, onComplete){
    let atonizerProcessor = fork('./AtonizerProcessor.js'); //, [], { env: { PATH: process.env.PATH } });

    args.task = "run";
    atonizerProcessor.send(args);
    console.log(args);

    atonizerProcessor.on('exit', (code, signal)=>{
        //console.log(code, signal);
        
        if (numRunning>0) numRunning--;
        console.log("Atonizer process terminated. Processes still running: "+numRunning);
        if (onComplete) onComplete();
        });
    
    //processList.push(atonizerProcessor);

    numRunning++;
    console.log("Atonizer process launched. Processes running: "+numRunning);
    return atonizerProcessor;
};

app.use(express.json());

app.use('/', express.static(__dirname+"/"));

app.get("/atonizer/config", function(req,res){
/*
    let d = {};
    d.infolders  = [];
    d.outfolders = [];

    populateInputFolders();

    for (let k in aConfig.inputRootFolders){
        let entry = aConfig.inputRootFolders[k];

        d.infolders.push(k+ATONIZER_SUBDIR_SEP);
        for (let s in entry.subdirs) d.infolders.push(k+ATONIZER_SUBDIR_SEP+entry.subdirs[s]);
        }
    for (let k in aConfig.outputRootFolders){
        let entry = aConfig.outputRootFolders[k];
        d.outfolders.push(k+ATONIZER_SUBDIR_SEP);
        }

    res.json(d);
*/
    populateInputFolders();

    let D = Object.assign({}, aConfig);
    D = deleteKey(D, "path");
    res.json(D);
});

app.post('/atonizer/api/process', (req, res) => {
    console.log("Requested process");
    //console.log(req.body);

    let inD  = req.body.infolder.split(ATONIZER_SUBDIR_SEP);
    let outD = req.body.outfolder.split(ATONIZER_SUBDIR_SEP);
    let infolder  = aConfig.inputRootFolders[inD[0]].path + "/"+ inD[1];
    let outfolder = aConfig.outputRootFolders[outD[0]].path + "/"+ outD[1];

    //let infolder  = req.body.infolder + "/" + req.body.insubdir;
    //let outfolder = req.body.outfolder + "/" + req.body.outsubdir;

    if (!fs.existsSync(outfolder)) fs.mkdirSync(outfolder);

    let patt      = req.body.pattern;
    //let optstring = req.body.optstr;

    let args = {};
    args.infolder  = infolder;
    args.outfolder = outfolder;
    args.pattern   = patt;
    //args.options   = optstring;
    
    args.bCompressGeom      = req.body.bCompressGeom;
    args.bYup               = req.body.bYup;
    args.bSmoothNormals     = req.body.bSmoothNormals;
    args.bUseInlineTextures = req.body.bUseInlineTextures;
    args.maxTextureRes      = req.body.maxTextureRes;


    console.log(args);
    //return;

    let aproc = fireAtonizerProcessor(args, ()=>{
        res.json({ success: true });
        });

});

app.listen(PORT_ATONIZER, ()=>{
    console.log("Atonizer service running on: "+PORT_ATONIZER);

    populateInputFolders();
});