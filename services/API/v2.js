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

sharp.cache(false);


let API = {};
API.BASE = "/api/v2/";

Core.API = API;

API.init = (app)=>{

    /**
        * @api {get} /api/v2/scenes/	List public scenes
        * @apiGroup Scenes
        * @apiPermission none

        * @apiDescription List all public scenes
        * @apiSuccess {Array} list scenes object list
    */
    app.get(API.BASE + "scenes", (req,res)=>{
        let filter = req.query.f;

        res.send( Core.maat.getPublicScenes() ); // TODO: handle pagination
    });

    app.get(API.BASE + "scenes/:user", (req,res)=>{
        if (req.user === undefined){
            res.send(401);
            return;
        }

        let uname = req.params.user;
        
        if (req.user === uname) res.send( Core.maat.getUserScenes(uname) );
        else res.send(401);
    });

    // New scene
    app.post(API.BASE + "scenes", (req,res)=>{
        // Only auth users
        if (req.user === undefined){
            res.send(false);
            return;
        }

        let O = req.body;
        let sid  = req.user + "/" + Core.generateUserSID();
        let data = O.data;
        let pub  = O.pub;

        console.log(O);

        //Core.touchSceneFolder(sid);
        let r = Core.writeSceneJSON(sid, data, pub);

        res.json(r);
    });

};

module.exports = API;