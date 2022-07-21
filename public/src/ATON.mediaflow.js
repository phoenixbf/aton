/*
    ATON MediaFlow

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
ATON MediaFlow
@namespace MediaFlow
*/
let MediaFlow = {};

MediaFlow.auType = "audio/wav"; // 'audio/ogg; codecs=opus'

MediaFlow.auStreamInterval = 500; // 1000
MediaFlow.auMinVol = 1;


MediaFlow.init = ()=>{
    MediaFlow._bAudioRecording = false;
    MediaFlow._bStreaming = false;

    // Streaming options
    MediaFlow._sopts = {
        audioBitsPerSecond: 9000,
        audio: true
    };

    // Recording options
    MediaFlow._ropts = {
        audio: true
    };

    MediaFlow._mr = undefined;
    MediaFlow._ds = undefined;

    MediaFlow._sblob = undefined;
    MediaFlow._schunks = [];

    MediaFlow._fr = new window.FileReader();
};

// Audio Recording
MediaFlow.isAudioRecording = ()=>{
    return MediaFlow._bAudioRecording;
};

MediaFlow.startRecording = ()=>{
    if (MediaFlow._bAudioRecording){
        console.log("Already recording.");
        return;
    }

    navigator.mediaDevices.getUserMedia( MediaFlow._ropts )
    .then((stream)=>{
        MediaFlow._mr = new MediaRecorder(stream);

        MediaFlow._mr.onstart = function(e){
            console.log("Start recording...");

            MediaFlow._bAudioRecording = true;
            MediaFlow._schunks = [];
        };

        MediaFlow._mr.ondataavailable = function(e){
            MediaFlow._schunks.push(e.data);
        };

        MediaFlow._mr.onstop = function(e){
            console.log("Stop recording...");

            MediaFlow._sblob = new Blob(MediaFlow._schunks, { 'type' : MediaFlow.auType });

            MediaFlow._fr.readAsDataURL(MediaFlow._sblob); 
            MediaFlow._fr.onloadend = ()=>{
               let b64 = MediaFlow._fr.result;
               //b64 = b64.split(',')[1];

               ATON.fireEvent("AudioRecordCompleted", b64);
               MediaFlow._bAudioRecording = false;
            };
        };

        MediaFlow._mr.start();
    })
    .catch((e)=>{
        console.log(e);
    });
};

MediaFlow.stopRecording = ()=>{
    if (!MediaFlow._bAudioRecording) return;
    if (!MediaFlow._mr) return;

    MediaFlow._mr.stop();
};

MediaFlow.startOrStopRecording = ()=>{
    if (MediaFlow._bAudioRecording) MediaFlow.stopRecording();
    else MediaFlow.startRecording();
};


// Audio Streaming
MediaFlow.startMediaStreaming = ()=>{
    navigator.mediaDevices.getUserMedia( MediaFlow._sopts )
    .then((stream)=>{
        MediaFlow._mr = new MediaRecorder(stream);

        // First time create streaming routine
        if (MediaFlow._ds === undefined){
            MediaFlow._ds = setInterval(()=>{
                if (!MediaFlow._bStreaming) return;
                MediaFlow._mr.stop();
        
            }, MediaFlow.auStreamInterval );
        }

        MediaFlow._mr.onstart = function(e) {
            MediaFlow._bStreaming = true;
            MediaFlow._bAudioRecording = true;
            MediaFlow._schunks = [];
        };

        MediaFlow._mr.ondataavailable = function(e){
            MediaFlow._schunks.push(e.data);
        };

        MediaFlow._mr.onstop = function(e){
            MediaFlow._sblob = new Blob(MediaFlow._schunks, { 'type' : MediaFlow.auType }); //'audio/ogg; codecs=opus' });

            MediaFlow._fr.readAsDataURL(MediaFlow._sblob); 
            MediaFlow._fr.onloadend = ()=>{
               let b64 = MediaFlow._fr.result;
               //b64 = b64.split(',')[1];

                ATON.VRoadcast.socket.emit("UTALK", {
                    audio: b64,
                    uid: ATON.VRoadcast.uid,
                    //vol: MediaFlow._auAVGvolume
                });

               b64 = null;
            };

            if (MediaFlow._bStreaming) MediaFlow._mr.start();
        };
    
        // Start recording
        MediaFlow._mr.start();
    })
    .catch((e)=>{
        console.log(e);
    });
};

MediaFlow.stopMediaStreaming = ()=>{
    if (!MediaFlow._mr) return;

    MediaFlow._mr.stop();

    MediaFlow._bStreaming = false;
    MediaFlow._bAudioRecording = false;
};

MediaFlow.startOrStopMediaStreaming = ()=>{
    if (MediaFlow._bAudioRecording) MediaFlow.stopMediaStreaming();
    else MediaFlow.startMediaStreaming();
};

export default MediaFlow;