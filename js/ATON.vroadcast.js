/*!
    @preserve

    ATON VRoadcast Client
    depends on ATON.core

 	@author Bruno Fanini
	VHLab, CNR ITABC

==================================================================================*/

ATON.vroadcast = {};

ATON.vroadcast.resPath = "res/";
ATON.vroadcast.PORT        = 8081;
ATON.vroadcast.PORT_SECURE = 8088;

ATON.vroadcast.socket     = undefined;
ATON.vroadcast.connected  = false;
ATON.vroadcast.uStateFreq = 0.1;

ATON.vroadcast._bPOLdirty = true;
ATON.vroadcast._bMediaRecording = false;
ATON.vroadcast._bMediaStreaming = false;
ATON.vroadcast._auStreamInterval = 400;
ATON.vroadcast._auBitsPerSecond  = 9000;
ATON.vroadcast.minAuVol = 2;

// custom events
//ATON.vroadcast.onIDassigned = undefined;
//ATON.vroadcast.onDisconnect = undefined;
//ATON.vroadcast.onPolDataReceived = undefined;

ATON.registerEvents([
    "VRC_Connect",
    "VRC_Disconnect",

    "VRC_IDassigned",

    "VRC_PolDataReceived",
    "VRC_PolCellReceived",
    "VRC_UserName",
    "VRC_UserMessage",
    "VRC_UserLeft",
    "VRC_UserEntered",
    "VRC_NodeSwitch"
]);

ATON.vroadcast.users = [];
ATON.vroadcast.manip = undefined;


// Built-in events
ATON.on("VRC_UserEntered", ()=>{
    ATON.vroadcast._audioLibEnter.play();
});
ATON.on("VRC_UserLeft", ()=>{
    //ATON.vroadcast._audioLibLeft.play();
});

ATON.on("VRC_UserMessage", ()=>{
    ATON.vroadcast._audioLibMSG.play();
});


// Def users colors
ATON.vroadcast.UCOLORS = [
    [1,0.0,0.0],
    [1,1,0.0],
    [0.0,1,0.0],
    [0.0,1,1],
    [0.0,0.0,1],
    [1,0.0,1],

    //[1,0.5,0.0],
];

/*
ATON.vroadcast.replicateEvent = function(evtname, data){
    if (!ATON.vroadcast.socket) return; // not connected

    ATON.vroadcast.socket.emit("EREP", {e: evtname, d: data});
};
*/

// FIXME:
/*
ATON.vroadcast.replicate = function(evtname, onReceive){
    let eList = ATON.eventHandlers[evtname];
    if (!eList) return;

    ATON.on(evtname, (data)=>{
        if (ATON.vroadcast.socket) ATON.vroadcast.socket.emit("EREP", {e: evtname, d: data});
        });

    if (!onReceive) return;

    let R = function(data){ onReceive(data); }

    if (ATON.vroadcast.socket) ATON.vroadcast.socket.on(evtname, R);
    else {
        ATON.on("VRC_Connect", ()=>{ ATON.vroadcast.socket.on(evtname, R); });
        }
};
*/

// Add a replicated event with local onBroadcast handler and onReceive handler
ATON.vroadcast.on = function(evtname, onBroadcast, onReceive){
    ATON.on(evtname, onBroadcast);
    ATON.on(evtname, (data)=>{
        if (ATON.vroadcast.socket) ATON.vroadcast.socket.emit("EREP", {e: evtname, d: data});
        });

    if (!onReceive) return;

    if (ATON.vroadcast.socket) ATON.vroadcast.socket.on(evtname, onReceive);
    else {
        ATON.on("VRC_Connect", ()=>{ ATON.vroadcast.socket.on(evtname, onReceive); });
        }
};


// User
ATON.user = function(){
    this.id = -1;
    this.username = "";
    this.status   = "...";
    this.weight   = 0.0; // old
    this.radius   = 30.0;
    this.rank     = 0;

    // Only for my user
    this.lastPos = osg.vec3.create();
    this.lastOri = osg.quat.create();

    // Only for other users
    this._mt = undefined;
    this._focAT = undefined;
    
    this.magNode = undefined;

    this.target = osg.vec3.create();
};

ATON.user.prototype = {
    // todo
};

ATON.vroadcast.setupResPath = function(path){
    ATON.vroadcast.resPath = path;

    // Interface audio/sounds
    ATON.vroadcast._audioLibEnter = new Audio(path+"audio/alert1.mp3");
    ATON.vroadcast._audioLibEnter.loop = false;
    ATON.vroadcast._audioLibMSG = new Audio(path+"audio/pling.mp3");
    ATON.vroadcast._audioLibMSG.loop = false;

    // Test pol-audio
/*
    ATON.vroadcast._audioLibPol = new Audio(path+"audio/mag.wav");
    ATON.vroadcast._audioLibPol.loop   = true;
    ATON.vroadcast._audioLibPol.volume = 0.0;
    ATON.vroadcast._audioLibPol.play();
*/
};

// MEDIA Recorder
ATON.vroadcast._onAuBlob = function(rblob){
    if (!rblob) return;
    if (!ATON.vroadcast.socket) return;
    //if (ATON.vroadcast._auAVGvolume <= ATON.vroadcast.minAuVol) return;

    console.log("sending blob..."+rblob.size);

    ATON.vroadcast.socket.emit("UAUDIO", {
        blob: rblob,
        id: ATON.vroadcast._myUser.id,
        vol: ATON.vroadcast._auAVGvolume
    });
};


