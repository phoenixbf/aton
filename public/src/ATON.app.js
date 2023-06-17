/*
    ATON App Hub
    Web-Apps

    author: bruno.fanini_AT_gmail.com

===========================================================*/

//import AppData from "./ATON.appdata.js";

/**
ATON App Hub
@namespace App
*/
let App = {};


App._id    = $("meta[name='aton\\:appid']").attr("content");
App._data  = {};
App.setup  = undefined;
App.update = undefined;

App._bRunning = false;


// Send JSON patch
// TODO: https://tools.ietf.org/html/rfc6902
App._sendDataPatch = (id, patch, mode)=>{
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
        if (App._id === undefined){
            reject("No app-ID");
            return;
        }

        if (mode === undefined) mode = ATON.PATCH_ADD;

        let O = {};
        O.wappid = App._id;
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

                App._data[id] = r;
                resolve(r);
            }
        });
    });
};

/**
Get current web-app ID
@returns {string} - web-app ID
*/
App.getAppID = ()=>{
    return App._id;
};

/**
Add or Update data into persistent (server-side) storage of current web-app
@param {object} id - server-side storage ID
@param {object} patch - a javascript object patch
@example
ATON.App.addToStorage("myStorage", {score: 20}).then(...)
*/
App.addToStorage = (id, patch)=>{
    //App._sendDataPatch(id, patch, ATON.PATCH_ADD, onComplete);
    return App._sendDataPatch(id, patch, ATON.PATCH_ADD);
};

/**
Delete data from persistent (server-side) storage of current web-app
@param {object} id - server-side storage ID
@param {object} patch - a javascript object patch
@example
ATON.App.deleteFromStorage("myStorage", {score: {}}).then(...)
*/
App.deleteFromStorage = (id, patch)=>{
    //App._sendDataPatch(id, patch, ATON.PATCH_DEL, onComplete);
    return App._sendDataPatch(id, patch, ATON.PATCH_DEL);
};

/**
Get content of persistent (server-side) storage of current web-app
@param {object} id - server-side storage ID
@example
ATON.App.getStorage("myStorage").then((s)=>{ console.log(s); })
*/
App.getStorage = (id)=>{
    return new Promise((resolve, reject)=>{
        if (App._id === undefined){
            reject();
            return;
        }
        if (id === undefined){
            reject("No storage ID specified");
            return;
        }

        $.getJSON( ATON.PATH_WAPPS+App._id+"/data/"+id+".json", (data)=>{
            console.log(data);
            App._data[id] = data;
            resolve(data);
        });
    });
};

/**
Register a service worker (PWA) for webapp
@param {string} swpath - service worker path to register
@example
ATON.App.registerServiceWorker("myserviceworker.js")
*/
App.registerServiceWorker = ( swpath )=>{
    if (!swpath) return;
    if (App.basePath) swpath = App.basePath + swpath;

    if ("serviceWorker" in navigator){
        window.addEventListener("load", ()=>{
            navigator.serviceWorker
            .register(swpath)
            .then(res => console.log("PWA service worker registered"))
            .catch(err => console.log("PWA service worker not registered", err))
        });
    }

    return App;
};

/**
Realize the App.
You can use "params" property to access url parameters, and "basePath" for accessing local app content (css, configs, etc.)
@param {function} setup - setup routine
@param {function} update - update (or tick) routine
@param {string} swpath - (optional) service worker path (PWA) to register
@returns {object} - web-app object, to be started with run() method
@example
let A = ATON.App.realize( mySetupRoutine )
*/
App.realize = (setup, update, swpath)=>{

    App.setup  = setup;
    App.update = update;

    // App URL params
    App.params = new URLSearchParams( window.location.search );
    
    // Base path for this App
    App.basePath = ATON.Utils.getBaseFolder( window.location.href.split('?')[0] );
    console.log("App base path: "+App.basePath);

    App.registerServiceWorker( swpath );

    return App;
};

/**
Create and run the App.
See App.realize() method
@param {function} setup - setup routine
@param {function} update - update (or tick) routine
@param {string} swpath - (optional) service worker path (PWA) to register
@example
ATON.App.realizeAndRun( mySetupRoutine, myUpdateRoutine, "myserviceworker.js" )
*/
App.realizeAndRun = (setup, update, swpath)=>{
    App.realize(setup, update, swpath).run();
};

/**
Run the App, typically inside window.addEventListener('load', ...) 
@returns {boolean} - true on success
@example
window.addEventListener('load',()=>{
    A.run()
});
*/
App.run = ()=>{
    if (App._bRunning) return false;

    if (App.setup) App.setup();
    else {
        ATON.FE.realize();
        console.log("App [Warn]: your App should define a setup() routine");
    }

    if (App.update){
        ATON.addUpdateRoutine( App.update );
        console.log("App: update routine registered");
    }

    App._bRunning = true;

    return App._bRunning;
};


export default App;