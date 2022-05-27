/*
    ATON XPF Network

    Network manager of eXtended Panoramic Frames (XPFs)
    formerly "DPF": http://osiris.itabc.cnr.it/scenebaker/index.php/projects/dpf/

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
ATON XPF Network.
The XPF Network component allows to handle several XPFs and their interconnections
@namespace XPFNetwork
*/
let XPFNetwork = {};

XPFNetwork.STD_XPF_TRANSITION_DURATION = 1.0;
XPFNetwork.SEM_PREFIX      = "XPF";
XPFNetwork.SEMGROUP_PREFIX = "GXPF";


XPFNetwork.init = ()=>{
    XPFNetwork._list  = [];

    XPFNetwork._iCurr = undefined;
    XPFNetwork._iNext = undefined;

    //XPFNetwork._group = new THREE.Group();
    //ATON._rootVisibleGlobal.add( XPFNetwork._group );

    XPFNetwork._geom = undefined;
    XPFNetwork._mesh = undefined;
    XPFNetwork._mat  = undefined;
    XPFNetwork._size = 50.0;

    XPFNetwork._gSem = [];

    // img-based
    XPFNetwork._semIMGMasks = {};
    XPFNetwork._semCanvas   = undefined;
    XPFNetwork._semCTX      = undefined;
    XPFNetwork._semCurr     = undefined;

    XPFNetwork._shColor   = new THREE.Color(0,0,1);
    XPFNetwork._shOpacity = 0.2;

    //XPFNetwork._semUnifData = new Uint8Array(256 * 128 * 4);

    XPFNetwork._txCache = {};

    XPFNetwork._pathMod = undefined;

    XPFNetwork._realizeBaseMat();

    XPFNetwork._elVid = undefined;
    XPFNetwork._vidPlaying = false;
};

XPFNetwork._realizeBaseMat = ()=>{
    XPFNetwork._uniforms = {
        tBase: { type:'t' /*, value: 0*/ },
        tSem: { type:'t' /*, value: 0*/ },
        tSemHint: { type:'t' /*, value: 0*/ },
        semHL: { type:'vec4', value: new THREE.Vector4(0,1,0, 0.15) },
        opacity: { type:'float', value: 1.0 },
        shColor: { type:'vec4', value: new THREE.Vector4(0,0,1, 0.2) },
        time: { type:'float', value: 0.0 },
    };


    XPFNetwork._mat = new THREE.ShaderMaterial({
        uniforms: XPFNetwork._uniforms,

        vertexShader:`
            varying vec3 vPositionW;
            varying vec3 vNormalW;
            varying vec3 vNormalV;
            varying vec2 vUv;

            void main(){
                vUv = uv;

                vPositionW = vec3( vec4( position, 1.0 ) * modelMatrix);
                vNormalW   = normalize( vec3( vec4( normal, 0.0 ) * modelMatrix ) );
                vNormalV   = normalize( vec3( normalMatrix * normal ));

                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
        `,
        
        fragmentShader:`
            varying vec3 vPositionW;
		    varying vec3 vNormalW;
            varying vec3 vNormalV;
            varying vec2 vUv;

            uniform float time;
            uniform sampler2D tBase;
            uniform sampler2D tSem;
            uniform sampler2D tSemHint;
            //uniform sampler2D tDepth;

            uniform vec4 semHL, shColor;
            uniform float opacity;

		    void main(){
                vec4 frag = texture2D(tBase, vUv);
                vec4 sem  = texture2D(tSem, vUv);
                vec4 semH = texture2D(tSemHint, vUv);
                float shv = max( max(semH.r,semH.g), semH.b);

                float t = (1.0 * cos(time*2.0));
                t = clamp(t, 0.0,1.0);

                frag = mix(frag, semHL, (sem.r * semHL.a));

                frag = mix(frag, shColor, (t * shv * shColor.a));

                frag.a = opacity;

                gl_FragColor = frag;
		    }
        `,

        depthTest: false,
        depthWrite: false
    });
/*
    XPFNetwork._mat = new THREE.MeshBasicMaterial({ 
        //map: tpano,
        ///emissive: tpano,
        //fog: false,
        
        depthTest: false,
        depthWrite: false,
        
        ///depthFunc: THREE.AlwaysDepth,
        //side: THREE.BackSide, // THREE.DoubleSide
    });
*/

    XPFNetwork.setSemanticHintMapOpacity(0.2);
};