ATON.vroadcast.initMediaRecorder = function(){
    if (!navigator.mediaDevices) return;

    navigator.mediaDevices.getUserMedia({ video:false, audio:true, echoCancellation:true }).then(async function(stream){
        ATON.vroadcast.recorder = RecordRTC(stream, { 
            type: 'audio',
            audioBitsPerSecond: ATON.vroadcast._auBitsPerSecond,
            disableLogs: true,
            numberOfAudioChannels: 1,
            //recorderType: StereoAudioRecorder,
            mimeType: "audio/wav",
            //timeSlice: ATON.vroadcast._auStreamInterval,
            //ondataavailable: ATON.vroadcast._onAuBlob,
        });

        // Audio analyser
        ATON.vroadcast._auAVGvolume = 0;

        ATON.vroadcast._auCTX = new AudioContext();
        const input = ATON.vroadcast._auCTX.createMediaStreamSource(stream);
        const analyser = ATON.vroadcast._auCTX.createAnalyser();
        const scriptProcessor = ATON.vroadcast._auCTX.createScriptProcessor();

        // Some analyser setup
        analyser.smoothingTimeConstant = 0.3;
        analyser.fftSize = 1024;
        
        input.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(ATON.vroadcast._auCTX.destination);

        const getAverageVolume = array => {
            const L = array.length;
            if (L <= 0) return 0; 
            
            let values = 0;
            for (let i=0; i<L; i++) values += array[i];

            return values / L;
        };

        scriptProcessor.onaudioprocess = audioProcessingEvent => {
            if (!ATON.vroadcast._bMediaStreaming) return;

            const tempArray = new Uint8Array(analyser.frequencyBinCount);

            analyser.getByteFrequencyData(tempArray);
            ATON.vroadcast._auAVGvolume = parseInt(getAverageVolume(tempArray));
            
            //console.log(ATON.vroadcast._auAVGvolume);
        };
    
        ATON.vroadcast._bMediaRecording = false;
        ATON.vroadcast._bMediaStreaming = false;
    });
};

/*
ATON.vroadcast.startRecording = function(){
    if (!ATON.vroadcast.recorder) return;
    
    ATON.vroadcast.recorder.startRecording();
    ATON.vroadcast._bMediaRecording = true;
};
ATON.vroadcast.stopRecording = function(){
    if (!ATON.vroadcast.recorder) return;

    ATON.vroadcast.recorder.stopRecording(function(){
        ATON.vroadcast._recBlob = ATON.vroadcast.recorder.getBlob();
        ATON.vroadcast._bMediaRecording = false;
        
        if (
            ATON.vroadcast._recBlob && 
            ATON.vroadcast.socket && 
            (ATON.vroadcast._auAVGvolume > ATON.vroadcast.minAuVol)
            ) 
            
            ATON.vroadcast.socket.emit("UAUDIO", {
                blob: ATON.vroadcast._recBlob,
                id: ATON.vroadcast._myUser.id,
                vol: ATON.vroadcast._auAVGvolume
            });
    });
};
ATON.vroadcast.startOrStopMediaRecording = function(){
    if (ATON.vroadcast._bMediaRecording) ATON.vroadcast.stopRecording();
    else ATON.vroadcast.startRecording();
};
*/

// helper function
ATON.vroadcast._stopRecAndSend = function(){
    if (!ATON.vroadcast.recorder) return;

    ATON.vroadcast.recorder.stopRecording(()=>{
        let rblob = ATON.vroadcast.recorder.getBlob();
        //console.log(rblob);

        if (!rblob) return;
        if (!ATON.vroadcast.socket) return;
        if (ATON.vroadcast._auAVGvolume <= ATON.vroadcast.minAuVol) return;

        ATON.vroadcast.socket.emit("UAUDIO", {
            blob: rblob,
            id: ATON.vroadcast._myUser.id,
            vol: ATON.vroadcast._auAVGvolume
        });
    });
};

ATON.vroadcast.startMediaStreaming = function(){
    if (!ATON.vroadcast.recorder) return;
    if (ATON.vroadcast._bMediaStreaming) return;

    console.log("Start MediaStreaming");

    ATON.vroadcast.recorder.startRecording();
    ATON.vroadcast._bMediaStreaming = true;
/*
    ATON.vroadcast.recorder.ondataavailable = function(rblob){
        console.log("New chunk avail");
        if (ATON.vroadcast.socket) ATON.vroadcast.socket.emit("UAUDIO", {
            blob: rblob,
            id: ATON.vroadcast._myUser.id
        });       
    };
*/

    ATON.vroadcast._dMediaRecorder = setInterval(()=>{
        ATON.vroadcast._stopRecAndSend();
        ATON.vroadcast.recorder.startRecording();
    }, ATON.vroadcast._auStreamInterval);
};
ATON.vroadcast.stopMediaStreaming = function(){
    if (!ATON.vroadcast.recorder) return;

    console.log("Stop MediaStreaming");
    ATON.vroadcast._stopRecAndSend();
    clearInterval(ATON.vroadcast._dMediaRecorder);
    ATON.vroadcast._bMediaStreaming = false;
};

