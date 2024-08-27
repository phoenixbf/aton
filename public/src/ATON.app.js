/*
    ATON App Hub
    Web-Apps

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
ATON App
@namespace App
*/
let App = {};


App._id    = $("meta[name='aton\\:appid']").attr("content");
App._data  = {};
App.setup  = undefined;
App.update = undefined;

App._bRunning = false;
App._pDeps    = [];
App._fLoading = 0;


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

/*
App.requireFlare2 = (fid)=>{

    return new Promise((resolve, reject)=>{
        if (ATON.Flares[fid]){
            resolve(fid);
            return;
        }

        $.get(ATON.PATH_RESTAPI2+"flares/"+fid, (f)=>{
            let files = f.files;
            if (files){
                let numscripts = files.length;
    
                for (let s in files){
                    let jss = document.createElement("script");
                    jss.src = "/flares/"+fid+"/"+files[s];
                    jss.async = false;
                    document.head.appendChild(jss);
    
                    jss.onload = ()=>{
                        numscripts--;
                        if (numscripts <= 0){
                            console.log("All deps loaded for flare '"+fid+"'");
                            ATON._deployNewFlares();
                            
                            resolve(fid);
                        }
                    }

                    jss.onerror = ()=>{
                        numscripts--;
                        if (numscripts <= 0){
                            console.log("All deps loaded for flare '"+fid+"'");
                            ATON._deployNewFlares();
                            
                            resolve(fid);
                        }
                    };
                }
            }
        });

    });

};

App.requireFlareXX = (fid)=>{
    if (ATON.Flares[fid]) return;

    console.log("Require Flare ",fid);
    App._fLoading++;

    $.get(ATON.PATH_RESTAPI2+"flares/"+fid, (f)=>{
        let files = f.files;
        if (files){
            let numscripts = files.length;

            for (let s in files){
                let jss = document.createElement("script");
                jss.src = "/flares/"+fid+"/"+files[s];
                jss.async = false;
                document.head.appendChild(jss);

                jss.onload = ()=>{
                    numscripts--;
                    if (numscripts <= 0){
                        console.log("All deps loaded for flare '"+fid+"'");
                        ATON._deployNewFlares();
                        
                        App._fLoading--;
                        if (App._fLoading<=0){
                            console.log("=====================");
                            if (App._bRunning) App._deploy();
                        }
                    }
                }

                jss.onerror = ()=>{
                    numscripts--;
                    if (numscripts <= 0){
                        console.log("All deps loaded for flare '"+fid+"'");
                        ATON._deployNewFlares();
                        
                        App._fLoading--;
                        if (App._fLoading<=0){
                            console.log("=====================");
                            if (App._bRunning) App._deploy();
                        }
                    }
                };
            }
        }
    });

};
*/

/**
Setup required flares (plugins) for the App, generally right after app realization.
@param {function} list - array of flares IDs available on the server node (typically the subfolder in /config/flares/<flare-id>/)
@example
let A = ATON.App.realize();
A.requireFlares(["aflare","anotherflare"]);

...
*/
App.requireFlares = (list)=>{
    if (!list) return;

    ATON._fReqList = list;
    console.log("Required Flares: "+ATON._fReqList);
/*

    for (let i=0; i<list.length; i++) App._pDeps.push( App.requireFlare( list[i] ) );
    //console.log(App._pDeps)
*/

    return App;
};


/*
Require all available flares on the server, to equip the App

App.requireAllFlares = ()=>{
    $.get(ATON.PATH_RESTAPI2+"flares/", (list)=>{
        ATON._fReqList  = list;
        ATON._fRequired = list.length;

        ATON._loadFlares();
    });

    return App;
};
*/


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
App.realizeAndRun = async (setup, update, swpath)=>{
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

    App._bRunning = true;

    //ATON.FE.realize();

    // We wait for all flares deployment
    //ATON.on("AllFlaresReady",()=>{
        if (App.setup) App.setup();
        else {
            ATON.FE.realize();
            console.log("App [Warn]: your App should define a setup() routine");
        }
    
        if (App.update){
            ATON.addUpdateRoutine( App.update );
            console.log("App: update routine registered");
        }
    //});

    return true;
};

export default App;