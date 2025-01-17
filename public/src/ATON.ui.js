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
    if (!window.bootstrap.Offcanvas) return; // tmp hack

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

@param {object} options - UI options object
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

@param {object} options - UI options object
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
        tabid = tabid.replaceAll(" ", "");

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

        if (tabcontent) eltabbody.append( tabcontent );
        eltabcontent.append(eltabbody);

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
    let baseid = ATON.Utils.generateID("tree");

    let el = document.createElement('div');
    el.classList.add("aton-tree-container");

    for (let i=0; i<options.items.length; i++){
        let e = options.items[i];

        let title   = e.title? e.title : i;
        let content = e.content;
 
        let elItem = document.createElement('details');
        elItem.classList.add("aton-tree-item");
        if (e.open) elItem.setAttribute("open",true);
        
        elItem.id = baseid+"-"+i;

        elItem.append( UI.createElemementFromHTMLString("<summary>"+title+"</summary>") );
        if (content){
            let elContent = document.createElement('div');
            elContent.classList.add("aton-tree-item-content");
            elContent.append( e.content );

            elItem.append( elContent );
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

    let el = UI.createElemementFromHTMLString(`
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

    let el = UI.createElemementFromHTMLString(`
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

        el.append( UI.createElemementFromHTMLString("<label class='form-label' for='"+elPos.id+"'>Position</label>") );
        el.append( elPos );
    }

    // Scale
    if (options.scale){

        let elScale = UI.createVectorControl({
            vector: N.scale,
            step: options.scale.step
        });

        el.append( UI.createElemementFromHTMLString("<label class='form-label' for='"+elScale.id+"'>Scale</label>") );
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
        el.append( UI.createElemementFromHTMLString("<label class='form-label' for='"+elRot.id+"'>Rotation</label>") );
        el.append( elRot );
    }

    return el;
};

export default UI;
