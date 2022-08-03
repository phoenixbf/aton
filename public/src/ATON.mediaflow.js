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

//MediaFlow.auStreamInterval        = 700; // 400
//MediaFlow.vidStreamInterval       = 500;
MediaFlow.auStreamSegmentInterval  = 200;
MediaFlow.auStreamNumSegments      = 2;

MediaFlow.vidStreamSegmentInterval = 300;
MediaFlow.vidStreamNumSegments     = 1;

MediaFlow.auMinVol = 1;


MediaFlow.init = ()=>{
    MediaFlow._bAudioRecording = false;
    MediaFlow._bStreaming = false;
    MediaFlow._bScreencap = false;

    // blob options
    MediaFlow._blobOptAudio = {
        type : "audio/wav" // 'audio/ogg; codecs=opus'
    };

    MediaFlow._blobOptVideo = {
        //type: "video/webm;codecs=vp9"
        type: "video/mp4"
    };

    // Constraints
    MediaFlow._cAuStream = {
        audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            //sampleSize: 16,
            //sampleRate: 20000
        }
    };

    MediaFlow._cAuRec = {
        audio: {
            channelCount: 1
        }
    };

    MediaFlow._cScreenRec = {
        video: {
            width: 1280,
            height: 720,
            //width: { min: 640, ideal: 1920 },
            //height: { min: 400, ideal: 1080 },
            //aspectRatio: { ideal: 1.7777777778 },
            framerate: 30
        }
    };

    MediaFlow._cScreenStream = {
        video: {
            cursor: "always",
            //width: 640,
            //height: 360,
            width: { max: 640 },
            height: { max: 360 },
            //aspectRatio: { ideal: 1.7777777778 },
            framerate: 25
        }
        //audio: { channelCount: 1 }
    };

    MediaFlow._cCamStream = {
        video: {
            width: { max: 320 }
        }
        //audio: { channelCount: 1 }
    };

    // Options
    MediaFlow._oStream = {
        audioBitsPerSecond : 9000,
        //videoBitsPerSecond: 100000
        //bitsPerSecond: ,
    };

    MediaFlow._aurec = undefined;
    
    MediaFlow._sblob = undefined;
    MediaFlow._schunks = [];
    
    // Screen / Camera
    MediaFlow._bVideoStream = false;
    MediaFlow._vrec    = undefined;
    MediaFlow._scblob   = undefined;
    MediaFlow._scchunks = [];

    MediaFlow._bCamStream    = false;
    MediaFlow._bScreenStream = false;

    // FReaders with onload routines
    MediaFlow._setupFR();
};

// Utilities
//==========================================================
MediaFlow._setupFR = ()=>{
    MediaFlow._frAR = new window.FileReader();
    MediaFlow._frAR.onloadend = ()=>{
        let b64 = MediaFlow._frAR.result;
        //b64 = b64.split(',')[1];

        ATON.fireEvent("AudioRecordCompleted", b64);
        MediaFlow._bAudioRecording = false;
    };

    MediaFlow._frAS = new window.FileReader();
    MediaFlow._frAS.onloadend = ()=>{
        let b64 = MediaFlow._frAS.result;

         ATON.VRoadcast.socket.emit("UTALK", {
             audio: b64,
             uid: ATON.VRoadcast.uid,
             //vol: MediaFlow._auAVGvolume
         });

        b64 = null;
    };

    MediaFlow._frVS = new window.FileReader();
    MediaFlow._frVS.onloadend = ()=>{
        let b64 = MediaFlow._frVS.result;

         ATON.VRoadcast.socket.emit("UVIDEO", {
             video: b64,
             uid: ATON.VRoadcast.uid
         });

        b64 = null;
    };

    // FR pool
/*
    MediaFlow._frPool = [];
    for (let k=0; k<10; k++) MediaFlow._frPool.push(new window.FileReader() );
    MediaFlow._fri = 0;
*/
};

