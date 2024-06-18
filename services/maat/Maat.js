/*!
    @preserve

    ATON Maat module

 	@author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/
const fs     = require('fs');
const path   = require('path');
const fg     = require('fast-glob');
const fsx    = require('fs-extra');
//const axios  = require('axios');


/**
Maat module serves as in-memory DB
@namespace Maat
*/
let Maat = {};

Maat.INTERVAL = 5000;

Maat.init = ()=>{
	Maat.needScan = {};
	Maat.needScan.scenes      = true;
	Maat.needScan.collections = {};
	Maat.needScan.users       = true;
	Maat.needScan.apps        = true;
	//Maat.needScan.models = {};
	//Maat.needScan.panos  = {}

	//Maat._bDirtyScenes      = true;
	//Maat._bDirtyCollections = true;

	Maat.db = {};

	Maat.db.users       = {};
	Maat.db.scenes      = [];
	Maat.db.kwords      = {};
	Maat.db.collections = {};

	Maat.db.stats = {};

	//Maat.scanScenes();

/*
	const watcherScenes = chokidar.watch(Core.DIR_SCENES, {
		ignored: /(^|[\/\\])\../, // ignore dotfiles
		persistent: true,
		usePolling: true,
		interval: 2000,
		ignoreInitial: true
	});
	const watcherCollections = chokidar.watch(Core.DIR_COLLECTIONS, {
		ignored: /(^|[\/\\])\../, // ignore dotfiles
		persistent: true,
		usePolling: true,
		interval: 2000,
		ignoreInitial: true
	});

	let onScenesChange = (p)=>{
		Maat._bDirtyCollections = true
	};
	let onCollectionsChange = (p)=>{
		Maat._bDirtyCollections = true;
	};

	watcherScenes
		.on('add', onScenesChange )
		.on('change', onScenesChange )
		.on('unlink', onScenesChange );

	watcherCollections
		.on('add', onCollectionsChange )
		.on('change', onCollectionsChange )
		.on('unlink', onCollectionsChange );
*/


/*
    fs.watch(Core.DIR_SCENES, (eventType, filename) => {
        console.log("\nThe file " + filename + " was modified! ("+eventType+")");
        Maat._bDirtyScenes = true;
    });

    fs.watch(Core.DIR_COLLECTIONS, (eventType, filename) => {
        console.log("\nThe file " + filename + " was modified! ("+eventType+")");
        Maat._bDirtyCollections = true;
    });
*/
    //Maat._dUpd = setInterval(Maat.update, Maat.INTERVAL);
};


Maat.addSceneKeyword = (k)=>{
	if (k === undefined) return;

	k = k.toLowerCase().trim();

	// kw counters
	if (Maat.db.kwords[k] === undefined) Maat.db.kwords[k] = 1;
	else Maat.db.kwords[k]++;
};

Maat.scanScenes = ()=>{
	if (Maat.needScan.scenes === false) return;

	Maat.db.scenes = []; // clear
	Maat.db.kwords = {}; // clear global keywords
	//Maat.db.users  = {};
	
	console.log("Scanning scenes...");

	let files = fg.sync("**/"+Core.STD_SCENEFILE, Core.SCENES_GLOB_OPTS);

	for (let f in files){
		let S = {};

		let sid       = path.dirname(files[f]);
		let pubfile   = Core.DIR_SCENES + sid+"/" + Core.STD_PUBFILE;
		let coverfile = Core.DIR_SCENES + sid+"/" + Core.STD_COVERFILE;
	
		//let user = sid.split("/")[0];
		//if (user) Maat.db.users[user] = 1;

		S.sid    = sid;
		S.cover  = fs.existsSync(coverfile)? true : false;
		S.public = fs.existsSync(pubfile)? true : false;
		
		let sobj = Core.readSceneJSON(sid);

		if (sobj){
			if (sobj.title) S.title = sobj.title;

			if (sobj.kwords){
				S.kwords = sobj.kwords;
				for (let k in S.kwords) Maat.addSceneKeyword(k);
			}

			Maat.db.scenes.push(S);
		}
		else {
			console.log("ERROR malformed scene: ", sid);
		}

		//Maat.db.scenes.push(S);
	}

	Maat.needScan.scenes = false;

	console.log(Maat.db.kwords);

	setTimeout(()=>{
		Maat.needScan.scenes = true;
	}, Maat.INTERVAL);
};

