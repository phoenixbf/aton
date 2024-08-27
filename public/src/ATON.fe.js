/*
    ATON Front-end blueprint

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
Generic front-end routines for ATON-based web-apps. 
A set of blueprints to facilitate or support creation of a front-end
@namespace FE
*/
let FE = {};

// Semantic-shapes types
FE.SEMSHAPE_SPHERE = 0;
FE.SEMSHAPE_CONVEX = 1;

FE.POPUP_DT = 500; //300;

FE.STD_SEL_RAD = 0.05;

FE._bRealized = false;

/**
Initialize Front-end
*/
FE.realize = ()=>{
    if (FE._bRealized) return;

    FE.PATH_RES_ICONS = ATON.PATH_RES+"icons/";

    FE._bPopup     = false;  // showing popup
    FE._tPopup     = undefined;
    FE.popupBlurBG = 0;      // blur 3D canvas on popup show (in pixels), 0 to disable
    
    FE._userAuth = {};

    FE._bControlLight = false;
    FE._bControlSelScale = false;
    FE._cLightDir = new THREE.Vector3();

    FE._auSemNode = undefined;
    FE._auSemNodePlaying = false;

    FE._bReqHome = false;   // auto-compute home

    FE._bVRCsetup = false;

    FE.urlParams = new URLSearchParams(window.location.search);

    FE._uiSetupBase();

    // UI profiles
    FE._uiProfiles    = {};
    FE._uiCurrProfile = undefined;

    FE._selRanges    = [0.01, 50.0]; // 3D Selector ranges
    FE._selRefRadius = 0.5;

    ATON.realize();

    // Built-in events
    ATON.on("Fullscreen", (b)=>{
        FE.uiSwitchButton("fullscreen",b);
    });

    // built-in base front-end parameters
    let ddens = ATON.FE.urlParams.get('d');
    if (ddens && ddens>0.0){
        ATON.setDefaultPixelDensity(ddens);
        ATON.toggleAdaptiveDensity(false);
    }

    let dynd = ATON.FE.urlParams.get('dd');
    if (dynd && dynd > 0) ATON.toggleAdaptiveDensity(true);

    FE._canvas = ATON._renderer.domElement;
    
    FE._bSem = false; // hovering semantic node or mask
    FE._bShowSemLabel = true;

    FE._bRealized = true;
};

FE._handleHomeReq = ()=>{
    if (FE._bReqHome) return;

    // Check we have a valid scene bs
    let bs = ATON.getRootScene().getBound();
    if (bs.radius <= 0.0) return;

    FE._bReqHome = true;

    if (ATON.Nav.homePOV === undefined){
        ATON.Nav.computeAndRequestDefaultHome(0.5);
        return;
    }
    
    ATON.Nav.requestHome(1.0);
    //console.log(ATON.Nav.homePOV);
};

/**
Add basic front-end events such as showing spinner while loading assets and home viewpoint setup
*/
FE.addBasicLoaderEvents = ()=>{
    ATON.on("NodeRequestFired", ()=>{
        $("#idLoader").show();
        //$('#idBGcover').show(); // TODO: is it worth? only first time
    });

    ATON.on("SceneJSONLoaded",()=>{
        if (ATON.SceneHub.getDescription()) $("#btn-info").show();
        if (ATON.Nav.homePOV !== undefined) ATON.Nav.requestHome(1.0);

        // If we have an XPF network and no home set, move to first XPF
        if (ATON.XPFNetwork._list.length>0 && ATON.Nav.homePOV === undefined){
            ATON.XPFNetwork.setHomeXPF(0);
            ATON.XPFNetwork.requestTransitionByIndex(0);
        }
    });

    ATON.on("AllNodeRequestsCompleted", ()=>{ 
        $("#idLoader").hide();
        //$('#idBGcover').fadeOut("slow");

        if ( ATON.CC.anyCopyrightFound() ) $("#btn-cc").show();
        
        FE.computeSelectorRanges();
        //if (ATON.Nav.isOrbit()) ATON.SUI.setSelectorRadius( FE._selRefRadius );
        ATON.SUI.setSelectorRadius( Math.min(FE.STD_SEL_RAD,FE._selRefRadius) );

        FE._handleHomeReq();
    });

    ATON.on("XR_support", (d)=>{
        if (d.type==='immersive-vr'){
            if (d.v) $("#btn-vr").show();
            else $("#btn-vr").hide();
        }
/*
        if (d.type==='immersive-ar'){
            if (d.v) $("#btn-ar").show();
            else $("#btn-ar").hide();
        }
*/
    });

    // Semantic
    ATON.on("SemanticNodeHover", (semid)=>{
        let S = ATON.getSemanticNode(semid);
        if (S === undefined) return;

        FE.showSemLabel(semid);
        FE._bSem = true;

        S.highlight();
        $('canvas').css({ cursor: 'crosshair' });

        if (ATON.SUI.gSemIcons) ATON.SUI.gSemIcons.hide();
    });
    ATON.on("SemanticNodeLeave", (semid)=>{
        let S = ATON.getSemanticNode(semid);
        if (S === undefined) return;

        FE.hideSemLabel();
        FE._bSem = false;

        S.restoreDefaultMaterial();
        $('canvas').css({ cursor: 'grab' });

        if (ATON.SUI.gSemIcons) ATON.SUI.gSemIcons.show();
    });

    ATON.on("SemanticMaskHover", semid => {
        FE.showSemLabel(semid);
        FE._bSem = true;
        $('canvas').css({ cursor: 'crosshair' });
    });
    ATON.on("SemanticMaskLeave", semid => {
        FE.hideSemLabel();
        FE._bSem = false;
        $('canvas').css({ cursor: 'grab' });
    });


    //ATON.on("frame", FE._update);
    ATON.addUpdateRoutine(FE._update);
};

FE.showSemLabel = (txt)=>{
    if (!FE._bShowSemLabel) return;

    $("#idPopupLabel").html(txt);
    $("#idPopupLabel").show();

    ATON.SUI.setInfoNodeText(txt);
};

FE.hideSemLabel = ()=>{
    $("#idPopupLabel").hide();
    $("#idPopupLabel").html("");
};

FE.controlLight = (b)=>{
    FE._bControlLight = b;
    ATON.Nav.setUserControl(!b);
};

FE.controlSelectorScale = (b)=>{
    FE._bControlSelScale = b;
    ATON._bPauseQuery = b;
    ATON.Nav.setUserControl(!b);
};

