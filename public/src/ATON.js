/*!
    @preserve

 	ATON

 	@author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/

'use strict';

/**
@namespace ATON
*/
let ATON = {};
window.ATON = ATON;

// Import
import Node from "./ATON.node.js";
import POV from "./ATON.pov.js";
//import Period from "./ATON.period.js";
import LightProbe from "./ATON.lightprobe.js";

import EventHub from "./ATON.eventhub.js";
import MatHub from "./ATON.mathub.js";
import Utils from "./ATON.utils.js";
import SceneHub from "./ATON.scenehub.js";
import AudioHub from "./ATON.audiohub.js";
import Nav from "./ATON.nav.js";
import XR from "./ATON.xr.js";
import SUI from "./ATON.sui.js";
import VRoadcast from "./ATON.vroadcast.js";
import SemFactory from "./ATON.semfactory.js";
import FE from "./ATON.fe.js";
import MediaRec from "./ATON.mediarec.js";

// Classes
ATON.Node       = Node;
ATON.POV        = POV;
ATON.LightProbe = LightProbe;
//ATON.Period = Period;

// NS
ATON.EventHub   = EventHub;
ATON.Utils      = Utils;
ATON.SceneHub   = SceneHub;
ATON.MatHub     = MatHub;
ATON.Nav        = Nav;
ATON.AudioHub   = AudioHub;
ATON.XR         = XR;
ATON.SUI        = SUI;
ATON.VRoadcast  = VRoadcast;
ATON.SemFactory = SemFactory;
ATON.FE         = FE;
ATON.MediaRec   = MediaRec;

//==============================================================
// Consts
//==============================================================
ATON.STD_UPVECTOR = new THREE.Vector3(0,1,0);
ATON.ROOT_NID = "."; // reserved node ID for graph-roots

ATON.RAD2DEG = (180.0 / Math.PI);
ATON.DEG2RAD = (Math.PI / 180.0);

// Node types
ATON.NTYPES = {};
// 1 and 2 are reserved
ATON.NTYPES.SCENE  = 3;
ATON.NTYPES.SEM    = 4;
ATON.NTYPES.UI     = 5;

// Folders
ATON.PATH_RESTAPI       = window.location.origin + "/api/"; // "../api/";
ATON.PATH_RESTAPI_SCENE = ATON.PATH_RESTAPI + "scene/";
ATON.PATH_MODS          = window.location.origin + "/mods/"; // "../mods/";
ATON.PATH_THREE         = ATON.PATH_MODS + "three/";
ATON.PATH_DRACO_LIB     = ATON.PATH_THREE+"examples/js/libs/draco/";
ATON.PATH_BASIS_LIB     = ATON.PATH_THREE+"examples/js/libs/basis/";

ATON.PATH_COLLECTION = window.location.origin + "/collection/"; // "../collection/";
//ATON.PATH_MODELS     = ATON.PATH_COLLECTION + "models/";
ATON.PATH_SCENES     = window.location.origin + "/scenes/"; // "../scenes/";
ATON.PATH_RES        = window.location.origin + "/res/"; // "../res/";

ATON.SHADOWS_NEAR = 0.1;
ATON.SHADOWS_FAR  = 50.0;
ATON.SHADOWS_SIZE = 15.0;
ATON.SHADOWS_RES  = 1024; // 512

ATON.AMB_L = 0.1; // Ambient when using direct lighting

/**
Set path collection (3D models, audio, panoramas, ...)
@param {string} path - path
*/
ATON.setPathCollection = (path)=>{
    ATON.PATH_COLLECTION = /*window.location.origin + */path;
    //ATON.PATH_MODELS     = ATON.PATH_COLLECTION+"models/";
};

/**
Set path scenes
@param {string} path - path
*/
ATON.setPathScenes = (path)=>{
    ATON.PATH_SCENES = /*window.location.origin +*/ path;
};


