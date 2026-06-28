/*
    ATON Anuket

    Remote control/interaction client component for ATON
    developed under CHANGES project, spoke 4 (https://www.fondazionechanges.org/en/spoke-4-en/) as a flare, and then integrated into the core

    authors:
        bruno.fanini_AT_cnr.it

===========================================================*/

/**
Anuket client component for remote control

Events:
- "ANUKET_CONNECTED": fired when connected to Anuket service
- "ANUKET_DISCONNECTED": fired when disconnected from Anuket service
- "ANUKET_MSG": fired when a message is received (data is string or object)
- "ANUKET_JOIN_REQ": fired when a session join is requested (data is session ID)

@namespace Anuket
*/
let Anuket = {};

// Connection states
Anuket.CSTATE_DISCONNECTED = 0;
Anuket.CSTATE_CONNECTING   = 1;
Anuket.CSTATE_CONNECTED    = 2;

Anuket.PING_MSG      = "PING";
Anuket.PING_INTERVAL = 8000;


Anuket.init = ()=>{
    Anuket._cState = Anuket.CSTATE_DISCONNECTED;

    Anuket._ws   = undefined;
    Anuket._addr = `${ATON.BASE_URL}/anuket/`;

    Anuket._role = undefined;

    Anuket._session = undefined;

    Anuket._bAutoReconnect = false;
    window.setInterval(()=>{
        if (Anuket._bAutoReconnect && Anuket._session && Anuket._cState === Anuket.CSTATE_DISCONNECTED){
            Anuket.log("Auto reconnection...");
            Anuket.connect();
        }

        // Ping
        if (Anuket.isConnected() && Anuket._ws.readyState === WebSocket.OPEN){
            Anuket.sendMessage(Anuket.PING_MSG);
        }

    }, Anuket.PING_INTERVAL );

    // Multi-role logic
    Anuket.logic = {};
};

Anuket.log = (msg)=>{
    console.log("[Anuket] " + msg);
};

Anuket.isStringJSON = (str)=>{
    if (str.startsWith("{")) return true;
    if (str.startsWith("[")) return true;

    return false;
};


/**
Set Anuket service address
@param {string} addr - address of Anuket websocket service (e.g. running on another node)
*/
Anuket.setServiceAddress = (addr)=>{
    Anuket._addr = addr;
};

/**
Set session ID to join once connected
@param {string} ssid - Session ID to join after successful connection to Anuket service
*/
Anuket.setSessionID = (ssid)=>{
    Anuket._session = ssid;
};

/**
Return true if connected to Anuket service
@returns {boolean}
*/
Anuket.isConnected = ()=>{
    return (Anuket._cState === Anuket.CSTATE_CONNECTED);
};

/**
Set auto reconnection.
On disconnection Anuket will try to automatically reconnect and rejoin the session
@param {bool} b - auto reconnection (true or false)
*/
Anuket.setAutoReconnect = (b)=>{
    Anuket._bAutoReconnect = b;
};

/**
Connect to Anuket service
*/
Anuket.connect = ()=>{
    if (Anuket._cState === Anuket.CSTATE_CONNECTED){
        Anuket.log("Already connected to service");
        return;
    }
    if (Anuket._cState === Anuket.CSTATE_CONNECTING){
        Anuket.log("Already connecting to service");
        return;
    }

    // Enter connecting state
    Anuket._cState = Anuket.CSTATE_CONNECTING;
    Anuket.log("Connecting ("+ Anuket._addr +") ...");

    Anuket._ws = new WebSocket( Anuket._addr );

    Anuket._ws.addEventListener('open', (event)=>{
        Anuket.log("Connected!");
        Anuket._cState = Anuket.CSTATE_CONNECTED;

        if (Anuket._session) Anuket.joinSession( Anuket._session );

        ATON.fire("ANUKET_CONNECTED");
    });

    Anuket._ws.addEventListener('message', (event)=>{
        let data = event.data;

        if (Anuket.isStringJSON(data)){
            data = JSON.parse(data);
            console.log(data)
        }

        ATON.fire("ANUKET_MSG", data);
    });

    Anuket._ws.addEventListener('close', (event)=>{ 
        Anuket.log('Connection closed');
        Anuket._cState = Anuket.CSTATE_DISCONNECTED;

        ATON.fire("ANUKET_DISCONNECTED");
    });

    Anuket._ws.addEventListener('error', (event)=>{ 
        Anuket.log('Error');
        console.log(event);

        Anuket._cState = Anuket.CSTATE_DISCONNECTED;

        ATON.fire("ANUKET_DISCONNECTED");
    });
};

/**
Join a session (subscribe)
@param {string} ssid - session ID
*/
Anuket.joinSession = (ssid)=>{
    if (!ssid || ssid.length < 1) return false;
    
    Anuket._session = ssid;
    
    //if (Anuket._cState !== Anuket.CSTATE_CONNECTED) return false;
    if (Anuket._cState !== Anuket.CSTATE_CONNECTED){
        Anuket.connect();
        return true;
    }

    Anuket.log("Request join session '"+ssid+"'");

    Anuket.sendMessage("#"+ssid);
    ATON.fire("ANUKET_JOIN_REQ", ssid);
};

/**
Send message (string)
@param {string} msg - string to send to current session participants
*/
Anuket.sendMessage = (msg)=>{
    if (Anuket._cState !== Anuket.CSTATE_CONNECTED) return false;

    Anuket._ws.send(msg);
};

/**
Send object
@param {object} o - object to send to current session participants
*/
Anuket.sendObject = (o)=>{
    if (Anuket._cState !== Anuket.CSTATE_CONNECTED) return false;

    Anuket._ws.send( JSON.stringify(o) );        
};

/**
Send object or string
@param {object} data - object or string to send to current session participants
*/
Anuket.send = (data)=>{
    if (!data) return;

    if (typeof data === 'object' && data !== null) Anuket.sendObject(data);
    else Anuket.sendMessage(data);
};

/**
Set client role
@param {string} role - a string representing the role of this client
*/
Anuket.setRole = (role)=>{
    Anuket._role = role;
};

Anuket.setLocalLogic = ( logic, role )=>{
    if (role) Anuket._role = role;

    if (!logic) return false;

    //if (Anuket.logic[Anuket._role]) return false; // Already registered
    //Anuket.logic[Anuket._role] = logic;

    logic();

    return true;
};

// TODO: Load logic from external multi-role file
Anuket.loadLogic = ( logicpath, onLoad )=>{

    ATON.loadScript( logicpath, ()=>{
        Anuket.log("Logic loaded");

        if (Anuket._role){
            let L = Anuket.logic[Anuket._role];

            if (L) L();
        }

        Anuket.connect();

        if (onLoad) onLoad();
    });
};

export default Anuket;
