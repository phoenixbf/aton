/*===========================================================================

    "Hathor" v2
    UI routines

    Author: B. Fanini

===========================================================================*/
import WYSIWYG from "./WYSIWYG.js";

let UI = {};

UI.WYSIWYG = WYSIWYG;

UI.TASK_SYMBOL = "&rarr;"; // "&#9654;";

UI.setup = ()=>{

    UI._elMainToolbar   = ATON.UI.get("sideToolbar");
    UI._elBottomToolbar = ATON.UI.get("bottomToolbar");
    UI._elUserToolbar   = ATON.UI.get("userToolbar");
    UI._elTasks         = ATON.UI.get("tasks");

    ATON.UI.hideElement(UI._elTasks);

    // Dedicated side panel
    UI._elSidePanel = ATON.UI.elem(`
        <div class="offcanvas offcanvas-start aton-std-bg aton-sidepanel hathor-side-panel" tabindex="-1">
        </div>
    `);
    UI._sidepanel = new bootstrap.Offcanvas(UI._elSidePanel);
    document.body.append(UI._elSidePanel);
    UI._bSidePanel = false;

    // Bottom toolbar
    UI._elPOVprev = ATON.UI.createButton({
        icon: "left",
        onpress: ()=>{
            ATON.Nav.requestPrevPOVinPath(HATHOR.POVPATH_ALL);
        }
    });

    UI._elPOVnext = ATON.UI.createButton({
        icon: "right",
        onpress: ()=>{
            ATON.Nav.requestNextPOVinPath(HATHOR.POVPATH_ALL);
        }
    });

    UI._elTalkBTN = ATON.UI.createButtonTalk();

    UI._elBottomToolbar.append(
        UI._elPOVprev,
        ATON.UI.createButtonHome(),
        UI._elTalkBTN,
        UI._elPOVnext
    );

    // Editor UI
    if (HATHOR.params.get('e')){
        UI.buildStandardInterface();
    }
    else {
        if (HATHOR._tb) UI.buildCustomInterface();
        else UI.buildStandardInterface();
    }

    ATON.UI.hideElement(UI._elCC);
    ATON.UI.hideElement(UI._elTalkBTN);

    // UI elements to hide on interaction
    ATON.on("NavInteraction", b =>{
        if (HATHOR.currTask) return;

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
    ATON.UI.hideElement(UI._elSidePanel);
};

UI.showMainElements = ()=>{
    ATON.UI.showElement(UI._elMainToolbar); //.classList.remove("d-none");
    ATON.UI.showElement(UI._elBottomToolbar); //.classList.remove("d-none");
    ATON.UI.showElement(UI._elUserToolbar); //.classList.remove("d-none");
    ATON.UI.showElement(UI._elSidePanel);
};

UI.enterEditorMode = ()=>{
    UI._elMainToolbar.classList.add("hathor-main-toolbar-editor");
    if (UI._elModeED)  UI._elModeED.classList.add("aton-btn-highlight");
    if (UI._elModeSTD) UI._elModeSTD.classList.remove("aton-btn-highlight");
};
UI.exitEditorMode = ()=>{
    UI._elMainToolbar.classList.remove("hathor-main-toolbar-editor");
    if (UI._elModeED)  UI._elModeED.classList.remove("aton-btn-highlight");
    if (UI._elModeSTD) UI._elModeSTD.classList.add("aton-btn-highlight");

    HATHOR.SUI.detachGizmo();
};

UI.createTextBlock = (content)=>{
    let el = ATON.UI.createContainer({
        classes: "hathor-text-block"
    });

    if (content) el.append(content);

    return el;
}

UI.createBlockGroup = (options)=>{
    let el = ATON.UI.createContainer({
        classes: "btn-group",
        style: "width:100%;"
    });

    if (options.items) for (let e in options.items) el.append(options.items[e]);

    return el;
};

/*
    Semantics
=====================================*/
UI.showSemanticPanel = (semid)=>{
    UI.closeToolPanel();

    // TODO: audio sound

    let htmlContent = HATHOR.getHTMLDescriptionFromSemNode(semid);
    if (!htmlContent) return;

    let elContent = ATON.UI.elem("<div>"+htmlContent+"</div>");

    let editbtns = [];

    if (HATHOR.isEditorMode()){
        editbtns.push(
            ATON.UI.createButton({
                icon: "edit",
                onpress: ()=>{
                    UI.modalAnnotation(semid);
                    ATON.UI.hideSidePanel();
                }
            }),
        );
    }

    ATON.UI.showSidePanel({
        header: semid,
        actions: editbtns,
        body: elContent
    });
};

UI.closeSemanticPanel = ()=>{
    ATON.UI.hideSidePanel();
};

// Create, finalize or update annotation
UI.modalAnnotation = (semid)=>{
    let semshape; // shape of semantic annotation (basic, freeform, ...)
    
    if (HATHOR.currTask === HATHOR.TASK_BASIC_ANN)  semshape = HATHOR.SEM_SHAPE_SPHERE;
    if (HATHOR.currTask === HATHOR.TASK_CONVEX_ANN) semshape = HATHOR.SEM_SHAPE_CONVEX;

    let html = undefined; // HTML content

    let parentSemID = ATON.ROOT_NID;

    let elBody = ATON.UI.createContainer({});
    let elFooter = ATON.UI.createContainer({ classes: "w-100" });

    let semlist = [];
    for (let s in ATON.semnodes){
        if (s !== ATON.ROOT_NID /*&& !s.startsWith(ATON.XPFNetwork.SEMGROUP_PREFIX)*/) semlist.push(s);
    }

    let elSemID = ATON.UI.createInputText({
        list: semlist,
        label: "Semantic ID *",

        // Live validation of semid
        oninput: (v)=>{
            let V = HATHOR.validateSemID(v);

            if ( !V.valid ){
                //ATON.UI.hideElement(elCreateAnn);
                elCreateAnn.setAttribute("disabled",true);
                return;
            }

            semid = V.semid;

            html = HATHOR.getHTMLDescriptionFromSemNode(semid);
            if (html){
                UI.WYSIWYG.insert(html, true);
            }

            //ATON.UI.showElement(elCreateAnn);
            elCreateAnn.removeAttribute("disabled");
        },
/*
        onchange: (v)=>{
            v = v.trim();
            if (v.length < 1){
                return;
            }
        }
*/
    });

    // Finalize semantic shape
    let elCreateAnn = ATON.UI.createButton({
        text: semid? "Update" : "Add",
        classes: "btn-accent",
        //icon: ,
        onpress: ()=>{
            if (!semid) return;

            // Retrieve content from editor, if any
            let semcontent = UI.WYSIWYG.getHTML().trim();
            if (semcontent.length > 0) semcontent = JSON.stringify(semcontent);
            else semcontent = undefined;

            HATHOR.ED.addSemNode({
                nid: semid,
                parentnid: parentSemID,
                content: semcontent,
                shape: semshape
            });

            ATON.UI.hideModal();
            HATHOR.endCurrentTask();
        }
    });

    let elDelete = undefined;

    if (!semid){
        elCreateAnn.setAttribute("disabled",true); //ATON.UI.hideElement(elCreateAnn);
        elBody.append(elSemID);
    }
    else {
        elDelete = ATON.UI.createButton({
            text: "Delete",
            icon: "delete",
            classes: "btn-default",
            onpress: ()=>{
                //ATON.UI.hideModal();
                UI.modalDeleteSemanticID(semid);
            }
        })
    }

    elBody.append( UI.WYSIWYG.createElement() );

    elFooter.append( ATON.UI.createContainer({
        classes: "btn-group w-100",
        items:[ elDelete, elCreateAnn ]
    }))
    

    ATON.UI.showModal({
        header: semid? "Edit '"+semid+"'" : "New Annotation",
        body: elBody,
        footer: elFooter,
        wide: true
    });

    UI.WYSIWYG.init();

    // Populate with existing content from semID
    if (semid){
        html = HATHOR.getHTMLDescriptionFromSemNode(semid);
        if (html) UI.WYSIWYG.insert(html, true);
    }
};

// Side panel for semantics
UI.sideSemantics = ()=>{
    let elBody = ATON.UI.createContainer({
        //style: "margin-bottom: 4px;"
    });

    if (HATHOR.isEditorMode()){
        let elEnrich = ATON.UI.createContainer({ classes: "hathor-panel-section" });
        elBody.append(elEnrich);

        let elSemBasic = ATON.UI.createContainer({/*classes: "hathor-side-panel-half-container"*/});

        elSemBasic.append( UI.createTextBlock("Add a basic (spherical) annotation on any surface"));
        elSemBasic.append(
            ATON.UI.createContainer({
                classes: "btn-group",
                style: "width:100%",
                items: [
                    ATON.UI.createButton({
                        text: "Basic " + UI.TASK_SYMBOL,
                        classes: "btn-default",
                        onpress: ()=>{
                            HATHOR.setCurrentTask(HATHOR.TASK_BASIC_ANN);
                        }
                    })
                ]
            })    
        );

        let elSemConvex = ATON.UI.createContainer({/*classes: "hathor-side-panel-half-container"*/});

        elSemConvex.append( UI.createTextBlock("Add a free form (convex hull) annotation on any surface"));
        elSemConvex.append(
            ATON.UI.createContainer({
                classes: "btn-group",
                style: "width:100%",
                items: [
                    ATON.UI.createButton({
                        text: "Free Form "+UI.TASK_SYMBOL,
                        classes: "btn-default",
                        onpress: ()=>{
                            HATHOR.setCurrentTask(HATHOR.TASK_CONVEX_ANN);
                        }
                    })
                ]
            })    
        );

        elEnrich.append( elSemBasic, elSemConvex );
    }

    let elSemList = undefined;
    
    for (let semid in ATON.semnodes){
        if (semid !== ATON.ROOT_NID){
            let S = ATON.getSemanticNode(semid);

            if (!elSemList) elSemList = ATON.UI.createContainer({ classes: "hathor-panel-section"});

            let actions = [];

            if (HATHOR.isEditorMode()){
                actions.push(
                    ATON.UI.createButton({
                        icon: "edit",
                        classes: "btn-default",
                        onpress: ()=>{
                            UI.modalAnnotation(semid);
                            UI.closeToolPanel();
                        }
                    })
                )
            }

            actions.push(
                ATON.UI.createButtonSwitch({
                    icon: "visibility",
                    status: S.visible,
                    onswitch: (b)=>{
                        if (b) S.show();
                        else S.hide();
                    }
                })
            );

            elSemList.append(
                ATON.UI.createBlockItem({
                    text: semid,
                    mainaction: ()=>{
                        ATON.Nav.requestPOVbyNode(S, 0.2);
                    },
                    actions: actions
                })
            );
        }
    }

    if (elSemList) elBody.append(ATON.UI.createTreeGroup({
        style: "margin-top: 16px",
        items:[
            {
                title: "Annotations list",
                open: true,
                content: elSemList
            }
        ]
    }));

    UI.openToolPanel({
        header: "Semantic Annotations",
        body: elBody
    });
};

// Delete a Sem ID
UI.modalDeleteSemanticID = (semid)=>{
    let S = ATON.getSemanticNode(semid);
    if (!S) return;

    let elBody = ATON.UI.createContainer();
    elBody.append( ATON.UI.elem(`<p>Are you sure you want to delete semantic ID '${semid}'?</p>`) );

    elBody.append(
        UI.createBlockGroup({
            items:[
                ATON.UI.createButton({
                    text: "NO",
                    classes: "btn-default",
                    onpress: ATON.UI.hideModal
                }),
                ATON.UI.createButton({
                    text: "YES",
                    icon: "delete",
                    classes: "btn-accent",
                    onpress: ()=>{
                        HATHOR.ED.deleteNode({
                            nid: semid,
                            type: ATON.NTYPES.SEM
                        })
                        ATON.UI.hideModal();
                    }
                })
            ]
        })
    );

    ATON.UI.showModal({
        header: "Delete layer",
        body: elBody
    });
};

/*
    Buttons
=====================================*/
UI.createMainButton = ()=>{
    return ATON.UI.createButton({
        icon: "hathor",
        classes: "hathor-main-btn",
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

UI.createSemanticsButton = ()=>{
    return ATON.UI.createButton({
        icon: "annotation",
        onpress: UI.sideSemantics
    });
};

UI.createEnvButton = ()=>{
    return ATON.UI.createButton({
        icon: "env",
        onpress: UI.sideEnv
    });
};

UI.createSceneButton = ()=>{
    return ATON.UI.createButton({
        icon: "info",
        onpress: UI.sideScene
    });
};

UI.createNavButton = ()=>{
    return ATON.UI.createButton({
        icon: "nav",
        onpress: UI.sideNav
    });
};

UI.createFXButton = ()=>{
    return ATON.UI.createButton({
        icon: "fx",
        onpress: UI.sideFX
    }); 
};

UI.createCollabButton = ()=>{
    UI._elPhoton = ATON.UI.createButton({
        icon: "users",
        onpress: UI.sideCollab
    });

    return UI._elPhoton;
};

UI.createCopyrightsButton = ()=>{
    UI._elCC = ATON.UI.createButton({
        //text: "Assets Copyrights",
        icon: "cc",
        onpress: UI.modalCopyrights
    });

    return UI._elCC;
};

/*
UI._onUser = (username)=>{
	if (!UI._elUserBTN) return;

	if (username){
		//console.log(username);
		UI._elUserBTN.classList.add("aton-btn-highlight");
		UI._elUserBTN.append(ATON.UI.elem("<span class='aton-btn-text'>"+username+"</span>"));
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
*/

/*
    Main Toolbar
=====================================*/
UI.buildStandardInterface = ()=>{

    UI._elMainToolbar.append(
        UI.createMainButton(),
        UI.createLayersButton(),
        UI.createEnvButton(),
        UI.createNavButton(),
        UI.createSemanticsButton(),
        UI.createSceneButton(),
        UI.createFXButton(),

        ATON.UI.createButtonFullscreen(),
        ATON.UI.createButtonQR(),

        UI.createXRButton(),
        UI.createCollabButton(),
        UI.createCopyrightsButton()
    );

    //UI._elUserToolbar.append( UI.createUserButton() );
    UI._elUser = UI.createButtonUser();
    UI._elUserToolbar.append( UI._elUser );
};

UI.buildCustomInterface = ()=>{
    HATHOR._tb = String(HATHOR._tb);
    let elements = HATHOR._tb.split(",");

    for (let e in elements){
        const E = elements[e];

        // TODO:
    }
};

// Custom Hathor user button
UI.createButtonUser = ()=>{
    let elLoggedContent = ATON.UI.createContainer({
        classes: "hathor-panel-section"
    });

    let bEditor = HATHOR.isEditorMode();
    console.log(bEditor);

    UI._elModeSTD = ATON.UI.createButton({
        text: "Standard Mode",
        classes: "btn-default",
        onpress: ()=>{
            HATHOR.exitEditorMode();
        }
    });

    UI._elModeED = ATON.UI.createButton({
        text: "Editor Mode",
        classes: "btn-default",
        onpress: ()=>{
            HATHOR.enterEditorMode();
        }
    });

    if (bEditor){
        UI._elModeED.classList.add("aton-btn-highlight");
        UI._elModeSTD.classList.remove("aton-btn-highlight");
    }
    else {
        UI._elModeED.classList.remove("aton-btn-highlight");
        UI._elModeSTD.classList.add("aton-btn-highlight");      
    }
/*
    UI._elEd = ATON.UI.createButton({
        text: "Editor Mode",
        classes: "btn-default",
        onpress: ()=>{
            bEditor = HATHOR.isEditorMode();

            if (bEditor){
                HATHOR.exitEditorMode();
            }
            else {
                HATHOR.enterEditorMode();
            } 

            ATON.UI.hideModal();
        }
    });
*/
    elLoggedContent.append(
        UI.createTextBlock("Enter or leave Editor Mode"),
        UI.createBlockGroup({items:[ UI._elModeSTD, UI._elModeED ]})
    );

    let el = ATON.UI.createButtonUser({
        onmodalopen: ()=>{
            UI.closeToolPanel();
        },
        modallogged: elLoggedContent,
/*
        onlogout: ()=>{
            HATHOR.exitEditorMode();
            UI._elEd.classList.remove("aton-btn-highlight");
        }
*/
    });

    return el;
};

UI.modalHathor = ()=>{
    let elBody = ATON.UI.createContainer({});

    elBody.append(
        ATON.UI.elem(`
            <div style='text-align:center'>
                <img src='${ATON.BASE_URL}/hathor/appicon.png' style='width:100px; height:auto'>
                <br><b>Hathor - v2 (beta)</b>
                <br><span style='font-size:smaller'><i>Hathor</i> is the official ATON built-in front-end</span>
            </div>
        `)
    )

    ATON.UI.showModal({
        header: "Hathor",
        body: elBody
    });
};


UI.modalXR = ()=>{
    let elBody = ATON.UI.createContainer();
    let elFooter = ATON.UI.createContainer({ classes: "w-100" });

    elFooter.append(
        UI.createBlockGroup({
            items:[
                ATON.UI.createButtonVR({
                    classes: "btn-accent",
                    text: "Immersive VR"
                }),
                ATON.UI.createButtonAR({
                    classes: "btn-accent",
                    text: "Augmented Reality"
                })
            ]
        })

    );

    ATON.UI.showModal({
        header: "XR",
        body: elBody,
        footer: elFooter,
        wide: true
    });
};

/*
    WYSIWYG Editor
=====================================*/
/*
UI.WYSIWYG_TOOLBAR = "source,|,bold,italic,eraser,ul,ol,font,paragraph,|,hr,table,link,symbols";

UI.WYSIWYGeditorCreate = ()=>{
    return ATON.UI.elem(`<textarea id="WYSIWYGeditor" name="editor"></textarea>`);
};

UI.WYSIWYGeditorInit = ()=>{
    UI.WYSIWYG = Jodit.make('#WYSIWYGeditor', {
        //theme: "dark",
        //toolbarButtonSize: 'small',
        //height: 200,

        useSearch: false,
        showCharsCounter: false,
        showWordsCounter: false,
        showXPathInStatusbar: false,
        inline: true,
        //toolbarInlineForSelection: true,
        showPlaceholder: false,

        disablePlugins: "about,add-new-line,ai-assistant,search,print,xpath",

        buttons: UI.WYSIWYG_TOOLBAR,
        buttonsMD: UI.WYSIWYG_TOOLBAR,
        buttonsSM: UI.WYSIWYG_TOOLBAR,
        buttonsXS: UI.WYSIWYG_TOOLBAR,

        uploader: {
            insertImageAsBase64URI: true
        }
    });

    UI._elWYSIWYG = ATON.UI.get("WYSIWYGeditor");
};

// Insert custom HTML in current cursor location or overwrite entire content
UI.WYSIWYGeditorInsert = (html, bOverwrite)=>{
    if (!UI.WYSIWYG) return;

    if (bOverwrite) UI.WYSIWYG.value = "";
    UI.WYSIWYG.s.insertHTML(html);
    
    UI.WYSIWYG.synchronizeValues(); // For history saving
};

UI.WYSIWYGeditorGetHTML = ()=>{
    if (!UI._elWYSIWYG) return undefined;
    
    return UI._elWYSIWYG.value;
};
*/

/*
    Side Panels (tools)
=====================================*/
UI.openToolPanel = (options)=>{
    if (!options) options = {};

    UI._elSidePanel.innerHTML = "";

    HATHOR.SUI.detachGizmo();

    if (options.header){
        let el = document.createElement('div');
        el.classList.add("offcanvas-header");

        el.innerHTML = "<h4 class='offcanvas-title'>"+options.header+"</h4><button type='button' class='btn-close' data-bs-dismiss='offcanvas' aria-label='Close' onclick='HATHOR.UI.closeToolPanel()'></button>";

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
    UI._bSidePanel = true;

    UI.closeSemanticPanel();
};

UI.closeToolPanel = ()=>{
    UI._sidepanel.hide();
    UI._bSidePanel = false;

    HATHOR.SUI.detachGizmo();
};

//====================================
// Scene
//====================================
UI.sideScene = ()=>{
    if (!ATON.SceneHub.currData) return;

    if (!HATHOR.isEditorMode()){
        UI.modalSceneDescription();
        return;
    }

    let scenedata = ATON.SceneHub.currData;
    let sid = ATON.SceneHub.getSID();

    if (!sid) return;

    let elBody = ATON.UI.createContainer({});

    elBody.append(
        UI.createBlockGroup({
            items: [
                ATON.UI.createButton({
                    text: "Set title and description...",
                    //icon: "edit",
                    classes: "btn-default",
                    onpress: ()=>{
                        UI.modalEditSceneInfo();
                        UI.closeToolPanel();
                    }
                })
            ]
        })
    );

/*
    let elGeneralSection = ATON.UI.createContainer({});

    elGeneralSection.append(
        UI.createTextBlock("Set a main title and description for this scene"),
        ATON.UI.createInputText({
            //label: "Title",
            placeholder: "Title",
            value: ATON.SceneHub.getTitle(),
            onsubmit: (title)=>{
                title = title.trim();
                HATHOR.ED.sceneInfo({title: title});
            }
        })
    );

    //elBody.append( UI.createTextBlock("Set description"));
    elGeneralSection.append(
        ATON.UI.createContainer({
            classes: "btn-group",
            style: "width:100%",
            items: [
                ATON.UI.createButton({
                    text: "Edit description",
                    icon: "edit",
                    classes: "btn-default",
                    onpress: ()=>{
                        UI.modalEditSceneDescription();
                        UI.closeToolPanel();
                    }
                })
            ]
        })    
    );
*/

    let elKeywordsSection = ATON.UI.createContainer({/* classes: "hathor-tags-container"*/ });
    let elCoverSection = ATON.UI.createContainer({});
    let elVisSection = ATON.UI.createContainer({});

    elBody.append( ATON.UI.createTreeGroup({
        items:[
            {
                title: "Keywords",
                open: true,
                content: elKeywordsSection
            },
            {
                title: "Cover",
                open: true,
                content: elCoverSection
            },
            {
                title: "Visibility",
                open: false,
                content: elVisSection,
            }
        ]
    }));

    // Keywords
    ATON.REQ.get("scenes/keywords", kk => {
        console.log(kk)

        let globallist = [];
        for (let k in kk) globallist.push(k);

        let scenekwords = [];
        if (ATON.SceneHub.currData && ATON.SceneHub.currData.kwords){
            const skw = ATON.SceneHub.currData.kwords;
            for (let k in skw) scenekwords.push(k);
        }

        elKeywordsSection.append(
            UI.createTextBlock("Pick or create keywords to classify this scene. If the scene is public users can find it through these terms."),

            ATON.UI.createTagsComponent({
                //label: "Keyword",
                list: globallist,
                tags: scenekwords,
                placeholder: "Pick or add a keyword...",
                validator: (k)=>{
                    if (k.length < 1) return false;

                    return true;
                },
                onaddtag: (k)=>{
                    let O = {};
                    O.kwords = {};
                    O.kwords[k]=1;

                    HATHOR.ED.sceneInfo(O);
                },
                onremovetag: (k)=>{
                    HATHOR.ED.deleteSceneKeyword({
                        kword: k
                    });
                }
            })
        );
    });

    // Cover
    let elCover = ATON.UI.createCard({
        title: "Current scene cover",
        //size: "large",
        //classes: "hathor-card-media-v",
        cover: ATON.PATH_RESTAPI2+"scenes/"+sid+"/cover",
        onactivate: ()=>{

        }
    });

    let img = ATON.UI.getComponent(elCover, "img");

    let elShot = ATON.UI.createButton({
        text: "Set current view as cover",
        classes: "btn-default w-100",
        onpress: ()=>{
            let cover = ATON.Utils.takeScreenshotFromPOV(ATON.Nav._currPOV, 256);

            ATON.REQ.post("scenes/"+sid+"/cover", { img: cover.src }, (r)=>{
                img.src = cover.src;
            });
        }
    });

    elCoverSection.append(
        ATON.UI.createContainer({
            style:"text-align: center",
            items: [elCover, elShot]
        })
    );

    // Visibility
    const setVis = (v)=>{
        HATHOR.ED.sceneInfo({ visibility: v });

        if (v===0){
            elPublicBtn.classList.remove("aton-btn-highlight");
            elUnlistedBtn.classList.add("aton-btn-highlight");
        }
        if (v===1){
            elUnlistedBtn.classList.remove("aton-btn-highlight");
            elPublicBtn.classList.add("aton-btn-highlight");   
        }
    };

    let elUnlistedBtn = ATON.UI.createButton({
        icon: "bi-eye-slash",
        classes: "btn-default",
        onpress: ()=>{
            setVis(0);
        }
    });
    let elPublicBtn = ATON.UI.createButton({
        icon: "bi-people",
        classes: "btn-default",
        onpress: ()=>{
            setVis(1);
        }
    });

    if (scenedata.visibility) setVis(1);
    else setVis(0);

    let elVis = UI.createBlockGroup({
        items: [elUnlistedBtn,elPublicBtn]
    })

    elVisSection.append(
        ATON.UI.elem("<p class='hathor-text-block'>Control the visibility of your scene. Unlisted <i class='bi bi-eye-slash'></i>: only people having this link can access the scene. Public <i class='bi bi-people'></i>: the scene is accessible and searchable by users from the main landing page.</p>"),
        elVis
    );

    // Panel
    UI.openToolPanel({
        header: "Scene",
        body: elBody
    });
};

UI.modalSceneDescription = ()=>{
    let title = ATON.SceneHub.getTitle();
    let descr = ATON.SceneHub.getDescription();

    let elBody = ATON.UI.createContainer();

    if (!title || !descr) return;
    if (descr.length < 1 || title.length < 1) return;

    descr = JSON.parse(descr).trim();
/*
    if (!title) title = "Untitled";

    if (descr){
        descr = JSON.parse(descr).trim();
        if (descr.length < 1) descr = "<p>No description</p>";
    }
    else descr = "<p>No description</p>";
*/
    elBody.append( ATON.UI.elem(descr) );

    let elFooter = ATON.UI.createContainer({ classes: "w-100"});
/*
    elFooter.append(
        UI.createBlockGroup({
            items:[
                ATON.UI.createButtonVR({
                    //size: "large",
                    text: "VR",
                    classes: "btn-accent"
                }),
                ATON.UI.createButtonAR({
                    //size: "large",
                    text: "AR",
                    classes: "btn-accent"
                })
            ]
        })
    );
*/

    ATON.UI.showModal({
        header: title,
        body: elBody,
        footer: elFooter
    });
};

UI.modalEditSceneInfo = ()=>{
    let html = undefined; // HTML content

    let descr = ATON.SceneHub.getDescription();
    if (descr) html = JSON.parse(descr).trim();

    let elBody = ATON.UI.createContainer({});
    let elFooter = ATON.UI.createContainer({ classes: "w-100" });

    elBody.append(
        ATON.UI.createInputText({
            label: "Title",
            placeholder: "Please provide a short title...",
            value: ATON.SceneHub.getTitle(),
            clearonsub: false,
            validator: (v)=>{
                if (v.length>2) return true;

                else return false;
            },
            onsubmit: (title)=>{
                title = title.trim();
                HATHOR.ED.sceneInfo({title: title});
            }
        })
    );

    // Finalize descr
    let elSetDescr = ATON.UI.createButton({
        text: "Set",
        classes: "btn-accent",
        //icon: ,
        onpress: ()=>{
            // Retrieve content from editor, if any
            let content = UI.WYSIWYG.getHTML().trim();
            if (content.length > 0) content = JSON.stringify(content);
            else content = undefined;

            console.log(content);

            HATHOR.ED.sceneInfo({
                descr: content,
            });

            ATON.UI.hideModal();
        }
    });

    elBody.append( UI.WYSIWYG.createElement() );

    elFooter.append( ATON.UI.createContainer({
        classes: "btn-group w-100",
        items:[ elSetDescr ]
    }))
    

    ATON.UI.showModal({
        header: "Edit Scene Description",
        body: elBody,
        footer: elFooter,
        wide: true
    });

    UI.WYSIWYG.init();

    // Populate with existing content from semID
    if (html){
        UI.WYSIWYG.insert(html, true);
    }
};



//====================================
// Layers
//====================================
UI.sideLayers = ()=>{
    // Layers list
    let elLayers = ATON.UI.createContainer({
        classes: "hathor-panel-section"
    });

    const appendNewLayer = (nid)=>{
        const elLayer = ATON.UI.createLayerControl({
            node: nid,
            mainlayeraction: ()=>{ ATON.Nav.requestPOVbyNode(ATON.getSceneNode(nid), 0.2); },
            actions: HATHOR.isEditorMode()? [
                ATON.UI.createButton({
                    icon: "edit",
                    classes: "btn-default",

                    onpress: ()=>{
                        UI.sideManageLayer(nid);
                    }

                })
            ] : []
/*
            actions: [
                ATON.UI.createButton({
                    icon: "settings",
                    size: "small",

                    onpress: ()=>{
                        UI.sideManageLayer(nid);
                    }

                })
            ]
*/
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
        placeholder: "New Layer...",
        icon: "add",
        validator: (nid)=>{
            if (nid.length < 1) return false;
            if (!HATHOR.ID_VALIDATOR.test(nid)) return false;
            if (ATON.snodes[nid]) return false; // already exists

            return true;
        },
        onsubmit: (layer)=>{        
            if (HATHOR.ED.createNode({nid: layer})){
                appendNewLayer(layer);
            }
        }
    });

/*
    let elInput = ATON.UI.getComponent(elNewLayer,"input");

    elNewLayer.append( ATON.UI.createButton({
        icon: "add",
        classes: "btn-default",
        onpress: ()=>{
            let layer = elInput.value;
            
            if (HATHOR.ED.createNode({nid: layer})){
                appendNewLayer(layer);
                elInput.value = "";
            }
        }
    }));
*/

    UI.openToolPanel({
        header: "Layers",
        body: ATON.UI.createContainer({
            items:[
                HATHOR.isEditorMode()? elNewLayer : undefined,
                elLayers
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
        let el = ATON.UI.elem(`
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
            
            //N.load(url);
            HATHOR.ED.addModel({
                url: url,
                nid: N.nid
            })
            
            elList.append( createItem(url) );
        }
    }) );

    return el;
};

UI.createMaterialControl = (N)=>{
    if (!N) return undefined;

    let elBody = ATON.UI.createContainer();
    elBody.append(
        UI.createBlockGroup({
            items:[
                ATON.UI.createSelect({
                    title: "Apply material...",
                    items: [
                        { title: "Use original", value: "_" },
                        { title: "Wireframe", value: "wireframe" },
                        { title: "Default UI", value: "defUI" },
                        { title: "Invisible", value: "invisible" },
                    ],
                    onselect: (v)=>{
                        if (v === "_"){
                            HATHOR.ED.removeNodeMaterial({ nid: N.nid });
                        }
                        else {
                            HATHOR.ED.editNode({
                                nid: N.nid,
                                mat: v
                            });    
                        }
                    }
                }),
/*
                ATON.UI.createButton({
                    icon: "cancel",
                    classes: "btn-default",
                    onpress: ()=>{
                        HATHOR.ED.removeNodeMaterial({ nid: N.nid });
                    }
                })
*/
            ]
        })

    );

    return elBody;
};

UI.sideManageLayer = (nid)=>{
    let N = ATON.getSceneNode(nid);
    if (!N) return;

    let elBody = ATON.UI.createContainer();
    
    elBody.append(
        UI.createBlockGroup({
            items:[
                ATON.UI.createButton({
                    text: "Focus",
                    icon: "bi-crosshair",
                    classes: "btn-default",
                    onpress: ()=>{
                        ATON.Nav.requestPOVbyNode(N, 0.2);
                    }
                }),

                ATON.UI.createButton({
                    text: "Delete",
                    icon: "delete",
                    classes: "btn-default",
                    onpress: ()=>{
                        UI.modalDeleteNode(nid);
                    }
                })
            ]
        })
    );  

    //let elMat = ATON.UI.createContainer();
/*
    let elFrameMat = ATON.UI.elem(`<iframe style='height:500px; margin:0;' width='100%' height='500px' frameborder='0'></iframe>`);
    elFrameMat.src = ATON.PATH_PREVIEW+"?m=wireframe";
    elMat.append(elFrameMat);

    console.log(elFrameMat.contentWindow.APP);
*/

    let elTrans = ATON.UI.createNodeTransformControl({
        node: nid,
        position: true,
        scale: true,
        rotation: true,
        onupdateposition: ()=>{
            HATHOR.ED.dirtyNodeTransformReq(N, ["pos"]);
        },

        onupdaterotation: ()=>{
            HATHOR.ED.dirtyNodeTransformReq(N, ["rot"]);
        },

        onupdatescale: ()=>{
            HATHOR.ED.dirtyNodeTransformReq(N, ["scl"]);
        },

        onfocusposition: ()=>{
            HATHOR.SUI.attachGizmoToNode(N);
            HATHOR.SUI.setGizmoMode("translate");
        },
        onfocusrotation: ()=>{
            HATHOR.SUI.attachGizmoToNode(N);
            HATHOR.SUI.setGizmoMode("rotate");
        },
        onfocusscale: ()=>{
            HATHOR.SUI.attachGizmoToNode(N);
            HATHOR.SUI.setGizmoMode("scale");
        }
    });

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
                content: ATON.UI.createContainer({
                    items:[
                        elTrans,

                        UI.createBlockGroup({
                            items:[
                                ATON.UI.createButtonSwitch({
                                    text: "Use Geo Coords",
                                    classes: "btn-default",
                                    icon: "bi-globe-europe-africa",
                                    status: N.bUseGeoCoords,
                                    onswitch: (b)=>{
                                        HATHOR.ED.editNode({
                                            nid: nid,
                                            applytransform: true,
                                            geocoords: b
                                        })
                                    }
                                })
                            ]
                        })
                    ]
                })
            },
            {
                title: "Material",
                content: UI.createMaterialControl(N)
            }

        ]
    }) );

    UI.openToolPanel({
        header: "Layer '"+nid+"'",
        headelement: ATON.UI.createButton({
            icon: "left",
            onpress: UI.sideLayers
        }),
        body: elBody
    });
};

UI.modalDeleteNode = (nid, type)=>{
    if (!type) type = ATON.NTYPES.SCENE;

    let elBody = ATON.UI.createContainer();
    let elFooter = ATON.UI.createContainer({classes: "w-100"});
    elBody.append( ATON.UI.elem(`<p>Are you sure you want to delete layer ${nid}?</p>`) );

    elFooter.append(
        UI.createBlockGroup({
            items:[
                ATON.UI.createButton({
                    text: "NO",
                    classes: "btn-default",
                    onpress: ATON.UI.hideModal
                }),
                ATON.UI.createButton({
                    text: "YES",
                    icon: "delete",
                    classes: "btn-accent",
                    onpress: ()=>{
                        HATHOR.ED.deleteNode({
                            nid: nid,
                            type: type
                        })
                        ATON.UI.hideModal();
                        UI.sideLayers();
                    }
                })
            ]
        })
    );

    ATON.UI.showModal({
        header: "Delete layer",
        body: elBody,
        footer: elFooter
    });
};

//====================================
// Environment
//====================================
UI.sideEnv = ()=>{
    let elBody = ATON.UI.createContainer({
        //style: "margin-bottom: 4px;"
    });

    let elLighting = ATON.UI.createContainer();

    let elCP = ATON.UI.createColorPicker({
        label: "Background color",
        color: "#"+ATON._mainRoot.background.getHexString(),
        onchange: (col)=>{
            HATHOR.ED.setBackground({ color: col });
        }
    });

    let elBG = ATON.UI.createContainer({
        //style: "width:100%; margin:0px; padding:0px"
    });
/*
    elBG.append( ATON.UI.createInputPanorama({

    }));
*/    
    ATON.checkAuth(
        (u)=>{
            elBG.append( ATON.UI.createLiveFilter({
                filterclass: "aton-card"
            }));

            ATON.REQ.get("items/"+u.username+"/panoramas/", entries => {
                for (let e in entries){
                    let purl = entries[e];
                    
                    let fullurl = ATON.Utils.resolveCollectionURL(purl);

                    if (!ATON.Utils.isImage(fullurl)) fullurl = ATON.PATH_RES+"pano.jpg";

                    elBG.append(ATON.UI.createCard({
                        title: purl,
                        cover: fullurl,
                        classes: "hathor-card-media-v",
                        //size: "small",
                        useblurtint: true,
                        onactivate: ()=>{
                            HATHOR.ED.setBackground({ bg: purl });
                        }
                    }))
                } 
            })
        }
    );

    elBody.append(elCP);
    elBody.append( ATON.UI.createTreeGroup({
        items:[
            {
                title: "Panorama",
                open: false,
                content: elBG
            },
            {
                title: "Lighting",
                open: true,
                content: elLighting
            }
        ]}
    ));

    // Lighting
    let elSwitchShadows = ATON.UI.createButtonSwitch({
        icon: "shadows",
        classes: "btn-default",
        status: ATON.areShadowsEnabled(),
        onswitch: (b)=>{
            let ld = ATON.getMainLightDirection();
            HATHOR.ED.setLighting({
                shadows: b,
                dir: [ld.x, ld.y, ld.z]
            });
        }
    });

    let elSwitchMainLight = ATON.UI.createButtonSwitch({
        icon: "light",
        classes: "btn-default",
        status: ATON.isMainLightEnabled(),
        onswitch: (b)=>{
            if (b){
                let vD = [0.58,0.58,0.58];

                let ld = ATON.getMainLightDirection();
                if (ld) vD = [ld.x, ld.y, ld.z];
                 
                HATHOR.ED.setLighting({
                    dir: vD
                });

                ATON.UI.showElement(elSwitchShadows);
            }
            else {
                HATHOR.ED.disableMainLight();
                ATON.UI.hideElement(elSwitchShadows);
            }
            
        }
    });

    elLighting.append(
        UI.createBlockGroup({
            items:[
                ATON.UI.createButton({
                    text: "Setup main light "+UI.TASK_SYMBOL,
                    classes: "btn-default w-100",
                    //icon: "light",
                    onpress: ()=>{
                        HATHOR.setCurrentTask(HATHOR.TASK_DIR_LIGHT);
                        //ATON.Nav.setUserControl(false);
                    }
                }),
                elSwitchShadows,
                elSwitchMainLight,
            ]
        }),

        ATON.UI.createSlider({
            label: "Exposure",
            range: [0.05, 10.0],
            step: 0.05,
            value: ATON.getExposure(),
            classes: "w-100",
            oninput: (e)=>{
                HATHOR.ED.setLighting({ exp: e });
            }
        }),

        UI.createTextBlock("Estimate a general light probe, depending on current scene bounds. Useful for PBR assets"),
        UI.createBlockGroup({
            items:[
                ATON.UI.createButtonSwitch({
                    icon: "lp",
                    text: "Automatic Light Probing",
                    classes: "btn-default",
                    status: ATON._bAutoLP,
                    onswitch: (b)=>{
                        HATHOR.ED.setLighting({ autolp: b });
                    }
                })
            ]
        })
    );


    UI.openToolPanel({
        header: "Environment",
        body: elBody
    });

    if (!ATON.isMainLightEnabled()){
        ATON.UI.hideElement(elSwitchShadows);
    }
};


//====================================
// Navigation
//====================================
UI.sideNav = ()=>{
    let elBody = ATON.UI.createContainer({
        //style: "margin-bottom: 4px;"
    });

    let elNavModes = ATON.UI.createContainer({classes: "hathor-panel-section"});
    elBody.append(elNavModes);

    elNavModes.append(
        UI.createTextBlock("Select a navigation mode"),
        ATON.UI.createNavSwitcher({})
    );

    let elPOVs = ATON.UI.createContainer({});
    let elPOVlist = ATON.UI.createContainer({ classes: "hathor-panel-section" });

    let appendPOVitem = (P, povid)=>{
        elPOVlist.append(
            ATON.UI.createBlockItem({
                text: povid,
                icon: "pov",
                mainaction: ()=>{
                    ATON.Nav.requestPOV( P, 0.5 );
                },
                actions:[
                    ATON.UI.createButton({
                        icon: "delete",
                        classes: "btn-default",
                        onpress: ()=>{
                            UI.modalDeletePOV(povid);
                            UI.closeToolPanel();
                        }
                    })
                ]
            })
        );
    }

    let refreshPOVList = ()=>{
        elPOVlist.innerHTML = "";
        let numpovs = 0;

        //appendPOVitem(ATON.Nav._homePOV, "home");

        for (let pov in ATON.Nav.povlist){
            let POV = ATON.Nav.povlist[pov];
            numpovs++;

            if (numpovs===1) elPOVlist.append(
                UI.createTextBlock("List of viewpoints in this scene")
            );

            appendPOVitem(POV, pov);
        }

        UI.updatePOVs();

        if (numpovs < 1){
            ATON.UI.hideElement(elPOVlist);
            ATON.UI.hideElement(UI._elPOVprev);
            ATON.UI.hideElement(UI._elPOVnext);
        }
        else {
            ATON.UI.showElement(elPOVlist);
            ATON.UI.showElement(UI._elPOVprev);
            ATON.UI.showElement(UI._elPOVnext);
        }
    };
/*
    elPOVs.append(
        ATON.UI.createButton({
            text: "Current Viewpoint",
            icon: "pov",
            classes: "btn-default w-100",
            onpress: ()=>{
                UI.sideViewpoint();
            }
        })
    );
*/
    let elCurrPOV = ATON.UI.createContainer({ classes: "hathor-panel-section" });
    elCurrPOV.append(
        UI.createTextBlock("Current viewpoint"),

        UI.createBlockGroup({
            items:[
                ATON.UI.createButton({
                    icon: "home",
                    text: "Set as home",
                    classes: "btn-default",
                    onpress: ()=>{
                        let pov = ATON.Nav.copyCurrentPOV();
                        
                        HATHOR.ED.addPOV({
                            povid: "home",
                            pos: [pov.pos.x, pov.pos.y, pov.pos.z],
                            tgt: [pov.target.x, pov.target.y, pov.target.z],
                            fov: pov.fov
                        });

                        refreshPOVList();
                        HATHOR.SUI.buildPOVs();
                    }
                }),

                ATON.UI.createButton({
                    icon: "table",
                    text: "Control",
                    classes: "btn-default",
                    onpress: ()=>{
                        UI.sideViewpoint();
                    }
                })
            ]
        }),

        ATON.UI.createInputText({
            placeholder: "New viewpoint...",
            icon: "add",
            classes: "w-100",
            validator: (povid)=>{
                if (povid.length < 1) return false;
                if (!HATHOR.ID_VALIDATOR.test(povid)) return false;
                if (ATON.Nav.povlist[povid]) return false; // already exists

                return true;
            },
            onsubmit: (povid)=>{
                let pov = ATON.Nav.copyCurrentPOV();

                HATHOR.ED.addPOV({
                    povid: povid,
                    pos: [pov.pos.x, pov.pos.y, pov.pos.z],
                    tgt: [pov.target.x, pov.target.y, pov.target.z],
                    fov: pov.fov
                });

                refreshPOVList();
                HATHOR.SUI.buildPOVs();
            }
        })
    );

    if (HATHOR.isEditorMode()) elPOVs.append(elCurrPOV, elPOVlist);
    else elPOVs.append(elPOVlist);

    refreshPOVList();

    elBody.append(
        ATON.UI.createTreeGroup({
            items:[
                {
                    title: "Viewpoints (POV)",
                    open: true,
                    content: elPOVs
                },
/*
                {
                    title: "Paths"
                },
                {
                    title: "Locomotion Nodes"
                }
*/
            ]
        })
    );
  
    UI.openToolPanel({
        header: "Navigation",
        body: elBody
    });
};

// POV (viewpoints)
UI.updatePOVs = ()=>{
    // Clear "all" POV-path
    ATON.Nav.createPOVPath(HATHOR.POVPATH_ALL);

    let povcount = 0;
    for (let pov in ATON.Nav.povlist){
        povcount++;
        ATON.Nav.addPOVtoPath(pov, HATHOR.POVPATH_ALL);
    }

    if (povcount < 1){
        ATON.UI.hideElement(UI._elPOVprev);
        ATON.UI.hideElement(UI._elPOVnext);
    }
    else {
        ATON.UI.showElement(UI._elPOVprev);
        ATON.UI.showElement(UI._elPOVnext);
    }
};

UI.modalDeletePOV = (povid)=>{
    if (!povid) return;
    let POV = ATON.Nav.povlist[povid];
    if (!POV) return; 

    let elBody = ATON.UI.createContainer();
    elBody.append( ATON.UI.elem(`<p>Are you sure you want to delete viewpoint '${povid}'?</p>`) );

    elBody.append(
        UI.createBlockGroup({
            items:[
                ATON.UI.createButton({
                    text: "NO",
                    classes: "btn-default",
                    onpress: ATON.UI.hideModal
                }),
                ATON.UI.createButton({
                    text: "YES",
                    icon: "delete",
                    classes: "btn-accent",
                    onpress: ()=>{
                        HATHOR.ED.deletePOV({povid: povid});
                        //refreshPOVList();
                        HATHOR.SUI.buildPOVs();

                        ATON.UI.hideModal();
                        UI.sideNav();
                    }
                })
            ]
        })
    );

    ATON.UI.showModal({
        header: "Delete Viewpoint",
        body: elBody
    });
};

UI.sideViewpoint = (povid)=>{
    let elBody = ATON.UI.createContainer({
        //style: "margin-bottom: 4px;"
    });

    let elPOVparams = ATON.UI.createContainer({ classes: "hathor-panel-section" });
    let elCurrPOV = ATON.UI.createContainer({ classes: "hathor-panel-section" });

    let POV = (povid)? ATON.Nav.povlist[povid] : ATON.Nav.copyCurrentPOV();

    POV.pos    = ATON.Utils.roundVector3(POV.pos, 3);
    POV.target = ATON.Utils.roundVector3(POV.target, 3);
    //POV.fov    = ATON.Utils.rounFloat(POV.fov, 0);

    elPOVparams.append(
        ATON.UI.elem("<span class='aton-form-label'>Eye (position)</span>"),
        ATON.UI.createVectorControl({
            vector: POV.pos,
            step: 0.1,
            onupdate: ()=>{
                if (isNaN(POV.pos.x) || isNaN(POV.pos.y) || isNaN(POV.pos.z)) return;

                ATON.Nav.requestPOV(POV, 0.0);
            }
        }),

        ATON.UI.elem("<span class='aton-form-label'>Target</span>"),
        ATON.UI.createVectorControl({
            vector: POV.target,
            step: 0.1,
            onupdate: ()=>{
                if (isNaN(POV.target.x) || isNaN(POV.target.y) || isNaN(POV.target.z)) return;

                ATON.Nav.requestPOV(POV, 0.0);
            }
        }),

        ATON.UI.elem("<span class='aton-form-label'>Field of view (degrees)</span>"),
        ATON.UI.createNumericInput({
            range: [5.0, 100.0],
            step: 1.0,
            value: POV.fov,
            onupdate: (v)=>{
                v = parseFloat(v);

                if (v < 5.0) return;
                if (v > 100.0) return;

                ATON.Nav.setFOV(v);
            }
        })
    );

    elBody.append(elPOVparams);
/*
    elCurrPOV.append(
        //UI.createTextBlock("Use current viewpoint as:"),

        ATON.UI.createButton({
            icon: "home",
            text: "Set as Home",
            classes: "btn-default",
            onpress: ()=>{
                let pov = ATON.Nav.copyCurrentPOV();
                
                HATHOR.ED.addPOV({
                    povid: "home",
                    pos: [pov.pos.x, pov.pos.y, pov.pos.z],
                    tgt: [pov.target.x, pov.target.y, pov.target.z],
                    fov: pov.fov
                });

                //refreshPOVList();
                HATHOR.SUI.buildPOVs();
            }
        }),

        ATON.UI.createInputText({
            placeholder: "New viewpoint...",
            icon: "add",
            classes: "w-100",
            onsubmit: (povid)=>{
                let pov = ATON.Nav.copyCurrentPOV();

                HATHOR.ED.addPOV({
                    povid: povid,
                    pos: [pov.pos.x, pov.pos.y, pov.pos.z],
                    tgt: [pov.target.x, pov.target.y, pov.target.z],
                    fov: pov.fov
                });

                //refreshPOVList();
                HATHOR.SUI.buildPOVs();
            }
        })
    );
*/

    if (!povid) elBody.append(elCurrPOV);

    UI.openToolPanel({
        header: (povid)? "Viewpoint '"+povid+"'" : "Control viewpoint",
        body: elBody,
        headelement: ATON.UI.createButton({
            icon: "left",
            onpress: UI.sideNav
        }),
    });
};

//====================================
// FX
//====================================
UI.sideFX = ()=>{
    let elBody  = ATON.UI.createContainer();

    // AO
    let elFXAO = ATON.UI.createContainer();
    elFXAO.append(
        UI.createTextBlock("FX description"),
        ATON.UI.createButtonSwitch({
            text: "Enabled",
            classes: "w-100 btn-default",
            status: ATON.FX.isPassEnabled(ATON.FX.PASS_AO),
            onswitch: (b)=>{
                if (b) HATHOR.ED.addFX({ ao: {i: 0.2} });
                else HATHOR.ED.removeFX({ ao: {} });
            }
        }),
        ATON.UI.createSlider({
            range: [0.1,0.5],
            step: 0.05,
            value: ATON.FX.getAOintensity(),
            label: "Intensity",
            classes: "w-100",
            oninput: (v)=>{
                HATHOR.ED.addFX({ ao: {i: v} });
            }
        })
    );

    // Bloom
    let elFXBloom = ATON.UI.createContainer();
    elFXBloom.append(
        UI.createTextBlock("FX description"),
        ATON.UI.createButtonSwitch({
            text: "Enabled",
            classes: "w-100 btn-default",
            status: ATON.FX.isPassEnabled(ATON.FX.PASS_BLOOM),
            onswitch: (b)=>{
                if (b) HATHOR.ED.addFX({ bloom: {i: 0.3} });
                else HATHOR.ED.removeFX({ bloom: {} });
            }
        }),

        ATON.UI.createSlider({
            range: [0.1,3.0],
            step: 0.05,
            value: ATON.FX.getBloomStrength(),
            label: "Strength",
            classes: "w-100",
            oninput: (v)=>{
                HATHOR.ED.addFX({ bloom: {i: v} });
            }
        }),
        ATON.UI.createSlider({
            range: [0.1,1.0],
            step: 0.01,
            value: ATON.FX.getBloomThreshold(),
            label: "Threshold",
            classes: "w-100",
            oninput: (v)=>{
                HATHOR.ED.addFX({ bloom: {t: v} });
            }
        })
    );

    // DoF
    let elFXDOF = ATON.UI.createContainer();
    elFXDOF.append(
        UI.createTextBlock("FX description"),
        ATON.UI.createButtonSwitch({
            text: "Enabled",
            classes: "w-100 btn-default",
            status: ATON.FX.isPassEnabled(ATON.FX.PASS_DOF),
            onswitch: (b)=>{
                //
            }
        }),
    );

    elBody.append(
        ATON.UI.createTreeGroup({
            items:[
                {
                    title: "Ambient Occlusion",
                    open: true,
                    content: elFXAO
                },
                {
                    title: "Bloom",
                    open: true,
                    content: elFXBloom
                },
            ]
        })
    );

    UI.openToolPanel({
        header: "Post-processing FX",
        body: elBody
    }); 
};

//====================================
// Copyrights / Metadata
//====================================
UI.modalCopyrights = ()=>{
    let numCC = ATON.CC.list.length;
    if (numCC < 1) return;

    let elBody = ATON.UI.createContainer();

    for (let cc in ATON.CC.list){
        let CC = ATON.CC.list[cc];

        let elCC = ATON.UI.createContainer({ classes: "hathor-panel-section" });
        //let elCC = ATON.UI.elem("<table class='table hathor-panel-section'><tbody></tbody></table>");

        for (let e in CC){
            elCC.append(
                ATON.UI.elem(`
                    <div class='row'>
                        <div class='col-md-2'><strong>${e}</strong></div>
                        <div class='col-md-10'>${ATON.UI.URLifyToHTML(CC[e])}</div>
                    </div>
                `)
/*
                ATON.UI.elem(`
                    <div style='display:block'>
                    <strong>${e}</strong>: ${ATON.UI.URLifyToHTML(CC[e])}</div>`
                )
*/
            );
        }

        elBody.append(elCC);
    }

    ATON.UI.showModal({
        header: "Copyrights / Metadata",
        body: elBody,
        //footer: elFooter,
    });
};

//====================================
// Collaborative session (Photon)
//====================================
UI.createChatContainer = ()=>{
    if (!UI._elPhotonChat){
        UI._elPhotonChat = ATON.UI.createContainer({
            classes: "aton-photon-chat-container"
        });
    }

    return UI._elPhotonChat;
};

// Append a user message to the main chat container
UI.addMessage = (o)=>{
    if (!UI._elPhotonChat) return;
    
    if (!o.msg) return;

    let A = ATON.Photon.avatarList[o.uid];

    let elMSG = ATON.UI.elem(`<span class='aton-photon-msg'>${o.msg}</span>`);

    let elU = ATON.UI.createButton({
        //icon: "user",
        text: (o.uid !== ATON.Photon.uid)? A.getUsername() : "You",
        classes: "aton-btn-photon aton-photon-chat-user",
        onpress: ()=>{
            //
        }
    });

    if (o.uid !== undefined){
        let n = ATON.Photon.ucolors.length;
        let c = (o.uid % n);

        let strcol = ATON.Photon.ucolors[c].getStyle();

        elU.style["background-color"] = strcol;
    }

    elMSG.prepend( elU );

    UI._elPhotonChat.append(elMSG);
};

UI.sideCollab = ()=>{
    if (!ATON.Photon.isConnected()){
        ATON.Photon.connect();
        UI._elPhoton.setAttribute("disabled",true);
        return;
    }

    let elBody = ATON.UI.createContainer();

    let uname = ATON.Photon.getUsername();

    let elUname = ATON.UI.createInputText({
        //label: "Username",
        placeholder: "Username",
        value: uname,
        classes: "w-100",
        clearonsub: false,
        validator: (u)=>{
            if (u.length < 3) return false;
            return true;
        },
        onsubmit: (u)=>{
            ATON.Photon.setUsername(u);
        }
    });
/*
    let elUname = ATON.UI.createButton({
        text: uname,
        classes: "btn-default"
    });

    ATON.checkAuth(u => {
        if (u){
            elUname.replaceWith(
                ATON.UI.createInputText({
                    //label: "Username",
                    placeholder: "Username",
                    value: uname,
                    classes: "w-100",
                    clearonsub: false,
                    validator: (u)=>{
                        if (u.length < 3) return false;
                        return true;
                    },
                    onsubmit: (u)=>{
                        ATON.Photon.setUsername(u);
                    }
                })
            )
        }
    })
*/
    elBody.append(
        UI.createTextBlock("Set a username for this collaborative sesssion:"),
        UI.createBlockGroup({
            items:[
                elUname,
            ]
        }),

        UI.createBlockGroup({
            items:[
                ATON.UI.createButton({
                    text: "Leave session",
                    icon: "exit",
                    classes: "btn-default aton-btn-block",
                    onpress: ()=>{
                        ATON.Photon.disconnect();
                        UI.closeToolPanel();
                    }
                })
            ]
        }),

        UI.createTextBlock("Use this chat to exchange message among participants:"),
        UI.createChatContainer(),

        ATON.UI.createInputText({
            //label: "Username",
            placeholder: "Send a message...",
            classes: "w-100",
            validator: (msg)=>{
                if (msg.length < 1) return false;
                return true;
            },
            onsubmit: (msg)=>{
                ATON.Photon.setMessage(msg);
                UI.addMessage({msg: msg, uid: ATON.Photon.uid });
            }
        }),
    );

    UI.openToolPanel({
        header: "Collaborative Session",
        body: elBody
    }); 
};

//====================================
// Tasks
//====================================
UI.buildTaskToolbar = (task)=>{
    if (!task) return;

    UI._elTasks.innerHTML = "";
    UI.hideMainElements();

    ATON.UI.showElement(UI._elTasks);

    // Basic semantic shape
    if (task === HATHOR.TASK_BASIC_ANN){
        let selRange = ATON.SUI.getSelectorRange();

        HATHOR.UI._elTasks.append(
            ATON.UI.createButton({
                text: "Cancel",
                icon: "bi-x-lg",
                classes: "btn-default",
                onpress: ()=>{
                    HATHOR.endCurrentTask();
                    UI.sideSemantics();
                }
            }),
/*
            ATON.UI.createSlider({
                range: selRange,
                step: (selRange[1]-selRange[0]) * 0.01,
                //label: "Radius",
                //classes: "w-100",
                oninput: (r)=>{
                    ATON.SUI.setSelectorRadius(r);
                }
            })
*/
            ATON.UI.createContainer({
                style: "display:inline-block;",
                items:[
                    ATON.UI.createSlider({
                        range: selRange,
                        step: (selRange[1]-selRange[0]) * 0.01,
                        value: ATON.SUI.getSelectorRadius(),
                        //label: "Radius",
                        oninput: (r)=>{
                            ATON.SUI.setSelectorRadius(r);
                        }
                    })
                ]
            })

        );
    }

    // Free form semantic shape
    if (task === HATHOR.TASK_CONVEX_ANN){
        HATHOR.UI._elTasks.append(ATON.UI.createButton({
            text: "Cancel",
            icon: "bi-x-lg",
            classes: "btn-default",
            onpress: ()=>{ 
                HATHOR.endCurrentTask();
                UI.sideSemantics();
            }
        }));

        HATHOR.UI._elTasks.append(ATON.UI.createButton({
            text: "Complete",
            icon: "bi-check-lg",
            classes: "btn-accent",
            onpress: ()=>{
                UI.modalAnnotation();
            }
        }));        
    }

    // Main light
    if (task === HATHOR.TASK_DIR_LIGHT){

/*
        let elDisable = ATON.UI.createButton({
            text: "Disable",
            icon: "cancel",
            classes: "btn-default",
            onpress: ()=>{
                HATHOR.ED.disableMainLight();
                HATHOR.endCurrentTask();
            }
        });
*/
/*
        HATHOR.UI._elTasks.append(ATON.UI.createButton({
            text: "Cancel",
            icon: "bi-x-lg",
            classes: "btn-default",
            onpress: ()=>{ 
                HATHOR.endCurrentTask();
            }
        }));
*/
        //HATHOR.UI._elTasks.append(elDisable);
        //HATHOR.UI._elTasks.append(elShadows);

        HATHOR.UI._elTasks.append(ATON.UI.createButton({
            text: "Ok",
            icon: "bi-check-lg",
            classes: "btn-accent",
            onpress: ()=>{
                HATHOR.ED.setLighting({
                    dir: [HATHOR._cLightDir.x, HATHOR._cLightDir.y, HATHOR._cLightDir.z]
                });
                
                HATHOR.endCurrentTask();
                UI.sideEnv();
            }
        }));

        //ATON.UI.hideElement(elDisable);
        //if (!ATON.areShadowsEnabled()) ATON.UI.hideElement(elShadows);
    } 
};

UI.clearTaskToolbar = ()=>{
    UI._elTasks.innerHTML = "";
    ATON.UI.hideElement(UI._elTasks);

    UI.showMainElements();
};

export default UI;