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

//UI.POPUP_DT = 500; //300;


UI.init = ()=>{
    UI.PATH_RES_ICONS = ATON.PATH_RES+"icons/";

    UI._setupBase();
};

// Utility function to create DOM element from string
UI._createElemementFromHTMLString = (html)=>{
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.firstElementChild;
};

// Setup base structure
UI._setupBase = ()=>{
    document.body.oncontextmenu = ()=>{ return false; };

    // Modal dialog
    //UI.elModal = document.createElement('div');
    UI.elModal = UI._createElemementFromHTMLString(`
        <div class="modal fade modal-fullscreen-md-down" id="staticBackdrop" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div id="uiModalHeader" class="modal-header"></div>
                    <div id="uiModalBody" class="modal-body"></div>
                    <div id="uiModalFooter" class="modal-footer"></div>
                </div>
            </div>
        </div>
	`);

    document.body.append(UI.elModal);

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

export default UI;
