/*===========================================================================

    "Hathor": ATON official front-end

    Author: B. Fanini

===========================================================================*/

/**
Hathor front-end (official ATON front-end)
@namespace HATHOR
*/
let HATHOR = {};
window.HATHOR = HATHOR;


HATHOR.SELACTION_STD            = 0;
HATHOR.SELACTION_ADDSPHERESHAPE = 1;
HATHOR.SELACTION_ADDCONVEXPOINT = 2;
HATHOR.SELACTION_MEASURE        = 3;


// Main Hathor init routine, with optional Scene-ID
HATHOR.init = (sid)=>{

    ATON.FE.realize();

    if (sid === undefined || sid === null) sid = ATON.FE.urlParams.get('s');

    HATHOR.paramSID   = sid;
    HATHOR.paramDDens = ATON.FE.urlParams.get('d');
    HATHOR.paramVRC   = ATON.FE.urlParams.get('vrc');
    HATHOR.paramEdit  = ATON.FE.urlParams.get('edit');
    HATHOR.paramFPS   = ATON.FE.urlParams.get('fps');
    HATHOR.paramRLOG  = ATON.FE.urlParams.get('rlog');
    HATHOR.paramUIP   = ATON.FE.urlParams.get('uip');

    if (HATHOR.paramRLOG){
        console.log   = ATON.VRoadcast.log;
        console.error = ATON.VRoadcast.log;
        console.warn  = ATON.VRoadcast.log;
    }

    // Enable BVH bounds visualziation
    let bvhParam = ATON.FE.urlParams.get('bvh');
    if (bvhParam) ATON.Utils.showBVHbounds( parseInt(bvhParam) );

    let tsb = ATON.FE.urlParams.get("tsb");
    if (tsb) ATON.setTSetsDisplayBounds( Boolean(tsb) );
    
    HATHOR._bVRCsetup = false;
    HATHOR._bVRCreq   = false;

    HATHOR._selMode = HATHOR.SELACTION_STD;

    //if (HATHOR.paramEdit) ATON.SceneHub.setEditMode(HATHOR.paramEdit);
    //else ATON.SceneHub.setEditMode(false);
    ATON.FE.checkAuth((d)=>{
        if (d.username !== undefined){
            $('#idAuthTools').show();
        }
        else {
            $('#idAuthTools').hide();
        }
    });

    ATON.FE.addBasicLoaderEvents();

    // POVs
    HATHOR._cPOVind = undefined;
    HATHOR._povs = [];

    HATHOR.uiSetup();
    HATHOR.suiSetup();
    HATHOR.setupEventHandlers();

    // Load scene
    ATON.FE.loadSceneID(HATHOR.paramSID);

    // Show BVH
    //ATON.Utils.setBVHboundsVisible();

    //ATON._bPauseQuery = true;
    //ATON.setTimedGazeDuration(2.0);
};



// Front-end UI
//=======================
HATHOR.resetSelectionMode = ()=>{
    HATHOR._selMode = HATHOR.SELACTION_STD;
    $("#btn-ann-convex").removeClass("atonBTN-rec");
    $("#btn-ann-sphere").removeClass("atonBTN-rec");
    $("#btn-measure").removeClass("atonBTN-rec");

    ATON.getUINode("sui_measure").switch(false);
    ATON.getUINode("sui_annconvex").switch(false);

    ATON.Nav.setUserControl(true);
    return;
};

HATHOR.setSelectionMode = (m)=>{
    if (m === undefined){
        HATHOR.resetSelectionMode();
        return;
    }

    HATHOR._selMode = m;

    if (m === HATHOR.SELACTION_ADDSPHERESHAPE){
        $("#btn-ann-sphere").addClass("atonBTN-rec");
        $("#btn-ann-convex").removeClass("atonBTN-rec");
        $("#btn-measure").removeClass("atonBTN-rec");
    }

    if (m === HATHOR.SELACTION_ADDCONVEXPOINT){
        $("#btn-ann-convex").addClass("atonBTN-rec");
        $("#btn-ann-sphere").removeClass("atonBTN-rec");
        $("#btn-measure").removeClass("atonBTN-rec");
        
        ATON.getUINode("sui_annconvex").switch(true);
    }

    if (m === HATHOR.SELACTION_MEASURE){
        $("#btn-measure").addClass("atonBTN-rec");
        $("#btn-ann-sphere").removeClass("atonBTN-rec");
        $("#btn-ann-convex").removeClass("atonBTN-rec");
        
        ATON.getUINode("sui_measure").switch(true);
    }
};

// Hathor UI buttons
HATHOR.uiAddButtonMeasure = (idcontainer)=>{
    ATON.FE.uiAddButton(idcontainer, "measure", ()=>{
        if (HATHOR._selMode !== HATHOR.SELACTION_MEASURE){
            HATHOR.setSelectionMode(HATHOR.SELACTION_MEASURE);
            //ATON.Nav.setUserControl(false);
            //$("#btn-cancel").show();
        }
        else {
            HATHOR.resetSelectionMode();
        }
    }, "Measure");
};

HATHOR.uiAddButtonAnnSphere = (idcontainer)=>{
    ATON.FE.uiAddButton(idcontainer, "ann-sphere", ()=>{
        HATHOR.setSelectionMode(HATHOR.SELACTION_ADDSPHERESHAPE);
    }, "Annotate using basic sphere shape");
};

HATHOR.uiAddButtonAnnConvex = (idcontainer)=>{
    ATON.FE.uiAddButton(idcontainer, "ann-convex", ()=>{
        if (HATHOR._selMode !== HATHOR.SELACTION_ADDCONVEXPOINT){
            HATHOR.setSelectionMode(HATHOR.SELACTION_ADDCONVEXPOINT);
            ATON.Nav.setUserControl(false);
            $("#btn-cancel").show();
        }
        else {
            HATHOR.resetSelectionMode();
            HATHOR.popupAddSemantic(ATON.FE.SEMSHAPE_CONVEX);
        }
    }, "Annotate using convex shape");
};

HATHOR.uiAddButtonTaskCancel = (idcontainer)=>{
    ATON.FE.uiAddButton(idcontainer, "cancel", ()=>{
        HATHOR.cancelCurrentTask();
    });

    $("#btn-cancel").hide();
};


// Hathor UI Profiles
HATHOR.uiBase = ()=>{
    $("#idTopToolbar").html(""); // clear

    if (HATHOR.paramVRC) ATON.FE.uiAddButtonVRC("idTopToolbar");
    ATON.FE.uiAddButtonUser("idTopToolbar");

    $("#btn-playpause").remove();
    ATON.FE.uiAddButtonMainVideoPanoPlayPause("idBottomToolbar");
};

HATHOR.uiAddBaseSem = ()=>{
    HATHOR.uiAddButtonAnnSphere("idTopToolbar");
    HATHOR.uiAddButtonAnnConvex("idTopToolbar");
    HATHOR.uiAddButtonTaskCancel("idTopToolbar");
};

// Create UI Profiles
HATHOR.buildUIProfiles = ()=>{

    // Standard
    ATON.FE.uiAddProfile("default", ()=>{
        $("#idTopToolbar").html(""); // clear

        ATON.FE.uiSetEditMode(false, "idTopToolbar");

        HATHOR.uiBase();

        ATON.FE.uiAddButton("idTopToolbar", "scene", HATHOR.popupScene, "Scene" );
        ATON.FE.uiSwitchButton("scene", ATON.SceneHub._bEdit);

        //ATON.FE.uiAddButtonNav("idTopToolbar");
        ATON.FE.uiAddButton("idTopToolbar", "share", HATHOR.popupShare, "Share");
        ATON.FE.uiAddButton("idTopToolbar", "nav", HATHOR.popupNav, "Navigation" );
        ATON.FE.uiAddButtonVR("idTopToolbar");
        //ATON.FE.uiAddButtonDeviceOrientation("idTopToolbar");

        ATON.FE.uiAddButtonFullScreen("idTopToolbar");
        ATON.FE.uiAddButton("idTopToolbar", "help", HATHOR.popupHelp, "Help" );
    });

    // Editor
    ATON.FE.uiAddProfile("editor", ()=>{
        $("#idTopToolbar").html("");

        ATON.FE.uiSetEditMode(false, "idTopToolbar");

        HATHOR.uiBase();

        ATON.FE.checkAuth((r)=>{
            let authUser   = r.username;
            let bYourScene = (ATON.SceneHub.currID)? ATON.SceneHub.currID.startsWith(authUser) : false;

            // In order to allow editing, must be authenticated + our scene
            if (!authUser || !bYourScene) return;

            ATON.FE.uiSetEditMode(true, "idTopToolbar");

            ATON.FE.uiAddButtonEditMode("idTopToolbar");
            ATON.FE.uiAddButton("idTopToolbar", "scene", HATHOR.popupScene, "Scene" );
            ATON.FE.uiAddButton("idTopToolbar","light", HATHOR.popupEnvironment, "Environment");
            ATON.FE.uiAddButton("idTopToolbar", "list", HATHOR.popupGraphs, "Scene Layers");
    /*
            ATON.FE.uiAddButton("idTopToolbar", "selector", ()=>{
                ATON.FE.popupSelector();
            }, "3D Selector");
    */
            HATHOR.uiAddButtonMeasure("idTopToolbar");
            HATHOR.uiAddBaseSem();
        });
    });

    ATON.FE.uiAddProfile("minimal", ()=>{
        $("#idTopToolbar").html(""); // clear

        ATON.FE.uiSetEditMode(false, "idTopToolbar");

        ATON.FE.uiAddButtonFullScreen("idTopToolbar");
        ATON.FE.uiAddButtonVR("idTopToolbar");
        ATON.FE.uiAddButtonScreenshot("idTopToolbar");
        ATON.FE.uiAddButton("idTopToolbar", "measure", ()=>{
            if (HATHOR._selMode !== HATHOR.SELACTION_MEASURE){
                HATHOR.setSelectionMode(HATHOR.SELACTION_MEASURE);
                //ATON.Nav.setUserControl(false);
                //$("#btn-cancel").show();
            }
            else {
                HATHOR.resetSelectionMode();
            }
        }, "Measure");

        ATON.FE.uiAddButton("idTopToolbar","light", HATHOR.popupEnvironment, "Environment");

        //ATON.FE.uiAddButton("idTopToolbar", "help", HATHOR.popupHelp, "Help" );
    });

    // Expo
    ATON.FE.uiAddProfile("expo", ()=>{
        $("#idTopToolbar").html(""); // clear

        ATON.FE.uiSetEditMode(false, "idTopToolbar");

        ATON.FE.uiAddButtonFullScreen("idTopToolbar");
        ATON.FE.uiAddButtonVR("idTopToolbar");
        ATON.FE.uiAddButtonQR("idTopToolbar");
        //ATON.FE.uiAddButton("idTopToolbar", "help", HATHOR.popupHelp, "Help" );
    });

    // XR
    ATON.FE.uiAddProfile("xr", ()=>{
        $("#idTopToolbar").html(""); // clear

        ATON.FE.uiSetEditMode(false, "idTopToolbar");

        ATON.FE.uiAddButtonVR("idTopToolbar");
        ATON.FE.uiAddButtonAR("idTopToolbar");
        ATON.FE.uiAddButtonQR("idTopToolbar");
        //ATON.FE.uiAddButton("idTopToolbar", "help", HATHOR.popupHelp, "Help" );
    });

    // Collaborate
/*
    ATON.FE.uiAddProfile("Collaborate", ()=>{
        $("#idTopToolbar").html(""); // clear

        ATON.FE.uiAddButtonVRC("idTopToolbar");
        ATON.FE.uiAddButtonUser("idTopToolbar");
        
        ATON.FE.uiAddButton("idTopToolbar", "scene", HATHOR.popupScene, "Scene" );
        ATON.FE.uiSwitchButton("scene", ATON.SceneHub._bEdit);

        ATON.FE.uiAddButton("idTopToolbar", "selector", ()=>{
            ATON.FE.popupSelector();
        }, "3D Selector options");
        ATON.FE.uiAddButtonStreamFocus("idTopToolbar");

        ATON.FE.uiAddButton("idTopToolbar", "list", ()=>{
            HATHOR.popupGraphs();
        }, "Layers / Graphs");
        
        //HATHOR.uiAddBaseSem();

        //if (HATHOR.paramSID) ATON.VRoadcast.connect();
        //HATHOR.paramVRC = "1";
        HATHOR._bVRCreq = true;
    });
*/
};



