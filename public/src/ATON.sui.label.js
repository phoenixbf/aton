/*
    ATON spatial UI Label class

    author: bruno.fanini_AT_gmail.com

===========================================================*/

import Node from "./ATON.node.js";

/**
Class representing a SpatialUI Label.
Constructor requires a uiid (UI Node ID)
@class Label
@example 
new ATON.SUI.Label().setText("Hello")
*/
class Label extends Node {

constructor(uiid, w,h){
    super(uiid, ATON.NTYPES.UI);

    this.baseColor = ATON.MatHub.colors.black;

    this.container = new ThreeMeshUI.Block({
        width: (w)? w : 0.2,
        height: (h)? h: 0.05,
        padding: 0.001,
        borderRadius: 0.01,
        backgroundColor: this.baseColor,
        backgroundOpacity: 0.5,

        fontFamily: ATON.SUI.PATH_FONT_JSON,
        fontTexture: ATON.SUI.PATH_FONT_TEX,

        justifyContent: 'center', // could be 'center' or 'left'
        textAlign: 'center',
    });
    this.container.position.z = 0.03;
    this.add(this.container);

    this.uiText = new ThreeMeshUI.Text({ 
        content: "Label",
        fontSize: 0.03,
        fontColor: ATON.MatHub.colors.white
    });
    this.container.add(this.uiText);

    ThreeMeshUI.update();

/*
    this._trigger = new THREE.Mesh( 
        new THREE.PlaneGeometry( ATON.SUI.STD_BTN_SIZE*0.9, ATON.SUI.STD_BTN_SIZE*0.9, 2 ), 
        ATON.MatHub.materials.fullyTransparent
    );
    this._trigger.position.set(0,0,0.002);

    this.add( this._trigger );

    this.onHover = ()=>{
        this.container.set({ 
            backgroundOpacity: 0.8
        });
    };
    this.onLeave = ()=>{
        this.container.set({ 
            backgroundOpacity: 0.5 
        });
    };

    this.enablePicking();
*/
}

/**
Set base color of the label
@param {THREE.Color} c - the color
*/
setBaseColor(c){
    this.baseColor = c;
    this.container.set({ backgroundColor: this.baseColor });

    ThreeMeshUI.update();
    return this;
}

setTextColor(c){
    this.uiText.set({ fontColor: c });

    ThreeMeshUI.update();
    return this;
}

/**
Set button text
@param {string} text
*/
setText(text){
    this.uiText.set({ content: text });
    
    ThreeMeshUI.update();
    return this;
}

/*
setAutoOrientation(b){
    if (b === true){
        let self = this;

        this.onAfterRender = ()=>{
            self.quaternion.copy( ATON.Nav._qOri );
            console.log("x");
        };
    }
    else this.onAfterRender = undefined;
}
*/


}

export default Label;