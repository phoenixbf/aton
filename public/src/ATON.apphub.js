/*
    ATON App Hub
    Web-Apps

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
ATON App Hub
@namespace AppHub
*/
let AppHub = {};

// Realize the hub
AppHub.init = ()=>{
    AppHub._appid = undefined;
    AppHub._appdata = {};
};

// Send JSON patch
// TODO: https://tools.ietf.org/html/rfc6902
AppHub._sendDataPatch = (patch, mode, onComplete)=>{
    if (patch === undefined) return;
    if (mode === undefined) mode = ATON.PATCH_ADD;

    // First time
    if (AppHub._appid === undefined){
        let appid = $("meta[name='title']").attr("content");
        if (appid === undefined || appid === null || appid.length < 2) return;
        AppHub._appid = appid;
    }

    let O = {};
    O.wappid = AppHub._appid;
    O.data   = patch;
    O.mode   = (mode === ATON.PATCH_DEL)? "DEL" : "ADD";

    let jstr = JSON.stringify(O);
    console.log(jstr);

    $.ajax({
        url: ATON.PATH_RESTAPI+"patch/wapp",
        type:"POST",
        data: jstr,
        contentType:"application/json; charset=utf-8",
        dataType:"json",

        success: (r)=>{
            if (r === undefined) return;

            AppHub._appdata = r;
            if (onComplete) onComplete();
        }
    });
};

/**
Get current web-app ID
@returns {string} - web-app ID
*/
AppHub.getAppID = ()=>{
    return AppHub._appid;
};

/**
Add data to persistent, server-side storage of current web-app
@param {object} patch - a javascript object patch
@param {function} onComplete - on data stored
@example
ATON.AppHub.addToStorage({score: 20)
*/
AppHub.addToStorage = (patch, onComplete)=>{
    AppHub._sendDataPatch(patch, ATON.PATCH_ADD, onComplete);
};

/**
Delete data from server-side storage of current web-app
@param {object} patch - a javascript object patch
@param {function} onComplete - on data stored
@example
ATON.AppHub.deleteFromStorage({score: {}})
*/
AppHub.deleteFromStorage = (patch, onComplete)=>{
    AppHub._sendDataPatch(patch, ATON.PATCH_DEL, onComplete);
};

/**
Get content of server-side storage for current web-app
@param {function} onComplete - on data received
@example
ATON.AppHub.getStorage((data)=>{ console.log(data); })
*/
AppHub.getStorage = (onComplete)=>{
    if (AppHub._appid === undefined) return;

    return $.getJSON( ATON.PATH_WAPPS+AppHub._appid+"/data.json", ( data )=>{
        AppHub._appdata = data;
        if (onComplete) onComplete(data);
    });
};


export default AppHub;