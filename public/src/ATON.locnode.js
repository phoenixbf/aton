/*
    ATON Light Probe Class

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
Class representing a locomotion node
@class LocomotionNode

@example 
let LP = new ATON.LocomotionNode()
*/
class LocomotionNode {

constructor(id){
    this.pos   = new THREE.Vector3(0,0,0);
    this.id    = id;
    this._iXPF = undefined;

    this._suiMesh = undefined;
}

/**
Set location
@param {number} x
@param {number} y
@param {number} z
@example
locnode.setLocation(10.0, 1.0, 4.0)
*/
setLocation(x,y,z){
    if (x instanceof THREE.Vector3) this.pos.copy(x);
    else this.pos.set(x,y,z);

    if (this._suiMesh){
        this._suiMesh.position.copy(this.pos);
    }

    //console.log(this.pos);

    return this;
}

getLocation(){
    return this.pos;
}

realizeSUI(mat){
    if (ATON.SUI.gLocNodes === undefined) return this;
    if (this._suiMesh !== undefined) return this; // already realized

    if (mat === undefined) mat = ATON.MatHub.materials.lp;

    this._suiMesh = new THREE.Mesh( ATON.Utils.geomUnitSphere, mat);

    this._suiMesh.position.copy(this.pos);
    this._suiMesh.scale.set(ATON.Nav.STD_LOCNODE_SIZE, ATON.Nav.STD_LOCNODE_SIZE, ATON.Nav.STD_LOCNODE_SIZE);

    ATON.SUI.gLocNodes.add( this._suiMesh );

    return this;
}

toggleSUI(b){
    if (this._suiMesh === undefined) return this;

    this._suiMesh.visible = b;

    return this;
}

}

export default LocomotionNode;