XPFNetwork.setPathModifier = (f)=>{
    if (f === undefined) return;

    XPFNetwork._pathMod = f;
    for (let x in XPFNetwork.list) XPFNetwork.list[x].setPathModifier(f);
};

// This is required to select closest (current) XPF to user location
XPFNetwork.update = ()=>{
    if (ATON.Nav.isTransitioning()) return;
    if (XPFNetwork._list.length < 1) return;

    let len = XPFNetwork._list.length;
    
    // Get current viewpoint
    let E = ATON.Nav._currPOV.pos;
    let V = ATON.Nav._vDir;

    let mindist  = undefined;
    let iclosest = undefined;

    let nxdist   = undefined;
    let inext    = undefined;

    // update dtime
    XPFNetwork._uniforms.time.value += ATON._dt;

    if (XPFNetwork._dirLNode === undefined) XPFNetwork._dirLNode = new THREE.Vector3();

    for (let i=0; i<len; i++){
        let xpf = XPFNetwork._list[i];

        // Search closest
        let d = E.distanceToSquared(xpf._location);
        if (mindist === undefined || d < mindist){
            mindist  = d;
            iclosest = i;
        }

        // Seek next in sight
        // TODO: provide custom routine
        if (i !== XPFNetwork._iCurr){
            XPFNetwork._dirLNode.x = xpf._location.x - E.x;
            XPFNetwork._dirLNode.y = xpf._location.y - E.y;
            XPFNetwork._dirLNode.z = xpf._location.z - E.z;
            XPFNetwork._dirLNode   = XPFNetwork._dirLNode.normalize();

            let v = XPFNetwork._dirLNode.dot(V);
            if (v > 0.8){
                if (nxdist === undefined || d < nxdist){
                    nxdist = d;
                    inext  = i;
                }
            }
        }
    }

    //console.log(inext);
/*
    if (inext !== undefined){
        //XPFNetwork._preloadBaseLayer(inext);
        ////XPFNetwork._list[inext]._lnode.toggleSUI(true);

        if (inext !== XPFNetwork._iNext) ATON.fireEvent("NextXPF", inext);
        XPFNetwork._iNext = inext;
    }
*/
    if (inext !== XPFNetwork._iNext){
        XPFNetwork.toggleSUI(inext, true);
        ATON.fireEvent("NextXPF", inext);
    }

    XPFNetwork._iNext = inext;

    XPFNetwork.querySemanticMasks();

    if (iclosest === XPFNetwork._iCurr) return;

    // We change XPF
    if (XPFNetwork._iCurr !== undefined) XPFNetwork._gSem[XPFNetwork._iCurr].hide();
    
    XPFNetwork.setCurrentXPF(iclosest);

    //XPFNetwork._clearTexCache(); // Clear cached textures

    //ATON.fireEvent("CurrentXPF", iclosest);
};




XPFNetwork.realizeBaseGeometry = ()=>{
    if (XPFNetwork._geom !== undefined) return; // already realized

    XPFNetwork._group = new THREE.Group();
    ATON._rootVisibleGlobal.add( XPFNetwork._group );

    // Default geometry
    XPFNetwork._geom = new THREE.SphereBufferGeometry( 1.0, 40,40 );
    XPFNetwork._geom.scale( -XPFNetwork._size, XPFNetwork._size, XPFNetwork._size );
        
    XPFNetwork._geom.castShadow    = false;
    XPFNetwork._geom.receiveShadow = false;

    XPFNetwork._mesh = new THREE.Mesh(XPFNetwork._geom, XPFNetwork._mat);
    XPFNetwork._mesh.frustumCulled = false;
    XPFNetwork._mesh.renderOrder   = -100;

    XPFNetwork._mesh.layers.enable(ATON.NTYPES.SCENE);

    XPFNetwork._group.add( XPFNetwork._mesh );
    XPFNetwork._mesh.visible = false;
};

// TODO:
XPFNetwork.setBaseGeometry = (geom)=>{
    //xxx.geometry.dispose();
    //xxx.geometry = geom;
};

