/*
    ATON Navigation system

    author: bruno.fanini_AT_gmail.com

===========================================================*/
import LocomotionNode from "./ATON.locnode.js";
import DevOri from "./ATON.devori.js";

const COSINOIDAL_DIST = function(x){ return (1.0 - Math.cos(x * Math.PI)) / 2.0; };

/**
ATON Navigation system
@namespace Nav
*/
let Nav = {};

// Consts
Nav.STD_FOV  = 50.0;
Nav.STD_NEAR = 0.01; //0.05;
Nav.STD_FAR  = 1000.0;
//Nav.STD_FAR  = 10000.0;

Nav.FP_EPS = 0.01;
Nav.STD_POV_TRANS_DURATION = 2.0;

Nav.STD_LOCNODE_SIZE = 0.5; //0.3;

Nav.MIN_LOC_VALID_DIST = 1.5; // Locomotion validator default distance to consider "too close"

// Non-immersive navigation controls
Nav.MODE_ORBIT  = 0;
Nav.MODE_FP     = 1;
Nav.MODE_DEVORI = 2;

Nav.LocomotionNode = LocomotionNode;

Nav.STD_LOC_VALIDATOR = ()=>{
    if (ATON._queryDataScene === undefined){
        Nav._bValidLocomotion = false;
        return;
    }

    let qs = ATON._queryDataScene;

    let P = qs.p;
    let N = qs.n;
    let d = qs.d;

    if (d <= Nav.MIN_LOC_VALID_DIST){ // too close
        Nav._bValidLocomotion = false;
        return;     
    }

    if (!N){ // invalid normal
        Nav._bValidLocomotion = false;
        return;  
    }

    if (N.y <= 0.7){ // slope
        Nav._bValidLocomotion = false;
        return;
    }

    Nav._bValidLocomotion = true;
};


//Initialize nav system
Nav.init = ()=>{
    Nav._mode = undefined;
    Nav.POVtransitionDuration = Nav.STD_POV_TRANS_DURATION;

    Nav._rotSpeedOrbit = 0.4;
    Nav._rotSpeedFP    = -0.2;
    Nav._inertia       = 0.08; // 0.0 = disabled

    Nav._bControl = true; // user control

    Nav._bLocValidator = true; // use locomotion validator

    Nav._bInteracting = false;

    // Setup controls
    //Nav._camera = new THREE.PerspectiveCamera( Nav.STD_FOV, window.innerWidth / window.innerHeight, Nav.STD_NEAR, Nav.STD_FAR );
    //Nav._camera.layers.enableAll();
    //Nav._controls = new THREE.OrbitControls( Nav._camera, ATON._renderer.domElement);

    Nav._prevMode = undefined;
    Nav.setOrbitControl();

    // POV data
    Nav._currPOV = new ATON.POV().setPosition(0,0,0).setTarget(1,0,0).setFOV(ATON.Nav.STD_FOV); // holds current viewpoint data (eye, target, etc...)
    Nav._fromPOV = new ATON.POV(); // initial POV when requesting a transition
    Nav._reqPOV  = new ATON.POV(); // requested POV for transition

    Nav.homePOV = undefined; //new ATON.POV();

    Nav._tPOVcall = -1.0;
    Nav._tPOVprogress = 0.0;

    Nav.povlist = {}; // This will handle registered POVs

    // World direction and orientation (quat)
    // consistent within standard and immersive XR
    Nav._vDir = new THREE.Vector3(1,0,0);
    Nav._qOri = new THREE.Quaternion();

    // TODO: delta motions
    Nav._lastPos = new THREE.Vector3(0,0,0);
    Nav._lastOri = new THREE.Quaternion();

    Nav._dOri = 0.0;
    Nav._dPos = 0.0;

    // Motion
    Nav._motionAmt = 0.0;
    Nav._motionDir = new THREE.Vector3(0,1,0);

    // Queried scene location is valid for locomotion
    Nav._bValidLocomotion = false;

    // Locomotion Graph
    Nav._locNodes = [];
    Nav._prevLN = undefined;
};

/**
Get current eye location, consistent within standard and immersive XR sessions.
@returns {THREE.Vector3}
@example
let p = ATON.Nav.getCurrentEyeLocation();
*/
Nav.getCurrentEyeLocation = ()=>{
    return Nav._currPOV.pos;
};

/**
Get current view direction (normalized). Consistent within standard and immersive XR sessions.
@returns {THREE.Vector3}
@example
let d = ATON.Nav.getCurrentDirection();
*/
Nav.getCurrentDirection = ()=>{
    return Nav._vDir;
};

/**
Grab a copy of current POV.
@returns {POV}
@example
let pov = ATON.Nav.copyCurrentPOV();
*/
Nav.copyCurrentPOV = ()=>{
    let pov = new ATON.POV();
    pov.pos.copy(Nav._currPOV.pos);
    pov.target.copy(Nav._currPOV.target);
    pov.fov = Nav._currPOV.fov;

    return pov;
};

/**
Add a viewpoint (POV)

@param {POV} pov - the POV object
@param {string} id - (optional) assign an ID to this POV
*/
Nav.addPOV = (pov, id)=>{
    if (pov === undefined) return;

    pov.as(id);
    return pov;
};

