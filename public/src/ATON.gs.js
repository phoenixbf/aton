/*
    ATON Gaussian Splatting

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
ATON Gaussian Splat component
@namespace GS
*/
let GS = {};

GS._3DGSR = undefined;

GS.MAX_PD = 1.0;

GS.MAX_PXRAD = 300; //512;
GS.MIN_PXRAD = 1;
GS.MIN_ALPHA = 0.01;

GS.MAX_STDDEV = 2.8;
GS.LOD_SPLATSCALE = 0.8; //0.5;

GS.LOD_MAX_COUNT = 5000000;

GS.LOD_MAX_COUNT_MOB = 300000;
GS.LOD_MAX_COUNT_XR  = 200000;

GS.MIN_SORT_INT = 30;

GS.CLIP     = 1.1;
GS.CLIP_XR  = 0.7;

GS.FOV_ANG   = 110;  // 120
GS.FOV_SCALE = 0.3; // 0.4

GS.AUTOLOD_ABOVE = GS.LOD_MAX_COUNT;



GS.profile = ()=>{

    if (ATON.device.lowGPU || ATON.device.isMobile){
        GS.LOD_MAX_COUNT = GS.LOD_MAX_COUNT_MOB;
        GS.AUTOLOD_ABOVE = 1500000;

        GS.MIN_PXRAD  = 2;
        GS.MAX_STDDEV = 2.0;

        GS.MIN_SORT_INT = 400;
        GS.CLIP = 1.0;

        GS.MAX_PD = 0.9; //0.8;

        GS.MIN_ALPHA = 0.05;
    }
};

