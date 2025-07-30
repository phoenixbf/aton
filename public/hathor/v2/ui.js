let UI = {};

UI.setup = ()=>{

    UI._elMainToolbar   = ATON.UI.get("sideToolbar");
    UI._elBottomToolbar = ATON.UI.get("bottomToolbar");

    ATON.UI.setSidePanelLeft();

    if (HATHOR._tb) UI.buildCustomToolbar();
    else UI.buildStandardToolbar();

    // UI elements to hide on interaction
    ATON.on("NavInteraction", b =>{

        if (b){
            UI.hideMainElements();
        }
        else {
            UI.showMainElements();
        }
    });
};

/*
    Buttons
=====================================*/
UI.createMainButton = ()=>{
    return ATON.UI.createButton({
        icon: "hathor",
        onpress: UI.modalHathor
    });
};


/*
    Main Toolbar
=====================================*/
UI.buildStandardToolbar = ()=>{
    UI._elBottomToolbar.append(
        ATON.UI.createButtonHome()
    );

    UI._elMainToolbar.append(
        UI.createMainButton(),
        UI.createMainButton(),
        UI.createMainButton(),
        ATON.UI.createButtonHome()
    )
};

UI.buildCustomToolbar = ()=>{
    HATHOR._tb = String(HATHOR._tb);
    let elements = HATHOR._tb.split(",");
};

UI.hideMainElements = (b)=>{
    UI._elMainToolbar.classList.add("d-none");
    UI._elBottomToolbar.classList.add("d-none");
};
UI.showMainElements = (b)=>{
    UI._elMainToolbar.classList.remove("d-none");
    UI._elBottomToolbar.classList.remove("d-none");
};

/*
    Modals
=====================================*/
UI.modalHathor = ()=>{
    ATON.UI.showModal({
        header: "Hathor"

    });
};

/*
    Side Panels
=====================================*/



export default UI;