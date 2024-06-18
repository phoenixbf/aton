/*!
    @preserve

 	ATON Render module

 	@author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/

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
	
		let S = Core.readSceneJSON(d.sid);
		if (S){
			if (S.title) d.title = S.title;
			d.appicon = "/api/cover/"+d.sid;
		}
	
		res.render("hathor/index", d);
	});
	
	// Automatically create 3D scene from item url and redirect to Hathor
	app.get(/^\/i\/(.*)$/, (req,res,next)=>{
		if ( req.user === undefined ) return;
	
		let uname = req.user.username;
		
		let item = req.params[0];
		console.log(item)
	
		if (Core.isURL3Dmodel(item)){
			let sid = Core.createBasicSceneFromModel(uname,item);
			console.log(sid)
	
			if (sid) res.redirect("/s/"+sid);
			return;
		}
	});


	// Shu
	//================================================

};


module.exports = Render;