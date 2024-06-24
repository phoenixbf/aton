/*!
    @preserve

    Scene Processor
    Utilities for batch processing scenes

 	@author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/
const fs = require('fs');
const fsExtra = require('fs-extra');

const fg   = require("fast-glob");

const deleteKey = require('key-del');
const commandLineArgs = require('command-line-args');
const path = require('path');

let Core = require("../Core.js");


// Command-line
const optDefs = [
    { name: 'fixvis', type: Boolean }
];


let SceneProcessor = {};

SceneProcessor.args = commandLineArgs(optDefs);

SceneProcessor.run = ()=>{
    if (!SceneProcessor.args) return;

    Core.Maat.init();

    if (SceneProcessor.args.fixvis) SceneProcessor.fixVisibilityForAllScenes();

};

// Use to upgrade visibility from old (pubfile) to new approach
SceneProcessor.fixVisibilityForAllScenes = ()=>{
    let scenes = Core.Maat.getAllScenes();
    //console.log(scenes);

    for (let s in scenes){
        let S = scenes[s];

        let pubfile = Core.getPubFilePath(S.sid);
        if (fs.existsSync(pubfile)){
            console.log(S)
            let J = Core.applySceneEdit(S.sid, { visibility: 1 }, "ADD");
        }
    }
};

//TODO: bulk scenes from items
SceneProcessor.createFromModelsFolder = (user, folder)=>{
    let fullpath = Core.DIR_COLLECTIONS + user + "/" + folder;

};

SceneProcessor.run();

module.exports = SceneProcessor;