ATON._setupBaseListeners = ()=>{
    let el = ATON._renderer.domElement;

    window.addEventListener( 'resize', ATON._onResize, false );
    window.onorientationchange = ATON._readDeviceOrientationMode;

    el.addEventListener( 'mousemove', ATON._updateScreenMove, false );
    ///el.addEventListener('dblclick', ATON._doubleTap, false);

    el.addEventListener('mousedown', (e)=>{
        if (e.button === 1) ATON.fireEvent("MouseMidButton");      // middle-click
        if (e.button === 2) ATON.fireEvent("MouseRightButton");    // right-click
    });

    el.addEventListener( 'wheel', ATON._onMouseWheel, false );

    // FIXME: Generic pointer
    ATON._bPointerDown = false;
    window.addEventListener('pointerdown', (e)=>{
        ATON._bPointerDown = true;
    });
    window.addEventListener('pointerup', (e)=>{
        ATON._bPointerDown = false;
    });
    window.addEventListener('pointermove', (e)=>{
        if (!ATON._bPointerDown) return;

        ATON._updateScreenMove(e);
        ATON._handleQueries();
    });

    window.addEventListener('touchstart', (e)=>{
        ATON._bPointerDown = true;
    });
    window.addEventListener('touchend', (e)=>{
        ATON._bPointerDown = false;
    });
    window.addEventListener('touchmove', (e)=>{
        if (!ATON._bPointerDown) return;

        ATON._updateScreenMove(e.touches[0]);
        ATON._handleQueries();
    });

/*
    Hammer(el).on("press pressup", (ev)=>{

        // Hold gesture start (press)
        if (ev.type == "press") {
            console.log("Hold active");
        }

        // Hold gesture stop (pressup)
        if (ev.type == "pressup") {
            console.log("Hold inactive");
        }
    });
*/
    // Touch events
    Hammer(el).on("doubletap", (e)=>{
        ATON._bPointerDown = false;
        ATON.fireEvent("DoubleTap", e.srcEvent);
        //console.log(e.srcEvent);
    });

    Hammer(el).on("tap", (e)=>{
        //ATON._evPointer = e.srcEvent;
        ATON._bPointerDown = false;

        ATON._updateScreenMove(e.srcEvent);
        ATON._handleQueries();

        ATON.fireEvent("Tap", e.srcEvent);
        //console.log(e.srcEvent);

        // UI selection
        if (ATON._hoveredUI === undefined) return;
        let H = ATON.getUINode(ATON._hoveredUI);
        if (H && H.onSelect) H.onSelect();
    });

    ATON.on("DoubleTap", (e)=>{
        //console.log(e);
        ATON.defaultDoubleTapFromScreenCoords(e);
    });


    // Keyboard
    ATON._kModShift = false;
    ATON._kModCtrl  = false;

    ATON._bListenKeyboardEvents = true; // FIXME: check if there's a better way

    window.addEventListener("keydown", (e)=>{
        if (e.key === "Shift")   ATON._kModShift = true;
        if (e.key === "Control") ATON._kModCtrl  = true;
        
        if (!ATON._bListenKeyboardEvents) return;

        ATON.fireEvent("KeyPress", e.key);
        //ATON.fireEvent("KeyPress/"+e.key);
    }, false);

    window.addEventListener("keyup", (e)=>{
        if (e.key === "Shift")   ATON._kModShift = false;
        if (e.key === "Control") ATON._kModCtrl  = false;

        if (!ATON._bListenKeyboardEvents) return;

        ATON.fireEvent("KeyUp", e.key);
        //ATON.fireEvent("KeyUp/"+e.key);
    }, false);

    // Defaults
    ATON.on("KeyPress", (k)=>{

        if (k==='+'){
            let f = ATON.Nav.getFOV() + 1.0;
            ATON.Nav.setFOV(f);
        }
        if (k==='-'){
            let f = ATON.Nav.getFOV() - 1.0;
            ATON.Nav.setFOV(f);
        }

        if (k==='PageUp'){
            let r = ATON.SUI.mainSelector.scale.x + 0.02;
            ATON.SUI.setSelectorRadius(r);
        }
        if (k==='PageDown'){
            let r = ATON.SUI.mainSelector.scale.x - 0.02;
            r = Math.max(r, 0.01);
            ATON.SUI.setSelectorRadius(r); 
        }
    });

    // Default semantic highlight
/*
    ATON.on("SemanticNodeLeave", (semid)=>{
        let S = ATON.getSemanticNode(semid);
        if (S) S.restoreDefaultMaterial();
    });
    ATON.on("SemanticNodeHover", (semid)=>{
        let S = ATON.getSemanticNode(semid);
        if (S) S.highlight();
    });
*/          
};

ATON._onResize = ()=>{
    ATON.Nav._camera.aspect = window.innerWidth / window.innerHeight;
    ATON.Nav._camera.updateProjectionMatrix();

    ATON._renderer.setSize( window.innerWidth, window.innerHeight );
    console.log("onResize");
};

ATON._onMouseWheel = (e)=>{
    e.preventDefault();

    ATON.fireEvent("MouseWheel", e.deltaY);
};

ATON.focusOn3DView = ()=>{
    ATON._renderer.domElement.focus();
};

// Default retarget from screen coordinates (eg.: on double tap)
ATON.defaultDoubleTapFromScreenCoords = (e)=>{
    ATON._updateScreenMove(e);
    ATON._handleQueryScene();

    if (!ATON.Nav._bControl) return;

    let bFPtrans = ATON.Nav.isFirstPerson() || ATON.Nav.isDevOri();

    // When first-person mode, teleport (non immersive)
    if (bFPtrans){
        if (ATON.Nav.currentQueryValidForLocomotion()){
            let P = ATON._queryDataScene.p;
            let N = ATON._queryDataScene.n;

            let currDir = ATON.Nav._vDir;
            let feye = new THREE.Vector3(P.x, P.y+ATON.userHeight, P.z);
            let ftgt = new THREE.Vector3(
                feye.x + currDir.x,
                feye.y + currDir.y,
                feye.z + currDir.z,
            );

            let POV = new ATON.POV().setPosition(feye).setTarget(ftgt).setFOV(ATON.Nav._currPOV.fov);

            ATON.Nav.requestPOV(POV, 0.5);
        }
        return;
    }

    // In orbit mode, focus on selected SemNode...
    let hsn = ATON.getSemanticNode(ATON._hoveredSemNode);
    if (ATON._queryDataSem && hsn){
        ATON.Nav.requestPOVbyNode( hsn, 0.5);
        return;
    }
    // ...or perform standard retarget on picked surface point
    if (ATON._queryDataScene){
        ATON.Nav.requestRetarget(ATON._queryDataScene.p, /*ATON._queryDataScene.n*/undefined, 0.5);
    }

    // TODO: go POV in sight if any (panorama only mode)
}

