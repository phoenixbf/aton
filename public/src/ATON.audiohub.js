/*
    ATON Audio Hub
    Centralized Audio/Soundscape

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
ATON Audio Hub
@namespace AudioHub
*/
let AudioHub = {};

// Realize the hub
AudioHub.init = ()=>{

    AudioHub._listener = new THREE.AudioListener();
    AudioHub._loader   = new THREE.AudioLoader();
};


export default AudioHub;