HATHOR.uiSetup = ()=>{

    HATHOR.buildUIProfiles();

    if (HATHOR.paramUIP) ATON.FE.uiLoadProfile(HATHOR.paramUIP);
    else ATON.FE.uiLoadProfile("default");
  
    // Bottom toolbar
    //$("#idBottomToolbar").append("<input id='idSearch' type='text' maxlength='15' size='15'><br>");
    ATON.FE.uiAddButton("idBottomToolbar", "prev", HATHOR.povPrev, "Previous Viewpoint" );
    ATON.FE.uiAddButtonHome("idBottomToolbar");
    ATON.FE.uiAddButton("idBottomToolbar", "next", HATHOR.povNext, "Next Viewpoint" );
    ATON.FE.uiAddButtonTalk("idBottomToolbar");

    ATON.FE.uiAddButton("idBottomRToolbar", "cc", HATHOR.popupCC, "Assets copyright" );
    ATON.FE.uiAddButton("idBottomRToolbar", "info", HATHOR.popupSceneInfo, "Scene information" );

    $("#btn-talk").hide();
    $("#btn-info").hide();
    $("#btn-cc").hide();

    $("#btn-prev").hide();
    $("#btn-next").hide();

    if (HATHOR.paramFPS){
        $("#idTopToolbar").append("<div id='idFPS' style='top:5px;right:5px;position:fixed;'></div>");

        //ATON.on("frame", ()=>{
        ATON.addUpdateRoutine(()=>{
            let fps = parseInt(ATON._fps);
            $("#idFPS").html(fps);
        });
    }
};

// Spatial UI
//=======================
HATHOR.suiSetup = ()=>{
    
    let buttons = [];

    buttons.push( new ATON.SUI.Button("sui_annconvex") );
    buttons.push( new ATON.SUI.Button("sui_measure") );
    buttons.push( new ATON.SUI.Button("sui_talk") );
    buttons.push( new ATON.SUI.Button("sui_home") );
    buttons.push( new ATON.SUI.Button("sui_povnext") );
    buttons.push( new ATON.SUI.Button("sui_exitxr") );

    let btnAnnConvex = ATON.getUINode("sui_annconvex");
    btnAnnConvex.setIcon(ATON.FE.PATH_RES_ICONS+"ann-convex.png")
        //.setSwitchColor(ATON.MatHub.colors.green)
        .onSelect = ()=>{
            if (HATHOR._selMode !== HATHOR.SELACTION_ADDCONVEXPOINT){
                HATHOR.setSelectionMode(HATHOR.SELACTION_ADDCONVEXPOINT);
                btnAnnConvex.switch(true);
            }
            else {
                let S = ATON.SemFactory.completeConvexShape();
                if (S) ATON.getRootSemantics().add(S);

                HATHOR.resetSelectionMode();
                btnAnnConvex.switch(false);
            }
        };

    let btnMeasure = ATON.getUINode("sui_measure");
    btnMeasure.setIcon(ATON.FE.PATH_RES_ICONS+"measure.png")
        //.setSwitchColor(ATON.MatHub.colors.green)
        .onSelect = ()=>{
            if (HATHOR._selMode !== HATHOR.SELACTION_MEASURE){
                HATHOR.setSelectionMode(HATHOR.SELACTION_MEASURE);
                btnMeasure.switch(true);
            }
            else {
                HATHOR.resetSelectionMode();
                btnMeasure.switch(false);
            }
        };

    let btnTalk = ATON.getUINode("sui_talk");
    btnTalk.setIcon(ATON.FE.PATH_RES_ICONS+"talk.png")
        //.setSwitchColor(ATON.MatHub.colors.orange)
        .onSelect = ()=>{
            if (ATON.MediaRec.isAudioRecording()){
                ATON.MediaRec.stopMediaStreaming();
                btnTalk.switch(false);
            }
            else {
                ATON.MediaRec.startMediaStreaming();
                btnTalk.switch(true);
            }
        };

    ATON.getUINode("sui_home")
        .setIcon(ATON.FE.PATH_RES_ICONS+"home.png")
        .onSelect = ()=>{
            ATON.Nav.requestHome();
        };

    ATON.getUINode("sui_povnext")
        .setIcon(ATON.FE.PATH_RES_ICONS+"next.png")
        .onSelect = ()=>{
            HATHOR.povNext();
        };

    ATON.getUINode("sui_exitxr")
        .setBaseColor(ATON.MatHub.colors.red)
        .setIcon(ATON.FE.PATH_RES_ICONS+"vr.png")
        .onSelect = ()=>{
            ATON.XR.toggle();
        };


    HATHOR.suiToolbar = ATON.SUI.createToolbar( buttons );

    // wrist sui
    let pi2 = (Math.PI * 0.5);
    HATHOR.suiToolbar.setPosition(-0.1,0,0.1).setRotation(-pi2,-pi2,pi2).setScale(0.5);

    HATHOR.suiToolbar.attachToRoot();
    HATHOR.suiToolbar.hide();

};

// Event handling
//====================================
HATHOR.setupVRCEventHandlers = ()=>{
    if (HATHOR._bVRCsetup) return;

    //ATON.VRoadcast.on("VRC_test", (d)=>{ console.log(d); });

    ATON.VRoadcast.on("AFE_DeleteNode", (d)=>{
        let nid  = d.nid;
        let type = d.t;
        if (nid === undefined) return;
        if (type === undefined) return;

        if (type === ATON.NTYPES.SEM){
            ATON.SemFactory.deleteSemanticNode(nid);
        }
        /*
        if (type === ATON.NTYPES.SCENE){
            ATON.getSceneNode(nid).removeChildren();
        }*/
    });

    ATON.VRoadcast.on("AFE_ClearMeasurements",()=>{
        ATON.SUI.clearMeasurements();
    });

    ATON.VRoadcast.on("AFE_AddSceneEdit", (d)=>{
        ATON.SceneHub.parseScene(d);
        //console.log(d);
    });

    ATON.VRoadcast.on("AFE_NodeSwitch", (d)=>{
        let nid = d.nid;
        if (nid === undefined) return;

        let N = undefined;
        if (d.t === ATON.NTYPES.SEM) N = ATON.getSemanticNode(nid);
        else N = ATON.getSceneNode(nid);
        
        if (N === undefined) return;

        N.toggle(d.v);
    });

    ATON.VRoadcast.on("AFE_LightSwitch", (b)=>{
        ATON.toggleMainLight(b);
    });

    ATON.on("VRC_IDassigned", (uid)=>{
        $("#btn-talk").show();
    });
    ATON.on("VRC_Disconnected", ()=>{
        $("#btn-talk").hide();
    });

    HATHOR._bVRCsetup = true;
};

HATHOR.setupEventHandlers = ()=>{

    // XR
    ATON.on("XRmode",(b)=>{
        HATHOR.resetSelectionMode();
    });

    ATON.EventHub.clearEventHandlers("XRselectStart");
    ATON.on("XRselectStart", (c)=>{
        if ( ATON._SUIactivation() ) return;

        if (c === ATON.XR.HAND_R){
            if (HATHOR._selMode === HATHOR.SELACTION_STD){
                ATON._stdActivation();
            }

/*
            if (HATHOR._selMode === HATHOR.SELACTION_STD){
                ATON._stdActivation(); //ATON.XR.teleportOnQueriedPoint();
            }
            if (HATHOR._selMode === HATHOR.SELACTION_MEASURE){
                if (ATON._SUIactivation()) return;
                
                console.log("measurement!");
                HATHOR.measure();
            }
*/
            //ATON.FE.playAudioFromSemanticNode(ATON._hoveredSemNode);

            if (HATHOR._selMode === HATHOR.SELACTION_MEASURE){
                HATHOR.measure();
            }

            if (HATHOR._selMode === HATHOR.SELACTION_ADDCONVEXPOINT){
                ATON.SemFactory.addSurfaceConvexPoint();
                //TODO: ...or addConvecPoint() on selector location
            }
        }
    });

    // VRC
    ATON.on("VRC_Connected", ()=>{
        HATHOR.setupVRCEventHandlers();
    });

    ATON.on("SceneJSONLoaded",()=>{
        if (HATHOR.paramVRC){
            if (HATHOR.paramVRC.length > 4) ATON.VRoadcast.setAddress( HATHOR.paramVRC );
            ATON.VRoadcast.connect();
        }
        if (HATHOR._bVRCreq) ATON.VRoadcast.connect();

        if (ATON.SceneHub.getDescription()) HATHOR.popupSceneInfo();

        HATHOR.uiUpdatePOVs();

        // page title
        document.title = (ATON.SceneHub.currData.title)? ATON.SceneHub.currData.title : ATON.SceneHub.currID;
        //if (ATON.SceneHub.currData.description) $('meta[name="description"]').attr("content", ATON.SceneHub.currData.description);
    });

    ATON.on("NodeRequestFired", ()=>{ 
        $("#idLoader").show();
    });

    // Auth
    ATON.on("Login", (d)=>{
        //$('#idAuthTools').show();
        
        if (HATHOR.paramVRC === undefined) return;
        ATON.VRoadcast.setUsername(d.username);
    });
    ATON.on("Logout", ()=>{
        $('#idAuthTools').hide();

        ATON.FE.uiSetEditMode(false, "idTopToolbar");
    });

    // Immersive Sessions
    ATON.on("XRcontrollerConnected", (c)=>{
        if (c === ATON.XR.HAND_L){
            ATON.XR.controller1.add(HATHOR.suiToolbar);
            HATHOR.suiToolbar.show();  
        }

        //else {
        //    HATHOR.suiToolbar.attachToRoot();
        //    HATHOR.suiToolbar.hide();
        // }
    });

    ATON.on("FE_NodeSwitch", (N)=>{

        let E = {};
        if (N.t === ATON.NTYPES.SEM){
            E.semanticgraph = {};
            E.semanticgraph.nodes = {};
            E.semanticgraph.nodes[N.nid] = {};
            E.semanticgraph.nodes[N.nid].show = N.v; 
        }
        else {
            E.scenegraph = {};
            E.scenegraph.nodes = {};
            E.scenegraph.nodes[N.nid] = {};
            E.scenegraph.nodes[N.nid].show = N.v;
        }

        ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_ADD);
        //ATON.VRoadcast.fireEvent("AFE_AddSceneEdit", E); // FIXME: check why this is not working
        ATON.VRoadcast.fireEvent("AFE_NodeSwitch", {nid: N.nid, v: N.v, t: N.t});
        
        //console.log(E);
    });

/*
    ATON.on("SemanticNodeLeave", (semid)=>{
        let S = ATON.getSemanticNode(semid);
        if (S === undefined) return;

        S.restoreDefaultMaterial();
        //$('canvas').css({ cursor: 'default' });
    });
    ATON.on("SemanticNodeHover", (semid)=>{
        let S = ATON.getSemanticNode(semid);
        if (S === undefined) return;

        S.highlight();
        //$('canvas').css({ cursor: 'crosshair' });
    });
*/
/*
    ATON.on("MouseRightButton", ()=>{
        if (ATON._hoveredSemNode) HATHOR.popupSemDescription(ATON._hoveredSemNode);
    });
*/
    ATON.on("Tap", (e)=>{
        if (HATHOR._selMode === HATHOR.SELACTION_ADDCONVEXPOINT){
            ATON.SemFactory.addSurfaceConvexPoint();
        }

        if (HATHOR._selMode === HATHOR.SELACTION_ADDSPHERESHAPE){
            ATON.SemFactory.stopCurrentConvex();
            HATHOR.popupAddSemantic(ATON.FE.SEMSHAPE_SPHERE);
            HATHOR.resetSelectionMode();
        }

        if (HATHOR._selMode === HATHOR.SELACTION_MEASURE){
            HATHOR.measure();
        }
    });

    ATON.on("DoubleTap", (e)=>{
        if (ATON._hoveredSemNode) HATHOR.popupSemDescription(ATON._hoveredSemNode);
    });

    ATON.FE.useMouseWheelToScaleSelector();

    ATON.on("KeyPress", (k)=>{
        if (k === 'Delete'){
            if (ATON.SemFactory.deleteSemanticNode(ATON._hoveredSemNode)){

                let E = {};
                E.semanticgraph = {};
                E.semanticgraph.nodes = {};
                E.semanticgraph.nodes[ATON._hoveredSemNode] = {};

                //console.log(E);

                ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_DEL);

                //if (HATHOR.paramVRC === undefined) return;
                ATON.VRoadcast.fireEvent("AFE_DeleteNode", {t: ATON.NTYPES.SEM, nid: ATON._hoveredSemNode });
            }
        }

/*
        if (k === 'Backspace'){
            
        }

        if (k === 'Insert'){
            
        }
*/

        // Space
        if (k === ' ' || k === 'Space') HATHOR.popupSettings();

        // Current tasks
        if (k === 'Enter')  HATHOR.finalizeCurrentTask();
        if (k === 'Escape') HATHOR.cancelCurrentTask();

        // Modifiers
        if (k ==="Shift")  ATON.Nav.setUserControl(false);
        if (k==="Control") ATON.Nav.setUserControl(false);

        if (k === 'y'){
            //ATON.Utils.updateTSetsCamera();
        }

        if (k === 'g') HATHOR.popupGraphs();

        if (k==='x') HATHOR.popupExportSemShapes();

        if (k==='u') ATON.FE.popupUser();

        if (k === '('){
            ATON._envMapInt -= 0.5;
            if (ATON._envMapInt < 0.5) ATON._envMapInt = 0.5;
            console.log(ATON._envMapInt);
            ATON.updateLightProbes();
        }
        if (k === ')'){
            ATON._envMapInt += 0.5;
            console.log(ATON._envMapInt);
            ATON.updateLightProbes();
        }

        if (k === '['){
        }
        if (k === ']'){
        }

        //if (k==='w'){
        //    if (ATON.Nav._mode === ATON.Nav.MODE_FP) ATON.Nav.setMotionAmount(0.5);
        //}

        if (k==='a'){
            ATON.SemFactory.stopCurrentConvex();
            HATHOR.popupAddSemantic(ATON.FE.SEMSHAPE_SPHERE);
        }
        if (k==='s'){
            ATON.SemFactory.addSurfaceConvexPoint();
        }

/*
        if (k==='S'){
            HATHOR.popupAddSemantic(ATON.FE.SEMSHAPE_CONVEX);
        }
*/
        if (k==='e'){
            let esemid = ATON._hoveredSemNode;
            if (esemid !== undefined) HATHOR.popupAddSemantic(undefined, esemid);
            else HATHOR.popupEnvironment();
        }

        if (k==='m') HATHOR.measure();

        if (k==='c') ATON.FE.popupScreenShot();

        if (k==='#'){
            let bShadows = !ATON._renderer.shadowMap.enabled;
            ATON.toggleShadows(bShadows);

            let E = {};
            E.environment = {};
            E.environment.mainlight = {};
            E.environment.mainlight.shadows = bShadows;

            ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_ADD);
            ATON.VRoadcast.fireEvent("AFE_AddSceneEdit", E);
        }
        if (k==='l'){
            ATON.FE.controlLight(true);
        }

        if (k==='p'){
            HATHOR.addLightProbe();
        }

