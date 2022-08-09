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

    MatHub._loader = new THREE.MaterialLoader();

    // Uniforms
    MatHub._uSem = {
        time: { type:'float', value: 0.0 },
        tint: { type:'vec4', value: new THREE.Vector4(0.2,0.2,1.0, 0.2) }
    };

    MatHub.addDefaults();
};

MatHub.getDefVertexShader = ()=>{
    return `
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
    `;
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

    MatHub.colors.defUI  = new THREE.Color(0.85,1,0.95); // 0,1,0.5
    
    MatHub.colors.sem     = new THREE.Color(0,1,0.5);
    MatHub.colors.darksem = new THREE.Color(0,0,0.1);

    // Materials
    MatHub.materials.fullyTransparent = new THREE.MeshBasicMaterial({ 
        transparent: true, 
        depthWrite: false, 
        opacity: 0.0
    });

    // Default UI
    MatHub.materials.defUI = new THREE.ShaderMaterial({
        uniforms: {
            tint: { type:'vec3', value: MatHub.colors.defUI },
            //base: { type:'vec3', value: MatHub.colors.defUI },
            opacity: { type:'float', value: 0.0 }
        },

        vertexShader: MatHub.getDefVertexShader(),
        fragmentShader:`
            varying vec3 vPositionW;
		    varying vec3 vNormalW;
            varying vec3 vNormalV;
            uniform vec3 tint;
            //uniform vec3 base;
            uniform float opacity;

		    void main(){
		        //vec3 viewDirectionW = normalize(cameraPosition - vPositionW);

                float f;
		        //f = dot(vNormalV, viewDirectionW);
                f = dot(vNormalV, vec3(0,0,1));
		        f = clamp(1.0-f, 0.0, 1.0);
                f *= f;

                f = mix(opacity,1.0, f);

                //vec3 col = mix(base,tint, f);
		        //gl_FragColor = vec4(col, f * opacity);

                gl_FragColor = vec4(tint, f);
		    }
        `,
        transparent: true,
        depthWrite: false,
    }); 
    
    // Selector
    MatHub.materials.selector = MatHub.materials.defUI.clone();
/*
    MatHub.materials.selector = new THREE.MeshBasicMaterial({
        color: MatHub.colors.defUI,
        transparent: true,
        depthWrite: false,
        opacity: 0.2, 
        //depthTest: false
        //flatShading: true
    });
*/
    MatHub.materials.outline = new THREE.MeshBasicMaterial({
        color: MatHub.colors.black,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        opacity: 0.2
    });

/*
    MatHub.materials.selector = new THREE.MeshBasicMaterial({
        color: MatHub.colors.green,
        transparent: true,
        depthWrite: false,
        opacity: 0.2 
        //flatShading: true
    });
*/
    // Controller XR ray
    MatHub.materials.controllerRay = MatHub.materials.defUI.clone();
    MatHub.materials.controllerRay.uniforms.tint.value = MatHub.colors.white;
/*
    MatHub.materials.controllerRay = new THREE.MeshBasicMaterial({ 
        color: MatHub.colors.white, 
        transparent: true, 
        opacity: 0.2,
        depthWrite: false
        //flatShading: true
    });
*/

    // X-ray
    MatHub.materials.xray = MatHub.materials.defUI.clone();
    MatHub.materials.xray.uniforms.tint.value    = MatHub.colors.white;
    MatHub.materials.xray.uniforms.opacity.value = 0.5;
    //MatHub.materials.xray.side = THREE.DoubleSide;

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
/*
    MatHub.materials.semanticShape = new THREE.MeshBasicMaterial({ 
        //color: MatHub.colors.white, 
        transparent: true,
        depthWrite: false, 
        opacity: 0.0,
        //flatShading: true
    });
*/

    MatHub.materials.semanticShape = new THREE.ShaderMaterial({
        uniforms: MatHub._uSem,

        vertexShader: MatHub.getDefVertexShader(),
        fragmentShader:`
            varying vec3 vPositionW;
		    varying vec3 vNormalW;
            varying vec3 vNormalV;

            uniform float time;
            uniform vec4 tint;

		    void main(){
		        //vec3 viewDirectionW = normalize(cameraPosition - vPositionW);

                //float ff = dot(vNormalV, vec3(0,0,1));
		        //ff = clamp(1.0-ff, 0.0, 1.0);

                float f = (1.0 * cos(time*2.0)); // - 0.5;
                //f = cos(time + (vPositionW.y*10.0));
                f = clamp(f, 0.0,1.0);

		        gl_FragColor = vec4(tint.rgb, tint.a * f);
                //gl_FragColor = vec4(tint.rgb, ff);
		    }
        `,
        transparent: true,
        depthWrite: false,
        //flatShading: false
        //opacity: 0.0,
    });

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
/*
    MatHub.materials.semanticPoint = new THREE.PointsMaterial({
        size: 35,
        color: MatHub.colors.orange,
        sizeAttenuation: false,
        map: new THREE.TextureLoader().load( ATON.PATH_RES+"sui-point.png" ),
        //alphaTest: 0.5, 
        transparent: true,
        depthTest: false
    });
*/

    MatHub.materials.transWhite = new THREE.MeshBasicMaterial({ 
        color: MatHub.colors.white, 
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        opacity: 0.2
        //flatShading: true
    });
    MatHub.materials.transBlack = new THREE.MeshBasicMaterial({ 
        color: MatHub.colors.black, 
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        opacity: 0.2
        //flatShading: true
    });
    MatHub.materials.wireframe = new THREE.MeshBasicMaterial({ 
        color: MatHub.colors.black, 
        transparent: true,
        depthWrite: false,
        opacity: 0.1,
        wireframe: true
        //flatShading: true
    });

    MatHub.materials.normSlope= new THREE.ShaderMaterial({ 
        vertexShader: MatHub.getDefVertexShader(),
        fragmentShader:`
            varying vec3 vPositionW;
		    varying vec3 vNormalW;

		    void main(){
                vec4 A = vec4(0,1,0, 1.0);
                vec4 B = vec4(1,0,0, 1.0);

                float f;
                f = dot(vNormalW, vec3(0,1,0));

		        gl_FragColor = mix(B,A, f);
		    }
        `
    });

    MatHub.materials.lp = new THREE.ShaderMaterial({ 
        vertexShader: MatHub.getDefVertexShader(),
        fragmentShader:`
            varying vec3 vPositionW;
		    varying vec3 vNormalW;
            varying vec3 vNormalV;

		    void main(){
		        vec3 viewDirectionW = normalize(cameraPosition - vPositionW);

                float f;
		        //f = dot(viewDirectionW, vNormalW);
                f = dot(vNormalV, vec3(0,0,1));
		        f = clamp(1.0 - f, 0.0, 1.0);

		        gl_FragColor = vec4(1.0,1.0,1.0, f);
		    }
        `,
        transparent: true,
        depthWrite: false,
        //flatShading: false
    });

/*
    let texPoint = new THREE.TextureLoader().load( ATON.PATH_RES+"point-mask.png");
    texPoint.generateMipmaps = false;
    //texPoint.premultiplyAlpha = true;
    texPoint.magFilter = THREE.NearestFilter;
    texPoint.minFilter = THREE.NearestFilter;
    texPoint.alphaTest = 0.9;
*/
    MatHub.materials.point = new THREE.PointsMaterial({
        vertexColors: true,
        
        //alphaMap: texPoint,
        
        depthTest: true,
        transparent: false,

        //transparent: true,
        //depthWrite: false, 
        //opacity: 0.3,

        //size: 2.0,
        //sizeAttenuation: false,

        size: 0.005,
        sizeAttenuation: true
    });

    MatHub.materials.chromakey = new THREE.ShaderMaterial({
        uniforms: {
            tBase: { type:'t' /*, value: 0*/ },
            keycolor: { type:'vec4', value: new THREE.Vector4(0,1,0, 0.0) },
            similarity: { type:'float', value: 0.4 },
            smoothness: { type:'float', value: 0.08 },
            spill: { type:'float', value: 0.1 }
        },
        vertexShader: MatHub.getDefVertexShader(),
        fragmentShader:`
            uniform sampler2D tBase;
            uniform vec4 keycolor;

            uniform float similarity;
            uniform float smoothness;
            uniform float spill;

            varying vec2 vUv;

            // From https://github.com/libretro/glsl-shaders/blob/master/nnedi3/shaders/rgb-to-yuv.glsl
            vec2 RGBtoUV(vec3 rgb){
                return vec2(
                    rgb.r * -0.169 + rgb.g * -0.331 + rgb.b *  0.5    + 0.5,
                    rgb.r *  0.5   + rgb.g * -0.419 + rgb.b * -0.081  + 0.5
                );
            }

            // From https://godotshaders.com/shader/green-screen-chromakey/
		    void main(){
		        vec4 frag = texture2D(tBase, vUv);
                vec4 orig = frag;

                float chromaDist = distance(RGBtoUV(frag.rgb), RGBtoUV(keycolor.rgb));

                float baseMask = chromaDist - similarity;
                float fullMask = pow(clamp(baseMask / smoothness, 0.0,1.0), 1.5);
                frag.a         = fullMask;
              
                float spillVal = pow(clamp(baseMask / spill, 0.0,1.0), 1.5);
                float desat    = clamp(frag.r * 0.2126 + frag.g * 0.7152 + frag.b * 0.0722, 0.0,1.0);
                frag.rgb       = mix(vec3(desat, desat, desat), frag.rgb, spillVal);

                frag = mix(orig,frag, keycolor.w);

		        gl_FragColor = frag;
		    }
        `,

        transparent: true,
        side: THREE.DoubleSide
    });

};

//MatHub.getOrCreateSpriteSem

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

MatHub.update = ()=>{
    MatHub._uSem.time.value += ATON._dt;
};

export default MatHub;