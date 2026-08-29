/*!
    @preserve

    Bundle includes:
    - THREE.js library (https://threejs.org/)
    - THREE mesh BVH (https://www.npmjs.com/package/three-mesh-bvh)
    - THREE mesh UI (https://www.npmjs.com/package/three-mesh-ui)
    - 3D Tiles Renderer (https://github.com/NASA-AMMOS/3DTilesRendererJS)
    - THREE custom shader material (https://www.npmjs.com/package/three-custom-shader-material)
    - SPARK 3D Gaussian Splatting renderer for THREE.js (https://sparkjs.dev/)
    
=================================================================================================*/

import * as THREE_BASE from "three";

/*
    THREE Addons
*/
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
//import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
//import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
//import { SSAARenderPass } from 'three/addons/postprocessing/SSAARenderPass.js';
//import { TAARenderPass } from 'three/addons/postprocessing/TAARenderPass.js';
import { GammaCorrectionShader } from 'three/addons/shaders/GammaCorrectionShader.js';
//import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { SAOPass } from 'three/addons/postprocessing/SAOPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
//import { SobelOperatorShader } from 'three/addons/shaders/SobelOperatorShader.js';
import { SSRPass } from 'three/addons/postprocessing/SSRPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { AnaglyphEffect } from 'three/addons/effects/AnaglyphEffect.js';
import { CSM } from 'three/addons/csm/CSM.js';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
//import { DeviceOrientationControls } from 'three/addons/controls/DeviceOrientationControls.js';
//import { FirstPersonControls } from "three/addons/controls/FirstPersonControls.js";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
//import { IFCLoader } from "three/addons/loaders/IFCLoader.js"
import { USDZExporter } from 'three/addons/exporters/USDZExporter.js';

//import { CSS3DRenderer, CSS3DObject } from "three/addons/renderers/CSS3DRenderer.js";
import { HTMLMesh } from 'three/addons/interactive/HTMLMesh.js';
import { InteractiveGroup } from 'three/addons/interactive/InteractiveGroup.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
//import { BufferGeometryUtils } from 'three/addons/utils/BufferGeometryUtils.js';
//import { GeometryUtils } from 'three/addons/utils/GeometryUtils.js';

import { Reflector } from 'three/addons/objects/Reflector.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';

//import { RoughnessMipmapper } from 'three/addons/utils/RoughnessMipmapper.js';
import { LightProbeHelper } from 'three/addons/helpers/LightProbeHelper.js';
import { LightProbeGenerator } from 'three/addons/lights/LightProbeGenerator.js';

//import { XREstimatedLight } from 'three/addons/webxr/XREstimatedLight.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';

//import { BasisTextureLoader } from "three/addons/loaders/BasisTextureLoader.js";
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';

import { TransformControls } from 'three/addons/controls/TransformControls.js';
window.TransformControls = TransformControls;

const THREE = {
    ...THREE_BASE,

    EffectComposer,
    RenderPass,
    ShaderPass,
    SAOPass,
    GTAOPass,
    UnrealBloomPass,
    SSRPass,
    BokehPass,
    GammaCorrectionShader,
    OutputPass,

    AnaglyphEffect,
    CSM,

    OrbitControls,
    
    GLTFLoader,
    DRACOLoader,
    KTX2Loader,
    GLTFExporter,
    OBJExporter,
    USDZExporter,

    HTMLMesh,
    InteractiveGroup,

    Line2,
    LineMaterial,

    LineGeometry,
    ConvexGeometry,

    Reflector,
    HDRLoader,
    EXRLoader,

    LightProbeHelper,
    LightProbeGenerator,

    XRControllerModelFactory,
    XRHandModelFactory,

    TransformControls
};

window.THREE = THREE;


import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
window.CustomShaderMaterial = CustomShaderMaterial;

import ThreeMeshUI from "three-mesh-ui/build/three-mesh-ui.module.js";
window.ThreeMeshUI = ThreeMeshUI;



/*
    ThreeMesh BVH
*/
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import * as ThreeMeshBVH from 'three-mesh-bvh';

//import { GenerateMeshBVHWorker } from 'three-mesh-bvh/src/workers/GenerateMeshBVHWorker.js';
window.ThreeMeshBVH = ThreeMeshBVH;

// Add the extension functions
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

/*
    3D Tiles Renderer
*/
import * as TILES_BASE from '3d-tiles-renderer';

import { TilesFadePlugin, DeepZoomOverlay, GeneratedSurfacePlugin, ImplicitTilingPlugin, DebugTilesPlugin, UpdateOnChangePlugin } from '3d-tiles-renderer/plugins';


/*
    Spark
*/
import * as SPARK from "@sparkjsdev/spark";
//var SPARK = require("@sparkjsdev/spark");
window.SPARK = SPARK;