/**
Toggle fullscreen
*/
ATON.toggleFullScreen = ()=>{
    screenfull.toggle();
/*
    if (b === undefined){
        screenfull.toggle();
        return;
    }

    if (b) screenfull.request();
*/
};


//============================================================================
// ATON init routines
//============================================================================
/**
Main ATON initialization, it will take care of all sub-components initialization, device profiling and much more
@example
ATON.realize()
*/
ATON.realize = ()=>{
    console.log("Initialize ATON...");

    ATON.Utils.init();
    ATON.Utils.profileDevice();
    
    //THREE.Object3D.DefaultUp = new THREE.Vector3(0,0,1); // mismatches WebXR y-up

    // Timing
    ATON._clock = new THREE.Clock(true);

    let wglopts = {
        //canvas: document.getElementById("View3D"),
        antialias: true, //ATON.device.isMobile? false : true,
        alpha: true,
        //pecision: "mediump"
        preserveDrawingBuffer: true
    };

    ATON._renderer = new THREE.WebGLRenderer(wglopts);
    ATON._renderer.setSize( window.innerWidth, window.innerHeight );
    //console.log(ATON._renderer);

    ATON._stdpxd = 1.0; //window.devicePixelRatio? (window.devicePixelRatio) : 1.0;
    ATON._renderer.setPixelRatio( ATON._stdpxd );
    //console.log(ATON._stdpxd);
    
    ATON._renderer.outputEncoding = THREE.sRGBEncoding;
    ATON._renderer.toneMapping = THREE.LinearToneMapping; // THREE.ACESFilmicToneMapping
    ATON._renderer.toneMappingExposure = 1.0;

    //console.log(ATON._renderer.getPixelRatio());

    ATON._renderer.setAnimationLoop( ATON._onFrame );
    //ATON._bDirtyLP = false;

    ATON._maxAnisotropy = ATON._renderer.capabilities.getMaxAnisotropy();
    console.log(ATON._renderer.capabilities);

    THREE.Cache.enabled = true;

    ATON.userHeight = 1.7;
 
    document.body.appendChild( ATON._renderer.domElement );
    //console.log(ATON._renderer);
    
    let canvas = ATON._renderer.domElement;
    canvas.style.outline = "none";
    canvas.style.border  = "none";
    //canvas.style.padding = "0px";
    //canvas.style.margin  = "0px";
    //canvas.style.width   = "100%";
    //canvas.style.height  = "100%";

    ATON.EventHub.init();
    ATON.MatHub.init();

    //ATON._setupLoadManager();
    ATON._assetsManager = {};
    ATON._aLoader = new THREE.GLTFLoader(/*ATON._loadManager*/);
    ATON._dracoLoader = new THREE.DRACOLoader();
    ATON._dracoLoader.setDecoderPath( ATON.PATH_DRACO_LIB );
    ATON._aLoader.setDRACOLoader( ATON._dracoLoader );
    ATON._numReqLoad = 0;

    // Periods (TODO:)
    //ATON.periods = [];

    ATON._lps = []; // lightprobes
    ATON._bAutoLP = false;
    //ATON._dirtyLPs = true;
    ATON._bShadowsFixedBound = false;

    ATON.initGraphs();
    ATON.SceneHub.init();

    // Init audio hub
    ATON.AudioHub.init();

    // Init nav system
    ATON.Nav.init();

    // XR
    ATON.XR.init();

    // Spatial UI
    ATON.SUI.init();

    // VRoadcast
    ATON.VRoadcast.init();

    // Media Recorder
    ATON.MediaRec.init();

    // Semantic Factory
    ATON.SemFactory.init();

    // Query / picked data
    ATON._queryDataScene = undefined;
    ATON._queryDataSem   = undefined;
    ATON._queryDataUI    = undefined;

    ATON._hoveredSemNode = undefined;
    ATON._hoveredUI      = undefined;

    ATON._bQuerySemOcclusion = true;
    ATON._bQueryNormals  = true;
    ATON._bPauseQuery    = false;

    //window.setInterval(()=>{ if (!ATON._bPauseQuery) ATON._handleQueries(); }, 500 );

    // Basis (future support)
/*
    ATON._basisLoader = new BasisTextureLoader();
    ATON._basisLoader.setTranscoderPath( ATON.PATH_BASIS_LIB );
    ATON._basisLoader.detectSupport( ATON._renderer );
    
    // Register BasisTextureLoader for .basis extension.
    THREE.DefaultLoadingManager.addHandler( /\.basis$/, ATON._basisLoader );
*/


    // Mouse/Touch screen coords
    ATON._screenPointerCoords = new THREE.Vector2(0.0,0.0);

    // Ray casters
    ATON._rcScene = new THREE.Raycaster();
    ATON._rcScene.layers.set(ATON.NTYPES.SCENE);
    ATON._rcSemantics = new THREE.Raycaster();
    ATON._rcSemantics.layers.set(ATON.NTYPES.SEM);
    ATON._rcUI = new THREE.Raycaster();
    ATON._rcUI.layers.set(ATON.NTYPES.UI);

    //ATON._registerRCS(); // not used for now

    ATON._setupBaseListeners();

    if (ATON.device.isMobile) ATON._readDeviceOrientationMode();

    ATON.focusOn3DView();
};

/**
Pause rendering
*/
ATON.renderPause = ()=>{
    ATON._renderer.setAnimationLoop( undefined );
};

/**
Resume rendering (if paused)
*/
ATON.renderResume = ()=>{
    ATON._renderer.setAnimationLoop( ATON._onFrame );
};

