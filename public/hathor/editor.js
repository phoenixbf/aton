/*===========================================================================

    "Hathor" v2
    Editor: scene modification routines

    Author: B. Fanini

===========================================================================*/
let ED = {};

ED.PATCHES_MAX_INT = 2000;

ED.setup = ()=>{
    ED._bPersistent = false;

    ED._opList = [];

    window.setInterval( ED.processNodesPatches, ED.PATCHES_MAX_INT );
};

ED.setPersistentModifications = (b)=>{
    ED._bPersistent = b;
    ATON.SceneHub.setEditMode(b);
};

ED.createSceneSnapshot = (snapid, onSuccess)=>{
    if (!snapid) return;

    let sid = ATON.SceneHub.currID;
    if (!sid) return;

    ATON.REQ.post("scenes/"+sid+"/snapshot", { snapshotname: snapid }, (r)=>{
        if (!r){
            return;
        }

        if (onSuccess) onSuccess();
    });
};

/*
// Patches queue
ED.resetPatchesQueue = ()=>{
    ED._patchesQueue = [];
};

ED.addPatchToQueue = (f)=>{
    ED._patchesQueue.push(f);
};

ED.processPatchesQueue = ()=>{
    if (ED._patchesQueue.length < 1) return;

    // TODO
};
*/

ED.dirtyNodeTransformReq = (N, attributes)=>{
    if (!N) return;

    if (!N.userData) N.userData = {};
    if (!N.userData.ED) N.userData.ED = {};
    if (!N.userData.ED.transform) N.userData.ED.transform = {};

    for (let i=0; i<attributes.length; i++){
        let a = attributes[i];
        N.userData.ED.transform[a] = 1; 
    }
};

ED.clearNodeTransformReq = (N)=>{
    if (!N) return;
    if (!N.userData) return;
    if (!N.userData.ED) return;
    if (!N.userData.ED.transform) return;

    N.userData.ED.transform = undefined;
};

ED.processNodesPatches = ()=>{
    //if (!ED._bPersistent) return true;

    for (let n in ATON.semnodes){
        let N = ATON.semnodes[n];

        if (N.userData.ED && N.userData.ED.transform){
            let T = N.userData.ED.transform;

            ED.editNode({
                nid: N.nid,
                type: ATON.NTYPES.SCENE,
                pos: T.pos? [N.position.x,N.position.y,N.position.z] : undefined,
                rot: T.rot? [N.rotation.x,N.rotation.y,N.rotation.z] : undefined,
                scl: T.scl? [N.scale.x,N.scale.y,N.scale.z] : undefined,
            });

            ED.clearNodeTransformReq(N); // Clear dirty
        }

    }

    for (let n in ATON.snodes){
        let N = ATON.snodes[n];

        if (N.userData.ED && N.userData.ED.transform){
            let T = N.userData.ED.transform;

            //console.log(T)

            ED.editNode({
                nid: N.nid,
                type: ATON.NTYPES.SCENE,
                pos: T.pos? [N.position.x,N.position.y,N.position.z] : undefined,
                rot: T.rot? [N.rotation.x,N.rotation.y,N.rotation.z] : undefined,
                scl: T.scl? [N.scale.x,N.scale.y,N.scale.z] : undefined,
            });

            ED.clearNodeTransformReq(N); // Clear dirty
        }
    }
};



ED.createNode = (o)=>{
    if (!o) return false;
    
    let nid = o.nid;
    if (!nid) return false;

    let graph = ATON.NTYPES.SCENE;
    if (o.type) graph = o.type;

    let N = undefined;

    if (graph === ATON.NTYPES.SEM){
        N = ATON.createSemanticNode(nid);

        if (o.parent) N.attachTo(o.parent);
        else N.attachToRoot();
    }
    else {
        N = ATON.createSceneNode(nid);

        if (o.parent) N.attachTo(o.parent);
        else N.attachToRoot();
    }

    let op = {
        a: "createNode",
        data: o,
    };

    ED._opList.push(op);

    //====== Collab
    if (o.remote) return true;

    //====== Persistent
    if (!ED._bPersistent) return true;

    let E = {};
    if (graph === ATON.NTYPES.SEM){
        E.semanticgraph = {};
        E.semanticgraph.nodes = {};
        E.semanticgraph.nodes[nid] = {};

        E.semanticgraph.edges = ATON.SceneHub.getJSONgraphEdges(ATON.NTYPES.SEM);
    }
    else {
        E.scenegraph = {};
        E.scenegraph.nodes = {};
        E.scenegraph.nodes[nid] = {};

        E.scenegraph.edges = ATON.SceneHub.getJSONgraphEdges(ATON.NTYPES.SCENE);
    }

    ATON.SceneHub.patch( E, ATON.SceneHub.MODE_ADD );

    return true;
};

