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

/* TODO:
AudioHub.addToSoundscape = (auid, audioURL, position, radius)=>{

    AudioHub._loader.load( audioURL, (buffer)=>{
        A._auTalk.setBuffer( buffer );
        A._auTalk.setLoop( false );
        //A._auTalk.setVolume( 0.5 );
        //A._auTalk.setPlaybackRate(0.9);
        A._auTalk.play();
    });
};
*/
export default AudioHub;