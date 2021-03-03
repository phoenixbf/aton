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

FE.POPUP_DELAY = 300;

/**
Initialize Front-end
*/
FE.realize = ()=>{
    FE.PATH_RES_ICONS = ATON.PATH_RES+"icons/";

    FE._bPopup = false;     // showing popup
    FE.popupBlurBG = 0.5;   // blur 3D content on popup show, 0.0 to disable
    FE._userAuth = {};

    FE._bControlLight = false;
    FE._bControlSelScale = false;

    FE._auSemNode = undefined;
    FE._auSemNodePlaying = false;

    FE._bReqHome = false;   // auto-compute home

    FE._vrcAddr = undefined;

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
    if (ddens && ddens>0.0) ATON.setDefaultPixelDensity(ddens);
};

/**
Add basic front-end events such as showing spinner while loading assets and home viewpoint setup
*/
FE.addBasicLoaderEvents = ()=>{
    ATON.on("NodeRequestFired", ()=>{ $("#idLoader").show(); });
    ATON.on("AllNodeRequestsCompleted", ()=>{ 
        $("#idLoader").hide();
        
        FE.computeSelectorRanges();
        ATON.SUI.setSelectorRadius( FE._selRefRadius );

        if (FE._bReqHome) return;

        if (ATON.Nav.homePOV === undefined){
            ATON.Nav.computeAndRequestDefaultHome(0.5);
        }
        
        FE._bReqHome = true;
    });

    ATON.on("SceneJSONLoaded",()=>{
        if (ATON.Nav.homePOV !== undefined) ATON.Nav.requestHome(0.5);
        if (ATON.SceneHub.getDescription()) $("#btn-info").show();
    });

    ATON.on("frame", FE._update);
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
FE.loadSceneID = (sid)=>{
    if (sid === undefined) return;

    let reqstr = ATON.PATH_RESTAPI_SCENE + sid;
    //if (ATON.SceneHub._bEdit) reqstr += ",edit";

    ATON.SceneHub.load(reqstr, sid);

    $("meta[property=og\\:image]").attr("content", ATON.PATH_SCENES+sid+'/cover.png');
    $("meta[property=og\\:image\\:secure_url]").attr("content", ATON.PATH_SCENES+sid+'/cover.png');
    $("meta[property=og\\:image\\:type]").attr("content", "image/png");
    $("meta[property=og\\:image\\:width]").attr("content", "200");
    $("meta[property=og\\:image\\:height]").attr("content", "200");

    console.log(reqstr);
};

FE._update = ()=>{
    if (FE._bControlLight){
        let sx = ATON._screenPointerCoords.x;
        let sy = ATON._screenPointerCoords.y;
        //console.log(sx,sy);

        let D = new THREE.Vector3();
        D.x = -Math.cos(sx * Math.PI);
        D.y = -sy * 2.0;
        D.z = -Math.sin(sx * Math.PI);

        D.normalize();

        ATON.setMainLightDirection(D);
        //ATON.updateDirShadows();
    }

    if (FE._bControlSelScale){
        //let sx = ATON._screenPointerCoords.x;
        let f = ATON._screenPointerCoords.y;

        let r = ATON.SUI.mainSelector.scale.x;
        r += f;
        if (r > 0.0001) ATON.SUI.setSelectorRadius(r);
    }
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
    //if (!ATON.Utils.isVRsupported()) return; //Not showing on mobile

    //ATON.XR.setSessionType("immersive-ar");

    FE.uiAddButton(idcontainer, "vr", ATON.XR.toggle, "Immersive VR mode" );
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
Add talk button (VRoadcast)
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonTalk = (idcontainer)=>{
    if (!ATON.Utils.isConnectionSecure()) return;

    FE.uiAddButton(idcontainer, "talk", ()=>{
        if (ATON.MediaRec.isAudioRecording()){
            ATON.MediaRec.stopMediaStreaming();
            //FE.uiSwitchButton("talk",false);
            $("#btn-talk").removeClass("atonBTN-rec");
        }
        else {
            ATON.MediaRec.startMediaStreaming();
            //FE.uiSwitchButton("talk",true);
            $("#btn-talk").addClass("atonBTN-rec");
        }
    }, "Talk ON/OFF");

    if (ATON.MediaRec.isAudioRecording()) $("#btn-talk").addClass("atonBTN-rec");
    else $("#btn-talk").removeClass("atonBTN-rec");
};

/**
Add focus stream button (VRoadcast)
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonStreamFocus = (idcontainer)=>{

    FE.uiAddButton(idcontainer, "focus", ()=>{
        if (ATON.VRoadcast._bStreamFocus){
            ATON.VRoadcast.setFocusStreaming(false);
            $("#btn-focus").removeClass("atonBTN-rec");
        }
        else {
            ATON.VRoadcast.setFocusStreaming(true);
            $("#btn-focus").addClass("atonBTN-rec");
        }
    }, "Focus streaming ON/OFF");

    if (ATON.VRoadcast._bStreamFocus) $("#btn-focus").addClass("atonBTN-rec");
    else $("#btn-focus").removeClass("atonBTN-rec");
};

/**
Add QR-code button
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonQR = (idcontainer)=>{
    FE.uiAddButton(idcontainer,"qr", FE.popupQR, "QR-code" );
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

// Get css class from vrc ID
FE.getVRCclassFromID = (uid)=>{
    let i = (uid%6);
    return "atonVRCu"+i;
};

/**
Add VRoadcast button (to connect/disconnect from collaborative sessions)
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonVRC = (idcontainer)=>{
    FE.uiAddButton(idcontainer, "vrc", ()=>{
        if (ATON.VRoadcast.isConnected()){
            FE.popupVRC();
        }
        else {
            ATON.VRoadcast.connect(FE._vrcAddr);
        }
    }, "VRoadcast (collaborative session)");

    $("#btn-vrc").append("<span id='idVRCnumusers' class='atonVRCcounter'></span>");

    //$("<div id='idVRCchatPanel' class='atonVRCsidePanel'>xxx</div>").appendTo(document.body);
    //$("#idVRCchatPanel").append(ATON.VRoadcast._elChat);

    ATON.on("VRC_IDassigned", (uid)=>{
        $("#btn-vrc").addClass( FE.getVRCclassFromID(uid) );

        // Selector color
        //ATON.MatHub.materials.selector.color = ATON.VRoadcast.ucolors[uid%6];
        ATON.SUI.setSelectorColor(ATON.VRoadcast.ucolors[uid%6]);

        FE.checkAuth((data)=>{
            if (data.username!==undefined /*&& ATON.VRoadcast._username===undefined*/) ATON.VRoadcast.setUsername(data.username);
        });
    });

    ATON.on("VRC_SceneState", (sstate)=>{
        let numUsers = ATON.VRoadcast.getNumUsers();
        if (numUsers>1) $("#idVRCnumusers").html(numUsers);
        else $("#idVRCnumusers").html("");

        console.log("Users: "+numUsers);
    });
