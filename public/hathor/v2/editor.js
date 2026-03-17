/*===========================================================================

    "Hathor" v2
    Editor: scene modification routines

    Author: B. Fanini

===========================================================================*/
let ED = {};

ED.setup = ()=>{
    ED._bPersistent = false;

    ED._opList = [];

    //ED.resetPatchesQueue();
    //window.setInterval( ED.processPatchesQueue, 2000 );
    window.setInterval( ED.processNodesPatches, 2000 );
};

ED.setPersistentModifications = (b)=>{
    ED._bPersistent = b;
    ATON.SceneHub.setEditMode(b);
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

ED.dirtyNodeTransformReq = (N, pos,rot,scale)=>{
    if (!N) return;

    if (!N.userData.ED) N.userData.ED = {};
    if (!N.userData.ED.transform) N.userData.ED.transform = {};

    if (pos)   N.userData.ED.transform.pos = 1;
    if (rot)   N.userData.ED.transform.rot = 1;
    if (scale) N.userData.ED.transform.scl = 1;
};

ED.clearNodeTransformReq = (N)=>{
    if (!N) return;
    if (!N.userData.ED) return;
    if (!N.userData.ED.transform) return;

    N.userData.ED.transform = {};
};

ED.processNodesPatches = ()=>{
    //if (!ED._bPersistent) return true;

    for (let n in ATON.semnodes){
        let N = ATON.semnodes[n];

        if (N.userData.ED && N.userData.ED.transform){
            let T = N.userData.ED.transform;

            ED.transformNode({
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

            ED.transformNode({
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
    if (!o) return;

    //TODO:

    //====== Collab
    if (o.remote) return true;

    //====== Persistent
    if (!ED._bPersistent) return true;
};

ED.transformNode = (o)=>{
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
        pos[0] = parseFloat(pos[0]).toFixed(3);
        pos[1] = parseFloat(pos[1]).toFixed(3);
        pos[2] = parseFloat(pos[2]).toFixed(3);

        if (o.apply) N.setPosition(pos[0],pos[1],pos[2]);
    }

    if (o.rot){
        rot = o.rot;
        rot[0] = parseFloat(rot[0]).toFixed(3);
        rot[1] = parseFloat(rot[1]).toFixed(3);
        rot[2] = parseFloat(rot[2]).toFixed(3);

        if (o.apply) N.setRotation(rot[0],rot[1],rot[2]);
    }

    if (o.scl){
        scl = o.scl;
        scl[0] = parseFloat(scl[0]).toFixed(3);
        scl[1] = parseFloat(scl[1]).toFixed(3);
        scl[2] = parseFloat(scl[2]).toFixed(3);

        if (o.apply) N.setScale(scl[0],scl[1],scl[2]);
    }

    //====== Collab
    if (o.remote) return true;

    //====== Persistent
    if (!ED._bPersistent) return true;

    let E = {};
    if (graph === ATON.NTYPES.SEM){
        E.semanticgraph = {};
        E.semanticgraph.nodes = {};
        E.semanticgraph.nodes[nid] = {};
        E.semanticgraph.nodes[nid].transform = {};

        if (pos) E.semanticgraph.nodes[nid].transform.position = pos;
        if (rot) E.semanticgraph.nodes[nid].transform.rotation = rot;
        if (scl) E.semanticgraph.nodes[nid].transform.scale    = scl;
    }
    else {
        E.scenegraph = {};
        E.scenegraph.nodes = {};
        E.scenegraph.nodes[nid] = {};
        E.scenegraph.nodes[nid].transform = {};

        if (pos) E.scenegraph.nodes[nid].transform.position = pos;
        if (rot) E.scenegraph.nodes[nid].transform.rotation = rot;
        if (scl) E.scenegraph.nodes[nid].transform.scale    = scl;
    }

    ATON.SceneHub.patch( E, ATON.SceneHub.MODE_ADD );

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

    N.load(url);

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

    if (type === ATON.NTYPES.SEM){
        E.semanticgraph = {};
        E.semanticgraph.nodes = {};
        E.semanticgraph.nodes[nid] = {};
        E.semanticgraph.nodes[nid].urls = [];

        for (let url in N._reqURLs) E.semanticgraph.nodes[nid].urls.push(url);
    }
    else {
        E.scenegraph = {};
        E.scenegraph.nodes = {};
        E.scenegraph.nodes[nid] = {};
        E.scenegraph.nodes[nid].urls = [];

        for (let url in N._reqURLs) E.scenegraph.nodes[nid].urls.push(url);
    }

    ATON.SceneHub.patch( E, ATON.SceneHub.MODE_ADD );

    return true;
};

ED.setBackground = (o)=>{
    if (!o) return;

    if (o.color){
        let col = new THREE.Color(o.color);
        ATON.setBackgroundColor( col );
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
};

ED.addSemNode = (o)=>{
    let nid = o.nid;
    let parentnid = o.parentnid;
    let shape = o.shape;

    let P = ATON.getSemanticNode(parentnid);

    let S = undefined;
    if (shape === HATHOR.SEM_SHAPE_SPHERE) S = ATON.SemFactory.createSurfaceSphere(nid);
    if (shape === HATHOR.SEM_SHAPE_CONVEX) S = ATON.SemFactory.completeConvexShape(nid);

    if (!S || !P) return;

    S.attachTo(P);

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

export default ED;