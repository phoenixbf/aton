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


app.use('/', express.static(Core.DIR_PUBLIC /*, { maxAge: 31557600 }*/ ));
//app.use('/mods', express.static(Core.DIR_NODE_MODULES, /*{ maxAge: 31557600 }*/));

// Official front-end (Hathor)
app.use('/fe', express.static(Core.DIR_FE));

// Web-apps
app.use('/a', express.static(Core.DIR_WAPPS));

// Data (static)
app.use('/', express.static(Core.DIR_DATA));


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
	changeOrigin: true,
	xfwd: true,
	secure: true,
	//router: { "/dav" : "http://localhost:"+PORT_WEBDAV }
}));
*/

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