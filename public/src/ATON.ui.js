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

UI.COMP_ATTR = "data-aton-comp";

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
UI.elem = (html)=>{
    let element = UI._parser.parseFromString(html, 'text/html').body.firstElementChild;
    // TODO: compare perf with insertAdjacentHTML( 'beforeend', str );
    return element; 
};

// backwards compat.
UI.createElementFromHTMLString = UI.elem;

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
    UI.elCenteredOverlay = UI.elem(`
        <div class="d-flex align-items-center justify-content-center aton-centered-container">
            <div class="spinner-border aton-spinner" role="status"><span class="visually-hidden">Loading...</span></div>
        </div>
	`);

    document.body.append( UI.elCenteredOverlay );
    UI.hideCenteredOverlay();
    
    // 2D labels
    //UI.elLabelCon = UI.elem(`<div class='aton-floating-label-container'></div>`);
    UI.elLabelCon = document.createElement('div');
    UI.elLabelCon.classList.add("aton-floating-label-container");

    //UI.elLabel    = UI.elem("<div class='aton-floating-label'></div>");
    UI.elLabel = document.createElement('div');
    UI.elLabel.classList.add("aton-floating-label");

    UI.elLabelCon.append(UI.elLabel);
    document.body.prepend( UI.elLabelCon );
    UI.hideSemLabel();

    // Centralized modal dialog // modal-fullscreen-md-down
    UI.elModal = UI.elem(`
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
    UI.elSidePanel = UI.elem(`
        <div class="offcanvas offcanvas-end aton-std-bg aton-sidepanel" tabindex="-1"></div>
	`); // offcanvas-md

    UI.sidepanel = new bootstrap.Offcanvas(UI.elSidePanel);
    document.body.append(UI.elSidePanel);

    UI.setupARoverlay();
};

UI.setupARoverlay = ()=>{
    if (UI.ARoverlay) return;

    UI.ARoverlay = ATON.UI.createContainer();
    UI.ARoverlay.style.display = 'none';
	document.body.appendChild( UI.ARoverlay );

    const svg = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' );
    svg.setAttribute( 'width', 38 );
    svg.setAttribute( 'height', 38 );
    svg.style.position = 'absolute';
    svg.style.right = '20px';
    svg.style.top = '20px';
    svg.addEventListener( 'click', ()=>{
        if (ATON.XR.currSession) ATON.XR.currSession.end();
    });
    UI.ARoverlay.appendChild( svg );

    const path = document.createElementNS( 'http://www.w3.org/2000/svg', 'path' );
    path.setAttribute( 'd', 'M 12,12 L 28,28 M 28,12 12,28' );
    path.setAttribute( 'stroke', '#fff' );
    path.setAttribute( 'stroke-width', 2 );
    svg.appendChild( path );

    //console.log(UI.ARoverlay)
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

/**
Show centralized modal
- options.header: main title (string)
- options.body: main content of the side panel 
- options.footer: optional footer HTML element

@param {object} options - UI options object
*/
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

/**
Hide (close) centralized modal
*/
UI.hideModal = ()=>{
    // Clear
    UI.elModalContent.innerHTML = "";

    UI.modal.hide();
    UI._bModal = false;
};

/*===============================
    Side panel
===============================*/

/**
Show centralized side panel (offcanvas)
- options.header: main title (string)
- options.headelement: optional header HTML element
- options.body: main content of the side panel 

@param {object} options - UI options object
*/
UI.showSidePanel = (options)=>{
    if (!options) options = {};

    UI.elSidePanel.innerHTML = "";

    if (options.header){
        let el = document.createElement('div');
        el.classList.add("offcanvas-header");

        el.innerHTML = "<h4 class='offcanvas-title' id='staticBackdropLabel'>"+options.header+"</h4><button type='button' class='btn-close' aria-label='Close' onclick='ATON.UI.hideSidePanel()'></button>"; // data-bs-dismiss='offcanvas'

        if (options.headelement) el.prepend(options.headelement);

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

/**
Hide (close) centralized side panel (offcanvas)
*/
UI.hideSidePanel = ()=>{
    UI.sidepanel.hide();
    UI._bSidePanel = false;
};

/**
Setup centralized side panel (offcanvas) sliding from left
*/
UI.setSidePanelLeft = ()=>{
    UI.elSidePanel.classList.remove('offcanvas-end');
    UI.elSidePanel.classList.add('offcanvas-start');
}

/**
Setup centralized side panel (offcanvas) sliding from right
*/
UI.setSidePanelRight = ()=>{
    UI.elSidePanel.classList.remove('offcanvas-start');
    UI.elSidePanel.classList.add('offcanvas-end');
}



/*===============================
    Utilities
===============================*/
/**
Make a given HTML element visibile
@param {HTMLElement} el - the HTML element or ID
*/
UI.showElement = (el)=>{
    if (typeof el === "string") el = UI.get(el);

    if (!el) return;
    el.classList.remove("d-none");
};

/**
Hide a given HTML element
@param {HTMLElement} el - the HTML element or ID
*/
UI.hideElement = (el)=>{
    if (typeof el === "string") el = UI.get(el);

    if (!el) return;
    el.classList.add("d-none");
};

/**
Make a given HTML element visibile or hidden
@param {HTMLElement} el - the HTML element
@param {bool} bVisible - visibility
*/
UI.toggleElement = (el, bVisible)=>{
    if (bVisible) UI.showElement(el);
    else UI.hideElement(el);
};


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
            let elHeader = UI.elem(res);
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
        return UI.elem("<i class='bi "+iconurl+"' style='font-size:1.5em; vertical-align:middle;'></i>");
    else 
        return UI.elem("<img class='icon aton-icon' src='"+UI.resolveIconURL(iconurl)+"'>");
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

    let el = UI.elem(`<div${str}></div>`);

    if (options && options.items){
        for (let i in options.items) if (options.items[i]) el.append( options.items[i] );
    }

    return el;
};

/*===============================
    Components
===============================*/
UI.registerElementAsComponent = (el, name)=>{
    el.setAttribute(UI.COMP_ATTR, name);
};

UI.getComponent = (el, name)=>{
    if (!el) return undefined;

    let R = el.querySelectorAll("["+UI.COMP_ATTR+"='"+name+"']");
    if (!R) return undefined;

    return R[0];
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
        el.append( UI.elem("<span class='position-absolute top-0 start-100 translate-middle badge rounded-pill'>"+options.badge+"</span>"));
    }

    if (options.onpress) el.onclick = options.onpress;

    if (options.classes) el.className = el.className + " " + options.classes;

    if (options.tooltip) el.setAttribute("title", options.tooltip);

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
        tooltip: "Go home",
        onpress: ()=>{
            ATON.Nav.requestHome(0.3);
        }
    };

    return UI.createButton({ ...std, ...options });
};

/**
Create fullscreen button
@param {object} options - Optional UI options object
@returns {HTMLElement}
*/
UI.createButtonFullscreen = (options)=>{
    const std = {
        icon: "fullscreen",
        tooltip: "Fullscreen",
        onpress: ()=>{
            ATON.toggleFullScreen();
        }
    };

    const el = UI.createButton({ ...std, ...options });

    ATON.on("Fullscreen", (b)=>{
        if (b) el.classList.add("aton-btn-highlight");
        else el.classList.remove("aton-btn-highlight");
    });

    return el;
};

/**
Create back button
@param {object} options - Optional UI options object
@returns {HTMLElement}
*/
UI.createButtonBack = (options)=>{
    const std = {
        icon: "back",
        tooltip: "Go back",
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
        tooltip: "Immersive VR",
        onpress: ()=>{
            ATON.XR.toggle("immersive-vr");
        }
    };

    let el = UI.createButton({ ...std, ...options });

    if (!ATON.device.xrSupported['immersive-vr']) ATON.UI.hideElement(el);
    ATON.on("XR_support", d => {
        if (ATON.device.xrSupported['immersive-vr']) ATON.UI.showElement(el);
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
        tooltip: "Augmented Reality",
        onpress: ()=>{
            ATON.XR.toggle("immersive-ar");
        }
    };

    let el = UI.createButton({ ...std, ...options });

    if (!ATON.device.xrSupported['immersive-ar']) ATON.UI.hideElement(el);
    ATON.on("XR_support", d => {
        if (ATON.device.xrSupported['immersive-ar']) ATON.UI.showElement(el);
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
        tooltip: "Device Orientation",
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
    if (!ATON.Utils.isConnectionSecure() || !ATON.Utils.isMobile()) ATON.UI.hideElement(el);

    return el;
};

/**
Create Nav switcher
@param {object} options - Optional UI options object
@returns {HTMLElement}
*/
UI.createNavSwitcher = (options)=>{
    let el = UI.createContainer({
		classes: "btn-group",
        style: "width:100%",
    });

    let elFP,elOR,elDO;

    elFP = UI.createButton({
        icon: "fp",
        //text: "First Person",
        tooltip: "First Person",
        classes: "btn-default",
        onpress: ()=>{
            ATON.Nav.setFirstPersonControl();
            elFP.classList.add("aton-btn-highlight");
            elOR.classList.remove("aton-btn-highlight");
            elDO.classList.remove("aton-btn-highlight");
        }
    });

    elOR = UI.createButton({
        icon: "nav",
        tooltip: "Orbit",
        //text: "Orbit",
        classes: "btn-default",
        onpress: ()=>{
            ATON.Nav.setOrbitControl();
            elOR.classList.add("aton-btn-highlight");
            elFP.classList.remove("aton-btn-highlight");
            elDO.classList.remove("aton-btn-highlight");
        }
    });

    elDO = UI.createButton({
        icon: "devori",
        //text: "Device Orientation",
        tooltip: "Device Orientation",
        classes: "btn-default",
        onpress: ()=>{
            ATON.Nav.setDeviceOrientationControl();
            elDO.classList.add("aton-btn-highlight");
            elFP.classList.remove("aton-btn-highlight");
            elOR.classList.remove("aton-btn-highlight");
        }
    });

    el.append(elFP);
    el.append(elOR);
    if (ATON.Utils.isConnectionSecure() && ATON.Utils.isMobile()) el.append(elDO);

    if (ATON.Nav.isOrbit()) elOR.classList.add("aton-btn-highlight");
    if (ATON.Nav.isFirstPerson()) elFP.classList.add("aton-btn-highlight");
    if (ATON.Nav.isDevOri()) elDO.classList.add("aton-btn-highlight");

    return el;
};

/**
Create a QR button
- options.text: optional text for button
- options.title: custom title for QR modal
- options.url: optional custom url (by default current URL)
- options.content: optional content (HTML element) after the QR code 
@param {object} options - UI options object
@returns {HTMLElement}
*/
UI.createButtonQR = (options)=>{
    if (!options) options = {};

    let el = UI.createButton({
        icon: "qr",
        text: options.text,
        onpress: ()=>{
            let url = options.url? options.url : window.location.href;
            let elQR = ATON.UI.createContainer({ classes: "aton-QR-container" });
            new QRCode(elQR, url);

            UI.showModal({
                header: options.title? options.title : "QR code",
                body: ATON.UI.createContainer({
                    style: "text-align:center",
                    items:[
                        elQR,
                        options.content
                    ]
                })
            });
        }
    });

    return el;
};

/**
Create a quick user authentication button (login/logout)
- options.onmodalopen: optional routine when user modal is opened
- options.onlogin: optional routine on user login
- options.onlogout: optional routine on user logout
- options.titlelogin: optional title for login modal
- options.titlelogged: optional title for logged modal
- options.modallogged: optional content (HTML Element) for modal content when user is logged
@param {object} options - UI options object
@returns {HTMLElement}
*/
UI.createButtonUser = (options)=>{
    if (!options) options = {};

    let elUserBTN;
    let elUserN = UI.elem("<span class='aton-btn-text'></span>");
    elUserN.classList.add("d-none");

    const updUserBTN = (username)=>{
        if (username){
            //console.log(username);
            //elUserBTN.classList.add("aton-btn-highlight");
            elUserBTN.classList.add("btn-accent");
            elUserN.innerHTML = username;
            elUserN.classList.remove("d-none");
            //elUserBTN.append(UI.elem("<span class='aton-btn-text'>"+username+"</span>"));
        }
        else {
            //elUserBTN.classList.remove("aton-btn-highlight");
            elUserBTN.classList.remove("btn-accent");
            elUserN.innerHTML = "";
            elUserN.classList.add("d-none");
            //elUserBTN.removeChild(elUserBTN.lastChild);
        }
    };

    elUserBTN = ATON.UI.createButton({
        icon: "bi-person-fill", //"user",
		//classes: "px-2",
        onpress: ()=>{
            if (options.onmodalopen) options.onmodalopen();

            ATON.checkAuth(
                // Logged
                (u)=>{
                    let elBody = ATON.UI.createContainer();

                    let elLogout = ATON.UI.createContainer({ classes: "d-grid gap-2" });
                    elLogout.append(
                        ATON.UI.createButton({
                            text: "Logout",
                            icon: "exit",
                            classes: "btn-accent",
                            onpress: ()=>{
                                ATON.REQ.logout();
                                UI.hideModal();

                                updUserBTN();
                                
                                if (options.onlogout) options.onlogout();
                            }
                        })
                    );

                    if (options.modallogged) elBody.append(options.modallogged);
                    elBody.append(elLogout);

                    ATON.UI.showModal({
                        header: (options.titlelogged)? options.titlelogged : u.username,
                        body: elBody
                    })
                },

                // Not logged
                ()=>{

                    updUserBTN();

                    ATON.UI.showModal({
                        header: (options.titlelogin)? options.titlelogin : "Authentication",
                        body: ATON.UI.createLoginForm({
                            onSuccess: (r)=>{
                                UI.hideModal();
                                updUserBTN(r.username);

                                if (options.onlogin) options.onlogin();
                            },
                            onFail: ()=>{
                                //TODO:
                            }
                        })
                    })
                }
            );
        }
    });

    elUserBTN.append(elUserN);

    ATON.checkAuth((u)=>{
        updUserBTN(u.username);
    });

    return elUserBTN;
};

/**
Create a dropdown
- options.title: the dropdown button title
- options.icon: icon for dropdown button
- options.items: an array of objects with "title" (string) and "url" (string) properties, an optional "icon" can be provided. Alternatively, a custom HTML element "el" can be provided as item.
- options.classes: optional list of space-separated CSS classes (e.g.: "myclass_A myclass_B") for the main HTML element
- options.btnclasses: optional list of space-separated CSS classes (e.g.: "myclass_A myclass_B") for the main button element
- options.dropdownclasses: optional list of space-separated CSS classes (e.g.: "myclass_A myclass_B") for the dropdown menu element

@param {object} options - UI options object
@returns {HTMLElement}
*/
UI.createDropdown = (options)=>{
    //if (!options.items) return undefined;

    if (!options.title) options.title = "Dropdown";

    let el = ATON.UI.createContainer({ classes:"dropdown" });

    let elBtn = UI.elem(`
        <button type="button" class="btn aton-btn dropdown-toggle px-2" data-bs-toggle="dropdown" aria-expanded="false"><span class="aton-btn-text">${options.title}</span></button>
    `);

    if (options.variant) elBtn.classList.add("btn-"+options.variant);
    
    if (options.icon) UI.prependIcon(elBtn, options.icon);

    el.append( elBtn );

    if (options.items){
        let elList = document.createElement("ul");

        elList.classList.add("dropdown-menu","aton-dropdown-menu");
        if (options.align){
            if (options.align==="right")  elList.classList.add("dropdown-menu-sm-end");
        }

        if (options.dropdownclasses) elList.className = elList.className + " " + options.dropdownclasses;

        for (let i=0; i<options.items.length; i++){
            let E = options.items[i];

            let elItem;

            if (E.el){
                elItem = UI.createContainer({classes:"dropdown-item aton-dropdown-item"});
                //elItem.classList.add("dropdown-item", "aton-dropdown-item");
                elItem.append(E.el);
            }
            else {
                if (E.url) elItem = UI.elem(`<a class="dropdown-item aton-dropdown-item" href="${E.url}">${E.title}</a>`);
                else if (E.onselect){
                    elItem = UI.elem(`<span class="dropdown-item aton-dropdown-item">${E.title}</span>`);
                    elItem.onclick = E.onselect;
                }
            }
            


            let elItemLI = document.createElement("li");
            elItemLI.append( elItem );
            elList.append( elItemLI );

            if (E.icon) UI.prependIcon(elItem, E.icon);
        }

        el.append(elList);
    }

    if (options.btnclasses) elBtn.className = elBtn.className + " " + options.btnclasses;
    if (options.classes)    el.className = el.className + " " + options.classes;
    

    return el;
};

/**
Create a select (basic dropdown)
- options.title: the select first entry
- options.items: an array of objects with "title" (string) and "value" (string) properties
- options.value: initial value
- options.

@param {object} options - UI options object
@returns {HTMLElement}
*/
UI.createSelect = (options)=>{
    let el = UI.elem(`<select class="form-select aton-input" aria-label="${options.label}"></select>`);

    let title = options.title? options.title : "-- Select...";
    el.append(UI.elem(`<option value="">-- ${title}</option>`));

    if (options.items){
        for (let i=0; i<options.items.length; i++){
            let E = options.items[i];
            let elO = UI.elem(`<option value="${E.value}">${E.title}</option>`);
            if (options.value === E.value) elO.setAttribute("selected",true);

            el.append(elO);
        }
    }

    //el.onchange = options.onselect;
    el.onchange = (e)=>{
        let val = el.value;
        
        if (val.length>0) options.onselect(val);
    }

    return el;
};

/**
Create a tabs group.
- options.items: an array of objects (tabs) with "title" (string) and "content" (HTML element) properties. An optional "icon" can also be assigned per tab, as well as "classes" to style a specific tab

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
            eltabbody = UI.elem("<div class='tab-pane show active' id='"+tabid+"' role='tabpanel' aria-labelledby='"+tabid+"-tab'></div>");
        else 
            eltabbody = UI.elem("<div class='tab-pane show' id='"+tabid+"' role='tabpanel' aria-labelledby='"+tabid+"-tab'></div>");

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
    
            elItem.append( UI.elem("<summary>"+title+"</summary>") );
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

// TODO:
UI.createAccordion = (options)=>{
    let baseid = (options.id)? options.id : ATON.Utils.generateID("tree");

    let el = UI.createContainer({
        classes: "accordion"
    });
    el.id = baseid;

    for (let i=0; i<options.items.length; i++){
        let e = options.items[i];

        let title   = e.title;
        let content = e.content;
        let stropen = e.open? "true" : "false";
        let accid   = baseid+"-"+i;

        let elAccordion = UI.createContainer({ classes: "accordion-item" });

        let elH = UI.elem(`
            <h2 class="accordion-header">
                <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${accid}" aria-expanded="${stropen}" aria-controls="${accid}">${title}</button>
            </h2>
        `);

        let elBody = UI.elem(`
            <div id="${accid}" class="accordion-collapse collapse show" data-bs-parent="#${baseid}">
                <div class="accordion-body"></div>
            </div>
        `);

        elBody.append(content);

        elAccordion.append(
            elH,
            elBody
        );

        el.append(elAccordion);
    }

    return el;
};

/**
Create a vector control
- options.vector: target THREE.Vector3 to be manipulated
- options.step: step value
- options.label: a label for this control (e.g.: "position")
- options.reset: an array of 3 values for a reset button (e.g.: [0,0,0])
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

    let el = UI.elem(`
        <div class="input-group mb-3 aton-inline">
            <input type="number" class="form-control aton-input-x" placeholder="x" aria-label="x" step="${step}" value="${posx}">
            <input type="number" class="form-control aton-input-y" placeholder="y" aria-label="y" step="${step}" value="${posy}">
            <input type="number" class="form-control aton-input-z" placeholder="z" aria-label="z" step="${step}" value="${posz}">
        </div>
    `);

    if (options.label){
        el.prepend( ATON.UI.elem("<span class='input-group-text aton-inline'>"+options.label+"</span>"));
    }

    if (options.reset){
        let R = options.reset;
        el.append(ATON.UI.createButton({
            icon: "cancel",
            classes: "btn-default",
            onpress: ()=>{
                elInputX.value = R[0];
                elInputY.value = R[1];
                elInputZ.value = R[2];

                if (V) V.set(R[0],R[1],R[2]);
                if (options.onupdate) options.onupdate();
            }
        }))
    }

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

    // Handle multi-field paste (comma separated values - eg: 2,3.5,8.1)
    let onpaste = (ev)=>{
        ev.preventDefault();

        let clip = ev.clipboardData.getData('text');
        clip = clip.split(",");
        if (clip.length === 3){
            elInputX.value = parseFloat(clip[0]);
            elInputY.value = parseFloat(clip[1]);
            elInputZ.value = parseFloat(clip[2]);

            if (V){
                V.set(elInputX.value, elInputY.value, elInputZ.value);
                if (options.onupdate) options.onupdate();
            }
        }
    };

    elInputX.onpaste = onpaste;
    elInputY.onpaste = onpaste;
    elInputZ.onpaste = onpaste;

    return el;
};

/**
Create a quaternion control
- options.quat: target THREE.Quaternion to be manipulated
- options.step: step value
- options.reset: an array of 4 values for a reset button (e.g.: [1,0,0,0])
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

    let el = UI.elem(`
        <div class="input-group mb-3 aton-inline">
            <input type="number" class="form-control aton-inline" placeholder="x" aria-label="x" step="${step}" value="${x}">
            <input type="number" class="form-control aton-inline" placeholder="y" aria-label="y" step="${step}" value="${y}">
            <input type="number" class="form-control aton-inline" placeholder="z" aria-label="z" step="${step}" value="${z}">
            <input type="number" class="form-control aton-inline" placeholder="w" aria-label="w" step="${step}" value="${w}">
        </div>
    `);

    if (options.label){
        el.prepend( ATON.UI.elem("<span class='input-group-text aton-inline'>"+options.label+"</span>"));
    }

    if (options.reset){
        let R = options.reset;
        el.append(ATON.UI.createButton({
            icon: "cancel",
            classes: "btn-default",
            onpress: ()=>{
                elInputX.value = R[0];
                elInputY.value = R[1];
                elInputZ.value = R[2];
                elInputW.value = R[3];

                if (V) V.set(R[0],R[1],R[2],R[3]);
                if (options.onupdate) options.onupdate();
            }
        }))
    }

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

    elInputW.oninput = ()=>{
        let v = elInputW.value;

        if (Q) Q.w = v;
        if (options.onupdate) options.onupdate();
    };

    // Handle multi-field paste (comma separated values - eg: 2,3.5,8.1)
    let onpaste = (ev)=>{
        ev.preventDefault();

        let clip = ev.clipboardData.getData('text');
        clip = clip.split(",");
        if (clip.length === 3){
            elInputX.value = parseFloat(clip[0]);
            elInputY.value = parseFloat(clip[1]);
            elInputZ.value = parseFloat(clip[2]);
            elInputW.value = parseFloat(clip[3]);

            if (Q){
                Q.set(elInputX.value, elInputY.value, elInputZ.value, elInputW.value);
                if (options.onupdate) options.onupdate();
            }
        }
    };

    elInputX.onpaste = onpaste;
    elInputY.onpaste = onpaste;
    elInputZ.onpaste = onpaste;
    elInputW.onpaste = onpaste;

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

/*
    let origPos = [N.position.x, N.position.y, N.position.z];
    let origRot = [N.rotation.x, N.rotation.y, N.rotation.z];
    let origScl = [N.scale.x, N.scale.y, N.scale.z];
*/
    // Position
    if (options.position){

        let elPos = UI.createVectorControl({
            vector: N.position,
            step: options.position.step,
            reset: [0,0,0]
        });

        el.append( UI.elem("<label class='form-label hathor-text-block' for='"+elPos.id+"'>Position</label>") );
        el.append( elPos );
    }

    // Scale
    if (options.scale){

        let elScale = UI.createVectorControl({
            vector: N.scale,
            step: options.scale.step,
            reset: [1,1,1]
        });

        el.append( UI.elem("<label class='form-label hathor-text-block' for='"+elScale.id+"'>Scale</label>") );
        el.append( elScale );
    }

    // Rotation
    if (options.rotation){

        let elRot = UI.createVectorControl({
            vector: N.rotation,
            step: options.rotation.step,
            reset: [0,0,0]
        });
/*
        let elRot = UI.createQuaternionControl({
            quat: N.quaternion,
            step: options.rotation.step
        });     
*/
        el.append( UI.elem("<label class='form-label hathor-text-block' for='"+elRot.id+"'>Rotation</label>") );
        el.append( elRot );
    }

    return el;
};

/**
Create a generic card.
- options.size: "small" or "large", if not provided standard size is used
- options.cover: cover image url or DOM element
- options.stdcover: fallback cover img (if cover not found or fetch error)
- options.url: landing url when selecting the main cover
- options.onactivate: alternatively to url, a routine on cover activation
- options.keywords: keywords object (eg. {"term_a":1, "term_b":1 }) to filter this card
- options.title: card title
- options.subtitle: custom subtitle element
- options.footer: custom footer element
- options.useblurtint: use special blur effect on this card

Components:
- "img"
- "body"
- "title"
- "subtitle"
- "footer"

@param {object} options - UI options object
@returns {HTMLElement}
*/
UI.createCard = (options)=>{
    let cc = "card aton-card ";
    if (options.classes) cc += options.classes;

    let el = ATON.UI.createContainer({ classes: cc });

    if (Array.isArray(options.size)){
        el.style.width  = options.size[0]+"px";
        el.style.height = options.size[1]+"px";
    }

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
        let elcov = ATON.UI.elem(`<div class='aton-card-cover'></div>`);

        if (options.cover instanceof Element){
            elcov.append(options.cover);
        }
        else {
            // Blur bg
            if (options.useblurtint){
                let bgdiv = document.createElement('div');
                bgdiv.classList.add("aton-card-bg");
                bgdiv.style.backgroundImage = "url('"+options.cover+"')";
                el.append(bgdiv);
            }

            let elImg = document.createElement("img");
            elImg.classList.add("card-img-top");
            elImg.src = options.cover;
            if (options.stdcover) elImg.onerror = ()=>{
                elImg.src = options.stdcover;
            };

            if (options.onactivate){
                elcov.append( elImg );
                elcov.onclick = options.onactivate;
            }
            else if (options.url) {
                let elA = ATON.UI.elem(`<a href='${options.url}'></a>`);
                elA.append( elImg );
                
                elcov.append( elA );
            }

            UI.registerElementAsComponent(elImg, "img");
        }

        el.append(elcov);
    }
    
    // Body
    let elbody = document.createElement('div');
    elbody.classList.add("card-body","aton-card-body");

    UI.registerElementAsComponent(elbody, "body");

    el.append(elbody);

    // Title
/*
    let elTitle = document.createElement("div");
    elTitle.classList.add("card-title", "aton-card-title");
    elTitle.innerHTML = "Title";
    elbody.append(elTitle);

    UI.registerElementAsComponent(elTitle, "title");
*/

    if (options.title){
        let elTitle = document.createElement("div");
        elTitle.classList.add("card-title", "aton-card-title");
        elbody.append(elTitle);

        UI.registerElementAsComponent(elTitle, "title");

        elTitle.innerHTML = options.title;
        sskwords += " "+options.title.trim().toLowerCase();
        el.setAttribute("data-search-term", sskwords);
    }

    // Sub-title
    if (options.subtitle){
        let elSub = ATON.UI.elem(`<div class='card-subtitle mb-2 text-body-secondary'></div>`);

        elSub.append(options.subtitle);
        UI.registerElementAsComponent(elSub, "subtitle");

        elbody.append(elSub);
    }

    // Footer
    if (options.footer){
        let elFooter = document.createElement('div');
        elFooter.classList.add("card-footer");
        elFooter.append(options.footer);
        UI.registerElementAsComponent(elFooter, "footer");

        elbody.append(elFooter);
    }

    if (options.badge){
        let elB = UI.elem("<span class='position-absolute top-0 start-0 translate-middle aton-card-badge'></span>"); // rounded-circle
        
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
- options.url: custom url to open the scene (typically a custom app/viewer)

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
        elSub = ATON.UI.elem(`
            <div><img class='icon aton-icon aton-icon-small' style='margin-right:4px' src='${UI.resolveIconURL("user")}'>${user}</div>
        `);

    let el = ATON.UI.createCard({
        title: (options.title)? options.title : usid, // "Scene"
        keywords: kw,
        size: options.size,
        useblurtint: options.useblurtint,
        classes: options.classes,
        cover: ATON.PATH_RESTAPI2+"scenes/"+sid+"/cover",
        url: options.url? options.url : ATON.BASE_URL + "/v2/s/" + sid, //ATON.PATH_FE + sid,
        subtitle: elSub,
        footer: options.footer,
        badge: options.badge
    });

    return el;
};

/**
Create a live filter, search as user is typing
- options.filterclass: items class to filter (eg. "aton-card") in the current document
- options.onfocus: routine when input filed is focused
- options.onblur: routine when leaving input filed
- options.oninput: custom routine on keyboard input. If not provided uses filterclass option

Components:
- "input"

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

    let elInput = UI.elem(`<input class="form-control me-2 aton-input" type="search" placeholder="${placeholder}" aria-label="Search" id="${inputid}" spellcheck="false" >`);

    UI.registerElementAsComponent(elInput, "input");

    const elInGroup = document.createElement("div");
    elInGroup.classList.add("input-group","aton-inline"); //,"mb-2");
    elInGroup.append(UI.elem("<span class='input-group-text aton-input'><i class='bi bi-search'></i></span>"));
    elInGroup.append(elInput);

    if (options.oninput) elInput.oninput = options.oninput;
    else elInput.oninput = ()=> {
        if (!options.filterclass) return;

        let v = elInput.value.trim().toLowerCase();
        let filterItems = document.querySelectorAll(`.${options.filterclass}`);

        if (v.length < 3) {
            for (let item of filterItems) {
                // Using Bootstrap 5 class `d-none`
                //item.classList.remove('d-none');
                ATON.UI.showElement(item);
            }

            return;
        }    

        for (let item of filterItems) {
            let attr = item.getAttribute('data-search-term');

            if (attr && (attr.includes(v) || v.length < 1)) {
                //item.classList.remove('d-none');
                ATON.UI.showElement(item);
            }
            else {
                //item.classList.add('d-none');
                ATON.UI.hideElement(item);
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
Create a chip (keyword / tag)
- options.term: the term (string)
- options.count: optional counter for this keyword
- options.onpress: optional routine to launch on click
- options.onremove: optional routine when removing this keyword, adds a remove btn

@param {object} options - UI options object
@returns {HTMLElement}
*/
UI.createChip = (options)=>{
    let el = UI.elem(`<button type="button" class="btn btn-sm btn-outline-secondary aton-chip"><span class='aton-chip-text'>${options.term}</span></button>`);

    if (options.count){
        let elCount = UI.elem(`<span class="badge text-bg-secondary">${options.count}</span>`);
        el.append(elCount);
    }

    if (options.onremove){
        let elClose = UI.elem(`<button type='button' class='btn-close btn-sm' style='margin:0px; margin-left:2px' aria-label='Close'></button>`);
        elClose.onclick = ()=>{
            el.remove();
            options.onremove();
        };

        el.append(elClose);
    }

    if (options.classes) el.className = el.className + " " + options.classes;

    if (options.onpress) el.onclick = options.onpress;

    return el;
};

/**
Create a tags component
- options.list: optional controlled list of tags to select from
- options.tags: optional pre-populated tags
- options.label: label for input tag
- options.onaddtag: on tag added routine (e.g.: (k)=>{ console.log(k); } )
- options.onremovetag: on tag removed routine (e.g.: (k)=>{ console.log(k); } )

@param {object} options - UI options object
@returns {HTMLElement}
*/
UI.createTagsComponent = (options)=>{
    if (!options) options = {};
    
    let el = UI.createContainer();

    let tags = {};

    let addTag = (k)=>{
        if (tags[k]) return false;

        tags[k] = 1;

        el.append( UI.createChip({
            term: k,
            onremove: ()=>{
                tags[k] = undefined;
                
                if (options.onremovetag) options.onremovetag(k);
            }
        }));

        return true;
    }

    let elTagInput = UI.createInputText({
        list: options.list,
        label: options.label,
        onchange: (k)=>{
            k = k.trim();
            if (k.length < 1) return;

            let elInput = UI.getComponent(elTagInput, "input");
            elInput.value = "";

            if (!addTag(k)) return;

            if (options.onaddtag) options.onaddtag(k);
        }
    });

    el.append(elTagInput);

    if (options.tags){
        for (let k in options.tags) addTag(options.tags[k]);
    }

    return el;
};

/**
Create layer control. By default it allows basic switching (on/off)
- options.node: node ID (string) of the ATON node
- options.actions: optional list (array) of HTML elements (e.g. buttons) being added to this layer actions

Components: "actions"

@param {object} options - UI options object
@returns {HTMLElement}
*/
UI.createLayerControl = (options)=>{
    let nid = options.node;
    let N = ATON.getSceneNode(nid);

    //const elNode = UI.elem(`<div class="aton-layer"></div>`);

    let elNode = ATON.UI.createContainer({
		classes: "btn-group",
        style: "width:100%",
        //style: "display:block; !important"
	});

    let elMain = ATON.UI.createButton({
        text: nid,
        classes: "btn-default",
        onpress: (options.mainaction)? ()=>{
            options.mainaction(nid);   
        } : undefined
    });
/*
    if (options.mainaction) elNode.onclick = ()=>{
        options.mainaction(nid);
    }
*/
    if (!N.visible) elNode.classList.add("aton-layer-hidden");

    const elActionsC = ATON.UI.createContainer({
        classes: "btn-group",
        style: "display:inline-block; margin-right:0px"
    });
    UI.registerElementAsComponent(elActionsC, "actions");
    elNode.append(elActionsC);

    const elVis = ATON.UI.createButton({
        icon: "visibility",// "bi-eye-fill",
        //size: "small",
        classes: (N.visible)? "aton-btn-highlight" : undefined,
        //style: "max-width: 40px; !important",
        onpress: ()=>{
            if (N.visible){
                N.hide();
                elVis.classList.remove("aton-btn-highlight");
                elNode.classList.add("aton-layer-hidden");
            }
            else {
                N.show();
                elVis.classList.add("aton-btn-highlight");
                elNode.classList.remove("aton-layer-hidden");
            }   
        }
    });

    elActionsC.append(elVis);
    //elNode.append(elVis);

    if (options.actions){
        for (let a in options.actions){
            let elAction = options.actions[a];
            elActionsC.append(elAction);
            //elNode.append(elAction);
        }
    }

    //elNode.append(N.nid);
    elNode.append(elMain);
    return elNode;
};

UI.createBasicLayersManager = (options)=>{
    let el = ATON.UI.createContainer();

    let root = ATON.getRootScene();

    for (let c in root.children){
        const N = root.children[c];
        
        if (N.nid){
            let elLayer = ATON.UI.createLayerControl({
                node: N.nid,
            });

            el.append(elLayer);
        }
    }

    return el;
/*
    let root = ATON.getRootScene();

    for (let c in root.children){
        const N = root.children[c];
        
        if (N.nid){
            const elNode = UI.elem(`<div class="aton-layer"></div>`);

            if (!N.visible) elNode.classList.add("aton-layer-hidden");

            const elActionsC = ATON.UI.createContainer({style: "display:inline-block; margin-right:4px"});
            elNode.append(elActionsC);

            const elVis = ATON.UI.createButton({
                icon: "visibility",// "bi-eye-fill",
                size: "small",
                classes: (N.visible)? "aton-btn-highlight" : undefined,
                onpress: ()=>{
                    if (N.visible){
                        N.hide();
                        elVis.classList.remove("aton-btn-highlight");
                        elNode.classList.add("aton-layer-hidden");
                    }
                    else {
                        N.show();
                        elVis.classList.add("aton-btn-highlight");
                        elNode.classList.remove("aton-layer-hidden");
                    } 
                        
                }
            });

            elActionsC.append(elVis);

            //if (options.setupActions) options.setupActions(elActionsC);

            if (options.manager){
                const elManage = ATON.UI.createButton({
                    icon: "settings",
                    size: "small",
                    onpress: ()=>{
                        options.manager(N.nid);
                    }
                });

                elActionsC.append(elManage)
            }

            elNode.append(N.nid);

            el.append(elNode);
        }
    }

    return el;
*/
};

/**
Create a range/slider
- options.range: min and max values pair (e.g. [0,10])
- options.step: optional step value (default: 1)
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
        elLabel = UI.elem("<label for='"+baseid+"' class='aton-range-label'><b>"+options.label+"</b>: </label>");
        //elLabel = UI.elem("<span class='input-group-text'><i class='bi bi-search'></i></span>");
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

    let elInput = UI.elem(`
        <input type="range" class="aton-range aton-input" list="ticks-${baseid}" min="${min}" max="${max}" step="${step}" id="${baseid}">
    `);

    if (options.value !== undefined) elInput.value = options.value;

    if (options.classes) el.className = el.className + " " + options.classes;

    el.append(elInput);

/*
    if (options.ticks){
        let elDL = document.createElement("datalist");
        elDL.id = "ticks-"+baseid;

        for (let t=min; t<=max; t+=step){
            elDL.append( UI.elem("<option value='"+t+"'></option>") );
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

/**
Create an input text field
- options.label: optional label for the input field
- options.placeholder: optional placeholder
- options.value: initial value
- options.list: array of strings (datalist)
- options.oninput: on input routine (e.g.: (val)=>{ console.log(val); } )
- options.onchange: on change routine (e.g.: (val)=>{ console.log(val); } )

Components:
- "input"
- "datalist"

@param {object} options - UI options object
@returns {HTMLElement}
*/
UI.createInputText = (options)=>{
    let baseid = ATON.Utils.generateID("txtfield");
    
    let el = ATON.UI.createContainer({classes: "input-group aton-inline" });
    el.id = baseid;

    let label = "";

    if (options.label){
        label = options.label;
        el.append(UI.elem("<span class='input-group-text aton-inline'>"+label+"</span>"));
    }

    let elInput = UI.elem(`<input class="form-control aton-input" aria-label="${label}" type="search" spellcheck="false" >`);
    UI.registerElementAsComponent(elInput, "input");

    elInput.id = baseid + "-input";

    if (options.value) elInput.value = String(options.value);

    if (options.placeholder) elInput.setAttribute("placeholder", options.placeholder);

    if (options.oninput) elInput.oninput = ()=>{
        options.oninput( elInput.value );
    };
    if (options.onchange) elInput.onchange = ()=>{
        options.onchange(elInput.value);
    };

    el.append(elInput);

    if (options.list){
        const L = options.list;

        elInput.setAttribute("list", baseid+"-list");
        let elDatalist = UI.elem("<datalist id='"+baseid+"-list'></datalist>");
        UI.registerElementAsComponent(elDatalist, "datalist");

        for (let i in L){
            let itemname = L[i];
            if (options.listnames) itemname = options.listnames[i];

            elDatalist.append(
                UI.elem("<option value='"+L[i]+"'></option>") // "+itemname+"
            );
        }
        
        el.append(elDatalist);
    }

    return el;
};

UI.createInput3DModel = (options)=>{
    let el = ATON.UI.createContainer();
    
    if (!options) options = {};

    ATON.checkAuth(
        (u)=>{
            ATON.REQ.get("items/"+u.username+"/models/", entries => {

                const itemnames = entries.map(item => {
                    return item.replace(u.username+"/models/", "");
                });
             
                let elIT = ATON.UI.createInputText({
                    label: options.label,
                    placeholder: "3D model URL...",
                    list: entries,
                    listnames: itemnames,
                    oninput: options.oninput,
                    onchange: options.onchange
                });
        
                el.append( elIT );

                let elInput = elIT.getElementsByTagName("input")[0];
/*
                if (options.actionbutton){
                    elIT.append( options.actionbutton );
                }
*/

                elIT.append( ATON.UI.createButton({
                    icon: options.actionicon? options.actionicon : "collection-item",
                    text: options.actiontext,
                    classes: "btn-default",
                    onpress: ()=>{
                        if (options.onaction) options.onaction( elInput.value );
                        elInput.value = "";
                    }
                }));

            });
        }
    );

    return el;
};

UI.createInputPanorama = (options)=>{
    let el = ATON.UI.createContainer();
    
    if (!options) options = {};

    ATON.checkAuth(
        (u)=>{
            ATON.REQ.get("items/"+u.username+"/panoramas/", entries => {

                console.log(entries)

                const itemnames = entries.map(item => {
                    return item.replace(u.username+"/pano/", "");
                });
             
                let elIT = ATON.UI.createInputText({
                    label: options.label,
                    placeholder: "Panorama URL...",
                    list: entries,
                    listnames: itemnames,
                    oninput: options.oninput,
                    onchange: options.onchange
                });
        
                el.append( elIT );

                let elInput = elIT.getElementsByTagName("input")[0];
/*
                if (options.actionbutton){
                    elIT.append( options.actionbutton );
                }
*/

                elIT.append( ATON.UI.createButton({
                    icon: options.actionicon? options.actionicon : "collection-item",
                    text: options.actiontext,
                    classes: "btn-default",
                    onpress: ()=>{
                        if (options.onaction) options.onaction( elInput.value );
                        elInput.value = "";
                    }
                }));

            });
        }
    );

    return el;
};

UI.createColorPicker = (options)=>{    
    if (!options) options = {};

    let el = ATON.UI.createContainer({classes: "input-group aton-inline" });

    let label = "";

    if (options.label){
        label = options.label;
        el.append(UI.elem("<span class='input-group-text aton-inline'>"+label+"</span>"));
    }

    let elInput = UI.elem(`<input class="form-control aton-input" aria-label="${label}" type="color">`);
    UI.registerElementAsComponent(elInput, "input");

    el.append(elInput);

    if (options.color) elInput.value = options.color;

    if (options.onchange) elInput.onchange = ()=>{
        options.onchange(elInput.value);
    };

    if (options.oninput) elInput.oninput = ()=>{
        options.oninput(elInput.value);
    };

    return el;
};

/**
Create an audio recorder
- options.iconrec: icon for record audio button (e.g. "rec")
- options.textrec: optional text for recording button
- options.textplay: optional text for replay audio button
- options.onaudio: handler when audio is ready (e.g.: (data)=>{ }), data is base64

Components:
- "input"
- "datalist"

@param {object} options - UI options object
@returns {HTMLElement}
*/
UI.createAudioRecorder = (options)=>{

    let el, elRec,elStop,elPlay;
    let audio = undefined;

    elRec = ATON.UI.createButton({
        icon: (options.iconrec)? options.iconrec : "rec",
        classes: "btn-default",
        text: options.textrec,
        tooltip: "Record new audio",
        onpress: ()=>{
            ATON.MediaFlow.startRecording();

            elStop.classList.remove("d-none");
            elRec.classList.add("d-none");
            elPlay.setAttribute("disabled",true);
        }
    });

    elStop = ATON.UI.createButton({
        icon: "cancel",
        classes: "d-none btn-default aton-recording-bg",
        text: options.textrec,
        tooltip: "Stop recording audio",
        onpress: ()=>{
            ATON.MediaFlow.stopRecording();
        }
    });

    ATON.on("AudioRecordCompleted", (b64)=>{
        if (!b64) return;

        audio = new Audio();
        audio.src = b64;

        audio.onended = (e)=>{
            elPlay.classList.remove("aton-btn-highlight");
        };
/*
        audio.onloadedmetadata = (e)=>{
            audio.duration
        };
*/
        elStop.classList.add("d-none");
        elRec.classList.remove("d-none");

        elPlay.removeAttribute("disabled");

        if (options.onaudio) options.onaudio(b64);
    });

    //elAudio = ATON.UI.elem("<audio class='margin:auto' controls ></audio>");

    elPlay = ATON.UI.createButton({
        icon: "play",
        tooltip: "Play recorded audio",
        text: options.textplay,
        classes: "btn-default",
        onpress: ()=>{
            if (!audio) return;

            // already playing
            if (audio.duration > 0 && !audio.paused){
                audio.pause();
                audio.currentTime = 0;

                elPlay.classList.remove("aton-btn-highlight");
            }
            else {
                audio.play();
                elPlay.classList.add("aton-btn-highlight");
            }
        }
    });

    elPlay.setAttribute("disabled",true);

    el = ATON.UI.createContainer({
        classes: "btn-group",
        //style: "vertical-align: middle;"
    });

    //el.append(elRow);
    el.append( elRec, elStop, elPlay );

    if (options.classes) el.className = el.className + " " + options.classes;

    return el;
};

UI.createLoginForm = (options)=>{
    if (!options) options = {};

    let el = document.createElement("form");
    el.classList.add("container-sm", "text-center");

    let elUsername = UI.elem(`<div class="input-group mb-4 aton-inline"><span class="input-group-text">Username</span></div>`);
    let elPassword = UI.elem(`<div class="input-group mb-4 aton-inline"><span class="input-group-text">Password</span></div>`);

    let elInputUN = UI.elem(`<input id="uname" type="text" maxlength="30" class="form-control aton-input" aria-label="Username" aria-describedby="inputGroup-sizing-sm" placeholder="Username" spellcheck="false" >`);
    let elInputPW = UI.elem(`<input id="passw" type="password" maxlength="30" class="form-control aton-input" aria-label="Password" aria-describedby="inputGroup-sizing-sm" placeholder="Password" spellcheck="false" >`);

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
    else el.append( UI.elem(`<i class="bi bi-person" style="font-size:3em;"></i>`) );
    //else el.append( ATON.UI.elem(`<img src="${ATON.PATH_RES}aton-logo.png" style="width:50px; height:auto; margin-bottom:20px">`) );

    el.append(elUsername);
    el.append(elPassword);
    
    el.append( UI.createContainer({ items:[ elEnter ], classes:"d-grid gap-2" }) );

    return el;
};



export default UI;
