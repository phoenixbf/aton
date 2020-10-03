/*
    ATON Node Class

    author: bruno.fanini_AT_gmail.com

===========================================================*/
//import Period from "./ATON.period.js";


/**
Class representing an ATON node
Constructor allows to create different types (Scene nodes, semantic nodes and UI nodes)
@class Node
@example 
new ATON.Node("someID")
*/
class Node extends THREE.Group {

constructor(id, type){
    super();

    this.type = type? type : ATON.NTYPES.SCENE;
    
    this.bPickable = true;

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

    this._bCloneOnLoadHit = true;

    // Shadows
    this.castShadow    = false;
    this.receiveShadow = false;

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
Adds a keyword to this node
@param {string} kw - the keyword
@example
myNode.addKeyword("heritage").addKeyword("reconstruction")
*/
addKeyword(kw){
    if (this.kwords === undefined) this.kwords = {};
    this.kwords[kw] = true;

    return this;
}

/**
Returns true if this node has specific keyword
@param {string} kw - the keyword
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
@example
myNode.getContent();
*/
getDescription(){
    return this.userData.description;
}

/**
Hide this node (and sub-graph), also invisible to queries (ray casting, picking)
@example
myNode.hide()
*/
hide(){ 
    this.visible = false;
    this.traverse((o) => { o.layers.disable(this.type); });
}

/**
Show this node (and sub-graph). If pickable, becomes sensible to queries (ray casting)
@example
myNode.show()
*/
show(){ 
    this.visible = true;
    if (this.bPickable) this.traverse((o) => { o.layers.enable(this.type); });
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
    this.traverse((o) => { o.layers.disable(this.type); });
    return this;  
}

/**
Enable this node for runtime queries (ray casters)
@example
myNode.enablePicking()
*/
enablePicking(){
    this.bPickable = true;
    this.traverse((o) => { o.layers.enable(this.type); });
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
            this.userData.cMat = M;
            o.material = M;
            //o.material.needsUpdate = true;
            }
    });

    return this;
}
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

removeChildren(){
    let num = this.children.length;
    for (let i=(num-1); i>=0; i--) this.removeChild(this.children[i]);

    return this;
}

// Attach this node to parent by ID or object


/**
Attach this node to parent by proding ID (string) or node object
@param {string} node - the parent node ID
@example
myNode.attachTo("someGroupID")
myNode.attachTo(myParentGroup)
*/
attachTo(node){
    let N = (typeof node === 'string')? this._nodes[node] : node;
    if (N){
        N.add(this);
        if (N.userData.cMat) this.userData.cMat = N.userData.cMat;
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
    if (this._rootG.userData.cMat) this.userData.cMat = this._rootG.userData.cMat;
    return this._rootG;
}

/**
Return bound of this node
@example
myNode.getBound()
*/
getBound(){
    let bb = new THREE.Box3().setFromObject( this );
    let bs = new THREE.Sphere();
    bb.getBoundingSphere(bs);

    return bs;
}

setPosition(x,y,z){
    if (x instanceof THREE.Vector3) this.position.copy(x);
    else this.position.set(x,y,z);

    return this;
}

setScale(sx,sy,sz){
    if (sx instanceof THREE.Vector3) this.scale.copy(sx);
    else {
        if (sy === undefined){ sy = sx; sz = sx; }
        this.scale.set(sx,sy,sz);
        }
    
    return this;
}

setRotation(rx,ry,rz){
    if (rx instanceof THREE.Vector3) this.rotation.copy(rx);
    else this.rotation.set(rx,ry,rz);
    
    return this;
}

orientToCamera(){
    this.quaternion.copy( ATON.Nav._qOri );
    return this;
}

setYup(){
    this.rotation.set(-1.57079632679,0.0,0.0);
    return this;  
}

/**
Load a 3D model under this node, with optional onComplete handler.
Note the system will take care of loading the resources in background, and will manage duplicate requests to same resources avoiding to waste bandwidth
@param {string} url - the url of the 3D model
@param {function} onComplete - the optional handler to be fired on completion
@example
myNode.load("mymodel.gltf", ()=>{ console.log("completed!") })
*/
load(url, onComplete){
    if (url === undefined) return this;

    let N = this;

    // Fire new request
    //if (N.type === ATON.NTYPES.SCENE) ATON._assetReqNew(url);

    // [C] Promise already requested
    if ( N._bCloneOnLoadHit && ATON._assetsManager[url] !== undefined ){
        ATON._assetsManager[url].then(( o ) => {
            N.add( o.clone() );

            //if (N.type === ATON.NTYPES.SCENE) ATON._assetReqComplete(url);
            if (onComplete) onComplete();
        });

        console.log("HIT!");
        return N;
    }

    // Fire request
    if (N.type === ATON.NTYPES.SCENE) ATON._assetReqNew(url);

    let P = new Promise( ( resolve, reject ) => {
        ATON._aLoader.load( url, (data)=>{
            let model = data.scene || data.scene[0];

            // Visit loaded model
            ATON.Utils.modelVisitor(N, model);

            N.add( model );

            resolve(model);
            console.log("Model "+url+" loaded");
            
            if (N.type === ATON.NTYPES.SCENE) ATON._assetReqComplete(url);

            if (onComplete) onComplete();
        },
        undefined,
        (err)=>{
            console.log(err);
            //reject(model);

            if (N.type === ATON.NTYPES.SCENE) ATON._assetReqComplete(url);
            if (onComplete) onComplete();
        });

/*
        ATON._aLoader.load( url+"__LOD2-d.gltf", (data)=>{
            let model = data.scene || data.scene[0];
            ATON._modelVisitor(model);

            let C = new THREE.Vector3();
            let bb = new THREE.Box3().setFromObject( model ).getCenter(C);
            model.position.set(-C.x,-C.y,-C.z);

            let lod = new THREE.LOD();
            lod.position.set(C.x,C.y,C.z);
            lod.matrixAutoUpdate = true;
            lod.addLevel(model, 40.0);
            N.add(lod);

            //N.add( model );

            resolve(model);
            console.log("ATON model "+url+" loaded");

            ATON._aLoader.load( url+"__LOD1-d.gltf", (data2)=>{
                let model2 = data2.scene || data2.scene[0];
                ATON._modelVisitor(model2);

                model2.position.set(-C.x,-C.y,-C.z);
                
                lod.addLevel(model2, 0.0);
            });
            
            ATON._assetReqComplete(url);
        });
*/
    });

    // Register
    if (N._bCloneOnLoadHit) ATON._assetsManager[url] = P;

    return this;
}

exportAs( filename ){
    ATON.Utils.exportNode(this, filename);

    return this;
}

setOnHover( h ){
    this.onHover = f;
    return this;
}
setOnLeave( h ){
    this.onLeave = f;
    return this;
}
setOnSelect( h ){
    this.onSelect = f;
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