/**
Clear all viewpoints (POVs)
*/
Nav.clearPOVs = ()=>{
    for (let p in ATON.Nav.povlist){
        delete Nav.povlist[p];
    }
};

/**
Return true if the navigation system is currently performing a transition
@returns {boolean}
*/
Nav.isTransitioning = ()=>{
    if (Nav._tPOVcall >= 0.0) return true;
    return false;
};

/**
Return true if currently queried scene location is valid for locomotion
@returns {boolean}
*/
Nav.currentQueryValidForLocomotion = ()=>{
    return Nav._bValidLocomotion;
};

/**
This is used to validate current queried location for locomotion.
By default, we exploit surface normal to determine if we can move there or not.
You can replace this function with your own locomotion validator.
*/
Nav.locomotionValidator = Nav.STD_LOC_VALIDATOR;

Nav.toggleLocomotionValidator = (b)=>{
    if (b) Nav._bLocValidator = true;
    else {
        Nav._bLocValidator    = false;
        Nav._bValidLocomotion = false;
    }
};

/**
Add a locomotion node
They are useful to restrict or constrain navigation into specific 3D locations
@param {number} x
@param {number} y
@param {number} z
@param {boolean} bSUI - (optional) realize Spatial UI for this locomotion node
*/
Nav.addLocomotionNode = (x,y,z, bSUI)=>{
    let LN = new Nav.LocomotionNode().setLocation(x,y,z);
    if (bSUI) LN.realizeSUI();

    Nav._locNodes.push(LN);

    ATON.fire("LocomotionNodeAdded", LN);
    return LN;
};

/**
Get locomotion node by index
@param {number} i - Locomotion Node index
@returns {LocomotionNode}
*/
Nav.getLocomotionNodeByIndex = (i)=>{
    return Nav._locNodes[i];
};

/**
Remove all locomotion nodes
*/
Nav.clearLocomotionNodes = ()=>{
    Nav._locNodes = [];
    Nav._prevLN = undefined;
    
    if (ATON.SUI.gLocNodes) ATON.SUI.gLocNodes.removeChildren();
};

// index
Nav.getLocomotionNodeInSight = ()=>{
    let numLN = Nav._locNodes.length;
    if (numLN <= 0) return undefined;

    if (Nav.isTransitioning()) return undefined;

    let E = Nav._currPOV.pos;
    let V = Nav._vDir;

    let LN = undefined;
    let mindist = undefined;

    if (Nav._dirLNode === undefined) Nav._dirLNode = new THREE.Vector3();

    for (let i=0; i<numLN; i++){
        Nav._posLNode = Nav._locNodes[i].pos;

        Nav._dirLNode.x = Nav._posLNode.x - E.x;
        Nav._dirLNode.y = Nav._posLNode.y - E.y;
        Nav._dirLNode.z = Nav._posLNode.z - E.z;
        Nav._dirLNode   = Nav._dirLNode.normalize();

        let v = Nav._dirLNode.dot(V);
        if (v > 0.8){
            let d = E.distanceToSquared(Nav._posLNode);

            if (d > 0.3 && (mindist === undefined || d < mindist)){
                mindist = d;
                LN      = i;
                //console.log(LN);
            }
        }
    }

    return LN;
};

/**
Request transition to a locomotion node
@param {LocomotionNode} lnode - locomotion node object
@param {number} duration - (optional) transition duration in seconds
*/
Nav.requestTransitionToLocomotionNode = (lnode, duration)=>{
    if (lnode === undefined) return;
    if (Nav._mode === Nav.MODE_ORBIT) return; // only first-person modes

    let currDir = ATON.Nav._vDir;

    let POV = new ATON.POV()
        .setPosition(lnode.pos)
        .setTarget(
            lnode.pos.x + currDir.x,
            lnode.pos.y + currDir.y, 
            lnode.pos.z + currDir.z
        )
        .setFOV(Nav._currPOV.fov);

    lnode.toggleSUI(false);
    if (Nav._prevLN !== undefined) Nav._prevLN.toggleSUI(true);

    Nav.requestPOV(POV, duration);

    Nav._prevLN = lnode;

    ATON.fire("LocomotionNodeRequested", lnode);
};

/**
Request transition to next locomotion node in sight, if any
If we have an active XPF network, we use its logic 
@param {number} duration - (optional) transition duration in seconds
*/
Nav.requestTransitionToLocomotionNodeInSightIfAny = (duration)=>{
    // If we have an active XPF network, use its logic
    let x = ATON.XPFNetwork.getNextXPFindex();
    if (x !== undefined){
        Nav.requestTransitionToLocomotionNode(ATON.XPFNetwork._list[x]._lnode, duration);
        return true;
    }

    // No XPF network
    let i = ATON.Nav.getLocomotionNodeInSight();
    if (i === undefined) return false;

    let lnode = Nav._locNodes[i];
    Nav.requestTransitionToLocomotionNode(lnode, duration);

    return true;
};