/*
    ATON.on("VRC_UserEnter", (uid)=>{
        let numUsers = ATON.VRoadcast.getNumUsers();
        $("#idVRCnumusers").html(numUsers);
        console.log("Users: "+numUsers);
    });
    ATON.on("VRC_UserLeave", (uid)=>{
        let numUsers = ATON.VRoadcast.getNumUsers();
        $("#idVRCnumusers").html(numUsers);
        console.log("Users: "+numUsers);
    });
*/
    ATON.on("VRC_Disconnected", ()=>{
        $("#btn-vrc").attr("class","atonBTN");
        // Selector color
        //ATON.MatHub.materials.selector.color = ATON.MatHub.colors.green;
        ATON.SUI.setSelectorColor(ATON.MatHub.colors.defUI);

        $("#idVRCnumusers").html("");
    });

    if (ATON.VRoadcast.uid !== undefined) $("#btn-vrc").addClass( FE.getVRCclassFromID(ATON.VRoadcast.uid) );
    else $("#btn-vrc").attr("class","atonBTN");
};

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

/**
Add persistent editing mode button
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonEditMode = (idcontainer)=>{
    FE.uiAddButton(idcontainer, "edit", ()=>{
        FE.checkAuth((data)=>{
            if (data.username !== undefined){
                ATON.SceneHub._bEdit = !ATON.SceneHub._bEdit;
                FE.uiSwitchButton("edit",ATON.SceneHub._bEdit);
            }

            else {
                FE.popupUser();  
            }
        });
    });
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
        if (nid !== ".") htmlcontent += "<input type='checkbox' "+chk+" onchange=\"ATON.FE.switchNode('"+nid+"',this.checked,"+type+");\">"+nid+"<br>";
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
    //FE._auSemNode.type = ATON.MediaRec.auType;
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

    let clstr = "atonPopup ";
    if (cssClasses) clstr += cssClasses;

    let htcont = "<div id='idPopupContent' class='"+clstr+"'>";
    htcont += htmlcontent+"</div>"

    $('#idPopup').html(htcont);
    $('#idPopupContent').click((e)=>{ e.stopPropagation(); });
    $('#idPopup').fadeIn(FE.POPUP_DELAY);

    FE._bPopup = true;

    ATON._bListenKeyboardEvents = false;

    if (FE.popupBlurBG > 0.0){
        ATON._renderer.setPixelRatio( FE.popupBlurBG );
        ATON._renderer.render( ATON._mainRoot, ATON.Nav._camera );
    }

    ATON._bPauseQuery = true;
    
    //ATON.renderPause();

    $("#idTopToolbar").hide();
    $("#idBottomToolbar").hide();
    $("#idBottomRToolbar").hide();
    $("#idPoweredBy").hide();

    return true;
};

/**
Close current popup
*/
FE.popupClose = (bNoAnim)=>{
    FE._bPopup = false;

    //ATON.renderResume();
    ATON._bListenKeyboardEvents = true;
    
    if (FE.popupBlurBG > 0.0) ATON.resetPixelDensity();

    if (bNoAnim === true) $("#idPopup").hide();
    else $("#idPopup").fadeOut(FE.POPUP_DELAY);
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
    setTimeout( popupFunc, ATON.FE.POPUP_DELAY);
};

