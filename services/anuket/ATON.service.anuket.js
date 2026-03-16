/*!
    @preserve

 	ATON Anuket service

 	@author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/
const WebSocketServer = require('ws');
const express         = require('express');

const Core   = require('./../Core');
const Anuket = require('./Anuket.js');

// Loads config
let aConfig = Core.loadConfigFile("main.json", Core.CONF_MAIN);

let PORT = 8891;

if (aConfig.services.anuket){
    let C = aConfig.services.anuket;

    if (C.maxClientsPerSession) Anuket.MAX_CLIENTS_PER_SESSION = C.maxClientsPerSession;
    if (C.PORT) PORT = C.PORT;
}

//const wss = new WebSocketServer.Server({ port: PORT });
// console.log("Anuket service started on PORT:"+PORT);

const app = express();
const server = app.listen(PORT, () => {
    console.log("Anuket service started on PORT:"+PORT);
});

const wss = new WebSocketServer.Server({
    noServer: true
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, socket => {
        wss.emit('connection', socket, request)
    })
});

Anuket.init( wss );