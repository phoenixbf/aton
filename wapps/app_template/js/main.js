/*
	Main js entry for template ATON web-app

===============================================*/
// Realize our app
let APP = ATON.App.realize();

// You can require here flares (plugins) if needed by the app
//APP.requireFlares(["myFlare","anotherFlare"]);

// APP.setup() is required for web-app initialization
// You can place here UI setup (HTML), events handling, etc.
APP.setup = ()=>{

	// Realize base ATON and add base UI events
    ATON.realize();
    ATON.UI.addBasicEvents();

	// Load sample 3D model
	ATON.createSceneNode("sample").load("samples/models/skyphos/skyphos.gltf").attachToRoot();

    // If our app required ore or more flares (plugins), we can also wait for them to be ready for specific setups
    ATON.on("AllFlaresReady",()=>{
		// Do stuff
		console.log("All flares ready");
	});
};

/*
	If you plan to use a local config for this app
	this is a sample skeleton for loading a JSON config file from a given pathConfigFile (generally in a git ignored folder, e.g. config/)

APP.loadConfig = ()=>{
    ATON.REQ.get( pathConfigFile, ( data )=>{
        console.log("Loaded config");

		// Do something with loaded data

    },()=>{
		console.log("Config not found");
	});
};
*/

/*
	If you plan to use an update routine (executed continuously)
	you can place its logic here

APP.update = ()=>{

};
*/
