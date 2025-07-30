/*===========================================================================

    "Hathor" v2: ATON official front-end

    Author: B. Fanini

===========================================================================*/
import UI from "./ui.js";

/**
Hathor front-end (official ATON front-end)
@namespace HATHOR
*/
let HATHOR = ATON.App.realize();
window.HATHOR = HATHOR;

HATHOR.UI = UI;


HATHOR._sidToLoad = HATHOR.params.get('s');
HATHOR._tb        = HATHOR.params.get('tb');

HATHOR._bEditor   = false;


HATHOR.setSceneToLoad = (sid)=>{
    HATHOR._sidToLoad = sid;
};

HATHOR.setup = ()=>{
    ATON.realize();
    ATON.UI.addBasicEvents();

    HATHOR.UI.setup();

    HATHOR.setupLogic();
};

HATHOR.setupLogic = ()=>{
    // All flares ready
    ATON.on("AllFlaresReady",()=>{
        if (HATHOR._sidToLoad) HATHOR.loadScene( HATHOR._sidToLoad );
        else ATON.UI.showModal({
                header: "No Scene"
            });
    });


};