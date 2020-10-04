/*===========================================================================
    ATON official Front End
    Author: B. Fanini
===========================================================================*/
let AFE = {};


window.addEventListener( 'load', ()=>{
    ATON.FE.realize();

    AFE.paramSID   = ATON.FE.urlParams.get('s');
    AFE.paramDDens = ATON.FE.urlParams.get('d');
    AFE.paramVRC   = ATON.FE.urlParams.get('vrc');
    AFE.paramEdit  = ATON.FE.urlParams.get('edit');
    AFE.paramFPS   = ATON.FE.urlParams.get('fps');
    
    AFE._bVRCsetup = false;

    if (AFE.paramEdit) ATON.SceneHub.setEditMode(AFE.paramEdit);
    else ATON.SceneHub.setEditMode(false);

    ATON.FE.addBasicLoaderEvents();

    AFE.uiSetup();
    AFE.setupEventHandlers();

    // Load scene
    ATON.FE.loadSceneID(AFE.paramSID);
});



// Front-end UI
//=======================
AFE.uiSetup = ()=>{

    ATON.FE.uiAddButtonVRC("idTopToolbar");
    ATON.FE.uiAddButtonFullScreen("idTopToolbar");

    ATON.FE.uiAddButtonVR("idTopToolbar");
    ATON.FE.uiAddButtonDeviceOrientation("idTopToolbar");

    ATON.FE.uiAddButtonQR("idTopToolbar");
    
    // Bottom toolbar
    ATON.FE.uiAddButtonHome("idBottomToolbar");

    if (AFE.paramFPS){
        $("#idTopToolbar").append("<div id='idFPS' style='top:5px;right:5px;position:fixed;'></div>");

        ATON.on("frame", ()=>{
            let fps = parseInt(ATON._fps);
            $("#idFPS").html(fps);
        });
    }
};


// Front-end event handling
//=======================
AFE.setupVRCEventHandlers = ()=>{
    if (AFE._bVRCsetup) return;

    //ATON.VRoadcast.on("VRC_test", (d)=>{ console.log(d); });

    ATON.VRoadcast.on("AFE_DeleteNode", (d)=>{
        let nid  = d.nid;
        let type = d.t;
        if (nid === undefined) return;
        if (type === undefined) return;

        if (type === ATON.NTYPES.SEM)   ATON.getSemanticNode(nid).removeChildren();
        //if (type === ATON.NTYPES.SCENE) ATON.getSceneNode(nid).removeChildren();
    });

    ATON.VRoadcast.on("AFE_AddSceneEdit", (d)=>{
        ATON.SceneHub.parseScene(d);
    });

    AFE._bVRCsetup = true;
};

