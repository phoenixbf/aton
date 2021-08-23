/*
    ATON Utils
    various utilities for device profiling, graph visiting, etc.

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
ATON Utils
@namespace Utils
*/
let Utils = {};

Utils.TSTRING_SEPARATOR = " ";


Utils.init = ()=>{
    // read-only object to inspect device capabilities
    ATON.device = {};

    //Utils.geomUnitSphere = new THREE.SphereBufferGeometry( 1.0, 16, 16 );
    Utils.geomUnitSphere = new THREE.SphereGeometry( 1.0, 16, 16 );

    // Export/Download utils
    Utils.exporterGLTF = undefined;
    Utils.exporterOBJ  = undefined;

    Utils._dlink = document.createElement('a');
    Utils._dlink.style.display = 'none';
    document.body.appendChild( Utils._dlink ); // Firefox workaround, see #6594

    Utils.textureLoader = new THREE.TextureLoader();
};

Utils.generateID = (prefix)=>{
    if (prefix === undefined) prefix = "id";
    //let currDate = new Date();
    //let ts = currDate.getYear()+":"+currDate.getMonth()+":"+currDate.getDay()+":"+currDate.getHours()+":"+currDate.getMinutes() +":"+ currDate.getSeconds();
    return prefix+'-' + Math.random().toString(36).substr(2,9);
};

Utils.goToURL = (url)=>{
    window.location.href = url;
};

/**
If current connection is secure
@returns {boolean}
*/
Utils.isConnectionSecure = ()=>{
    return window.isSecureContext;
}


// Profile device capabilities
Utils.profileDevice = ()=>{

    // Detect mobile
    ATON.device.isMobile = false;
    let detectMobile = ()=>{
        if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
        || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))){
            return true;
            }

        return false;
    };

    ATON.device.isMobile = detectMobile();

    // XR profiling
    ATON.device.xrSupported = {};
    ATON.device.xrSupported['immersive-vr'] = false;
    ATON.device.xrSupported['immersive-ar'] = false;

    if ( 'xr' in navigator ){
	    navigator.xr.isSessionSupported( 'immersive-vr' ).then(( b )=>{
            if (b) ATON.device.xrSupported['immersive-vr'] = true;
            else   ATON.device.xrSupported['immersive-vr'] = false;

            console.log("WebXR VR session support: "+ATON.device.xrSupported['immersive-vr']);
            ATON.fireEvent("XR_support", {type: 'immersive-vr', v: ATON.device.xrSupported['immersive-vr']});
		});

	    navigator.xr.isSessionSupported( 'immersive-ar' ).then(( b )=>{
            if (b) ATON.device.xrSupported['immersive-ar'] = true;
            else   ATON.device.xrSupported['immersive-ar'] = false;

            console.log("WebXR AR session support: "+ATON.device.xrSupported['immersive-ar']);
            ATON.fireEvent("XR_support", {type: 'immersive-ar', v: ATON.device.xrSupported['immersive-ar']});
		});
    }
};


Utils.profileRenderingCapabilities = ()=>{
    if (ATON._renderer === undefined) return;

    let rcc = ATON._renderer.capabilities;
    if (rcc === undefined) return;

    ATON.device.lowGPU = false;

    if (!rcc.isWebGL2) ATON.device.lowGPU = true;
    if (rcc.maxTextureSize < 8192) ATON.device.lowGPU = true;

    console.log(rcc);
};

/**
If current device is mobile (e.g. smartphone, tablet, Oculus Quest)
@returns {boolean}
*/
Utils.isMobile = ()=>{
    return ATON.device.isMobile;
}

/**
If current device supports WebXR immersive VR sessions
@returns {boolean}
*/
Utils.isVRsupported = ()=>{
    return ATON.device.xrSupported['immersive-vr'];
}

/**
If current device supports WebXR immersive AR sessions
@returns {boolean}
*/
Utils.isARsupported = ()=>{
    return ATON.device.xrSupported['immersive-ar'];
}


// Path utils
Utils.getFileExtension = ( filepath )=>{
	return filepath.substr(filepath.lastIndexOf('.')+1).toLowerCase();
};

Utils.removeFileExtension = ( filepath )=>{
    return filepath.replace(/\.[^/.]+$/, "");
};

