/*
    ATON Multi-Res Hub
    Manages multi-resolution datasets & routines

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
ATON Copyright Hub
@namespace MRes
*/
let MRes = {};

MRes.REST_API_CESIUMION_DEF_TOKEN = "https://api.cesium.com/v2/tokens/default";


MRes.init = ()=>{

    // Cesium Tilesets
    MRes._tsets = [];

    MRes._tsET = 20.0;   // Global tilesets error target (original: 6)
    MRes._tsB  = false;  // Show/Hide tiles bounds

    MRes._tsTasks = [];  // Tileset tasks

    MRes.tsSchedCB = func => {
        //setTimeout( func, 50);
        MRes._tsTasks.push( func );
    };

    MRes.estimateTSErrorTarget();

    MRes._tsuSync = 0;

    //$.getJSON( MRes.REST_API_CESIUMION_DEF_TOKEN, (data) => { console.log(data); });
};

MRes.getTSetsErrorTarget = ()=>{
    return MRes._tsET;
};

MRes.setTSetsErrorTarget = (e)=>{
    MRes._tsET = e;

    const nts = MRes._tsets.length;
    if (nts <= 0) return;

    for (let ts=0; ts<nts; ts++){
        let TS = MRes._tsets[ts];
        TS.errorTarget = e;
    }
};

MRes.setTSetsDisplayBounds = (b)=>{
    MRes._tsB = b;

    const nts = MRes._tsets.length;
    if (nts <= 0) return;

    for (let ts=0; ts<nts; ts++){
        let TS = MRes._tsets[ts];
        TS.displayBoxBounds = b; // FIXME: not working
    }
};

MRes.updateTSetsCamera = (cam)=>{
    if (cam === undefined) cam = ATON.Nav._camera;

    const nts = MRes._tsets.length;
    if (nts <= 0) return;

    for (let ts=0; ts<nts; ts++){
        const TS = MRes._tsets[ts];   

        //console.log(TS.cameras);
        for (let c=0; c<TS.cameras.length; c++) TS.deleteCamera( TS.cameras[c] );

        TS.setCamera( cam );

        if (ATON._renderer.xr.isPresenting){

            //const leftCam = cam.cameras[ 0 ];
            //if ( leftCam ) TS.setResolution( cam, leftCam.viewport.z, leftCam.viewport.w );

            TS.setResolution( cam, 300,300 );
            //TS.setResolutionFromRenderer( cam, ATON._renderer );            
        }
        else {
            TS.setResolutionFromRenderer( cam, ATON._renderer );
        }
    }
};

MRes.estimateTSErrorTarget = ()=>{
    let tse = 10;

    if (ATON.device.lowGPU || ATON.device.isMobile) tse += 4.0;
    if (ATON.XR._bPresenting) tse += 3.0;

    if (tse > 25.0) tse = 25.0;

    console.log("Estimated TSet error target: "+tse);
    MRes.setTSetsErrorTarget(tse);
};

