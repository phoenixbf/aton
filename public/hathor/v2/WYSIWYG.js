/*===========================================================================

    "Hathor" v2
    WYSIWYG Editor component based on JODIT

    Author: B. Fanini

===========================================================================*/
let WYSIWYG = {};

WYSIWYG.STD_TOOLBAR = "source,|,bold,italic,underline,|,ul,ol,fontsize,paragraph,|,hr,table,symbols,|,link,image,video";

WYSIWYG.el     = undefined;
WYSIWYG.editor = undefined;
WYSIWYG._elED  = undefined;



WYSIWYG.createElement = ()=>{
    WYSIWYG.el = ATON.UI.elem(`<textarea id="WYSIWYGeditor" name="editor"></textarea>`);
    
    return WYSIWYG.el;
};

// TODO:
WYSIWYG.createToolbar = (options)=>{
    if (!options) options = {};

    let S = ATON.getSemanticNode(options.semid);

    let el = HATHOR.UI.createBlockGroup({
        items:[
            ATON.UI.createInputMedia({
                actionicon: "add",
                label: "Insert media",
                placeholder: "URL...",
                onaction: (url)=>{
                    if (!url) return;
                    if (url.length<2) return;

                    let el = ATON.UI.createMediaItem({url: url});

                    let ED = document.getElementsByClassName("jodit-wysiwyg");
                    ED[0].focus();

                    let html = el.outerHTML;

                    WYSIWYG.insert( html );
                }
            }),
/*
            ATON.UI.createAudioRecorder({
                textrec: "Vocal note",
                onaudio: (b64)=>{
                    if (S) S.setAudio(b64);
                }
            })
*/
        ]
    });

    return el;
};

WYSIWYG.init = ()=>{
    WYSIWYG.editor = Jodit.make('#WYSIWYGeditor', {
        //theme: "dark",
        //toolbarButtonSize: 'small',
        //height: 200,

        useSearch: false,
        showCharsCounter: false,
        showWordsCounter: false,
        showXPathInStatusbar: false,
        inline: true,
        //toolbarInlineForSelection: true,
        showPlaceholder: false,

        disablePlugins: "about,add-new-line,ai-assistant,search,print,xpath",

        buttons: WYSIWYG.STD_TOOLBAR,
        buttonsMD: WYSIWYG.STD_TOOLBAR,
        buttonsSM: WYSIWYG.STD_TOOLBAR,
        buttonsXS: WYSIWYG.STD_TOOLBAR,
/*
        extraButtons: [
            {
                name: 'insertDate',
                iconURL: ATON.UI.resolveIconURL("user"),
                exec: (editor)=>{
                    UI.WYSIWYGeditorInsert(new Date().toDateString())
                }
            }
        ],
*/

        uploader: {
            insertImageAsBase64URI: true
        }
    });

    WYSIWYG.el = ATON.UI.get("WYSIWYGeditor");

    WYSIWYG.el.onfocus = ()=>{ ATON.UI.inputFocus(true); };
    WYSIWYG.el.onblur  = ()=>{ ATON.UI.inputFocus(false); };

    let els = document.getElementsByClassName("jodit-wysiwyg");
    els[0].onfocus = ()=>{ ATON.UI.inputFocus(true); };
    els[0].onblur = ()=>{ ATON.UI.inputFocus(false); };
};

// Insert custom HTML in current cursor location or overwrite entire content
WYSIWYG.insert = (html, bOverwrite)=>{
    if (!WYSIWYG.editor) return;

    if (bOverwrite) WYSIWYG.editor.value = "";
    WYSIWYG.editor.s.insertHTML(html);
    
    WYSIWYG.editor.synchronizeValues(); // For history saving
};

// Retrieve HTML content from editor
WYSIWYG.getHTML = ()=>{
    if (!WYSIWYG.el) return undefined;
    
    return WYSIWYG.el.value.trim();
};

export default WYSIWYG;