/**
Add a XPF to the Network
@param {XPF} xpf - A XPF object
@example
ATON.XPFNetwork.add( myXPF )

@example
ATON.XPFNetwork.add( new ATON.XPF().setLocation(10,0,3).setBaseLayer("my/pano.jpg") )
*/
XPFNetwork.add = (xpf)=>{
    if (xpf === undefined) return;

    XPFNetwork.realizeBaseGeometry();

    let i = XPFNetwork._list.length;
    XPFNetwork._list.push(xpf);

    //xpf._lnode.associateToXPF(i);

    // If this XPF has custom mesh
    let m = xpf.getMesh();
    if (m) XPFNetwork._group.add( m );

    // Sem group
    let sem = ATON.getOrCreateSemanticNode(XPFNetwork.SEMGROUP_PREFIX+i); // e.g. "GXPF0"
    XPFNetwork._gSem.push( sem );
    sem.attachToRoot();

    // Setup nav system
    if (i > 0) return;
    ATON.Nav.toggleLocomotionValidator(false);
    ATON._bqScene = true;
};

XPFNetwork.clear = ()=>{
    XPFNetwork._iCurr = undefined;
    XPFNetwork._iNext = undefined;

    XPFNetwork._semCurr = undefined;

    for (let i=0; i<XPFNetwork._list.length; i++){
        let xpf = XPFNetwork._list[i];
        xpf = null;

        if (XPFNetwork._gSem[i]){
            XPFNetwork._gSem[i].removeChildren();
            XPFNetwork._gSem[i] = null;
        }
    }

    XPFNetwork._gSem = [];
    XPFNetwork._list = [];
};

/**
Get number of XPFs in the network
@returns {number}
*/
XPFNetwork.getNumXPFs = ()=>{
    return XPFNetwork._list.length;
};

/**
Get main XPF network group (to transform or manipulate the entire XPF network)
@returns {THREE.Group}
*/
XPFNetwork.getMainGroup = ()=>{
    return XPFNetwork._group;
};

/**
Get semantic group for a given XPF
@param {number} i - The XPF index
@returns {Node} - The semantic ATON node holding all annotations
*/
XPFNetwork.getSemanticGroup = (i)=>{
    return XPFNetwork._gSem[i];
};

/**
Get semantic group for current (active) XPF
@returns {Node} - The semantic ATON node holding all annotations
*/
XPFNetwork.getCurrentSemanticGroup = ()=>{
    if (XPFNetwork._iCurr === undefined) return undefined;
    return XPFNetwork._gSem[XPFNetwork._iCurr];
};


// Caching helper functions
XPFNetwork._preloadBaseLayer = (i, onComplete)=>{
    if (XPFNetwork._txCache[i] !== undefined){
        return XPFNetwork._txCache[i];
    }

    let xpf = XPFNetwork._list[i];

    let pathbase = xpf._pathbaselayer;
    if (XPFNetwork._pathMod) pathbase = XPFNetwork._pathMod(pathbase);

    ATON.Utils.textureLoader.load(pathbase, (tex)=>{
        tex.encoding = ATON._stdEncoding;
        //tex.minFilter = THREE.NearestFilter;
        tex.generateMipmaps = true;

        XPFNetwork._txCache[i] = tex;
        //console.log("Preloaded XPF "+i);

        if (onComplete) onComplete(tex);
    });
};

XPFNetwork._clearTexCache = ()=>{
    if (XPFNetwork._iCurr === undefined) return;

    for (let i in XPFNetwork._txCache){
        if (XPFNetwork._txCache[i] && i !== XPFNetwork._iCurr){
            XPFNetwork._txCache[i].dispose();
            XPFNetwork._txCache[i] = undefined;
        }
    }
};

// TODO:
XPFNetwork._setBaseLayerTexture = (xpf, tex)=>{
    XPFNetwork._mat.map = tex;
    XPFNetwork._mat.needsUpdate = true;

    XPFNetwork._mesh.position.copy( xpf.getLocation() );
    XPFNetwork._mesh.rotation.set( xpf.getRotation().x, xpf.getRotation().y, xpf.getRotation().z );
};

