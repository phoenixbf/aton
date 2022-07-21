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
    MediaFlow._bScreencap = false;

    // Streaming options
    MediaFlow._sopts = {
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            //audioBitsPerSecond: 9000,
            //sampleRate: 44100
        }
    };

    // Recording options
    MediaFlow._ropts = {
        audio: true
    };

    // Screen cap
    MediaFlow._copts = {
        video: {
            cursor: "always",
            //width: 1024,
            //height: 1024
        }
    };

    MediaFlow._aurec = undefined;
    MediaFlow._ds = undefined;
    
    MediaFlow._sblob = undefined;
    MediaFlow._schunks = [];
    
    // ScreenCap
    MediaFlow._screc    = undefined;
    MediaFlow._scblob   = undefined;
    MediaFlow._scchunks = [];

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
        MediaFlow._aurec = new MediaRecorder(stream);

        MediaFlow._aurec.onstart = function(e){
            console.log("Start recording...");

            MediaFlow._bAudioRecording = true;
            MediaFlow._schunks = [];
        };

        MediaFlow._aurec.ondataavailable = function(e){
            MediaFlow._schunks.push(e.data);
        };

        MediaFlow._aurec.onstop = function(e){
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

        MediaFlow._aurec.start();
    })
    .catch((e)=>{
        console.log(e);
    });
};

MediaFlow.stopRecording = ()=>{
    if (!MediaFlow._bAudioRecording) return;
    if (!MediaFlow._aurec) return;

    MediaFlow._aurec.stop();
};

MediaFlow.startOrStopRecording = ()=>{
    if (MediaFlow._bAudioRecording) MediaFlow.stopRecording();
    else MediaFlow.startRecording();
};


// Audio Streaming
MediaFlow.startMediaStreaming = ()=>{
    navigator.mediaDevices.getUserMedia( MediaFlow._sopts )
    .then((stream)=>{
        MediaFlow._aurec = new MediaRecorder(stream);

        // First time create streaming routine
        if (MediaFlow._ds === undefined){
            MediaFlow._ds = setInterval(()=>{
                if (!MediaFlow._bStreaming) return;
                MediaFlow._aurec.stop();
        
            }, MediaFlow.auStreamInterval );
        }

        MediaFlow._aurec.onstart = function(e) {
            MediaFlow._bStreaming = true;
            MediaFlow._bAudioRecording = true;
            MediaFlow._schunks = [];
        };

        MediaFlow._aurec.ondataavailable = function(e){
            MediaFlow._schunks.push(e.data);
        };

        MediaFlow._aurec.onstop = function(e){
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

            if (MediaFlow._bStreaming) MediaFlow._aurec.start();
        };
    
        // Start recording
        MediaFlow._aurec.start();
    })
    .catch((e)=>{
        console.log(e);
    });
};

MediaFlow.stopMediaStreaming = ()=>{
    if (!MediaFlow._aurec) return;

    MediaFlow._aurec.stop();

    MediaFlow._bStreaming = false;
    MediaFlow._bAudioRecording = false;
};

MediaFlow.startOrStopMediaStreaming = ()=>{
    if (MediaFlow._bAudioRecording) MediaFlow.stopMediaStreaming();
    else MediaFlow.startMediaStreaming();
};


// Screen capture
MediaFlow.startScreenCapture = ()=>{
    navigator.mediaDevices.getDisplayMedia( MediaFlow._copts )
    .then((stream)=>{
        MediaFlow._screc = new MediaRecorder(stream);
        MediaFlow._scchunks = [];

        MediaFlow._screc.ondataavailable = event => {
            if (event.data.size > 0) {
                MediaFlow._scchunks.push(event.data);
            }
        }

        MediaFlow._screc.onstop = () => {
            MediaFlow._scblob = new Blob(chunks, {
                type: 'video/webm;codecs=vp9'
            });

            MediaFlow._scchunks = [];
            const blobUrl = URL.createObjectURL(blob);

            console.log(blobUrl);
        }

        MediaFlow._screc.start(200);
    })
    .catch((e)=>{
        console.log(e);
    });
};

export default MediaFlow;