/*
MediaFlow.getFR = ()=>{
    let fr = MediaFlow._frPool[MediaFlow._fri];
    MediaFlow._fri = (MediaFlow._fri+1) % 10;
    return fr;
};

MediaFlow.convertAudioChunksToBase64 = ( au, onComplete )=>{
    let blob = new Blob( au, MediaFlow._blobOptAudio );
    let b64  = undefined;

    let fr = MediaFlow.getFR();
    
    fr.readAsDataURL( blob ); 
    fr.onloadend = ()=>{
        b64  = fr.result;
        blob = null;

        if (onComplete) onComplete( b64 );    
    };
};

MediaFlow.convertAudioChunksToBuffer = ( au, onComplete )=>{
    let blob = new Blob( au, MediaFlow._blobOptAudio );
    let b64  = undefined;

    let fr = MediaFlow.getFR();

    fr.readAsDataURL( blob ); 
    fr.onloadend = ()=>{
        b64  = fr.result;
        blob = null;

        ATON.AudioHub._loader.load( b64, (buffer)=>{
            if (!buffer) return;

            if (onComplete) onComplete( buffer );
        });
    };
};

MediaFlow.convertVideoChunksToBase64 = ( vid, onComplete )=>{
    let blob = new Blob( vid, MediaFlow._blobOptVideo );
    let b64  = undefined;

    let fr = MediaFlow.getFR();
    
    fr.readAsDataURL( blob ); 
    fr.onloadend = ()=>{
        b64  = fr.result;
        blob = null;

        if (onComplete) onComplete( b64 );
        
    };
};

MediaFlow.convertVideoChunksToBuffer = ( vid, onComplete )=>{
    let blob = new Blob( vid, MediaFlow._blobOptVideo );
    let b64  = undefined;

    let fr = MediaFlow.getFR();
    
    fr.readAsDataURL( blob ); 
    fr.onloadend = ()=>{
        b64  = fr.result;
        blob = null;

        ATON.AudioHub._loader.load( b64, (buffer)=>{
            if (!buffer) return;

            if (onComplete) onComplete( buffer );
        });
    };
};
*/

// Audio Recording
//==========================================================
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

            MediaFlow._sblob = new Blob(MediaFlow._schunks, MediaFlow._blobOptAudio);

            MediaFlow._frAR.readAsDataURL(MediaFlow._sblob);
        };

        MediaFlow._aurec.start();
    })
    .catch((e)=>{
        console.log(e);
    });
};

MediaFlow.stopRecording = ()=>{
    if (!MediaFlow._aurec) return;
    if (!MediaFlow._bAudioRecording) return;

    MediaFlow._aurec.stop();
};

MediaFlow.startOrStopRecording = ()=>{
    if (MediaFlow._bAudioRecording) MediaFlow.stopRecording();
    else MediaFlow.startRecording();
};


// Audio Streaming
//==========================================================
MediaFlow.startMediaStreaming = ()=>{
    navigator.mediaDevices.getUserMedia( MediaFlow._cAuStream )
    .then((stream)=>{
        MediaFlow._aurec = new MediaRecorder( stream, MediaFlow._oStream );

        // Start streaming
        MediaFlow._aurec.start( MediaFlow.auStreamSegmentInterval );

        MediaFlow._aurec.onstart = (e) => {
            MediaFlow._bStreaming = true;
            MediaFlow._bAudioRecording = true;
            MediaFlow._schunks = [];
        };

        MediaFlow._aurec.ondataavailable = (e)=>{
            if (e.data.size <= 0) return;
            MediaFlow._schunks.push(e.data);

            //console.log(MediaFlow._schunks);

            if (MediaFlow._schunks.length < MediaFlow.auStreamNumSegments) return;

            if (MediaFlow._aurec.state !== "inactive") MediaFlow._aurec.stop();
        };

        // Send chunks
        MediaFlow._aurec.onstop = (e)=>{

            MediaFlow._sblob = new Blob(MediaFlow._schunks, MediaFlow._blobOptAudio);
            MediaFlow._frAS.readAsDataURL( MediaFlow._sblob ); 
            
            //console.log(MediaFlow._sblob.size+" B")
            //console.log(MediaFlow._schunks)

            if (MediaFlow._bStreaming) MediaFlow._aurec.start( MediaFlow.auStreamSegmentInterval );
        };
    })
    .catch((e)=>{
        console.log(e);
    });
};

MediaFlow.stopMediaStreaming = ()=>{
    if (!MediaFlow._aurec) return;
    if (!MediaFlow._bStreaming) return;

    if (MediaFlow._aurec.state !== "inactive") MediaFlow._aurec.stop();

    MediaFlow._bStreaming = false;
    MediaFlow._bAudioRecording = false;
};

MediaFlow.startOrStopMediaStreaming = ()=>{
    if (MediaFlow._bAudioRecording) MediaFlow.stopMediaStreaming();
    else MediaFlow.startMediaStreaming();
};


