/*===========================================================================

    "Hathor" v2
    Spatial UI component

    Author: B. Fanini

===========================================================================*/
let SUI = {};

SUI.GRID_SIZE      = 10;
SUI.GRID_DIVISIONS = 10;


SUI.setup = ()=>{
    SUI._rootED = ATON.createUINode().attachToRoot();
    SUI._rootED.hide();

    SUI._grid = undefined;

    SUI.buildGizmoTC();
    SUI.realizeGrid();

    ATON.SUI.showSelector(false);

    SUI._matDef = ATON.MatHub.materials.defUI.clone();
    SUI._matDef.uniforms.tint.value    = ATON.MatHub.colors.white;
    SUI._matDef.uniforms.opacity.value = 0.5;

    ATON.on("UINodeHover", (hui)=>{
        console.log("Hover "+hui)
    });
    ATON.on("UINodeLeave", (hui)=>{
        console.log("Leave "+hui)
    });
};

SUI.enterEditorMode = ()=>{
    SUI.buildPOVs();

    SUI.realizeGrid();
    ATON.SUI.showSelector(true);

    SUI._rootED.show();
};

SUI.exitEditorMode = ()=>{
    ATON.SUI.showSelector(false);

    SUI._rootED.hide();
};

// Base grid (editor)
SUI.realizeGrid = ()=>{
    if (SUI._grid) return;

    SUI._grid = new THREE.GridHelper( SUI.GRID_SIZE, SUI.GRID_DIVISIONS );
    SUI._grid.raycast = ATON.Utils.VOID_CAST;

    SUI._rootED.add(SUI._grid);
};

// Gizmos
SUI.buildGizmoTC = ()=>{
    SUI._tc = new THREE.TransformControls( ATON.Nav._camera, ATON._renderer.domElement );

    SUI._tc.addEventListener('dragging-changed', ( event )=>{
        let bDrag = event.value;

        ATON.Nav.setUserControl(!bDrag);
        ATON._bPauseQuery = bDrag;

        if (!bDrag){
            ATON.recomputeSceneBounds();
            ATON.updateLightProbes();

            let T = SUI._tc.object;
            if (T){
                HATHOR.ED.dirtyNodeTransformReq(T, ["pos","rot","scl"]);
                console.log(T)
            }
        }
    });

    SUI._rootED.add(SUI._tc.getHelper());
};

SUI.attachGizmoToNode = (N)=>{
    if (!N) return;
    if (!SUI._tc) return;

    SUI._tc.attach( N );
};

SUI.detachGizmo = ()=>{
    if (!SUI._tc) return;
    
    SUI._tc.detach();
};

SUI.buildPOVs = ()=>{
    return;
    
    let build = ()=>{
        for (let pov in ATON.Nav.povlist){
            let POV = ATON.Nav.povlist[pov];

            //let cNode = SUI._mCam.clone();
            //cNode.as("POV-"+pov);

            let cNode = ATON.createUINode().setMaterial( ATON.MatHub.materials.defUI );
            cNode.load(ATON.PATH_RES + "models/cam.glb", ()=>{
                //cNode.disablePicking();
            });

            //let cNode = ATON.createUINode("H_SUI-"+pov);
            //cNode.add( new THREE.Mesh(ATON.Utils.geomUnitCube, ATON.MatHub.materials.invisible ) );
            cNode.attachTo(SUI._gPOVs);
            //cNode.attachToRoot();
            //cNode.setScale(0.2);

            cNode.position.copy(POV.pos);
            cNode.orientToLocation(POV.target);
            cNode.disablePicking();

            let trigger = ATON.createSemanticNode("POV-"+pov);
            trigger.position.copy(POV.pos);
            trigger.setScale(0.2);
            trigger.add( new THREE.Mesh(ATON.Utils.geomUnitCube, ATON.MatHub.materials.invisible ) );            

            trigger.onHover = ()=>{
                cNode.setMaterial(SUI._matDef)
            };
            trigger.onLeave = ()=>{
                cNode.setMaterial( ATON.MatHub.materials.defUI );
            };

            trigger.attachTo(SUI._gPOVs).enablePicking();

            //cNode.enablePicking();
            //ATON.SUI.visitor(cNode, true);


/*
            let trigger = ATON.createUINode("SUI-"+pov);
            trigger.add( new THREE.Mesh(ATON.Utils.geomUnitCube, ATON.MatHub.materials.invisible ) );
            trigger.setScale(0.2);
            trigger.attachTo(cNode);

            trigger.enablePicking();

            trigger.onHover = ()=>{
                trigger.setMaterial(SUI._matDef);
            };
            trigger.onLeave = ()=>{
                trigger.setMaterial(ATON.MatHub.materials.invisible);
            };
*/
        }

    };

    if (!SUI._gPOVs){
        SUI._gPOVs = ATON.createUINode();
        SUI._gPOVs.attachTo(SUI._rootED);
        build();
        //SUI._mCam = ATON.createUINode().setMaterial( SUI._matDef ).load(ATON.PATH_RES + "models/cam.glb", build);
    }
    else {
        SUI._gPOVs.removeChildren();
        build();
    }
};

export default SUI;