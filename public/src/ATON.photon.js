/*
    ATON Photon client (previously "VRoadcast")
    
    Real-time communication over networks

    author: bruno.fanini_AT_gmail.com

===========================================================*/

import Avatar from "./ATON.avatar.js";

/**
ATON Photon client component (previously "VRoadcast").
Real-time communication over networks
@namespace Photon
*/
let Photon = {};

Photon.USER_STATE_FREQ = 0.25; // sec
Photon.REPLICATED_EVT = "EREP";

// Thresholds state sending
Photon.THRES_STATE_POS = 0.01;
Photon.THRES_STATE_ORI = 0.08; // radians

Photon.Avatar = Avatar;

Photon.CSTATE = {
    DISCONNECTED: 0,
    CONNECTING: 1,
    CONNECTED: 2
};

/**
Initialize the component
*/
Photon.init = ()=>{
    Photon.address = window.location.origin;

    Photon.initMaterials();

    Photon.socket = undefined;
    //Photon._connected = false;
    Photon._cstate = Photon.CSTATE.DISCONNECTED;
    Photon._reqSSID = undefined;

    Photon._username = undefined;

    Photon.uid = undefined; // my userID (0,1,....)
    Photon.color = ATON.MatHub.colors.white;
    Photon._bStreamFocus = false; // stream focal point
    
    Photon._numUsers = 1;

    Photon.avatarList = [];

    Photon.avaGroup = ATON.createUINode("avatars"); // holds all avatars representations
    Photon.avaGroup.attachToRoot();

    Photon.focGroup = ATON.createUINode("focus"); // holds all avatars focal points
    Photon.focGroup.attachTo(Photon.avaGroup);
    Photon._focNodes = [];

    // send own state with given freq
    Photon.bSendState = true;
    window.setInterval( Photon.sendState, Photon.USER_STATE_FREQ*1000.0 );
    Photon._lastStateSent = undefined;

    Photon._bShowAvaG = true;
    Photon._bSpatial  = true;

    Photon._decS = {
        quaternion: new THREE.Quaternion(),
        position: new THREE.Vector3()
    };

    //Photon._encS = 

    Photon.customAvatarMaterial = undefined;

    console.log("Photon initialized");
    Photon.enableChatLog();

    // Hosts local vstream
    Photon._elVStream = undefined;

    window.addEventListener("beforeunload", (event) => {
        Photon.disconnect();
    });
};

/**
Provide custom routine for avatars' materials.
By default avatars are assigned colors depending on their ID in the session
@param {function} f - the custom routine: must return a THREE.Material

@example
ATON.Photon.setCustomAvatarMaterialRoutine(()=>{
    return new THREE.Material({ color: ATON.MatHub.colors.white });
});
*/
Photon.setCustomAvatarMaterialRoutine = (f)=>{
    Photon.customAvatarMaterial = f;
};

Photon.enableChatLog = ()=>{
    Photon._elChat = $("<div id='idChatBox' class='atonVRCchatBox'></div>").text("");
};

Photon.getNumUsers = ()=>{
    return Photon._numUsers;
};