//Initializes the component
GS.realize = ()=>{
    if (GS._3DGSR) return; // Already realized

    //GS.profile();

    // Auto-generate LODs above certain threshold
    GS._bAutoLOD = true;

    // Use direct raycast on gs
    GS._bRaycast = false;

    GS._3DGSR = new SPARK.SparkRenderer({
        renderer: ATON._renderer,

        //pagedExtSplats: true, // poor perf.
        //accumExtSplats: true, // poor perf.
        pagedExtSplats: false,
        accumExtSplats: false,

        //enable2DGS: true,
        
        //target: { width, height, doubleBuffer: true },
        //originDistance: 1.0
        //premultipliedAlpha: false
    });

    if (!GS._bRaycast) GS._3DGSR.raycast = ATON.Utils.VOID_CAST;
    else {
        ATON._bqSceneCont        = false;
        ATON._bQuerySemOcclusion = false;
    }

    GS._3DGSR.coneFov       = GS.FOV_ANG;
    GS._3DGSR.coneFov0      = GS._3DGSR.coneFov * 0.8;
    GS._3DGSR.coneFoveate   = GS.FOV_SCALE;
    //GS._3DGSR.behindFoveate = 0.1;

    //GS._3DGSR.sortRadial = false;
    //GS._3DGSR.depthTest = false;
    //GS._3DGSR.transparent = false;

    GS._3DGSR.lodSplatCount = GS.LOD_MAX_COUNT;
    //GS._3DGSR.lodSplatScale = GS.LOD_SPLATSCALE;
    
    GS._3DGSR.numLodFetchers = 3;

    GS._3DGSR.enableLod = true;

    GS._bMotion = false;

    GS._3DGSR.minSortIntervalMs = GS.MIN_SORT_INT;
 
    ATON._rootVisible.add( GS._3DGSR );
    //ATON.Nav._camera.add( GS._3DGSR );

    GS._3DGSR.clipXY = GS.CLIP;
    GS._3DGSR.focalAdjustment = 2.0;
    //GS._3DGSR.preBlurAmount = 0.3;

    if (ATON.device.lowGPU || ATON.device.isMobile){
        GS.LOD_MAX_COUNT = GS.LOD_MAX_COUNT_MOB;
        GS.AUTOLOD_ABOVE = 1500000;
        GS.CLIP = 1.0;

        GS.MIN_PXRAD  = 2;
        GS.MAX_STDDEV = 2.0;
        GS._3DGSR.clipXY = GS.CLIP;

        GS.MIN_SORT_INT = 400;
        GS._3DGSR.minSortIntervalMs = GS.MIN_SORT_INT;

        GS._3DGSR.lodSplatCount = GS.LOD_MAX_COUNT;
/*
        GS.LOD_SPLATSCALE *= 0.5; //0.4;
        GS._3DGSR.lodSplatScale = GS.LOD_SPLATSCALE;
*/
        GS._3DGSR.numLodFetchers = 1;

        GS._3DGSR.coneFov     = GS.FOV_ANG * 0.7;
        GS._3DGSR.coneFov0    = GS._3DGSR.coneFov * 0.7;
        GS._3DGSR.coneFoveate = GS.FOV_SCALE * 0.7;

        GS.MAX_PD = 0.9; //0.8;

        GS.MIN_ALPHA = 0.05;
    }
    
    GS._3DGSR.minAlpha = GS.MIN_ALPHA;
    //GS._3DGSR.blurAmount = 0.3;

    GS._3DGSR.maxStdDev = GS.MAX_STDDEV;
    
    GS._3DGSR.maxPixelRadius = GS.MAX_PXRAD;
    GS._3DGSR.minPixelRadius = GS.MIN_PXRAD;

    //GS._3DGSR.focalAdjustment = 2.0;
    //GS._3DGSR.enable2DGS = true;
    //GS._3DGSR.falloff = 0.0;
    
    //GS._3DGSR.defaultView.stochastic = true;

    GS.updInt = GS.MIN_SORT_INT;

    ATON.setAdaptiveDensityRange( 0.5, GS.MAX_PD );
    ATON.setDefaultPixelDensity( GS.MAX_PD );

    GS.setupProfiler();

    ATON.XR.setDensity(0.5);

    GS._3DGSR.autoUpdate = true;

/*
    GS._3DGSR.autoUpdate = false;

    GS._3DGSR.uPar = {
        scene: ATON._rootVisible,
        camera: ATON.Nav._camera
        //viewToWorld: ATON.Nav._camera.matrixWorld
    };

    const upd = ()=>{
        window.setTimeout( upd, GS.updInt );

        //if (!ATON.Nav._bInteracting) return;
        //if (!ATON.Nav.isTransitioning()) return;

        if (!ATON.Nav.motionDetected()){
            return;
        }

        //console.log("S")

        //GS._3DGSR.defaultView

        GS._3DGSR.update( GS._3DGSR.uPar );
        //console.log("GS upd")
    };

    //window.setInterval( upd, GS.updInt );
    window.setTimeout( upd, GS.updInt );
*/

    // Events
    ATON.on("XRmode",(b)=>{
        if (b){
            GS._3DGSR.maxStdDev = 2.0;
            GS._3DGSR.numLodFetchers = 1;
            GS._3DGSR.clipXY    = GS.CLIP_XR;

            GS._3DGSR.coneFov     = GS.FOV_ANG * 0.8;
            GS._3DGSR.coneFov0    = GS._3DGSR.coneFov * 0.7;
            GS._3DGSR.coneFoveate = GS.FOV_SCALE * 0.8;

            //GS._3DGSR.lodSplatScale = GS.LOD_SPLATSCALE*0.5;
            GS._3DGSR.lodSplatCount = GS.LOD_MAX_COUNT_XR;

            GS._3DGSR.autoUpdate = false;
        }
        else {
            GS._3DGSR.maxStdDev = GS.MAX_STDDEV;
            GS._3DGSR.clipXY    = GS.CLIP;

            GS._3DGSR.coneFov     = GS.FOV_ANG;
            GS._3DGSR.coneFov0    = GS._3DGSR.coneFov * 0.7;
            GS._3DGSR.coneFoveate = GS.FOV_SCALE;

            //GS._3DGSR.lodSplatScale = GS.LOD_SPLATSCALE;
            GS._3DGSR.lodSplatCount = GS.LOD_MAX_COUNT;
        }
    });
/*
    ATON.on("NavInteraction", b =>{
        if (!ATON.device.isMobile) return;

        if (b) GS._3DGSR.autoUpdate = false;
        else GS._3DGSR.autoUpdate = true;

        //if (b) GS._3DGSR.minSortIntervalMs = 1000;
        //else GS._3DGSR.minSortIntervalMs = GS.MIN_SORT_INT;
    });
*/
/*
    ATON.on("AllNodeRequestsCompleted",(bFirst)=>{
        GS._3DGSR.update( GS._3DGSR.uPar );
    });
    ATON.on("NodeChange", d =>{
        //console.log(d)
        GS._3DGSR.update( GS._3DGSR.uPar );
    });
*/

    ATON.addUpdateRoutine( GS.update );
};

GS.update = ()=>{
    if (!GS._3DGSR.uPar) return;

    GS._3DGSR.update( GS._3DGSR.uPar );
};

GS.isRealized = ()=>{
    if (GS._3DGSR) return true;
    else return false;
}

