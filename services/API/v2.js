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

API.isUserAuth = (req)=>{
    if (req.user === undefined) return false;
    if (req.user.username === undefined) return false;

    return true;
};

// Main setup
API.init = (app)=>{

    /*===============================
        SCENES
    ===============================*/
    // List public scenes
    app.get(API.BASE + "scenes", (req,res)=>{
        let keyword = req.query.k;
        let R;

        if (keyword) R = Core.maat.getScenesByKeyword(keyword);
        else R = Core.maat.getPublicScenes();

        res.send( R ); // TODO: handle pagination
    });

    // List user scenes
    app.get(API.BASE + "scenes/:user", (req,res)=>{
        if ( !Core.Auth.isUserAuth(req) ){
            res.status(401).send([]);
            return;
        }

        let keyword = req.query.k;
        let uname   = req.params.user;
        let R;

        if (keyword) R = Core.maat.getScenesByKeyword(kw, uname);
        else R = Core.maat.getUserScenes(uname);
        
        if (req.user.username === uname) res.send( R );
        else res.status(401).send([]);
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

    // New scene
    app.post(API.BASE + "scenes", (req,res)=>{
        // Only auth users can create scenes
        if ( !Core.Auth.isUserAuth(req) ){
            res.status(401).send(false);
            return;
        }

        let uname = req.user.username;

        let O = req.body;
        let data = O.data;
        let pub  = O.pub;
        let fromSID  = O.fromSID;
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
        let R = Core.writeSceneJSON(sid, data, pub);

        if (R) res.send(sid);
        else res.send(false);
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
    
        let uname = req.user.username;
        if (uname !== req.params.user){
            res.status(401).send([]);
            return;
        }
    
        res.send( Core.maat.getUserModels(uname) );
    });

    // Asset Injector (TODO)
    app.patch(API.BASE + "items/:user/models", (req,res)=>{
        if ( !Core.Auth.isUserAuth(req) ){
            res.status(401).send(false);
            return;
        }
    
        let uname = req.user.username;
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
    
        let uname = req.user.username;
    
        res.send( Core.maat.getUserPanoramas(uname) );
    });

    // Media list
    app.get(API.BASE + "items/:user/media", (req,res)=>{
        if ( !Core.Auth.isUserAuth(req) ){
            res.status(401).send([]);
            return;
        }
    
        let uname = req.user.username;
    
        res.send( Core.maat.getUserMedia(uname) );
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

        for (let i in Core.users){
            let U = Core.users[i];
            if (U.username === uname){
                res.send({
                    username: U.username,
                    admin: U.admin
                });
                return;
            }
        }

        res.send(false);
    });

    /*===============================
        APPS
    ===============================*/

    /*===============================
        FLARES
    ===============================*/

    /*===============================
        INSTANCE
    ===============================*/

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