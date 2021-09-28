/*!
    @preserve

    THREEjs library (https://threejs.org/) custom bundle
    including:
    - THREE mesh BVH (https://www.npmjs.com/package/three-mesh-bvh)
    - THREE mesh UI (https://www.npmjs.com/package/three-mesh-ui)
    - 3D Tiles Renderer (https://github.com/NASA-AMMOS/3DTilesRendererJS)
==================================================================================*/

import * as THREE from "three";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { SSAARenderPass } from 'three/examples/jsm/postprocessing/SSAARenderPass.js';
//import { TAARenderPass } from 'three/examples/jsm/postprocessing/TAARenderPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
//import { SSAOPass } from "three/examples/jsm/postprocessing/SSAOPass.js";
import { SAOPass } from 'three/examples/jsm/postprocessing/SAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SobelOperatorShader } from 'three/examples/jsm/shaders/SobelOperatorShader.js';
import { SSRPass } from 'three/examples/jsm/postprocessing/SSRPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { CSM } from 'three/examples/jsm/csm/CSM.js';

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DeviceOrientationControls } from 'three/examples/jsm/controls/DeviceOrientationControls.js';
//import { FirstPersonControls } from "three/examples/jsm/controls/FirstPersonControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
//import { IFCLoader } from "three/examples/jsm/loaders/IFCLoader.js"
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js';

import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GeometryUtils } from 'three/examples/jsm/utils/GeometryUtils.js';

import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { RoughnessMipmapper } from 'three/examples/jsm/utils/RoughnessMipmapper.js';
import { LightProbeHelper } from 'three/examples/jsm/helpers/LightProbeHelper.js';
import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator.js';

import { BasisTextureLoader } from "three/examples/jsm/loaders/BasisTextureLoader.js";


import ThreeMeshUI from '../../_prv/three-mesh-ui/src/three-mesh-ui.js';
//import * as ThreeMeshUI from 'three-mesh-ui/src/three-mesh-ui.js';

//import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import * as ThreeMeshBVH from 'three-mesh-bvh';

import * as TILES from '3d-tiles-renderer';

// Add the extension functions
THREE.BufferGeometry.prototype.computeBoundsTree = ThreeMeshBVH.computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = ThreeMeshBVH.disposeBoundsTree;
THREE.Mesh.prototype.raycast = ThreeMeshBVH.acceleratedRaycast;

// THREE components
THREE.OrbitControls             = OrbitControls;
THREE.DeviceOrientationControls = DeviceOrientationControls;

THREE.EffectComposer      = EffectComposer;
THREE.RenderPass          = RenderPass;
THREE.ShaderPass          = ShaderPass;
THREE.FXAAShader          = FXAAShader;
THREE.SMAAPass            = SMAAPass;
THREE.SSAARenderPass      = SSAARenderPass;
//THREE.TAARenderPass       = TAARenderPass;
THREE.GammaCorrectionShader = GammaCorrectionShader;
//THREE.SSAOPass            = SSAOPass;
THREE.SAOPass             = SAOPass;
//THREE.GTAOPass            = GTAOPass;
THREE.SobelOperatorShader = SobelOperatorShader;
THREE.SSRPass             = SSRPass;
THREE.BokehPass           = BokehPass;
THREE.CSM                 = CSM;

THREE.GLTFLoader         = GLTFLoader;
THREE.GLTFExporter       = GLTFExporter;
THREE.OBJExporter        = OBJExporter;
THREE.DRACOLoader        = DRACOLoader;
//THREE.IFCLoader          = IFCLoader;
THREE.BasisTextureLoader = BasisTextureLoader;
THREE.USDZExporter       = USDZExporter;

///THREE.FirstPersonControls = FirstPersonControls;

//THREE.ConvexBufferGeometry = ConvexBufferGeometry;
THREE.ConvexGeometry      = ConvexGeometry;
THREE.BufferGeometryUtils = BufferGeometryUtils;
THREE.GeometryUtils       = GeometryUtils;
THREE.UnrealBloomPass     = UnrealBloomPass;

THREE.RGBELoader = RGBELoader;
THREE.RoughnessMipmapper = RoughnessMipmapper;
THREE.LightProbeHelper = LightProbeHelper;
THREE.LightProbeGenerator = LightProbeGenerator;


window.THREE        = THREE;
window.ThreeMeshUI  = ThreeMeshUI;
window.ThreeMeshBVH = ThreeMeshBVH;
window.TILES        = TILES;