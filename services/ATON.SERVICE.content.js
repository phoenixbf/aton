/*!
    @preserve

 	ATON Content Service

 	@author Bruno Fanini
	VHLab, CNR ITABC

==================================================================================*/

const PORT = 80;
const WWW_FOLDER = __dirname + "/../";

const express = require('express');
const app = express();
const url = require('url');

const compression = require('compression');
//const helmet = require('helmet');

// On req received (client)
function logger(req, res, next){
        console.log('Request from: ' + req.ip + ' For: ' + req.path);
        next(); // Run the next handler
};

// Configure webserver
//==============================================   
app.use(compression());
app.use('/', express.static(WWW_FOLDER));

/*
app.get('/r/:roomid', function(req, res) {
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

app.listen(PORT, function () {
        console.log('Content Server running on *.'+PORT);

        //require("openurl").open("http://localhost:"+PORT+"/r/room1");
});