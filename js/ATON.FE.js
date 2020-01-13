/*!
    @preserve

 	ATON FrontEnd utils

 	@author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/

ATON.FE = {};

// root paths
ATON.FE.RES_ROOT    = "../res/";
ATON.FE.MODELS_ROOT = "../models/";
ATON.FE.AUDIO_ROOT  = ATON.FE.RES_ROOT+"audio/";
ATON.FE.QV_ROOT     = ATON.FE.RES_ROOT+"qv/";

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
    
    ATON.on("VRmode", function(v){
        if (v) $('#idUIContainer').hide();
        else $('#idUIContainer').show();
        });


    $('#idSearch').on('keyup', ATON.FE.searchField );
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