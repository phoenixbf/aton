/*
    ATON Media Recorder

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
ATON Media Recorder
@namespace MediaRec
*/
let MediaRec = {};
MediaRec.auType = "audio/wav";
MediaRec.auExt  = ".wav";
//MediaRec.auType = "audio/webm";
//MediaRec.auExt  = ".webm";

MediaRec.auBitsPerSecond  = 9000; //9000;
MediaRec.auStreamInterval = 1000; //500;
MediaRec.auMinVol = 1;


MediaRec.init = ()=>{
    MediaRec._bAudioRecording = false;
    MediaRec._bStreaming = false;

    MediaRec.recorder = undefined;
};

MediaRec.realizeAudioRecorder = ( onComplete )=>{
    if (MediaRec.recorder){
        if (onComplete) onComplete();
        return;
    }

    // First time
    if (!ATON.Utils.isConnectionSecure()) return;
    if (!navigator.mediaDevices) return;

    MediaRec._ds = setInterval( MediaRec._streamChunk, MediaRec.auStreamInterval);

    let UM = navigator.mediaDevices.getUserMedia({ 
        video: false, 
        audio: true, 
        channelCount: 1,
        echoCancellation: true,
    });

    UM.then(async function(stream){
        MediaRec.recorder = RecordRTC(stream, { 
            type: 'audio',
            mimeType: MediaRec.auType,
            
            bitsPerSecond: MediaRec.auBitsPerSecond,
            audioBitsPerSecond: MediaRec.auBitsPerSecond,

            sampleRate: 22050,
            desiredSampRate: 22050,
            
            disableLogs: true,
            
            //recorderType: MediaStreamRecorder,
            numberOfAudioChannels: 1,
            //bufferSize: 16384,

            //timeSlice: MediaRec.auStreamInterval,
            //ondataavailable: MediaRec._onAuBlob,
        });

        // Audio analyser
/*
        MediaRec._auAVGvolume = 0;

        MediaRec._auCTX = new AudioContext();
        const input = MediaRec._auCTX.createMediaStreamSource(stream);
        const analyser = MediaRec._auCTX.createAnalyser();
        const scriptProcessor = MediaRec._auCTX.createScriptProcessor();

        // Some analyser setup
        analyser.smoothingTimeConstant = 0.3;
        analyser.fftSize = 1024;
        
        input.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(MediaRec._auCTX.destination);

        const getAverageVolume = array => {
            const L = array.length;
            if (L <= 0) return 0; 
            
            let values = 0;
            for (let i=0; i<L; i++) values += array[i];

            return values / L;
        };

        scriptProcessor.onaudioprocess = audioProcessingEvent => {
            if (!MediaRec._bAudioRecording) return;

            const tempArray = new Uint8Array(analyser.frequencyBinCount);

            analyser.getByteFrequencyData(tempArray);
            MediaRec._auAVGvolume = parseInt(getAverageVolume(tempArray));
            
            //console.log(MediaRec._auAVGvolume);
        };
*/
        if (onComplete) onComplete();
    });
};

MediaRec.isAudioRecording = ()=>{
    return MediaRec._bAudioRecording;
};

