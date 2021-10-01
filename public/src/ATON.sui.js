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
SUI.STD_SELECTOR_TICKNESS = 1.05;

SUI.Button = Button;
SUI.Label  = Label;


//Initializes Spatial UI module
SUI.init = ()=>{
    SUI.initSelector();

    SUI.fpTeleport = ATON.createUINode();
    let gTeleport = new THREE.CylinderBufferGeometry(0.4,0.4, 0.9, 32,1, true);
    //let gTeleport = new THREE.CylinderGeometry(0.4,0.4, 0.9, 32,1, true);

    let mTeleport = new THREE.Mesh( gTeleport, ATON.MatHub.getMaterial("teleportLoc") );
    mTeleport.renderOrder = 100;
    SUI.fpTeleport.add( mTeleport );
    SUI.fpTeleport.disablePicking();
    SUI.fpTeleport.visible = false;
    ATON._rootUI.add(SUI.fpTeleport);

    // Sem-shapes icons
    //SUI.enableSemIcons();

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

    // runtime measurement-line indicator
    let mLine = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);
    SUI._measLine = new THREE.Line( mLine, ATON.MatHub.getMaterial("measurement"));
    SUI._measLine.visible = false;
    ATON._rootUI.add(SUI._measLine);

    // Sem convex-shapes edit points 
    SUI.gPoints = ATON.createUINode();
    ATON._rootUI.add(SUI.gPoints);

    // Loc-Nodes
    SUI.gLocNodes = ATON.createUINode();
    ATON._rootUI.add(SUI.gLocNodes);

    SUI.buildInfoNode();
    SUI.bShowInfo = true;

    // InfoNode scale
    //SUI._labelScale   = ATON.Utils.isMobile()? 50.0 : 60.0; //note: inverse. Orginally 1.2 : 1.0;
    SUI._labelScale   = ATON.Utils.isMobile()? 80.0 : 90.0; //note: inverse. Orginally 1.2 : 1.0;
    SUI._labelScaleVR = 2.0;

    ATON.on("SemanticNodeHover", (semid)=>{
        SUI.setInfoNodeText(semid);
        if (SUI.gSemIcons) SUI.gSemIcons.hide();
    });
    ATON.on("SemanticNodeLeave", (semid)=>{
        if (SUI.gSemIcons) SUI.gSemIcons.show();
    });

    //SUI.setSemIconsOpacity(0.5);

/*
    ATON.on("UINodeHover", (uiid)=>{
        console.log("Hover UI node: "+uiid);
    });
    ATON.on("UINodeLeave", (uiid)=>{
        console.log("Leave UI node: "+uiid);
    });
*/

    SUI.sprites = {};

    SUI._sync = 0;
};

// Sprites
SUI.getOrCreateSpritePointEdit = ()=>{
    if (SUI.sprites.pointEdit) return SUI.sprites.pointEdit;

    SUI.sprites.pointEdit = new THREE.SpriteMaterial({ 
        map: new THREE.TextureLoader().load( ATON.PATH_RES+"sui-point.png" ), 
        color: ATON.MatHub.colors.orange,
        transparent: true,
        opacity: 1.0,
        //depthWrite: false, 
        depthTest: false
    });

    return SUI.sprites.pointEdit;
};

SUI.getOrCreateSpriteSemIcon = ()=>{
    if (SUI.sprites.semIcon) return SUI.sprites.semIcon;

    SUI.sprites.semIcon = new THREE.SpriteMaterial({ 
        map: new THREE.TextureLoader().load( ATON.PATH_RES+"sui-sem.png" ), 
        //color: ATON.MatHub.colors.sem, // multiply
        transparent: true,
        opacity: 1.0,
        //depthWrite: false, 
        depthTest: false
    });

    SUI.sprites.semIcon.sizeAttenuation = false;

    return SUI.sprites.semIcon;
};

SUI.getOrCreateSpriteLP = ()=>{
    if (SUI.sprites.lp) return SUI.sprites.lp;

    SUI.sprites.lp = new THREE.SpriteMaterial({ 
        map: new THREE.TextureLoader().load( ATON.PATH_RES+"sui-lp.png" ), 
        //color: ATON.MatHub.colors.sem, // multiply
        transparent: true,
        opacity: 1.0,
        depthWrite: false, 
        //depthTest: false
    });

    SUI.sprites.lp.sizeAttenuation = false;

    return SUI.sprites.lp;
};


