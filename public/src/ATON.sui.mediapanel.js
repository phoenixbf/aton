/*
    ATON spatial UI Button class

    author: bruno.fanini_AT_gmail.com

===========================================================*/

import Node from "./ATON.node.js";
import Label from "./ATON.sui.label.js";

/**
Class representing a SpatialUI MediaPanel.
Create a SUI panel with multimedia content from URL (static image or video stream).
It automatically adjusts its height according to content ratio (fixed width = 1.0)
This can be arranged anywhere in the scene or attached to other SpatialUI nodes
@class MediaPanel
@example 
new ATON.SUI.MediaPanel("myButton")
*/
class MediaPanel extends Node {

constructor(uiid){
    super(uiid, ATON.NTYPES.UI);

    this._resurl = undefined;

    this._mediamesh = undefined;
    this._vs = undefined;
    this._yratio = 1.0;

    this._titleYoffs = 0.6;
    this._color = ATON.MatHub.colors.black;

    let self = this;

    this.onSelect = ()=>{
        if (self._vs){
            let el = self._vs.el;

            //if (!el.playing) el.play();
            //else el.pause();
        }
    };
}

/**
Load content for the media panel
@param {string} url - the url of the resource to load (static image or video stream)
@param {function} onComplete - (optional) routine on load completion 
*/
load(url, onComplete){

    this._yratio = 1.0;

    if (!this._mediamesh){
        this._mediamesh = new THREE.Mesh( new THREE.PlaneGeometry(1,1) /*, ATON.MatHub.materials.fullyTransparent*/);
        this.add(this._mediamesh);
    }

    url = ATON.Utils.resolveCollectionURL(url);

    let self = this;

    // Video stream
    if (ATON.Utils.isVideo(url)){
        this._vs = ATON.MediaFlow.getOrCreateVideoStream(this.nid, url, false);

        this._mediamesh.material = this._vs.matStream;

        this._vs.el.addEventListener('loadedmetadata', (e)=>{
            self._yratio = self._vs.el.videoHeight / self._vs.el.videoWidth;

            self._mediamesh.scale.y    = -self._yratio;

            self._resurl = url;

            self._onContentLoad();

            if (onComplete) onComplete();
        });
    }

    // Static image
    else {
        ATON.Utils.textureLoader.load(url, (tex) => {

            if (tex.image) this._yratio = tex.image.height / tex.image.width;

            self._mediamesh.scale.y = self._yratio;

            self._mediamesh.material = ATON.MatHub.materials.chromakey.clone();
            self._mediamesh.material.uniforms.tBase.value = tex;
/*
            self._mediamesh.material = new THREE.MeshStandardMaterial({
                map: texture,
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide
            });
*/

            self._mediamesh.material.needsUpdate = true;

            self._resurl = url;

            self._onContentLoad();

            if (onComplete) onComplete();
        });
    }

    this.setPickable(true);

    return this;
}

setColor(c){
    this._color = c;

    if (this._labelTitle) this._labelTitle.setBaseColor(c);
    if (this._bd) this._bd.material.color = c;

    return this;
}

getMaterial(){
    return this._mediamesh.material;
}

_onContentLoad(){
    if (this._labelTitle){
        this._labelTitle.position.y = this._yratio * this._titleYoffs;
    }

    if (this._bd){
        this._bd.scale.y = 1.05 * this._yratio;
    }
}

/**
Set a title for this panel
@param {string} title - The title string
*/
setTitle(title){
    if (!this._labelTitle){
        this._labelTitle = new Label(undefined, 0.5,0.07);
        this._labelTitle.position.z = -0.01;
        this._labelTitle.attachTo(this);
    }
    
    this._labelTitle.setText(title);
    this._labelTitle.setBaseColor(this._color);

    return this;
}

toggleTitle(b){
    if (!this._labelTitle) return this;

    this._labelTitle.toggle(b);

    return this;
}

// TODO
setBackdrop(opacity){
    this._bd = new THREE.Mesh( new THREE.PlaneGeometry(1,1) );

    this._bd.material = new THREE.MeshStandardMaterial({
        transparent: true,
        //depthWrite: false,
        side: THREE.DoubleSide,
        color: this._color,
        opacity: opacity? opacity : 0.5
    });

    this._bd.scale.x = 1.05;
    this._bd.scale.y = 1.05 * this._yratio;

/*
    this._bd = new ThreeMeshUI.Block({
        width: 1.05,
        height: this._yratio * 1.05,
        padding: 0.01,
        borderRadius: 0.05,
        backgroundColor: color? color : ATON.MatHub.colors.black,
        backgroundOpacity: opacity? opacity : 0.5,

        fontFamily: SUI.PATH_FONT_JSON,
        fontTexture: SUI.PATH_FONT_TEX,

        justifyContent: 'center',
        textAlign: 'center',
    });
*/
    this._bd.position.z = -0.005;

    this.add(this._bd);

    return this;
}

}

export default MediaPanel;