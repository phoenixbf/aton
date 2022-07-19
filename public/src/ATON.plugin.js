/*
    ATON Plugin Class

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
Class representing a plugin
A plugin can be used to extend functionalities to any ATON front-end 
by providing a setup routine (initalization) and an optional update routine (executed continuously)
@class Plugin

@example 
let P = new ATON.Plugin( mySetup, myUpdate )
ATON.registerPlugin(P);
*/
class Plugin {

constructor( setup, update ){
    this.setup  = setup? setup : undefined;
    this.update = update? update : undefined;
}

}

export default Plugin;