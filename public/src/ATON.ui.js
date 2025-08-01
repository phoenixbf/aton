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
UI._parser = new DOMParser;

UI.SCENES_SORTER = (entryA, entryB)=>{
	let a = new Date(entryA.creationDate);
	let b = new Date(entryB.creationDate);

	if (!a || !b ) return 0;

    if (a > b) return -1;
    if (b > a) return 1;

    return 0;
};


UI.init = ()=>{
    if (!window.bootstrap) return;
    if (!window.bootstrap.Offcanvas) return; // tmp hack

    UI.PATH_RES_ICONS = ATON.PATH_RES+"icons/";

    UI._bModal     = false;
    UI._bSidePanel = false;

    UI._bSemL = false; // Hovering semantic shape or mask

    UI._bReqHome = false;

    UI._setupBase();
};

UI.setTheme = (theme)=>{
    document.body.setAttribute("data-bs-theme",theme);
};

// Utility function to create DOM element from string
UI.createElementFromHTMLString = (html)=>{
    let element = UI._parser.parseFromString(html, 'text/html').body.firstElementChild;
    // TODO: compare perf with insertAdjacentHTML( 'beforeend', str );

    return element;
};

// Shorter get el by ID
UI.get = (elID)=>{
    return document.getElementById(elID);
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
    UI.setTheme("dark");

    // Central overlay (spinners, etc.)
    UI.elCenteredOverlay = UI.createElementFromHTMLString(`
        <div class="d-flex align-items-center justify-content-center aton-centered-container">
            <div class="spinner-border aton-spinner" role="status"><span class="visually-hidden">Loading...</span></div>
        </div>
	`);

    document.body.append( UI.elCenteredOverlay );
    UI.hideCenteredOverlay();
    
    // 2D labels
    //UI.elLabelCon = UI.createElementFromHTMLString(`<div class='aton-floating-label-container'></div>`);
    UI.elLabelCon = document.createElement('div');
    UI.elLabelCon.classList.add("aton-floating-label-container");

    //UI.elLabel    = UI.createElementFromHTMLString("<div class='aton-floating-label'></div>");
    UI.elLabel = document.createElement('div');
    UI.elLabel.classList.add("aton-floating-label");

    UI.elLabelCon.append(UI.elLabel);
    document.body.prepend( UI.elLabelCon );
    UI.hideSemLabel();

    // Centralized modal dialog // modal-fullscreen-md-down
    UI.elModal = UI.createElementFromHTMLString(`
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
    UI.elSidePanel = UI.createElementFromHTMLString(`
        <div class="offcanvas offcanvas-end aton-std-bg" tabindex="-1" aria-labelledby="offcanvasExampleLabel"></div>
	`); // offcanvas-md

    UI.sidepanel = new bootstrap.Offcanvas(UI.elSidePanel);
    document.body.append(UI.elSidePanel);
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

        el.innerHTML = "<h4 class='modal-title' id='staticBackdropLabel'>"+options.header+"</h4><button type='button' class='btn-close' data-bs-dismiss='modal' aria-label='Close' onclick='ATON.UI.hideModal()'></button>";

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
    // Clear
    UI.elModalContent.innerHTML = "";

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

UI.setSidePanelLeft = ()=>{
    UI.elSidePanel.classList.remove('offcanvas-end');
    UI.elSidePanel.classList.add('offcanvas-start');
}

UI.setSidePanelRight = ()=>{
    UI.elSidePanel.classList.remove('offcanvas-start');
    UI.elSidePanel.classList.add('offcanvas-end');
}



/*===============================
    Utilities
===============================*/

UI.addBasicEvents = ()=>{
    let canvas = document.querySelector('canvas');

    ATON.on("NodeRequestFired", ()=>{
        UI.showCenteredOverlay();
    });

    ATON.on("AllNodeRequestsCompleted", ()=>{ 
        UI.hideCenteredOverlay();

        // Handle home pov
        if (UI._bReqHome) return;
        if (!ATON.Nav.homePOV) ATON.Nav.computeAndRequestDefaultHome(0.5);
		ATON.Nav.requestHomePOV(0.2);
        UI._bReqHome = true;
    });

    // Semantic
    ATON.on("SemanticNodeHover", (semid)=>{
        let S = ATON.getSemanticNode(semid);
        if (S === undefined) return;

        UI.showSemLabel(semid);

        S.highlight();

        canvas.style.cursor = 'pointer';

        if (ATON.SUI.gSemIcons) ATON.SUI.gSemIcons.hide();
    });
    ATON.on("SemanticNodeLeave", (semid)=>{
        let S = ATON.getSemanticNode(semid);
        if (S === undefined) return;

        UI.hideSemLabel();

        S.restoreDefaultMaterial();
        canvas.style.cursor = 'grab';

        if (ATON.SUI.gSemIcons) ATON.SUI.gSemIcons.show();
    });

    ATON.on("SemanticMaskHover", semid => {
        UI.showSemLabel(semid);
        canvas.style.cursor = 'pointer';
    });
    ATON.on("SemanticMaskLeave", semid => {
        UI.hideSemLabel();
        canvas.style.cursor = 'grab';
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

// Append or prepend HTML fragments to DOM
UI.loadPartial = (src, parentid, bPrepend, onComplete)=>{

    fetch(src)
        .then(res => res.text())
        .then(res => {
            let elHeader = UI.createElementFromHTMLString(res);
            //let elHeader = UI._parser.parseFromString(res, 'text/html'); //.body.childNodes;

            //console.log(elHeader)

            if (!parentid){
                if (bPrepend) document.body.prepend(elHeader);
                else document.body.append(elHeader);
            }
            else {
                if (bPrepend) document.getElementById(parentid).prepend(elHeader); //document.querySelector(`#${parentid}`).prepend(elHeader); 
                else document.getElementById(parentid).append(elHeader); //document.querySelector(`#${parentid}`).append(elHeader);
            }
        })
        .catch(err => `Error fetching partial: ${err}`);

    if (onComplete) onComplete();
};

