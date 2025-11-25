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

GS.MAX_PXRAD = 512;
GS.MIN_PXRAD = 1;
GS.MIN_ALPHA = 0.01;

GS.MAX_STDDEV = 2.8;


//Initializes the component
GS.realize = ()=>{
    if (GS._3DGSR) return; // Already realized

    GS._3DGSR = new SPARK.SparkRenderer({
        renderer: ATON._renderer, 
        //premultipliedAlpha: false
    });
    
    ATON._rootVisible.add( GS._3DGSR );

    GS._3DGSR.clipXY = 1.1;
    GS._3DGSR.focalAdjustment = 2.0;
    GS._3DGSR.preBlurAmount = 0.3;

    if (ATON.device.lowGPU || ATON.device.isMobile){
        GS.MIN_PXRAD  = 2.0;
        GS.MAX_STDDEV = 2.0;
        GS._3DGSR.clipXY = 1.0;
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

    const maxpd = 0.9;
    ATON.setAdaptiveDensityRange(0.1, maxpd);
    ATON.setDefaultPixelDensity(maxpd);

    GS.setupProfiler();

    ATON.XR.setDensity(0.5);

    ATON.on("XRmode",(b)=>{
        if (b){
            GS._3DGSR.maxStdDev = 2.0;
            //GS._3DGSR.clipXY    = 0.9;
        }
        else {
            GS._3DGSR.maxStdDev = GS.MAX_STDDEV;
            //GS._3DGSR.clipXY    = 1.1;
        }
    });

/*
    GS._3DGSR.autoUpdate = false;

    const uPar  = { scene: ATON._rootVisible };
    const msInt = 100;

    window.setInterval(
        ()=>{
            //if (!ATON.Nav._bInteracting) return;
            //if (!ATON.Nav.isTransitioning()) return;

            //if (ATON.Nav._dOri < 0.001) return;
            //if (ATON.Nav._dPos < 0.0001) return;
            if (ATON.Nav._dOri < 0.005 && ATON.Nav._dPos < 0.001) return;

            console.log("U")
            GS._3DGSR.update( uPar );
        }, 
        
        msInt
    );
*/
};

GS.isRealized = ()=>{
    if (GS._3DGSR) return true;
    else return false;
}

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

    //if (N.bPickable) N.enablePicking();
    ///ATON._bqScene = true;

};

GS.setupProfiler = ()=>{
    ATON.on("RequestLowerRender", ()=>{
        //if (GS._3DGSR.maxPixelRadius > 8) GS._3DGSR.maxPixelRadius *= 0.5;
        if (GS._3DGSR.minPixelRadius < 32) GS._3DGSR.minPixelRadius++;
        if (GS._3DGSR.minAlpha < 0.3) GS._3DGSR.minAlpha += 0.05;
        console.log("GS lower perf");
    });

    ATON.on("RequestHigherRender", ()=>{
        //if (GS._3DGSR.maxPixelRadius < GS.MAX_PXRAD) GS._3DGSR.maxPixelRadius *= 2.0;
        if (GS._3DGSR.minPixelRadius > GS.MIN_PXRAD) GS._3DGSR.minPixelRadius--;
        if (GS._3DGSR.minAlpha > GS.MIN_ALPHA) GS._3DGSR.minAlpha -= 0.05;
        console.log("GS higher perf");
    });
};

export default GS;