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
const { nanoid }  = require('nanoid');
const fsx         = require('fs-extra');
//const axios       = require('axios');
//const chokidar    = require('chokidar');
const fg          = require('fast-glob');
const chalk       = require('chalk');
const sharp       = require("sharp");

const { networkInterfaces } = require('os');

// Authentication
/*
let passport = require('passport');
let Strategy = require('passport-local').Strategy;
const cookieParser   = require('cookie-parser');
const session        = require('express-session');
const FileStore      = require('session-file-store')(session);
*/

// Local modules
const BaseAPI = require("./API/v1.js");
const Maat    = require("./maat/Maat.js");
//const User    = require("./User.js");


Core = {};

Core.DIR_DATA           = path.join(__dirname,"/../data/");
Core.DIR_WAPPS          = path.join(__dirname,"/../wapps/");
Core.DIR_PUBLIC         = path.join(__dirname,"/../public/");
Core.DIR_RES            = path.join(Core.DIR_PUBLIC,"res/");
Core.DIR_PRV            = path.join(__dirname, "_prv/");
Core.DIR_CONFIG         = path.join(__dirname, "/../config/");
Core.DIR_CONFIGPUB      = path.join(Core.DIR_CONFIG, "public/");
//Core.DIR_CUST_MODS    = path.join(Core.DIR_CONFIG,"modules/");
Core.DIR_CUST_CERTS     = path.join(Core.DIR_CONFIG,"certs/");
Core.DIR_NODE_MODULES   = path.join(__dirname, "/../node_modules");
//Core.DIR_APIDOC       = path.join(__dirname, "/../API/");
Core.DIR_FE             = path.join(Core.DIR_PUBLIC,"hathor/");
Core.DIR_BE             = path.join(Core.DIR_PUBLIC,"shu/");
Core.DIR_COLLECTIONS    = path.join(Core.DIR_DATA,"collections/"); //path.join(Core.DIR_PUBLIC,"collection/");
Core.DIR_SCENES         = path.join(Core.DIR_DATA,"scenes/");   //path.join(Core.DIR_PUBLIC,"scenes/");
Core.DIR_EXAMPLES       = path.join(Core.DIR_PUBLIC,"examples/");
Core.DIR_FLARES         = path.join(Core.DIR_CONFIG,"flares/"); //path.join(Core.DIR_PUBLIC,"custom/flares/");
Core.STD_SCENEFILE      = "scene.json";
Core.STD_PUBFILE        = "pub.txt"; // deprecated
Core.STD_COVERFILE_HI   = "cover.png";
Core.STD_COVERFILE      = "cover.jpg";
Core.STD_COVERSIZE      = 256;
Core.STD_COVERFILE_PATH = path.join(Core.DIR_RES,"scenecover.png");

// Unused
Core.STATUS_COMPLETE   = "complete";
Core.STATUS_PROCESSING = "processing";


Core.config  = undefined; // main config
Core.users   = [];        // users config

Core.SCENES_GLOB_OPTS = {
	cwd: Core.DIR_SCENES,
	follow: true,
	onlyFiles: true
};

Core.COLLECTIONS_GLOB_OPTS = {
	cwd: Core.DIR_COLLECTIONS,
	follow: true,
	onlyFiles: true
	//ignore: ["*/Data/*","*/tiles/*"]
};

Core.APPS_GLOB_OPTS = {
	cwd: Core.DIR_WAPPS,
	follow: true,
	onlyFiles: true
};

Core.FLARES_GLOB_OPTS = {
	cwd: Core.DIR_FLARES,
	follow: true,
	onlyFiles: true
};

// Modules setup
Core.realizeBaseAPI = BaseAPI;
//Core.passport       = passport; // set configured passport
Core.Maat           = Maat;

// LOG Utils
Core.logGreen = (str)=>{
	console.log(chalk.green(str));
};
Core.logYellow = (str)=>{
	console.log(chalk.yellow(str));
};


// Flares
Core.flares = {};

