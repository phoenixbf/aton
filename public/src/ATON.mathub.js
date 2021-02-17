/*
    ATON Materials Hub
    Centralized material manager

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
ATON Material Hub
@namespace MatHub
*/
let MatHub = {};

MatHub.init = ()=>{
    MatHub.materials = {};
    MatHub.colors    = {};

    MatHub.addDefaults();

    MatHub._loader = new THREE.MaterialLoader();
};

MatHub.addDefaults = ()=>{

    // Colors
    MatHub.colors.white  = new THREE.Color(1,1,1);
    MatHub.colors.black  = new THREE.Color(0,0,0);
    MatHub.colors.green  = new THREE.Color(0,1,0);
    MatHub.colors.yellow = new THREE.Color(1,1,0);
    MatHub.colors.red    = new THREE.Color(1,0,0);
    MatHub.colors.blue   = new THREE.Color(0,0,1);
    MatHub.colors.orange = new THREE.Color(1,0.5,0);
    
    MatHub.colors.sem     = new THREE.Color(0,0,1);
    MatHub.colors.darksem = new THREE.Color(0,0,0.1);

    // Materials
    MatHub.materials.fullyTransparent = new THREE.MeshBasicMaterial({ 
        transparent: true, 
        depthWrite: false, 
        opacity: 0.0
    });
    
    // Selector
    MatHub.materials.selector = new THREE.MeshBasicMaterial({
        color: MatHub.colors.green,
        transparent: true,
        depthWrite: false,
        opacity: 0.2 
        //flatShading: true
    });

    // XR/VR ray
    MatHub.materials.controllerRay = new THREE.MeshBasicMaterial({ 
        color: MatHub.colors.white, 
        transparent: true, 
        opacity: 0.2,
        depthWrite: false
        //flatShading: true
    });

    // Teleport locator
    MatHub.materials.teleportLoc = new THREE.MeshBasicMaterial({ 
        transparent: true, 
        opacity: 1.0,
        depthWrite: false,
        //flatShading: true,
        side: THREE.DoubleSide
    });
    ATON.Utils.textureLoader.load(ATON.PATH_RES+"grad.png", (texture) => {
        MatHub.materials.teleportLoc.map = texture;
    });

    // Measurements
    MatHub.materials.measurement = new THREE.MeshBasicMaterial({
        color: MatHub.colors.white,
        //linewidth: 5,
        transparent: true,
        depthWrite: false,
        opacity: 0.5, 
        depthTest: false
        //flatShading: true
    });

    // Semantic shapes
    MatHub.materials.semanticShape = new THREE.MeshBasicMaterial({ 
        //color: MatHub.colors.white, 
        transparent: true,
        depthWrite: false, 
        opacity: 0.0,
        //flatShading: true
    });

/*
    MatHub._uSem = {
        time: { type:'float', value: 0.0 },
    };

    MatHub.materials.semanticShape = new THREE.ShaderMaterial({
        uniforms: MatHub._uSem,

        vertexShader:`
		    //varying vec3 vPositionW;
		    //varying vec3 vNormalW;

		    void main(){
		        //vPositionW = vec3( vec4( position, 1.0 ) * modelMatrix);
		        //vNormalW   = normalize( vec3( vec4( normal, 0.0 ) * modelMatrix ) );

		        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		    }
        `,

        fragmentShader:`
            //varying vec3 vPositionW;
		    //varying vec3 vNormalW;
            uniform float time;

		    void main(){
		        //vec3 viewDirectionW = normalize(cameraPosition - vPositionW);
		        //float f = dot(viewDirectionW, vNormalW);
		        //f = clamp(1.0 - f, 0.0, 1.0);


                float f = cos(time*5.0);
                f = clamp(f, 0.0,1.0);
                f *= 0.1;

		        gl_FragColor = vec4(0.0, 0.0, 1.0, f);
		    }
        `,
        transparent: true,
        depthWrite: false,
        flatShading: false
        //opacity: 0.0,
    });
*/
    MatHub.materials.semanticShapeHL = new THREE.MeshBasicMaterial({ 
        color: MatHub.colors.sem, 
        transparent: true,
        depthWrite: false, 
        opacity: 0.2
        //flatShading: true
    });
    MatHub.materials.semanticShapeEdit = new THREE.MeshBasicMaterial({ 
        color: MatHub.colors.orange, 
        transparent: true,
        depthWrite: false, 
        opacity: 0.5
        //flatShading: true
    });

    MatHub.semIcon = new THREE.SpriteMaterial({ 
        map: new THREE.TextureLoader().load( ATON.PATH_RES+"semicon.png" ), 
        //color: MatHub.colors.sem, // multiply
        transparent: true,
        opacity: 1.0,
        //depthWrite: false, 
        depthTest: false
    });
    MatHub.semIcon.sizeAttenuation = false;
};

MatHub.addMaterial = (id, mat)=>{
    if (MatHub.materials[id]){
        console.log("MatHub: material "+id+" already registered");
        return;
    }

    MatHub.materials[id] = mat;
};

MatHub.loadMaterial = (id, jsonfile)=>{
    MatHub._loader.load(jsonfile, (mat)=>{
        MatHub.addMaterial(id, mat);
    },
    undefined,
    (err)=>{
        console.log(err);
    });
};

MatHub.getMaterial = (id)=>{
    return MatHub.materials[id];
};

export default MatHub;