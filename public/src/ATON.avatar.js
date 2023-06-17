/*
    ATON Avatar Class
    used in VRoadcast system

    author: bruno.fanini_AT_gmail.com

===========================================================*/

import Node from "./ATON.node.js";

export default class Avatar extends Node {

constructor(uid){
    super(undefined /*uid*/, ATON.NTYPES.UI);

    this.userid   = uid;
    this.username = undefined; //"User #"+uid;
    this.message  = "...";

    this.color = ATON.Photon.ucolors[this.userid % ATON.Photon.ucolors.length];
    
    //this.bTalking = false;

    //this._auTalk = undefined;

    // Positional audio (talk)
/*
    this._auTalk = new THREE.PositionalAudio( ATON.AudioHub._listener );
    this._auTalk.setRefDistance(30.0);
    this._auTalk.setLoop( false );
    this.add( this._auTalk ); // spatial audio, move with avatar
*/
    this._auTalk = [];
    this._auTalk.push( new THREE.PositionalAudio( ATON.AudioHub._listener ) );
    this._auTalk.push( new THREE.PositionalAudio( ATON.AudioHub._listener ) );

    for (let k=0; k<2; k++){
        this._auTalk[k].setRefDistance(30.0);
        this._auTalk[k].setLoop( false );
        //this._auTalk[k].setPlaybackRate(0.9);

        this.add( this._auTalk[k] );
    }

    this._auTalki = 0;

    this.bMuted = false;

    this._bPlayingAudio = false;
    //this._auChunks = [];
    //this._iAU = 0;
    this._blob = undefined;
    this._b64  = undefined;

    this._tStateCall = -1.0;
    //this._tStateDur  = 0.1;
    this._tProgress  = 0.0;

    // Focal point
    this._tFocCall = -1.0;
    this._currFocusPos = new THREE.Vector3();
    this._tgtFocusPos  = new THREE.Vector3();

    // States
    this._currState = {
        position: new THREE.Vector3(),
        quaternion: new THREE.Quaternion(),
        scale: 1.0
    };

    this._tgtState = {
        position: new THREE.Vector3(),
        quaternion: new THREE.Quaternion(),
        scale: 1.0
    };

    //console.log(this);
    this.userlabelnode = undefined;

    // Stream
    this.mStream = undefined;
    this._elVStream = undefined;

    this.realize();
}

getColor(){
    return this.color;
}

setTalkDistance(r){
    if (r > 0.0) this._auTalk.setRefDistance(r);
}

setMuted(b){
    this.bMuted = b;
}

getAvatarMaterialByUID(uid){
    //if (uid === undefined) return 0;

    let avaMats = ATON.MatHub.materials.avatars;
    let mi = (uid % avaMats.length); //uid? (uid % avaMats.length) : 0;
    
    return avaMats[mi];
}

_buildLabel(){
    this.userlabelnode = ATON.createUINode();

    this.labelcontainer = new ThreeMeshUI.Block({
        width: 0.7,
        height: 0.25,
        padding: 0.03,
        borderRadius: 0.05,

        backgroundColor: ATON.MatHub.colors.black,

        fontFamily: ATON.SUI.PATH_FONT_JSON,
        fontTexture: ATON.SUI.PATH_FONT_TEX,

        justifyContent: 'center',
        textAlign: 'center',
    });

    this.userlabelnode.position.y = 0.4;
    this.userlabelnode.add(this.labelcontainer);

    // username text
    this.usernametext = new ThreeMeshUI.Text({ 
        content: "User #"+this.userid,
        fontSize: 0.09,
        //fontColor: ATON.MatHub.colors.white
        fontColor: this.color
    });
    this.usernametext.position.y = 0.0;

    // message text
    this.usermessagetext = new ThreeMeshUI.Text({ 
        content: "\n...",
        fontSize: 0.03,
        fontColor: ATON.MatHub.colors.white
    });
    this.usermessagetext.position.y = -0.03;

    this.labelcontainer.add(this.usernametext);
    this.labelcontainer.add(this.usermessagetext);
 
    this.add(this.userlabelnode);

    ThreeMeshUI.update();

    //this.realizeStreamPanel();
}

realizeStreamPanel(){
    
    let vs = ATON.MediaFlow.getOrCreateVideoStream(this.userid, undefined, true);
    //vs.texStream.flipY = true;

    this._elVStream = vs.el;
/*
    let htvid = "<video id='uStream"+this.userid+"' autoplay></video>";
    $(htvid).appendTo('body');

    this._elVStream = document.getElementById("uStream"+this.userid);

    this._texStream = new THREE.VideoTexture( this._elVStream );
    this._texStream.colorSpace = ATON._stdEncoding;

    this._matStream = new THREE.MeshBasicMaterial({
        map: this._texStream,
        //fog: false,
        
        //depthTest: false,
        //depthWrite: false,

        ///depthFunc: THREE.AlwaysDepth,
        //side: THREE.BackSide, // THREE.DoubleSide
        side: THREE.DoubleSide
    });
*/
    let gStream = new THREE.PlaneGeometry(1,1);
    
    this.mStream = new THREE.Mesh( gStream, vs.matStream /*this._matStream*/ );
    this.mStream.position.y = 1.0;

    let yratio = 0.5625;

    //this.mStream.scale.x = (16.0 * 0.2);
    //this.mStream.scale.y = -(9.0 * 0.2);
    this.mStream.scale.y    = -yratio;
    this.mStream.position.y = 0.8 * yratio;

    this._elVStream.addEventListener('loadedmetadata', (e)=>{
        yratio = this._elVStream.videoHeight / this._elVStream.videoWidth;
/*
        this.mStream.scale.x    = 0.01 * this._elVStream.videoWidth;
        this.mStream.scale.y    = -0.01 * this._elVStream.videoHeight;
        this.mStream.position.y = 0.006 * this._elVStream.videoHeight;
*/
        this.mStream.scale.y    = -yratio;
        this.mStream.position.y = 0.8 * yratio;

    });

    // canvas
/*
    let mCanvas = new THREE.Mesh( gStream, ATON.MatHub.materials.avatars[this.userid] );
    mCanvas.position.z = -0.01;
    mCanvas.scale.set(1.04,1.04,1.04);
    this.mStream.add( mCanvas );
*/

    //this.userlabelnode.add( this.mStream );
}

getStreamPanel(){
    return this.mStream;
}

toggleStreamPanel(b){
    if (this.mStream === undefined) return;

    this.mStream.visible = b;
}

realize(){
    // build minimal representation
    let g = new THREE.SphereGeometry( 0.2, 16, 16 );

    if (ATON.Photon.customAvatarMaterial) this.usermaterial = ATON.Photon.customAvatarMaterial();
    else this.usermaterial = this.getAvatarMaterialByUID(this.userid);

    let smesh = new THREE.Mesh( g, this.usermaterial );

    this.usermeshnode = ATON.createUINode();
    this.usermeshnode.add(smesh);
    this.usermeshnode.setMaterial(this.usermaterial);

    // CHECK / FIXME: this is to avoid cloning of the same mesh when using same representation for all avatars
    this.usermeshnode.setCloneOnLoadHit(false);

    this.add(this.usermeshnode);


    // Talk UI
    this.userauinode = new THREE.Sprite( ATON.Photon.uspritemats[this.userid % ATON.Photon.uspritemats.length] );
    this.userauinode.position.set(0,0,0);
    this.userauinode.visible = false;

    this.add(this.userauinode);


    // Focus
    this.userfpnode = new THREE.Sprite( ATON.Photon.ufocmats[this.userid % ATON.Photon.ufocmats.length] );
    this.userfpnode.position.set(0,0,0);
    //this.userfpnode.scale.set(10,10,10);
    this.userfpnode.visible = false;

    //this.add(this.userfpnode);
    
    // Focus is centralized for better location accuracy
    if (ATON.Photon._focNodes[this.userid] === undefined){
        ATON.Photon._focNodes[this.userid] = this.userfpnode;
        ATON.Photon.focGroup.add( this.userfpnode );
    }

    this._buildLabel();
};

// TODO:
/*
destroy(){
    if (this.usermaterial) this.usermaterial.dispose();
    if (this.usermeshnode) this.usermeshnode.dispose();
    if (this.userauinode) this.userauinode.dispose();

    if (this.userfpnode) this.userfpnode.dispose();
    if (ATON.Photon._focNodes[this.userid]) ATON.Photon._focNodes[this.userid].dispose();

    if (this.userlabelnode) this.userlabelnode.dispose();
    if (this.labelcontainer) this.labelcontainer.dispose();
    if (this.usernametext) this.usernametext.dispose();
    if (this.usermessagetext) this.usermessagetext.dispose();

    this.dispose();
}
*/

// Loads custom avatar representation (3D model)
loadRepresentation(url){
    let A = this;

    if (A.usermeshnode.children[0] !== undefined){
        A.usermeshnode.remove(A.usermeshnode.children[0]);
    }

    A.usermeshnode.load(url); //.setMaterial(A.usermaterial);

    return this;
}

setUsername(username){
    if (this.userlabelnode === undefined) return this;

    this.username = username;

    this.usernametext.set({ 
        content: username
    });

    ThreeMeshUI.update();
    return this;
}

getUsername(){
    if (this.userid === undefined) return undefined;
    if (this.username === undefined) return "User #"+this.userid;
    return this.username;
}

setMessage(msg){
    if (this.userlabelnode === undefined) return this;

    this.message = msg;

    // TODO: check for text length
    this.usermessagetext.set({ 
        content: "\n"+msg
    });

    ThreeMeshUI.update();
    return this;
}

setTalkVolume(vol){
    if (vol === undefined){
        this.userauinode.visible = false;
        return;
    }
    if (vol > 0){
        this.userauinode.visible = true;
        let v = 0.1 + (vol * 0.03);
        this.userauinode.scale.set(v,v,v);
    }
    else this.userauinode.visible = false;
}

hideFocalPoint(){
    this.userfpnode.visible = false;
}

requestFocus(fp){
    if (fp === undefined) return;
    if (this._tFocCall >= 0.0) return; // already requested

    this._tFocCall = ATON._clock.elapsedTime;

    this._currFocusPos.copy(this.userfpnode.position);

    let us = this.scale.x * ATON._worldScale;

    let fx = parseFloat(fp[0]) * us;
    let fy = parseFloat(fp[1]) * us;
    let fz = parseFloat(fp[2]) * us;
    let fr = parseFloat(fp[3]) * us;

    this._tgtFocusPos.set( fx, fy, fz );
    this._tgtFocusRad = fr*2.0;

    this.userfpnode.scale.set(this._tgtFocusRad,this._tgtFocusRad,this._tgtFocusRad);

    this.userfpnode.visible = true;

    ATON.enablePointLight();
    ATON.plight.color = this.color;
    ATON.plight.position.copy(this._tgtFocusPos);
    ATON.plight.distance = this._tgtFocusRad;
}

handleFocusTransition(){
    if (this._tFocCall < 0.0) return;

    let D = ATON.Photon.USER_STATE_FREQ; //this._tStateDur;

    let t = (ATON._clock.elapsedTime - this._tFocCall) / D;

    // End
    if (t >= 1.0){
        this._tFocCall = -1.0;

        this.userfpnode.position.copy(this._tgtFocusPos);
        this.userfpnode.scale.set(this._tgtFocusRad,this._tgtFocusRad,this._tgtFocusRad);
        
        this.userfpnode.visible = true;

        //console.log(this.userfpnode.position);
        return;
    }

    this.userfpnode.position.lerpVectors(this._currFocusPos, this._tgtFocusPos, t);
    
    ATON.plight.position.copy(this.userfpnode.position);

    //let s = this._tgtFocusRad;
    //this.userfpnode.scale.set(s,s,s);
    this.userfpnode.visible = true;

    //console.log(this.userfpnode.position);
}

requestStateTransition(S){
    if (this._tStateCall >= 0.0) return; // already requested
    if (S === undefined) return;
    //if (S.position === undefined || S.position === null) return;
    //if (S.quaternion === undefined || S.quaternion === null) return;

    this._tStateCall = ATON._clock.elapsedTime;

    this._currState.position.copy(this.position);
    this._currState.quaternion.copy(this.quaternion);
    this._currState.scale = this.scale;

    //this._tgtState = S;
    this._tgtState.position.copy(S.position);
    this._tgtState.quaternion.copy(S.quaternion);
    this._tgtState.scale = 1.0 / S.scale;
    
    //this._sDistance = this.position.distanceTo(S.position);
}

handleStateTransition(){
    if (this._tStateCall < 0.0) return;

    let D = ATON.Photon.USER_STATE_FREQ; //this._tStateDur;

    if (D <= 0.0) this._tProgress = 1.0;
    else this._tProgress = (ATON._clock.elapsedTime - this._tStateCall) / D;

    let cs = this._currState;
    let ts = this._tgtState;

    //if (!ts.position || !cs.position) return;

    // End
    if (this._tProgress >= 1.0){
        this._tStateCall = -1.0;

        this.position.copy(ts.position);
        //this.quaternion.copy(ts.quaternion);
        this.usermeshnode.quaternion.copy(ts.quaternion);
        //this.scale.set(ts.scale,ts.scale,ts.scale);

        return;
    }

    this.position.lerpVectors(cs.position, ts.position, this._tProgress);
    this.usermeshnode.quaternion.slerp(ts.quaternion, this._tProgress);
    //THREE.Quaternion.slerp( cs.quaternion, ts.quaternion, this.usermeshnode.quaternion, this._tProgress);

    //let sc = THREE.MathUtils.lerp(cs.scale, ts.scale, this._tProgress);
    //this.scale.set(sc,sc,sc);
}

update(){
    this.handleStateTransition();

    // handle focus transitions
    if (this.userfpnode && this.userfpnode.visible){
        this.handleFocusTransition();

        let s = this.userfpnode.scale.x;

        if (s>0.001){
            this.userfpnode.scale.set(s*0.99,s*0.99,s*0.99);
            ATON.plight.intensity *= 0.99;
        }
        else {
            this.userfpnode.visible = false;
            ATON.disablePointLight();
        }
    }

    let cam  = ATON.Nav._camera;
    let eye = ATON.Nav._currPOV.pos;
    if (cam === undefined || eye === undefined) return;

    //this.userlabelnode.lookAt( eye );

    //this.userlabelnode.setRotationFromMatrix(cam.matrix); // quaternion.setFromRotationMatrix( cam.matrix );
    //this.userlabelnode.rotation.copy(cam.rotation);

    if (this.userlabelnode) this.userlabelnode.orientToCamera();

    // Talk UI
    //this._handleTalk();

    let avol = this.userauinode.scale.x;
    avol *= 0.99; // shrinking rate

    if (avol > 0.01) this.userauinode.scale.set(avol, avol, avol);
    else this.userauinode.visible = false;

/*
    this.userlabelnode.rotation.y = Math.atan2(
        ( cam.position.x - this.userlabelnode.position.x ),
        ( cam.position.z - this.userlabelnode.position.z )
    );
*/
    //this.userlabelnode.matrix.copy( cam.matrix );
}

_handleTalk(){
    //if (this._bPlayingAudio) return;
    if (this._auTalk.isPlaying) return;
    if (this._auChunks.length < 2) return;

    let buf = this._auChunks[this._iAU];

    this._auTalk.setBuffer( buf );
    this._auTalk.play();

    //this._bPlayingAudio = true;
/*
    this._auTalk.onended = ()=>{
        this._bPlayingAudio = false;
        buf = null;
    };
*/
    //this.setTalkVolume(d.volume);
    this.setTalkVolume(5.0);
}


_handleTalkOLD(){
    if (this._bPlayingAudio) return;
    if (this._auChunks.length < 1) return;

    let buf = this._auChunks.shift();

    this._auTalk.setBuffer( buf );
    /*if (!this._auTalk.isPlaying)*/ this._auTalk.play();

    this._bPlayingAudio = true;

    this._auTalk.onended = ()=>{
        this._bPlayingAudio = false;
        buf = null;
    };

    //this.setTalkVolume(d.volume);
    this.setTalkVolume(5.0);
}


};