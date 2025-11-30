/*
    ATON Node Class

    author: bruno.fanini_AT_gmail.com

===========================================================*/
//import Period from "./ATON.period.js";


/**
Class representing an ATON node.
Constructor allows to create different types (scene nodes, semantic nodes and UI nodes)
@class Node
@example 
let myNode = new ATON.Node("someID")
*/
class Node extends THREE.Group {

constructor(id, type){
    super();

    this.type = type? type : ATON.NTYPES.SCENE;
    
    this.enablePicking();

    if (this.type === ATON.NTYPES.SCENE){
        this._rootG = ATON._rootVisible;
        this._nodes = ATON.snodes;
        //this.period = undefined; // TODO: assign period object (read-only, centralized) - NOT USED FOR NOW
    }
    if (this.type === ATON.NTYPES.SEM){
        this._rootG = ATON._rootSem;
        this._nodes = ATON.semnodes;
        //this.period = undefined;
    }

    if (this.type === ATON.NTYPES.UI){
        this._rootG = ATON._rootUI;
        this._nodes = ATON.uinodes;
    }

    // Register
    this.as(id);

    this.kwords = undefined;

    this._reqURLs = {};

    this._bCloneOnLoadHit = true;

    // Transform list (instancing)
    this._tlist = undefined;

    // Animation mixers
    this._aniMixers = undefined;

    // Shadows
    this.castShadow    = false;
    this.receiveShadow = false;

    this._bs = new THREE.Sphere();

    this.autocenter = false;

    // Local handlers
    this.onHover  = undefined;
    this.onLeave  = undefined;
    this.onSelect = undefined;
}

/**
(Re)assign node ID
@param {string} id - the new ID
@example
myNode.as("newID")
*/
as(id){
    if (id === undefined) return;
    if (id === ATON.ROOT_NID) return;

    this._nodes[id] = this;
    this.nid  = id;
    this.name = id;

    return this;
}

setAsRoot(){
    this._nodes[ATON.ROOT_NID] = this;
    this.nid = ATON.ROOT_NID;

    return this;
}

setCloneOnLoadHit(b){
    this._bCloneOnLoadHit = b;
    return this;
}

/**
Add keyword(s) to this node. Keywords are also recursively added into the sub-graph
@param {string} kw - the keyword or comma-separated list of keywords
@example
myNode.addKeywords("heritage,reconstruction");
*/
addKeywords(kw){
    let K = kw.split(",");

    if (this.kwords === undefined) this.kwords = {};
    for (let k in K){
        let kw = K[k].trim();
        if (kw.length > 0) this.kwords[kw] = true;
    }

    // recurse into ATON nodes
    for (let c in this.children){
        let C = this.children[c];
        if (C.type !== undefined) C.addKeywords(kw);
    }

    return this;
}

/**
Returns true if this node has specific keyword
@param {string} kw - the keyword
@returns {boolean}
@example
if (myNode.hasKeyword("heritage")){ ... }
*/
hasKeyword(kw){
    if (this.kwords === undefined) return;
    return (this.kwords[kw] !== undefined);
}

/**
Set custom description (string) to the node
@param {string} s - content
@example
myNode.setDescription("This is a small description");
*/
setDescription(s){
    this.userData.description = s;
    return this;
}

/**
Get node description (string) if any
@returns {string}
@example
let desc = myNode.getDescription();
*/
getDescription(){
    return this.userData.description;
}

setAudio(au){
    this.userData.audio = au;
    return this;
}

getAudio(){
    return this.userData.audio;
}

/**
Hide this node (and sub-graph), also invisible to queries (ray casting, picking)
@example
myNode.hide()
*/
hide(){
    let bPrev = this.visible;

    this.visible = false;

    //this.traverse((o) => { o.layers.disable(this.type); });
    ATON.Utils.setPicking(this, this.type, false);

    if (ATON._renderer.shadowMap.enabled){
        ATON._dMainL.shadow.needsUpdate = true;
    }

    if (bPrev && this.type===ATON.NTYPES.SCENE){
        ATON.updateLightProbes();
    }

    return this;
}

/**
Show this node (and sub-graph). If pickable, becomes sensible to queries (ray casting)
@example
myNode.show()
*/
show(){
    let bPrev = this.visible;

    this.visible = true;

    //if (this.bPickable) ATON.Utils.setPicking(this, this.type, true); //this.traverse((o) => { o.layers.enable(this.type); });
    ATON.Utils.setPicking(this, this.type, this.bPickable);

    if (ATON._renderer.shadowMap.enabled){
        if (ATON._dMainL!==undefined && ATON._dMainL.shadow!==undefined) ATON._dMainL.shadow.needsUpdate = true;
    }

    if (!bPrev && this.type===ATON.NTYPES.SCENE){
        ATON.updateLightProbes();
    }

    return this;
}

/**
Toggle node visibility. If visible, becomes invisible, and viceversa.
@example
myNode.toggle()
*/
toggle(b){
    if (b === undefined){
        if (this.visible) return this.hide();
        else return this.show();
    }

    if (b) return this.show();
    else return this.hide();
}

/**
Disable this node for runtime queries (ray casters). Useful for instance on vegetation, etc...
@example
myNode.load("somevegetation.gltf").disablePicking()
*/
disablePicking(){
    this.bPickable = false;
    ATON.Utils.setPicking(this, this.type, this.bPickable);

    return this;  
}

/**
Enable this node for runtime queries (ray casters)
@example
myNode.enablePicking()
*/
enablePicking(){
    this.bPickable = true;
    ATON.Utils.setPicking(this, this.type, this.bPickable);

    return this;
}

setPickable(b){
    if (b) this.enablePicking();
    else this.disablePicking();

    return this;
}

/**
Set cascading material. Note this applies to this node and all children (even all those still loading)
@param {THREE.Material} M - the Material
@example
myNode.setMaterial( new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.2, wireframe: true }) )
*/
setMaterial(M){
    this.userData.cMat = M;

    this.traverse((o) => {
        if (o.isMesh){
            if (!o.userData.origMat) o.userData.origMat = o.material.clone();

            o.material = M;
            ///o.material.needsUpdate = true;
            //console.log(o);
        }

        if (o.type) this.userData.cMat = M;
    });

    // children
    for (let c in this.children){
        let C = this.children[c];
        if (C.setMaterial) C.setMaterial(M);
    }

    return this;
}

/**
Restore original materials for this node and its children
@example
myNode.restoreMaterials()
*/
restoreMaterials(){
    this.traverse((o) => {
        if (o.isMesh && o.userData.origMat){
            o.material = o.userData.origMat;
            ///o.material.needsUpdate = true;
            //console.log(o);
        }
    });

    // children
    for (let c in this.children){
        let C = this.children[c];
        if (C.restoreMaterials) C.restoreMaterials();
    }

    return this;
}

/** 
Get cascading material
@returns {THREE.Material}
*/
getMaterial(){
    return this.userData.cMat;
}

// Set default and highlight materials
setDefaultAndHighlightMaterials(matSTD, matHL){
    this.userData.matSTD = matSTD;
    this.userData.matHL  = matHL;

    return this;
}
highlight(){
    if (this.userData.matHL) this.setMaterial(this.userData.matHL);
    return this;
}
restoreDefaultMaterial(){
    if (this.userData.matSTD) this.setMaterial(this.userData.matSTD);
    return this;
}

// Set cascading opacity
setOpacity(f){
    this.traverse((o) => {
        if (o.isMesh){
            o.material.opacity = f;
            //o.material.needsUpdate = true;
        }
    });

    return this;
}

// FIXME: not working
setShadowCast(b){
    this.castShadow = b;

    this.traverse((o) => {
        if (o.isMesh){
            o.castShadow = b;
        }
    });

    return this;
};
setShadowReceive(b){
    this.receiveShadow = b;

    this.traverse((o) => {
        if (o.isMesh){
            o.receiveShadow = b;
        }
    });

    return this;
};

setEnvMap(envtex){
    this.traverse((o) => {
        if (o.isMesh){
			o.material.envMap  = envtex;
			//o.material.combine = THREE.MultiplyOperation;
            //o.material.needsUpdate = true;
        }
    });

    return this;
}

assignLightProbe(LP){
    this.traverse((o) => {
        if (o.isMesh && o.geometry) ATON.Utils.assignLightProbeToMesh(LP, o);
    });

    return this;
}

// (re)assign LPs for each mesh depending on proximity
assignLightProbesByProximity(){
    if (ATON._lps.length === 0) return this;

    this.traverse((o) => {
        if (o.isMesh && o.geometry){
            let c = new THREE.Vector3();
            let bbox = new THREE.Box3().setFromObject(o).getCenter(c);

            let cLP   = undefined;
            let mdist = undefined;

            for (let i in ATON._lps){
                let LP = ATON._lps[i];
                let d = c.distanceToSquared(LP.pos);

                if (cLP === undefined || d < mdist){
                    mdist = d;
                    cLP = LP;
                }
            }

            if (cLP) ATON.Utils.assignLightProbeToMesh(cLP, o);
        }
    });

    return this;
};

clearLightProbing(){
    this.traverse((o) => {
        if (o.isMesh && o.geometry){
            ATON.Utils.clearLightProbeFromMesh( o );

            if (o.material){
                o.material.envMap.dispose();
                o.material.needsUpdate = true;
            }
        }
    });

    return this;
}

// Find & update all LPs under this subgraph
// FIXME: not working
updateLightProbes = ()=>{
    this.traverse((o) => {
        if (o.isMesh && o.geometry){
            let LP = o.userData.LP;

            if (LP !== undefined){
                LP.update();
                o.material.envMap = LP.getEnvTex();
                //o.material.envMapIntensity = 5.0;
                //console.log("x");
                o.material.needsUpdate = true;
            }
        }
    });

    return this;
};

// Deep clone
duplicate(){
    let C = this.clone();

    C.traverse((o)=>{
        if (o.isMesh){
            o.material = o.material.clone();
        }
    });

    return C;
}


// FIXME: xxx
delete(){
    let p = this.parent;

    if (p !== undefined && p.nid !== undefined) p.removeChild( this );
}

removeChild(c){
    if (c === undefined) return;

    let nid = c.nid;
    if (c.nid !== undefined) this._nodes[c.nid] = undefined;

    c.parent = undefined;

    c.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
    });

    this.remove(c);

    return this;
}
/**
Delete all children of this node
*/
removeChildren(){
    let num = this.children.length;
    for (let i=(num-1); i>=0; i--) this.removeChild(this.children[i]);

    return this;
}


