/*
    ATON spatial UI Button class

    author: bruno.fanini_AT_gmail.com

===========================================================*/

import Node from "./ATON.node.js";

export default class Button extends Node {
    constructor(uiid){
        super(uiid, ATON.NTYPES.UI);

        this.baseColor   = ATON.MatHub.colors.black;
        this.switchColor = ATON.MatHub.colors.green;

        this._bSwitched = false;

        this.container = new ThreeMeshUI.Block({
            width: 0.1,
            height: 0.1,
            padding: 0.01,
            borderRadius: 0.02,
            backgroundColor: this.baseColor,
            backgroundOpacity: 0.5,

            fontFamily: ATON.PATH_RES+"fonts/custom-msdf.json",
            fontTexture: ATON.PATH_RES+"fonts/custom.png",

            justifyContent: 'center',
            alignContent: 'center'
        });
        this.add(this.container);

        this.uiText = new ThreeMeshUI.Text({ 
            content: "button",
            fontSize: 0.02,
            fontColor: ATON.MatHub.colors.white
        });
        this.container.add(this.uiText);

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
    }

    setBaseColor(c){
        this.baseColor = c;
        if (!this._bSwitched) this.container.set({ backgroundColor: this.baseColor });
        return this;
    }
    setSwitchColor(c){
        this.switchColor = c;
        if (this._bSwitched) this.container.set({ backgroundColor: this.switchColor });
        return this;
    }

    setText(text){
        this.uiText.set({ content: text });
        return this;
    }

    switch(b){
        this._bSwitched = b;
        if (b) this.container.set({ backgroundColor: this.switchColor });
        else this.container.set({ backgroundColor: this.baseColor });
        
        return this;
    }

    setIcon(url){
        ATON.Utils.textureLoader.load(url, (texture) => {

            this._trigger.material = new THREE.MeshStandardMaterial({
                map: texture,
                transparent: true,
                depthWrite: false
            });
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