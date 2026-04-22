/*
    ATON Gaussian Splatting

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
ATON Event Hub
@namespace GS
*/
let GS = {};

GS._3DGSR = undefined;

GS.MAX_PD = 1.0;

GS.MAX_PXRAD = 512;
GS.MIN_PXRAD = 1;
GS.MIN_ALPHA = 0.01;

GS.MAX_STDDEV = 2.8;
GS.LOD_SPLATSCALE = 0.5;

GS.MIN_INT_UPDATE = 30;


//Initializes the component
GS.realize = ()=>{
    if (GS._3DGSR) return; // Already realized

    GS._3DGSR = new SPARK.SparkRenderer({
        renderer: ATON._renderer,
        pagedExtSplats: true,
    
        accumExtSplats: true,
        
        //target: { width, height, doubleBuffer: true },
        //originDistance: 1.0
        //premultipliedAlpha: false
    });

    //GS._3DGSR.lodSplatCount = 500000; // already computed per-device
    GS._3DGSR.lodSplatScale = GS.LOD_SPLATSCALE;
    
    GS._3DGSR.numLodFetchers = 3;

    GS._3DGSR.enableLod = true;

    GS._3DGSR.minSortIntervalMs = GS.MIN_INT_UPDATE;
 
    ATON._rootVisible.add( GS._3DGSR );
    //ATON.Nav._camera.add( GS._3DGSR );

/*
    ATON._bqSceneCont        = false;
    ATON._bQuerySemOcclusion = false;
*/

    GS._3DGSR.clipXY = 1.1;
    GS._3DGSR.focalAdjustment = 2.0;
    //GS._3DGSR.preBlurAmount = 0.3;

    if (ATON.device.lowGPU || ATON.device.isMobile){
        GS.MIN_PXRAD  = 2.0;
        GS.MAX_STDDEV = 2.0;
        GS._3DGSR.clipXY = 1.0;

        GS.MIN_INT_UPDATE = 200;
        GS._3DGSR.minSortIntervalMs = GS.MIN_INT_UPDATE;

        GS._3DGSR.numLodFetchers = 1;

        GS.MAX_PD = 0.8;
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

    GS.updInt = GS.MIN_INT_UPDATE;

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
            //GS._3DGSR.clipXY    = 0.9;

            GS._3DGSR.lodSplatScale = GS.LOD_SPLATSCALE*0.6;
        }
        else {
            GS._3DGSR.maxStdDev = GS.MAX_STDDEV;
            //GS._3DGSR.clipXY    = 1.1;
            GS._3DGSR.lodSplatScale = GS.LOD_SPLATSCALE;
        }
    });

    ATON.on("NavInteraction", b =>{
        if (!ATON.device.isMobile) return;

        if (b) GS._3DGSR.autoUpdate = false;
        else GS._3DGSR.autoUpdate = true;

        //if (b) GS._3DGSR.minSortIntervalMs = 1000;
        //else GS._3DGSR.minSortIntervalMs = GS.MIN_INT_UPDATE;
    });

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

    let splats = new SPARK.SplatMesh({
        url: url,
        paged: url.endsWith(".rad")? true : undefined,
        extSplats: true,
        
        raycastable: false,
        editable: false,

/*
        lod: true,
        lodAbove: 1000000,
*/

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
    N.disablePicking();
/*
    if (N.bPickable) N.enablePicking();
    ATON._bqScene = true;
*/
};

GS.setupProfiler = ()=>{
    ATON.on("RequestLowerRender", ()=>{

        if (GS._3DGSR.minPixelRadius < 4) GS._3DGSR.minPixelRadius++;
        if (GS._3DGSR.minAlpha < 0.05) GS._3DGSR.minAlpha += 0.01;

        //if (GS.updInt < 1000) GS.updInt += 200;
        if (GS._3DGSR.minSortIntervalMs < 1000) GS._3DGSR.minSortIntervalMs += 200;
        //console.log(GS._3DGSR.minSortIntervalMs)

        //console.log("GS lower perf");
    });

    ATON.on("RequestHigherRender", ()=>{

        if (GS._3DGSR.minPixelRadius > GS.MIN_PXRAD) GS._3DGSR.minPixelRadius--;
        if (GS._3DGSR.minAlpha > GS.MIN_ALPHA) GS._3DGSR.minAlpha -= 0.01;

        //GS.updInt -= 200;
        //GS.updInt = Math.max(GS.updInt, GS.MIN_INT_UPDATE);

        if (GS._3DGSR.minSortIntervalMs > GS.MIN_INT_UPDATE) GS._3DGSR.minSortIntervalMs -= 200;
        //console.log(GS._3DGSR.minSortIntervalMs)

        //console.log("GS higher perf");
    });
};


GS.update = ()=>{
/*
    if (!GS._bData) return;

    if (ATON.XR._bPresenting){
        if (ATON.Nav.motionDetected()){
            GS._3DGSR.autoUpdate = false;
            GS._3DGSR.enableLod = false;
        }
        else {
            GS._3DGSR.autoUpdate = true;
            GS._3DGSR.enableLod = true;
        }

        return;
    }


    if (!ATON.Nav.motionDetected()){
        //GS._3DGSR.autoUpdate = false;
        GS._3DGSR.enableLod = false;
        return;
    }

    GS._3DGSR.enableLod = true;
    //GS._3DGSR.autoUpdate = true;
*/
};


export default GS;