AFE.setupEventHandlers = ()=>{

    // VRC
    ATON.on("VRC_Connected", ()=>{
        AFE.setupVRCEventHandlers();
    });

    ATON.on("SceneJSONLoaded",()=>{
        if (AFE.paramVRC) ATON.VRoadcast.connect(); // maybe not needed
    });

    ATON.on("NodeRequestFired", ()=>{ 
        $("#idLoader").show();
    });

    ATON.on("SemanticNodeHover", (nid)=>{
        console.log("Hovering "+nid);
        //ATON.getSemanticNode(nid).visible = true;
    });

    ATON.on("SemanticNodeLeave", (nid)=>{
        console.log("Leaving "+nid);
        //ATON.getSemanticNode(nid).visible = false;
    });

    ATON.on("MouseRightButton", ()=>{
        if (ATON._hoveredSemNode) AFE.popupSemDescription(ATON._hoveredSemNode);
    });
    ATON.on("DoubleTap", (e)=>{
        if (ATON._hoveredSemNode) AFE.popupSemDescription(ATON._hoveredSemNode);
    });

    ATON.on("MouseWheel", (d)=>{

        if (ATON.Nav._controls.enableZoom === undefined) return;

        if (ATON._kModShift){
            ATON.Nav._controls.enableZoom = false;

            let r = ATON.SUI.mainSelector.scale.x;
            r += (-d*0.001);
            if (r > 0.0001) ATON.SUI.setSelectorRadius(r);
        }
        else {
            ATON.Nav._controls.enableZoom = true;
        }
    });

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

                if (AFE.paramVRC === undefined) return;
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
            //ATON.fireEvent("VRC_test", {}, true);
            //ATON.VRoadcast.fireEvent("VRC_test", "TEST");
            //ATON.getSemanticNode("wall").exportAs("wall.glb");
            AFE.popupUser();
        }
        if (k==='w'){
            if (ATON.Nav._mode === ATON.Nav.MODE_FP) ATON.Nav.setMotionAmount(0.5);
        }

        if (k==='a'){
            ATON.SemFactory.stopCurrentConvex();
            AFE.popupAddSemanticSphere();
        }

        if (k==='s'){
            ATON.SemFactory.addSurfaceConvexPoint();
        }

        if (k==='S'){
            AFE.popupAddSemanticConvex();
        }

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

        if (k==='h'){
            let hp = new ATON.POV();
            hp.pos.copy(ATON.Nav._currPOV.pos);
            hp.target.copy(ATON.Nav._currPOV.target);
            hp.fov = ATON.Nav._currPOV.fov;

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
    });

    ATON.on("KeyUp",(k)=>{
        if (k==='w'){
            ATON.Nav.stop();
        }
    });

    ATON.on("Login", (d)=>{
        
        if (AFE.paramVRC === undefined) return;
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

// Popups
//=======================================
AFE._createPopupStdSem = ()=>{
    let htmlcontent = "<h1>Add Semantic Shape</h1>";

    htmlcontent += "<label for='semid'>ID:</label><input id='semid' type='text' maxlength='11' size='11' list='semlist' >";
    htmlcontent += "<label for='psemid'>child of:</label>";
    htmlcontent += "<div class='select' style='width:100px;'><select id='psemid'>";
    htmlcontent += "<option value='.'>root</option>";
    for (let s in ATON.semnodes) if (s !== ATON.ROOT_NID) htmlcontent += "<option value='"+s+"'>"+s+"</option>";
    htmlcontent += "</select><div class='selectArrow'></div></div>";
    
    htmlcontent += "<datalist id='semlist'>";
    for (let s in ATON.semnodes) if (s !== ATON.ROOT_NID) htmlcontent += "<option>"+s+"</option>";
    htmlcontent += "</datalist>";

    htmlcontent += "<textarea id='idSemDescription' style='width:100%;'></textarea><br>";

    htmlcontent += "<button type='button' class='atonBTN atonBTN-green' id='idAnnOK' style='width:80%'>ADD</div>";

    return htmlcontent;
};

AFE.createSemanticTextEditor = (idtextarea)=>{
    let txtarea = document.getElementById(idtextarea);
    sceditor.create(txtarea, {
        //format: 'bbcode',
        //bbcodeTrim: true,
        width: "100%",
        height: "100%",
        resizeEnabled: false,
        autoExpand: true,
        emoticonsEnabled: false,
        autoUpdate: true,
        style: 'vendors/sceditor/minified/themes/content/default.min.css',
        toolbar: "bold,italic,underline,link,unlink|left,center,right,justify|bulletlist,orderedlist,table|image,youtube"
    });
};

AFE.popupAddSemanticSphere = ()=>{
    let htmlcontent = AFE._createPopupStdSem();

    if ( !ATON.FE.popupShow(htmlcontent) ) return;

    //$("#semid").focus();
    ATON.FE.uiAttachInputFilterID("semid");
    //$("#semid").val("");

    AFE.createSemanticTextEditor("idSemDescription");

    //console.log(sceditor);
/*
    $("#semid").on("input", ()=>{
        let semid  = $("#semid").val();

        let descr = AFE.getHTMLDescriptionFromSemNode(semid);
        if (descr !== undefined){
            $("#idSemDescription").val(descr);
            //sceditor.instance.val(descr);
            console.log(descr);
        }
    });
*/

    $("#idAnnOK").click(()=>{
        $("#semid").blur();
        $("#idSemDescription").blur();

        let semid  = $("#semid").val();
        let psemid = $("#psemid").val();
        let xxtmldescr = JSON.stringify( $("#idSemDescription").val() );
        console.log(xxtmldescr);

        if (semid.length<1) return;

        ATON.FE.popupClose();

        if (semid === undefined || semid.length<2 || semid === ATON.ROOT_NID) return;
        if (semid === psemid) return;

        let S = ATON.SemFactory.createSurfaceSphere(semid);
        if (S === undefined) return;

        if (xxtmldescr && xxtmldescr.length>0) S.setDescription( xxtmldescr );
        
        let parS = ATON.getSemanticNode(psemid);

        if (parS) parS.add(S); 
        else ATON.getRootSemantics().add(S);

        let E = {};
        E.semanticgraph = {};
        E.semanticgraph.nodes = {};
        E.semanticgraph.nodes[S.nid] = {};
        E.semanticgraph.nodes[S.nid].spheres = ATON.SceneHub.getJSONsemanticSpheresList(semid);
        E.semanticgraph.nodes[S.nid].description = S.getDescription();
        E.semanticgraph.edges = ATON.SceneHub.getJSONgraphEdges(ATON.NTYPES.SEM); 
        
        ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_ADD);
        ATON.VRoadcast.fireEvent("AFE_AddSceneEdit", E);
    });
};

AFE.popupAddSemanticConvex = ()=>{
    let htmlcontent = AFE._createPopupStdSem();

    if ( !ATON.FE.popupShow(htmlcontent) ) return;

    ATON.FE.uiAttachInputFilterID("semid");

    AFE.createSemanticTextEditor("idSemDescription");

    $("#idAnnOK").click(()=>{
        let semid  = $("#semid").val();
        let psemid = $("#psemid").val();
        let xxtmldescr = JSON.stringify( $("#idSemDescription").val() );
        console.log(xxtmldescr);

        if (semid.length<1) return;

        ATON.FE.popupClose();

        if (semid === undefined || semid === ATON.ROOT_NID) return;
        if (semid === psemid) return;

        let S = ATON.SemFactory.completeConvexShape(semid);
        if (S === undefined) return;

        if (xxtmldescr && xxtmldescr.length>0) S.setDescription( xxtmldescr );
        
        $("#semid").blur();
        $("#idSemDescription").blur();

        if (psemid !== undefined && ATON.getSemanticNode(psemid)) ATON.getSemanticNode(psemid).add(S); 
        else ATON.getRootSemantics().add(S);

        let E = {};
        E.semanticgraph = {};
        E.semanticgraph.nodes = {};
        E.semanticgraph.nodes[S.nid] = {};
        E.semanticgraph.nodes[S.nid].convexshapes = ATON.SceneHub.getJSONsemanticConvexShapes(semid);
        E.semanticgraph.nodes[S.nid].description = S.getDescription();
        E.semanticgraph.edges = ATON.SceneHub.getJSONgraphEdges(ATON.NTYPES.SEM);
        
        ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_ADD );

        if (AFE.paramVRC === undefined) return;
        ATON.VRoadcast.fireEvent("AFE_AddSceneEdit", E);

    });
};