ATON._setupLoadManager = ()=>{
    ATON._loadManager = new THREE.LoadingManager();
    ATON._loadManager.onStart = ( url, itemsLoaded, itemsTotal )=>{
	    console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
        ATON.fireEvent("NodeRequestFired", url);
    };

    ATON._loadManager.onLoad = ()=>{
	    console.log( 'Loading complete!');
        ATON.fireEvent("AllNodeRequestsCompleted");
    };

    ATON._loadManager.onProgress = ( url, itemsLoaded, itemsTotal )=>{
	    //console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
    };

    ATON._loadManager.onError = ( url )=>{
	    console.log( 'There was an error loading ' + url );
    };
};

/**
Set the default pixel density (standard is 1.0)
@example
ATON.setDefaultPixelDensity(0.5)
*/
ATON.setDefaultPixelDensity = (d)=>{
    ATON._stdpxd = d;
    ATON._renderer.setPixelRatio( d );

    // WebXR density
    if (ATON._renderer.xr === undefined) return;

    if (ATON.device.isMobile) ATON._renderer.xr.setFramebufferScaleFactor(ATON._stdpxd * ATON.XR.MOBILE_DENSITY_F);
    else ATON._renderer.xr.setFramebufferScaleFactor(ATON._stdpxd);
};

/**
Reset pixel density to default
*/
ATON.resetPixelDensity = ()=>{
    ATON._renderer.setPixelRatio( ATON._stdpxd );
};

ATON._readDeviceOrientationMode = ()=>{
    if (Math.abs(window.orientation) === 90){
        console.log("Landscape Mode");
        ATON.fireEvent("MobileLandscapeMode");
    }
    else {
        console.log("Portrait Mode");
        ATON.fireEvent("MobilePortraitMode");
    }

    setTimeout( ATON._onResize, 500);
};


//============================================================================
// Scene-graphs
//============================================================================
ATON.snodes   = {}; // Visible scene-graph
ATON.semnodes = {}; // Semantics graph
ATON.uinodes  = {}; // UI graph

// Visible scene-graph
//=============================================
/**
Create a scene node (visible scene-graph)
@param {string} id - a string representing unique ID of the node (optional)
@returns {Node}
*/
ATON.createSceneNode = (id)=>{
    return new ATON.Node(id, ATON.NTYPES.SCENE);
};

/**
Get a previously created scene node (visible scene-graph)
@param {string} id - the node ID
@returns {Node}
*/
ATON.getSceneNode = (id)=>{ 
    if (id === undefined) return undefined;    
    return ATON.snodes[id];
};

/**
Get or create a scene node (visible scene-graph)
@param {string} id - the node ID
@returns {Node}
*/
ATON.getOrCreateSceneNode = (id)=>{
    let N = ATON.getSceneNode(id);
    if (N !== undefined) return N;
    return ATON.createSceneNode(id);
};

/**
Get root (visible scene-graph)
@returns {Node}
*/
ATON.getRootScene = ()=>{
    return ATON._rootVisible;
};

// Semantics, shape descriptors
//=============================================

/**
Create a semantic node
@param {string} id - a string representing unique ID of the node (optional)
@returns {Node}
*/
ATON.createSemanticNode = (id)=>{
    return new ATON.Node(id, ATON.NTYPES.SEM);
};

/**
Get a previously created semantic node
@param {string} id - the node ID
@returns {Node}
*/
ATON.getSemanticNode = (id)=>{
    if (id === undefined) return undefined; 
    return ATON.semnodes[id];
};

/**
Get or create a semantic node
@param {string} id - the node ID
@returns {Node}
*/
ATON.getOrCreateSemanticNode = (id)=>{
    let S = ATON.getSemanticNode(id);
    if (S !== undefined) return S;
    return ATON.createSemanticNode(id);
};

/**
Get root of semantic graph
@returns {Node}
*/
ATON.getRootSemantics = ()=>{
    return ATON._rootSem;
};

// UI graph
//=============================================

/**
Create a UI node
@param {string} id - a string representing unique ID of the node (optional)
@returns {Node}
*/
ATON.createUINode = (id)=>{
    return new ATON.Node(id, ATON.NTYPES.UI);
};

/**
Get a previously created UI node
@param {string} id - the node ID
@returns {Node}
*/
ATON.getUINode = (id)=>{
    if (id === undefined) return undefined; 
    return ATON.uinodes[id];
};

/**
Get root of UI graph
@returns {Node}
*/
ATON.getRootUI = ()=>{
    return ATON._rootUI;
};

