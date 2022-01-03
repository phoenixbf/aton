/*
    ATON post-process FX

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
ATON post-process FX.
This is the ATON component to enable advanced post-effects (bloom, depth-of-field, real-time ambient occlusion, ...)
@namespace FX
*/
let FX = {};

FX.PASS_BASE  = 0;
FX.PASS_AA    = 1;
FX.PASS_AO    = 2;
FX.PASS_SSR   = 3;
FX.PASS_BLOOM = 4;
FX.PASS_DOF   = 5;
FX.PASS_GAMMA = 6;


// Initialization (main renderer must be initialized already)
FX.init = ()=>{
    if (ATON._renderer === undefined) return;

    //let bFull = true;
    //if (ATON.device.lowGPU && ATON.device.isMobile) bFull = false;

    let pxr  = ATON._renderer.getPixelRatio();
    let size = ATON._renderer.getSize( new THREE.Vector2() );

    const renderTarget = new THREE.WebGLRenderTarget( size.width * pxr, size.height * pxr, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        encoding: ATON._stdEncoding
    });
    renderTarget.texture.name = 'EffectComposer.rt1';

    FX.composer = new THREE.EffectComposer( ATON._renderer, renderTarget );
    FX.passes   = [];

    ATON._renderer.autoClear = false;

    let CW = window.innerWidth * ATON._stdpxd;
    let CH = window.innerHeight * ATON._stdpxd;

    // Base pass
    FX.passes[FX.PASS_BASE] = new THREE.RenderPass( ATON._mainRoot, ATON.Nav._camera );
    FX.composer.addPass( FX.passes[FX.PASS_BASE] );
    //console.log(FX.passes[FX.PASS_BASE]);


    // SSR - TODO: check for variable rou implementation
/*
    FX.passes[ATON.FXPASS_SSR] = new THREE.SSRPass({
        renderer: ATON._renderer,
        scene: ATON._mainRoot, 
        camera: ATON.Nav._camera,
        //width: window.innerWidth * 0.1,
        //height: window.innerHeight * 0.1,
        //encoding: THREE.sRGBEncoding
    });

    FX.passes[ATON.FXPASS_SSR].thickness = 0.018;
    FX.passes[ATON.FXPASS_SSR].infiniteThick = false; //true;
    FX.passes[ATON.FXPASS_SSR].maxDistance = 1.0; //0.1;
    console.log(FX.passes[ATON.FXPASS_SSR]);

    FX.composer.addPass( FX.passes[ATON.FXPASS_SSR] );
*/


    // Ambient Occlusion
    FX.passes[FX.PASS_AO] = new THREE.SAOPass( ATON._mainRoot, ATON.Nav._camera, false, true );
    FX.passes[FX.PASS_AO].params.saoBias  = 1.0;
    FX.passes[FX.PASS_AO].params.saoScale = 100;
    FX.passes[FX.PASS_AO].params.saoIntensity = 0.2; //0.2 //0.005;
    //FX.passes[FX.PASS_AO].params.saoBlurRadius = 5;
    
    //FX.passes[FX.PASS_AO].params.saoKernelRadius = 200;
    
    //FX.passes[FX.PASS_AO].params.saoBlurStdDev = 10.0;
    //FX.passes[FX.PASS_AO].params.saoBlurDepthCutoff = 10.0; //0.2;
    //FX.passes[FX.PASS_AO].params.saoMinResolution = 0.01;

    //console.log(FX.passes[FX.PASS_AO]);

    // Sobel
/*
    const effectSobel = new THREE.ShaderPass( THREE.SobelOperatorShader );
    effectSobel.uniforms[ 'resolution' ].value.x = window.innerWidth * ATON._stdpxd;
    effectSobel.uniforms[ 'resolution' ].value.y = window.innerHeight * ATON._stdpxd;
*/

    // Bloom
    FX.passes[FX.PASS_BLOOM] = new THREE.UnrealBloomPass( new THREE.Vector2( CW,CH ), 1.5, 0.4, 0.85 );
    FX.passes[FX.PASS_BLOOM].threshold = 0.9
    FX.passes[FX.PASS_BLOOM].strength  = 1.0; //0.5;
    FX.passes[FX.PASS_BLOOM].radius    = 0.0;
    //console.log(FX.passes[FX.PASS_BLOOM])


    // DOF
    let fa = 7.0;
    FX.passes[FX.PASS_DOF] = new THREE.BokehPass( ATON._mainRoot, ATON.Nav._camera, {
        focus: 5.0,
        aperture: 0.001, //1.0/(fa*100.0),
        maxblur: 0.01,

        width: CW, //window.innerWidth,
        height: CH //window.innerHeight
    });
    //console.log(FX.passes[FX.PASS_DOF]);

    // Gamma correction - CHECK
    //FX.passes[FX.PASS_GAMMA] = new THREE.ShaderPass( THREE.GammaCorrectionShader );

    // Antialiasing
    FX.passes[FX.PASS_AA] = new THREE.ShaderPass( THREE.FXAAShader );
    //FX.passes[FX.PASS_AA].renderToScreen = false;
    let UU = FX.passes[FX.PASS_AA].material.uniforms;
    UU.resolution.value.set( (1/CW), (1/CH) );