Utils.isVideo = ( filepath )=>{
    let ext = Utils.getFileExtension(filepath);

    if (ext === "mp4")  return true;
    if (ext === "webm") return true;
};

Utils.getBaseFolder = ( filepath )=>{
    var index = filepath.lastIndexOf('/');
    if (index !== -1) return filepath.substring( 0, index + 1 );
    
    return '';
};

Utils.isResourceURL = (s)=>{
    if (s.startsWith("http://"))  return true;
    if (s.startsWith("https://")) return true;
    return false;
};

Utils.URLify =(string)=>{
    const urls = string.match(/(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)/g);
    if (urls){
        urls.forEach(function(url){
            string = string.replace(url, '<a target="_blank" href="' + url + '">' + url + "</a>");
        });
    }

    return string;
};

Utils.resolveCollectionURL = (url)=>{
    if (url.startsWith("http")) return url;
    
    return ATON.PATH_COLLECTION+url;
};

// JSON post utility
Utils.postJSON = (endpoint, obj, onReceive, onFail)=>{
    $.ajax({
        url: endpoint,
        type:"POST",
        xhrFields: { withCredentials: true },
        data: JSON.stringify(obj),
        contentType:"application/json; charset=utf-8",
        dataType:"json",

        success: (data)=>{
            if (onReceive) onReceive(data);
        }
    }).fail((err)=>{
        console.log(err);
        if (onFail) onFail();
    });
};


Utils.mergeObject = ( object )=>{
    object.updateMatrixWorld( true );

    const geometry = [];
    object.traverse( c => {
        if ( c.isMesh ){
            const g = c.geometry;
            g.applyMatrix4( c.matrixWorld );
            geometry.push( g.toNonIndexed() );
        }

    });

    const mergedGeometries = THREE.BufferGeometryUtils.mergeBufferGeometries( geometry, false );
    const mergedGeometry   = THREE.BufferGeometryUtils.mergeVertices( mergedGeometries ).center();

    const group = new THREE.Group();
    const mesh = new THREE.Mesh( mergedGeometry );
    group.add( mesh );
    return group;
};

Utils.setPicking = (node, type, b)=>{
    if (b === undefined) b = true;

    //console.log(b);
    
    node.traverse((o) => {
        if (b) o.layers.enable(type);
        else o.layers.disable(type);
    });

    // children
/*
    for (let c in node.children){
        let C = node.children[c];
        Utils.setPicking(C, type, b);
    }
*/
};

Utils.graphPostVisitor = (N)=>{
    //if (N.type === undefined) return;

    if (!N.visible){
        Utils.setPicking(N, N.type, false);
        return;
    }
/*
    for (let c in N.children){
        let C = N.children[c];
        Utils.graphPostVisitor(C);
    }
*/
    console.log(N);
};

// TileSets utils
Utils.updateTSetsCamera = (cam)=>{
    if (cam === undefined) cam = ATON.Nav._camera;

    const nts = ATON._tsets.length;
    if (nts <= 0) return;

/*
    // Immersive VR mode
    if (ATON.XR._bPresenting){
        //console.log(ATON._tsets)

        for (let ts=0; ts<nts; ts++){
            const TS = ATON._tsets[ts];

            // remove all cameras so we can use the VR camera instead
            TS.cameras.forEach( c => TS.deleteCamera( cam ) );

            let currCamera = ATON._renderer.xr.getCamera(); // cam
            if (currCamera){
                TS.setCamera( currCamera );

                TS.setResolution( currCamera, 8000, 8000 );

                let leftCam = currCamera.cameras[0];
                if ( leftCam ){
                    //TS.setResolution( currCamera, leftCam.viewport.z, leftCam.viewport.w );
                    //console.log(leftCam);
                }
            }
        }

        return;
    }
*/

    for (let ts=0; ts<nts; ts++){
        const TS = ATON._tsets[ts];   

        //console.log(TS.cameras);
        for (let c in TS.cameras) TS.deleteCamera( TS.cameras[c] );

        TS.setCamera( cam );

        //TS.setResolutionFromRenderer( cam, ATON._renderer );
        TS.setResolution( cam, 200, 200 );
    }
};

