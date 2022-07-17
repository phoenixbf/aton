/*!
    @preserve

 	ATON Core service routines

 	@author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/
const fs          = require('fs');
const path        = require('path');
//const glob        = require("glob");
const jsonpatch   = require('fast-json-patch');
const del         = require('del');
const makeDir     = require('make-dir');
const nanoid      = require('nanoid');
const fsx         = require('fs-extra');
const axios       = require('axios');
//const chokidar    = require('chokidar');
const fg          = require('fast-glob');
const chalk       = require('chalk');

const { networkInterfaces } = require('os');

// Authentication
let passport = require('passport');
let Strategy = require('passport-local').Strategy;
const cookieParser   = require('cookie-parser');
const session        = require('express-session');
const FileStore      = require('session-file-store')(session);

// Local modules
const BaseAPI = require("./API.js");
const Maat    = require("./Maat.js");


Core = {};

Core.DIR_DATA         = path.join(__dirname,"/../data/");
Core.DIR_WAPPS        = path.join(__dirname,"/../wapps/");
Core.DIR_PUBLIC       = path.join(__dirname,"/../public/");
Core.DIR_RES          = path.join(Core.DIR_PUBLIC,"res/");
Core.DIR_PRV          = path.join(__dirname, "_prv/");
Core.DIR_CONFIG       = path.join(__dirname, "/../config/");
Core.DIR_NODE_MODULES = path.join(__dirname, "/../node_modules");
//Core.DIR_APIDOC       = path.join(__dirname, "/../API/");
Core.DIR_FE           = path.join(Core.DIR_PUBLIC,"hathor/");
Core.DIR_BE           = path.join(Core.DIR_PUBLIC,"shu/");
Core.DIR_COLLECTIONS  = path.join(Core.DIR_DATA,"collections/"); //path.join(Core.DIR_PUBLIC,"collection/");
Core.DIR_SCENES       = path.join(Core.DIR_DATA,"scenes/");   //path.join(Core.DIR_PUBLIC,"scenes/");
Core.DIR_EXAMPLES     = path.join(Core.DIR_PUBLIC,"examples/");
Core.STD_SCENEFILE    = "scene.json";
Core.STD_PUBFILE      = "pub.txt";
Core.STD_COVERFILE    = "cover.png";

Core.STATUS_COMPLETE   = "complete";
Core.STATUS_PROCESSING = "processing";


Core.config = undefined; // main config
Core.users  = [];        // users config

Core.SCENES_GLOB_OPTS = {
	cwd: Core.DIR_SCENES,
	follow: true
};

Core.COLLECTIONS_GLOB_OPTS = {
	cwd: Core.DIR_COLLECTIONS,
	follow: true
};

// Modules setup
Core.realizeBaseAPI = BaseAPI;
Core.passport       = passport; // set configured passport
Core.maat           = Maat;

// LOG Utils
Core.logGreen = (str)=>{
	console.log(chalk.green(str));
};
Core.logYellow = (str)=>{
	console.log(chalk.yellow(str));
};

// Configs
//========================================
// Default main config
Core.CONF_MAIN = {
	data: {
/*
		collections: "",
		scenes: "",
		patterns: {
			models: "*.gltf,*.glb,*.json"
		}
*/
	},

/*	Additional scripts to load for Hathor front-end
	hathor:{
		scripts: []
	},
*/
	services: {
		main: {
			PORT: 8080,		// main ATON port
			PORT_S: 8083,	// secure ATON port
			pathCert: "",	// custom path to cert
			pathKey: ""		// custom path to key
		},

		vroadcast: {
			PORT: 8890,					// local VRoadcast port
			address: "ws://localhost",
			maxClientsPerScene: 50		// Max clients per scene
		},

		webdav: {
			PORT: 8081
		},

		maat: {
			PORT: 8891
		},
/*
		atonizer: {
			PORT: 8085,
			address: "http://localhost"
		}
*/
	},

    landing: {
        gallery: true,		// Show gallery (public scenes) in the landing page
		samples: true,		// Show samples (def true)
		//header: "",		// Custom header HTML5 snippet
		//redirect: "",		// Redirect to URL (e.g. specific web-app: "a/app_template")
    }
};

