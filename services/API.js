/*!
    @preserve

 	ATON main REST API

 	@author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/
const fs          = require('fs');
const path        = require('path');
const nanoid      = require('nanoid');
const fsx         = require('fs-extra');
const axios       = require('axios');
const fg          = require('fast-glob');

let BaseAPI = (app)=>{

// Misc
//=========================================================

/**
	* @api {get} /api/examples
	* @apiGroup Misc
	* @apiPermission none

	* @apiDescription Retrieve list of developer examples
	* @apiSuccess {Array} list List of HTML indexes
*/
app.get("/api/examples/", function(req,res,next){
	let O = {};
	O.cwd = Core.DIR_EXAMPLES;
	//O.follow = true;
	
	let files = fg.sync("**/*.html", O);

	let S = [];
	for (let f in files) S.push(files[f]);

	res.send(S);

	//next();
});

/**
	* @api {get} /api/getid
	* @apiGroup Misc
	* @apiPermission none

	* @apiDescription Retrieve a general purpose unique ID
*/
app.get("/api/getid/", function(req,res,next){
	let id = nanoid.nanoid();
	res.json(id);
});

/**
	* @api {get} /api/landing
	* @apiGroup Misc

	* @apiDescription Retrieve ATON landing page rendering options
*/
app.get("/api/landing/", (req,res,next)=>{
	let o = {};
	if (Core.config.landing !== undefined) o = Core.config.landing;

	res.send(o);
});

// Collection
app.get(/^\/api\/collection\/(.*)$/, (req,res,next)=>{
	// TODO:
});


//=========================================================
// Scenes
//=========================================================

/**
	* @api {get} /api/scene/<scene-ID> Get scene descriptor
	* @apiGroup Scenes
	* @apiPermission none

	* @apiDescription Get scene descriptor (JSON) given a scene ID (e.g.: "samples/skyphos")
	* @apiSuccess {Object} sobj Scene descriptor (JSON)
*/
app.get(/^\/api\/scene\/(.*)$/, (req,res,next)=>{
	let sid = req.params[0];

	let sjsonpath = Core.getSceneJSONPath(sid);

	if (fs.existsSync(sjsonpath)){
		//console.log(sjsonpath);
		return res.sendFile(sjsonpath);
	}

	if (sid.startsWith("c/")){
		//TODO: generate temp. scene
	}

	//next();
});


/**
	* @api {get} /api/scenes/	List public scenes
	* @apiGroup Scenes
	* @apiPermission none

	* @apiDescription List all public scenes
	* @apiSuccess {Array} list scenes object list
*/
app.get("/api/scenes/", function(req,res,next){
/*
	Core.maatQuery("scenes/public", (R)=>{
		res.send(R);
	});
*/
	res.send( Core.maat.getPublicScenes() );

	//next();
});

/**
	* @api {get} /api/keywords 	List keywords
	* @apiGroup Scenes
	* @apiPermission none

	* @apiDescription Retrieve a weighted list of keywords for all scenes 
	* @apiSuccess {Array} list List of scenes
*/
app.get("/api/keywords", (req,res)=>{
	let kk = Core.maat.getScenesKeywords();
	res.send(kk);
});

/**
	* @api {get} /api/keyword/:kword	List public scenes by keyword
	* @apiGroup Scenes
	* @apiPermission none

	* @apiDescription List all public scenes matching with specific keyword 
	* @apiSuccess {Array} list List of scenes
*/
app.get("/api/keyword/:kw", (req,res)=>{
	let kw  = req.params.kw;
	
	let R = Core.maat.getScenesByKeyword(kw);
	res.send(R);
});

/**
	* @api {get} /api/keyword/:kword/own	List own scenes by keyword
	* @apiGroup Scenes
	* @apiPermission user

	* @apiDescription List all scenes by currently authenticated user, matching with specific keyword 
	* @apiSuccess {Array} list List of scenes
*/
app.get("/api/keyword/:kw/own", (req,res)=>{
	// Only auth users
	if (req.user === undefined){
		res.send(401);
		return;
	}

	let uid = req.user.username;
	let kw  = req.params.kw;
	
	let R = Core.maat.getScenesByKeyword(kw, uid);
	res.send(R);
});

