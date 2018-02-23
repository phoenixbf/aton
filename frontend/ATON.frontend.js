
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

    var assetParam = ATON.utils.getURLparams().m;
    if (assetParam){
        var assets = assetParam.split(',');

        assets.forEach(asset => {
            switch (asset) {
                case "complex":
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"complex/Capriata1.osgjs", { layer: "COMPLEX", transformRules: ATON.FrontEnd.MODELS_ROOT+"complex/Capriata1-inst.txt" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"complex/ColonnaCorinzia.osgjs",{ layer: "COMPLEX", transformRules: ATON.FrontEnd.MODELS_ROOT+"complex/ColonnaCorinzia-inst.txt" });
                    break;
                
                case "sqcolumns":
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"complex/ColonnaCorinzia.osgjs", { layer: "COLUMNS", transformRules: ATON.FrontEnd.MODELS_ROOT+"tl-square-4x.txt" });
                    break;

                case "groundx":
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"ground/root.osgjs", { layer: "GROUND", transformRules: ATON.FrontEnd.MODELS_ROOT+"ground/tl-grid.txt" });
                    break;

                case "armoury":
                    scenename = "armoury";
/*
                    ATON.addNewLayer("MAIN");

                    var T = ATON.utils.generateTransformFromString("0 0 0 0 0 0 0.25 0.25 0.25");
                    osgDB.readNodeURL(ATON.FrontEnd.MODELS_ROOT+"_prv/armoury/root.osgjs").then( function ( node ){
                        T.addChild(node);
                        });
                    
                    ATON.layers["MAIN"].addChild( T );
*/
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/armoury/root.osgjs", { layer: "MAIN"/*, transformRules: ATON.FrontEnd.MODELS_ROOT+"_prv/armoury/t.txt"*/ });
                    break;

                case "picgallery":
                    scenename = "picgallery";
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/picgallery/root.osgjs", { layer: "MAIN" });
                    ATON.setHome([-2.67,-10.09,2.46],[0.28,-1.69,1.62]);
                    break;

                case "test1":
                    scenename = "TEST1";
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"ground/root.osgjs", { layer: "GROUND" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"ground/border.osgjs", { layer: "GROUND", transformRules: ATON.FrontEnd.MODELS_ROOT+"ground/tl-border.txt" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"complex/ColonnaCorinzia.osgjs", { layer: "MAIN", transformRules: ATON.FrontEnd.MODELS_ROOT+"tl-square-cols.txt" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"hebe/root.osgjs", { layer: "MAIN" });
                    //ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"tree1/root.osgjs", { layer: "MAIN", transformRules: ATON.FrontEnd.MODELS_ROOT+"tl-trees.txt" });
                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"atoncube/root.osgjs", { layer: "MAIN", transformRules: ATON.FrontEnd.MODELS_ROOT+"tl-square-groundcubes.txt" });

                    ATON.setHome([-0.77,-17.02,2.81],[0,0,2.81]);
                    break;

                case "test2":
                    scenename = "TEST2";
                    ATON.setFirstPersonMode(true);

                    ATON.addGraph(ATON.FrontEnd.MODELS_ROOT+"_prv/karanis/root.osgjs", { layer: "MAIN" });
                    ATON.setHome([-1.49,-0.93,1.29],[-5.06,-0.70,1.10]);
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

    var lpParam = ATON.utils.getURLparams().lp;
    if (lpParam) ATON.addLightProbe("../LP/"+lpParam);
    else ATON.addLightProbe("../LP/default");

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

    var recstr = ATON.utils.getURLparams().rec;
    if (recstr){
        var values = recstr.split(',');

        for (let u = 0; u < values.length; u++){
            var uid = parseInt( values[u] );

            ATON.tracer.loadUserRecord(scenename, uid);
            //console.log("---- USER "+uid+ "RECORD");
            }
        }

    // VRoadcast =====================
    ATON.vroadcast.setupResPath(ATON.FrontEnd.RES_ROOT);
    ATON.vroadcast.setUserModel(ATON.vroadcast.resPath+"assets/hmd/hmd-z-nt.osgjs");    

    var vrcIP = ATON.utils.getURLparams().vrc;
    if (vrcIP !== undefined){
        //IP = "127.0.0.1";
        //IP = "192.168.0.193";
        //IP = "192.167.233.180";
        //IP = "seth.itabc.cnr.it";

        ATON.vroadcast.uStateFreq = 0.01;
        ATON.vroadcast.connect("http://"+vrcIP+":8080/", scenename);

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
        };

    ATON.FrontEnd.attachListeners();

    ATON.FrontEnd.setupPage();
});