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
//const listDirectories = require('list-directories');
//const { join } = require('path');
//const walk = require('walk');


//let processList = [];
let numRunning = 0;
let aConfig = require("./atonizer-config.json");

if (!aConfig){
    console.log("No 'atonizer-config.json' config file found.");
    exit(0);
}

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
        let p = dir+"/"+file; //path.join(dir, file);
        if (fs.statSync(p).isDirectory()){
            subdir += file+"/";
            filelist.push(subdir);
            listSubDirs(p, filelist);
            }
/*
        else {

            }
*/
        });

    return filelist;
};

let populateInputFolders = function(){

    for (let k in aConfig.inputRootFolders){
        let entry = aConfig.inputRootFolders[k];
        entry.subdirs = listSubDirs(entry.path);
        //console.log(entry);
        }
};


let fireAtonizerProcessor = function(args){
    let atonizerProcessor = fork('./AtonizerProcessor.js'); //, [], { env: { PATH: process.env.PATH } });

    args.task = "run";
    atonizerProcessor.send(args);
    console.log(args);

    atonizerProcessor.on('exit', (code, signal)=>{
        numRunning--;
        console.log("Atonizer process terminated. Processes still running: "+numRunning);
        //console.log(code, signal);
        });
    
    //processList.push(atonizerProcessor);

    numRunning++;
    console.log("Atonizer process launched. Processes running: "+numRunning);
    return atonizerProcessor;
};

app.use(express.json());

app.use('/', express.static(__dirname+"/../"));

app.get("/services/atonizer/config", function(req,res){

    let d = {};
    d.infolders  = [];
    d.outfolders = [];

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

/*
    let D = Object.assign({}, aConfig);
    console.log(D);

    res.json(D);
*/
});

app.post('/services/atonizer/api/process', (req, res) => {
    console.log("Requested process");

    //console.log(req);
    //console.log(req.body);

    let inD  = req.body.infolder.split(ATONIZER_SUBDIR_SEP);
    let outD = req.body.outfolder.split(ATONIZER_SUBDIR_SEP);

    let infolder  = aConfig.inputRootFolders[inD[0]].path + "/"+ inD[1];
    let outfolder = aConfig.outputRootFolders[outD[0]].path + "/"+ outD[1];

    //console.log(infolder);

    let patt      = req.body.pattern;
    let optstring = req.body.optstr;

    let args = {};
    args.inputFolder  = infolder;
    args.outputFolder = outfolder;
    args.pattern      = patt;
    args.options      = optstring;

    let aproc = fireAtonizerProcessor(args);

    res.json({ success: true });
});

app.listen(PORT_ATONIZER, ()=>{
    console.log("Atonizer service running on: "+PORT_ATONIZER);

    populateInputFolders();

/*
    let P = fireAtonizerProcessor({
        inputFolder: "D:/bruno/3Dassets/intarsi/modello_opus/", 
        outputFolder:"D:/bruno/Desktop/out-test/"
        });

    setInterval(()=>{
        console.log(P);
        }, 1000);
*/
});