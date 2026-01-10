/*
    ATON immersive XR module

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
ATON Immersive XR
@namespace XR
*/
let XR = {};

XR.STD_TELEP_DURATION = 0.03;
XR.HAND_R = 0;
XR.HAND_L = 1;

XR.HAND_PRIMARY   = 0;
XR.HAND_SECONDARY = 1;

XR.LOW_DENSITY_F   = 0.5;
XR.MAX_QUERY_DISTANCE = 40.0; // Max distance query in first person (XR session)


//Initializes XR component
XR.init = ()=>{
    ATON._renderer.xr.enabled = true;
    ATON._renderer.xr.setReferenceSpaceType( 'local' );
    
    // WebXR fb
    XR.setDensity(1.0);

    XR._bPresenting = false;
    XR.currSession  = null;
    XR._sessionType = "immersive-vr";
    XR._bReqPresenting = false;

    XR.rig = new THREE.Group();
    //XR.rig.position.set(0,0,0);
    XR.rig.add( ATON.Nav._camera );
    ATON._rootUI.add(XR.rig);

    //XR.hmdOri = new THREE.Quaternion();
    //XR.hmdPos = new THREE.Vector3();

    XR._cam = undefined;

    XR._currPos = XR.rig.position; //new THREE.Vector3();
    XR._fromPos = new THREE.Vector3();
    XR._reqPos  = new THREE.Vector3();

/*
    XR.gControllers = ATON.createUINode();
    XR.gControllers.disablePicking();
    XR.rig.add( XR.gControllers );

    XR.controller0 = undefined;
    XR.controller1 = undefined;

    XR.controller0pos = new THREE.Vector3();
    XR.controller1pos = new THREE.Vector3();
    XR.controller0dir = new THREE.Vector3();
    XR.controller1dir = new THREE.Vector3();

    XR._lastPosR = undefined;
    XR._lastPosL = undefined;

    XR._pointerLineGeom = undefined;
    XR._pointerLineMesh = undefined;

    XR.gpad0 = undefined;
    XR.gpad1 = undefined;
*/
    XR.setupControllers();

    // AR light-estimation
    // XR.setupARLightEstimation();

    XR._urlHand = ATON.PATH_RES+"models/hand/hand.glb";

    // Base ev
    ATON.on("XRselectStart", (c)=>{
        if (c === XR.HAND_R) ATON._stdActivation(); //XR.defaultSelectHandler(c);
    });
    ATON.on("XRselectEnd", (c)=>{
        //ATON.Nav.stop();
        //console.log("Sel end "+c);
    });

    ATON.on("XRsqueezeStart", (c)=>{
        if (c === XR.HAND_R) ATON.Photon.setFocusStreaming(true);
        //if (c === XR.HAND_L) ATON._bPauseQuery = true;
        //console.log("Squeeze "+c);
    });
    ATON.on("XRsqueezeEnd", (c)=>{
        if (c === XR.HAND_R) ATON.Photon.setFocusStreaming(false);
        //if (c === XR.HAND_L) ATON._bPauseQuery = false;
    });

    ATON.on("VRC_IDassigned", (uid)=>{
        XR.setControllersMaterial( ATON.Photon.getAvatarMaterialByUID(uid) );
    });
};

XR.setDensity = (d)=>{
    if (ATON._renderer.xr === undefined) return;

    if (ATON.device.isMobile || ATON.device.lowGPU) ATON._renderer.xr.setFramebufferScaleFactor(d * ATON.XR.LOW_DENSITY_F);
    else ATON._renderer.xr.setFramebufferScaleFactor(d);
};


