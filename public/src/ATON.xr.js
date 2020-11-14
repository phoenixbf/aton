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


//Initializes XR component
XR.init = ()=>{
    ATON._renderer.xr.enabled = true;
    ATON._renderer.xr.setReferenceSpaceType( 'local' );
    
    if (ATON.device.isMobile) ATON._renderer.xr.setFramebufferScaleFactor(0.5); // WebXR density

    XR._bPresenting = false;
    XR.currSession = null;

    XR.rig = new THREE.Group();
    //XR.rig.position.set(0,0,0);
    XR.rig.add( ATON.Nav._camera );
    ATON._rootUI.add(XR.rig);

    //XR.hmdOri = new THREE.Quaternion();
    //XR.hmdPos = new THREE.Vector3();

    XR._currPos = XR.rig.position; //new THREE.Vector3();
    XR._fromPos = new THREE.Vector3();
    XR._reqPos  = new THREE.Vector3();

    XR.gControllers = undefined;

    XR.controller0pos = new THREE.Vector3();
    XR.controller1pos = new THREE.Vector3();
    XR.controller0dir = new THREE.Vector3();
    XR.controller1dir = new THREE.Vector3();

    XR._lastPosR = undefined;
    XR._lastPosL = undefined;

    XR.gpad0 = undefined;
    XR.gpad1 = undefined;

    XR._urlHand = ATON.PATH_RES+"models/hand/hand.glb";

    // Base ev
    ATON.on("XRselectStart", (c)=>{
        if (c === XR.HAND_R) XR.defaultSelectHandler(c);
    });
    ATON.on("XRselectEnd", (c)=>{
        //ATON.Nav.stop();
        //console.log("Sel end "+c);
    });

    ATON.on("XRsqueezeStart", (c)=>{
        console.log("Squeeze "+c);
    });

    ATON.on("VRC_IDassigned", (uid)=>{
        let rh = ATON.getUINode("Rhand");
        let lh = ATON.getUINode("Lhand");

        let avMats = ATON.MatHub.materials.avatars;
        let am = avMats[uid % avMats.length];
        if (lh) lh.setMaterial(am);
        if (rh) rh.setMaterial(am);
    });
};

/**
Return true if we are presenting (immersive mode)
@returns {boolean}
*/
XR.isPresenting = ()=>{
    return XR._bPresenting;
};


XR.defaultSelectHandler = (c)=>{

    if (ATON._queryDataScene){
        let P = ATON._queryDataScene.p;
        let N = ATON._queryDataScene.n;

        //P.y += 0.8; // with 'local': half user height

        // FIXME: height offset needed for "local", fill this automatically
        if (N.y > 0.7) ATON.Nav.requestPOV( new ATON.POV().setPosition(P.x, P.y + ATON.userHeight, P.z), XR.STD_TELEP_DURATION );
    }

    ATON.FE.playAudioFromSemanticNode(ATON._hoveredSemNode);
    
    //ATON.Nav.setMotionAmount(3.0);
};

XR._handleUISelection = ()=>{
    if (ATON._hoveredUI === undefined) return false;

    let H = ATON.getUINode(ATON._hoveredUI);
    if (H && H.onSelect) H.onSelect();
    
    return true;
}


/**
Set reference-space location (not the actual HMD camera location).
This can be used to move around the user, given a proper locomotion technique
@param {THREE.Vector3} p - the new location of reference space
*/
XR.setRefSpaceLocation = (p)=>{
    XR.rig.position.copy(p);
};

// Right
XR._setupControllerR = (C)=>{
    if (XR.controller0) return;

    XR.controller0 = C;
    console.log("R controller");

    // Main trigger
    C.addEventListener( 'selectstart', ()=>{
        if (XR._handleUISelection()) return;

        ATON.fireEvent("XRselectStart", XR.HAND_R);
    });
    C.addEventListener( 'selectend', ()=>{ 
        ATON.fireEvent("XRselectEnd", XR.HAND_R);
    });

    // Squeeze
    C.addEventListener( 'squeezestart', ()=>{
        ATON.fireEvent("XRsqueezeStart", XR.HAND_R);
    });
    C.addEventListener( 'squeezeend', ()=>{
        ATON.fireEvent("XRsqueezeEnd", XR.HAND_R);
    });

    XR.setupControllerUI(XR.HAND_R);
    ATON.fireEvent("XRcontrollerConnected", XR.HAND_R);
};

