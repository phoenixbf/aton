/*
    ATON Flare Class

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
Class representing a plugin
A flare can be used to extend functionalities to any ATON app 
by providing a setup routine (initalization) and an optional update routine (executed continuously).
A flare must be then added (registered) via ATON.addFlare() or register() method
@class Flare

@example 
let P = new ATON.Flare( mySetup, myUpdate )
ATON.addFlare(P);
*/
class Flare {

constructor( setup, update ){
    this.setup  = setup? setup : undefined;
    this.update = update? update : undefined;

    this._deps = [];
    this._id   = undefined;
}

/**
Register globally this flare
@param {String} id - (Optional) identifier for the flare object (to be accessible through ATON[id])
*/
register(id){
    ATON.addFlare(this, id);

    if (id) this._id = id;
    
    return this;
}

log(msg){
    if (this._id) console.log("[Flare "+this._id+"] " + msg);
    else console.log("[Flare]" + msg);
}

// Experimental
include(path){
    this._deps.push(path);

    return this;
}

}

export default Flare;