/*
    Tool to link per-user cloud collection
    with the form:
    /some/path/cloud-collection/<username>-collection/

========================================================*/

const fs = require('fs');
const glob = require("glob");
const path = require('path');
const commandLineArgs = require('command-line-args');

const ServUtils = require('./ServUtils');

let confUsers = ServUtils.loadConfigFile("config-users.json");

// Command-line
const optDefs = [
    { name: 'cloudCollection', type: String },  // Cloud collection root folder
    { name: 'atonCollection', type: String }    // ATON collection root folder
];
let args = commandLineArgs(optDefs);

// Main ATON collection folder
let rootCollection = args.collection || path.join(__dirname,"/../public/collection/");

// Cloud collection
// Sub-folders must have structure like <username>-collection/
if (!args.cloudCollection){
    console.log("No Cloud root folder specified. Use --cloudCollection /your/cloudrootfolder/");
    return;
}


let linkUserCollection = (username)=>{
    console.log("Linking user collection: "+username);

    if (username === undefined) return;

    let cloudcoll = path.join(args.cloudCollection, username+"-collection/");
    if (!fs.existsSync(cloudcoll)) return;

    // models
    let cmodels = path.join(cloudcoll, "models");
    if (fs.existsSync(cmodels)){
        let slink = path.join(rootCollection, "models/"+username);

        if (!fs.existsSync(slink)){
            fs.symlinkSync(cmodels, slink);
            console.log("Created "+slink);
        }
    }

    // panoramas
    let cpanos = path.join(cloudcoll, "pano");
    if (fs.existsSync(cpanos)){
        let slink = path.join(rootCollection, "pano/"+username);

        if (!fs.existsSync(slink)){
            fs.symlinkSync(cpanos, slink);
            console.log("Created "+slink);
        }
    }
};

let linkUserScenes = (username)=>{
    console.log("Linking user scenes: "+username);

    if (username === undefined) return;

    let cloudscenes = path.join(args.cloudCollection, username+"-scenes/");
    if (!fs.existsSync(cloudscenes)) return; 
};


// Let's go
for (let u in confUsers){
    let user = confUsers[u];
    linkUserCollection(user.username);
}