UI.resolveIconURL = (icon)=>{
    if (icon.includes("/")) return icon;
    return UI.PATH_RES_ICONS + icon+".png";
};

UI.createIcon = (iconurl)=>{
    if (iconurl.startsWith("bi-")) 
        return UI.createElementFromHTMLString("<i class='bi "+iconurl+"' style='font-size:1.5em; vertical-align:middle; margin-right:4px'></i>");
    else 
        return UI.createElementFromHTMLString("<img class='icon aton-icon' src='"+UI.resolveIconURL(iconurl)+"'>");
};

UI.prependIcon = (el, icon)=>{
    el.prepend( UI.createIcon(icon) );
};

UI.createSceneCoverIMG = (sid)=>{
    let im = document.createElement("img");
    im.src = ATON.PATH_RESTAPI2+"scenes/"+sid+"/cover";
    im.onerror = ()=>{
        im.src = ATON.PATH_RES+"scenecover.png";
    };

    return im;
};

/*===============================
    Containers
===============================*/

/**
Create a generic container
- options.id: optional ID for this element
- options.classes: optional list of space-separated CSS classes (e.g.: "myclass_A myclass_B")
- options.style: optional style string (e.g.: "display:block; padding:2px")
- options.items: optional list of children elements

@param {object} options - UI options object
@returns {HTMLElement}
*/
UI.createContainer = (options)=>{
    let str = "";

    if (options){
        if (options.id) str += ` id="${options.id}"`;
        if (options.classes) str += ` class="${options.classes}"`;
        if (options.style) str += ` style="${options.style}"`;
    }

    let el = UI.createElementFromHTMLString(`<div${str}></div>`);

    if (options && options.items){
        for (let i in options.items) if (options.items[i]) el.append( options.items[i] );
    }

    return el;
};

/*===============================
    Items
===============================*/

/**
Create a button (icon and/or text)
- options.variant: the bootstrap variant (primary, info, etc.)
- options.text: the button text
- options.icon: a basic string will look for centralized ATON PNG icons (e.g. "home") or bootstrap icons (starting with "bi-*"), otherwise a provided full url to image
- options.onpress: routine to launch on click
- options.size: "large" or "small", otherwise default size

@param {object} options - UI options object
@returns {HTMLElement}
*/
UI.createButton = (options)=>{
    let el = document.createElement('button');
    el.classList.add("btn", "aton-btn");
    el.setAttribute("type","button");

    if (options.variant) el.classList.add("btn-"+options.variant); // Bootstrap button variants (primary, info, ...)

    if (options.text) el.innerHTML = "<span class='aton-btn-text'>"+options.text+"</span>";

    if (options.icon) UI.prependIcon(el, options.icon);

    if (options.size){
        if (options.size === "large") el.classList.add("btn-lg");
        if (options.size === "small") el.classList.add("btn-sm");
    }

    if (options.badge){ 
        el.append( UI.createElementFromHTMLString("<span class='position-absolute top-0 start-100 translate-middle badge rounded-pill'>"+options.badge+"</span>"));
    }

    if (options.onpress) el.onclick = options.onpress;

    if (options.classes) el.className = el.className + " " + options.classes;

    return el;
};