// Gizmo transforms
FE.attachGizmoToNode = (nid)=>{
    if (ATON._gizmo === undefined) return;

    let N = ATON.getSceneNode(nid);
    if (N === undefined) return;

    ATON._gizmo.attach( N );
};

FE.useMouseWheelToScaleSelector = (f)=>{
    if (f === undefined) f = 0.9; 

    ATON.on("MouseWheel", (d)=>{

        if (ATON._kModCtrl){
            let ff = ATON.Nav.getFOV();
            
            if (d > 0.0) ff += 1.0;
            else ff -= 1.0;

            ATON.Nav.setFOV(ff);
            return;
        }

        if (ATON._kModShift){
            let r = ATON.SUI.mainSelector.scale.x;

            if (d > 0.0) r *= f;
            else r /= f;

            if (r < FE._selRanges[0]) r = FE._selRanges[0];
            if (r > FE._selRanges[1]) r = FE._selRanges[1];

            ATON.SUI.setSelectorRadius(r);
            return;
        }
    });
};


/**
Load a scene. 
You can use ATON.on("SceneJSONLoaded", ...) to perform additional tasks when the scene JSON is fully loaded
@param {string} sid - the scene ID (e.g.: 'sample/venus')
*/
FE.loadSceneID = (sid, onSuccess)=>{
    if (sid === undefined) return;

    let reqstr = ATON.PATH_RESTAPI_SCENE + sid;
    //if (ATON.SceneHub._bEdit) reqstr += ",edit";

    ATON.SceneHub.load(reqstr, sid, onSuccess);

    console.log(reqstr);
};

FE._update = ()=>{
    //if (ATON.XR._bPresenting) return;

    if (FE._bControlLight){
        // Normalized
        const sx = ATON._screenPointerCoords.x;
        const sy = ATON._screenPointerCoords.y;
        //console.log(sx,sy);

        FE._cLightDir.x = -Math.cos(sx * Math.PI);
        FE._cLightDir.y = -sy * 4.0;
        FE._cLightDir.z = -Math.sin(sx * Math.PI);

        //FE._cLightDir.x = ATON.Nav._vDir.x + (sx);

        FE._cLightDir.normalize();

        ATON.setMainLightDirection(FE._cLightDir);
        //ATON.updateDirShadows();
    }

    // Immersive VR/AR
    if (ATON.XR._bPresenting){
        let v = ATON.XR.getAxisValue(ATON.XR.HAND_R);
        
        if (!ATON.Photon._bStreamFocus){
            let s = ATON.SUI._selectorRad;
            s += (v.y * 0.01);

            if (s > 0.001) ATON.SUI.setSelectorRadius(s);
        }
    }
    // Default
    else {
        if (ATON.Nav.isTransitioning() || ATON.Nav._bInteracting || ATON._bPauseQuery){
            $("#idPopupLabel").hide();
            return;
        }

        if (FE._bSem && FE._bShowSemLabel){
            $("#idPopupLabel").show();

            let x = ((ATON._screenPointerCoords.x)*0.5) * window.innerWidth; //FE._canvas.width;
            let y = ((1.0 - ATON._screenPointerCoords.y)*0.5) * window.innerHeight; //FE._canvas.height;
            y -= 55;

            $("#idPopupLabel").css('transform', "translate("+x+"px, "+y+"px)");
        }
        else $("#idPopupLabel").hide();
    }


/*
    if (FE._bControlSelScale){
        //const sx = ATON._screenPointerCoords.x;
        const f = ATON._screenPointerCoords.y;

        const r = ATON.SUI.mainSelector.scale.x + f;
        if (r > 0.0001) ATON.SUI.setSelectorRadius(r);
    }
*/
};


// HTML UI
//=======================================
// Sample basic UI setup
FE.uiBasicSetup = ()=>{
    FE.uiAddButton("idTopToolbar","fullscreen", ATON.toggleFullScreen );
    if (ATON.Utils.isConnectionSecure()) FE.uiAddButton("idTopToolbar","vr", ATON.XR.toggle );

    FE.uiAddButton("idBottomToolbar","home", ()=>{ ATON.Nav.requestHome(0.1); });
};

FE._uiSetupBase = ()=>{
    $("#idPopup").click( FE.popupClose );
    $("#idLoader").html("<img src='"+ATON.PATH_RES+"loader.png'>");

    $("body").prepend("<div class='atonPopupLabelContainer'><div id='idPopupLabel' class='atonPopupLabel'></div></div>");
    FE.hideSemLabel();
};

/**
Add generic icon button inside a specific div container
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
@param {string} icon - the icon. Can be shortname for default icons in /res/icons/ or URL to .png image
@param {function} onPress - function triggered when pressing the button
@param {string} tooltip - (optional) tooltip
*/
FE.uiAddButton = (idcontainer, icon, onPress, tooltip)=>{
    let iconurl;
    let iconid;

    if (icon.endsWith(".png")){
        iconurl = icon;
        iconid  = icon.slice(0,-4);
    }
    else {
        iconurl = FE.PATH_RES_ICONS+icon+".png";
        iconid  = icon;
    }

    let elid = "btn-"+iconid;
    //let htmlcode = "<div id='"+elid+"' class='atonBTN' ><img src='"+iconurl+"'></div>";
    let el = $("<div id='"+elid+"' class='atonBTN' ><img src='"+iconurl+"'></div>");
    
    $("#"+idcontainer).append(el);

    if (onPress) el.click( onPress ); //$("#"+elid).click( onPress );
    if (tooltip) el.attr("title", tooltip); //$("#"+elid).attr("title", tooltip);
};

FE.uiSwitchButton = (iconid, b)=>{
    if (b) $("#btn-"+iconid).addClass("switchedON");
    else $("#btn-"+iconid).removeClass("switchedON");
};

FE.uiSetButtonHandler = (id, handler)=>{
    $("#"+id).click( handler );
};

/**
Add home button
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonHome = (idcontainer)=>{
    FE.uiAddButton(idcontainer, "home", ()=>{ 
        ATON.Nav.requestHome(0.3);
    }, "Home viewpoint");
};

/**
Add back button
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
@param {string} url - (optional) url
*/
FE.uiAddButtonBack = (idcontainer, url)=>{
    FE.uiAddButton(idcontainer, "back", ()=>{ 
        if (url && url.length > 1 && url.startsWith("http:")) ATON.Utils.goToURL(url);
        else history.back();
    }, "Go Back");
};

