const fs          = require('fs');
const path        = require('path');
const glob        = require("glob");
const jsonpatch   = require('fast-json-patch');


ServUtils = {};

ServUtils.DIR_PUBLIC       = path.join(__dirname,"/../public/");
ServUtils.DIR_NODE_MODULES = path.join(__dirname, "node_modules");
ServUtils.DIR_APIDOC       = path.join(__dirname, "/../API/");
ServUtils.DIR_COLLECTION   = path.join(ServUtils.DIR_PUBLIC,"collection/");
ServUtils.DIR_MODELS       = path.join(ServUtils.DIR_COLLECTION,"models/");
ServUtils.DIR_PANO         = path.join(ServUtils.DIR_COLLECTION,"pano/");
ServUtils.DIR_SCENES       = path.join(ServUtils.DIR_PUBLIC,"scenes/");
ServUtils.DIR_EXAMPLES     = path.join(ServUtils.DIR_PUBLIC,"examples/");
ServUtils.STD_SCENEFILE    = "scene.json";

ServUtils.STATUS_COMPLETE   = "complete";
ServUtils.STATUS_PROCESSING = "processing";


// Routine for loading custom -> default fallback config JSON files
ServUtils.loadConfigFile = (jsonfile)=>{
	let customconfig  = path.join(__dirname, "_prv/"+jsonfile);
	let defaultconfig = path.join(__dirname, jsonfile);

	if (fs.existsSync(customconfig)){
		let C = JSON.parse(fs.readFileSync(customconfig, 'utf8'));
		console.log("Found custom config "+jsonfile);
		return C;
	}

	console.log(jsonfile+" not found in '_prv/', Loading default...");
	let C = JSON.parse(fs.readFileSync(defaultconfig, 'utf8'));
	return C;
};

// SSL certs
ServUtils.getCertPath = ()=>{
	return path.join(__dirname,'/_prv/server.crt');
};
ServUtils.getKeyPath = ()=>{
	return path.join(__dirname,'/_prv/server.key');
};

// Scene utils
ServUtils.getSceneFolder = (sid)=>{
	return path.join(ServUtils.DIR_SCENES,sid);
};
ServUtils.getSceneJSONPath = (sid)=>{
	let jsonfile = path.join( ServUtils.getSceneFolder(sid), ServUtils.STD_SCENEFILE);

	return jsonfile;
};

// Check if scene exists on disk
ServUtils.existsScene = (sid)=>{;
	let b = fs.existsSync(ServUtils.getSceneJSONPath(sid));
	return b;
};

ServUtils.createBasicScene = ()=>{
	let sobj = {};

	sobj.status = ServUtils.STATUS_COMPLETE;

	sobj.scenegraph = {};
	sobj.scenegraph.nodes = {};
	sobj.scenegraph.nodes.main = {};
	sobj.scenegraph.edges = {}; //[[".","main"]];
	sobj.scenegraph.edges["."] = ["main"];

	sobj.scenegraph.nodes.main.urls = [];

	console.log(sobj);

	return sobj;
};

// Create sub-folder structure on disk
ServUtils.touchSceneFolder = (sid)=>{
	let D = ServUtils.getSceneFolder(sid);
	if (!fs.existsSync(D)) fs.mkdirSync(D, { recursive: true }); // note: NodeJS > 10.0
};

ServUtils.readSceneJSON = (sid)=>{
	let jspath = ServUtils.getSceneJSONPath(sid);
	if (!fs.existsSync(jspath)) return undefined;

	let S = JSON.parse(fs.readFileSync(jspath, 'utf8'));
	return S;
};


// Apply partial edit to sobj
ServUtils.addSceneEdit = (sobj, edit)=>{
	//if (sobj === undefined) return undefined;

	// object or array
	if (typeof edit === "object"){
		for (let k in edit){
			let E = edit[k];

			//if (Array.isArray(E)){
			//	sobj[k] = E;
			//}

			// Touch
			if (sobj[k] === undefined){
				//sobj[k] = {};
				sobj[k] = Array.isArray(E)? [] : {};
			}

			sobj[k] = ServUtils.addSceneEdit(sobj[k], E);
		}

		return sobj;
	}

	// not object
	sobj = edit;
	return sobj;
};

