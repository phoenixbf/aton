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
    this.username = "anonymous";
    this.message  = "...";
    this.bTalking = false;

    this._tStateCall = -1.0;
    this._tStateDur  = 0.1;
    this._tProgress  = 0.0;

    this._currState  = {};
    this._currState.position   = new THREE.Vector3();
    this._currState.quaternion = new THREE.Quaternion();

    this._tgtState = undefined;

    //console.log(this);

    this.realize();
}

getAvatarMaterialByUID(uid){
    //if (uid === undefined) return 0;

    let avaMats = ATON.MatHub.materials.avatars;
    let mi = (uid % avaMats.length); //uid? (uid % avaMats.length) : 0;
    
    return avaMats[mi];
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

    // Build Label
    this.userlabelnode = ATON.createUINode();
    this.labelcontainer = new ThreeMeshUI.Block({
        width: 0.7,
        height: 0.25,
        padding: 0.03,
        borderRadius: 0.05,
        backgroundColor: ATON.VRoadcast.ucolorsdark[this.userid % ATON.VRoadcast.ucolorsdark.length],

        fontFamily: ATON.PATH_RES+"fonts/custom-msdf.json", //ATON.PATH_MODS+'three-mesh-ui/examples/assets/Roboto-msdf.json',
        fontTexture: ATON.PATH_RES+"fonts/custom.png" //ATON.PATH_MODS+'three-mesh-ui/examples/assets/Roboto-msdf.png',

        //alignContent: 'right', // could be 'center' or 'left'
        //justifyContent: 'end', // could be 'center' or 'start'
    });

    this.userlabelnode.position.y = 0.4;
    this.userlabelnode.add(this.labelcontainer);

    // username text
    this.usernametext = new ThreeMeshUI.Text({ 
        content: "User #"+this.userid,
        fontSize: 0.09,
        fontColor: ATON.MatHub.colors.white //ATON.VRoadcast.ucolors[this.userid % ATON.VRoadcast.ucolors.length]
    });
    this.usernametext.position.y = 0.0;

    // message text
    this.usermessagetext = new ThreeMeshUI.Text({ 
        content: "\nHello World!",
        fontSize: 0.03,
        fontColor: ATON.MatHub.colors.white
    });
    this.usermessagetext.position.y = -0.03;

    this.labelcontainer.add(this.usernametext);
    this.labelcontainer.add(this.usermessagetext);
    
    this.add(this.usermeshnode);
    this.add(this.userlabelnode);
};

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
    this.username = username;

    this.usernametext.set({ 
        content: username
    });

    return this;
}

setMessage(msg){
    this.message = msg;

    // TODO: check for text length
    this.usermessagetext.set({ 
        content: "\n"+msg
    });

    return this;
}

requestStateTransition(S){
    if (this._tStateCall >= 0.0) return; // already requested

    this._tStateCall = ATON._clock.elapsedTime;

    this._currState.position.copy(this.position);
    this._currState.quaternion.copy(this.quaternion);

    this._tgtState = S;
    
    //this._sDistance = this.position.distanceTo(S.position);
}

handleStateTransition(){
    if (this._tStateCall < 0.0) return;

    let D = this._tStateDur; //(this._sDistance * this._tStateDur);

    if (D <= 0.0) this._tProgress = 1.0;
    else this._tProgress = (ATON._clock.elapsedTime - this._tStateCall) / D;

    let cs = this._currState;
    let ts = this._tgtState;

    // End
    if (this._tProgress >= 1.0){
        this._tStateCall = -1.0;

        this.position.copy(ts.position);
        //this.quaternion.copy(ts.quaternion);
        this.usermeshnode.quaternion.copy(ts.quaternion);

        return;
    }

    this.position.lerpVectors(cs.position, ts.position, this._tProgress);
    this.usermeshnode.quaternion.slerp(ts.quaternion, this._tProgress);
    //THREE.Quaternion.slerp( cs.quaternion, ts.quaternion, this.usermeshnode.quaternion, this._tProgress);
}

update(){
    this.handleStateTransition();

    let cam  = ATON.Nav._camera;
    let eye = ATON.Nav._currPOV.pos;
    if (cam === undefined || eye === undefined) return;

    //this.userlabelnode.lookAt( eye );

    //this.userlabelnode.setRotationFromMatrix(cam.matrix); // quaternion.setFromRotationMatrix( cam.matrix );
    //this.userlabelnode.rotation.copy(cam.rotation);

    this.userlabelnode.orientToCamera(); //quaternion.copy( ATON.Nav._qOri );

/*
    this.userlabelnode.rotation.y = Math.atan2(
        ( cam.position.x - this.userlabelnode.position.x ),
        ( cam.position.z - this.userlabelnode.position.z )
    );
*/
    //this.userlabelnode.matrix.copy( cam.matrix );
}


};