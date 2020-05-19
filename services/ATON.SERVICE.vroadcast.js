/*!
    @preserve

 	ATON VRoadcast Service

 	@author Bruno Fanini
	VHLab, CNR ITABC

==================================================================================*/

const PORT        = process.env.PORT_VRC || 8890;
const PORT_SECURE = process.env.PORT_VRC_SECURE || 8891;

const MAXCLIENTSPERSCENE = 100;
const MAXTARGDIST = 40.0;
const RECORD_SEPARATOR = ",";

const fs = require('fs');
const http  = require('http');
const https = require('https');
const cors = require('cors');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

/*
//const ContentServ = require("./ContentServer.js");
//const http = require('http').Server(ContentServ.app);
//const https = require('https').Server(ContentServ.app);

// creates a new socket.io instance attached to the http(s) server
let io = require('socket.io')(https);
*/

const app = require('express')();
//app.use(cors({credentials: true, origin: true}));

let VRCpathCert = path.join(__dirname,'/_prv/server.crt');
let VRCpathKey  = path.join(__dirname,'/_prv/server.key');


// For record trace
const distance = require('euclidean-distance');
const aabb  = require('aabb-3d');
const clamp = require('clamp');
const now = require("performance-now");
const Jimp = require('jimp');


// Command line
const commandLineArgs = require('command-line-args');

const optDefs = [
    { name: 'trace', alias: 't', type: Number}, // in milliseconds
    { name: 'www', type: String, defaultOption: __dirname+"/" },
    { name: 'production', type: Boolean},
    { name: 'secure', type: Boolean},
//    { name: 'timeout', alias: 't', type: Number }
];
// Parse options
const serviceOptions = commandLineArgs(optDefs);
//console.log(serviceOptions);

// Production
if (serviceOptions.production){
    console.log = function() {};
}

// Socket.io config
let server;

// Over SSL
if (serviceOptions.secure){

    if (fs.existsSync(VRCpathCert) && fs.existsSync(VRCpathKey)){
        let seccredentials = {
            key: fs.readFileSync(VRCpathKey, 'utf8'),
            cert: fs.readFileSync(VRCpathCert, 'utf8'),
            requestCert: false, //true,
            rejectUnauthorized: false
        };

        server = https.createServer(app);
        server.listen(PORT_SECURE, ()=>{
            console.log('VRoadcast service (SSL) on *: '+PORT_SECURE);
        });

    }
    else {
        console.log("VRoadcast Service ERROR: SSL certs not found!");
        exit(0);    
    }
}

// Standard HTTP
else {
    server = http.createServer(app);
    server.listen(PORT, ()=>{
        console.log('VRoadcast service on *: '+PORT);
    });
}

let io = require('socket.io')(server);
//io.set('transports', ['websocket']);
app.use( cors({credentials: true, origin: true}) );


// Scene Nodes (rooms)
var sceneNodes = {};
var totConnections = 0; // all connections (all scenes)

// Global Time
const tick = function(){ return (now() * 0.001).toFixed(3); };
var time = tick();


// Sign Boxes (min, max)
var globalSignBox    = aabb([-10.0, -10.0, -1.0], [10.0, 10.0, 20.0]);
var globalSignFocIMG = undefined;

// Quantized Volumes
// - QVA: quantized volumetric atlas
// - QFV: quantized focus volume
// TODO: move & clean volume-based functions
//=====================================================
// Normalized location inside volume
/*
var getNormLocationInVolume = function(loc, vol){
    var px = (loc[0] - vol.x0()) / vol.width();
    var py = (loc[1] - vol.y0()) / vol.height();
    var pz = (loc[2] - vol.z0()) / vol.depth();

    return [px,py,pz];
};
*/

const QV_SLICE_RES = 64; //64; //256; //128;
const QV_Z_SLICES  = 64; //64; //16; //32;
const QV_SIZE      = QV_SLICE_RES*QV_Z_SLICES;
const QV_ROOT_FOLDER = __dirname+"/../qv/";

var QFsync = 0;
const QFsyncFreq = 10; //20;
var bQPAdirty = false;


// Quantized Volume Class
QV = function(qvaPath){
    this.vol     = aabb([-1.0, -1.0, -1.0], [1.0, 1.0, 1.0]);
    
    //this.PA      = new Jimp(512,512); // 4096
    this.PA = new Jimp(QV_SIZE,QV_SLICE_RES, 0x00000000); // ...or init with opaque black (0x000000ff)
    this.PA.quality(100);
    this.PA.filterType(Jimp.PNG_FILTER_NONE);
    //this.PA.deflateLevel(0);

    this._PAbin  = undefined;
    this._PAcol  = undefined;
    this.imgpath = qvaPath;
    //this.tiling  = 8; //16
    //this.tsize   = 64; //256

    this._lastPolCol = 0;
    this._lastPolIndexes = [0,0];
};

