/*!
    @preserve

 	ATON Main Service

 	@author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/

const fs          = require('fs');
const express     = require('express');
const http        = require('http');
const https       = require('https');
const url         = require('url');
const compression = require('compression');
const path        = require('path');
const cors        = require('cors');
const glob        = require("glob");
const { createProxyMiddleware } = require('http-proxy-middleware');

var passport = require('passport');
var Strategy = require('passport-local').Strategy;

//const basicAuth = require('express-basic-auth');
const ServUtils   = require('./ServUtils');


// Loads config
let aConfig = ServUtils.loadConfigFile("config.json");
let users   = ServUtils.loadConfigFile("users.json");


const PORT            = aConfig.services.main.PORT || 8080;
const PORT_SECURE     = aConfig.services.main.PORT_S || 8083;
const PORT_ATONIZER   = aConfig.services.atonizer.PORT || 8085;
const PORT_VRC        = aConfig.services.vroadcast.PORT || 8890;
//const PORT_VRC_SECURE = aConfig.services.vroadcast.PORT_S || 8891;

const pathCert = ServUtils.getCertPath();
const pathKey  = ServUtils.getKeyPath();

// Debug on req received (client)
let logger = function(req, res, next){
    console.log('Request from: ' + req.ip + ' For: ' + req.path);
    next(); // Run the next handler
};


let app = express();

app.use(compression());
app.use(cors({credentials: true, origin: true}));

/*
    app.use((req, res, next)=>{
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });
*/

app.use(express.json());

app.use('/', express.static(ServUtils.DIR_PUBLIC));
app.use('/mods', express.static(ServUtils.DIR_NODE_MODULES));
app.use('/apidoc', express.static(ServUtils.DIR_APIDOC));


// Passport
findByUsername = (username, cb)=>{
	//let users = usersDB

	process.nextTick(function() {
		for (let i = 0, len = users.length; i < len; i++){
			let U = users[i];
			if (U.username === username) {
			return cb(null, U);
			}
		}
	return cb(null, null);
	});
};

findById = (id, cb)=>{
	process.nextTick(()=>{
		if (users[id]) cb(null, users[id]);
		else cb(new Error('User ' + id + ' does not exist'));
	});
};

passport.use( new Strategy((username, password, cb)=>{
	findByUsername(username, function(err, user) {
		if (err) { return cb(err); }
		if (!user) { return cb(null, false); }
		if (user.password != password) { return cb(null, false); }
		return cb(null, user);
	});
}));

passport.serializeUser((user, cb)=>{
	cb(null, users.indexOf(user));
});

passport.deserializeUser(function(id, cb) {
	findById(id, (err, user)=>{
		if (err) { return cb(err); }
		cb(null, user);
	});
});

app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'aton shu', resave: false, saveUninitialized: false }));

// Initialize Passport and restore authentication state, if any, from the session
app.use(passport.initialize());
app.use(passport.session());



// All routing here
app.get(/^\/s\/(.*)$/, function(req,res,next){
	let sid = req.params[0];

	res.redirect(url.format({
		pathname:"/fe",
		query: { "s": sid }
	}));

	next();
});

// API
//=======================================================
// /api/scenes/<SID>
app.get(/^\/api\/scene\/(.*)$/, function(req,res,next){
	let args = req.params[0].split(',');

	let bEdit = (args[1] && args[1] === "edit")? true : false; // Edit mode
	let sid = args[0];

	let sjsonpath = ServUtils.getSceneJSONPath(sid);

	if (fs.existsSync(sjsonpath)){
		//console.log(sjsonpath);
		return res.sendFile(sjsonpath);
	}

	// look into models collection and build scene
	let mfolder = path.join(ServUtils.DIR_COLLECTION,sid)+"/";
	let O = {};
	O.cwd = mfolder;

	glob("*.gltf", O, (err, files)=>{ // "**/*.gltf"

		// build scene json
		let sobj = ServUtils.createBasicScene();

		if (sid.startsWith("models/")){
			for (let f in files) sobj.scenegraph.nodes.main.urls.push(sid+"/"+files[f]);
		}

		if (bEdit) ServUtils.writeSceneJSON(sid, sobj);

		console.log(sobj);

		return res.send(sobj);
	});

	//next();
});