/**
Update current XPF base layer (texture)
@param {function} onComplete - (optional) routine to be called on completion
*/
XPFNetwork.updateCurrentXPFbaseLayer = ( onComplete )=>{
    if (XPFNetwork._iCurr === undefined) return;

    let xpf = XPFNetwork._list[XPFNetwork._iCurr];
    if (xpf === undefined) return;

    let pathbase = xpf._pathbaselayer;
    if (XPFNetwork._pathMod) pathbase = XPFNetwork._pathMod(pathbase);

    // Video stream
    if (ATON.Utils.isVideo(pathbase)){
        if (XPFNetwork._elVid === undefined){
            let htvid = "<video id='idXPFVideo' loop crossOrigin='anonymous' playsinline style='display:none'>";          
            //if (path.endsWith("mp4")) htvid += "<source src='"+path+"' type='video/mp4'>"; // ; codecs='avc1.42E01E, mp4a.40.2'
            htvid += "<source src='"+pathbase+"'>";
            htvid += "</video>";

            $(htvid).appendTo('body');

            XPFNetwork._elVid = document.getElementById("idXPFVideo");

            XPFNetwork._elVid.onplaying = ()=>{
                console.log("XPF VideoPano playing");
                XPFNetwork._vidPlaying = true;
            };

            XPFNetwork._elVid.onpause = ()=>{
                console.log("XPF VideoPano paused");
                XPFNetwork._vidPlaying = false;
            };

            XPFNetwork._elVid.addEventListener('touchstart', function () {
                XPFNetwork._elVid.play();
            });

            // CHECK: tweak required for Apple
            enableInlineVideo(XPFNetwork._elVid);
        }

        let tex = new THREE.VideoTexture( XPFNetwork._elVid );
        tex.encoding = ATON._stdEncoding;

        XPFNetwork._mat.map = tex;
        XPFNetwork._mat.needsUpdate = true;
        XPFNetwork._uniforms.tBase.value = tex;

        XPFNetwork._mesh.position.copy( xpf.getLocation() );
        XPFNetwork._mesh.rotation.set( xpf.getRotation().x, xpf.getRotation().y, xpf.getRotation().z );

        if (onComplete) onComplete(tex);

        return;
    }

    // Static panorama
    ATON.Utils.textureLoader.load(pathbase, (tex)=>{
        tex.encoding = ATON._stdEncoding;
        //tex.minFilter = THREE.NearestFilter;
        tex.generateMipmaps = true;

        XPFNetwork._mat.map = tex;
        XPFNetwork._mat.needsUpdate = true;
        XPFNetwork._uniforms.tBase.value = tex;

        XPFNetwork._mesh.position.copy( xpf.getLocation() );
        XPFNetwork._mesh.rotation.set( xpf.getRotation().x, xpf.getRotation().y, xpf.getRotation().z );

        if (onComplete) onComplete(tex);
    });
};

XPFNetwork.playOrPauseXPFVideoStream = ()=>{
    if (XPFNetwork._elVid === undefined) return;

    if (!XPFNetwork._vidPlaying) XPFNetwork._elVid.play();
    else XPFNetwork._elVid.pause();

};

XPFNetwork.updateCurrentXPFsemLayer = ( xpf )=>{
    let i = XPFNetwork._list.indexOf(xpf);
    
    if (i < 0) return;
    if (i !== XPFNetwork._iCurr) return;

    XPFNetwork.loadSemanticMasksIfAny(XPFNetwork._iCurr);
};

XPFNetwork.setCurrentXPF = (i, onComplete)=>{
    //let xpf = XPFNetwork._list[i];
    //if (xpf === undefined) return;

    XPFNetwork.toggleSUI(i, false);

    XPFNetwork._iCurr = i;
    XPFNetwork._iNext = undefined;
    
    XPFNetwork._mesh.visible = true;

    XPFNetwork._gSem[i].show();

    XPFNetwork.updateCurrentXPFbaseLayer( onComplete );

    ATON.fireEvent("CurrentXPF", i);
    ATON.fireEvent("NextXPF", undefined);

/*
    // hit
    if (XPFNetwork._txCache[i]){
        //console.log("hit");
        XPFNetwork._setBaseLayerTexture(xpf, XPFNetwork._txCache[i]);
        if (onComplete) onComplete();
        return;
    }

    // load tex
    XPFNetwork._preloadBaseLayer(i, (tex)=>{
        //console.log("miss");
        XPFNetwork._setBaseLayerTexture(xpf, tex);
        if (onComplete) onComplete();
    });
*/

    // sem-masks
    XPFNetwork.loadSemanticMasksIfAny(i);
};

// Toggle SUI indicator for a given xpf index
XPFNetwork.toggleSUI = (i, b)=>{
    if (i === undefined) return;
    let xpf = XPFNetwork._list[i];

    if (xpf === undefined) return;
    xpf._lnode.toggleSUI(b);
};