/**
Attach this node to parent by providing ID (string) or node object
@param {string|Node} node - the parent node
@example
myNode.attachTo("someGroupID")
@example
myNode.attachTo(myParentGroup)
*/
attachTo(node){
    let N = (typeof node === 'string')? this._nodes[node] : node;
    if (N){
        N.add(this);
        if (N.userData.cMat !== undefined) this.userData.cMat = N.userData.cMat; // this.setMaterial(N.userData.cMat);
        if (N.bPickable !== undefined) this.bPickable = N.bPickable;

        //this.toggle(N.visible);
    }
    
    return N;
}

/**
Attach this node to main root. This is usually mandatory in order to visualize the node and all its descendants.
Depending on node type this will be the scene root (visible scene-graph), the semantic-graph root or UI root
@example
myNode.attachToRoot()
*/
attachToRoot(){
    this._rootG.add(this);
    if (this._rootG.userData.cMat !== undefined) this.userData.cMat = this._rootG.userData.cMat;
    if (this._rootG.bPickable !== undefined) this.bPickable = this._rootG.bPickable;

    //this.toggle(this._rootG.visible);
    
    return this._rootG;
}

/**
Return bounding sphere of this node
@returns {THREE.Sphere}
@example
let bs = myNode.getBound()
*/
getBound(){
/*
    let bb = new THREE.Box3().setFromObject( this );
    let bs = new THREE.Sphere();
    bb.getBoundingSphere(bs);

    return bs;
*/
    this.dirtyBound();
    return this._bs;
}