/**
Request delta rotation of current viewpoint, typically used in first person mode
@param {number} hor - factor [-1,1] for horizontal delta rotation (positive: right, negative: left)
@param {number} vert - factor [-1,1] for vertical delta rotation (positive: up, negative: down)
@param {number} duration - (optional) transition duration in seconds
*/
Nav.requestDeltaRotation = (hor,vert, duration)=>{
    if (ATON.XR._bPresenting) return;

    let S = new THREE.Vector3();
    let T = new THREE.Vector3();

    S.crossVectors(Nav._vDir, THREE.Object3D.DEFAULT_UP); // Nav._camera.up

    T.x = Nav._currPOV.target.x + (S.x * hor);
    T.y = Nav._currPOV.target.y + vert;
    T.z = Nav._currPOV.target.z + (S.z * hor);

    let P = new ATON.POV();
    P.setTarget(T);
    P.setPosition(ATON.Nav._currPOV.pos);

    ATON.Nav.requestPOV(P, duration);
};


/**
Enable/disable user navigation control
@param {boolean} b - false to lock controls, true to unlock
*/
Nav.setUserControl = (b)=>{
    if (b === undefined) return;
    if (b === Nav._bControl) return;

    Nav._bControl = b;

    if (Nav._controls !== undefined) Nav._controls.enabled = b;

    if (Nav._cOrbit) Nav._cOrbit.enabled = b;
    if (Nav._cFirstPerson) Nav._cFirstPerson.enabled = b;

    console.log("Nav controls: "+Nav._bControl);
};

/**
Toggle user control
*/
Nav.toggleUserControl = ()=>{
    Nav.setUserControl(!Nav._bControl);
};

/**
Return true if navigation controls are enabled (i.e. the user can control the camera)
@returns {boolean}
*/
Nav.isUserControlEnabled = ()=>{
    return Nav._bControl;
};

/**
Return true if the navigation system is in Orbit mode
@returns {boolean}
*/
Nav.isOrbit = ()=>{
    if (ATON.XR._bPresenting) return false;

    if (Nav._mode === Nav.MODE_ORBIT) return true;
    return false;
};

/**
Return true if the navigation system is in First-person mode
@returns {boolean}
*/
Nav.isFirstPerson = ()=>{
    if (ATON.XR._bPresenting) return false;

    if (Nav._mode === Nav.MODE_FP) return true;
    return false;
};

/**
Return true if the navigation system is in Device-orientation mode
@returns {boolean}
*/
Nav.isDevOri = ()=>{
    if (ATON.XR._bPresenting) return false;

    if (Nav._mode === Nav.MODE_DEVORI) return true;
    return false;
};

/**
Set Navigation mode
@param {number} navmode - navigation mode (0: Orbit, 1: FirstPerson, 2: DeviceOrientation)
*/
Nav.setNavMode = (navmode)=>{
    if (navmode === undefined) return;

    if (navmode === Nav.MODE_ORBIT)  Nav.setOrbitControl();
    if (navmode === Nav.MODE_FP)     Nav.setFirstPersonControl();
    if (navmode === Nav.MODE_DEVORI) Nav.setDeviceOrientationControl();
};

/**
Restore previously used navigation mode.
If no previous nav mode is found, defaults to Orbit Control
*/
Nav.restorePreviousNavMode = ()=>{
    if (Nav._prevMode === undefined) Nav.setOrbitControl();

    Nav.setNavMode(Nav._prevMode);
};

// Helper routine
Nav._updCamera = (c)=>{
    if (c === undefined) c = Nav._camera; 

    if (ATON.FX.composer){
        let PP = ATON.FX.composer.passes;
        if (PP){
            for (let p=0; p<PP.length; p++){
                if (PP[p].camera) PP[p].camera = c;
            }
        }
    }

    if (Nav._currPOV){
        c.fov = Nav._currPOV.fov;
        c.updateProjectionMatrix();
    }

    ATON._setupGizmo();

    ATON.MRes.updateTSetsCamera(c);
};

/**
Set Orbit navigation mode (default)
*/
Nav.setOrbitControl = ()=>{
    if (ATON.XR.isPresenting()) return;

    Nav._prevMode = Nav._mode; // store previous nav mode

    Nav._mode = Nav.MODE_ORBIT;
    Nav._bInteracting = false;
    ATON.fire("NavInteraction", false);

    // One-time setup
    if (Nav._cOrbit === undefined){
        Nav._camOrbit = new THREE.PerspectiveCamera( Nav.STD_FOV, window.innerWidth / window.innerHeight, Nav.STD_NEAR, Nav.STD_FAR );
        Nav._camOrbit.layers.enableAll();

        Nav._cOrbit = new THREE.OrbitControls( Nav._camOrbit, ATON._renderer.domElement);

        let C = Nav._cOrbit;

        C.rotateSpeed   = Nav._rotSpeedOrbit;
        C.enablePan     = true;
        
        if (Nav._inertia > 0.0){
            C.enableDamping = true;
            C.dampingFactor = Nav._inertia;
        }
        
        C.screenSpacePanning = true;
        
        C.enableZoom  = true;
        C.minDistance = 0.03;
        C.maxDistance = 300.0;

        if (!Nav._bControl) C.enabled = false;

        //C.addEventListener("change", () => { Nav._bChanged = true; });
        C.addEventListener("start",()=>{
            Nav._bInteracting = true;
            ATON.fire("NavInteraction", true);
        });
        C.addEventListener("end",()=>{
            Nav._bInteracting = false;
            ATON.fire("NavInteraction", false);
        });

    }

    Nav._controls = Nav._cOrbit;
    //Nav._controls.target.copy(Nav._camera.position);
    Nav._camera = Nav._camOrbit;

    // reparent audio listener
    if (ATON.AudioHub._listener && Nav._camera.children.length<1) Nav._camera.add( ATON.AudioHub._listener );

    // Update camera
    Nav._updCamera();
    
    Nav._controls.update();
    if (Nav._currPOV) Nav.syncCurrCamera();

    ATON._onResize();

    ATON.toggleCenteredQuery(false);

    ATON.fire("NavMode", Nav._mode);
};

