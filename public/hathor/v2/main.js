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

HATHOR.setSceneToLoad = (sid)=>{
    HATHOR._sidToLoad = sid;
};

HATHOR.setup = ()=>{
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

    ATON.on("SceneJSONLoaded",()=>{
        let ed = HATHOR.params.get('e');
        if (ed){
        ATON.checkAuth(
            (u)=>{
                HATHOR.enterEditorMode();
            });
        }
    });

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
        if (k==='s') HATHOR.UI.sideSemantics();
        if (k==='n') HATHOR.UI.sideNav();
        if (k==='v') HATHOR.UI.sideViewpoint();

        if (k === 'Delete'){
            if (ATON._hoveredSemNode){
                HATHOR.UI.modalDeleteSemanticID( ATON._hoveredSemNode );
            }
        }
    });

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
};

// Handle tap on current task if any
HATHOR.handleTaskOnTap = (e)=>{
    if (!HATHOR.currTask) return;

    if (HATHOR.currTask === HATHOR.TASK_BASIC_ANN){
        if (ATON._bqScene) ATON._handleQueryScene();
        ATON.SemFactory.stopCurrentConvex();

        HATHOR.UI.modalAnnotation();
    }

    if (HATHOR.currTask === HATHOR.TASK_CONVEX_ANN){
        if (ATON._bqScene) ATON._handleQueryScene();
        ATON.SemFactory.addSurfaceConvexPoint();
    }
};