XR.setupControllers = ()=>{
    XR.gControllers = ATON.createUINode();
    XR.gControllers.disablePicking();

    XR.rig.add( XR.gControllers );
    //XR.gControllers.attachToRoot();

    const rXR = ATON._renderer.xr;

    XR._bGaze = true;

    XR.controller0 = rXR.getController( 0 );
    XR.gControllers.add(XR.controller0);
    XR.setupBaseController( XR.controller0 );
    
    XR.controller1 = rXR.getController( 1 );
    XR.gControllers.add(XR.controller1);
    XR.setupBaseController( XR.controller1 );

    XR.controller0.userData.pos = new THREE.Vector3();
    XR.controller1.userData.pos = new THREE.Vector3();
    XR.controller0.userData.dir = new THREE.Vector3(0,1,0);
    XR.controller1.userData.dir = new THREE.Vector3(0,1,0);

    XR.controllerModelFactory = new THREE.XRControllerModelFactory(null, ()=>{
        if (ATON.Photon.uid !== undefined) XR.setControllersMaterial( ATON.Photon.getAvatarMaterialByUID(ATON.Photon.uid) );
        else XR.setControllersMaterial(ATON.MatHub.materials.controllerRay);
    });

	XR.handModelFactory = new THREE.XRHandModelFactory(null, ()=>{
        if (ATON.Photon.uid !== undefined) XR.setControllersMaterial( ATON.Photon.getAvatarMaterialByUID(ATON.Photon.uid) );
        else XR.setControllersMaterial(ATON.MatHub.materials.controllerRay);
    });

    XR._lastPosR = undefined;
    XR._lastPosL = undefined;


    // Hand 0
    XR.controllerGrip0 = rXR.getControllerGrip( 0 );
    XR.controllerGrip0.add( XR.controllerModelFactory.createControllerModel( XR.controllerGrip0 ) );
    XR.gControllers.add( XR.controllerGrip0 );

    XR.hand0 = rXR.getHand( 0 );
    XR.hand0.add( XR.handModelFactory.createHandModel( XR.hand0 ) );
    XR.gControllers.add( XR.hand0 );


    // Hand 1
    XR.controllerGrip1 = rXR.getControllerGrip( 1 );
    XR.controllerGrip1.add( XR.controllerModelFactory.createControllerModel( XR.controllerGrip1 ) );
    XR.gControllers.add( XR.controllerGrip1 );

    XR.hand1 = rXR.getHand( 1 );
    XR.hand1.add( XR.handModelFactory.createHandModel( XR.hand1 ) );
    XR.gControllers.add( XR.hand1 );

    XR._pointerLineGeom = undefined;
    XR._pointerLineMesh = undefined;

    XR._cPrimary   = XR.controller0;
    XR._cSecondary = XR.controller1;
};

XR.setControllersMaterial = (material)=>{
    
    XR.controllerGrip0.traverse((o) => {
        if (o.isMesh){
            o.material = material;
            ///o.material.needsUpdate = true;
            //console.log(o);
        }
    });

    XR.controllerGrip1.traverse((o) => {
        if (o.isMesh){
            o.material = material;
            ///o.material.needsUpdate = true;
            //console.log(o);
        }
    });
 
};

XR.setupBaseController = (C)=>{
    C.userData.isConnected = false;

    C.addEventListener('connected', ( event )=>{
        C.userData.isConnected = true;
        
        const data = event.data;
        C.userData.hand = data.handedness;
        C.userData.gm   = data.gamepad;

        if (data.targetRayMode === 'gaze'){
            XR._bGaze = true;
            return;
        }

        if (data.targetRayMode === 'tracked-pointer') {
            XR._bGaze = false;

            if (!C.userData.hand){
                XR.setupControllerAsPrimary(C);
                return;
            }
            else {
                if (C.userData.hand === "left"){
                    XR.setupControllerAsSecondary(C);
                    ATON.fire("XRcontrollerConnected", XR.HAND_L);
                    console.log("Secondary Controller");
                }
                else {
                    XR.setupControllerAsPrimary(C);
                    ATON.fire("XRcontrollerConnected", XR.HAND_R);
                    console.log("Primary Controller");
                }
            }

            return;
        }
    });

    C.addEventListener('disconnected', (event)=>{
        C.userData.isConnected = false;
        // TODO:
    });

    // Main trigger
    C.addEventListener( 'selectstart',  ()=>{
        ATON.fire("XRselectStart", XR.getControllerHand(C) );
    });
    C.addEventListener( 'selectend',  ()=>{ 
        ATON.fire("XRselectEnd", XR.getControllerHand(C) );
    });

    // Squeeze
    C.addEventListener( 'squeezestart', ()=>{
        ATON.fire("XRsqueezeStart", XR.getControllerHand(C) );
    });
    C.addEventListener( 'squeezeend', ()=>{
        ATON.fire("XRsqueezeEnd", XR.getControllerHand(C) );
    });
};

XR.getControllerHand = (C)=>{
    let h = XR.HAND_R;

    if (C.userData.hand){
        if (C.userData.hand === "left") return XR.HAND_L;
    }

    return h;
}

