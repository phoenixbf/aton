/*
    ATON spatial UI

    author: bruno.fanini_AT_gmail.com

===========================================================*/
import Button from "./ATON.sui.button.js";


/**
ATON Spatial UI
@namespace SUI
*/
let SUI = {};

SUI.STD_BTN_SIZE = 0.1;

SUI.Button = Button;


//Initializes Spatial UI module
SUI.init = ()=>{
    SUI.mainSelector   = ATON.createUINode();
    //SUI.secondSelector = ATON.createUINode();

    //SUI._uiSelGeom = new THREE.SphereGeometry( 0.1, 16, 16 );
    SUI.mainSelector.add( new THREE.Mesh( ATON.Utils.geomUnitSphere, ATON.MatHub.getMaterial("selector") ));
    SUI.mainSelector.disablePicking();

    SUI.setSelectorRadius(0.05);
    SUI.mainSelector.visible = false;

    ATON._rootUI.add(SUI.mainSelector);

    SUI.gPoints = ATON.createUINode();
    ATON._rootUI.add(SUI.gPoints);

    SUI.buildInfoNode();
    SUI.bShowInfo = true;

    SUI._labelScale   = ATON.Utils.isMobile()? 1.2 : 1.0;
    SUI._labelScaleVR = 2.0;

    ATON.on( "SemanticNodeHover", (semid)=>{
        if (!SUI.bShowInfo) return;
        SUI.infoNodeText.set({ content: semid });
    });
/*
    ATON.on("UINodeHover", (uiid)=>{
        console.log("Hover UI node: "+uiid);
    });
    ATON.on("UINodeLeave", (uiid)=>{
        console.log("Leave UI node: "+uiid);
    });
*/
};

/**
Set selector radius
@param {number} r - the radius
*/
SUI.setSelectorRadius = (r)=>{
    SUI.mainSelector.scale.set(r,r,r);
};

/**
Get selector current radius
@returns {number}
*/
SUI.getSelectorRadius = ()=>{
    return SUI.mainSelector.scale.x;
};

/**
Set selector 3D model
@param {string} path - the model path (usually gltf or glb)
@param {boolean} bUseStdMat - (optional) overwrites 3D model materials with standard selector material 
*/
SUI.setSelectorModel = (path, bUseStdMat)=>{
    if (path === undefined) return;

    SUI.mainSelector.removeChildren();

    SUI.mainSelector.load(path).disablePicking();
    if (bUseStdMat) SUI.mainSelector.setMaterial( ATON.MatHub.getMaterial("selector") );
};

SUI.buildInfoNode = ()=>{
    SUI.infoNode = ATON.createUINode();
    SUI.infoNode.attachToRoot();

    SUI.infoContainer = new ThreeMeshUI.Block({
        width: 0.15,
        height: 0.05, //0.07,
        padding: 0.01,
        borderRadius: 0.02,
        //backgroundColor: ATON.MatHub.colors.darksem,
        //backgroundOpacity: 0.2,

        fontFamily: ATON.PATH_RES+"fonts/custom-msdf.json", //ATON.PATH_MODS+'three-mesh-ui/examples/assets/Roboto-msdf.json',
        fontTexture: ATON.PATH_RES+"fonts/custom.png", //ATON.PATH_MODS+'three-mesh-ui/examples/assets/Roboto-msdf.png',

        alignContent: 'center', // could be 'center' or 'left'
        justifyContent: 'center', // could be 'center' or 'start'
    });
    SUI.infoNode.add(SUI.infoContainer);

    SUI.infoNodeText = new ThreeMeshUI.Text({ 
        content: "Info",
        fontSize: 0.02,
        fontColor: ATON.MatHub.colors.white
    });
    SUI.infoContainer.add(SUI.infoNodeText);
    //SUI.infoNode.scale.set(0.07,0.07,0.07);
};

/**
Get main UI Info Node
@returns {Node}
*/
SUI.getInfoNode = ()=>{
    return SUI.infoNode;
};

/**
Create a SpatialUI toolbar from a list of SUI buttons
This can be arranged anywhere in the scene or attached to other UI nodes
@param {string} buttonlist - a list (array) of SUI buttons
@param {THREE.Color} color - (optional) base color for the toolbar
@returns {Node}
*/
SUI.createToolbar = (buttonlist, color)=>{
    let T = ATON.createUINode();

    let num = buttonlist.length;
    let padding = SUI.STD_BTN_SIZE * 0.3;

    let cont = new ThreeMeshUI.Block({
        width: (SUI.STD_BTN_SIZE * num) + padding,
        height: SUI.STD_BTN_SIZE + padding,
        padding: 0.01,
        borderRadius: 0.02,
        backgroundColor: color? color : ATON.MatHub.colors.black,
        backgroundOpacity: 0.3,

        fontFamily: ATON.PATH_RES+"fonts/custom-msdf.json",
        fontTexture: ATON.PATH_RES+"fonts/custom.png",

        alignContent: 'center', // could be 'center' or 'left'
        justifyContent: 'center', // could be 'center' or 'start'
    });
    //cont.position.set(0,0,0);

    let m = (num*0.5) * SUI.STD_BTN_SIZE;
    m -= (SUI.STD_BTN_SIZE*0.5);

    for (let i=0; i<num; i++){
        let button = buttonlist[i];
        button.position.set((i*SUI.STD_BTN_SIZE)-m, 0.0, 0.01);
        cont.add(button);
    }

    T.add(cont);
    return T;
};

// Main update routine
SUI.update = ()=>{
    if (ATON.Nav.isTransitioning() || ATON._bPauseQuery){
        SUI.infoNode.visible = false;
        return;
    }

    ThreeMeshUI.update();

    if (ATON._queryDataScene){
        SUI.mainSelector.visible = true;
        SUI.mainSelector.position.copy(ATON._queryDataScene.p);    
    }
    else {
        SUI.mainSelector.visible = false;
    }

    // InfoNode (semantics)
    if (ATON._queryDataSem){

        if (ATON.XR._bPresenting){
            SUI.infoNode.position.copy(ATON.XR.controller0pos); //.lerpVectors(ATON._queryDataSem.p, ATON.XR.controller0pos, 0.8);
            SUI.infoNode.position.y += 0.1;
            SUI.infoNode.setScale(SUI._labelScaleVR);
        }
        else {
            SUI.infoNode.position.lerpVectors(ATON._queryDataSem.p, ATON.Nav._currPOV.pos, 0.2);
            SUI.infoNode.setScale(ATON._queryDataSem.d * SUI._labelScale);
        }
        SUI.infoNode.orientToCamera();

        if (SUI.bShowInfo) SUI.infoNode.visible = true;
        SUI.mainSelector.visible = false;
    }
    else {
        SUI.infoNode.visible = false;
    }

};

export default SUI;