Core.setupFlares = (app)=>{
	if (!fs.existsSync(Core.DIR_FLARES)) return;

	// Collect all flares
	let plugins = fg.sync("**/flare.json", Core.FLARES_GLOB_OPTS);
	for (let f in plugins){
		let flarename = path.dirname(plugins[f]);
		let pp = Core.DIR_FLARES + plugins[f];

		//console.log(">> "+pp)

		let P = JSON.parse(fs.readFileSync(pp, 'utf8'));

		let fbasepath = Core.DIR_FLARES + flarename + "/";

		//Core.flares.push( flarename );

		// Client (public) components
/*
		if (P.client){
			for (let s in P.client.files) Core.FEScripts.push( "/flares/"+ flarename +"/"+ P.client.files[s] );
		}
*/
		// Server (private) components
		if (P.server){
			for (let m in P.server.modules){
				let mname = P.server.modules[m];
		
				const M = require(fbasepath + mname);
				if (M.init) M.init(app);
			}
		}

		if (P.respatterns && P.respatterns.length>2) Core.mpattern += ","+P.respatterns;

		Core.flares[flarename] = P;
	}

	console.log("\nFlares (plugins) found: ");
	console.log(Core.flares);
};

// Configs
//========================================
// Default main config
Core.CONF_MAIN = {
	name: "", // name (ID) of this istance (star)

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

		photon: {
			PORT: 8890,					// local Photon port
			address: "ws://localhost"
			//maxClientsPerSession: 50		// Max clients per scene
		},

		webdav: {
			PORT: 8081
		},

		maat: {
			PORT: 8891
		},

/*		Custom node modules (found in /config/modules/)
		custom_modules:[
			"myCustomModule.js"
		]
*/
	},

landing: {
    gallery: true,		// Show gallery (public scenes) in the landing page
    // new customization options:
    title: "ATON Framework",
    description: "ATON Framework - Immersive 3D Web Applications for Cultural Heritage",
    primaryColor: "#007bff",
    secondaryColor: "#6c757d", 
    backgroundColor: "#ffffff",
    textColor: "#333333",
    accentColor: "#28a745",
    showLogo: true,
    showFooter: true,
    theme: "default", // default, dark, light, custom
    layout: "grid" // grid, list, compact
},
    shu: {
        samples: true,
        apps: ["app_template"],	// List of apps to display
		staffpick: {}			// List of staff picked scene-IDs
    }
};

