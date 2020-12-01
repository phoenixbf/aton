/*
    ATON spatial UI

    author: bruno.fanini_AT_gmail.com

===========================================================*/
import Button from "./ATON.sui.button.js";
import Label from "./ATON.sui.label.js";

/**
ATON Spatial UI
@namespace SUI
*/
let SUI = {};

SUI.STD_BTN_SIZE = 0.1;

SUI.Button = Button;
SUI.Label  = Label;


//Initializes Spatial UI module
SUI.init = ()=>{
    SUI.mainSelector = ATON.createUINode();
    //SUI.secondSelector = ATON.createUINode();

    //SUI._uiSelGeom = new THREE.SphereGeometry( 0.1, 16, 16 );
    SUI.mainSelector.add( new THREE.Mesh( ATON.Utils.geomUnitSphere, ATON.MatHub.getMaterial("selector") ));
    SUI.mainSelector.disablePicking();

    SUI.setSelectorRadius(0.05);
    SUI.mainSelector.visible = false;
    ATON._rootUI.add(SUI.mainSelector);

    // Main Font
    //SUI.PATH_FONT_JSON = ATON.PATH_MODS+"three-mesh-ui/examples/assets/Roboto-msdf.json"; // ATON.PATH_RES+"fonts/custom-msdf.json"
    //SUI.PATH_FONT_TEX  = ATON.PATH_MODS+"three-mesh-ui/examples/assets/Roboto-msdf.png"; // ATON.PATH_RES+"fonts/custom.png"
    SUI.PATH_FONT_JSON = ATON.PATH_RES+"fonts/custom-msdf.json"
    SUI.PATH_FONT_TEX  = ATON.PATH_RES+"fonts/custom.png"
/*
    ThreeMeshUI.FontLibrary.addFont("mainFont", 
        SUI.PATH_FONT_JSON, 
        new THREE.TextureLoader().load(SUI.PATH_FONT_TEX)
    );
*/
    // Measurements
    SUI.gMeasures = ATON.createUINode();
    SUI._prevMPoint = undefined;
    SUI._measLabels = [];
    ATON._rootUI.add(SUI.gMeasures);

    // Sem convex-shapes edit points 
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
    SUI._selectorRad = r;
    SUI.mainSelector.scale.set(r,r,r);
};

/**
Get selector current radius
@returns {number}
*/
SUI.getSelectorRadius = ()=>{
    //return SUI.mainSelector.scale.x;
    return SUI._selectorRad;
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

        fontFamily: SUI.PATH_FONT_JSON,
        fontTexture: SUI.PATH_FONT_TEX,
        //fontFamily: "mainFont",
        //fontTexture: "mainFont",

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

        fontFamily: SUI.PATH_FONT_JSON,
        fontTexture: SUI.PATH_FONT_TEX,

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

// Measurements

SUI.addMeasurementPoint = (P)=>{
    if (P === undefined) return undefined;

    let s = 0.01;
    let linetick = 0.001;

    let M = new THREE.Mesh( ATON.Utils.geomUnitSphere, ATON.MatHub.getMaterial("measurement"));
    M.position.copy(P);
    M.scale.set(s,s,s);
    SUI.gMeasures.add(M);

    // First time
    if (SUI._prevMPoint === undefined){
        SUI._prevMPoint = P;
        return undefined;
    }

    // Second point
    let d = SUI._prevMPoint.distanceTo(P);
    console.log(d);
    
    let mstr = " m";
    let scale = Math.max(d*1.5, 1.0);
    if (d < 0.5){ d *= 100.0; mstr= " cm"; }
    if (d < 0.05){ d *= 1000.0; mstr= " mm"; }
    if (d > 1000.0){ d * 0.001; mstr=" km"; }

    //let gLine = new THREE.CylinderBufferGeometry( linetick,linetick, d, 4 );
    let gLine = new THREE.BufferGeometry().setFromPoints([SUI._prevMPoint,P]);
    
    SUI.gMeasures.add( new THREE.Line( gLine, ATON.MatHub.getMaterial("measurement")) );

    let L = new SUI.Label();
    L.setBaseColor(ATON.MatHub.colors.white).setTextColor(ATON.MatHub.colors.black);

    L.setPosition(
        (SUI._prevMPoint.x + P.x)*0.5,
        (SUI._prevMPoint.y + P.y)*0.5,
        (SUI._prevMPoint.z + P.z)*0.5,
    );

    L.setScale(scale).setText(d.toPrecision(3)+mstr); // setScale(d*2.0)

    SUI.gMeasures.add(L);

    SUI._measLabels.push(L);

    // return obj
    let R = {};
    R.A = SUI._prevMPoint.clone();
    R.B = P.clone();

    SUI._prevMPoint = undefined;

    return R;   
};

SUI._updateMeasurements = ()=>{
    if (SUI._measLabels.length <= 0) return;

    for (let ml in SUI._measLabels){
        SUI._measLabels[ml].orientToCamera();
    }
};

// Main update routine
SUI.update = ()=>{
    if (ATON.Nav.isTransitioning() || ATON._bPauseQuery){
        SUI.infoNode.visible = false;
        return;
    }

    ThreeMeshUI.update();

    if (ATON._queryDataScene && !ATON.Nav._bInteracting){
        SUI.mainSelector.visible = true;
        SUI.mainSelector.position.copy(ATON._queryDataScene.p);    
    }
    else {
        SUI.mainSelector.visible = false;
    }

    // Measures
    SUI._updateMeasurements();

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
        
        if (!ATON.VRoadcast._bStreamFocus) SUI.mainSelector.visible = false;
    }
    else {
        SUI.infoNode.visible = false;
    }

    if (SUI.mainSelector.visible && ATON.VRoadcast._bStreamFocus){
        let ss = SUI._selectorRad * (1.0 + (Math.cos(ATON._clock.elapsedTime*10.0) * 0.2) );
        SUI.mainSelector.scale.set(ss,ss,ss);
    }

};

export default SUI;