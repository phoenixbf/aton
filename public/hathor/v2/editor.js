/*===========================================================================

    "Hathor" v2
    Editor: scene modification routines

    Author: B. Fanini

===========================================================================*/
let ED = {};

ED.setup = ()=>{
    ED._bPersistent = false;

    ED._opList = [];
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

    let op = {
        a: "ADD_NODE",
        data: o,
    };

    ED._opList.push(op);

    // Persistent
    if (!ED._bPersistent) return true;

    //TODO:

    return true;
};

ED.deleteLayer = (o)=>{
    //TODO:
};

ED.addModel = (o)=>{
    let url = o.url;
    let nid = o.nid;
    let type = o.type? o.type : ATON.NTYPES.SCENE;

    let N = undefined;
    if (type === ATON.NTYPES.SCENE) N = ATON.getSceneNode(nid);
    else N = ATON.getSemanticNode(nid);

    N.load(url);

    let op = {
        a: "ADD_MODEL",
        data: o,
    };

    ED._opList.push(op);
};


export default ED;