/**
	* @api {post} /api/del/scene	Delete a scene
	* @apiGroup Scenes
	* @apiPermission user

	* @apiDescription Deletes a scene by providing scene-ID. Operation is possible only for authenticated users on their own scenes 
	* @apiSuccess {Boolean} bool True on success, false otherwise
*/
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

	// only own scenes
	let uname = req.user.username;
	if (!sid.startsWith(uname)){
		console.log("Only "+uname+" can delete this scene");
		res.send(false);
		return;
	}

	Core.deleteScene(sid);
	res.send(true);
});


/**
	* @api {post} /api/cover/scene	Set scene cover
	* @apiGroup Scenes
	* @apiPermission user

	* @apiDescription Set a cover image for given scene by providing base64 img
	* @apiSuccess {Boolean} bool True on success, false otherwise
*/
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


/**
	* @api {post} /api/edit/scene Patch (edit) scene
	* @apiGroup Scenes
	* @apiPermission user

	* @apiDescription Send a scene JSON patch (add or remove)
*/
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

/**
	* @api {post} /api/visibility/scene Set scene visibility
	* @apiGroup Scenes
	* @apiPermission user

	* @apiDescription Change a scene visibility (public or private)
*/
app.post('/api/visibility/scene', (req, res) => {

	// Only auth users
	if (req.user === undefined){
		res.send(false);
		return;
	}

	let O = req.body;
	let sid = O.sid;
	let vis = O.vis;

	if (sid === undefined || vis === undefined){
		res.send(false);
		return;
	}

	// only own scenes
	let uname = req.user.username;
	if (!sid.startsWith(uname)){
		res.send(false);
		return;
	}

	let pubfile = Core.getPubFilePath(sid);

	if (vis === "public"){
		if (!fs.existsSync(pubfile)) fs.writeFileSync(pubfile, "");
		res.json(vis);
		return;
	}
	if (vis === "private"){
		if (fs.existsSync(pubfile)) fs.unlinkSync(pubfile);
		res.json(vis);
		return;
	}

	res.send(false);
});

