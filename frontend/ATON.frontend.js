
ATON.FrontEnd = {};

// root paths
ATON.FrontEnd.MODELS_ROOT = "../models/";
ATON.FrontEnd.RES_ROOT    = "../res/";

var uColors = [
    'rgb(64, 0, 0)',
    'rgb(64, 64, 0)',
    'rgb(0, 64, 0)',
    'rgb(0, 64, 64)',
    'rgb(0, 0, 64)',
    'rgb(64, 0, 64)'
];


ATON.FrontEnd.setupPage = function(){
    var iContainer = document.getElementById( "iContainer" );
    iContainer.addEventListener( 'keydown', function ( e ) {
        e.stopPropagation();
    }, false );
    
    ATON.FrontEnd.setUserName = function(){
        var el = document.getElementById('uname');
        ATON.vroadcast.setUserName(el.value);
    };
    
    ATON.FrontEnd.setStatus = function(){
        var el = document.getElementById('ustatus');
        ATON.vroadcast.setStatus(el.value);
        el.value = "";
    };
    ATON.FrontEnd.setWeight = function(){
        var el = document.getElementById('uweight');
        console.log(el.value);
        ATON.vroadcast.setWeight(el.value);

        document.getElementById('idMagWeight').innerHTML = el.value;
    };
    ATON.FrontEnd.setMagRadius = function(){
        var el = document.getElementById('umagrad');
        console.log(el.value);
        ATON.vroadcast.setMagRadius(el.value);

        document.getElementById('idMagRadius').innerHTML = el.value;
    };
    
    ATON.FrontEnd.toggleFirstPerson = function(){
        var el = document.getElementById('ufp');
        ATON.setFirstPersonMode(el.checked);
    };
    
    ATON.FrontEnd.toggleCollisions = function(){
        var el = document.getElementById('bcollisions');
        console.log(el.checked);
        ATON._bUseCollisions = el.checked;
    };
    ATON.FrontEnd.toggleGravity = function(){
        var el = document.getElementById('bgravity');
        console.log(el.checked);
        ATON._bUseGravity = el.checked;
    };
};


ATON.FrontEnd.logPOV = function(){
    console.log(
        "&pov="+
        ATON._currPOV.pos[0].toFixed(2)+","+
        ATON._currPOV.pos[1].toFixed(2)+","+
        ATON._currPOV.pos[2].toFixed(2)+","+
        ATON._currPOV.target[0].toFixed(2)+","+
        ATON._currPOV.target[1].toFixed(2)+","+
        ATON._currPOV.target[2].toFixed(2)
    );
};

ATON.FrontEnd.attachListeners = function(){
	$(function() {
		$(document).keydown(function(e) {
	    	if (e.keyCode == 67){ // c
				ATON.FrontEnd.logPOV();
                }
                
            if (e.keyCode == 77){ // m
                var M = new ATON.magNode();

                M.setTarget(ATON._hoveredVisData.p.slice(0));
                M.setPosition(ATON._currPOV.pos.slice(0));

                var d = osg.vec3.squaredDistance(ATON._hoveredVisData.p, ATON._currPOV.pos);
                M.setRadius( Math.sqrt(d) );
                M.setKernel(0.0);

                M.forces[0] = 0.0;
                M.forces[1] = 0.02;

                ATON.addMagNode(M);
                }

                if (e.keyCode == 13){ // enter
                    var jMag = JSON.stringify(ATON.MagNet);
                    console.log(jMag);

                    console.log(JSON.parse(jMag));
                    }
            });
        });
};


