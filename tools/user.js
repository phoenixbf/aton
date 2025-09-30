/*!
    @preserve

    User command-line management

 	@author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/
const fs = require('fs');
const fsExtra = require('fs-extra');

const fg   = require("fast-glob");
const glob = require("glob");

const commandLineArgs = require('command-line-args');
const path = require('path');

const Core = require('./../services/Core.js');

let conf  = Core.loadConfigFile("main.json", Core.CONF_MAIN);
let users = Core.loadConfigFile("users.json", Core.CONF_USERS);

//console.log(conf);

let UserManager = {};

// Command-line
const optDefs = [
    { name: 'op', type: String },   // operation
    { name: 'uid', type: String },  // 
    { name: 'pwd', type: String },  //
    { name: 'admin', type: Boolean },  //
    { name: 'mail', type: String },  //
];

UserManager.args = commandLineArgs(optDefs);

UserManager.run = ()=>{
    if (!UserManager.args.op){
        console.log("No operation specified");
        return;
    }

    // Operations
    if (UserManager.args.op === "new"){
        let uid = UserManager.args.uid;
        let pwd = UserManager.args.pwd;

        if (!uid || !pwd){
            console.log("--uid and --pwd are both required.");
            return;
        }

        for (let i in users){
            let U = users[i];
            if (U.username===uid){
                console.log("User "+uid+" already exists.")
                return;
            }
        }

        Core.createNewUser({
            username: uid,
            password: pwd,
            admin: UserManager.args.admin? true : undefined,
            mail: UserManager.args.mail
        });

        console.log("\nNEW USER CREATED: "+uid);
        console.log("=====================\n");
    }
};

UserManager.run();

module.exports = UserManager;