/*
    ATON Scene Hub
    scene JSON routines

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
ATON Scene Hub
@namespace SceneHub
*/
let SceneHub = {};

SceneHub.MODE_ADD = 0;
SceneHub.MODE_DEL = 1;

/**
Initializes the component
*/
SceneHub.init = ()=>{
    SceneHub.currID   = undefined; // Scene ID (sid)
    SceneHub.currData = undefined; // holds compact object describing our ATON scene
    SceneHub._bEdit   = false;     // edit mode (client can modify json on the server)

    SceneHub._bLoading = false;

    SceneHub.initBaseParsers();
};

/**
This enables/disables edit mode - i.e. changes to the scene are sent to server and become persistent
@param {bool} b - true or false
@example
ATON.SceneHub.setEditMode(true)
*/
SceneHub.setEditMode = (b)=>{
    SceneHub._bEdit = b;
    console.log("Edit mode:"+b);
};


/**
    Loads a scene by providing JSON path
    @param {string} reqpath - JSON url
    @param {string} sid - Scene ID
    @param {function} oncomplete - Function to be called on complete
    @example
        ATON.SceneHub.load("http://path/to/scene.json", "sample", ()=>{ console.log("Done!"); });
*/
SceneHub.load = (reqpath, sid, oncomplete)=>{
    //let args = reqpath.split(',');

    SceneHub._bLoading = true;
    console.log("Loading Scene: "+sid);

    return $.getJSON( reqpath, ( data )=>{
        SceneHub.currData  = data;
        SceneHub.currID    = sid; //scenejson.substring(scenejson.lastIndexOf('/')+1);
        SceneHub._bLoading = false;

        //console.log(ATON.currScene);

        SceneHub.parseScene(data);

        if (oncomplete) oncomplete();
        ATON.fireEvent("SceneJSONLoaded", sid);
    });
};

SceneHub.parseScene = (sobj)=>{
    sobj = (sobj === undefined)? SceneHub.currData : sobj;
    if (sobj === undefined) return;

    for (let k in sobj)
        if (SceneHub._jsonParsers[k]) SceneHub._jsonParsers[k]( sobj[k] );
};

SceneHub.getJSONchildren = (nid, type)=>{
    if (type === undefined) type = ATON.NTYPES.SCENE;

    let P = undefined;
    let children = [];

    if (type === ATON.NTYPES.SEM)   P = ATON.getSemanticNode(nid);
    if (type === ATON.NTYPES.SCENE) P = ATON.getSceneNode(nid);

    if (P === undefined) return undefined;

    for (let c in P.children){
        let child = P.children[c];

        if (child.nid !== undefined) children.push( child.nid );
        }

    return children;
};

SceneHub.getJSONgraphEdges = (type)=>{
    if (type === undefined) type = ATON.NTYPES.SCENE;
    let nodes = ATON.snodes;
    
    if (type === ATON.NTYPES.SEM) nodes = ATON.semnodes;
    if (type === ATON.NTYPES.UI)  nodes = ATON.uinodes;

    let edges = {};

    for (let n in nodes){
        let N = nodes[n];

        //if (N && N.children) edges[n] = SceneHub.getJSONchildren(n, type);

        let E = {};
        if (N && N.parent && N.parent.nid){
            //edges.push([N.parent.nid, N.nid]);
            if (edges[N.parent.nid] === undefined) edges[N.parent.nid] = [];
            edges[N.parent.nid].push(N.nid);
            //edges[N.parent.nid].filter((v,i) => edges[N.parent.nid].indexOf(v) === i);
        }
    }

    //console.log(edges);
    return edges;
};

SceneHub.getJSONsemanticSpheresList = (semid)=>{
    let S = ATON.getSemanticNode(semid);
    if (S === undefined) return undefined;

    let SL = [];

    for (let s in S.children){
        let sphere = S.children[s];
        if (sphere.type){
            SL.push([
                parseFloat(sphere.position.x.toPrecision(3)), 
                parseFloat(sphere.position.y.toPrecision(3)), 
                parseFloat(sphere.position.z.toPrecision(3)), 
                parseFloat(sphere.scale.x.toPrecision(3))
            ]);
        }
    }

    return SL;
};

