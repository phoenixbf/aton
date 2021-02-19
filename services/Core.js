/*!
    @preserve

 	ATON Core service routines

 	@author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/
const fs          = require('fs');
const path        = require('path');
const glob        = require("glob");
const jsonpatch   = require('fast-json-patch');
const del         = require('del');
const makeDir     = require('make-dir');
const nanoid      = require('nanoid');
const fsx         = require('fs-extra');

var passport = require('passport');
var Strategy = require('passport-local').Strategy;

const cookieParser   = require('cookie-parser');
const session        = require('express-session');
const FileStore      = require('session-file-store')(session);


Core = {};

Core.DIR_PUBLIC       = path.join(__dirname,"/../public/");
Core.DIR_PRV          = path.join(__dirname, "_prv/");
Core.DIR_NODE_MODULES = path.join(__dirname, "/../node_modules");
Core.DIR_APIDOC       = path.join(__dirname, "/../API/");
Core.DIR_FE           = path.join(Core.DIR_PUBLIC,"hathor/");
Core.DIR_BE           = path.join(Core.DIR_PUBLIC,"shu/");
Core.DIR_COLLECTION   = path.join(Core.DIR_PUBLIC,"collection/");
Core.DIR_SCENES       = path.join(Core.DIR_PUBLIC,"scenes/");
Core.DIR_WAPPS        = path.join(Core.DIR_PUBLIC,"wapps/");
Core.DIR_EXAMPLES     = path.join(Core.DIR_PUBLIC,"examples/");
Core.STD_SCENEFILE    = "scene.json";
Core.STD_PUBFILE      = "pub.txt";
Core.STD_COVERFILE    = "cover.png";

Core.STATUS_COMPLETE   = "complete";
Core.STATUS_PROCESSING = "processing";


Core.config = undefined; // main config
Core.users  = [];        // users config


// Main init routine
Core.init = ()=>{
	if (!fs.existsSync(Core.DIR_PRV)) makeDir.sync(Core.DIR_PRV);

	Core.config = Core.loadConfigFile("config.json");
	Core.users  = Core.loadConfigFile("config-users.json");

	console.log("DB users: "+Core.users.length);
};

// Routine for loading custom -> default fallback config JSON files
Core.loadConfigFile = (jsonfile)=>{
	let customconfig  = path.join(Core.DIR_PRV + jsonfile);
	let defaultconfig = path.join(__dirname, jsonfile);

	if (fs.existsSync(customconfig)){
		let C = JSON.parse(fs.readFileSync(customconfig, 'utf8'));
		console.log("Found custom config "+jsonfile);
		return C;
	}

	// Custom config does not exist...
	console.log(jsonfile+" not found in '_prv/', Loading default...");
	let C = JSON.parse(fs.readFileSync(defaultconfig, 'utf8'));

	// Create custom config from default
	fs.writeFileSync(customconfig, JSON.stringify(C, null, 4));
	return C;
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
Core.getWAppJSONPath = (wappid)=>{
	let jsonfile = path.join( Core.DIR_WAPPS, wappid + "/data.json");
	return jsonfile;
};

Core.readWAppJSONData = (wappid)=>{
	let jsonfile = Core.getWAppJSONPath(wappid);
	if (!fs.existsSync(jsonfile)) return undefined;

	let S = JSON.parse(fs.readFileSync(jsonfile, 'utf8'));
	return S;
};

Core.wappDataEdit = (wappid, patch, mode)=>{
	let jdpath = Core.getWAppJSONPath(wappid);
	let D = Core.readWAppJSONData(wappid);

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

	return U;
};

/*
Core.initUsers = (configfile)=>{
	Core.users = Core.loadConfigFile(configfile);
	console.log("DB users: "+Core.users.length);
};
*/

Core.findByUsername = (username, cb)=>{
	process.nextTick(function() {
		for (let i = 0, len = Core.users.length; i < len; i++){
			let U = Core.users[i];

			if (U.username === username) return cb(null, U);
		}

	return cb(null, null);
	});
};

