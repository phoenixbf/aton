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
- "ANUKET_MSG": fired when a message is received (data is string)
- "ANUKET_JOIN_REQ": fired when a session join is requested (data is session ID)

@namespace Anuket
*/
let Anuket = {};

// Connection states
Anuket.CSTATE_DISCONNECTED = 0;
Anuket.CSTATE_CONNECTING   = 1;
Anuket.CSTATE_CONNECTED    = 2;


Anuket.init = ()=>{
    Anuket._cState = Anuket.CSTATE_DISCONNECTED;

    Anuket._ws   = undefined;
    Anuket._addr = `${ATON.BASE_URL}/anuket/`;

    Anuket._session = undefined;
};

/**
Set Anuket service address
@param {string} addr - address of Anuket websocket service (e.g. running on another node)
*/
Anuket.setServiceAddress = (addr)=>{
    Anuket._addr = addr;
};

/**
Set Anuket service address
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

Anuket.log = (msg)=>{
    console.log("[Anuket] " + msg);
};

Anuket.isStringJSON = (str)=>{
    if (str.startsWith("{")) return true;
    if (str.startsWith("[")) return true;

    return false;
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
        
        if (Anuket.isStringJSON(data)) data = JSON.parse(data);

        ATON.fire("ANUKET_MSG", data);
    });

    Anuket._ws.addEventListener('close', (event)=>{ 
        Anuket.log('Connection closed');
        Anuket._cState = Anuket.CSTATE_DISCONNECTED;

        ATON.fire("ANUKET_DISCONNECTED");
    });

    Anuket._ws.addEventListener('error', (event)=>{ 
        Anuket.log('Error:' + event);
        Anuket._cState = Anuket.CSTATE_DISCONNECTED;

        ATON.fire("ANUKET_DISCONNECTED");
    });
};

/**
Join a session (subscribe)
@param {string} ssid - session ID
*/
Anuket.joinSession = (ssid)=>{
    if (Anuket._cState !== Anuket.CSTATE_CONNECTED) return false;
    if (!ssid || ssid.length < 1) return false;

    Anuket._session = ssid;

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


Anuket.setupLocalLogic = ( routine )=>{
    if (!routine) return false;
    
    routine();

    return true;
};

// TODO: Load logic from external file
/*
Anuket.loadLogic = ( logicpath, role, onLoad )=>{

    ATON.loadScript( logicpath, ()=>{
        Anuket.log("Logic loaded");

        if (role){
            let setuproutine = F.logic[role];
            if (setuproutine) setuproutine();

            Anuket.log("Role '"+role+"' set");
        }

        Anuket.connect();

        if (onLoad) onLoad();
    });
};
*/

export default Anuket;