XR.setupControllerAsPrimary = (C)=>{
    C.userData.isPrimary = true;
    XR._cPrimary = C;

    let raytick = 0.003;
    let raylen  = 1.0;

    XR._pointerLineGeom = new THREE.CylinderGeometry( raytick,raytick, raylen, 4 );
    //XR._pointerLineGeom = new THREE.CylinderGeometry( raytick,raytick, raylen, 4 );

    XR._pointerLineGeom.rotateX( -Math.PI / 2 );
    XR._pointerLineGeom.translate(0,0,-(raylen*0.5));

    XR._pointerLineMesh = new THREE.Mesh( XR._pointerLineGeom, ATON.MatHub.materials.controllerRay );
    C.add( /*mesh.clone()*/ XR._pointerLineMesh );
    XR._pointerLineMesh.visible = false;
};

XR.setupControllerAsSecondary = (C)=>{
    C.userData.isPrimary = false;
    XR._cSecondary = C;
};

XR.getPrimaryController = ()=>{
    return XR._cPrimary;
/*
    if (XR.controller0.userData.isPrimary) return XR.controller0;
    return XR.controller1;
*/
};

XR.getSecondaryController = ()=>{
    return XR._cSecondary;
/*
    if (!XR.controller0.userData.isPrimary) return XR.controller0;
    return XR.controller1;
*/
};


/**
Set session type
@param {string} type - Can be "immersive-vr" or "immersive-ar"
*/
XR.setSessionType = (type)=>{
    if (type === undefined) type = "immersive-vr";
    //if (type !== "immersive-vr" && type !== "immersive-ar") return;

    XR._sessionType = type;
    console.log("Session type: "+type);
};

/**
Return true if we are presenting (immersive VR or AR)
@returns {boolean}
*/
XR.isPresenting = ()=>{
    return XR._bPresenting;
};

XR.setupARLightEstimation = ()=>{
    XR._arEstLight = new THREE.XREstimatedLight( ATON._renderer );
    XR._arEstLP    = undefined;

    XR._arEstLight.addEventListener( 'estimationstart' , () => {
        ATON._rootVisible.add( XR._arEstLight );

        if ( XR._arEstLight.environment ) {
            //ATON._rootVisible.environment = xrLight.environment;
            ATON._rootVisible.setEnvMap( XR._arEstLight.environment );

            if (ATON._dMainL && ATON._dMainL.visible) ATON._dMainL.visible = false;

            XR._arEstLP = window.setInterval(()=>{
                ATON.updateLightProbes();
            }, 1000);
        }
    });
    
    XR._arEstLight.addEventListener( 'estimationend', () => {
        ATON._rootVisible.remove( XR._arEstLight );
        //ATON._rootVisible.environment = null;
        if (ATON._dMainL && ATON._dMainL.visible) ATON._dMainL.visible = true;
        window.clearInterval( XR._arEstLP );
    } );
}


XR.teleportOnQueriedPoint = ()=>{
    if (!ATON.Nav.currentQueryValidForLocomotion()) return false;

    const P = ATON._queryDataScene.p;
    //const N = ATON._queryDataScene.n;

    // FIXME: height offset needed for "local", fill this automatically
    ATON.Nav.requestPOV( new ATON.POV().setPosition(P.x, P.y + ATON.userHeight, P.z), XR.STD_TELEP_DURATION );
    //ATON.Nav.requestPOV( new ATON.POV().setPosition(P.x, P.y, P.z), XR.STD_TELEP_DURATION );

    return true;
};

// Helper routine to setup a ray-caster
XR.setupQueryRay = (rc)=>{
    if (rc === undefined) return;

    // No controllers connected, use HMD-aligned query
    if (!XR.controller0.userData.isConnected && !XR.controller1.userData.isConnected){
        rc.set( ATON.Nav.getCurrentEyeLocation(), ATON.Nav.getCurrentDirection() );
        return;
    }

    // We have at least one 6DOF controller
    if (XR.controller0.userData.isPrimary) rc.set( XR.controller0.userData.pos, XR.controller0.userData.dir );
    else rc.set( XR.controller1.userData.pos, XR.controller1.userData.dir );
};


/**
Set reference-space location (not the actual HMD camera location).
This can be used to move around the user, given a proper locomotion technique
@param {THREE.Vector3} p - the new location of reference space
*/
XR.setRefSpaceLocation = (p)=>{
    XR.rig.position.copy(p);
};

