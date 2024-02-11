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
let F = new ATON.Flare( mySetup, myUpdate )
F.register();
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
@param {String} id - (Optional) identifier for the flare object (to be accessible through ATON.Flares[id])
*/
register(id){
    if (id) this._id = id;
    
    ATON.addFlare(this);
    
    return this;
}

/**
Return Flare ID if defined
@returns {String} - Flare ID
*/
getID(){
    return this._id;
}

/**
Flare log
@param {String} msg - Message to log
*/
log(msg){
    if (this._id) console.log("[Flare "+this._id+"] " + msg);
    else console.log("[Flare]" + msg);

    return this;
}


// Experimental
include(path){
    this._deps.push(path);

    return this;
}

}

export default Flare;