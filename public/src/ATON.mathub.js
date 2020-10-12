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
        opacity: 0.2, 
        flatShading: true
    });

    // XR/VR ray
    MatHub.materials.controllerRay = new THREE.MeshBasicMaterial({ 
        color: MatHub.colors.white, 
        transparent: true, 
        opacity: 0.2,
        depthWrite: false,
        flatShading: true
    });

    // Semantic shapes
    MatHub.materials.semanticShape = new THREE.MeshBasicMaterial({ 
        color: MatHub.colors.sem, 
        transparent: true,
        depthWrite: false, 
        opacity: 0.1,
        flatShading: true
    });
    MatHub.materials.semanticShapeHL = new THREE.MeshBasicMaterial({ 
        color: MatHub.colors.sem, 
        transparent: true,
        depthWrite: false, 
        opacity: 0.3,
        flatShading: true
    });
    MatHub.materials.semanticShapeEdit = new THREE.MeshBasicMaterial({ 
        color: MatHub.colors.orange, 
        transparent: true,
        depthWrite: false, 
        opacity: 0.5,
        flatShading: true
    });
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