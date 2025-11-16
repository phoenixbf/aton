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

import * as THREE from "three";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
//import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
//import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
//import { SSAARenderPass } from 'three/examples/jsm/postprocessing/SSAARenderPass.js';
//import { TAARenderPass } from 'three/examples/jsm/postprocessing/TAARenderPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
//import { SSAOPass } from "three/examples/jsm/postprocessing/SSAOPass.js";
import { SAOPass } from 'three/examples/jsm/postprocessing/SAOPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SobelOperatorShader } from 'three/examples/jsm/shaders/SobelOperatorShader.js';
import { SSRPass } from 'three/examples/jsm/postprocessing/SSRPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { AnaglyphEffect } from 'three/addons/effects/AnaglyphEffect.js';
import { CSM } from 'three/addons/csm/CSM.js';

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
//import { DeviceOrientationControls } from 'three/examples/jsm/controls/DeviceOrientationControls.js';
//import { FirstPersonControls } from "three/examples/jsm/controls/FirstPersonControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
//import { IFCLoader } from "three/examples/jsm/loaders/IFCLoader.js"
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js';

//import { CSS3DRenderer, CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { HTMLMesh } from 'three/addons/interactive/HTMLMesh.js';
import { InteractiveGroup } from 'three/addons/interactive/InteractiveGroup.js';

import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';

import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GeometryUtils } from 'three/examples/jsm/utils/GeometryUtils.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
//import { RoughnessMipmapper } from 'three/examples/jsm/utils/RoughnessMipmapper.js';
import { LightProbeHelper } from 'three/examples/jsm/helpers/LightProbeHelper.js';
import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator.js';

import { XREstimatedLight } from 'three/addons/webxr/XREstimatedLight.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';

//import { BasisTextureLoader } from "three/examples/jsm/loaders/BasisTextureLoader.js";
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

import CustomShaderMaterial from 'three-custom-shader-material/vanilla';

//import ThreeMeshUI from '../_prv/three-mesh-ui/src/three-mesh-ui.js';
import ThreeMeshUI from "three-mesh-ui/build/three-mesh-ui.module.js";
//import * as ThreeMeshUI from 'three-mesh-ui/src/three-mesh-ui.js';

//import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import * as ThreeMeshBVH from 'three-mesh-bvh';
//import { GenerateMeshBVHWorker } from 'three-mesh-bvh/src/workers/GenerateMeshBVHWorker.js';

import * as TILES from '3d-tiles-renderer';
import { TilesFadePlugin, ImplicitTilingPlugin, DeepZoomImagePlugin, UpdateOnChangePlugin } from '3d-tiles-renderer/plugins';

//import { Loader3DTiles } from 'three-loader-3dtiles';

import * as SPARK from "@sparkjsdev/spark";


// Add the extension functions
THREE.BufferGeometry.prototype.computeBoundsTree = ThreeMeshBVH.computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = ThreeMeshBVH.disposeBoundsTree;
THREE.Mesh.prototype.raycast = ThreeMeshBVH.acceleratedRaycast;

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
THREE.GammaCorrectionShader = GammaCorrectionShader;
//THREE.SSAOPass            = SSAOPass;
THREE.SAOPass             = SAOPass;
THREE.GTAOPass            = GTAOPass;
THREE.SobelOperatorShader = SobelOperatorShader;
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
THREE.BufferGeometryUtils = BufferGeometryUtils;
THREE.GeometryUtils       = GeometryUtils;
THREE.UnrealBloomPass     = UnrealBloomPass;
THREE.Reflector           = Reflector;

THREE.HDRLoader = HDRLoader;
THREE.EXRLoader = EXRLoader;
//THREE.RoughnessMipmapper  = RoughnessMipmapper;
THREE.LightProbeHelper    = LightProbeHelper;
THREE.LightProbeGenerator = LightProbeGenerator;

THREE.XREstimatedLight         = XREstimatedLight;
THREE.XRControllerModelFactory = XRControllerModelFactory;
THREE.XRHandModelFactory       = XRHandModelFactory;

THREE.TransformControls = TransformControls;

//THREE.CSS3DRenderer = CSS3DRenderer;
//THREE.CSS3DObject   = CSS3DObject;

TILES.TilesFadePlugin      = TilesFadePlugin;
TILES.ImplicitTilingPlugin = ImplicitTilingPlugin;
TILES.DeepZoomImagePlugin  = DeepZoomImagePlugin;
TILES.UpdateOnChangePlugin = UpdateOnChangePlugin;
//TILES.TileCompressionPlugin = TileCompressionPlugin;


THREE.HTMLMesh = HTMLMesh;
THREE.InteractiveGroup = InteractiveGroup;

//window.GenerateMeshBVHWorker = GenerateMeshBVHWorker;

window.THREE        = THREE;
window.ThreeMeshUI  = ThreeMeshUI;
window.ThreeMeshBVH = ThreeMeshBVH;
window.TILES        = TILES;
window.SPARK        = SPARK;

window.CustomShaderMaterial = CustomShaderMaterial;

//window.Loader3DTiles = Loader3DTiles;

export {
    THREE,
    ThreeMeshUI,
    ThreeMeshBVH,
    TILES,
    SPARK
};