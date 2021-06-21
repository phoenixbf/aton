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
const axios  = require('axios');


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
	//Maat.needScan.models = {};
	//Maat.needScan.panos  = {}

	//Maat._bDirtyScenes      = true;
	//Maat._bDirtyCollections = true;

	Maat.db = {};
	Maat.db.scenes = [];
	Maat.db.kwords = {};

	Maat.db.collections = {};

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
	
	console.log("Scanning scenes...");

	let files = fg.sync("**/"+Core.STD_SCENEFILE, Core.SCENES_GLOB_OPTS);

	for (let f in files){
		let S = {};

		let sid       = path.dirname(files[f]);
		let pubfile   = Core.DIR_SCENES + sid+"/" + Core.STD_PUBFILE;
		let coverfile = Core.DIR_SCENES + sid+"/" + Core.STD_COVERFILE;

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
		}

		Maat.db.scenes.push(S);
	}

	Maat.needScan.scenes = false;

	//console.log(Maat.db.kwords);

	setTimeout(()=>{
		Maat.needScan.scenes = true;
	}, Maat.INTERVAL);
};


// Collections
Maat.scanCollection = (uid)=>{
	if (Maat.needScan.collections[uid] === false) return;

	Maat.scanModels(uid);
	Maat.scanPanoramas(uid);

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
	let files = fg.sync("{"+uid+",samples}/models/**/{*.gltf,*.glb,*.json}", Core.COLLECTIONS_GLOB_OPTS);

	if (files.length < 1) return;

	CC[uid].models = [];

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
	let files = fg.sync("{"+uid+",samples}/pano/**/{*.jpg,*.mp4,*.webm}", Core.COLLECTIONS_GLOB_OPTS);

	if (files.length < 1) return;

	CC[uid].panos = [];
	for (let f in files) CC[uid].panos.push( /*relpath +*/ files[f] );
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
	Maat.scanScenes();

	let R = Maat.db.scenes.filter((s)=>{
		return (s.sid.startsWith(uid));
	});

	return R;
}
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

Maat.getScenesKeywords = ()=>{
	Maat.scanScenes();

	return Maat.db.kwords;
};

module.exports = Maat;