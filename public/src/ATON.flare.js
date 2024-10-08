/*
    ATON Flare Class

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
Class representing a plugin
A flare can be used to extend functionalities to any ATON app by providing a setup routine (initalization) and an optional update routine (executed continuously).
In order to be activated, a flare must be registered via register() method
@class Flare

@example 
let F = new ATON.Flare("myflare")
*/
class Flare {

constructor( id ){
    this._id        = undefined;
    this._bDeployed = false;

    if (id) this.register(id);
}

/**
Register and activate globally this flare
@param {String} id - (Optional) local identifier for the flare object (to be accessible through ATON.Flares[id]). It could differ from server flare-ID
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

setSetup(setup){
    this.setup = setup;
    return this;
}

setUpdate(upd){
    this.update = upd;
    return this;
}

}

export default Flare;