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
    UI.addButton("idTopToolbar","fullscreen", ATON.toggleFullScreen );
    if (ATON.Utils.isConnectionSecure()) UI.addButton("idTopToolbar","vr", ATON.XR.toggle );

    UI.addButton("idBottomToolbar","home", ()=>{ ATON.Nav.requestHome(0.1); });
};

// TODO:
UI.button = ()=>{

};


export default UI;