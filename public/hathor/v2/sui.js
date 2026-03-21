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

    SUI._grid = undefined;

    SUI.buildGizmoTC();
    SUI.realizeGrid();

    ATON.SUI.showSelector(false);
};

SUI.enterEditorMode = ()=>{
    SUI._rootED.show();
    SUI.realizeGrid();
    ATON.SUI.showSelector(true);
};

SUI.exitEditorMode = ()=>{
    SUI._rootED.hide();
    ATON.SUI.showSelector(false);
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

export default SUI;