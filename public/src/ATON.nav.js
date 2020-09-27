/*
    ATON Navigation system

    author: bruno.fanini_AT_gmail.com

===========================================================*/

const COSINOIDAL_DIST = function(x){ return (1.0 - Math.cos(x * Math.PI)) / 2.0; };

/**
ATON Navigation system
@namespace Nav
*/
let Nav = {};

// Consts
Nav.STD_FOV  = 50.0;
Nav.STD_NEAR = 0.05;
Nav.STD_FAR  = 1000.0;

Nav.FP_EPS = 0.01;
Nav.STD_ROT_SPEED_ORBIT = 0.4;
Nav.STD_ROT_SPEED_FP    = -0.3;
Nav.STD_POV_TRANS_DURATION = 2.0;

// Non-immersive navigation controls
Nav.MODE_ORBIT  = 0;
Nav.MODE_FP     = 1;
Nav.MODE_DEVORI = 2;


Nav.POVtransitionDuration = Nav.STD_POV_TRANS_DURATION;



// Initialize nav system
Nav.init = ()=>{
    Nav._mode = undefined;

    // Setup controls
    //Nav._camera = new THREE.PerspectiveCamera( Nav.STD_FOV, window.innerWidth / window.innerHeight, Nav.STD_NEAR, Nav.STD_FAR );
    //Nav._camera.layers.enableAll();
    //Nav._controls = new THREE.OrbitControls( Nav._camera, ATON._renderer.domElement);
    Nav.setOrbitControl();

    // POV data
    Nav._currPOV = new ATON.POV(); // holds current viewpoint data (eye, target, etc...)
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

    // Motion
    Nav._motionAmt = 0.0;
    Nav._motionDir = new THREE.Vector3(0,1,0);
};

// Returns current eye location (consistent within standard and immersive XR sessions)
Nav.getCurrentEyeLocation = ()=>{
    return Nav._currPOV.pos;
};


Nav.isTransitioning = ()=>{
    if (Nav._tPOVcall >= 0.0) return true;
    return false;
};

Nav.isOrbit = ()=>{ return (Nav._mode === Nav.MODE_ORBIT); };
Nav.isFirstPerson = ()=>{ return (Nav._mode === Nav.MODE_FP); };
Nav.isDevOri = ()=>{ return (Nav._mode === Nav.MODE_DEVORI); };

// Set Orbit controls (default)
Nav.setOrbitControl = ()=>{
    if (ATON.XR.isPresenting()) return;

    Nav._mode = Nav.MODE_ORBIT;

    // One-time setup
    if (Nav._cOrbit === undefined){
        Nav._camOrbit = new THREE.PerspectiveCamera( Nav.STD_FOV, window.innerWidth / window.innerHeight, Nav.STD_NEAR, Nav.STD_FAR );
        Nav._camOrbit.layers.enableAll();

        Nav._cOrbit = new THREE.OrbitControls( Nav._camOrbit, ATON._renderer.domElement);

        let C = Nav._cOrbit;

        C.rotateSpeed   = Nav.STD_ROT_SPEED_ORBIT;
        C.enablePan     = true;
        C.enableDamping = true;
        C.dampingFactor = 0.1;
        C.screenSpacePanning = true;
        
        C.enableZoom  = true;
        C.minDistance = 0.03;
        C.maxDistance = 1000.0;

        C.addEventListener("change", () => { Nav._bControlChange = true; });
    }

    Nav._controls = Nav._cOrbit;
    //Nav._controls.target.copy(Nav._camera.position);
    Nav._camera = Nav._camOrbit;
    
    Nav._controls.update();
    if (Nav._currPOV) Nav.syncCurrCamera();
};