AFE.getHTMLDescriptionFromSemNode = (semid)=>{
    let S = ATON.getSemanticNode(semid);
    if (S === undefined) return undefined;
    
    let descr = S.getDescription();
    if (descr === undefined) return undefined;

    descr = JSON.parse(descr);
    return descr;
};

AFE.popupSemDescription = (semid)=>{
    let descr = AFE.getHTMLDescriptionFromSemNode(semid);
    if (descr === undefined) return;

    let htmlcontent = "<h1>"+semid+"</h1>";
    htmlcontent += "<div class='atonPopupDescriptionContainer'>"+descr+"</div>";

    ATON.FE.popupShow(htmlcontent);
};

AFE.popupUser = ()=>{
    $.get(ATON.PATH_RESTAPI+"user", (r)=>{
        if (r){
            let htmlcontent = "<h1>User</h1>";
            htmlcontent += "You are logged in as <b>'"+r.username+"'</b><br>";

            htmlcontent += "<button type='button' class='atonBTN atonBTN-red' id='idLogoutBTN' style='width:80%'>LOGOUT</div>";

            if ( !ATON.FE.popupShow(htmlcontent) ) return;

            $("#idLogoutBTN").click(()=>{

                $.get(ATON.PATH_RESTAPI+"logout", (r)=>{
                    console.log(r);
                    ATON.fireEvent("Logout");
                });

                ATON.FE.popupClose();
            });

        }
        else {
            let htmlcontent = "<h1>Login</h1>";
            htmlcontent += "<label for='idUsername'>username:</label><input id='idUsername' type='text' maxlength='15' size='15' ><br>";
            htmlcontent += "<label for='idPassword'>password:</label><input id='idPassword' type='text' maxlength='15' size='15' ><br>";

            htmlcontent += "<button type='button' class='atonBTN atonBTN-green' id='idLoginBTN' style='width:80%'>LOGIN</div>";

            if ( !ATON.FE.popupShow(htmlcontent) ) return;

            $("#idLoginBTN").click(()=>{

                let jstr = JSON.stringify({
                    username: $("#idUsername").val(),
                    password: $("#idPassword").val()
                });

                $.ajax({
                    url: ATON.PATH_RESTAPI+"login",
                    type:"POST",
                    data: jstr,
                    contentType:"application/json; charset=utf-8",
                    dataType:"json",

                    success: (r)=>{
                        console.log(r);
                        if (r) ATON.fireEvent("Login", r);
                    }
                });

                ATON.FE.popupClose();
            });
        }
    });

};