/*
    3DTR 3DGS Plugin
*/
//import { GaussianSplatPlugin, getSparkRendererForScene } from '3d-tiles-rendererjs-3dgs-plugin';

import { GaussianSplatRenderer } from 'gaussian-splat-lite';
import { GaussianSplatPlugin } from '3d-tiles-rendererjs-3dgs-plugin';

const TILES = {
    ...TILES_BASE,

    TilesFadePlugin,
    ImplicitTilingPlugin,
    DeepZoomOverlay,
    UpdateOnChangePlugin,
    DebugTilesPlugin,
    GeneratedSurfacePlugin,
/*
    GaussianSplatPlugin,
    getSparkRendererForScene
*/
    GaussianSplatPlugin,
    GaussianSplatRenderer
};

window.TILES = TILES;

/*
// THREE components
THREE.OrbitControls             = OrbitControls;
//THREE.DeviceOrientationControls = DeviceOrientationControls;

THREE.EffectComposer      = EffectComposer;
THREE.RenderPass          = RenderPass;
THREE.ShaderPass          = ShaderPass;
//THREE.FXAAShader          = FXAAShader;
//THREE.SMAAPass            = SMAAPass;
//THREE.SSAARenderPass      = SSAARenderPass;
//THREE.TAARenderPass       = TAARenderPass;
//THREE.GammaCorrectionShader = GammaCorrectionShader;
//THREE.SSAOPass            = SSAOPass;
THREE.SAOPass             = SAOPass;
THREE.GTAOPass            = GTAOPass;
//THREE.SobelOperatorShader = SobelOperatorShader;
THREE.SSRPass             = SSRPass;
THREE.BokehPass           = BokehPass;
THREE.AnaglyphEffect      = AnaglyphEffect;
THREE.CSM                 = CSM;

THREE.GLTFLoader         = GLTFLoader;
THREE.GLTFExporter       = GLTFExporter;
THREE.OBJExporter        = OBJExporter;
THREE.DRACOLoader        = DRACOLoader;
//THREE.BasisTextureLoader = BasisTextureLoader;
THREE.KTX2Loader         = KTX2Loader;
THREE.USDZExporter       = USDZExporter;
//THREE.IFCLoader          = IFCLoader;

///THREE.FirstPersonControls = FirstPersonControls;

//THREE.ConvexBufferGeometry = ConvexBufferGeometry;
THREE.Line2               = Line2;
THREE.LineMaterial        = LineMaterial;
THREE.LineGeometry        = LineGeometry;
THREE.ConvexGeometry      = ConvexGeometry;
//THREE.BufferGeometryUtils = BufferGeometryUtils;
//THREE.GeometryUtils       = GeometryUtils;
THREE.UnrealBloomPass     = UnrealBloomPass;
THREE.Reflector           = Reflector;

THREE.HDRLoader = HDRLoader;
THREE.EXRLoader = EXRLoader;
//THREE.RoughnessMipmapper  = RoughnessMipmapper;
THREE.LightProbeHelper    = LightProbeHelper;
THREE.LightProbeGenerator = LightProbeGenerator;

///THREE.XREstimatedLight         = XREstimatedLight;
THREE.XRControllerModelFactory = XRControllerModelFactory;
THREE.XRHandModelFactory       = XRHandModelFactory;

THREE.TransformControls = TransformControls;

THREE.HTMLMesh = HTMLMesh;
THREE.InteractiveGroup = InteractiveGroup;

//THREE.CSS3DRenderer = CSS3DRenderer;
//THREE.CSS3DObject   = CSS3DObject;


TILES.TilesFadePlugin      = TilesFadePlugin;
//TILES.ImplicitTilingPlugin = ImplicitTilingPlugin;
TILES.DeepZoomOverlay      = DeepZoomOverlay;
TILES.UpdateOnChangePlugin = UpdateOnChangePlugin;
TILES.DebugTilesPlugin     = DebugTilesPlugin;

TILES.GaussianSplatPlugin  = GaussianSplatPlugin;
TILES.getSparkRendererForScene = getSparkRendererForScene;

//TILES.TileCompressionPlugin = TileCompressionPlugin;

//window.GenerateMeshBVHWorker = GenerateMeshBVHWorker;
*/



/*
window.THREE        = THREE;
window.ThreeMeshUI  = ThreeMeshUI;
window.ThreeMeshBVH = ThreeMeshBVH;
window.TILES        = TILES;
window.SPARK        = SPARK;

window.CustomShaderMaterial = CustomShaderMaterial;
*/

/*
export {
    THREE,
    ThreeMeshUI,
    ThreeMeshBVH,
    TILES,
    SPARK
};
*/

/*
export default {
    external: ["THREE","ThreeMeshUI","ThreeMeshBVH","TILES","SPARK"]
};
*/