/**
Set First-Person navigation mode
*/
Nav.setFirstPersonControl = ()=>{
    if (ATON.XR.isPresenting()) return;

    Nav._prevMode = Nav._mode; // store previous nav mode

    if (ATON.SUI.getSelectorRadius()>0.1) ATON.SUI.setSelectorRadius(0.1); // we (re)set selector radius to 10cm

    Nav._mode = Nav.MODE_FP;
    Nav._bInteracting = false;
    ATON.fire("NavInteraction", false);

    // One-time setup
    if (Nav._cFirstPerson === undefined){
        Nav._camFP = new THREE.PerspectiveCamera( Nav.STD_FOV, window.innerWidth / window.innerHeight, Nav.STD_NEAR, Nav.STD_FAR );
        Nav._camFP.layers.enableAll();

        Nav._cFirstPerson = new THREE.OrbitControls( Nav._camFP, ATON._renderer.domElement);

        let C = Nav._cFirstPerson;

        C.enableZoom  = false;
        C.enablePan   = false;
        C.rotateSpeed = Nav._rotSpeedFP;
        
        if (Nav._inertia > 0.0){
            C.enableDamping = true;
            C.dampingFactor = Nav._inertia;
        }
        
        //C.screenSpacePanning = true;

        C.target.copy(Nav._camera.position);

        C.minDistance = 0.01;
        C.maxDistance = 0.01;

        if (!Nav._bControl) C.enabled = false;
    }

    Nav._controls = Nav._cFirstPerson;
    //Nav._controls.target.copy(Nav._camera.position);
    Nav._camera = Nav._camFP;

    // reparent audio listener
    if (ATON.AudioHub._listener && Nav._camera.children.length<1) Nav._camera.add( ATON.AudioHub._listener );
    
    // Update camera
    Nav._updCamera();

    Nav._controls.update();
    if (Nav._currPOV) Nav.syncCurrCamera();

    ATON._onResize();

    ATON.toggleCenteredQuery(false);

    ATON.fire("NavMode", Nav._mode);
/*
    if (Nav._controls) ATON._controls.dispose();
    ATON._controls = new THREE.FirstPersonControls( ATON._camera, ATON._renderer.domElement);
    ATON._controls.lookSpeed = 0.1;
    ATON._controls.movementSpeed = 10;
    ATON._controls.noFly = true;
    ATON._controls.lookVertical = false;

    //ATON._camera.position.set( 20.0, 5.0, 0 );
    ATON._controls.lookAt(0,4,0);

    ATON._controls.update();
    console.log(ATON._controls);
*/
};

/**
Set device-orientation navigation mode
*/
Nav.setDeviceOrientationControl = ()=>{
    if (!ATON.Utils.isMobile()) return;

    Nav._prevMode = Nav._mode; // store previous nav mode

    Nav._mode = Nav.MODE_DEVORI;
    Nav._bInteracting = false;
    ATON.fire("NavInteraction", false);
    ATON._screenPointerCoords.set(0.0,0.0);

    // One-time setup
    if (Nav._cDevOri === undefined){
        Nav._camDevOri = new THREE.PerspectiveCamera( Nav.STD_FOV, window.innerWidth / window.innerHeight, Nav.STD_NEAR, Nav.STD_FAR );
        Nav._camDevOri.layers.enableAll();

        Nav._cDevOri = new DevOri(Nav._camDevOri, ATON._renderer.domElement);
        //Nav._cDevOri = new Nav.DeviceOrientationControls(Nav._camDevOri, ATON._renderer.domElement);
        
        //Nav._cDevOri = new THREE.DeviceOrientationControls(Nav._camDevOri, ATON._renderer.domElement);

        Nav._cDevOri.alphaOffset = 0.0; //The alpha offset in radians
    }

    Nav._controls = Nav._cDevOri;
    Nav._camera   = Nav._camDevOri;

    // reparent audio listener
    if (ATON.AudioHub._listener && Nav._camera.children.length<1) Nav._camera.add( ATON.AudioHub._listener );

    // Update camera
    Nav._updCamera();

    Nav._controls.update();
    if (Nav._currPOV) Nav.syncCurrCamera();

    ATON._onResize();

    ATON.toggleCenteredQuery(true);
    
    ATON.fire("NavMode", Nav._mode);
};

Nav.useAbsoluteOrientation = (b)=>{
    if (Nav._cDevOri === undefined) return;

    // TODO:
};