dirtyBound(){
    let bb = new THREE.Box3().setFromObject( this );
    bb.getBoundingSphere( this._bs );
    return this;
}

autoFit(bCenter, maxRad){
    this.dirtyBound();

    if (bCenter){
        this.position.copy(this._bs.center);
        this.position.multiplyScalar(-1);
    }

    if (maxRad && maxRad > 0.0 && this._bs.radius > 0.0){
        let s = maxRad / this._bs.radius;
        this.scale.set(s,s,s);
    }

    return this;
}

/**
Set location (translation) of this node
@example
myNode.setPosition(1.0,3.0,0.0)
@example
myNode.setPosition( new THREE.Vector3(1.0,3.0,0.0) )
*/
setPosition(x,y,z){
    if (x instanceof THREE.Vector3) this.position.copy(x);
    else this.position.set(x,y,z);

    return this;
}

/**
Set scale of this node
@example
myNode.setScale(3.0,2.0,1.0)
@example
myNode.setScale(2.0)
@example
myNode.setScale( new THREE.Vector3(3.0,2.0,1.0) )
*/
setScale(sx,sy,sz){
    if (sx instanceof THREE.Vector3) this.scale.copy(sx);
    else {
        if (sy === undefined){ sy = sx; sz = sx; }
        this.scale.set(sx,sy,sz);
        }
    
    return this;
}