// Buttons prefabs

/**
Create home button
@param {object} options - Optional UI options object
@returns {HTMLElement}
*/
UI.createButtonHome = (options)=>{
    const std = {
        icon: "home",
        onpress: ()=>{
            ATON.Nav.requestHome(0.3);
        }
    };

    return UI.createButton({ ...std, ...options });
};

/**
Create back button
@param {object} options - Optional UI options object
@returns {HTMLElement}
*/
UI.createButtonBack = (options)=>{
    const std = {
        icon: "back",
        onpress: ()=>{
            history.back();
        }
    };

    return UI.createButton({ ...std, ...options });
};

/**
Create VR button. Hidden if not supported by device
@param {object} options - Optional UI options object
@returns {HTMLElement}
*/
UI.createButtonVR = (options)=>{
    const std = {
        icon: "vr",
        onpress: ()=>{
            ATON.XR.toggle("immersive-vr");
        }
    };

    let el = UI.createButton({ ...std, ...options });

    if (!ATON.device.xrSupported['immersive-vr']) el.classList.add('d-none');
    ATON.on("XR_support", d => {
        if (ATON.device.xrSupported['immersive-vr']) el.classList.remove('d-none');
    });

    return el;
};

/**
Create AR button. Hidden if not supported by device
@param {object} options - Optional UI options object
@returns {HTMLElement}
*/
UI.createButtonAR = (options)=>{
    const std = {
        icon: "ar",
        onpress: ()=>{
            ATON.XR.toggle("immersive-ar");
        }
    };

    let el = UI.createButton({ ...std, ...options });

    if (!ATON.device.xrSupported['immersive-ar']) el.classList.add('d-none');
    ATON.on("XR_support", d => {
        if (ATON.device.xrSupported['immersive-ar']) el.classList.remove('d-none');
    });

    return el;
};

/**
Create Device Orientation button. Hidden if not supported by device
@param {object} options - Optional UI options object
@returns {HTMLElement}
*/
UI.createButtonDeviceOrientation = (options)=>{
    const std = {
        icon: "devori",
        onpress: ()=>{
            if (ATON.Nav.isDevOri()){
                ATON.Nav.restorePreviousNavMode();
            }
            else {
                ATON.Nav.setDeviceOrientationControl();
            }
        }
    };

    let el = UI.createButton({ ...std, ...options });
    if (!ATON.Utils.isConnectionSecure() || !ATON.Utils.isMobile()) el.classList.add('d-none');

    return el;
};

/**
Create a dropdown
- options.title: the dropdown button title
- options.icon: icon for dropdown button
- options.items: an array of objects with "title" (string) and "url" (string) properties. An optional icon can be provided

@param {object} options - UI options object
@returns {HTMLElement}
*/
UI.createDropdown = (options)=>{
    if (!options.items) return undefined;

    let el = document.createElement('div');
    el.classList.add("btn-group");

    let elBtn = UI.createElementFromHTMLString(`
        <button type="button" class="btn aton-btn dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">${options.title}</button>
    `);

    if (options.variant) elBtn.classList.add("btn-"+options.variant);
    
    if (options.icon) UI.prependIcon(elBtn, options.icon);

    el.append( elBtn );

    if (options.classes) elBtn.className = elBtn.className + " " + options.classes;

    if (options.items){
        let elList = document.createElement("ul");

        elList.classList.add("dropdown-menu", "dropdown-menu-sm-end", "aton-dropdown-menu");
        //if (options.align) elList.classList.add(options.align);

        for (let i=0; i<options.items.length; i++){
            let E = options.items[i];

            let elItem;

            if (E.el){
                elItem = E.el;
                elItem.classList.add("dropdown-item", "aton-dropdown-item");
            }
            else elItem = UI.createElementFromHTMLString(`
                <a class="dropdown-item aton-dropdown-item" href="${E.url}">${E.title}</a>
            `);

            let elItemLI = document.createElement("li");
            elItemLI.append( elItem );
            elList.append( elItemLI );

            if (E.icon) UI.prependIcon(elItem, E.icon);
        }

        el.append(elList);
    }

    return el;
};

