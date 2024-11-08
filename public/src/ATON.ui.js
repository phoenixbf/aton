/*
    ATON UI

    authors:
        bruno.fanini_AT_cnr.it
        nicolo.paraciani_AT_cnr.it
        marcello.massidda_AT_cnr.it

===========================================================*/

/**
A set UI blueprints for ATON apps, based on Bootstrap v5
@namespace UI
*/
let UI = {};


UI.init = ()=>{
    if (!bootstrap) return;

    UI.PATH_RES_ICONS = ATON.PATH_RES+"icons/";

    UI._setupBase();
};

// Utility function to create DOM element from string
UI._createElemementFromHTMLString = (html)=>{
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.firstElementChild;
};

// This can be possibly replaced by custom user routine
UI.onContextMenu = ()=>{
    return false;
};

// Setup base structure
UI._setupBase = ()=>{
    document.body.oncontextmenu = UI.onContextMenu;

    // Defaults to dark
    document.body.setAttribute("data-bs-theme","dark");

    // Centralized modal dialog
    //UI.elModal = document.createElement('div');
    UI.elModal = UI._createElemementFromHTMLString(`
        <div class="modal fade modal-fullscreen-md-down" id="staticBackdrop" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content aton-std-bg" id="uiModalContent"></div>
            </div>
        </div>
	`);

    UI.modal = new bootstrap.Modal(UI.elModal);

    document.body.append(UI.elModal);
    UI.elModalContent = document.getElementById("uiModalContent");

/*

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
*/
};

/*===============================
    Main Modal (popup)
===============================*/
UI.showModal = (options)=>{

    // Clear
    UI.elModalContent.innerHTML = "";

    if (options.header){
        let el = document.createElement('div');
        el.classList.add("modal-header");
        //el.append(options.header);

        el.innerHTML = "<h4 class='modal-title' id='staticBackdropLabel'>"+options.header+"</h4>";

        UI.elModalContent.append( el );
    }
    if (options.body){
        let el = document.createElement('div');
        el.classList.add("modal-body");
        el.append(options.body);

        UI.elModalContent.append( el );
    }
    if (options.footer){
        let el = document.createElement('div');
        el.classList.add("modal-footer");
        el.append(options.footer);

        UI.elModalContent.append( el );
    }

    UI.modal.show();
};

UI.closeModal = ()=>{
    UI.modal.hide();
};

/*===============================
    Utilities
===============================*/
UI.loadPartial = (src, elParent, bPrepend)=>{
    $.get(src, (data)=>{
        if (!parentid){
            if (bPrepend) document.body.prepend(data);
            else document.body.append(data);
        }
        else {
            if (bPrepend) elParent.prepend(data); 
            else elParent.append(data);
        }

        if (onComplete) onComplete();
    });
};

/*
// Semantic 2D Label
UI.showSemLabel = (text)=>{
    $(UI._elLabel).html(text); 
    $(UI._elLabel).show();
};
UI.hideSemLabel = ()=>{
    $(UI._elLabel).hide();
    $(UI._elLabel).html("");
};
*/

/*===============================
    Items
===============================*/

UI.createButton = (options)=>{
    let el = document.createElement('button');
    el.classList.add("btn", "aton-btn");
    el.setAttribute("type","button");

    if (options.variant) el.classList.add("btn-"+options.variant); // Bootstrap button variants (primary, info, ...)

    if (options.text) el.innerText = options.text;

    if (options.icon){
        let iconsrc = UI.PATH_RES_ICONS + options.icon+".png";
        if (options.icon.includes("/")) iconsrc = options.icon; // a path is given

        el.prepend( UI._createElemementFromHTMLString("<img class='icon' src='"+iconsrc+"'>"));
    }

    if (options.onpress) el.onclick = options.onpress;

    return el;
};

UI.createCard = (options)=>{

};

export default UI;
