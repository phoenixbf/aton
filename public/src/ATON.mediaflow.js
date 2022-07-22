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

    // Constraints
    MediaFlow._cAuStream = {
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            channelCount: 1,
            //sampleSize: 16,
            //sampleRate: 44100
        }
    };

    MediaFlow._cAuRec = {
        audio: {
            channelCount: 1
        }
    };

    MediaFlow._cVidRec = {
        video: {
            width: 1280,
            height: 720,
            //width: { min: 640, ideal: 1920 },
            //height: { min: 400, ideal: 1080 },
            //aspectRatio: { ideal: 1.7777777778 },
            framerate: 30
        }
    };

    MediaFlow._cVidStream = {
        video: {
            cursor: "always",
            width: 640,
            height: 360,
            //width: { min: 640, ideal: 1920 },
            //height: { min: 400, ideal: 1080 },
            //aspectRatio: { ideal: 1.7777777778 },
            framerate: 25
        }
    };

    // Options
    MediaFlow._oAuStream = {
        audioBitsPerSecond : 10000
        //bitsPerSecond: ,
    };

    MediaFlow._aurec = undefined;
    MediaFlow._ds = undefined;
    
    MediaFlow._sblob = undefined;
    MediaFlow._schunks = [];
    
    // ScreenCap
    MediaFlow._bScreenStream = false;
    MediaFlow._screc    = undefined;
    MediaFlow._scblob   = undefined;
    MediaFlow._scchunks = [];
    MediaFlow._dsc      = undefined;

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

    navigator.mediaDevices.getUserMedia( MediaFlow._cAuRec )
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
    navigator.mediaDevices.getUserMedia( MediaFlow._cAuStream )
    .then((stream)=>{
        MediaFlow._aurec = new MediaRecorder( stream, MediaFlow._oAuStream );

        // First time create streaming routine
        if (MediaFlow._ds === undefined){
            MediaFlow._ds = setInterval(()=>{
                if (!MediaFlow._bStreaming) return;
                MediaFlow._aurec.stop();
        
            }, MediaFlow.auStreamInterval );
        }

        MediaFlow._aurec.onstart = (e) => {
            MediaFlow._bStreaming = true;
            MediaFlow._bAudioRecording = true;
            MediaFlow._schunks = [];
        };

        MediaFlow._aurec.ondataavailable = (e)=>{
            if (e.data.size <= 0) return;
            MediaFlow._schunks.push(e.data);
        };

        MediaFlow._aurec.onstop = function(e){
            MediaFlow._sblob = new Blob(MediaFlow._schunks, { 'type' : MediaFlow.auType });
            
            //console.log(MediaFlow._sblob.size+" B")

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


// Screen recording
MediaFlow.startScreenRecording = ()=>{
    navigator.mediaDevices.getDisplayMedia( MediaFlow._cVidRec )
    .then((stream)=>{
        MediaFlow._screc = new MediaRecorder(stream);
        MediaFlow._scchunks = [];

        MediaFlow._screc.ondataavailable = event => {
            if (event.data.size > 0) {
                MediaFlow._scchunks.push(event.data);
            }
        }

        MediaFlow._screc.onstop = () => {
            MediaFlow._scblob = new Blob(MediaFlow._scchunks, {
                type: 'video/webm;codecs=vp9'
            });

            console.log(MediaFlow._scblob.size);

            MediaFlow._scchunks = [];
            //const blobUrl = URL.createObjectURL(MediaFlow._scblob);

            //console.log(blobUrl);
            ATON.Utils.downloadBlob( MediaFlow._scblob, "capture.webm" );
        }

        MediaFlow._screc.start(200);
    })
    .catch((e)=>{
        console.log(e);
    });
};

MediaFlow.startScreenStreaming = ()=>{
    navigator.mediaDevices.getDisplayMedia( MediaFlow._cVidStream )
    .then((stream)=>{
        MediaFlow._screc = new MediaRecorder(stream);

        // First time create streaming routine
        if (MediaFlow._dsc === undefined){
            MediaFlow._dsc = setInterval(()=>{
                if (!MediaFlow._bScreenStream) return;
                MediaFlow._screc.stop();
            }, 1000 );
        }

        MediaFlow._screc.onstart = (e) => {
            MediaFlow._bScreenStream = true;
            MediaFlow._scchunks = [];
        };

        MediaFlow._screc.ondataavailable = event => {
            if (event.data.size > 0) {
                MediaFlow._scchunks.push(event.data);
            }
        }

        MediaFlow._screc.onstop = () => {
            MediaFlow._scblob = new Blob(MediaFlow._scchunks, {
                type: 'video/webm;codecs=vp9'
            });

            console.log(MediaFlow._scblob.size);

            MediaFlow._fr.readAsDataURL(MediaFlow._scblob); 
            MediaFlow._fr.onloadend = ()=>{
               let b64 = MediaFlow._fr.result;

                ATON.VRoadcast.socket.emit("UVIDEO", {
                    video: b64,
                    uid: ATON.VRoadcast.uid
                });

               b64 = null;
            };

            if (MediaFlow._bScreenStream) MediaFlow._screc.start();
        }

        MediaFlow._screc.start(200);
    })
    .catch((e)=>{
        console.log(e);
    });
};

MediaFlow.stopScreenStreaming = ()=>{
    if (!MediaFlow._screc) return;

    MediaFlow._screc.stop();
    MediaFlow._bScreenStream = false;
};

export default MediaFlow;