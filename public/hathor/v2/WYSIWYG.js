/*===========================================================================

    "Hathor" v2
    WYSIWYG Editor component based on JODIT

    Author: B. Fanini

===========================================================================*/
let WYSIWYG = {};

WYSIWYG.STD_TOOLBAR = "source,|,bold,italic,eraser,ul,ol,font,paragraph,|,hr,table,link,symbols";

WYSIWYG.el     = undefined;
WYSIWYG.editor = undefined;



WYSIWYG.createElement = ()=>{
    WYSIWYG.el = ATON.UI.elem(`<textarea id="WYSIWYGeditor" name="editor"></textarea>`);
    
    return WYSIWYG.el;
};

// TODO:
WYSIWYG.createToolbar = ()=>{
    let el = HATHOR.UI.createBlockGroup({
        items:[
            ATON.UI.createInputText({

            })
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