/**
Set rotation of this node (Euler rx,ry,rz) in radians
@example
myNode.setRotation(3.0,2.0,1.0)
@example
myNode.setRotation( new THREE.Vector3(3.0,2.0,1.0) )
*/
setRotation(rx,ry,rz){
    if (rx instanceof THREE.Vector3) this.rotation.copy(rx);
    else this.rotation.set(rx,ry,rz);
    
    return this;
}

/**
Orient this node to current camera
*/
orientToCamera(){
    this.quaternion.copy( ATON.Nav._qOri );
    return this;
}

/**
Orient this node to a location
*/
orientToLocation(x,y,z){
    if (x instanceof THREE.Vector3) this.lookAt(x);
    else this.lookAt(x,y,z);

    return this;
}

/**
Orient this node to another node
*/
orientToNode(N){
    if (!N) return this;
    this.orientToLocation(N.position);

    return this;
}

/**
Orient this node from z-up to y-up
*/
setYup(){
    this.rotation.set(-1.57079632679,0.0,0.0);
    return this;  
}

/**
Add a transform for this node.
Adding multiple transforms before loading a 3D model will result in instancing these resources
@param {string} T - the transform string to be added
@example
myNode.addTransform("10 0 0").addTransform("-5 0 0").load("mymodel.gltf").attachToRoot()
*/
addTransform(T){
    let TT = undefined;

    if (typeof T === "string"){
        TT = ATON.Utils.parseTransformString(T);
    }

    if (TT === undefined) return this;

    if (this._tlist === undefined) this._tlist = [];
    this._tlist.push(TT);

    return this;
}

/**
Load a 3D model under this node, with optional onComplete handler.
Note the system will take care of loading the resources in background, and will manage duplicate requests to same resources avoiding waste of bandwidth
@param {string} url - the url of the 3D model (local to collection or complete)
@param {function} onComplete - the optional handler to be fired on completion
@example
myNode.load("mymodel.gltf", ()=>{ console.log("completed!") })
*/
load(url, onComplete){
    if (url === undefined) return this;
    
    let N = this;

    // Log request
    N._reqURLs[url] = true;

    url = ATON.Utils.resolveCollectionURL(url);

    // Try load from known services/platforms
    if (ATON.Utils.tryLoadFromService(url, N)){
        if (onComplete) onComplete();
        return N;
    }
    
    let ext = ATON.Utils.getFileExtension(url);

    // 3DGS
    if (ext === "spz" || 
        ext === "splat" || 
        ext === "ksplat" || 
        ext === "sog" || 
        url.endsWith("meta.json")
    ){

        // If not there, realize dedicated 3DGS renderer
        ATON.GS.realize();

        ATON._assetReqNew(url);

        new SPARK.SplatMesh({ 
            url: url,
            editable: false,
            onLoad: (data)=>{
                data.quaternion.set(1, 0, 0, 0);
                
                //ATON.Utils.modelVisitor(N, data);

                N.add( data );

                //data.opacity = 0.1;
                
                ATON._assetReqComplete(url);

                ATON.GS.visitor(N);

                if (onComplete) onComplete();
            }
        });
        
        return N;
    }

    // Cesium 3D Tiles datasets
    if ( ext === "json" || ext === "dzi" ){
        ATON.MRes.loadTileSetFromURL(url, N);
        //ATON._bqScene = true;
        if (onComplete) onComplete();
        return N;
    }


    // Check custom resource handlers if any match
    if ( ATON._resHandler){
        for (let rh in ATON._resHandler){
            let br = ATON._resHandler[rh](url, N);
            if ( br ) return N;
        }
    }

    // [C] Promise already requested
    if ( N._bCloneOnLoadHit && ATON._assetsManager[url] !== undefined ){
        ATON._assetsManager[url].then(( o ) =>{
            let C = o.clone();

            ATON.Utils.modelVisitor(N, C);
            
            if (N._tlist !== undefined){
                for (let t in N._tlist){
                    N._tlist[t].add(C.clone());
                    N.add(N._tlist[t]);
                }
            }
            else N.add( C );

            // animations
            //ATON.Utils.registerAniMixers(N, data);

            //N.setPickable(N.bPickable);
            //N.toggle(N.visible);

            if (onComplete) onComplete();
        });

        //console.log("HIT!");
        return N;
    }

    // Fire request
    /*if (N.type === ATON.NTYPES.SCENE)*/ ATON._assetReqNew(url);

    let P = new Promise( ( resolve, reject ) => {
        ATON._aLoader.load( url, (data)=>{
            let model = data.scene || data.scene[0];

            // Visit loaded model
            ATON.Utils.modelVisitor(N, model);

            if (N._tlist !== undefined){
                for (let t in N._tlist){
                    N._tlist[t].add(model.clone());
                    N.add(N._tlist[t]);
                }
            }
            else N.add( model );

            // animations
            ATON.Utils.registerAniMixers(N, data);

            // Copyrigth extraction
            ATON.CC.extract(data);

            resolve(model);
            //console.log("Model "+url+" loaded");
            console.log("%cModel loaded","color:green");
            
            /*if (N.type === ATON.NTYPES.SCENE)*/ ATON._assetReqComplete(url);

            // post-visit (FIXME:)
            //N.setPickable(N.bPickable);
            //N.toggle(N.visible);

            if (N.type === ATON.NTYPES.SCENE) ATON._bqScene = true;
            if (N.type === ATON.NTYPES.SEM)   ATON._bqSem = true;

            //
            if (N.bPickable) N.enablePicking();

            N.dirtyBound();

            if (onComplete) onComplete();
        },
        undefined,
        (err)=>{
            //console.log(err);
            //reject(model);
            console.log("%cError loading model "+url+" ("+err+")", "color:red");

            /*if (N.type === ATON.NTYPES.SCENE)*/ ATON._assetReqComplete(url);
            if (onComplete) onComplete();
        });

    });

    // Register
    if (N._bCloneOnLoadHit) ATON._assetsManager[url] = P;

    return this;
}