// Default users config
// NOTE: this is a sample users config, you'll need to provide your own
Core.CONF_USERS = [
	{ 
        username: "ra",
        admin: true,
        password: "ra2020"
	},
	{ 
        username: "bastet",
        password: "bas2020"
	}
];

//=========================================
// Maat


// Maat as external service (NOT USED for now)
/*
Core.maatQuery = (str, onresponse)=>{
	let q = Core._maatEP + str;

	axios.get(q)
		.then(res => {
			//console.log(res.data);
			if (onresponse) onresponse(res.data);
		})
		.catch(err => {
    		console.log('Error: ', err.message);
		});
};
*/

// Main init routine
//==========================================================================
Core.init = ()=>{
	if (!fs.existsSync(Core.DIR_CONFIG)) makeDir.sync(Core.DIR_CONFIG);

	Core.config = Core.loadConfigFile("main.json", Core.CONF_MAIN);
	Core.users  = Core.loadConfigFile("users.json", Core.CONF_USERS);

	Core.mpattern = "*.gltf,*.glb,*.json";
	if (Core.config.data && Core.config.data.patterns && Core.config.data.patterns.models){
		Core.mpattern = Core.config.data.patterns.models;
		console.log("Custom models pattern: "+Core.mpattern);
	}

	Core.touchUserCollectionFolders();

	//const maatport = (Core.config.services.maat)? Core.config.services.maat.PORT : 8891;
	//Core._maatEP = "http://localhost:"+maatport+"/";

	console.log("DB users: "+Core.users.length);

	// Retrieve network interfaces
	const nif  = networkInterfaces();
	Core.nets = {};

	for (const name of Object.keys(nif)) {
		for (const net of nif[name]) {
			// Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
			if (net.family === 'IPv4' && !net.internal){
				if (!Core.nets[name]) Core.nets[name] = [];
				Core.nets[name].push(net.address);
			}
		}
	}

	Core.maat.init();
};

Core.loadConfigFile = (jsonfile, defconf)=>{
	let customconfig  = path.join(Core.DIR_CONFIG + jsonfile);

	if (fs.existsSync(customconfig)){
		let C = JSON.parse(fs.readFileSync(customconfig, 'utf8'));
		console.log("Found custom config "+jsonfile);
		return C;
	}

	// Custom config does not exist...
	console.log("Custom config not found in "+Core.DIR_CONFIG+", using default...");

	// Create custom config from default
	fs.writeFileSync(customconfig, JSON.stringify(defconf, null, 4));
	return defconf;

};

Core.touchCollectionFolder = (user)=>{
	if (user === undefined) return;

	let dirColl = path.join( Core.DIR_COLLECTIONS, user.username );

	if (!fs.existsSync(dirColl)){
		try {
			makeDir.sync(dirColl);
		} catch (e){
			console.log(e);
			return;
		}
	}

/*
	let dirModels = path.join(dirColl,"/models/");
	let dirPano   = path.join(dirColl,"/pano/");

	if (!fs.existsSync(dirModels)) makeDir.sync(dirModels);
	if (!fs.existsSync(dirPano)) makeDir.sync(dirPano);
*/
};

Core.touchUserCollectionFolders = ()=>{
	let len = Core.users.length;
	for (let i = 0; i < len; i++){
		let U = Core.users[i];

		Core.touchCollectionFolder( U );
	}
};


// SSL certs
Core.getCertPath = ()=>{
	let cpath = Core.config.services.main.pathCert;
	
	if (cpath && cpath.length>4) return cpath;
	return path.join(Core.DIR_PRV,'server.crt');
};
Core.getKeyPath = ()=>{
	let cpath = Core.config.services.main.pathKey;

	if (cpath && cpath.length>4) return cpath;
	return path.join(Core.DIR_PRV,'server.key');
};


// Users
//=======================================
Core.createNewUser = (entry)=>{
	if (entry === undefined) return false;

	// Add new entry into users json
	Core.users = Core.loadConfigFile("users.json", Core.CONF_USERS);
	Core.users.push(entry);
	
	let uconfig = path.join(Core.DIR_CONFIG + "users.json");
	fs.writeFileSync(uconfig, JSON.stringify(Core.users, null, 4));

	Core.touchCollectionFolder(entry);

	console.log("Created new user: "+entry);

	return true;
};