/*
        if (k==='L'){
            let D = ATON.Nav.getCurrentDirection();
            ATON.setMainLightDirection(D);

            let E = {};
            E.environment = {};
            E.environment.mainlight = {};
            E.environment.mainlight.direction = [D.x,D.y,D.z];

            ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_ADD);
            ATON.VRoadcast.fireEvent("AFE_AddSceneEdit", E);
        }
*/

        if (k==='v') HATHOR.popupPOV();


        if (k==='n') HATHOR.popupNav();

        //if (k==='h') ATON.setWorldScale( ATON._worldScale * 0.5 );

        //if (k==='^') ATON.Nav.setFirstPersonControl();

/*
        if (k==='h'){
            let hp = ATON.Nav.copyCurrentPOV();

            ATON.Nav.setHomePOV( hp );

            let E = {};
            E.viewpoints = {};
            E.viewpoints.home = {};
            E.viewpoints.home.position = [hp.pos.x, hp.pos.y, hp.pos.z];
            E.viewpoints.home.target   = [hp.target.x, hp.target.y, hp.target.z];
            E.viewpoints.home.fov      = hp.fov;

            console.log("Set home POV");
            console.log(hp);

            ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_ADD);
            ATON.VRoadcast.fireEvent("AFE_AddSceneEdit", E);
        }
*/
        //if (k==='y') ATON.XR.switchHands();

        //if (k==='.') ATON.MediaRec.startMediaStreaming();
        //if (k==='r') ATON.MediaRec.startRecording();

        if (k==='f'){
            ATON.VRoadcast.setFocusStreaming(true);

            if (ATON._queryDataScene){
                ATON.FX.setDOFfocus( ATON._queryDataScene.d );
            }
        }

        //if (k==='.') ATON.FE.controlSelectorScale(true);
    });

    ATON.on("KeyUp",(k)=>{
        if (k==='w'){
            ATON.Nav.stop();
        }

        //if (k==='.') ATON.MediaRec.stopMediaStreaming();
        //if (k==='r') ATON.MediaRec.stopRecording();

        if (k==='f'){
            ATON.VRoadcast.setFocusStreaming(false);

            if (ATON.FX.isPassEnabled(ATON.FX.PASS_DOF)){
                let k = ATON.FX.getDOFfocus().toPrecision(ATON.SceneHub.FLOAT_PREC);

                ATON.SceneHub.sendEdit({
                    fx:{ 
                        dof:{
                            f: k
                        }
                    }
                }, ATON.SceneHub.MODE_ADD);
            }
        }

        if (k==='l'){
            ATON.FE.controlLight(false);

            let D = ATON.getMainLightDirection();

            let E = {};
            E.environment = {};
            E.environment.mainlight = {};
            E.environment.mainlight.direction = [D.x,D.y,D.z];
            E.environment.mainlight.shadows = ATON._renderer.shadowMap.enabled;

            ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_ADD);
            ATON.VRoadcast.fireEvent("AFE_AddSceneEdit", E);
        }

        if (k==='.') ATON.FE.controlSelectorScale(false);

        if (k==="Shift") ATON.Nav.setUserControl(true);
        if (k==="Control") ATON.Nav.setUserControl(true);
    });

    ATON.on("MainPanoVideo", ()=>{
        $("#btn-playpause").show();
    });

    //ATON.on("frame", HATHOR._update);
    //setInterval(HATHOR._update, 100);
};

// TODO: Main HATHOR update routine
HATHOR._update = ()=>{
    if (ATON.FE._bPopup) return;

    if (HATHOR._selMode === HATHOR.SELACTION_ADDCONVEXPOINT && ATON._bPointerDown){
        ATON.SemFactory.addSurfaceConvexPoint();
    }
};

// Tasks
HATHOR.finalizeCurrentTask = ()=>{
    if (ATON.SemFactory.isBuildingShape()){
        HATHOR.popupAddSemantic(ATON.FE.SEMSHAPE_CONVEX);
        $("#btn-cancel").hide();
    }
};

HATHOR.cancelCurrentTask = ()=>{
    if (ATON.SemFactory.isBuildingShape()){
        ATON.SemFactory.stopCurrentConvex();
    }
    
    $("#btn-cancel").hide();
    HATHOR.resetSelectionMode();
};


// Tools
//=======================================
HATHOR.measure = ()=>{
    let P = ATON.getSceneQueriedPoint();
    let M = ATON.SUI.addMeasurementPoint( P );

    if (M === undefined) return;

    let mid = ATON.Utils.generateID("meas");

    let E = {};
    E.measurements = {};
    E.measurements[mid] = {};
    E.measurements[mid].points = [
        parseFloat(M.A.x.toPrecision(ATON.SceneHub.FLOAT_PREC)),
        parseFloat(M.A.y.toPrecision(ATON.SceneHub.FLOAT_PREC)),
        parseFloat(M.A.z.toPrecision(ATON.SceneHub.FLOAT_PREC)),
        parseFloat(M.B.x.toPrecision(ATON.SceneHub.FLOAT_PREC)),
        parseFloat(M.B.y.toPrecision(ATON.SceneHub.FLOAT_PREC)),
        parseFloat(M.B.z.toPrecision(ATON.SceneHub.FLOAT_PREC))
    ];

    ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_ADD);
    ATON.VRoadcast.fireEvent("AFE_AddSceneEdit", E);
};


// POVs
HATHOR.povNext = ()=>{
    let numpovs = HATHOR._povs.length;
    if (numpovs < 1) return;

    HATHOR._cPOVind = (HATHOR._cPOVind + 1) % numpovs;

    let pov = HATHOR._povs[HATHOR._cPOVind];

    let dur = (ATON.XR._bPresenting)? ATON.XR.STD_TELEP_DURATION : 1.0;
    ATON.Nav.requestPOV(pov, dur);
};
HATHOR.povPrev = ()=>{
    let numpovs = HATHOR._povs.length;
    if (numpovs < 1) return;

    HATHOR._cPOVind = (HATHOR._cPOVind - 1);
    if (HATHOR._cPOVind<0) HATHOR._cPOVind = (numpovs-1);

    let pov = HATHOR._povs[HATHOR._cPOVind];

    let dur = (ATON.XR._bPresenting)? ATON.XR.STD_TELEP_DURATION : 1.0;
    ATON.Nav.requestPOV(pov, dur);
};

HATHOR.uiUpdatePOVs = ()=>{

    HATHOR._povs = [];

    for (let k in ATON.Nav.povlist){
        let pov = ATON.Nav.povlist[k];

        HATHOR._povs.push(pov);
        //console.log(pov);
    }

    //console.log(HATHOR._povs);

    if (HATHOR._povs.length>0){
        HATHOR._cPOVind = 0;
        $("#btn-prev").show();
        $("#btn-next").show();
    }
    else {
        HATHOR._cPOVind = undefined;
        $("#btn-prev").hide();
        $("#btn-next").hide();
    }
};

HATHOR.addLightProbe = ()=>{
    if (!ATON.SUI.mainSelector.visible) return;
    let P = ATON.SUI.mainSelector.position;

    let r = ATON.SUI.getSelectorRadius();

    ATON.addLightProbe( new ATON.LightProbe().setPosition(P).setNear(r) );

    ATON.getRootScene().assignLightProbesByProximity();
    ATON.updateLightProbes();

    ATON.Utils.setVectorPrecision(P,4);

    let E = {};
    E.environment = {};
    E.environment.lightprobes = {};
    E.environment.lightprobes.list = {};

    let idlp = ATON.Utils.generateID("LP");
    E.environment.lightprobes.list[idlp] = {};
    E.environment.lightprobes.list[idlp].pos  = [P.x,P.y,P.z];
    E.environment.lightprobes.list[idlp].near = r;

    //console.log(E);

    ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_ADD);
    ATON.VRoadcast.fireEvent("AFE_AddSceneEdit", E);
};

// Popups
//=======================================
HATHOR._createPopupStdSem = (esemid)=>{
    let htmlcontent = "";
    
    htmlcontent = "<div class='atonPopupTitle'>";
    if (esemid === undefined) htmlcontent += "New Annotation</div>";
    else htmlcontent += "Modify '"+esemid+"'</div>";

    // New ID
    if (esemid === undefined){
        htmlcontent += "ID:<input id='semid' type='text' maxlength='15' size='15' list='semlist' >&nbsp;";

        let gSemXPF = ATON.XPFNetwork.getCurrentSemanticGroup();
        if (gSemXPF === undefined){
            htmlcontent += "child of:";
            htmlcontent += "<div class='select' style='width:100px;'><select id='psemid'>";
            htmlcontent += "<option value='.'>root</option>";
            for (let s in ATON.semnodes) if (s !== ATON.ROOT_NID) htmlcontent += "<option value='"+s+"'>"+s+"</option>";
            htmlcontent += "</select><div class='selectArrow'></div></div>";
        }

        htmlcontent += "<datalist id='semlist'>";
        for (let s in ATON.semnodes){
            if (s !== ATON.ROOT_NID && !s.startsWith(ATON.XPFNetwork.SEMGROUP_PREFIX)) htmlcontent += "<option>"+s+"</option>";
        }
        htmlcontent += "</datalist>";

        htmlcontent += "<br><div id='btnRichContent' class='atonBTN atonBTN-gray' style='width:90%;'><img src='"+ATON.FE.PATH_RES_ICONS+"html.png'>Rich Content</div>";
        htmlcontent += "<div id='idSemDescCont' style='display:none'><textarea id='idSemDescription' style='width:100%;'></textarea></div><br>";
    }
    // modifying existing ID
    else {
        htmlcontent += "<textarea id='idSemDescription' style='width:100%;'></textarea><br>";
    }


    if (ATON.Utils.isConnectionSecure() && !ATON.MediaRec.isAudioRecording()){
        htmlcontent += "<div id='btnVocalNote' class='atonBTN atonBTN-gray' style='width:90%;'><img src='"+ATON.FE.PATH_RES_ICONS+"talk.png'>Vocal Note</div>";
        htmlcontent += "<br><audio id='ctrlVocalNote' style='display:none' controls ></audio>";
    }

    htmlcontent += "<br>";

    if (esemid === undefined) htmlcontent += "<div class='atonBTN atonBTN-green' id='idAnnOK' style='width:90%'>ADD</div>";
    else htmlcontent += "<div class='atonBTN atonBTN-green' id='idAnnOK' style='width:90%'>DONE</div>";

    return htmlcontent;
};