QV.prototype = {
    setPositionAndExtents: function(start,ext){
        this.vol = aabb(start, ext);
        },

    getNormLocationInVolume: function(loc){
        var px = (loc[0] - this.vol.x0()) / this.vol.width();
        var py = (loc[1] - this.vol.y0()) / this.vol.height();
        var pz = (loc[2] - this.vol.z0()) / this.vol.depth();

        return [px,py,pz];
        },

    encodeLocationToRGBA: function(loc){
        var P = this.getNormLocationInVolume(loc);

        var col = new Uint8Array(4);
        col[0] = 0;
        col[1] = 0;
        col[2] = 0;
        col[3] = 0;

        if (P[0] > 1.0 || P[0] < 0.0) return col;
        if (P[1] > 1.0 || P[1] < 0.0) return col;
        if (P[2] > 1.0 || P[2] < 0.0) return col;

        col[0] = parseInt(P[0] * 255.0);
        col[1] = parseInt(P[1] * 255.0);
        col[2] = parseInt(P[2] * 255.0);
        col[3] = 255;

        return col;
        },

    encodeDeltaToRGBA: function(A,B){
        var col = new Uint8Array(4);
        col[0] = 0;
        col[1] = 0;
        col[2] = 0;
        col[3] = 0;

        var dx = (A[0]-B[0]) / (this.vol.width());
        var dy = (A[1]-B[1]) / (this.vol.height());
        var dz = (A[2]-B[2]) / (this.vol.depth());

        dx = clamp(dx, -1.0,1.0);
        dy = clamp(dy, -1.0,1.0);
        dz = clamp(dz, -1.0,1.0);

        dx = (dx*0.5) + 0.5;
        dy = (dy*0.5) + 0.5;
        dz = (dz*0.5) + 0.5;

        //console.log(dx,dy,dz);

        col[0] = parseInt(dx * 255.0);
        col[1] = parseInt(dy * 255.0);
        col[2] = parseInt(dz * 255.0);
        col[3] = 255;

        //console.log(col);

        return col;
        },

    // voxel ignition
    igniteLocation: function(loc, col8, rank){
        if (rank <= 8) return false; // low rank
        if (rank > 255) rank = 255; // max rank

        // Normalized location inside volume
        var P = this.getNormLocationInVolume(loc);

        // Check outside volume
        if (P[0] > 1.0 || P[0] < 0.0) return false;
        if (P[1] > 1.0 || P[1] < 0.0) return false;
        if (P[2] > 1.0 || P[2] < 0.0) return false;

        //P[0] -= (1.0/QV_SLICE_RES);
        P[1] -= (1.0/QV_SLICE_RES);
        //P[2] -= (1.0/QV_SLICE_RES);


        var i,j,t;
        i = parseInt(P[0] * QV_SLICE_RES); // FIXME!!! (-1)
        j = parseInt(P[1] * QV_SLICE_RES);

        t = parseInt(P[2] * QV_Z_SLICES); // tile index

        i += (t * QV_SLICE_RES); // offset


/*      GRID LAYOUT
        var i,j,z;
        i = parseInt(P[0] * this.tsize);
        j = parseInt(P[1] * this.tsize);
        z = parseInt(P[2] * this.tsize);

        var offX = parseInt(z / this.tiling);
        var offY = z % this.tiling;

        i += (this.tsize * offX);
        j += (this.tsize * offY);
*/

        //console.log("write to: ",i,j);
        var prevCol = this.PA.getPixelColor(i,j);

        // Cumulative
        //var A = Jimp.intToRGBA(prevCol).a + col8[3];
        //if (A > 255 ) A = 255;

        var A = Jimp.intToRGBA(prevCol).a;
        if (A > rank){
            sPOLnumCellsNEG++;
            return false;
            //return undefined;
            }

        if (A > 0) sPOLnumCellsRW++ // someone already written the cell

        A = rank;
        this._PAcol = Jimp.rgbaToInt(col8[0],col8[1],col8[2], A);

        this._lastPolIndexes[0] = i;
        this._lastPolIndexes[1] = j;
        this._lastPolCol = this._PAcol;

        this.PA.setPixelColor(this._PAcol, i,j);

        return true;
/*
        return {
            _col: this._PAcol,
            _i: i,
            _j: j
            };
*/
        },

    writePA: function( cb ){
        this.PA.write( this.imgpath, cb );
        },
    
    // FIXME
    readPAfromURL: function(url, onComplete){
        var self = this;
        Jimp.read(url, (err, pa) => {
            if (err) return;

            if (pa){
                self.PA = pa;
                self.PA.write( self.imgpath );
                console.log("PA read successfully");

                if (onComplete) onComplete();
                }
            });
        }
};


// Session file record
//=====================================================
// Record Daemon
var TraceDaemon = function(){
    time = tick();

    // Loop all scenes
    for (var sn in sceneNodes){

        var scene = sceneNodes[sn];
        
        // Loop users in this scene
        scene.clients.forEach(user => {

            if (user && user.bRecordWrite){
                writeClientRecord(user, sn);
                user.bRecordWrite = false;
                }
            });

/* DONE VIA MSG
        if (scene.qfv){
            scene.qfv.writePA();
            scene.bRecordWrite = false;
            }
*/

/*  DISABLED
        if (scene.bRecordWrite){
            writeGlobalRecord(sn);
            scene.bRecordWrite = false;
            }
*/
        }
};

var outRecordFolder = __dirname+"/record/";
//var currDate = new Date(); // unused