//TODO:
Core.deleteUser = (username)=>{
	if (username === undefined) return false;

	Core.users = Core.loadConfigFile("users.json", Core.CONF_USERS);
	let num = Core.users.length;

	for (let u=0; u<num; u++){
		if (Core.users[u].username === username){
			Core.users.splice(u,1);

			let uconfig = path.join(Core.DIR_CONFIG + "users.json");
			fs.writeFileSync(uconfig, JSON.stringify(Core.users, null, 4));

			return true;
		}
	}

	return false;
};


// Scenes
//=======================================
Core.getSceneFolder = (sid)=>{
	return path.join(Core.DIR_SCENES,sid);
};
Core.getSceneJSONPath = (sid)=>{
	let jsonfile = path.join( Core.getSceneFolder(sid), Core.STD_SCENEFILE);
	return jsonfile;
};
Core.getPubFilePath = (sid)=>{
	let pubfile = path.join( Core.getSceneFolder(sid), Core.STD_PUBFILE);
	return pubfile;
};

// Check if scene exists on disk
Core.existsScene = (sid)=>{;
	let b = fs.existsSync(Core.getSceneJSONPath(sid));
	return b;
};

// Generate timestamped user SID
Core.generateUserSID = ()=>{
    let today = new Date();
    let dd   = String( today.getDate() );
    let mm   = String( today.getMonth()+1 ); 
    let yyyy = String( today.getFullYear() );
    if(dd<10) dd = '0'+dd;
    if(mm<10) mm = '0'+mm;

    let sid = yyyy+mm+dd + '-' + Math.random().toString(36).substr(2,9);
	return sid;
};

Core.createBasicScene = ()=>{
	let sobj = {};

	sobj.status = Core.STATUS_COMPLETE;

	sobj.scenegraph = {};
	sobj.scenegraph.nodes = {};
	sobj.scenegraph.nodes.main = {};
	sobj.scenegraph.edges = {};
	sobj.scenegraph.edges["."] = ["main"];

	sobj.scenegraph.nodes.main.urls = [];

	console.log(sobj);

	return sobj;
};

// Create sub-folder structure on disk
Core.touchSceneFolder = (sid)=>{
	let D = Core.getSceneFolder(sid);
	//if (!fs.existsSync(D)) fs.mkdirSync(D, { recursive: true }); // note: NodeJS > 12.0
	if (!fs.existsSync(D)) makeDir.sync(D);
};

// Delete a scene folder
Core.deleteScene = (sid)=>{
	let D = Core.getSceneFolder(sid);
	console.log("Deleting "+D);
	//if (fs.existsSync(D)) fs.rmdirSync(D, { recursive: true }); // note: NodeJS > 12.0
	if (fs.existsSync(D)) del(D, {force: true});
};

Core.readSceneJSON = (sid)=>{
	let jspath = Core.getSceneJSONPath(sid);
	if (!fs.existsSync(jspath)) return undefined;

	let S = JSON.parse(fs.readFileSync(jspath, 'utf8'));
	return S;
};


// Apply partial edit to sobj
Core.addOBJEdit = (sobj, edit)=>{
	//if (sobj === undefined) return undefined;

	// object or array
	if (typeof edit === "object"){
		for (let k in edit){
			let E = edit[k];

			//if (Array.isArray(E)){
			//	sobj[k] = E;
			//}

			// Touch
			if (sobj[k] === undefined){
				//sobj[k] = {};
				sobj[k] = Array.isArray(E)? [] : {};
			}

			sobj[k] = Core.addOBJEdit(sobj[k], E);
		}

		return sobj;
	}

	// not object
	sobj = edit;
	return sobj;
};

Core.deleteOBJEdit = (sobj, edit)=>{
	if (sobj === undefined) return undefined;

	// object or array
	if (typeof edit === "object"){
		for (let k in edit){
			let E = edit[k];

			//if (Array.isArray(sobj)) sobj = sobj.filter(e => e !== k);

			if (sobj[k] !== undefined){
				if (Object.keys(E).length > 0){
					sobj[k] = Core.deleteOBJEdit(sobj[k], E);
				}
				else {
					//if (Array.isArray(sobj)) sobj = sobj.filter(e => e !== k);
					//else 
					delete sobj[k];
				}
			}
		}

		return sobj;
	}

	return undefined;
};