Utils.loadTileSet = (tsurl, N)=>{

    let ts = new TILES.TilesRenderer(tsurl);
    if (!ts) return;

    //ATON._assetReqNew(tsurl);

    ts.fetchOptions.mode = 'cors';

    ts.setCamera( ATON.Nav._camera );
    ts.setResolutionFromRenderer( ATON.Nav._camera, ATON._renderer );

    //ts.errorTarget = ;

    let bFirst = false;

    //ATON._assetReqComplete(tsurl);

    ts.onLoadModel = ( scene )=>{
        //Utils.modelVisitor( N, scene );
        //ATON._onAllReqsCompleted();

        if (!bFirst){
            ///ATON._assetReqComplete(tsurl);
            ATON._onAllReqsCompleted();
            bFirst = true;
        }

        scene.traverse( c => {
            //c.layers.enable(N.type);

            if (c.isMesh){
                c.castShadow    = true; //N.castShadow;
                c.receiveShadow = true; //N.receiveShadow;
            }

            if ( c.material ) {
                //c.originalMaterial = c.material;
                //c.material = wireMat;
                if (N.userData.cMat) c.material = N.userData.cMat;

                if (c.material.map){
                    c.material.map.minFilter = THREE.LinearMipmapLinearFilter;
                    c.material.map.magFilter = THREE.LinearFilter;
                }
            }
        });

    };

    ts.onDisposeModel = (scene)=>{
        scene.traverse( c => {
            if ( c.isMesh ) {
                c.material.dispose();
            }
        });
    };

    N.add(ts.group);

    Utils.setPicking(N, N.type, true);

    //console.log(ts);

    ATON._tsets.push(ts);
};

// Helper visitor routine
// Note: N (parent node) is not yet connected to model
Utils.modelVisitor = (N, model)=>{
    if (model===undefined) return this;
    if (N===undefined) return this;

    //model = Utils.mergeObject(model);
    
    //let N = parentNode;
    let type = N.type; // Differentiate visit depending on node type

    model.traverse( ( o ) => {
/*
        if (N.bPickable !== undefined){
            if (N.bPickable) o.layers.enable(type);
            else o.layers.disable(type);
            //Utils.setPicking(N, type, N.bPickable);
        }
        //else o.layers.enable(type); //Utils.setPicking(N, type, true);
*/

        //Utils.setPicking(model, type, N.bPickable);
        //if (!N.visible) Utils.setPicking(model, type, false);

        // perf.
        // TODO: manually call object.updateMatrix()
        //o.matrixAutoUpdate = false;

        if (o.isMesh){
            //let numVertices = o.geometry.attributes.position.count;
            //console.log(numVertices);

            if (type === ATON.NTYPES.SCENE){
                // TODO: 
                o.castShadow    = true; //N.castShadow;
                o.receiveShadow = true; //N.receiveShadow;

                // Build accelerated ray casting
                if (o.geometry){
                    o.geometry.computeBoundsTree();
                    console.log("Computed visible BVH");

                    // visualize BVH bounds
/*
                    let BVHVis = new ThreeMeshBVH.MeshBVHVisualizer(o, 10);
                    BVHVis.update();
                    o.parent.add(BVHVis);
*/
                }

                // Fix mipmapping

                if ( o.material.map !== null){
                    //console.log(object.material.map);
                    
                    // Why do I have to do this?
                    o.material.map.generateMipmaps = true;
                    o.material.map.anisotropy = ATON.device.isMobile? 0 : ATON._maxAnisotropy;
                    o.material.map.minFilter  = THREE.LinearMipmapLinearFilter;
                    o.material.map.magFilter  = THREE.LinearFilter;
                    //o.material.map.needsUpdate = true;
                }
            }

            if (type === ATON.NTYPES.SEM){
                o.material = ATON.MatHub.materials.semanticShape;

                // Build accelerated ray casting
                if (o.geometry){
                    o.geometry.computeBoundsTree();
                    console.log("Computed semantic BVH");
                }

                //N.setDefaultAndHighlightMaterials(ATON.MatHub.materials.semanticShape, ATON.MatHub.materials.semanticShapeHL);
            }

            // Cascading material
            if (N.userData.cMat){
                o.material = N.userData.cMat;
                //o.material.needsUpdate = true;
            }

        }
/*
        if (N.userData.cMat){
            o.material = N.userData.cMat;
            //o.cMat = N.userData.cMat;
            //o.material.needsUpdate = true;
        }
*/
    });

    //Utils.setPicking(N, type, N.bPickable);

/*
    for (let c in model.children){
        let C = model.children[c];
        Utils.modelVisitor(model, C);
    }
*/
};