var bRecord = false;
var rDaemon = undefined;

// Trace recording
var enableTrace = function(dt){
    if (dt <= 0) return;

    bRecord = true;

    for (var sn in sceneNodes){
        var scene = sceneNodes[sn];

        // DISABLED
        //initGlobalRecord(sn);

        scene.clients.forEach(user => {
            initClientRecord(user, sn);
            });
        }

    rDaemon = setInterval(TraceDaemon, dt);
    console.log("RECORDING enabled");
};
var disableTrace = function(){
    bRecord = false;
    if (rDaemon) clearInterval(rDaemon);
};


if (serviceOptions.trace) enableTrace(serviceOptions.trace);


// POL STATS
//=========================================================================
var sPOLnumCellsSENT     = 0;
var sPOLnumCellsRCV      = 0;
var sPOLnumQPAsent       = 0;
var sPOLnumCellsRW       = 0;
var sPOLnumCellsNEG      = 0;
/*
var sPOLfile             = outRecordFolder+"/POLstats.csv";
var sPOLstream           = fs.createWriteStream(sPOLfile, {'flags': 'w'});

sPOLstream.write(
    'Time'+RECORD_SEPARATOR+
    'Connections' +RECORD_SEPARATOR+
    'QPA sent'+RECORD_SEPARATOR+
    'CELLS rcv'+RECORD_SEPARATOR+
    'CELLS sent'+RECORD_SEPARATOR+
    'CELLS rewritten'+RECORD_SEPARATOR+
    'CELLS neg'+RECORD_SEPARATOR+
    '\n'
);

// Daemon
setInterval(function(){
    time = tick();

    if (totConnections > 0){
        fs.appendFileSync(
            sPOLfile,
            time +RECORD_SEPARATOR+
            totConnections +RECORD_SEPARATOR+
            sPOLnumQPAsent +RECORD_SEPARATOR+
            sPOLnumCellsRCV +RECORD_SEPARATOR+
            sPOLnumCellsSENT +RECORD_SEPARATOR+
            sPOLnumCellsRW +RECORD_SEPARATOR+
            sPOLnumCellsNEG +
            "\n"
            );

        console.log("--- POL-STATS Daemon");
        }

},4000);
*/


//====================================================================================
// WebServer
//====================================================================================
/*
if (serviceOptions.www){
    ContentServ.WWW_FOLDER = serviceOptions.www;
    ContentServ.PORT = PORT;   
}
//else ContentServ.WWW_FOLDER = __dirname + '/';

ContentServ.configure();
*/

// Common
//=======================================================

var touchSceneNode = function(sname){
    if (sceneNodes[sname]) return sceneNodes[sname];

    // First time
    sceneNodes[sname] = {};
    var scene = sceneNodes[sname];

    scene.clients      = [];
    scene.numClients   = 0; // Note: scene.clients[] may not be contiguous
    scene.bRecordWrite = false;

    var QFVpath = getGlobalQFVimgpath(sname);

    scene.qfv = new QV(QFVpath);

    // FIXME: add support to qv list per scene
    //var QVdata = JSON.parse(fs.readFileSync(QV_ROOT_FOLDER+sname+'-qv.json', 'utf-8'));
    fs.readFile(QV_ROOT_FOLDER+sname+'-qv.json', 'utf-8', (err, data) => {
        if (err) console.log("QV json not found!");
        else {
            var QVdata = JSON.parse(data);
            if (QVdata.list){
                scene.qfv.setPositionAndExtents(QVdata.list[0].position, QVdata.list[0].extents);
                }
            }
        });
    
/*
    //scene.qfv.setPositionAndExtents([-70,-50,0], [150,70,50]); // faug2
    if (sname === "cecilio") scene.qfv.setPositionAndExtents([-17.0,-41,0], [30,40,20]); // cecilio
    if (sname === "hebe")    scene.qfv.setPositionAndExtents([-8.0,-8.0,-0.1], [16,16,6]); // hebe
*/
    var broadCastQFV = function(){
        scene.qfv.PA.getBase64(Jimp.MIME_PNG, function(err, data){
            if (data){
                io.in(sname).emit("POLFOC",data);
                //console.log("TouchScene, QPA: "+data);
                }
            });
        };

    // Init QVA
    if (!fs.existsSync(QFVpath)) scene.qfv.writePA();
    else scene.qfv.readPAfromURL(QFVpath, broadCastQFV);

    broadCastQFV();

    console.log("Created scene "+sname);
    //console.log(scene);

    // DISABLED
    //if (bRecord) initGlobalRecord(sname);

    return scene;
};

var touchClient = function(id, scene){
    if (scene === undefined) return undefined;

    // Create a new client in this scene
    scene.clients[id] = {};  
    var clientInfo = scene.clients[id];

    clientInfo.position    = [0.0,0.0,0.0];
    clientInfo.orientation = [0.0,0.0,0.0,1.0];
    clientInfo.scale       = 1.0;
    clientInfo.id          = id;
    clientInfo.target      = [0.0,0.0,0.0];
    clientInfo.focus       = [0.0,0.0,0.0];
    clientInfo.rank        = 0;

    // signatures
    clientInfo.signFocBin = undefined;
    clientInfo.signFocIMG = undefined;

    clientInfo.bRecordWrite = false;

    return clientInfo;
};