ED.deleteNode = (o)=>{
    if (!o) return false;
    
    let nid = o.nid;
    if (!nid) return false;

    let graph = ATON.NTYPES.SCENE;
    if (o.type) graph = o.type;

    let N = undefined;

    if (graph === ATON.NTYPES.SEM) N = ATON.getSemanticNode(nid);
    else N = ATON.getSceneNode(nid);

    if (!N) return false;

    if (graph === ATON.NTYPES.SEM) ATON.deleteSemanticNode(nid);
    else ATON.deleteSceneNode(nid);

    //====== Collab
    if (o.remote) return true;

    //====== Persistent
    if (!ED._bPersistent) return true;

    let E = {};

    let gr = "scenegraph";
    if (graph === ATON.NTYPES.SEM) gr = "semanticgraph";

    E[gr] = {};
    E[gr].nodes = {};
    E[gr].nodes[nid] = {};

    ATON.SceneHub.patch( E, ATON.SceneHub.MODE_DEL );

    return true;
};

ED.editNode = (o)=>{
    if (!o) return false;
    
    let nid = o.nid;
    if (!nid) return false;

    let graph = ATON.NTYPES.SCENE;
    if (o.type) graph = o.type;

    let N = undefined;
    if (graph === ATON.NTYPES.SEM) N = ATON.getSemanticNode(nid);
    else N = ATON.getSceneNode(nid);

    if (!N) return false;

    let pos = undefined;
    let rot = undefined;
    let scl = undefined;

    if (o.pos){
        pos = o.pos;
        pos[0] = ATON.Utils.roundFloat(pos[0], 3);
        pos[1] = ATON.Utils.roundFloat(pos[1], 3);
        pos[2] = ATON.Utils.roundFloat(pos[2], 3);

        if (o.applytransform) N.setPosition(pos[0],pos[1],pos[2]);
    }

    if (o.rot){
        rot = o.rot;
        rot[0] = ATON.Utils.roundFloat(rot[0], 3);
        rot[1] = ATON.Utils.roundFloat(rot[1], 3);
        rot[2] = ATON.Utils.roundFloat(rot[2], 3);

        if (o.applytransform) N.setRotation(rot[0],rot[1],rot[2]);
    }

    if (o.scl){
        scl = o.scl;
        scl[0] = ATON.Utils.roundFloat(scl[0], 3);
        scl[1] = ATON.Utils.roundFloat(scl[1], 3);
        scl[2] = ATON.Utils.roundFloat(scl[2], 3);

        if (o.applytransform) N.setScale(scl[0],scl[1],scl[2]);
    }

    if (o.geocoords !== undefined){
        if (o.applytransform) N.bUseGeoCoords = o.geocoords;
        N.reload();
    }

    if (o.mat){
        let M = ATON.MatHub.materials[o.mat];
        if (M) N.setMaterial(M);
    }

    //====== Collab
    if (o.remote) return true;

    //====== Persistent
    if (!ED._bPersistent) return true;

    let E = {};

    let gr = "scenegraph";
    if (graph === ATON.NTYPES.SEM) gr = "semanticgraph";

    E[gr] = {};
    E[gr].nodes = {};
    E[gr].nodes[nid] = {};

    // Transform
    if (pos || rot || scl){
        E[gr].nodes[nid].transform = {};

        if (pos) E[gr].nodes[nid].transform.position = pos;
        if (rot) E[gr].nodes[nid].transform.rotation = rot;
        if (scl) E[gr].nodes[nid].transform.scale    = scl;
    }

    if (o.geocoords !== undefined){
        E[gr].nodes[nid].transform = {};
        E[gr].nodes[nid].transform.bUseGeoCoords = o.geocoords;
    }

    // Node material
    if (o.mat){
        E[gr].nodes[nid].material = o.mat;
    }

    ATON.SceneHub.patch( E, ATON.SceneHub.MODE_ADD );

    return true;
};

