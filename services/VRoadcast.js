
VRoadcast = {};

VRoadcast.MAX_CLIENTS_PER_SCENE = 50;


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
        if (this.name !== undefined)     socket.emit("UNAME", { uid: this.uid, name: this.name });
        if (this.message !== undefined)  socket.emit("UMSG", { uid: this.uid, msg: this.message });
        if (this.binState !== undefined) socket.emit("USTATE", this.binState);
    }
};


// Scene
VRoadcast.scene = class {
    constructor(sid){
        if (sid) this.sid = sid;

        this.users = [];
        this.numUsers = 0; // Note: this.users[] may not be contiguous
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
        if (tsize < VRoadcast.MAX_CLIENTS_PER_SCENE) return tsize;

        return undefined;
    };

    // Send scene snapshot, except exlcuid
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

    VRoadcast.scenes = {};
    VRoadcast.totConnections = 0;

    VRoadcast.io.on('connection', VRoadcast.onNewConnection);
};


VRoadcast.touchScene = (sid)=>{
    if (VRoadcast.scenes[sid]) return VRoadcast.scenes[sid];

    VRoadcast.scenes[sid] = new VRoadcast.scene(sid);

    console.log("Created scene ID: "+sid);
    return VRoadcast.scenes[sid];
};


// Handle incoming connection
VRoadcast.onNewConnection = (socket)=>{
    VRoadcast.totConnections++;

    let ipAddr = socket.handshake.address;
    console.log("New connection from "+ipAddr);

    // current scene
    let sid   = undefined;
    let scene = undefined;

    // assigned ID
    let uid  = undefined;
    let user = undefined;

    // Whenever someone disconnects
    socket.on('disconnect', ()=>{
        if (sid) socket.leave(sid);
        VRoadcast.totConnections--;

        if (scene !== undefined && uid !== undefined){
            delete scene.users[uid];
            if (scene.numUsers>0) scene.numUsers--;

            socket.broadcast.to(sid).emit("ULEAVE", uid );

            console.log("UID #" + uid + " left scene "+sid+" (tot users: "+scene.numUsers+")");

            if (scene.numUsers === 0){
                delete scene;
                delete VRoadcast.scenes[sid];
                console.log("DELETED scene "+sid);
            }
        }
    });

    socket.on('SENTER', (data)=>{
        sid   = data;
        scene = VRoadcast.touchScene(sid);

        socket.join(sid);

        console.log("ENTER request in scene "+sid);

        // Assign user id
        uid = scene.getAvailableUID();
        if (uid !== undefined){
            user = scene.touchUser(uid);
            user.ipaddress = ipAddr;

            scene.numUsers++;

            // Send assigned ID to the user
            socket.emit("ID", uid );

            scene.sendSnapshot(socket, uid);

            // Inform other users in the scene that uid entered
            socket.broadcast.to(sid).emit("UENTER", uid );

            console.log("UID #" + uid + " entered scene "+sid+" (tot users: "+scene.numUsers+")");
        }
        else {
            console.log(ipAddr+" cannot enter scene "+sid+" since it's full.");
        }
    });

    socket.on('USTATE', (data)=>{
        if (user) user.setEncodedState(data);
        // Broadcast to other users in scene
        socket.broadcast.to(sid).emit("USTATE", data );
    });

    socket.on('UFOCUS', (data)=>{
        //if (user) user.setFocalPoint(data);
        // Broadcast to other users in scene
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
        // Broadcast to other users in scene
        socket.broadcast.to(sid).emit("EREP", data );
    });

    socket.on('UTALK', (data)=>{
        socket.to(sid).compress(false).binary(true).emit('UTALK', data);
        //console.log(data.audio);
    });
};


module.exports = VRoadcast;