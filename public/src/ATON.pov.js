/*
    ATON Viewpoint Class

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
Class representing a Viewpoint (POV) in the 3D space, abstracting from device used (mobile, desktop or immersive XR).
Constructor allows to assign the POV a unique ID (`string`)
@class POV
@example 
new ATON.POV("myView")
*/
class POV {

constructor(id){
    this.pos    = new THREE.Vector3(1,0,0);
    this.target = new THREE.Vector3(0,0,0);
    this.up     = ATON.STD_UPVECTOR;
    this.fov    = undefined; //ATON.Nav.STD_FOV;

    this.nextPOV = undefined;
    this.prevPOV = undefined;

    // Register
    this.as(id);
}

/**
(Re)assign POV ID
@param {string} id - the new ID
@example
mypov.as("newID")
*/
as(id){
    if (id === undefined) return;

    ATON.Nav.povlist[id] = this;
    this.id = id;

    return this;
}

/**
Set eye position
@example
new ATON.POV("myView").setPosition(2.0,6.0,1.5)
@example
mypov.setPosition( new THREE.Vector3(2.0,6.0,1.5) )
*/
setPosition(x,y,z){
    if (x instanceof THREE.Vector3) this.pos.copy(x);
    else this.pos.set(x,y,z);

    return this;
}

/**
Set target position
@example
new ATON.POV("myView").setTarget(8.0,6.0,1.5)
@example
mypov.setTarget( new THREE.Vector3(8.0,6.0,1.5) ).setPosition(2.0,6.0,1.5)
*/
setTarget(x,y,z){
    if (x instanceof THREE.Vector3) this.target.copy(x);
    else this.target.set(x,y,z);

    return this;
}

/**
Set field of view (FOV) in degrees
@param {number} f
@example
new ATON.POV("myView").setFOV(70.0)
*/
setFOV(f){
    this.fov = f;

    return this;
}

/**
Add keyword(s) to this viewpoint
@param {string} kw - a keyword or comma-separated list of keywords
@example
mypov.addKeywords("heritage,architecture")
*/
addKeywords(kw){
    let K = kw.split(",");

    if (this.kwords === undefined) this.kwords = {};
    for (let k in K){
        let kw = K[k].trim();
        if (kw.length > 0) this.kwords[kw] = true;
    }

    return this;
}

/**
Returns true if this viewpoint has specific keyword
@param {string} kw - the keyword
@returns {boolean}
@example
if (myPOV.hasKeyword("heritage")){ ... }
*/
hasKeyword(kw){
    if (this.kwords === undefined) return;
    return (this.kwords[kw] !== undefined);
}

/**
Set an optional next POV
@param {POV} pov - the next POV
*/
setNextPOV(pov){
    if (!pov) return;
    this.nextPOV = pov;

    return this;
}

/**
Set an optional previous POV
@param {POV} pov - the previous POV
*/
setPrevPOV(pov){
    if (!pov) return;
    this.prevPOV = pov;

    return this;
}

}

export default POV;