/**
Add first-person button
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonFirstPerson = (idcontainer)=>{
    FE.uiAddButton(idcontainer, "fp", ()=>{
        if (ATON.Nav.isFirstPerson()){
            ATON.Nav.setOrbitControl();
            //ATON.Nav.restorePreviousNavMode();
            FE.uiSwitchButton("fp",false);
        }
        else {
            ATON.Nav.setFirstPersonControl();
            FE.uiSwitchButton("fp",true);
        }
    }, "First-person navigation mode");

    if (ATON.Nav.isFirstPerson()) FE.uiSwitchButton("fp",true);
    else FE.uiSwitchButton("fp",false);
};

/**
Add immersive-VR button
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonVR = (idcontainer)=>{
    if (!ATON.Utils.isConnectionSecure()) return;

    FE.uiAddButton(idcontainer, "vr", ()=>{
        ATON.XR.toggle("immersive-vr");
    },
    "Immersive VR mode" );

    if (!ATON.Utils.isVRsupported()) $("#btn-vr").hide();
};

/**
Add immersive-AR button
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonAR = (idcontainer)=>{
    if (!ATON.Utils.isConnectionSecure()) return;
    //if (!ATON.Utils.isARsupported()) return; //Not showing on mobile

    FE.uiAddButton(idcontainer, "ar", ()=>{
        if (ATON.Utils.isARsupported()){
            ATON.XR.toggle("immersive-ar");
        }
/*
        // Apple USDZ
        else {
            let fname = "scene.usdz";
            //if (ATON.SceneHub.currID) fname = 
            ATON.Utils.exportNode(ATON.getRootScene(), fname);
        }
*/
    }, 
    "Immersive AR mode" );

    //if (!ATON.Utils.isARsupported()) $("#btn-ar").hide();
};

/**
Add device-orientation button
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonDeviceOrientation = (idcontainer)=>{
    if (!ATON.Utils.isConnectionSecure()) return;
    if (!ATON.Utils.isMobile()) return;

    FE.uiAddButton(idcontainer,"devori", ()=>{
        if (ATON.Nav.isDevOri()){
            //ATON.Nav.setOrbitControl();
            ATON.Nav.restorePreviousNavMode();
            FE.uiSwitchButton("devori",false);
        }
        else {
            ATON.Nav.setDeviceOrientationControl();
            FE.uiSwitchButton("devori",true);
        }
    }, "Device-orientation mode");

    if (ATON.Nav.isDevOri()) FE.uiSwitchButton("devori",true);
    else FE.uiSwitchButton("devori",false);
};

/**
Add Navigation button
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonNav = (idcontainer)=>{
    FE.uiAddButton(idcontainer,"nav", ()=>{
        FE.popupNav();
    }, "Navigation");
};

/**
Add talk button (Photon)
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonTalk = (idcontainer)=>{
    if (!ATON.Utils.isConnectionSecure()) return;

    FE.uiAddButton(idcontainer, "talk", ()=>{
        if (ATON.MediaFlow.isAudioRecording()){
            ATON.MediaFlow.stopAudioStreaming();
            //FE.uiSwitchButton("talk",false);
            $("#btn-talk").removeClass("atonBTN-rec");
        }
        else {
            ATON.MediaFlow.startAudioStreaming();
            //FE.uiSwitchButton("talk",true);
            $("#btn-talk").addClass("atonBTN-rec");
        }
    }, "Talk ON/OFF");

    if (ATON.MediaFlow.isAudioRecording()) $("#btn-talk").addClass("atonBTN-rec");
    else $("#btn-talk").removeClass("atonBTN-rec");
};

/**
Add focus stream button (Photon)
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonStreamFocus = (idcontainer)=>{

    FE.uiAddButton(idcontainer, "focus", ()=>{
        if (ATON.Photon._bStreamFocus){
            ATON.Photon.setFocusStreaming(false);
            $("#btn-focus").removeClass("atonBTN-rec");
        }
        else {
            ATON.Photon.setFocusStreaming(true);
            $("#btn-focus").addClass("atonBTN-rec");
        }
    }, "Focus streaming ON/OFF");

    if (ATON.Photon._bStreamFocus) $("#btn-focus").addClass("atonBTN-rec");
    else $("#btn-focus").removeClass("atonBTN-rec");
};

/**
Add main videopano control button
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonMainVideoPanoPlayPause = (idcontainer)=>{
    FE.uiAddButton(idcontainer, "playpause", ()=>{
        if (ATON._vpanoPlaying){
            if (ATON._elPanoVideo){
                ATON._elPanoVideo.pause();
                //FE.uiSwitchButton("playpause",false);
            }
        }
        else {
            if (ATON._elPanoVideo){
                ATON._elPanoVideo.play();
                //FE.uiSwitchButton("playpause",true);
            }
        }
    }, "360 Video play/pause");

    if (ATON._elPanoVideo) $("#btn-playpause").show();
    else $("#btn-playpause").hide();
};

/**
Add QR-code button (hidden on localhost/offline scenarios)
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonQR = (idcontainer)=>{
    if (ATON.Utils.isLocalhost()) return;

    FE.uiAddButton(idcontainer,"qr", FE.popupQR, "QR-code" );
};

/**
Add screenshot button
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonScreenshot = (idcontainer)=>{
    FE.uiAddButton(idcontainer,"sshot", FE.popupScreenShot, "Screenshot" );
};

/**
Add scene information button
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonInfo = (idcontainer)=>{
    FE.uiAddButton(idcontainer, "info", ATON.FE.popupSceneInfo, "Scene information");
    $("#btn-info").hide();
};

/**
Add fullscreen button
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonFullScreen = (idcontainer)=>{
    FE.uiAddButton(idcontainer, "fullscreen", ()=>{
        ATON.toggleFullScreen();
    }, "Fullscreen");

    FE.uiSwitchButton("fullscreen", ATON.isFullscreen());
};

//TODO:
FE.uiAddKeywordsArea = (idcontainer, kwList, onAddKeyword, onRemoveKeyword)=>{
    let htmlcode = "";
    htmlcode += "Add keyword: <input id='idKWordInput' list='lkwords' type='text' maxlength='100' size='20'><div class='atonBTN atonBTN-green' id='idKWadd'><img src='"+ATON.FE.PATH_RES_ICONS+"add.png'></div><br>";
    htmlcode += "<div id='idKWords'></div>";

    $("#"+idcontainer).html(htmlcode);

    FE.uiAttachInputFilterID("idKWordInput");

    // Request global keywords list
    $.getJSON( ATON.PATH_RESTAPI+"keywords/", ( data )=>{
        let ht = "<datalist id='lkwords'>";
        for (let s in data) ht += "<option>"+s+"</option>";
        ht += "</datalist>";

        $("#"+idcontainer).append(ht);
    });


    let kwsObj = {};

    let addKWtoBox = (kw)=>{
        if (kwsObj[kw]) return; // check duplicate

        kw = kw.toLowerCase().trim();

        $("#idKWordInput").val(""); // clear

        kwsObj[kw] = 1;

        console.log("Added keyword "+kw);
        if (onAddKeyword) onAddKeyword(kw);

        // Populate box with remove handlers
        $("#idKWords").append("<div class='atonKeyword atonKeywordActivable' id='idkw-"+kw+"'>"+kw+"</div>");
        $("#idkw-"+kw).click(()=>{
            $("#idkw-"+kw).remove();

            kwsObj[kw] = undefined;

            console.log("Removed keyword "+kw);
            if (onRemoveKeyword) onRemoveKeyword(kw);
        });
    };

    if (kwList){
        for (let k in kwList) addKWtoBox( kwList[k] );
    }

    $("#idKWordInput").keypress(function(event){
        let keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode != '13') return;

        let kw = $("#idKWordInput").val().toLowerCase().trim();
        if (!kw || kw.length < 3) return;

        addKWtoBox(kw);
    });

    $("#idKWadd").click(()=>{
        let kw = $("#idKWordInput").val().toLowerCase().trim();
        if (!kw || kw.length < 3) return;

        addKWtoBox(kw);
    });
};

FE.uiAttachCollectionItemsToInput = (idinput, type)=>{
    let htmlcontent = "";

    $("#"+idinput).attr("list", idinput+"-list");
    $("#"+idinput).attr("name", idinput+"-list");

    $.getJSON( ATON.PATH_RESTAPI+"c/"+type+"/", ( data )=>{
        //let folders = {};
        //SHU._cModelDirs = {};
        
        htmlcontent += "<datalist id='"+idinput+"-list'>";

        for (let m in data){
            let ipath = data[m];
            htmlcontent += "<option value='"+ipath+"'>"+ipath+"</option>";

            //let F = SHU.getBaseFolder(ipath);
            //if (SHU._cModelDirs[F] === undefined) SHU._cModelDirs[F] = [];
            //SHU._cModelDirs[F].push(ipath)
            
            ///if (folders[F] === undefined) folders[F] = ipath;
            ///else folders[F] += ","+ipath;
        }

        //console.log(SHU._cModelDirs);

        ///for (let F in folders) htmlcontent += "<option value='"+folders[F]+"'>"+F+"*</option>";
        ///for (let F in folders) htmlcontent += "<option value='"+F+"*'>"+F+"*</option>";
        //for (let F in SHU._cModelDirs) htmlcontent += "<option value='"+F+"*'>"+F+"*</option>";

        htmlcontent += "</datalist>";

        $("#"+idinput).html(htmlcontent);
    });
};


// Get css class from vrc ID
FE.getVRCclassFromID = (uid)=>{
    let i = (uid%6);
    return "atonVRCu"+i;
};

// Setup VRC events
FE._setupVRCevents = ()=>{
    if (FE._bVRCsetup) return;

    ATON.on("VRC_IDassigned", (uid)=>{
        $("#btn-vrc").addClass( FE.getVRCclassFromID(uid) );

        // Selector color
        //let col = ATON.Photon.ucolors[uid%6];
        //ATON.MatHub.materials.selector.color = ATON.Photon.ucolors[uid%6];
        ATON.SUI.setSelectorColor( ATON.Photon.color );
        ATON.plight.color = ATON.Photon.color;

        FE.checkAuth((data)=>{
            if (data.username!==undefined /*&& ATON.Photon._username===undefined*/) ATON.Photon.setUsername(data.username);
        });
    });

    ATON.on("VRC_SceneState", (sstate)=>{
        let numUsers = ATON.Photon.getNumUsers();
        if (numUsers>1) $("#idVRCnumusers").html(numUsers);
        else $("#idVRCnumusers").html("");

        console.log("Users: "+numUsers);
    });
