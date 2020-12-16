/*===========================================================================
    ATON official front-end ("Hathor")

    Author: B. Fanini

===========================================================================*/

/**
Hathor front-end (official ATON front-end)
@namespace HATHOR
*/
let HATHOR = {};
window.HATHOR = HATHOR;


HATHOR.SELACTION_STD = 0;
HATHOR.SELACTION_ADDSPHERESHAPE = 1;
HATHOR.SELACTION_ADDCONVEXPOINT = 2;
HATHOR.SELACTION_MEASURE = 3;


window.addEventListener( 'load', ()=>{
    ATON.FE.realize();

    HATHOR.paramSID   = ATON.FE.urlParams.get('s');
    HATHOR.paramDDens = ATON.FE.urlParams.get('d');
    HATHOR.paramVRC   = ATON.FE.urlParams.get('vrc');
    HATHOR.paramEdit  = ATON.FE.urlParams.get('edit');
    HATHOR.paramFPS   = ATON.FE.urlParams.get('fps');
    HATHOR.paramRLOG  = ATON.FE.urlParams.get('rlog');

    if (HATHOR.paramRLOG){
        console.log   = ATON.VRoadcast.log;
        console.error = ATON.VRoadcast.log;
    }
    
    HATHOR._bVRCsetup = false;

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

    HATHOR.uiSetup();
    HATHOR.suiSetup();
    HATHOR.setupEventHandlers();

    // Load scene
    ATON.FE.loadSceneID(HATHOR.paramSID);
});



// Front-end UI
//=======================

HATHOR.resetSelectionMode = ()=>{
    HATHOR._selMode = HATHOR.SELACTION_STD;
    $("#btn-shapeconvex").removeClass("atonBTN-rec");

    ATON.getUINode("sui_measure").switch(false);
    return;
};

HATHOR.setSelectionMode = (m)=>{
    if (m === undefined){
        HATHOR.resetSelectionMode();
        return;
    }

    HATHOR._selMode = m;

    if (m === HATHOR.SELACTION_ADDCONVEXPOINT){
        $("#btn-shapeconvex").addClass("atonBTN-rec");
    }

    if (m === HATHOR.SELACTION_MEASURE){
        ATON.getUINode("sui_measure").switch(true);
    }
};

HATHOR.uiSetup = ()=>{

    // Top toolbar
    ATON.FE.uiAddButtonVRC("idTopToolbar");
    ATON.FE.uiAddButtonUser("idTopToolbar");
    ATON.FE.uiAddButton("idTopToolbar", "scene", HATHOR.popupScene );

    ATON.FE.uiAddButtonVR("idTopToolbar");
    ATON.FE.uiAddButtonDeviceOrientation("idTopToolbar");

    ATON.FE.uiAddButtonFullScreen("idTopToolbar");
    ATON.FE.uiAddButton("idTopToolbar", "help", HATHOR.popupHelp );

    //ATON.FE.uiAddButtonQR("idTopToolbar");
/*
    ATON.FE.uiAddButton("idTopToolbar", "shapeconvex", ()=>{
        ATON.Nav.toggleUserControl();

        if (!ATON.Nav.isUserControlEnabled()){
            HATHOR.setSelectionMode(HATHOR.SELACTION_ADDCONVEXPOINT);
        }
        else {
            HATHOR.resetSelectionMode();
            HATHOR.popupAddSemantic(ATON.FE.SEMSHAPE_CONVEX);
        }

    });
*/

    // Auth icons
    $('#idTopToolbar').append("<span id='idAuthTools'></span>");
    //ATON.FE.uiAddButtonEditMode("idAuthTools");
    //ATON.FE.uiAddButton("idAuthTools", "pov", HATHOR.popupPOV );
  
    // Bottom toolbar
    ATON.FE.uiAddButtonHome("idBottomToolbar");
    ATON.FE.uiAddButtonTalk("idBottomToolbar");

    $("#btn-talk").hide();

    if (HATHOR.paramFPS){
        $("#idTopToolbar").append("<div id='idFPS' style='top:5px;right:5px;position:fixed;'></div>");

        ATON.on("frame", ()=>{
            let fps = parseInt(ATON._fps);
            $("#idFPS").html(fps);
        });
    }
};