// List all published scenes
app.get("/api/scenes/", function(req,res,next){
	let O = {};
	O.cwd = ServUtils.DIR_SCENES;
	O.follow = true;
	
	let files = glob.sync("**/"+ServUtils.STD_SCENEFILE, O);

	let S = [];
	for (let f in files){
		let basepath = path.dirname(files[f]);
		let pubfile  = ServUtils.DIR_SCENES + basepath+"/" + ServUtils.STD_PUBFILE;

		if (fs.existsSync(pubfile)) S.push( basepath );
	}

	res.send(S);

	//next();
});
// List all collection models
app.get("/api/c/models/", function(req,res,next){
	let O = {};
	O.cwd = ServUtils.DIR_MODELS;
	O.follow = true;

	let files = glob.sync("**/*.{gltf,glb}", O);

	let M = [];
	for (let f in files) M.push( "models/"+files[f] );

	res.send(M);

	//next();
});
// List all collection panoramas
app.get("/api/c/panoramas/", function(req,res,next){
	let O = {};
	O.cwd = ServUtils.DIR_PANO;
	O.follow = true;

	let files = glob.sync("**/*.{jpg,hdr}", O);

	let P = [];
	for (let f in files) P.push( "pano/"+files[f] );

	res.send(P);
	
	//glob("**/*.{jpg,hdr}", O, (err, files)=>{ });

	//next();
});

// List examples
app.get("/api/examples/", function(req,res,next){
	let O = {};
	O.cwd = ServUtils.DIR_EXAMPLES;
	//O.follow = true;
	
	let files = glob.sync("**/*.html", O);

	let S = [];
	for (let f in files) S.push(files[f]);

	res.send(S);

	//next();
});



// Scene edit (add or remove)
app.post('/api/edit/scene', (req, res) => {
	// TODO: only auth users

    let O = req.body;
	let sid   = O.sid;
	let mode  = O.mode;
	let patch = O.data;

	let J = ServUtils.applySceneEdit(sid, patch, mode);

	res.json(J);
});

// New Scene
app.post('/api/new/scene', (req, res) => {
	// TODO: only auth users

    let O = req.body;
	let sid  = O.sid;
	let data = O.data;
	let pub  = O.pub;

	console.log(O);

	//ServUtils.touchSceneFolder(sid);
	let r = ServUtils.writeSceneJSON(sid, data, pub);

	res.json(r);
});

// Authenticate
app.post('/api/login', passport.authenticate('local'/*, { failureRedirect: '/login' }*/), (req, res)=>{ 
	res.send(req.user);
});

app.get('/api/logout', (req, res)=>{
	req.logout();
	res.send(true);
});

app.get("/api/user", (req,res)=>{
	res.send(req.user);
});

// Micro-services proxies
//=================================================
/*
// Atonizer
app.use('/atonizer', createProxyMiddleware({ 
	target: aConfig.services.atonizer.address+":"+PORT_ATONIZER, 
	pathRewrite: { '^/atonizer': ''},
	//changeOrigin: true 
}));
*/

// VRoadcast
app.use('/vrc', createProxyMiddleware({ 
	target: aConfig.services.vroadcast.address+":"+PORT_VRC, 
	ws: true, 
	pathRewrite: { '^/vrc': ''},
	changeOrigin: true
}));
app.use('/svrc', createProxyMiddleware({ 
	target: aConfig.services.vroadcast.address+":"+PORT_VRC, 
	ws: true, 
	pathRewrite: { '^/svrc': ''},
	secure: true,
	changeOrigin: true 
}));


// START
//==================================

//let bSSL = false;

http.createServer(app).listen(PORT, ()=>{ 
	console.log('ATON main service running on :' + PORT);
});
    

// HTTPS service
if (fs.existsSync(pathCert) && fs.existsSync(pathKey)){
	let httpsOptions = {
		key: fs.readFileSync(pathKey, 'utf8'),
		cert: fs.readFileSync(pathCert, 'utf8')
		};

        //bSSL = true;

	https.createServer(httpsOptions, app).listen(PORT_SECURE, ()=>{ 
		console.log('HTTPS ATON main service running on :' + PORT_SECURE);
		});
	}
else {
	//bSSL = false;
	console.log("SSL certs not found: "+pathKey+", "+pathCert);
}