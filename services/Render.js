/*!
    @preserve

 	ATON Render module

 	@author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/
const fs = require('fs');

let Render = {};

Render.DIR_VIEWS = __dirname+"/views/";


Core.Render = Render;

Render.setup = (app)=>{

	app.set('view engine', 'ejs');
	app.set('views', Render.DIR_VIEWS);
	
	// Hathor
	//================================================
	// Main front-end from sid
	app.get(/^\/s\/(.*)$/, (req,res,next)=>{
		let d = {};
		d.sid   = req.params[0];
		d.title = d.sid;
		d.appicon = "/hathor/appicon.png";
		d.scripts = Core.FEScripts;
		
		d.flareslist = [];
		for (let fid in Core.flares) d.flareslist.push(fid);
	
		let S = Core.readSceneJSON(d.sid);
		if (S){
			if (S.title) d.title = S.title;
			d.appicon = "/api/cover/"+d.sid;
		}
	
		res.render("hathor/index", d);
	});
	
	// Automatically create 3D scene from item url and redirect to Hathor
	app.get("/i", (req,res,next)=>{ // /^\/i\/(.*)$/
        // Only auth users
        if ( !Core.Auth.isUserAuth(req) ){
            res.status(401).send(false);
            return;
        }
	
		let uname = req.user.username;
		
		let item = req.query.m; //req.params[0];
		console.log(item)
	
		if (Core.isURL3Dmodel(item)){
			let sid = Core.createBasicSceneFromModel(uname,item);
			console.log(sid)
	
			if (sid) res.redirect("/s/"+sid);
			return;
		}
		else res.send(false);
	});


	// Main
	//================================================
	app.get("/v2", (req,res,next)=>{
		Render.customhero = fs.existsSync(Core.DIR_CONFIGPUB+"hero.html");
		
		let opts = Core.config.shu;
		if (!opts) opts = Core.CONF_MAIN.shu;
		if (!opts.apps) opts.apps = [];
		
		opts.customhero = Render.customhero;

		res.render("v2/home", opts);
	});

	app.get("/v2/login", (req,res,next)=>{
		res.render("v2/login");
	});
	app.get("/v2/logout", (req,res,next)=>{
		res.render("v2/logout");
	});

	app.get("/v2/myscenes", (req,res,next)=>{
        if ( !Core.Auth.isUserAuth(req) ){
			res.redirect("/v2/login?u=/v2/myscenes");
			return;
        }

		res.render("v2/myscenes");
	});

};


module.exports = Render;