// Spatial UI
//=======================
HATHOR.suiSetup = ()=>{
    
    let buttons = [];

    buttons.push( new ATON.SUI.Button("sui_measure") );
    buttons.push( new ATON.SUI.Button("sui_talk") );
    buttons.push( new ATON.SUI.Button("sui_exitxr") );

    let btnMeasure = ATON.getUINode("sui_measure");
    btnMeasure.setIcon(ATON.FE.PATH_RES_ICONS+"measure.png")
        .setText("")
        .onSelect = ()=>{
            if (HATHOR._selMode !== HATHOR.SELACTION_MEASURE){
                HATHOR.setSelectionMode(HATHOR.SELACTION_MEASURE);
            }
            else {
                HATHOR.resetSelectionMode();
            }
        };

    let btnTalk = ATON.getUINode("sui_talk");
    btnTalk.setIcon(ATON.FE.PATH_RES_ICONS+"talk.png")
        .setText("")
        .setSwitchColor(ATON.MatHub.colors.green)
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

    ATON.getUINode("sui_exitxr")
        .setText("exit")
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

// Front-end event handling
//=======================
HATHOR.setupVRCEventHandlers = ()=>{
    if (HATHOR._bVRCsetup) return;

    //ATON.VRoadcast.on("VRC_test", (d)=>{ console.log(d); });

    ATON.VRoadcast.on("AFE_DeleteNode", (d)=>{
        let nid  = d.nid;
        let type = d.t;
        if (nid === undefined) return;
        if (type === undefined) return;

        if (type === ATON.NTYPES.SEM){
            let N = ATON.getSemanticNode(nid);
            if (N === undefined) return;
            N.removeChildren();
        }
        /*
        if (type === ATON.NTYPES.SCENE){
            ATON.getSceneNode(nid).removeChildren();
        }*/
    });

    ATON.VRoadcast.on("AFE_AddSceneEdit", (d)=>{
        ATON.SceneHub.parseScene(d);
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
        HATHOR._selMode === HATHOR.SELACTION_STD; // reset select mode
    });

    ATON.EventHub.clearEventHandlers("XRselectStart");
    ATON.on("XRselectStart", (c)=>{
        if (c === ATON.XR.HAND_R){
            if (HATHOR._selMode === HATHOR.SELACTION_STD){
                if (ATON.XR._sessionType === "immersive-vr") ATON.XR.teleportOnQueriedPoint();
            }
            if (HATHOR._selMode === HATHOR.SELACTION_MEASURE) HATHOR.measure();

            ATON.FE.playAudioFromSemanticNode(ATON._hoveredSemNode);
        }
    });

    // VRC
    ATON.on("VRC_Connected", ()=>{
        HATHOR.setupVRCEventHandlers();
    });

    ATON.on("SceneJSONLoaded",()=>{
        if (HATHOR.paramVRC) ATON.VRoadcast.connect(); // maybe not needed
    });

    ATON.on("NodeRequestFired", ()=>{ 
        $("#idLoader").show();
    });

    // Auth
    ATON.on("Login", ()=>{
        $('#idAuthTools').show();
    });
    ATON.on("Logout", ()=>{
        $('#idAuthTools').hide();
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

    ATON.on("SemanticNodeLeave", (semid)=>{
        let S = ATON.getSemanticNode(semid);
        if (S) S.restoreDefaultMaterial();
    });
    ATON.on("SemanticNodeHover", (semid)=>{
        let S = ATON.getSemanticNode(semid);
        if (S) S.highlight();
    });

    ATON.on("MouseRightButton", ()=>{
        if (ATON._hoveredSemNode) HATHOR.popupSemDescription(ATON._hoveredSemNode);
    });

    ATON.on("Tap", (e)=>{
        if (HATHOR._selMode === HATHOR.SELACTION_ADDCONVEXPOINT){
            //console.log("xxx");
            ATON.SemFactory.addSurfaceConvexPoint();
        }
    });

    ATON.on("DoubleTap", (e)=>{
        if (ATON._hoveredSemNode) HATHOR.popupSemDescription(ATON._hoveredSemNode);
    });

    ATON.FE.useMouseWheelToScaleSelector(0.0001);

    ATON.on("KeyPress", (k)=>{
        if (k === 'Delete'){
            let hsn = ATON.getSemanticNode(ATON._hoveredSemNode);
            if (hsn !== undefined){
                hsn.removeChildren();
                //hsn.delete();

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
        if (k === 'Backspace'){
            
        }

        if (k === 'Insert'){
            
        }

        if (k === 'Enter'){
            
        }

        if (k === 'Escape'){
            ATON.SemFactory.stopCurrentConvex();
        }

        if (k === 'y'){
        }

        if (k==='x'){
            HATHOR.popupExportSemShapes();
        }
        if (k==='u') ATON.FE.popupUser();

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
        if (k==='S'){
            HATHOR.popupAddSemantic(ATON.FE.SEMSHAPE_CONVEX);
        }
        if (k==='e'){
            let esemid = ATON._hoveredSemNode;
            if (esemid !== undefined) HATHOR.popupAddSemantic(undefined, esemid);
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

        if (k==='v') HATHOR.popupPOV();

/*
        if (k==='n'){
            ATON.Nav.toggleUserControl();

            HATHOR._selMode = HATHOR.SELACTION_ADDCONVEXPOINT;
        }
*/
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

        if (k==='f') ATON.VRoadcast.setFocusStreaming(true);
    });

    ATON.on("KeyUp",(k)=>{
        if (k==='w'){
            ATON.Nav.stop();
        }

        //if (k==='.') ATON.MediaRec.stopMediaStreaming();
        //if (k==='r') ATON.MediaRec.stopRecording();

        if (k==='f') ATON.VRoadcast.setFocusStreaming(false);
    });

    ATON.on("Login", (d)=>{
        
        if (HATHOR.paramVRC === undefined) return;
        ATON.VRoadcast.setUsername(d.username);
    });

/*
    ATON.on("AllNodeRequestsCompleted", ()=>{ 
        $("#idLoader").hide();
        console.log("All assets loaded!");

        ATON.Nav.computeAndRequestDefaultHome(0.5);
        //ATON.Nav.requestPOV( new ATON.POV().setPosition(0.0, 64.2, -0.5).setTarget(0.0, 64.2, 3.2) );

        //console.log(ATON.EventHub.evLocal);

        //ATON.Nav.setFirstPersonControl();
        //ATON.Nav.setDeviceOrientationControl();
    });
*/
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
        parseFloat(M.A.x.toPrecision(6)),
        parseFloat(M.A.y.toPrecision(6)),
        parseFloat(M.A.z.toPrecision(6)),
        parseFloat(M.B.x.toPrecision(6)),
        parseFloat(M.B.y.toPrecision(6)),
        parseFloat(M.B.z.toPrecision(6))
    ];

    ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_ADD);
    ATON.VRoadcast.fireEvent("AFE_AddSceneEdit", E);
};



// Popups
//=======================================
HATHOR._createPopupStdSem = (esemid)=>{
    let htmlcontent = "";
    
    if (esemid === undefined) htmlcontent = "<h1>New Annotation</h1>";
    else htmlcontent += "<h1>Modify '"+esemid+"'</h1>";

    if (esemid === undefined){
        htmlcontent += "<label for='semid'>ID:</label><input id='semid' type='text' maxlength='15' size='15' list='semlist' >&nbsp;";
        htmlcontent += "<label for='psemid'>child of:</label>";
        htmlcontent += "<div class='select' style='width:100px;'><select id='psemid'>";
        htmlcontent += "<option value='.'>root</option>";
        for (let s in ATON.semnodes) if (s !== ATON.ROOT_NID) htmlcontent += "<option value='"+s+"'>"+s+"</option>";
        htmlcontent += "</select><div class='selectArrow'></div></div>";
        
        htmlcontent += "<datalist id='semlist'>";
        for (let s in ATON.semnodes) if (s !== ATON.ROOT_NID) htmlcontent += "<option>"+s+"</option>";
        htmlcontent += "</datalist>";
    }

    //htmlcontent += "<br>";
    //htmlcontent += "<div id='btnRichContent' class='atonBTN' style='width:50%'><img src='"+ATON.FE.PATH_RES_ICONS+"html.png'>Rich Content</div>";
    //htmlcontent += "<div id='idSemDescCont'><textarea id='idSemDescription' style='width:100%'></textarea></div><br>";
    htmlcontent += "<textarea id='idSemDescription' style='width:100%'></textarea><br>";

    if (ATON.Utils.isConnectionSecure() && !ATON.MediaRec.isAudioRecording()){
        htmlcontent += "<div id='btnVocalNote' class='atonBTN atonBTN-gray'><img src='"+ATON.FE.PATH_RES_ICONS+"talk.png'>Vocal Note</div>";
        htmlcontent += "<br><audio id='ctrlVocalNote' style='display:none' controls ></audio>";
    }

    if (esemid === undefined) htmlcontent += "<div class='atonBTN atonBTN-green' id='idAnnOK' style='width:80%'>ADD</div>";
    else htmlcontent += "<div class='atonBTN atonBTN-green' id='idAnnOK' style='width:80%'>DONE</div>";

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
        toolbar: "bold,italic,underline,link,unlink|left,center,right,justify|bulletlist,orderedlist,table|image,youtube"
    }).sceditor('instance');

    //console.log(SCE);
    return SCE;
};

// Add/Edit/Finalize semantic shape
HATHOR.popupAddSemantic = (semtype, esemid)=>{
    let htmlcontent = HATHOR._createPopupStdSem(esemid);

    if (semtype === undefined) semtype = ATON.FE.SEMSHAPE_SPHERE;

    // Not yet a valid convex shape
    if (semtype === ATON.FE.SEMSHAPE_CONVEX && !ATON.SemFactory.bConvexBuilding) return;

    if ( !ATON.FE.popupShow(htmlcontent, "atonPopupLarge") ) return;

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

            let parS = ATON.getSemanticNode(psemid);

            if (parS) parS.add(S); 
            else ATON.getRootSemantics().add(S);
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
    ATON.FE.playAudioFromSemanticNode(semid);

    let descr = HATHOR.getHTMLDescriptionFromSemNode(semid);
    if (descr === undefined) return;

    let htmlcontent = "<h1>"+semid+"</h1>";
    htmlcontent += "<div class='atonPopupDescriptionContainer'>"+descr+"</div>";

    ATON.FE.popupShow(htmlcontent);
};

HATHOR.popupExportSemShapes = ()=>{
    let htmlcontent = "<h1>Export</h1>";

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

HATHOR.popupPOV = ()=>{
    let pov = ATON.Nav.copyCurrentPOV();
    console.log(pov);

    let htmlcontent = "<h1>Viewpoint</h1>";

    htmlcontent += "<div style='text-align:left;'>";
    htmlcontent += "<strong>Position</strong>: "+pov.pos.x.toPrecision(3)+","+pov.pos.y.toPrecision(3)+","+pov.pos.z.toPrecision(3)+"<br>";
    htmlcontent += "<strong>Target</strong>: "+pov.target.x.toPrecision(3)+","+pov.target.y.toPrecision(3)+","+pov.target.z.toPrecision(3)+"<br>";
    htmlcontent += "<strong>FoV</strong>: "+pov.fov+"<br>";
    htmlcontent += "</div>";
    htmlcontent += "<br>";

    htmlcontent += "<img id='idPOVmodeIcon' src='"+ATON.FE.PATH_RES_ICONS+"home.png' style='text-align:center; vertical-align:middle;'>&nbsp;";
    htmlcontent += "<div class='select' style='width:300px;'><select id='idPOVmode'>";
    htmlcontent += "<option value='h'>Set current viewpoint as Home</option>";
    htmlcontent += "<option value='v'>Add current viewpoint</option>";
    htmlcontent += "</select><div class='selectArrow'></div></div><br><br>";

    htmlcontent += "<div id='idPOVmodeHome'>";
    htmlcontent += "";
    htmlcontent += "</div>";

    htmlcontent += "<div id='idPOVmodeAdd' style='display:none'>";
    htmlcontent += "<label for='idPOVkword'>keywords (comma-separated)</label><br><input id='idPOVkwords' type='text'>";
    htmlcontent += "</div>";

    htmlcontent += "<div class='atonBTN atonBTN-green' id='btnPOV' style='width:90%'>OK</div>"; // <img src='"+FE.PATH_RES_ICONS+"pov.png'>

    if ( !ATON.FE.popupShow(htmlcontent) ) return;

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
};

HATHOR.popupScene = ()=>{
    //let htmlcontent = "<h1>Scene</h1>";
    let htmlcontent = "<h1>"+ATON.SceneHub.currID+"</h1>";

    htmlcontent += "<div class='atonQRcontainer' id='idQRcode'></div><br><br>";
    //htmlcontent += "<div class='atonBTN' id='idPopQR'><img src='"+ATON.FE.PATH_RES_ICONS+"qr.png'>&nbsp;Share</div><br>";

    ATON.FE.checkAuth((r)=>{

        // Authenticated
        if (r.username !== undefined){
            htmlcontent += "Scene changes: ";
            htmlcontent += "<div class='select' style='width:150px;'><select id='idEditMode'>";
            htmlcontent += "<option value='0'>Temporary</option>";
            htmlcontent += "<option value='1'>Persistent</option>";
            htmlcontent += "</select><div class='selectArrow'></div></div><br>";

            htmlcontent += "<br>";

            ///htmlcontent += "<div class='atonBTN atonBTN-green' id='btnSetCover'><img src='"+ATON.FE.PATH_RES_ICONS+"sshot.png'>Set Cover</div>";
            //htmlcontent += "<div class='atonBTN atonBTN-green' id='idPopSShot'><img src='"+ATON.FE.PATH_RES_ICONS+"sshot.png'>Screenshot / Cover</div>";

            //htmlcontent += "<div class='atonBTN atonBTN-gray' id='idSHUuser'><img src='"+ATON.FE.PATH_RES_ICONS+"user.png'>Your profile</div>";
            htmlcontent += "<div class='atonBTN atonBTN-gray' id='idSHUscenes'><img src='"+ATON.FE.PATH_RES_ICONS+"scene.png'>Your scenes</div>";
        }

        if ( !ATON.FE.popupShow(htmlcontent) ) return;

        // Build QR
        let url = window.location.href;
        new QRCode(document.getElementById("idQRcode"), url);

        //
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

        $("#idPopSShot").click(()=>{
            ATON.FE.popupClose();
            ATON.FE.popupScreenShot();
        });
/*
        $("#idPopQR").click(()=>{
            ATON.FE.popupClose();
            ATON.FE.popupQR();
        });
*/
        $("#idSHUscenes").click(()=>{
            //ATON.Utils.goToURL("/shu/scenes/");
            window.open("/shu/scenes/"/*, "_self"*/);
        });
    });
};

HATHOR.popupHelp = ()=>{
    let htmlcontent = "<h1>Hathor help</h1>";
    htmlcontent += "<img src='hathor.png'>";

    htmlcontent += "<div style='text-align:left;'>";

    htmlcontent += "<h3>Navigation</h3>";
    htmlcontent += "<ul>";
    if (ATON.Utils.isMobile()){
        htmlcontent += "<li><b>pinch</b>: dolly / zoom</li>";
        htmlcontent += "<li><b>double-tap</b>: retarget on surface (orbit); locomotion (first-person navigation modes)</li>";
    }
    else {
        htmlcontent += "<li><b>double-click</b>: retarget on surface (orbit); locomotion (first-person navigation modes)</li>";
        htmlcontent += "<li><b>'+'/'-'</b>: increase/decrease field-of-view</li>";
        htmlcontent += "<li><b>'v'</b>: viewpoint</li>";
    }
    htmlcontent += "</ul>";

    // 3D selector
    htmlcontent += "<h3>3D Selector</h3>";
    htmlcontent += "<ul>";
    if (ATON.Utils.isMobile()){
        htmlcontent += "<li><b>Tap</b>: move location of selector</li>";
    }
    else {
        htmlcontent += "<li><b>'SHIFT + mouse wheel'</b>: increase/decrease radius of selector</li>";
        htmlcontent += "<li><b>'a'</b>: add basic annotation (sphere)</li>";
        htmlcontent += "<li><b>'s'</b>: initiate convex shape annotation (add surface point)</li>";
        htmlcontent += "<li><b>'S'</b>: finalize convex shape annotation</li>";
        htmlcontent += "<li><b>'ESC'</b>: cancel/stop current convex shape annotation</li>";
        htmlcontent += "<li><b>'e'</b>: edit hovered annotation</li>";
        htmlcontent += "<li><b>'CANC'</b>: delete hovered annotation</li>";
        htmlcontent += "<li><b>'x'</b>: export semantic shapes</li>";
        htmlcontent += "<li><b>'m'</b>: add measurement point</li>";
    }
    htmlcontent += "</ul>";

    // Other
    if (ATON.Utils.isMobile()){

    }
    else {
        htmlcontent += "<h3>Other</h3>";
        htmlcontent += "<ul>";
        htmlcontent += "<li><b>'c'</b>: screenshot/capture</li>";
        htmlcontent += "</ul>";
    }



    htmlcontent += "</div>";

    if ( !ATON.FE.popupShow(htmlcontent) ) return;
};