/**
Create a tabs group.
- options.items: an array of objects (tabs) with "title" (string) and "content" (DOM element) properties. An optional "icon" can also be assigned per tab

@param {object} options - UI options object
@returns {HTMLElement}
*/
UI.createTabsGroup = (options)=>{
    if (!options.items) return undefined;

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

        let tabtitle   = e.title? e.title : "";
        let tabcontent = e.content;
        let icon       = e.icon;
        let tclasses   = e.classes;

        let icontab = "";
        if (icon) icontab = "<img class='icon aton-icon aton-icon-small' src='"+UI.resolveIconURL(icon)+"'>";

        let tabid = baseid+"-" + i;

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
            eltabbody = UI.createElementFromHTMLString("<div class='tab-pane show active' id='"+tabid+"' role='tabpanel' aria-labelledby='"+tabid+"-tab'></div>");
        else 
            eltabbody = UI.createElementFromHTMLString("<div class='tab-pane show' id='"+tabid+"' role='tabpanel' aria-labelledby='"+tabid+"-tab'></div>");

        eltabbody.style.padding = "10px 0px 10px 0px";

        if (tabcontent) eltabbody.append( tabcontent );
        eltabcontent.append(eltabbody);

        // Custom classes for this tab
        if (tclasses) eltab.className = eltab.className + " " + tclasses;
    }

    return el;
};

/**
Create a tree group
- options.items: an array of objects (items) with "title" (string) and "content" (DOM element) properties

@param {object} options - UI options object
@returns {HTMLElement}
*/
UI.createTreeGroup = (options)=>{
    if (!options.items) return undefined;

    let baseid = ATON.Utils.generateID("tree");

    let el = document.createElement('div');
    el.classList.add("aton-tree-container");

    for (let i=0; i<options.items.length; i++){
        let e = options.items[i];

        let title   = e.title; //? e.title : i;
        let content = e.content;

        let elItem, elContent;

        if (!title){
            elItem = ATON.UI.createContainer(/*{ classes:"aton-tree-item"}*/);
            if (content){
                elContent = ATON.UI.createContainer(/*{ classes:"aton-tree-item-content"}*/);
                elContent.append( content );
                elItem.append( elContent );
            }
        }
        else {
            elItem = document.createElement('details');
            elItem.classList.add("aton-tree-item");
            if (e.open) elItem.setAttribute("open",true);
            
            elItem.id = baseid+"-"+i;
    
            elItem.append( UI.createElementFromHTMLString("<summary>"+title+"</summary>") );
            if (content){
                let elContent = document.createElement('div');
                elContent.classList.add("aton-tree-item-content");
                elContent.append( content );
    
                elItem.append( elContent );
            }
        }

        el.append(elItem);
    }

    return el;
}

/**
Create a vector control
- options.vector: target THREE.Vector3 to be manipulated
- options.step: step value
- options.onupdate: a routine called when vector is changed/updated

@param {object} options - UI options object
@returns {HTMLElement}
*/
UI.createVectorControl = (options)=>{
    let baseid = ATON.Utils.generateID("vec3");

    let V = undefined;
    if (options.vector) V = options.vector;

    let step = 0.01;
    if (options.step) step = options.step;

    let posx = V? V.x : 0.0;
    let posy = V? V.y : 0.0;
    let posz = V? V.z : 0.0;

    let el = UI.createElementFromHTMLString(`
        <div class="input-group mb-3">
            <input type="number" class="form-control aton-input-x" placeholder="x" aria-label="x" step="${step}" value="${posx}">
            <input type="number" class="form-control aton-input-y" placeholder="y" aria-label="y" step="${step}" value="${posy}">
            <input type="number" class="form-control aton-input-z" placeholder="z" aria-label="z" step="${step}" value="${posz}">
        </div>
    `);

    el.id = baseid;

    let elInputX = el.children[0];
    let elInputY = el.children[1];
    let elInputZ = el.children[2];

    elInputX.oninput = ()=>{
        let v = elInputX.value;

        if (V) V.x = v;
        if (options.onupdate) options.onupdate();
    };

    elInputY.oninput = ()=>{
        let v = elInputY.value;

        if (V) V.y = v;
        if (options.onupdate) options.onupdate();
    };

    elInputZ.oninput = ()=>{
        let v = elInputZ.value;

        if (V) V.z = v;
        if (options.onupdate) options.onupdate();
    };

    return el;
};