ED.removeNodeMaterial = (o)=>{
    if (!o) return false;
    
    let nid = o.nid;
    if (!nid) return false;

    let graph = ATON.NTYPES.SCENE;
    if (o.type) graph = o.type;

    let N = undefined;
    if (graph === ATON.NTYPES.SEM) N = ATON.getSemanticNode(nid);
    else N = ATON.getSceneNode(nid);

    if (!N) return false;

    N.restoreMaterials().reload();

    //====== Collab
    if (o.remote) return true;

    //====== Persistent
    if (!ED._bPersistent) return true;

    let E = {};

    let gr = "scenegraph";
    if (graph === ATON.NTYPES.SEM) gr = "semanticgraph";

    E[gr] = {};
    E[gr].nodes = {};
    E[gr].nodes[nid] = {};
    E[gr].nodes[nid].material = {};

    ATON.SceneHub.patch( E, ATON.SceneHub.MODE_DEL );

    console.log(E)

    return true;
};

ED.addModel = (o)=>{
    if (!o) return;

    let url = o.url;
    let nid = o.nid;
    let type = o.type? o.type : ATON.NTYPES.SCENE;

    let N = undefined;
    if (type === ATON.NTYPES.SCENE) N = ATON.getSceneNode(nid);
    else N = ATON.getSemanticNode(nid);

    N.setCloneOnLoadHit(false).load(url);

    let op = {
        a: "addModel",
        data: o,
    };

    ED._opList.push(op);

    //====== Collab
    if (o.remote) return true;

    //====== Persistent
    if (!ED._bPersistent) return true;

    let E = {};

    let gr = "scenegraph";
    if (type === ATON.NTYPES.SEM) gr = "semanticgraph";

    E[gr] = {};
    E[gr].nodes = {};
    E[gr].nodes[nid] = {};

    E[gr].nodes[nid].urls = [];

    for (let url in N._reqURLs) E[gr].nodes[nid].urls.push(url);

    ATON.SceneHub.patch( E, ATON.SceneHub.MODE_ADD );

    return true;
};

ED.setBackground = (o)=>{
    if (!o) return;

    let bgcol = undefined;

    if (o.color){
        bgcol = new THREE.Color(o.color);
        ATON.setBackgroundColor( bgcol );
    }

    if (o.bg){
        ATON.setMainPanorama(o.bg);
    }

    let op = {
        a: "setBackground",
        data: o,
    };

    ED._opList.push(op);

    //====== Collab
    if (o.remote) return true;

    //====== Persistent
    if (!ED._bPersistent) return true;
    
    let E = {};
    E.environment = {};

    if (o.bg){
        E.environment.mainpano = {};
        E.environment.mainpano.url = o.bg;
    }

    if (bgcol){
        E.environment.bgcolor = [
            ATON.Utils.roundFloat(bgcol.r, 2),
            ATON.Utils.roundFloat(bgcol.g, 2),
            ATON.Utils.roundFloat(bgcol.b, 2)

        ];
    }

    ATON.SceneHub.patch( E, ATON.SceneHub.MODE_ADD );
};

ED.removeBackground = (o)=>{
    if (o.bg){
        ATON.removeMainPanorama();
    }

    //====== Collab
    if (o.remote) return true;

    //====== Persistent
    if (!ED._bPersistent) return true;

    let E = {};
    E.environment = {};
    if (o.bg) E.environment.mainpano = {};

    ATON.SceneHub.patch( E, ATON.SceneHub.MODE_DEL);
};

ED.setLighting = (o)=>{

    if (o.dir){
        o.dir[0] = ATON.Utils.roundFloat(o.dir[0], 2);
        o.dir[1] = ATON.Utils.roundFloat(o.dir[1], 2);
        o.dir[2] = ATON.Utils.roundFloat(o.dir[2], 2);

        ATON.setMainLightDirection( new THREE.Vector3(o.dir[0],o.dir[1],o.dir[2]) );
        ATON.toggleMainLight(true);
    }

    if (o.shadows !== undefined) ATON.toggleShadows(o.shadows);
    if (o.exp){
        o.exp = ATON.Utils.roundFloat(o.exp, 1);
        ATON.setExposure(o.exp);
    }

    if (o.autolp !== undefined){
        ATON.setAutoLP(o.autolp);

        if (o.autolp) ATON.recomputeSceneBounds();
        else ATON.clearLightProbes();
    }

    //====== Collab
    if (o.remote) return true;

    //====== Persistent
    if (!ED._bPersistent) return true;

    let E = {};
    E.environment = {};
    
    if (o.dir){
        E.environment.mainlight = {};
        E.environment.mainlight.direction = o.dir;

        if (o.shadows !== undefined) E.environment.mainlight.shadows = o.shadows;
    }
    
    if (o.exp) E.environment.exposure = o.exp;

    if (o.autolp !== undefined){
        E.environment.lightprobes = {};
        E.environment.lightprobes.auto = o.autolp;
    }

    ATON.SceneHub.patch( E, ATON.SceneHub.MODE_ADD);
};