HATHOR.createSemanticTextEditor = (idtextarea)=>{
    let txtarea = document.getElementById(idtextarea);
    //sceditor.create(txtarea, {
    let SCE = $("#"+idtextarea).sceditor({
        id: "idSCEditor",
        //format: 'bbcode',
        //bbcodeTrim: true,
        width: "100%",
        height: "300px", //"100%",
        resizeEnabled: false,
        autoExpand: true,
        emoticonsEnabled: false,
        autoUpdate: true,
        style: 'vendors/sceditor/minified/themes/content/default.min.css',
        toolbar: "bold,italic,underline,link,unlink,font,size,color,removeformat|left,center,right,justify|bulletlist,orderedlist,table,code|image,youtube|source"
    }).sceditor('instance');

    //console.log(SCE);
    return SCE;
};

// Add/Edit/Finalize semantic shape
HATHOR.popupAddSemantic = (semtype, esemid)=>{
    if (ATON._queryDataScene === undefined) return;

    let htmlcontent = HATHOR._createPopupStdSem(esemid);

    if (semtype === undefined) semtype = ATON.FE.SEMSHAPE_SPHERE;

    // Not yet a valid convex shape
    if (semtype === ATON.FE.SEMSHAPE_CONVEX && !ATON.SemFactory.bConvexBuilding) return;

    if ( !ATON.FE.popupShow(htmlcontent, "atonPopupCompact") ) return;

    $("#btnRichContent").click(()=>{
        $("#idSemDescCont").toggle();
    });

    let SCE = HATHOR.createSemanticTextEditor("idSemDescription");

    if (esemid === undefined){
        //$("#semid").focus();
        //$("#semid").val("");
        ATON.FE.uiAttachInputFilterID("semid");

        $("#semid").on("input", ()=>{
            let semid  = $("#semid").val();

            let descr = HATHOR.getHTMLDescriptionFromSemNode(semid);
            if (descr !== undefined){
                //$("#idSemDescription").val(descr);
                //console.log(SCE.getBody());
                //sceditor.instance.val(descr);
                //let C = $("#idPopupContent").find("body[contenteditable='true']");
                //let C = $("body[contenteditable='true']");
                //let C = $("#idSCEditor iframe").first();
                //console.log(C);
                
                //C.html(descr);
                SCE.setWysiwygEditorValue(descr);

                //console.log(descr);
            }
        });
    }
    else {
        let descr = HATHOR.getHTMLDescriptionFromSemNode(esemid);
        if (descr !== undefined){
            SCE.setWysiwygEditorValue(descr);
        }
    }


    let vocnote = undefined;
    let bRecVN  = false;
    ATON.on("AudioRecordCompleted", (au64)=>{
        vocnote = au64;
        console.log(vocnote);

        $('#ctrlVocalNote').attr("src",au64);
    });


    $('#btnVocalNote').click(()=>{
        // We start recording a vocal note
        if (!ATON.MediaRec.isAudioRecording()){
            bRecVN = true;
            $('#btnVocalNote').attr("class","atonBTN atonBTN-rec");
            $('#btnVocalNote').html("<img src='"+ATON.FE.PATH_RES_ICONS+"rec.png'>STOP Recording");
            ATON.MediaRec.startRecording();

        }
        else {
            $('#btnVocalNote').attr("class","atonBTN");
            $('#btnVocalNote').html("<img src='"+ATON.FE.PATH_RES_ICONS+"talk.png'>Vocal Note");
            ATON.MediaRec.stopRecording();
            $('#ctrlVocalNote').show();
            bRecVN  = false;
        }
    });

    //$('#btnRichContent').click(()=>{ $('#idSemDescCont').toggle(); });

    $("#idAnnOK").click(()=>{
        //if (ATON.MediaRec.isAudioRecording()) return;
        if (bRecVN && vocnote===undefined) return;

        $("#semid").blur();
        $("#idSemDescription").blur();

        let semid  = $("#semid").val();
        let psemid = $("#psemid").val();

        let xxtmldescr = JSON.stringify( $("#idSemDescription").val() );
        //console.log(xxtmldescr);

        ATON.FE.popupClose();

        let S = undefined;
        if (esemid === undefined){
            if (semid === undefined || semid.length<2 || semid === ATON.ROOT_NID) return;
            if (semid === psemid) return;

            if (semtype === ATON.FE.SEMSHAPE_SPHERE) S = ATON.SemFactory.createSurfaceSphere(semid);
            if (semtype === ATON.FE.SEMSHAPE_CONVEX) S = ATON.SemFactory.completeConvexShape(semid);
            if (S === undefined) return;

            let gSemXPF = ATON.XPFNetwork.getCurrentSemanticGroup();
            if (gSemXPF){
                gSemXPF.add(S);
            }
            else {
                let parS = ATON.getSemanticNode(psemid);

                if (parS) parS.add(S); 
                else ATON.getRootSemantics().add(S);
            }
        }
        else {
            S = ATON.getSemanticNode(esemid);
            if (S === undefined) return;
        }

        if (xxtmldescr && xxtmldescr.length>2) S.setDescription( xxtmldescr );
        if (vocnote) S.setAudio(vocnote);
        

        let E = {};
        E.semanticgraph = {};
        E.semanticgraph.nodes = {};
        E.semanticgraph.nodes[S.nid] = {};

        if (esemid === undefined){
            if (semtype === ATON.FE.SEMSHAPE_SPHERE) E.semanticgraph.nodes[S.nid].spheres = ATON.SceneHub.getJSONsemanticSpheresList(semid);
            if (semtype === ATON.FE.SEMSHAPE_CONVEX) E.semanticgraph.nodes[S.nid].convexshapes = ATON.SceneHub.getJSONsemanticConvexShapes(semid);
        }
        
        if (S.getDescription()) E.semanticgraph.nodes[S.nid].description = S.getDescription();
        if (S.getAudio()) E.semanticgraph.nodes[S.nid].audio = S.getAudio();

        E.semanticgraph.edges = ATON.SceneHub.getJSONgraphEdges(ATON.NTYPES.SEM); 
        
        ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_ADD);
        ATON.VRoadcast.fireEvent("AFE_AddSceneEdit", E);
    });
};


HATHOR.getHTMLDescriptionFromSemNode = (semid)=>{
    let S = ATON.getSemanticNode(semid);
    if (S === undefined) return undefined;
    
    let descr = S.getDescription();
    if (descr === undefined) return undefined;

    descr = JSON.parse(descr);
    return descr;
};

HATHOR.popupSemDescription = (semid)=>{
    if (semid === undefined) return;

    ATON.FE.playAudioFromSemanticNode(semid);

    let descr = HATHOR.getHTMLDescriptionFromSemNode(semid);
    if (descr === undefined) return;

    let htmlcontent = "<div class='atonPopupTitle'>";
    if (ATON.SceneHub._bEdit) htmlcontent += "<div class='atonBTN' id='btnEditSem' style='display:none;'><img src='"+ATON.FE.PATH_RES_ICONS+"edit.png'></div>";
    htmlcontent += semid+"</div>";

    htmlcontent += "<div class='atonPopupDescriptionContainer'>"+descr+"</div>";

    if ( !ATON.FE.popupShow(htmlcontent, "atonPopupCompact") ) return;

    ATON.FE.checkAuth((r)=>{
        let authUser = r.username;

        if (authUser){
            $("#btnEditSem").show();
            $("#btnEditSem").click(()=>{
                ATON.FE.subPopup( ()=>{ 
                    HATHOR.popupAddSemantic(undefined, semid);
                });
            });
        }
    });
};

HATHOR.popupExportSemShapes = ()=>{
    let htmlcontent = "<div class='atonPopupTitle'>Export</div>";

    htmlcontent += "<label for='semid'>Semantic Node ID:</label><br>";
    htmlcontent += "<div class='select' style='width:250px;'><select id='semid'>";
    htmlcontent += "<option value=''></option>";
    for (let s in ATON.semnodes) if (s !== ATON.ROOT_NID) htmlcontent += "<option value='"+s+"'>"+s+"</option>";
    htmlcontent += "</select><div class='selectArrow'></div></div><br><br>";

    htmlcontent += "<label for='idxformat'>3D format:</label><br>";
    htmlcontent += "<div class='select' style='width:150px;'><select id='idxformat'>";
    htmlcontent += "<option value='.glb'>GLTF (*.glb)</option>";
    htmlcontent += "<option value='.obj'>OBJ</option>";
    htmlcontent += "</select><div class='selectArrow'></div></div>";

    htmlcontent += "<br><br>";
    htmlcontent += "<div class='atonBTN atonBTN-green' id='idExport' style='width:80%'><img src='"+ATON.FE.PATH_RES_ICONS+"download.png'>EXPORT</div>";

    if ( !ATON.FE.popupShow(htmlcontent) ) return;

    $("#idExport").click(()=>{
        let semid = $("#semid").val();
        let ext   = $("#idxformat").val();

        if (semid.length > 0){
            let S = ATON.getSemanticNode(semid);
            if (S){
                for (let s in S.children){
                    ATON.Utils.exportNode(S.children[s], semid + String(s) + ext);
                }
            }
        }


    });
};

// General scene info
HATHOR.popupSceneInfo = ()=>{
    let head = ATON.SceneHub.getTitle();
    if (head === undefined) head = ATON.SceneHub.currID;

    let descr = ATON.SceneHub.getDescription();

    let htmlcontent = "";

    htmlcontent += "<div class='atonPopupTitle'>";
    if (ATON.SceneHub._bEdit) htmlcontent += "<div class='atonBTN' id='btnEditInfo' style='display:none;'><img src='"+ATON.FE.PATH_RES_ICONS+"edit.png'></div>";
    htmlcontent += head+"</div>";

    //htmlcontent += "<div class='atonBTN atonBTN-gray' id='btnEditInfo' style='display:none; float:left'><img src='"+ATON.FE.PATH_RES_ICONS+"edit.png'></div>";
    //htmlcontent += "<div class='atonPopupTitle'>"+head+"</div>";
    if (descr) htmlcontent += "<div class='atonPopupDescriptionContainer'>" + JSON.parse(descr) + "</div>";

    htmlcontent += "<div class='atonBTN atonBTN-green' id='btnOK' style='width:90%'>OK</div>";

    if ( !ATON.FE.popupShow(htmlcontent, "atonPopupCompact") ) return;

    $("#btnOK").click(()=>{
        ATON.FE.popupClose();
    });

    ATON.FE.checkAuth((r)=>{
        let authUser = r.username;

        if (authUser){
            $("#btnEditInfo").show();
            $("#btnEditInfo").click(()=>{
                ATON.FE.subPopup( HATHOR.popupEditSceneInfo );
            });
        }
    });
};

HATHOR.popupCC = ()=>{
    let htmlcontent = "<div class='atonPopupTitle'>Assets Copyright</div>";

    let numCC = ATON.CC.list.length;

    htmlcontent += "<div style='text-align:left;'>";
    htmlcontent += "Assets referenced in this scene contain "+numCC+" copyright information<br>";
    for (let cc in ATON.CC.list){
        let CC = ATON.CC.list[cc];

        htmlcontent += "<div class='atonBlockRound' style='display:block; max-width:400px'>";

        for (let e in CC){
            htmlcontent += "<strong>"+e+"</strong>: "+ ATON.Utils.URLify(CC[e]) + "<br>";
        }

        htmlcontent += "</div>";
    }
    htmlcontent += "</div>";

    if ( !ATON.FE.popupShow(htmlcontent) ) return;
};

