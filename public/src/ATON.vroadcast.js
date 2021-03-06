/*
    ATON VRoadcast
    real-time collaborative networking

    author: bruno.fanini_AT_gmail.com

===========================================================*/

import Avatar from "./ATON.avatar.js";

/**
ATON VRoadcast component
@namespace VRoadcast
*/
let VRoadcast = {};

VRoadcast.USER_STATE_FREQ = 0.25; // sec
VRoadcast.REPLICATED_EVT = "EREP";

// Thresholds state sending
VRoadcast.THRES_STATE_POS = 0.01;
VRoadcast.THRES_STATE_ORI = 0.08; // radians

VRoadcast.Avatar = Avatar;


/**
Initialize the component
*/
VRoadcast.init = ()=>{
    VRoadcast.address = window.location.origin;

    VRoadcast.initMaterials();

    VRoadcast.socket = undefined;
    VRoadcast._connected = false;

    VRoadcast._username = undefined;

    VRoadcast.uid = undefined; // my userID (0,1,....)
    VRoadcast._bStreamFocus = false; // stream focal point
    
    VRoadcast._numUsers = 1;

    VRoadcast.avatarList = [];

    VRoadcast.avaGroup = ATON.createUINode("avatars"); // holds all avatars representations
    VRoadcast.avaGroup.attachToRoot();

    VRoadcast.focGroup = ATON.createUINode("focus"); // holds all avatars focal points
    VRoadcast.focGroup.attachTo(VRoadcast.avaGroup);
    VRoadcast._focNodes = [];

    // send own state with given freq
    VRoadcast.bSendState = true;
    window.setInterval( VRoadcast.sendState, VRoadcast.USER_STATE_FREQ*1000.0 );
    VRoadcast._lastStateSent = undefined;

    VRoadcast._bShowAvaG = true;

    console.log("VRoadcast initialized");
    VRoadcast.enableChatLog();
};

VRoadcast.enableChatLog = ()=>{
    VRoadcast._elChat = $("<div></div>").text("");
};

VRoadcast.getNumUsers = ()=>{
    return VRoadcast._numUsers;
};

// Register materials (avatars/users)
VRoadcast.initMaterials = ()=>{

    VRoadcast.ucolors = [];
    VRoadcast.ucolors.push( new THREE.Color(1,0,0) );
    VRoadcast.ucolors.push( new THREE.Color(1,1,0) );
    VRoadcast.ucolors.push( new THREE.Color(0,1,0) );
    VRoadcast.ucolors.push( new THREE.Color(0,1,1) );
    VRoadcast.ucolors.push( new THREE.Color(0,0,1) );
    VRoadcast.ucolors.push( new THREE.Color(1,0,1) );

    VRoadcast.ucolorsdark = [];
    VRoadcast.ucolorsdark.push( new THREE.Color(0.2,0.0,0.0) );
    VRoadcast.ucolorsdark.push( new THREE.Color(0.2,0.2,0.0) );
    VRoadcast.ucolorsdark.push( new THREE.Color(0.0,0.2,0.0) );
    VRoadcast.ucolorsdark.push( new THREE.Color(0.0,0.2,0.2) );
    VRoadcast.ucolorsdark.push( new THREE.Color(0.0,0.0,0.2) );
    VRoadcast.ucolorsdark.push( new THREE.Color(0.2,0.0,0.2) );

    VRoadcast.ucolorhex = [];
    VRoadcast.ucolorhex.push("#F00");
    VRoadcast.ucolorhex.push("#FF0");
    VRoadcast.ucolorhex.push("#0F0");
    VRoadcast.ucolorhex.push("#0FF");
    VRoadcast.ucolorhex.push("#00F");
    VRoadcast.ucolorhex.push("#F0F");

    let MM = ATON.MatHub.materials;
    MM.avatars = [];

    let mat = ATON.MatHub.materials.defUI.clone();
    mat.uniforms.color.value = VRoadcast.ucolors[0];
/*
    let mat = new THREE.MeshBasicMaterial({
        color: VRoadcast.ucolors[0], 
        transparent: true, 
        opacity: 0.4, 
        depthWrite: false,
        flatShading: true
    });
*/
    MM.avatars.push(mat);

    for (let c=1; c<VRoadcast.ucolors.length; c++){
        let M = mat.clone();
        //M.color = VRoadcast.ucolors[c];
        M.uniforms.color.value = VRoadcast.ucolors[c];

        MM.avatars.push(M);
    }

    // AudioUI user materials
    VRoadcast.uspritemats = [];

    let texAUI = new THREE.TextureLoader().load( ATON.PATH_RES+"useraui.png" );
    for (let c=0; c<VRoadcast.ucolors.length; c++){
        let smat = new THREE.SpriteMaterial({ 
            map: texAUI,
            depthWrite: false,
            color: VRoadcast.ucolors[c] // multiply
        });
        smat.sizeAttenuation = true;

        VRoadcast.uspritemats.push(smat);
    }

    // Focal points
    VRoadcast.ufocmats = [];

    let texFocP = new THREE.TextureLoader().load( ATON.PATH_RES+"focus.png" );
    for (let c=0; c<VRoadcast.ucolors.length; c++){
        let smat = new THREE.SpriteMaterial({ 
            map: texFocP,
            depthWrite: false,
            depthTest: false,
            color: VRoadcast.ucolors[c] // multiply
        });
        smat.sizeAttenuation = true;

        VRoadcast.ufocmats.push(smat);
    }
};

