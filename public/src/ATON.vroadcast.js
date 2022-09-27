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
    VRoadcast._reqSSID = undefined;

    VRoadcast._username = undefined;

    VRoadcast.uid = undefined; // my userID (0,1,....)
    VRoadcast.color = ATON.MatHub.colors.white;
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
    VRoadcast._bSpatial  = true;

    console.log("VRoadcast initialized");
    VRoadcast.enableChatLog();

    // Hosts local vstream
    VRoadcast._elVStream = undefined;

    VRoadcast._decS = {
        quaternion: new THREE.Quaternion(),
        position: new THREE.Vector3()

    };
    //VRoadcast._encS = 

    VRoadcast.customAvatarMaterial = undefined;
};

/**
Provide custom routine for avatars' materials.
By default avatars are assigned colors depending on their ID in the session
@param {function} f - the custom routine: must return a THREE.Material

@example
ATON.VRoadcast.setCustomAvatarMaterialRoutine(()=>{
    return new THREE.Material({ color: ATON.MatHub.colors.white });
});
*/
VRoadcast.setCustomAvatarMaterialRoutine = (f)=>{
    VRoadcast.customAvatarMaterial = f;
};

VRoadcast.enableChatLog = ()=>{
    VRoadcast._elChat = $("<div id='idChatBox' class='atonVRCchatBox'></div>").text("");
};

VRoadcast.getNumUsers = ()=>{
    return VRoadcast._numUsers;
};