// Register materials (avatars/users)
Photon.initMaterials = ()=>{

    Photon.ucolorhex = [];
    Photon.ucolorhex.push("#D88");
    Photon.ucolorhex.push("#DD8");
    Photon.ucolorhex.push("#8D8");
    Photon.ucolorhex.push("#8DD");
    Photon.ucolorhex.push("#88D");
    Photon.ucolorhex.push("#D8D");

    Photon.ucolorhex_light = [];
    Photon.ucolorhex_light.push("#FAA");
    Photon.ucolorhex_light.push("#FFA");
    Photon.ucolorhex_light.push("#AFA");
    Photon.ucolorhex_light.push("#AFF");
    Photon.ucolorhex_light.push("#AAF");
    Photon.ucolorhex_light.push("#FAF");

    Photon.ucolors = [];
/*
    Photon.ucolors.push( new THREE.Color(1,0,0) );
    Photon.ucolors.push( new THREE.Color(1,1,0) );
    Photon.ucolors.push( new THREE.Color(0,1,0) );
    Photon.ucolors.push( new THREE.Color(0,1,1) );
    Photon.ucolors.push( new THREE.Color(0,0,1) );
    Photon.ucolors.push( new THREE.Color(1,0,1) );
*/
    Photon.ucolors.push( new THREE.Color(Photon.ucolorhex[0]) );
    Photon.ucolors.push( new THREE.Color(Photon.ucolorhex[1]) );
    Photon.ucolors.push( new THREE.Color(Photon.ucolorhex[2]) );
    Photon.ucolors.push( new THREE.Color(Photon.ucolorhex[3]) );
    Photon.ucolors.push( new THREE.Color(Photon.ucolorhex[4]) );
    Photon.ucolors.push( new THREE.Color(Photon.ucolorhex[5]) );

    Photon.ucolorsdark = [];
    Photon.ucolorsdark.push( new THREE.Color(0.2,0.0,0.0) );
    Photon.ucolorsdark.push( new THREE.Color(0.2,0.2,0.0) );
    Photon.ucolorsdark.push( new THREE.Color(0.0,0.2,0.0) );
    Photon.ucolorsdark.push( new THREE.Color(0.0,0.2,0.2) );
    Photon.ucolorsdark.push( new THREE.Color(0.0,0.0,0.2) );
    Photon.ucolorsdark.push( new THREE.Color(0.2,0.0,0.2) );

    let MM = ATON.MatHub.materials;
    if (MM) MM.avatars = [];

/*
    let mat = new THREE.MeshBasicMaterial({
        color: Photon.ucolors[0], 
        transparent: true, 
        opacity: 0.4, 
        depthWrite: false,
        flatShading: true
    });
*/

    for (let c=0; c<Photon.ucolors.length; c++){
        let M = ATON.MatHub.materials.defUI.clone();
        M.color = Photon.ucolors[c];

        //M.uniforms.tint.value.set(Photon.ucolors[c].r, Photon.ucolors[c].g, Photon.ucolors[c].b);
        M.uniforms.tint.value = Photon.ucolors[c];
        M.uniforms.opacity.value = 0.5;
/*
        let M = new THREE.MeshBasicMaterial({
            color: Photon.ucolors[c],
            transparent: true,
            depthWrite: false,
            opacity: 0.2 
            //flatShading: true
        });
*/
        MM.avatars.push(M);
    }

    // AudioUI user materials
    Photon.uspritemats = [];

    let texAUI = new THREE.TextureLoader().load( ATON.PATH_RES+"useraui.png" );
    for (let c=0; c<Photon.ucolors.length; c++){
        let smat = new THREE.SpriteMaterial({ 
            map: texAUI,
            depthWrite: false,
            color: Photon.ucolors[c] // multiply
        });
        smat.sizeAttenuation = true;

        Photon.uspritemats.push(smat);
    }

    // Focal points
    Photon.ufocmats = [];

    let texFocP = new THREE.TextureLoader().load( ATON.PATH_RES+"focus.png" );
    for (let c=0; c<Photon.ucolors.length; c++){
        let smat = new THREE.SpriteMaterial({ 
            map: texFocP,
            depthWrite: false,
            depthTest: false,
            color: Photon.ucolors[c] // multiply
        });
        smat.sizeAttenuation = true;

        Photon.ufocmats.push(smat);
    }
};

/**
Fire a replicated event (network)
@param {string} evtname - the event name
@param {object} data - object containing data to be transmitted with this event

@example
ATON.Photon.fire("test", 42);
*/
Photon.fire = (evtname, data)=>{
    if (!Photon.isConnected()) return;
    let sock = Photon.socket;

    if (sock) sock.emit(Photon.REPLICATED_EVT, {e: evtname, d: data});
    //else ATON.on("VRC_Connected", ()=>{ sock.on(evtname, onReceive); });
};

Photon.fireEvent = Photon.fire; // Backwards compatibility

/**
Subscribe to a given network event, through given handler
@param {string} evtname - the event name
@param {function} handler - network event handler (how we handle incoming event)

@example
ATON.Photon.on("test", function(data){ console.log("Received: "+data); });
*/
Photon.on = (evtname, handler)=>{
    if (handler === undefined) return;

    let evhNetwork = ATON.EventHub.evNetwork;

    if (evhNetwork[evtname] === undefined) evhNetwork[evtname] = []; // First time (event not registered)
    evhNetwork[evtname].push(handler);
};

/**
Return true if connected to the Photon service
@returns {boolean}
*/
Photon.isConnected = ()=>{
    //if (Photon.socket === undefined) return false;
    //return Photon._connected;
    return (Photon._cstate === Photon.CSTATE.CONNECTED);
};

