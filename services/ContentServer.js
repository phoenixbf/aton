/*
    ATON Content Server
=============================================*/

const express = require('express');
//const app = express();
const url = require('url');
const compression = require('compression');

var ContentServer = {};

ContentServer.PORT = 8080;
ContentServer.WWW_FOLDER = __dirname + "/../";


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

    /*
    this.app.get('/r/:roomid', function(req, res) {
        var roomid = req.params.roomid;
        //res.send('/index.html?r='+roomid);

        res.redirect(url.format({
            pathname:"/",
            query: {
                "r": roomid
                }
            }));
    });
    */

};


ContentServer.start = function(){
    this.configure();

    //console.log(this);

    this.app.listen(ContentServer.PORT, function () {
        console.log('Content Server running on *.' + ContentServer.PORT);

        //require("openurl").open("http://localhost:"+ContentServer.PORT+"/r/room1");
    });
}


module.exports = ContentServer;