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
	Maat.needScan.users       = true;
	//Maat.needScan.models = {};
	//Maat.needScan.panos  = {}

	//Maat._bDirtyScenes      = true;
	//Maat._bDirtyCollections = true;

	Maat.db = {};

	Maat.db.users       = {};
	Maat.db.scenes      = [];
	Maat.db.kwords      = {};
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
	let files = fg.sync("{"+uid+",samples}/pano/**/{*.jpg,*.hdr,*.exr,*.mp4,*.webm}", Core.COLLECTIONS_GLOB_OPTS);

	CC[uid].panos = [];
	if (files.length < 1) return;

	for (let f in files) CC[uid].panos.push( /*relpath +*/ files[f] );
};

Maat.scanMedia = (uid)=>{
	let CC = Maat.db.collections;

	if (CC[uid] === undefined) CC[uid] = {};

	let files = fg.sync("{"+uid+",samples}/media/**/{*.jpg,*.png,*.mp4,*.webm,*.wav,*.mp3}", Core.COLLECTIONS_GLOB_OPTS);

	CC[uid].media = [];
	if (files.length < 1) return;

	for (let f in files) CC[uid].media.push( files[f] );
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
	let R = {};

	Maat.scanScenes();

	R.users  = 0;
	R.models = 0;
	R.panos  = 0;
	R.media  = 0;

	R.kwords = Maat.db.kwords;

	R.scenes = Maat.db.scenes.length;
	
	for (let u in Maat.db.users){
		Maat.scanCollection(u);
		
		R.users++;
		
		let U = Maat.db.collections[u];
		//console.log(U.panos)

		R.models += U.models.length;
		R.panos  += U.panos.length;
		R.media  += U.media.length;
	}

	//console.log(R);
	return R;
};

module.exports = Maat;