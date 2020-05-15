/*!
    @preserve

 	ATON FrontEnd utils

 	@author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/

ATON.FE = {};

// root paths
ATON.FE.RES_ROOT    = "../res/";
ATON.FE.MODELS_ROOT = "../collection/";
//ATON.FE.AUDIO_ROOT  = ATON.FE.RES_ROOT+"audio/";
//ATON.FE.QV_ROOT     = ATON.FE.RES_ROOT+"qv/";

ATON.FE.SCENEJSON_INT = 5000;

ATON.FE.scene = ATON.utils.getURLparams().s;
ATON.FE.vrc   = ATON.utils.getURLparams().vrc;

ATON.FE._bSceneProcessing = false;
ATON.FE._bPopup = false;

// Events
ATON.registerEvents([
    "FE_SceneJSONloaded",
    "FE_SphericalAnnotation"
]);


ATON.FE.setup = function(){

    if (document.location.protocol == 'https:') ATON.FE._bSecureConn = true;
    else ATON.FE._bSecureConn = false;
    console.log("Connection is secure: "+ATON.FE._bSecureConn);

    // custom events
    ATON.on("NodeRequestFired", ()=>{
        $('#idLoader').show();
        });

    ATON.on("AllNodeRequestsCompleted", ()=>{
        ATON.requestHome();
        $('#idLoader').hide();
        });

    ATON.on("VRmode", (b)=>{
        if (b) $('#idUIContainer').hide();
        else $('#idUIContainer').show();
        });

    $('#idSearch').on('keyup', ATON.FE.searchField );

    //document.getElementById( "idVRCpanel" ).addEventListener( 'keydown', (e)=>{ e.stopPropagation(); }, false);
    $('input').keydown((e)=>{e.stopPropagation(); });
    $('#idPopup').keydown((e)=>{e.stopPropagation(); });

    if (ATON.FE.vrc) ATON.FE.setupVRoadcast();

    //ATON._bQueryUseOcclusion = false;
};

// VRoadcast
ATON.FE.setUserName = function(){
    ATON.vroadcast.setUserName($('#vrcName').val());
    $('#vrcName').hide();
};

ATON.FE.setUserMessage = function(){
    ATON.vroadcast.setStatus($('#vrcMessage').val());
    $('#vrcMessage').val("");
};

ATON.FE.getUserColorString = function(uid, plight){
    let ucolor = ATON.vroadcast.UCOLORS[uid%6].slice(0);
    if (plight){
        ucolor[0] = ATON.utils.lerp(ucolor[0],1.0, plight);
        ucolor[1] = ATON.utils.lerp(ucolor[1],1.0, plight);
        ucolor[2] = ATON.utils.lerp(ucolor[2],1.0, plight);
    }

    return (ucolor[0]*255.0+","+ucolor[1]*255.0+","+ucolor[2]*255.0);
};

ATON.FE.setupVRoadcast = function(){
    let vrcIP = ATON.FE.vrc;
    ATON.vroadcast.setupResPath(ATON.FE.RES_ROOT);
    ATON.vroadcast.setUserModel(ATON.vroadcast.resPath+"assets/user/head-zs.osgjs");

    ATON.vroadcast.initMediaRecorder();

    if (vrcIP.length < 3) vrcIP = window.location.hostname;

    ATON.vroadcast.uStateFreq = 0.05;
    let scenename = ATON.FE.scene;
    
/*
    if (document.location.protocol == 'https:') ATON.vroadcast.connect("https://"+vrcIP+":"+ATON.vroadcast.PORT+"/", scenename, true);
    else ATON.vroadcast.connect("http://"+vrcIP+":"+ATON.vroadcast.PORT+"/", scenename, false);
*/
    ATON.vroadcast.connect(vrcIP, scenename, ATON.FE._bSecureConn);

    // VRC Events
    // We have ID
    ATON.on("VRC_IDassigned", (id)=>{
        let uid = ATON.vroadcast._myUser.id;
        let strColor = ATON.FE.getUserColorString(uid);

        $('#idUserColor').show();
        $('#idUserColor').css("cssText", "background-color: rgba("+strColor+", 0.7); box-shadow: 0 0px 30px rgba("+strColor+",1.0);" );
        $('#idUserColor').html("<b>U"+uid+"</b>");

        // disable controls for beta users
        //if (uid > 0) $('#idMagSetup').hide();

        // Custom RANK
        var rankstr = ATON.utils.getURLparams().rank;
        if (rankstr){
            var r = parseInt(rankstr);
            ATON.vroadcast.setRank(r);
            //document.getElementById("urank").max = r;
            }

        $('#idVRCchat').append("<div><i>You (ID:"+uid+") entered scene '"+scenename+"'</i></div>");
        });

    // Disconnection
    ATON.on("VRC_Disconnect", function(){
        ATON.vroadcast.users = [];

        //$('#iContainer').css("cssText", "background-color: black !important; opacity: 0.7;");
        $('#idUserColor').css("background-color", "black");
        $('#idUserColor').html("");
        $('#idUserColor').hide();

        $('#idVRCpanel').hide();
        });

    ATON.on("VRC_UserName", (d)=>{
        //$('#idVRCchat').append("<b>"+d.name+"</b>");
        });
    ATON.on("VRC_UserMessage", (d)=>{
        var uname;
        if (d.id === ATON.vroadcast._myUser.id) uname = "YOU";
        else uname = ATON.vroadcast.users[d.id].name;

        let strColor = ATON.FE.getUserColorString(d.id, 0.5);
        
        let strchat = "<div class='atonVRCchatBlock' style='color: rgb("+strColor+")'>";
        strchat += "<span class='atonVRCchatUser' style='background-color: rgb("+strColor+")' onclick='ATON.vroadcast.snapToUser("+d.id+")'>"+uname+":</span> ";
        strchat += d.status+"</div>";

        $('#idVRCchat').append(strchat);
        });
    
    ATON.on("VRC_UserLeft", (d)=>{
        var u = ATON.vroadcast.users[d.id];
        $('#idVRCchat').append("<div><i>"+u.name+" left.</i><br></div>");
        });
    ATON.on("VRC_UserEntered", (d)=>{
        var u = ATON.vroadcast.users[d.id];
        $('#idVRCchat').append("<div><i>"+u.name+" entered.</i><br></div>");
        });

};