// Realize main selector
SUI.initSelector = ()=>{
    SUI.mainSelector = ATON.createUINode();
    SUI._mSelectorSphere = new THREE.Mesh( ATON.Utils.geomUnitSphere, ATON.MatHub.getMaterial("selector") );
    SUI._mSelectorSphere.renderOrder = 100;

    let mSelBorder = new THREE.Mesh( ATON.Utils.geomUnitSphere, ATON.MatHub.getMaterial("outline"));
    mSelBorder.scale.set(SUI.STD_SELECTOR_TICKNESS, SUI.STD_SELECTOR_TICKNESS, SUI.STD_SELECTOR_TICKNESS);
    mSelBorder.renderOrder = 100;

    SUI.mainSelector.add( mSelBorder );
    SUI.mainSelector.add( SUI._mSelectorSphere );
    SUI.mainSelector.disablePicking();

    SUI.setSelectorRadius(0.05);
    SUI.mainSelector.visible = false;
    ATON._rootUI.add(SUI.mainSelector);
};

// note: before adding LPs
SUI.enableLPIcons = ()=>{
    SUI.gLPIcons = ATON.createUINode();
    SUI.gLPIcons.disablePicking();
    ATON._rootUI.add(SUI.gLPIcons);
};


SUI.enableSemIcons = ()=>{
    SUI.gSemIcons = ATON.createUINode();
    SUI.gSemIcons.disablePicking();
    ATON._rootUI.add(SUI.gSemIcons);
};

