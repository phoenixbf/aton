/*===========================================================================

    "Hathor" v2: ATON official front-end

    Author: B. Fanini

===========================================================================*/
import UI from "./ui.js";
import SUI from "./sui.js";
import ED from "./editor.js";

/**
Hathor V2 front-end (official ATON front-end)
@namespace HATHOR
*/
let HATHOR = ATON.App.realize();
window.HATHOR = HATHOR;

HATHOR.UI  = UI;
HATHOR.SUI = SUI;
HATHOR.ED  = ED;

// URL params
HATHOR._sidToLoad = HATHOR.params.get('s');
HATHOR._tb        = HATHOR.params.get('tb');

HATHOR.MODE_STD    = 0;
HATHOR.MODE_EDITOR = 1;

HATHOR._mode = HATHOR.MODE_STD;

// Tasks
HATHOR.currTask = undefined;

HATHOR.TASK_BASIC_ANN  = 1;
HATHOR.TASK_CONVEX_ANN = 2;
HATHOR.TASK_MEASURE_AB = 3;
HATHOR.TASK_DIR_LIGHT  = 4;

HATHOR.SEM_SHAPE_SPHERE = 0;
HATHOR.SEM_SHAPE_CONVEX = 1;

HATHOR.ID_VALIDATOR = new RegExp("^[a-zA-Z0-9. ]*$");

HATHOR.POVPATH_ALL = "*";

HATHOR.WEBSITE_URL = "https://osiris.itabc.cnr.it/aton/index.php/overview/hathor/";


HATHOR.setSceneToLoad = (sid)=>{
    HATHOR._sidToLoad = sid;
};

HATHOR.setup = ()=>{

    //HATHOR._bLD = false;
    HATHOR._cLightDir = new THREE.Vector3();

    HATHOR._bRMB = false;
    HATHOR._bCollabLogicSet = false;
    
    // POV Paths (TODO: move to Nav)
    HATHOR._povPaths = {};
    HATHOR._povPaths.all = {};
    HATHOR._povPaths.all.list = [];

    ATON.realize();
    ATON.UI.addBasicEvents();

    HATHOR.UI.setup();
    HATHOR.SUI.setup();
    HATHOR.ED.setup();

    HATHOR.setupLogic();
};

// Editor
HATHOR.enterEditorMode = ()=>{
    HATHOR._mode = HATHOR.MODE_EDITOR;

    HATHOR.UI.enterEditorMode();
    HATHOR.SUI.enterEditorMode();
    HATHOR.ED.setPersistentModifications(true);
};
 
HATHOR.exitEditorMode = ()=>{
    HATHOR._mode = HATHOR.MODE_STD;

    HATHOR.UI.exitEditorMode();
    HATHOR.SUI.exitEditorMode();
    HATHOR.ED.setPersistentModifications(false);
};

HATHOR.isEditorMode = ()=>{
    if (HATHOR._mode === HATHOR.MODE_EDITOR) return true;
    return false;
};

