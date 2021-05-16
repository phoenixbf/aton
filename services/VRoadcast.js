/*!
    @preserve

 	ATON VRoadcast

 	@author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/
VRoadcast = {};

VRoadcast.MAX_CLIENTS_PER_SESSION = 50;


// Classes
//=================================================

// User
VRoadcast.user = class {
    constructor(uid){
        if (uid) this.uid = uid;

        this.name      = undefined;
        this.message   = undefined;

        this.ipaddress = undefined;

        this.binState = undefined;
        this.focpoint = undefined;
    }

    setEncodedState(binState){
        this.binState = binState;
    }
/*
    setFocalPoint(fp){
        this.focpoint = fp;
    }
*/
    sendSnapshot(socket){
        //if (this.uid !== undefined)      socket.emit("UENTER", this.uid);
        if (this.name !== undefined)     socket.emit("UNAME", { uid: this.uid, name: this.name });
        if (this.message !== undefined)  socket.emit("UMSG", { uid: this.uid, msg: this.message });
        if (this.binState !== undefined) socket.emit("USTATE", this.binState);
    }
};


// Session
VRoadcast.session = class {
    constructor(sid){
        if (sid) this.sid = sid;

        this.users = []; // Note: this.users[] may not be contiguous
        this.numUsers = 0;
    }

    touchUser(uid){
        if (this.users[uid]) return this.users[uid];

        this.users[uid] = new VRoadcast.user(uid);
        return this.users[uid];
    }

    getAvailableUID(){
        let users = this.users;
        let tsize = users.length;

        // First search empty slots in table
        for( let i=0; i<tsize; i++ ){
            if (!users[i]) return i;
        }

        // If not full, tail index
        if (tsize < VRoadcast.MAX_CLIENTS_PER_SESSION) return tsize;

        return undefined;
    };

    // Send session snapshot, except exlcuid
    sendSnapshot(socket, excluid){
        let tsize = this.users.length;

        for( var i=0; i<tsize; i++ ){
            let user = this.users[i];
            if (user){
                if (i !== excluid) user.sendSnapshot(socket);
            }
        }
    }
};

//=================================================
VRoadcast.init = (io)=>{
    if (!io) return;
    VRoadcast.io = io;

    VRoadcast.sessions = {};
    VRoadcast.totConnections = 0;

    VRoadcast.io.on('connection', VRoadcast.onNewConnection);
};

VRoadcast.touchSession = (sid)=>{
    if (VRoadcast.sessions[sid]) return VRoadcast.sessions[sid];

    VRoadcast.sessions[sid] = new VRoadcast.session(sid);

    console.log("Created session ID: "+sid);
    return VRoadcast.sessions[sid];
};


// Handle incoming connection
VRoadcast.onNewConnection = (socket)=>{
    VRoadcast.totConnections++;

    let ipAddr = socket.handshake.address;
    console.log("New connection from "+ipAddr);

    // current session
    let sid     = undefined;
    let session = undefined;

    // assigned ID
    let uid  = undefined;
    let user = undefined;

    // Whenever someone disconnects
    socket.on('disconnect', ()=>{
        if (sid) socket.leave(sid);
        VRoadcast.totConnections--;

        if (session !== undefined && uid !== undefined){
            delete session.users[uid];
            if (session.numUsers>0) session.numUsers--;

            socket.broadcast.to(sid).emit("ULEAVE", uid );

            console.log("UID #" + uid + " left session "+sid+" (tot users: "+session.numUsers+")");

            if (session.numUsers === 0){
                delete session;
                delete VRoadcast.sessions[sid];
                console.log("DELETED session "+sid);
            }
        }
    });

    socket.on('SENTER', (data)=>{
        sid     = data;
        session = VRoadcast.touchSession(sid);

        socket.join(sid);

        console.log("ENTER request in session "+sid);

        // Assign user id
        uid = session.getAvailableUID();
        if (uid !== undefined){
            user = session.touchUser(uid);
            user.ipaddress = ipAddr;

            session.numUsers++;

            // Send assigned ID to the user
            socket.emit("ID", uid );

            session.sendSnapshot(socket, uid);

            // Inform other users in the session that uid entered
            socket.broadcast.to(sid).emit("UENTER", uid );

            console.log("UID #" + uid + " entered session "+sid+" (tot users: "+session.numUsers+")");
        }
        else {
            console.log(ipAddr+" cannot enter session "+sid+" since it's full.");
        }
    });

    // Handle session state requests
    socket.on('SSTATE', ()=>{
        let sinfo = {};

        if (session !== undefined){
            sinfo.numUsers = session.numUsers;
        }
        else {
            sinfo.numUsers = 0;
        }

        socket.emit("SSTATE", sinfo);
    });

    socket.on('USTATE', (data)=>{
        if (user) user.setEncodedState(data);
        // Broadcast to other users in session
        socket.broadcast.to(sid).emit("USTATE", data );
    });

    socket.on('UFOCUS', (data)=>{
        //if (user) user.setFocalPoint(data);
        // Broadcast to other users in session
        socket.broadcast.to(sid).emit("UFOCUS", { uid: uid, fp: data });
    });

    socket.on('UNAME', (data)=>{
        if (user){
            user.name = data;
            console.log(uid+" changed username to: "+data);

            socket.broadcast.to(sid).emit("UNAME", { uid: uid, name: data });
        }
    });

    socket.on('UMSG', (data)=>{
        if (user){
            user.message = data;
            console.log(uid+" message: "+data);

            socket.broadcast.to(sid).emit("UMSG", { uid: uid, msg: data });
        }
    });

    socket.on('LOG', (data)=>{
        console.log(data);
    });

    // Replicated event
    socket.on('EREP', (data)=>{
        // Broadcast to other users in session
        socket.broadcast.to(sid).emit("EREP", data );
    });

    socket.on('UTALK', (data)=>{
        socket.to(sid).emit('UTALK', data); // compress(false) // .binary(true)
        //console.log(data.audio);
    });
};


module.exports = VRoadcast;