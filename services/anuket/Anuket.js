/*!
    @preserve

 	ATON Anuket service

 	@author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/
const uuid = require('uuid');


Anuket = {};
Anuket.MAX_CLIENTS_PER_SESSION = 50;


// Classes
//=================================================
let session = class {
    constructor(){
        this.clients  = {}
        this.numUsers = 0;
        this.ssid     = undefined;
    }

    log(msg){
        console.log("[#"+this.ssid+"] "+msg);
    }

    broadcast(from,data){
        for (let id in this.clients){
            if (id !== from) this.clients[id].send(data);
        }   
    }

    join(uid, socket){
        if (!uid || this.clients[uid]){
            socket.send(0);
            return false;
        }

        if (this.numUsers >= Anuket.MAX_CLIENTS_PER_SESSION){
            socket.send(0);
            console.log("Session "+this.ssid+" full. Join rejected");
            return;
        }

        this.clients[uid] = socket;
        socket.send(1);

        this.numUsers++;

        this.log("New client "+uid+" joined session "+this.ssid+". Num clients: "+this.numUsers);
        return true;
    }

    leave(uid){
        if (!this.clients[uid]){
            return false;
        }

        delete this.clients[uid];
        this.numUsers--;

        this.log("Client "+uid+" left. Num clients: "+this.numUsers);
        return true;
    }
};

//===================================================

Anuket.init = (wss)=>{
    Anuket.sessions = {};

    Anuket.setupWebSocketServer(wss);

    //Anuket.printSessions();
};

Anuket.generateClientID = ()=>{
    return uuid.v4();
};

Anuket.touchSession = (ssid)=>{
    if (!Anuket.sessions[ssid]){
        Anuket.sessions[ssid] = new session();
        Anuket.sessions[ssid].ssid = ssid;
        Anuket.sessions[ssid].log("Created");
    }

    return Anuket.sessions[ssid];
};

Anuket.getSession = (ssid)=>{
    if (!ssid) return undefined;
    return Anuket.sessions[ssid];
};

Anuket.deleteSession = (ssid)=>{
    if (!Anuket.sessions[ssid]) return;

    delete Anuket.sessions[ssid];
    console.log("Session "+ssid+" DELETED");
};

Anuket.printSessions = ()=>{
    console.log("Current Sessions =========");

    for (let s in Anuket.sessions){
        let S = Anuket.sessions[s];
        console.log("  #"+s+" ("+S.numUsers+")");
    }

    console.log("==========================");
};

Anuket.setupWebSocketServer = (wss)=>{
    if (!wss) return;

    wss.on("connection", socket => {
        let uid = Anuket.generateClientID();
        let currssid = undefined;


        const requestSessionJoin = (reqses)=>{
            let S = Anuket.touchSession(reqses);

            // Migration
            let prevS = Anuket.getSession(currssid);
            if (prevS && reqses!==currssid){
                prevS.leave(uid);

                if (prevS.numUsers <= 0){
                    Anuket.deleteSession(currssid);
                    currssid = undefined;
                }
            }

            if ( S.join(uid, socket) ) currssid = reqses;

            Anuket.printSessions();
        };

        console.log("Client "+uid+" connected!");

        //on message from client
        socket.on("message", data => {
            let d = data.toString();
            
            console.log("Data received: "+d);

            // Request to join a session
            if (d.startsWith("#")){
                let reqses = d.slice(1);

                requestSessionJoin(reqses);
    /*
                let S = touchSession(reqses);

                // Migration
                let prevS = getSession(currssid);
                if (prevS){
                    prevS.leave(uid);

                    if (prevS.numUsers <= 0){
                        deleteSession(currssid);
                        currssid = undefined;
                    }
                }

                if ( S.join(uid, socket) ) currssid = reqses;

                printSessions();
    */
                return;
            }

            let cS = Anuket.getSession(currssid);
            if (!cS) return;

            cS.broadcast(uid, d);
        });
    
        // handling what to do when clients disconnects from server
        socket.on("close", () => {
            let cS = Anuket.getSession(currssid);
            if (!cS) return;

            cS.leave(uid);

            if (cS.numUsers <= 0){
                Anuket.deleteSession(currssid);
                currssid = undefined;
            }

            Anuket.printSessions();
        });

        // handling client connection error
        socket.onerror = ()=>{
            let cS = Anuket.getSession(currssid);
            if (!cS) return;

            cS.leave(uid);

            if (cS.numUsers <= 0){
                Anuket.deleteSession(currssid);
                currssid = undefined;
            }

            console.log("Client connection error");
            Anuket.printSessions();
        }
    });
};

module.exports = Anuket;