HATHOR.popupPOV = ()=>{
    let pov = ATON.Nav.copyCurrentPOV();
    console.log(pov);

    let htmlcontent = "<div class='atonPopupTitle'>Viewpoint</div>";

    htmlcontent += "<div class='atonBlockRound' style='padding:2px; display:block; background-color:rgba(0,255,0, 0.1)'>";
    htmlcontent += "<div style='text-align:right;'>";

    let strCurrEye = pov.pos.x.toPrecision(3)+","+pov.pos.y.toPrecision(3)+","+pov.pos.z.toPrecision(3);
    let strCurrTgt = pov.target.x.toPrecision(3)+","+pov.target.y.toPrecision(3)+","+pov.target.z.toPrecision(3);

    //htmlcontent += "<strong>Position</strong>: "+pov.pos.x.toPrecision(3)+","+pov.pos.y.toPrecision(3)+","+pov.pos.z.toPrecision(3)+"<br>";
    //htmlcontent += "<strong>Target</strong>: "+pov.target.x.toPrecision(3)+","+pov.target.y.toPrecision(3)+","+pov.target.z.toPrecision(3)+"<br>";
    //htmlcontent += "<strong>FoV</strong>: "+pov.fov+"<br>";
    htmlcontent += "<strong>Position</strong>: <input id='idPOVeye' type='text' size='20' placeholder='x,y,z' value='"+strCurrEye+"'><br>";
    htmlcontent += "<strong>Target</strong>: <input id='idPOVtgt' type='text' size='20' placeholder='x,y,z' value='"+strCurrTgt+"'><br>";
    htmlcontent += "<strong>FoV</strong>: <input id='idPOVfov' type='text' size='20' placeholder='f' value='"+pov.fov+"'><br>";

    htmlcontent += "</div>";

    htmlcontent += "<div class='atonBTN atonBTN-green atonBTN-horizontal atonBTN-text' id='btnPOVgo'><img src='"+ATON.FE.PATH_RES_ICONS+"pov.png'>Go</div>";
    htmlcontent += "</div><br>";

    htmlcontent += "<div class='atonBTN atonBTN-gray atonBTN-horizontal atonBTN-text' id='btnPOVsetHome'><img src='"+ATON.FE.PATH_RES_ICONS+"home.png'>Set as Home</div><br>";
    htmlcontent += "<div class='atonBlockRound' style='padding:2px; display:block; background-color:rgba(255,255,2555, 0.1)'>";
    htmlcontent += "<div class='atonBTN atonBTN-gray atonBTN-horizontal atonBTN-text' id='btnPOVadd'><img src='"+ATON.FE.PATH_RES_ICONS+"pov.png'>Add current viewpoint</div>";
    htmlcontent += "as: <input id='idPOVid' type='text' size='15' placeholder='Viewpoint-ID' value='"+ATON.Utils.generateID("pov")+"'></div>";
/*
    htmlcontent += "<img id='idPOVmodeIcon' src='"+ATON.FE.PATH_RES_ICONS+"home.png' class='atonDefIcon'>&nbsp;";
    htmlcontent += "<div class='select' style='width:250px;'><select id='idPOVmode'>";
    htmlcontent += "<option value='h'>Set viewpoint as Home</option>";
    htmlcontent += "<option value='v'>Add viewpoint</option>";
    htmlcontent += "</select><div class='selectArrow'></div></div><br><br>";

    htmlcontent += "<div id='idPOVmodeHome'>";
    htmlcontent += "";
    htmlcontent += "</div>";

    htmlcontent += "<div id='idPOVmodeAdd' style='display:none'>";
    htmlcontent += "<label for='idPOVkword'>keywords (comma-separated)</label><br><input id='idPOVkwords' type='text'>";
    htmlcontent += "</div>";

    htmlcontent += "<div class='atonBTN atonBTN-green' id='btnPOV' style='width:90%'>OK</div>"; // <img src='"+FE.PATH_RES_ICONS+"pov.png'>
*/
    if ( !ATON.FE.popupShow(htmlcontent) ) return;

    let povid = undefined;

    $("#btnPOVgo").click(()=>{
        let eye = $("#idPOVeye").val();
        let tgt = $("#idPOVtgt").val();
        let fov = $("#idPOVfov").val();

        eye = eye.split(",");
        tgt = tgt.split(",");

        if (eye.length !== 3 || tgt.length !== 3) return;
 
        let goPOV = new ATON.POV();
        goPOV.setPosition(
            parseFloat(eye[0]),
            parseFloat(eye[1]),
            parseFloat(eye[2])
        );
        goPOV.setTarget( 
            parseFloat(tgt[0]),
            parseFloat(tgt[1]),
            parseFloat(tgt[2])
        );
        goPOV.setFOV( parseFloat(fov) );

        ATON.Nav.requestPOV( goPOV );
    });

    $("#btnPOVsetHome").click(()=>{
        povid = "home";

        ATON.Nav.setHomePOV( pov );

        ATON.FE.popupClose();

        let E = {};
        E.viewpoints = {};
        E.viewpoints[povid] = {};
        E.viewpoints[povid].position = [pov.pos.x, pov.pos.y, pov.pos.z];
        E.viewpoints[povid].target   = [pov.target.x, pov.target.y, pov.target.z];
        E.viewpoints[povid].fov      = pov.fov;

        ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_ADD);
        ATON.VRoadcast.fireEvent("AFE_AddSceneEdit", E);


    });

    $("#btnPOVadd").click(()=>{
        povid = $("#idPOVid").val().trim(); //ATON.Utils.generateID("pov");
        if (povid.length < 3) return;

        pov.as(povid);

        //console.log(pov)

        ATON.Nav.addPOV(pov);
        HATHOR.uiUpdatePOVs();

        ATON.FE.popupClose();

        let E = {};
        E.viewpoints = {};
        E.viewpoints[povid] = {};
        E.viewpoints[povid].position = [pov.pos.x, pov.pos.y, pov.pos.z];
        E.viewpoints[povid].target   = [pov.target.x, pov.target.y, pov.target.z];
        E.viewpoints[povid].fov      = pov.fov;

        ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_ADD);
        ATON.VRoadcast.fireEvent("AFE_AddSceneEdit", E);
    });

/*
    $("#idPOVmode").on("change",()=>{
        let mode = $("#idPOVmode").val();
        
        if (mode === 'h'){
            $("#idPOVmodeIcon").attr("src",ATON.FE.PATH_RES_ICONS+"home.png");
            $("#idPOVmodeHome").show();
            $("#idPOVmodeAdd").hide();
        }
        else {
            $("#idPOVmodeIcon").attr("src",ATON.FE.PATH_RES_ICONS+"pov.png");
            $("#idPOVmodeHome").hide();
            $("#idPOVmodeAdd").show();
        }
    });

    $("#btnPOV").click(()=>{
        let mode = $("#idPOVmode").val();
        let povid = "home";

        // Home
        if (mode === 'h'){
            ATON.Nav.setHomePOV( pov );
        }
        // New viewpoint
        else {
            povid = ATON.Utils.generateID("pov");
            pov.as(povid);

            let kwords = $("#idPOVkwords").val();
            if (kwords.length>1) pov.addKeywords(kwords);

            ATON.Nav.addPOV(pov);
            HATHOR.uiUpdatePOVs();
        }

        ATON.FE.popupClose();

        let E = {};
        E.viewpoints = {};
        E.viewpoints[povid] = {};
        E.viewpoints[povid].position = [pov.pos.x, pov.pos.y, pov.pos.z];
        E.viewpoints[povid].target   = [pov.target.x, pov.target.y, pov.target.z];
        E.viewpoints[povid].fov      = pov.fov;

        ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_ADD);
        ATON.VRoadcast.fireEvent("AFE_AddSceneEdit", E);

        console.log(pov);
    });
*/
};

HATHOR.popupGraphs = ()=>{
    let htmlcontent= "<div class='atonPopupTitle'>Layers</div>";

    ATON.useGizmo(true);

    htmlcontent += "<div>";
    
    let dBlock = "<div style='display:inline-block; text-align:left; margin:6px; vertical-align:top; min-width:150px;'>";

    // Scene
    htmlcontent += dBlock;
    htmlcontent += "<div style='text-align:center'><b>STANDARD</b></div><br>";
    htmlcontent += ATON.FE.uiCreateGraph(ATON.NTYPES.SCENE);
    //htmlcontent += "<div id='idNewNID' class='atonBTN atonBTN-green atonBTN-horizontal'>NEW</div>";
    htmlcontent += "</div>";

    // Semantics
    if (Object.keys(ATON.semnodes).length > 1){
        htmlcontent += dBlock;
        htmlcontent += "<div style='text-align:center'><b>SEMANTIC</b></div><br>";
        htmlcontent += ATON.FE.uiCreateGraph(ATON.NTYPES.SEM);
        htmlcontent += "</div>";
    }

    // Measurements
    if (ATON.SUI.gMeasures.children.length > 0){
        let chk = ATON.SUI.gMeasures.visible? "checked" : "";
        htmlcontent += dBlock;
        htmlcontent += "<div style='text-align:center'><b>MEASUREMENTS</b></div><br>";
        htmlcontent += "<div class='atonBTN atonBTN-red' style='width:100%' id='btnClearMeas'><img src='"+ATON.FE.PATH_RES_ICONS+"trash.png'>Delete all</div>";
        htmlcontent += "<input type='checkbox' "+chk+" onchange=\"ATON.SUI.gMeasures.toggle(this.checked);\">Show<br>";
        htmlcontent += "</div>";
    }

    if ( !ATON.FE.popupShow(htmlcontent /*,"atonPopupLarge"*/) ) return;

    $("#btnClearMeas").click(()=>{
        ATON.SUI.clearMeasurements();

        let E = {};
        E.measurements = {};
        ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_DEL);
        ATON.VRoadcast.fireEvent("AFE_ClearMeasurements");
    });

    $("#idNewNID").click(()=>{
        ATON.FE.subPopup(()=>{
            ATON.FE.popupNewNode(ATON.NTYPES.SCENE);
        });
    });

};

