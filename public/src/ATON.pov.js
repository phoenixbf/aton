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
    this.fov    = ATON.Nav.STD_FOV;

    this.kwords = undefined;

    this.nextPOV = undefined;
    this.prevPOV = undefined;

    // Register
    this.as(id);
}

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
Add a keyword to this viewpoint
@param {string} kw - the keyword
@example
new ATON.POV("myView").addKeyword("heritage")
*/
addKeyword(kw){
    if (this.kwords === undefined) this.kwords = [];
    this.kwords.push(kw);

    return this;
}

setKeywords(kwarray){
    this.kwords = kwarray;
    return this;
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