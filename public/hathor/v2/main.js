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


HATHOR.setSceneToLoad = (sid)=>{
    HATHOR._sidToLoad = sid;
};

HATHOR.setup = ()=>{

    HATHOR._bLD = false;
    HATHOR._cLightDir = new THREE.Vector3();
    
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
        
        if (!bFirst) return; // First time

        //...
    });

    ATON.on("Tap", (e)=>{
        HATHOR.handleTaskOnTap(e);

        // Handle sem annotations first
        if (ATON._hoveredSemNode){
            HATHOR.showAnnotationContent(ATON._hoveredSemNode)
        }
        else {
            ATON.UI.hideSidePanel();
            HATHOR.UI.closeToolPanel();
        }
    });

    // Handle general auth logic
    ATON.on("Login", (d)=>{
        if (!d) return;
        
        ATON.Photon.setUsername(d.username);
    });

    ATON.on("Logout", ()=>{
        HATHOR.exitEditorMode();
    });

    // Keyboard
    ATON.on("KeyPress", (k)=>{
        if (UI._bSidePanel || ATON.UI._bSidePanel || ATON.UI._bModal) return;

        if (k==='+'){
            let f = ATON.Nav.getFOV() + 1.0;
            ATON.Nav.setFOV(f);
        }
        if (k==='-'){
            let f = ATON.Nav.getFOV() - 1.0;
            ATON.Nav.setFOV(f);
        }

        if (k==='g') HATHOR.UI.sideLayers();
        if (k==='a') HATHOR.UI.sideSemantics();
        if (k==='s') HATHOR.UI.sideScene();
        if (k==='n') HATHOR.UI.sideNav();
        if (k==='v') HATHOR.UI.sideViewpoint();

        if (k==='l') HATHOR._bLD = true;

        if (k === 'Delete'){
            if (ATON._hoveredSemNode){
                HATHOR.UI.modalDeleteSemanticID( ATON._hoveredSemNode );
            }
        }
    });

    ATON.on("KeyUp",(k)=>{
        if (k==='l') HATHOR._bLD = false;
    });

};

HATHOR.onSceneJSONLoaded = ()=>{
    let ed = HATHOR.params.get('e');
    if (ed){
        ATON.checkAuth(
            (u)=>{
                HATHOR.enterEditorMode();
            });
    }
    let sid = ATON.SceneHub.currID;

    // General POV UI update
    HATHOR.UI.updatePOVs();

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
};


// Main update
//===========================================
HATHOR.update = ()=>{

    if (HATHOR.currTask === HATHOR.TASK_DIR_LIGHT && (HATHOR._bLD || ATON.Utils.isMobile())){
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