// Left
XR._setupControllerL = (C)=>{
    if (XR.controller1) return;

    XR.controller1 = C;
    console.log("L controller");

    // Main trigger
    C.addEventListener( 'selectstart',  ()=>{
        //if (XR._handleUISelection()) return;
        ATON.fireEvent("XRselectStart", XR.HAND_L);
    });
    C.addEventListener( 'selectend',  ()=>{ 
        ATON.fireEvent("XRselectEnd", XR.HAND_L);
    });

    // Squeeze
    C.addEventListener( 'squeezestart', ()=>{
        ATON.fireEvent("XRsqueezeStart", XR.HAND_L);
    });
    C.addEventListener( 'squeezeend', ()=>{
        ATON.fireEvent("XRsqueezeEnd", XR.HAND_L);
    });

    XR.setupControllerUI(XR.HAND_L);
    ATON.fireEvent("XRcontrollerConnected", XR.HAND_L);
};


// On XR session started
XR.onSessionStarted = ( session )=>{
	session.addEventListener( 'end', XR.onSessionEnded );

	ATON._renderer.xr.setSession( session );
	XR.currSession = session;

    let C0 = ATON._renderer.xr.getController(0);
    let C1 = ATON._renderer.xr.getController(1);

    console.log(C0);
    //ATON.VRoadcast.log(JSON.stringify(C0));

    // Controller 0
    if (C0){
        C0.visible = false;

        C0.addEventListener( 'connected', (e) => {
            C0.gamepad = e.data.gamepad;
            //console.log(XR.controller0.gamepad);

            //ATON.VRoadcast.log(JSON.stringify(e));

            //let gp = C0.gamepad;
            //if (gp.pose && gp.pose.hasPosition) C0.visible = true;

/*          FIXME:
            let h = gp.hand;
            console.log(gp);
            if (h === "right" || h === undefined) XR._setupControllerR(C0);
            else if (h === "left") XR._setupControllerL(C0);
*/
            XR._setupControllerR(C0);
        });
    }

    // Controller 1
    if (C1){
        C1.visible = false;

        C1.addEventListener( 'connected', (e) => {
            C1.gamepad = e.data.gamepad;
            
            //let gp = C1.gamepad;
            //if (gp.pose && gp.pose.hasPosition) C1.visible = true;

/*          FIXME:
            if (gp.hand === "right" || gp.hand === undefined) XR._setupControllerR(C1);
            else if (gp.hand === "left") XR._setupControllerL(C1);
*/
            XR._setupControllerL(C1);
        });

    }

    XR.setRefSpaceLocation(ATON.Nav._currPOV.pos);

    XR._bPresenting = true;
    console.log("XR now presenting");

    //XR.setupControllersUI();

    ATON.fireEvent("XRmode", true);

    //console.log(session);
};

// On XR session terminated
XR.onSessionEnded = ( /*event*/ )=>{
    XR.currSession.removeEventListener( 'end', XR.onSessionEnded );
    XR.currSession = null;

    XR._bPresenting = false;
    //XR.rig.position.set(0.0,0.0,0.0);
    XR.setRefSpaceLocation( new THREE.Vector3(0,0,0) );

    ATON.fireEvent("XRmode", false);

    console.log("Quit XR");
};

/**
Toggle immersive mode
*/
XR.toggle = ()=>{
    if (!ATON.device.isXRsupported) return;

    // Enter XR
    if (XR.currSession === null){
        let sessionInit = { 
            optionalFeatures: [
                "local",
                //"local-floor" 
                ///"bounded-floor"
            ]
        };
        navigator.xr.requestSession( 'immersive-vr', sessionInit ).then( XR.onSessionStarted );
        //console.log(navigator.xr);
    }
    // Exit XR
    else {
        XR.currSession.end();
    }
};