/*
    FX.passes[FX.PASS_AA] = new THREE.SSAARenderPass( ATON._mainRoot, ATON.Nav._camera, 0x000000, 0);
    FX.passes[FX.PASS_AA].sampleLevel = 4;
    FX.passes[FX.PASS_AA].unbiased = true;
    FX.passes[FX.PASS_AA].setSize(CW,CH);
*/
/*
    FX.passes[FX.PASS_AA] = new THREE.TAARenderPass( ATON._mainRoot, ATON.Nav._camera );
	FX.passes[FX.PASS_AA].unbiased   = true;
    FX.passes[FX.PASS_AA].accumulate = false;
*/
    //FX.passes[FX.PASS_AA] = new THREE.SMAAPass( CW,CH );


    // Order
    FX.composer.addPass( FX.passes[FX.PASS_AO] );
    FX.composer.addPass( FX.passes[FX.PASS_BLOOM] );

    // tone-mapping passes here (if any)
    
    //FX.composer.addPass( FX.passes[FX.PASS_GAMMA] ); // - CHECK
    FX.composer.addPass( FX.passes[FX.PASS_AA] );
    
    ///FX.composer.addPass( effectSobel );
    
    FX.composer.addPass( FX.passes[FX.PASS_DOF] );

    //FX.composer.addPass( FX.passes[FX.PASS_AA] );

    // Defaults
    FX.togglePass(FX.PASS_AO, false);
    FX.togglePass(FX.PASS_BLOOM, false);
    FX.togglePass(FX.PASS_DOF, false);

    //for (let p in FX.passes) FX.passes[p].renderToScreen = true;
    console.log(FX.composer);
};

/**
Toggle FX pass
@param {number} pass - pass ID (e.g. ATON.FX.PASS_AO)
@param {boolean} b
@example
ATON.FX.togglePass(ATON.FX.PASS_AO, false)
*/
FX.togglePass = (pass, b)=>{
    if (FX.composer === undefined) return;
    if (ATON.device.lowGPU) return; // no fx passes on low GPU for now

    let P = FX.passes[pass];
    if (P === undefined) return;

    if (b === undefined) FX.passes[pass].enabled = !FX.passes[pass].enabled;
    else FX.passes[pass].enabled = b;
};

/**
Check if FX pass is enabled
@param {number} pass - pass ID (e.g. ATON.FX.PASS_AO)
*/
FX.isPassEnabled = (pass)=>{
    if (FX.composer === undefined) return false;

    let P = FX.passes[pass];
    if (P === undefined) return false;

    return FX.passes[pass].enabled;    
};


// FX Passes params
//======================================================

/**
Set Ambient Occlusion intensity
@param {number} f
*/
FX.setAOintensity = (f)=>{
    if (FX.composer === undefined) return;
    if (FX.passes[FX.PASS_AO] === undefined) return;

    FX.passes[FX.PASS_AO].params.saoIntensity = f;
};
FX.getAOintensity = ()=>{
    if (FX.composer === undefined) return 0.0;
    if (FX.passes[FX.PASS_AO] === undefined) return 0.0;
    return FX.passes[FX.PASS_AO].params.saoIntensity;
};

/**
Set Bloom strength
@param {number} f
*/
FX.setBloomStrength = (f)=>{
    if (FX.composer === undefined) return;
    if (FX.passes[FX.PASS_BLOOM] === undefined) return;

    FX.passes[FX.PASS_BLOOM].strength = f;
};
FX.getBloomStrength = ()=>{
    if (FX.composer === undefined) return 0.0;
    if (FX.passes[FX.PASS_BLOOM] === undefined) return 0.0;
    return FX.passes[FX.PASS_BLOOM].strength;
};

/**
Set Bloom threshold
@param {number} f
*/
FX.setBloomThreshold = (f)=>{
    if (FX.composer === undefined) return;
    if (FX.passes[FX.PASS_BLOOM] === undefined) return;

    FX.passes[FX.PASS_BLOOM].threshold = f;
};
FX.getBloomThreshold = ()=>{
    if (FX.composer === undefined) return 0.0;
    if (FX.passes[FX.PASS_BLOOM] === undefined) return 0.0;
    return FX.passes[FX.PASS_BLOOM].threshold;
};

/**
Set Depth-of-Field focus
@param {number} f
*/
FX.setDOFfocus = (f)=>{
    if (FX.composer === undefined) return;
    if (FX.passes[FX.PASS_DOF] === undefined) return;

    let UU = FX.passes[FX.PASS_DOF].uniforms;
    if (UU === undefined) return;

    UU['focus'].value = f;
};
FX.getDOFfocus = ()=>{
    if (FX.composer === undefined) return 0.0;
    if (FX.passes[FX.PASS_DOF] === undefined) return 0.0;

    let UU = FX.passes[FX.PASS_DOF].uniforms;
    if (UU === undefined) return 0.0;

    return UU['focus'].value;
};

/**
Set Depth-of-Field aperture
@param {number} f
*/
FX.setDOFaperture = (f)=>{
    if (FX.composer === undefined) return;
    if (FX.passes[FX.PASS_DOF] === undefined) return;

    let UU = FX.passes[FX.PASS_DOF].uniforms;
    if (UU === undefined) return;

    UU['aperture'].value = f;
};

export default FX;