// helper routines
MediaRec._stopRecAndSend = ( onFinish )=>{
    if (!MediaRec.recorder){
        if (onFinish) onFinish();
        return;
    }

    MediaRec.recorder.stopRecording(()=>{
/*
        let rblob = MediaRec.recorder.getBlob();

        if (!rblob || rblob.size < 5 || !ATON.VRoadcast.socket || ATON.VRoadcast.uid === undefined){ // || MediaRec._auAVGvolume <= MediaRec.auMinVol
            if (onFinish) onFinish();
            return;
        }

        let reader = new FileReader();
        reader.readAsDataURL(rblob); 
        reader.onloadend = ()=>{
            let b64 = reader.result;
            //let b64 = reader.result.split(',')[1];
            //b64 = "data:audio/wav;base64," + b64;
*/
        MediaRec.recorder.getDataURL((b64)=>{

            if (!ATON.VRoadcast.socket || ATON.VRoadcast.uid === undefined){ // || MediaRec._auAVGvolume <= MediaRec.auMinVol
                if (onFinish) onFinish();
                return;
            }

            ATON.VRoadcast.socket.compress(false).binary(true).emit("UTALK", {
                audio: b64,
                uid: ATON.VRoadcast.uid,
                //vol: MediaRec._auAVGvolume
            });              
            
            if (onFinish) onFinish();
        });
/*
        console.log("sending blob..."+rblob.size);

        ATON.VRoadcast.socket.compress(false).binary(true).emit("UTALK", {
            blob: rblob,
            uid: ATON.VRoadcast.uid,
            vol: MediaRec._auAVGvolume
        });

        if (onFinish) onFinish();
*/
    });
};

MediaRec._onAuBlob = (rblob)=>{
    if (!rblob) return;
    if (!ATON.VRoadcast.socket) return;
    //if (ATON.vroadcast._auAVGvolume <= ATON.vroadcast.minAuVol) return;

    //console.log("sending blob..."+rblob.size);

    ATON.VRoadcast.socket.emit("UTALK", {
        blob: rblob,
        uid: ATON.VRoadcast.uid,
        vol: MediaRec._auAVGvolume
    });
};

// Audio Recording
MediaRec.startRecording = ()=>{
    MediaRec.realizeAudioRecorder(()=>{

        if (!MediaRec.recorder) return;
        if (MediaRec._bAudioRecording) return;

        console.log("Recording...");

        MediaRec.recorder.startRecording();
        MediaRec._bAudioRecording = true;
    });
};

MediaRec.stopRecording = ()=>{
    if (!MediaRec.recorder) return;

    MediaRec.recorder.stopRecording(()=>{
        let rblob = MediaRec.recorder.getBlob();
        //let du = MediaRec.recorder.toURL();
        //console.log(du);

        console.log("Stop recording.");

        let reader = new FileReader();
        reader.readAsDataURL(rblob); 
        reader.onloadend = ()=>{
            let base64data = reader.result;                
            //console.log(base64data);
            ATON.fireEvent("AudioRecordCompleted", base64data);
        }

        MediaRec._bAudioRecording = false;
    });
};

MediaRec.startOrStopRecording = ()=>{
    if (MediaRec._bAudioRecording) MediaRec.stopRecording();
    else MediaRec.startRecording();
};

MediaRec._streamChunk = ()=>{
    if (!MediaRec.recorder) return;
    if (!MediaRec._bStreaming) return;

    MediaRec._stopRecAndSend(()=>{ 
        MediaRec.recorder.startRecording();
    });
};

// Audio Streaming
MediaRec.startMediaStreaming = ()=>{
    MediaRec.realizeAudioRecorder(()=>{
        if (!MediaRec.recorder) return;
        if (MediaRec._bAudioRecording) return;

        //MediaRec.recorder.stopRecording(()=>{
        console.log("Start MediaStreaming");

        MediaRec.recorder.startRecording();
        MediaRec._bAudioRecording = true;
        MediaRec._bStreaming = true;
        //});
    });
};

MediaRec.stopMediaStreaming = ()=>{
    if (!MediaRec.recorder) return;
    if (!MediaRec._bAudioRecording) return;

    console.log("Stop MediaStreaming");

    MediaRec._stopRecAndSend(()=>{
        MediaRec._bStreaming = false;
        MediaRec._bAudioRecording = false;
    });

/*
    MediaRec._stopRecAndSend(()=>{
        clearInterval(MediaRec._dMediaRecorder);
        MediaRec._bAudioRecording = false;
    });
*/
};

MediaRec.startOrStopMediaStreaming = ()=>{
    if (MediaRec._bAudioRecording) MediaRec.stopMediaStreaming();
    else MediaRec.startMediaStreaming();
};

export default MediaRec;