/*
    ATON.on("VRC_UserEnter", (uid)=>{
        let numUsers = ATON.Photon.getNumUsers();
        $("#idVRCnumusers").html(numUsers);
        console.log("Users: "+numUsers);
    });
    ATON.on("VRC_UserLeave", (uid)=>{
        let numUsers = ATON.Photon.getNumUsers();
        $("#idVRCnumusers").html(numUsers);
        console.log("Users: "+numUsers);
    });
*/
    ATON.on("VRC_Disconnected", ()=>{
        $("#btn-vrc").attr("class","atonBTN");
        // Selector color
        //ATON.MatHub.materials.selector.color = ATON.MatHub.colors.green;
        ATON.SUI.setSelectorColor(ATON.MatHub.colors.defUI);

        ATON.MediaFlow.stopAllStreams();

        $("#idVRCnumusers").html("");
    });

    FE._bVRCsetup = true;
};

/**
Add Photon button (to connect/disconnect from collaborative sessions)
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonPhoton = (idcontainer)=>{
    FE.uiAddButton(idcontainer, "vrc", ()=>{
        if (ATON.Photon.isConnected()){
            FE.popupVRC();
        }
        else {
            ATON.Photon.connect();
        }
    }, "Photon (collaborative session)");

    $("#btn-vrc").append("<span id='idVRCnumusers' class='atonVRCcounter'></span>");

    //$("<div id='idVRCchatPanel' class='atonVRCsidePanel'>xxx</div>").appendTo(document.body);
    //$("#idVRCchatPanel").append(ATON.Photon._elChat);
    FE._setupVRCevents();

    if (ATON.Photon.uid !== undefined) $("#btn-vrc").addClass( FE.getVRCclassFromID(ATON.Photon.uid) );
    else $("#btn-vrc").attr("class","atonBTN");
};

FE.uiAddButtonVRC = FE.uiAddButtonPhoton;

/**
Add user button (login/logout)
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonUser = (idcontainer)=>{
    FE.uiAddButton(idcontainer, "user", ()=>{
        FE.popupUser();
    }, "User");

    FE.checkAuth((r)=>{
        if (r.username !== undefined) $("#btn-user").addClass("switchedON");
        else $("#btn-user").removeClass("switchedON");
    });
};

FE.uiSetEditMode = (b, idcontainer)=>{
    ATON.SceneHub._bEdit = b;
    FE.uiSwitchButton("edit", b);

    let canvas = ATON._renderer.domElement;

    if (b){
        //$("body").addClass("edit");
        $("#"+idcontainer).addClass("atonToolbar-bg-edit");
    }
    else {
        //$("body").removeClass("edit");
        $("#"+idcontainer).removeClass("atonToolbar-bg-edit");
    }
};

/**
Add persistent editing mode button
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonEditMode = (idcontainer)=>{
    FE.uiAddButton(idcontainer, "edit", ()=>{
        FE.checkAuth((data)=>{
            if (data.username !== undefined){
                if (ATON.SceneHub._bEdit){
                    FE.uiSetEditMode(false, idcontainer);
                }
                else {
                    FE.uiSetEditMode(true, idcontainer);
                }

                console.log("Persistent Edit Mode: "+ATON.SceneHub._bEdit);
            }

            else {
                FE.popupUser();  
            }
        });
    }, "Persistent Edit Mode");

    if (ATON.SceneHub._bEdit) FE.uiSwitchButton("edit",true);
    else FE.uiSwitchButton("edit",false);
};

/**
Add UI Profile to the front-end
@param {string} id - profile ID
@param {function} uiFunction - function that creates UI (HTML or SUI elements) for that profile
*/
FE.uiAddProfile = (id, uiFunction)=>{
    if (typeof uiFunction !== 'function') return;

    FE._uiProfiles[id] = uiFunction;
};