// Register materials (avatars/users)
VRoadcast.initMaterials = ()=>{

    VRoadcast.ucolorhex = [];
    VRoadcast.ucolorhex.push("#F00");
    VRoadcast.ucolorhex.push("#FF0");
    VRoadcast.ucolorhex.push("#0F0");
    VRoadcast.ucolorhex.push("#0FF");
    VRoadcast.ucolorhex.push("#00F");
    VRoadcast.ucolorhex.push("#F0F");

    VRoadcast.ucolorhex_light = [];
    VRoadcast.ucolorhex_light.push("#FAA");
    VRoadcast.ucolorhex_light.push("#FFA");
    VRoadcast.ucolorhex_light.push("#AFA");
    VRoadcast.ucolorhex_light.push("#AFF");
    VRoadcast.ucolorhex_light.push("#AAF");
    VRoadcast.ucolorhex_light.push("#FAF");

    VRoadcast.ucolors = [];
/*
    VRoadcast.ucolors.push( new THREE.Color(1,0,0) );
    VRoadcast.ucolors.push( new THREE.Color(1,1,0) );
    VRoadcast.ucolors.push( new THREE.Color(0,1,0) );
    VRoadcast.ucolors.push( new THREE.Color(0,1,1) );
    VRoadcast.ucolors.push( new THREE.Color(0,0,1) );
    VRoadcast.ucolors.push( new THREE.Color(1,0,1) );
*/
    VRoadcast.ucolors.push( new THREE.Color(VRoadcast.ucolorhex[0]) );
    VRoadcast.ucolors.push( new THREE.Color(VRoadcast.ucolorhex[1]) );
    VRoadcast.ucolors.push( new THREE.Color(VRoadcast.ucolorhex[2]) );
    VRoadcast.ucolors.push( new THREE.Color(VRoadcast.ucolorhex[3]) );
    VRoadcast.ucolors.push( new THREE.Color(VRoadcast.ucolorhex[4]) );
    VRoadcast.ucolors.push( new THREE.Color(VRoadcast.ucolorhex[5]) );

    VRoadcast.ucolorsdark = [];
    VRoadcast.ucolorsdark.push( new THREE.Color(0.2,0.0,0.0) );
    VRoadcast.ucolorsdark.push( new THREE.Color(0.2,0.2,0.0) );
    VRoadcast.ucolorsdark.push( new THREE.Color(0.0,0.2,0.0) );
    VRoadcast.ucolorsdark.push( new THREE.Color(0.0,0.2,0.2) );
    VRoadcast.ucolorsdark.push( new THREE.Color(0.0,0.0,0.2) );
    VRoadcast.ucolorsdark.push( new THREE.Color(0.2,0.0,0.2) );

    let MM = ATON.MatHub.materials;
    MM.avatars = [];

/*
    let mat = new THREE.MeshBasicMaterial({
        color: VRoadcast.ucolors[0], 
        transparent: true, 
        opacity: 0.4, 
        depthWrite: false,
        flatShading: true
    });
*/

    for (let c=0; c<VRoadcast.ucolors.length; c++){
        let M = ATON.MatHub.materials.defUI.clone();
        M.color = VRoadcast.ucolors[c];

        //M.uniforms.tint.value.set(VRoadcast.ucolors[c].r, VRoadcast.ucolors[c].g, VRoadcast.ucolors[c].b);
        M.uniforms.tint.value = VRoadcast.ucolors[c];
        M.uniforms.opacity.value = 0.5;
/*
        let M = new THREE.MeshBasicMaterial({
            color: VRoadcast.ucolors[c],
            transparent: true,
            depthWrite: false,
            opacity: 0.2 
            //flatShading: true
        });
*/
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
Utility for remote logging
@param {string} d - string data to be logged
*/
VRoadcast.log = (d)=>{
    if (!VRoadcast._connected) return;
    let sock = VRoadcast.socket;

    if (sock) sock.emit("UMSG", d); //sock.emit("LOG", d);
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

    console.log("Joining VRC session '"+ssid+"'...");
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

VRoadcast.disableSpatiality = ()=>{
    VRoadcast._bSpatial = false;
};

VRoadcast.enableSpatiality = ()=>{
    VRoadcast._bSpatial = true;
};

/**
Set address for VRoadcast service. Default is same server where main service is running.
This is used if the service is running on a remote server/node
@param {string} address - the address of the service.
@example
ATON.VRoadcast.setAddress();
*/
VRoadcast.setAddress = (address)=>{
    if (address) VRoadcast.address = address;
}

/**
Connect to VRoadcast service
@param {string} ssid - the session ID to join after successfully connected (optional). Default is current scene-ID (if any loaded)
@example
ATON.VRoadcast.connect();
*/
VRoadcast.connect = (ssid)=>{
    if (VRoadcast._connected) return;

    VRoadcast._reqSSID = ssid;

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
    
    VRoadcast.color   = ATON.MatHub.colors.white;
    ATON.plight.color = ATON.MatHub.colors.white;

    VRoadcast._connected = false;
};


VRoadcast._onConnected = ()=>{
    //
};

VRoadcast.setUsername = (username)=>{
    username = username.trim();
    if (username.length < 1) return;

    VRoadcast._username = username;
    if (VRoadcast.socket === undefined) return;
    if (VRoadcast.uid === undefined) return;

    VRoadcast.appendToChatBox("<i>Your username is now: "+username+"</i>");
   
    VRoadcast.socket.emit("UNAME", username);
};

VRoadcast.setMessage = (msg)=>{
    msg = msg.trim();
    if (msg.length < 1) return;
    if (msg.length > 3000) return; // limit max string (check)

    VRoadcast._msg = msg;
    if (VRoadcast.socket === undefined) return;
    if (VRoadcast.uid === undefined) return;

    VRoadcast.socket.emit("UMSG", msg);

    if (VRoadcast._elChat){
        msg = VRoadcast.chatMessageProcessor(VRoadcast.uid, msg);
        VRoadcast.appendToChatBox("<div class='"+ATON.FE.getVRCclassFromID(VRoadcast.uid)+" atonVRCchatUsername'>YOU</div>: <span style='color:"+VRoadcast.ucolorhex_light[VRoadcast.uid%6]+"'>"+msg+"</span>");
    }
};

VRoadcast.appendToChatBox = (text)=>{
    if (!VRoadcast._elChat) return;

    VRoadcast._elChat.append("<div class='atonVRCchatMessage'>"+text+"</div>");
    VRoadcast._elChat.scrollTop(VRoadcast._elChat[0].scrollHeight);
};


// Handle incoming server msgs
VRoadcast._registerSocketHandlers = ()=>{

    // We connected to server
    VRoadcast.socket.on('connect', ()=>{
        VRoadcast._connected = true;

        // Join session
        if (VRoadcast._reqSSID !== undefined) VRoadcast.joinSession(VRoadcast._reqSSID);
        else VRoadcast.joinSession(ATON.SceneHub.currID);
        
        console.log("Connected to VRC service!");
        ATON.fireEvent("VRC_Connected");

        VRoadcast._onConnected();
    });

    VRoadcast.socket.on('disconnect', ()=>{
        VRoadcast._connected = false;
        VRoadcast.uid = undefined;

        VRoadcast.avaGroup.hide();

        VRoadcast.appendToChatBox("<i>YOU disconnected from the collaborative session</i>");

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
        VRoadcast.color = VRoadcast.ucolors[VRoadcast.uid % VRoadcast.ucolors.length];

        if (VRoadcast._bShowAvaG) VRoadcast.avaGroup.show();

        VRoadcast.appendToChatBox("<i>Your ID is #"+data+"</i>");

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

        console.log("User #" +uid+" entered the session");

        VRoadcast.appendToChatBox("<i>User #"+uid+" entered the session</i>");

        //if (VRoadcast._bSpatial) VRoadcast.touchAvatar(uid);
        
        //VRoadcast._numUsers++;
        VRoadcast.requestSceneState();
        ATON.fireEvent("VRC_UserEnter", uid);
    });

    VRoadcast.socket.on('ULEAVE', (data)=>{
        let uid = data;
        if (uid === undefined) return;
        
        let A = VRoadcast.avatarList[uid];
        if (A){
            A.toggleStreamPanel(false);
            A.hide();
        }

        // TODO: hide also focus

        console.log("User #" +uid+" left the session");

        VRoadcast.appendToChatBox("<i>User #"+uid+" left the session</i>");

        //if (VRoadcast._numUsers>1) VRoadcast._numUsers--;
        VRoadcast.requestSceneState();
        ATON.fireEvent("VRC_UserLeave", uid);
    });

    VRoadcast.socket.on('USTATE', (data)=>{
        //if (ATON._numReqLoad>0) return; // check / fixme
        if (!VRoadcast._bShowAvaG) return;
        if (!VRoadcast._bSpatial) return;

        let S = VRoadcast.decodeState(data);

        let uid = S.userid;
        let A = VRoadcast.touchAvatar(uid);

        //A.position.copy(S.position);
        //A.quaternion.copy(S.quaternion);
        
        A.requestStateTransition(S);

        let s = 1.0/S.scale;
        A.scale.set(s,s,s);
        //A.hideFocalPoint();
    });

    VRoadcast.socket.on('UFOCUS', (data)=>{
        if (!VRoadcast._bSpatial) return;

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

        VRoadcast.appendToChatBox("<i>User #"+uid+" changed username to: "+uname+"</i>");

        ATON.fireEvent("VRC_UName", data);
    });

    VRoadcast.socket.on('UMSG', (data)=>{
        let uid = data.uid;
        let msg = data.msg;

        if (uid === undefined) return;

        let A = VRoadcast.touchAvatar(uid);
        if (msg.length < 100) A.setMessage(msg); // only short messages for 3D label

        console.log("User #" +uid+": "+msg);

        let uname = A.getUsername();

        msg = VRoadcast.chatMessageProcessor(uid, msg);
        let col  = VRoadcast.ucolorhex[uid%6];
        let col2 = VRoadcast.ucolorhex_light[uid%6];

        VRoadcast.appendToChatBox("<div class='"+ATON.FE.getVRCclassFromID(uid)+" atonVRCchatUsername'>"+uname+"</div>: <span style='color:"+col2+"'>"+msg+"</span>");

        ATON.fireEvent("VRC_UMessage", data);
    });

    VRoadcast.socket.on('UTALK', (data)=>{
        let uid = data.uid;
        if (uid === undefined) return;

        let au = data.audio;
        if (!au) return;

        if (VRoadcast._bSpatial){
            let A = VRoadcast.touchAvatar(uid);

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

        ATON.fireEvent("VRC_UTalk", data);

        au = null;
    });

    VRoadcast.socket.on('UTALKSTOP', (data)=>{
        let uid = data.uid;
        if (uid === undefined) return;

        //

        ATON.fireEvent("VRC_UTalkStop", data);
    });

    VRoadcast.socket.on('UVIDEO', (data)=>{
        let uid = data.uid;
        if (uid === undefined) return;

        ATON.fireEvent("VRC_UVideo", data);
    });

    VRoadcast.socket.on('UVIDEOSTOP', (data)=>{
        let uid = data.uid;
        if (uid === undefined) return;

        let A = VRoadcast.avatarList[uid];
        if (A) A.toggleStreamPanel(false);

        ATON.fireEvent("VRC_UVideoStop", data);
    });
};

VRoadcast.chatMessageProcessor = (uid, text)=>{
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
VRoadcast.encodeState = (S)=>{
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
VRoadcast.decodeState = (binData)=>{
    let view = new Int8Array(binData);

    VRoadcast._decS.userid = view[16];
    let s = ATON._unpackScale( view[17] );
    VRoadcast._decS.scale = s;

    //console.log(view);

    // First decode quat
    VRoadcast._decS.quaternion.set(
        parseFloat(view[12]) / 128.0,
        parseFloat(view[13]) / 128.0,
        parseFloat(view[14]) / 128.0,
        parseFloat(view[15]) / 128.0
    );

    // Now decode floats
    view = new Float32Array(binData);
    //VRoadcast._decS.position = new THREE.Vector3(view[0],view[1],view[2]);
    VRoadcast._decS.position.set(
        parseFloat(view[0]) / s,
        parseFloat(view[1]) / s,
        parseFloat(view[2]) / s
    );

    //console.log(VRoadcast._decS.scale)

    return VRoadcast._decS;
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
            ATON.enablePointLight();
            ATON.plight.color = ATON.VRoadcast.color;
        }

        VRoadcast._bStreamFocus = true;
        return;
    }
    else {
        if (VRoadcast._bStreamFocus){
            ATON.fireEvent("VRC_FocusStreamingStopped");
            ATON.disablePointLight();
        }

        // Restore selector radius
        let r = ATON.SUI._selectorRad;
        ATON.SUI.mainSelector.scale.set(r,r,r);

        VRoadcast._bStreamFocus = false;
    }
};

VRoadcast.sendState = ()=>{
    if (!VRoadcast.bSendState || !VRoadcast._bSpatial) return;
    if (VRoadcast.uid === undefined) return;
    if (!VRoadcast.socket || !VRoadcast._connected) return;
    
    let cpov = ATON.Nav._currPOV;
    if (!cpov) return;
    //console.log(cpov);

    // Focus streaming
    let fp = ATON.getSceneFocalPoint();
    if (VRoadcast._bStreamFocus && fp !== undefined){
        let fx = (fp.x).toPrecision(5);
        let fy = (fp.y).toPrecision(5);
        let fz = (fp.z).toPrecision(5);
        let r  = ATON.SUI.getSelectorRadius().toPrecision(5);
        
        VRoadcast.socket.emit("UFOCUS", [fx,fy,fz, r]);

        //fp = null;
    }

    if (!cpov.pos) return;
    if (!ATON.Nav._qOri) return;

    // Save bandwidth
    if (VRoadcast._lastStateSent !== undefined){
        let lastPos = VRoadcast._lastStateSent.position;
        let lastOri = VRoadcast._lastStateSent.quaternion;

        let dPos = lastPos.distanceToSquared(cpov.pos);
        let dOri = lastOri.angleTo(ATON.Nav._qOri);

        if ( dPos < VRoadcast.THRES_STATE_POS && dOri < VRoadcast.THRES_STATE_ORI) return;
    }

    // Compose state
    if (VRoadcast._lastStateSent === undefined){
        VRoadcast._lastStateSent = {};
        VRoadcast._lastStateSent.position   = new THREE.Vector3();
        VRoadcast._lastStateSent.quaternion = new THREE.Quaternion();
    }

    VRoadcast._lastStateSent.position.copy(cpov.pos);
    VRoadcast._lastStateSent.quaternion.copy(ATON.Nav._qOri);
    VRoadcast._lastStateSent.userid = VRoadcast.uid;
    VRoadcast._lastStateSent.scale  = ATON._worldScale;

    // Encode and send
    let binData = VRoadcast.encodeState( VRoadcast._lastStateSent );
    VRoadcast.socket.emit("USTATE", binData/*.buffer*/ );
    //VRoadcast._lastStateSent = S;

    //console.log("State sent");
};


// Avatars
VRoadcast.getAvatar = (uid)=>{
    return VRoadcast.avatarList[uid];
};

VRoadcast.touchAvatar = (uid)=>{
    // First time
    if (VRoadcast.avatarList[uid] === undefined){
        let ava = new VRoadcast.Avatar(uid);
        ava.attachTo(VRoadcast.avaGroup);
        
        ava.loadRepresentation(ATON.PATH_RES+"models/vrc/head.gltf");
        //console.log(VRoadcast.avaGroup);

        VRoadcast.avatarList[uid] = ava;

        //console.log(VRoadcast.avatarList);
        //console.log(ATON.MatHub.materials.avatars);
        //console.log(A);
        
        //VRoadcast._numUsers++;
        //ATON.fireEvent("VRC_UserEnter", uid);

        //console.log(ava)
    }

    let A = VRoadcast.avatarList[uid];

    // Reclaim of previously used slot
    if (!A.visible){
        //VRoadcast._numUsers++;
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