// Apply incoming patch to sid JSON
Core.applySceneEdit = (sid, patch, mode)=>{
	let sjpath = Core.getSceneJSONPath(sid);
	let S = Core.readSceneJSON(sid);

	if (S === undefined) return; // scene does not exist

	//jsonpatch.applyPatch(S, patch);

	if (mode === "DEL") S = Core.deleteOBJEdit(S, patch);
	else S = Core.addOBJEdit(S, patch);

	S = Core.cleanScene(S);

	fs.writeFileSync(sjpath, JSON.stringify(S)); // , null, 4

	//console.log(S);
	return S;
};

/*
Core.applySceneEdit = (M, sobj)=>{
	let sid  = M.sid;
	let data = M.data;
	let task = M.task;

	if (sid === undefined) return false;
	if (task === undefined) return false;

	let sjpath = Core.getSceneJSONPath(sid);
	let sobj = Core.readSceneJSON(sid);

	if (sobj === undefined) return false; // scene does not exist

	//if (task === "DEL") sobj = Core.deleteOBJEdit(sobj, patch);
	//if (task === "ADD") sobj = Core.addOBJEdit(sobj, patch);

	if (task === "UPD_SEM_NODE"){
		let nid     = data.nid;
		let content = data.content;
		if (nid === undefined) return;
		if (sobj.semanticgraph[nid] === undefined) sobj.semanticgraph[nid] = {}; // touch

		sobj.semanticgraph[nid] = content;
	}

	// write
	sobj = Core.cleanScene(sobj);
	fs.writeFileSync(sjpath, JSON.stringify(sobj)); // , null, 4

	//console.log(sobj);
	//return sobj;
	return true;
};
*/

Core.cleanScene = (sobj)=>{
	// semantic graph
	if (sobj.semanticgraph && sobj.semanticgraph.edges){
		for (let e in sobj.semanticgraph.edges){
			let children = sobj.semanticgraph.edges[e];

			for (let c in children){
				let nid = children[c];
				//console.log(nid);

				if (sobj.semanticgraph.nodes === undefined || sobj.semanticgraph.nodes[nid] === undefined){
					children.splice(c, 1);
				}
			}
		}
	}

	// scene-graph
	if (sobj.scenegraph && sobj.scenegraph.edges){
		for (let e in sobj.scenegraph.edges){
			let children = sobj.scenegraph.edges[e];

			for (let c in children){
				let nid = children[c];
				//console.log(nid);

				if (sobj.scenegraph.nodes === undefined || sobj.scenegraph.nodes[nid] === undefined){
					children.splice(c, 1);
				}
			}
		}
	}

	return sobj;
};

// Write scene JSON from sid and data
Core.writeSceneJSON = (sid, data, pub)=>{
	if (sid === undefined) return false;
	if (data === undefined) return false;

	Core.touchSceneFolder(sid);

	let sjpath = Core.getSceneJSONPath(sid);

	// Use partial update (first level)
/*
	if (bPartial){
		let S = Core.readSceneJSON(sid);
		//for (let k in data) S[k] = data[k];
		Object.assign(S,data);

		fs.writeFileSync(sjpath, JSON.stringify(S, null, 4));
		return;
	}
*/	
	fs.writeFileSync(sjpath, JSON.stringify(data, null, 4));
	if (pub){
		let pubfile = Core.getPubFilePath(sid);
		fs.writeFileSync(pubfile, "");
	}

	return true;
};

// Web-Apps
//=======================================
Core.getAppDataFolder = (wappid)=>{
	return path.join( Core.DIR_WAPPS, wappid+"/data");
};

Core.getAppJSONPath = (wappid, fid)=>{
	let jsonfile = Core.getAppDataFolder(wappid) + "/"+fid+".json";
	console.log(jsonfile);
	return jsonfile;
};

Core.readAppJSONData = (wappid, fid)=>{
	if (!fs.existsSync(Core.getAppDataFolder(wappid))) return undefined;

	let jsonfile = Core.getAppJSONPath(wappid, fid);
	if (!fs.existsSync(jsonfile)){
		fs.writeFileSync(jsonfile, "{}");
	}

	let S = JSON.parse(fs.readFileSync(jsonfile, 'utf8'));
	return S;
};

