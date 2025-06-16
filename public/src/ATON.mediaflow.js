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
    MediaFlow._bAudioStreaming = false;
    MediaFlow._bScreenRec = false;

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
            framerate: 15
        }
        //audio: { channelCount: 1 }
    };

    MediaFlow._cCamStream = {
        video: {
            width: { max: 512 },
            height: { max: 512 }
        }
        //audio: { channelCount: 1 }
    };

    // Options
    MediaFlow._oStream = {
        audioBitsPerSecond : 9000,
        videoBitsPerSecond: 500000
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

    // I/O Devices
    MediaFlow.detectDevices();

    if (navigator.mediaDevices) navigator.mediaDevices.addEventListener('devicechange', event => {
        MediaFlow.detectDevices();
    });

    MediaFlow._vStreams = {};
};

// Utilities
//==========================================================
MediaFlow._setupFR = ()=>{
    MediaFlow._frAR = new window.FileReader();
    MediaFlow._frAR.onloadend = ()=>{
        let b64 = MediaFlow._frAR.result;
        //b64 = b64.split(',')[1];

        ATON.fire("AudioRecordCompleted", b64);
        MediaFlow._bAudioRecording = false;
    };

    MediaFlow._frAS = new window.FileReader();
    MediaFlow._frAS.onloadend = ()=>{
        if (!MediaFlow._bAudioStreaming) return;

        let b64 = MediaFlow._frAS.result;

         ATON.Photon.socket.emit("UTALK", {
             audio: b64,
             uid: ATON.Photon.uid,
             //vol: MediaFlow._auAVGvolume
         });

        b64 = null;
    };

    MediaFlow._frVS = new window.FileReader();
    MediaFlow._frVS.onloadend = ()=>{
        if (!MediaFlow._bVideoStream) return;

        let b64 = MediaFlow._frVS.result;

         ATON.Photon.socket.emit("UVIDEO", {
             video: b64,
             uid: ATON.Photon.uid
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

MediaFlow.detectDevices = ()=>{
    MediaFlow.audioInputDevices = [];
    MediaFlow.videoInputDevices = [];

    if (!navigator.mediaDevices) return;

    navigator.mediaDevices.enumerateDevices().then(devices => {
        //console.log(devices)
        
        for (let d in devices){
            let D = devices[d];

            //console.log(D)

            if (D.kind === "audioinput") MediaFlow.audioInputDevices.push(D);
            if (D.kind === "videoinput") MediaFlow.videoInputDevices.push(D);
        }

        //console.log(MediaFlow.videoInputDevices)
    });
};

MediaFlow.hasAudioInput = ()=>{
    return (MediaFlow.audioInputDevices.length > 0);
};
MediaFlow.hasVideoInput = ()=>{
    return (MediaFlow.videoInputDevices.length > 0);
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
MediaFlow.startAudioStreaming = ()=>{
    navigator.mediaDevices.getUserMedia( MediaFlow._cAuStream )
    .then((stream)=>{
        MediaFlow._aurec = new MediaRecorder( stream, MediaFlow._oStream );

        // Start streaming
        MediaFlow._aurec.start( MediaFlow.auStreamSegmentInterval );
        console.log("Start audio streaming");

        ATON.fire("MediaFlow_AudioStream", true);

        MediaFlow._aurec.onstart = (e) => {
            MediaFlow._bAudioStreaming = true;
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

            if (MediaFlow._bAudioStreaming) MediaFlow._aurec.start( MediaFlow.auStreamSegmentInterval );
        };
    })
    .catch((e)=>{
        console.log(e);
    });
};

MediaFlow.stopAudioStreaming = ()=>{
    if (!MediaFlow._aurec) return;
    if (!MediaFlow._bAudioStreaming) return;

    if (MediaFlow._aurec.state !== "inactive") MediaFlow._aurec.stop();
    console.log("Stop audio streaming");

    MediaFlow._bAudioStreaming = false;
    MediaFlow._bAudioRecording = false;

    ATON.fire("MediaFlow_AudioStream", false);
    ATON.Photon.socket.emit("UAUDIOSTOP", { uid: ATON.Photon.uid });
};

MediaFlow.startOrStopAudioStreaming = ()=>{
    if (MediaFlow._bAudioRecording) MediaFlow.stopAudioStreaming();
    else MediaFlow.startAudioStreaming();
};


// Screen Recording & Streaming
//==========================================================
MediaFlow.startScreenRecording = ()=>{
    if (MediaFlow._bScreenRec) return;
    if (MediaFlow._bScreenStream) return;

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

            //const blobUrl = URL.createObjectURL(MediaFlow._scblob);

            //console.log(blobUrl);
            ATON.Utils.downloadBlob( MediaFlow._scblob, "capture.mp4" );

            MediaFlow._scchunks = [];
            MediaFlow._bScreenRec = false;
        }

        MediaFlow._vrec.start(200);

        MediaFlow._bScreenRec = true;
        ATON.fire("MediaFlow_ScreenRec", true);
    })
    .catch((e)=>{
        console.log(e);
    });
};

MediaFlow.stopScreenRecording = ()=>{
    if (!MediaFlow._bScreenRec) return;

    MediaFlow._vrec.stop();
    MediaFlow._bVideoStream  = false;
    MediaFlow._bScreenStream = false;

    console.log("Stop screen recording");
    ATON.fire("MediaFlow_ScreenRec", false);
};

MediaFlow.startScreenStreaming = ()=>{
    navigator.mediaDevices.getDisplayMedia( MediaFlow._cScreenStream )
    .then((stream)=>{
        MediaFlow.realizeOrUpdateVStream(stream, MediaFlow.stopScreenStreaming);

        MediaFlow._vrec = new MediaRecorder( stream, MediaFlow._oStream );

        MediaFlow._vrec.start(MediaFlow.vidStreamSegmentInterval);
        console.log("Start screen streaming");
        ATON.fire("MediaFlow_ScreenStream", true);

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
    MediaFlow._bVideoStream  = false;
    MediaFlow._bScreenStream = false;

    console.log("Stop screen streaming");

    if (ATON.Photon.uid !== undefined){
        let vs = MediaFlow.getVideoStream(ATON.Photon.uid);
        vs.el.style.display = "none";
        vs.el.pause();

        ATON.Photon.socket.emit("UVIDEOSTOP", { uid: ATON.Photon.uid });
    }
    ATON.fire("MediaFlow_ScreenStream", false);
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
        MediaFlow.realizeOrUpdateVStream(stream, MediaFlow.stopCameraStreaming);

        MediaFlow._vrec = new MediaRecorder( stream, MediaFlow._oStream );

        MediaFlow._vrec.start( MediaFlow.vidStreamSegmentInterval );
        console.log("Start camera streaming");
        ATON.fire("MediaFlow_CamStream", true);

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

    console.log("Stop camera streaming");

    if (ATON.Photon.uid !== undefined){
        let vs = MediaFlow.getVideoStream(ATON.Photon.uid);
        vs.el.style.display = "none";
        vs.el.pause();

        ATON.Photon.socket.emit("UVIDEOSTOP", { uid: ATON.Photon.uid });
    }

    ATON.fire("MediaFlow_CamStream", false);
};

MediaFlow.startOrStopCameraStreaming = ()=>{
    if (MediaFlow._bVideoStream) MediaFlow.stopCameraStreaming();
    else MediaFlow.startCameraStreaming();
};


MediaFlow.realizeOrUpdateVStream = (stream, onClick)=>{
    // Local vstream
    let uid = ATON.Photon.uid;
    if (uid === undefined) return;

    let vs  = MediaFlow.getOrCreateVideoStream(uid, undefined, true);

    vs.el.playsinline = true;
    vs.el.style.display = "inline-block";

    vs.el.classList.add("atonVRCvidStream");
    vs.el.classList.add("atonVRCu"+(uid%6));

    if (onClick) vs.el.onclick = onClick;

    vs.el.srcObject = stream;

/*
    if (!ATON.Photon._elVStream){
        ATON.Photon._elVStream = document.createElement("video");
        ATON.Photon._elVStream.autoplay    = true;
        ATON.Photon._elVStream.playsinline = true;
        
        ATON.Photon._elVStream.classList.add("atonVRCvidStream");
        if (ATON.Photon.uid !== undefined) ATON.Photon._elVStream.classList.add("atonVRCu"+(ATON.Photon.uid%6));

        if (onClick) ATON.Photon._elVStream.onclick = onClick;
        
        document.body.appendChild( ATON.Photon._elVStream );
    }

    ATON.Photon._elVStream.style.display = "inline-block";
    ATON.Photon._elVStream.srcObject = stream;
*/
};


MediaFlow.stopAllStreams = ()=>{
    MediaFlow.stopAudioStreaming();
    MediaFlow.stopCameraStreaming();
    MediaFlow.stopScreenStreaming();
};

MediaFlow.getOrCreateVideoStream = (id, sourceurl, bUser)=>{
    if (!MediaFlow._vStreams[id]){
        MediaFlow._vStreams[id] = {};

        let elid = "vStream-"+id;
        if (bUser){
            elid = "uStream"+id;
            MediaFlow._vStreams[id].uid = id;
        }

        let htvid = "<video id='"+elid+"' autoplay crossorigin='anonymous' style='display:none' ></video>";
        $(htvid).appendTo('body');

        MediaFlow._vStreams[id].el = document.getElementById(elid);

        if (sourceurl){
            if (sourceurl.endsWith("m3u8")){
                if (Hls.isSupported()){
                    let hls = new Hls();
                    hls.loadSource(sourceurl);
                    hls.attachMedia( MediaFlow._vStreams[id].el );
                }
                else MediaFlow._vStreams[id].el.src = sourceurl; // Native support
            }

            else MediaFlow._vStreams[id].el.src = sourceurl;
        }

        if (!bUser) MediaFlow._vStreams[id].el.loop   = true;

        //if (sourceurl.endsWith("m3u8")) MediaFlow._vStreams[id].el.type = "application/x-mpegURL";

/*
        MediaFlow._vStreams[id].el.oncanplay = ()=>{
            MediaFlow._vStreams[id].el.play();
        };
*/
        MediaFlow._vStreams[id].texStream = new THREE.VideoTexture( MediaFlow._vStreams[id].el );
        MediaFlow._vStreams[id].texStream.colorSpace = ATON._stdEncoding;
        MediaFlow._vStreams[id].texStream.flipY = false;

        MediaFlow._vStreams[id].matStream = ATON.MatHub.materials.chromakey.clone();
        MediaFlow._vStreams[id].matStream.uniforms.tBase.value  = MediaFlow._vStreams[id].texStream;

/*
        MediaFlow._vStreams[id].matStream = new THREE.MeshBasicMaterial({
            map: MediaFlow._vStreams[id].texStream,
            transparent: true,
            opacity: 1.0,

            //fog: false,
            
            //depthTest: false,
            //depthWrite: false,
    
            ///depthFunc: THREE.AlwaysDepth,
            side: THREE.DoubleSide
        });
*/
    }
    else {
        if (sourceurl) MediaFlow._vStreams[id].el.src = sourceurl;
    }

    return MediaFlow._vStreams[id];
};

MediaFlow.getVideoStream = (id)=>{
    return MediaFlow._vStreams[id];
};

MediaFlow.downloadVideoSnapshot = (videoel, filename, scale)=>{
    if (!scale) scale = 1;

    let w = videoel.videoWidth * scale;
    let h = videoel.videoHeight * scale;

    let canvas = document.createElement('canvas');
    canvas.width  = w;
    canvas.height = h;
    
    let ctx = canvas.getContext('2d');
    ctx.drawImage(videoel, 0, 0, w, h);

    ATON.Utils.downloadImageFromCanvas(canvas, filename);
};

export default MediaFlow;