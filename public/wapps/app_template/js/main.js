/*
	Main js entry for template ATON web-app

===============================================*/
window.addEventListener( 'load', ()=>{

    // Realize the base front-end
    ATON.FE.realize();

    // Our events
	ATON.FE.addBasicLoaderEvents();

	// Load sample 3D model
	ATON.createSceneNode("sample").load(ATON.PATH_COLLECTION+"samples/models/skyphos/skyphos.gltf").attachToRoot();

	// Do stuff...
	let d = {};
	d.scoreboard = {};
	d.scoreboard.bryan = 123;

	ATON.AppHub.addToStorage(d);
	ATON.AppHub.getStorage((S)=>{ console.log(S); });
});