Core.wappDataEdit = (wappid, fid, patch, mode)=>{
	if (wappid === undefined) return undefined;
	if (fid === undefined) return undefined;

	let jdpath = Core.getAppJSONPath(wappid, fid);
	let D = Core.readAppJSONData(wappid, fid);

	if (D === undefined) return undefined; // data does not exist

	//jsonpatch.applyPatch(D, patch);

	if (mode === "DEL") D = Core.deleteOBJEdit(D, patch);
	else D = Core.addOBJEdit(D, patch);

	fs.writeFileSync(jdpath, JSON.stringify(D, null, 4));

	//console.log(D);
	return D;
};


Core.createClientUserAuthResponse = (req)=>{
	if (req.user === undefined) return {};

	let U = {};
	U.username = req.user.username;
	U.admin    = req.user.admin;
	U.webdav   = 8081;

	if (Core.config.services.webdav && Core.config.services.webdav.PORT) U.webdav = Core.config.services.webdav.PORT;

	return U;
};

/*
Core.initUsers = (configfile)=>{
	Core.users = Core.loadConfigFile(configfile);
	console.log("DB users: "+Core.users.length);
};
*/

Core.findByUsername = (username, cb)=>{
	process.nextTick( function(){
		// Load
		Core.users = Core.maat.getUsers(); //Core.loadConfigFile("users.json", Core.CONF_USERS);

		for (let i = 0, len = Core.users.length; i < len; i++){
			let U = Core.users[i];

			if (U.username === username) return cb(null, U);
		}

	return cb(null, null);
	});
};

Core.findById = (id, cb)=>{
	process.nextTick(()=>{
		Core.users = Core.maat.getUsers(); //Core.loadConfigFile("users.json", Core.CONF_USERS);

		if (Core.users[id]) cb(null, Core.users[id]);
		else cb( new Error('User ' + id + ' does not exist') );
	});
};

Core.setupPassport = ()=>{

    passport.use( new Strategy((username, password, cb)=>{
        Core.findByUsername(username, function(err, user) {
            if (err) return cb(err);
            if (!user) return cb(null, false);
            if (user.password != password) return cb(null, false);

            return cb(null, user);
        });
    }));

    passport.serializeUser((user, cb)=>{
        cb(null, Core.users.indexOf(user));
    });

    passport.deserializeUser((id, cb)=>{
        Core.findById(id, (err, user)=>{
            if (err) return cb(err);

            cb(null, user);
        });
    });

};

Core.realizeAuth = (app)=>{
	let fileStoreOptions = {
		fileExtension: ".ses"
	};

	let bodyParser = require('body-parser');
	app.use(bodyParser.json({ limit: '50mb' }));
	app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));

	//app.use(require('body-parser').urlencoded({ extended: true }));
	
	app.use(cookieParser());
	app.use(
		session({ 
			secret: 'shu',
			//cookie: { maxAge: 1800000 }, // 60000 = 1 min
			resave: true, 
			saveUninitialized: true,
			//rolling: true
			store: new FileStore(fileStoreOptions)	// required for consistency in cluster mode
		})
	);

	// Initialize Passport and restore authentication state, if any, from the session
    app.use(passport.initialize());
    app.use(passport.session());
};

// DATA
//================================================
Core.setupDataRoute = (app)=>{

	if (Core.config && Core.config.data){
		const D = Core.config.data;

		if (D.collections) Core.DIR_COLLECTIONS = D.collections;
		if (D.scenes)      Core.DIR_SCENES      = D.scenes;
	}

	app.get(/^\/collections\/(.*)$/, function(req,res,next){
		let path = req.params[0];

		// auth here if needed

		res.sendFile(Core.DIR_COLLECTIONS + path);
		//console.log(Core.DIR_COLLECTIONS + path);
		//next();
	});

	app.get(/^\/scenes\/(.*)$/, function(req,res,next){
		let path = req.params[0];

		// auth here if needed

		res.sendFile(Core.DIR_SCENES + path);
		//next();
	});
};

module.exports = Core;