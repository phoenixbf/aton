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

    this.color = ATON.VRoadcast.ucolors[this.userid % ATON.VRoadcast.ucolors.length];
    
    //this.bTalking = false;

    //this._auTalk = undefined;

    // Positional audio (talk)
    this._auTalk = new THREE.PositionalAudio( ATON.AudioHub._listener );
    this._auTalk.setRefDistance(30.0);
    this._auTalk.setLoop( false );
    this.add(this._auTalk); // move with avatar

    this._bPlayingAudio = false;
    this._auChunks = [];

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

    this.realize();
}

getColor(){
    return this.color;
}

setTalkDistance(r){
    if (r > 0.0) this._auTalk.setRefDistance(r);
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
}

realize(){
    // build minimal representation
    let g = new THREE.SphereGeometry( 0.2, 16, 16 );

    this.usermaterial = this.getAvatarMaterialByUID(this.userid);

    let smesh = new THREE.Mesh( g, this.usermaterial );

    this.usermeshnode = ATON.createUINode();
    this.usermeshnode.add(smesh);
    this.usermeshnode.setMaterial(this.usermaterial);

    // CHECK / FIXME: this is to avoid cloning of the same mesh when using same representation for all avatars
    this.usermeshnode.setCloneOnLoadHit(false);

    this.add(this.usermeshnode);


    // Talk UI
    this.userauinode = new THREE.Sprite( ATON.VRoadcast.uspritemats[this.userid % ATON.VRoadcast.uspritemats.length] );
    this.userauinode.position.set(0,0,0);
    this.userauinode.visible = false;

    this.add(this.userauinode);


    // Focus
    this.userfpnode = new THREE.Sprite( ATON.VRoadcast.ufocmats[this.userid % ATON.VRoadcast.ufocmats.length] );
    this.userfpnode.position.set(0,0,0);
    //this.userfpnode.scale.set(10,10,10);
    this.userfpnode.visible = false;

    //this.add(this.userfpnode);
    
    // Focus is centralized for better location accuracy
    if (ATON.VRoadcast._focNodes[this.userid] === undefined){
        ATON.VRoadcast._focNodes[this.userid] = this.userfpnode;
        ATON.VRoadcast.focGroup.add( this.userfpnode );
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
    if (ATON.VRoadcast._focNodes[this.userid]) ATON.VRoadcast._focNodes[this.userid].dispose();

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

    this._tgtFocusPos.set( parseFloat(fp[0]), parseFloat(fp[1]), parseFloat(fp[2]) );
    this._tgtFocusRad = parseFloat(fp[3])*2.0;

    this.userfpnode.scale.set(this._tgtFocusRad,this._tgtFocusRad,this._tgtFocusRad);

    this.userfpnode.visible = true;

    ATON.enablePointLight();
    ATON.plight.color = this.color;
    ATON.plight.position.copy(this._tgtFocusPos);
    ATON.plight.distance = this._tgtFocusRad;
}

handleFocusTransition(){
    if (this._tFocCall < 0.0) return;

    let D = ATON.VRoadcast.USER_STATE_FREQ; //this._tStateDur;

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
    this._tgtState.scale = S.scale;
    
    //this._sDistance = this.position.distanceTo(S.position);
}

handleStateTransition(){
    if (this._tStateCall < 0.0) return;

    let D = ATON.VRoadcast.USER_STATE_FREQ; //this._tStateDur;

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
    if (this._bPlayingAudio) return;
    if (this._auChunks.length < 1) return;

    let d = this._auChunks.shift();

    let au = new Audio();
    au.src = d.data;

    au.play();
    this._bPlayingAudio = true;

    au.onended = ()=>{
        this._bPlayingAudio = false;
        au = null;
        //console.log("finished playing chunk");
    };

    //this.setTalkVolume(d.volume);
    this.setTalkVolume(5.0);
}


};