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
    "FE_SceneJSONloaded"
]);



// multi-user colors
ATON.FE.uColors = [
    '255, 0, 0',
    '255, 255, 0',
    '0, 255, 0',
    '0, 255, 255',
    '0, 0, 255',
    '255, 0, 255'
];

ATON.FE.setup = function(){

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

    document.getElementById( "idVRCpanel" ).addEventListener( 'keydown', (e)=>{ e.stopPropagation(); }, false);

    if (ATON.FE.vrc) ATON.FE.setupVRoadcast();
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

ATON.FE.setupVRoadcast = function(){
    let vrcIP = ATON.FE.vrc;
    ATON.vroadcast.setupResPath(ATON.FE.RES_ROOT);
    ATON.vroadcast.setUserModel(ATON.vroadcast.resPath+"assets/user/head-zs.osgjs");

    if (vrcIP.length < 3) vrcIP = window.location.hostname;

    ATON.vroadcast.uStateFreq = 0.05;
    let scenename = ATON.FE.scene;
    ATON.vroadcast.connect("http://"+vrcIP+":"+ATON.vroadcast.PORT+"/", scenename);

    // VRC Events
    // We have ID
    ATON.on("VRC_IDassigned", (id)=>{
        var uid = ATON.vroadcast._myUser.id;
        var strColor = ATON.FE.uColors[uid % 6];

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
        
        $('#idVRCchat').append("<div style='color: rgb("+ATON.FE.uColors[d.id % 6]+")'><b>"+uname+":</b> "+d.status+"</div><br>");
        });
    
    ATON.on("VRC_UserLeft", (d)=>{
        var u = ATON.vroadcast.users[d.id];
        $('#idVRCchat').append("<div><i>User "+u.name+" left scene "+scenename+"</i><br></div>");
        });
    ATON.on("VRC_UserEntered", (d)=>{
        var u = ATON.vroadcast.users[d.id];
        $('#idVRCchat').append("<div><i>User "+u.name+" entered scene "+scenename+"</i><br></div>");
        });

};

// UI Buttons
ATON.FE.uiToggleVRoadcastPanel = function(){
    $('#idVRCpanel').toggle();
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
ATON.FE.addSphericalAnnotation = function(did){
    if (!did || did.length <3) return;

    let D = ATON.createDescriptorSphere(ATON._hoveredVisData.p, ATON._hoverRadius, ATON.getWorldTransform().getMatrix()).as(did);
    D.attachToRoot();

    let P = ATON.getCurrentPOVcopy();
    D.onSelect = ()=>{ ATON.requestPOV(P); };

    console.log("Added DescriptorSphere: "+did);
}

// Popups
ATON.FE.popupShow = function(htmlcontent){
    if (ATON.FE._bPopup) return false;

    $('#idPopup').html("<div class='atonPopup'>"+htmlcontent+"</div>");

    $('#idPopup').fadeIn();
    ATON.FE._bPopup = true;

    return true;
};
ATON.FE.popupClose = function(){
    $("#idPopup").fadeOut();
    ATON.FE._bPopup = false;
}


ATON.FE.popupAnnotation = function(){
    if (ATON._hoveredVisData === undefined) return;
    if (ATON._vrState) return;

    let htmlcontent = "<h1>New Annotation</h1>";
    htmlcontent += "Adding in ("+ATON._hoveredVisData.p[0].toFixed(2)+","+ATON._hoveredVisData.p[1].toFixed(2)+","+ATON._hoveredVisData.p[2].toFixed(2)+") with radius = "+ATON._hoverRadius;
    htmlcontent += "<div class='atonBTN'></div>";

    ATON.FE.popupShow(htmlcontent);
};

ATON.FE.popupQR = function(){
    let htmlcontent = "<h1>Share</h1>";
    htmlcontent += "<div class='atonQRcontainer' id='idQRcode'></div>";
    //htmlcontent += "<br><div class='wappButton wappGreen' style='display:block' onclick='REDRASK.popupClose()'>OK</div></div>";

    if ( !ATON.FE.popupShow(htmlcontent) ) return;

    let url = window.location.href;
    new QRCode(document.getElementById("idQRcode"), url);

};



// 3D Annotations
ATON.FE.showModalNote = function(){
    if (ATON._hoveredVisData === undefined) return;
    if (ATON._vrState) return;

    Swal.fire({
        title: 'New Annotation',
        text: "Adding in ("+ATON._hoveredVisData.p[0].toFixed(2)+","+ATON._hoveredVisData.p[1].toFixed(2)+","+ATON._hoveredVisData.p[2].toFixed(2)+") with radius = "+ATON._hoverRadius,
        background: '#000',
        //type: 'info',
        input: 'text',
        inputPlaceholder: 'id',
        confirmButtonText: 'ADD'
    }).then((result)=>{
        let did = result.value;
        if (!did || did.length <3) return;

        let D = ATON.createDescriptorSphere(ATON._hoveredVisData.p, ATON._hoverRadius, ATON.getWorldTransform().getMatrix()).as(did);
        D.attachToRoot();

        let P = ATON.getCurrentPOVcopy();

        D.onSelect = function(){ ATON.requestPOV(P); };

        console.log("Added DescriptorSphere: "+did);
    });

};


ATON.FE.qrcode = function(){
    let url = window.location.href;
    console.log(url);

    Swal.fire({
        //type: 'info',
        html: "<div style='text-align:center; width:260px; height:260px; display:inline-block; padding:10px;'><div id='idQR'></div></div>",
        background: '#FFF',
        //type: 'info',
        //input: 'text',
        //inputPlaceholder: 'id',
        //confirmButtonText: 'OK'
        });

    new QRCode(document.getElementById("idQR"), url);
};