/**
Set selector radius
@param {number} r - the radius
*/
SUI.setSelectorRadius = (r)=>{
    SUI._selectorRad = r;
    SUI.mainSelector.scale.set(r,r,r);
    //console.log(r);
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

/**
Set selector color
@param {THREE.Color} color - color
@param {number} opacity - (optional) opacity 
*/
SUI.setSelectorColor = (color, opacity)=>{
    ATON.MatHub.materials.selector.color = color;
    if (opacity !== undefined) ATON.MatHub.materials.selector.opacity = opacity;
/*
    ATON.MatHub.materials.selector.uniforms.color.value = color;
    if (opacity !== undefined) ATON.MatHub.materials.selector.uniforms.opacity.value = opacity;
*/
};

// Sem-shape icons
SUI.addSemIcon = (semid, meshape)=>{
    if (SUI.gSemIcons === undefined) return;

    let bb = new THREE.Box3().setFromObject( meshape );
    let bs = new THREE.Sphere();
    bb.getBoundingSphere(bs);

    // icon sprite
    let semicon = new THREE.Sprite( SUI.getOrCreateSpriteSemIcon() );
    semicon.position.copy(bs.center);

    let ss = 0.035; //bs.radius * 0.3;
    semicon.scale.set(ss,ss,1.0);
    semicon.name = semid;

    SUI.gSemIcons.add(semicon);
};

SUI.addLPIcon = (LP)=>{
    if (SUI.gLPIcons === undefined) return;

    let rn = LP._near;
    let isize = 0.1; //rn * 0.3;

    let lpicon = new THREE.Sprite( SUI.getOrCreateSpriteLP() );
    lpicon.position.copy(LP.pos);
    lpicon.scale.set(isize,isize,isize);

    let s = new THREE.Mesh( ATON.Utils.geomUnitSphere, ATON.MatHub.materials.lp );
    s.scale.set(rn,rn,rn);
    s.position.copy(LP.pos);

    SUI.gLPIcons.add( lpicon );
    SUI.gLPIcons.add( s );
};

SUI.setSemIconsOpacity = (f)=>{
    if (f === undefined) ATON.MatHub.spriteSemIcon.opacity = 1.0;
    else ATON.MatHub.spriteSemIcon.opacity = f;
};


SUI.buildInfoNode = ()=>{
    SUI.infoNode = ATON.createUINode();
    SUI.infoNode.attachToRoot();

    SUI.infoContainer = new ThreeMeshUI.Block({
        width: 0.15,
        height: 0.05, //0.07,
        padding: 0.01,
        borderRadius: 0.02,
        backgroundColor: ATON.MatHub.colors.black, //darksem,
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

    //ThreeMeshUI.update();
};

/**
Get main UI Info Node
@returns {Node}
*/
SUI.getInfoNode = ()=>{
    return SUI.infoNode;
};

/**
Set text for main info node
@param {string} txt - the text
*/
SUI.setInfoNodeText = (txt)=>{
    if (!SUI.bShowInfo) return;
    SUI.infoNodeText.set({ content: txt });
    
    ThreeMeshUI.update();  
};

/**
Create a SpatialUI toolbar from a list of SUI buttons
This can be arranged anywhere in the scene or attached to other UI nodes
@param {array} buttonlist - a list (array) of SUI buttons
@param {THREE.Color} color - (optional) base color for the toolbar
@returns {Node}
*/
SUI.createToolbar = (buttonlist, color)=>{
    let T = ATON.createUINode();

    let num = buttonlist.length;
    let padding = SUI.STD_BTN_SIZE * 0.3;
    let marginf = 1.1;

    let cont = new ThreeMeshUI.Block({
        width: (SUI.STD_BTN_SIZE * num * marginf) + padding,
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

    let m = (num*0.5) * SUI.STD_BTN_SIZE * marginf;
    m -= (SUI.STD_BTN_SIZE*0.5);

    for (let i=0; i<num; i++){
        let button = buttonlist[i];
        if (button){
            button.position.set((i*SUI.STD_BTN_SIZE*marginf)-m, 0.0, 0.005);
            cont.add(button);
        }
    }

    T.add(cont);
    return T;
};


/**
Create a UI Node with a textured panel from URL
This can be arranged anywhere in the scene or attached to other UI nodes
@param {string} suid - The SUI Node ID (e.g.: "myPanel")
@param {string} url - URL to image
@param {number} w - (Optional) width
@param {number} h - (Optional) height
@returns {Node}
*/
SUI.buildPanelNode = (suid, url, w,h)=>{
    if (w === undefined) w = 1.0;
    if (h === undefined) h = 1.0;

    let suiNode = ATON.createUINode(suid);

    let pmesh = new THREE.Mesh(
        new THREE.PlaneGeometry( w, h, 2 ), 
        ATON.MatHub.materials.fullyTransparent
    );
    suiNode.add( pmesh );

    if (url !== undefined){
        ATON.Utils.textureLoader.load(url, (texture) => {
            pmesh.material = new THREE.MeshStandardMaterial({
                map: texture,
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide
            });
        });
    }

    return suiNode;
};

// Measurements
SUI.addMeasurementPoint = (P)=>{
    if (P === undefined) return undefined;

    let s = 0.01;
    let linetick = 0.001;
/*
    let M = new THREE.Mesh( ATON.Utils.geomUnitSphere, ATON.MatHub.getMaterial("measurement"));
    M.position.copy(P);
    M.scale.set(s,s,s);
    SUI.gMeasures.add(M);
*/

    // First time
    if (SUI._prevMPoint === undefined){
        SUI._prevMPoint = P;
        
        let mlArr = SUI._measLine.geometry.attributes.position.array;
        mlArr[0] = P.x;
        mlArr[1] = P.y;
        mlArr[2] = P.z;
        //mlArr[3] = P.x;
        //mlArr[4] = P.y;
        //mlArr[5] = P.z;

        //SUI._measLine.geometry.attributes.position.needsUpdate = true;

        //SUI._measLine.visible = true;
        return undefined;
    }

    SUI._measLine.visible = false;

    // Second point
    let d = SUI._prevMPoint.distanceTo(P);
    //console.log(d);

    s *= d;
    linetick *= d;

    let A = new THREE.Mesh( ATON.Utils.geomUnitSphere, ATON.MatHub.getMaterial("measurement"));
    A.position.copy(SUI._prevMPoint);
    A.scale.set(s,s,s);
    SUI.gMeasures.add(A);

    let B = new THREE.Mesh( ATON.Utils.geomUnitSphere, ATON.MatHub.getMaterial("measurement"));
    B.position.copy(P);
    B.scale.set(s,s,s);
    SUI.gMeasures.add(B);
    
    let scale = d * 2.0; //1.5; //Math.max(d*1.5, 1.0);

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

    L.setScale(scale).setText( ATON.Utils.getHumanReadableDistance(d) ); // setScale(d*2.0)

    SUI.gMeasures.add(L);

    SUI._measLabels.push(L);

    // return obj
    let R = {};
    R.A = SUI._prevMPoint.clone();
    R.B = P.clone();

    SUI._prevMPoint = undefined;

    return R;   
};

SUI.clearMeasurements = ()=>{
    SUI.gMeasures.removeChildren();
    SUI._measLabels = [];
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
/*
    SUI._sync = (SUI._sync+1) % 10;
    if (SUI._sync===0){
        ThreeMeshUI.update();
        //console.log("sync");
    } 
*/
    ThreeMeshUI.update();

    // Meas-line indicator
    if (SUI._prevMPoint){
        if (ATON._queryDataScene){
            let mlArr = SUI._measLine.geometry.attributes.position.array;
            mlArr[3] = ATON._queryDataScene.p.x;
            mlArr[4] = ATON._queryDataScene.p.y;
            mlArr[5] = ATON._queryDataScene.p.z;
            SUI._measLine.geometry.attributes.position.needsUpdate = true;
        }
        
        SUI._measLine.visible = true;
    }
    else SUI._measLine.visible = false;

    // Selector
    if (ATON._queryDataScene && !ATON.Nav._bInteracting){
        SUI.mainSelector.visible = true;
        SUI.mainSelector.position.copy(ATON._queryDataScene.p);
    }
    else {
        SUI.mainSelector.visible = false;
        //SUI.fpTeleport.visible = false;
    }

    // SemIcons
    if (SUI.gSemIcons){
        if (ATON.Nav._bInteracting){
            SUI.gSemIcons.hide();
        }
        else {
            if (ATON._hoveredSemNode === undefined) SUI.gSemIcons.show();
        }
    }

    // Teleport SUI
    if ((!ATON.Nav.isOrbit() || ATON.XR._bPresenting) && ATON.Nav.currentQueryValidForLocomotion()){
        SUI.fpTeleport.visible = true;
        SUI.fpTeleport.position.copy(ATON._queryDataScene.p);
    }
    else SUI.fpTeleport.visible = false;

    // Pointer-line
    if (ATON.XR._pointerLineMesh){

        let d = 0.0;
        if (ATON._queryDataScene) d = ATON._queryDataScene.d;
        if (ATON._queryDataUI && (d <= 0.0 || ATON._queryDataUI.d<d)){
            d = ATON._queryDataUI.d;
            SUI.mainSelector.visible = false;
            SUI.fpTeleport.visible   = false;
        }

        if (d>0.0){
            ATON.XR._pointerLineMesh.visible = true;
            ATON.XR._pointerLineMesh.scale.set(1,1,d);
        }
        else ATON.XR._pointerLineMesh.visible = false;
    }

    // Measures
    SUI._updateMeasurements();

    // InfoNode (semantics)
    if (ATON._queryDataSem){

        // Immersive Session
        if (ATON.XR._bPresenting){
            if (ATON.XR.controller0){
                SUI.infoNode.position.copy(ATON.XR.controller0pos); //.lerpVectors(ATON._queryDataSem.p, ATON.XR.controller0pos, 0.8);
                SUI.infoNode.position.x -= (ATON.XR.controller0dir.x * 0.1);
                SUI.infoNode.position.y -= (ATON.XR.controller0dir.y * 0.1); // + 0.1;
                SUI.infoNode.position.z -= (ATON.XR.controller0dir.z * 0.1);
                SUI.infoNode.setScale(SUI._labelScaleVR);
            }
            else {
                SUI.infoNode.position.lerpVectors(ATON._queryDataSem.p, ATON.Nav._currPOV.pos, 0.5);
                SUI.infoNode.setScale(ATON._queryDataSem.d * SUI._labelScaleVR);
            }
        }
        // Default session
        else {
            SUI.infoNode.position.lerpVectors(ATON._queryDataSem.p, ATON.Nav._currPOV.pos, 0.5);
            const ls = ATON._queryDataSem.d * (ATON.Nav._currPOV.fov / SUI._labelScale);
            SUI.infoNode.setScale(ls);
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