HATHOR.popupEnvironment = ()=>{
    let htmlcontent = "<div class='atonPopupTitle'>Environment</div>";

    htmlcontent += "<div style='text-align:left'>";

    let bMainLight = ATON.isMainLightEnabled();
    let bShadows = ATON._renderer.shadowMap.enabled;

    htmlcontent += "<div style='text-align:center;'>Exposure (<span id='idExpVal'></span>)<br>";
    htmlcontent += "<input id='idExposure' type='range' min='0.05' max='5.0' step='0.05' >";
    htmlcontent += "</div><br>";

    let str = (bMainLight)? "checked" : "";
    htmlcontent += "<div id='idOptLight' class='atonOptionBlockShort' >";
    htmlcontent += "<input type='checkbox' id='idDirLight' "+str+"><b>Direct light</b><br>";
    htmlcontent += "<img src='"+ATON.FE.PATH_RES_ICONS+"light.png' class='atonDefIcon' style='float:left'>you can enable a main directional light (you can control it by pressing 'l' key)</div>";

    str = (bShadows)? "checked" : "";
    htmlcontent += "<div id='idOptShadows' class='atonOptionBlockShort' >";
    htmlcontent += "<input type='checkbox' id='idShadows' "+str+"><b>Shadows</b><br>";
    htmlcontent += "you can enable real-time shadows (warning, this may impact performances)</div>";

    str = (ATON._bAutoLP)? "checked" : "";
    htmlcontent += "<div id='idOptAutoLP' class='atonOptionBlockShort' >";
    htmlcontent += "<input type='checkbox' id='idAutoLP' "+str+"><b>Auto Light-Probe</b><br>";
    htmlcontent += "<img src='"+ATON.FE.PATH_RES_ICONS+"lp.png' class='atonDefIcon' style='float:left'>this option estimates location and radius of a light-probe</div>";


    // Pano
    if (ATON.FE.getCurrentUIP()==="editor"){
        htmlcontent += "<br><br>";
        htmlcontent += "<div style='text-align:center;'>";
        htmlcontent += "Select panorama from collection or URL: <input id='idPanoURL' type='text' size='30'>";
        htmlcontent += "<div id='idClearPano' class='atonBTN'><img src='"+ATON.FE.PATH_RES_ICONS+"search-clear.png'></div><div id='idSetPano' class='atonBTN atonBTN-green'>Set</div><br>";
        htmlcontent += "<div id='idPanoPreview' style='margin:auto;'></div>"; // width:200px; height:100px
        htmlcontent += "</div><br>";

        htmlcontent += "<div style='text-align:center;'>Panorama rotation (<span id='idEnvRotVal'></span>)<br>";
        htmlcontent += "<input id='idEnvRot' type='range' min='0.0' max='1.0' step='0.02' >";
        htmlcontent += "</div><br>";
    }

    // Advanced FX
    if (ATON.getNumLightProbes()>0){
        htmlcontent += "<br><div id='idUpdLPs' class='atonBTN atonBTN-text atonBTN-green'><img src='"+ATON.FE.PATH_RES_ICONS+"lp.png'>Update all LightProbes</div><br>";
    }

    if (ATON.FX.composer){
        htmlcontent += "<details><summary><b>Advanced Effects</b></summary>";

        str = (ATON.FX.isPassEnabled(ATON.FX.PASS_AO))? "checked" : "";
        htmlcontent += "<div class='atonOptionBlockShort' >";
        htmlcontent += "<input type='checkbox' id='idFXPassSAO' "+str+"><b>Ambient Occlusion</b><br>";
        htmlcontent += "Enable or disable real-time Ambient Occlusion<br><br>";
        htmlcontent += "Intensity (<span id='idFXAOintVal'></span>)<br><input id='idFXAOint' type='range' min='0.1' max='0.5' step='0.05' >";
        htmlcontent += "</div>";

        str = (ATON.FX.isPassEnabled(ATON.FX.PASS_BLOOM))? "checked" : "";
        htmlcontent += "<div class='atonOptionBlockShort' >";
        htmlcontent += "<input type='checkbox' id='idFXPassBloom' "+str+"><b>Bloom</b><br>";
        htmlcontent += "Enable or disable real-time bloom<br><br>";
        htmlcontent += "Strength (<span id='idFXBloomStrengthVal'></span>)<br><input id='idFXBloomStrength' type='range' min='0.1' max='3.0' step='0.01' ><br>";
        htmlcontent += "Threshold (<span id='idFXBloomThresholdVal'></span>)<br><input id='idFXBloomThreshold' type='range' min='0.1' max='1.0' step='0.01' ><br>";
        htmlcontent += "</div>";

        str = (ATON.FX.isPassEnabled(ATON.FX.PASS_DOF))? "checked" : "";
        htmlcontent += "<div class='atonOptionBlockShort' >";
        htmlcontent += "<input type='checkbox' id='idFXPassDOF' "+str+"><b>Depth of Field</b><br>";
        htmlcontent += "Enable or disable real-time DOF<br><br>";
        //htmlcontent += "Focus (<span id='idFXDOFfocusVal'></span>)<br><input id='idFXDOFfocus' type='range' min='0.1' max='50.0' step='0.02' ><br>";
        htmlcontent += "</div>";

        htmlcontent += "</details>";
    }

    htmlcontent += "</div>";

    if ( !ATON.FE.popupShow(htmlcontent) ) return;

    let E = {};
    E.environment = {};

    ATON.FE.uiAttachCollectionItemsToInput("idPanoURL", "panoramas");

    $("#idPanoURL").on("change", ()=>{
        let ppath = $("#idPanoURL").val();
        if (ppath && ppath.length > 0){
            // fetch preview
            if (!ppath.startsWith("http")) ppath = ATON.PATH_COLLECTION + ppath;

            if (ATON.Utils.isVideo(ppath)) $("#idPanoPreview").html("<video src='"+ppath+"' autoplay='true' style='width:90%;height:auto'>");
            else $("#idPanoPreview").html("<img src='"+ppath+"' style='width:90%;height:auto'>");
        }
        else {
            $("#idPanoPreview").html("");
        }
    });

    $("#idClearPano").click(()=>{
        $("#idPanoURL").val("");
        $("#idPanoPreview").html("");
    });

    $("#idSetPano").click(()=>{
        let purl = $("#idPanoURL").val();

        ATON.setMainPanorama(purl);

        E.environment.mainpano = {};
        E.environment.mainpano.url = purl;

        ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_ADD);
        ATON.VRoadcast.fireEvent("AFE_AddSceneEdit", E);
    });

    $("#idUpdLPs").click(()=>{
        ATON.updateLightProbes();
    });

    let ex = ATON.getExposure();
    $("#idExposure").val(ex);
    $("#idExpVal").html(ex);

    let aoi = ATON.FX.getAOintensity();
    $("#idFXAOint").val(aoi);
    $("#idFXAOintVal").html(aoi);

    let blooms = ATON.FX.getBloomStrength();
    $("#idFXBloomStrength").val(blooms);
    $("#idFXBloomStrengthVal").html(blooms);

    let bloomt = ATON.FX.getBloomThreshold();
    $("#idFXBloomThreshold").val(bloomt);
    $("#idFXBloomThresholdVal").html(bloomt);

    if (bMainLight) $("#idOptShadows").show();
    else $("#idOptShadows").hide();

    // FX
    $("#idFXAOint").on("input change",()=>{
        let k = parseFloat( $("#idFXAOint").val() );
        ATON.FX.setAOintensity(k);
        $("#idFXAOintVal").html(k);

        if (!ATON.FX.isPassEnabled(ATON.FX.PASS_AO)) return;

        ATON.SceneHub.sendEdit({
            fx:{ 
                ao:{ 
                    i: k.toPrecision(ATON.SceneHub.FLOAT_PREC)
                }
            }
        }, ATON.SceneHub.MODE_ADD);
    });

    $("#idFXBloomStrength").on("input change",()=>{
        let k = parseFloat( $("#idFXBloomStrength").val() );
        ATON.FX.setBloomStrength(k);
        $("#idFXBloomStrengthVal").html(k);

        if (!ATON.FX.isPassEnabled(ATON.FX.PASS_BLOOM)) return;

        ATON.SceneHub.sendEdit({
            fx:{ 
                bloom:{ 
                    i: k.toPrecision(ATON.SceneHub.FLOAT_PREC)
                }
            }
        }, ATON.SceneHub.MODE_ADD);
    });
    $("#idFXBloomThreshold").on("input change",()=>{
        let k = parseFloat( $("#idFXBloomThreshold").val() );
        ATON.FX.setBloomThreshold(k);
        $("#idFXBloomThresholdVal").html(k);

        if (!ATON.FX.isPassEnabled(ATON.FX.PASS_BLOOM)) return;

        ATON.SceneHub.sendEdit({
            fx:{ 
                bloom:{ 
                    t: k.toPrecision(ATON.SceneHub.FLOAT_PREC)
                }
            }
        }, ATON.SceneHub.MODE_ADD);
    });
    

    $("#idExposure").on("input change",()=>{
        let e = parseFloat( $("#idExposure").val() );
        ATON.setExposure(e);
        $("#idExpVal").html(e);

        E.environment.exposure = e;
        ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_ADD);
        ATON.VRoadcast.fireEvent("AFE_AddSceneEdit", E);
    });

    $("#idDirLight").on("change",()=>{
        let b = $("#idDirLight").is(':checked');
        if (b){
            let ld = ATON.getMainLightDirection();
            if (ld === undefined) ld = new THREE.Vector3(0,-1.0,1.0);
            ATON.setMainLightDirection( ld );
            
            //ATON.updateDirShadows();
            $("#idOptShadows").show();

            E.environment.mainlight = {};
            E.environment.mainlight.direction = [ld.x,ld.y,ld.z];
            ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_ADD);
            ATON.VRoadcast.fireEvent("AFE_AddSceneEdit", E);
        }
        else {
            $("#idOptShadows").hide();

            //ATON.SceneHub.sendEdit( { environment:{ mainlight:{} } }, ATON.SceneHub.MODE_ADD);
            //ATON.VRoadcast.fireEvent("AFE_AddSceneEdit", E);
            E.environment.mainlight = {};
            ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_DEL);
            ATON.VRoadcast.fireEvent("AFE_LightSwitch", false);
        }

        //console.log(E);

        ATON.toggleMainLight(b);
    });

    $("#idShadows").on("change",()=>{
        let b = $("#idShadows").is(':checked');
        ATON.toggleShadows(b);
        //if (b) ATON.updateDirShadows();

        let ld = ATON.getMainLightDirection();

        if (!ATON.isMainLightEnabled()) return;

        E.environment.mainlight = {};
        E.environment.mainlight.shadows = b;
        //if (ld) E.environment.mainlight.direction = [ld.x,ld.y,ld.z];
        ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_ADD);
        ATON.VRoadcast.fireEvent("AFE_AddSceneEdit", E);

        ATON.updateLightProbes();
    });

    $("#idEnvRot").on("input change",()=>{
        let r = parseFloat( $("#idEnvRot").val() * Math.PI * 2.0 ).toPrecision(4);
        ATON.setMainPanoramaRotation(r);
        $("#idEnvRotVal").html(r);

        E.environment.mainpano = {};
        E.environment.mainpano.rotation = r;
        ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_ADD);
        ATON.VRoadcast.fireEvent("AFE_AddSceneEdit", E);
    });

    $("#idAutoLP").on("change",()=>{
        let b = $("#idAutoLP").is(':checked');
        ATON.setAutoLP(b);
        
        if (b) ATON.updateLightProbes();
        //else TODO:

        E.environment.lightprobes = {};
        E.environment.lightprobes.auto = b;
        ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_ADD);
        ATON.VRoadcast.fireEvent("AFE_AddSceneEdit", E);
    });

    $("#idFXPassSAO").on("change",()=>{
        let b = $("#idFXPassSAO").is(':checked');

        ATON.FX.togglePass(ATON.FX.PASS_AO, b);

        if (b){
            ATON.SceneHub.sendEdit({
                fx:{ 
                    ao:{ 
                        i: ATON.FX.getAOintensity().toPrecision(ATON.SceneHub.FLOAT_PREC)
                    }
                }
            }, ATON.SceneHub.MODE_ADD);
        }
        else ATON.SceneHub.sendEdit({ fx:{ ao:{} } }, ATON.SceneHub.MODE_DEL);
    });

    $("#idFXPassBloom").on("change",()=>{
        let b = $("#idFXPassBloom").is(':checked');

        if (b){
            ATON.SceneHub.sendEdit({
                fx:{ 
                    bloom:{ 
                        i: ATON.FX.getBloomStrength().toPrecision(ATON.SceneHub.FLOAT_PREC),
                        t: ATON.FX.getBloomThreshold().toPrecision(ATON.SceneHub.FLOAT_PREC)
                    }
                }
            }, ATON.SceneHub.MODE_ADD);
        }
        else ATON.SceneHub.sendEdit({ fx:{ bloom:{} } }, ATON.SceneHub.MODE_DEL);

        ATON.FX.togglePass(ATON.FX.PASS_BLOOM, b);
    });

    $("#idFXPassDOF").on("change",()=>{
        let b = $("#idFXPassDOF").is(':checked');

        if (b){
            ATON.SceneHub.sendEdit({
                fx:{ 
                    dof:{
                        f: ATON.FX.getDOFfocus().toPrecision(ATON.SceneHub.FLOAT_PREC)
                    }
                }
            }, ATON.SceneHub.MODE_ADD);
        }
        else ATON.SceneHub.sendEdit({ fx:{ dof:{} } }, ATON.SceneHub.MODE_DEL);

        ATON.FX.togglePass(ATON.FX.PASS_DOF, b);
    });
    
};

HATHOR.popupShare = ()=>{
    let htmlcontent = "<div class='atonPopupTitle'>Share</div>";
    htmlcontent += "<div class='atonQRcontainer' id='idQRcode'></div><br><br>";

    htmlcontent += "<details><summary><b>Embed this Scene</b></summary>";
    htmlcontent += "Copy and paste this HTML code in your blog or website to embed an interactive 3D component for this scene<br><br>";
    htmlcontent += "<input id='idEmbStaticCover' type='checkbox'>Use static cover<br>";
    htmlcontent += "<textarea id='idEmbed' style='width:90%; height:100px; resize:none;' readonly ></textarea><br>";
    //htmlcontent += "<div id='idEmbed' class='atonCode'></div>";

    htmlcontent += "<div class='atonBTN atonBTN-green' style='width:90%' id='btnEmbedCopy'>Copy</div>";
    htmlcontent += "</details>";

    if ( !ATON.FE.popupShow(htmlcontent) ) return;

    let url = window.location.href;
    new QRCode(document.getElementById("idQRcode"), url);

    let iframecode = "<iframe style='height:500px; margin:0;' src='"+window.location.href+"' width='100%' height='500px' frameborder='0' allow='autoplay; fullscreen; xr-spatial-tracking' xr-spatial-tracking execution-while-out-of-viewport execution-while-not-rendered web-share allowfullscreen mozallowfullscreen='true' webkitallowfullscreen='true'></iframe>";
    let istaticcode = "<a href='"+window.location.href+"'><img src='"+ATON.PATH_SCENES+ATON.SceneHub.currID+"/cover.png'></a>";

    $('#idEmbed').val(iframecode);
    //$('#idEmbed').text(iframecode);

    $("#btnEmbedCopy").click(()=>{
        let copyText = document.getElementById("idEmbed");
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        document.execCommand("copy");

        ATON.FE.popupClose();
    });

    $("#idEmbStaticCover").on("change", ()=>{
        let b = $("#idEmbStaticCover").is(':checked');

        if (b) $('#idEmbed').val(istaticcode);
        else $('#idEmbed').val(iframecode);
    });
};


