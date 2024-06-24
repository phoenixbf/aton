/*!
    @preserve

 	ATON main API gateway (v1)
	This will be soon replaced by new API (v2)

 	@author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/
const fs          = require('fs');
const path        = require('path');
const nanoid      = require('nanoid');
const fsx         = require('fs-extra');
//const axios       = require('axios');
const fg          = require('fast-glob');
//const imagemin    = require('imagemin');
//const imageminPNGquant = require('imagemin-pngquant');
//const compress_images = require("compress-images")
const sharp       = require("sharp");

sharp.cache(false);



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

	res.send( Core.Maat.getPublicScenes() );

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
	let kk = Core.Maat.getScenesKeywords();
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
	
	let R = Core.Maat.getScenesByKeyword(kw);
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
	
	let R = Core.Maat.getScenesByKeyword(kw, uid);
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

	let scenefolder  = Core.getSceneFolder(sid);
	let coverfile    = path.join(scenefolder, "cover-high.png");
	let coverfileOpt = path.join(scenefolder, "cover.png");
	console.log(coverfile);

	fs.writeFile(coverfile, img, 'base64', (err)=>{
		//if (fs.existsSync(coverfileOpt)) fs.unlinkSync(coverfileOpt);

		// Optimize PNG size
		sharp(coverfile)
			//.resize({ width: 256, height: 256 })
			.withMetadata()
			.png({
				quality: 90, // 0-100
				//compression: 6, // this doesn't need to be set
			})
			.toFile(coverfileOpt, (err)=>{
				if (err) console.log(err);
				else {
					console.log('done');
					res.send(true);
				}
		}); 

/*
		imagemin([coverfile], {
			destination: scenefolder,
			plugins: [ imageminPNGquant({ quality: [0.1, 0.1] }) ]
		}).then(()=>{
			console.log("Cover compressed");
			res.send(true);
		});
*/
		//res.send(true);
	});
});

/**
	* @api {get} /api/cover/:sid	Get scene cover (image)
	* @apiGroup Scenes
	* @apiPermission none

	* @apiDescription Get cover image for given scene by providing Scene-ID
*/
app.get(/^\/api\/cover\/(.*)$/, (req,res,next)=>{
	let sid = req.params[0];

	let coverfile = path.join(Core.getSceneFolder(sid), "cover.png");

	if (!fs.existsSync(coverfile)){
		return res.sendFile(Core.DIR_RES+"scenecover.png");
	}

	res.sendFile(coverfile);

	//next();
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

	if (sid === undefined){
		res.send(false);
		return;
	}

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

	let J;
	let P = {};
	P.visibility = 1;

	if (vis==="public"){
		J = Core.applySceneEdit(sid, P, "ADD");
		res.json(vis);
	}
	else {
		J = Core.applySceneEdit(sid, P, "DEL");
		res.json(vis);
	}

/*
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
*/
	//res.send(false);
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
	
	//R.public = false;
	R.cover  = false;

	let basepath = Core.DIR_SCENES + sid;

	//let pubfile   = basepath+"/" + Core.STD_PUBFILE;
	let coverfile = basepath+"/" + Core.STD_COVERFILE;

	//if (fs.existsSync(pubfile))   R.public = true;
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
/*
	if (req.user.admin){
		res.send( Core.Maat.getAllScenes() );
		return;
	}
*/
	let uname = req.user.username;

	res.send( Core.Maat.getUserScenes(uname) );

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

	res.send( Core.Maat.getUserModels(uname) );

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

	res.send( Core.Maat.getUserPanoramas(uname) );

	//next();
});

/**
	* @api {get} /api/c/media	List media files
	* @apiGroup Collections
	* @apiPermission user

	* @apiDescription Retrieve all media (images, videos, audio) owned by currently authenticated user. Paths are relative to the local ATON collection
	* @apiSuccess {Array} list List of media
*/
app.get("/api/c/media/", (req,res,next)=>{
	if (req.user === undefined){
		res.send([]);
		return;
	}

	let uname = req.user.username;

	res.send( Core.Maat.getUserMedia(uname) );

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
	let wapps = Core.Maat.getApps();

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

	req.logout((err)=>{
		if (err) console.log(err);
		res.send(true);
	});
});

/**
	* @api {get} /api/user		User data
	* @apiGroup Users
	* @apiPermission user

	* @apiDescription Retrieve currently authenticated user information (object)
*/
app.get("/api/user", (req,res)=>{
	//console.log(req.session);

	let U = Core.createClientUserAuthResponse(req);

	res.send(U);
});


/**
	* @api {get} /api/users		List users
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
	for (let u in Core.users) uu.push({
		username: Core.users[u].username,
		admin: Core.users[u].admin
	});

	res.send(uu);
});


/**
	* @api {post} /api/new/user		New user
	* @apiGroup Users

	* @apiParam {String} username	Username or uid
	* @apiParam {String} password	Password
	* @apiParam {String} admin		Administrator

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
});

/**
	* @api {post} /api/delete/user	Delete user
	* @apiGroup Users

	* @apiParam {String} username	Username or uid

	* @apiPermission admin

	* @apiDescription Delete user (only admin)
*/
app.post('/api/delete/user', (req, res)=>{
	if (req.user === undefined || !req.user.admin){
		res.send(false);
		return;
	}

	// TODO: handle self-removal

	let O = req.body;

	let b = Core.deleteUser(O.username);
	res.send(b);
});


app.get("/api/stats", (req,res)=>{

	if (req.user === undefined || !req.user.admin){
		res.send({});
		return;
	}

	res.send( Core.Maat.getStats() );
});

};

module.exports = BaseAPI;