ED.disableMainLight = (o)=>{
    if (!o) o = {};

    ATON.toggleMainLight(false);

    //====== Collab
    if (o.remote) return true;

    //====== Persistent
    if (!ED._bPersistent) return true;

    let E = {};
    E.environment = {};
    E.environment.mainlight = {};

    ATON.SceneHub.patch( E, ATON.SceneHub.MODE_DEL);
};

ED.deleteLightProbes = (o)=>{
    if (!o) o = {};

    //====== Collab
    if (o.remote) return true;

    //====== Persistent
    if (!ED._bPersistent) return true;

    let E = {};
    E.environment = {};
    E.environment.mainlight = {};

    ATON.SceneHub.patch( E, ATON.SceneHub.MODE_DEL);
};

ED.addSemNode = (o)=>{
    let nid = o.nid;
    let parentnid = o.parentnid;
    let shape = o.shape;

    let P = ATON.getSemanticNode(parentnid);

    let S = undefined;

    if (shape !== undefined){
        if (shape === HATHOR.SEM_SHAPE_SPHERE) S = ATON.SemFactory.createSurfaceSphere(nid);
        if (shape === HATHOR.SEM_SHAPE_CONVEX) S = ATON.SemFactory.completeConvexShape(nid);

        S.attachTo(P);
    }
    else {
        S = ATON.getSemanticNode(nid);
    }

    if (!S || !P) return;

    if (o.content) S.setDescription(o.content);
    if (o.audio)   S.setAudio(o.audio);

    let op = {
        a: "addSemNode",
        data: o
    };

    ED._opList.push(op);

    //====== Collab
    if (o.remote) return true;

    //====== Persistent
    if (!ED._bPersistent) return true;

    let E = {};
    E.semanticgraph = {};
    E.semanticgraph.nodes = {};
    E.semanticgraph.nodes[nid] = {};

    if (shape === HATHOR.SEM_SHAPE_SPHERE) E.semanticgraph.nodes[nid].spheres = ATON.SceneHub.getJSONsemanticSpheresList(nid);
    if (shape === HATHOR.SEM_SHAPE_CONVEX) E.semanticgraph.nodes[nid].convexshapes = ATON.SceneHub.getJSONsemanticConvexShapes(nid);

    if (S.getDescription()) E.semanticgraph.nodes[nid].description = S.getDescription();
    if (S.getAudio()) E.semanticgraph.nodes[nid].audio = S.getAudio();

    E.semanticgraph.edges = ATON.SceneHub.getJSONgraphEdges(ATON.NTYPES.SEM);

    ATON.SceneHub.patch( E, ATON.SceneHub.MODE_ADD);
    console.log(E)
};

// Nav
ED.addPOV = (o)=>{
    let povid = o.povid;
    if (!povid) return false;

    let pos = o.pos;
    let tgt = o.tgt;
    let fov = o.fov;

    let P = new ATON.POV();
    if (pos) P.setPosition(pos[0],pos[1],pos[2]);
    if (tgt) P.setTarget(tgt[0],tgt[1],tgt[2]);
    if (fov) P.setFOV(fov);

    if (povid === "home") ATON.Nav.setHomePOV( P );
    else ATON.Nav.addPOV(P, povid);

    //====== Collab
    if (o.remote) return true;

    //====== Persistent
    if (!ED._bPersistent) return true;

    let E = {};
    E.viewpoints = {};
    E.viewpoints[povid] = {};

    if (pos) E.viewpoints[povid].position = pos;
    if (tgt) E.viewpoints[povid].target   = tgt;
    if (fov) E.viewpoints[povid].fov      = fov;

    ATON.SceneHub.patch( E, ATON.SceneHub.MODE_ADD);
};

ED.deletePOV = (o)=>{
    let povid = o.povid;
    if (!povid) return false;

    ATON.Nav.removePOV(povid);

    //====== Collab
    if (o.remote) return true;

    //====== Persistent
    if (!ED._bPersistent) return true;

    let E = {};
    E.viewpoints = {};
    E.viewpoints[povid] = {};

    ATON.SceneHub.patch( E, ATON.SceneHub.MODE_DEL );
};

