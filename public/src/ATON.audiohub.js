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

    AudioHub._bGenAuPlaying = false;
};

AudioHub.playOnceGlobally = (audioURL, bDontOverlap)=>{
    if (bDontOverlap && AudioHub._bGenAuPlaying) return undefined;
    
    audioURL = ATON.Utils.resolveCollectionURL(audioURL);
    let au = new THREE.Audio( ATON.AudioHub._listener );

    AudioHub._loader.load( audioURL, (buffer)=>{
        au.setBuffer( buffer );
        //au.setVolume( 2.0 );
        //au.setPlaybackRate(0.9);
        au.play();

        if (bDontOverlap) AudioHub._bGenAuPlaying = true;
    });

    if (bDontOverlap) au.onEnded = ()=>{
        AudioHub._bGenAuPlaying = false;
    };

    return au;
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