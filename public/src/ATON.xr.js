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


XR.isPresenting = ()=>{
    return XR._bPresenting;
};

/**
Initializes XR component
@function
*/
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

    // test
    ATON.on("XRselectStart", (c)=>{
        XR.defaultSelectHandler(c);
    });
    ATON.on("XRselectEnd", (c)=>{
        //ATON.Nav.stop();
        //console.log("Sel end "+c);
    });
};

XR.defaultSelectHandler = (c)=>{

    if (ATON._queryDataScene){
        let P = ATON._queryDataScene.p;
        let N = ATON._queryDataScene.n;

        //P.y += 0.8; // with 'local': half user height

        // FIXME: height offset needed for "local", fill this automatically
        if (N.y > 0.7) ATON.Nav.requestPOV( new ATON.POV().setPosition(P.x, P.y + ATON.userHeight, P.z), XR.STD_TELEP_DURATION );
    }
    
    //ATON.Nav.setMotionAmount(3.0);
};

XR._handleUISelection = ()=>{
    if (ATON._hoveredUI === undefined) return false;

    let H = ATON.getUINode(ATON._hoveredUI);
    if (H && H.onSelect) H.onSelect();
    
    return true;
}


// Set reference-space location (not the actual HMD camera location)
// this can be used to move around the user, given a proper locomotion technique
XR.setRefSpaceLocation = (p)=>{
    XR.rig.position.copy(p);
};

// On XR session started
XR.onSessionStarted = ( session )=>{
	session.addEventListener( 'end', XR.onSessionEnded );

	ATON._renderer.xr.setSession( session );
	XR.currSession = session;

    XR.controller0 = ATON._renderer.xr.getController(0);
    XR.controller1 = ATON._renderer.xr.getController(1);

    //console.log(XR.controller0);

    // Controller 0
    if (XR.controller0){
        XR.controller0.visible = false;

        XR.controller0.addEventListener( 'connected', (e) => {
            XR.controller0.gamepad = e.data.gamepad;
            //console.log(XR.controller0.gamepad);

            let gp = XR.controller0.gamepad;
            if (gp.pose && gp.pose.hasPosition) XR.controller0.visible = true;
        });

        XR.controller0.addEventListener( 'selectstart', ()=>{
            if (XR._handleUISelection()) return;

            ATON.fireEvent("XRselectStart", 0);
        });
        XR.controller0.addEventListener( 'selectend', ()=>{ 
            ATON.fireEvent("XRselectEnd", 0);
        });
    }

    // Controller 1
    if (XR.controller1){
        XR.controller1.visible = false;

        XR.controller1.addEventListener( 'connected', (e) => {
            //XR.controller1.visible = true;
            XR.controller1.gamepad = e.data.gamepad;
            
            let gp = XR.controller1.gamepad;
            if (gp.pose && gp.pose.hasPosition) XR.controller1.visible = true;
        });

        XR.controller1.addEventListener( 'selectstart',  ()=>{
            //if (XR._handleUISelection()) return;
        
            ATON.fireEvent("XRselectStart", 1);
        });
        XR.controller1.addEventListener( 'selectend',  ()=>{ 
            ATON.fireEvent("XRselectEnd", 1);
        });
    }

    XR.setRefSpaceLocation(ATON.Nav._currPOV.pos);

    XR._bPresenting = true;
    console.log("XR now presenting");

    XR.setupControllersUI();

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

XR.setupControllersUI = ()=>{
    if (XR.gControllers) return; // already set

    var geometry = new THREE.CylinderBufferGeometry( 0.003,0.003, 10.0, 5 );
    geometry.rotateX( -Math.PI / 2 );
    geometry.translate(0,0,-5);

    var mesh = new THREE.Mesh( geometry, ATON.MatHub.materials.controllerRay );

    XR.controller0.add( mesh.clone() );
    //XR.controller1.add( mesh.clone() );

    XR.gControllers = ATON.createUINode();
    XR.gControllers.add( XR.controller0 );
    XR.gControllers.add( XR.controller1 );

    XR.controller0.visible = false;
    XR.controller1.visible = false;

    XR.gControllers.disablePicking();

    XR.rig.add(XR.gControllers);
};

// Not working
XR.getControllerSpace = (i)=>{
   if (i === 1) XR.getControllerGrip(1);
   else XR.getControllerGrip(0);
};

XR.getControllerWorldLocation = (i)=>{
    if (i === 1) return XR.controller1pos;
    else return XR.controller0pos;
};

XR.getControllerWorldDirection = (i)=>{
    if (i === 1) return XR.controller1dir;
    else return XR.controller0dir;
};

XR.update = ()=>{
    if (XR.controller0.visible){
        XR.controller0.getWorldPosition(XR.controller0pos);
        XR.controller0.getWorldDirection(XR.controller0dir);
        XR.controller0dir.negate();
    }
    if (XR.controller1.visible){
        XR.controller1.getWorldPosition(XR.controller1pos);
        XR.controller1.getWorldDirection(XR.controller1dir);
        XR.controller1dir.negate(); 
    }
};


export default XR;