Utils.registerAniMixers = (N, data)=>{
    let model = data.scene || data.scene[0];
    let bAnimations = false;

    if (data.animations === undefined) return;

    let mixer = new THREE.AnimationMixer( model );
    data.animations.forEach((clip)=>{
        mixer.clipAction( clip ).play();
        //console.log(mixer.clipAction( clip ));
        //console.log(N);
        bAnimations = true;
    });

    if (!bAnimations) return;

    ATON._aniMixers.push(mixer);

    if (N._aniMixers === undefined) N._aniMixers = [];
    N._aniMixers.push(mixer);
};

// Copyright extraction
Utils.ccExtract = (data)=>{
    if (data === undefined) return;
    if (data.asset === undefined) return;

    let cc = {};

    if (data.asset.copyright) cc.copyright = data.asset.copyright;
    if (data.asset.extras){
        for (let e in data.asset.extras) cc[e] = data.asset.extras[e];
    }
    if (data.asset.generator) cc.generator = data.asset.generator;

    if (data.asset.copyright || data.asset.extras) ATON._ccModels.push(cc);
    
    console.log(cc);
};

Utils.parseTransformString = (tstr)=>{
    let T = new THREE.Group();

    let values = tstr.split(Utils.TSTRING_SEPARATOR);
    let numValues = values.length;

    if (numValues < 3) return T; // nothing to do

    // Translation
    T.position.set( parseFloat(values[0]), parseFloat(values[1]), parseFloat(values[2]) );
    if (numValues < 6) return T;

    // Rotation
    T.rotation.set( parseFloat(values[3]), parseFloat(values[4]), parseFloat(values[5]) );
    if (numValues < 9) return T;

    // Scale
    T.scale.set( parseFloat(values[6]), parseFloat(values[7]), parseFloat(values[8]) );
    return T;
};

Utils.setVectorPrecision = (v, prec)=>{
    v.x = parseFloat( v.x.toPrecision(prec) );
    v.y = parseFloat( v.y.toPrecision(prec) );
    v.z = parseFloat( v.z.toPrecision(prec) );
    
    return v;
};