// Default users config
// NOTE: this is a sample users config, you'll need to provide your own
Core.CONF_USERS = [
	{ 
        username: "ra",
        password: "ra2020",
        admin: true
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
	Core.touchConfigFolders();

	Core.config = Core.loadConfigFile("main.json", Core.CONF_MAIN);
	Core.users  = Core.loadConfigFile("users.json", Core.CONF_USERS);

	// 3D models base formats
	Core.mpattern = "*.gltf,*.glb,*tileset.json,*.spz,*.splat,*.ksplat,meta.json,*.sog"; //,*-sogs.zip";

	// Panoramic content
	Core.panopattern = "*.jpg,*.hdr,*.exr,*.mp4,*.webm,*.m3u8";

	// Media
	Core.mediapattern = "*.jpg,*.png,*.mp4,*.webm,*.m3u8,*.wav,*.mp3";

	if (Core.config.data && Core.config.data.patterns && Core.config.data.patterns.models){
		Core.mpattern = Core.config.data.patterns.models;
		console.log("Custom models pattern: "+Core.mpattern);
	}
/*
	if (Core.config.landing.header){
		let srcpath = path.join(Core.DIR_CONFIG, Core.config.landing.header);
		fs.readFile(srcpath, 'utf8', (err, data)=>{
			if (err) throw err;

			Core.config.landing.header = data;
			console.log(data);
		});
	}
*/
	Core.touchUserCollectionFolders();

	//const maatport = (Core.config.services.maat)? Core.config.services.maat.PORT : 8891;
	//Core._maatEP = "http://localhost:"+maatport+"/";

	console.log("Num. users: "+Core.users.length);

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

	Core.Maat.init();

	// Directly from config
	Core.FEScripts = [];
	if (Core.config.hathor){
		for (let s in Core.config.hathor.scripts) Core.FEScripts.push(Core.config.hathor.scripts[s]);
	}

	//Core.populateFEScripts();
};

// Touch config folders
Core.touchConfigFolders = ()=>{
	if (!fs.existsSync(Core.DIR_CONFIG)) makeDir.sync(Core.DIR_CONFIG);

	if (!fs.existsSync(Core.DIR_FLARES)){
		try {
			makeDir.sync(Core.DIR_FLARES);
		} catch (e){
			console.log(e);
			return;
		}
	}
};

Core.loadConfigFile = (jsonfile, defconf)=>{
	let customconfig  = path.join(Core.DIR_CONFIG,jsonfile);

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


// SSL certs
Core.getCertPath = ()=>{
	let cpath = Core.config.services.main.pathCert;
	
	if (cpath && cpath.length>4) return cpath;
	return path.join(Core.DIR_CUST_CERTS,'server.crt');
};
Core.getKeyPath = ()=>{
	let cpath = Core.config.services.main.pathKey;

	if (cpath && cpath.length>4) return cpath;
	return path.join(Core.DIR_CUST_CERTS,'server.key');
};


// Users
//=======================================
Core.getUID = (U)=>{
	if (!U) return undefined;
	return U.username;
};

Core.createNewUser = (entry)=>{
	if (entry === undefined) return false;

	// Add new entry into users json
	Core.users = Core.loadConfigFile("users.json", Core.CONF_USERS);
	Core.users.push(entry);
	
	let uconfig = path.join(Core.DIR_CONFIG,"users.json");
	fs.writeFileSync(uconfig, JSON.stringify(Core.users, null, 4));

	Core.touchCollectionFolder(entry.username);

	console.log("Created new user: "+entry);

	return true;
};

//TODO:
Core.deleteUser = (uid)=>{
	if (uid === undefined) return false;

	Core.users = Core.loadConfigFile("users.json", Core.CONF_USERS);
	let num = Core.users.length;

	for (let u=0; u<num; u++){
		let U = Core.users[u];
		if (Core.getUID(U) === uid){
			Core.users.splice(u,1);

			let uconfig = path.join(Core.DIR_CONFIG,"users.json");
			fs.writeFileSync(uconfig, JSON.stringify(Core.users, null, 4));

			return true;
		}
	}

	return false;
};

Core.getUserCollectionFolder = (uid)=>{
	return path.join( Core.DIR_COLLECTIONS, uid );
};

Core.touchCollectionFolder = (uid)=>{
	if (uid === undefined) return;

	let dirColl = Core.getUserCollectionFolder(uid);

	if (!fs.existsSync(dirColl)){
		try {
			makeDir.sync(dirColl);
		} catch (e){
			console.log(e);
			return;
		}
	}

	let dirModels = path.join(dirColl,"/models/");
	let dirPano   = path.join(dirColl,"/pano/");
	let dirMedia  = path.join(dirColl,"/media/");

	if (!fs.existsSync(dirModels)){
		try {
			makeDir.sync(dirModels);
		} catch (e){
			console.log(e);
		}
	}

	if (!fs.existsSync(dirPano)){
		try {
			makeDir.sync(dirPano);
		} catch (e){
			console.log(e);
		}
	}

	if (!fs.existsSync(dirMedia)){
		try {
			makeDir.sync(dirMedia);
		} catch (e){
			console.log(e);
		}
	}

};

Core.touchUserCollectionFolders = ()=>{
	let len = Core.users.length;
	for (let i = 0; i < len; i++){
		let U = Core.users[i];

		Core.touchCollectionFolder( Core.getUID(U) );
	}
};

// Utils
//=======================================
Core.generateTodayString = ()=>{
    let today = new Date();

    let dd   = String( today.getDate() );
    let mm   = String( today.getMonth()+1 ); 
    let yyyy = String( today.getFullYear() );
    
	if(dd<10) dd = '0'+dd;
    if(mm<10) mm = '0'+mm;

	return yyyy+mm+dd;
};

// Readapted from: https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
Core.hashCodeFromString = (str)=>{
	let hash = 0, chr;
	let len = str.length;

	if (len === 0) return hash;

	for (let i = 0; i < len; i++) {
		chr = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + chr;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash.toString(16);
};

Core.hashCodeFromString2 = (str)=>{
	str = str.replaceAll(":","");
	str = str.replaceAll("/","");
	str = str.replaceAll(".","");

	str.replace(/[aeiouAEIOU]/g, '');
	console.log(str);
	return str;
};

// TODO: improve
Core.isURL3Dmodel = (itempath)=>{
	let mp = Core.mpattern;
	mp = mp.replaceAll("*","");

	let exts = mp.split(",");
	for (let e=0; e<exts.length; e++){
		if (itempath.endsWith( exts[e] )) return true;
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

// Deprecated
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
	let sid = Core.generateTodayString() + '-' + nanoid(10);
	return sid;
};

Core.createBasicScene = ()=>{
	let sobj = {};

	//sobj.status = Core.STATUS_COMPLETE;

	sobj.scenegraph = {};
	sobj.scenegraph.nodes = {};
	sobj.scenegraph.nodes.main = {};
	sobj.scenegraph.edges = {};
	sobj.scenegraph.edges["."] = ["main"];

	sobj.scenegraph.nodes.main.urls = [];

	console.log(sobj);

	return sobj;
};

Core.createBasicSceneFromModel = (user, mpath)=>{
	console.log(user,mpath)

	let sid = Core.hashCodeFromString(mpath);
	sid = sid.replace("-","m");
	sid = user + "/" + sid;

	if (Core.existsScene(sid)) return sid;

	let S = Core.createBasicScene();
	S.scenegraph.nodes.main.urls.push( mpath );

	Core.writeSceneJSON(sid, S);
	return sid;
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

	//let S = JSON.parse(fs.readFileSync(jspath, 'utf8'));

	let F = fs.readFileSync(jspath, 'utf8');
	let S = undefined;

	try {
		S = JSON.parse(F);
		return S;
	} catch(e) {
		console.log("ERROR malformed scene: ", sid);
		console.log(e);
		return undefined;
	}
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

	if (!S) return undefined; // scene does not exist or malformed

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
Core.writeSceneJSON = (sid, data, vis)=>{
	if (sid === undefined) return false;
	if (data === undefined) return false;

	Core.touchSceneFolder(sid);

	let sjpath = Core.getSceneJSONPath(sid);

	if (vis) data.visibility = vis;
	fs.writeFileSync(sjpath, JSON.stringify(data, null, 4));
/*
	if (pub){
		let pubfile = Core.getPubFilePath(sid);
		fs.writeFileSync(pubfile, "");
	}
*/
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

/*
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
*/

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

// IMG
Core.generateCoverForScene = (sid, b64img, onComplete)=>{
	if (!sid) return;

	let scenefolder  = Core.getSceneFolder(sid);
	let coverfile    = path.join(scenefolder, Core.STD_COVERFILE_HI);
	let coverfileOpt = path.join(scenefolder, Core.STD_COVERFILE);

	fs.writeFile(coverfile, b64img, 'base64', (err)=>{
		//if (fs.existsSync(coverfileOpt)) fs.unlinkSync(coverfileOpt);

		// Optimize PNG size
		sharp(coverfile)
			.resize({
				width: Core.STD_COVERSIZE, 
				height: Core.STD_COVERSIZE
			})
			.withMetadata()
/*
			.png({
				quality: 90, // 0-100
				//compression: 6, // this doesn't need to be set
			})
*/
			.jpeg({
				quality: 60
			})
			.toFile(coverfileOpt, (err)=>{
				if (err) console.log(err);
				else if (onComplete) onComplete();
		});
	});
};

module.exports = Core;