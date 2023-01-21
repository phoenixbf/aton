/*
	Sample standalone ATON front-end (no Node.js required)

    This is a sample viewer, loading 3D models or scenes from assets/ folder
    Parameters:
        ?m=<model-path> (e.g. "atoncube.glb")
        ?s=<scene-path> (e.g. "scene")

==============================================================*/

let APP = ATON.App.realize();
window.APP = APP;

// Tell ATON to configure paths and resources as standalone
ATON.setAsStandalone();

// This is our assets root folder
// In this sample App, scene descriptors (.json) are also placed there, but you are free to organize folders as you like
APP.assetsPath = APP.basePath + "assets/";

// Tell ATON to look for 3D content here
ATON.setPathCollection(APP.assetsPath);

// APP.setup() is required for web-app initialization
// You can place here UI setup (HTML), events handling, etc.
APP.setup = ()=>{
    ATON.FE.realize(); // Realize the base front-end
	ATON.FE.addBasicLoaderEvents(); // Add basic events handling

    // Sample params to load a 3D model or scene
    // E.g.: ?m=atoncube.glb or ?s=scene
    let model = APP.params.get('m');
    let scene = APP.params.get('s');

    // If model is provided, load it under the "main" node
	if (model) ATON.createSceneNode("main").load(model).attachToRoot();

    // If a scene is provided, load the JSON descriptor and assign the scene ID "sample-scene"
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