/**
Set a motion amount
@param {number} f - the motion amount
@example
ATON.Nav.setMotionAmount(0.1);
*/
Nav.setMotionAmount = (f)=>{
    Nav._motionAmt = f;
};

/**
Set a motion direction
@param {THREE.Vector3} f - the motion direction
@example
ATON.Nav.setMotionDirection( new THREE.Vector(1,0,0) );
*/
Nav.setMotionDirection = (v)=>{
    Nav._motionDir.copy(v);
}

/**
Stop current motion
*/
Nav.stop = ()=>{
    Nav._motionAmt = 0.0;
    //TODO: stop any transition
};

/**
Set field-of-view (FoV) in degrees
@param {number} f
@example
ATON.Nav.setFOV(30.0);
*/
Nav.setFOV = (f)=>{
    if (ATON.XR.isPresenting()) return; // skip for immersive sessions

    Nav._currPOV.fov = f;

    let cam = Nav._camera;
    cam.fov = f;
    cam.updateProjectionMatrix();
};

/**
Get current field-of-view (FoV) in degrees
@returns {number}
*/
Nav.getFOV = ()=>{
    return Nav._currPOV.fov;
};


// Compute delta-motions
Nav._deltaMotions = ()=>{
    Nav._dOri = Nav._lastOri.angleTo( ATON.Nav._qOri );
    Nav._dPos = Nav._lastPos.distanceToSquared( Nav._currPOV.pos );

    Nav._lastPos.copy( Nav._currPOV.pos );
    Nav._lastOri.copy( ATON.Nav._qOri );
};


// Retrieve currPOV from camera and controls
Nav.syncCurrPOV = ()=>{
    if (ATON.XR.isPresenting()){

        const xrcam = ATON._renderer.xr.getCamera().cameras[0];
        if (xrcam){
            Nav._currPOV.pos.copy(xrcam.position);
            Nav._qOri.copy(xrcam.quaternion);
            //ATON.XR._cam.getWorldDirection( Nav._vDir );

            //xrcam.getWorldPosition( Nav._currPOV.pos );
            //xrcam.getWorldQuaternion( Nav._qOri );
            xrcam.getWorldDirection( Nav._vDir );
        }

        Nav._currPOV.pos.x += ATON.XR.rig.position.x;
        Nav._currPOV.pos.y += ATON.XR.rig.position.y;
        Nav._currPOV.pos.z += ATON.XR.rig.position.z;

        Nav._deltaMotions();
        return;

/*
        if (XR._sessionType !== "immersive-ar"){
            Nav._currPOV.pos.copy(ATON.XR.controller1pos);
            Nav._vDir.copy(ATON.XR.controller1dir);
        }
        else {
*/

/*
            ATON.XR._cam = ATON._renderer.xr.getCamera(Nav._camera);
            //console.log(ATON.XR._cam);

            ATON.XR._cam.getWorldPosition( Nav._currPOV.pos );
            ATON.XR._cam.getWorldQuaternion( Nav._qOri );
            ATON.XR._cam.getWorldDirection( Nav._vDir );
//        }

        Nav._deltaMotions();
        return;
*/
    }

    const ctrl  = Nav._controls;
    const cam   = Nav._camera;

    cam.getWorldDirection(Nav._vDir);
    cam.getWorldQuaternion(Nav._qOri);

    Nav._deltaMotions();

    if (Nav._mode === Nav.MODE_DEVORI){
        Nav._currPOV.pos.copy(cam.position);
        return;
    }

    if (Nav._mode === Nav.MODE_FP){
        Nav._currPOV.pos.copy(ctrl.target);

        Nav._currPOV.target.x = Nav._currPOV.pos.x + Nav._vDir.x; //ctrl.target.x - cam.position.x;
        Nav._currPOV.target.y = Nav._currPOV.pos.y + Nav._vDir.y; //ctrl.target.y - cam.position.y;
        Nav._currPOV.target.z = Nav._currPOV.pos.z + Nav._vDir.z; //ctrl.target.z - cam.position.z;
        return;
    }
    
    Nav._currPOV.pos.copy(cam.position);
    Nav._currPOV.target.copy(ctrl.target);
};

/**
Apply custom constraints to current POV.
By default this routine does nothing: you can redefine to apply custom constraints to navigation.
@param {THREE.Material} currpov - Represents the current POV to be manipulated
@example
ATON.Nav.applyPOVconstraints = (pov)=>{
    if (pov.pos.y < 0.0) pov.pos.y = 0.0;
};
*/
Nav.applyPOVconstraints = (currpov)=>{
    // To be redefined
};

// After syncCurrPOV and before updateCamera, we maniuplate currPOV
//==================================================================================
Nav.handlePOV = ()=>{
    //console.log(Nav._currPOV.pos);

    if (ATON.XR.isPresenting()) Nav.handleXRtransition();
    else Nav.handlePOVtransition();

    Nav.handleMotion();

    // Handle constraints
    Nav.applyPOVconstraints(Nav._currPOV);
};

