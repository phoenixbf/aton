/*
    ATON spatial UI Button class

    author: bruno.fanini_AT_gmail.com

===========================================================*/

import Node from "./ATON.node.js";

/**
Class representing a SpatialUI Button.
Constructor requires a uiid (UI Node ID)
@class Button
@example 
new ATON.SUI.Button("myButton")
*/
class Button extends Node {

constructor(uiid, ratio=1.0, fsize=1.0){
    super(uiid, ATON.NTYPES.UI);

    this.baseColor   = ATON.MatHub.colors.black;
    this.switchColor = ATON.MatHub.colors.green;

    this.baseOpacity  = 0.5;
    this.hoverOpacity = 0.8;

    this._bSwitched = false;

    this.container = new ThreeMeshUI.Block({
        width: 0.1*ratio,
        height: 0.1,
        padding: 0.01,
        borderRadius: 0.02,
        backgroundColor: this.baseColor,
        backgroundOpacity: this.baseOpacity,

        fontFamily: ATON.SUI.PATH_FONT_JSON,
        fontTexture: ATON.SUI.PATH_FONT_TEX,

        justifyContent: 'center',
        alignContent: 'center'
    });
    this.add(this.container);

    this.uiText = new ThreeMeshUI.Text({ 
        content: "",
        fontSize: 0.02*fsize,
        fontColor: ATON.MatHub.colors.white
    });
    //this.uiText.position.set(0,0,-0.01);
    this.container.add(this.uiText);

    // Trigger geom
    let trw = ATON.SUI.STD_BTN_SIZE * 0.9 * ratio;
    let trh = ATON.SUI.STD_BTN_SIZE * 0.9;
    this._trigger = new THREE.Mesh(
        new THREE.PlaneGeometry( trw, trh, 2 ), 
        ATON.MatHub.materials.fullyTransparent
    );
    this._trigger.position.set(0,0,0.002);

    this.add( this._trigger );

    this.onHover = ()=>{
        this.container.set({ 
            backgroundOpacity: this.hoverOpacity
        });
    };
    this.onLeave = ()=>{
        this.container.set({ 
            backgroundOpacity: this.baseOpacity 
        });
    };

    this.enablePicking();
}

/**
Set base color of the button
@param {THREE.Color} c - the color
*/
setBaseColor(c){
    this.baseColor = c;
    if (!this._bSwitched) this.container.set({ backgroundColor: this.baseColor });
    return this;
}

/**
Set button switch color (when activated)
@param {THREE.Color} c - the color
*/
setSwitchColor(c){
    this.switchColor = c;
    if (this._bSwitched) this.container.set({ backgroundColor: this.switchColor });
    return this;
}

setBackgroundOpacity(f){
    this.container.set({ backgroundOpacity: f });
    this.baseOpacity = f;
    return this;
}

/**
Set button text
@param {string} text
*/
setText(text){
    this.uiText.set({ content: text });
    return this;
}

/**
Switch the button (ON/OFF)
@param {boolean} b
*/
switch(b){
    this._bSwitched = b;
    if (b) this.container.set({ backgroundColor: this.switchColor });
    else this.container.set({ backgroundColor: this.baseColor });
    
    return this;
}

/**
Set button icon
@param {string} url - the url to the icon (tipically a PNG file)
*/
setIcon(url, bNoBackground){
    ATON.Utils.textureLoader.load(url, (texture) => {

        this._trigger.material = new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            depthWrite: false
        });

        if (bNoBackground){
            this.setBackgroundOpacity(0.0);
            this.hoverOpacity = 0.0;
        }

/*
        this.container.set({ 
            backgroundTexture: texture,
            backgroundOpacity: 1.0,
            backgroundColor: undefined 
        });
*/
        this.uiText.position.set(0,-0.035,0);
    });

    return this;
}

}

export default Button;