/* DEPRECATED
// Right
XR._setupControllerR = (C, bAddRep)=>{
    if (XR.controller0) return;

    XR.controller0 = C;
    console.log("R controller");

    // Main trigger
    C.addEventListener( 'selectstart', ()=>{
        //if (XR._handleUISelection()) return;

        ATON.fire("XRselectStart", XR.HAND_R);
    });
    C.addEventListener( 'selectend', ()=>{ 
        ATON.fire("XRselectEnd", XR.HAND_R);
    });

    // Squeeze
    C.addEventListener( 'squeezestart', ()=>{
        ATON.fire("XRsqueezeStart", XR.HAND_R);
    });
    C.addEventListener( 'squeezeend', ()=>{
        ATON.fire("XRsqueezeEnd", XR.HAND_R);
    });

    XR.setupControllerUI(XR.HAND_R, bAddRep);

    ATON.fire("XRcontrollerConnected", XR.HAND_R);
};

// Left
XR._setupControllerL = (C, bAddRep)=>{
    if (XR.controller1) return;

    XR.controller1 = C;
    console.log("L controller");

    // Main trigger
    C.addEventListener( 'selectstart',  ()=>{
        //if (XR._handleUISelection()) return;
        ATON.fire("XRselectStart", XR.HAND_L);
    });
    C.addEventListener( 'selectend',  ()=>{ 
        ATON.fire("XRselectEnd", XR.HAND_L);
    });

    // Squeeze
    C.addEventListener( 'squeezestart', ()=>{
        ATON.fire("XRsqueezeStart", XR.HAND_L);
    });
    C.addEventListener( 'squeezeend', ()=>{
        ATON.fire("XRsqueezeEnd", XR.HAND_L);
    });

    XR.setupControllerUI(XR.HAND_L, bAddRep);
    
    ATON.fire("XRcontrollerConnected", XR.HAND_L);
};
*/

XR.setupSceneForAR = ()=>{
    if (XR._sessionType !== "immersive-ar") return;

    ATON.recomputeSceneBounds();

    let C = ATON.bounds.center;
    ATON._rootVisible.position.x = -C.x;
    ATON._rootVisible.position.y = -C.y;
    ATON._rootVisible.position.z = -C.z;

    ATON._rootSem.position.x = -C.x;
    ATON._rootSem.position.y = -C.y;
    ATON._rootSem.position.z = -C.z;

    ATON.recomputeSceneBounds();
};

XR.resetSceneOffsets = ()=>{
    ATON._rootVisible.position.set(0,0,0);
    ATON._rootSem.position.set(0,0,0);

    ATON.recomputeSceneBounds();
};

// On XR session started
XR.onSessionStarted = ( session )=>{
    if (XR.currSession) return; // Session is already active
    XR._bReqPresenting = false;

	session.addEventListener( 'end', XR.onSessionEnded );
    //session.isImmersive = true;

    console.log(XR._sessionType + " session started.");

    //console.log(session);

    if (XR._sessionType === "immersive-ar"){
        ATON._renderer.xr.setReferenceSpaceType( 'local' );
        //ATON.toggleCenteredQuery(true);
    }
    else {
        //ATON._renderer.xr.setReferenceSpaceType( 'local' );
        session.isImmersive = true;
    }

    // If any streaming is ongoing, terminate it
    //ATON.MediaFlow.stopAllStreams();
    //ATON.rewindAllPlayingMedia();

    // Promised
	ATON._renderer.xr.setSession( session ).then(()=>{
        XR.currSession = session;
        console.log(XR.currSession);

        // AR session
        if (XR._sessionType === "immersive-ar"){

            ATON.UI.ARoverlay.style.display = '';

            ATON._mainRoot.background = null;
            if (ATON._mMainPano) ATON._mMainPano.visible = false;

            //XR.setupSceneForAR();

            // get xrRefSpace
            /*
            session.requestReferenceSpace('local').then((refSpace) => {
                xrRefSpace = refSpace.getOffsetReferenceSpace(new XRRigidTransform({x: 0, y: 1.5, z: 0}));
            });
            */
        }

        // VR session
        else {

            // reparent current camera to the XR rig
            XR.rig.add( ATON.Nav._camera );

            XR.setRefSpaceLocation(ATON.Nav._currPOV.pos);
            //console.log(ATON.Nav._currPOV.pos);
        }

        XR._cam = ATON._renderer.xr.getCamera(/*ATON.Nav._camera*/); //.cameras[0];
        if (XR._cam) ATON.Nav._updCamera( XR._cam );

        XR._bPresenting = true;
        ATON.Nav._bInteracting = false;

        console.log("XR now presenting");

        ATON.toggleShadows(false); // disable shadows for XR sessions

        // for immersive sessions we (re)set selector radius to 10cm
        if (ATON.SUI.getSelectorRadius() > 0.1) ATON.SUI.setSelectorRadius(0.1);

        //console.log(session);

        ATON._qSyncInt = 2; // Query interval (perf)

        if (ATON.XPFNetwork.getNumXPFs()>0) ATON.setQueryRange(0.0, 100.0);
        else ATON.setQueryRange(0.0, XR.MAX_QUERY_DISTANCE);

        ATON.MRes.estimateTSErrorTarget();

/*
        // FIXME: needed bc selector radius is not applied
        setTimeout( ()=>{
            //ATON.Utils.updateTSetsCamera();
            if (ATON.SUI.getSelectorRadius()>ATON.FE.STD_SEL_RAD) ATON.SUI.setSelectorRadius(ATON.FE.STD_SEL_RAD);
        }, 2000);
*/

        ATON.flushPendingAF();

        ATON.fire("XRmode", true);
    });
};