/**
Load specific UI Profile for the front-end
@param {string} id - profile ID
*/
FE.uiLoadProfile = (id)=>{
    let f = FE._uiProfiles[id];
    if (f === undefined) return;

    f();
    FE._uiCurrProfile = id;
    console.log("Loaded UI Profile: "+FE._uiCurrProfile);
};

FE.getCurrentUIP = ()=>{
    return FE._uiCurrProfile;
};

FE.attachHandlerToButton = (idbutton, h)=>{
    if (h === undefined) return;

    $("#"+idbutton).click(()=>{ h(); });
};

// Attach ID validator to given input field
FE.uiAttachInputFilterID = (inputid)=>{
    $("#"+inputid).on('keyup change input', ()=>{
        let value = $("#"+inputid).val();
        let regReplace = new RegExp('[^A-Za-z0-9-_]', 'ig');
        $("#"+inputid).val( value.replace(regReplace, '') );

    });
};

// Utility to switch a node in a graph
FE.switchNode = (nid, value, type)=>{
    let N = undefined;
    
    if (type === ATON.NTYPES.SEM) N = ATON.getSemanticNode(nid);
    else N = ATON.getSceneNode(nid);

    if (N === undefined) return;

    N.toggle(value);

    ATON.fireEvent("FE_NodeSwitch", {nid: nid, t: type, v: value});
    //console.log("XXX");
};

// Graphs
FE.uiCreateGraph = (type)=>{
    let nodes = ATON.snodes;
    if (type === ATON.NTYPES.SEM) nodes = ATON.semnodes;

    let htmlcontent = "";
    for (let nid in nodes){
        let N = nodes[nid];
        
        let chk = N.visible? "checked" : "";
        if (nid !== "."){
            htmlcontent += "<input type='checkbox' "+chk+" onchange=\"ATON.FE.switchNode('"+nid+"',this.checked,"+type+");\">"+nid;
            
            //TODO: gizmos
            //htmlcontent += "<div class='atonBTN atonSmallIcon' onclick=\"ATON.FE.attachGizmoToNode('"+nid+"');\"><img src='"+FE.PATH_RES_ICONS+"axes.png'></div>";
            
            htmlcontent += "<br>";
        }

        //htmlcontent += "<div class='atonBTN atonBTN-text'></div>";
    }

    return htmlcontent;
};

FE.setupBasicUISounds = ()=>{
    FE.auLib = {};

    FE.auLib.switch = new Audio(ATON.PATH_RES+"audio/switch.wav");
    FE.auLib.switch.loop = false;
};

FE.playAudioFromSemanticNode = (semid)=>{
    //if (FE._auSemNodePlaying) return;
    if (semid === undefined) return;

    let S = ATON.getSemanticNode(semid);
    if (S === undefined) return;

    let au = S.getAudio();
    if (au === undefined) return;

    if (typeof au === "string" && !au.startsWith("data:audio")){
        au = ATON.Utils.resolveCollectionURL(au);
    }

    if (FE._auSemNode === undefined || FE._auSemNode === null) FE._auSemNode = new THREE.Audio( ATON.AudioHub._listener );
    else FE._auSemNode.stop();

    ATON.AudioHub._loader.load( au, (buffer)=>{
        FE._auSemNode.setBuffer( buffer );
        FE._auSemNode.setLoop( false );
        //FE._auSemNode.setVolume( 0.5 );
        //FE._auSemNode.setPlaybackRate(0.9);
        FE._auSemNode.play();
    });

/*
    if (FE._auSemNode === undefined) FE._auSemNode = new Audio();
    
    FE._auSemNodePlaying = true;
    FE._auSemNode.src = au;
    //FE._auSemNode.type = ATON.MediaFlow.auType;
    FE._auSemNode.play();

    FE._auSemNode.onended = ()=>{
        FE._auSemNodePlaying = false;
    };
*/
};


// Popups
//===================================================================

/**
Show a modal popup.
@param {string} htmlcontent - The HTML5 content for the popup
@param {string} cssClasses - (optional) css classes for the popup
*/
FE.popupShow = (htmlcontent, cssClasses)=>{
    if (FE._bPopup) return false;

    FE._tPopup = Date.now();

    //console.log("SHOW");

    let clstr = "atonPopup ";
    if (cssClasses) clstr += cssClasses;

    let htcont = "<div id='idPopupContent' class='"+clstr+"'>";
    htcont += htmlcontent+"</div>"

    FE._bPopup = true;
    ATON._bListenKeyboardEvents = false;

    $('#idPopup').html(htcont);
    $('#idPopupContent').click((e)=>{ e.stopPropagation(); });
    $('#idPopup').show();

    if (FE.popupBlurBG > 0){
        //ATON._renderer.setPixelRatio( FE.popupBlurBG );
        ATON._renderer.domElement.style.filter = "blur("+FE.popupBlurBG+"px)"; //`blur(${blur * 5}px)`;
        //ATON._renderer.render( ATON._mainRoot, ATON.Nav._camera );
    }

    ATON._bPauseQuery = true;
    
    //ATON.renderPause();

    $("#idTopToolbar").hide();
    $("#idBottomToolbar").hide();
    $("#idBottomRToolbar").hide();
    $("#idPoweredBy").hide();

    //$("#idPopup").click( FE.popupClose );

    return true;
};