// Asset loading routines
ATON._assetReqNew = (url)=>{
    ATON._numReqLoad++;
    ATON.fireEvent("NodeRequestFired", url);
};
ATON._assetReqComplete = (url)=>{
    ATON.fireEvent("NodeRequestCompleted", url);
    ATON._numReqLoad--;

    if (ATON._numReqLoad <= 0){
        ATON.fireEvent("AllNodeRequestsCompleted");

        // Bounds
        let c = ATON._rootVisible.getBound().center;
        let r = ATON._rootVisible.getBound().radius;

        if (ATON._renderer.shadowMap.enabled){
            ATON._rootVisible.traverse((o) => {
                if (o.isMesh){
                    o.castShadow = true;
                    o.receiveShadow = true;
                }
            });

            // TODO: experimental
            if (ATON._bShadowsFixedBound){
                ATON.SHADOWS_SIZE = r*1.5;

                ATON._dMainL.shadow.camera.left   = -ATON.SHADOWS_SIZE;
                ATON._dMainL.shadow.camera.right  = ATON.SHADOWS_SIZE;
                ATON._dMainL.shadow.camera.bottom = -ATON.SHADOWS_SIZE;
                ATON._dMainL.shadow.camera.top    = ATON.SHADOWS_SIZE;

                ATON.updateDirShadows(c);
            }
        }

        if (ATON._bAutoLP){
            if (ATON._lps[0] === undefined) ATON.addLightProbe( new ATON.LightProbe().setPosition(c).setNear(r) );
            else {
                ATON._lps[0].setPosition(c.x, c.y, c.z).setNear(r);
            }
            console.log("Auto LP");
        }

        ATON.getRootScene().assignLightProbesByProximity();

        //ATON._bDirtyLP = true;

        // FIXME: dirty
        setTimeout( ()=>{
            if (c && ATON._mMainPano) ATON._mMainPano.position.copy(c);
            ATON.updateLightProbes();
        }, 1000);

    }
};


ATON.initGraphs = ()=>{
    // Global root
    ATON._mainRoot = new THREE.Scene();
    ATON._mainRoot.background = new THREE.Color( 0.7,0.7,0.7 );

    // visible scene-graph
    ATON._rootVisibleGlobal = new THREE.Group();
    ATON._mainRoot.add(ATON._rootVisibleGlobal);

    ATON._rootVisible = ATON.createSceneNode().setAsRoot();
    ATON._rootVisibleGlobal.add(ATON._rootVisible);


    // semantics graph
    ATON._rootSem = ATON.createSemanticNode().setAsRoot();
    ATON._mainRoot.add(ATON._rootSem);

    // UI graph
    ATON._rootUI = ATON.createUINode().setAsRoot();
    ATON._mainRoot.add(ATON._rootUI);

    // Uniform lighting
    ATON.ambLight = new THREE.AmbientLight( new THREE.Color(1,1,1) /*ATON._mainRoot.background*/ );
    ATON._rootVisibleGlobal.add(ATON.ambLight);
};

ATON.setBackgroundColor = (bg)=>{
    ATON._mainRoot.background = bg;
};

//==============================================================
// LightProbes
//==============================================================
ATON.setAutoLP = (b)=>{
    ATON._bAutoLP = b;
};

ATON.setNeutralAmbientLight = (a)=>{
    ATON.ambLight.color = new THREE.Color( a,a,a );
};

/**
Add a LightProbe to the scene
@param {LightProbe} LP - the light probe being added 
*/
ATON.addLightProbe = (LP)=>{
    if (LP === undefined) return;

    if (ATON._lps.length === 0) ATON.setNeutralAmbientLight(ATON.AMB_L);

    ATON._lps.push(LP);
};

/**
Update all LightProbes in the scene
*/
ATON.updateLightProbes = ()=>{
    if (ATON._lps.length === 0) return;

    for (let i in ATON._lps) ATON._lps[i].update();

    // FIXME: indirect LP based on first LP (for now)
    if (ATON._lps[0]){
        if (ATON._indLP) ATON._mainRoot.remove(ATON._indLP);

        ATON._indLP = THREE.LightProbeGenerator.fromCubeRenderTarget( ATON._renderer, ATON._lps[0]._prevCCtarget );
        ATON._mainRoot.add( ATON._indLP );
    }

    //for (let i in ATON._lps) ATON._lps[i].update();

    ATON._rootVisible.traverse((o) => {
        let LP = o.userData.LP;
        if (LP !== undefined && LP instanceof ATON.LightProbe){
            o.material.envMap = LP.getEnvTex();
            //o.material.combine = THREE.AddOperation;
            //o.material.envMapIntensity = 5.0;
        }
    });

    console.log("LPs updated.");
};

//==============================================================
// Environment
//==============================================================

/**
Set the main panorama (360)
@param {string} path - url to equirectangular image
@example
ATON.setMainPanorama("my/pano.jpg");
*/
ATON.setMainPanorama = (path)=>{
    let tpano = undefined;

    //const pmremGenerator = new THREE.PMREMGenerator( ATON._renderer );
    //pmremGenerator.compileEquirectangularShader();
/*
    if (path.endsWith(".hdr")){
        new THREE.RGBELoader().setDataType( THREE.UnsignedByteType ).load(path, (hdr)=>{
            //const envMap = pmremGenerator.fromEquirectangular( hdr ).texture;
            
            tpano = hdr;
            if (ATON._matMainPano) ATON._matMainPano.map = hdr;
        });

        //return;
    }
*/
//    else {
        tpano = new THREE.TextureLoader().load(path);
        tpano.encoding = THREE.sRGBEncoding;
//    }

    if (ATON._matMainPano !== undefined){
        ATON._matMainPano.map = tpano;
        //ATON._matMainPano.emissive = tpano;
        return;
    }

    // First time: create it
    ATON._gMainPano = new THREE.SphereBufferGeometry( 1.0, 60,60 );

    ATON._matMainPano = new THREE.MeshBasicMaterial({ 
        map: tpano, 
        //emissive: tpano,
        //castShadow: false,
        //receiveShadow: false,
        fog: false,
        depthTest: false,
        depthWrite: false,
        //depthFunc: THREE.AlwaysDepth,
        //side: THREE.DoubleSide
    });

    ATON._mMainPano = new THREE.Mesh(ATON._gMainPano, ATON._matMainPano);
    ATON._mMainPano.frustumCulled = false;
    ATON.setMainPanoramaRadius(ATON.Nav.STD_FAR * 0.9);

    ATON._mMainPano.onAfterRender = ()=>{
        //if (ATON._numReqLoad > 0) return;
        ATON._mMainPano.position.copy(ATON.Nav._currPOV.pos);
    };

    ATON._rootVisibleGlobal.add(ATON._mMainPano);
};