ATON.vroadcast.startOrStopMediaStreaming = function(){
    if (ATON.vroadcast._bMediaStreaming) ATON.vroadcast.stopMediaStreaming();
    else ATON.vroadcast.startMediaStreaming();
};



ATON.vroadcast.connect = function(address, scene, bSecure){

    if (scene !== undefined) ATON.vroadcast._scene = scene;
    else ATON.vroadcast._scene = "_SHARED_";

    if (address === undefined) return; //ATON.vroadcast.socket = io();

    if (bSecure) 
        //ATON.vroadcast.socket = io.connect("https://"+address+":"+ATON.vroadcast.PORT_SECURE+"/", {
        ATON.vroadcast.socket = io.connect("https://"+address+":8083/", {
            path: '/svrc/socket.io',
            secure: true, 
            rejectUnauthorized: false,
            //transports: ['websocket'], 
            //upgrade: false 
        }); //, { 'force new connection': true });
    else 
        //ATON.vroadcast.socket = io.connect("http://"+address+":"+ATON.vroadcast.PORT+"/");
        ATON.vroadcast.socket = io.connect("http://"+address+":8080/", {
            path: '/vrc/socket.io',
            //transports: ['websocket'], 
            //upgrade: false 
        }); //, { 'force new connection': true });

    ATON.vroadcast.connected = ATON.vroadcast.socket.connected;

    if (ATON.vroadcast.socket === undefined) return;

    ATON.vroadcast._tLastUState = 0.0;
    
    // Register update callback
	//ATON._root.addUpdateCallback( new ATON.vroadcast._uState() );
    window.setInterval(ATON.vroadcast._update, (ATON.vroadcast.uStateFreq*1000.0) );

    ATON.vroadcast.userModel = osg.createTexturedSphere(0.15, 15,15);

    ATON.vroadcast._myUser = new ATON.user();

    ATON.vroadcast._registerSocketHandlers();

    ATON.fireEvent("VRC_Connect");

    //ATON.vroadcast.socket.emit("ENTER", { scene: ATON.vroadcast._scene });
};

ATON.vroadcast.setUserName = function(name){
    if (name.length < 3) return;

    ATON.vroadcast._myUser.username = name;

    var data = {id: ATON.vroadcast._myUser.id, name: name }
    ATON.vroadcast.socket.emit("UNAME", data);

    //ATON.vroadcast.onUserMSG();
    ATON.fireEvent("VRC_UserName", data);
};
ATON.vroadcast.setStatus = function(status){
    ATON.vroadcast._myUser.status = status;

    var data = {id: ATON.vroadcast._myUser.id, status: status };
    ATON.vroadcast.socket.emit("UMSG", data);
    
    //ATON.vroadcast.onUserMSG();
    ATON.fireEvent("VRC_UserMessage", data);
};
// Weight or rank
ATON.vroadcast.setWeight = function(w){
    ATON.vroadcast._myUser.weight = w;
    ATON.vroadcast.socket.emit("UMAGWEIGHT", {id: ATON.vroadcast._myUser.id, weight: w } ); // TODO: optimize
};
ATON.vroadcast.setRank = function(r){
    ATON.vroadcast._myUser.rank = parseInt(r);

    var binData = ATON.vroadcast.encodeUserStateData(ATON.vroadcast._myUser);
    ATON.vroadcast.socket.emit("USTATE", binData.buffer);
    console.log("My rank is now: "+r);
}

ATON.vroadcast.setMagRadius = function(r){
    ATON.vroadcast._myUser.radius = r;
    ATON.vroadcast.socket.emit("UMAGRADIUS", {id: ATON.vroadcast._myUser.id, radius: r } ); // TODO: optimize
};

ATON.vroadcast.requestRecording = function(msec){
    if (ATON.vroadcast.socket === undefined) return;

    ATON.vroadcast.socket.emit("REC", {dt: msec} );
    console.log("Requested server-side RecordTrace");
};

ATON.vroadcast.requestPol = function(){
    if (ATON.vroadcast.socket === undefined) return;

    ATON.vroadcast.socket.emit("POLREQ");
    //console.log("Requested QV as b64 img");
};

ATON.vroadcast.snapToUser = function(uid){
    let u = ATON.vroadcast.users[uid];
    if (!u) return;

    let bs = u._mt.getBound();
    let C = bs._center;

    let pov = new ATON.pov();
    pov.target = C;
    pov.pos    = ATON._currPOV.pos;
    pov.fov    = ATON._currPOV.fov;

    ATON.requestPOV(pov, 0.5);
};


ATON.vroadcast.setUserInfluence = function(user, radius, forces){
    //if (ATON.vroadcast._myUser === undefined) return;

    //var u = ATON.vroadcast.users[id];
    if(user === undefined) return;

    // First time
    if (user.magNode === undefined){
        user.magNode = new ATON.magNode();
        user.magNode.setKernel(0.0);
        ATON.addMagNode( user.magNode );
        }
    
    user.magNode.setRadius(radius);
    user.magNode.setForces(forces);
};


