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

    UI._bSemL = false; // Hovering semantic shape or mask

    UI._setupBase();
};

// Utility function to create DOM element from string
UI.createElemementFromHTMLString = (html)=>{
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
    UI.elCenteredOverlay = UI.createElemementFromHTMLString(`
        <div class="d-flex align-items-center justify-content-center aton-centered-container">
            <div class="spinner-border aton-spinner" role="status"><span class="visually-hidden">Loading...</span></div>
        </div>
	`);

    document.body.append( UI.elCenteredOverlay );
    UI.hideCenteredOverlay();
    
    // 2D labels
    //UI.elLabelCon = UI.createElemementFromHTMLString(`<div class='aton-floating-label-container'></div>`);
    UI.elLabelCon = document.createElement('div');
    UI.elLabelCon.classList.add("aton-floating-label-container");

    //UI.elLabel    = UI.createElemementFromHTMLString("<div class='aton-floating-label'></div>");
    UI.elLabel = document.createElement('div');
    UI.elLabel.classList.add("aton-floating-label");

    UI.elLabelCon.append(UI.elLabel);
    document.body.prepend( UI.elLabelCon );
    UI.hideSemLabel();

    // Centralized modal dialog
    UI.elModal = UI.createElemementFromHTMLString(`
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
    UI.elSidePanel = UI.createElemementFromHTMLString(`
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

UI.hideModal = ()=>{
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

UI.hideSidePanel = ()=>{
    UI.sidepanel.hide();
    UI._bSidePanel = false;
};

/*===============================
    Utilities
===============================*/

UI.addBasicEvents = ()=>{
    ATON.on("NodeRequestFired", ()=>{
        UI.showCenteredOverlay();
    });

    ATON.on("AllNodeRequestsCompleted", ()=>{ 
        UI.hideCenteredOverlay();
    });

    // Semantic
    ATON.on("SemanticNodeHover", (semid)=>{
        let S = ATON.getSemanticNode(semid);
        if (S === undefined) return;

        UI.showSemLabel(semid);

        S.highlight();
        $('canvas').css({ cursor: 'pointer' });

        if (ATON.SUI.gSemIcons) ATON.SUI.gSemIcons.hide();
    });
    ATON.on("SemanticNodeLeave", (semid)=>{
        let S = ATON.getSemanticNode(semid);
        if (S === undefined) return;

        UI.hideSemLabel();

        S.restoreDefaultMaterial();
        $('canvas').css({ cursor: 'grab' });

        if (ATON.SUI.gSemIcons) ATON.SUI.gSemIcons.show();
    });

    ATON.on("SemanticMaskHover", semid => {
        UI.showSemLabel(semid);
        $('canvas').css({ cursor: 'pointer' }); // 'crosshair'
    });
    ATON.on("SemanticMaskLeave", semid => {
        UI.hideSemLabel();
        $('canvas').css({ cursor: 'grab' });
    });

    ATON.addUpdateRoutine( UI.update );
};

// Main UI Update routine
UI.update = ()=>{
    if (UI._bSemL && !ATON.XR._bPresenting){
        let x = ((ATON._screenPointerCoords.x)*0.5) * window.innerWidth; //FE._canvas.width;
        let y = ((1.0 - ATON._screenPointerCoords.y)*0.5) * window.innerHeight; //FE._canvas.height;
        y -= 35;

        UI.elLabel.style.transform = "translate("+x+"px, "+y+"px)";
    }
};

// Semantic 2D Label
UI.showSemLabel = (text)=>{
    UI.elLabel.innerHTML = text;
    UI.elLabel.style.display = "inline-block";
    UI._bSemL = true;
};
UI.hideSemLabel = ()=>{
    UI.elLabel.style.display = "none";
    UI._bSemL = false;
};

// Append or prepend HTML fragment to DOM
// TODO: remove jquery?
UI.loadPartial = (src, parentid, bPrepend, onComplete)=>{
    $.get(src, (data)=>{
        if (!parentid){
            if (bPrepend) $("body").prepend(data);
            else $("body").append(data);
        }
        else {
            if (bPrepend) $("#"+parentid).prepend(data); 
            else $("#"+parentid).append(data);
        }

        if (onComplete) onComplete();
    });
};

UI.resolveIconURL = (icon)=>{
    if (icon.includes("/")) return icon;
    return UI.PATH_RES_ICONS + icon+".png";
};

/*===============================
    Items
===============================*/

/**
Create a button (icon and/or text)
- options.variant: the bootstrap variant (primary, info, etc.)
- options.text: the button text
- options.icon: the icon, if simple string will look for centralized icon resources (e.g. "home"), otherwise a provided url to image
- options.onpress: routine to launch on click

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
        el.prepend( UI.createElemementFromHTMLString("<img class='icon' src='"+UI.resolveIconURL(options.icon)+"'>"));
    }

    if (options.onpress) el.onclick = options.onpress;

    return el;
};

/**
Create a tabs group.
- options.items: an array of objects (tabs) with "title" (string) and "content" (DOM element) properties. An optional "icon" can also be assigned per tab

@param {object} options  - UI options object
@returns {HTMLElement}
*/
UI.createTabsGroup = (options)=>{
    let baseid = ATON.Utils.generateID("tabgroup");

    let el = document.createElement('div');

    let eltabs = document.createElement('ul');
    eltabs.classList.add("nav","nav-justified","nav-tabs"); // "nav-underline"
    eltabs.setAttribute("role","tablist");

    let eltabcontent = document.createElement('div');
    eltabcontent.classList.add("tab-content");
    //eltabcontent.id = baseid + "tabContent";

    el.append(eltabs);
    el.append(eltabcontent);

    for (let i=0; i<options.items.length; i++){
        let e = options.items[i];

        let tabtitle   = e.title;
        let tabcontent = e.content;
        let icon       = e.icon;

        let icontab = "";
        if (icon) icontab = "<img class='icon' src='"+UI.resolveIconURL(icon)+"'>";

        let tabid = baseid+"-"+tabtitle;

        let eltab = document.createElement('li');
        eltab.classList.add("nav-item");
        eltab.setAttribute("role","presentation");

        if (i===0) 
            eltab.innerHTML = "<button class='nav-link aton-tab active' id='"+tabid+"-tab' data-bs-toggle='pill' data-bs-target='#"+tabid+"' type='button' role='tab' aria-controls='"+tabid+"' aria-selected='true'>"+icontab+tabtitle+"</button>";
        else 
            eltab.innerHTML = "<button class='nav-link aton-tab' id='"+tabid+"-tab' data-bs-toggle='pill' data-bs-target='#"+tabid+"' type='button' role='tab' aria-controls='"+tabid+"'>"+icontab+tabtitle+"</button>";

        eltabs.append(eltab);

        let eltabbody;

        if (i===0) 
            eltabbody = UI.createElemementFromHTMLString("<div class='tab-pane show active' id='"+tabid+"' role='tabpanel' aria-labelledby='"+tabid+"-tab'></div>");
        else 
            eltabbody = UI.createElemementFromHTMLString("<div class='tab-pane show' id='"+tabid+"' role='tabpanel' aria-labelledby='"+tabid+"-tab'></div>");

        eltabbody.style.padding = "10px 0px 10px 0px";

        eltabbody.append( tabcontent );
        eltabcontent.append(eltabbody);

    }

    return el;
};

export default UI;