/**
Create a quaternion control
- options.quat: target THREE.Quaternion to be manipulated
- options.step: step value
- options.onupdate: a routine called when Quaternion is changed/updated

@param {object} options - UI options object
@returns {HTMLElement}
*/
UI.createQuaternionControl = (options)=>{
    let baseid = ATON.Utils.generateID("vec3");

    let Q = undefined;
    if (options.quat) Q = options.quat;

    let step = 0.01;
    if (options.step) step = options.step;

    let x = Q? Q.x : 0.0;
    let y = Q? Q.y : 0.0;
    let z = Q? Q.z : 0.0;
    let w = Q? Q.w : 0.0;

    let el = UI.createElementFromHTMLString(`
        <div class="input-group mb-3">
            <input type="number" class="form-control" placeholder="x" aria-label="x" step="${step}" value="${x}">
            <input type="number" class="form-control" placeholder="y" aria-label="y" step="${step}" value="${y}">
            <input type="number" class="form-control" placeholder="z" aria-label="z" step="${step}" value="${z}">
            <input type="number" class="form-control" placeholder="w" aria-label="w" step="${step}" value="${w}">
        </div>
    `);

    el.id = baseid;

    let elInputX = el.children[0];
    let elInputY = el.children[1];
    let elInputZ = el.children[2];
    let elInputW = el.children[3];

    elInputX.oninput = ()=>{
        let v = elInputX.value;

        if (Q) Q.x = v;
        if (options.onupdate) options.onupdate();
    };

    elInputY.oninput = ()=>{
        let v = elInputY.value;

        if (Q) Q.y = v;
        if (options.onupdate) options.onupdate();
    };

    elInputZ.oninput = ()=>{
        let v = elInputZ.value;

        if (Q) Q.z = v;
        if (options.onupdate) options.onupdate();
    };

    elInputZ.oninput = ()=>{
        let v = elInputW.value;

        if (Q) Q.w = v;
        if (options.onupdate) options.onupdate();
    };

    return el;
};

/**
Create a node transform control. If "position", "scale" and "rotation" properties are provided, a 3x3 form is generated to directly control a given ATON node.
- options.node: ATON node id to be transformed
- options.position: enable position/location manipulation
- options.scale: enable scale manipulation
- options.rotation: enable rotation manipulation

@param {object} options - UI options object
@returns {HTMLElement}
*/
UI.createNodeTrasformControl = (options)=>{
    let baseid = ATON.Utils.generateID("ftrans");
    
    let el = document.createElement('div');
    el.id = baseid;
    //el.classList.add("");

    let N = undefined;
    if (options.node) N = ATON.getSceneNode( options.node );

    // Position
    if (options.position){

        let elPos = UI.createVectorControl({
            vector: N.position,
            step: options.position.step
        });

        el.append( UI.createElementFromHTMLString("<label class='form-label' for='"+elPos.id+"'>Position</label>") );
        el.append( elPos );
    }

    // Scale
    if (options.scale){

        let elScale = UI.createVectorControl({
            vector: N.scale,
            step: options.scale.step
        });

        el.append( UI.createElementFromHTMLString("<label class='form-label' for='"+elScale.id+"'>Scale</label>") );
        el.append( elScale );
    }

    // Rotation
    if (options.rotation){

        let elRot = UI.createVectorControl({
            vector: N.rotation,
            step: options.rotation.step
        });
/*
        let elRot = UI.createQuaternionControl({
            quat: N.quaternion,
            step: options.rotation.step
        });     
*/
        el.append( UI.createElementFromHTMLString("<label class='form-label' for='"+elRot.id+"'>Rotation</label>") );
        el.append( elRot );
    }

    return el;
};