// Load direct tileset URL under node N
MRes.loadTileSetFromURL = (tsurl, N, cesiumReq )=>{
    if (N === undefined) return;

    let ts = new TILES.TilesRenderer(tsurl);
    if (!ts) return;

    ATON._assetReqNew(tsurl);

    // Options
    ts.displayBoxBounds = MRes._tsB;

    ts.fetchOptions.mode  = 'cors';
    //ts.fetchOptions.cache = 'no-store'; //'default';

    if (cesiumReq){
        ts.fetchOptions.headers = {};
	    ts.fetchOptions.headers.Authorization = `Bearer ${cesiumReq.accessToken}`;

        ts.preprocessURL = uri => {
            uri = new URL( uri );
            if ( /^http/.test( uri.protocol ) ) {
                uri.searchParams.append( 'v', cesiumReq.v );
            }
            return uri.toString();
        };
    }

    ts.errorTarget     = MRes._tsET;
    ts.optimizeRaycast = false; // We already use BVH
    //ts.loadSiblings    = false; // a few hops / artifacts

    ts.lruCache.maxSize = 500; //350;
    ts.lruCache.minSize = 300; //150;
    ts.lruCache.unloadPercent = 0.1; //0.6; // The maximum percentage of minSize to unload during a given frame

    // Download/Parse queues
    ts.downloadQueue.schedulingCallback = MRes.tsSchedCB;
    ts.parseQueue.schedulingCallback    = MRes.tsSchedCB;
    ts.downloadQueue.maxJobs = 6; //2
    ts.parseQueue.maxJobs    = 2; //2

/*
    const tloader = new THREE.GLTFLoader( ts.manager );
	tloader.setDRACOLoader( ATON._dracoLoader );
    tloader.setKTX2Loader( ATON._ktx2Loader );
*/
    ts.setCamera( ATON.Nav._camera );
    ts.setResolutionFromRenderer( ATON.Nav._camera, ATON._renderer );

    ts.manager.addHandler( /\.gltf$/, ATON._aLoader /*tloader*/ );
    ts.manager.addHandler( /\.ktx2$/, ATON._ktx2Loader );
    //ts.manager.addHandler( /\.basis$/, ATON._basisLoader );

    N.add( ts.group );
    //console.log(N)

    const MIN_TILES = 2; // min number of tiles for tileset to be considered loaded
    let tflip = 0;


    // JSON loaded
    ts.onLoadTileSet = ()=>{
        console.log("TileSet loaded");

        // Cesium ION
        if (cesiumReq){
            const box    = new THREE.Box3();
            const sphere = new THREE.Sphere();
            const matrix = new THREE.Matrix4();

            let position;
            let distanceToEllipsoidCenter;

            if ( ts.getOrientedBounds( box, matrix ) ) {

                position = new THREE.Vector3().setFromMatrixPosition( matrix );
                distanceToEllipsoidCenter = position.length();

            } else if ( ts.getBoundingSphere( sphere ) ) {

                position = sphere.center.clone();
                distanceToEllipsoidCenter = position.length();

            }

            const surfaceDirection = position.normalize();
            const up = new THREE.Vector3( 0, 1, 0 );
            const rotationToNorthPole = ATON.Utils.rotationBetweenDirections( surfaceDirection, up );

            ts.group.quaternion.x = rotationToNorthPole.x;
            ts.group.quaternion.y = rotationToNorthPole.y;
            ts.group.quaternion.z = rotationToNorthPole.z;
            ts.group.quaternion.w = rotationToNorthPole.w;

            ts.group.position.y = -distanceToEllipsoidCenter;
        }

        // Default URL
        else {
            let bb = new THREE.Box3();
            let bs = new THREE.Sphere();

            if ( ts.getBounds(bb) ){
                bb.getBoundingSphere( bs );

                if (N.autocenter){
                    bb.getCenter( ts.group.position );
                    ts.group.position.multiplyScalar( -1 );
                }
                //else if (ATON.Nav.homePOV === undefined) ATON.Nav.computeDefaultHome(undefined, bs );
                ///else ATON.recomputeSceneBounds( bs );
            }
            else if ( ts.getBoundingSphere(bs) ){

                if (N.autocenter){
                    ts.group.position.copy( bs.center );
                    ts.group.position.multiplyScalar( -1 );
                }
                //else if (ATON.Nav.homePOV === undefined) ATON.Nav.computeDefaultHome(undefined, bs );
                ///else ATON.recomputeSceneBounds( bs );
            }
        }

        //console.log(N)

        //ATON.recomputeSceneBounds( bs );
        
        //ATON._assetReqComplete(tsurl);

        //if (ATON.Nav.homePOV === undefined) ATON.Nav.computeAndRequestDefaultHome(0.5);
        
        //if (ATON.Nav.homePOV === undefined) ATON.Nav.computeAndRequestDefaultHome(0.5);
        //ATON._assetReqComplete(tsurl);
    };

    // On single tile loaded
    ts.onLoadModel = ( scene )=>{
        //console.log(ts.lruCache.itemList.length);

        if (tflip < MIN_TILES) tflip++;
        else if (tflip === MIN_TILES){
            tflip++;

            ATON.recomputeSceneBounds();
            if (ATON.Nav.homePOV === undefined) ATON.Nav.computeAndRequestDefaultHome(0.5);

            ATON._assetReqComplete(tsurl);
        }

        scene.traverse( (c)=>{
            c.layers.enable(N.type);

            if (c.isMesh){
                c.castShadow    = true; //N.castShadow;
                c.receiveShadow = true; //N.receiveShadow;

                // Build accelerated raycasting for tile
                if (c.geometry){
                    c.geometry.computeBoundsTree();
                    if (ATON.Utils._bvhBounds>0) ATON.Utils._addBVHbounds(c, ATON.Utils._bvhBounds);
                }
            }

            if ( c.material ){
                if (N.userData.cMat){
                    c.material = N.userData.cMat;
                }

                //c.castShadow    = true;
                //c.receiveShadow = true;
                //c.material.shadowSide = 2;

                let tex = c.material.map;
                if (tex){
                    tex.minFilter = THREE.LinearMipmapLinearFilter;
                    tex.magFilter = THREE.LinearFilter;
                    tex.encoding  = ATON._stdEncoding;
                }

            }
        });

    //console.log(ATON._renderer.info.memory);
    };

    ts.onDisposeModel = (scene, tile)=>{
        ATON.Utils.cleanupVisitor(scene);

        scene = null;
        tile  = null;

        //console.log(ts.group);
        //console.log("DISPOSE");
    };

    ATON.Utils.setPicking(N, N.type, true);

    MRes._tsets.push(ts);
};