// Scene general/info data
ED.sceneInfo = (o)=>{
    if (!ATON.SceneHub.currData) return false;

    if (o.kwords){
        for (let k in o.kwords){
            if (!ATON.SceneHub.currData.kwords) ATON.SceneHub.currData.kwords = {};
            ATON.SceneHub.currData.kwords[k] = 1;
        }
    }

    if (o.title) ATON.SceneHub.setTitle( o.title );
    if (o.descr) ATON.SceneHub.setDescription( o.descr );

    //====== Collab
    if (o.remote) return true;

    //====== Persistent
    if (!ED._bPersistent) return true;

    let E = {};
    if (o.kwords) E.kwords = o.kwords;
    if (o.title) E.title = o.title;
    if (o.descr) E.description = o.descr;

    if (o.visibility !== undefined) E.visibility = o.visibility;

    ATON.SceneHub.patch( E, ATON.SceneHub.MODE_ADD);

    return true;
}

ED.deleteSceneKeyword = (o)=>{
    if (!ATON.SceneHub.currData) return false;
    if (!o.kword) return false;

    delete ATON.SceneHub.currData.kwords[o.kword];

    //====== Collab
    if (o.remote) return true;

    //====== Persistent
    if (!ED._bPersistent) return true;

    let E = {};
    E.kwords = {};
    E.kwords[o.kword] = 1;

    ATON.SceneHub.patch( E, ATON.SceneHub.MODE_DEL);

    return true;
};

ED.addFX = (o)=>{

    if (o.ao){
        ATON.FX.togglePass(ATON.FX.PASS_AO, true);
        if (o.ao.i) ATON.FX.setAOintensity(o.ao.i);
    }

    if (o.bloom){
        ATON.FX.togglePass(ATON.FX.PASS_BLOOM, true);
        if (o.bloom.i) ATON.FX.setBloomStrength(o.bloom.i);
        if (o.bloom.t) ATON.FX.setBloomThreshold(o.bloom.t);
    }

    //====== Collab
    if (o.remote) return true;

    //====== Persistent
    if (!ED._bPersistent) return true;

    let E = {};
    E.fx = {};

    if (o.ao){
        E.fx.ao = {};
        if (o.ao.i) E.fx.ao.i = o.ao.i; 
    }

    if (o.bloom){
        E.fx.bloom = {};
        if (o.bloom.i) E.fx.bloom.i = o.bloom.i;
        if (o.bloom.t) E.fx.bloom.t = o.bloom.t;
    }

    ATON.SceneHub.patch( E, ATON.SceneHub.MODE_ADD);

    return true;
};

ED.removeFX = (o)=>{

    if (o.ao) ATON.FX.togglePass(ATON.FX.PASS_AO, false);
    if (o.bloom) ATON.FX.togglePass(ATON.FX.PASS_BLOOM, false);

    //====== Collab
    if (o.remote) return true;

    //====== Persistent
    if (!ED._bPersistent) return true;

    let E = {};
    E.fx = {};

    if (o.ao) E.fx.ao = {};
    if (o.bloom) E.fx.bloom = {};

    ATON.SceneHub.patch( E, ATON.SceneHub.MODE_DEL);

    return true;
};

ED.addMeasure = (o)=>{
    if (!o.measure) return false;
    
    let M = o.measure;
    if (!M) return false;

    let measid = ATON.Utils.generateID("meas");

    //====== Collab
    if (o.remote) return true;

    //====== Persistent
    if (!ED._bPersistent) return true;

    let E = {};
    E.measurements = {};
    E.measurements[measid] = {};
    E.measurements[measid].points = [
        parseFloat( ATON.Utils.roundFloat(M.A.x, ATON.SceneHub.FLOAT_PREC) ),
        parseFloat( ATON.Utils.roundFloat(M.A.y, ATON.SceneHub.FLOAT_PREC) ),
        parseFloat( ATON.Utils.roundFloat(M.A.z, ATON.SceneHub.FLOAT_PREC) ),

        parseFloat( ATON.Utils.roundFloat(M.B.x, ATON.SceneHub.FLOAT_PREC) ),
        parseFloat( ATON.Utils.roundFloat(M.B.y, ATON.SceneHub.FLOAT_PREC) ),
        parseFloat( ATON.Utils.roundFloat(M.B.z, ATON.SceneHub.FLOAT_PREC) ),
    ];

    ATON.SceneHub.patch( E, ATON.SceneHub.MODE_ADD);
    return true;
};

ED.removeMeasures = (o)=>{
    if (!o) o = {};

    ATON.SUI.clearMeasurements();

    //====== Collab
    if (o.remote) return true;

    //====== Persistent
    if (!ED._bPersistent) return true;

    let E = {};
    E.measurements = {};
    //if (o.measid) E.measurements[measid] = {};

    ATON.SceneHub.patch( E, ATON.SceneHub.MODE_DEL);
    return true;
};

export default ED;