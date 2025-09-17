/*===========================================================================

    "Hathor" v2
    UI routines

    Author: B. Fanini

===========================================================================*/
let UI = {};

UI.setup = ()=>{

    UI._elMainToolbar   = ATON.UI.get("sideToolbar");
    UI._elBottomToolbar = ATON.UI.get("bottomToolbar");
    UI._elUserToolbar   = ATON.UI.get("userToolbar");

    // Dedicated side panel
    UI._elSidePanel = ATON.UI.createElementFromHTMLString(`
        <div class="offcanvas offcanvas-start aton-std-bg aton-sidepanel hathor-side-panel" tabindex="-1">
        </div>
    `);
    UI._sidepanel = new bootstrap.Offcanvas(UI._elSidePanel);
    document.body.append(UI._elSidePanel);

    UI._elWYSIWYG = undefined;

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
UI.setTheme = (theme)=>{
    ATON.UI.setTheme(theme);

    //if (UI.WYSIWYG) TODO:
};

UI.hideMainElements = ()=>{
    ATON.UI.hideElement(UI._elMainToolbar); //.classList.add("d-none");
    ATON.UI.hideElement(UI._elBottomToolbar); //.classList.add("d-none");
    ATON.UI.hideElement(UI._elUserToolbar); //.classList.add("d-none");
};
UI.showMainElements = ()=>{
    ATON.UI.showElement(UI._elMainToolbar); //.classList.remove("d-none");
    ATON.UI.showElement(UI._elBottomToolbar); //.classList.remove("d-none");
    ATON.UI.showElement(UI._elUserToolbar); //.classList.remove("d-none");
};

/*
    Semantics
=====================================*/
UI.showSemanticPanel = (title, elContent)=>{
    UI.closeToolPanel();

    ATON.UI.showSidePanel({
        header: title,
        body: elContent
    });
};

UI.closeSemanticPanel = ()=>{
    ATON.UI.hideSidePanel();
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

UI.createToolButton = ()=>{
    return ATON.UI.createButton({
        icon: "hathor",
        onpress: UI.sideTool
    });
};

UI.createLayersButton = ()=>{
    return ATON.UI.createButton({
        icon: "layers",
        onpress: UI.sideLayers
    });
};

UI._onUser = (username)=>{
	if (!UI._elUserBTN) return;

	if (username){
		//console.log(username);
		UI._elUserBTN.classList.add("aton-btn-highlight");
		UI._elUserBTN.append(ATON.UI.createElementFromHTMLString("<span class='aton-btn-text'>"+username+"</span>"));
	}
	else {
		UI._elUserBTN.classList.remove("aton-btn-highlight");
		UI._elUserBTN.removeChild(UI._elUserBTN.lastChild);
	}
};

UI.createUserButton = ()=>{
    UI._elUserBTN = ATON.UI.createButton({
        icon: "user",
		classes: "px-2",
        onpress: UI.modalUser
    });

    ATON.checkAuth((u)=>{
        UI._onUser(u.username);
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
        ATON.UI.createButtonFullscreen(),
        ATON.UI.createButtonQR(),
        UI.createMainButton(),
        UI.createMainButton(),
        UI.createMainButton(),
        UI.createLayersButton(),
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
                        
                        UI._onUser();
                    }
                })
            );

            UI.closeToolPanel();

            ATON.UI.showModal({
                header: u.username,
                body: elBody
            })
        },
        // Not logged
        ()=>{
            UI.closeToolPanel();
            
            ATON.UI.showModal({
                header: "User",
                body: ATON.UI.createLoginForm({
                    onSuccess: (r)=>{
                        ATON.UI.hideModal();
                        UI._onUser(r.username);
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
    WYSIWYG Editor
=====================================*/
UI.WYSIWYGeditorInit = ()=>{
    UI.WYSIWYG = Jodit.make('#WYSIWYGeditor', {
        theme: "dark",

        buttons: 'source,|,about,print,bold',
        buttonsMD: 'source,|,about,print,bold',
        buttonsSM: 'source,|,about,print,bold',
        buttonsXS: 'source,|,about,print,bold',

        extraButtons: [
            {
                name: 'insertDate',
                iconURL: ATON.UI.resolveIconURL("user"),
                exec: (editor)=>{
                    UI.WYSIWYGeditorInsert(new Date().toDateString())
                }
            }
        ]
    });

    UI._elWYSIWYG = ATON.UI.get("WYSIWYGeditor");
};

UI.WYSIWYGeditorInsert = (html)=>{
    if (!UI.WYSIWYG) return;
    
    UI.WYSIWYG.s.insertHTML(html);
    UI.WYSIWYG.synchronizeValues(); // For history saving
};

UI.WYSIWYGeditorGetHTML = ()=>{
    if (!UI._elWYSIWYG) return undefined;
    
    return UI._elWYSIWYG.value;
};

/*
    Side Panels (tools)
=====================================*/
UI.openToolPanel = (options)=>{
    if (!options) options = {};

    UI._elSidePanel.innerHTML = "";

    if (options.header){
        let el = document.createElement('div');
        el.classList.add("offcanvas-header");

        el.innerHTML = "<h4 class='offcanvas-title'>"+options.header+"</h4><button type='button' class='btn-close' data-bs-dismiss='offcanvas' aria-label='Close'></button>";

        if (options.headelement) el.prepend(options.headelement);

        UI._elSidePanel.append(el);
    }

    if (options.body){
        let el = document.createElement('div');
        el.classList.add("offcanvas-body");

        el.append(options.body);

        UI._elSidePanel.append(el);
    }

    UI._sidepanel.show();
    //UI._bSidePanel = true;

    UI.closeSemanticPanel();
};

UI.closeToolPanel = ()=>{
    UI._sidepanel.hide();
    //UI._bSidePanel = false;
};


UI.sideTool = ()=>{
    UI.openToolPanel({
        header: "Test Tool",
        //body: ATON.UI.createElementFromHTMLString(`<textarea id="WYSIWYGeditor" name="editor"></textarea>`)
        body: ATON.UI.createContainer({
            items:[
/*
                ATON.UI.createInputText({
                    label: "test",
                    list: ["x","y"]
                }),
*/
                ATON.UI.createInput3DModel({
                    actionicon: "add",
                    onaction: (url)=>{
                        if (url && url.length>1) ATON.createSceneNode().load(url).attachToRoot();
                    }
                }),
                ATON.UI.createLayersControl()
            ]
        })
    });

    //UI.WYSIWYGeditorInit();
}

UI.sideLayers = ()=>{
    // Layers list
    let elLayers = ATON.UI.createContainer();

    const appendNewLayer = (nid)=>{
        const elLayer = ATON.UI.createLayerControl({
            node: nid,
            actions: [
                ATON.UI.createButton({
                    icon: "settings",
                    size: "small",
                    onpress: ()=>{
                        UI.sideManageLayer(nid);
                    }
                })
            ]
        });

        //console.log(ATON.UI.getComponent(elLayer,"actions"));

        elLayers.append( elLayer );
    };

    let root = ATON.getRootScene();
    for (let c in root.children){
        const N = root.children[c];
        
        if (N.nid) appendNewLayer(N.nid);
    }

    const elNewLayer = ATON.UI.createInputText({
        placeholder: "New Layer..."
    });

    let elInput = ATON.UI.getComponent(elNewLayer,"input");

    elNewLayer.append( ATON.UI.createButton({
        icon: "add",
        classes: "btn-default",
        onpress: ()=>{
            let layer = elInput.value;
            
            if (HATHOR.ED.createLayer({nid: layer})){
                appendNewLayer(layer);
                elInput.value = "";
            }
        }
    }));

    UI.openToolPanel({
        header: "Layers",
        body: ATON.UI.createContainer({
            items:[
                elLayers,
                elNewLayer
            ]
        })
    });
};

UI.createLayerModels = (N)=>{
    let el = ATON.UI.createContainer();

    let elList = ATON.UI.createContainer({
        //classes: "list-group"
        //style: "margin-left: -8px"
    });

    el.append(elList);

    const createItem = (url)=>{
        const fname = ATON.Utils.getFilename(url);

        // list-group-item 
        let el = ATON.UI.createElementFromHTMLString(`
            <div class='aton-collection-item'>${fname}</div>
        `);

/*
        el.prepend( ATON.UI.createButton({
            icon: "trash",
            size: "small",
            variant: "danger"
        }) );
*/
        return el;
    };

    for (let u in N._reqURLs){
        const elItem = createItem(u);
/*
        elItem.prepend( ATON.UI.createButton({
            icon: "trash",
            size: "small"
        }));
*/
        elList.append( elItem );
    }

    el.append( ATON.UI.createInput3DModel({
        actionicon: "add",
        onaction: (url)=>{
            if (!url) return;
            if (url.length<2) return;
            
            N.load(url);
            
            elList.append( createItem(url) );
        }
    }) );

    return el;
};

UI.sideManageLayer = (nid)=>{
    let N = ATON.getSceneNode(nid);
    if (!N) return;

    let elBody = ATON.UI.createContainer();
    
    elBody.append( ATON.UI.createButton({
        text: "Focus",
        classes: "btn-default",
        onpress: ()=>{
            ATON.Nav.requestPOVbyNode(N, 0.2);
        }
    }) );
    
    elBody.append( ATON.UI.createTreeGroup({
        items:[
            {
                title: "Items",
                open: true,
                content: UI.createLayerModels(N)
            },
            {
                title: "Transform",
                open: true,
                content: ATON.UI.createNodeTrasformControl({
                    node: nid,
                    position: true,
                    scale: true,
                    rotation: true
                })
            },
            {
                title: "Material",
                //content:
            }

        ]
    }) );

    UI.openToolPanel({
        header: "Layer '"+nid+"'",
        headelement: ATON.UI.createButton({
            icon: "back",
            onpress: UI.sideLayers
        }),
        body: elBody
    });
};


export default UI;