/**
Close current popup
*/
FE.popupClose = (bNoAnim)=>{
    let dt = Date.now() - FE._tPopup;
    if (dt < FE.POPUP_DT) return; // Avoid capturing unwanted tap events

    FE._bPopup = false;

    //console.log("CLOSE");

    //ATON.renderResume();
    ATON._bListenKeyboardEvents = true;
    
    if (FE.popupBlurBG > 0){
        //ATON.resetPixelDensity();
        ATON._renderer.domElement.style.filter = "none";
    }

    if (bNoAnim === true) $("#idPopup").hide();
    else $("#idPopup").hide();
    //$("#idPopup").empty();

    ATON._bPauseQuery = false;

    $("#idTopToolbar").show();
    $("#idBottomToolbar").show();
    $("#idBottomRToolbar").show();
    $("#idPoweredBy").show();

    ATON.focusOn3DView();
};

FE.subPopup = ( popupFunc )=>{
    ATON.FE.popupClose();
    //setTimeout( popupFunc, FE.POPUP_DELAY);
    popupFunc();
};

FE.popupQR = ()=>{
    let htmlcontent = "<div class='atonPopupTitle'>Share</div>";
    htmlcontent += "<div class='atonQRcontainer' id='idQRcode'></div><br><br>";

    if ( !ATON.FE.popupShow(htmlcontent) ) return;

    let url = window.location.href;
    new QRCode(document.getElementById("idQRcode"), url);
};

FE.popupScreenShot = ()=>{
    let cover = ATON.Utils.takeScreenshot(256);

    FE.checkAuth((r)=>{

        let htmlcontent = "<div class='atonPopupTitle'>Capture</div>";
        htmlcontent += "This is a preview of what your screenshot will look like:<br><br>";
        htmlcontent += "<img src='"+cover.src+"'><br>";
        htmlcontent += "Resolution: <input id='isShotSize' type='number' min='100' max='4000' value='256'>px<br>";

        htmlcontent += "<div class='atonBTN atonBTN-horizontal' id='btnScreenShot'><img src='"+FE.PATH_RES_ICONS+"sshot.png'>Screenshot</div>";

        htmlcontent += "<div class='atonBTN atonBTN-horizontal' id='btnScreenRec'><img src='"+FE.PATH_RES_ICONS+"recscreen.png'>Record video</div>";

        if (r.username !== undefined){
            htmlcontent += "<div class='atonBTN atonBTN-green atonBTN-horizontal' id='btnSetCover'>Set as Cover</div>";
            /*
            htmlcontent += "<div class='atonBTN' id='btnSetCover' style='width:220px; height:220px; padding:5px'>";
            htmlcontent += "<img src='"+cover.src+"'><br>";
            htmlcontent += "Set as Cover</div>";
            */
        }

        if ( !ATON.FE.popupShow(htmlcontent) ) return;

        if (ATON.MediaFlow._bScreenRec) $("#btnScreenRec").addClass("atonBTN-rec");
        else $("#btnScreenRec").removeClass("atonBTN-rec");

        $("#btnScreenShot").click(()=>{
            let s = parseInt( $('#isShotSize').val() );
            if (s < 100) return;

            ATON.FE.popupClose();

            let img = ATON.Utils.takeScreenshot(s,"shot.png");
        });

        $("#btnScreenRec").click(()=>{
            if (!ATON.MediaFlow._bScreenRec) ATON.MediaFlow.startScreenRecording();
            //else 

            ATON.FE.popupClose();
        });

        $("#btnSetCover").click(()=>{
            ATON.FE.popupClose();

            ATON.Utils.postJSON(ATON.PATH_RESTAPI+"cover/scene/", {sid: ATON.SceneHub.currID, img: cover.src }, (r)=>{
                console.log(r);
            });

        });
    });
};