// UI Buttons
ATON.FE.uiToggleVRoadcastPanel = function(){
    $('#idVRCpanel').toggle();
};

ATON.FE.uiToggleVRoadcastStreaming = function(){
    if (!ATON.FE._bSecureConn) return;

    if (ATON.vroadcast){
        ATON.vroadcast.startOrStopMediaStreaming();

        if (ATON.vroadcast._bMediaStreaming) $('#idVRCau').addClass("switchedON");
        else $('#idVRCau').removeClass("switchedON");
    }
};

ATON.FE.uiAddHomeButton = function(idToolbar){
    $("#"+idToolbar).append("<button type='button' class='atonBTN' onclick='ATON.requestHome(1.0)'><img src='"+ATON.FE.RES_ROOT+"ii-inv-home.png'></button>");
};
ATON.FE.uiAddFullscreenButton = function(idToolbar){
    $("#"+idToolbar).append("<button type='button' class='atonBTN' onclick='ATON.FE.toggleFullscreen()'><img src='"+ATON.FE.RES_ROOT+"ii-inv-fs.png'></button>");
};

ATON.FE.uiAddVRButton = function(idToolbar){
    $("#"+idToolbar).append("<button type='button' class='atonBTN' onclick='ATON.toggleVR()'><img src='"+ATON.FE.RES_ROOT+"ii-inv-vr.png'></button>");
};
ATON.FE.uiAddQRButton = function(idToolbar){
    $("#"+idToolbar).append("<button type='button' class='atonBTN' onclick='ATON.FE.popupQR()'><img src='"+ATON.FE.RES_ROOT+"ii-qr.png'></button>");
};
ATON.FE.uiAddVRoadcastButton = function(idToolbar){
    $("#"+idToolbar).append("<button id='idUserColor' type='button' class='atonBTN' onclick='ATON.FE.uiToggleVRoadcastPanel()'></button>");
};

ATON.FE.uiAddVRoadcastAudioButton = function(idToolbar){
    $("#"+idToolbar).append("<button id='idVRCau' type='button' class='atonBTN' onclick='ATON.FE.uiToggleVRoadcastStreaming()'><img src='"+ATON.FE.RES_ROOT+"ii-inv-speech.png'></button>");
};


ATON.FE.toggleFirstPerson = function(){
    if (ATON._bFirstPersonMode){
        $('#idBTNfp').removeClass("switchedON");
        ATON.setFirstPersonMode(false);
        }
    else {
        $('#idBTNfp').addClass("switchedON");
        ATON.setFirstPersonMode(true);
        }
};

