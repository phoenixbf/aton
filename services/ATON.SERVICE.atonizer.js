/*
    ATONIZER service
    author: bruno.fanini_AT_gmail.com

========================================================*/
const PORT_ATONIZER = process.env.PORT_ATONIZER || 8085;

const ATONIZER_SUBDIR_SEP = ":";
const ATONIZER_LOCK_F = "_ALOCK_.txt";

const express = require('express')
const app  = express();
const fork = require('child_process').fork;
const exec = require('child_process');
const fs   = require('fs');
const path = require('path');
//const { spawn } = require('child_process').spawn;

const { readdirSync, statSync } = require('fs');
//const { join } = require('path');
const deleteKey = require('key-del');


//let processList = [];
let numRunning = 0;
let aConfig = require("./ATON.config.json");

if (!aConfig){
    console.log("No 'atonizer-config.json' config file found.");
    exit(0);
}


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

app.get("/atonizer/api/status/:outdir", function(req,res){
    let outD = req.params.outdir.split(ATONIZER_SUBDIR_SEP);

    if (outD.length < 2){
        res.json({ status: "ERROR" });
        console.log("ERROR: missing splitter");
        return;
        }

    let outEntry  = aConfig.outputRootFolders[outD[0]];
    let outfolder = outEntry.path + "/"+ outD[1];

    let flock = outfolder+"/"+ATONIZER_LOCK_F;
    if (fs.existsSync(flock)){
        let ss = fs.readFileSync(flock, 'utf8');
        res.json({ status: ss.toString() });
    }
    else {
        res.json({ status: "DONE" });
    }

});

app.post('/atonizer/api/process', (req, res) => {
    console.log("Requested process");

    let R = req.body;
    //console.log(req.body);

    let inD  = R.infolder.split(ATONIZER_SUBDIR_SEP);
    let outD = R.outfolder.split(ATONIZER_SUBDIR_SEP);

    if (inD.length < 2 || outD.length < 2){
        res.json({ success: false });
        console.log("ERROR: missing splitter");
        return;
        }

    let inEntry  = aConfig.inputRootFolders[inD[0]];
    let outEntry = aConfig.outputRootFolders[outD[0]];
    if (!inEntry || !outEntry){
        res.json({ success: false });
        console.log("ERROR: invalid input/output config entries");
        return;
        }

    let infolder  = inEntry.path + "/"+ inD[1];
    let outfolder = outEntry.path + "/"+ outD[1];

    if (!infolder || !outfolder){
        res.json({ success: false });
        console.log("ERROR: invalid input/output folders");
        return;
        }

    //infolder  = infolder.toLowerCase();
    //outfolder = outfolder.toLowerCase();

    if (!fs.existsSync(outfolder)) fs.mkdirSync(outfolder);

    let patt = R.pattern;
    //let optstring = req.body.optstr;

    let args = {};
    args.infolder  = infolder;
    args.outfolder = outfolder;
    args.pattern   = patt;
    //args.options   = optstring;
    
    args.bCompressGeom      = R.bCompressGeom;
    args.bYup               = R.bYup;
    args.bSmoothNormals     = R.bSmoothNormals;
    args.bUseInlineTextures = R.bUseInlineTextures;
    args.maxTextureRes      = R.maxTextureRes;
    args.simplifyGeom       = R.simplifyGeom;


    console.log(args);
    //return;

    let aproc = fireAtonizerProcessor(args, ()=>{

        });

    res.json({ success: true });
});

app.listen(PORT_ATONIZER, ()=>{
    console.log("Atonizer service running on: "+PORT_ATONIZER);

    populateInputFolders();
});