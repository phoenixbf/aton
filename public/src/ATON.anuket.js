/*
    ATON Anuket

    authors:
        bruno.fanini_AT_cnr.it

===========================================================*/

/**
Anuket
@namespace Anuket
*/
let Anuket = {};

// Connection states
Anuket.CSTATE = {
    DISCONNECTED: 0,
    CONNECTING: 1,
    CONNECTED: 2
};


Anuket.init = ()=>{
    Anuket._cState = Anuket.CSTATE.DISCONNECTED;

    Anuket._ws   = undefined;
    Anuket._addr = undefined;

    Anuket._session = undefined;
};

/**
Connect to Anuket service 
@param {string} addr - url of Anuket websocket service
*/
Anuket.connect = (addr)=>{
    if (Anuket._cState === Anuket.CSTATE.CONNECTED){
        console.log("Already connected to service");
        return;
    }
    if (Anuket._cState === Anuket.CSTATE.CONNECTING){
        console.log("Already connecting to service");
        return;
    }

    if (!addr){
        console.log("Invalid connect address");
        return;
    }

    // Enter connecting state
    Anuket._cState = Anuket.CSTATE.CONNECTING;

    Anuket._ws = new WebSocket(addr);

    Anuket._ws.addEventListener('open', (event)=>{
        console.log("Connected!");
        Anuket._cState = Anuket.CSTATE.CONNECTED;

        if (Anuket._session) Anuket.joinSession( Anuket._session );

        ATON.fire("ANUKET_CONNECTED");
    });

    Anuket._ws.addEventListener('message', (event)=>{
        let data = event.data;
        if (data.startsWith("{")) data = JSON.parse(data);

        ATON.fire("ANUKET_MSG", data);
    });

    Anuket._ws.addEventListener('close', (event)=>{ 
        console.log('Connection has been closed');
        Anuket._cState = Anuket.CSTATE.DISCONNECTED;

        ATON.fire("ANUKET_DISCONNECTED");
    });

    Anuket._ws.addEventListener('error', (event)=>{ 
        console.log('Error:' + event);
        Anuket._cState = Anuket.CSTATE.DISCONNECTED;

        ATON.fire("ANUKET_DISCONNECTED");
    });
};

/**
Join a session (subscribe)
@param {string} ssid - session ID
*/
Anuket.joinSession = (ssid)=>{
    if (Anuket._cState !== Anuket.CSTATE.CONNECTED) return false;

    console.log("Request join session '"+ssid+"'");

    Anuket.sendMessage("#"+ssid);
    ATON.fire("ANUKET_JOIN_REQ", ssid);
};

/**
Send message (string)
@param {string} msg - string to send to current session participants
*/
Anuket.sendMessage = (msg)=>{
    if (Anuket._cState !== Anuket.CSTATE.CONNECTED) return false;

    Anuket._ws.send(msg);
};

/**
Send object
@param {object} o - object to send to current session participants
*/
Anuket.sendObject = (o)=>{
    if (Anuket._cState !== Anuket.CSTATE.CONNECTED) return false;

    Anuket._ws.send( JSON.stringify(o) );        
};

export default Anuket;
