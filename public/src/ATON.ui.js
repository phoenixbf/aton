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
    if (!window.bootstrap) return;

    UI.PATH_RES_ICONS = ATON.PATH_RES+"icons/";

    UI._bModal     = false;
    UI._bSidePanel = false;

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

/*===============================
    Base setup
===============================*/
UI._setupBase = ()=>{
    document.body.oncontextmenu = UI.onContextMenu;

    // Defaults to dark
    document.body.setAttribute("data-bs-theme","dark");

    // Central overlay (spinners, etc.)
    UI.elCenteredOverlay = UI._createElemementFromHTMLString(`
        <div class="d-flex align-items-center justify-content-center aton-centered-container">
            <div class="spinner-border aton-spinner" role="status"><span class="visually-hidden">Loading...</span></div>
        </div>
	`);

    document.body.append( UI.elCenteredOverlay );
    UI.hideCenteredOverlay();

    // Centralized modal dialog
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


    // Centralized side panel
    UI.elSidePanel = UI._createElemementFromHTMLString(`
        <div class="offcanvas offcanvas-end aton-std-bg" tabindex="-1" aria-labelledby="offcanvasExampleLabel"></div>
	`); // offcanvas-md

    UI.sidepanel = new bootstrap.Offcanvas(UI.elSidePanel);
    document.body.append(UI.elSidePanel);

/*
    TO REMOVE


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

/*========================================
    Centered overlay (loading, etc.)
========================================*/
UI.showCenteredOverlay = (options)=>{
    UI.elCenteredOverlay.classList.add("d-flex");
    UI.elCenteredOverlay.classList.remove("d-none");
};

UI.hideCenteredOverlay = ()=>{
    UI.elCenteredOverlay.classList.remove("d-flex");
    UI.elCenteredOverlay.classList.add("d-none");
};

/*===============================
    Main Modal (popup)
===============================*/
UI.showModal = (options)=>{
    if (!options) return;

    // Clear
    UI.elModalContent.innerHTML = "";

    if (options.header){
        let el = document.createElement('div');
        el.classList.add("modal-header");
        //el.append(options.header);

        el.innerHTML = "<h4 class='modal-title' id='staticBackdropLabel'>"+options.header+"</h4><button type='button' class='btn-close' data-bs-dismiss='modal' aria-label='Close'></button>";

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
    UI._bModal = true;
};

UI.closeModal = ()=>{
    UI.modal.hide();
    UI._bModal = false;
};

/*===============================
    Side panel
===============================*/
UI.showSidePanel = (options)=>{
    if (!options) return;

    UI.elSidePanel.innerHTML = "";

    if (options.header){
        let el = document.createElement('div');
        el.classList.add("offcanvas-header");

        el.innerHTML = "<h4 class='offcanvas-title' id='staticBackdropLabel'>"+options.header+"</h4><button type='button' class='btn-close' data-bs-dismiss='offcanvas' aria-label='Close'></button>";

        UI.elSidePanel.append(el);
    }

    if (options.body){
        let el = document.createElement('div');
        el.classList.add("offcanvas-body");

        el.append(options.body);

        UI.elSidePanel.append(el);
    }

    UI.sidepanel.show();
    UI._bSidePanel = true;
};

UI.closeSidePanel = ()=>{
    UI.sidepanel.hide();
    UI._bSidePanel = false;
};

/*===============================
    Utilities
===============================*/
UI.loadPartial = (src, elParent, bPrepend, onComplete)=>{
    $.get(src, (data)=>{
        if (!elParent){
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

/**
Create a button (icon and/or text)
@param {object} options  - UI options object
@returns {HTMLElement}
*/
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

/*
UI.createTabGroup = (options)=>{
    let el = document.createElement('ul');
    el.classList.add("nav","nav-tabs","nav-justified");
    el.setAttribute("role","tablist");

    return el;
};
*/

export default UI;
