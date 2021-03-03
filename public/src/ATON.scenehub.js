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

SceneHub.FLOAT_PREC = 5;

/**
Initializes the component
*/
SceneHub.init = ()=>{
    SceneHub.currID   = undefined; // Scene ID (sid) - FIXME: rename to "SID"
    SceneHub.currData = undefined; // holds compact object describing our ATON scene
    SceneHub._bEdit   = false;     // edit mode (client can modify json on the server)

    SceneHub._bLoading = false;

    // Current scene title & description
    SceneHub._title = undefined;
    SceneHub._descr = undefined;

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

// Parse JSON scene obj
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
                parseFloat(sphere.position.x.toPrecision(SceneHub.FLOAT_PREC)), 
                parseFloat(sphere.position.y.toPrecision(SceneHub.FLOAT_PREC)), 
                parseFloat(sphere.position.z.toPrecision(SceneHub.FLOAT_PREC)), 
                parseFloat(sphere.scale.x.toPrecision(SceneHub.FLOAT_PREC))
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

    // Scene Title & Description
    SceneHub._jsonParsers.title = (title)=>{
        if (title === undefined) return;

        SceneHub.setTitle(title);
    };

    SceneHub._jsonParsers.description = (descr)=>{
        if (descr === undefined) return;

        SceneHub.setDescription(descr);
    };

    // Environment
    SceneHub._jsonParsers.environment = (env)=>{

        let pano = env.mainpano;
        if (env.mainpano){
            if (pano.url) ATON.setMainPanorama(pano.url);
            if (pano.rotation) ATON.setMainPanoramaRotation(pano.rotation);
        }

        let L = env.mainlight;
        if (L){
            if (L.direction) ATON.setMainLightDirection( new THREE.Vector3(L.direction[0],L.direction[1],L.direction[2]) );

            if (ATON._dMainL){
                if (L.color)     ATON._dMainL.color = new THREE.Color(L.color[0],L.color[1],L.color[2]);
                if (L.intensity) ATON._dMainL.intensity = L.intensity;

                if (L.shadows !== undefined) ATON.toggleShadows(L.shadows);
                else ATON.toggleShadows(false);
            }
            else {
                //ATON.toggleShadows(false);
                ATON.toggleMainLight(false);
            }
        }
        else {
            //ATON.toggleShadows(false);
            ATON.toggleMainLight(false);
        }

        let lps = env.lightprobes;
        if (lps){
            if (lps.auto) ATON.setAutoLP(true);
        }

        if (env.exposure) ATON.setExposure(env.exposure);

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
                .setPosition(pov.position[0],pov.position[1],pov.position[2])
                .setTarget(pov.target[0],pov.target[1],pov.target[2])
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

            // Transform node
            let transform = N.transform;
            let tlist = undefined;
            if (transform){
                if (transform.position) G.setPosition(transform.position[0],transform.position[1],transform.position[2]);
                if (transform.rotation) G.setRotation(transform.rotation[0],transform.rotation[1],transform.rotation[2]);
                if (transform.scale)    G.setScale(transform.scale[0],transform.scale[1],transform.scale[2]);

                if (transform.list && Array.isArray(transform.list)){
                    //TODO:
                }
            }
            
            // load models by urls list
            let urls = N.urls;
            if (urls){
                if (Array.isArray(urls)){
                    urls.forEach(u => {
                        ATON.createSceneNode().load(u).attachTo(G);
                    });
                }
                else {
                    G.load(urls);
                }
            }

            // FIXME: not working
            if (N.shadowcast)    G.setShadowCast(N.shadowcast);
            if (N.shadowreceive) G.setShadowCast(N.shadowreceive);

            if (N.toYup) G.setYup();

            //if (N.nopicking){ G.disablePicking(); } // FIXME: not working
/*
            if (N.color){
                let C = ATON.MatHub.colors[N.color];

                G.setMaterial( new THREE.MeshBasicMaterial({ 
                    color: C, 
                    transparent: true,
                    depthWrite: false, 
                    opacity: 0.1,
                }));

                console.log(G);
            }
*/
            // Keywords
            if (N.keywords) G.kwords = N.keywords;
/*
            if (N.show !== undefined){
                if (N.show){ G.show(); console.log("show "+nid); }
                else { G.hide(); console.log("hide "+nid); }
            }
*/
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

        // After connection
        for (let nid in nodes){
            let N = nodes[nid]; // JSON node
            let G = ATON.getSceneNode(nid);

            if (G !== undefined){
                //if (N.nopicking){ G.disablePicking(); }
                //else G.enablePicking();

                if (N.show !== undefined){
                    //console.log(N.show);

                    if (N.show){ G.show(); console.log("show "+nid); }
                    else { G.hide(); console.log("hide "+nid); }
                    //console.log(ATON.getSceneNode(nid));
                }
                //else G.show();

                if (N.material){
                    let mat = new THREE.MeshStandardMaterial(N.material);
                    G.setMaterial( mat );
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
                        ATON.createSemanticNode().load(u).attachTo(G);
                    });
                }
                else {
                    G.load(urls);
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
                    let loc = new THREE.Vector3(parseFloat(S[0]),parseFloat(S[1]),parseFloat(S[2]));
                    ATON.SemFactory.createSphere(nid, loc, parseFloat(S[3]));
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

        // After connection
        for (let nid in nodes){
            let N = nodes[nid]; // JSON node
            let G = ATON.getSemanticNode(nid);

            if (G !== undefined){
                if (N.show !== undefined){
                    //console.log(N.show);

                    if (N.show){ G.show(); console.log("show "+nid); }
                    else { G.hide(); console.log("hide "+nid); }
                    //console.log(ATON.getSemanticNode(nid));
                }

                if (N.nopicking){ G.disablePicking(); }

                if (N.material){
                    let mat = new THREE.MeshStandardMaterial(N.material);
                    G.setMaterial( mat );
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
// parser(key){ ... }
SceneHub.addSceneParser = (key, parser)=>{
    SceneHub._jsonParsers[key] = parser;
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
            //console.log(r);
            if (r) SceneHub.currData = r;
            //console.log(ATON.currSceneHub.data);

            if (onComplete) onComplete();
        }
    });
};

SceneHub.setTitle = (title)=>{
    SceneHub._title = title;
};
SceneHub.getTitle = ()=>{
    return SceneHub._title;
}

SceneHub.setDescription = (descr)=>{
    SceneHub._descr = descr;
};
SceneHub.getDescription = ()=>{
    return SceneHub._descr;
};


export default SceneHub;