/**
Fire a replicated event (network)
@param {string} evtname - the event name
@param {object} data - object containing data to be transmitted with this event

@example
ATON.VRoadcast.fireEvent("test", 42);
*/
VRoadcast.fireEvent = (evtname, data)=>{
    if (!VRoadcast._connected) return;
    let sock = VRoadcast.socket;

    if (sock) sock.emit(VRoadcast.REPLICATED_EVT, {e: evtname, d: data});
    //else ATON.on("VRC_Connected", ()=>{ sock.on(evtname, onReceive); });
};

/**
Subscribe to a given network event, through given handler
@param {string} evtname - the event name
@param {function} handler - network event handler (how we handle incoming event)

@example
ATON.VRoadcast.on("test", function(data){ console.log("Received: "+data); });
*/
VRoadcast.on = (evtname, handler)=>{
    if (handler === undefined) return;

    let evhNetwork = ATON.EventHub.evNetwork;

    if (evhNetwork[evtname] === undefined) evhNetwork[evtname] = []; // First time (event not registered)
    evhNetwork[evtname].push(handler);
};

/**
Return true if VRoadcast is connected to the service
@returns {boolean}
*/
VRoadcast.isConnected = ()=>{
    if (VRoadcast.socket === undefined) return false;
    return VRoadcast._connected;
};

/**
Return true if we have a VRoadcast ID assigned
@returns {boolean}
*/
VRoadcast.hasID = ()=>{
    if (VRoadcast.uid === undefined) return false;
    return true;
};

/**
Utility for server-side logging
@param {string} d - string data to be logged
*/
VRoadcast.log = (d)=>{
    if (!VRoadcast._connected) return;
    let sock = VRoadcast.socket;

    if (sock) sock.emit("LOG", d);
};

/**
Request to join a given VRoadcast session (typically, the scene ID)
@param {string} ssid - the session id (room or scene ID)
@example
ATON.VRoadcast.joinSession("testscene");
*/
VRoadcast.joinSession = (ssid)=>{
    if (!VRoadcast.socket) return;
    if (ssid === undefined) ssid = ATON.SceneHub.currID;

    if (ssid === undefined){
        console.log("VRC ERROR: current session ID is undefined");
        return;
    }

    console.log("Joining VRC session "+ssid+"...");
    VRoadcast.socket.emit("SENTER", ssid );
};

VRoadcast.requestSceneState = ()=>{
    if (!VRoadcast.socket) return;

    VRoadcast.socket.emit("SSTATE");
};

VRoadcast.setAvatarsVisibility = (b)=>{
    VRoadcast._bShowAvaG = b;

    if (b) VRoadcast.avaGroup.show();
    else VRoadcast.avaGroup.hide();
};

/**
Connect to VRoadcast service
@param {string} address - the address of the service (optional). Default is same server where main service is running
@example
ATON.VRoadcast.connect();
*/
VRoadcast.connect = (address)=>{
    if (VRoadcast._connected) return;
    if (address) VRoadcast.address = address;

    let opts = {};

    // Secure connection
    if (window.location.protocol === "https:"){
        opts.path = '/svrc/socket.io';
        opts.secure = true;
        opts.rejectUnauthorized = false;
        //opts.transports = ['websocket']; 
        //opts.upgrade = false 
    }
    else {
        opts.path = '/vrc/socket.io';
        //opts.transports = ['websocket'];
        //opts.upgrade = false;
    }

    VRoadcast.socket = io.connect(VRoadcast.address, opts); //, { 'force new connection': true });

    if (VRoadcast.socket === undefined) return;
    VRoadcast._connected = VRoadcast.socket.connected;

    VRoadcast._registerSocketHandlers();
};