Maat.scanApps = ()=>{
	if (Maat.needScan.apps === false) return;

	Maat.db.apps = [];

	let O    = {};
	O.cwd    = Core.DIR_WAPPS;
	O.follow = true;

	console.log("Scanning web-apps...");

	let files = fg.sync("*/app.webmanifest", O); // index.html
	for (let f in files){
		let wid = path.dirname(files[f]);
		let appicon = path.join(Core.DIR_WAPPS+wid, "/appicon.png");

		Maat.db.apps.push({
			wappid: wid,
			icon: fs.existsSync(appicon)? true : false
		});
	}

	Maat.needScan.apps = false;

	setTimeout(()=>{
		Maat.needScan.apps = true;
	}, Maat.INTERVAL);
};


// Collections
Maat.scanCollection = (uid)=>{
	if (Maat.needScan.collections[uid] === false) return;

	//const t0 = performance.now();

	Maat.scanModels(uid);
	Maat.scanPanoramas(uid);
	Maat.scanMedia(uid);

	//const t1 = performance.now();
	//console.log(`${t1 - t0} milliseconds.`);

	Maat.needScan.collections[uid] = false;

	setTimeout(()=>{
		Maat.needScan.collections[uid] = true;
	}, Maat.INTERVAL);
};

Maat.scanModels = (uid)=>{
	let CC = Maat.db.collections;

	if (CC[uid] === undefined) CC[uid] = {};

	//let relpath = uid +"/models/";
/*
	let globopts    = {};
	globopts.cwd    = Core.DIR_COLLECTIONS;// + relpath;
	globopts.follow = true;
*/
	//let files = fg.sync("**/{*.gltf,*.glb,*.json}", globopts);
	let files = fg.sync("{"+uid+",samples}/models/**/{"+Core.mpattern+"}", Core.COLLECTIONS_GLOB_OPTS);

	CC[uid].models = [];

	if (files.length < 1) return;

	// TODO: improve filtering perf.
	//files = Maat.filterTSets(files);

	for (let f in files) CC[uid].models.push( /*relpath + */files[f] );
};

Maat.scanPanoramas = (uid)=>{
	let CC = Maat.db.collections;

	if (CC[uid] === undefined) CC[uid] = {};

	//let relpath = uid +"/pano/";
/*
	let globopts    = {};
	globopts.cwd    = Core.DIR_COLLECTIONS; // + relpath;
	globopts.follow = true;
*/
	//let files = fg.sync("**/{*.jpg,*.mp4,*.webm}", globopts);
	let files = fg.sync("{"+uid+",samples}/pano/**/{"+Core.panopattern+"}", Core.COLLECTIONS_GLOB_OPTS);

	CC[uid].panos = [];
	if (files.length < 1) return;

	for (let f in files) CC[uid].panos.push( /*relpath +*/ files[f] );
};

Maat.scanMedia = (uid)=>{
	let CC = Maat.db.collections;

	if (CC[uid] === undefined) CC[uid] = {};

	let files = fg.sync("{"+uid+",samples}/media/**/{"+Core.mediapattern+"}", Core.COLLECTIONS_GLOB_OPTS);

	CC[uid].media = [];
	if (files.length < 1) return;

	for (let f in files) CC[uid].media.push( files[f] );
};

// TODO: improve filter alg
Maat.filterTSets = ( files )=>{
	let its = [];
	let B   = {};

	for (let s in files){
		let fpath = files[s];

		if (fpath.endsWith(".json")){
			//console.log(fpath)

			B[fpath] = path.dirname(fpath);
		}
	}

	//console.log(B)

	for (let k in B){
		let base1 = B[k];
		
		for (let j in B){
			let base2 = B[j];

			if (base1!==base2 && base1.startsWith(base2)){
				//console.log(base1+" << "+base2)

				files = files.filter((e)=>{
					return (e !== k);
				});
			}
		}
	}

	//console.log(files)
	return files;
};

