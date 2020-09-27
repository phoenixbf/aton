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

    ATON.FE.addBasicLoaderEvents();

    AFE.uiSetup();
    AFE.setupEventHandlers();

    // Load scene
    ATON.FE.loadSceneID(AFE.paramSID);
});



// Front-end UI
//=======================
AFE.uiSetup = ()=>{
    ATON.FE.uiAddButton("idTopToolbar","fullscreen", ATON.toggleFullScreen );

    // These require a secure connection
    if (ATON.Utils.isConnectionSecure()){
        ATON.FE.uiAddButton("idTopToolbar","vr", ATON.XR.toggle );
        if (ATON.Utils.isMobile()) ATON.FE.uiAddButton("idTopToolbar","devori", ATON.Nav.setDeviceOrientationControl );
    }

    ATON.FE.uiAddButtonQR("idTopToolbar");
    
    // Bottom toolbar
    ATON.FE.uiAddButton("idBottomToolbar","home", ()=>{ ATON.Nav.requestHome(0.1); });
};


// Front-end event handling
//=======================
AFE.setupVRCEventHandlers = ()=>{
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
};

AFE.setupEventHandlers = ()=>{
    if (AFE.paramVRC){
        ATON.on("VRC_Connected", ()=>{
            AFE.setupVRCEventHandlers();
        });
    }

    ATON.on("SceneJSONLoaded",()=>{
        if (AFE.paramVRC) ATON.VRoadcast.connect();
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

    ATON.on("AllNodeRequestsCompleted", ()=>{ 
        $("#idLoader").hide();
        console.log("All assets loaded!");

        ATON.Nav.computeAndRequestDefaultHome(0.5);
        //ATON.Nav.requestPOV( new ATON.POV().setPosition(0.0, 64.2, -0.5).setTarget(0.0, 64.2, 3.2) );

        //console.log(ATON.EventHub.evLocal);

        //ATON.Nav.setFirstPersonControl();
        //ATON.Nav.setDeviceOrientationControl();
    });

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

    //htmlcontent += "<textarea id='idSemContent' style='width:80%; height:50px'></textarea><br>";

    htmlcontent += "<button type='button' class='atonBTN atonBTN-green' id='idAnnOK' style='width:80%'>ADD</div>";

    return htmlcontent;
};

AFE.popupAddSemanticSphere = ()=>{
    let htmlcontent = AFE._createPopupStdSem();

    if ( !ATON.FE.popupShow(htmlcontent) ) return;

    //$("#semid").focus();
    ATON.FE.uiAttachInputFilterID("semid");
    //$("#semid").val("");

    $("#idAnnOK").click(()=>{
        $("#semid").blur();
        $("#idSemContent").blur();

        ATON.FE.popupClose();
        
        let semid  = $("#semid").val();
        let psemid = $("#psemid").val();

        if (semid === undefined || semid.length<2 || semid === ATON.ROOT_NID) return;
        if (semid === psemid) return;

        let S = ATON.SemFactory.createSurfaceSphere(semid);
        if (S === undefined) return;
        
        let parS = ATON.getSemanticNode(psemid);

        if (parS) parS.add(S); 
        else ATON.getRootSemantics().add(S);

        let E = {};
        E.semanticgraph = {};
        E.semanticgraph.nodes = {};
        E.semanticgraph.nodes[S.nid] = {};
        E.semanticgraph.nodes[S.nid].spheres = ATON.SceneHub.getJSONsemanticSpheresList(semid);
        E.semanticgraph.edges = ATON.SceneHub.getJSONgraphEdges(ATON.NTYPES.SEM); 
        
        ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_ADD);

        if (AFE.paramVRC === undefined) return;
        ATON.VRoadcast.fireEvent("AFE_AddSceneEdit", E);
/*
        ATON.VRoadcast.fireEvent("AFE_AddSemSphere", {
            nid: semid,
            pnid: psemid,
            spheres: ATON.SceneHub.getJSONsemanticSpheresList(semid)
        });
*/
    });
};

AFE.popupAddSemanticConvex = ()=>{
    let htmlcontent = AFE._createPopupStdSem();

    if ( !ATON.FE.popupShow(htmlcontent) ) return;

    ATON.FE.uiAttachInputFilterID("semid");

    $("#idAnnOK").click(()=>{
        ATON.FE.popupClose();
        
        let semid  = $("#semid").val();
        let psemid = $("#psemid").val();

        if (semid === undefined || semid === ATON.ROOT_NID) return;
        if (semid === psemid) return;

        let S = ATON.SemFactory.completeConvexShape(semid);
        if (S === undefined) return;
        
        $("#semid").blur();
        $("#idSemContent").blur();

        if (psemid !== undefined && ATON.getSemanticNode(psemid)) ATON.getSemanticNode(psemid).add(S); 
        else ATON.getRootSemantics().add(S);

        let E = {};
        E.semanticgraph = {};
        E.semanticgraph.nodes = {};
        E.semanticgraph.nodes[S.nid] = {};
        E.semanticgraph.nodes[S.nid].convexshapes = ATON.SceneHub.getJSONsemanticConvexShapes(semid);
        E.semanticgraph.edges = ATON.SceneHub.getJSONgraphEdges(ATON.NTYPES.SEM);
        
        ATON.SceneHub.sendEdit( E, ATON.SceneHub.MODE_ADD );

        if (AFE.paramVRC === undefined) return;
        ATON.VRoadcast.fireEvent("AFE_AddSceneEdit", E);

    });
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