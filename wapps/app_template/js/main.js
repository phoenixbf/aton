/*
	Main js entry for template ATON web-app

===============================================*/
window.addEventListener( 'load', ()=>{

    // Realize the base front-end
    ATON.FE.realize();

    // Our events
	ATON.FE.addBasicLoaderEvents();

	// Load sample 3D model
	ATON.createSceneNode("sample").load("samples/models/skyphos/skyphos.gltf").attachToRoot();

	// Do stuff...
	let d = {};
	d.bryan = 123;

	ATON.AppHub.addToStorage("scoreboard", d)
		.then((S)=>{
			console.log(S);
		})
		.catch((e)=>{
			console.log(e);
		});

	ATON.AppHub.getStorage("scoreboard").then((s)=>{ console.log(s); }).catch((e)=>{ console.log(e); });
});
