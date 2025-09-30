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


//Initializes the component
GS.realize = ()=>{
    if (GS._3DGSR) return; // Already realized

    GS._3DGSR = new SPARK.SparkRenderer({ renderer: ATON._renderer });
    ATON._rootVisible.add( GS._3DGSR );

    GS._3DGSR.maxStdDev = Math.sqrt(5);
    GS._3DGSR.clipXY = 1.0;
    
    GS._3DGSR.maxPixelRadius = GS.MAX_PXRAD; 

    //GS._3DGSR.focalAdjustment = 2.0;
    //GS._3DGSR.enable2DGS = true;
    //GS._3DGSR.falloff = 0.0;
    
    //GS._3DGSR.defaultView.stochastic = true;
/*
    GS._3DGSR.autoUpdate = false;
    let bFirst = true;

    const uPar  = { scene: ATON._rootVisible };
    const msInt = 60;

    window.setInterval(
        ()=>{
            if (bFirst){
                GS._3DGSR.update({ scene: ATON._rootVisible });
                bFirst = false;
                return;
            }

            if (ATON.Nav._dOri < 0.001) return;
            if (ATON.Nav._dPos < 0.0001) return;

            GS._3DGSR.update( uPar );
        }, 
        
        msInt
    );
*/
    const maxpd = 0.9;
    ATON.setAdaptiveDensityRange(0.1, maxpd);
    ATON.setDefaultPixelDensity(maxpd);

    GS.setupProfiler();

    ATON.XR.setDensity(0.5);
};

GS.isRealized = ()=>{
    if (GS._3DGSR) return true;
    else return false;
}

GS.setupProfiler = ()=>{
    ATON.on("RequestLowerRender", ()=>{
        if (GS._3DGSR.maxPixelRadius > 8) GS._3DGSR.maxPixelRadius *= 0.5;
        console.log("GS lower perf");
    });

    ATON.on("RequestHigherRender", ()=>{
        if (GS._3DGSR.maxPixelRadius < GS.MAX_PXRAD) GS._3DGSR.maxPixelRadius *= 2.0;
        console.log("GS higher perf");
    });
};

export default GS;