/**
Return true if we have a Photon ID assigned
@returns {boolean}
*/
Photon.hasID = ()=>{
    if (Photon.uid === undefined) return false;
    return true;
};

/**
Utility for remote logging
@param {string} d - string data to be logged
*/
Photon.log = (d)=>{
    if (!Photon.isConnected()) return;
    let sock = Photon.socket;

    if (sock) sock.emit("UMSG", d); //sock.emit("LOG", d);
};

/**
Request to join a given Photon session (typically, the scene ID)
@param {string} ssid - the session id (room or scene ID)
@example
ATON.Photon.joinSession("testscene");
*/
Photon.joinSession = (ssid)=>{
    if (!Photon.socket) return;
    if (ssid === undefined) ssid = ATON.SceneHub.currID;

    if (ssid === undefined){
        console.log("Photon ERROR: current session ID is undefined");
        return;
    }

    console.log("Joining Photon session '"+ssid+"'...");
    Photon.socket.emit("SENTER", ssid );
};

Photon.requestSceneState = ()=>{
    if (!Photon.socket) return;

    Photon.socket.emit("SSTATE");
};

Photon.setAvatarsVisibility = (b)=>{
    Photon._bShowAvaG = b;

    if (b) Photon.avaGroup.show();
    else Photon.avaGroup.hide();
};

Photon.disableSpatiality = ()=>{
    Photon._bSpatial = false;
};

Photon.enableSpatiality = ()=>{
    Photon._bSpatial = true;
};

/**
Set address for Photon service. Default is same server where main service is running.
This is used if the service is running on a remote server/node
@param {string} address - the address of the service.
@example
ATON.Photon.setAddress();
*/
Photon.setAddress = (address)=>{
    if (address) Photon.address = address;
}