// TODO
Maat.getUsers = ()=>{
	if (Maat.needScan.users === false) return Maat.db.users;

	console.log("Reloading users DB...");
	Maat.db.users = Core.loadConfigFile("users.json", Core.CONF_USERS);

	Maat.needScan.users = false;

	setTimeout(()=>{
		Maat.needScan.users = true;
	}, Maat.INTERVAL);

	return Maat.db.users;
};

// Apps
Maat.getApps = ()=>{
	Maat.scanApps();

	return Maat.db.apps;
};

// Scenes
Maat.getAllScenes = ()=>{
	Maat.scanScenes();

	return Maat.db.scenes;
}
Maat.getPublicScenes = ()=>{
	Maat.scanScenes();

	let R = Maat.db.scenes.filter((s)=>{
		return (s.public);
	});

	return R;
};
Maat.getUserScenes = (uid)=>{
    if (uid === undefined) return undefined;

	Maat.scanScenes();

	let R = Maat.db.scenes.filter((s)=>{
		return (s.sid.startsWith(uid));
	});

	return R;
};

Maat.getScenesByKeyword = (kw, uid)=>{
    if (kw === undefined) return undefined;

	Maat.scanScenes();

    // Specific user
    if (uid !== undefined){
        let R = Maat.db.scenes.filter((s)=>{
            return (s.sid.startsWith(uid) && s.kwords !== undefined && s.kwords[kw] !== undefined);
        });

        return R;
    }

    // Public scenes
	let R = Maat.db.scenes.filter((s)=>{
		return (s.public && s.kwords !== undefined && s.kwords[kw] !== undefined);
	});

	return R;
};

// Collections
Maat.getUserModels = (uid)=>{
	Maat.scanCollection(uid);

	let CC = Maat.db.collections;
	if (CC[uid] === undefined) return [];

	return CC[uid].models;
};

Maat.getUserPanoramas = (uid)=>{
	Maat.scanCollection(uid);

	let CC = Maat.db.collections;
	if (CC[uid] === undefined) return [];

	return CC[uid].panos;
};

Maat.getUserMedia = (uid)=>{
	Maat.scanCollection(uid);

	let CC = Maat.db.collections;
	if (CC[uid] === undefined) return [];

	return CC[uid].media;
};

Maat.getScenesKeywords = ()=>{
	Maat.scanScenes();

	return Maat.db.kwords;
};

Maat.getStats = ()=>{
	
	//console.log(Core.config);

	Maat.db.stats.name      = (Core.config && Core.config.name)? Core.config.name : undefined;

	Maat.db.stats.scenesTot = 0;
	Maat.db.stats.scenesPub = 0;
	Maat.db.stats.users     = 0;
	Maat.db.stats.models    = 0;
	Maat.db.stats.panos     = 0;
	Maat.db.stats.media     = 0;
	Maat.db.stats.apps      = 0;
	
	Maat.scanScenes();
	Maat.db.stats.kwords = Maat.db.kwords;
	Maat.db.stats.scenesTot = Maat.db.scenes.length;
	for (let x in Maat.db.scenes) if (Maat.db.scenes[x].public) Maat.db.stats.scenesPub++;

	Maat.scanApps();
	Maat.db.stats.apps = Maat.db.apps.length;
	
	for (let i in Maat.db.users){
		let u = Maat.db.users[i].username;

		Maat.db.stats.users++;

		Maat.scanCollection(u);
		
		let U = Maat.db.collections[u];	
		
		if (U){
			Maat.db.stats.models += U.models.length;
			Maat.db.stats.panos  += U.panos.length;
			Maat.db.stats.media  += U.media.length;
		}
	}

	//console.log(Maat.db.stats);
	return Maat.db.stats;
};

module.exports = Maat;