// On XR session terminated
XR.onSessionEnded = ( /*event*/ )=>{
    XR.currSession.removeEventListener( 'end', XR.onSessionEnded );
    XR.currSession = null;

    XR._bReqPresenting = false;

    XR._bPresenting = false;
    ATON.Nav._bInteracting = false;

    if (XR._sessionType === "immersive-ar"){
        //XR.resetSceneOffsets();

        if (ATON._mMainPano) ATON._mMainPano.visible = true;
        
        ATON.UI.ARoverlay.style.display = 'none';
    }

    //XR.rig.position.set(0.0,0.0,0.0);
    XR.setRefSpaceLocation( new THREE.Vector3(0,0,0) );

    ATON._qSyncInt = 1; // Query interval (unused)

    // If any streaming is ongoing, terminate it
    ATON.MediaFlow.stopAllStreams();

    ATON.Nav.requestHome();

    //ATON.Utils.updateTSetsCamera();
    ATON.Nav._updCamera();

    ATON.setQueryRange(0.0, Infinity);

    ATON.MRes.estimateTSErrorTarget();

    console.log("Quit XR");

    ATON.fire("XRmode", false);
};

/**
Toggle immersive VR/AR mode
@param {string} sessiontype - Can be "immersive-vr" or "immersive-ar", if undefined defaults to immersive VR
*/
XR.toggle = (sessiontype)=>{
    //if (XR._bReqPresenting) return; // Request in progress

    XR.setSessionType(sessiontype);

    //if (!ATON.device.xrSupported[XR._sessionType]) return;

    // Enter XR
    if (XR.currSession === null){
        XR._bReqPresenting = true;
        
        let sessionInit = {};
        sessionInit.optionalFeatures = [];

        //sessionInit.optionalFeatures.push("high-fixed-foveation-level");
        //sessionInit.optionalFeatures.push('hand-tracking');

/*
        let sessionInit = {
            optionalFeatures: [
                //"local",
                //"local-floor",
                ///"bounded-floor",

                //"hand-tracking",

                "high-refresh-rate",
                //"high-fixed-foveation-level",
            ]
        };
*/
        if (XR._sessionType === "immersive-ar"){

            //sessionInit.requiredFeatures = [ 'hit-test' ];
            //sessionInit.requiredFeatures.push("local-floor");
/*
            let overlay = document.createElement('div');
			overlay.style.display = 'none';
			document.body.appendChild( overlay );

            sessionInit.optionalFeatures.push( 'dom-overlay' );
            sessionInit.domOverlay = { root: overlay };
*/


            ATON.UI.setupARoverlay();
            sessionInit.optionalFeatures.push( "dom-overlay" );
            sessionInit.domOverlay = { root: ATON.UI.ARoverlay };

            //sessionInit.optionalFeatures.push("depth-sensing");
            //sessionInit.optionalFeatures.push("light-estimation");
        }

        navigator.xr.requestSession( XR._sessionType, sessionInit ).then( XR.onSessionStarted );
        //console.log(navigator.xr);
    }

    // Exit XR
    else {
        XR.currSession.end();
/*
        if (navigator.xr.offerSession !== undefined){
            navigator.xr.offerSession( XR._sessionType, sessionInit )
                .then( onSessionStarted )
                .catch( ( err ) => {
                    console.warn( err );
                });
        }
*/
    }
};

