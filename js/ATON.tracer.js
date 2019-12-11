/*!
    @preserve

    ATON Trace/Record visualization
    depends on ATON.core

 	@author Bruno Fanini
	VHLab, CNR ITABC

==================================================================================*/

ATON.tracer = {};

ATON.tracer.FORMAT_STD = 0;
ATON.tracer.FORMAT_OVR = 1;

ATON.tracer.resPath = "res/";
ATON.tracer.rootRecordFolder = "record/";

ATON.tracer.CSV_DELIMITER = ',';
ATON.tracer.CSV_FORMAT    = ATON.tracer.FORMAT_STD;
ATON.tracer.fileRecordReq = 0;
ATON.tracer.discardSQmarkMin = 0.05; //0.005; // 0.002
ATON.tracer.discardSQmarkMax = 3.0; //0.05; //0.5;

ATON.tracer.activeVolume = undefined;
ATON.tracer.bActiveVol = false;
ATON.tracer.bLinkTarget = false;


ATON.tracer._groupVRC = undefined;
ATON.tracer._uMarkModels = [];
ATON.tracer._uSessions   = [];
ATON.tracer.tRange = [undefined, undefined];

ATON.tracer._tNorm = 0.0;
ATON.tracer._tRad  = 0.5;



ATON.tracer._touchVRCgroup = function(){
    if (ATON.tracer._groupVRC) return;

    ATON.tracer._groupVRC = new osg.Node();

    ATON.tracer._groupVRC.getOrCreateStateSet().setBinNumber(16);
    ATON.tracer._groupVRC.getOrCreateStateSet().setRenderingHint('TRANSPARENT_BIN');

    ATON.tracer._groupVRC.getOrCreateStateSet().setAttributeAndModes(
        //new osg.BlendFunc(osg.BlendFunc.SRC_ALPHA, osg.BlendFunc.ONE_MINUS_SRC_ALPHA), 
        new osg.BlendFunc(osg.BlendFunc.SRC_ALPHA, osg.BlendFunc.ONE_MINUS_SRC_ALPHA), 
        osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE
        );

    var df = new osg.Depth( osg.Depth.LESS ); // osg.Depth.ALWAYS
    df.setRange(0.0,1.0);
    df.setWriteMask(false); // important
    ATON.tracer._groupVRC.getOrCreateStateSet().setAttributeAndModes( df, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);

    //var D = new osg.Depth( osg.Depth.LESS );
    //D.setRange(0.0, 1.0);
    //ATON.tracer._groupVRC.getOrCreateStateSet().setAttributeAndModes( D );

    ATON._rootUI.addChild( ATON.tracer._groupVRC );
};

ATON.tracer.filter = function(){

    var tpivot = ATON.tracer.tRange[0] + ATON.tracer._tNorm*(ATON.tracer.tRange[1] - ATON.tracer.tRange[0]);

    tmin = tpivot - ATON.tracer._tRad;
    tmax = tpivot + ATON.tracer._tRad;

    //console.log("tPivot: "+tpivot);
    ATON.tracer.tminutes = Math.floor(tpivot / 60);
    ATON.tracer.tseconds = tpivot - (ATON.tracer.tminutes * 60);

    ATON.tracer.activeVolume = new osg.BoundingBox();
    ATON.tracer.bActiveVol   = false;

    for (let s = 0; s < ATON.tracer._uSessions.length; s++) {
        var us = ATON.tracer._uSessions[s];

        if (us){
            var uid = parseInt(us.getName());
            var minDT = undefined;
            var cmarkID = 0;

            //console.log("UID: "+uid);
            for (let at = 0; at < us.getChildren().length; at++) {
                var mark = us.getChild(at);
                
                tmark = parseFloat(mark.getName());
                var dt = Math.abs(tpivot - tmark);

                // keep track of closest mark
                if (minDT === undefined || dt < minDT ){
                    minDT = dt;
                    cmarkID = at;
                    }

                if (tmark > tmin && tmark < tmax){
                    mark.setNodeMask(0xf);

                    if (us.getChild(cmarkID)._boundingSphere){
                        ATON.tracer.activeVolume.expandByVec3(us.getChild(cmarkID)._boundingSphere._center);
                        ATON.tracer.bActiveVol = true;
                        //console.log(us.getChild(cmarkID));
                        }
                    }
                else mark.setNodeMask(0x0);
                }

            // switch on closest mark anyways
            if (us.getChild(cmarkID)) us.getChild(cmarkID).setNodeMask(0xf);
            }
        
    }

    //console.log(ATON.tracer.activeVolume);

    if (!ATON.tracer.bLinkTarget) return;

    if (ATON.tracer.bActiveVol){
        //ATON.requestPOV(ATON.tracer.activeVolume._center);
        //ATON._currPOV.target = ATON.tracer.activeVolume.center([]);
        var vPOV = new ATON.pov;

        vPOV.pos      = ATON._currPOV.pos.slice(0);
        vPOV.target   = ATON.tracer.activeVolume.center([]);
        vPOV.fov      = ATON._currPOV.fov;

        ATON.requestPOV(vPOV, 0.5);

        //ATON._currPOV.target[0] = ATON.tracer.activeVolume.center[0];
        //ATON._currPOV.target[1] = ATON.tracer.activeVolume.center[1];
        //ATON._currPOV.target[2] = ATON.tracer.activeVolume.center[2];
        }
};

