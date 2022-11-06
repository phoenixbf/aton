/*
	Main js entry for template ATON web-app

===============================================*/
let APP = ATON.App.realize();

// APP.setup() is required for web-app initialization
// You can place here UI setup (HTML), events handling, etc.
APP.setup = ()=>{
    ATON.FE.realize(); // Realize the base front-end

	ATON.FE.addBasicLoaderEvents(); // Add basic events handling

	// Load sample 3D model
	ATON.createSceneNode("sample").load("samples/models/skyphos/skyphos.gltf").attachToRoot();
};

/* APP.update() if you plan to use an update routine (executed continuously)
APP.update = ()=>{

};
*/

// Run the App
window.addEventListener('load', ()=>{
	APP.run();
};
