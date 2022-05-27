/*
    ATON UI

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
A set of HTML5 utilities, buttons and other UI blueprints
@namespace UI
*/
let UI = {};

UI.POPUP_DT = 500; //300;



UI.init = ()=>{
    UI.PATH_RES_ICONS = ATON.PATH_RES+"icons/";

    UI._setupBase();
};

UI._setupBase = ()=>{

    document.body.oncontextmenu = ()=>{ return false; };

    return;

    // Modal popup
    UI._bPopup = false;
    UI.popupBlurBG = 0; // blur 3D canvas on popup show (in pixels), 0 to disable

    UI._elPopup = document.getElementById("idPopup");
    if (!UI._elPopup){
        UI._elPopup = document.createElement('div');
        UI._elPopup.classList.add("atonPopupContainer");
        UI._elPopup.style.display = "none";
        UI._elPopup.id = "idPopup";
        document.body.prepend(UI._elPopup);
    }

    UI._elPopupContent = document.createElement('div');
    UI._elPopupContent.classList.add("atonPopup");
    
    $(UI._elPopupContent).click((e)=>{ e.stopPropagation(); });
    UI._elPopup.appendChild(UI._elPopupContent);

    $(UI._elPopup).click( UI.popupClose );


    // Loader
    UI._elLoader = document.getElementById("idLoader");
    if (!UI._elLoader){
        UI._elLoader = document.createElement('div');
        UI._elLoader.className = "atonCenterLoader";
        UI._elLoader.style.display = "none";
        UI._elLoader.id = "idLoader";
        document.body.prepend(UI._elLoader);
    }

    UI._elLoader.innerHTML = "<img src='"+ATON.PATH_RES+"loader.png'>";

    // 2D Label
    $("body").prepend("<div class='atonPopupLabelContainer'><div id='idPopupLabel' class='atonPopupLabel'></div></div>");
    UI._elLabel = document.getElementById("idPopupLabel");
    UI.hideSemLabel();
};

UI.basicSetup = ()=>{
/*
    UI.addButton("idTopToolbar","fullscreen", ATON.toggleFullScreen );
    if (ATON.Utils.isConnectionSecure()) UI.addButton("idTopToolbar","vr", ATON.XR.toggle );

    UI.addButton("idBottomToolbar","home", ()=>{ ATON.Nav.requestHome(0.1); });
*/
};

// Semantic 2D Label
UI.showSemLabel = (text)=>{
    $(UI._elLabel).html(text); 
    $(UI._elLabel).show();
};
UI.hideSemLabel = ()=>{
    $(UI._elLabel).hide();
    $(UI._elLabel).html("");
};

//
UI.button = (options)=>{
    if (options.icon && !options.icon.includes(".")) options.icon = ATON.UI.PATH_RES_ICONS+options.icon+".png";

    let domEL = document.createElement('div');
    if (options.id) domEL.id = options.id;

    domEL.className = "atonBTN";

    if (options.icon) domEL.innerHTML = "<img src='"+options.icon+"'>";
    if (options.text) domEL.innerHTML += "<span>"+options.text+"</span>";

    if (options.tooltip) domEL.title = options.tooltip;

    let el = $(domEL);

    if (options.onpress) el.bind("click", options.onpress);

    return el;
};

// TODO:
UI.buttonFullscreen = ()=>{
    //return el;
};

UI.disclosureWidget = (options)=>{
    let domEL = document.createElement('details');
    let el = $(domEL);
    el.append(options.content);
    el.prepend("<summary>"+options.summary+"</summary>");

    return el;
};

// POPUPs
//=========
UI.popupShow = (options)=>{
    if (UI._bPopup) return false;

    UI._tPopup = Date.now();

    UI._elPopupContent.innerHTML = "";

    //if (options.bgcolor) UI._elPopupContent.

    $(UI._elPopupContent).append( "<div class='atonPopupTitle'>"+options.title+"</div>" );
    $(UI._elPopupContent).append( options.content );
    $(UI._elPopup).show();

    if (ATON._renderer && ATON._renderer.domElement && UI.popupBlurBG > 0){
        //ATON._renderer.setPixelRatio( FE.popupBlurBG );
        ATON._renderer.domElement.style.filter = "blur("+UI.popupBlurBG+"px)"; //`blur(${blur * 5}px)`;
        //ATON._renderer.render( ATON._mainRoot, ATON.Nav._camera );
    }

    ATON._bPauseQuery = true;

    $("#idTopToolbar").hide();
    $("#idBottomToolbar").hide();
    $("#idBottomRToolbar").hide();
    $("#idPoweredBy").hide();

    return true;
};

UI.popupClose = ()=>{
    let dt = Date.now() - UI._tPopup;
    if (dt < UI.POPUP_DT) return; // Avoid capturing unwanted tap events

    UI._bPopup = false;

    //ATON.renderResume();
    ATON._bListenKeyboardEvents = true;
    
    if (ATON._renderer && ATON._renderer.domElement && UI.popupBlurBG > 0){
        //ATON.resetPixelDensity();
        ATON._renderer.domElement.style.filter = "none";
    }

    $(UI._elPopup).hide();

    ATON._bPauseQuery = false;

    $("#idTopToolbar").show();
    $("#idBottomToolbar").show();
    $("#idBottomRToolbar").show();
    $("#idPoweredBy").show();

    ATON.focusOn3DView();
};

export default UI;