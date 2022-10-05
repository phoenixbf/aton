
const http = require('http');
const app = require('express')();
const socketio = require('socket.io');

const Core = require('./Core');
const VRoadcast = require('./VRoadcast.js');

// Loads config
let aConfig = Core.loadConfigFile("main.json", Core.CONF_MAIN);

const PORT_VRC = aConfig.services.vroadcast.PORT || 8890;

VRoadcast.MAX_CLIENTS_PER_SESSION = aConfig.services.vroadcast.maxClientsPerSession || 50;


// Start service
server = http.createServer(app);
server.listen(PORT_VRC, ()=>{
    console.log('VRoadcast service on *: '+PORT_VRC);
});

let io = socketio(server);
//io.set('transports', ['websocket']);


VRoadcast.init(io);