XPFNetwork.loadSemanticMasksIfAny = (i)=>{
    let xpf = XPFNetwork._list[i];
    if (xpf === undefined) return;

    // Clear
    XPFNetwork._semIMGMasks = {};
    XPFNetwork._uniforms.tSemHint.value = 0;

    if (xpf._semHintURL !== undefined){
        XPFNetwork._uniforms.tSemHint.value = ATON.Utils.textureLoader.load( xpf._semHintURL );
    }

    for (let s in xpf._semMasksURLs){
        // We realize ctx if not there
        // Max allowed res for semantic masks is 2048 x 2048
        if (XPFNetwork._semCanvas === undefined){
            XPFNetwork._semCanvas = document.createElement('canvas');
            XPFNetwork._semCanvas.width  = 2048;
            XPFNetwork._semCanvas.height = 2048;

            XPFNetwork._semCTX = XPFNetwork._semCanvas.getContext('2d');
        }

        let semimgurl = xpf._semMasksURLs[s];
        let img = new Image();
        img.src = semimgurl;

        XPFNetwork._semIMGMasks[s] = img;
    }
};

/**
Get XPF by index
@param {number} i - XPF index
@returns {XPF}
*/
XPFNetwork.getXPFbyIndex = (i)=>{
    return XPFNetwork._list[i];
};

/**
Get current (active) XPF index
@returns {number}
*/
XPFNetwork.getCurrentXPFindex = ()=>{
    return XPFNetwork._iCurr;
};

/**
Get current (active) XPF
@returns {XPF}
*/
XPFNetwork.getCurrentXPF = ()=>{
    if (XPFNetwork._iCurr === undefined) return undefined;
    return XPFNetwork._list[XPFNetwork._iCurr];
};

/**
Get next XPF in sight index
@returns {number}
*/
XPFNetwork.getNextXPFindex = ()=>{
    return XPFNetwork._iNext;
};

/**
Get next XPF in sight
@returns {XPF}
*/
XPFNetwork.getNextXPF = ()=>{
    if (XPFNetwork._iNext === undefined) return undefined;
    return XPFNetwork._list[XPFNetwork._iNext];
};

/**
Get distance to XPF by index
@param {number} i - XPF index
@returns {number}
*/
XPFNetwork.getDistanceToXPFindex = (i)=>{
    if (i === undefined) return undefined;

    let xpf = XPFNetwork._list[i];
    if (xpf === undefined) return undefined;

    let E = ATON.Nav._currPOV.pos;
    let d = E.distanceTo( xpf.getLocation() );

    return d;
};

/**
Utility to show locomotion SUI (if any) only for a given XPF
@param {number} i - XPF index
*/
XPFNetwork.showSUIonlyForXPF = (i)=>{
    let len = XPFNetwork._list.length;
    if (len<1) return;

    for (let k=0; k<len; k++){
        let LN = XPFNetwork._list[k]._lnode;
        if (LN){
            if (k == i) LN.toggleSUI(true);
            else LN.toggleSUI(false);
        }
    }
};

/**
Request a transition to a given XPF by index
@param {number} i - The XPF index
@param {number} dur - transition duration (optional)
*/
XPFNetwork.requestTransitionByIndex = (i, dur)=>{
    let xpf = XPFNetwork._list[i];
    if (xpf === undefined) return;

    if (dur === undefined) dur = XPFNetwork.STD_XPF_TRANSITION_DURATION;
    if (ATON.XR._bPresenting) dur = 0.0;

    XPFNetwork.setCurrentXPF(i);
    ATON.Nav.requestTransitionToLocomotionNode( xpf.getLocomotionNode(), dur );

/*
    XPFNetwork.setCurrentXPF(i, ()=>{
        ATON.Nav.requestTransitionToLocomotionNode( xpf.getLocomotionNode(), dur );
    });
*/
};

/**
Request a viewpoint transition to a given target point, in the current XPF
@param {THREE.Vector3} p - The target location
@param {number} fov - field of view (optional)
@param {number} dur - transition duration in seconds (optional)
*/
XPFNetwork.requestTransitionToTarget = (p, fov, dur)=>{
    if (p === undefined) return;

    let P = new ATON.POV();
    P.setTarget(p);
    P.setPosition(ATON.Nav._currPOV.pos);
    if (fov) P.setFOV(fov);

    ATON.Nav.requestPOV(P, dur);
};

