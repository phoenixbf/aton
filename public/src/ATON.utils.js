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


Utils.init = ()=>{
    // read-only object to inspect device capabilities
    ATON.device = {};

    Utils.geomUnitSphere = new THREE.SphereBufferGeometry( 1.0, 16, 16 );

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

    // XR
    ATON.device.isXRsupported = false;
    if ( 'xr' in navigator ){
	    navigator.xr.isSessionSupported( 'immersive-vr' ).then( function ( b ){
            if (b){
                ATON.device.isXRsupported = true;
                console.log("WebXR supported");
                }
            else {
                ATON.device.isXRsupported = false;
                console.log("WebXR NOT supported");
                }
		});
    }
};

/**
If current device is mobile (e.g. smartphone, tablet, Oculus Quest)
@returns {boolean}
*/
Utils.isMobile = ()=>{
    return ATON.device.isMobile;
}

/**
If current device supports WebXR
@returns {boolean}
*/
Utils.isWebXRsupported = ()=>{
    return ATON.device.isXRsupported;
}


// Path utils
Utils.getFileExtension = ( filepath )=>{
	return filepath.substr(filepath.lastIndexOf('.')+1).toLowerCase();
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

// Helper visitor routine
Utils.modelVisitor = (parentNode, model)=>{
    if (!model) return this;

    //model = Utils.mergeObject(model);
    
    let N = parentNode;
    let type = N.type; // Differentiate visit depending on node type

    model.traverse( ( o ) => {

        if (N.bPickable !== undefined){
            if (N.bPickable) o.layers.enable(type);
            else o.layers.disable(type);
        }

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
                    console.log("Computed BVH");
                }

                // Ensure mipmapping is correct
                if ( o.material.map !== null){
                    //console.log(object.material.map);
                    
                    // Why do I have to do this?
                    //o.material.map.generateMipmaps = false;
                    o.material.map.anisotropy = ATON._maxAnisotropy;
                    o.material.map.minFilter  = THREE.LinearMipmapLinearFilter;
                    o.material.map.magFilter  = THREE.LinearFilter;
                    //o.material.map.needsUpdate = true;
                }
            }

            if (type === ATON.NTYPES.SEM){
                o.material = ATON.MatHub.materials.semanticShape;
            }

            // Cascading material
            if (N.userData.cMat){
                o.material = N.userData.cMat;
                //o.material.needsUpdate = true;
            }
        }
    });
};

Utils.setVectorPrecision = (v, prec)=>{
    v.x = parseFloat( v.x.toPrecision(prec) );
    v.y = parseFloat( v.y.toPrecision(prec) );
    v.z = parseFloat( v.z.toPrecision(prec) );
    
    return v;
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