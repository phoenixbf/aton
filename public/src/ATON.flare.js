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
}

/**
Register globally this flare
*/
register(){
    ATON.addFlare(this);
    
    return this;
}

// Experimental
include(path){
    this._deps.push(path);

    return this;
}

}

export default Flare;