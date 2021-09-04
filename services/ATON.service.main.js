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
//const compression = require('compression');
const path        = require('path');
const cors        = require('cors');
const chalk       = require('chalk');

const glob   = require("glob");
const nanoid = require("nanoid");
const { createProxyMiddleware } = require('http-proxy-middleware');

const Core = require('./Core');


// Initialize & load config files
Core.init();

const CONF = Core.config;

// Standard PORTS
let PORT        = 8080;
let PORT_SECURE = 8083;
let PORT_VRC    = 8890;
let PORT_WEBDAV = 8081;

if (CONF.services.main.PORT) 
	PORT = CONF.services.main.PORT;
	
if (process.env.PORT)
	PORT = process.env.PORT;

if (CONF.services.main.PORT_S)
	PORT_SECURE = CONF.services.main.PORT_S;

if (CONF.services.vroadcast.PORT)
	PORT_VRC = CONF.services.vroadcast.PORT;

if (CONF.services.webdav && CONF.services.webdav.PORT)
	PORT_WEBDAV = CONF.services.webdav.PORT;

const pathCert = Core.getCertPath();
const pathKey  = Core.getKeyPath();

let bExamples = CONF.services.main.examples;
//let bAPIdoc   = CONF.services.main.apidoc;

// Debug on req received (client)
let logger = function(req, res, next){
    console.log('Request from: ' + req.ip + ' For: ' + req.path);
    next(); // Run the next handler
};


let app = express();

//app.set('trust proxy', 1); 	// trust first proxy

//app.use(compression());
app.use(cors({credentials: true, origin: true}));

/*
    app.use((req, res, next)=>{
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });
*/

app.use(express.json({ limit: '50mb' }));

// EJS
app.set('view engine', 'ejs');
app.set('views', __dirname+"/views/");

app.get(/^\/h\/(.*)$/, (req,res,next)=>{
	let d = {};
	d.sid   = req.params[0];
	d.title = d.sid;
	d.appicon = "/hathor/appicon.png";

	let S = Core.readSceneJSON(d.sid);
	if (S){
		if (S.title) d.title = S.title;
		d.appicon = "/api/cover/"+d.sid;
	}

	console.log(d)
	res.render("hathor/index", d);
});


// Scenes redirect /s/<sid>
app.get(/^\/s\/(.*)$/, function(req,res,next){
	let sid = req.params[0];

	//req.url     = "/fe";
	//req.query.s = sid;
	
	res.redirect(url.format({
		pathname:"/fe",
		query: { "s": sid }
	}));

	next();
});

// Data routing (advanced)
//Core.setupDataRoute(app);

const CACHING_OPT = {
	maxage: "3h"
};

app.use('/', express.static(Core.DIR_PUBLIC, CACHING_OPT ));
//app.use('/mods', express.static(Core.DIR_NODE_MODULES, /*CACHING_OPT*/));

// Official front-end (Hathor)
app.use('/fe', express.static(Core.DIR_FE));

// Web-apps
app.use('/a', express.static(Core.DIR_WAPPS));

// Data (static)
app.use('/', express.static(Core.DIR_DATA, CACHING_OPT));


Core.setupPassport();
Core.realizeAuth(app);

// REST API
Core.realizeBaseAPI(app);

// Micro-services proxies
//=================================================
/*
// Atonizer
app.use('/atonizer', createProxyMiddleware({ 
	target: Core.config.services.atonizer.address+":"+PORT_ATONIZER, 
	pathRewrite: { '^/atonizer': ''},
	//changeOrigin: true 
}));
*/

// VRoadcast
app.use('/vrc', createProxyMiddleware({ 
	target: CONF.services.vroadcast.address+":"+PORT_VRC, 
	ws: true, 
	pathRewrite: { '^/vrc': ''},
	changeOrigin: true
}));
app.use('/svrc', createProxyMiddleware({ 
	target: CONF.services.vroadcast.address+":"+PORT_VRC, 
	ws: true, 
	pathRewrite: { '^/svrc': ''},
	secure: true,
	changeOrigin: true 
}));

// WebDav
/*
app.use('/dav', createProxyMiddleware({ 
	//target: CONF.services.webdav.address+":"+PORT_WEBDAV, 
	target: "http://localhost:"+PORT_WEBDAV,
	pathRewrite: { '^/dav': ''},
	changeOrigin: false, //true,
	//xfwd: true,
	//secure: true,

	//router: { "/dav" : "http://localhost:"+PORT_WEBDAV }
}));
*/

// START
//==================================
http.createServer(app).listen(PORT, ()=>{
	Core.logGreen("\nATON up and running!");
	console.log("- OFFLINE: http://localhost:"+PORT);
	for (let n in Core.nets) console.log("- NETWORK ('"+n+"'): http://"+Core.nets[n][0]+":"+PORT);
	
	console.log("\n");
});

// HTTPS service
if (fs.existsSync(pathCert) && fs.existsSync(pathKey)){
	let httpsOptions = {
		key: fs.readFileSync(pathKey, 'utf8'),
		cert: fs.readFileSync(pathCert, 'utf8')
	};

	https.createServer(httpsOptions, app).listen(PORT_SECURE, ()=>{ 
		Core.logGreen("\nHTTPS ATON up and running!");
		console.log("- OFFLINE: https://localhost:"+PORT_SECURE);
		for (let n in Core.nets) console.log("- NETWORK ('"+n+"'): https://"+Core.nets[n][0]+":"+PORT_SECURE);
		
		console.log("\n");
	});
}
else {
	console.log("SSL certs not found: "+pathKey+", "+pathCert);
	console.log("\n");
}