FE.popupVRC = ()=>{
    let htmlcontent = "";
    let numUsers = ATON.Photon.getNumUsers();

    if (numUsers>1) htmlcontent += "<div class='atonPopupTitle'>Collaborative Session ("+numUsers+" users)</div>";
    else htmlcontent += "<div class='atonPopupTitle'>Collaborative Session</div>";

    htmlcontent += "<div id='idCollabTools' style='display:inline'></div>";

    // Username
    //htmlcontent += "Your username in this collaborative session is:<br>";
    htmlcontent += "<input id='idVRCusername' type='text' size='10' placeholder='username...' style='display:none'>";
    htmlcontent += "<div id='idVRCusernameBTN' class='atonBTN' style='width:150px; display:none'>"+ATON.Photon._username+"</div>";
    htmlcontent += "<div class='atonBTN atonBTN-text' id='idVRCdisconnect'><img src='"+ATON.FE.PATH_RES_ICONS+"exit.png'>LEAVE</div>";

    htmlcontent += "<div id='idChatBoxPopup' style='display:block'></div>";
    htmlcontent += "<input id='idVRCmsg' style='width:90%;margin:auto' type='text' placeholder='message...'>";

    if ( !ATON.FE.popupShow(htmlcontent, "atonPopupLarge") ) return;

    // Tools
    ATON.checkAuth((u)=>{
        console.log(u)

        if (!ATON.MediaFlow._bCamStream) ATON.FE.uiAddButton("idCollabTools", "screenshare", ()=>{
            if (!ATON.MediaFlow._bScreenStream) $("#btn-screenshare").removeClass("atonBTN-rec");
            else $("#btn-screenshare").addClass("atonBTN-rec");
    
            ATON.MediaFlow.startOrStopScreenStreaming();
            ATON.FE.popupClose();
    
        }, "Share your screen with other participants");
    
        if (!ATON.MediaFlow._bScreenStream && ATON.MediaFlow.hasVideoInput()) ATON.FE.uiAddButton("idCollabTools", "camera", ()=>{
            if (!ATON.MediaFlow._bCamStream) $("#btn-camera").removeClass("atonBTN-rec");
            else $("#btn-camera").addClass("atonBTN-rec");
    
            ATON.MediaFlow.startOrStopCameraStreaming();
            ATON.FE.popupClose();
    
        }, "Share your camera with other participants");
    
        if (ATON.MediaFlow._bScreenStream) $("#btn-screenshare").addClass("atonBTN-rec");
        else $("#btn-screenshare").removeClass("atonBTN-rec");
        if (ATON.MediaFlow._bCamStream) $("#btn-camera").addClass("atonBTN-rec");
        else $("#btn-camera").removeClass("atonBTN-rec");
    });


    if (ATON.Photon._username === undefined){
        $('#idVRCusername').show();
        $('#idVRCusernameBTN').hide();
    }
    else {
        $('#idVRCusername').val(ATON.Photon._username);
        $('#idVRCusername').hide();
        $('#idVRCusernameBTN').show();
    }

    if (ATON.Photon.uid !== undefined) $('#idVRCusernameBTN').addClass("atonVRCu"+(ATON.Photon.uid % 6));

    $("#idChatBoxPopup").append(ATON.Photon._elChat);

    $("#idVRCmsg").keypress((e)=>{
        let keycode = (e.keyCode ? e.keyCode : e.which);
        if (keycode == '13'){
            let str = $("#idVRCmsg").val();
            ATON.Photon.setMessage( str );
            $("#idVRCmsg").val("");
            //$("#idChatBox:first-child").scrollTop( $("#idChatBox:first-child").height() );
        }
    });

    $("#idVRCusername").keypress((e)=>{
        let keycode = (e.keyCode ? e.keyCode : e.which);
        if (keycode == '13'){
            let str = $("#idVRCusername").val();
            ATON.Photon.setUsername( str );
            
            $('#idVRCusername').hide();
            $('#idVRCusernameBTN').html(ATON.Photon._username);
            $('#idVRCusernameBTN').show();
        }
    });

    $("#idVRCusernameBTN").click(()=>{
        $('#idVRCusername').show();
        $('#idVRCusernameBTN').hide();
    });

    $("#idVRCdisconnect").click(()=>{
        ATON.Photon.disconnect();
        ATON.FE.popupClose();
    });
};

// User auth
FE.checkAuth = (onReceive)=>{
    ATON.Utils.checkAuth((data)=>{
        FE._userAuth = data;
        //console.log(FE._userAuth);

        if (data.username !== undefined){
            $("#btn-user").addClass("switchedON");
            if (ATON.Photon._username === undefined) ATON.Photon.setUsername(data.username);
        }
        else {
            $("#btn-user").removeClass("switchedON");
        }

        if (onReceive) onReceive(data);
    });
};

/*
FE.checkAuth = (onReceive)=>{
    $.ajax({
        type: 'GET',
        url: ATON.PATH_RESTAPI+"user",
        xhrFields: { withCredentials: true },            
        dataType: 'json',

        success: (data)=>{
            FE._userAuth = data;
            //console.log(FE._userAuth);

            if (data.username !== undefined){
                $("#btn-user").addClass("switchedON");
                if (ATON.Photon._username === undefined) ATON.Photon.setUsername(data.username);
            }
            else {
                $("#btn-user").removeClass("switchedON");
            }

            onReceive(data);
        }
    });
};
*/

/*
FE.logout = ( onSuccess )=>{
    $.get(ATON.PATH_RESTAPI+"logout", (r)=>{
        ATON.SceneHub.setEditMode(false);
        ATON.fireEvent("Logout");
        
        if (onSuccess) onSuccess();
    });
};
*/

FE.popupUser = ()=>{

    FE.checkAuth((r)=>{
        
        // We are already logged
        if (r.username !== undefined){
            let htmlcontent = "<img src='"+FE.PATH_RES_ICONS+"user.png'><br>";
            htmlcontent += "<b>'"+r.username+"'</b><br><br>";

            if (Object.keys(FE._uiProfiles).length > 0){
                htmlcontent += "UI Profile:<br><div class='select' style='width:150px;'><select id='idUIProfiles'>";

                for (let uip in FE._uiProfiles){
                    htmlcontent += "<option value='"+uip+"'>"+uip+"</option>";
                }
                htmlcontent += "</select><div class='selectArrow'></div></div><br><br>";
            }

            htmlcontent += "<div class='atonBTN atonBTN-red atonBTN-text atonBTN-horizontal' id='idLogoutBTN'>LOGOUT</div>";

            if ( !ATON.FE.popupShow(htmlcontent) ) return;

            if (FE._uiCurrProfile){
                console.log(FE._uiCurrProfile);
                $("#idUIProfiles").val(FE._uiCurrProfile);
            }

            $("#idLogoutBTN").click(()=>{
                $.get(ATON.PATH_RESTAPI+"logout", (r)=>{
                    console.log(r);

                    ATON.SceneHub.setEditMode(false);
                    FE.uiSwitchButton("edit",false);

                    ATON.fireEvent("Logout");
                    $("#btn-user").removeClass("switchedON");
                });

                ATON.FE.popupClose();
            });

            $("#idSHUscenes").click(()=>{
                ATON.Utils.goToURL("/shu/scenes/");
            });
            $("#idSHUuser").click(()=>{
                ATON.Utils.goToURL("/shu/auth/");
            });

            $("#idUIProfiles").on("change", ()=>{
                let uip = $("#idUIProfiles").val();
                FE.uiLoadProfile(uip);
                ATON.FE.popupClose();
            });

        }

        // Not logged in
        else {
            let htmlcontent = "<img src='"+FE.PATH_RES_ICONS+"user.png'><br>";
            htmlcontent += "username:<input id='idUsername' type='text' maxlength='15' size='15' ><br>";
            htmlcontent += "password:<input id='idPassword' type='password' maxlength='15' size='15' ><br>";

            htmlcontent += "<div class='atonBTN atonBTN-green atonBTN-text atonBTN-horizontal' id='idLoginBTN'>LOGIN</div>";

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
                        if (r){
                            ATON.fireEvent("Login", r);
                            $("#btn-user").addClass("switchedON");
                            ATON.FE.popupClose();
                        }
                    }

                }).fail((err)=>{
                    //console.log(err);
                    $("#idLoginBTN").html("LOGIN FAILED");
                    $("#idLoginBTN").attr("class","atonBTN atonBTN-red");
                });
            });
        }
    });
};