XR.setupControllerUI = (h)=>{
    let raytick = 0.003;
    let raylen  = 5.0;

    let rhand = undefined;
    let lhand = undefined;

    //console.log("Setup controller "+h);

    if (XR.gControllers === undefined){
        XR.gControllers = ATON.createUINode();

        XR.gControllers.disablePicking();
        XR.rig.add(XR.gControllers);
    }

    // Left
    if (h === XR.HAND_L){
        XR.gControllers.add( XR.controller1 );

        lhand = ATON.createUINode("Lhand").load(XR._urlHand).setMaterial(ATON.MatHub.materials.controllerRay).setScale(-1,1,1);
        XR.controller1.add(lhand);
    }
    // Right
    else {
        var geometry = new THREE.CylinderBufferGeometry( raytick,raytick, raylen, 4 );
        geometry.rotateX( -Math.PI / 2 );
        geometry.translate(0,0,-(raylen*0.5));

        var mesh = new THREE.Mesh( geometry, ATON.MatHub.materials.controllerRay );

        XR.controller0.add( mesh.clone() );
        XR.gControllers.add( XR.controller0 );

        rhand = ATON.createUINode("Rhand").load(XR._urlHand).setMaterial(ATON.MatHub.materials.controllerRay);

        XR.controller0.add(rhand);
    }

    // We are connected to VRoadcast
    if (ATON.VRoadcast.uid){
        let avMats = ATON.MatHub.materials.avatars;
        let am = avMats[ATON.VRoadcast.uid % avMats.length];
        if (h === XR.HAND_L) lhand.setMaterial(am);
        else rhand.setMaterial(am);
    }
};

// FIXME:
XR.switchHands = ()=>{

/*
    let C0 = new THREE.Group();
    for (let cr in XR.controller0.children){
        C0.add(XR.controller0.children[cr]);
    }

    let C1 = new THREE.Group();
    for (let cl in XR.controller1.children){
        C1.add(XR.controller1.children[cl]);
    }

    //XR.controller1.removeChildren();
    //XR.controller0.removeChildren();

    return;

    for (let c in C1.children){
        XR.controller0.add(C1.children[c]);
    }
    for (let c in C0.children){
        XR.controller1.add(C0.children[c]);
    }
*/
    let H = XR.controller1;
    XR.controller1 = XR.controller0;
    XR.controller0 = H;

    //XR.controller0 = ATON._renderer.xr.getController(1);
    //XR.controller1 = ATON._renderer.xr.getController(0);

    for (let c in XR.controller0.children) XR.controller0.remove(XR.controller0.children[c]);
    for (let c in XR.controller1.children) XR.controller1.remove(XR.controller1.children[c]);
    XR.gControllers.removeChildren();

    XR.setupControllerUI(XR.HAND_L);
    XR.setupControllerUI(XR.HAND_R);

    console.log("VR controllers switched");
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

// Not working
XR.getControllerSpace = (i)=>{
   if (i === 1) XR.getControllerGrip(1);
   else XR.getControllerGrip(0);
};

/**
Get controller world location
@param {number} i - the controller ID (0 or 1)
@returns {THREE.Vector3}
*/
XR.getControllerWorldLocation = (i)=>{
    if (i === 1) return XR.controller1pos;
    else return XR.controller0pos;
};

/**
Get controller world direction
@param {number} i - the controller ID (0 or 1)
@returns {THREE.Vector3}
*/
XR.getControllerWorldDirection = (i)=>{
    if (i === 1) return XR.controller1dir;
    else return XR.controller0dir;
};

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

XR.update = ()=>{
    // R controller
    if (XR.controller0 && XR.controller0.visible){
        XR.controller0.getWorldPosition(XR.controller0pos);
        XR.controller0.getWorldDirection(XR.controller0dir);
        XR.controller0dir.negate();

        XR._deltaMotionController(XR.HAND_R);
    }
    // L controller
    if (XR.controller1 && XR.controller1.visible){
        XR.controller1.getWorldPosition(XR.controller1pos);
        XR.controller1.getWorldDirection(XR.controller1dir);
        XR.controller1dir.negate(); 

        XR._deltaMotionController(XR.HAND_L);
    }

/*
    if (XR.gpad0 && XR.gpad0.buttons){
        //if (XR.gpad0.buttons[1] && XR.gpad0.buttons[1].pressed) ATON.fireEvent("XRsqueezePressed", 0);
        if (XR.gpad0.buttons[4] && XR.gpad0.buttons[4].pressed) ATON.fireEvent("XRbuttonAPressed");
        if (XR.gpad0.buttons[5] && XR.gpad0.buttons[5].pressed) ATON.fireEvent("XRbuttonBPressed");
    }

    if (XR.gpad1 && XR.gpad1.buttons){
        //if (XR.gpad1.buttons[1] && XR.gpad1.buttons[1].pressed) ATON.fireEvent("XRsqueezePressed", 1);
        if (XR.gpad1.buttons[4] && XR.gpad1.buttons[4].pressed) ATON.fireEvent("XRbuttonXPressed");
        if (XR.gpad1.buttons[5] && XR.gpad1.buttons[5].pressed) ATON.fireEvent("XRbuttonYPressed");
    }
*/
};


export default XR;