Core.findById = (id, cb)=>{
	process.nextTick(()=>{
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

    passport.deserializeUser(function(id, cb) {
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



// API
//================================================
Core.realizeBaseAPI = (app)=>{
	// Get ID
	app.get("/api/getid/", function(req,res,next){
		let id = nanoid.nanoid();
		res.send(id);
	});

	// /api/scene/<SID>
	app.get(/^\/api\/scene\/(.*)$/, function(req,res,next){
		let args = req.params[0].split(',');

		let bEdit = (args[1] && args[1] === "edit")? true : false; // Edit mode
		let sid = args[0];

		let sjsonpath = Core.getSceneJSONPath(sid);

		if (fs.existsSync(sjsonpath)){
			//console.log(sjsonpath);
			return res.sendFile(sjsonpath);
		}

		// look into models collection and build scene FIXME:
		let mfolder = path.join(Core.DIR_COLLECTION,sid)+"/";
		let O = {};
		O.cwd = mfolder;

		glob("*.{gltf,glb}", O, (err, files)=>{ // "**/*.gltf"

			// build scene json
			let sobj = Core.createBasicScene();

			if (sid.startsWith("models/")){
				for (let f in files) sobj.scenegraph.nodes.main.urls.push(sid+"/"+files[f]);
			}

			if (bEdit) Core.writeSceneJSON(sid, sobj);

			console.log(sobj);

			return res.send(sobj);
		});

		//next();
	});

	// Back-end (SHU)
/*
	app.get("/be/newscene/", (req,res,next)=>{
		if (req.user === undefined){
			res.sendFile(path.join(Core.DIR_BE, "auth/index.html"));
			return;
		}

		res.sendFile(path.join(Core.DIR_BE,"newscene/index.html"));
	});
*/

	// Landing page opts
	app.get("/api/landing/", function(req,res,next){
		let o = {};
		if (Core.config.landing !== undefined) o = Core.config.landing;

		res.send(o);
	});

	// List all public scenes
	app.get("/api/scenes/", function(req,res,next){
		let O = {};
		O.cwd = Core.DIR_SCENES;
		O.follow = true;
		
		let files = glob.sync("**/"+Core.STD_SCENEFILE, O);

		let S = [];
		for (let f in files){
			let basepath  = path.dirname(files[f]);
			let pubfile   = Core.DIR_SCENES + basepath+"/" + Core.STD_PUBFILE;
			let coverfile = Core.DIR_SCENES + basepath+"/" + Core.STD_COVERFILE;

			if (fs.existsSync(pubfile)){
				let O = {};
				O.sid = basepath;
				O.cover = fs.existsSync(coverfile)? true : false;

				let sobj = Core.readSceneJSON(O.sid);

				if (sobj.title) O.title = sobj.title;

				S.push(O);
			}
		}

		res.send(S);

		//next();
	});

	// List own scenes (authenticated user)
	app.get("/api/scenes/own/", function(req,res,next){
		if (req.user === undefined){
			res.send([]);
			return;
		}

		let uname = req.user.username;

		let O = {};
		O.cwd = Core.DIR_SCENES+uname;
		O.follow = true;
		
		let files = glob.sync("**/"+Core.STD_SCENEFILE, O);

		let S = [];
		for (let f in files){
			let basepath  = uname+"/"+path.dirname(files[f]);
			let pubfile   = Core.DIR_SCENES + basepath+"/" + Core.STD_PUBFILE;
			let coverfile = Core.DIR_SCENES + basepath+"/" + Core.STD_COVERFILE;

			S.push({
				sid: basepath,
				cover: fs.existsSync(coverfile)? true : false,
				pub: fs.existsSync(pubfile)? true : false
			});
		}

		res.send(S);

		//next();
	});

	// List all collection models
	app.get("/api/c/models/", function(req,res,next){

		if (req.user === undefined){
			res.send([]);
			return;
		}

		let uname   = req.user.username;
		//let relpath = "models/"+uname+"/";
		let relpath = uname+"/models/";

		let O = {};
		O.cwd = Core.DIR_COLLECTION+relpath; //Core.DIR_MODELS+uname;
		O.follow = true;

		let files = glob.sync("**/*.{gltf,glb}", O);

		let M = [];
		for (let f in files) M.push( relpath + files[f] );

		res.send(M);

		//next();
	});

	// List all collection panoramas
	app.get("/api/c/panoramas/", function(req,res,next){
		if (req.user === undefined){
			res.send([]);
			return;
		}

		let uname   = req.user.username;
		//let relpath = "pano/"+uname+"/";
		let relpath = uname+"/pano/";

		let O = {};
		O.cwd = Core.DIR_COLLECTION+relpath; //Core.DIR_PANO+uname;
		O.follow = true;

		let files = glob.sync("**/*.{jpg,mp4,webm}", O); // hdr

		let P = [];
		for (let f in files) P.push( relpath + files[f] );

		res.send(P);
		
		//glob("**/*.{jpg,hdr}", O, (err, files)=>{ });

		//next();
	});

	// Web-apps
	//=========================================================
	app.get("/api/wapps/", (req,res,next)=>{
		let O = {};
		O.cwd = Core.DIR_WAPPS;
		O.follow = true;

		let wapps = [];

		let files = glob.sync("**/*.html", O);
		for (let f in files){
			let wid = path.dirname(files[f]);
			let appicon = path.join(Core.DIR_WAPPS+wid, "/appicon.png");

			wapps.push({
				wappid: wid,
				icon: fs.existsSync(appicon)? true : false
			});
		}

		res.send(wapps);
	});

	app.post('/api/patch/wapp', (req, res) => {
		let O = req.body;
		let wappid = O.wappid;
		let patch  = O.data;
		let mode   = O.mode;

		let J = Core.wappDataEdit(wappid, patch, mode);

		res.json(J);
	});

	app.post('/api/new/wapp', (req, res) => {
		let O = req.body;
		let wappid = O.wappid;
		
		// TODO:
	});

	// List examples
	app.get("/api/examples/", function(req,res,next){
		let O = {};
		O.cwd = Core.DIR_EXAMPLES;
		//O.follow = true;
		
		let files = glob.sync("**/*.html", O);

		let S = [];
		for (let f in files) S.push(files[f]);

		res.send(S);

		//next();
	});

	// Delete a scene
	app.post("/api/del/scene/", (req,res,next)=>{
		let O = req.body;
		let sid = O.sid;

		if (sid === undefined){
			res.send(false);
			return;	
		}

		// Only auth users can delete a scene
		if (req.user === undefined){
			console.log("Only auth users can delete a scene");
			res.send(false);
			return;
		}

		let uname = req.user.username;
		if (!sid.startsWith(uname)){ // only own scenes
			console.log("Only "+uname+" can delete this scene");
			res.send(false);
			return;
		}

		Core.deleteScene(sid);
		res.send(true);
	});

	// Set scene cover
	app.post("/api/cover/scene/", (req,res,next)=>{
		let O = req.body;
		let sid = O.sid;
		let img = O.img;

		if (sid === undefined || img === undefined){
			res.send(false);
			return;
		}

		// Only auth users can delete a scene
		if (req.user === undefined){
			res.send(false);
			return;
		}

		img = img.replace(/^data:image\/png;base64,/, "");

		let coverfile = path.join(Core.getSceneFolder(sid), "cover.png");
		console.log(coverfile);

		fs.writeFile(coverfile, img, 'base64', (err)=>{
			res.send(true);
		});
	});

	// Scene patch (add or remove)
	app.post('/api/edit/scene', (req, res) => {
		// Only auth users
		if (req.user === undefined){
			res.send(false);
			return;
		}

		let O = req.body;
		let sid   = O.sid;
		let mode  = O.mode;
		let patch = O.data;

		let J = Core.applySceneEdit(sid, patch, mode);

		res.json(J);
	});

	// New Scene
	app.post('/api/new/scene', (req, res) => {
		// Only auth users
		if (req.user === undefined){
			res.send(false);
			return;
		}

		let O = req.body;
		let sid  = O.sid;
		let data = O.data;
		let pub  = O.pub;

		console.log(O);

		//Core.touchSceneFolder(sid);
		let r = Core.writeSceneJSON(sid, data, pub);

		res.json(r);
	});

	// Authenticate
	app.post('/api/login', passport.authenticate('local'/*, { failureRedirect: '/login' }*/), (req, res)=>{

		let U = Core.createClientUserAuthResponse(req);

		res.send(U);
	});
	/*
	app.post("/api/login", (req,res,next)=>{
		passport.authenticate('local', function(err, user, info) {

			if (err){
				console.log(err);
				return next(err);
			}

			if (!user) {
				return res.status(401).json({
					err: info
				});
			}

			req.logIn(user, function(err){

				if (err) {
					console.log(err);
					return res.status(500).json({
						err: 'Could not log in user'
					});
				}

				res.status(200).json({
					status: 'Login successful!'
				});

			});
		})(req, res, next);
	});
	*/

	app.get('/api/logout', (req, res)=>{
		console.log(req.user);

		req.logout();
		res.send(true);
	});

	app.get("/api/user", (req,res)=>{
		console.log(req.session);

		let U = Core.createClientUserAuthResponse(req);
		res.send(U);
	});

	// List all users in DB (only admin)
	app.get("/api/users", (req,res)=>{

		if (req.user === undefined || !req.user.admin){
			res.send([]);
			return;
		}

		let uu = [];
		for (let u in Core.users) uu.push(Core.users[u].username);

		res.send(uu);
	});

	app.post('/api/new/user', (req, res) => {
		if (req.user === undefined || !req.user.admin){
			res.send(false);
			return;
		}

		let O = req.body;
		console.log(O);

		// Add new entry into users json
		Core.users.push(O);
		let uconfig = path.join(Core.DIR_PRV + "config-users.json");
		fs.writeFileSync(uconfig, JSON.stringify(Core.users, null, 4));

		res.send(true);
	});

};


// Not used
/*
Core.userLogin = (id)=>{
	let sessionfile = Core.DIR_PRV + "s-"+id+".json";
	if (!fs.existsSync(sessionfile)) fs.writeFileSync(sessionfile, "");
};

Core.userLogout = (id)=>{
	let sessionfile = Core.DIR_PRV + "s-"+id+".json";
	if (!fs.existsSync(sessionfile)) fs.unlinkSync(sessionfile);
};
*/

module.exports = Core;