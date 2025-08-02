let UI = {};

UI.setup = ()=>{

    UI._elMainToolbar   = ATON.UI.get("sideToolbar");
    UI._elBottomToolbar = ATON.UI.get("bottomToolbar");
    UI._elUserToolbar   = ATON.UI.get("userToolbar");

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
    UI General
=====================================*/
UI.hideMainElements = (b)=>{
    UI._elMainToolbar.classList.add("d-none");
    UI._elBottomToolbar.classList.add("d-none");
    UI._elUserToolbar.classList.add("d-none");
};
UI.showMainElements = (b)=>{
    UI._elMainToolbar.classList.remove("d-none");
    UI._elBottomToolbar.classList.remove("d-none");
    UI._elUserToolbar.classList.remove("d-none");
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

UI.createXRButton = ()=>{
    return ATON.UI.createButton({
        icon: "xr",
        onpress: UI.modalXR
    });
};

UI.createUserButton = ()=>{
    UI._elUserBTN = ATON.UI.createButton({
        icon: "user",
        onpress: UI.modalUser
    });

    ATON.checkAuth((u)=>{
        UI._elUserBTN.classList.add("aton-btn-highlight");
    });

    return UI._elUserBTN;
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
        //UI.createUserButton(),
        UI.createXRButton(),
        ATON.UI.createButtonHome()
    );

    UI._elUserToolbar.append( UI.createUserButton() );
};

UI.buildCustomToolbar = ()=>{
    HATHOR._tb = String(HATHOR._tb);
    let elements = HATHOR._tb.split(",");

    for (let e in elements){
        const E = elements[e];

        // TODO:
    }
};

/*
    Modals
=====================================*/
UI.modalHathor = ()=>{
    ATON.UI.showModal({
        header: "Hathor"

    });
};

UI.modalUser = ()=>{

    ATON.checkAuth(
        // Logged
        (u)=>{
            let elBody = ATON.UI.createContainer({ classes: "d-grid gap-2" });
            elBody.append(
                ATON.UI.createButton({
                    text: "Logout",
                    icon: "exit",
                    classes: "aton-btn-highlight",
                    onpress: ()=>{
                        ATON.REQ.logout();
                        ATON.UI.hideModal();
                        if (UI._elUserBTN) UI._elUserBTN.classList.remove("aton-btn-highlight");
                    }
                })
            );

            ATON.UI.showModal({
                header: u.username,
                body: elBody
            })
        },
        // Not logged
        ()=>{
            ATON.UI.showModal({
                header: "User",
                body: ATON.UI.createLoginForm({
                    onSuccess: (r)=>{
                        ATON.UI.hideModal();
                        if (UI._elUserBTN) UI._elUserBTN.classList.add("aton-btn-highlight");
                    },
                    onFail: ()=>{
                        // TODO:
                    }
                })
            })
        }
    );
};

UI.modalXR = ()=>{
    //TODO:
};

/*
    Side Panels
=====================================*/



export default UI;