// Parse markdown (md) content
// readapted from https://codepen.io/kvendrik/pen/Gmefv
Utils.parseMD = (md)=>{
    //ul
    md = md.replace(/^\s*\n\*/gm, '<ul>\n*');
    md = md.replace(/^(\*.+)\s*\n([^\*])/gm, '$1\n</ul>\n\n$2');
    md = md.replace(/^\*(.+)/gm, '<li>$1</li>');

    //ol
    md = md.replace(/^\s*\n\d\./gm, '<ol>\n1.');
    md = md.replace(/^(\d\..+)\s*\n([^\d\.])/gm, '$1\n</ol>\n\n$2');
    md = md.replace(/^\d\.(.+)/gm, '<li>$1</li>');

    //blockquote
    md = md.replace(/^\>(.+)/gm, '<blockquote>$1</blockquote>');

    //h
    md = md.replace(/[\#]{6}(.+)/g, '<h6>$1</h6>');
    md = md.replace(/[\#]{5}(.+)/g, '<h5>$1</h5>');
    md = md.replace(/[\#]{4}(.+)/g, '<h4>$1</h4>');
    md = md.replace(/[\#]{3}(.+)/g, '<h3>$1</h3>');
    md = md.replace(/[\#]{2}(.+)/g, '<h2>$1</h2>');
    md = md.replace(/[\#]{1}(.+)/g, '<h1>$1</h1>');

    //alt h
    md = md.replace(/^(.+)\n\=+/gm, '<h1>$1</h1>');
    md = md.replace(/^(.+)\n\-+/gm, '<h2>$1</h2>');

    //images
    md = md.replace(/\!\[([^\]]+)\]\(([^\)]+)\)/g, '<img src="$2" alt="$1" />');

    //links
    md = md.replace(/[\[]{1}([^\]]+)[\]]{1}[\(]{1}([^\)\"]+)(\"(.+)\")?[\)]{1}/g, '<a href="$2" title="$4">$1</a>');

    //font styles
    md = md.replace(/[\*\_]{2}([^\*\_]+)[\*\_]{2}/g, '<b>$1</b>');
    md = md.replace(/[\*\_]{1}([^\*\_]+)[\*\_]{1}/g, '<i>$1</i>');
    md = md.replace(/[\~]{2}([^\~]+)[\~]{2}/g, '<del>$1</del>');

    //pre
    md = md.replace(/^\s*\n\`\`\`(([^\s]+))?/gm, '<pre class="$2">');
    md = md.replace(/^\`\`\`\s*\n/gm, '</pre>\n\n');

    //code
    md = md.replace(/[\`]{1}([^\`]+)[\`]{1}/g, '<code>$1</code>');

    //p
    md = md.replace(/^\s*(\n)?(.+)/gm, function(m){
    return  /\<(\/)?(h\d|ul|ol|li|blockquote|pre|img)/.test(m) ? m : '<p>'+m+'</p>';
    });

    //strip p from pre
    md = md.replace(/(\<pre.+\>)\s*\n\<p\>(.+)\<\/p\>/gm, '$1$2');

    return md;
}

// User auth
Utils.checkAuth = (onReceive)=>{
    $.ajax({
        type: 'GET',
        url: ATON.PATH_RESTAPI+"user",
        xhrFields: { withCredentials: true },            
        dataType: 'json',

        success: (data)=>{ onReceive(data); }
        //error: ()=>{ onReceive(undefined) }
    });
};


/**
Get human-readable length (distances, measures, etc...)
@param {number} d - the distance
@returns {string}
*/
Utils.getHumanReadableDistance = (d)=>{
    let mstr = " m";

    if (d < 0.01){
        d *= 1000.0; mstr= " mm";
        mstr = d.toPrecision(3) + mstr;
        return mstr;
    }
    if (d < 1.0){
        d *= 100.0; mstr= " cm";
        mstr = d.toPrecision(3) + mstr;
        return mstr;
    }
    if (d > 1000.0){
        d * 0.001; mstr=" km";
        mstr = d.toPrecision(3) + mstr;
        return mstr;
    }

    mstr = d.toPrecision(3) + mstr;
    return mstr;
};

// Extract clean text from HTML
Utils.stripHTMLtagsFromString = (str)=>{
    str = str.replace(/(<([^>]+)>)/gi, "");
    return str;
};

// Fullscreen (NOT USED)
Utils.requestFullscreen = ()=>{
    let elem = document.documentElement;

    if (elem.requestFullscreen) elem.requestFullscreen();

    else if (elem.mozRequestFullScreen){ // Firefox
        elem.mozRequestFullScreen();
    }
    else if (elem.webkitRequestFullscreen){ // Chrome, Safari & Opera
        elem.webkitRequestFullscreen();
    }
    else if (elem.msRequestFullscreen){ // IE/Edge
        elem.msRequestFullscreen();
    }
    return true;
};


// Export routines
Utils.downloadBlob = (blob, filename)=>{
    if (filename === undefined) return;

    Utils._dlink.href = URL.createObjectURL( blob );
    Utils._dlink.download = filename;
    Utils._dlink.click();
};

// Download text ASCII data
Utils.downloadText = ( str, filename )=>{
    Utils.downloadBlob( new Blob( [ str ], { type: 'text/plain' } ), filename );
};

// Download json object
Utils.downloadJSONobj = (jsonobj, filename)=>{
    Utils.downloadText( JSON.stringify(jsonobj), filename );
};

Utils.downloadArrayBuffer = ( buffer, filename )=>{
    Utils.downloadBlob( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename );
};

// Export ATON node
Utils.exportNode = (node, filename)=>{
    let ext = Utils.getFileExtension(filename);
    if (ext.length < 1) return;

    // GLTF
    if (ext === "glb" || ext === "gltf"){
        let bBin = (ext === "glb")? true : false;

        let opts = {
            //trs: true, // Export position, rotation and scale instead of matrix per node. Default is false
            binary: bBin, // Export in binary (.glb) format, returning an ArrayBuffer. Default is false
            //onlyVisible: false,
            //truncateDrawRange: true
        };

        if (Utils.exporterGLTF === undefined) Utils.exporterGLTF = new THREE.GLTFExporter();

        Utils.exporterGLTF.parse( node, ( output )=>{
            if ( output instanceof ArrayBuffer ){
                Utils.downloadArrayBuffer( output, filename);
            }
            else {
                console.log( output );
                Utils.downloadJSONobj(output, filename);
            }
        }, opts);
    }

    // OBJ format
    if (ext === "obj"){
        if (Utils.exporterOBJ === undefined) Utils.exporterOBJ = new THREE.OBJExporter();

        let output = Utils.exporterOBJ.parse(node);
        //console.log(output);
        Utils.downloadText(output, filename);
    }
};

Utils.takeScreenshot = (size, filename)=>{
    let img = new Image();

    console.log("Screenshot with size:"+size);

    ATON.Nav._camera.aspect = 1.0;
    ATON.Nav._camera.updateProjectionMatrix();
    
    ATON._renderer.setSize(size,size);
    ATON._renderer.render( ATON._mainRoot, ATON.Nav._camera );
    let elDom = ATON._renderer.domElement;

    // We have multi-pass FX composer enabled
    if (ATON.FX.composer){
        ATON.FX.composer.setSize(size,size);
        let UU = ATON.FX.passes[ATON.FX.PASS_AA].material.uniforms;
        if (UU) UU.resolution.value.set( (1/size), (1/size) );

        ATON.FX.composer.render();

        elDom = ATON.FX.composer.renderer.domElement;
    }

    let b64img = ATON._renderer.domElement.toDataURL();
    img.src = b64img;

    if (filename){
        Utils._dlink.href = b64img.replace("image/png", "image/octet-stream");
        Utils._dlink.download = filename;
        Utils._dlink.click();
    }

    ATON._onResize();
    return img;
};

Utils.assignLightProbeToMesh = (LP, mesh)=>{
    if (LP === undefined || mesh === undefined) return;

    if (mesh.noLP) return;

    mesh.userData.LP = LP;
    //LP.update();
    //mesh.material.envMap = LP.getEnvTex();
    
    //mesh.material.combine = THREE.MultiplyOperation;
    //mesh.material.needsUpdate = true;

    //console.log(mesh.userData);
};

Utils.createATONCube = (id)=>{
    let g = new THREE.BoxBufferGeometry( 1,1,1 );

    let mat = new THREE.MeshStandardMaterial();

    Utils.textureLoader.load((ATON.PATH_RES+"models/aton-cube.jpg"), (tex)=>{
        tex.encoding = THREE.sRGBEncoding;
        mat.map = tex;
    });

    let N = ATON.createSceneNode(id);
    N.add( new THREE.Mesh(g) );
    N.setMaterial(mat);

    N.enablePicking();
    return N;
};


Utils.createATONCubePBR = (id)=>{
    let g = new THREE.BoxBufferGeometry( 1,1,1 );

    let mat = new THREE.MeshStandardMaterial();
    mat.metalness = 1.0;

    Utils.textureLoader.load((ATON.PATH_RES+"models/aton-cube.jpg"), (tex)=>{
        tex.encoding = THREE.sRGBEncoding;
        mat.map = tex;
    });

    Utils.textureLoader.load((ATON.PATH_RES+"models/aton-cube-pbr.jpg"), (tex)=>{
        tex.encoding = THREE.sRGBEncoding;
        mat.metalnessMap = tex;
        mat.roughnessMap = tex;
    });

    Utils.textureLoader.load((ATON.PATH_RES+"models/aton-cube-nrm.png"), (tex)=>{
        tex.encoding = THREE.sRGBEncoding;
        mat.normalMap = tex;

        //mat.bumpMap.anisotropy = ATON._maxAnisotropy;
        //mat.bumpMap.minFilter  = THREE.LinearMipmapLinearFilter;
        //mat.bumpMap.magFilter  = THREE.LinearFilter;
    });

    let N = ATON.createSceneNode(id);
    N.add( new THREE.Mesh(g) );
    N.setMaterial(mat);

    N.enablePicking();
    return N;
};


Utils.createGround = (texture, dx,dz)=>{
    if (dx === undefined) dx = 1.0;
    if (dz === undefined) dz = 1.0;

    let g = new THREE.PlaneBufferGeometry( dx, dz );

    let mat = new THREE.MeshStandardMaterial();
    if (texture !== undefined) Utils.textureLoader.load(texture, (tex)=>{
        tex.encoding = THREE.sRGBEncoding;
        mat.map = tex;
    });

    let N = ATON.createSceneNode().rotateX(-Math.PI * 0.5);
    N.add( new THREE.Mesh(g, mat) );
    N.enablePicking();

    return N;
};


export default Utils;