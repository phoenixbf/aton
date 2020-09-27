
const http = require('http');
const app = require('express')();
const socketio = require('socket.io');

const ServUtils = require('./ServUtils.js');
const VRoadcast = require('./VRoadcast.js');

// Loads config
let aConfig = ServUtils.loadConfigFile("config.json");

const PORT_VRC = aConfig.services.vroadcast.PORT || 8890;

VRoadcast.MAX_CLIENTS_PER_SCENE = aConfig.services.vroadcast.maxClientsPerScene || 50;


// Start service
server = http.createServer(app);
server.listen(PORT_VRC, ()=>{
    console.log('VRoadcast service on *: '+PORT_VRC);
});

let io = socketio(server);
//io.set('transports', ['websocket']);


VRoadcast.init(io);