HATHOR.setupLogic = ()=>{
    // All flares ready
    ATON.on("AllFlaresReady",()=>{
        if (HATHOR._sidToLoad) HATHOR.loadScene( HATHOR._sidToLoad );
        else ATON.UI.showModal({
                header: "No Scene"
            });
    });

    ATON.on("SceneJSONLoaded", HATHOR.onSceneJSONLoaded );

    ATON.on("AllNodeRequestsCompleted",(bFirst)=>{
        // Everytime
        if (ATON.CC.anyCopyrightFound()){
            ATON.UI.showElement(UI._elCC);
        }
        
        if (!bFirst) return; // First time

        //...
    });

    ATON.on("Tap", (e)=>{
        HATHOR.handleTaskOnTap(e);

        // Handle sem annotations first
        if (ATON._hoveredSemNode && !HATHOR.currTask){
            HATHOR.showAnnotationContent(ATON._hoveredSemNode)
        }
        else {
            ATON.UI.hideSidePanel();
            //HATHOR.UI.closeToolPanel();
        }
    });

    ATON.on("MouseRightButton", b => {
        HATHOR._bRMB = b;
/*
        if (b){
            if (ATON._hoveredSemNode){
                if (HATHOR.isEditorMode()){
                    HATHOR.UI.modalAnnotation(ATON._hoveredSemNode);
                }
            }
        }
*/
    });


    // Handle general auth logic
    ATON.on("Login", (d)=>{
        if (!d) return;
        
        ATON.Photon.setUsername(d.username);
        //if (HATHOR._bCollabLogicSet) return;

        if (HATHOR.UI._elMyGall) ATON.UI.showElement(HATHOR.UI._elMyGall);

        let ed = HATHOR.params.get('e');
        if (ed) HATHOR.enterEditorMode();
    });

    ATON.on("Logout", ()=>{
        HATHOR.exitEditorMode();
        if (HATHOR.UI._elMyGall) ATON.UI.hideElement(HATHOR.UI._elMyGall);
    });

    HATHOR.setupCollabLogic();

    // Keyboard
    ATON.on("KeyPress", (k)=>{
        //if (UI._bSidePanel || ATON.UI._bSidePanel || ATON.UI._bModal) return;
        //if (UI._sidepanel._isShown || ATON.UI.sidepanel._isShown || ATON.UI.modal._isShown) return;
        if (ATON.UI.isInputFocused()) return;

        if (k==='+'){
            let f = ATON.Nav.getFOV() + 1.0;
            ATON.Nav.setFOV(f);
        }
        if (k==='-'){
            let f = ATON.Nav.getFOV() - 1.0;
            ATON.Nav.setFOV(f);
        }

        if (k==='Escape') HATHOR.endCurrentTask();

        // Modifiers
        //if (k ==="Shift")  ATON.Nav.setUserControl(false);
        //if (k==="Control") ATON.Nav.setUserControl(false);

        // Side panels shortcuts
        if (k==='g') HATHOR.UI.sideLayers();
        if (k==='a'){
            if (ATON._hoveredSemNode && HATHOR.isEditorMode()){
                HATHOR.UI.modalAnnotation(ATON._hoveredSemNode);
            }
            else HATHOR.UI.sideSemantics();
        }
        if (k==='s') HATHOR.UI.sideScene();
        if (k==='e') HATHOR.UI.sideEnv();
        if (k==='n') HATHOR.UI.sideNav();
        if (k==='v') HATHOR.UI.sideViewpoint();
        if (k==='x') HATHOR.UI.sideFX();
        if (k==='t') HATHOR.UI.sideTools();
        if (k==='?') HATHOR.UI.modalHelp();
        if (k==='u') HATHOR.UI.openUserModal();

        if (k==='ArrowRight') ATON.Nav.requestNextPOVinPath(HATHOR.POVPATH_ALL);
        if (k==='ArrowLeft') ATON.Nav.requestPrevPOVinPath(HATHOR.POVPATH_ALL);

        //if (k==='l') HATHOR._bLD = true;

        if (k === 'Delete'){
            if (ATON._hoveredSemNode){
                HATHOR.UI.modalDeleteSemanticID( ATON._hoveredSemNode );
            }
        }

        if (k==='f'){
            ATON.Nav.setUserControl(false);

            if (ATON._queryDataScene){
                ATON.SUI.showSelector(true);

                ATON.Photon.setFocusStreaming(true);
                ATON.FX.setDOFfocus( ATON._queryDataScene.d );
            }
        }
    });

    ATON.on("KeyUp",(k)=>{
        //if (k==='l') HATHOR._bLD = false;

        // Modifiers
        //if (k ==="Shift")  ATON.Nav.setUserControl(true);
        //if (k==="Control") ATON.Nav.setUserControl(true);

        if (k==='f'){
            ATON.Nav.setUserControl(true);

            ATON.Photon.setFocusStreaming(false);
            if (!HATHOR.isEditorMode()) ATON.SUI.showSelector(false);

/*
            if (ATON.FX.isPassEnabled(ATON.FX.PASS_DOF)){
                let k = ATON.FX.getDOFfocus().toPrecision(ATON.SceneHub.FLOAT_PREC);

                ATON.SceneHub.patch({
                    fx:{ 
                        dof:{
                            f: k
                        }
                    }
                }, ATON.SceneHub.MODE_ADD);
            }
*/
        }
    });


    // Mouse
    ATON.on("MouseWheel", (d)=>{
        let f = 0.9;
        let selRange = ATON.SUI.getSelectorRange();

        if (ATON._kModCtrl){
            let ff = ATON.Nav.getFOV();
            
            if (d > 0.0) ff += 1.0;
            else ff -= 1.0;

            ATON.Nav.setFOV(ff);
            return;
        }

        if (ATON._kModShift || ATON.Photon._bStreamFocus){
            let r = ATON.SUI.getSelectorRadius();

            if (d > 0.0) r *= f;
            else r /= f;

            if (r < selRange[0]) r = selRange[0];
            if (r > selRange[1]) r = selRange[1];

            ATON.SUI.setSelectorRadius(r);
            return;
        }
    });

};

HATHOR.onSceneJSONLoaded = ()=>{
    let ed = HATHOR.params.get('e');
    if (ed){
        ATON.checkAuth(
            (u)=>{
                HATHOR.enterEditorMode();
            },
            ()=>{
                HATHOR.UI.openUserModal();
            });
    }
    let sid = ATON.SceneHub.currID;

    // General POV UI update
    HATHOR.UI.updatePOVs();

    if (HATHOR.params.get('c')){

    }

/*
    ATON.REQ.post("scenes/"+sid+"/snapshot", { snapshotname: "prev" }, (r)=>{
        console.log(r)
    });
*/
    HATHOR.UI.modalSceneDescription();
};