/**
Create a generic card.
- options.size: "small" or "large", if not present standard size
- options.cover: cover image url
- options.stdcover: default cover img (if cover not found / on fetch error)
- options.url: landing url when selecting the main cover
- options.keywords: keywords object (eg. {"term_a":1, "term_b":1 }) to filter this card
- options.title: card title
- options.subtitle: custom subtitle element
- options.footer: custom footer element
- options.useblurtint: use special blur effect on this card

@param {object} options - UI options object
@returns {HTMLElement}
*/
UI.createCard = (options)=>{
    let cc = "card aton-card ";
    if (options.classes) cc += options.classes;

    let el = ATON.UI.createContainer({ classes: cc });

    if (options.size==="small") el.classList.add("aton-card-small");
    if (options.size==="large") el.classList.add("aton-card-large");

    let sskwords = "";

    // Object holding internal card keywords
    if (options.keywords){
        for (let k in options.keywords) sskwords += k+" ";
        sskwords = sskwords.trim().toLowerCase();
        el.setAttribute("data-search-term", sskwords);
    }

    if (options.cover){
        // Blur bg
        if (options.useblurtint){
            let bgdiv = document.createElement('div');
            bgdiv.classList.add("aton-card-bg");
            bgdiv.style.backgroundImage = "url('"+options.cover+"')";
            el.append(bgdiv);
        }

        // Cover
        let elcov = ATON.UI.createElementFromHTMLString(`<div class='aton-card-cover'><a href='${options.url}'></a></div>`);

        let im = document.createElement("img");
        im.classList.add("card-img-top");
        im.src = options.cover;
        if (options.stdcover) im.onerror = ()=>{
            im.src = options.stdcover;
        };

        elcov.getElementsByTagName("a")[0].append(im);
        el.append(elcov);
    }
    
    // Body
    let elbody = document.createElement('div');
    elbody.classList.add("card-body","aton-card-body");
    el.append(elbody);

    // Title
    let elTitle = document.createElement("div");
    elTitle.classList.add("card-title", "aton-card-title");
    elTitle.innerHTML = "Title";
    elbody.append(elTitle);

    if (options.title){
        elTitle.innerHTML = options.title;
        sskwords += " "+options.title.trim().toLowerCase();
        el.setAttribute("data-search-term", sskwords);
    }

    // Sub-title
    if (options.subtitle){
        let elSub = ATON.UI.createElementFromHTMLString(`<div class='card-subtitle mb-2 text-body-secondary'></div>`);

        elSub.append(options.subtitle);
        elbody.append(elSub);
    }

    // Footer
    if (options.footer){
        let elFooter = document.createElement('div');
        elFooter.classList.add("card-footer");
        elFooter.append(options.footer);
        elbody.append(elFooter);
    }

    if (options.badge){
        let elB = UI.createElementFromHTMLString("<span class='position-absolute top-0 start-100 translate-middle rounded-circle'></span>"); // rounded-circle
        
        elB.append(options.badge);
        el.append(elB);
    }


    return el;
};

/**
Create a scene card.
- options.sid: the scene ID (mandatory)
- options.size: "small" or "large", if not present standard size
- options.keywords: keywords object (eg. {"gold":1, "silver":1 })
- options.title: scene title
- options.subtitle: custom subtitle (if not provided, defaults to user)

@param {object} options - UI options object
@returns {HTMLElement}
*/
UI.createSceneCard = (options)=>{
    //let baseid = ATON.Utils.generateID("ftrans");

    let user  = undefined;
    let usid  = undefined;

    let sid = options.sid;
    if (!sid) sid = "samples/welcome";

    let pp = sid.split("/");
    user = pp[0];
    usid = pp[1];

    let kw = options.keywords? options.keywords : {};
    kw[user] = 1;

    let elSub = options.subtitle;
    if (!elSub) 
        elSub = ATON.UI.createElementFromHTMLString(`
            <div><img class='icon aton-icon aton-icon-small' src='${UI.resolveIconURL("user")}'>${user}</div>
        `);

    let el = ATON.UI.createCard({
        title: (options.title)? options.title : usid, // "Scene"
        keywords: kw,
        size: options.size,
        useblurtint: options.useblurtint,
        classes: options.classes,
        cover: ATON.PATH_RESTAPI2+"scenes/"+sid+"/cover",
        url: ATON.PATH_FE + sid,
        subtitle: elSub,
        footer: options.footer,
        badge: options.badge
    });

    return el;
};