// Screen Recording & Streaming
//==========================================================
MediaFlow.startScreenRecording = ()=>{
    navigator.mediaDevices.getDisplayMedia( MediaFlow._cScreenRec )
    .then((stream)=>{
        MediaFlow._vrec = new MediaRecorder(stream);
        MediaFlow._scchunks = [];

        MediaFlow._vrec.ondataavailable = event => {
            if (event.data.size > 0) {
                MediaFlow._scchunks.push(event.data);
            }
        }

        MediaFlow._vrec.onstop = () => {
            MediaFlow._scblob = new Blob(MediaFlow._scchunks, MediaFlow._blobOptVideo);

            console.log(MediaFlow._scblob.size);

            MediaFlow._scchunks = [];
            //const blobUrl = URL.createObjectURL(MediaFlow._scblob);

            //console.log(blobUrl);
            ATON.Utils.downloadBlob( MediaFlow._scblob, "capture.mp4" );
        }

        MediaFlow._vrec.start(200);
    })
    .catch((e)=>{
        console.log(e);
    });
};

MediaFlow.startScreenStreaming = ()=>{
    navigator.mediaDevices.getDisplayMedia( MediaFlow._cScreenStream )
    .then((stream)=>{
        MediaFlow._vrec = new MediaRecorder( stream, MediaFlow._oStream );

        MediaFlow._vrec.start(MediaFlow.vidStreamSegmentInterval);

        MediaFlow._vrec.onstart = (e) => {
            MediaFlow._bVideoStream  = true;
            MediaFlow._bScreenStream = true;
            MediaFlow._scchunks = [];
        };

        MediaFlow._vrec.ondataavailable = event => {
            if (event.data.size < 1) return;
            MediaFlow._scchunks.push(event.data);

            if (MediaFlow._scchunks.length < MediaFlow.vidStreamNumSegments) return;

            if (MediaFlow._vrec.state !== "inactive") MediaFlow._vrec.stop();
        }

        MediaFlow._vrec.onstop = () => {

            MediaFlow._scblob = new Blob(MediaFlow._scchunks, MediaFlow._blobOptVideo);
            MediaFlow._frVS.readAsDataURL( MediaFlow._scblob ); 

            //console.log(MediaFlow._scblob.size);

            if (MediaFlow._bVideoStream) MediaFlow._vrec.start(MediaFlow.vidStreamSegmentInterval);

        }
    })
    .catch((e)=>{
        console.log(e);
    });
};

MediaFlow.stopScreenStreaming = ()=>{
    if (!MediaFlow._vrec) return;
    if (!MediaFlow._bVideoStream) return;

    MediaFlow._vrec.stop();
    MediaFlow._bVideoStream = false;

    MediaFlow._bScreenStream = false;
};

MediaFlow.startOrStopScreenStreaming = ()=>{
    if (MediaFlow._bVideoStream) MediaFlow.stopScreenStreaming();
    else MediaFlow.startScreenStreaming();
};

// Camera Streaming
//==========================================================
MediaFlow.startCameraStreaming = ()=>{
    if (MediaFlow._bVideoStream) return;
    //if (MediaFlow._bAudioRecording) return;

    navigator.mediaDevices.getUserMedia( MediaFlow._cCamStream )
    .then((stream)=>{
        MediaFlow._vrec = new MediaRecorder( stream, MediaFlow._oStream );

        MediaFlow._vrec.start( MediaFlow.vidStreamSegmentInterval );

        MediaFlow._vrec.onstart = (e) => {
            MediaFlow._bVideoStream = true;
            MediaFlow._bCamStream   = true;
            MediaFlow._scchunks = [];
        };

        MediaFlow._vrec.ondataavailable = event => {
            if (event.data.size < 1) return;
            MediaFlow._scchunks.push(event.data);

            if (MediaFlow._scchunks.length < MediaFlow.vidStreamNumSegments) return;

            if (MediaFlow._vrec.state !== "inactive") MediaFlow._vrec.stop();
        }

        MediaFlow._vrec.onstop = () => {

            MediaFlow._scblob = new Blob(MediaFlow._scchunks, MediaFlow._blobOptVideo);
            MediaFlow._frVS.readAsDataURL( MediaFlow._scblob ); 

            //console.log(MediaFlow._scblob.size);

            if (MediaFlow._bVideoStream) MediaFlow._vrec.start(MediaFlow.vidStreamSegmentInterval);

        }
    })
    .catch((e)=>{
        console.log(e);
    });
};

MediaFlow.stopCameraStreaming = ()=>{
    if (!MediaFlow._vrec) return;
    if (!MediaFlow._bVideoStream) return;

    MediaFlow._vrec.stop();
    MediaFlow._bVideoStream = false;
    MediaFlow._bCamStream   = false;
};

MediaFlow.startOrStopCameraStreaming = ()=>{
    if (MediaFlow._bVideoStream) MediaFlow.stopCameraStreaming();
    else MediaFlow.startCameraStreaming();
};

export default MediaFlow;