/*
    ATON App Hub
    Web-Apps

    author: bruno.fanini_AT_gmail.com

===========================================================*/

//import AppData from "./ATON.appdata.js";

/**
ATON App Hub
@namespace AppHub
*/
let AppHub = {};

// Realize the hub
AppHub.init = ()=>{
    AppHub._appid   = $("meta[name='aton\\:appid']").attr("content");
    AppHub._appdata = {};
};

// Send JSON patch
// TODO: https://tools.ietf.org/html/rfc6902
AppHub._sendDataPatch = (id, patch, mode)=>{
    return new Promise((resolve, reject)=>{
        if (id === undefined){
            reject("No storage ID specified");
            return;
        }
        if (id.length < 3){
            reject("Storage ID too short");
            return;
        }
        if (patch === undefined){
            reject("No storage patch");
            return;
        }
        if (AppHub._appid === undefined){
            reject("No app-ID");
            return;
        }

        if (mode === undefined) mode = ATON.PATCH_ADD;

        let O = {};
        O.wappid = AppHub._appid;
        O.fid    = id;
        O.data   = patch;
        O.mode   = (mode === ATON.PATCH_DEL)? "DEL" : "ADD";

        let jstr = JSON.stringify(O);
        //console.log(jstr);

        $.ajax({
            url: ATON.PATH_RESTAPI+"patch/wapp",
            type:"POST",
            data: jstr,
            contentType:"application/json; charset=utf-8",
            dataType:"json",

            success: (r)=>{
                if (r === undefined){
                    reject("Error writing on server");
                    return;
                }

                AppHub._appdata[id] = r;
                resolve(r);
            }
        });
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
@param {object} id - server-side storage ID
@param {object} patch - a javascript object patch
@example
ATON.AppHub.addToStorage("myStorage", {score: 20}).then(...)
*/
AppHub.addToStorage = (id, patch)=>{
    //AppHub._sendDataPatch(id, patch, ATON.PATCH_ADD, onComplete);
    return AppHub._sendDataPatch(id, patch, ATON.PATCH_ADD);
};

/**
Delete data from server-side storage of current web-app
@param {object} id - server-side storage ID
@param {object} patch - a javascript object patch
@example
ATON.AppHub.deleteFromStorage("myStorage", {score: {}}).then(...)
*/
AppHub.deleteFromStorage = (id, patch)=>{
    //AppHub._sendDataPatch(id, patch, ATON.PATCH_DEL, onComplete);
    return AppHub._sendDataPatch(id, patch, ATON.PATCH_DEL);
};

/**
Get content of server-side storage for current web-app
@param {object} id - server-side storage ID
@example
ATON.AppHub.getStorage("myStorage").then((s)=>{ console.log(s); })
*/
AppHub.getStorage = (id)=>{
    return new Promise((resolve, reject)=>{
        if (AppHub._appid === undefined){
            reject();
            return;
        }
        if (id === undefined){
            reject("No storage ID specified");
            return;
        }

        $.getJSON( ATON.PATH_WAPPS+AppHub._appid+"/data/"+id+".json", (data)=>{
            console.log(data);
            AppHub._appdata[id] = data;
            resolve(data);
        });
    });

};


export default AppHub;