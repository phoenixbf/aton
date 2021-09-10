/*
    ATON XPF Class

    eXtended Panoramic Frame
    formerly "DPF": http://osiris.itabc.cnr.it/scenebaker/index.php/projects/dpf/

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
Class representing a single XPF (eXtended Panoramic Frame, formerly DPF)
@class XPF
@example 
let XPF = new ATON.XPF()
*/
class XPF {

constructor(id){
    this.id = id;

    this._geom = undefined;
    this._mesh = undefined;

    this._pathbaselayer = undefined;
 
    this._size = 20.0;
    this._location = new THREE.Vector3(0,0,0);
    this._rotation = new THREE.Vector3(0,0,0);

    this._lnode = ATON.Nav.addLocomotionNode(this._location).realizeSUI();
}

// Custom geometry
setSize(r){
    this._size = r;
}

realizeGeometry(){
    if (this._geom !== undefined) return this; // already realized

    // Default geometry
    this._geom = new THREE.SphereBufferGeometry( 1.0, 60,60 );
    this._geom.scale( -this._size, this._size, this._size );
        
    this._geom.castShadow    = false;
    this._geom.receiveShadow = false;


    this._mat = new THREE.MeshBasicMaterial({ 
        //map: tpano,
        ///emissive: tpano,
        //fog: false,
        
        depthTest: false,
        depthWrite: false,
        
        ///depthFunc: THREE.AlwaysDepth,
        //side: THREE.BackSide, // THREE.DoubleSide
    });

    this._mesh = new THREE.Mesh(this._geom, this._mat);
    this._mesh.frustumCulled = false;
    this._mesh.renderOrder   = -100;

    return this;
}

getMesh(){
    return this._mesh;
}

getLocomotionNode(){
    return this._lnode;
}

setRotation(rx,ry,rz){
    if (rx instanceof THREE.Vector3) this._rotation.copy(rx);
    else this._rotation.set(rx,ry,rz);

    if (this._mesh === undefined) return this;
    this._mesh.rotation.copy(this._rotation);

    return this;
}

getRotation(){
    return this._rotation;
}

setLocation(x,y,z){
    if (x instanceof THREE.Vector3) this._location.copy(x);
    else this._location.set(x,y,z);

    // Set/update corresponding LN location
    if (this._lnode) this._lnode.setLocation(this._location);

    if (this._mesh === undefined) return this;
    this._mesh.position.copy(this._location);

    return this;
}

getLocation(){
    return this._location;
}

hasGeometry(){
    return (this._geom !== undefined);
}

setBaseLayer(path){
    if (path === undefined) return this;
    
    //this.realizeGeometry();

    this._pathbaselayer = ATON.Utils.resolveCollectionURL(path);
    let self = this;

    if ( !this.hasGeometry() ) return this;

    if (ATON.Utils.isVideo(this._pathbaselayer)){
        //TODO:
    }
    else {
        ATON.Utils.textureLoader.load(self._pathbaselayer, (tex)=>{
            tex.encoding = THREE.sRGBEncoding;
            //tex.minFilter = THREE.NearestFilter;
            tex.generateMipmaps = true;

            self._mat.map = tex;

            self._mat.map.needsUpdate = true;
            self._mat.needsUpdate = true

            console.log("XPF base layer "+self._pathbaselayer+" loaded");
        });
    }

    return this;
}


}

export default XPF;