ATON.setMainPanoramaRadius = (r)=>{
    if (ATON._gMainPano === undefined) return;
    ATON._gMainPano.scale( -r,r,r );
};

/**
Set main panorama rotation (radians) around up vector
@param {number} r - rotation
@example
ATON.setMainPanoramaRotation(1.5);
*/
ATON.setMainPanoramaRotation = (r)=>{
    if (ATON._mMainPano === undefined) return;
    ATON._mMainPano.rotation.set( 0,r,0 );
};

/**
Set and activate main directional light
@param {THREE.Vector3} v - light direction
@example
ATON.setMainLightDirection( new THREE.Vector(0.1,-1.0,0.0) );
*/
ATON.setMainLightDirection = (v)=>{

    let d = v.clone();
    d.normalize();

    d.x *= ATON.SHADOWS_FAR * 0.5;
    d.y *= ATON.SHADOWS_FAR * 0.5;
    d.z *= ATON.SHADOWS_FAR * 0.5;

    if (ATON._dMainL === undefined){
        ATON._dMainL = new THREE.DirectionalLight( new THREE.Color(1,1,1), 1.0 );
        ATON._dMainL.castShadow = false;

        ATON._dMainLtgt = new THREE.Object3D();
        ATON._rootVisibleGlobal.add(ATON._dMainLtgt);
        ATON._dMainL.target = ATON._dMainLtgt;

        ATON._rootVisibleGlobal.add(ATON._dMainL);
        ATON._dMainLpos = new THREE.Vector3();
    }

    ATON._dMainLdir = d;

    ATON._dMainL.position.set(-d.x,-d.y,-d.z);

    ATON.toggleMainLight(true);
};

ATON.getMainLightDirection = ()=>{
    if (ATON._dMainLdir === undefined) return undefined;

    let ld = ATON._dMainLdir.clone();
    ld.normalize();
    return ld;
};

ATON.toggleMainLight = (b)=>{
    if (ATON._dMainL === undefined) return;
    ATON._dMainL.visible = b;
    
    if (b){
        ATON.setNeutralAmbientLight(ATON.AMB_L);
        ATON.updateDirShadows();
    }
    else ATON.setNeutralAmbientLight(1.0);
};

ATON.isMainLightEnabled = ()=>{
    if (ATON._dMainL === undefined) return false;
    if (!ATON._dMainL.visible) return false;

    return true;
};

ATON.setExposure = (d)=>{
    ATON._renderer.toneMappingExposure = d;
};
ATON.getExposure = ()=>{
    return ATON._renderer.toneMappingExposure;
};

ATON.toggleShadows = (b)=>{
    if (ATON._dMainL === undefined) return;

    if (b){
        ATON._dMainL.castShadow = true;
        ATON._renderer.shadowMap.enabled = true;

        //ATON._renderer.shadowMap.type    = THREE.BasicShadowMap;
        //ATON._renderer.shadowMap.type    = THREE.PCFShadowMap;
        ATON._renderer.shadowMap.type    = THREE.PCFSoftShadowMap; //
        //ATON._renderer.shadowMap.type    = THREE.VSMShadowMap;

        ATON._dMainL.shadow.mapSize.width  = ATON.SHADOWS_RES;
        ATON._dMainL.shadow.mapSize.height = ATON.SHADOWS_RES;
        ATON._dMainL.shadow.camera.near    = ATON.SHADOWS_NEAR;
        ATON._dMainL.shadow.camera.far     = ATON.SHADOWS_FAR;
        //ATON._dMainL.shadow.bias           = 0.0001;

        ATON._dMainL.shadow.camera.left   = -ATON.SHADOWS_SIZE;
        ATON._dMainL.shadow.camera.right  = ATON.SHADOWS_SIZE;
        ATON._dMainL.shadow.camera.bottom = -ATON.SHADOWS_SIZE;
        ATON._dMainL.shadow.camera.top    = ATON.SHADOWS_SIZE;

        ATON._rootVisible.traverse((o) => {
            if (o.isMesh){
                o.castShadow = true;
                o.receiveShadow = true;
            }
        });

        if (ATON._bShadowsFixedBound){
            let c = ATON._rootVisible.getBound().center;
            ATON.updateDirShadows(c);
        }
        else ATON.updateDirShadows();

        console.log("Shadows ON");
    }
    else {
        ATON._dMainL.castShadow = false;
        ATON._renderer.shadowMap.enabled = false;
        console.log("Shadows OFF");
    }
};