/**
Connect to Photon service
@param {string} ssid - the session ID to join after successfully connected (optional). Default is current scene-ID (if any loaded)
@example
ATON.Photon.connect();
*/
Photon.connect = (ssid)=>{
    if (Photon._cstate === Photon.CSTATE.CONNECTED) return;
    if (Photon._cstate === Photon.CSTATE.CONNECTING) return; 

    Photon._reqSSID = ssid;

    let opts = {};

    // Secure connection
    if (ATON.Utils.isConnectionSecure()){
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

    Photon._cstate = Photon.CSTATE.CONNECTING;

    Photon.socket = io.connect(Photon.address, opts); //, { 'force new connection': true });

    if (Photon.socket === undefined){
        Photon._cstate = Photon.CSTATE.DISCONNECTED;
        return;
    }
    //Photon._connected = Photon.socket.connected;

    Photon._registerSocketHandlers();
};

Photon.disconnect = ()=>{
    if (Photon.socket === undefined) return;

    Photon._numUsers = 1;

    Photon.socket.disconnect();
    
    Photon.color   = ATON.MatHub.colors.white;
    ATON.plight.color = ATON.MatHub.colors.white;

    //Photon._connected = false;
    Photon._cstate = Photon.CSTATE.DISCONNECTED;
};


Photon._onConnected = ()=>{
    //
};

Photon.setUsername = (username)=>{
    username = username.trim();
    if (username.length < 1) return;

    Photon._username = username;
    if (Photon.socket === undefined) return;
    if (Photon.uid === undefined) return;

    Photon.appendToChatBox("<i>Your username is now: "+username+"</i>");
   
    Photon.socket.emit("UNAME", username);
};

Photon.setMessage = (msg)=>{
    msg = msg.trim();
    if (msg.length < 1) return;
    if (msg.length > 3000) return; // limit max string (check)

    Photon._msg = msg;
    if (Photon.socket === undefined) return;
    if (Photon.uid === undefined) return;

    Photon.socket.emit("UMSG", msg);

    if (Photon._elChat){
        msg = Photon.chatMessageProcessor(Photon.uid, msg);
        Photon.appendToChatBox("<div class='"+ATON.FE.getVRCclassFromID(Photon.uid)+" atonVRCchatUsername'>YOU</div>: <span style='color:"+Photon.ucolorhex_light[Photon.uid%6]+"'>"+msg+"</span>");
    }
};

Photon.appendToChatBox = (text)=>{
    if (!Photon._elChat) return;

    Photon._elChat.append("<div class='atonVRCchatMessage'>"+text+"</div>");
    Photon._elChat.scrollTop(Photon._elChat[0].scrollHeight);
};


// Handle incoming server msgs
Photon._registerSocketHandlers = ()=>{

    // We connected to server
    Photon.socket.on('connect', ()=>{
        //Photon._connected = true;
        Photon._cstate = Photon.CSTATE.CONNECTED;

        // Join session
        if (Photon._reqSSID !== undefined) Photon.joinSession(Photon._reqSSID);
        else Photon.joinSession(ATON.SceneHub.currID);
        
        console.log("Connected to Photon service!");
        ATON.fire("VRC_Connected");

        Photon._onConnected();
    });

    Photon.socket.on('disconnect', ()=>{
        //Photon._connected = false;
        Photon._cstate = Photon.CSTATE.DISCONNECTED;

        Photon.uid = undefined;

        Photon.avaGroup.hide();

        Photon.appendToChatBox("<i>YOU disconnected from the Photon session</i>");

        console.log("Disconnected from Photon service!");
        ATON.fire("VRC_Disconnected");
    });

    // Incoming replicated event
    Photon.socket.on(Photon.REPLICATED_EVT, (data)=>{
        let evtname = data.e;
        let d = data.d;

        let ehList = ATON.EventHub.evNetwork[evtname];
        ATON.EventHub.executeHandlers(ehList, d);
    });

    Photon.socket.on('ID', (data)=>{
        console.log("Your ID is " + data);
        Photon.uid = data;
        Photon.color = Photon.ucolors[Photon.uid % Photon.ucolors.length];

        if (Photon._bShowAvaG) Photon.avaGroup.show();

        Photon.appendToChatBox("<i>Your ID is #"+data+"</i>");

        // Request scene state
        Photon.requestSceneState();

        ATON.fire("VRC_IDassigned", data);
    });

    Photon.socket.on('SSTATE', (data)=>{
        Photon._numUsers = data.numUsers;
        console.log("Num. users: "+Photon._numUsers);

        ATON.fire("VRC_SceneState", data);
    });

    Photon.socket.on('UENTER', (data)=>{
        let uid = data;
        //if (uid === Photon.uid) return; // myself

        console.log("User #" +uid+" entered the session");

        Photon.appendToChatBox("<i>User #"+uid+" entered the session</i>");

        //if (Photon._bSpatial) Photon.touchAvatar(uid);
        
        //Photon._numUsers++;
        Photon.requestSceneState();
        ATON.fire("VRC_UserEnter", uid);
    });

    Photon.socket.on('ULEAVE', (data)=>{
        let uid = data;
        if (uid === undefined) return;
        
        let A = Photon.avatarList[uid];
        if (A){
            A.toggleStreamPanel(false);
            A.hide();
        }

        // TODO: hide also focus

        console.log("User #" +uid+" left the session");

        Photon.appendToChatBox("<i>User #"+uid+" left the session</i>");

        //if (Photon._numUsers>1) Photon._numUsers--;
        Photon.requestSceneState();
        ATON.fire("VRC_UserLeave", uid);
    });

    Photon.socket.on('USTATE', (data)=>{
        //if (ATON._numReqLoad>0) return; // check / fixme
        if (!Photon._bShowAvaG) return;
        if (!Photon._bSpatial) return;

        let S = Photon.decodeState(data);

        let uid = S.userid;
        let A = Photon.touchAvatar(uid);

        //A.position.copy(S.position);
        //A.quaternion.copy(S.quaternion);
        
        A.requestStateTransition(S);

        let s = 1.0/S.scale;
        A.scale.set(s,s,s);
        //A.hideFocalPoint();
    });

    Photon.socket.on('UFOCUS', (data)=>{
        if (!Photon._bSpatial) return;

        let uid = data.uid;
        let fp  = data.fp;

        let A = Photon.touchAvatar(uid);

        A.requestFocus(fp);
    });

    Photon.socket.on('UNAME', (data)=>{
        let uid   = data.uid;
        let uname = data.name;

        if (uid === undefined) return;

        let A = Photon.touchAvatar(uid);
        A.setUsername(uname);

        console.log("User #" +uid+" changed username to: "+uname);

        Photon.appendToChatBox("<i>User #"+uid+" changed username to: "+uname+"</i>");

        ATON.fire("VRC_UName", data);
    });

    Photon.socket.on('UMSG', (data)=>{
        let uid = data.uid;
        let msg = data.msg;

        if (uid === undefined) return;

        let A = Photon.touchAvatar(uid);
        if (msg.length < 100) A.setMessage(msg); // only short messages for 3D label

        console.log("User #" +uid+": "+msg);

        let uname = A.getUsername();

        msg = Photon.chatMessageProcessor(uid, msg);
        let col  = Photon.ucolorhex[uid%6];
        let col2 = Photon.ucolorhex_light[uid%6];

        Photon.appendToChatBox("<div class='"+ATON.FE.getVRCclassFromID(uid)+" atonVRCchatUsername'>"+uname+"</div>: <span style='color:"+col2+"'>"+msg+"</span>");

        ATON.fire("VRC_UMessage", data);
    });

    Photon.socket.on('UTALK', (data)=>{
        let uid = data.uid;
        if (uid === undefined) return;

        let au = data.audio;
        if (!au) return;

        if (Photon._bSpatial){
            let A = Photon.touchAvatar(uid);

            if (A.bMuted) return;

            ATON.AudioHub._loader.load( au, (buffer)=>{
                let aa = A._auTalk[A._auTalki];
                let ii = (A._auTalki+1)%2;

                //aa.setPlaybackRate(0.95);
                aa.setBuffer( buffer );
                //console.log(aa)
                
                if (!aa.isPlaying) aa.play();

                A.setTalkVolume(5.0);

                A._auTalki = ii;
            });
        }

        ATON.fire("VRC_UTalk", data);

        au = null;
    });

    Photon.socket.on('UTALKSTOP', (data)=>{
        let uid = data.uid;
        if (uid === undefined) return;

        //

        ATON.fire("VRC_UTalkStop", data);
    });

    Photon.socket.on('UVIDEO', (data)=>{
        let uid = data.uid;
        if (uid === undefined) return;

        ATON.fire("VRC_UVideo", data);
    });

    Photon.socket.on('UVIDEOSTOP', (data)=>{
        let uid = data.uid;
        if (uid === undefined) return;

        let A = Photon.avatarList[uid];
        if (A) A.toggleStreamPanel(false);

        ATON.fire("VRC_UVideoStop", data);
    });
};

Photon.chatMessageProcessor = (uid, text)=>{
    text = String(text);

    const urls = text.match(/(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)/g);
    if (urls){
        urls.forEach((url)=>{
            text = text.replace(url, "<a target='_blank' href='"+url+"'>"+url+"</a>");
        });
    }

    return text;
};

// Encode state
Photon.encodeState = (S)=>{
    if (!S) return;

    let A = new Float32Array(5); // make sufficient room
    A[0] = S.position.x;
    A[1] = S.position.y;
    A[2] = S.position.z;

    // Convert to byte array, we use last float storage (4 bytes)
    var binData = new Int8Array(A.buffer); // signed

    binData[12] = (S.quaternion.x * 128.0);
    binData[13] = (S.quaternion.y * 128.0);
    binData[14] = (S.quaternion.z * 128.0);
    binData[15] = (S.quaternion.w * 128.0);

    binData[16] = S.userid;
    binData[17] = ATON._ws;

    //binData[19] = ...

    //console.log(binData);
    return binData;
}

// Decode state
Photon.decodeState = (binData)=>{
    let view = new Int8Array(binData);

    Photon._decS.userid = view[16];
    let s = ATON._unpackScale( view[17] );
    Photon._decS.scale = s;

    //console.log(view);

    // First decode quat
    Photon._decS.quaternion.set(
        parseFloat(view[12]) / 128.0,
        parseFloat(view[13]) / 128.0,
        parseFloat(view[14]) / 128.0,
        parseFloat(view[15]) / 128.0
    );

    // Now decode floats
    view = new Float32Array(binData);
    //Photon._decS.position = new THREE.Vector3(view[0],view[1],view[2]);
    Photon._decS.position.set(
        parseFloat(view[0]) / s,
        parseFloat(view[1]) / s,
        parseFloat(view[2]) / s
    );

    //console.log(Photon._decS.scale)

    return Photon._decS;
}


// Update
Photon.update = ()=>{
    if (!Photon.isConnected()) return;

    // State interpolation
    for (let a=0; a<Photon.avatarList.length; a++){
        let A = Photon.avatarList[a];
        if (A && A.visible){
            //A._tStateDur = Photon.USER_STATE_FREQ;
            A.update();
        }
    }
};

Photon.setFocusStreaming = (b)=>{
    if (b === undefined) return;

    if (b){
        if (!Photon._bStreamFocus){
            ATON.fire("VRC_FocusStreamingStarted");
            ATON.enablePointLight();
            ATON.plight.color = ATON.Photon.color;
        }

        Photon._bStreamFocus = true;
        return;
    }
    else {
        if (Photon._bStreamFocus){
            ATON.fire("VRC_FocusStreamingStopped");
            ATON.disablePointLight();
        }

        // Restore selector radius
        let r = ATON.SUI._selectorRad;
        ATON.SUI.mainSelector.scale.set(r,r,r);

        Photon._bStreamFocus = false;
    }
};

Photon.sendState = ()=>{
    if (!Photon.bSendState || !Photon._bSpatial) return;
    if (Photon.uid === undefined) return;
    if (!Photon.socket || !Photon.isConnected()) return;
    
    let cpov = ATON.Nav._currPOV;
    if (!cpov) return;
    //console.log(cpov);

    // Focus streaming
    let fp = ATON.getSceneFocalPoint();
    if (Photon._bStreamFocus && fp !== undefined){
        let fx = (fp.x).toFixed(3);
        let fy = (fp.y).toFixed(3);
        let fz = (fp.z).toFixed(3);
        let r  = ATON.SUI.getSelectorRadius().toFixed(3);
        
        Photon.socket.emit("UFOCUS", [fx,fy,fz, r]);

        //fp = null;
    }

    if (!cpov.pos) return;
    if (!ATON.Nav._qOri) return;

    // Save bandwidth
    if (Photon._lastStateSent !== undefined){
        let lastPos = Photon._lastStateSent.position;
        let lastOri = Photon._lastStateSent.quaternion;

        let dPos = lastPos.distanceToSquared(cpov.pos);
        let dOri = lastOri.angleTo(ATON.Nav._qOri);

        if ( dPos < Photon.THRES_STATE_POS && dOri < Photon.THRES_STATE_ORI) return;
    }

    // Compose state
    if (Photon._lastStateSent === undefined){
        Photon._lastStateSent = {};
        Photon._lastStateSent.position   = new THREE.Vector3();
        Photon._lastStateSent.quaternion = new THREE.Quaternion();
    }

    Photon._lastStateSent.position.copy(cpov.pos);
    Photon._lastStateSent.quaternion.copy(ATON.Nav._qOri);
    Photon._lastStateSent.userid = Photon.uid;
    Photon._lastStateSent.scale  = ATON._worldScale;

    // Encode and send
    let binData = Photon.encodeState( Photon._lastStateSent );
    Photon.socket.emit("USTATE", binData/*.buffer*/ );
    //Photon._lastStateSent = S;

    //console.log("State sent");
};


// Avatars
Photon.getAvatar = (uid)=>{
    return Photon.avatarList[uid];
};

Photon.touchAvatar = (uid)=>{
    // First time
    if (Photon.avatarList[uid] === undefined){
        let ava = new Photon.Avatar(uid);
        ava.attachTo(Photon.avaGroup);
        
        ava.loadRepresentation(ATON.PATH_RES+"models/vrc/head.glb");
        //console.log(Photon.avaGroup);

        Photon.avatarList[uid] = ava;

        //console.log(Photon.avatarList);
        //console.log(ATON.MatHub.materials.avatars);
        //console.log(A);
        
        //Photon._numUsers++;
        //ATON.fire("VRC_UserEnter", uid);

        //console.log(ava)
    }

    let A = Photon.avatarList[uid];

    // Reclaim of previously used slot
    if (!A.visible){
        //Photon._numUsers++;
        ATON.fire("VRC_UserEnter", uid);
    }

    if (Photon._bShowAvaG) A.show();

    return A;
}

Photon.destroyAvatar = (uid)=>{
    let A = Photon.avatarList[uid];
    if (A === undefined) return;

    A.destroy();
};

Photon.clearAllAvatars = ()=>{
    for (let i in Photon.avatarList){
        let A = Photon.avatarList[i];
        A.hide();
        //A.dispose();
    }
};

Photon.getAvatarMaterialByUID = (uid)=>{

    const avaMats = ATON.MatHub.materials.avatars;
    let mi = (uid % avaMats.length); //uid? (uid % avaMats.length) : 0;
    
    return avaMats[mi];
};

export default Photon;