/*
    ATON Content Server
=============================================*/

const fs          = require('fs');
const express     = require('express');
const http        = require('http');
const https       = require('https');
const url         = require('url');
const compression = require('compression');
const path        = require('path');
const cors        = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');


var ContentServer = {};

ContentServer.PORT            = process.env.PORT || 8080;
ContentServer.PORT_SECURE     = process.env.PORT_SECURE || 8083;
ContentServer.PORT_ATONIZER   = process.env.PORT_ATONIZER || 8085;
ContentServer.PORT_VRC        = process.env.PORT_VRC || 8890;
ContentServer.PORT_VRC_SECURE = process.env.PORT_VRC || 8891;

ContentServer.pathCert    = path.join(__dirname,'/_prv/server.crt');
ContentServer.pathKey     = path.join(__dirname,'/_prv/server.key');

ContentServer.WWW_FOLDER  = path.join(__dirname,"/../");


// Debug on req received (client)
ContentServer.logger = function(req, res, next){
    console.log('Request from: ' + req.ip + ' For: ' + req.path);
    next(); // Run the next handler
};

ContentServer.app = express();

ContentServer.configure = function(){
    this.app.use(compression());
    this.app.use(cors({credentials: true, origin: true}));

/*
    this.app.use((req, res, next)=>{
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });
*/
    this.app.use('/', express.static(this.WWW_FOLDER));

    // All routing here
    this.app.get("/s/:scene", function(req,res,next){
        var scene = req.params.scene;

        res.redirect(url.format({
            pathname:"/frontend",
            query: { "m": scene }
        }));

        next();
    });

    // List all published scenes
    this.app.get("/api/scenes", function(req,res,next){
        //TODO:
        next();
    });

    // Proxies

    // Atonizer
    this.app.use('/atonizer', createProxyMiddleware({ 
        target: "http://localhost:"+ContentServer.PORT_ATONIZER, 
        //changeOrigin: true 
    }));

    // VRC
    this.app.use('/vrc', createProxyMiddleware({ 
        target: "ws://localhost:"+ContentServer.PORT_VRC, 
        ws: true, 
        pathRewrite: { '^/vrc': ''},
        changeOrigin: true
    }));
    this.app.use('/svrc', createProxyMiddleware({ 
        target: "ws://localhost:"+ContentServer.PORT_VRC, 
        ws: true, 
        pathRewrite: { '^/svrc': ''},
        secure: true,
        changeOrigin: true 
    }));
};


ContentServer.start = function(){
    this.configure();

    http.createServer(this.app).listen(ContentServer.PORT, ()=>{ console.log('Content Server running on :' + ContentServer.PORT); });
    
    // HTTPS service
    if (fs.existsSync(ContentServer.pathCert) && fs.existsSync(ContentServer.pathKey)){
        ContentServer.httpsOptions = {
            key: fs.readFileSync(ContentServer.pathKey, 'utf8'),
            cert: fs.readFileSync(ContentServer.pathCert, 'utf8')
            };

        this.bSSL = true;

        https.createServer(this.httpsOptions, this.app).listen(ContentServer.PORT_SECURE, ()=>{ 
            console.log('HTTPS Content Server running on :' + ContentServer.PORT_SECURE);
            });
        }
    else {
        this.bSSL = false;
        console.log("SSL certs not found: "+ContentServer.pathKey+", "+ContentServer.pathCert);
        }
}


module.exports = ContentServer;