ATON.vroadcast._update = function(){
/*
    if ((ATON._time - ATON.vroadcast._tLastUState) < ATON.vroadcast.uStateFreq) return;
    ATON.vroadcast._tLastUState = ATON._time;
*/
    manip = ATON._viewer.getManipulator();

    // myself
    var myUser = ATON.vroadcast._myUser;

    var pos = osg.vec3.create();
    var ori = osg.quat.create();

    pos[0] = ATON._currPOV.pos[0];
    pos[1] = ATON._currPOV.pos[1];
    pos[2] = ATON._currPOV.pos[2];

    osg.mat4.getRotation( ori, manip.getInverseMatrix() );
    osg.quat.invert(ori, ori);
    //var o = ori.slice(0);
    //ori[1] = -o[2];
    //ori[2] = o[1];

    // Save bandwidth
    var dPos = osg.vec3.squaredDistance(pos, myUser.lastPos);
    var dOri = osg.vec4.squaredDistance(ori, myUser.lastOri);
    
    //if (dPos < 0.002 && dOri < 0.001) return;
    if (dPos > 0.0001 || dOri > 0.001){
        myUser.lastPos[0] = pos[0];
        myUser.lastPos[1] = pos[1];
        myUser.lastPos[2] = pos[2];

        myUser.lastOri[0] = ori[0];
        myUser.lastOri[1] = ori[1];
        myUser.lastOri[2] = ori[2];
        myUser.lastOri[3] = ori[3];

        // Encode and Send my data to server
        var binData = ATON.vroadcast.encodeUserStateData(/*pos, ori, myUser.rank*/ myUser);
        ATON.vroadcast.socket.emit("USTATE", binData.buffer);
        }

    // UI
    for (let u = 0; u < ATON.vroadcast.users.length; u++){
        let U = ATON.vroadcast.users[u];
        if (U && U._mtAUI) osg.mat4.scale(U._mtAUI.getMatrix(),U._mtAUI.getMatrix(), [0.99,0.99,0.99] );
        }

    // Encode and send target/focus
    if (ATON._hoveredVisData == undefined) return;
    let DTarg = osg.vec3.create();

    DTarg[0] = ATON._hoveredVisData.p[0] - pos[0];
    DTarg[1] = ATON._hoveredVisData.p[1] - pos[1];
    DTarg[2] = ATON._hoveredVisData.p[2] - pos[2];

    var binTargD = ATON.vroadcast.encodeDFocus(DTarg);
    //var binFoc   = ATON.vroadcast.encodeDFocus(ATON._hoveredVisData.p);

    //ATON.vroadcast.socket.emit("UFOCUSD", {id: myUser.id, dx: DTarg[0], dy: DTarg[1], dz: DTarg[2]});
    ATON.vroadcast.socket.emit("UFOCUSD", {id: myUser.id, bin: binTargD});
    //ATON.vroadcast.socket.emit("UFOCUS", {id: myUser.id, bin: binFoc});
    
    //console.log(binTargD);

    // Interactive Polarization
    if (ATON.vroadcast._bQFpol){
        //var F = ATON._hoveredVisData.p.slice(0); // NOT USED?

        //ATON.vroadcast.socket.emit("POLFOC", {/*id: myUser.id, */focus: DTarg});
        ATON.vroadcast.socket.emit("POLFOC", {r: ATON._hoverRadius});
/*
        var DT = DTarg.slice(0);
        var aQV = ATON.QVhandler.getActiveQV();

        var ir = parseInt((ATON._hoverRadius / (aQV.vExt[0]*0.5)) * QV_SLICE_RES);
        var jr = parseInt((ATON._hoverRadius / (aQV.vExt[1]*0.5)) * QV_SLICE_RES);
        var kr = parseInt((ATON._hoverRadius / (aQV.vExt[2]*0.5)) * QV_SLICE_RES);

        for (i=-ir; i<=ir; i++){
            for (j=-jr; j<=jr; j++){
                for (k=-kr; k<=kr; k++){
                    DT[0] = DTarg[0]+i;
                    DT[1] = DTarg[1]+j;
                    DT[2] = DTarg[2]+k;

                    ATON.vroadcast.socket.emit("POLFOC", {focus: DT});
                    }   
                }
            }
*/
        ATON.vroadcast._bPOLdirty = true;
        }

    //console.log("User state sent.");
};

ATON.vroadcast.toggleFocusPolarization = function(){
    ATON.vroadcast._bQFpol = !ATON.vroadcast._bQFpol;
    console.log("Focus Polarization: "+ATON.vroadcast._bQFpol);
}

// Distributed switch node
ATON.vroadcast.switchNode = function(id, val){
    ATON.getNode(id).switch(val);
    if (ATON.vroadcast.socket) ATON.vroadcast.socket.emit("NODESWITCH", { name:id, v:val });

    ATON.fireEvent("VRC_NodeSwitch", { name:id, value:val });
}

// Update (send state)
// NOT USED (bug in adding multiple callbacks to same node in VR)
/*
ATON.vroadcast._uState = function(){
};
ATON.vroadcast._uState.prototype = {
    update: function ( node, nv ){
        ATON.vroadcast._update();
        }
};
*/

// Encode user state
ATON.vroadcast.encodeUserStateData = function(user){
    //if (scale === undefined) scale = 0.64;
    //if (rank === undefined)  rank = 0;
    if (user === undefined) return;

    var A = new Float32Array(6); // make sufficient room
    A[0] = user.lastPos[0]; //pos[0];
    A[1] = user.lastPos[1]; //pos[1];
    A[2] = user.lastPos[2]; //pos[2];

    //A[3] = scale;

    // Convert to byte array, we use last float storage (4 bytes)
    var binData = new Int8Array(A.buffer);

    binData[16] = (user.lastOri[0] * 128.0);
    binData[17] = (user.lastOri[1] * 128.0);
    binData[18] = (user.lastOri[2] * 128.0);
    binData[19] = (user.lastOri[3] * 128.0);

    binData[21] = parseInt(user.rank);

    //console.log(binData);
    return binData;
};

