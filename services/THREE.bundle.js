/*!
    @preserve

    THREEjs library (https://threejs.org/) custom bundle
    including:
    - THREE mesh BVH (https://www.npmjs.com/package/three-mesh-bvh)
    - THREE mesh UI (https://www.npmjs.com/package/three-mesh-ui)
==================================================================================*/

import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DeviceOrientationControls } from 'three/examples/jsm/controls/DeviceOrientationControls.js';
//import { FirstPersonControls } from "three/examples/jsm/controls/FirstPersonControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { ConvexBufferGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';

import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { RoughnessMipmapper } from 'three/examples/jsm/utils/RoughnessMipmapper.js';
import { LightProbeHelper } from 'three/examples/jsm/helpers/LightProbeHelper.js';
import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator.js';

import { BasisTextureLoader } from "three/examples/jsm/loaders/BasisTextureLoader.js";

import * as ThreeMeshUI from 'three-mesh-ui';
//import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import * as ThreeMeshBVH from 'three-mesh-bvh';

// Add the extension functions
THREE.BufferGeometry.prototype.computeBoundsTree = ThreeMeshBVH.computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = ThreeMeshBVH.disposeBoundsTree;
THREE.Mesh.prototype.raycast = ThreeMeshBVH.acceleratedRaycast;

// THREE components
THREE.OrbitControls = OrbitControls;
THREE.DeviceOrientationControls = DeviceOrientationControls;
THREE.GLTFLoader    = GLTFLoader;
THREE.GLTFExporter  = GLTFExporter;
THREE.DRACOLoader   = DRACOLoader;
THREE.BasisTextureLoader = BasisTextureLoader;
//THREE.FirstPersonControls = FirstPersonControls;
THREE.ConvexBufferGeometry = ConvexBufferGeometry;
THREE.RGBELoader = RGBELoader;
THREE.RoughnessMipmapper = RoughnessMipmapper;
THREE.LightProbeHelper = LightProbeHelper;
THREE.LightProbeGenerator = LightProbeGenerator;

window.THREE = THREE;

window.ThreeMeshUI  = ThreeMeshUI;
window.ThreeMeshBVH = ThreeMeshBVH;