// Scene clone
app.post('/api/clone/scene', (req, res) => {
	// Only auth users
	if (req.user === undefined){
		res.send(false);
		return;
	}

	let uname = req.user.username;
	if (uname === undefined) return false;

	let O = req.body;
	let sid = O.sid;

	if (sid.endsWith("/")) sid = sid.slice(0, -1);
	let parent = path.dirname(sid);

	let newsid = uname+"/"+Core.generateUserSID();

	fsx.copy(Core.DIR_SCENES+sid, Core.DIR_SCENES+newsid, (err)=>{
		if (err){
			console.log(err);
			res.send(false);
			return;
		}
	});
	
	res.json(newsid);
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


// TODO:
app.get(/^\/api\/info\/scene\/(.*)$/, (req,res,next)=>{
	let R = {};

	let sid = req.params[0];

	let sjpath = Core.getSceneJSONPath(sid);
	if (!fs.existsSync(sjpath)){
		res.send(R);
		return;
	}
	
	R.public = false;
	R.cover  = false;

	let basepath = Core.DIR_SCENES + sid;

	let pubfile   = basepath+"/" + Core.STD_PUBFILE;
	let coverfile = basepath+"/" + Core.STD_COVERFILE;

	if (fs.existsSync(pubfile))   R.public = true;
	if (fs.existsSync(coverfile)) R.cover  = true;

	res.send(R);
});


/**
	* @api {get} /api/scenes/own List own scenes
	* @apiGroup Scenes
	* @apiPermission user

	* @apiDescription Retrieve currently authenticated user scenes
	* @apiSuccess {Array} list Scenes
*/
app.get("/api/scenes/own/", (req,res,next)=>{
	if (req.user === undefined){
		res.send([]);
		return;
	}

	let uname = req.user.username;
/*
	Core.maatQuery("scenes/byuser/"+uname, (R)=>{
		res.send(R);
	});
*/
	res.send( Core.maat.getUserScenes(uname) );

	//next();
});


//=========================================================
// Collections
//=========================================================

/**
	* @api {get} /api/c/models	List 3D models
	* @apiGroup Collections
	* @apiPermission user

	* @apiDescription Retrieve all 3D models owned by currently authenticated user. Paths are relative to the local ATON collection
	* @apiSuccess {Array} list List of 3D models
*/
app.get("/api/c/models/", (req,res,next)=>{

	if (req.user === undefined){
		res.send([]);
		return;
	}

	let uname = req.user.username;

	res.send( Core.maat.getUserModels(uname) );

	//next();
});


/**
	* @api {get} /api/c/panoramas	List panoramas
	* @apiGroup Collections
	* @apiPermission user

	* @apiDescription Retrieve all panoramas (360 images and videos) owned by currently authenticated user. Paths are relative to the local ATON collection
	* @apiSuccess {Array} list List of panoramas
*/
app.get("/api/c/panoramas/", (req,res,next)=>{
	if (req.user === undefined){
		res.send([]);
		return;
	}

	let uname = req.user.username;

	res.send( Core.maat.getUserPanoramas(uname) );

	//next();
});


//=========================================================
// Web-apps
//=========================================================

/**
	* @api {get} /api/wapps Get list of web-apps
	* @apiGroup Apps
	* @apiPermission none

	* @apiDescription Retrieve list of web-apps currently deployed on the ATON instance
	* @apiSuccess {Array} list List of web-apps
*/
app.get("/api/wapps/", (req,res,next)=>{
	let O = {};
	O.cwd = Core.DIR_WAPPS;
	O.follow = true;

	let wapps = [];

	let files = fg.sync("**/index.html", O);
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
	let fid    = O.fid;
	let patch  = O.data;
	let mode   = O.mode;

	let J = Core.wappDataEdit(wappid, fid, patch, mode);

	res.json(J);
});

app.post('/api/new/wapp', (req, res) => {
	let O = req.body;
	let wappid = O.wappid;
	
	// TODO:
});



//=========================================================
// Users
//=========================================================

/**
	* @api {post} /api/login Login
	* @apiGroup Users

	* @apiParam {String} username	Username or uid
	* @apiParam {String} password	Password

	* @apiDescription Login through username and password
*/
app.post('/api/login', Core.passport.authenticate('local'/*, { failureRedirect: '/login' }*/), (req, res)=>{

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

/**
	* @api {get} /api/logout Logout
	* @apiGroup Users

	* @apiDescription Logout
*/
app.get('/api/logout', (req, res)=>{
	console.log(req.user);

	req.logout();
	res.send(true);
});

/**
	* @api {get} /api/user User data
	* @apiGroup Users
	* @apiPermission user

	* @apiDescription Retrieve currently authenticated user information (object)
*/
app.get("/api/user", (req,res)=>{
	console.log(req.session);

	let U = Core.createClientUserAuthResponse(req);

	res.send(U);
});


/**
	* @api {get} /api/users
	* @apiGroup Users
	* @apiPermission admin

	* @apiDescription Retrieve list of all users (only admin)
*/
app.get("/api/users", (req,res)=>{

	if (req.user === undefined || !req.user.admin){
		res.send([]);
		return;
	}

	let uu = [];
	for (let u in Core.users) uu.push(Core.users[u].username);

	res.send(uu);
});


/**
	* @api {post} /api/new/user
	* @apiGroup Users
	* @apiPermission admin

	* @apiDescription Create a new user (only admin)
*/
app.post('/api/new/user', (req, res) => {
	if (req.user === undefined || !req.user.admin){
		res.send(false);
		return;
	}

	let O = req.body;
	console.log(O);

	let b = Core.createNewUser(O);
	res.send(b);

	// Add new entry into users json
/*
	Core.users = Core.loadConfigFile("users.json", Core.CONF_USERS);
	Core.users.push(O);
	let uconfig = path.join(Core.DIR_CONFIG + "users.json");
	fs.writeFileSync(uconfig, JSON.stringify(Core.users, null, 4));

	res.send(true);
*/
});


};

module.exports = BaseAPI;