SceneHub.getJSONsemanticConvexShapes = (semid)=>{
    let S = ATON.getSemanticNode(semid);
    if (S === undefined) return undefined;

    let CL = [];

    for (let s in S.children){
        let semesh = S.children[s];
        if (semesh.userData._convexPoints){
            CL.push(semesh.userData._convexPoints);
        }
    }

    //console.log(CL);
    
    return CL;
};

// Top-level scene-JSON parsers
SceneHub.initBaseParsers = ()=>{
    SceneHub._jsonParsers = {};

    // Environment
    SceneHub._jsonParsers.environment = (env)=>{

        let pano = env.mainpano;
        if (env.mainpano){
            if (pano.url) ATON.setMainPanorama(ATON.PATH_COLLECTION+pano.url);
            if (pano.rotation) ATON.setMainPanoramaRotation(pano.rotation);
        }

        let L = env.mainlight;
        if (L){
            if (L.direction) ATON.setMainLightDirection( new THREE.Vector3(L.direction[0],L.direction[1],L.direction[2]) );

            if (ATON._dMainL){
                if (L.color)     ATON._dMainL.color = new THREE.Color(L.color[0],L.color[1],L.color[2]);
                if (L.intensity) ATON._dMainL.intensity = L.intensity;

                if (L.shadows) ATON.toggleShadows(L.shadows);
            }
        }

        let lps = env.lightprobes;
        if (lps){
            if (lps.auto) ATON.setAutoLP(true);
        }

    };

    // NavMode
    SceneHub._jsonParsers.navmode = (navmode)=>{
        if (navmode === undefined) return;

        ATON.Nav.setNavMode(navmode);
    };

    // Measurements
    SceneHub._jsonParsers.measurements = (M)=>{
        if (M === undefined) return;

        for (let m in M){
            let measure = M[m];

            if (measure.points && measure.points.length === 6){
                let A = new THREE.Vector3(
                    parseFloat(measure.points[0]),
                    parseFloat(measure.points[1]),
                    parseFloat(measure.points[2])
                );
                let B = new THREE.Vector3(
                    parseFloat(measure.points[3]),
                    parseFloat(measure.points[4]),
                    parseFloat(measure.points[5])
                );
                ATON.SUI.addMeasurementPoint(A);
                ATON.SUI.addMeasurementPoint(B);
            }
        }
    };

    // Viewpoints
    SceneHub._jsonParsers.viewpoints = (povs)=>{
        if (povs === undefined) return;

        for (let p in povs){
            let pov = povs[p];
            
            if (p === "home"){
                ATON.Nav.setHomePOV( 
                    new ATON.POV()
                    .setPosition(pov.position[0],pov.position[1],pov.position[2])
                    .setTarget(pov.target[0],pov.target[1],pov.target[2])
                    .setFOV(pov.fov)
                );
            }
            else {
                new ATON.POV(p)
                .setPosition(pov.position)
                .setTarget(pov.target)
                .setFOV(pov.fov)
                //.setKeywords(pov.keywords);
            }
        }
    };

    // Visible scene-graph
    SceneHub._jsonParsers.scenegraph = (sg)=>{
        if (sg === undefined) return;

        let nodes = sg.nodes;
        let edges = sg.edges;

        // nodes
        for (let nid in nodes){
            let N = nodes[nid]; // JSON node

            //let G = ATON.createSceneNode(nid); // ATON node
            let G = ATON.getOrCreateSceneNode(nid).removeChildren();
            
            // load models by urls list
            let urls = N.urls;
            if (urls){
                if (Array.isArray(urls)){
                    urls.forEach(u => {
                        ATON.createSceneNode().load(ATON.PATH_COLLECTION+u).attachTo(G);
                    });
                }
                else {
                    G.load(ATON.PATH_COLLECTION+urls);
                }
            }

            // FIXME: not working
            if (N.shadowcast)    G.setShadowCast(N.shadowcast);
            if (N.shadowreceive) G.setShadowCast(N.shadowreceive);

            if (N.toYup) G.setYup();

            // Keywords
            if (N.keywords) G.kwords = N.keywords;

            // Transform node
            let transform = N.transform;
            if (transform){
                if (transform.position) G.setPosition(transform.position[0],transform.position[1],transform.position[2]);
                if (transform.rotation) G.setRotation(transform.rotation[0],transform.rotation[1],transform.rotation[2]);
                if (transform.scale)    G.setScale(transform.scale[0],transform.scale[1],transform.scale[2]);
            }
        }

        // Build graph through relationships
        for (let parid in edges){
            let children = edges[parid];

            let P = ATON.getSceneNode(parid);

            if (P !== undefined){
                for (let c in children){
                    let childid = children[c];
                    let C = ATON.getSceneNode(childid);
                    if (C !== undefined) C.attachTo(P);
                }
            }
        }
/*
        for (let e = 0; e < edges.length; e++){
            let E = edges[e];

            let from = E[0];
            let to   = E[1];

            if (from && to){
                let child = ATON.getSceneNode(to);
                if (child) child.attachTo(from);
            }
        }
*/
    };

    // Semantic scene-graph
    SceneHub._jsonParsers.semanticgraph = (sg)=>{
        if (sg === undefined) return;

        let nodes = sg.nodes;
        let edges = sg.edges;

        // nodes
        for (let nid in nodes){
            let N = nodes[nid]; // JSON node

            //let G = ATON.createSemanticNode(nid);
            let G = ATON.getOrCreateSemanticNode(nid).removeChildren();
            
            // load shapes by urls list
            let urls = N.urls;
            if (urls){
                if (Array.isArray(urls)){
                    urls.forEach(u => {
                        ATON.createSemanticNode().load(ATON.PATH_COLLECTION+u).attachTo(G);
                    });
                }
                else {
                    G.load(ATON.PATH_COLLECTION+urls);
                }
            }

            if (N.toYup) G.setYup();

            if (N.description) G.setDescription(N.description);
            if (N.audio) G.setAudio(N.audio);

            // Keywords
            if (N.keywords) G.kwords = N.keywords;

            // Sphere [x,y,z, r]
            let spheres = N.spheres;
            if (Array.isArray(spheres)){
                for (let s in spheres){
                    let S = spheres[s];
                    ATON.SemFactory.createSphere(nid, new THREE.Vector3(S[0],S[1],S[2]), S[3]);
                }
            }

            let convexshapes = N.convexshapes;
            if (Array.isArray(convexshapes)){
                for (let s in convexshapes){
                    let S = convexshapes[s];

                    let points = [];
                    for (let i=0; i<S.length; i+=3){
                        let p = new THREE.Vector3(S[i],S[i+1],S[i+2]);
                        points.push(p);
                    }

                    ATON.SemFactory.createConvexShape(nid, points);
                }

            }
        }

        // Build relationships
        for (let parid in edges){
            let children = edges[parid];

            let P = ATON.getSemanticNode(parid);

            if (P !== undefined){
                for (let c in children){
                    let childid = children[c];
                    let C = ATON.getSemanticNode(childid);
                    if (C !== undefined) C.attachTo(P);
                }
            }
        }
/*
        for (let e = 0; e < edges.length; e++){
            let E = edges[e];

            let from = E[0];
            let to   = E[1];

            if (from && to){
                let child = ATON.getSemanticNode(to);
                if (child) child.attachTo(from);
            }
        }
*/
    };

};