// Decode incoming 24 bytes
ATON.vroadcast.decodeUserStateData = function(binData){
    var user = {};

    //console.log(binData);

    // First decode bytes
    user.ori = [
                binData[16] / 128.0,
                binData[17] / 128.0,
                binData[18] / 128.0,
                binData[19] / 128.0
                ];

    user.id   = binData[20];
    user.rank = binData[21];


    // Now decode floats
    user.pos = [];

    var a8 = new Int8Array(16);
    for (var i=0; i<16; i++) a8[i] = binData[i];

    var A = new Float32Array(a8.buffer);
    user.pos[0] = A[0];
    user.pos[1] = A[1];
    user.pos[2] = A[2];
    
    user.scale = A[3];

    //console.log(A);

    return user;
};

ATON.vroadcast.encodeDFocus = function(dtarget){
    var A = new Float32Array(3); // make sufficient room
    A[0] = dtarget[0];
    A[1] = dtarget[1];
    A[2] = dtarget[2];

    var binData = new Int8Array(A.buffer);

    return binData;
};

ATON.vroadcast.decodeDFocus = function(binData){
    var targDist = osg.vec3.create();

    var a8 = new Int8Array(12);
    for (var i=0; i<12; i++) a8[i] = binData[i];

    var A = new Float32Array(a8.buffer);
    targDist[0] = A[0];
    targDist[1] = A[1];
    targDist[2] = A[2];

    return targDist;
};


// If does not exist, create new user obj
ATON.vroadcast.touchUser = function(id){
    if (id < 0) return;

    if (ATON.vroadcast.users[id]){
        ATON.vroadcast.users[id]._mt.setNodeMask(ATON_MASK_UI);
        //ATON.vroadcast.users[id]._focAT.setNodeMask(0xf);
        return ATON.vroadcast.users[id];
        }

    // Create User (TODO: move into actor object)
    ATON.vroadcast.users[id] = new ATON.user();
    let u = ATON.vroadcast.users[id];

    // ID
    u.id = id;

    // Username
    u.name   = "User#" + id;
    u.status = "just in!";

    //u._pos = osg.vec3.create();
    //u._ori = osg.quat.create();

    u._mt = new osg.MatrixTransform();
    u._mt.setCullingActive( false ); // sometimes user repr. disappears, why?

    u._mtAUI = new osg.MatrixTransform();
    u._mtAUI.addChild(ATON.vroadcast.userAUI);
    u._mt.addChild(u._mtAUI);

    //var DFoc = new osg.Depth( osg.Depth.GREATER );
    //DFoc.setRange(0.9, 1.0);
    //u._mt.getOrCreateStateSet().setAttributeAndModes( DFoc );

/*
    u._focAT = new osg.AutoTransform();
    u._focAT.setPosition([0,0,0]);
    u._focAT.setAutoRotateToScreen(true);
    //u._focAT.setAutoScaleToScreen(true);
    u._focAT.getOrCreateStateSet().setBinNumber(11);
    u._focAT.getOrCreateStateSet().setRenderingHint('TRANSPARENT_BIN');
    u._focAT.getOrCreateStateSet().setAttributeAndModes(
        //new osg.BlendFunc(osg.BlendFunc.SRC_ALPHA, osg.BlendFunc.ONE_MINUS_SRC_ALPHA), 
        new osg.BlendFunc(osg.BlendFunc.SRC_ALPHA, osg.BlendFunc.ONE_MINUS_SRC_ALPHA), 
        osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE
        );
    var DFoc = new osg.Depth( osg.Depth.GREATER );
    DFoc.setRange(0.9, 1.0);
    u._focAT.getOrCreateStateSet().setAttributeAndModes( DFoc );
    u._focAT.setCullingActive( false );
*/

    u._at = new osg.AutoTransform();
    u._at.setPosition([0,0.1,0]);
    u._at.setAutoRotateToScreen(true);
    //u._at.setAutoScaleToScreen(true);

    u._at.getOrCreateStateSet().setRenderingHint('TRANSPARENT_BIN');
    u._at.getOrCreateStateSet().setAttributeAndModes(
        new osg.BlendFunc(osg.BlendFunc.SRC_ALPHA, osg.BlendFunc.ONE_MINUS_SRC_ALPHA), 
        osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE
        );

    u._mt.getOrCreateStateSet().setRenderingHint('TRANSPARENT_BIN');
    u._mt.getOrCreateStateSet().setAttributeAndModes(
        new osg.BlendFunc(osg.BlendFunc.SRC_ALPHA, osg.BlendFunc.ONE_MINUS_SRC_ALPHA), 
        osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE
        );

    ATON.vroadcast.realizeUserModel(id);

    ATON._rootUI.addChild(u._mt);
    //ATON._rootUI.addChild(u._focAT);

    // Test (MagUsers)
    ATON.vroadcast.setUserInfluence(u, 30.0, [0.0, 0.0]); // 0.0005
/*
    if (id === 0) ATON.vroadcast.setUserInfluence(u, 30.0, [0.0, 0.0005]);
    else ATON.vroadcast.setUserInfluence(u, 10.0, [0.0, 0.0001]);
*/

    return u;
};