// Set FP controls
Nav.setFirstPersonControl = ()=>{
    if (ATON.XR.isPresenting()) return;

    Nav._mode = Nav.MODE_FP;

    // One-time setup
    if (Nav._cFirstPerson === undefined){
        Nav._camFP = new THREE.PerspectiveCamera( Nav.STD_FOV, window.innerWidth / window.innerHeight, Nav.STD_NEAR, Nav.STD_FAR );
        Nav._camFP.layers.enableAll();

        Nav._cFirstPerson = new THREE.OrbitControls( Nav._camFP, ATON._renderer.domElement);

        let C = Nav._cFirstPerson;

        C.enableZoom  = false;
        C.enablePan   = false;
        C.rotateSpeed = Nav.STD_ROT_SPEED_FP;
        
        C.enableDamping = true;
        C.dampingFactor = 0.1;
        //C.screenSpacePanning = true;

        C.target.copy(Nav._camera.position);

        C.minDistance = 0.05;
        C.maxDistance = 0.05;
    }

    Nav._controls = Nav._cFirstPerson;
    //Nav._controls.target.copy(Nav._camera.position);
    Nav._camera = Nav._camFP;

    Nav._controls.update();
    if (Nav._currPOV) Nav.syncCurrCamera();
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

// Set DevOri controls
Nav.setDeviceOrientationControl = ()=>{
    if (!ATON.Utils.isMobile()) return;

    Nav._mode = Nav.MODE_DEVORI;
    ATON._screenPointerCoords.set(0.0,0.0);

    // One-time setup
    if (Nav._cDevOri === undefined){
        Nav._camDevOri = new THREE.PerspectiveCamera( Nav.STD_FOV, window.innerWidth / window.innerHeight, Nav.STD_NEAR, Nav.STD_FAR );
        Nav._camDevOri.layers.enableAll();

        Nav._cDevOri = new THREE.DeviceOrientationControls(Nav._camDevOri, ATON._renderer.domElement);
        //Nav._cDevOri = new Nav.DeviceOrientationControls(Nav._camDevOri, ATON._renderer.domElement);

        Nav._cDevOri.alphaOffset = 0.0; //The alpha offset in radians
    }

    Nav._controls = Nav._cDevOri;
    Nav._camera   = Nav._camDevOri;

    Nav._controls.update();
    if (Nav._currPOV) Nav.syncCurrCamera();
};


Nav.setMotionAmount = (f)=>{
    Nav._motionAmt = f;
};

Nav.setMotionDirection = (v)=>{
    Nav._motionDir.copy(v);
}

Nav.stop = ()=>{
    Nav._motionAmt = 0.0;
};

// FoV
Nav.setFOV = (f)=>{
    if (ATON.XR.isPresenting()) return; // skip for immersive sessions

    Nav._currPOV.fov = f;

    let cam = Nav._camera;
    cam.fov = f;
    cam.updateProjectionMatrix();
};

Nav.getFOV = ()=>{
    return Nav._currPOV.fov;
};


// Retrieve currPOV from camera and controls
Nav.syncCurrPOV = ()=>{
    if (ATON.XR.isPresenting()){
        
        let C = ATON._renderer.xr.getCamera(Nav._camera);
        C.getWorldPosition( Nav._currPOV.pos );
        C.getWorldQuaternion( Nav._qOri );
        C.getWorldDirection( Nav._vDir );
        //console.log(Nav._hmdPos);

        //ATON.XR.hmdPos.copy(Nav._currPOV.pos);
        //ATON.XR.hmdDir.copy(Nav._vDir);
        
        //ATON._renderer.xr.getCamera(Nav._camera);
        //ATON._renderer.xr.getCamera(Nav._camera).getWorldDirection(Nav._vDir);
        //Nav._camera.getWorldDirection(Nav._vDir);
        
        //Nav._currPOV.pos.copy(Nav._camera.position);
        return;
    }

    let ctrl  = Nav._controls;
    let cam   = Nav._camera;

    cam.getWorldDirection(Nav._vDir);
    cam.getWorldQuaternion(Nav._qOri);

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

// After syncCurrPOV and before updateCamera, we maniuplate currPOV
//==================================================================================
Nav.handlePOV = ()=>{
    //console.log(Nav._currPOV.pos);

    if (ATON.XR.isPresenting()) Nav.handleXRtransition();
    else Nav.handlePOVtransition();

    Nav.handleMotion();

    //if (ATON.XR.isPresenting()) console.log(ATON._renderer.xr);

    // Handle constraints

};

Nav.handleMotion = ()=>{
    if (Nav.isTransitioning()) return;

    if (Nav._motionAmt != 0.0){

        //if ()


        if (ATON.XR.controller0 && ATON.XR.controller0.visible){
            ATON.XR.controller0.getWorldDirection(Nav._motionDir);
            Nav._motionDir.negate();
            }
        else Nav._motionDir.copy(Nav._vDir);

        let fv = Nav._motionDir.clone();
        fv.multiplyScalar(Nav._motionAmt * ATON._dt);

        Nav._currPOV.pos.add(fv);
        Nav._currPOV.target.add(fv); // check if needed
    }
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

        ATON.fireEvent("POVTransitionCompleted", Nav._reqPOV.id);
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

        console.log("XR height"+ATON.XR._currPos.y);
        console.log("HMD height"+Nav._currPOV.pos.y);

        ATON.fireEvent("POVTransitionCompleted", Nav._reqPOV.id);
        return;
    }

    ATON.XR._currPos.lerpVectors(ATON.XR._fromPos, ATON.XR._reqPos, Nav._tPOVprogress);
    //ATON.XR._currPos.lerpVectors(Nav._fromPOV.pos, Nav._reqPOV.pos, Nav._tPOVprogress);

};




// Update internal camera from currPOV 
Nav.syncCurrCamera = ()=>{
    let ctrl  = Nav._controls;
    let cam   = Nav._camera;
    
    let pos = Nav._currPOV.pos;
    let tgt = Nav._currPOV.target;

    // We are in VR
    if (ATON.XR.isPresenting()){
        ///let vrcam = ATON.XR.rig;
        ///vrcam.position.copy(pos);
        
        ///ATON.XR.setRefSpaceLocation(pos);

        //let C = ATON._renderer.xr.getCamera(cam);
        //C.getWorldDirection(Nav._vDir);
        return;
    }

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


// Request transition to viewpoint (POV)
Nav.requestPOV = (pov, duration)=>{
    if (ATON._tPOVcall >= 0.0) return; // already requested

    ATON.fireEvent("POVTransitionRequested", pov.id);

    if (duration !== undefined) Nav.POVtransitionDuration = duration;
    
    //Nav._controls.enabled = false;

    Nav._tPOVcall = ATON._clock.elapsedTime;
    
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
};

Nav.requestPOVbyBound = (bs, duration)=>{
    if (bs === undefined) return;

    let T = new THREE.Vector3();
    let E = new THREE.Vector3();

    T.copy(bs.center);
    
    let r = bs.radius * 2.5;
    E.x = T.x - (r * Nav._vDir.x);
    E.y = T.y - (r * Nav._vDir.y);
    E.z = T.z - (r * Nav._vDir.z);

    let pov = new ATON.POV().setPosition(E).setTarget(T);    
    Nav.requestPOV(pov, duration);
};

Nav.requestPOVbyNode = (n, duration)=>{
    if (n === undefined) return;
    
    let bs = n.getBound();

    Nav.requestPOVbyBound(bs,duration);
};

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

    let pov = new ATON.POV().setPosition(M).setTarget(point).setFOV(Nav._currPOV.fov);
    console.log(pov);
    
    Nav.requestPOV(pov, duration);
};

// Typically after all assets are loaded
Nav.computeDefaultHome = (dv)=>{
    if (dv === undefined) dv = new THREE.Vector3(1,0.7,1);

    let sceneBS = ATON.getRootScene().getBound();

    let eye = new THREE.Vector3(
        sceneBS.center.x + (sceneBS.radius * dv.x), 
        sceneBS.center.y + (sceneBS.radius * dv.y), 
        sceneBS.center.z + (sceneBS.radius * dv.z)
    );

    Nav.homePOV = new ATON.POV().setPosition(eye).setTarget(sceneBS.center);
};

Nav.setHomePOV = (pov)=>{
    Nav.homePOV = pov;
};

Nav.computeAndRequestDefaultHome = (duration, dv)=>{
    Nav.computeDefaultHome(dv);
    Nav.requestPOV(Nav.homePOV, duration);
};

Nav.requestHome = (duration)=>{
    Nav.requestPOV(Nav.homePOV, duration);
};



// Mobile devori (modified for absolute compass - UNSTABLE)
/**
 * @author richt / http://richt.me
 * @author WestLangley / http://github.com/WestLangley
 *
 * W3C Device Orientation control (http://w3c.github.io/deviceorientation/spec-source-orientation.html)
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