/*!
    @preserve

    App command-line management

 	@author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/

const fs = require('fs');
const fsExtra = require('fs-extra');

const fg   = require("fast-glob");
const glob = require("glob");

const commandLineArgs = require('command-line-args');
const path = require('path');
const makeDir  = require('make-dir');
//const readline = require('node:readline');

const Core = require('./../services/Core.js');

let conf  = Core.loadConfigFile("main.json", Core.CONF_MAIN);

/*
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
*/

// Command-line
const optDefs = [
    { name: 'appid', type: String },   // APP ID
    { name: 'title', type: String },   // Title
    { name: 'descr', type: String },   // Descrition
    { name: 'author', type: String },   // Author
    { name: 'usestorage', type: Boolean },  //
];

const args = commandLineArgs(optDefs);


const APP_TEMPLATE = Core.DIR_WAPPS+"app_template/";
const APP_PWA_MANIFEST = APP_TEMPLATE+"app.webmanifest";
const APP_ICON = APP_TEMPLATE+"appicon.png";
const APP_INDEX  = APP_TEMPLATE+"index.html";
const APP_LICENSE = APP_TEMPLATE+"/LICENSE";


let appid = undefined;
let apptitle = undefined;
let appdescr = undefined;
let author   = undefined;

let bUseDataStorage = false;

let printHelp = ()=>{
    console.log(
`HELP
====================================
    --appid: the required unique App ID (short name, no spaces, no capitals)
    --title: the human-readable App title
    --descr: an optional brief description for this App
    --usestorage: enable persistent data storage for this App
    --author: author string (may contain name, surname and/or contact mail)
`
    );
};


let generateIndex = ()=>{

    if (!apptitle) apptitle = appid;

    let strAppID = "";
    if (bUseDataStorage) strAppID = `<meta name="aton:appid" content="${appid}">`;

    let strUI = "";
    //strUI = `<div id="toolbar" class="aton-toolbar-top"></div>`;


    return `
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <link rel="icon" href="appicon.png" sizes="512x512" type="image/png">

    <!-- Add iOS meta tags and icons -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black">
    <meta name="apple-mobile-web-app-title" content="${apptitle}">
    <link rel="apple-touch-icon" href="appicon.png">

    <!-- OpenGraph tags -->
    <meta property="og:title" content="${apptitle}" />
    <meta property="og:description" content="${appdescr}" />
    <meta property="og:image" content="appicon.png" />
    <meta property="og:image:secure_url" content="appicon.png" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="512" />
    <meta property="og:image:height" content="512" />

    <!-- PWA manifest -->
    <link rel="manifest" href="app.webmanifest">

    ${strAppID}

    <meta name="title" content="${apptitle}">
    <meta name="description" content="${appdescr}">

    <!-- Add meta theme-color -->
    <meta name="theme-color" content="#000000" />

    <title>${apptitle}</title>
    <link rel="stylesheet" type="text/css" href="/vendors/bootstrap/css/bootstrap.min.css">
    <link rel="stylesheet" type="text/css" href="/vendors/bootstrap/css/bootstrap-icons/font/bootstrap-icons.min.css">
    <link rel="stylesheet" type="text/css" href="/res/css/main.css">

    <!-- Vendors -->
    <script type="text/javascript" src="/vendors/vendors.min.js"></script>
    <script type="text/javascript" src="/vendors/bootstrap/js/bootstrap.bundle.min.js"></script>

    <script type="text/javascript" src="/dist/THREE.bundle.js"></script>
    <script type="text/javascript" src="/dist/ATON.min.js"></script>

    <!-- Main js entry -->
    <script type="text/javascript" src="js/main.js"></script>
</head>

<body>
    <!-- UI elements here -->
    ${strUI}

    <div class="aton-poweredby" >
        Powered by <a href="https://aton.ispc.cnr.it/site/" target="_blank">ATON</a>
    </div>
</body>`;
};

let generateManifest = ()=>{
    let M = {};

    if (apptitle) M.name = apptitle;
    M.short_name = appid;
    
    M.display = "fullscreen";
    M.scope = "/";
    M.start_url = "index.html";

    M.orientation = "any";

    M.icons = [
        {
            src: "appicon.png",
            sizes: "512x512",
            type: "image/png"
        }
    ];

    return M;
};

let generateJS = ()=>{

    let authorstr = "";
    if (args.author) authorstr = args.author;

    return `
/*
	Main js entry for template ATON web-app
    ${authorstr}

===============================================*/
// Realize our app
let APP = ATON.App.realize();

// You can require here flares (plugins) if needed by the app
//APP.requireFlares(["myFlare","anotherFlare"]);

// APP.setup() is required for web-app initialization
// You can place here UI setup (HTML), events handling, etc.
APP.setup = ()=>{

	// Realize base ATON and add base UI events
    ATON.realize();
    ATON.UI.addBasicEvents();

	// Load sample 3D model
	//ATON.createSceneNode("sample").load("samples/models/skyphos/skyphos.gltf").attachToRoot();

    // If our app required ore or more flares (plugins), we can also wait for them to be ready for specific setups
    ATON.on("AllFlaresReady",()=>{
		// Do stuff
		console.log("All flares ready");
	});
};

/* If you plan to use an update routine (executed continuously), you can place its logic here.
APP.update = ()=>{

};
*/`;
};

let generateMD = ()=>{
    let readme = "";

    if (apptitle) readme += "# "+apptitle+"\n";
    if (appdescr) readme += appdescr;

    return readme;
};


//==============================================

if (!args.appid){
    console.log("No App ID provided! --appid\n");

    printHelp();
    return;
}

appid = args.appid.toLowerCase().trim();


if (appid.length < 2){
    console.log("App ID too short!");
    return;
}

if (!fs.existsSync(Core.DIR_WAPPS)){
    console.log("No Apps folder found!");
    return;
}

if (args.descr) appdescr = args.descr.trim();
if (args.usestorage) bUseDataStorage = true;
if (args.title) apptitle = args.title;

let appPath = Core.DIR_WAPPS + appid;

if (fs.existsSync(appPath)){
    console.log("App already exists");
    return;
}

makeDir.sync(appPath);
makeDir.sync(appPath+"/js");
if (bUseDataStorage) makeDir.sync(appPath+"/data");

let pathManifest = appPath+"/app.webmanifest";
let pathIndex    = appPath+"/index.html";
let pathMainJS   = appPath+"/js/main.js";
let pathLicense  = appPath+"/LICENSE";
let pathReadMe   = appPath+"/README.md";

/*
fs.copyFileSync(APP_PWA_MANIFEST, pathManifest);
fs.copyFileSync(APP_INDEX, pathIndex);
fs.copyFileSync(APP_ICON, appPath+"/appicon.png");
*/

fs.copyFileSync(APP_LICENSE, pathLicense);
fs.copyFileSync(APP_ICON, appPath+"/appicon.png");

// Generate files
fs.writeFileSync( pathManifest, JSON.stringify( generateManifest(), null, 4 ) );
fs.writeFileSync( pathIndex, generateIndex() );
fs.writeFileSync( pathMainJS, generateJS() );
fs.writeFileSync( pathReadMe, generateMD() );

console.log(`App ID ${appid} created!`);


