/*
    ATON Semantic shapes factory

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
ATON Semantic Factory
@namespace SemFactory
*/
let SemFactory = {};

SemFactory.FLOAT_PREC = 5;


SemFactory.init = ()=>{
    SemFactory.bConvexBuilding = false;
    SemFactory.convexPoints = [];
    //SemFactory.convexMeshes = [];
    SemFactory.convexNode   = undefined; // keeps track of current convex semnode
    SemFactory.currConvexMesh = undefined;
    
    // Temp sem node to hold developing convex mesh
    SemFactory.currSemNode = ATON.createSemanticNode();
    SemFactory.currSemNode.disablePicking();
    SemFactory.currSemNode.attachToRoot();

    SemFactory.resetMaterial();

    SemFactory._numShapes = 0; // counter of shapes produced
};


// Current material
SemFactory.resetMaterial = ()=>{
    SemFactory.currMaterial = ATON.MatHub.getMaterial("semanticShapeHL"); // current sem material we are using. Was "semanticShape"
};

SemFactory.setMaterial = (m)=>{
    if (m === undefined) return;
    SemFactory.currMaterial = m;
};


// Convex shapes
// NOTE: if semid exists, add mesh under the same id
SemFactory.addConvexPoint = (/*semid,*/ p)=>{
    if (p === undefined) return false;

    if (SemFactory.convexPoints.length>0){
        let pp = SemFactory.convexPoints[SemFactory.convexPoints.length-1];
        if (p.equals(pp)) return false;
    }

    SemFactory.convexPoints.push(p);
    let numPoints = SemFactory.convexPoints.length;

    // Spatial UI
    let M = new THREE.Mesh( ATON.Utils.geomUnitSphere, ATON.MatHub.getMaterial("semanticShapeEdit"));
    M.position.copy(p);
    M.scale.set(0.001,0.001,0.001);
    ATON.SUI.gPoints.add( M );

    if (numPoints < 4) return false;

    // lets build convex shape
    let geom   = new THREE.ConvexGeometry( SemFactory.convexPoints ); // new THREE.ConvexBufferGeometry( SemFactory.convexPoints );
    let semesh = new THREE.Mesh( geom, ATON.MatHub.getMaterial("semanticShapeEdit") );

    //let numMeshes = SemFactory.convexMeshes.length;

    // First time: create semnode and add it to current sem group
    if (!SemFactory.bConvexBuilding){
        //if (semid === undefined) semid = "sem"+SemFactory._numShapes;

        //SemFactory.convexNode = ATON.getSemanticNode(semid) || ATON.createSemanticNode(semid);
        //SemFactory.convexNode = ATON.createSemanticNode();
        //SemFactory.convexNode.add(semesh);
        SemFactory.currSemNode.add(semesh);
        
        // Store
        semesh.userData._convexPoints = [];
        for (let i=0; i<numPoints; i++){
            //semesh.userData._convexPoints.push( ATON.Utils.setVectorPrecision(SemFactory.convexPoints[i],3) );

            ATON.Utils.setVectorPrecision(SemFactory.convexPoints[i], SemFactory.FLOAT_PREC);
            
            semesh.userData._convexPoints.push(SemFactory.convexPoints[i].x);
            semesh.userData._convexPoints.push(SemFactory.convexPoints[i].y);
            semesh.userData._convexPoints.push(SemFactory.convexPoints[i].z);
        }

        SemFactory.currConvexMesh = semesh;
        SemFactory.bConvexBuilding = true;
    }

    // keep updating current semantic geometry
    else {
        let currSemesh = SemFactory.currConvexMesh;
        currSemesh.geometry.dispose();
        currSemesh.geometry = geom;

        //currSemesh.userData._convexPoints.push( ATON.Utils.setVectorPrecision(p,3) );

        ATON.Utils.setVectorPrecision(p,4);
        currSemesh.userData._convexPoints.push( p.x );
        currSemesh.userData._convexPoints.push( p.y );
        currSemesh.userData._convexPoints.push( p.z );
    }

    return true;
};

SemFactory.undoConvexPoint = ()=>{
    let numPoints = SemFactory.convexPoints.length;
    if (numPoints === 0) return;

    //if (!SemFactory.bConvexBuilding) return;

    SemFactory.convexPoints.pop();

    if (SemFactory.currConvexMesh){
        let udMesh = SemFactory.currConvexMesh.userData;
        if (udMesh._convexPoints) udMesh._convexPoints.pop();
    }
};

SemFactory.stopCurrentConvex = ()=>{
    SemFactory.convexPoints = [];
    SemFactory.bConvexBuilding = false;

    SemFactory.currSemNode.removeChildren();
    ATON.SUI.gPoints.removeChildren();
};

SemFactory.getCurrentConvexShape = ()=>{
    return SemFactory.currSemNode;
};

SemFactory.isBuildingShape = ()=>{
    if (SemFactory.convexPoints.length>0) return true;

    return false;
};