// Not used for now
Nav.handleMotion = ()=>{
    if (Nav.isTransitioning()) return;
    if (Nav._motionAmt == 0.0) return;

    if (ATON.XR.controller0 && ATON.XR.controller0.visible){
        ATON.XR.controller0.getWorldDirection(Nav._motionDir);
        Nav._motionDir.negate();
        }
    else Nav._motionDir.copy(Nav._vDir);
/*
    let fv = Nav._motionDir.clone();
    fv.multiplyScalar(Nav._motionAmt * ATON._dt);

    Nav._currPOV.pos.add(fv);
    Nav._currPOV.target.add(fv); // check if needed
*/
    let a = (Nav._motionAmt * ATON._dt);

    let dx = (Nav._motionDir.x * a);
    let dy = (Nav._motionDir.y * a);
    let dz = (Nav._motionDir.z * a);

    Nav._currPOV.pos.x += dx;
    Nav._currPOV.pos.y += dy;
    Nav._currPOV.pos.z += dz;

    Nav._currPOV.target.x += dx;
    Nav._currPOV.target.y += dy;
    Nav._currPOV.target.z += dz;
};

Nav.handlePOVtransition = ()=>{
    if (Nav._tPOVcall < 0.0) return;

    if (Nav.POVtransitionDuration <= 0.0) Nav._tPOVprogress = 1.0;
    else Nav._tPOVprogress = (ATON._clock.elapsedTime - Nav._tPOVcall) / Nav.POVtransitionDuration;

    // End
    if (Nav._tPOVprogress >= 1.0){

        Nav._tPOVcall = -1.0;
        //Nav._controls.enabled = true;

        Nav._currPOV.pos.copy(Nav._reqPOV.pos);
        Nav._currPOV.target.copy(Nav._reqPOV.target);
        Nav._currPOV.fov = Nav._reqPOV.fov;

        ATON.fire("POVTransitionCompleted", Nav._reqPOV.id);
        return;
    }

    Nav._tPOVprogress = COSINOIDAL_DIST(Nav._tPOVprogress);

    Nav._currPOV.pos.lerpVectors(Nav._fromPOV.pos, Nav._reqPOV.pos, Nav._tPOVprogress);
    Nav._currPOV.target.lerpVectors(Nav._fromPOV.target, Nav._reqPOV.target, Nav._tPOVprogress);

    if (!Nav._fromPOV.fov || !Nav._reqPOV.fov) return;
    Nav._currPOV.fov = THREE.MathUtils.lerp(Nav._fromPOV.fov, Nav._reqPOV.fov, Nav._tPOVprogress);

    //console.log(Nav._camera);

    Nav._camera.fov = Nav._currPOV.fov;
    Nav._camera.updateProjectionMatrix();
};

// Immersive XR transitions
Nav.handleXRtransition = ()=>{
    if (Nav._tPOVcall < 0.0) return;

    if (Nav.POVtransitionDuration <= 0.0) Nav._tPOVprogress = 1.0;
    else Nav._tPOVprogress = (ATON._clock.elapsedTime - Nav._tPOVcall) / Nav.POVtransitionDuration;

    // End
    if (Nav._tPOVprogress >= 1.0){

        Nav._tPOVcall = -1.0;
        //Nav._controls.enabled = true;

        //ATON.XR.setRefSpaceLocation(Nav._reqXRpos);
        ATON.XR._currPos.copy(ATON.XR._reqPos);

        //console.log("XR height"+ATON.XR._currPos.y);
        //console.log("HMD height"+Nav._currPOV.pos.y);

        ATON.fire("POVTransitionCompleted", Nav._reqPOV.id);
        return;
    }

    ATON.XR._currPos.lerpVectors(ATON.XR._fromPos, ATON.XR._reqPos, Nav._tPOVprogress);
    //ATON.XR._currPos.lerpVectors(Nav._fromPOV.pos, Nav._reqPOV.pos, Nav._tPOVprogress);

};

// Update internal camera from currPOV 
Nav.syncCurrCamera = ()=>{
    if (ATON.XR.isPresenting()) return;

    let ctrl  = Nav._controls;
    let cam   = Nav._camera;
    
    let pos = Nav._currPOV.pos;
    let tgt = Nav._currPOV.target;

    if (Nav._mode === Nav.MODE_DEVORI){
        cam.position.copy(pos);
        return;
    }

    // Common controls
    //let d = new THREE.Vector3();
    Nav._vDir.subVectors(tgt, pos);
    Nav._vDir.normalize();

    if (Nav._mode === Nav.MODE_FP){
        ctrl.target.copy(pos);

        cam.position.x = ctrl.target.x - (Nav._vDir.x * Nav.FP_EPS);
        cam.position.y = ctrl.target.y - (Nav._vDir.y * Nav.FP_EPS);
        cam.position.z = ctrl.target.z - (Nav._vDir.z * Nav.FP_EPS);
    }
    else {
        cam.position.copy(pos);
        ctrl.target.copy(tgt);
    }
};

// Main update routine
Nav.update = ()=>{

    //Nav._bXR = ATON.XR.isPresenting();

    Nav.syncCurrPOV();
    Nav.handlePOV();
    Nav.syncCurrCamera();
};


