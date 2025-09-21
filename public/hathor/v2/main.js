/*===========================================================================

    "Hathor" v2: ATON official front-end

    Author: B. Fanini

===========================================================================*/
import UI from "./ui.js";
import ED from "./editor.js";

/**
Hathor V2 front-end (official ATON front-end)
@namespace HATHOR
*/
let HATHOR = ATON.App.realize();
window.HATHOR = HATHOR;

HATHOR.UI = UI;
HATHOR.ED = ED;

// URL params
HATHOR._sidToLoad = HATHOR.params.get('s');
HATHOR._tb        = HATHOR.params.get('tb');

HATHOR.MODE_STD    = 0;
HATHOR.MODE_EDITOR = 1;

HATHOR._mode = HATHOR.MODE_STD;


HATHOR.setSceneToLoad = (sid)=>{
    HATHOR._sidToLoad = sid;
};

HATHOR.setup = ()=>{
    ATON.realize();
    ATON.UI.addBasicEvents();

    HATHOR.UI.setup();
    HATHOR.ED.setup();

    HATHOR.setupLogic();
};

// Editor
HATHOR.enterEditorMode = ()=>{
    HATHOR._mode = HATHOR.MODE_EDITOR;

    HATHOR.UI.enterEditorMode();
};
 
HATHOR.exitEditorMode = ()=>{
    HATHOR._mode = HATHOR.MODE_STD;

    HATHOR.UI.exitEditorMode();
};

HATHOR.setupLogic = ()=>{
    // All flares ready
    ATON.on("AllFlaresReady",()=>{
        if (HATHOR._sidToLoad) HATHOR.loadScene( HATHOR._sidToLoad );
        else ATON.UI.showModal({
                header: "No Scene"
            });
    });

    ATON.on("Tap", (e)=>{
        // Handle sem annotations first
        if (ATON._hoveredSemNode){
            HATHOR.showAnnotationContent(ATON._hoveredSemNode)
        }
        else {
            ATON.UI.hideSidePanel();
            HATHOR.UI.closeToolPanel();
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

    // TODO: audio sound

    let htmlContent = HATHOR.getHTMLDescriptionFromSemNode(semid);
    if (!htmlContent) return;

    let elContent = ATON.UI.createElementFromHTMLString("<div>"+htmlContent+"</div>");

    HATHOR.UI.showSemanticPanel(semid, elContent);
};