ATON.vroadcast.realizeUserModel = function(id){
    var u = ATON.vroadcast.users[id];
    if (u === undefined) return;
    if (u._mt === undefined) return;

    // clear
    u._mt.removeChildren();
    //u._focAT.removeChildren();
    u._at.removeChildren();

    u._mt.addChild(ATON.vroadcast.userModel);
    u._mt.addChild(u._at);

    u._at.addChild(ATON.vroadcast.userBG);
    u._at.addChild(u._mtAUI);
    u._mtAUI.setNodeMask(0x0);


    var ulabID = id % 6; // no. colors
    var col = ATON.vroadcast.UCOLORS[ulabID];

    u._mt.getOrCreateStateSet().addUniform( osg.Uniform.createFloat4( [col[0],col[1],col[2], 1.0], 'uTint' ) );
    u._mt.getOrCreateStateSet().addUniform( osg.Uniform.createFloat1( 0.25, 'uOpacity') );

    u._at.getOrCreateStateSet().addUniform( osg.Uniform.createFloat1( 1.0, 'uOpacity') );

/*
    u._mt.getOrCreateStateSet().setAttributeAndModes(
        new osg.CullFace( 'DISABLE' ), //new osg.CullFace( 'BACK' ),
        osg.StateAttribute.PROTECTED
        );
*/


    // User Focus
    var focSize = 5.0;
/*
    var focGeom = osg.createTexturedSphere(focSize, 20,20);

    var material = new osg.Material();
	material.setTransparency( 1.0 );
	material.setDiffuse( ATON.vroadcast.UCOLORS[ulabID] );
    u._focAT.getOrCreateStateSet().setAttributeAndModes( material );
    
    u._focAT.addChild(focGeom);

    var focGeom = osg.createTexturedQuadGeometry(
        -(focSize*0.5), -(focSize*0.5), 0,      // corner
        focSize, 0, 0,       // width
        0, focSize, 0 );     // height

    u._focAT.addChild(focGeom);

    osgDB.readImageURL(ATON.vroadcast.resPath+"assets/mark"+ulabID+".png").then( function ( data ){
        var focTex = new osg.Texture();
        focTex.setImage( data );

        focTex.setMinFilter( osg.Texture.LINEAR_MIPMAP_LINEAR ); // LINEAR_MIPMAP_LINEAR // osg.Texture.LINEAR
        focTex.setMagFilter( osg.Texture.LINEAR ); // osg.Texture.LINEAR
        
        focTex.setWrapS( osg.Texture.CLAMP_TO_EDGE );
        focTex.setWrapT( osg.Texture.CLAMP_TO_EDGE );

        u._focAT.getOrCreateStateSet().setTextureAttributeAndModes(0, focTex);
        console.log("FocusMark loaded");        
        });
*/

    // Name Label node
    u.nameNode = new osgText.Text(u.name);
    //u.nameNode.setColor( randColor );
    //u.nameNode.setAutoRotateToScreen( true );
    // Check if we need to force POT Textures
    if ( ATON._isMobile ){
        u.nameNode.setForcePowerOfTwo( true );
        u.nameNode.setFontResolution(32);
        //u.nameNode.setNodeMask(0x0);
        }
    
    u.nameNode.setCharacterSize( 0.2 );
    u.nameNode.setPosition( [ 0.0, 0.37+ATON.vroadcast._bgHoffset, 0.001 ] );
    u._at.addChild(u.nameNode);

    // Status node
    u.statusNode = new osgText.Text(u.status);
    //u.statusNode.setColor( randColor );
    //u.statusNode.setAutoRotateToScreen( true );
    // Check if we need to force POT Textures
    if ( ATON._isMobile ){
        u.statusNode.setForcePowerOfTwo( true );
        u.statusNode.setFontResolution(8);
        //u.statusNode.setNodeMask(0x0);
        }

    u.statusNode.setCharacterSize( 0.08 );
    u.statusNode.setPosition( [ 0.0, 0.2+ATON.vroadcast._bgHoffset, 0.001 ] );
    u._at.addChild(u.statusNode);   
};