// DEPRECATED
XR.setupControllerUI = (h, bAddRep)=>{
    let raytick = 0.003;
    let raylen  = 1.0;

    let rhand = undefined;
    let lhand = undefined;

    //console.log("Setup controller "+h);
/*
    if (XR.gControllers === undefined){
        XR.gControllers = ATON.createUINode();

        XR.gControllers.disablePicking();
        XR.rig.add(XR.gControllers);
    }
*/
    // Left
    if (h === XR.HAND_L){
        XR.gControllers.add( XR.controller1 );

        if (bAddRep){
            lhand = ATON.createUINode("Lhand").load(XR._urlHand).setMaterial(ATON.MatHub.materials.controllerRay).setScale(-1,1,1);
            XR.controller1.add(lhand);
        }
    }
    // Right
    else {
        XR.gControllers.add( XR.controller0 );

        if (bAddRep){
            XR._pointerLineGeom = new THREE.CylinderGeometry( raytick,raytick, raylen, 4 );
            //XR._pointerLineGeom = new THREE.CylinderGeometry( raytick,raytick, raylen, 4 );

            XR._pointerLineGeom.rotateX( -Math.PI / 2 );
            XR._pointerLineGeom.translate(0,0,-(raylen*0.5));

            XR._pointerLineMesh = new THREE.Mesh( XR._pointerLineGeom, ATON.MatHub.materials.controllerRay );
            XR.controller0.add( /*mesh.clone()*/ XR._pointerLineMesh );
            XR._pointerLineMesh.visible = false;
        
            rhand = ATON.createUINode("Rhand").load(XR._urlHand).setMaterial(ATON.MatHub.materials.controllerRay);
            XR.controller0.add(rhand);
        }
    }

    // We are connected to Photon
    if (ATON.Photon.uid !== undefined && bAddRep){
        let avMats = ATON.MatHub.materials.avatars;
        let am = avMats[ATON.Photon.uid % avMats.length];
        if (h === XR.HAND_L) lhand.setMaterial(am);
        else rhand.setMaterial(am);
    }
};


/* DEPRECATED
XR.setupControllersUI = ()=>{
    if (XR.gControllers) return; // already set

    let raytick = 0.003;
    let raylen  = 5.0;
    var geometry = new THREE.CylinderBufferGeometry( raytick,raytick, raylen, 4 );
    geometry.rotateX( -Math.PI / 2 );
    geometry.translate(0,0,-(raylen*0.5));

    var mesh = new THREE.Mesh( geometry, ATON.MatHub.materials.controllerRay );

    XR.controller0.add( mesh.clone() );
    //XR.controller1.add( mesh.clone() );

    let vrcMatHands = (uid)=>{
        let avMats = ATON.MatHub.materials.avatars;
        if (avMats === undefined || uid === undefined) return;
        
        let am = avMats[uid % avMats.length];
        rhand.setMaterial( am );
        lhand.setMaterial( am );
    };

    // Hands
    let handurl = ATON.PATH_RES+"models/hand/hand.glb";
    let rhand = ATON.createUINode("Rhand").load(handurl).setMaterial(ATON.MatHub.materials.controllerRay);
    let lhand = ATON.createUINode("Lhand").load(handurl).setMaterial(ATON.MatHub.materials.controllerRay).setScale(-1,1,1);
    XR.controller0.add(rhand);
    XR.controller1.add(lhand);

    if (ATON.VRoadcast.uid) vrcMatHands(ATON.VRoadcast.uid);
    ATON.on("VRC_IDassigned", vrcMatHands);

    XR.gControllers = ATON.createUINode();
    XR.gControllers.add( XR.controller0 );
    XR.gControllers.add( XR.controller1 );

    XR.controller0.visible = false;
    XR.controller1.visible = false;

    XR.gControllers.disablePicking();

    XR.rig.add(XR.gControllers);
};
*/

//
XR.getControllerSpace = (i)=>{
   if (i === 1) return XR.controllerGrip1;
   else return XR.controllerGrip0;
};

/**
Get controller world location
@param {number} hand - the hand (ATON.XR.HAND_PRIMARY or ATON.XR.HAND_SECONDARY)
@returns {THREE.Vector3}
*/
XR.getControllerWorldLocation = (hand)=>{
    if (hand===XR.HAND_PRIMARY) return XR._cPrimary.userData.pos;
    else return XR._cSecondary.userData.pos;
/*
    if (i === 1) return XR.controller1.userData.pos;
    else return XR.controller0.userData.pos;
*/
};

