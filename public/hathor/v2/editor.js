/*===========================================================================

    "Hathor" v2
    Editor: scene modification routines

    Author: B. Fanini

===========================================================================*/
let ED = {};

ED.setup = ()=>{
    ED._bPersistent = false;
};

ED.setPersistentModifications = (b)=>{
    ED._bPersistent = b;
};

ED.createLayer = (o)=>{
    let nid = o.nid;
    if (!nid) return false;

    let graph = ATON.NTYPES.SCENE;
    if (o.type) graph = o.type;

    let N = undefined;

    if (graph === ATON.NTYPES.SEM){
        N = ATON.createSemanticNode(nid);

        if (o.parent) N.attachTo(o.parent);
        else N.attachToRoot();
    }
    else {
        N = ATON.createSceneNode(nid);

        if (o.parent) N.attachTo(o.parent);
        else N.attachToRoot();
    }

    // Persistent
    if (!ED._bPersistent) return true;

    //TODO:

    return true;
};

ED.deleteLayer = (o)=>{
    //TODO:
};


export default ED;