// Set custom Model
ATON.vroadcast.setUserModel = function(url){
    var request = osgDB.readNodeURL( url );
    request.then( function ( node ){
        ATON.vroadcast.userModel = node;

        ATON.vroadcast.userModel.getOrCreateStateSet().setRenderingHint('TRANSPARENT_BIN');
        ATON.vroadcast.userModel.getOrCreateStateSet().setAttributeAndModes(
            new osg.BlendFunc(osg.BlendFunc.SRC_ALPHA, osg.BlendFunc.ONE_MINUS_SRC_ALPHA), 
            osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE
            );

        //ATON.vroadcast.userModel.setCullingActive( false );

        for (var u=0, len=ATON.vroadcast.users.length; u<len; u++){
            if (ATON.vroadcast.users[u]) ATON.vroadcast.realizeUserModel(u);
            }
        });

    // User bg plate
    ATON.vroadcast._bgHoffset = 0.1;
    ATON.vroadcast.userBG = osg.createTexturedQuadGeometry(
        -0.5, ATON.vroadcast._bgHoffset, -0.02,      // corner
        1, 0, -0.02,       // width
        0, 0.5, -0.02 );     // height

    osgDB.readImageURL(ATON.vroadcast.resPath+"assets/userlabel.png").then( function ( data ){
        let bgTex = new osg.Texture();
        bgTex.setImage( data );

        bgTex.setMinFilter( osg.Texture.LINEAR_MIPMAP_LINEAR ); // LINEAR_MIPMAP_LINEAR // osg.Texture.LINEAR
        bgTex.setMagFilter( osg.Texture.LINEAR ); // osg.Texture.LINEAR
        
        bgTex.setWrapS( osg.Texture.CLAMP_TO_EDGE );
        bgTex.setWrapT( osg.Texture.CLAMP_TO_EDGE );

        ATON.vroadcast.userBG.getOrCreateStateSet().setTextureAttributeAndModes(0, bgTex);
        //u._mt.getOrCreateStateSet().setTextureAttributeAndModes(0, bgTex);
        //ATON.vroadcast.userBG.getOrCreateStateSet().addUniform( osg.Uniform.createFloat1( 1.0, 'uOpacity') );

        console.log("Label BG loaded");
        });

    ATON.vroadcast.userAUI = osg.createTexturedQuadGeometry(
        -0.5, -0.5, -0.02,      // corner
        1, 0, -0.02,       // width
        0, 1, -0.02 );     // height

    osgDB.readImageURL(ATON.vroadcast.resPath+"assets/useraui.png").then( function ( data ){
        let bgTex = new osg.Texture();
        bgTex.setImage( data );

        bgTex.setMinFilter( osg.Texture.LINEAR_MIPMAP_LINEAR ); // LINEAR_MIPMAP_LINEAR // osg.Texture.LINEAR
        bgTex.setMagFilter( osg.Texture.LINEAR ); // osg.Texture.LINEAR
        
        bgTex.setWrapS( osg.Texture.CLAMP_TO_EDGE );
        bgTex.setWrapT( osg.Texture.CLAMP_TO_EDGE );

        ATON.vroadcast.userAUI.getOrCreateStateSet().setTextureAttributeAndModes(0, bgTex);
        //u._mt.getOrCreateStateSet().setTextureAttributeAndModes(0, bgTex);
        ATON.vroadcast.userAUI.getOrCreateStateSet().addUniform( osg.Uniform.createFloat1( 0.5, 'uOpacity') );

        console.log("User AudioUI loaded");
        });
};

ATON.vroadcast.requestUserTransition = function(uid, pos, ori){
    var user = ATON.vroadcast.users[uid];
    if (user === undefined) return;

/*  TODO
    user._toPos = pos;
    user._toOri = ori;

    user._frPos = user._pos.slice(0);
    user._frOri = user._ori.slice(0);

    user._tReq  = ATON._time;
*/
    
    osg.mat4.fromRotationTranslation(user._mt.getMatrix(), ori, pos);

    user.lastPos = pos;
};

/* TODO */
ATON.vroadcast._handleUsersTransitions = function(){
    var n = ATON.vroadcast.users.length;
    if (n === 0) return;

    for (var u = 0; u < n; u++){
        var user = ATON.vroadcast.users[u];
        if (user !== undefined && user._tReq > 0.0){
            var t = (ATON._time - user._tReq) / ATON.vroadcast.uStateFreq;
            
            if (t < 1.0) osg.vec3.lerp(user._pos, user._frPos, user._toPos, t);
            else {
                user._pos[0] = user._toPos[0];
                user._pos[1] = user._toPos[1];
                user._pos[2] = user._toPos[2];

                user._tReq = -1.0;
                }

            osg.mat4.fromRotationTranslation(user._mt.getMatrix(), user._ori, user._pos);
            }
        }
};