ATON.FE.toggleDevOri = function(){
    if (ATON._bDevOri){
        $('#idBTNDevOri').removeClass("switchedON");
        ATON.toggleDeviceOrientation(false);
        }
    else {
        $('#idBTNDevOri').addClass("switchedON");
        ATON.toggleDeviceOrientation(true);
        }
};

ATON.FE.toggleFullscreen = function(b){
    if (screenfull.enabled){
        if (b === undefined) screenfull.toggle();
        else {
            if (b) screenfull.request();
            //else
            }
        }
};

// Scene management
ATON.FE.tryLoadSceneJSON = function(sceneJSONurl){
    ATON.loadScene(sceneJSONurl, ATON.FE.onSceneJSONSuccess).fail(()=>{
        console.log("Scene JSON not found.");

        $('#idLoader').show();
        if (!ATON.FE._bSceneProcessing){
            ATON.FE._bSceneProcessing = true;
            $("#idLoader").html("<img src='"+ATON.FE.RES_ROOT+"processing.png'>");
        }
        setTimeout(()=>{
            ATON.FE.tryLoadSceneJSON(sceneJSONurl)
            }, ATON.FE.SCENEJSON_INT);
        });
};

ATON.FE.onSceneJSONSuccess = function(){
    console.log("Scene JSON found and loaded.");
    ATON.FE._bSceneProcessing = false;

    $("#idLoader").html("<img src='"+ATON.FE.RES_ROOT+"loader.png'>");

    ATON.fireEvent("FE_SceneJSONloaded");
};

// Search in descriptors
ATON.FE.search = function(string){
    if (string.length < 2) return;

    console.log("Searching "+string);

    var i = undefined;
    for (var key in ATON.descriptors){
        const D = ATON.descriptors[key];

        var keywords = key.split(" ");
        //console.log(keywords);

        for (k = 0; k < keywords.length; k++){
            var kw = keywords[k];
            if (kw.startsWith(string)) i = key;
            }
        }

    if (i){
        console.log(i);
        if (ATON.descriptors[i].onSelect) ATON.descriptors[i].onSelect();  
        else ATON.requestPOVbyDescriptor(i, 0.5);
        }
};

ATON.FE.searchField = function(){
    var string = $('#idSearch').val();
    ATON.FE.search(string);
};

// Annotations
ATON.FE.addSphericalAnnotation = function(p, r, did, content, parentdid){
    if (!did || did.length <3) return;

    let D = ATON.createDescriptorSphere(p, r, ATON.getWorldTransform().getMatrix()).as(did);
    
    if (parentdid) D.attachTo(parentdid);
    else D.attachToRoot();

    let P = ATON.getCurrentPOVcopy();
    D._eye     = P.pos;
    D._content = content;

    console.log("Added DescriptorSphere: "+did);

    ATON.fireEvent("FE_SphericalAnnotation",{
        did: did,
        con: content,
        pos: p,
        rad: r,
        eye: P.pos
        })
}

// Popups
ATON.FE.popupShow = function(htmlcontent){
    if (ATON.FE._bPopup) return false;

    $('#idPopup').html("<div class='atonPopup' id='idPopupContent'>"+htmlcontent+"</div>");

    $('#idPopupContent').click((e)=>{ e.stopPropagation(); });

    $('#idPopup').fadeIn();
    ATON.FE._bPopup = true;

    return true;
};
ATON.FE.popupClose = function(){
    $("#idPopup").fadeOut();
    ATON.FE._bPopup = false;
}


ATON.FE.popupAddAnnotation = function(parentdid){
    if (ATON._hoveredVisData === undefined) return;
    if (ATON._vrState) return;

    let htmlcontent = "<h1>New Annotation</h1>";
    htmlcontent += "Adding in ("+ATON._hoveredVisData.p[0].toFixed(2)+","+ATON._hoveredVisData.p[1].toFixed(2)+","+ATON._hoveredVisData.p[2].toFixed(2)+") with radius = "+ATON._hoverRadius+"<br><br>";

    htmlcontent += "<label for='did'>ID:</label><input id='did' type='text' maxlength='11' size='11' autofocus><br>";
    htmlcontent += "<textarea id='acontent' style='width:80%; height:50px'></textarea><br>";

    htmlcontent += "<button type='button' class='atonBTN atonBTN-green' id='idAnnOK' style='width:80%'>ADD</div>";

    if ( !ATON.FE.popupShow(htmlcontent) ) return;

    //$("#did").focus();
    //$("#did").val("");

    $("#idAnnOK").click(()=>{
        ATON.FE.popupClose();
        ATON.FE.addSphericalAnnotation(
            ATON._hoveredVisData.p, 
            ATON._hoverRadius, 
            String($("#did").val()),
            String($("#acontent").val()),
            parentdid
            );
    });
};