/**
Request transition to viewpoint (POV)
@param {POV} pov - the target POV
@param {number} duration - duration of transition in seconds (optional), otherwise use standard duration
@example
ATON.Nav.requestPOV( myTargetPOV );
*/
Nav.requestPOV = (pov, duration, bApplyWorldScale)=>{
    if (ATON._tPOVcall >= 0.0) return; // already requested
    if (pov === undefined) return;
    if (ATON.XR._bPresenting && ATON.XR._sessionType === "immersive-ar") return;

    if (duration !== undefined) Nav.POVtransitionDuration = duration;
    else Nav.POVtransitionDuration = Nav.STD_POV_TRANS_DURATION;
    
    //Nav._controls.enabled = false;
    
    if (ATON.XR.isPresenting()){
        Nav._reqPOV.pos.copy(pov.pos? pov.pos : Nav._currPOV.pos);
        Nav._fromPOV.pos.copy(Nav._currPOV.pos);

        ATON.XR._reqPos.copy(pov.pos? pov.pos : Nav._currPOV.pos);
        ATON.XR._fromPos.copy(ATON.XR._currPos);
    }
    else {
        Nav._reqPOV.pos.copy(pov.pos? pov.pos : Nav._currPOV.pos);
        Nav._reqPOV.target.copy( pov.target? pov.target : Nav._currPOV.target);
        Nav._reqPOV.fov = pov.fov? pov.fov : Nav._currPOV.fov;

        Nav._fromPOV.pos.copy(Nav._currPOV.pos);
        Nav._fromPOV.target.copy(Nav._currPOV.target);
        Nav._fromPOV.fov = Nav._currPOV.fov;
    }

    // World/User Scale
    if (bApplyWorldScale){
        if (pov.pos){
            Nav._reqPOV.pos.x *= ATON._worldScale;
            Nav._reqPOV.pos.y *= ATON._worldScale;
            Nav._reqPOV.pos.z *= ATON._worldScale;

            if (ATON.XR.isPresenting()){
                ATON.XR._reqPos.x *= ATON._worldScale;
                ATON.XR._reqPos.y *= ATON._worldScale;
                ATON.XR._reqPos.z *= ATON._worldScale;
            }
        }
        if (pov.target){
            Nav._reqPOV.target.x *= ATON._worldScale;
            Nav._reqPOV.target.y *= ATON._worldScale;
            Nav._reqPOV.target.z *= ATON._worldScale;
        }
    }

    Nav._tPOVcall = ATON._clock.elapsedTime;
    ATON.fire("POVTransitionRequested", pov.id);
};


Nav.requestPOVbyBound = (bs, duration)=>{
    if (bs === undefined) return;

    //let T = new THREE.Vector3();
    let E = new THREE.Vector3();

    //T.copy(bs.center);
    
    let r = bs.radius * 3.0;
    E.x = bs.center.x - (r * Nav._vDir.x);
    E.y = bs.center.y - (r * Nav._vDir.y);
    E.z = bs.center.z - (r * Nav._vDir.z);

    let pov = new ATON.POV().setPosition(E).setTarget(bs.center);    
    Nav.requestPOV(pov, duration);
};

/**
Request transition to specific ATON Node
@param {Node} n - the target ATON Node
@param {number} duration - duration of transition in seconds (optional), otherwise use standard duration
@example
ATON.Nav.requestPOVbyNode( myNode );
*/
Nav.requestPOVbyNode = (n, duration)=>{
    if (n === undefined) return;
    
    let bs = n.getBound();

    Nav.requestPOVbyBound(bs,duration);
};

/**
Request transition to a viewpoint by ID
@param {Node} povid - the POV ID
@param {number} duration - duration of transition in seconds (optional), otherwise use standard duration
@example
ATON.Nav.requestPOVbyID("entrance");
*/
Nav.requestPOVbyID = (povid, duration)=>{
    if (povid === undefined) return;

    let pov = Nav.povlist[povid];
    if (pov === undefined) return;

    Nav.requestPOV(pov, duration);
};

// Internal routine to re-target on specific 3D point given optional normal
Nav.requestRetarget = (point, normal, duration)=>{
    let M = new THREE.Vector3();
    if (normal === undefined){
        M.lerpVectors(point, Nav._currPOV.pos, 0.8);
    }
    else {
        let d = point.distanceTo(Nav._currPOV.pos);
        d *= 0.5;
        M.x = point.x + (normal.x * d);
        M.y = point.y + (normal.y * d);
        M.z = point.z + (normal.z * d);
    }

    // Adjust DoF if FX enabled
    let dd = point.distanceTo(M);
    ATON.FX.setDOFfocus( dd );

    let pov = new ATON.POV().setPosition(M).setTarget(point).setFOV(Nav._currPOV.fov);
    Nav.requestPOV(pov, duration);

    console.log(pov);
};


/**
Compute a default home, depending on visibile bounding sphere. Typically called after all assets are loaded
@param {THREE.Vector3} dv - the normalized offset direction (optional)
@example
ATON.Nav.computeDefaultHome();
*/
Nav.computeDefaultHome = (dv, sceneBS)=>{
    if (dv === undefined) dv = new THREE.Vector3(1,0.7,1);

    if (sceneBS === undefined) sceneBS = ATON.getRootScene().getBound();

    let eye = new THREE.Vector3(
        sceneBS.center.x + (sceneBS.radius * dv.x * 1.5), 
        sceneBS.center.y + (sceneBS.radius * dv.y * 1.5), 
        sceneBS.center.z + (sceneBS.radius * dv.z * 1.5)
    );

    Nav.homePOV = new ATON.POV().setPosition(eye).setTarget(sceneBS.center);
};


