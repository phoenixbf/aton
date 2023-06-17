
const http = require('http');
const app = require('express')();
const socketio = require('socket.io');

const Core = require('./../Core');
const VRoadcast = require('./Photon.js');

// Loads config
let aConfig = Core.loadConfigFile("main.json", Core.CONF_MAIN);

let PORT_VRC = 8890;

if (aConfig.services.photon){
    if (aConfig.services.photon.maxClientsPerSession) Photon.MAX_CLIENTS_PER_SESSION = aConfig.services.photon.maxClientsPerSession;
    if (aConfig.services.photon.PORT) PORT_VRC = aConfig.services.photon.PORT;
}

// Start service
server = http.createServer(app);
server.listen(PORT_VRC, ()=>{
    console.log('Photon service on *: '+PORT_VRC);
});

let io = socketio(server);
//io.set('transports', ['websocket']);


Photon.init(io);