// Assign first available slot (id) in scene, -1 if not possible
var assignIDinScene = function(scene){
    if (scene === undefined) return -1;

    var clientsTableSize = scene.clients.length;

    // First search for available slot
    for( var i=0; i<clientsTableSize; i++ ){
        if (scene.clients[i] === undefined) return i;
        }
    
    // Otherwise return tail index
    if (clientsTableSize < MAXCLIENTSPERSCENE) return clientsTableSize;

    return -1; 
};

// DEPRECATED
/*
var assignID = function(){
    var clientsTableSize = clients.length;

    // First search for available slot
    for( var i=0; i<clientsTableSize; i++ ){
        if (clients[i] === undefined) return i;
        }
    
    // Otherwise return tail index
    if (clientsTableSize < MAXCLIENTSPERSCENE) return clientsTableSize;

    return -1;
};
*/

var decodeUserStateData = function(data){
    var user = {};

    user.pos = [
                data.readFloatLE(0),
                data.readFloatLE(4),
                data.readFloatLE(8)
                ];

    user.scale = data.readFloatLE(12);

    user.ori = [
                data.readInt8(16) / 128.0,
                data.readInt8(17) / 128.0,
                data.readInt8(18) / 128.0,
                data.readInt8(19) / 128.0
                ];

    user.rank = data.readUInt8(21); // unsigned!

    return user;
};

var encodeUserStateData = function(c){
    //var c = clients[index];

    var A = new Float32Array(6);
    A[0] = c.position[0];
    A[1] = c.position[1];
    A[2] = c.position[2];
    A[3] = c.scale;

    // Convert to byte array
    var binData = new Int8Array(A.buffer);
    //console.log(binData);
    binData[16] = (c.orientation[0] * 128.0);
    binData[17] = (c.orientation[1] * 128.0);
    binData[18] = (c.orientation[2] * 128.0);
    binData[19] = (c.orientation[3] * 128.0);

    binData[20] = c.id;     // unsigned byte id
    binData[21] = parseInt(c.rank);   // unsigned byte rank
    //binData[22]
    //binData[23]

    return binData;
};

// Focus
var decodeDFocus = function(binData){
    var a8 = new Int8Array(12);
    for (var i=0; i<12; i++) a8[i] = binData[i];

    var A = new Float32Array(a8.buffer);

    var DT = [0.0,0.0,0.0];
    DT[0] = A[0];
    DT[1] = A[1];
    DT[2] = A[2];

    //console.log(DT);
    return DT;
};

// Send a snapshot of a specific client ID
var sendClientSnapshot = function(socket, id, scene){
    var clientInfo = scene.clients[id];
    if (clientInfo === undefined) return;

    var binData = encodeUserStateData(clientInfo);

    // Snapshot
    socket.emit("USTATE", binData );

    if (clientInfo.name !== undefined) 
        socket.emit("UNAME", {id: clientInfo.id, name: clientInfo.name } );
    if (clientInfo.status !== undefined) 
        socket.emit("UMSG", {id: clientInfo.id, status: clientInfo.status } );
    if (clientInfo.encodedDFocus !== undefined)
        socket.emit("UFOCUSD",clientInfo.encodedDFocus);
    if (clientInfo.encodedWeight !== undefined)
        socket.emit("UMAGWEIGHT", {id: clientInfo.id, weight: clientInfo.encodedWeight } );
    if (clientInfo.encodedRadius !== undefined)
        socket.emit("UMAGRADIUS", {id: clientInfo.id, weight: clientInfo.encodedRadius } );
};

// Send a global snapshot, except myid
var sendGlobalSnapshot = function(socket, myid, scene){
    //var scene = socket.sceneNode;
    var clientsTableSize = scene.clients.length;

    // For each client different from myid, send snapshot
    for( var i=0; i<clientsTableSize; i++ ){
        if (scene.clients[i] !== undefined){
            if (i !== myid) sendClientSnapshot(socket, i, scene);
            }
        }
};

// Record/Trace
//================================
var getRecordFilepath = function(c, scenename){
    return outRecordFolder+scenename+"/U"+c.id+'.csv';
};

var getSignatureFocusFilepath = function(c, scenename){
    return outRecordFolder+scenename+"/focsign"+c.id+'.png';
};

var getGlobalSignatureFocusFilepath = function(scenename){
    return outRecordFolder+scenename+"/gfocsign.png";
};

var getGlobalRecordFilepath = function(scenename){
    return outRecordFolder+scenename+"/swarm.csv";
};

var getGlobalQFVimgpath = function(scenename){
    return outRecordFolder+scenename+"/qfv.png";
};