ATON.updateDirShadows = (p)=>{
    if (ATON._dMainLdir === undefined) return;

    if (p === undefined) p = ATON.Nav.getCurrentEyeLocation();

    ATON._dMainLpos.x = p.x + (ATON.Nav._vDir.x * ATON.SHADOWS_SIZE);
    ATON._dMainLpos.y = p.y + (ATON.Nav._vDir.y * ATON.SHADOWS_SIZE);
    ATON._dMainLpos.z = p.z + (ATON.Nav._vDir.z * ATON.SHADOWS_SIZE);

    ATON._dMainL.position.set(
        ATON._dMainLpos.x - ATON._dMainLdir.x, 
        ATON._dMainLpos.y - ATON._dMainLdir.y, 
        ATON._dMainLpos.z - ATON._dMainLdir.z
    );
    ATON._dMainLtgt.position.copy(ATON._dMainLpos);
};

ATON._updateEnvironment = ()=>{
    if (!ATON._renderer.shadowMap.enabled) return;
    if (ATON._bShadowsFixedBound) return;

    ATON.updateDirShadows();
};

//==============================================================
// Update routines
//==============================================================
ATON._onFrame = ()=>{
    // TODO: add pause render

    let dt = ATON._clock.getDelta();

    ATON._fps = 1.0 / dt;
    ATON._dt  = dt;
    
    //ATON.Nav._bControlChange = false;
    ATON.Nav._controls.update(dt);

    ATON._renderer.render( ATON._mainRoot, ATON.Nav._camera );

/*
    if (ATON.Nav._bControlChange){
        }
    else {
        //ATON._handleScreenPick();
        }
*/

    if (ATON.XR._bPresenting) ATON.XR.update();

    // Spatial queries
    ATON._handleQueries();

    // Navigation system
    ATON.Nav.update();

    // VRoadcast
    ATON.VRoadcast.update();

    // UI
    ATON.SUI.update();

    // Environment/lighting
    ATON._updateEnvironment();

    ATON.fireEvent("frame");
};

ATON._updateScreenMove = (e)=>{
    if (e.preventDefault) e.preventDefault();

    if (ATON.Nav._mode === ATON.Nav.MODE_DEVORI){
        ATON._screenPointerCoords.x = 0.0;
        ATON._screenPointerCoords.y = 0.0;
        return;
    }

	ATON._screenPointerCoords.x = ( e.clientX / window.innerWidth ) * 2 - 1;
	ATON._screenPointerCoords.y = -( e.clientY / window.innerHeight ) * 2 + 1;

    //console.log(ATON._screenPointerCoords);
};

//==============================================================
// Query rountines
//==============================================================
ATON._registerRCS = ()=>{
    ATON._rcRR = 0;
    ATON._rcHandlers = [];

    ATON._rcHandlers.push( ATON._handleQueryScene );
    ATON._rcHandlers.push( ATON._handleQuerySemantics );
    ATON._rcHandlers.push( ATON._handleQueryUI );
};

ATON._handleQueries = ()=>{
    if (ATON._bPauseQuery) return;
    if (ATON.Nav._bInteracting) return;
    if (ATON._numReqLoad > 0) return;
    if (ATON.Nav.isTransitioning()) return; // do not query during POV transitions
    //if (ATON.device.isMobile || !ATON.XR.isPresenting()) return; 

    // round-robin
    //ATON._rcRR = (ATON._rcRR+1) % 2;
    //ATON._rcHandlers[ATON._rcRR]();

    ATON._handleQueryScene();
    ATON._handleQuerySemantics();
    ATON._handleQueryUI();

    ATON.Nav.locomotionValidator();
};

// Ray casting visible scenegraph
ATON._handleQueryScene = ()=>{
    if (ATON.XR.isPresenting()){
        ATON.XR.setupQueryRay(ATON._rcScene);
    }
    else 
        ATON._rcScene.setFromCamera( ATON._screenPointerCoords, ATON.Nav._camera );

    ATON._hitsScene = [];
    //ATON._rcScene.intersectObjects( ATON._rootVisible.children, true, ATON._hitsScene );
    ATON._rcScene.intersectObjects( ATON._mainRoot.children, true, ATON._hitsScene );

    //ATON._hitsOperator(ATON._hits);

    // Process hits
    let hitsnum = ATON._hitsScene.length;
    if (hitsnum <= 0){
        ATON._queryDataScene = undefined;
        return;
    }

    let h = ATON._hitsScene[0];

    ATON._queryDataScene = {};
    ATON._queryDataScene.p = h.point;
    ATON._queryDataScene.d = h.distance;
    ATON._queryDataScene.o = h.object;
    
    //console.log(ATON._queryDataScene.o);

    // Normals
    if (!ATON._bQueryNormals) return;
    if (h.face === null) return;
    if (h.face.normal === undefined) return;

    ATON._queryDataScene.matrixWorld = new THREE.Matrix3().getNormalMatrix( h.object.matrixWorld );
    ATON._queryDataScene.n = h.face.normal.clone().applyMatrix3( ATON._queryDataScene.matrixWorld ).normalize();
};

/**
Get location of current queried point (if any) on visible scene.
If no point is queried, return undefined
@returns {THREE.Vector3}
@example
let p = ATON.getSceneQueriedPoint()
*/
ATON.getSceneQueriedPoint = ()=>{
    if (ATON._queryDataScene === undefined) return undefined;
    return ATON._queryDataScene.p;
};

/**
Get distance to queried location (if any) on visible scene.
If no point is queried, return undefined
@returns {number}
@example
let d = ATON.getSceneQueriedDistance()
*/
ATON.getSceneQueriedDistance = ()=>{
    if (ATON._queryDataScene === undefined) return undefined;
    return ATON._queryDataScene.d;
};