ServUtils.deleteSceneEdit = (sobj, edit)=>{
	if (sobj === undefined) return undefined;

	// object or array
	if (typeof edit === "object"){
		for (let k in edit){
			let E = edit[k];

			//if (Array.isArray(sobj)) sobj = sobj.filter(e => e !== k);

			if (sobj[k] !== undefined){
				if (Object.keys(E).length > 0){
					sobj[k] = ServUtils.deleteSceneEdit(sobj[k], E);
				}
				else {
					//if (Array.isArray(sobj)) sobj = sobj.filter(e => e !== k);
					//else 
					delete sobj[k];
				}
			}
		}

		return sobj;
	}

	return undefined;
};

// Apply incoming patch to sid JSON
ServUtils.applySceneEdit = (sid, patch, mode)=>{
	let sjpath = ServUtils.getSceneJSONPath(sid);
	let S = ServUtils.readSceneJSON(sid);

	if (S === undefined) return; // scene does not exist

	//jsonpatch.applyPatch(S, patch);

	if (mode === "DEL") S = ServUtils.deleteSceneEdit(S, patch);
	else S = ServUtils.addSceneEdit(S, patch);

	S = ServUtils.cleanScene(S);

	fs.writeFileSync(sjpath, JSON.stringify(S)); // , null, 4

	//console.log(S);
	return S;
};

/*
ServUtils.applySceneEdit = (M, sobj)=>{
	let sid  = M.sid;
	let data = M.data;
	let task = M.task;

	if (sid === undefined) return false;
	if (task === undefined) return false;

	let sjpath = ServUtils.getSceneJSONPath(sid);
	let sobj = ServUtils.readSceneJSON(sid);

	if (sobj === undefined) return false; // scene does not exist

	//if (task === "DEL") sobj = ServUtils.deleteSceneEdit(sobj, patch);
	//if (task === "ADD") sobj = ServUtils.addSceneEdit(sobj, patch);

	if (task === "UPD_SEM_NODE"){
		let nid     = data.nid;
		let content = data.content;
		if (nid === undefined) return;
		if (sobj.semanticgraph[nid] === undefined) sobj.semanticgraph[nid] = {}; // touch

		sobj.semanticgraph[nid] = content;
	}

	// write
	sobj = ServUtils.cleanScene(sobj);
	fs.writeFileSync(sjpath, JSON.stringify(sobj)); // , null, 4

	//console.log(sobj);
	//return sobj;
	return true;
};
*/

ServUtils.cleanScene = (sobj)=>{
	// semantic graph
	if (sobj.semanticgraph && sobj.semanticgraph.edges){
		for (let e in sobj.semanticgraph.edges){
			let children = sobj.semanticgraph.edges[e];

			for (let c in children){
				let nid = children[c];
				//console.log(nid);

				if (sobj.semanticgraph.nodes === undefined || sobj.semanticgraph.nodes[nid] === undefined){
					children.splice(c, 1);
				}
			}
		}
	}

	// scene-graph
	if (sobj.scenegraph && sobj.scenegraph.edges){
		for (let e in sobj.scenegraph.edges){
			let children = sobj.scenegraph.edges[e];

			for (let c in children){
				let nid = children[c];
				//console.log(nid);

				if (sobj.scenegraph.nodes === undefined || sobj.scenegraph.nodes[nid] === undefined){
					children.splice(c, 1);
				}
			}
		}
	}

	return sobj;
};




// Write scene JSON from sid and data
ServUtils.writeSceneJSON = (sid, data)=>{
	if (sid === undefined) return false;
	if (data === undefined) return false;

	ServUtils.touchSceneFolder(sid);

	let sjpath = ServUtils.getSceneJSONPath(sid);

	// Use partial update (first level)
/*
	if (bPartial){
		let S = ServUtils.readSceneJSON(sid);
		//for (let k in data) S[k] = data[k];
		Object.assign(S,data);

		fs.writeFileSync(sjpath, JSON.stringify(S, null, 4));
		return;
	}
*/	
	fs.writeFileSync(sjpath, JSON.stringify(data, null, 4));
	return true;
};


module.exports = ServUtils;