window.addEventListener( 'load', function () {
    // First we grab canvas element
    var canvas = document.getElementById( 'View' );

    // Sample Viewer
    ATON.shadersFolder = "../shaders";
    ATON.realize(canvas);

    // home
    //ATON.setHome([9.39,-12.22,4.78], [0.028,-0.43,2.77]);
    //ATON.setHome([-5.23,4.38,10], [0.028,-0.43,0.0] );
    //ATON.setHome([-0.58,-0.287,1.5], [-6.0,-2.87,1.5]);

    // Sample POV
/*
    var p = new ATON.pov("Anfora");
    p.pos    = [-1.0,-1.2,2.4];
    p.target = [-0.5,0.2,2.0];
    p.fov    = 90.0;
    p.classList = ["detail", "anfora"];

    ATON.addPOV(p);
*/

    var scenename = undefined;

    ATON.addLightProbe("../LP/w"); // default
    var lpParam = ATON.utils.getURLparams().lp;
    if (lpParam) ATON.addLightProbe("../LP/"+lpParam);


    var assetParam = ATON.utils.getURLparams().m;
    if (assetParam){
        var assets = assetParam.split(',');

        assets.forEach(asset => {
            switch (asset){
                case "faug":
                    scenename = "faug";
                    ATON.addLightProbe("../LP/w");

                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/faug/floor.osgjs", { layer: "FAUG" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/faug/walls.osgjs", { layer: "FAUG" });

                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/faug/exedrae.osgjs", { layer: "FAUG" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/faug/rooves.osgjs", { layer: "FAUG" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/faug/temple_exterior.osgjs", { layer: "FAUG" });

                    ATON.setHome([0.0,100,130],[0.0,18.53,7.94]);

                    ATON.QUSV.setPositionAndExtents([-29, -40.0, 0.0], [57.0, 120.0, 60.0]);
                    //ATON.loadILSign("../models/_prv/_QUSV/P_GLOB-TP0.png");
                    ATON.QUSV.loadILSign("../models/_prv/_QUSV/faug/P-qils.png");
                    break;

                case "acq":
                    scenename = "acq";
                    ATON.addLightProbe("../LP/w");

                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/acq/root.osgjs", { layer: "PRESENT" });
                    ATON.setHome([-7.76,15.78,7.19],[9.90,-13.38,5.83]);

                    //ATON.QUSV.setPositionAndExtents([-29, -40.0, 0.0], [57.0, 120.0, 60.0]);
                    //ATON.loadILSign("../models/_prv/_QUSV/P_GLOB-TP0.png");
                    //ATON.QUSV.loadILSign("../models/_prv/_QUSV/faug/P-qils.png");
                    break;

                case "faug2":
                    scenename = "faug2";
                    ATON.addLightProbe("../LP/default");

                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/faug2/colossus_hall/root.osgjs", { layer: "FAUG" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/faug2/colossus_rooftop/root.osgjs", { layer: "FAUG" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/faug2/exedra_left/root.osgjs", { layer: "FAUG" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/faug2/exedra_right/root.osgjs", { layer: "FAUG" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/faug2/forum_doors/root.osgjs", { layer: "FAUG" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/faug2/forum_floor/root.osgjs", { layer: "FAUG" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/faug2/forum_stairs/root.osgjs", { layer: "FAUG" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/faug2/forum_wall/root.osgjs", { layer: "FAUG" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/faug2/postguard/root.osgjs", { layer: "FAUG" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/faug2/street_suburra/root.osgjs", { layer: "FAUG" });

                    ATON.setHome([0.0,100,130],[0.0,18.53,7.94]);

                    ATON.QUSV.setPositionAndExtents([-29, -40.0, 0.0], [57.0, 120.0, 60.0]);
                    //ATON.loadILSign("../models/_prv/_QUSV/P_GLOB-TP0.png");
                    ATON.QUSV.loadILSign("../models/_prv/_QUSV/faug/P-qils.png");
                    break;

                case "fpacis":
                    scenename = "fpacis";
                    ATON.addLightProbe("../LP/w");

                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/fpacis/01.osgjs", { layer: "FPACIS" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/fpacis/02.osgjs", { layer: "FPACIS" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/fpacis/03.osgjs", { layer: "FPACIS" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/fpacis/04.osgjs", { layer: "FPACIS" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/fpacis/05.osgjs", { layer: "FPACIS" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/fpacis/06.osgjs", { layer: "FPACIS" });

                    ATON.setHome([107.32,-23.23,-2.47],[109.05,-53.63,1.15]);

                    
                    //ATON.QUSV.setPositionAndExtents([-26, -58.0, -5.0], [142.5, 50.0, 30.0]); // TOT
                    ATON.QUSV.setPositionAndExtents([92, -50.0, -5.0], [25, 32.5, 30.0]); // Lib

                    ATON.QUSV.loadILSign("../models/_prv/_QUSV/pacis/P-qils.png");
                    //ATON.addILSign("../models/_prv/_QUSV/pacis/P_GLOB-TP0.png");
                    break;

                case "sarmi":
                    scenename = "sarmi";
                    
                    for (let i = 1; i <= 7; i++) ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"../models/_prv/sarmi/part-0"+i+".osgjs", { layer: "LANDSCAPE" });

                    for (let i = 1; i <= 6; i++) ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"../models/_prv/sarmi/LOD1_DP_Hor_"+i+".osgjs", { layer: "LANDSCAPE" });
                    for (let i = 1; i <= 6; i++) ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"../models/_prv/sarmi/r-LOD3_DP_Ter_"+i+".osgjs", { layer: "LANDSCAPE" });

                    ATON.setHome([111.72,160.66,15.20],[34.22,146.66,-11.13]);

                    ATON.QUSV.setPositionAndExtents([-30.0,0.0,-2.5], [170.0,190.0,40.5]);
                    //ATON.loadILSign("../models/_prv/_QUSV/P_GLOB-TP0.png");
                    ATON.QUSV.loadILSign("../models/_prv/_QUSV/sarmi/P-qils.png");
                    break;

                case "complex":
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"complex/Capriata1.osgjs", { layer: "COMPLEX", transformRules: ATON.FrontEnd.MODELS_ROOT+"complex/Capriata1-inst.txt" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/corcol/root.osgjs",{ layer: "COMPLEX", transformRules: ATON.FrontEnd.MODELS_ROOT+"complex/ColonnaCorinzia-inst.txt" });
                    break;
                
                case "sqcolumns":
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/table/TavoloEsedra.glb", { layer: "COLUMNS", transformRules: ATON.FrontEnd.MODELS_ROOT+"tl-square-4x.txt" });
                    break;

                case "groundx":
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"ground/root.osgjs", { layer: "GROUND", transformRules: ATON.FrontEnd.MODELS_ROOT+"ground/tl-grid.txt" });
                    break;

                case "armoury":
                    scenename = "armoury";
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/armoury/root.osgjs", { layer: "MAIN" });

                    ATON.transformLayerByMatrix("MAIN", osg.mat4.fromScaling( [], [0.25,0.25,0.25]));
                    
                    ATON.setHome([-2.27,-10.81,7.50],[-0.87,0.13,5.41]);
                    break;

                case "picgallery":
                    scenename = "picgallery";
                    ATON.addLightProbe("../LP/w");

                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/picgallery/root.osgjs", { layer: "MAIN" });
                    ATON.setHome([-2.67,-10.09,2.46],[0.28,-1.69,1.62]);
                    break;

                case "dining":
                    scenename = "dining-room";
                    ATON.addLightProbe("../LP/w");

                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/dining-room/root.osgjs", { layer: "MAIN" });
                    ATON.transformLayerByMatrix("MAIN", osg.mat4.fromScaling( [], [0.5,0.5,0.5]));
                    ATON.setHome([-4.00,-3.50,2.55],[0.21,2.01,2.61]);

                    ATON.QUSV.setPositionAndExtents([-6, -7.5, 0.4], [12.0, 14.0, 7.3]);
                    ATON.QUSV.loadILSign("../models/_prv/_QUSV/dining/F-qils.png");
                    break;

                case "vestibule":
                    scenename = "upper-vestibule";
                    ATON.addLightProbe("../LP/w");

                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/upper-vestibule/root.osgjs", { layer: "MAIN" });
                    ATON.transformLayerByMatrix("MAIN", osg.mat4.fromScaling( [], [0.35,0.35,0.35]));
                    ATON.setHome([-1.64,3.12,1.15],[0.16,2.20,0.96]);

                    ATON.QUSV.setPositionAndExtents([-5, -5.5, 0.0], [13.0, 10, 11.8]);
                    
                    ATON.QUSV.loadILSign("../models/_prv/_QUSV/vestibule/F-qils.png");
                    //ATON.QUSV.loadILSign("../models/_prv/_QUSV/vestibule/P-qils.png");
                    //ATON.QUSV.loadILSign("../models/_prv/_QUSV/vestibule/F_GLOB-TP0.png");
                    //ATON.QUSV.loadILSign("../models/_prv/_QUSV/vestibule/P_GLOB-TP0.png");
                    break;

                case "smoking":
                    scenename = "smoking-room";
                    ATON.addLightProbe("../LP/w");

                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/smoking-room/root.osgjs", { layer: "MAIN" });
                    ATON.transformLayerByMatrix("MAIN", osg.mat4.fromScaling( [], [0.3,0.3,0.3]));
                    ATON.setHome([0.33,1.02,1.93],[-0.41,-0.46,1.58]);

                    ATON.QUSV.setPositionAndExtents([-5, -5.5, 0.0], [13.0, 10, 11.8]);
                    
                    //ATON.QUSV.loadILSign("../models/_prv/_QUSV/smoking/F-qils.png");
                    //ATON.QUSV.loadILSign("../models/_prv/_QUSV/smoking/P-qils.png");
                    //ATON.QUSV.loadILSign("../models/_prv/_QUSV/smoking/F_GLOB-TP0.png");
                    //ATON.QUSV.loadILSign("../models/_prv/_QUSV/smoking/P_GLOB-TP0.png");
                    break;

                case "test1":
                    scenename = "TEST1";
                    ATON.addLightProbe("../LP/default");

                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"ground/root.osgjs", { layer: "GROUND" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"ground/border.osgjs", { layer: "GROUND", transformRules: ATON.FrontEnd.MODELS_ROOT+"ground/tl-border.txt" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/corcol/root.osgjs", { layer: "MAIN", transformRules: ATON.FrontEnd.MODELS_ROOT+"tl-square-cols.txt" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"hebe/root.osgjs", { layer: "MAIN" });
                    //ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"tree1/root.osgjs", { layer: "MAIN", transformRules: ATON.FrontEnd.MODELS_ROOT+"tl-trees.txt" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"atoncube/root.osgjs", { layer: "MAIN", transformRules: ATON.FrontEnd.MODELS_ROOT+"tl-square-groundcubes.txt" });

                    ATON.setHome([-0.77,-17.02,2.81],[0,0,2.81]);
                    break;

                case "cecilio":
                    scenename = "cecilio";
                    ATON.addLightProbe("../LP/w");

                    ATON.addNewLayer("PRESENT");
                    ATON.addNewLayer("CEIL","PRESENT");

                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/cecilio/room_a/root.osgjs", { layer: "PRESENT" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/cecilio/room_b_S/root.osgjs", { layer: "PRESENT" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/cecilio/room_b_N/root.osgjs", { layer: "PRESENT" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/cecilio/room_b_E/root.osgjs", { layer: "PRESENT" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/cecilio/room_b_floor/root.osgjs", { layer: "PRESENT" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/cecilio/room_c/root.osgjs", { layer: "PRESENT" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/cecilio/room_d/root.osgjs", { layer: "PRESENT" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/cecilio/room_e/root.osgjs", { layer: "PRESENT" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/cecilio/room_f/root.osgjs", { layer: "PRESENT" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/cecilio/room_g/root.osgjs", { layer: "PRESENT" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/cecilio/room_h/root.osgjs", { layer: "PRESENT" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/cecilio/room_i/root.osgjs", { layer: "PRESENT" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/cecilio/room_l_N/root.osgjs", { layer: "PRESENT" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/cecilio/room_l_W/root.osgjs", { layer: "PRESENT" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/cecilio/room_l_garden/root.osgjs", { layer: "PRESENT" });
                    
                    //ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/cecilio/room_l_ceiling/root.osgjs", { layer: "CEIL" });
                    
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/cecilio/room_m_k/root.osgjs", { layer: "PRESENT" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/cecilio/room_n/root.osgjs", { layer: "PRESENT" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/cecilio/room_o/root.osgjs", { layer: "PRESENT" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/cecilio/room_p_q/root.osgjs", { layer: "PRESENT" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/cecilio/room_r/root.osgjs", { layer: "PRESENT" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/cecilio/room_s/root.osgjs", { layer: "PRESENT" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/cecilio/room_t/root.osgjs", { layer: "PRESENT" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/cecilio/room_u/root.osgjs", { layer: "PRESENT" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/cecilio/room_v/root.osgjs", { layer: "PRESENT" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/cecilio/room_w/root.osgjs", { layer: "PRESENT" });

                    //ATON.translateLayer("CEIL", [0,0,10]);
                    //ATON.switchLayer("PRESENT", false);

                    ATON.setHome([5.25,-20.15,39.11],[-8.41,-19.86,0.93]);
                    break;

                case "test2":
                    scenename = "TEST2";
                    ATON.setFirstPersonMode(true);

                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/karanis/root.osgjs", { layer: "MAIN" });
                    ATON.setHome([-19.82,-20.99,29.27],[-5.43,-20.68,2.10]);
                    break;

                case "skf":
                    ATON.addGraph("https://media.sketchfab.com/urls/afce4db089014d27a201c72d1cc1bcba/dist/models/4827386b0e674b0a9a33f0281c987fea/file.osgjs.gz", { layer: "MAIN" })
                    break;
            
                default:
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+asset+"/root.osgjs", { layer: asset });
                    break;
                }
            });
        }

    // Sample MagNodes
/*
    if (asset === "magnet"){

        var M = new ATON.magNode();
        M.setRadius(2.0);
        M.setPositionAndTarget([0.658,-0.776,4.005]);
        //ATON.addMagNode(M);

        var M2 = new ATON.magNode();
        M2.setRadius(3.0);
        M2.setTarget([0.144,-0.462,4.723]);
        M2.setPosition([1.369,-1.544,4.254]);
        //M2.forces[0] = 0.01;
        ATON.addMagNode(M2);

        var M3 = new ATON.magNode();
        M3.setRadius(3.0);
        M3.setPosition([-2.5716285936594505,-2.0389141070658536,3.134113601993949]);
        M3.setTarget([-0.749320343566681,-0.4619313257452175,2.1931752975431884]);
        //M3.forces[0] = 0.01;
        ATON.addMagNode(M3);


        //ATON.addGraph("models/ground/ground.osgjs", { layer: "SCENE" });
        //ATON.addGraph("res/assets/hmd/hmd-z-nt.osgjs", { layer: "HMD" });
        ATON.addGraph("models/hebe/hebe.osgjs", { layer: "HEBE" });
        }
    
    if (asset === "complex"){
        ATON.addGraph("models/thermalcomplex/Capriata1.osgjs", { layer: "COMPLEX", transformRules: "models/thermalcomplex/Capriata1-inst.txt" });
        ATON.addGraph("models/thermalcomplex/ColonnaCorinzia.osgjs",{ layer: "COMPLEX", transformRules: "models/thermalcomplex/ColonnaCorinzia-inst.txt" });
        }

    if (asset === "karanis"){
        ATON.addGraph("models/karanis/karanis_architectures.osgjs", { layer: "KARANIS" });
        }

    if (asset === "gogh"){
        ATON.addGraph("models/glTF/scene.gltf", { layer: "TEST" });
        }
    
    //ATON.addGraph("models/medievalcity/citt_medievale_terrain_s6.osgjs", { layer: "MedCity" });
    //ATON.addGraph("models/medievalcity/citt_medievale.osgjs", { layer: "MedCity" });

    //ATON.addGraph("models/mywinger/mywinger.osgjs", { layer: "MY" });
    //ATON.addGraph("models/test/lamp_g1.osgjs");

if (asset === "faug"){
    ATON.addGraph("models/faug/exedrae.osgjs", { layer: "FAUG" });
    ATON.addGraph("models/faug/floor.osgjs", { layer: "FAUG" });
    ATON.addGraph("models/faug/rooves.osgjs", { layer: "FAUG" });
    ATON.addGraph("models/faug/temple_exterior.osgjs", { layer: "FAUG" });
    ATON.addGraph("models/faug/walls.osgjs", { layer: "FAUG" });
    }

    //ATON.addGraph("models/atoncube/cube.osgjs");
    //ATON.addGraph("models/sphere/sphere.osgjs");

    //ATON.addGraph("models/sphere/sphere.osgjs", {
    //    layer: "COMPLEX", 
    //    transformRules: "models/thermalcomplex/ColonnaCorinzia-inst.txt"
    //    });

if (asset === "domus"){
    ATON.addGraph("models/domus/LOD1_DP_Hor_1.osgjs", { layer: "DOMUS" });
    ATON.addGraph("models/domus/LOD1_DP_Hor_2.osgjs", { layer: "DOMUS" });
    ATON.addGraph("models/domus/LOD1_DP_Hor_3.osgjs", { layer: "DOMUS" });
    ATON.addGraph("models/domus/LOD1_DP_Hor_4.osgjs", { layer: "DOMUS" });
    ATON.addGraph("models/domus/LOD1_DP_Hor_5.osgjs", { layer: "DOMUS" });
    ATON.addGraph("models/domus/LOD1_DP_Hor_6.osgjs", { layer: "DOMUS" });
    ATON.addGraph("models/domus/LOD1_DP_Hor_7.osgjs", { layer: "DOMUS" });
    }

if (asset === "sf"){
    ATON.addGraph("models/SF/vhlab__SF-200916_L0_X0_Y0_subtile.osgjs", { layer: "terrain" } );
    }
*/

/*
    ATON.addDescriptor("proxies/T36.osgjs", "T36");
    ATON.addParentToDescriptor("T36", "PIPPO200");
    ATON.addParentToDescriptor("PIPPO200", "PLUTO");
*/

    //ATON.addGraph("models/gcanyon/vhlab__testwgl_L0_X0_Y0_subtile.osgjs");

    //ATON.switchLayer("HEBE", false);
    //ATON.switchLayer("COMPLEX", false);
    //ATON.switchLayer("KARANIS", false);


    //ATON.setVRcontrollerModel("../models/controllers/vr_controller_vive_1_5.osgjs");
    ATON.setVRcontrollerModel(ATON.FrontEnd.RES_ROOT+"assets/controllers/controller-ot-left.osgjs", ATON_VR_CONTROLLER_L);
    ATON.setVRcontrollerModel(ATON.FrontEnd.RES_ROOT+"assets/controllers/controller-ot-right.osgjs", ATON_VR_CONTROLLER_R);

    // Hide controllers
    ATON._controllerTransLeft.setNodeMask(0x0);
    ATON._controllerTransRight.setNodeMask(0x0);

    // POVs
    var povstr = ATON.utils.getURLparams().pov;
    if (povstr){
        var values = povstr.split(',');

        ATON.setHome([values[0],values[1],values[2]], [values[3],values[4],values[5]]);
        }



    // Tracer =====================
    ATON.tracer.resPath = ATON.FrontEnd.RES_ROOT;
    ATON.tracer.rootRecordFolder = "../services/record/";

    $("#idSession").hide();

    var recstr = ATON.utils.getURLparams().rec;
    if (recstr){
        var values = recstr.split(',');

        $("#idSession").show();

        if (ATON.utils.getURLparams().ovr && ATON.utils.getURLparams().ovr == 1){
            ATON.tracer.CSV_FORMAT = ATON.tracer.FORMAT_OVR;
            console.log("Tracer: reading OVR file records");
            }

        for (let u = 0; u < values.length; u++){
            var uid = parseInt( values[u] );

            ATON.tracer.loadUserRecord(scenename, uid);
            //console.log("---- USER "+uid+ "RECORD");
            }
        }

    // VRoadcast =====================
    ATON.vroadcast.setupResPath(ATON.FrontEnd.RES_ROOT);
    ATON.vroadcast.setUserModel(ATON.vroadcast.resPath+"assets/hmd/hmd-z-nt.osgjs");

    $("#idVRoadcast").hide();

    var vrcIP = ATON.utils.getURLparams().vrc;
    if (vrcIP !== undefined){
        //IP = "127.0.0.1";
        //IP = "192.168.0.193";
        //IP = "192.167.233.180";
        //IP = "seth.itabc.cnr.it";

        ATON.vroadcast.uStateFreq = 0.01;
        ATON.vroadcast.connect("http://"+vrcIP+":8080/", scenename);

        $("#idVRoadcast").show();

        // We have ID
        ATON.vroadcast.onIDassigned = function(){
            var uid = ATON.vroadcast._myUser.id;
            $('#idUserColor').css("background-color", uColors[uid % 6]);
            $('#idUserColor').html("U"+uid);

            // disable controls for beta users
            if (uid > 0) $('#idMagSetup').hide();
/*
            var magstr = ATON.utils.getURLparams().mag;
            if (magstr){
                var v = magstr.split(',');

                ATON.vroadcast.setWeight( parseFloat(v[0]) );
                if (v[1]) ATON.vroadcast.setMagRadius( parseFloat(v[1]) );
                }
*/
            };

        // Disconnection
        ATON.vroadcast.onDisconnect = function(){
            ATON.vroadcast.users = [];

            $('#idUserColor').css("background-color", "rgb(0,0,0)");
            $('#idUserColor').html("ATON");            
            };
        }

    // On completion
    ATON.onAllNodeRequestsCompleted = function(){
        ATON.requestHome();
        //$('#idLoader').hide();

        //ATON.setFOV(120);
        };

    ATON.FrontEnd.attachListeners();

    ATON.FrontEnd.setupPage();
});