/**
Request a viewpoint transition to a given view direction, in the current XPF
@param {THREE.Vector3} d - The target direction
@param {number} fov - field of view (optional)
@param {number} dur - transition duration in seconds (optional)
*/
XPFNetwork.requestTransitionToDirection = (d, fov, dur)=>{
    if (d === undefined) return;

    let p = new THREE.Vector3();
    p.x = d.x + ATON.Nav._currPOV.pos.x;
    p.y = d.y + ATON.Nav._currPOV.pos.y;
    p.z = d.z + ATON.Nav._currPOV.pos.z;

    XPFNetwork.requestTransitionToTarget(p, fov, dur);
};

/**
Set a given XPF location as home (Nav module)
@param {number} i - The XPF index
*/
XPFNetwork.setHomeXPF = (i)=>{
    let xpf = XPFNetwork._list[i];
    if (xpf === undefined) return;

    let lnode = xpf.getLocomotionNode();

    let POV = new ATON.POV()
        .setPosition(lnode.pos)
        .setTarget(
            lnode.pos.x,
            lnode.pos.y, 
            lnode.pos.z + 1.0
        )
        //.setFOV(ATON.Nav._currPOV.fov);

    //console.log(POV)
    ATON.Nav.setHomePOV(POV);
};

// Image-based queries
//=====================================================

/**
Get semantic mask url given XPF index and semantic ID
@param {number} i - The XPF index
@param {string} semid - semantic ID
@returns {string}
*/
XPFNetwork.getSemanticMaskURLfromXPFindex = (i, semid)=>{
    let x = XPFNetwork._list[i];
    if (x === undefined) return undefined;

    return x.getSemanticMaskURL(semid);
};

/**
Get semantic mask url from current XPF given semantic ID
@param {string} semid - semantic ID
@returns {string}
*/
XPFNetwork.getSemanticMaskURLfromCurrentXPF = (semid)=>{
    if (XPFNetwork._iCurr === undefined) return undefined;

    return XPFNetwork.getSemanticMaskURLfromXPFindex(XPFNetwork._iCurr, semid);
};

/**
Set semantic color overlay
@param {THREE.Color} color - color
@param {number} opacity - (optional) opacity
*/
XPFNetwork.setSemanticColor = (color, opacity)=>{
    if (opacity === undefined) opacity = 0.15;
    XPFNetwork._uniforms.semHL.value = new THREE.Vector4(color.r,color.g,color.b, opacity);
};

/**
Set semantic color overlay opacity
@param {number} opacity
*/
XPFNetwork.setSemanticOpacity = (opacity)=>{
    if (opacity === undefined) opacity = 0.15;
    XPFNetwork._uniforms.semHL.value.w = opacity;
};

/**
Set semantic hint map opacity
@param {number} opacity
*/
XPFNetwork.setSemanticHintMapOpacity = (opacity)=>{
    if (opacity === undefined) opacity = 0.2;

    XPFNetwork._shOpacity = opacity;
    XPFNetwork._uniforms.shColor.value.w = opacity;
};

/**
Set semantic hint map color
@param {THREE.Color} color - color
@param {number} opacity - (optional) opacity
*/
XPFNetwork.setSemanticHintMapColor = (color, opacity)=>{
    if (color === undefined) return;

    XPFNetwork._shColor = color;
    XPFNetwork._uniforms.shColor.value.x = color.r;
    XPFNetwork._uniforms.shColor.value.y = color.g;
    XPFNetwork._uniforms.shColor.value.z = color.b;

    if (opacity === undefined) return;
    XPFNetwork.setSemanticHintMapOpacity(opacity);
};


// TODO:
/*
XPFNetwork.updateSemanticUnifiedIMG = ()=>{
    if (XPFNetwork._semCTX === undefined) return;

    let ctx = XPFNetwork._semCTX;

    for (let semid in XPFNetwork._semIMGMasks){
        let img = XPFNetwork._semIMGMasks[semid];
        ctx.drawImage(img, 0,0);

        for (let i=0; i<256; i++){
            for (let j=0; j<128; j++){

                let x = parseInt( img.width * (i/256.0) );
                let y = parseInt( img.height * (1.0 - (j/128.0)) );

                let col = ctx.getImageData(x,y, 1, 1).data;

                //XPFNetwork._semUnifData
            }
        }
    }

};
*/