/**
Get queried location normal (if any) on visible scene.
If no point is queried, return undefined
@returns {THREE.Vector3}
@example
let n = ATON.getSceneQueriedNormal()
*/
ATON.getSceneQueriedNormal = ()=>{
    if (ATON._queryDataScene === undefined) return undefined;
    return ATON._queryDataScene.n;
};


// Ray casting semantic-graph
ATON._handleQuerySemantics = ()=>{
    if (ATON.XR.isPresenting()){
        ATON.XR.setupQueryRay(ATON._rcSemantics);
    }
    else 
        ATON._rcSemantics.setFromCamera( ATON._screenPointerCoords, ATON.Nav._camera );

    ATON._hitsSem = [];
    ATON._rcSemantics.intersectObjects( ATON._mainRoot.children, true, ATON._hitsSem );

    // Process hits
    let hitsnum = ATON._hitsSem.length;
    if (hitsnum <= 0){
        ATON._queryDataSem = undefined;

        if (ATON._hoveredSemNode){
            ATON.fireEvent("SemanticNodeLeave", ATON._hoveredSemNode);
            let S = ATON.getSemanticNode(ATON._hoveredSemNode);
            if (S && S.onLeave) S.onLeave();
        }
        
        ATON._hoveredSemNode = undefined;
        return;
    }

    let h = ATON._hitsSem[0];

    // Occlusion
    if (ATON._bQuerySemOcclusion && ATON._queryDataScene){
        if (ATON._queryDataScene.d < h.distance){

            ATON._queryDataSem = undefined;

            if (ATON._hoveredSemNode){
                ATON.fireEvent("SemanticNodeLeave", ATON._hoveredSemNode);
                let S = ATON.getSemanticNode(ATON._hoveredSemNode);
                if (S && S.onLeave) S.onLeave();
            }

            ATON._hoveredSemNode = undefined;
            return;
        }
    }

    ATON._queryDataSem = {};
    ATON._queryDataSem.p = h.point;
    ATON._queryDataSem.d = h.distance;
    ATON._queryDataSem.o = h.object;
    ATON._queryDataSem.list = []; // holds sem-nodes parental list

    // traverse parents
    let L = ATON._queryDataSem.list;
    let sp = h.object.parent;
    while (sp){
        if (sp.nid && sp.nid !== ATON.ROOT_NID) L.push(sp.nid);
        sp = sp.parent;
    }

    let hsn = L[0];
    if (hsn){
        if (ATON._hoveredSemNode !== hsn){
            if (ATON._hoveredSemNode){
                ATON.fireEvent("SemanticNodeLeave", ATON._hoveredSemNode);
                let S = ATON.getSemanticNode(ATON._hoveredSemNode);
                if (S && S.onLeave) S.onLeave();
            }

            ATON._hoveredSemNode = hsn;
            ATON.fireEvent("SemanticNodeHover", hsn);
            let S = ATON.getSemanticNode(hsn);
            if (S && S.onHover) S.onHover();
        }
    }

    //console.log(L);
};

ATON._handleQueryUI = ()=>{
    if (ATON.XR.isPresenting()){
        ATON.XR.setupQueryRay(ATON._rcUI);
    }
    else 
        ATON._rcUI.setFromCamera( ATON._screenPointerCoords, ATON.Nav._camera );

    ATON._hitsUI = [];
    ATON._rcUI.intersectObjects( ATON._mainRoot.children, true, ATON._hitsUI );

    // Process hits
    let hitsnum = ATON._hitsUI.length;
    if (hitsnum <= 0){
        ATON._queryDataUI = undefined;

        if (ATON._hoveredUI){
            ATON.fireEvent("UINodeLeave", ATON._hoveredUI);
            let S = ATON.getUINode(ATON._hoveredUI);
            if (S && S.onLeave) S.onLeave();
        }
        
        ATON._hoveredUI = undefined;
        return;
    }

    let h = ATON._hitsUI[0];

    // Occlusion
    if (ATON._queryDataScene){
        if (ATON._queryDataScene.d < h.distance){

            ATON._queryDataUI = undefined;

            if (ATON._hoveredUI){
                ATON.fireEvent("SemanticNodeLeave", ATON._hoveredUI);
                let S = ATON.getUINode(ATON._hoveredUI);
                if (S && S.onLeave) S.onLeave();
            }

            ATON._hoveredUI = undefined;
            return;
        }
    }

    ATON._queryDataUI = {};
    ATON._queryDataUI.p = h.point;
    ATON._queryDataUI.d = h.distance;
    ATON._queryDataUI.o = h.object;
    ATON._queryDataUI.list = []; // holds ui-nodes parental list

    // traverse parents
    let L = ATON._queryDataUI.list;
    let sp = h.object.parent;
    while (sp){
        if (sp.nid && sp.nid !== ATON.ROOT_NID) L.push(sp.nid);
        sp = sp.parent;
    }

    let hui = L[0];
    if (hui){
        if (ATON._hoveredUI !== hui){
            if (ATON._hoveredUI){
                ATON.fireEvent("UINodeLeave", ATON._hoveredUI);
                let S = ATON.getUINode(ATON._hoveredUI);
                if (S && S.onLeave) S.onLeave();
            }

            ATON._hoveredUI = hui;
            ATON.fireEvent("UINodeHover", hui);
            let S = ATON.getUINode(hui);
            if (S && S.onHover) S.onHover();
        }
    }
};


export default ATON;