/**
Create a live filter, search as user is typing
- options.filterclass: items class to filter (eg. "aton-scene-card")
- options.onfocus: routine when input filed is focused
- options.onblur: routine when leaving input filed
- options.oninput: custom routine on keyboard input. If not provided uses filterclass option

@param {object} options - UI options object
@returns {HTMLElement}
*/
UI.createLiveFilter = (options)=>{
    let baseid  = ATON.Utils.generateID("filter");
    let inputid = baseid+"-input";

    let el = document.createElement("form");
    el.id = baseid;
    el.classList.add("d-flex");
    el.setAttribute("role", "search");

    let placeholder = "Search";
    if (options.placeholder) placeholder = options.placeholder;
    let elInput = UI.createElementFromHTMLString(`<input class="form-control me-2" type="search" placeholder="${placeholder}" aria-label="Search" id="${inputid}" >`);

    const elInGroup = document.createElement("div");
    elInGroup.classList.add("input-group"); //,"mb-2");
    elInGroup.append(UI.createElementFromHTMLString("<span class='input-group-text'><i class='bi bi-search'></i></span>"));
    elInGroup.append(elInput);

    if (options.oninput) elInput.oninput = options.oninput;
    else elInput.oninput = ()=> {
        if (!options.filterclass) return;

        let v = elInput.value.trim().toLowerCase();
        let filterItems = document.querySelectorAll(`.${options.filterclass}`);

        if (v.length < 3) {
            for (let item of filterItems) {
                // Using Bootstrap 5 class `d-none`
                item.classList.remove('d-none');
            }

            return;
        }    

        for (let item of filterItems) {
            let attr = item.getAttribute('data-search-term');

            if (attr && (attr.includes(v) || v.length < 1)) {
                item.classList.remove('d-none');
            }
            else {
                item.classList.add('d-none');
            }
        }

    };

    if (options.onfocus) elInput.onfocus = options.onfocus;
    if (options.onblur)  elInput.onblur  = options.onblur;

    el.append(elInGroup);

    return el;
};

/**
Create public scenes gallery
- options.containerid: ID of container (DOM element) for the gallery
- options.size: scene cards size
- options.entries: an optional array of scenes entries. If not provided, REST API will be used to retrieve public scenes

@param {object} options - UI options object
@returns {HTMLElement}
*/
UI.createPublicScenesGallery = (options) => {
    if (!options.containerid) return undefined;

    let el = document.getElementById(options.containerid);
    if (!el) return undefined;

    const generate = (entries)=>{
        entries.sort( UI.SCENES_SORTER );               
        console.log(entries);

        for (let scene of entries) {
            let bSample = scene.sid.startsWith("samples/");

            if (!bSample || (bSample && options.samples)) {
                let card = ATON.UI.createSceneCard({
                    title: scene.title? scene.title : scene.sid,
                    sid: scene.sid,
                    showuser: true,
                    keywords: scene.kwords,
                    classes: options.classes,
                    useblurtint: true,
                    size: options.size
                });

                el.append(card);
            }
        }
    };

    if (options.entries) {
        generate(options.entries);
    }
    else {
        ATON.REQ.get("scenes/", data => generate(data));
    }

    return el;
};

/**
Create private (own) scenes gallery
- options.containerid: ID of container (parent DOM element) for the gallery
- options.size: scene cards size

@param {object} options - UI options object
@returns {HTMLElement}
*/
UI.createOwnScenesGallery = (options)=>{
    if (!options.containerid) return undefined;

    let el = document.getElementById(options.containerid);
    if (!el) return undefined;

    ATON.checkAuth(
        (u)=>{
            ATON.REQ.get("scenes/"+u.username, entries => {
                entries.sort( UI.SCENES_SORTER );               
                console.log(entries);
        
                for (let scene of entries) {
        
                    let card = ATON.UI.createSceneCard({
                        title: scene.title? scene.title : scene.sid,
                        sid: scene.sid,
                        keywords: scene.kwords,
                        useblurtint: true,
                        classes: options.classes,
                        size: options.size
                    });
    
                    el.append(card);
                }
            });
        }
    );
};

