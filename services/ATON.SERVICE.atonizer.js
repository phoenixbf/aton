/*
    ATONIZER service
    author: bruno.fanini_AT_gmail.com

========================================================*/
const PORT_ATONIZER = process.env.PORT_ATONIZER || 8085;

const express = require('express')
const app  = express();
const fork = require('child_process').fork;
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

let populateInputFolders = function(){
    //TODO:

};


let fireAtonizerProcessor = function(args){
    let atonizerProcessor = fork('./AtonizerProcessor.js'); //, [], { env: { PATH: process.env.PATH } });

    args.task = "run";
    atonizerProcessor.send(args);

    atonizerProcessor.on('exit', (code, signal)=>{
        numRunning--;
        console.log("atonizer process terminated. Processes still running: "+numRunning);
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
/*
    let d = {};
    d.outfolders = [];
    d.infolders  = [];

    for (let k in aConfig.outputRootFolders) d.outfolders.push(k);
    for (let k in aConfig.inputRootFolders)  d.infolders.push(k);

    res.json(d);
*/
    let D = Object.assign({}, aConfig);
    console.log(D);

    res.json(D);
});

app.post('/services/atonizer/api/process', (req, res) => {
    console.log("Requested process");

    //console.log(req);
    console.log(req.body);


    let infolder  = aConfig.inputRootFolders[req.body.infolder];
    let outfolder = aConfig.inputRootFolders[req.body.outfolder];
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