VRoadcast.disconnect = ()=>{
    if (VRoadcast.socket === undefined) return;

    VRoadcast._numUsers = 1;

    VRoadcast.socket.disconnect();
    VRoadcast._connected = false;
};


VRoadcast._onConnected = ()=>{
    //
};

VRoadcast.setUsername = (username)=>{
    VRoadcast._username = username;
    if (VRoadcast.socket === undefined) return;
    if (VRoadcast.uid === undefined) return;

    if (VRoadcast._elChat) VRoadcast._elChat.append("<i>Your username is now: "+username+"</i><br>");
    VRoadcast.socket.emit("UNAME", username);
};
VRoadcast.setMessage = (msg)=>{
    VRoadcast._msg = msg;
    if (VRoadcast.socket === undefined) return;
    if (VRoadcast.uid === undefined) return;

    if (VRoadcast._elChat){
        VRoadcast._elChat.append("<span style='color:"+VRoadcast.ucolorhex[VRoadcast.uid%6]+"'><b>YOU</b>: "+msg+"</span><br>");
        VRoadcast._elChat.scrollTop(VRoadcast._elChat.scrollHeight);
    }

    VRoadcast.socket.emit("UMSG", msg);
};


// Handle incoming server msgs
VRoadcast._registerSocketHandlers = ()=>{

    // We connected to server
    VRoadcast.socket.on('connect', ()=>{
        VRoadcast._connected = true;

        // If we have a valid Scene ID join corresponding session
        if (ATON.SceneHub.currID !== undefined){
            VRoadcast.joinSession();
        }
        
        console.log("Connected to VRC service!");
        ATON.fireEvent("VRC_Connected");

        VRoadcast._onConnected();
    });

    VRoadcast.socket.on('disconnect', ()=>{
        VRoadcast._connected = false;
        VRoadcast.uid = undefined;

        VRoadcast.avaGroup.hide();

        if (VRoadcast._elChat) VRoadcast._elChat.append("<i>YOU disconnected from VRoadcast service</i><br>");

        console.log("VRC disconnected!");
        ATON.fireEvent("VRC_Disconnected");
    });

    // Incoming replicated event
    VRoadcast.socket.on(VRoadcast.REPLICATED_EVT, (data)=>{
        let evtname = data.e;
        let d = data.d;

        let ehList = ATON.EventHub.evNetwork[evtname];
        ATON.EventHub.executeHandlers(ehList, d);
    });

    VRoadcast.socket.on('ID', (data)=>{
        console.log("Your ID is " + data);
        VRoadcast.uid = data;

        if (VRoadcast._bShowAvaG) VRoadcast.avaGroup.show();

        if (VRoadcast._elChat) VRoadcast._elChat.append("<i>Your ID is #"+data+"</i><br>");

        // Request scene state
        VRoadcast.requestSceneState();

        ATON.fireEvent("VRC_IDassigned", data);
    });

    VRoadcast.socket.on('SSTATE', (data)=>{
        VRoadcast._numUsers = data.numUsers;
        console.log("Num. users: "+VRoadcast._numUsers);

        ATON.fireEvent("VRC_SceneState", data);
    });

    VRoadcast.socket.on('UENTER', (data)=>{
        let uid = data;
        //if (uid === VRoadcast.uid) return; // myself

        console.log("User #" +uid+" entered the scene");
        if (VRoadcast._elChat) VRoadcast._elChat.append("<i>User #"+uid+" entered the scene</i><br>");

        VRoadcast.touchAvatar(uid);
        
        //VRoadcast._numUsers++;
        VRoadcast.requestSceneState();
        ATON.fireEvent("VRC_UserEnter", uid);
    });

    VRoadcast.socket.on('ULEAVE', (data)=>{
        let uid = data;
        if (uid === undefined) return;
        
        let A = VRoadcast.avatarList[uid];
        if (A) A.hide();
        //VRoadcast.destroyAvatar(uid);

        // TODO: hide also focus

        console.log("User #" +uid+" left the scene");
        if (VRoadcast._elChat) VRoadcast._elChat.append("<i>User #"+uid+" left the scene</i><br>");

        //if (VRoadcast._numUsers>1) VRoadcast._numUsers--;
        VRoadcast.requestSceneState();
        ATON.fireEvent("VRC_UserLeave", uid);
    });

    VRoadcast.socket.on('USTATE', (data)=>{
        if (!VRoadcast._bShowAvaG) return;

        let S = VRoadcast.decodeState(data);

        //console.log(data);

        let uid = S.userid;
        let A = VRoadcast.touchAvatar(uid);

        //A.position.copy(S.position);
        //A.quaternion.copy(S.quaternion);
        
        A.requestStateTransition(S);
        //A.hideFocalPoint();
    });

    VRoadcast.socket.on('UFOCUS', (data)=>{
        let uid = data.uid;
        let fp  = data.fp;

        let A = VRoadcast.touchAvatar(uid);

        A.requestFocus(fp);
    });

    VRoadcast.socket.on('UNAME', (data)=>{
        let uid   = data.uid;
        let uname = data.name;

        if (uid === undefined) return;

        let A = VRoadcast.touchAvatar(uid);
        A.setUsername(uname);

        console.log("User #" +uid+" changed username to: "+uname);
        if (VRoadcast._elChat) VRoadcast._elChat.append("<i>User #"+uid+" changed username to: "+uname+"</i><br>");
    });

    VRoadcast.socket.on('UMSG', (data)=>{
        let uid = data.uid;
        let msg = data.msg;

        if (uid === undefined) return;

        let A = VRoadcast.touchAvatar(uid);
        A.setMessage(msg);

        console.log("User #" +uid+": "+msg);
        if (VRoadcast._elChat) VRoadcast._elChat.append("<span style='color:"+VRoadcast.ucolorhex[uid%6]+"'><b>"+A.getUsername()+"</b>: "+msg+"</span><br>");
    });

    VRoadcast.socket.on('UTALK', (data)=>{
        let uid = data.uid;
        if (uid === undefined) return;

        let audioURL = data.audio;
        let A = VRoadcast.touchAvatar(uid);

        //A.setTalkVolume(data.vol);
        A.setTalkVolume(5.0);

/*
        if (A._auTalk === undefined || A._auTalk === null){
            A._auTalk = new THREE.PositionalAudio( ATON.AudioHub._listener );
            A._auTalk.setRefDistance(50.0);
            A.add(A._auTalk);
        }
        else A._auTalk.stop();
*/
        if (A._auTalk.isPlaying) A._auTalk.stop();

        ATON.AudioHub._loader.load( audioURL, (buffer)=>{
            A._auTalk.setBuffer( buffer );
            A._auTalk.setLoop( false );
            //A._auTalk.setVolume( 0.5 );
            //A._auTalk.setPlaybackRate(0.9);
            A._auTalk.play();
        });

        audioURL = null;
        
/*
        //let newblob  = new File([data.blob], "blob"+ATON.MediaRec.auExt, { type: ATON.MediaRec.auType });
        //let audioURL = window.URL.createObjectURL(newblob);
        
        if (A._auTalk === undefined){
            A._auTalk = new Audio();
            //A._auTalk.type = ATON.MediaRec.auType;
        }
        else {
            //A._auTalk.pause();
            A._auTalk.currentTime = 0;    
        }

        A._auTalk.src = audioURL;
        A._auTalk.play();
*/

/*
        A._auChunks.push({
            data: audioURL,
            volume: data.vol
        });
*/
    });
};