// TODO:
reload(){
    this.removeChildren();

    for (let u in this._reqURLs) this.load(u);

    return this;
}

exportAs( filename ){
    ATON.Utils.exportNode(this, filename);

    return this;
}

setOnHover( f ){
    this.onHover = f;
    return this;
}
setOnLeave( f ){
    this.onLeave = f;
    return this;
}
setOnSelect( f ){
    this.onSelect = f;
    return this;
}

/**
Load a Cesium ION asset. If not set, a prompt will ask for a valid token
@param {string} ionAssID - the asset ID on Cesium ION
@example
myNode.loadCesiumIONAsset("354759")
*/
loadCesiumIONAsset( ionAssID ){
    ATON.MRes.loadCesiumIONAsset( ionAssID, this );
    return this;
}

/**
Load a SketchFab asset. If not set, a prompt will ask for a valid token
@param {string} skfAssID - the asset ID on SketchFab
@example
myNode.loadSketchfabAsset("62662d27c94d4994b2479b8de3a66ca7")
*/
loadSketchfabAsset( skfAssID ){
    let tok = ATON.getAPIToken("sketchfab");
    let N = this;

    if (tok == null){
        console.log("A valid Sketchfab token is required");

        tok = prompt("Please enter a valid Sketchfab token:");
        if (tok == null || tok == "") return this;
    }

    //console.log(tok)

    let url = "https://api.sketchfab.com/v3/models/"+skfAssID+"/download";
    let options = {
        method: 'GET',
        headers: {
            //Authorization: 'Bearer '+tok,
            Authorization: 'Token ' + tok
        },
        mode: 'cors'
    };

    fetch(url, options)
        .then(function(response){
            return response.json();
        }).then(function(data){
            ATON.setAPIToken("sketchfab",tok);
            
            //console.log(data);

            if (data.glb){
                let url = data.glb.url;

                N.load( url );
                return N;
            }
/*
            if (data.gltf){
                let zipurl = data.gltf.url;
                // TODO:
                //N.load(...);
                return N;
            }
*/
        });

    return this;
}

// Assign a period to this node
// TODO: 
/*
setPeriod(p){
    if (this.type === ATON.NTYPES.UI) return this; // not on UI nodes

    let P = (typeof p === 'string')? ATON.periods[p] : p;
    if (P === undefined) return this;

    this.period = P;
    return this;
}

filterByPeriodID(id){
    if (this.period === undefined) return this;

    if (this.period.id !== id){
        this.hide();
        return this;
        }
    else {
        this.show();
        return this;
    }

    this.traverse((o) => {
        if (o.period){
            if (o.period.id === id) this.show();
            else this.hide();
        }
    });

    return this;
}
*/

}

export default Node;