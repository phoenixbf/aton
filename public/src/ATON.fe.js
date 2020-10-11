/*
    ATON Front-end blueprint

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
ATON Front-end routines
@namespace FE
*/
let FE = {};


FE.realize = ()=>{
    FE.PATH_RES_ICONS = ATON.PATH_RES+"icons/";

    FE._bPopup = false;     // showing popup
    FE.bPopupBlurBG = 0.25; // blur 3D content on popup show, 0.0 to disable

    FE._bReqHome = false;   // auto-compute home

    FE.urlParams = new URLSearchParams(window.location.search);

    FE._uiSetupBase();

    ATON.realize();

    // built-in base front-end parameters
    let ddens = ATON.FE.urlParams.get('d');
    if (ddens && ddens>0.0) ATON.setDefaultPixelDensity(ddens);
};

// Add basic spinning loader
FE.addBasicLoaderEvents = ()=>{
    ATON.on("NodeRequestFired", ()=>{ $("#idLoader").show(); });
    ATON.on("AllNodeRequestsCompleted", ()=>{ 
        $("#idLoader").hide();
        
        //console.log(ATON.Nav.homePOV);

        if (FE._bReqHome) return;

        if (ATON.Nav.homePOV === undefined){
            ATON.Nav.computeAndRequestDefaultHome(0.5);
        }
        else {
            ATON.Nav.requestHome(0.5);
        }

        FE._bReqHome = true;
    });
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

FE.loadSceneID = (sid)=>{
    if (sid === undefined) return;

    let reqstr = ATON.PATH_RESTAPI_SCENE + sid;
    if (ATON.SceneHub._bEdit) reqstr += ",edit";

    ATON.SceneHub.load(reqstr, sid);
    console.log(reqstr);
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

// Add Generic button to a specific div container
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

    let htmlcode = "<button id='btn-"+iconid+"' type='button' class='atonBTN'><img src='"+iconurl+"'></button>";
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
    FE.uiAddButton(idcontainer, "vr", ATON.XR.toggle );
};
FE.uiAddButtonDeviceOrientation = (idcontainer)=>{
    if (!ATON.Utils.isConnectionSecure()) return;
    if (!ATON.Utils.isMobile()) return;

    FE.uiAddButton(idcontainer,"devori", ()=>{
        if (ATON.Nav.isDevOri()){
            ATON.Nav.setOrbitControl();
            FE.uiSwitchButton("devori",false);
        }
        else {
            ATON.Nav.setDeviceOrientationControl();
            FE.uiSwitchButton("devori",true);
        }
    });
};

FE.uiAddButtonQR = (idcontainer)=>{
    FE.uiAddButton(idcontainer,"qr", FE.popupQR );
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
        $("#btn-vrc").addClass("atonVRCu"+(uid%6));
    });

    ATON.on("VRC_Disconnected", ()=>{
        $("#btn-vrc").attr("class","atonBTN");
    });
};

// Attach ID validator to given input field
FE.uiAttachInputFilterID = (inputid)=>{
    $("#"+inputid).on('keyup change input', ()=>{
        let value = $("#"+inputid).val();
        let regReplace = new RegExp('[^A-Za-z-_]', 'ig');
        $("#"+inputid).val( value.replace(regReplace, '') );

    });
};

FE.setupBasicUISounds = ()=>{
    FE.auLib = {};

    FE.auLib.switch = new Audio(ATON.PATH_RES+"audio/switch.wav");
    FE.auLib.switch.loop = false;
};


// Popups
//===================================================================
FE.popupShow = (htmlcontent)=>{
    if (FE._bPopup) return false;

    $('#idPopup').html("<div class='atonPopup' id='idPopupContent'>"+htmlcontent+"</div>");
    $('#idPopupContent').click((e)=>{ e.stopPropagation(); });
    $('#idPopup').fadeIn();

    FE._bPopup = true;

    if (FE.bPopupBlurBG > 0.0){
        ATON._renderer.setPixelRatio( FE.bPopupBlurBG );
        ATON._renderer.render( ATON._mainRoot, ATON.Nav._camera );
    }

    ATON._bPauseQuery = true;
    //ATON.renderPause();

    $("#idTopToolbar").hide();
    $("#idBottomToolbar").hide();

    return true;
};

FE.popupClose = ()=>{
    FE._bPopup = false;

    //ATON.renderResume();
    if (FE.bPopupBlurBG > 0.0) ATON.resetPixelDensity();

    $("#idPopup").fadeOut();
    //$("#idPopup").empty();

    ATON._bPauseQuery = false;

    $("#idTopToolbar").show();
    $("#idBottomToolbar").show();

    ATON.focusOn3DView();
};

FE.popupQR = ()=>{
    let htmlcontent = "<h1>Share</h1>";
    htmlcontent += "<div class='atonQRcontainer' id='idQRcode'></div><br><br>";

    if ( !ATON.FE.popupShow(htmlcontent) ) return;

    let url = window.location.href;
    new QRCode(document.getElementById("idQRcode"), url);
};

FE.popupVRC = ()=>{
    let htmlcontent = "";
    //htmlcontent += "<h1>VRoadcast</h1>";
    htmlcontent += "<div id='idChatBox' style='width:100%; height:150px; text-align:left;' class='scrollableY'></div>";

    htmlcontent += "<input id='idVRCusername' type='text' size='10' placeholder='username...'>";
    htmlcontent += "<input id='idVRCmsg' type='text' placeholder='message...'>";
    htmlcontent += "<button type='button' class='atonBTN atonBTN-red' id='idVRCdisconnect' style='width:100%'>Leave Collaborative Session</div>";

    if ( !ATON.FE.popupShow(htmlcontent) ) return;

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
            //$("#idVRCusername").hide();
        }
    });

    $("#idVRCdisconnect").click(()=>{
        ATON.VRoadcast.disconnect();
        ATON.FE.popupClose();
    });

};


export default FE;