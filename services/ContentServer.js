/*
    ATON Content Server
=============================================*/

const fs          = require('fs');
const express     = require('express');
const http        = require('http');
const https       = require('https');
const url         = require('url');
const compression = require('compression');
const request     = require('request');


var ContentServer = {};

ContentServer.PORT        = 8080;
ContentServer.SECURE_PORT = 443;
ContentServer.WWW_FOLDER  = __dirname + "/../";

// Debug on req received (client)
ContentServer.logger = function(req, res, next){
    console.log('Request from: ' + req.ip + ' For: ' + req.path);
    next(); // Run the next handler
};

ContentServer.app = express();

ContentServer.configure = function(){
    this.app.use(compression());

    this.app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
        });

    this.app.use('/', express.static(this.WWW_FOLDER));

    // All routing here
    this.app.get("/s/:scene", function(req,res){
        var scene = req.params.scene;

        res.redirect(url.format({
            pathname:"/frontend",
            query: { "m": scene }
            }));
        });
};


ContentServer.start = function(){
    this.configure();

    http.createServer(this.app).listen(ContentServer.PORT, ()=>{ console.log('Content Server running on *.' + ContentServer.PORT); });
    
    // Create an HTTPS service identical to the HTTP service
/*
    ContentServer.httpsOptions = {
        key: fs.readFileSync(__dirname+'/keys/_prv/server.key', 'utf8'),
        cert: fs.readFileSync(__dirname+'/keys/_prv/server.cert', 'utf8')
        };
    https.createServer(this.httpsOptions, this.app).listen(ContentServer.SECURE_PORT, ()=>{ console.log('Secure Content Server running on *.' + ContentServer.SECURE_PORT); });
*/
}


module.exports = ContentServer;