/*
FE.popupPOV = ()=>{
    let htmlcontent = "<h1>Viewpoint</h1>";

    htmlcontent += "<div class='select' style='width:200px;'><select id='idPOVmode'>";
    htmlcontent += "<option value='0'>Set as Home viewpoint</option>";
    htmlcontent += "<option value='1'>Add viewpoint</option>";
    htmlcontent += "</select><div class='selectArrow'></div></div>";

    htmlcontent += "<div class='atonBTN atonBTN-green' id='btnPOV' style='width:90%'>OK</div>"; // <img src='"+FE.PATH_RES_ICONS+"pov.png'>

    if ( !ATON.FE.popupShow(htmlcontent) ) return;

    let mode = $("#idPOVmode").val();
};
*/

FE.popupSceneInfo = ()=>{
    let head = ATON.SceneHub.getTitle();
    if (head === undefined) head = ATON.SceneHub.currID;

    let descr = ATON.SceneHub.getDescription();

    let htmlcontent = "<div class='atonPopupTitle'>"+head+"</div>";
    if (descr) htmlcontent += "<div class='atonPopupDescriptionContainer'>" + JSON.parse(descr) + "</div>";

    htmlcontent += "<div class='atonBTN atonBTN-green' id='btnOK' style='width:90%'>OK</div>";

    if ( !ATON.FE.popupShow(htmlcontent) ) return;

    $("#btnOK").click(()=>{
        ATON._onUserInteraction();
        ATON.FE.popupClose();
    });
};

FE.computeSelectorRanges = ()=>{
    //let sceneBS = ATON.getRootScene().getBound();
    //let r = sceneBS.radius;
    let r = ATON.bounds.radius;

    if (r <= 0.0) return;

    FE._selRanges[0] = r * 0.001;
    FE._selRefRadius = r * 0.01;
    FE._selRanges[1] = r * 0.5;

    //console.log("3D Selector ranges: "+FE._selRanges[0]+", "+FE._selRanges[1]);
};

FE.popupSelector = ()=>{
    let htmlcontent = "<div class='atonPopupTitle'>3D Selector</div>";

    let rad = ATON.SUI.getSelectorRadius();
    let hr = ATON.Utils.getHumanReadableDistance( rad );

    FE.computeSelectorRanges();

    htmlcontent += "Radius (<span id='idSelRadTxt'>"+hr+"</span>):<br>";
    htmlcontent += "<input id='idSelRad' type='range' min='"+FE._selRanges[0]+"' max='"+FE._selRanges[1]+"' step='"+FE._selRanges[0]+"' style='width:90%'>";

    if ( !ATON.FE.popupShow(htmlcontent, "atonPopupLarge") ) return;

    $("#idSelRad").val(rad);

    $("#idSelRad").on("input change",()=>{
        let r = parseFloat( $("#idSelRad").val() );

        ATON.SUI.setSelectorRadius(r);
        $("#idSelRadTxt").html( ATON.Utils.getHumanReadableDistance(r) );
    });
};

FE.popupNav = ()=>{
    let htmlcontent = "<div class='atonPopupTitle'>Navigation</div>";

    //htmlcontent += "<div id='idNavModes'></div>";

    htmlcontent += "<div style='display:block; width:90%; min-height:50px; vertical-align:top'>";
    htmlcontent +="<div style='display:inline-block; width:60px; float:left' id='idNMfp'></div>";
    htmlcontent +="<div style='text-align:left'>Switch between first-person and orbit navigation mode</div>";
    htmlcontent += "</div>";

    if (ATON.Utils.isConnectionSecure()){
        htmlcontent += "<div style='display:block; width:90%; min-height:50px; vertical-align:top'>";
        htmlcontent +="<div style='display:inline-block; width:60px; float:left' id='idNMvr'></div>";
        htmlcontent +="<div style='text-align:left'>Immersive VR mode</div>";
        htmlcontent += "</div>";

        if (ATON.Utils.isMobile()){
            htmlcontent += "<div style='display:block; width:90%; min-height:50px; vertical-align:top'>";
            htmlcontent +="<div style='display:inline-block; width:60px; float:left' id='idNMdevori'></div>";
            htmlcontent +="<div style='text-align:left'>Enable or disable device-orientation mode</div>";
            htmlcontent += "</div>";
        }
    }

    if ( !FE.popupShow(htmlcontent) ) return;

    FE.uiAddButtonFirstPerson("idNMfp");
    FE.uiAddButtonDeviceOrientation("idNMdevori");
    FE.uiAddButtonVR("idNMvr");
};

// experimental
FE.popupModalToken = (msg, func)=>{
    if (func === undefined) return;

    ATON.FE.popupClose(); // Close any existing popup

    let htmlcontent = "<div class='atonPopupTitle'>Token Required</div>";
    if (msg) htmlcontent += msg;
    htmlcontent += "<br><input id='idTokStr' style='width:90%' type='text' placeholder='paste your token here'><br>";

    htmlcontent += "<br><div class='atonBTN atonBTN-green atonBTN-horizontal atonBTN-text' id='btnTokenOK'>OK</div>";

    if ( !FE.popupShow(htmlcontent) ) return;

    $("#btnTokenOK").click(()=>{
        let tok = $("#idTokStr").val();
        if (tok === undefined || tok.length <2) return;

        ATON.FE.popupClose();

        func(tok);
    });
};

FE.popupNewNode = (type)=>{
    if (type === undefined) type = ATON.NTYPES.SCENE;

    let htmlcontent = "";

    if (type === ATON.NTYPES.SCENE) htmlcontent = "<div class='atonPopupTitle'>New Scene Node</div>";
    if (type === ATON.NTYPES.SEM) htmlcontent = "<div class='atonPopupTitle'>New Semantic Node</div>";

    htmlcontent += "<strong>ID</strong>: <input id='idNID' type='text' size='20' placeholder='node-id'><br>";
    htmlcontent += "<div class='atonBTN atonBTN-green atonBTN-horizontal atonBTN-text' id='btnNewNID'><img src='"+ATON.FE.PATH_RES_ICONS+"add.png'>Add</div><br>";

    if ( !FE.popupShow(htmlcontent) ) return;

    $("#btnNewNID").click(()=>{
        let nnid = $("#idNID").val().trim();
        if (nnid === undefined || nnid.length<3) return;

        let N = new ATON.Node(nnid, type);
        N.attachToRoot();

        // TODO: send graph edits
    });
};

export default FE;