GS.load = (url, N, onComplete)=>{
    // If not there, realize dedicated 3DGS renderer
    ATON.GS.realize();

    ATON._assetReqNew(url);
    N.noLP = true;

    let bRAD = url.endsWith(".rad");

    let splats = new SPARK.SplatMesh({
        url: url,
        paged: bRAD? true : undefined,
        
        //extSplats: true,
        
        raycastable: GS._bRaycast,
        //minRaycastOpacity: 0.2,
        
        //editable: false,

        lod: bRAD? false : GS._bAutoLOD,
        lodAbove: GS.AUTOLOD_ABOVE,

/*
        enableViewToObject: true,
        enableViewToWorld: true,
        enableWorldToView: true,
*/
        //maxSh: 3,

        onLoad: (data)=>{
            data.quaternion.set(1, 0, 0, 0);
            //data.rotation.set(Math.PI,0,0);

            N.add( data );

            if (!GS._bRaycast) data.traverse(o => { o.raycast = ATON.Utils.VOID_CAST; });

            //data.opacity = 0.1;          

            ATON._assetReqComplete(url);
            ATON.GS.visitor(N);

            GS._bData = true;

            if (onComplete) onComplete();

/* OLD
            splats.createLodSplats({ quality: false, rgbaArray: splats.splatRgba }).then(()=>{
                splats.enableLod = true;
                ATON._assetReqComplete(url);

                ATON.GS.visitor(N);

                if (onComplete) onComplete();
            });
*/

        }
    });
};

GS.visitor = (N)=>{
    if (!N) return;

    N.traverse((o)=>{
        if (o.material){
            o.material.clippingPlanes   = ATON._clipPlanes;
            o.material.clipIntersection = false;
        }
    });

    // Picking
    if (!GS._bRaycast) N.disablePicking();
    else {
        if (N.bPickable) N.enablePicking();
        ATON._bqScene = true;
    }
};

GS.setupProfiler = ()=>{
    ATON.on("RequestLowerRender", ()=>{
        if (ATON.XR._bPresenting) return;

        //if (GS._3DGSR.minPixelRadius < 3) GS._3DGSR.minPixelRadius++;
        //if (GS._3DGSR.minAlpha < 0.1) GS._3DGSR.minAlpha += 0.01;

        ///if (GS.updInt < 1000) GS.updInt += 200;
        if (GS._3DGSR.minSortIntervalMs < 1000) GS._3DGSR.minSortIntervalMs += 200;
        //console.log(GS._3DGSR.minSortIntervalMs)

        //console.log("GS lower perf");
    });

    ATON.on("RequestHigherRender", ()=>{
        if (ATON.XR._bPresenting) return;

        //if (GS._3DGSR.minPixelRadius > GS.MIN_PXRAD) GS._3DGSR.minPixelRadius--;
        //if (GS._3DGSR.minAlpha > GS.MIN_ALPHA) GS._3DGSR.minAlpha -= 0.01;

        //GS.updInt -= 200;
        //GS.updInt = Math.max(GS.updInt, GS.MIN_SORT_INT);

        if (GS._3DGSR.minSortIntervalMs > GS.MIN_SORT_INT) GS._3DGSR.minSortIntervalMs -= 200;
        //console.log(GS._3DGSR.minSortIntervalMs)

        //console.log("GS higher perf");
    });
};

GS.detectTilesetExtension = (data)=>{
    if (!data.extensions) return false;
    if (!data.extensions["3DTILES_content_gltf"]) return false;

    if (!data.extensions["3DTILES_content_gltf"].extensionsRequired) return false; 
    if (!data.extensions["3DTILES_content_gltf"].extensionsRequired.includes("KHR_gaussian_splatting")) return false;

    return true;
};


GS.update = ()=>{
    if (!GS._bData) return;

    // XR session
    if (ATON.XR._bPresenting){
        if (ATON.Nav.motionDetected()){
            GS._3DGSR.autoUpdate = false;
            //GS._3DGSR.enableLod = false;
        }
        else {
            GS._3DGSR.autoUpdate = true;
            //GS._3DGSR.enableLod = true;
        }

        GS._bMotion = ATON.Nav.motionDetected();
        return;
    }


    // Mobile / low-prof
    if (ATON.device.isMobile || ATON.device.lowGPU){
        //if (ATON.Nav.motionDetected()) GS._3DGSR.lodSplatScale = GS.LOD_SPLATSCALE * 0.5;
        //else GS._3DGSR.lodSplatScale = GS.LOD_SPLATSCALE;

        if (ATON.Nav.motionDetected() /*|| ATON.Nav._bInteracting*/){
            //GS._3DGSR.autoUpdate = false;

            //GS._3DGSR.enableDriveLod = false;
            //GS._3DGSR.lodSplatScale = GS.LOD_SPLATSCALE * 0.5;
        }
        else {
            //GS._3DGSR.autoUpdate = true;

            //GS._3DGSR.enableDriveLod = true;
            //GS._3DGSR.lodSplatScale = GS.LOD_SPLATSCALE;
        }

        GS._bMotion = ATON.Nav.motionDetected();
        return;
    }

    // Desktop
/*
    if (ATON.Nav.motionDetected()){
        GS._3DGSR.enableDriveLod = false;
    }
    else {
        GS._3DGSR.enableDriveLod = true;
    }
*/
};


export default GS;