ATON.FE.popupAnnotationContent = function(D){
    if (!D) return;
    if (!D._content) return;

    let htmlcontent = "<h1>"+D.getUniqueID()+"</h1>";
    htmlcontent += "<div>";
    htmlcontent += D._content;
    htmlcontent += "</div><br><br>";

    if ( !ATON.FE.popupShow(htmlcontent) ) return;
};

ATON.FE.popupQR = function(){
    let htmlcontent = "<h1>Share</h1>";
    htmlcontent += "<div class='atonQRcontainer' id='idQRcode'></div><br><br>";

    if ( !ATON.FE.popupShow(htmlcontent) ) return;

    let url = window.location.href;
    new QRCode(document.getElementById("idQRcode"), url);

};


// Spatial UI
ATON.FE.buildSpatialUI = function(){
    ATON.FE._infotrans = new osg.MatrixTransform();
    ATON.FE._infotrans.setCullingActive( false );

    let infoat = new osg.AutoTransform();
    //infoat.setPosition([0,-0.5,0]);
    infoat.setAutoRotateToScreen(true);
    infoat.setAutoScaleToScreen(true);

/*
    infoat.getOrCreateStateSet().setRenderingHint('TRANSPARENT_BIN');
    infoat.getOrCreateStateSet().setAttributeAndModes(
        new osg.BlendFunc(osg.BlendFunc.SRC_ALPHA, osg.BlendFunc.ONE_MINUS_SRC_ALPHA), 
        osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE
        );

    ATON.FE._infotrans.getOrCreateStateSet().setRenderingHint('TRANSPARENT_BIN');
    ATON.FE._infotrans.getOrCreateStateSet().setAttributeAndModes(
        new osg.BlendFunc(osg.BlendFunc.SRC_ALPHA, osg.BlendFunc.ONE_MINUS_SRC_ALPHA), 
        osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE
        );
*/

    let df = new osg.Depth( osg.Depth.ALWAYS );
    df.setRange(0.0,1.0);
    df.setWriteMask(false); // important
    ATON.FE._infotrans.getOrCreateStateSet().setAttributeAndModes( df, osg.StateAttribute.ON | osg.StateAttribute.PROTECTED);
    //ATON.FE._infotrans.getOrCreateStateSet().setRenderBinDetails(33, 'RenderBin');

    // BG
    let bgHoffset = 1.0;
    let bg = osg.createTexturedQuadGeometry(
        -75.0, -25.0, bgHoffset,      // corner
        150, 0, 0,       // width
        0, 50, 0 );     // height

    bg.getOrCreateStateSet().setTextureAttributeAndModes(0, ATON.utils.createFillTexture([0,0,0,0.5]));
    infoat.addChild( bg );
    //infoat.getOrCreateStateSet().setRenderBinDetails(33, 'RenderBin');

    // text
    ATON.FE._infotext = new osgText.Text("label");
    ATON.FE._infotext.setForcePowerOfTwo(true);
    ATON.FE._infotext.setFontResolution(32);
    ATON.FE._infotext.setCharacterSize( 40.0 );
    ATON.FE._infotext.setPosition( [0.0,0.0,2.0] );
    ATON.FE._infotext.setColor([1,1,1,1]);
    
    infoat.addChild( ATON.FE._infotext );
    ATON.FE._infotrans.addChild(infoat);
    
    ATON._rootUI.addChild(ATON.FE._infotrans);

    ATON.FE.switchInfoNode(false);
};

ATON.FE.switchInfoNode = function(b){
    if (b) ATON.FE._infotrans.setNodeMask(ATON_MASK_UI);
    else ATON.FE._infotrans.setNodeMask(0x0);
};

ATON.FE.updateInfoNodeLocation = function(p){
    let M = ATON.FE._infotrans.getMatrix();
    osg.mat4.setTranslation(M, p);
};

ATON.FE.setMainLabelText = function(text, color){
    ATON.FE._infotext.setText(text);
    if (color) ATON.FE._infotext.setColor(color);
};