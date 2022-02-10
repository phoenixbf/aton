/*
    ATON Light Probe Class

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
Class representing a locomotion node. 
A Locomotion Node is useful to constrain first-person navigation into specific hotspots.
@class LocomotionNode

@example 
let locnode = new ATON.LocomotionNode()
*/
class LocomotionNode {

constructor(id){
    this.pos   = new THREE.Vector3(0,0,0);
    this.id    = id;
    this._iXPF = undefined;

    this._sui = undefined;
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

    if (this._sui){
        this._sui.position.copy(this.pos);
    }

    //console.log(this.pos);

    return this;
}

/**
Get location
@returns {THREE.Vector3}
*/
getLocation(){
    return this.pos;
}

/**
Realize Spatial-UI element
@param {THREE.Material} mat - (optional) THREE.Material
*/
realizeSUI(mat){
    if (ATON.SUI.gLocNodes === undefined) return this;

    this._sui = new THREE.Sprite( ATON.SUI.getOrCreateSpriteWalk() );

    this._sui.position.copy(this.pos);
    this._sui.scale.set(ATON.Nav.STD_LOCNODE_SIZE, ATON.Nav.STD_LOCNODE_SIZE, ATON.Nav.STD_LOCNODE_SIZE);

    ATON.SUI.gLocNodes.add( this._sui );
    
/*
    if (this._sui !== undefined) return this; // already realized

    if (mat === undefined) mat = ATON.MatHub.materials.lp;

    this._sui = new THREE.Mesh( ATON.Utils.geomUnitSphere, mat);

    this._sui.position.copy(this.pos);
    this._sui.scale.set(ATON.Nav.STD_LOCNODE_SIZE, ATON.Nav.STD_LOCNODE_SIZE, ATON.Nav.STD_LOCNODE_SIZE);

    ATON.SUI.gLocNodes.add( this._sui );
*/
    return this;
}

/**
Toggle (show or hide) Spatial-UI for this locomotion node
@param {boolean} b
@example
locnode.toggleSUI(false)
*/
toggleSUI(b){
    if (this._sui === undefined) return this;

    this._sui.visible = b;

    return this;
}

}

export default LocomotionNode;