/**
Get controller world direction
@param {number} hand - the hand (ATON.XR.HAND_PRIMARY or ATON.XR.HAND_SECONDARY)
@returns {THREE.Vector3}
*/
XR.getControllerWorldDirection = (hand)=>{
    if (hand===XR.HAND_PRIMARY) return XR._cPrimary.userData.dir;
    else return XR._cSecondary.userData.dir;
};

/**
Get controller world orientation
@param {number} hand - the hand (ATON.XR.HAND_PRIMARY or ATON.XR.HAND_SECONDARY)
@returns {THREE.Quaternion}
*/
XR.getControllerWorldOrientation = (hand)=>{
    let Q = new THREE.Quaternion();

    if (hand===XR.HAND_PRIMARY) XR._cPrimary.getWorldQuaternion(Q);
    else XR._cSecondary.getWorldQuaternion(Q);

    return Q;
};

/*
XR._deltaMotionController = (C)=>{
    if (C === XR.HAND_L && XR._lastPosL === undefined) return;
    if (C === XR.HAND_R && XR._lastPosR === undefined) return;

    let p    = (C === XR.HAND_L)? XR.controller1pos : XR.controller0pos;
    let prev = (C === XR.HAND_L)? XR._lastPosL : XR._lastPosR;

    let D = THREE.Vector3(
        p.x - prev.x,
        p.y - prev.y,
        p.z - prev.z
    );

    let m = D.lengthSq();

    if (C === XR.HAND_L) XR._lastPosL = p;
    else XR._lastPosR = p;
};
*/

XR.update = ()=>{
    // XR-cam
/*
    if (!XR._cam){
        XR._cam = ATON._renderer.xr.getCamera(ATON.Nav._camera);
        if (XR._cam) ATON.Nav._updCamera( XR._cam );
    }
*/
    if (XR._bGaze) return;
    //if (XR._sessionType==="immersive-ar") return;

    // R controller
    if (XR.controller0 && XR.controller0.visible){
        XR.controller0.getWorldPosition(XR.controller0.userData.pos);
        XR.controller0.getWorldDirection(XR.controller0.userData.dir);
        XR.controller0.userData.dir.negate();

        //XR._deltaMotionController(XR.HAND_R);
    }
    // L controller
    if (XR.controller1 && XR.controller1.visible){
        XR.controller1.getWorldPosition(XR.controller1.userData.pos);
        XR.controller1.getWorldDirection(XR.controller1.userData.dir);
        XR.controller1.userData.dir.negate(); 

        //XR._deltaMotionController(XR.HAND_L);
    }

/*
    if (XR.gpad0 && XR.gpad0.buttons){
        //if (XR.gpad0.buttons[1] && XR.gpad0.buttons[1].pressed) ATON.fire("XRsqueezePressed", 0);
        if (XR.gpad0.buttons[4] && XR.gpad0.buttons[4].pressed) ATON.fire("XRbuttonAPressed");
        if (XR.gpad0.buttons[5] && XR.gpad0.buttons[5].pressed) ATON.fire("XRbuttonBPressed");
    }

    if (XR.gpad1 && XR.gpad1.buttons){
        //if (XR.gpad1.buttons[1] && XR.gpad1.buttons[1].pressed) ATON.fire("XRsqueezePressed", 1);
        if (XR.gpad1.buttons[4] && XR.gpad1.buttons[4].pressed) ATON.fire("XRbuttonXPressed");
        if (XR.gpad1.buttons[5] && XR.gpad1.buttons[5].pressed) ATON.fire("XRbuttonYPressed");
    }
*/
};

// Get VR controller axes values
XR.getAxisValue = (hand)=>{
    let V = new THREE.Vector2(0.0,0.0);

    let C = (hand===XR.HAND_PRIMARY)? XR.getPrimaryController() : XR.getSecondaryController();

    const gm = C.userData.gm;

    if (!gm || !gm.axes) return V;

    let x0 = gm.axes[0];
    let x1 = gm.axes[2];

    let y0 = gm.axes[1];
    let y1 = gm.axes[3];

    V.x = (x0 > 0.0)? -x0 : x1;
    V.y = (y0 > 0.0)? y0 : -y1;

    return V;
};

export default XR;