MRes.loadCesiumIONAsset = (ionAssID, N)=>{
    if (ATON._extAPItokens["cesium.ion"] === undefined){
        console.log("A valid Cesium ION token is required");

        let tok = prompt("Please enter a valid Cesium ION token:");
        if (tok == null || tok == "") return;

        ATON._extAPItokens["cesium.ion"] = tok;
    }

    let url = new URL( `https://api.cesium.com/v1/assets/${ionAssID}/endpoint` );
	url.searchParams.append( 'access_token', ATON._extAPItokens["cesium.ion"] );

    fetch( url, { mode: 'cors' } )
        .then( ( res ) => {
            if ( res.ok ){
                return res.json();
            } else {
                return Promise.reject( `${res.status} : ${res.statusText}` );
            }
        })
        .then( ( json ) => {
            url = new URL( json.url );
			const version = url.searchParams.get('v');

            MRes.loadTileSetFromURL( url.toString(), N, {
                accessToken: json.accessToken,
                v: version
            });

            ATON._bqScene = true;
        });
};

/*
$.getJSON( MRes.REST_API_CESIUMION_DEF_TOKEN, data => {
    console.log(data)

    // Unauthorized
    if (data.token === undefined){
        console.log(data.message);
        return;
    }
    // We retrieve a valid token
    else {
        let tok = data.token;
    }
*/

// Main update (view-dependent LoD)
MRes.update = ()=>{
    //MRes._tsuSync++;
    //if ((MRes._tsuSync % 10) !== 0) return;

    const nts = MRes._tsets.length;
    if (nts <= 0) return;

    //if (ATON.Nav._bInteracting) return;
    if (ATON.Nav.isTransitioning()) return;
    //if (ATON.XR._bReqPresenting) return;

    //ATON.Nav._camera.updateMatrixWorld();

    // Tasks
    //console.log(MRes._tsTasks.length);
    let T = MRes._tsTasks.shift(); 
    if (T !== undefined){
        T();
        T = null;
    }
    //MRes._tsTasksFF = 0;

    for (let ts=0; ts < nts; ts++){
        const TS = MRes._tsets[ts];
        TS.update();
    }
};

export default MRes;