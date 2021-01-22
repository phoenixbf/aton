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
    FE.bPopupBlurBG = 0.5; // blur 3D content on popup show, 0.0 to disable
    FE._userAuth = {};

    FE._bControlLight = false;

    FE._auSemNode = undefined;
    FE._auSemNodePlaying = false;

    FE._bReqHome = false;   // auto-compute home

    FE.urlParams = new URLSearchParams(window.location.search);

    FE._uiSetupBase();

    ATON.realize();

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
        
        //console.log(ATON.Nav.homePOV);

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

FE.useMouseWheelToScaleSelector = (f)=>{

    if (f === undefined) f = 0.001;

    ATON.on("MouseWheel", (d)=>{
        if (ATON.Nav._controls.enableZoom === undefined) return;

        if (ATON._kModShift){
            ATON.Nav._controls.enableZoom = false;

            let r = ATON.SUI.mainSelector.scale.x;
            r += (-d*f);
            if (r > 0.0001) ATON.SUI.setSelectorRadius(r);
        }
        else {
            ATON.Nav._controls.enableZoom = true;
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
    if (ATON.SceneHub._bEdit) reqstr += ",edit";

    ATON.SceneHub.load(reqstr, sid);
    //$('meta[property=og\\:image]').attr('content', ATON.PATH_SCENES+sid+'/cover.png');

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
*/
FE.uiAddButton = (idcontainer, icon, onPress)=>{
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

    let htmlcode = "<div id='btn-"+iconid+"' class='atonBTN'><img src='"+iconurl+"'></div>";
    $("#"+idcontainer).append(htmlcode);

    if (onPress) $("#btn-"+iconid).click( onPress );
};

FE.uiSwitchButton = (iconid, b)=>{
    if (b) $("#btn-"+iconid).addClass("switchedON");
    else $("#btn-"+iconid).removeClass("switchedON");
};

FE.uiAddButtonHome = (idcontainer)=>{
    FE.uiAddButton(idcontainer, "home", ()=>{ 
        ATON.Nav.requestHome(0.3);
    });
};

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
    });
};

FE.uiAddButtonVR = (idcontainer)=>{
    if (!ATON.Utils.isConnectionSecure()) return;
    //if (!ATON.Utils.isWebXRsupported()) return; //Not showing on mobile

    //ATON.XR.setSessionType("immersive-ar");

    FE.uiAddButton(idcontainer, "vr", ATON.XR.toggle );
};
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
    });
};

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
    });
};

FE.uiAddButtonQR = (idcontainer)=>{
    FE.uiAddButton(idcontainer,"qr", FE.popupQR );
};

FE.uiAddButtonInfo = (idcontainer)=>{
    FE.uiAddButton(idcontainer, "info", ATON.FE.popupSceneInfo);
    $("#btn-info").hide();
};

FE.uiAddButtonFullScreen = (idcontainer)=>{
    FE.uiAddButton(idcontainer, "fullscreen", ()=>{
        ATON.toggleFullScreen();
        screenfull.isFullscreen? FE.uiSwitchButton("fullscreen",false) : FE.uiSwitchButton("fullscreen",true);
    });
};

FE.uiAddButtonVRC = (idcontainer)=>{
    FE.uiAddButton(idcontainer, "vrc", ()=>{
        if (ATON.VRoadcast.isConnected()){
            FE.popupVRC();
        }
        else {
            ATON.VRoadcast.connect();
        }
    });

    ATON.on("VRC_IDassigned", (uid)=>{
        let i = (uid%6);
        $("#btn-vrc").addClass("atonVRCu"+i);
        //$("#"+idcontainer).addClass("atonVRCu"+i+"-bg");
        FE.checkAuth((data)=>{
            if (data.username!==undefined /*&& ATON.VRoadcast._username===undefined*/) ATON.VRoadcast.setUsername(data.username);
        });
    });

    ATON.on("VRC_Disconnected", ()=>{
        $("#btn-vrc").attr("class","atonBTN");
    });
};

FE.uiAddButtonUser = (idcontainer)=>{
    FE.uiAddButton(idcontainer, "user", ()=>{
        FE.popupUser();
    });
};

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

    if (FE.bPopupBlurBG > 0.0){
        ATON._renderer.setPixelRatio( FE.bPopupBlurBG );
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
    if (FE.bPopupBlurBG > 0.0) ATON.resetPixelDensity();

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

            ATON.Utils.postJSON(ATON.PATH_RESTAPI+"setcover/", {sid: ATON.SceneHub.currID, img: cover.src }, (r)=>{
                console.log(r);
            });

        });
    });
};

FE.popupVRC = ()=>{
    let htmlcontent = "";
    htmlcontent += "<div class='atonPopupTitle'>Collaborative Session</div>";

    // Username
    htmlcontent += "<input id='idVRCusername' type='text' size='10' placeholder='username...' style='display:none'>";
    htmlcontent += "<div id='idVRCusernameBTN' class='atonBTN' style='width:200px; display:none'>"+ATON.VRoadcast._username+"</div>";

    htmlcontent += "<div id='idChatBox' style='width:100%; height:150px; text-align:left;' class='scrollableY'></div>";

    //htmlcontent += "<div style='text-align:left'>";
    htmlcontent += "<input id='idVRCmsg' style='width:90%' type='text' placeholder='message...'>";
    //htmlcontent += "</div>";

    htmlcontent += "<div class='atonBTN atonBTN-red' id='idVRCdisconnect' style='width:90%'>LEAVE</div>";

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
        if(keycode == '13'){
            let str = $("#idVRCmsg").val();
            ATON.VRoadcast.setMessage( str );
            $("#idVRCmsg").val("");
            //$("#idChatBox:first-child").scrollTop( $("#idChatBox:first-child").height() );
        }
    });

    $("#idVRCusername").keypress((e)=>{
        let keycode = (e.keyCode ? e.keyCode : e.which);
        if(keycode == '13'){
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

FE.popupUser = ()=>{

    FE.checkAuth((r)=>{
        // We are already logged
        if (r.username !== undefined){
            let htmlcontent = "<img src='"+FE.PATH_RES_ICONS+"user.png'><br>";
            htmlcontent += "You are logged in as <b>'"+r.username+"'</b><br><br>";

            //htmlcontent += "<div class='atonBTN atonBTN-gray' id='idSHUuser'><img src='"+FE.PATH_RES_ICONS+"user.png'>Your profile</div>";
            //htmlcontent += "<div class='atonBTN atonBTN-gray' id='idSHUscenes'><img src='"+FE.PATH_RES_ICONS+"scene.png'>Your scenes</div>";

            htmlcontent += "<div class='atonBTN atonBTN-red' id='idLogoutBTN' style='width:90%'>LOGOUT</div>";

            if ( !ATON.FE.popupShow(htmlcontent) ) return;

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
    if (descr) htmlcontent += JSON.parse(descr);

    htmlcontent += "<div class='atonBTN atonBTN-green' id='btnOK' style='width:90%'>OK</div>";

    if ( !ATON.FE.popupShow(htmlcontent) ) return;

    $("#btnOK").click(()=>{
        ATON.FE.popupClose();
    });
};

export default FE;