/** 
Set the home viewpoint (POV)
@param {POV} pov - the home POV
*/
Nav.setHomePOV = (pov)=>{
    Nav.homePOV = pov;
};

Nav.computeAndRequestDefaultHome = (duration, dv, sceneBS)=>{
    Nav.computeDefaultHome(dv, sceneBS);
    Nav.requestPOV(Nav.homePOV, duration);
};

/** 
Request home viewpoint
@param {number} duration - transition duration
*/
Nav.requestHomePOV = (duration)=>{
    Nav.requestPOV(Nav.homePOV, duration);
};

Nav.requestHome = Nav.requestHomePOV;

/** 
Set and request home viewpoint
@param {POV} pov - the home POV
@param {number} duration - transition duration
*/
Nav.setAndRequestHomePOV = (pov, duration)=>{
    Nav.setHomePOV(pov);
    Nav.requestPOV(pov, duration);
};

// CLear everything
Nav.clear = ()=>{
    Nav.clearPOVs();
    Nav.clearLocomotionNodes();
};


/*
Mobile devori (modified for absolute compass - UNSTABLE)
author richt / http://richt.me
author WestLangley / http://github.com/WestLangley
W3C Device Orientation control (http://w3c.github.io/deviceorientation/spec-source-orientation.html)
*/
Nav.DeviceOrientationControls = function ( object ) {
    let scope = this;

    this.object = object;
    this.object.rotation.reorder( 'YXZ' );
    this.enabled = true;

    this.deviceOrientation = {};
    this.screenOrientation = 0;

    this.alphaOffset = 0; // radians
    this.absolute = false;
    this.alphaOffsetDevice = undefined;
    this.alphaOffsetScreen = undefined;

    let onDeviceOrientationChangeEvent = function ( event ) {
        if(scope.absolute) return;
        scope.deviceOrientation = event;
    };

    let onDeviceOrientationAbsoluteChangeEvent = function ( event ) {
        scope.deviceOrientation = event;
        scope.absolute = true;
    };

    let onScreenOrientationChangeEvent = function () {
        scope.screenOrientation = window.orientation || 0;
    };

    // The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''
    let setObjectQuaternion = function () {
        let zee = new THREE.Vector3( 0, 0, 1 );
        let euler = new THREE.Euler();

        let q0 = new THREE.Quaternion();
        let q1 = new THREE.Quaternion( - Math.sqrt( 0.5 ), 0, 0, Math.sqrt( 0.5 ) ); // - PI/2 around the x-axis

        return function ( quaternion, alpha, beta, gamma, orient ) {
            euler.set( beta, alpha, - gamma, 'YXZ' ); // 'ZXY' for the device, but 'YXZ' for us
            quaternion.setFromEuler( euler ); // orient the device
            quaternion.multiply( q1 ); // camera looks out the back of the device, not the top
            quaternion.multiply( q0.setFromAxisAngle( zee, - orient ) ); // adjust for screen orientation
        };

    }();

    this.connect = function () {
        onScreenOrientationChangeEvent(); // run once on load

        window.addEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
        window.addEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );
        window.addEventListener( 'deviceorientationabsolute', onDeviceOrientationAbsoluteChangeEvent, false );

        scope.enabled = true;
    };

    this.disconnect = function () {
        window.removeEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
        window.removeEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );
        window.removeEventListener( 'deviceorientationabsolute', onDeviceOrientationAbsoluteChangeEvent, false );

        scope.enabled = false;
    };

    this.update = function () {
        if ( scope.enabled === false ) return;

        let device;
        device = scope.deviceOrientation;

        if ( device ) {
            let alpha = this.getDirection() ? THREE.Math.degToRad( this.getDirection() ) + scope.alphaOffset : 0; // Z
            let beta = device.beta ? THREE.Math.degToRad( device.beta ) : 0; // X'

            let gamma = device.gamma ? THREE.Math.degToRad( device.gamma ) : 0; // Y''
            let orient = scope.screenOrientation ? THREE.Math.degToRad( scope.screenOrientation ) : 0; // O

            setObjectQuaternion( scope.object.quaternion, alpha, beta, gamma, orient );
        }

    };

    this.dispose = ()=>{
        scope.disconnect();
    };

    this.iOSOrientationPermission = ()=>{
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission().then(permissionState => {
                if (permissionState === 'granted') {

                }

                console.log(permissionState);
            }).catch(console.error);
        }
    }

    this.getDirection = ()=>{
        return (typeof scope.deviceOrientation.webkitCompassHeading != "undefined") ? scope.deviceOrientation.webkitCompassHeading : scope.deviceOrientation.alpha;
    }

    this.getDirectionMap = ()=>{
        return (typeof scope.deviceOrientation.webkitCompassHeading != "undefined") ? (360 - scope.deviceOrientation.webkitCompassHeading) : scope.deviceOrientation.alpha;
    }

    this.connect();
};


export default Nav;