/*
    ATON UI

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
A set of HTML5 utilities, buttons and other UI blueprints
@namespace UI
*/
let UI = {};

UI.init = ()=>{
    UI._bPopup = false;  // showing popup
};


UI.basicSetup = ()=>{
/*
    UI.addButton("idTopToolbar","fullscreen", ATON.toggleFullScreen );
    if (ATON.Utils.isConnectionSecure()) UI.addButton("idTopToolbar","vr", ATON.XR.toggle );

    UI.addButton("idBottomToolbar","home", ()=>{ ATON.Nav.requestHome(0.1); });
*/
};

// TODO:
UI.button = (id, onpress, icon, text, tooltip)=>{
    if (icon && !icon.includes(".")) icon = ATON.FE.PATH_RES_ICONS+icon+".png";

    let domEL = document.createElement('div');
    if (id) domEL.id = id;

    if (text) domEL.className = "atonBTN atonBTN-text";
    else domEL.className = "atonBTN";

    if (icon) domEL.innerHTML = "<img src='"+icon+"'>";
    if (text) domEL.innerHTML += text;

    if (tooltip) domEL.title = tooltip;

    let el = $(domEL);

    if (onpress) el.bind("click", onpress);

    return el;
};


export default UI;