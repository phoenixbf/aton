/*
	Sample standalone ATON front-end (no Node.js required)

==============================================================*/

let APP = ATON.App.realize();
window.APP = APP;

// This is our assets root folder
APP.assetsPath = APP.basePath + "assets/";

// Tell ATON to look for 3D content here
ATON.setPathCollection(APP.assetsPath);

// APP.setup() is required for web-app initialization
// You can place here UI setup (HTML), events handling, etc.
APP.setup = ()=>{
    ATON.FE.realize(); // Realize the base front-end
	ATON.FE.addBasicLoaderEvents(); // Add basic events handling

    let model = APP.params.get('m');
    let scene = APP.params.get('s');

	if (model) ATON.createSceneNode("main").load(model).attachToRoot();
    if (scene) ATON.SceneHub.load(APP.assetsPath + scene + ".json", "sample-scene");

    // Setup minimal UI
    ATON.FE.uiAddButtonHome("idBottomToolbar");
	
    ATON.FE.uiAddButtonFullScreen("idTopToolbar");
    ATON.FE.uiAddButtonNav("idTopToolbar");
    ATON.FE.uiAddButtonVR("idTopToolbar");
};

/* APP.update() if you plan to use an update routine (executed continuously)
APP.update = ()=>{

};
*/

window.addEventListener('load',()=>{
    APP.run();
});