HATHOR.popupScene = ()=>{
    if (ATON.SceneHub.currID === undefined) return;

    let title = (ATON.SceneHub.getTitle())? ATON.SceneHub.getTitle() : ATON.SceneHub.currID;

    let htmlcontent = "<div class='atonPopupTitle'>"+title+"</div>";
    if (ATON.SceneHub.getTitle()) htmlcontent += ATON.SceneHub.currID+"<br>";

    // Keywords
    if (ATON.SceneHub.currData){
        let kwds = ATON.SceneHub.currData.kwords;
        if (kwds){
            htmlcontent += "<div>";
            for (let k in kwds) htmlcontent += "<a class='atonKeyword atonKeywordActivable' href='/?q="+k+"'>"+k+"</a>";
            htmlcontent += "</div><br>";
        }
    }
    
    //htmlcontent += "<div class='atonQRcontainer' style='display:inline-block; max-width:200px; margin:6px; vertical-align:top;' id='idQRcode'></div>"; // <br><br>

    htmlcontent += "<div id='btnCover' class='atonCover' style='margin:5px'>";
    htmlcontent += "<img src='"+ATON.PATH_RESTAPI+"cover/"+ATON.SceneHub.currID+"' style='width:200px; height:auto'></div>";

    //htmlcontent += "<div class='atonBTN' id='idPopQR'><img src='"+ATON.FE.PATH_RES_ICONS+"qr.png'>&nbsp;Share</div><br>";

    ATON.FE.checkAuth((r)=>{
        let authUser   = r.username;
        let bYourScene = ATON.SceneHub.currID.startsWith(authUser);

        htmlcontent += "<div style='display:inline-block; text-align:left; margin:6px; vertical-align:top; max-width:300px; text-align:center'>";

        // Authenticated
        if (authUser && bYourScene){
/*
            if (ATON.SceneHub._bEdit) htmlcontent += "<div class='atonBTN switchedON' style='width:80%' id='btnSchanges'><img src='"+ATON.FE.PATH_RES_ICONS+"scene.png'>Persistent changes</div>";
            else htmlcontent += "<div class='atonBTN' style='width:250px' id='btnSchanges'><img src='"+ATON.FE.PATH_RES_ICONS+"scene.png'>Temporary changes</div>";

            htmlcontent += "<br><br>";
*/
/*
            let pe = (ATON.SceneHub._bEdit)? "checked" : "";
            htmlcontent += "<input type='checkbox' id='idSchanges' "+pe+">Persistent scene changes<br>";
*/
            //htmlcontent += "<div class='atonBTN atonBTN-red' onclick='ATON.SUI.clearMeasurements'><img src='"+ATON.FE.PATH_RES_ICONS+"trash.png'>Clear measurements</div>";

            ///htmlcontent += "<div class='atonBTN atonBTN-green' id='btnSetCover'><img src='"+ATON.FE.PATH_RES_ICONS+"sshot.png'>Set Cover</div>";
            //htmlcontent += "<div class='atonBTN atonBTN-green' id='idPopSShot'><img src='"+ATON.FE.PATH_RES_ICONS+"sshot.png'>Screenshot / Cover</div>";

            htmlcontent += "<div class='atonBTN atonBTN-gray atonBTN-horizontal atonBTN-text' id='btnInfo'><img src='"+ATON.FE.PATH_RES_ICONS+"edit.png'>Edit info</div>";

            //htmlcontent += "<br>";
        }

        // Common scene options
        htmlcontent += "<div class='atonBTN atonBTN-gray atonBTN-horizontal atonBTN-text' id='btnPopGraphs'><img src='"+ATON.FE.PATH_RES_ICONS+"list.png'>Layers</div>";
        htmlcontent += "<div class='atonBTN atonBTN-gray atonBTN-horizontal atonBTN-text' id='btnPopEnv'><img src='"+ATON.FE.PATH_RES_ICONS+"light.png'>Environment</div>";
        //htmlcontent += "<div class='atonBTN atonBTN-gray' style='width:120px' id='btnPopEmbed'><img src='"+ATON.FE.PATH_RES_ICONS+"embed.png'>Embed</div>";
        htmlcontent += "<div class='atonBTN atonBTN-gray atonBTN-horizontal atonBTN-text' id='btnSShot'><img src='"+ATON.FE.PATH_RES_ICONS+"sshot.png'>Screenshot</div>";

        if (ATON.FE.getCurrentUIP()==="editor"){
            htmlcontent += "<div class='atonBTN atonBTN-gray atonBTN-horizontal atonBTN-text' id='btnPopPOV'><img src='"+ATON.FE.PATH_RES_ICONS+"pov.png'>Viewpoint</div>";
        }

        htmlcontent += "</div>";

        // Only for auth users
        if (authUser /*&& ATON.FE.getCurrentUIP()==="editor"*/){
            htmlcontent += "<br><br>";
            htmlcontent += "<div class='atonBTN atonBTN-orange atonBTN-horizontal atonBTN-text' id='idSHUclone'><img src='"+ATON.FE.PATH_RES_ICONS+"clone.png'>Clone this Scene</div>";

            // Not my scene
            if (!bYourScene){
                //
            }
            // My scene
            else {
                htmlcontent += "<div class='atonBTN atonBTN-gray atonBTN-text' id='idSHUscene'><img src='"+ATON.FE.PATH_RES_ICONS+"scene.png'>Manage this Scene</div>";
                htmlcontent += "<div class='atonBTN atonBTN-gray atonBTN-text' id='idSHUscenes'><img src='"+ATON.FE.PATH_RES_ICONS+"scene.png'>Manage my Scenes</div>";
                htmlcontent += "<br><div class='atonBTN atonBTN-red atonBTN-horizontal atonBTN-text' id='idDelScene'><img src='"+ATON.FE.PATH_RES_ICONS+"trash.png'>Delete this scene</div>";
            }
        }

        if ( !ATON.FE.popupShow(htmlcontent /*,"atonPopupLarge"*/) ) return;

        if (ATON.SceneHub._bEdit) $('#btnInfo').show();
        else $('#btnInfo').hide();
/*
        // Build QR
        let url = window.location.href;
        new QRCode(document.getElementById("idQRcode"), url);
*/
/*
        $('#btnSchanges').click(()=>{
            ATON.SceneHub._bEdit = !ATON.SceneHub._bEdit;

            if (ATON.SceneHub._bEdit){
                $('#btnInfo').show();
                $('#btnSchanges').html("<img src='"+ATON.FE.PATH_RES_ICONS+"scene.png'>Persistent changes");
                $('#btnSchanges').attr("class","atonBTN switchedON");
                ATON.FE.uiSwitchButton("scene",true);
                console.log("Scene edits are now persistent");
            }
            else {
                $('#btnInfo').hide();
                $('#btnSchanges').html("<img src='"+ATON.FE.PATH_RES_ICONS+"scene.png'>Temporary changes");
                $('#btnSchanges').attr("class","atonBTN");
                ATON.FE.uiSwitchButton("scene",false);
                console.log("Scene edits are now temporary"); 
            }
        });
*/
/*
        if (ATON.SceneHub._bEdit) $('#idEditMode').val('1');
        else $('#idEditMode').val('0');

        $("#idEditMode").on("change",()=>{
            let emode = $("#idEditMode").val();
            
            if (emode === '0'){
                ATON.SceneHub._bEdit = false;
                ATON.FE.uiSwitchButton("scene",false);
                console.log("Scene edits are now temporary");
            }
            else {
                ATON.SceneHub._bEdit = true;
                ATON.FE.uiSwitchButton("scene",true);
                console.log("Scene edits are now persistent");
            }

            ATON.FE.popupClose();
        });
*/

        $("#btnPopPOV").click(()=>{
            ATON.FE.subPopup( HATHOR.popupPOV );
        });

        $("#btnPopEnv").click(()=>{
            ATON.FE.subPopup( HATHOR.popupEnvironment );
        });

        $("#btnPopGraphs").click(()=>{
            ATON.FE.subPopup( HATHOR.popupGraphs );
        });

        $("#btnInfo").click(()=>{
            ATON.FE.subPopup( HATHOR.popupEditSceneInfo );
        });

        $("#btnSShot").click(()=>{
            ATON.FE.subPopup( ATON.FE.popupScreenShot );
        });
        $("#btnCover").click(()=>{
            ATON.FE.subPopup( ATON.FE.popupScreenShot );
        });

/*
        $("#idPopQR").click(()=>{

        });
*/
        $("#idSHUscene").click(()=>{
            if (ATON.SceneHub.currID === undefined) return;
            window.open("/shu/scenes/?s="+ATON.SceneHub.currID, "_self");
        });

        $("#idSHUscenes").click(()=>{
            if (ATON.SceneHub.currID === undefined) return;
            window.open("/shu/scenes/", "_self");
        });

        $("#idSHUclone").click(()=>{
            ATON.Utils.postJSON(ATON.PATH_RESTAPI+"clone/scene", {sid: ATON.SceneHub.currID}, (newsid)=>{
                if (newsid) window.location.href = "/s/"+newsid;
            });
        });

        $("#idDelScene").click(()=>{
            ATON.FE.subPopup( HATHOR.popupSceneDelete );
        });
    });
};

HATHOR.popupEditSceneInfo = ()=>{
    let htmlcontent = "<div class='atonPopupTitle'>Scene information</div>";
    
    htmlcontent += "Title: <input id='idSceneTitle' type='text' maxlength='30' size='30' ><br>";
    htmlcontent += "<textarea id='idSummaryEditor' style='width:100%'></textarea><br>";
    //htmlcontent += "Keywords (comma separated):<br><input id='idSceneKWords' type='text' maxlength='100' style='width:90%' ><br>";

    htmlcontent += "<div id='idSceneKWords'></div>";

    htmlcontent += "<div class='atonBTN atonBTN-green' id='idSceneSummaryOK' style='width:80%'>DONE</div>";

    if ( !ATON.FE.popupShow(htmlcontent, "atonPopupLarge") ) return;
    
    let SCE = HATHOR.createSemanticTextEditor("idSummaryEditor");

    let D = ATON.SceneHub.getDescription();
    if (D) SCE.setWysiwygEditorValue(JSON.parse(D));

    let T = ATON.SceneHub.getTitle();
    if (T) $("#idSceneTitle").val(T);

    let kwlist = [];
    if (ATON.SceneHub.currData && ATON.SceneHub.currData.kwords){
        for (let kw in ATON.SceneHub.currData.kwords) kwlist.push(kw);
    }

    ATON.FE.uiAddKeywordsArea("idSceneKWords", kwlist, 
    (kw)=>{ // on add keyword
        let E = {};
        E.kwords = {};
        E.kwords[kw] = 1;

        ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_ADD);
    },
    (kw)=>{ // on remove keyword
        let E = {};
        E.kwords = {};
        E.kwords[kw] = 1;

        ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_DEL);

    });

    $('#idSceneSummaryOK').click(()=>{
        let xxtmldescr = JSON.stringify( $("#idSummaryEditor").val() );
        let title = $("#idSceneTitle").val();
        
/*
        let kwords = $("#idSceneKWords").val().trim();
        if (kwords.length>2){
            kwords = kwords.toLowerCase();
            kwords = kwords.split(",");
        }
*/
        ATON.FE.popupClose();

        let E = {};

/*
        if (kwords && kwords.length>0){
            E.kwords = {};
            for (let k in kwords) E.kwords[ kwords[k] ] = 1;
        }
*/
        if (xxtmldescr && xxtmldescr.length>2){
            ATON.SceneHub.setDescription( xxtmldescr );
            E.description = xxtmldescr;
            $("#btn-info").show();
        }
        if (title && title.length>0){
            ATON.SceneHub.setTitle( title );
            E.title = title;
        }

        if (E.title || E.description){
            //console.log(E);
            ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_ADD);
            ATON.VRoadcast.fireEvent("AFE_AddSceneEdit", E);
        }
    });
};