SemFactory.completeConvexShape = (semid)=>{
    SemFactory.convexPoints = [];
    SemFactory.bConvexBuilding = false;

    //if (SemFactory.convexNode === undefined) return undefined;
    //if (SemFactory.currConvexMesh === undefined) return undefined;
    if (SemFactory.currSemNode === undefined) return;

    if (semid === undefined) semid = "sem"+SemFactory._numShapes;

    let S = ATON.getSemanticNode(semid) || ATON.createSemanticNode(semid);
    
    S.add(SemFactory.currSemNode.children[0]);
    S.setMaterial( /*SemFactory.currMaterial*/ATON.MatHub.materials.semanticShape);
    S.setDefaultAndHighlightMaterials(/*SemFactory.currMaterial*/ ATON.MatHub.materials.semanticShape, /*ATON.MatHub.materials.semanticShapeHL*/SemFactory.currMaterial);
    S.enablePicking();

    SemFactory.currSemNode.removeChildren();

/*
    SemFactory.convexNode = ATON.getSemanticNode(semid) || ATON.createSemanticNode(semid);
    SemFactory.convexNode.add(SemFactory.currConvexMesh);

    SemFactory.convexNode.setMaterial( SemFactory.currMaterial );
    SemFactory.convexNode.setDefaultMaterial(SemFactory.currMaterial);
    SemFactory.convexNode.enablePicking();
*/
    SemFactory._numShapes++;

    //console.log(SemFactory.convexNode);
    //console.log(SemFactory.convexNode.userData._convexPoints);

    //return SemFactory.convexNode;

    // Spatial UI
    ATON.SUI.gPoints.removeChildren();

    return S;
};

SemFactory.createConvexShape = (semid, points)=>{
    let geom   = new THREE.ConvexGeometry( points ); // CHECK: it was THREE.ConvexBufferGeometry( points );
    let semesh = new THREE.Mesh( geom, /*SemFactory.currMaterial*/ATON.MatHub.materials.semanticShape );

    semesh.userData._convexPoints = [];
    for (let i=0; i<points.length; i++){
        let p = points[i];
        ATON.Utils.setVectorPrecision(p,4);

        semesh.userData._convexPoints.push( p.x );
        semesh.userData._convexPoints.push( p.y );
        semesh.userData._convexPoints.push( p.z );
        }

    let S = ATON.getOrCreateSemanticNode(semid);
    S.add(semesh);
    S.setDefaultAndHighlightMaterials(/*SemFactory.currMaterial*/ATON.MatHub.materials.semanticShape, SemFactory.currMaterial /*ATON.MatHub.materials.semanticShapeHL*/);

    S.enablePicking();

    return S;
};

SemFactory.addSurfaceConvexPoint = (/*semid,*/ offset)=>{
    if (ATON._queryDataScene === undefined) return false;

    if (offset === undefined) offset = 0.02;

    let p   = ATON._queryDataScene.p;
    let eye = ATON.Nav.getCurrentEyeLocation();
/*
    let n = ATON._queryDataScene.n;
    p.x += (n.x * offset);
    p.y += (n.y * offset);
    p.z += (n.z * offset);
*/
    p.lerpVectors(p, eye, offset);

    SemFactory.addConvexPoint(p);
    return p;
};


// Spherical semantic shapes
// NOTE: if semid exists, add mesh under the same id
SemFactory.createSphere = (semid, location, radius)=>{
    if (location === undefined) return undefined;
    if (radius === undefined) return undefined;

/*
    if (ATON.getSemanticNode(semid)){
        console.log("ERROR SemFactory: semantic node "+semid+" already exists.");
        return false;
    }
*/
    if (semid === undefined) semid = "sem"+SemFactory._numShapes;

    let S = ATON.getOrCreateSemanticNode(semid);

    //let g = new THREE.SphereGeometry( 1.0, 16, 16 );
    let M = new THREE.Mesh( ATON.Utils.geomUnitSphere, /*SemFactory.currMaterial*/ATON.MatHub.materials.semanticShape );
    
    // Note: we add multiple spheres to the same <semid> node
    let sphere = new THREE.Object3D();
    sphere.position.copy(location);
    sphere.scale.set(radius, radius, radius);
    sphere.add(M);

    S.add( sphere );
    S.enablePicking();
    S.setDefaultAndHighlightMaterials(/*SemFactory.currMaterial*/ATON.MatHub.materials.semanticShape, SemFactory.currMaterial/*ATON.MatHub.materials.semanticShapeHL*/);

    //SemFactory.currParent.add( S );

    SemFactory._numShapes++;

    return S;
};

SemFactory.createSurfaceSphere = (semid)=>{
    if (!ATON._queryDataScene) return undefined;

    let p = ATON._queryDataScene.p;
    let r = ATON.SUI.getSelectorRadius();

    return SemFactory.createSphere(semid, p,r);
};

export default SemFactory;