FE.popupQR = ()=>{
    let htmlcontent = "<div class='atonPopupTitle'>Share</div>";
    htmlcontent += "<div class='atonQRcontainer' id='idQRcode'></div><br><br>";

    if ( !ATON.FE.popupShow(htmlcontent) ) return;

    let url = window.location.href;
    new QRCode(document.getElementById("idQRcode"), url);
};

FE.popupScreenShot = ()=>{
    let cover = ATON.Utils.takeScreenshot(200);

    FE.checkAuth((r)=>{

        let htmlcontent = "<div class='atonPopupTitle'>Screenshot</div>";
        htmlcontent += "This is a preview of what your screenshot will look like:<br><br>";
        htmlcontent += "<img src='"+cover.src+"'><br>";
        htmlcontent += "Resolution: <input id='isShotSize' type='number' min='100' max='4000' value='200'>px<br>";

        htmlcontent += "<div class='atonBTN atonBTN-green' id='btnScreenShot' style='width:90%'><img src='"+FE.PATH_RES_ICONS+"sshot.png'>SHOT</div>";

        if (r.username !== undefined){
            htmlcontent += "<div class='atonBTN atonBTN-green' id='btnSetCover' style='width:90%'>Set as Cover</div>";
            /*
            htmlcontent += "<div class='atonBTN' id='btnSetCover' style='width:220px; height:220px; padding:5px'>";
            htmlcontent += "<img src='"+cover.src+"'><br>";
            htmlcontent += "Set as Cover</div>";
            */
        }

        if ( !ATON.FE.popupShow(htmlcontent) ) return;

        $("#btnScreenShot").click(()=>{
            ATON.FE.popupClose();

            let s = parseInt( $('#isShotSize').val() );
            let img = ATON.Utils.takeScreenshot(s,"shot.png");
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
    let numUsers = ATON.VRoadcast.getNumUsers();

    if (numUsers>1) htmlcontent += "<div class='atonPopupTitle'>Collaborative Session ("+numUsers+" users)</div>";
    else htmlcontent += "<div class='atonPopupTitle'>Collaborative Session</div>";

    // Username
    //htmlcontent += "Your username in this collaborative session is:<br>";
    htmlcontent += "<input id='idVRCusername' type='text' size='10' placeholder='username...' style='display:none'>";
    htmlcontent += "<div id='idVRCusernameBTN' class='atonBTN' style='width:150px; display:none'>"+ATON.VRoadcast._username+"</div>";

    htmlcontent += "<div id='idChatBox' style='width:100%; height:150px; text-align:left;' class='scrollableY'></div>";

    //htmlcontent += "<div style='text-align:left'>";
    htmlcontent += "<input id='idVRCmsg' style='width:90%' type='text' placeholder='message...'>";
    //htmlcontent += "</div>";

    htmlcontent += "<div class='atonBTN' id='idVRCdisconnect' style='width:90%'>LEAVE</div>";

    if ( !ATON.FE.popupShow(htmlcontent, "atonPopupLarge") ) return;

    if (ATON.VRoadcast._username === undefined){
        $('#idVRCusername').show();
        $('#idVRCusernameBTN').hide();
    }
    else {
        $('#idVRCusername').val(ATON.VRoadcast._username);
        $('#idVRCusername').hide();
        $('#idVRCusernameBTN').show();
    }

    if (ATON.VRoadcast.uid !== undefined) $('#idVRCusernameBTN').addClass("atonVRCu"+(ATON.VRoadcast.uid % 6));

    $("#idChatBox").append(ATON.VRoadcast._elChat);

    $("#idVRCmsg").keypress((e)=>{
        let keycode = (e.keyCode ? e.keyCode : e.which);
        if (keycode == '13'){
            let str = $("#idVRCmsg").val();
            ATON.VRoadcast.setMessage( str );
            $("#idVRCmsg").val("");
            //$("#idChatBox:first-child").scrollTop( $("#idChatBox:first-child").height() );
        }
    });

    $("#idVRCusername").keypress((e)=>{
        let keycode = (e.keyCode ? e.keyCode : e.which);
        if (keycode == '13'){
            let str = $("#idVRCusername").val();
            ATON.VRoadcast.setUsername( str );
            
            $('#idVRCusername').hide();
            $('#idVRCusernameBTN').html(ATON.VRoadcast._username);
            $('#idVRCusernameBTN').show();
        }
    });

    $("#idVRCusernameBTN").click(()=>{
        $('#idVRCusername').show();
        $('#idVRCusernameBTN').hide();
    });

    $("#idVRCdisconnect").click(()=>{
        ATON.VRoadcast.disconnect();
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
            if (ATON.VRoadcast._username === undefined) ATON.VRoadcast.setUsername(data.username);
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
                if (ATON.VRoadcast._username === undefined) ATON.VRoadcast.setUsername(data.username);
            }
            else {
                $("#btn-user").removeClass("switchedON");
            }

            onReceive(data);
        }
    });
};
*/

FE.popupUser = ()=>{

    FE.checkAuth((r)=>{
        
        // We are already logged
        if (r.username !== undefined){
            let htmlcontent = "<img src='"+FE.PATH_RES_ICONS+"user.png'><br>";
            htmlcontent += "<b>'"+r.username+"'</b><br><br>";

            if (Object.keys(FE._uiProfiles)){
                htmlcontent += "UI Profile:<br><div class='select' style='width:150px;'><select id='idUIProfiles'>";

                for (let uip in FE._uiProfiles){
                    htmlcontent += "<option value='"+uip+"'>"+uip+"</option>";
                }
                htmlcontent += "</select><div class='selectArrow'></div></div><br><br>";
            }

            htmlcontent += "<div class='atonBTN atonBTN-red' id='idLogoutBTN' style='width:90%'>LOGOUT</div>";

            if ( !ATON.FE.popupShow(htmlcontent) ) return;

            if (FE._uiCurrProfile){
                console.log(FE._uiCurrProfile);
                $("#idUIProfiles").val(FE._uiCurrProfile);
            }

            $("#idLogoutBTN").click(()=>{
                $.get(ATON.PATH_RESTAPI+"logout", (r)=>{
                    console.log(r);
                    ATON.SceneHub.setEditMode(false);
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

            htmlcontent += "<div class='atonBTN atonBTN-green' id='idLoginBTN' style='width:90%'>LOGIN</div>";

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
        ATON.FE.popupClose();
    });
};

FE.computeSelectorRanges = ()=>{
    let sceneBS = ATON.getRootScene().getBound();
    let r = sceneBS.radius;

    if (r <= 0.0) return;

    FE._selRanges[0] = r * 0.001;
    FE._selRefRadius = r * 0.02;
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

export default FE;