HATHOR.popupHelp = ()=>{
    let htmlcontent = "<div class='atonPopupTitle'>Hathor <img src='"+ATON.FE.PATH_RES_ICONS+"hathor.png' class='atonDefIcon'> help</div>";
    
    htmlcontent += "<i>Hathor</i> is the official ATON front-end. <div id='idSettings' class='atonBTN atonBTN-text'><img src='"+ATON.FE.PATH_RES_ICONS+"settings.png'>Settings</div><br>";

    htmlcontent += "<div style='text-align:left;'>";

    // Toolbar
    //let sp = "<br>";
    let iblock = "<div style='width:200px; display:inline-block; margin:5px; vertical-align:top;'>";
    htmlcontent += "<h3>Icons</h3>";
    htmlcontent += iblock+"<img src='"+ATON.FE.PATH_RES_ICONS+"home.png' class='atonDefIcon'> Home viewpoint</div>";
    htmlcontent += iblock+"<img src='"+ATON.FE.PATH_RES_ICONS+"user.png' class='atonDefIcon'> User authentication</div>";
    htmlcontent += iblock+"<img src='"+ATON.FE.PATH_RES_ICONS+"nav.png' class='atonDefIcon'> Navigation</div>";
    htmlcontent += iblock+"<img src='"+ATON.FE.PATH_RES_ICONS+"prev.png' class='atonDefIcon'><img src='"+ATON.FE.PATH_RES_ICONS+"next.png' class='atonDefIcon'> Previous/Next viewpoint</div>";
    htmlcontent += iblock+"<img src='"+ATON.FE.PATH_RES_ICONS+"scene.png' class='atonDefIcon'> Current scene</div>";
    htmlcontent += iblock+"<img src='"+ATON.FE.PATH_RES_ICONS+"fullscreen.png' class='atonDefIcon'> Fullscreen mode</div>";
    htmlcontent += iblock+"<img src='"+ATON.FE.PATH_RES_ICONS+"info.png' class='atonDefIcon'> Scene information</div>";

    if (ATON.Utils.isConnectionSecure()){
        htmlcontent += iblock+"<img src='"+ATON.FE.PATH_RES_ICONS+"vr.png' class='atonDefIcon'> Immersive VR mode</div>";

        if (ATON.Utils.isMobile()){
            htmlcontent += iblock+"<img src='"+ATON.FE.PATH_RES_ICONS+"devori.png' class='atonDefIcon'> Device orientation mode</div>";
        }
    }

    htmlcontent +="<br><br>";

    let blblock = "<div style='width:300px; display:inline-block; margin:5px; vertical-align:top;'>";

    htmlcontent += blblock+"<h3>Navigation</h3>";
    htmlcontent += "<ul>";
    if (ATON.Utils.isMobile()){
        htmlcontent += "<li><b>Pinch</b>: dolly / zoom</li>";
        htmlcontent += "<li><b>Double-tap</b>: retarget on surface (orbit); locomotion (first-person navigation modes)</li>";
    }
    else {
        htmlcontent += "<li><b>Double-click</b>: retarget on surface (orbit); locomotion (first-person navigation modes)</li>";
        htmlcontent += "<li><span class='atonKey'>'CTRL' + mouse wheel</span>: increase/decrease field-of-view</li>";
        htmlcontent += "<li><span class='atonKey'>'v'</span>: viewpoint</li>";
        htmlcontent += "<li><span class='atonKey'>'n'</span>: navigation modes</li>";
    }
    htmlcontent += "</ul></div>";

    // 3D selector
    htmlcontent += blblock+"<h3>3D Selector</h3>";
    htmlcontent += "<ul>";
    if (ATON.Utils.isMobile()){
        htmlcontent += "<li><b>Tap</b>: move location of 3D selector</li>";
    }
    else {
        htmlcontent += "<li><span class='atonKey'>'SHIFT' + mouse wheel</span>: increase/decrease radius of selector</li>";
        htmlcontent += "<li><span class='atonKey'>'space'</span>: selector options</li>";
    }
    htmlcontent += "</ul></div>";

    // Annotation
    htmlcontent += blblock+"<h3>Annotation</h3>";
    htmlcontent += "<ul>";
    if (ATON.Utils.isMobile()){
        htmlcontent += "<li><b>Double-tap on annotation</b>: open associated content</li>";
    }
    else {
        htmlcontent += "<li><span class='atonKey'>'a'</span>: add basic annotation (sphere)</li>";
        htmlcontent += "<li><span class='atonKey'>'s'</span>: initiate convex shape annotation (add surface point)</li>";
        htmlcontent += "<li><span class='atonKey'>'ENTER'</span>: finalize convex shape annotation</li>";
        htmlcontent += "<li><span class='atonKey'>'ESC'</span>: cancel/stop current convex shape annotation</li>";
        htmlcontent += "<li><span class='atonKey'>'e'</span>: edit hovered annotation</li>";
        htmlcontent += "<li><span class='atonKey'>'CANC'</span>: delete hovered annotation</li>";
        htmlcontent += "<li><span class='atonKey'>'x'</span>: export (download) semantic shapes</li>";
        htmlcontent += "<li><span class='atonKey'>'m'</span>: add measurement point</li>";
    }
    htmlcontent += "</ul></div>";

    // Other
    if (ATON.Utils.isMobile()){

    }
    else {
        htmlcontent += blblock+"<h3>Other</h3>";
        htmlcontent += "<ul>";
        htmlcontent += "<li><span class='atonKey'>'c'</span>: screenshot/capture</li>";
        htmlcontent += "</ul></div>";
    }



    htmlcontent += "</div>";

    if ( !ATON.FE.popupShow(htmlcontent,"atonPopupLarge") ) return;

    $("#idSettings").click(()=>{
        ATON.FE.subPopup( HATHOR.popupSettings );
    });
};

HATHOR.popupSceneDelete = ()=>{
    let htmlcontent = "<div class='atonPopupTitle'>DELETE this scene?</div>";

    htmlcontent += "<div class='atonBTN atonBTN-red' id='btnDELyes'>YES</div>";
    htmlcontent += "<div class='atonBTN atonBTN-green' id='btnDELno'>NO</div>";

    if ( !ATON.FE.popupShow(htmlcontent) ) return;

    $('#btnDELyes').click(()=>{
        let sid = ATON.SceneHub.currID;
        if (sid === undefined) return;

        ATON.Utils.postJSON(ATON.PATH_RESTAPI+"del/scene", {sid: sid}, (b)=>{
            if (b) window.open("/shu/scenes/", "_self");
        });
    });

    $('#btnDELno').click(()=>{
        ATON.FE.popupClose();
    });
};

HATHOR.popupNav = ()=>{
    let htmlcontent = "<div class='atonPopupTitle'>Navigation</div>";

    //htmlcontent += "<div id='idNavModes'></div>";

    htmlcontent += "<div style='display:block; width:90%; min-height:50px; vertical-align:top'>";
    htmlcontent +="<div style='display:inline-block; width:60px; float:left' id='idNMfp'></div>";
    htmlcontent +="<div style='text-align:left'>Switch between first-person and orbit navigation mode</div>";
    htmlcontent += "</div>";

    if (ATON.Utils.isConnectionSecure()){
/*
        htmlcontent += "<div style='display:block; width:90%; min-height:50px; vertical-align:top'>";
        htmlcontent +="<div style='display:inline-block; width:60px; float:left' id='idNMvr'></div>";
        htmlcontent +="<div style='text-align:left'>Immersive VR mode</div>";
        htmlcontent += "</div>";
*/
        if (ATON.Utils.isMobile()){
            htmlcontent += "<div style='display:block; width:90%; min-height:50px; vertical-align:top'>";
            htmlcontent +="<div style='display:inline-block; width:60px; float:left' id='idNMdevori'></div>";
            htmlcontent +="<div style='text-align:left'>Enable or disable device-orientation mode</div>";
            htmlcontent += "</div>";
        }
    }

    if (ATON.SceneHub._bEdit) htmlcontent += "<div class='atonBTN' id='btnDefNavMode' style='width:90%'>Set current navigation mode as default</div>";

    if ( !ATON.FE.popupShow(htmlcontent) ) return;

    ATON.FE.uiAddButtonFirstPerson("idNMfp");
    ATON.FE.uiAddButtonDeviceOrientation("idNMdevori");
    //ATON.FE.uiAddButtonVR("idNMvr");

    $('#btnDefNavMode').click(()=>{
        let E = {};
        E.navmode = ATON.Nav._mode;
        ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_ADD);

        ATON.FE.popupClose();
    });
};

HATHOR.popupEmbed = ()=>{
    let htmlcontent = "<div class='atonPopupTitle' style='min-width:300px'>Embed</div>";

    htmlcontent += "Copy and paste this HTML code in your blog or website to embed an interactive 3D component for this scene<br><br>";
    htmlcontent += "<input id='idEmbStaticCover' type='checkbox'>Use static cover<br>";
    htmlcontent += "<textarea id='idEmbed' style='width:90%; height:100px; resize:none;' readonly ></textarea><br>";
    //htmlcontent += "<div id='idEmbed' class='atonCode'></div>";

    htmlcontent += "<div class='atonBTN atonBTN-green' style='width:90%' id='btnEmbedCopy'>Copy</div>";

    if ( !ATON.FE.popupShow(htmlcontent) ) return;

    let iframecode = "<iframe style='height:500px; margin:0;' src='"+window.location.href+"' width='100%' height='500px' frameborder='0' allowfullscreen='1'></iframe>";
    let istaticcode = "<a href='"+window.location.href+"'><img src='"+ATON.PATH_SCENES+ATON.SceneHub.currID+"/cover.png'></a>";

    $('#idEmbed').val(iframecode);
    //$('#idEmbed').text(iframecode);

    $("#btnEmbedCopy").click(()=>{
        let copyText = document.getElementById("idEmbed");
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        document.execCommand("copy");

        ATON.FE.popupClose();
    });

    $("#idEmbStaticCover").on("change", ()=>{
        let b = $("#idEmbStaticCover").is(':checked');

        if (b) $('#idEmbed').val(istaticcode);
        else $('#idEmbed').val(iframecode);
    });
};

HATHOR.popupSettings = ()=>{
    const divBlock = "<div style='display:inline-block; min-width:300px; max-width:800px; min-height:50px; vertical-align:top; padding:10px;'>"; // white-space: nowrap;

    let htmlcontent = "<div class='atonPopupTitle'>Hathor Settings</div>";

    let rad = ATON.SUI.getSelectorRadius();
    let hr  = ATON.Utils.getHumanReadableDistance( rad );

    ATON.FE.computeSelectorRanges();

    // Selector
    htmlcontent += divBlock;
    htmlcontent += "<div class='atonBlockSubTitle'><img class='atonDefIcon' src='"+ATON.FE.PATH_RES_ICONS+"selector.png'>3D Selector</div><br>";
    htmlcontent += "Radius (<span id='idSelRadTxt'>"+hr+"</span>):<br>";
    //htmlcontent += ATON.Utils.getHumanReadableDistance(ATON.FE._selRanges[0])+"&nbsp;";
    htmlcontent += "<input id='idSelRad' type='range' min='"+ATON.FE._selRanges[0]+"' max='"+ATON.FE._selRanges[1]+"' step='"+ATON.FE._selRanges[0]+"'>";
    //htmlcontent += "&nbsp;"+ATON.Utils.getHumanReadableDistance(ATON.FE._selRanges[1]);

    htmlcontent += "Offset X: <span id='idSeldxTxt'>"+ATON.SUI._selOffset.x.toPrecision(3)+"</span><br>";
    htmlcontent += "<input id='idSeldx' type='range' min='"+(-ATON.FE._selRanges[1])+"' max='"+ATON.FE._selRanges[1]+"' step='"+ATON.FE._selRanges[0]+"'>";

    htmlcontent += "Offset Y: <span id='idSeldyTxt'>"+ATON.SUI._selOffset.y.toPrecision(3)+"</span><br>";
    htmlcontent += "<input id='idSeldy' type='range' min='"+(-ATON.FE._selRanges[1])+"' max='"+ATON.FE._selRanges[1]+"' step='"+ATON.FE._selRanges[0]+"'>";

    htmlcontent += "Offset Z: <span id='idSeldzTxt'>"+ATON.SUI._selOffset.z.toPrecision(3)+"</span><br>";
    htmlcontent += "<input id='idSeldz' type='range' min='"+(-ATON.FE._selRanges[1])+"' max='"+ATON.FE._selRanges[1]+"' step='"+ATON.FE._selRanges[0]+"'>";

    htmlcontent += "<div id='idSelOffReset' class='atonBTN atonBTN-text atonBTN-yellow atonBTN-horizontal'>Reset offsets</div>";
    htmlcontent += "</div>";

    // Multires
    if (ATON.MRes._tsets.length > 0){
        htmlcontent += divBlock;
        htmlcontent += "<div class='atonBlockSubTitle'><img class='atonDefIcon' src='"+ATON.FE.PATH_RES_ICONS+"multires.png'>Multiresolution</div><br>";
        htmlcontent += "Error target (<span id='idTSerrTxt'>"+ATON.MRes._tsET+"</span>):<br>";
        htmlcontent += "More detail&nbsp;<input id='idTSerr' style='width:40%' type='range' min='1.0' max='25.0' step='0.5'>&nbsp;Less detail";
        htmlcontent += "</div>";
    }

    if ( !ATON.FE.popupShow(htmlcontent, "atonPopupLarge") ) return;

    $("#idSelRad").val(rad);
    $("#idTSerr").val(ATON.MRes._tsET);

    $("#idSelRad").on("input change",()=>{
        let r = parseFloat( $("#idSelRad").val() );

        ATON.SUI.setSelectorRadius(r);
        $("#idSelRadTxt").html( ATON.Utils.getHumanReadableDistance(r) );
    });

    $("#idSeldx").on("input change", ()=>{
        let v = parseFloat( $("#idSeldx").val() );
        ATON.SUI.setSelectorOffset(v, undefined, undefined);
        $("#idSeldxTxt").html(v.toPrecision(3));
    });

    $("#idSeldy").on("input change", ()=>{
        let v = parseFloat( $("#idSeldy").val() );
        ATON.SUI.setSelectorOffset(undefined, v, undefined);
        $("#idSeldyTxt").html(v.toPrecision(3));
    });

    $("#idSeldz").on("input change", ()=>{
        let v = parseFloat( $("#idSeldz").val() );
        ATON.SUI.setSelectorOffset(undefined, undefined, v);
        $("#idSeldzTxt").html(v.toPrecision(3));
    });

    $("#idTSerr").on("input change",()=>{
        let e = parseFloat( $("#idTSerr").val() );

        if (e <= 0.0) return;

        ATON.MRes.setTSetsErrorTarget(e);
        $("#idTSerrTxt").html( ATON.MRes._tsET );
    });

    $("#idSelOffReset").click(()=>{
        ATON.SUI.setSelectorOffset(0.0,0.0,0.0);
        $("#idSeldxTxt").val(0.0);
        $("#idSeldyTxt").val(0.0);
        $("#idSeldzTxt").val(0.0);
        $("#idSeldxTxt").html("0");
        $("#idSeldyTxt").html("0");
        $("#idSeldzTxt").html("0");
    });
}