var initGlobalRecord = function(scenename){
    if (!fs.existsSync(outRecordFolder)) fs.mkdirSync(outRecordFolder);
    if (!fs.existsSync(outRecordFolder+scenename)) fs.mkdirSync(outRecordFolder+scenename);

    // Header
    var recStream = fs.createWriteStream(getGlobalRecordFilepath(scenename), {'flags': 'w'});

    // 'Hours'+RECORD_SEPARATOR+'Minutes'+RECORD_SEPARATOR+'Seconds'
    recStream.write(
        'Time'+RECORD_SEPARATOR+
        'Users'+RECORD_SEPARATOR+
        
        'swarmX'+RECORD_SEPARATOR+
        'swarmY'+RECORD_SEPARATOR+
        'swarmZ'+RECORD_SEPARATOR+
        'swarmRadius'+RECORD_SEPARATOR+
        
        'swarmFX'+RECORD_SEPARATOR+
        'swarmFY'+RECORD_SEPARATOR+
        'swarmFZ'+RECORD_SEPARATOR+
        'swarmFocRadius\n');

    // DISABLED
    //globalSignFocIMG = new Jimp(4096, MAXCLIENTSPERSCENE);

    console.log("Global Record initialized for scene "+scenename);
};

var writeGlobalRecord = function(scenename){
    if (scenename === undefined) return;

    var S = sceneNodes[scenename];
    if (S === undefined) return;

    var numUsers = S.numClients; //S.clients.length;
    if (numUsers < 1) return;

    // Time freq barrier
    //var ts = tick();
    //if ((ts - tLastMark) < tRecordFreq) return;
    //tLastMark = ts;

    var x=0.0,y=0.0,z=0.0;
    var fx=0.0,fy=0.0,fz=0.0;

    var locMin = [ undefined, undefined, undefined];
    var locMax = [ undefined, undefined, undefined];
    var focMin = [ undefined, undefined, undefined];
    var focMax = [ undefined, undefined, undefined];
    var locRad=0.0, focRad=0.0;

    S.clients.forEach(u => {
        if (u !== undefined){
            x += u.position[0];
            y += u.position[1];
            z += u.position[2];

            if (locMin[0] === undefined || u.position[0] < locMin[0]) locMin[0] = u.position[0];
            if (locMin[1] === undefined || u.position[1] < locMin[1]) locMin[1] = u.position[1];
            if (locMin[2] === undefined || u.position[2] < locMin[2]) locMin[2] = u.position[2];

            if (locMax[0] === undefined || u.position[0] > locMax[0]) locMax[0] = u.position[0];
            if (locMax[1] === undefined || u.position[1] > locMax[1]) locMax[1] = u.position[1];
            if (locMax[2] === undefined || u.position[2] > locMax[2]) locMax[2] = u.position[2];

            fx += u.focus[0];
            fy += u.focus[1];
            fz += u.focus[2];

            if (focMin[0] === undefined || u.focus[0] < focMin[0]) focMin[0] = u.focus[0];
            if (focMin[1] === undefined || u.focus[1] < focMin[1]) focMin[1] = u.focus[1];
            if (focMin[2] === undefined || u.focus[2] < focMin[2]) focMin[2] = u.focus[2];

            if (focMax[0] === undefined || u.focus[0] > focMax[0]) focMax[0] = u.focus[0];
            if (focMax[1] === undefined || u.focus[1] > focMax[1]) focMax[1] = u.focus[1];
            if (focMax[2] === undefined || u.focus[2] > focMax[2]) focMax[2] = u.focus[2];
            }
        });

    x /= numUsers;
    y /= numUsers;
    z /= numUsers;

    fx /= numUsers;
    fy /= numUsers;
    fz /= numUsers;

    locRad = distance(locMax,locMin) * 0.5;
    focRad = distance(focMax,focMin) * 0.5;

    //console.log("SwarmAVG: "+x+", "+y+", "+z);

    // Write
    // appendFileSync
    fs.appendFile(
        getGlobalRecordFilepath(scenename),
        time +RECORD_SEPARATOR+
        parseInt(S.numClients) +RECORD_SEPARATOR+
        
        x.toFixed(3) +RECORD_SEPARATOR+ 
        y.toFixed(3) +RECORD_SEPARATOR+ 
        z.toFixed(3) +RECORD_SEPARATOR+ 
        locRad.toFixed(3) +RECORD_SEPARATOR+

        fx.toFixed(3) +RECORD_SEPARATOR+ 
        fy.toFixed(3) +RECORD_SEPARATOR+ 
        fz.toFixed(3) +RECORD_SEPARATOR+ 
        focRad.toFixed(3) +"\n",
        function (err) { });
};

// User trace
var initClientRecord = function(c, scenename){
    if (c === undefined) return;
    if (scenename === undefined) return;

    if (!fs.existsSync(outRecordFolder)) fs.mkdirSync(outRecordFolder);
    if (!fs.existsSync(outRecordFolder+scenename)) fs.mkdirSync(outRecordFolder+scenename);

    // Header
    var recStream = fs.createWriteStream(getRecordFilepath(c,scenename), {'flags': 'w'});

    // 'Hours'+RECORD_SEPARATOR+'Minutes'+RECORD_SEPARATOR+'Seconds'
    recStream.write(
        'Time'+RECORD_SEPARATOR+

        'px'+RECORD_SEPARATOR+
        'py'+RECORD_SEPARATOR+
        'pz'+RECORD_SEPARATOR+

        'ox'+RECORD_SEPARATOR+
        'oy'+RECORD_SEPARATOR+
        'oz'+RECORD_SEPARATOR+
        'ow'+RECORD_SEPARATOR+
        
        'fx'+RECORD_SEPARATOR+
        'fy'+RECORD_SEPARATOR+
        'fz\n');

    //c.signFoc    = new Buffer(4096 * 3); // IMAGE_WIDTH * IMAGE_HEIGHT * 3
    c.signFocIMG = new Jimp(4096, 1);
    c.signFocBin = new Uint8Array(4);

    console.log("Initialised Record "+getRecordFilepath(c,scenename));
};