XPFNetwork.querySemanticMasks = ()=>{
    if (XPFNetwork._semCTX === undefined) return;
    if (ATON._queryDataScene === undefined) return;
    if (ATON._queryDataScene.uv === undefined) return;

    let ctx = XPFNetwork._semCTX;
    let uv  = ATON._queryDataScene.uv;

    let ss = undefined;
    
    for (let semid in XPFNetwork._semIMGMasks){
        let img = XPFNetwork._semIMGMasks[semid];

        let x = parseInt( img.width * uv.x );
        let y = parseInt( img.height * (1.0 - uv.y) );
        //console.log(x,y)

        ctx.drawImage(img, 0,0);
        let col = ctx.getImageData(x,y, 1, 1).data;

        let k = col[0]; //Math.max( Math.max(col[0],col[1]), col[2] );

        if (k > 127){
            ss = semid;
            break;
        }
    }

    // No mask queried
    if (ss === undefined){
        if (XPFNetwork._semCurr !== undefined) ATON.fireEvent("SemanticMaskLeave", XPFNetwork._semCurr);
        XPFNetwork._semCurr = undefined;

        XPFNetwork._uniforms.tSem.value = 0;
        XPFNetwork._uniforms.shColor.value.w = XPFNetwork._shOpacity;

        XPFNetwork._mat.needsUpdate = true;
        return;
    }

    // We are querying a sem mask
    XPFNetwork.highlightSemanticMaskInCurrentXPF(ss);
    /*
    if (XPFNetwork._semCurr !== ss){
        let semurl = XPFNetwork.getSemanticMaskURLfromCurrentXPF(ss);
        XPFNetwork._uniforms.tSem.value = ATON.Utils.textureLoader.load( semurl );
        XPFNetwork._mat.needsUpdate = true;

        ATON.fireEvent("SemanticMaskHover", ss);

        XPFNetwork._uniforms.shColor.value.w = 0.0;

        if (XPFNetwork._semCurr !== undefined) ATON.fireEvent("SemanticMaskLeave", XPFNetwork._semCurr);
    }
*/
    XPFNetwork._semCurr = ss;
};

/**
Highlight a specific semantic mask in current XPF.
You should disable ATON queries via ATON.toggleQueries(false) to use this routine
@param {string} semid - Semantic mask ID
*/
XPFNetwork.highlightSemanticMaskInCurrentXPF = (semid)=>{
    if (semid === undefined) return;
    if (XPFNetwork._semCurr === semid) return;

    let semurl = XPFNetwork.getSemanticMaskURLfromCurrentXPF(semid);
    XPFNetwork._uniforms.tSem.value = ATON.Utils.textureLoader.load( semurl );
    XPFNetwork._mat.needsUpdate = true;

    ATON.fireEvent("SemanticMaskHover", semid);

    XPFNetwork._uniforms.shColor.value.w = 0.0;

    if (XPFNetwork._semCurr !== undefined) ATON.fireEvent("SemanticMaskLeave", XPFNetwork._semCurr);
};


// TODO: Sphera, OPK
XPFNetwork.loadFromPhotoscanFile = (configfileurl, onComplete)=>{
    if (configfileurl === undefined) return;

    configfileurl = ATON.Utils.resolveCollectionURL(configfileurl);
    let basefolder = ATON.Utils.getBaseFolder(configfileurl);

    let numParsed = 0;

    $.ajax({
        url : configfileurl,
        dataType: "text",
        success : function(data){
            data = data.split(/\r\n|\n/);

            for (let i in data){
                let line = data[i];
                if ( !line.startsWith("#") ){
                    let fields = line.split(/\s{2,}|\t/);

                    if (fields.length > 10){ // should be = 16
                        let xpf = new ATON.XPF();

                        let baselayer = basefolder + fields[0];
                        let x = parseFloat(fields[1]);
                        let y = parseFloat(fields[2]);
                        let z = parseFloat(fields[3]);

                        // Omega,Phi,Kappa to radians
                        let o = ATON.DEG2RAD * parseFloat(fields[4]);
                        let p = ATON.DEG2RAD * parseFloat(fields[5]);
                        let k = ATON.DEG2RAD * parseFloat(fields[6]);

                        //console.log(o,p,k)

                        xpf.setLocation(x,z,-y); // from Z-up to Y-up
                        xpf.setBaseLayer(baselayer);
                        //xpf.setRotation(0, -(Math.PI * 0.5), 0);
                        xpf.setRotation(0, -o, 0);

                        XPFNetwork.add(xpf);
                        numParsed++;
                    }
                }
            }

            console.log("Num panoramas parsed: "+numParsed);

            if (onComplete) onComplete();
        }
    });
};

export default XPFNetwork;