/**
Create a keyword (tag)
- options.term: the term (string)
- options.count: optional counter for this keyword
- options.onpress: routine to launch on click

@param {object} options - UI options object
@returns {HTMLElement}
*/
UI.createKeyword = (options)=>{
    let el;
    if (options.count){
        el = UI.createElementFromHTMLString(`
            <button type="button" class="btn btn-sm btn-outline-secondary aton-keyword">
                ${options.term} <span class="badge text-bg-secondary">${options.count}</span>
            </button>
        `);
    }
    else {
        el = UI.createElementFromHTMLString(`
            <button type="button" class="btn btn-sm btn-outline-secondary aton-keyword">${options.term}</button>
        `);
    }

    if (options.classes) el.className = el.className + " " + options.classes;

    if (options.onpress) el.onclick = options.onpress;

    return el;
};

/**
Create a range/slider
- options.range: min and max values pair (e.g. [0,10])
- options.label: optional label for this slider
- options.value: initial value
- options.oninput: on input routine (e.g.: (val)=>{ console.log(val); } )
- options.onchange: on change routine (e.g.: (val)=>{ console.log(val); } )

@param {object} options - UI options object
@returns {HTMLElement}
*/
UI.createSlider = (options)=>{
    let el = UI.createContainer({classes: "aton-range-container"});
    let baseid = ATON.Utils.generateID("slider");
    
    let elValue = undefined;
    let elLabel = undefined;
    
    if (options.label){
        elLabel = UI.createElementFromHTMLString("<label for='"+baseid+"' class='aton-range-label'><b>"+options.label+"</b>: </label>");
        //elLabel = UI.createElementFromHTMLString("<span class='input-group-text'><i class='bi bi-search'></i></span>");
        el.append(elLabel);
        elValue = document.createElement("span");
        elLabel.append(elValue);

        if (options.value) elValue.innerText = options.value;
    }

    let min  = 0;
    let max  = 1;
    let step = (options.step)? options.step : 1;

    if (options.range){
        min = options.range[0];
        max = options.range[1];
    }

    let elInput = UI.createElementFromHTMLString(`
        <input type="range" class="aton-range" list="ticks-${baseid}" min="${min}" max="${max}" step="${step}" id="${baseid}">
    `);

    if (options.value !== undefined) elInput.value = options.value;

    el.append(elInput);

/*
    if (options.ticks){
        let elDL = document.createElement("datalist");
        elDL.id = "ticks-"+baseid;

        for (let t=min; t<=max; t+=step){
            elDL.append( UI.createElementFromHTMLString("<option value='"+t+"'></option>") );
        }

        el.append(elDL);
    }
*/
    elInput.oninput = ()=>{
        if (elValue) elValue.innerText = elInput.value;
        if (options.oninput) options.oninput(elInput.value);
    };
    if (options.onchange) elInput.onchange = ()=>{
        if (elValue) elValue.innerText = elInput.value;
        options.onchange(elInput.value);
    };

    return el;
};

UI.createLoginForm = (options)=>{
    let el = document.createElement("form");
    el.classList.add("container-sm", "text-center");

    let elUsername = UI.createElementFromHTMLString(`<div class="input-group mb-4"><span class="input-group-text">Username</span></div>`);
    let elPassword = UI.createElementFromHTMLString(`<div class="input-group mb-4"><span class="input-group-text">Password</span></div>`);

    let elInputUN = UI.createElementFromHTMLString(`<input id="uname" type="text" maxlength="30" class="form-control" aria-label="Username" aria-describedby="inputGroup-sizing-sm" placeholder="Username">`);
    let elInputPW = UI.createElementFromHTMLString(`<input id="passw" type="password" maxlength="30" class="form-control" aria-label="Password" aria-describedby="inputGroup-sizing-sm" placeholder="Password">`);

    elUsername.append(elInputUN);
    elPassword.append(elInputPW);

    let elEnter = ATON.UI.createButton({
        text: "Login",
        icon: "bi-person-fill",
        variant: "accent",
        classes: "px-4",
        //size: "large",
        onpress: ()=>{
            let uname = elInputUN.value.trim();
            let passw = elInputPW.value.trim();

            ATON.REQ.login(uname,passw, options.onSuccess, options.onFail);
        }
    });

    if (options.header) el.append(options.header);
    else el.append( UI.createElementFromHTMLString(`<i class="bi bi-person" style="font-size:3em;"></i>`) );

    el.append(elUsername);
    el.append(elPassword);
    el.append(elEnter);

    return el;
};

export default UI;