// Sem Annotations
//===========================================
HATHOR.getHTMLDescriptionFromSemNode = (semid)=>{
    let S = ATON.getSemanticNode(semid);
    if (S === undefined) return undefined;
    
    let descr = S.getDescription();
    if (descr === undefined) return undefined;

    descr = JSON.parse(descr);
    return descr;
};

HATHOR.showAnnotationContent = (semid)=>{
    if (!semid) return;

    HATHOR.UI.showSemanticPanel(semid);
};

HATHOR.validateSemID = (semid)=>{
    const invalid = { semid: undefined, valid: false };

    semid = semid.trim();
    if (semid.length < 1) return invalid;

    return { semid: semid, valid: true };
};

// Tasks
//===========================================
HATHOR.setCurrentTask = (task)=>{
    HATHOR.currTask = task;

    HATHOR.UI.buildTaskToolbar(task);
};

HATHOR.endCurrentTask = ()=>{
    HATHOR.currTask = undefined;

    if (ATON.SemFactory.isBuildingShape()){
        ATON.SemFactory.stopCurrentConvex();
    }

    HATHOR.UI.clearTaskToolbar();
    ATON.UI.setCursorStyle("auto");
    ATON.Nav.setUserControl(true);
};

// Handle tap on current task if any
HATHOR.handleTaskOnTap = (e)=>{
    if (!HATHOR.currTask) return;

    if (HATHOR.currTask === HATHOR.TASK_BASIC_ANN){
        if (ATON._bqScene) ATON._handleQueryScene();
        ATON.SemFactory.stopCurrentConvex();

        if (!ATON._queryDataScene) return;

        HATHOR.UI.modalAnnotation();
    }

    if (HATHOR.currTask === HATHOR.TASK_CONVEX_ANN){
        if (ATON._bqScene) ATON._handleQueryScene();
        ATON.SemFactory.addSurfaceConvexPoint();
    }

    if (HATHOR.currTask === HATHOR.TASK_MEASURE_AB){
        let P = ATON.getSceneQueriedPoint();
        let M = ATON.SUI.addMeasurementPoint( P );

        if (M === undefined) return;

        HATHOR.ED.addMeasure({ measure: M });
    }
};

// Collab / Photon logic
//===========================================
HATHOR.setupCollabLogic = ()=>{
    if (HATHOR._bCollabLogicSet) return;

    ATON.on("VRC_IDassigned", (uid)=>{
        if (!ATON.Photon.getUsername()){
            ATON.Photon.setUsername("User #"+uid);
        }

        ATON.SUI.setSelectorColor( ATON.Photon.color );
        ATON.plight.color = ATON.Photon.color;

        ATON.checkAuth((u)=>{
            if (u.username !== undefined) ATON.Photon.setUsername( u.username );
            HATHOR.UI.sideCollab();
        });

        if (HATHOR.UI._elPhoton){
            HATHOR.UI._elPhoton.classList.add("aton-btn-photon");
            UI._elPhoton.removeAttribute("disabled");

            //let n = ATON.Photon.ucolors.length;
            //let c = (uid % n);

            //let strcol = ATON.Photon.ucolors[c].getStyle();
            let strcol = ATON.Photon.color.getStyle();

            UI._elPhoton.style["background-color"] = strcol;
        }

        if (UI._elTalkBTN) ATON.UI.showElement(UI._elTalkBTN); 
    });

    ATON.on("VRC_Disconnected", ()=>{
        if (HATHOR.UI._elPhoton){
            HATHOR.UI._elPhoton.classList.remove("aton-btn-photon");
            UI._elPhoton.style["background-color"] = "";
        }

        if (UI._elTalkBTN) ATON.UI.hideElement(UI._elTalkBTN);
    });

    ATON.on("VRC_SceneState", (sstate)=>{
        let numUsers = ATON.Photon.getNumUsers();
        if (numUsers>1){

        }
    });

    ATON.on("VRC_UMessage", (data)=>{
        HATHOR.UI.addMessage({ uid: data.uid, msg: data.msg });
    });

    HATHOR._bCollabLogicSet = true;
};


// Main update
//===========================================
HATHOR.update = ()=>{

    if (HATHOR.currTask === HATHOR.TASK_DIR_LIGHT && (ATON._kModCtrl || ATON.Utils.isMobile())){
    //if (HATHOR.currTask === HATHOR.TASK_DIR_LIGHT && ){

        const sx = ATON._screenPointerCoords.x;
        const sy = ATON._screenPointerCoords.y;

        HATHOR._cLightDir.x = -Math.cos(sx * Math.PI);
        HATHOR._cLightDir.y = -sy * 4.0;
        HATHOR._cLightDir.z = -Math.sin(sx * Math.PI);

        HATHOR._cLightDir.normalize();

        ATON.setMainLightDirection(HATHOR._cLightDir);
    }
};