// Handling msgs from server
ATON.vroadcast._registerSocketHandlers = function(){

    // We connected to server
    ATON.vroadcast.socket.on('connect', function(){
        // Request enter in scene node (room)
        ATON.vroadcast.socket.emit("ENTER", { scene: ATON.vroadcast._scene });
        console.log("Sent enter msg for scene "+ATON.vroadcast._scene);
        });

    ATON.vroadcast.socket.on('disconnect', function(){
        console.log("DISCONNECT!!");

        ATON.vroadcast.socket.disconnect();
        ATON.vroadcast._myUser.id = -1;

        // Hide all user representations
        for (let u = 0; u < ATON.vroadcast.users.length; u++) {
            const user = ATON.vroadcast.users[u];

            if (user){
                user._mt.setNodeMask(0x0);
                user._mtAUI.setNodeMask(0x0);
                }
            }

        //if (ATON.vroadcast.onDisconnect) ATON.vroadcast.onDisconnect();
        ATON.fireEvent("VRC_Disconnect");
        });

    // Server assigns an ID
    ATON.vroadcast.socket.on('ID', function(data){
        console.log("Your ID is " + data.id);
        ATON.vroadcast._myUser.id = data.id;

        //if (ATON.vroadcast.onIDassigned) ATON.vroadcast.onIDassigned();
        ATON.fireEvent("VRC_IDassigned", data.id);
        });

    // A different user state update
    ATON.vroadcast.socket.on('USTATE', function(data){
        //console.log(data.binaryData);
        let u = ATON.vroadcast.decodeUserStateData(data);
        let user = ATON.vroadcast.touchUser(u.id);

        if (user){
            user.rank = u.rank;
            ATON.vroadcast.requestUserTransition(u.id, u.pos, u.ori);
            
            if (user.magNode !== undefined){
                user.magNode.setPosition(user.lastPos);
                user.magNode.setTarget(user.target);
                }
            //console.log("User "+u.id+" updated! - POS: "+u.pos);
            }

        //console.log(u);
        });
    
    // A transmission of user focal point
    ATON.vroadcast.socket.on('UFOCUSD', function(data){
        let u = ATON.vroadcast.touchUser(data.id);

        //console.log(data);

        if (u){
            let binData = data.bin;
            let dtarg = ATON.vroadcast.decodeDFocus(binData);

            u.target[0] = u.lastPos[0] + dtarg[0];
            u.target[1] = u.lastPos[1] + dtarg[1];
            u.target[2] = u.lastPos[2] + dtarg[2];

            //u._focAT.setPosition(u.target);

            //console.log("Received Target: "+u.target);
            }

        });

    // Another user entered
    ATON.vroadcast.socket.on('ENTER', function(data){
        //console.log(data.binaryData);
        ATON.vroadcast.touchUser(data.id);

        console.log("User #" + data.id + " entered");
        //ATON.vroadcast.onUserEnter();

        ATON.fireEvent("VRC_UserEntered", data);
        });

    // A user left
    ATON.vroadcast.socket.on('LEAVE', function(data){
        //console.log(data.binaryData);
        let u = ATON.vroadcast.users[data.id];

        if (u){
            u._mt.setNodeMask(0x0);
            u._mtAUI.setNodeMask(0x0);
            }

        console.log("User #"+data.id+" left");

        ATON.fireEvent("VRC_UserLeft", data);
        });

    // A user updates own username
    ATON.vroadcast.socket.on('UNAME', function(data){
        //console.log(data.binaryData);

        let u = ATON.vroadcast.touchUser(data.id);
        if (u){
            u.name = data.name;
            u.nameNode.setText(data.name);

            //console.log(u._at.getChildren());

            console.log("User #"+data.id+" changed username to: "+data.name);
            //ATON.vroadcast.onUserMSG();

            ATON.fireEvent("VRC_UserName", data);
            }
        });

    // A user updates message/status
    ATON.vroadcast.socket.on('UMSG', function(data){
        //console.log(data.binaryData);

        let u = ATON.vroadcast.touchUser(data.id);

        if (u){
            u.status = data.status;
            u.statusNode.setText(data.status.substring(0, 25));

            console.log("User #"+data.id+" changed status to: "+data.status);
            //ATON.vroadcast.onUserMSG();
            ATON.fireEvent("VRC_UserMessage", data);
            }
        });

    ATON.vroadcast.socket.on('POLFOC', function(data){
        //console.log(data);

        ATON.vroadcast._bPOLdirty = true;
        ATON.vroadcast._polDATA   = data;

        //if (ATON.vroadcast.onPolDataReceived) ATON.vroadcast.onPolDataReceived();
        ATON.fireEvent("VRC_PolDataReceived");
        });

    ATON.vroadcast.socket.on('POLCELL', function(data){

        ATON.vroadcast._polCELL = data;

        //console.log(data);
        //if (ATON.vroadcast.onPolCellReceived) ATON.vroadcast.onPolCellReceived();
        ATON.fireEvent("VRC_PolCellReceived");
        });

    // A user updates weight
    ATON.vroadcast.socket.on('UMAGWEIGHT', function(data){
        //console.log(data.binaryData);

        let u = ATON.vroadcast.touchUser(data.id);

        if (u){
            u.weight = data.weight;

            ATON.vroadcast.setUserInfluence(u, u.radius, [0.0, u.weight]);

            console.log("User #"+data.id+" has now weight: "+data.weight);
            }
        });

    // A user updates its mag radius
    ATON.vroadcast.socket.on('UMAGRADIUS', function(data){
        //console.log(data.binaryData);

        let u = ATON.vroadcast.touchUser(data.id);

        if (u){
            u.radius = data.radius;

            ATON.vroadcast.setUserInfluence(u, u.radius, [0.0, u.weight]);

            console.log("User #"+data.id+" has now weight: "+data.weight);
            }
        });

    // Nodes
    ATON.vroadcast.socket.on('NODESWITCH', function(data){
        //ATON.switchNode(data.name, data.v);
        let N = ATON.nodes[data.name];
        if (!N) return;

        N.switch(data.v);
    });

    ATON.vroadcast.socket.on('UAUDIO', (data)=>{
        let newblob  = new File([data.blob], "blob.wav", { type: 'audio/wav'});
        let audioURL = window.URL.createObjectURL(newblob);
        
        window.audio = new Audio();
        window.audio.src = audioURL;
        window.audio.play();

        // Audio UI
        let u = ATON.vroadcast.users[data.id];
        if (!u) return;
        u._mtAUI.setNodeMask(0x0);

        if (!data.vol) return;

        //console.log(data.vol);

        let v = 0.5 + (data.vol * 0.02);
        //console.log(v);

        osg.mat4.fromScaling( u._mtAUI.getMatrix(), [v,v,v]);
        u._mtAUI.setNodeMask(ATON_MASK_UI);
    });

    // Object Spawning (can be done through custom events)
/*
    ATON.vroadcast.socket.on('SPAWN', function(data){
        var path = data.path;
        var pos  = [data.x, data.y, data.z];

        });
*/
};