// Encode state
VRoadcast.encodeState = (S)=>{
    if (!S) return;

    let A = new Float32Array(6); // make sufficient room
    A[0] = S.position.x;
    A[1] = S.position.y;
    A[2] = S.position.z;

    // Convert to byte array, we use last float storage (4 bytes)
    var binData = new Int8Array(A.buffer);

    binData[16] = (S.quaternion.x * 128.0);
    binData[17] = (S.quaternion.y * 128.0);
    binData[18] = (S.quaternion.z * 128.0);
    binData[19] = (S.quaternion.w * 128.0);

    binData[20] = S.userid;

    //binData[21] = parseInt(S.rank);

    //console.log(binData);
    return binData;
}

// Decode state
VRoadcast.decodeState = (binData)=>{
    let S = {};
    let view = new Int8Array(binData);

    //S.userid = binData[20];
    S.userid = view[20];

    //console.log(view);

    // First decode quat
    S.quaternion = new THREE.Quaternion(
        view[16] / 128.0,
        view[17] / 128.0,
        view[18] / 128.0,
        view[19] / 128.0
    );

    // Now decode floats
    view = new Float32Array(binData);
    S.position = new THREE.Vector3(view[0],view[1],view[2]);
    //S.scale = A[3];

/*
    // First decode quat
    S.quaternion = new THREE.Quaternion(
        binData[16] / 128.0,
        binData[17] / 128.0,
        binData[18] / 128.0,
        binData[19] / 128.0
    );

    // Now decode floats
    let a8 = new Int8Array(16);
    for (var i=0; i<16; i++) a8[i] = binData[i];
    let A = new Float32Array(a8.buffer);

    S.position = new THREE.Vector3(A[0],A[1],A[2]);

    //S.scale = A[3];
*/
    return S;
}


