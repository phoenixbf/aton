/*!
    @preserve

 	ATON main REST API (v2)

 	@author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/
const fs          = require('fs');
const path        = require('path');
const nanoid      = require('nanoid');
const fsx         = require('fs-extra');
const fg          = require('fast-glob');
const sharp       = require("sharp");

const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUI    = require("swagger-ui-express");
//const { SwaggerTheme } = require('swagger-themes');

sharp.cache(false);


let API = {};
API.BASE = "/api/v2/";
API.DOCS = "/apiv2-docs";

Core.API = API;

// Main setup
API.init = (app)=>{

    /*===============================
        SCENES
    ===============================*/
    // List public scenes
    app.get(API.BASE + "scenes", (req,res)=>{
        let keyword = req.query.k;
        let R;

        if (keyword) R = Core.Maat.getScenesByKeyword(keyword);
        else R = Core.Maat.getPublicScenes();

        res.send( R ); // TODO: handle pagination
    });

    // List user scenes
    app.get(API.BASE + "scenes/:user", (req,res)=>{
        // Only auth users
        if ( !Core.Auth.isUserAuth(req) ){
            res.status(401).send([]);
            return;
        }

        // Only own scenes
        let uname = req.params.user;
        if (Core.Auth.getUID(req) !== uname){
            res.status(401).send([]);
            return;
        }

        let keyword = req.query.k;
        let R;

        if (keyword) R = Core.Maat.getScenesByKeyword(keyword, uname);
        else R = Core.Maat.getUserScenes(uname);
        
        res.send( R );
    });

    // Get JSON scene descriptor
    app.get(API.BASE+"scenes/:user/:usid", (req,res)=>{
        let U = req.params.user;
        let S = req.params.usid;

        if (!U || !S){
            res.send(false);
            return;
        }

        let sid = U+"/"+S;

        let sjsonpath = Core.getSceneJSONPath(sid);

    	if (fs.existsSync(sjsonpath)){
            //console.log(sjsonpath);
            return res.sendFile(sjsonpath);
        }
        
        res.send(false);
    });

    // Patch a JSON scene descriptor
    app.patch(API.BASE+"scenes/:user/:usid", (req,res)=>{
        // Only auth user can patch a scene
        if ( !Core.Auth.isUserAuth(req) ){
            res.status(401).send(false);
            return;
        }

        // Only own scenes
        let uname = req.params.user;
        if (Core.Auth.getUID(req) !== uname){
            res.status(401).send(false);
            return;
        }

        let U = uname;
        let S = req.params.usid;

        if (!U || !S){
            res.send(false);
            return;
        }

        let sid = U+"/"+S;

        let O = req.body;
        let mode  = O.mode;
        let patch = O.data;

        if (!mode || !O.data){
            res.send(false);
            return;
        }

        let J = Core.applySceneEdit(sid, patch, mode);
        res.json(J);
    });

    app.delete(API.BASE+"scenes/:user/:usid", (req,res)=>{
        // Only auth user can delete a scene
        if ( !Core.Auth.isUserAuth(req) ){
            res.status(401).send(false);
            return;
        }

        // Only own scenes
        let uname = req.params.user;
        if (Core.Auth.getUID(req) !== uname){
            res.status(401).send(false);
            return;
        }

        let U = uname;
        let S = req.params.usid;

        if (!U || !S){
            res.send(false);
            return;
        }

        let sid = U+"/"+S;

        Core.deleteScene(sid);
        res.send(true);
    });

    // New scene
    app.post(API.BASE + "scenes", (req,res)=>{
        // Only auth users can create scenes
        if ( !Core.Auth.isUserAuth(req) ){
            res.status(401).send(false);
            return;
        }

        let uname = Core.Auth.getUID(req);

        let O = req.body;
        let data     = O.data;
        let fromSID  = O.fromScene;
        let fromItem = O.fromItem;

        // Create a new scene from single item (experimental)
        if (fromItem){
            if (Core.isURL3Dmodel(fromItem)){
                let R = Core.createBasicSceneFromModel(uname,fromItem);
                
                if (R) res.send(R);
                else res.send(false);
            }

            return;
        }

        // Create a new scene ID
        let sid  = uname + "/" + Core.generateUserSID();

        // Clone from existing scene
        if (fromSID){
            console.log(Core.DIR_SCENES+fromSID);

            fsx.copy(Core.DIR_SCENES+fromSID, Core.DIR_SCENES+sid, (err)=>{
                if (err){
                    console.log(err);
                    res.send(false);
                    return;
                }
            });

            res.send(sid);
            return;
        }

        // Brand new scene
        let R = Core.writeSceneJSON(sid, data);

        if (R) res.send(sid);
        else res.send(false);
    });

    // Get scene cover
    app.get(API.BASE+"scenes/:user/:usid/cover", (req,res)=>{
        let U = req.params.user;
        let S = req.params.usid;

        let coverfile = Core.DIR_RES+"scenecover.png";

        if (!U || !S){
            res.sendFile(coverfile);
            return;
        }

        let sid = U+"/"+S;

        let se = Core.Maat.getSceneEntry(sid);
        if (!se){
            res.sendFile(coverfile);
            return;
        }

        if (se.cover){
            coverfile = path.join(Core.getSceneFolder(sid), "cover.png");
            res.sendFile(coverfile);
        }
    });

    /*===============================
        ITEMS (Collections)
    ===============================*/
    // 3D models list
    app.get(API.BASE + "items/:user/models", (req,res)=>{
        if ( !Core.Auth.isUserAuth(req) ){
            res.status(401).send([]);
            return;
        }
    
        let uname = Core.Auth.getUID(req);
        if (uname !== req.params.user){
            res.status(401).send([]);
            return;
        }
    
        res.send( Core.Maat.getUserModels(uname) );
    });

    // Asset Injector (TODO)
    app.patch(API.BASE + "items/:user/models", (req,res)=>{
        if ( !Core.Auth.isUserAuth(req) ){
            res.status(401).send(false);
            return;
        }
    
        let uname = Core.Auth.getUID(req);
        if (uname !== req.params.user){
            res.status(401).send(false);
            return;
        }

        let modelpath = req.query.m;
        if (!modelpath){
            res.send(false);
            return; 
        }

        // ...
    });

    // Panoramic content list
    app.get(API.BASE + "items/:user/panoramas", (req,res)=>{
        if ( !Core.Auth.isUserAuth(req) ){
            res.status(401).send([]);
            return;
        }
    
        let uname = Core.Auth.getUID(req);
    
        res.send( Core.Maat.getUserPanoramas(uname) );
    });

    // Media list
    app.get(API.BASE + "items/:user/media", (req,res)=>{
        if ( !Core.Auth.isUserAuth(req) ){
            res.status(401).send([]);
            return;
        }
    
        let uname = Core.Auth.getUID(req);
    
        res.send( Core.Maat.getUserMedia(uname) );
    });

    /*===============================
        USERS
    ===============================*/
    app.get(API.BASE + "users", (req,res)=>{
        if ( !Core.Auth.isUserAdmin(req) ){
            res.status(401).send([]);
            return;
        }

        let uu = [];
        for (let u in Core.users) uu.push({
            username: Core.users[u].username,
            admin: Core.users[u].admin
        });
    
        res.send(uu);
    });

    app.post(API.BASE + "users", (req,res)=>{
        if ( !Core.Auth.isUserAdmin(req) ){
            res.status(401).send(false);
            return;
        }

        let O = req.body;
    
        let b = Core.createNewUser(O);
        res.send(b);
    });

    app.get(API.BASE + "users/:user", (req,res)=>{
        if ( !Core.Auth.isUserAdmin(req) ){
            res.status(401).send(false);
            return;
        }

        let uname = req.params.user;

        let U = Core.Auth.findUser(uname);
        if (U) res.send({
            username: U.username,
            admin: U.admin
        });
        else res.send(false);
    });

    // Update user
    app.put(API.BASE + "users/:user", (req,res)=>{
        if ( !Core.Auth.isUserAdmin(req) ){
            res.status(401).send(false);
            return;
        }

        let uname = req.params.user;
        let O = req.body;

        let U = Core.Auth.findUser(uname);

        //TODO: modify user entry
    });

    // Update user
    app.delete(API.BASE + "users/:user", (req,res)=>{
        if ( !Core.Auth.isUserAdmin(req) ){
            res.status(401).send(false);
            return;
        }

        let uid = req.params.user;

        let b = Core.deleteUser(uid);
        res.send(b);
    });

    /*===============================
        APPS
    ===============================*/
    // Get complete apps list
    app.get(API.BASE + "apps", (req,res)=>{
        if ( !Core.Auth.isUserAdmin(req) ){
            res.status(401).send([]);
            return;
        }

        let wapps = Core.Maat.getApps();

        res.send(wapps);
    });

    // Get specific app info
    app.get(API.BASE + "apps/:appid", (req,res)=>{
        let appid = req.params.appid;

        let A = Core.Maat.getApp(appid);
        console.log(appid);
        res.send( A );
    });

    // App storage manipulations
    app.patch(API.BASE + "apps/:appid/:storid", (req,res)=>{
        let appid  = req.params.appid;
        let storid = req.params.storid;

        if (!appid || !storid){
            res.send(false);
            return;
        }

        let O = req.body;

        let patch  = O.data;
        let mode   = O.mode;

        let J = Core.wappDataEdit(appid, storid, patch, mode);

        res.json(J);
    });

    // Get storage data (JSON)
    app.get(API.BASE + "apps/:appid/:storid", (req,res)=>{
        let appid  = req.params.appid;
        let storid = req.params.storid;

        if (!appid || !storid){
            res.send(false);
            return;
        }

        let spath = Core.getAppJSONPath(appid,storid);
        res.sendFile(spath);
    });

    /*===============================
        FLARES
    ===============================*/
    // Get list of flares currently hosted
    app.get(API.BASE + "flares", (req,res)=>{
        if ( !Core.Auth.isUserAdmin(req) ){
            res.status(401).send([]);
            
            //let list = [];
            //for (let fid in Core.flares) list.push(fid);
            //res.send(list);
            return;
        }

        res.send( Core.flares );
    });

    // Get a flare client info via flare-ID
    app.get(API.BASE + "flares/:fid", (req,res)=>{
        let f = req.params.fid;

        let F = Core.flares[f];
        if (!F){
            res.status(404).send(false);
            return;
        }

        let O = {};
        
        if (F.name) O.name = F.name;
        if (F.client && F.client.files) O.files = F.client.files;

        res.send( O );
    });

    /*===============================
        INSTANCE
    ===============================*/


    // REST API docs (OpenAPI / Swagger)
    API.setupDocs(app);
};


// OpenAPI / Swagger docs
API.setupDocs = (app)=>{
    const swaggerSpec = swaggerJSDoc({
        definition: require("./openapi.json"),
        supportedSubmitMethods: [],
        apis: [__filename]
    });
    
    const opts = {
        swaggerOptions: {
            //tryItOutEnabled: true
            supportedSubmitMethods: []
        },
    
        //explorer: true,
        //customCss: theme.getBuffer('dark')
        //customCssUrl: "./public/hub.css"
    };

	app.use(API.DOCS, swaggerUI.serve, swaggerUI.setup(swaggerSpec, opts ));
};

module.exports = API;