// Encoding
ATON.tracer.encodingVolume = function(vMin, vMax){
    this.vMin = vMin;
    this.vMax = vMax;

    this.imgPath = undefined;
};

ATON.tracer.encodingVolume.prototype = {
    setIMGpath: function(path){
        this.imgPath = path;
        },
};


// Load single user recorded trace
ATON.tracer.loadUserRecord = function(scenename, uid){
    ATON.tracer._touchVRCgroup();

    // This will host our user session
    var uSession = new osg.Node();
    uSession.setName(uid);
    ATON.tracer._groupVRC.addChild( uSession );
    
    ATON.tracer._uSessions.push(uSession);


    path = ATON.tracer.rootRecordFolder + scenename+ "/U"+uid+".csv";

    ATON.tracer.fileRecordReq++;
    console.log("[R] LOADING "+path+"....");

    $.get( path, function(data){
        var lines = data.split("\n");

        var bHeader = true;
        var attrNames = [];

        var pos = osg.vec3.create();
        var foc = osg.vec3.create();
        var ori = osg.quat.create();

        var markp      = osg.vec3.create();
        var markp_prev = osg.vec3.create();

        var prevfoc = osg.vec3.create();
        var prevpos = osg.vec3.create();

        var t = undefined;

        var marks = 0;

        // For each row
        $.each(lines, function(n, elem){
            var values = elem.split(ATON.tracer.CSV_DELIMITER);

            // For each column
            var numCols = values.length;
            for (var i = 0; i < numCols; i++){
                var currVal = values[i].trim();

                // Header row
                if (bHeader) attrNames.push( currVal );
                else {
                    if (ATON.tracer.CSV_FORMAT == ATON.tracer.FORMAT_OVR){
                        t = (n * 0.1);
                        //console.log(t);

                        if (attrNames[i] === 'X' && currVal.length>0) pos[0] = parseFloat(currVal);
                        if (attrNames[i] === 'Y' && currVal.length>0) pos[1] = parseFloat(currVal);
                        if (attrNames[i] === 'Z' && currVal.length>0) pos[2] = parseFloat(currVal);

                        if (attrNames[i] === 'OriX' && currVal.length>0) ori[0] = parseFloat(currVal);
                        if (attrNames[i] === 'OriY' && currVal.length>0) ori[1] = parseFloat(currVal);
                        if (attrNames[i] === 'OriZ' && currVal.length>0) ori[2] = parseFloat(currVal);
                        if (attrNames[i] === 'OriW' && currVal.length>0) ori[3] = parseFloat(currVal);
                        }

                    else {
                        if (attrNames[i] === 'Time' && currVal.length>0) t = parseFloat(currVal);

                        if (attrNames[i] === 'px' && currVal.length>0) pos[0] = parseFloat(currVal);
                        if (attrNames[i] === 'py' && currVal.length>0) pos[1] = parseFloat(currVal);
                        if (attrNames[i] === 'pz' && currVal.length>0) pos[2] = parseFloat(currVal);

                        if (attrNames[i] === 'fx' && currVal.length>0) foc[0] = parseFloat(currVal);
                        if (attrNames[i] === 'fy' && currVal.length>0) foc[1] = parseFloat(currVal);
                        if (attrNames[i] === 'fz' && currVal.length>0) foc[2] = parseFloat(currVal);

                        if (attrNames[i] === 'ox' && currVal.length>0) ori[0] = parseFloat(currVal);
                        if (attrNames[i] === 'oy' && currVal.length>0) ori[1] = parseFloat(currVal);
                        if (attrNames[i] === 'oz' && currVal.length>0) ori[2] = parseFloat(currVal);
                        if (attrNames[i] === 'ow' && currVal.length>0) ori[3] = parseFloat(currVal);
                        }
                    }

                }

            // The whole row is parsed at this point, add mark
            if (!bHeader){
                // Update temporal ranges
                if (ATON.tracer.tRange[0] === undefined || t < ATON.tracer.tRange[0]) ATON.tracer.tRange[0] = t;
                if (ATON.tracer.tRange[1] === undefined || t > ATON.tracer.tRange[1]) ATON.tracer.tRange[1] = t;

                markp[0] = pos[0]; // pos[0];
                markp[1] = pos[1]; // pos[1];
                markp[2] = pos[2]; // pos[2];

                var dMark = osg.vec3.squaredDistance(markp, markp_prev);
                if (dMark >= ATON.tracer.discardSQmarkMax){
                    markp_prev[0] = markp[0];
                    markp_prev[1] = markp[1];
                    markp_prev[2] = markp[2];
                    }

                if (dMark > ATON.tracer.discardSQmarkMin && dMark < ATON.tracer.discardSQmarkMax){
                    //var at = new osg.MatrixTransform();
                    //osg.mat4.fromRotationTranslation(at.getMatrix(), ori, foc);

                    var at = new osg.AutoTransform();
                    
                    at.setName(t); // timestamp

                    at.setPosition([markp[0],markp[1],markp[2],0]);
                    at.setAutoRotateToScreen(true);
                    //at.setAutoScaleToScreen(true);

                    // First time
                    if (ATON.tracer._uMarkModels[uid] === undefined){
                        var size = 1.5; //200.0;

                        ATON.tracer._uMarkModels[uid] = osg.createTexturedQuadGeometry(
                            -(size*0.5), -(size*0.5), 0.0,   // corner
                            size, 0, 0.0,                    // width
                            0, size, 0.0 );                  // height

                        osgDB.readImageURL(ATON.tracer.resPath+"assets/mark"+uid+".png").then( function ( data ){
                            var bgTex = new osg.Texture();
                            bgTex.setImage( data );
                    
                            bgTex.setMinFilter( osg.Texture.LINEAR_MIPMAP_LINEAR ); // LINEAR_MIPMAP_LINEAR // osg.Texture.LINEAR
                            bgTex.setMagFilter( osg.Texture.LINEAR ); // osg.Texture.LINEAR
                            
                            bgTex.setWrapS( osg.Texture.CLAMP_TO_EDGE );
                            bgTex.setWrapT( osg.Texture.CLAMP_TO_EDGE );
                    
                            ATON.tracer._uMarkModels[uid].getOrCreateStateSet().setTextureAttributeAndModes(0, bgTex);
                            console.log("User"+uid+" mark texture loaded");
                            });
                        }

                    at.addChild( ATON.tracer._uMarkModels[uid] );
                    uSession.addChild( at );

                    marks++;
                    
                    markp_prev[0] = markp[0];
                    markp_prev[1] = markp[1];
                    markp_prev[2] = markp[2];
                    //console.log(x,y,z);
                    }
                }

            bHeader = false;
            });

        ATON.tracer.fileRecordReq--;

        // All loaded
        if (ATON.tracer.fileRecordReq <= 0){
            console.log("All record files loading COMPLETE!");
            console.log(ATON.tracer.tRange);

            ATON.tracer.onAllFileRequestsCompleted();
            }
        });
};


ATON.tracer.onAllFileRequestsCompleted = function(){
    //ATON.tracer.filter(0.8, 0.3);
};