var writeClientRecord = function(c, scenename){
    if (c === undefined) return;
    if (scenename === undefined) return;

    // Timestamp (H M S)
    //currDate = new Date();
    //var ts = currDate.getHours()+RECORD_SEPARATOR+currDate.getMinutes() +RECORD_SEPARATOR+ currDate.getSeconds();

    // Time freq barrier
    //var ts = tick();
    //if ((ts - tLastMark) < tRecordFreq) return;
    //tLastMark = ts;

    // Write
    // appendFileSync
    fs.appendFile(
        getRecordFilepath(c, scenename),
        time +RECORD_SEPARATOR+
        
        c.position[0].toFixed(3) +RECORD_SEPARATOR+
        c.position[1].toFixed(3) +RECORD_SEPARATOR+
        c.position[2].toFixed(3) +RECORD_SEPARATOR+

        c.orientation[0].toFixed(3) +RECORD_SEPARATOR+ 
        c.orientation[1].toFixed(3) +RECORD_SEPARATOR+ 
        c.orientation[2].toFixed(3) +RECORD_SEPARATOR+ 
        c.orientation[3].toFixed(3) +RECORD_SEPARATOR+

        c.focus[0].toFixed(3) +RECORD_SEPARATOR+
        c.focus[1].toFixed(3) +RECORD_SEPARATOR+
        c.focus[2].toFixed(3) +"\n",
        function (err) { });

    // Focus sign.
    var w = Math.floor(time * serviceOptions.trace * 0.1);
    w = w % 4096;
/*
    c.signFoc[p + 0] = parseInt(c.focus[0]); // r (0-255)
    c.signFoc[p + 1] = parseInt(c.focus[1]); // g (0-255)
    c.signFoc[p + 2] = parseInt(c.focus[2]); // b (0-255)
*/

    var sxi = (c.focus[0] - globalSignBox.x0()) / globalSignBox.width();
    var syi = (c.focus[1] - globalSignBox.y0()) / globalSignBox.height();
    var szi = (c.focus[2] - globalSignBox.z0()) / globalSignBox.depth();
    var sa  = 255;
/*
    sxi = clamp(sxi, 0.0,1.0) * 255.0;
    syi = clamp(syi, 0.0,1.0) * 255.0;
    szi = clamp(szi, 0.0,1.0) * 255.0;
*/
    // full black & alpha=0 outside volume
    if ( sxi < 0.0 || sxi > 1.0 || syi < 0.0 || syi > 1.0 || szi < 0.0 || szi > 1.0 ){
        sxi = 0.0;
        syi = 0.0;
        szi = 0.0;
        sa  = 0;
        }

    sxi *= 255.0;
    syi *= 255.0;
    szi *= 255.0;

    c.signFocBin[0] = parseInt(sxi);
    c.signFocBin[1] = parseInt(syi);
    c.signFocBin[2] = parseInt(szi);
    c.signFocBin[3] = sa;

    //console.log(c.signFocBin);

    c.signFocBUF = Buffer.from(c.signFocBin);
    c.signFocCOL = c.signFocBUF.readUIntBE(0,4);
    //c.signFocCOL = (c.signFocBin[2]*256) + (c.signFocBin[1]*256*256) + (c.signFocBin[0]*256*256*256) + 255;

    //console.log(col);


    // TEST QFV (quantized focus volume)
/*
    if (sceneNodes[scenename] && sceneNodes[scenename].qfv){
        var qfv = sceneNodes[scenename].qfv;
        var F = qfv.getNormLocationInVolume(c.focus);

        var fv = new Uint8Array(4);
        fv[0] = (F[0] * 255.0); //60;
        fv[1] = (F[1] * 255.0); //255;
        fv[2] = (F[2] * 255.0); //60;
        fv[3] = 255;

        qfv.igniteLocation(c.focus, fv); c.position
        }
*/

/* DISABLED
    if (c.signFocIMG){
        c.signFocIMG.setPixelColor(c.signFocCOL, w, 0);
        c.signFocIMG.write( getSignatureFocusFilepath(c,scenename) );
        }
*/

/* DISABLED
    if (globalSignFocIMG){
        globalSignFocIMG.setPixelColor(c.signFocCOL, w, c.id);
        globalSignFocIMG.write( getGlobalSignatureFocusFilepath(scenename) );
        }
*/
};