// Update
VRoadcast.update = ()=>{
    if (!VRoadcast._connected) return;

    // State interpolation
    for (let a=0; a<VRoadcast.avatarList.length; a++){
        let A = VRoadcast.avatarList[a];
        if (A && A.visible){
            //A._tStateDur = VRoadcast.USER_STATE_FREQ;
            A.update();
        }
    }
};

VRoadcast.setFocusStreaming = (b)=>{
    if (b === undefined) return;

    if (b){
        if (!VRoadcast._bStreamFocus){

            ATON.fireEvent("VRC_FocusStreamingStarted");
        }

        VRoadcast._bStreamFocus = true;
        return;
    }
    else {
        if (VRoadcast._bStreamFocus){

            ATON.fireEvent("VRC_FocusStreamingStopped");
        }

        // Restore selector radius
        let r = ATON.SUI._selectorRad;
        ATON.SUI.mainSelector.scale.set(r,r,r);

        VRoadcast._bStreamFocus = false;
    }
};

VRoadcast.sendState = ()=>{
    if (!VRoadcast.bSendState) return;
    if (VRoadcast.uid === undefined) return;
    if (!VRoadcast.socket || !VRoadcast._connected) return;
    
    let cpov = ATON.Nav._currPOV;
    if (!cpov) return;
    //console.log(cpov);

    // Focus streaming
    let fp = ATON.getSceneQueriedPoint();
    if (VRoadcast._bStreamFocus && fp !== undefined){
        //let F = new THREE.Vector3();
        let fx = (fp.x /*- cpov.pos.x*/).toPrecision(5);
        let fy = (fp.y /*- cpov.pos.y*/).toPrecision(5);
        let fz = (fp.z /*- cpov.pos.z*/).toPrecision(5);
        let r  = ATON.SUI.getSelectorRadius().toPrecision(5);
        
        VRoadcast.socket.emit("UFOCUS", [fx,fy,fz, r]);
    }

    // Compose state
    let S = {};
    S.position = new THREE.Vector3();
    S.quaternion = new THREE.Quaternion();

    S.position.copy(cpov.pos);
    S.quaternion.copy(ATON.Nav._qOri);
    S.userid = VRoadcast.uid;

    // Save bandwidth
    if (VRoadcast._lastStateSent !== undefined){
        let lastPos = VRoadcast._lastStateSent.position;
        let lastOri = VRoadcast._lastStateSent.quaternion;

        let dPos = lastPos.distanceToSquared(cpov.pos);
        let dOri = lastOri.angleTo(ATON.Nav._qOri);

        if ( dPos < VRoadcast.THRES_STATE_POS && dOri < VRoadcast.THRES_STATE_ORI) return;
    }

    // Encode and send
    let binData = VRoadcast.encodeState(S);
    VRoadcast.socket.emit("USTATE", binData/*.buffer*/ );
    VRoadcast._lastStateSent = S;

    //console.log("State sent");
};


// Avatars
VRoadcast.getAvatar = (uid)=>{
    return VRoadcast.avatarList[uid];
};

VRoadcast.touchAvatar = (uid)=>{
    // First time
    if (VRoadcast.avatarList[uid] === undefined){
        let A = new VRoadcast.Avatar(uid);
        A.attachTo(VRoadcast.avaGroup);
        
        A.loadRepresentation(ATON.PATH_RES+"models/vrc/head.gltf");
        //console.log(VRoadcast.avaGroup);

        VRoadcast.avatarList[uid] = A;

        //console.log(VRoadcast.avatarList);
        //console.log(ATON.MatHub.materials.avatars);
        //console.log(A);
        
        //VRoadcast._numUsers++;
        //ATON.fireEvent("VRC_UserEnter", uid);
    }

    let A = VRoadcast.avatarList[uid];

    // Reclaim of previously used slot
    if (!A.visible){
        VRoadcast._numUsers++;
        ATON.fireEvent("VRC_UserEnter", uid);
    }

    if (VRoadcast._bShowAvaG) A.show();

    return A;
}

VRoadcast.destroyAvatar = (uid)=>{
    let A = VRoadcast.avatarList[uid];
    if (A === undefined) return;

    A.destroy();
};

VRoadcast.clearAllAvatars = ()=>{
    for (let i in VRoadcast.avatarList){
        let A = VRoadcast.avatarList[i];
        A.hide();
        //A.dispose();
    }
};

export default VRoadcast;