// Adds custom scene parser to extend JSON scene
// parser(k){ ... }
SceneHub.addSceneParser = (k, parser)=>{
    SceneHub._jsonParsers[k] = parser;
};

// [C] Sends JSON edit to server node
// previously used: https://tools.ietf.org/html/rfc6902
SceneHub.sendEdit = (patch, mode, onComplete)=>{
    if (SceneHub._bLoading || !SceneHub._bEdit) return;
    if (patch === undefined) return;
    if (mode === undefined) mode = SceneHub.MODE_ADD;

    let sid = SceneHub.currID;

    let O = {};
    O.sid  = sid;
    O.data = patch;
    O.mode = (mode === SceneHub.MODE_DEL)? "DEL" : "ADD";

    let jstr = JSON.stringify(O);
    //console.log(jstr);

    $.ajax({
        url: ATON.PATH_RESTAPI+"edit/scene",
        type:"POST",
        data: jstr,
        contentType:"application/json; charset=utf-8",
        dataType:"json",

        // Update local scene JSON
        // TODO: improve traffic by applying patch to local json, and NOT by receiving entire JSON 
        success: (r)=>{
            if (r === undefined) return;
            //console.log(r);
            SceneHub.currData = r;
            //console.log(ATON.currSceneHub.data);

            if (onComplete) onComplete();
        }
    });
};


export default SceneHub;