// Socket.io Server
//=======================================================
// Whenever someone connects this gets executed
io.on('connection', function(socket){
    totConnections++;

    // Local to this connected client
    var assignedID = -1;
    
    var sceneName    = undefined;
    var scene        = undefined;
    var clientInfo   = undefined;

    // TODO: use this as client unique id
    var ipAddr = socket.handshake.address;
    console.log("New connection from "+ipAddr);

/*
    //socket.emit(..); // only this client
    //socket.broadcast.emit(..) // all the others

    //socket.broadcast.to(room).emit(..) // broadcasts to all sockets in the given room, except to the socket on which it was called
    //io.sockets.in(room).emit(..) // broadcasts to all sockets in the given room
*/

    // A request for a scenenode (room)
    socket.on('ENTER', function (data) {
        sceneName = data.scene;
        scene = touchSceneNode(sceneName);

        console.log("> ENTER request in scene "+sceneName);
        //console.log(sceneNodes);

        socket.join(sceneName);
        //console.log(scene);

        assignedID = assignIDinScene(scene);
        if (assignedID>=0){
            clientInfo = touchClient(assignedID,scene);

            scene.numClients++;

            // Send assigned ID to the user
            socket.emit("ID", { id: assignedID } );

            // Send a global snapshot of scene to this client
            sendGlobalSnapshot(socket, assignedID, scene);

            // Inform other clients
            //socket.broadcast.emit("ENTER", { id: assignedID } );
            socket.broadcast.to(sceneName).emit("ENTER", { id: assignedID } );

            // Record
            if (bRecord) initClientRecord(clientInfo, sceneName);

            console.log("USER '"+assignedID+"' joined scene '"+sceneName+"'");
            }
        });

    // Whenever someone disconnects this piece of code executed
    socket.on('disconnect', function () {
        socket.leave(sceneName);
        totConnections--;

        if (scene !== undefined && assignedID>=0){
            delete scene.clients[assignedID];
            if (scene.numClients>0) scene.numClients--;

            socket.broadcast.to(sceneName).emit("UMAGWEIGHT", { id: assignedID, weight: 0.0 } );
            socket.broadcast.to(sceneName).emit("LEAVE", { id: assignedID } );

            console.log("USER '" + assignedID + "' DISCONNECTED from scene "+sceneName+" - Num. Clients: "+scene.numClients);

            if (scene.numClients === 0){
                delete scene;
                delete sceneNodes[sceneName];
                console.log("DELETED scene "+sceneName);
                }
            }
        });
    
    // Receive user state
    socket.on('USTATE', function(data){
        if (clientInfo === undefined) return;
        //console.log(data);

        var u = decodeUserStateData(data);

        // Update
        clientInfo.position    = u.pos.slice(0);
        clientInfo.scale       = u.scale;
        clientInfo.orientation = u.ori.slice(0);
        clientInfo.rank        = u.rank;

        // Record on file
        if (assignedID>=0 && bRecord){
            clientInfo.bRecordWrite = true;
            scene.bRecordWrite      = true;
            }

        //console.log(clientInfo);

        var binData = encodeUserStateData(clientInfo);

        //socket.broadcast.emit("USTATE", binData );
        socket.broadcast.to(sceneName).emit("USTATE", binData );
        });

    // Absolute Focus
    socket.on('UFOCUS', function(data){
        if (clientInfo === undefined) return;

        //console.log(data.bin);

        var dFocus = decodeDFocus(data.bin);
        clientInfo.focus[0] = dFocus[0];
        clientInfo.focus[1] = dFocus[1];
        clientInfo.focus[2] = dFocus[2];

        // Record on file
        if (assignedID>=0 && bRecord){
            clientInfo.bRecordWrite = true;
            scene.bRecordWrite      = true;
            }
        
        // FIXME: needed?
        //socket.broadcast.to(sceneName).emit("UFOCUS", data );

        clientInfo.encodedDFocus = data;
        });

    // Receive Focus delta
    socket.on('UFOCUSD', function(data){
        if (clientInfo === undefined) return;

        //console.log(data.bin);

        //var dFocus = [0.0,0.0,0.0];
        var dFocus = decodeDFocus(data.bin);
        //dFocus[0] = parseFloat(data.dx);
        //dFocus[1] = parseFloat(data.dy);
        //dFocus[2] = parseFloat(data.dz);
        
        clientInfo.focus[0] = clientInfo.position[0] + dFocus[0];
        clientInfo.focus[1] = clientInfo.position[1] + dFocus[1];
        clientInfo.focus[2] = clientInfo.position[2] + dFocus[2];

        // Record on file
        if (assignedID>=0 && bRecord){
            clientInfo.bRecordWrite = true;
            scene.bRecordWrite      = true;
            }

        // FIXME: needed?
        //socket.broadcast.to(sceneName).emit("UFOCUSD", data );

        clientInfo.encodedDFocus = data;
        });
    
    // Receive username update
    socket.on('UNAME', function(data){
        if (clientInfo === undefined) return;

        clientInfo.name = data.name;

        // Update other clients
        console.log(data);
        //socket.broadcast.emit("UNAME", data );
        socket.broadcast.to(sceneName).emit("UNAME", data );
        });
    
    // Receive status update
    socket.on('UMSG', function(data){
        if (clientInfo === undefined) return;

        clientInfo.status = data.status;

        // Update other clients
        console.log(data);
        //socket.broadcast.emit("UMSG", data );
        socket.broadcast.to(sceneName).emit("UMSG", data );
        });
    
    // Receive user weight update
    socket.on('UMAGWEIGHT', function(data){
        if (clientInfo === undefined) return;

        clientInfo.encodedWeight = data.weight;

        // Update other clients
        console.log(data);
        //socket.broadcast.emit("UNAME", data );
        socket.broadcast.to(sceneName).emit("UMAGWEIGHT", data );
        });
    
    // Receive user mag radius update
    socket.on('UMAGRADIUS', function(data){
        if (clientInfo === undefined) return;

        clientInfo.encodedRadius = data.radius;

        // Update other clients
        console.log(data);
        //socket.broadcast.emit("UNAME", data );
        socket.broadcast.to(sceneName).emit("UMAGRADIUS", data );
        });

    socket.on('POLFOC', function(data){
        //console.log(clientInfo.rank);

        if (scene && scene.qfv && clientInfo.rank >= 2){
            var qfv = scene.qfv;

            sPOLnumCellsRCV++;
            //console.log("POLFOC "+data);
/*
            var F = qfv.getNormLocationInVolume(data.focus);
            //console.log(data.focus);

            var fv = new Uint8Array(4);
            fv[0] = 60; //(F[0] * 255.0);
            fv[1] = 255; //(F[1] * 255.0);
            fv[2] = 60; //(F[2] * 255.0);
            fv[3] = 4; // rank
*/
            var fv = qfv.encodeLocationToRGBA(clientInfo.focus);
            var pv = qfv.encodeLocationToRGBA(clientInfo.position);
            //var df = qfv.encodeDeltaToRGBA(clientInfo.focus, clientInfo.position);

            if (fv[3] === 0 || pv[3] === 0) return; // outside

            // rank
            //fv[3] = 16;
            //pv[3] = 16;
            //df[3] = 16;

            //qfv.igniteLocation( clientInfo.position, fv);
            //qfv.igniteLocation( clientInfo.focus, fv);

            bQPAdirty = qfv.igniteLocation( clientInfo.focus, pv, clientInfo.rank);
            //bQPAdirty = qfv.igniteLocation( clientInfo.focus, df, clientInfo.rank);

            if (bQPAdirty){
                //socket.emit("POLCELL", { i: qfv._lastPolIndexes[0], j: qfv._lastPolIndexes[1], v: qfv._lastPolCol });
                io.in(sceneName).emit("POLCELL", { i: qfv._lastPolIndexes[0], j: qfv._lastPolIndexes[1], v: qfv._lastPolCol });
                sPOLnumCellsSENT++;
                }

            // Timed QPA writing on disk
            if (QFsync == 0 && bQPAdirty){
                qfv.writePA(()=>{ 
                    bQPAdirty = false;

                    // Check
/*
                    qfv.PA.getBase64(Jimp.MIME_PNG, function(err, b64data){
                        if (err) console.log("ERROR POLREQ: "+err);
                        if (b64data) socket.emit("POLFOC",b64data);
                        sPOLnumQPAsent++;
                        });
*/
                    });

                /*console.log("WRITE");*/
                //socket.broadcast.to(sceneName).emit("POLFOC");

/*              OLD - BROADCASTING WHOLE QPA
                qfv.PA.getBase64(Jimp.MIME_PNG, function(err, b64data){
                    if (b64data) io.in(sceneName).emit("POLFOC",b64data);
                    //console.log(err,data);
                    });
*/              
                //bQPAdirty = false;
                }
            QFsync = (QFsync + 1) % QFsyncFreq;
            }
        });

    socket.on('POLREQ', function(data){
        if (scene && scene.qfv){
            var qfv = scene.qfv;

            //qfv.writePA(()=>{

                qfv.PA.getBase64(Jimp.MIME_PNG, function(err, b64data){
                    if (err) console.log("ERROR POLREQ: "+err);
                    if (b64data) socket.emit("POLFOC",b64data);
                    sPOLnumQPAsent++;
                    });
            //    });
            }
        });

    // Request Record enable
    socket.on('REC', function(data){
        if (!bRecord){
            if (data.dt) enableTrace(data.dt);
            console.log("Trace Recording ENABLED");
            }
        else {
            disableTrace();
            console.log("Trace Recording DISABLED");
            }
        });

    socket.on('NODESWITCH', function(data){
        if (scene){
            socket.broadcast.to(sceneName).emit("NODESWITCH", data );
            console.log("Node switch "+data);
            }
        });

    socket.on('UAUDIO', function(data){
        if (scene){
            //socket.broadcast.to(sceneName).emit('UAUDIO', data);
            socket.to(sceneName).emit('UAUDIO', data);
            //console.log("Audio msg");
            //console.log(data);
            }
        });

    // Event Replication
    socket.on('EREP', function(msg){
        if (scene){
            socket.broadcast.to(sceneName).emit( msg.e, msg.d );
            //console.log("Event replicate: "+msg.e+ " data: "+msg.d);
            if (msg.d.store){
                // Persistent data
                }
            }
        });

    // Remote Log 
    socket.on('LOG', function(data){
        console.log(data);
        });

});


/*
if (https){
    http.listen(PORT, function(){
        console.log('VRoadcast service (SSL) running on *: '+PORT);
    });
}
else {
    http.listen(PORT, function(){
        console.log('VRoadcast service running on *:'+PORT);
    });
}
*/