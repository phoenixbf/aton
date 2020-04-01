/*
    ATONIZER service
    author: bruno.fanini_AT_gmail.com

========================================================*/
const express = require('express')
const app  = express();
const fork = require('child_process').fork;
//const { spawn } = require('child_process').spawn;

const PORT_ATONIZER = 8085;

app.use(express.json());

let processList = [];

let fireAtonizerProcessor = function(args){
    let atonizerProcessor = fork('./atonizer-processor.js'); //, [], { env: { PATH: process.env.PATH } });

    args.task = "run";
    atonizerProcessor.send(args);

    atonizerProcessor.on('exit', (code, signal)=>{
        console.log(code, signal);
        });
    
    processList.push(atonizerProcessor);
    return atonizerProcessor;
};

app.post('/', (req, res) => {
    console.log(req.body);

    let args = {
        inputFolder:  req.body.infolder,
        outputFolder: req.body.outfolder,
        pattern: req.body.pattern,
        options: req.body.opts
        };

    let aproc = fireAtonizerProcessor(args);

});

app.listen(PORT_ATONIZER, ()=>{
    console.log("Atonizer service running on: "+PORT_ATONIZER);
});