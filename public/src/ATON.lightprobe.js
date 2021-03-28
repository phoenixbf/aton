/*
    ATON Light Probe Class

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
Class representing a light probe (LP), can be static or updated at runtime
@class LightProbe
@param {number} res - Resolution in pixel of lightprobe (default 64)
@param {number} near - Capture near (default 1m)
@param {number} far - Capture far (default 1Km)
@example 
let LP = new ATON.LightProbe()
*/
class LightProbe {

constructor(res, near, far){
    this.pos = new THREE.Vector3(0,0,0);

    this._res  = (res !== undefined)?  res  : 64;
    this._near = (near !== undefined)? near : 1.0;
    this._far  = (far !== undefined)?  far  : ATON.Nav.STD_FAR;
/*
    this._LPtarget0 = undefined;
    this._LPtarget1 = undefined;

    this._LP0 = undefined;
    this._LP1 = undefined;

    this._flipLP = false;
*/
    this._envtex = undefined;
    this._prevCCtarget = undefined;
/*
    this._LP = new THREE.LightProbe();
    this._LP.intensity = 10;
    ATON._mainRoot.add( this._LP );
*/
    
    //this._pmremGenerator = new THREE.PMREMGenerator(ATON._renderer);

    //this.realize();
}

/*
realize(){
    this._LPtarget0 = new THREE.WebGLCubeRenderTarget( this._res, {
        format: THREE.RGBFormat,
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
        encoding: THREE.sRGBEncoding // prevent the material's shader from recompiling every frame
    });

    this._LPtarget1 = new THREE.WebGLCubeRenderTarget( this._res, {
        format: THREE.RGBFormat,
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
        encoding: THREE.sRGBEncoding
    });

    this._LP0 = new THREE.CubeCamera( this._near, this._far, this._LPtarget0 );
    this._LP1 = new THREE.CubeCamera( this._near, this._far, this._LPtarget1 );

    return this;
}
*/

/**
Set LP position
@example
LP.setPosition(2.0,6.0,1.5)
@example
LP.setPosition( new THREE.Vector3(2.0,6.0,1.5) )
*/
setPosition(x,y,z){
    if (x instanceof THREE.Vector3) this.pos.copy(x);
    else this.pos.set(x,y,z);

    //this._LP.position.copy(this.pos);

    return this;
}

setNear(near){
    this._near = near;
    return this;
}
setFar(far){ 
    this._far = far;
    return this;
}

/**
Update LP capture. Typically called when all 3D models are loaded and arranged into the scene.
Can be called at runtime or whenever there is some change in the 3D scene
@example
LP.update()
*/
update(){
    if (this._envtex) this._envtex.dispose();
    if (this._prevCCtarget) this._prevCCtarget.dispose();

    let CCtarget = new THREE.WebGLCubeRenderTarget( this._res, {
        format: THREE.RGBEFormat, //THREE.RGBEFormat,
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
        encoding: THREE.sRGBEncoding // prevent the material's shader from recompiling every frame
    });

    let CC = new THREE.CubeCamera( this._near, this._far, CCtarget );
    CC.position.copy(this.pos);
    //CC.layers.set(ATON.NTYPES.SCENE);

    CC.update( ATON._renderer, ATON._rootVisibleGlobal/*ATON._mainRoot*/ );
    this._envtex = CCtarget.texture;

    // new
    //this._LP.copy( THREE.LightProbeGenerator.fromCubeRenderTarget(ATON._renderer, CCtarget) );
    //this._envtex = this._LP;
    
    
/*
    console.log(CC);
    console.log(CCtarget);

    let CCtargetX = new THREE.WebGLCubeRenderTarget( this._res, {
        format: THREE.RGBFormat,
        //generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
        encoding: THREE.sRGBEncoding
    });

    let CCX = new THREE.CubeCamera( this._near, this._far, CCtargetX );
    CCX.position.copy(this.pos);

    CCX.update( ATON._renderer, ATON._rootVisible );
    this._envtex = this._pmremGenerator.fromCubemap(CCtargetX.texture).texture;
*/

    this._prevCCtarget = CCtarget;


/*
    if (this._LP0 === undefined || this._LP1 === undefined) return this;

    this._flipLP = !this._flipLP;
    //ATON._flipLP = !ATON._flipLP;

    if (this._flipLP){
        this._LP0.update( ATON._renderer, ATON._mainRoot );
        this._envtex = this._LPtarget0.texture;
    }
    else {
        this._LP1.update( ATON._renderer, ATON._mainRoot );
        this._envtex = this._LPtarget1.texture;
    }
*/
    return this;
}


getEnvTex(){
    return this._envtex;
}

assignToNode(N){
    if (N === undefined) return;
    //TODO:
}

}

export default LightProbe;