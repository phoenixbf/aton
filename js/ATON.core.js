/*!
    @preserve

 	ATON js Library

 	@author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/

'use strict';

var OSG         = window.OSG;
var osg         = OSG.osg;
var osgDB       = OSG.osgDB;
var osgViewer   = OSG.osgViewer;
var osgUtil     = OSG.osgUtil;
var osgGA       = OSG.osgGA;
var osgText     = OSG.osgText;
var InputGroups = OSG.osgViewer.InputGroups;

var ATON = ATON || {};

const ATON_STD_FOV          = 60.0;
const ATON_STD_POV_DURATION = 2.0;

const ATON_NEARFARRATIO_STD = 0.0005;
const ATON_NEARFARRATIO_VR  = 0.0003;

const ATON_RAD2DEG          = (180.0 / Math.PI);
const ATON_DEG2RAD          = (Math.PI / 180.0);

const ATON_X_AXIS = osg.vec3.fromValues(1.0,0.0,0.0);
const ATON_Y_AXIS = osg.vec3.fromValues(0.0,1.0,0.0);
const ATON_Z_AXIS = osg.vec3.fromValues(0.0,0.0,1.0);

const ATON_VR_CONTROLLER_L = 0;
const ATON_VR_CONTROLLER_R = 1;

const SORT_C2F = function( a, b ){ return a._ratio - b._ratio; };
const COSINOIDAL_DIST = function(x){ return (1.0 - Math.cos(x * Math.PI)) / 2.0; }

// PBR Units
const ATON_SM_UNIT_BASE  = 0;
const ATON_SM_UNIT_AO    = 1;
const ATON_SM_UNIT_NORM  = 2;
const ATON_SM_UNIT_COMBO = 3;
const ATON_SM_UNIT_LP    = 4;

// NodeMasks
const ATON_MASK_VISIBLE     = (1 << 2);
const ATON_MASK_DESCRIPTORS = (1 << 3);
const ATON_MASK_UI          = (1 << 4);
const ATON_MASK_NO_PICK     = (1 << 5);


// ATON Initialization
//==========================================================================
ATON._canvas   = undefined;
ATON._isMobile = false;
ATON._useLP    = false;
ATON._baseDevicePixelRatio = 1;
ATON._vrResMult = 2.0; // Res-multiplier for mobile HMDs
ATON._currFPS = 60.0;
ATON._dynamicFPSrange = [30.0,60.0];

// STD resource folders
ATON.shadersFolder = "shaders";

// VR
ATON._vrState = false;
ATON._vrNode  = undefined;
ATON._VR = {};
ATON._VR.hmdNormPos = [0.0,0.0];

ATON._activeVRcontrollers = [false, false];
ATON._vrControllersPos    = [osg.vec3.create(), osg.vec3.create()];
ATON._vrControllersDir    = [osg.vec3.create(), osg.vec3.create()];

// Assets/Node Loading
ATON._nodeReqs = 0;

// QUERIES
ATON.STD_D_ORI_DESKTOP = 0.999;
ATON.STD_D_POS_DESKTOP = 0.02;
ATON.STD_D_ORI_MOBILE  = 0.999999;
ATON.STD_D_POS_MOBILE  = 0.000005;


ATON._LSIdesc = new osgUtil.LineSegmentIntersector();
ATON._IVdesc  = new osgUtil.IntersectionVisitor();
ATON._LSIvis  = new osgUtil.LineSegmentIntersector();
ATON._IVvis   = new osgUtil.IntersectionVisitor();

// Not used (and deprecated)
//ATON._reservedHitsMatrixStack = new osg.MatrixMemoryPool();

ATON._numDescriptors        = 0;
ATON._pickedDescriptorsPath = []; // Array of unique names (picked descriptors-path)
ATON._pickedDescriptorData  = undefined; // 3D point & norm of picked descriptor
//ATON._hoveringDescriptor    = false;
ATON._hoveredDescriptor     = undefined;
ATON._screenQuery           = osg.vec2.create();
ATON._screenQueryNormalized = osg.vec2.create();    // in 0--1
ATON._hoveredVisData        = undefined; // hovered 3D point & norm in visible graph
ATON._bQueryAxisAligned     = false;
ATON._bQueryUseOcclusion    = true;

ATON._bZflat = false;

// NAV
ATON._bFirstPersonMode = false;
ATON._tPOVprogress     = 0.0;
ATON._povLerP          = osg.vec3.create();
ATON._povLerT          = osg.vec3.create();
//ATON._surfAff          = 0.0;

ATON._polForce = 0.0;
ATON._polPos   = undefined;
ATON._qpVal    = [0,0,0,0];

// RTT colliders
ATON._frontDistance      = 0.0;
ATON._frontCollideNormal = osg.vec3.create();
ATON._bUseCollisions     = false;
ATON._sensorLookAhead    = 40.0;
ATON._collideShape       = osg.vec2.fromValues(0.25,1.6);
ATON._direction          = osg.vec3.create();

ATON._bUseGravity  = false;
ATON._gDist        = -1; // curr fall distance
ATON._tLastGravImp = 0.0;
ATON._bGravImpact  = false;
ATON._vLastIH      = 0.0;
ATON._gSenseTop    = osg.vec3.create();
ATON._gSenseBottom = osg.vec3.create();
ATON._vVelocity    = osg.vec3.create();

ATON._bSensorZready = false;

// LPs
ATON._mLProtation = osg.mat4.create();

// Measurements
ATON.measurements = [];
ATON._bMeasuring = false;
ATON._measurePoint = undefined;

// User custom functions/event control
ATON.onTickRoutines = [];

// Transform anim.
ATON._reqTransAnim = [];

// Centralized custom event handling
ATON.eventHandlers = {};

ATON.registerEvents = function(evtList){
    for (let e = 0; e < evtList.length; e++) {
        let evtname = evtList[e];
        //ATON.on(evtname, undefined);
        ATON.eventHandlers[evtname] = [];
        }
};

// Add handler for this event
ATON.on = function(evtname, handler){
    // First time (event not registered)
    if (!ATON.eventHandlers[evtname]) ATON.eventHandlers[evtname] = [];

    //ATON.eventHandlers[evtname] = handler;
    ATON.eventHandlers[evtname].push(handler);
    //console.log("Custom event handler for '"+evtname+ "' registered.");
};

ATON.clearEventHandlers = function(evtname){
    ATON.eventHandlers[evtname] = [];
};

// Fire all handlers for this event
ATON.fireEvent = function(evtname, data){
    let ehList = ATON.eventHandlers[evtname];
    if (!ehList) return;
    
    for (let h = 0; h < ehList.length; h++) {
        let handler = ehList[h];
        if (handler) handler(data);
        }

/*
    var f = ATON.eventHandlers[evtname];
    if (!f){
        //console.log("Warning: event "+evtname+" not registered.");
        return undefined;
        }

    return f(param);
*/
};

//ATON.on("myEvent", function(txt){ console.log(txt); });
//ATON._fireEvtHandler("onSample", 'ciao');
ATON.registerEvents([
    "MouseRightButton",
    "MouseMidButton",

    "KeyPress",

    "ShapeDescriptorHovered",
    "ShapeDescriptorSelected",
    "ShapeDescriptorLeft",
    
    "NodeRequestFired",
    "NodeRequestCompleted",
    "AllNodeRequestsCompleted",
    "NodeSwitch",
    
    "VRmode",
    "LeftGamepadButtonPress",
    "RightGamepadButtonPress",
    "LeftGamepadAxes",
    "RightGamepadAxes",
    
    "SpeechRecognition",
    "SpeechRecognitionText"
]);
//console.log(ATON.eventHandlers);


// Speech
ATON._bPlayingT2S = false;  // is playing text2speech audio


// ATON Utils
//==========================================================================
ATON.utils = {};

ATON.utils.videoExts = [ "mp4", "avi", "ogg", "ogv", "webm", "mpd" ];

ATON.utils.getFileExtension = function( filepath ){
	return filepath.substr(filepath.lastIndexOf('.')+1).toLowerCase();
};

ATON.utils.getBaseFolder = function( filepath ){
    var index  = filepath.lastIndexOf( '/' );
    if ( index !== -1 ) return filepath.substring( 0, index + 1 );
    return '';
};

ATON.utils.isURLvideo = function(url){
	var fExt = this.getFileExtension(url);

    for (var j = 0; j < DPFutils.videoExts.length; j++) {
        var sCurExtension = DPFutils.videoExts[j];
        if (fExt == sCurExtension.toLowerCase()) return true;
        }
	return false;
};

ATON.utils.detectMobileDevice = function(){
    if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
    || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))){
        return true;
        }

    return false;
};

// Detect HW capabilities
ATON.utils.detectDeviceCapab = function(){

    ATON._isMobile = ATON.utils.detectMobileDevice();

    let gl = ATON._canvas.getContext('experimental-webgl');
    if (gl == null){ 
        gl = ATON._canvas.getContext('webgl');
        }

    if(gl != null){ // WebGL is supported 

        let highp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
        ATON._bHighP     = (highp.precision != 0);
        ATON._maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);

        if (ATON._maxTexSize <= 4096) ATON._isMobile = true;

        console.log("HighP support: "+ATON._bHighP);
        console.log("Max Texture size: "+ATON._maxTexSize);
        }

    else{ // WebGL is not supported
        console.log("WebGL not supported. Time to upgrade ur phone m8");
        }

    console.log("Mobile device: "+ATON._isMobile);
};

ATON.utils.lerp = function(a,b, t){
    return (a + (t * (b - a)));
};


// From https://www.sitepoint.com/get-url-parameters-with-javascript/
/*
    E.g.:
    ATON.utils.getURLparams().product; // 'shirt'
    ATON.utils.getURLparams().color; // 'blue'
    ATON.utils.getURLparams().newuser; // true
    ATON.utils.getURLparams().nonexistent; // undefined
    ATON.utils.getURLparams('http://test.com/?a=abc').a; // 'abc'
*/
ATON.utils.getURLparams = function(url){

    // get query string from url (optional) or window
    var queryString = url ? url.split('?')[1] : window.location.search.slice(1);

    // we'll store the parameters here
    var obj = {};

    // if query string exists
    if (queryString) {

    // stuff after # is not part of query string, so get rid of it
    queryString = queryString.split('#')[0];

    // split our query string into its component parts
    var arr = queryString.split('&');

    for (var i=0; i<arr.length; i++){
        // separate the keys and the values
        var a = arr[i].split('=');

        // in case params look like: list[]=thing1&list[]=thing2
        var paramNum = undefined;
        var paramName = a[0].replace(/\[\d*\]/, function(v) {
            paramNum = v.slice(1,-1);
            return '';
            });

        // set parameter value (use 'true' if empty)
        var paramValue = typeof(a[1])==='undefined' ? true : a[1];

        // (optional) keep case consistent
        paramName  = paramName.toLowerCase();
        paramValue = paramValue.toLowerCase();

        // if parameter name already exists
        if (obj[paramName]) {
            // convert value to array (if still string)
            if (typeof obj[paramName] === 'string') {
                obj[paramName] = [obj[paramName]];
                }
            // if no array index number specified...
            if (typeof paramNum === 'undefined') {
                // put the value on the end of the array
                obj[paramName].push(paramValue);
                }
            // if array index number specified...
            else {
                // put the value at that index number
                obj[paramName][paramNum] = paramValue;
                }
            }
        // if param name doesn't exist yet, set it
        else {
            obj[paramName] = paramValue;
            }
        }
  }

  return obj;
};

ATON.utils.clamp = function(v, a,b){
    if (v < a) return a;
    if (v > b) return b;
    return v;
};


// Fallbacks
ATON.utils.bkIM       = new window.Image();
ATON.utils.bkIM.src   = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNg+A8AAQIBANEay48AAAAASUVORK5CYII=';
ATON.utils.wIM        = new window.Image();
ATON.utils.wIM.src    = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIW2P8DwQACgAD/il4QJ8AAAAASUVORK5CYII=';
ATON.utils.normIM     = new window.Image();
ATON.utils.normIM.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAMAAABFaP0WAAAAA1BMVEV/f/99cpgDAAAACklEQVR4AWMAAwAABgABeV6XjwAAAABJRU5ErkJggg==';
ATON.utils.redIM      = new window.Image();
ATON.utils.redIM.src  = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAMAAAAoyzS7AAAAA1BMVEX/AAAZ4gk3AAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==';
ATON.utils.aIM        = new window.Image();
ATON.utils.aIM.src    = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAMAAABFaP0WAAAAA1BMVEX///+nxBvIAAAAAXRSTlMAQObYZgAAAApJREFUeAFjAAMAAAYAAXlel48AAAAASUVORK5CYII=';

ATON.utils.fallbackBlackTex = new osg.Texture();
ATON.utils.fallbackBlackTex.setImage( ATON.utils.bkIM );
ATON.utils.fallbackBlackTex.setMinFilter( osg.Texture.LINEAR );
ATON.utils.fallbackBlackTex.setMagFilter( osg.Texture.LINEAR );
ATON.utils.fallbackBlackTex.setWrapS( osg.Texture.REPEAT );
ATON.utils.fallbackBlackTex.setWrapT( osg.Texture.REPEAT );

ATON.utils.fallbackWhiteTex = new osg.Texture();
ATON.utils.fallbackWhiteTex.setImage( ATON.utils.wIM );
ATON.utils.fallbackWhiteTex.setMinFilter( osg.Texture.LINEAR );
ATON.utils.fallbackWhiteTex.setMagFilter( osg.Texture.LINEAR );
ATON.utils.fallbackWhiteTex.setWrapS( osg.Texture.REPEAT );
ATON.utils.fallbackWhiteTex.setWrapT( osg.Texture.REPEAT );

ATON.utils.fallbackNormTex = new osg.Texture();
ATON.utils.fallbackNormTex.setImage( ATON.utils.normIM );
ATON.utils.fallbackNormTex.setMinFilter( osg.Texture.LINEAR );
ATON.utils.fallbackNormTex.setMagFilter( osg.Texture.LINEAR );
ATON.utils.fallbackNormTex.setWrapS( osg.Texture.REPEAT );
ATON.utils.fallbackNormTex.setWrapT( osg.Texture.REPEAT );

ATON.utils.fallbackRedTex = new osg.Texture();
ATON.utils.fallbackRedTex.setImage( ATON.utils.redIM );
ATON.utils.fallbackRedTex.setMinFilter( osg.Texture.LINEAR );
ATON.utils.fallbackRedTex.setMagFilter( osg.Texture.LINEAR );
ATON.utils.fallbackRedTex.setWrapS( osg.Texture.REPEAT );
ATON.utils.fallbackRedTex.setWrapT( osg.Texture.REPEAT );

ATON.utils.fallbackAlphaTex = new osg.Texture();
ATON.utils.fallbackAlphaTex.setImage( ATON.utils.aIM );
ATON.utils.fallbackAlphaTex.setMinFilter( osg.Texture.LINEAR );
ATON.utils.fallbackAlphaTex.setMagFilter( osg.Texture.LINEAR );
ATON.utils.fallbackAlphaTex.setWrapS( osg.Texture.REPEAT );
ATON.utils.fallbackAlphaTex.setWrapT( osg.Texture.REPEAT );

// Create and fill texture with uniform color (vec3 or vec4) 
ATON.utils.createFillTexture = function(col){
    var data = new osg.Uint8Array(4);

    data[0] = col[0] * 255.0;
    data[1] = col[1] * 255.0;
    data[2] = col[2] * 255.0;
    if (col.length === 4) data[3] = col[3] * 255.0;
    else data[3] = 255;

    var tex = new osg.Texture();
    tex.setTextureSize(1,1);
    tex.setImage(data);
    tex.setMinFilter( osg.Texture.LINEAR );
    tex.setMagFilter( osg.Texture.LINEAR );
    tex.setWrapS( osg.Texture.REPEAT );
    tex.setWrapT( osg.Texture.REPEAT );

    return tex;

/*
    let canvas1 = document.createElement('canvas');
    let ctx = canvas1.getContext('2d');
    canvas1.width  = 1;
    canvas1.height = 1;
    
    ctx.fillStyle = 'rgba(' + [col[0]*255.0, col[1]*255.0, col[2]*255.0, col[3]].join() + ')';
    ctx.fillRect(0,0,1,1);
    // 'data:image/png;base64,'.length => 22
    //var b64 = "data:image/png;base64," + // canvas1.toDataURL('image/png','');
    var b64 = canvas1.toDataURL('image/png',''); //.substring(22);
    //console.log(b64);
    
    var img = new window.Image();
    img.src = b64;

    //console.log(img);
    var tex = new osg.Texture();
    tex.setImage( img );
    tex.setMinFilter( osg.Texture.LINEAR );
    tex.setMagFilter( osg.Texture.LINEAR );
    tex.setWrapS( osg.Texture.REPEAT );
    tex.setWrapT( osg.Texture.REPEAT );

    return tex;
*/
};

// Auxiliary
// Get node names top-bottom from given nodepath
ATON.utils._getPickedNodeNames = function(np){
    var uNames = [];

    // search in the node path
    for ( var i = 0; i < np.length; i++ ) {
        //if ( np[i] instanceof osg.Node ) {
            //osg.log( 'Text picked: ' + closestNP[ i ].getName() );
            if (np[i].getName() !== undefined) uNames.push(np[i].getName()); //return np[i].getName();
        //    }
        }

    //console.log(uNames);
    return uNames;
};

ATON.utils.reflect = function(v, n){
	var r = osg.vec3.create();
	r[0] = n[0] * (n[0] * v[0]);
    r[1] = n[1] * (n[1] * v[1]);
    r[2] = n[2] * (n[2] * v[2]);

	r[0] = v[0] - (r[0] * 2.0);
    r[1] = v[1] - (r[1] * 2.0);
    r[2] = v[2] - (r[2] * 2.0);
	
    osg.vec3.normalize(r,r);

	return r;
};

// VISITORS
// Search a node by name in a subgraph
ATON.utils.findByNameVisitor = function ( name ) {
    osg.NodeVisitor.call( this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN );
    this._name = name;
};

ATON.utils.findByNameVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {
    init: function () {
        this.found = undefined;
        },
    apply: function ( node ) {
        if ( node.getName() === this._name ) {
            this.found = node;
            return;
            }
        this.traverse( node );
        }
});

// Clear node-names in the whole subgraph
ATON.utils.clearNamesVisitor = function(){
    osg.NodeVisitor.call( this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN );
    };

ATON.utils.clearNamesVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {
    init: function () {
        //
        },
    apply: function ( node ) {
        if ( node.getName() !== undefined && node.getName().length>0 ) node._name = undefined;
        this.traverse( node );
        }
});

// 
ATON.utils.dbPathVisitor = function ( dbpath ) {
    osg.NodeVisitor.call( this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN );
    this._dbpath = dbpath;
};

ATON.utils.dbPathVisitor.prototype = osg.objectInherit( osg.NodeVisitor.prototype, {
    init: function () {
        //this.found = undefined;
        },
    apply: function ( node ) {
        var self = this;
        if ( node.getTypeID() === osg.PagedLOD.getTypeID()) {
            node._databasePath = self._dbpath;
            //console.log("DBPathV: "+node._centerMode);
            }
        this.traverse( node );
        }
});

// Procedural utils
//================================================================
ATON.utils.generateMatrixFromString = function( transtring ){
    let M = osg.mat4.create();

    // split by (multiple) whitespaces
    let values = transtring.trim().split(/\s+/).map(parseFloat);
    if (values.length < 3) return undefined;

    let vTrans = osg.vec3.fromValues(values[0],values[1],values[2]);

    // Translate
    osg.mat4.translate(M, M, vTrans );
    //console.log('Trans: '+values[0]+' '+values[1]+' '+values[2]);

    if (values.length >= 6){
        let rmx = osg.mat4.create();
        let rmy = osg.mat4.create();
        let rmz = osg.mat4.create();

        osg.mat4.rotate(rmx, rmx, values[3], ATON_X_AXIS);
        osg.mat4.rotate(rmy, rmy, values[4], ATON_Y_AXIS);
        osg.mat4.rotate(rmz, rmz, values[5], ATON_Z_AXIS);

        //osg.Matrix.preMult( M, rm );

        osg.mat4.multiply(M, M, rmx);
        osg.mat4.multiply(M, M, rmy);
        osg.mat4.multiply(M, M, rmz);

        //console.log('Rot: '+values[3]+' '+values[4]+' '+values[5]);

        if (values.length >= 9){
            let vScale = osg.vec3.fromValues(values[6],values[7],values[8]);

            // Scale
            let sm = osg.mat4.create();
            osg.mat4.fromScaling( sm, vScale);

            osg.mat4.multiply(M, M,sm);
            //console.log('Scale: '+values[6]+' '+values[7]+' '+values[8]);
            }
        }
    
    return M;
};

ATON.utils.generateTransformFromString = function( transtring ){
    var T = new osg.MatrixTransform();
    if (!transtring || transtring.length < 3) return undefined;

    T.setMatrix( ATON.utils.generateMatrixFromString(transtring) );
    return T;
};

// async
ATON.utils.generateTransformListFromASCII = function(instfileURL, onSuccess){
	$.get( instfileURL, function(data){
        let tlist = [];
        
        let lines = data.split("\n");
        let len = lines.length;

        //console.log(lines);

        for (let t = 0; t < len; t++){
            var T = ATON.utils.generateTransformFromString( lines[t].trim() );
            if (T) tlist.push(T); // filter only valid transforms
            }

        console.log("Generated TransformList ("+tlist.length+" elements)");
        if (onSuccess) onSuccess(tlist);

    }, "text")
    .fail( function(){ // Failed to load
        console.log("ERROR Loading "+instfileURL);
        });
};

// DEPRECATE?
ATON.utils.generateProduction = function(template, instfileURL, prodGroup){
    if (template === undefined) return;
    if (prodGroup === undefined) return;

    //console.log('Loading inst file: '+instfileURL);

    var count = 0;

	$.get( instfileURL, function(data){
        var lines = data.split("\n");
        var len = lines.length;

        for (var t = 0; t < len; t++){
            //if (t==0) prodGroup = new osg.Node();
            var T = ATON.utils.generateTransformFromString( lines[t] );

            if (T !== undefined){
                T.addChild( template );
                prodGroup.addChild( T );
                count = count+1;
                }
            }
/*
        if (node.getTypeID() === osg.PagedLOD.getTypeID()){
            //console.log('--- PLOD ---');
            var r = node.getBound().radius();
            prodGroup.dirtyBound();
            var R = prodGroup.getBound().radius();

            var mrFactor = mrSQpxFactor * (r/R);

            node.setRange(0, 0.0, mrFactor );
            node.setRange(1, mrFactor, Number.MAX_VALUE );
            }
*/
		}, "text")
        .fail( function(){ // Failed to load
            console.log("ERROR Loading "+instfileURL);
            prodGroup.addChild( template );
            });
};

// https://medium.com/@dee_bloo/make-multithreading-easier-with-inline-web-workers-a58723428a42
ATON.utils.createWorker = function(fn){
    var blob = new Blob(['self.onmessage = ', fn.toString()], { type: 'text/javascript' });
    var url = URL.createObjectURL(blob);
  
    return new Worker(url);
}

// https://css-tricks.com/converting-color-spaces-in-javascript/
ATON.utils.hexToRGBlin = function(h){
    let r = 0, g = 0, b = 0;

    // 3 digits
    if (h.length == 4) {
        r = "0x" + h[1] + h[1];
        g = "0x" + h[2] + h[2];
        b = "0x" + h[3] + h[3];
        }
  // 6 digits
    else if (h.length == 7) {
        r = "0x" + h[1] + h[2];
        g = "0x" + h[3] + h[4];
        b = "0x" + h[5] + h[6];
        }

    r = +(r / 255).toFixed(3);
    g = +(g / 255).toFixed(3);
    b = +(b / 255).toFixed(3);

    return [r,g,b];
}


// HDR
/*
ATON.utils._decodeHDRHeader = function( buf ){
    var info = {
        exposure: 1.0
        };

    // find header size
    var size = -1,
        size2 = -1,
        i;
    for ( i = 0; i < buf.length - 1; i++ ) {
        if ( buf[ i ] === 10 && buf[ i + 1 ] === 10 ) {
            size = i;
            break;
        }
    }
    for ( i = size + 2; i < buf.length - 1; i++ ) {
        if ( buf[ i ] === 10 ) {
            size2 = i;
            break;
        }
    }

    // convert header from binary to text lines
    var header = String.fromCharCode.apply( null, new Uint8Array( buf.subarray( 0, size ) ) ); // header is in text format
    var lines = header.split( '\n' );
    if ( lines[ 0 ] !== '#?RADIANCE' ) {
        console.error( 'Invalid HDR image.' );
        return false;
    }

    var line;
    var matches;
    for ( i = 0; i < lines.length; i++ ) {
        line = lines[ i ];
        matches = line.match( /(\w+)=(.*)/i );
        if ( matches !== null ) {
            var key = matches[ 1 ],
                value = matches[ 2 ];

            if ( key === 'FORMAT' )
                info.format = value;
            else if ( key === 'EXPOSURE' )
                info.exposure = parseFloat( value );
        }
    }

    // fill image resolution
    line = String.fromCharCode.apply( null, new Uint8Array( buf.subarray( size + 2, size2 ) ) );
    matches = line.match( /-Y (\d+) \+X (\d+)/ );
    info.width = parseInt( matches[ 2 ] );
    info.height = parseInt( matches[ 1 ] );
    info.scanlineWidth = parseInt( matches[ 2 ] );
    info.numScanlines = parseInt( matches[ 1 ] );

    info.size = size2 + 1;
    return info;
};
*/

ATON.getWorldTransform = function(){
    return ATON._worldTransform;
};

ATON.getRootScene = function(){
    return ATON._rootScene;
};
ATON.getRootDescriptors = function(){
    return ATON._rootDescriptors;
};
ATON.getRootUI = function(){
    return ATON._rootUI;
};

ATON.getNode = function(id){
    return ATON.nodes[id];
};

/* 
    Scene-graphs
==========================================================================*/

// Internal use
// Factory to craft API-enriched nodes from base node N
ATON.createNode = function(N, mask){
    N.bLoading = false;
    N.assetURL = undefined;

    N._graph   = mask; // type of graph this node belongs
    N._intMask = mask; // internal mask
    
    N._bShow   = true;
    N._bHasID  = false;

    // Base routines
    // Assign unique ID to this node and store it for fast retrieval
    N.as = function(id){
        if (this._bHasID){
            console.log("This node already has ID");
            return this;
            }

        this._name = id;
        if (this._graph === ATON_MASK_VISIBLE) ATON.nodes[id] = this;
        if (this._graph === ATON_MASK_DESCRIPTORS) ATON.descriptors[id] = this;

        this._bHasID  = true;
        return this;
        };

    N.getUniqueID = function(){
        return this._name;
        };

    // shorthand to retrieve stateset
    N.getSS = function(){
        return this.getOrCreateStateSet();
        };
    N.setSS = function(ss){
        this.setStateSet(ss);
        return this;
        };

    // Show/Hide the node
    N.show = function(){
        this._bShow = true;
        this.nodeMask = this._intMask;
        if (this._graph === ATON_MASK_VISIBLE) ATON._buildKDTree(ATON._rootScene);
        ATON.fireEvent("NodeSwitch", { name: this._name, value: true });
        return this;
        };
    N.hide = function(){
        this._bShow = false;
        this.nodeMask = 0x0;
        ATON.fireEvent("NodeSwitch", { name: this._name, value: false });
        return this;
        };
    N.switch = function(b){
        if (b) return this.show();
        else return this.hide();
        };
    N.toggle = function(){
        if (this._bShow) return this.hide();
        else return this.show();
        };
    N.isActive = function(){
        return this._bShow;
        };

    N.disablePicking = function(){
        this.nodeMask = ATON_MASK_NO_PICK;
        this._intMask = ATON_MASK_NO_PICK;
        return this;
        };
    N.enablePicking = function(){
        this.nodeMask = this._graph;
        this._intMask = this._graph;
        return this;
        };

    // Add a child node (also by ID)
    N.add = function(node){
        let N = undefined;

        if (this._graph === ATON_MASK_VISIBLE)     N = (typeof node === 'string')? ATON.nodes[node] : node;
        if (this._graph === ATON_MASK_DESCRIPTORS) N = (typeof node === 'string')? ATON.descriptors[node] : node;

        return this.addChild(N);
        };

    // Attach to root
    N.attachToRoot = function(){
        if (this._graph === ATON_MASK_VISIBLE){
            ATON._rootScene.addChild(this);
            return ATON._rootScene;
            }
        if (this._graph === ATON_MASK_DESCRIPTORS){
            ATON._rootDescriptors.addChild(this);
            return ATON._rootDescriptors;
            }
        };

    // Attach to parent node by ID or node object
    N.attachTo = function(parent){
        let P = undefined;
        if (this._graph === ATON_MASK_VISIBLE)     P = (typeof parent === 'string')? ATON.nodes[parent] : parent;
        if (this._graph === ATON_MASK_DESCRIPTORS) P = (typeof parent === 'string')? ATON.descriptors[parent] : parent;

        if (P) P.addChild(this);
        
        return P;
        };

    // Load a custom GLSL shader for this node
    N.loadCustomShaders = function(glslpath, predirectives, onComplete){
        this._glslPath = glslpath;
        let node = this;
    
        $.get( glslpath, function(glsldata){
            glsldata = ATON._addGLSLprecision(glsldata);
    
            // Pre-directives
            if (ATON._isMobile) glsldata = "#define MOBILE_DEVICE 1\n" + glsldata;
            if (predirectives)  glsldata = predirectives + glsldata;
    
            glsldata += '\n';
    
            var program = new osg.Program(
                new osg.Shader( 'VERTEX_SHADER', "#define VERTEX_SH 1\n" + glsldata ),
                new osg.Shader( 'FRAGMENT_SHADER', "#define FRAGMENT_SH 1\n" + glsldata )
                );
    
            node.getOrCreateStateSet().setAttributeAndModes( program );
    
            if (onComplete) onComplete();
            }, "text");

        return this;
        };

    // Transform routines (if this node is transformable)
    N.transformByMatrix = function(m){
        let M = this.matrix;
        if (!M) return this;
        
        this.setMatrix(m);
        return this;
        };

    N.transformByString = function(line){
        let M = this.matrix;
        if (!M) return this;
        
        this.setMatrix( ATON.utils.generateMatrixFromString(line) );
        return this;
        };

    N.translate = function(v){
        let M = this.matrix;
        if (!M) return this;

        osg.mat4.setTranslation(M, v );
        return this;
        };
    N.rotateAround = function(radians, axis){
        let M = this.matrix;
        if (!M) return this;

        osg.mat4.rotate(M,M, radians, axis); // ATON_Z_AXIS
        return this;
        };
    N.scale = function(s){
        let M = this.matrix;
        if (!M) return this;

        if (Array.isArray(s)) osg.mat4.scale(M,M, s );
        else osg.mat4.scale(M,M, [s,s,s] );

        return this;
        };

    N.requestTransformAnimation = function(tgtMatrix, duration){
        let M = this.matrix;
        if (!M) return this;

        ATON._reqTransAnim.push({
            from: M.slice(0),
            to: tgtMatrix,
            dur: (duration)? duration : 1.0,
            tcall: ATON._time
            });

        return this;
        };

    // Misc
    // Set a base tint (base texture, unit 0)
    N.setBaseColor = function(color, unit, onlymissing){
        let u = (unit)? unit : 0;
        let cTex = ATON.utils.createFillTexture(color);
        if (onlymissing) this.getOrCreateStateSet().setTextureAttributeAndModes( u, cTex, osg.StateAttribute.ON);
        else this.getOrCreateStateSet().setTextureAttributeAndModes( u, cTex, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);
        return this;
        };

    // On hover/select functions
    N.onHover  = undefined;
    N.onSelect = undefined;

    //N.setNodeMask(mask);
    return N;
};

// Directly add to visible root
ATON.addNodeToRoot = function(N){
    ATON._rootScene.addChild(N);
};

ATON.createGroupNode = function(){
    let N = ATON.createNode( new osg.Node(), ATON_MASK_VISIBLE );
    return N;
}

ATON.createTransformNode = function(){
    let N = ATON.createNode( new osg.MatrixTransform(), ATON_MASK_VISIBLE );
    return N;
}

ATON.createDynamicGroupNode = ATON.createTransformNode;

// Aux loading routine
ATON.loadAssetToNode = function(url, N, onComplete){
    if (!N) return;

    N.bLoading = true;
    ATON._nodeReqs++;

    console.log("...Loading "+ url);
    ATON.fireEvent("NodeRequestFired");

    var request = osgDB.readNodeURL( url /*, { databasePath: basepath }*/ /*, opt*/ );
    request.then( function ( node ){
        if (ATON._nodeReqs > 0) ATON._nodeReqs--;

        // remove all names inside loaded asset
        let CLV = new ATON.utils.clearNamesVisitor();
        node.accept( CLV );

        console.log(url + " loaded.");
        N.addChild(node);
        N.bLoading = false;
        
        ATON._onNodeRequestComplete();

        if (onComplete !== undefined) onComplete();
        }).catch( function(e) {
            N.bLoading = false;
            console.error("Unable to load "+url+" - "+e);
        });
};

ATON.createAssetNode = function(url, bTransformable, onComplete){
    let N;
    if (bTransformable) N = ATON.createTransformNode();
    else N = ATON.createGroupNode();

    N.assetURL = url;

    ATON.loadAssetToNode(url, N, onComplete);

    return N;
};

ATON.createMultiResAssetNode = function(urlList, range, onComplete){
    let N = ATON.createGroupNode();

    N.bLoading = true;
    ATON._nodeReqs++;

    let pxlonscr = (range*range);

    console.log("...Loading MultiRes node");
    ATON.fireEvent("NodeRequestFired");

    osgDB.readNodeURL( urlList[0] /*, { databasePath: basepath }*/ /*, opt*/ ).then( function (node){
        if (ATON._nodeReqs > 0) ATON._nodeReqs--;

        // remove all names inside loaded asset
        let CLV = new ATON.utils.clearNamesVisitor();
        node.accept( CLV );

        let plod = new osg.PagedLOD();
        plod.setRangeMode(osg.PagedLOD.PIXEL_SIZE_ON_SCREEN);
        //plod.addChild(node, options.hirespxsize, Number.MAX_VALUE);
        plod.addChild(node, 0.0, pxlonscr);

        plod.setRange(1, pxlonscr, Number.MAX_VALUE);

        plod.setFunction(1, function(parent){
            //console.log("fire!");
            
            var g = new osg.Node();
            g.addChild(node);
            var r = osgDB.readNodeURL( urlList[1] );
            //ATON._nodeReqs++;
            r.then( function ( hrnode ){
                //g.addChild( hrnode );
                g.children[0] = hrnode;
                
                ATON._buildKDTree(ATON._rootScene);
                
                //if (ATON._nodeReqs > 0) ATON._nodeReqs--;
                });
    
            return g;
            });

        N.addChild(plod);
        N.bLoading = false;
        
        ATON._onNodeRequestComplete();

        if (onComplete !== undefined) onComplete();
        }).catch( function(e) {
            N.bLoading = false;
            console.error("Unable to load "+url+" - "+e);
        });

    return N;
};

// Procedural instancing
//=======================
ATON.createProduction = function(templatenode, transformlist, bTransformable){
    let N;
    if (bTransformable) N = ATON.createTransformNode();
    else N = ATON.createGroupNode();

    let tn;
    if (typeof templatenode === 'string'){ // URL, try loading
        tn = ATON.createGroupNode();
        ATON.loadAssetToNode(templatenode, tn);
        }
    else tn = templatenode;
/*
    if (typeof transformlist === 'string' || transformlist instanceof String){

        }
*/
    for (let t = 0; t < transformlist.length; t++) {
        let T = transformlist[t];

        T.addChild(tn);
        N.addChild(T);
        }

    return N;
};

//
ATON.createProductionFromASCII = function(templatenode, asciiURL, bTransformable){
    let N;
    if (bTransformable) N = ATON.createTransformNode();
    else N = ATON.createGroupNode();

    ATON.utils.generateTransformListFromASCII(asciiURL, (tlist)=>{
        N.addChild( ATON.createProduction(templatenode, tlist, bTransformable));
        });

/*
    ATON.utils.generateTransformListFromASCII(asciiURL, (tlist)=>{

        for (let t = 0; t < tlist.length; t++) {
            let T = tlist[t];
            if (T){
                T.addChild(templatenode);
                N.addChild(T);
                //console.log(T);
                }
            }
        });
*/
    return N;
};

ATON.getActiveGraphBoundingSphere = function(){
    let bs = new osg.BoundingSphere();

    for (var key in ATON.nodes){
        let N = ATON.nodes[key];

        if (N && N.isActive()) bs.expandByBoundingSphere( N.getBoundingSphere() );
        }

    return bs;
};

/* 
    Shape Descriptors (semantics)
==========================================================================*/
// Directly add to descriptors root
ATON.addDescriptorToRoot = function(N){
    ATON._rootDescriptors.addChild(N);
};

ATON.getDescriptor = function(unid){
    return ATON.descriptors[unid];
};

ATON.createDescriptorShape = function(url, bTransformable, onComplete){
    let D;
    if (bTransformable) D = ATON.createNode( new osg.MatrixTransform(), ATON_MASK_DESCRIPTORS );
    else D = ATON.createNode( new osg.Node(), ATON_MASK_DESCRIPTORS );

    ATON.loadAssetToNode(url, D, ()=>{
        ATON._numDescriptors++;
        if (onComplete) onComplete();
        });

    return D;
};

// Procedural Descriptors
ATON.createDescriptorProductionFromASCII = function(templatedescr, asciiURL, bTransformable){
    let D;
    if (bTransformable) D = ATON.createNode( new osg.MatrixTransform(), ATON_MASK_DESCRIPTORS );
    else D = ATON.createNode( new osg.Node(), ATON_MASK_DESCRIPTORS );

    let tn;
    if (typeof templatedescr === 'string'){ // URL, try loading
        tn = ATON.createGroupNode();
        ATON.loadAssetToNode(templatedescr, tn);
        }
    else tn = templatedescr;

    ATON.utils.generateTransformListFromASCII(asciiURL, (tlist)=>{
        for (let t = 0; t < tlist.length; t++) {
            let T = tlist[t];
            if (T){
                T.addChild(tn);
                D.addChild(T);
                }
            }
        });

    return D;
};

ATON.createDescriptorSphere = function(location, r, M){
    let D = ATON.createNode( new osg.MatrixTransform(), ATON_MASK_DESCRIPTORS );

    if (ATON._unitSphere === undefined) ATON._unitSphere = osg.createTexturedSphere(1.0, 10,10);
    D.addChild(ATON._unitSphere);

    D.translate(location).scale(r);

    // Apply reference frame (as matrix) if provided
    if (M) osg.mat4.multiply(D.getMatrix(), osg.mat4.invert([], M), D.getMatrix());

    return D;
};

ATON.createDescriptorGroup = function(bTransformable){
    let G;
    if (bTransformable) G = ATON.createNode( new osg.MatrixTransform(), ATON_MASK_DESCRIPTORS );
    else G = ATON.createNode( new osg.Node(), ATON_MASK_DESCRIPTORS );

    return G;
};



// Shape Descriptors (TO BE DEPRECATED)
//==========================================================================
// FIXME:

/*
ATON.descriptor = function(uname){
    this.uname = uname;
    this.node  = undefined; // a geometry shape for leaves, a group for upper hierarchy
    
    this.loading         = false;
    this._onLoadComplete = undefined;

    this._color = [1,1,1, 0.1];
    this._texc  = undefined;

    // Init event handlers
    this._onHover  = undefined;
    this._onSelect = undefined;
    //this.onLeave  = undefined;

    this._bSurface = false;

    this._triggers = {}; // TODO:
};

ATON.descriptor.prototype = {
    isRoot: function(){
        return (this.parent === undefined);
        },
    
    getUniqueID: function(){
        //if (this.node === undefined) return undefined;
        //return this.node.getName();
        return this.uname;
        },

    onHover: function(f){
        this._onHover = f;
        },
    onSelect: function(f){
        this._onSelect = f;
        },

    // TODO: add custom trigger condition > function
    addTrigger: function(cond_f, f){
        //this._triggers
        }
};

// Adds a semantic 3D descriptor (typically a simple shape)
// unid is string-code
ATON.addDescriptor = function(url, unid, options){
    if (unid === undefined){
        console.log("Cannot add descriptor node "+url+": No ID provided.");
        return;
        }

    // New descriptor object, before we fire request for geometry
    if (ATON.descriptors[unid] === undefined){
        ATON.descriptors[unid] = new ATON.descriptor(unid);
        ATON.descriptors[unid].loading = true;
        }
    
    ATON._numDescriptors++;

    var request = osgDB.readNodeURL( url );
    request.then( function ( data ){

        // remove all names inside loaded shape
        var CLV = new ATON.utils.clearNamesVisitor();
        data.accept( CLV );

        if (options && (options.transformRules || options.transform) ){
            var N = new osg.Node();

            if (options.transformRules){
                ATON.utils.generateProduction(data, options.transformRules, N);
                }
            if (options.transform){
                let T = new osg.MatrixTransform();
                T.setMatrix(options.transform);
                T.addChild(data);
                N = T;
                }

            ATON.descriptors[unid].node = N;
            }
        else ATON.descriptors[unid].node = data;

        let D = ATON.descriptors[unid];

        if (options && options.color){
            D._color = options.color;
            D._texc  = ATON.utils.createFillTexture(options.color);
            D.node.getOrCreateStateSet().setTextureAttributeAndModes( 0, D._texc, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);

            //console.log(options.color);

            //var material = new osg.Material();
	        //material.setDiffuse( [options.color[0],options.color[1],options.color[2],0.2] );
            //material.setAmbient( options.color );
            //material.setEmission( options.color );
	        //D.node.getOrCreateStateSet().setAttributeAndModes( material, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );
            }

        D.node.setName(unid); // FIXME: maybe set from outside?
        D.loading = false;

        ATON._rootDescriptors.addChild( D.node ); // data

        if (D._onLoadComplete !== undefined) D._onLoadComplete();

        console.log("Descriptor node "+url+" loaded and registered as: "+unid);

        }).catch(function(e) {
            console.log("Cannot load descriptor "+url); //+": "+e);
        });

    return ATON.descriptors[unid];

};

ATON.addSphereDescriptor = function(unid, title, location, r){
    if (unid === undefined){
        console.log("Cannot add sphere descriptor: No ID provided.");
        return;
        }

    ATON.descriptors[unid] = new ATON.descriptor(unid);
    let D = ATON.descriptors[unid];
    D._bSurface = true;
    
    if (ATON._unitSphereDescr === undefined) ATON._unitSphereDescr = osg.createTexturedSphere(1.0, 10,10);
    
    D.node = new osg.MatrixTransform();
    D.node.addChild(ATON._unitSphereDescr);
    osg.mat4.setTranslation(D.node.getMatrix(), location );
    //osg.mat4.multiply(D.node.getMatrix(), D.node.getMatrix(), osg.mat4.fromScaling( [], radius));
    osg.mat4.scale(D.node.getMatrix(), D.node.getMatrix(), [r,r,r] );

    D.node.setName(unid); // FIXME: maybe set from outside?
    D.loading = false;

    ATON._rootDescriptors.addChild( D.node ); // data

    ATON._numDescriptors++;
    return ATON.descriptors[unid];
};

ATON.addParentToDescriptor = function(unid, parent_unid){
    if (ATON.descriptors[unid] === undefined) return undefined;

    //console.log(ATON.descriptors);

    // First time
    if (ATON.descriptors[parent_unid] === undefined){
        ATON.descriptors[parent_unid] = new ATON.descriptor(parent_unid);
        ATON.descriptors[parent_unid].loading = false;
        
        ATON.descriptors[parent_unid].node = new osg.Node();
        ATON.descriptors[parent_unid].node.setName(parent_unid);

        // This becomes the new root
        ATON._rootDescriptors.removeChild( ATON.descriptors[unid].node ); //.removeChildren();
        ATON._rootDescriptors.addChild( ATON.descriptors[parent_unid].node );

        //console.log("FIRST TIME parent: "+parent_unid);
        }

    // If child completed, connect them
    if (!ATON.descriptors[unid].loading){
        ATON.descriptors[parent_unid].node.addChild( ATON.descriptors[unid].node );
        console.log("Descriptor node: "+unid+" is child of: "+parent_unid);
        }
    // Still loading... delay relationship to descriptor routine.
    else {
        ATON.descriptors[unid]._onLoadComplete = function(){ 
            ATON.descriptors[parent_unid].node.addChild( ATON.descriptors[unid].node )
            console.log("Descriptor node: "+unid+" is child of: "+parent_unid);
            };
        console.log("Descriptor node: "+unid+" will be child of: "+parent_unid);
        }

    return ATON.descriptors[parent_unid];
};

*/

// Navigation and POVs
//==========================================================================
ATON.pov = function(unid, pos, tgt, up, fov){
    this.nameID    = unid? unid : "";
    this.pos       = pos? pos : osg.vec3.create();
    this.target    = tgt? tgt : osg.vec3.fromValues(0,1,0);
    this.up        = up? up : ATON_Z_AXIS;
    this.fov       = fov? fov : ATON_STD_FOV;
    this.classList = []; // Keywords
};

ATON.pov.prototype = {

    addClass: function(className){
        this.classList.push(className);
        },

    hasClass: function(className){
        //if (className.length <= 0)
        return (this.classList.indexOf(className) > -1);
        },

};

ATON.setFOV = function(f){
    ATON._currPOV.fov = f;

    if (ATON._camera === undefined) return;
    
    //ATON._toPOV.fov = f; // while transitioning

	var info = {};
	osg.mat4.getPerspective( info, ATON._camera.getProjectionMatrix() );
    osg.mat4.perspective(ATON._camera.getProjectionMatrix(), ATON_DEG2RAD * f, info.aspectRatio, info.zNear, info.zFar);
}
ATON.getFOV = function(){
    return ATON._currPOV.fov;
};

ATON.getPosition = function(){
    return ATON._currPOV.pos;
};
ATON.getTarget = function(){
    return ATON._currPOV.target;
};

// Add a POV to centralized DB
ATON.addPOV = function(pov){
    ATON.POVlist.push(pov);
};

ATON.getCurrentPOVcopy = function(){
    var P = new ATON.pov;
    P.pos    = ATON._currPOV.pos.slice(0);
    P.target = ATON._currPOV.target.slice(0);
    P.fov    = ATON._currPOV.fov;

    return P;
};

// Request transition to POV
ATON.requestPOV = function(pov, duration){
    if (ATON._tPOVcall >= 0.0) return; // already requested
    if (pov === undefined) return;

    ATON._fromPOV.pos    = ATON._currPOV.pos.slice(0);
    ATON._fromPOV.target = ATON._currPOV.target.slice(0);
    ATON._fromPOV.fov    = ATON._currPOV.fov;

    ATON._toPOV.pos      = pov.pos.slice(0);
    ATON._toPOV.target   = pov.target.slice(0);
    ATON._toPOV.fov      = pov.fov? pov.fov : ATON._currPOV.fov;

    if (duration !== undefined) ATON._tPOVduration = duration;
    else ATON._tPOVduration = ATON_STD_POV_DURATION;

    ATON._tPOVcall = ATON._time;
};

ATON.requestPOVbyName = function(povname, duration){
    var n = ATON.POVlist.length;
    for (var i = 0; i < n; i++){
        if (ATON.POVlist[i].name === povname){
            ATON.requestPOVbyIndex(i, duration);
            return;
            }
        }
};

ATON.requestPOVbyIndex = function(i, duration){
    ATON.requestPOV(ATON.POVlist[i], duration);
    ATON._reqPOVi = i;
};

// Request a POV by boundingsphere and radius multiplier d
ATON.requestPOVbyBound = function(bs, d, duration){
    let pov = new ATON.pov();

    let c = bs._center;
    let r = bs._radius;

    r *= d;

    let p = osg.vec3.create();
    p[0] = c[0] - (ATON._direction[0]*r);
    p[1] = c[1] - (ATON._direction[1]*r);
    p[2] = c[2] - (ATON._direction[2]*r);

    pov.target = c;
    pov.pos    = p;
    pov.fov    = ATON._currPOV.fov;

    ATON.requestPOV(pov, duration);
};

ATON.requestPOVbyNode = function(node, d, duration){
    if (node === undefined) return;

    ATON.requestPOVbyBound(node.getBoundingSphere(), d, duration);
};
/*
ATON.requestPOVbyActiveLayers = function(duration){
    let bs = ATON.getActiveLayersBoundingSphere();
    if (!bs.valid()) return;

    ATON.requestPOVbyBound(bs, 2.0, duration);
};
*/
ATON.requestPOVbyActiveGraph = function(duration){
    let bs = ATON.getActiveGraphBoundingSphere();
    if (!bs.valid()) return;

    ATON.requestPOVbyBound(bs, 2.0, duration);
};

ATON.requestPOVbyDescriptor = function(id, duration){
    let d = ATON.descriptors[id];
    if (!d) return;

    ATON.requestPOVbyNode(d, 2.0, duration);
};

ATON.recomputeHome = function(){
    var r = ATON._rootScene.getBoundingSphere()._radius;
    ATON._homePOV.fov    = ATON_STD_FOV;
    ATON._homePOV.target = ATON._rootScene.getBoundingSphere()._center.slice(0);
    ATON._homePOV.pos[0] = ATON._homePOV.target[0] + r;
    ATON._homePOV.pos[1] = ATON._homePOV.target[1] + r;
    ATON._homePOV.pos[2] = ATON._homePOV.target[2] + (r*0.5);
};

ATON.setHome = function(position, target, fov){
    ATON._homeAuto = false;
    
    ATON._homePOV.pos    = position;
    ATON._homePOV.target = target;
    if (fov) ATON._homePOV.fov = fov;
};

ATON.requestHome = function(duration){
    if (ATON._homePOV === undefined) return;

    ATON.requestPOV(ATON._homePOV, duration);
};

// FP step: m/sec
ATON.setFirstPersonStep = function(m){
    ATON._firstPerMan._stepFactor = m;
    ATON._firstPerMan.setStepFactor(m);
};

// Internal use
ATON._handlePOVrequest = function(){
    ATON._tPOVprogress = (ATON._time - ATON._tPOVcall) / ATON._tPOVduration;

    // End
    if (ATON._tPOVprogress >= 1.0){
        ATON._tPOVcall = -1.0;

        // Snap
        ATON._currPOV.pos[0]    = ATON._toPOV.pos[0];
        ATON._currPOV.pos[1]    = ATON._toPOV.pos[1];
        ATON._currPOV.pos[2]    = ATON._toPOV.pos[2];
        ATON._currPOV.target[0] = ATON._toPOV.target[0];
        ATON._currPOV.target[1] = ATON._toPOV.target[1];
        ATON._currPOV.target[2] = ATON._toPOV.target[2];

        ATON.setFOV(ATON._toPOV.fov);
        return;
        }

    // During transition, interpolate values
    ATON._tPOVprogress = COSINOIDAL_DIST(ATON._tPOVprogress);
    //ATON._tPOVprogress = (1.0 - Math.cos(ATON._tPOVprogress * Math.PI)) / 2.0;

    //var lerP = osg.vec3.create();
    osg.vec3.lerp(ATON._povLerP, ATON._fromPOV.pos, ATON._toPOV.pos, ATON._tPOVprogress);

    //var lerT = osg.vec3.create();
    osg.vec3.lerp(ATON._povLerT, ATON._fromPOV.target, ATON._toPOV.target, ATON._tPOVprogress);

    var f = ATON._fromPOV.fov + ATON._tPOVprogress * (ATON._toPOV.fov - ATON._fromPOV.fov);

    //console.log(f);

    ATON._currPOV.pos[0] = ATON._povLerP[0];
    ATON._currPOV.pos[1] = ATON._povLerP[1];
    ATON._currPOV.pos[2] = ATON._povLerP[2];

    ATON._currPOV.target[0] = ATON._povLerT[0];
    ATON._currPOV.target[1] = ATON._povLerT[1];
    ATON._currPOV.target[2] = ATON._povLerT[2];

    //ATON._currPOV.pos    = lerP;
    //ATON._currPOV.target = lerT;
    ATON.setFOV(f);
};

ATON._handlePOVrequestVR = function(){
    ATON._tPOVprogress = (ATON._time - ATON._tPOVcall) / ATON._tPOVduration;

    // End
    if (ATON._tPOVprogress >= 1.0){
        ATON._tPOVcall = -1.0;
        ATON._currPOV.pos[0] = ATON._toPOV.pos[0];
        ATON._currPOV.pos[1] = ATON._toPOV.pos[1];
        ATON._currPOV.pos[2] = ATON._toPOV.pos[2];
        return;
        }

    // During transition, interpolate values
    /*if (!ATON._bFirstPersonMode)*/ ATON._tPOVprogress = COSINOIDAL_DIST(ATON._tPOVprogress);

    //var lerP = osg.vec3.create();
    osg.vec3.lerp(ATON._povLerP, ATON._fromPOV.pos, ATON._toPOV.pos, ATON._tPOVprogress);

    ATON._currPOV.pos[0] = ATON._povLerP[0];
    ATON._currPOV.pos[1] = ATON._povLerP[1];
    ATON._currPOV.pos[2] = ATON._povLerP[2];
};

// Switch between FP and Orbit
ATON.setFirstPersonMode = function(b){
    if (ATON._vrState) return; // We cant change manip in VR

    if (b){
        ATON._viewer.setManipulator( ATON._firstPerMan );
        ATON._firstPerMan.setEyePosition(ATON._currPOV.pos);
        ATON._firstPerMan.setTarget(ATON._currPOV.target);

        console.log("First Person control");
        }
    else {
        ATON._viewer.setManipulator( ATON._orbitMan );
        //ATON._orbitMan.setEyePosition(ATON._currPOV.pos);
        //ATON._orbitMan.setTarget(ATON._currPOV.target);

        console.log("Orbit control");
        }

    ATON._bFirstPersonMode = b;
};

ATON._requestFirstPersonTrans = function(pickedData){
    if (ATON._tPOVcall >= 0.0) return; // already requested
    if (pickedData === undefined) return;

    var pn = pickedData.n;
    var pp = pickedData.p;
    
    if (!ATON._bSurfAffordable) return; // we do nothing if target surface has no affordance - FIXME we should update target anyway

    var nPOV = new ATON.pov;
    var E  = osg.vec3.create();
    var T  = osg.vec3.create();

    if (ATON._polPos && ATON._polForce>0.0){
        E[0] = ATON._polPos[0];
        E[1] = ATON._polPos[1];
        E[2] = ATON._polPos[2];

        T[0] = pp[0];
        T[1] = pp[1];
        T[2] = pp[2];
        }
    else {
        pn[2] *= ATON._collideShape[1];
        osg.vec3.add(E, pp,pn);

        var dist2 = osg.vec3.squaredDistance(E,ATON._currPOV.pos);

        T = ATON._firstPerMan._direction.slice(0);
        T[0] *= 20.0;
        T[1] *= 20.0;
        T[2] *= 20.0; // 0.0
     
        //osg.vec3.sub(T, E,ATON._currPOV.pos);
        //osg.vec3.add(T, T,ATON._currPOV.pos);
    
        osg.vec3.add(T, E,T);
        }

    // Adjust VR eye offset 
    if (ATON._HMD && ATON._vrState){
        let posep = ATON._HMD.getPose().position;
        E[0] += posep[2];
        E[1] += posep[0];
        E[2] += posep[1];
        }

    nPOV.pos    = E;
    nPOV.target = T;
    nPOV.fov    = ATON._currPOV.fov;

    // distance-based
/*
    var dT = Math.sqrt(dist2);
    if (ATON._vrState) dT *= 0.7;
    else dT *= 0.3;
*/
    var dT = 0.3;
    ATON.requestPOV(nPOV, dT);
};


// Intersectors
//==========================================================================
ATON._handleScreenPick = function(x,y, mask){
    var hits = ATON._viewer.computeIntersections( x, y, mask );
    if ( hits.length === 0 ) return undefined;
    //console.log(hits);

    return ATON._hitsOperator(hits, mask);
};

ATON._hitsOperator = function(hits, mask, descrFunction, visFunction){

    hits.sort( SORT_C2F );

    var pickP     = hits[ 0 ]._localIntersectionPoint; //.point;
    var pickN     = hits[ 0 ]._localIntersectionNormal; //(hits[ 0 ].TriangleIntersection)? hits[ 0 ].TriangleIntersection.normal : undefined;
    var closestNP = hits[ 0 ]._nodePath;

    //console.log(pickN);

    // OK transform into world coords
    if (closestNP !== undefined){
        //closestNP = closestNP.slice(1);
        //console.log(closestNP);

        //var M = osg.computeLocalToWorld( closestNP );

        //ATON._reservedHitsMatrixStack.reset();
        ////osg.mat4.identity( ATON._reservedHitsMatrixStack );
        var M = osg.computeLocalToWorld( closestNP, true /*, ATON._reservedHitsMatrixStack.get()*/);
        //osg.ComputeMatrixFromNodePath.computeLocalToWorld( closestNP, true, M );

        //osg.Vec3.mult(pickP,M, pickP);
        //$osg.Matrix.transformVec3( M, pickP, pickP );
        osg.vec3.transformMat4(pickP, pickP, M);
        //osg.vec3.transformMat4(pickN, pickN, M);

        // Descriptors
        if (mask === ATON_MASK_DESCRIPTORS){
            ATON._pickedDescriptorsPath.length = 0; //= [];
            ATON._pickedDescriptorsPath = ATON.utils._getPickedNodeNames(closestNP);
            //console.log(ATON._pickedDescriptorsPath);

            if (descrFunction !== undefined) descrFunction();
            }
        if (mask === ATON_MASK_VISIBLE){
            if (visFunction !== undefined) visFunction();
            }
        //console.log(ATON.utils._getPickedNodeNames(closestNP));
        }

    var result = {};
    result.p = pickP;
    result.n = pickN;

    return result; //pickP;
};


// Inline Web Workers
//=====================
/*
function _loaderWorker(){
    var OSG = window.OSG;
    var osg = OSG.osg;
    OSG.globalify();    // All (osgDB, osgGA, etc...)

    self.addEventListener("message", function(e) {
        // the passed-in data is available via e.data

        if (e.data.length > 0){
            var url = e.data;
            var request = osgDB.readNodeURL( url );
            request.then( function ( node ){
                postMessage( node );
                });    
            }
        
    }, false);
}
*/


// MagNet Nodes
//==========================================================================
ATON.magNode = function(){
    //this.nameID    = id? id : String(ATON.MagNet.length);
    this.enabled   = true;
    this.position  = osg.vec3.create();
    this.target    = osg.vec3.create();
    this.radius2   = 1.0;
    this.forces    = osg.vec2.fromValues(0.0, 0.005); // Positional, Orientational

    this.setKernel(0.05);
};

ATON.magNode.prototype = {

    setPosition: function(p){
        this.position = p;
        },

    setTarget: function(s){
        this.target = s;
        },

    setPositionAndTarget: function(p){
        this.position = p;
        this.target   = this.position;
        },

    setRadius: function(r){
        this.radius2 = (r*r);
        this._kr2    = this.radius2 * this.kernel;
        },
    
    setKernel: function(k){
        this.kernel = k;
        this._kr2   = this.radius2 * k;
        },

    setForces: function(F){
        this.forces = F;
        },
    
    toggle: function(b){
        this.enabled = !this.enabled;
        },

};

ATON.addMagNode = function(mNode){
    ATON.MagNet.push(mNode);
};

// Closest Policy
ATON._handleMagNetClosest = function(){

    if (ATON._vrState) return;
    //if (ATON._wVR) ATON._wVR._worldScale = 10.0; // AlcuTrans

    var n = ATON.MagNet.length;
    if (n === 0) return;

    //var E = osg.vec3.create(); //ATON._currPOV.pos.slice(0);
    //var T = osg.vec3.create(); //ATON._currPOV.target.slice(0);

    var influencer = -1;
    var closD2     = Number.MAX_VALUE;
    var t;

    for ( var m = 0; m < n; m++ ){
        var mPos = ATON.MagNet[m].position;
        var mTgt = ATON.MagNet[m].target;
        var r2   = ATON.MagNet[m].radius2;
        var kr2  = ATON.MagNet[m]._kr2;
       
        var dist2 = osg.vec3.squaredDistance(ATON._currPOV.pos, mPos); // Get squared distance to user

        var ff = r2 - dist2;
        if (ff > 0.0 && dist2 > kr2 && ATON.MagNet[m].enabled ){

            if (dist2 < closD2){
                closD2     = dist2;
                influencer = m;
                t          = ff / r2;
                }
            }
        }

    if (influencer < 0) return; // no MagNode influence, skip

    // AlcuTrans
/*
    if (ATON._vrState){
        if (ATON._wVR) ATON._wVR._worldScale = 10.0 - (t*9.0);
        return;
        }
*/
    var posF = ATON.MagNet[influencer].forces[0];
    var tgtF = ATON.MagNet[influencer].forces[1];

    var P = ATON.MagNet[influencer].position;
    var T = ATON.MagNet[influencer].target;

    // we should use t*force*dt, where dt is 1/fps
    ATON._currPOV.pos    = osg.vec3.lerp( [], ATON._currPOV.pos, P, (t*posF));
    ATON._currPOV.target = osg.vec3.lerp( [], ATON._currPOV.target, T, (t*tgtF));
};

// Cumulative Policy
ATON._handleMagNet = function(){
    var n = ATON.MagNet.length;
    if (n === 0) return;

    var E = osg.vec3.create(); //ATON._currPOV.pos.slice(0);
    var T = osg.vec3.create(); //ATON._currPOV.target.slice(0);

    var aT = [];
    var aE = [];

    var numInfluencers = 0;

    for ( var m = 0; m < n; m++ ){
        var mPos = ATON.MagNet[m].position;
        var mTgt = ATON.MagNet[m].target;
        
        var dist2 = osg.vec3.squaredDistance(ATON._currPOV.pos, mPos); // Get squared distance to note 3D position

        var ff = ATON.MagNet[m].radius2 - dist2;
        if (ff > 0.0 && ATON.MagNet[m].enabled ){
            numInfluencers++;
            var t = ff / ATON.MagNet[m].radius2;

            var posF = ATON.MagNet[m].forces[0];
            var tgtF = ATON.MagNet[m].forces[1];

            // we should use t*force*dt, where dt is 1/fps
            aE.push( osg.vec3.lerp( [], ATON._currPOV.pos, mPos, (t*posF)) );
            aT.push( osg.vec3.lerp( [], ATON._currPOV.target, mTgt, (t*tgtF)) );
            }
        }

    // No MagNodes captured = no influence
    if (numInfluencers === 0) return;

    // SUM
    for(var k = 0; k < aT.length; k++){
        T[0] += aT[k][0];
        T[1] += aT[k][1];
        T[2] += aT[k][2];
        }
    for(var k = 0; k < aE.length; k++){
        E[0] += aE[k][0];
        E[1] += aE[k][1];
        E[2] += aE[k][2];
        }

    // AVG
    T[0] /= numInfluencers;
    T[1] /= numInfluencers;
    T[2] /= numInfluencers;

    E[0] /= numInfluencers;
    E[1] /= numInfluencers;
    E[2] /= numInfluencers;

    ATON._currPOV.pos    = E;
    ATON._currPOV.target = T;
};


// RTTs
//==========================================================================
ATON._initRTTs = function(){
    if (ATON._viewer.getCamera() === undefined) return;

    var cam = ATON._viewer.getCamera();

    if (ATON._isMobile) ATON._rttFrontSize = [8,8];
    else ATON._rttFrontSize = [24,24];
    //ATON._rttFrontSize = [128,128];
    //ATON._rttFrontSize = [256,256];

    if (ATON._isMobile) ATON._rttZsensorSize = [8,8];
    else ATON._rttZsensorSize = [16,16];

    ATON._rttFront   = new osg.Camera();
    ATON._rttZsensor = new osg.Camera();

    ATON._frontGroup = new osg.Node();
    ATON._frontGroup.addChild(ATON._rootScene);
    ATON._frontGroup.getOrCreateStateSet().setAttributeAndModes( ATON._glslFrontProgram, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );
    ATON._frontGroup.getOrCreateStateSet().addUniform( osg.Uniform.createFloat1( ATON._sensorLookAhead, 'lookAhead' ) );
    ATON._frontGroup.setNodeMask( ATON_MASK_UI );
/*
    ATON._frontGroup.getOrCreateStateSet().setAttributeAndModes( 
        new osg.Depth( osg.Depth.LESS ),
        osg.StateAttribute.OVERRIDE | osg.StateAttribute.PROTECTED
        );
*/
    ATON._frontGroup.getOrCreateStateSet().setAttributeAndModes(
        new osg.CullFace( 'DISABLE' ), //new osg.CullFace( 'BACK' ),
        osg.StateAttribute.OVERRIDE | osg.StateAttribute.PROTECTED
        );

    ATON._rttFront.addChild(ATON._frontGroup);
    ATON._rttZsensor.addChild(ATON._frontGroup);

    ATON._rttFront.setComputeNearFar( false );
    ATON._rttZsensor.setComputeNearFar( false );

	ATON._rttFront.setName( 'RTT Front Sensor' );
    ATON._rttZsensor.setName( 'RTT Z Sensor' );

	ATON._rttFront.setClearColor( osg.vec4.fromValues(0.0, 0.0, 0.0, 0.0) );
    ATON._rttZsensor.setClearColor( osg.vec4.fromValues(0.0, 0.0, 0.0, 0.0) );

	//ATON._rttFront.setViewMatrix(cam.getViewMatrix());
    //ATON._rttFront.setProjectionMatrix(cam.getProjectionMatrix());

    // Set Front RTT
    var info = {};
    osg.mat4.getPerspective( info, cam.getProjectionMatrix() );
    ATON._rttFront.setViewMatrix(cam.getViewMatrix());
    // our custom proj (optimized near/far and FOV)
    osg.mat4.perspective( ATON._rttFront.getProjectionMatrix(), ATON_DEG2RAD * 100, info.aspectRatio, 0.001, ATON._sensorLookAhead );


    // Set Bottom RTT
    //osg.mat4.lookAt( ATON._rttZsensor.getViewMatrix(), ATON._gSenseTop, ATON._gSenseBottom, ATON_Y_AXIS );
    //osg.mat4.ortho( ATON._rttZsensor.getProjectionMatrix(), 0, ATON._rttFrontSize[0], 0, ATON._rttFrontSize[1], ATON._gSenseBottom[2], ATON._gSenseTop[2] );

/*
    var top = osg.vec3.create();
    var bottom = osg.vec3.create();
    top[0] = ATON._currPOV.pos[0];
    top[1] = ATON._currPOV.pos[1];
    top[2] = ATON._currPOV.pos[2] + 10.0;
    bottom[0] = top[0];
    bottom[1] = top[1];
    bottom[2] = ATON._currPOV.pos[2] - 10.0;

	osg.mat4.lookAt( ATON._rttFront.getViewMatrix(), top, bottom, ATON_X_AXIS );
    //osg.mat4.perspective( ATON._rttFront.getProjectionMatrix(), ATON_DEG2RAD * 55, info.aspectRatio, 1.0, 1000.0 );
    osg.mat4.ortho( ATON._rttFront.getProjectionMatrix(), 0, ATON._rttFrontSize[0], 0, ATON._rttFrontSize[1], bottom[2], top[2] );
*/
/*
	var info = {};
    var f = 30.0;
    var rttPMat = osg.mat4.create();
	osg.mat4.getPerspective( info, cam.getProjectionMatrix() );
    osg.mat4.perspective(rttPMat, ATON_DEG2RAD * f, info.aspectRatio, info.zNear, info.zFar);
	ATON._rttFront.setProjectionMatrix(rttPMat);
*/

    ATON._rttFront.setRenderOrder( osg.Camera.PRE_RENDER, 0 ); // osg.Camera.PRE_RENDER
    ATON._rttFront.setViewport( new osg.Viewport( 0, 0, ATON._rttFrontSize[0], ATON._rttFrontSize[1] ) );
    ATON._rttFront.setReferenceFrame( osg.Transform.ABSOLUTE_RF );

    ATON._rttZsensor.setRenderOrder( osg.Camera.PRE_RENDER, 0 ); // osg.Camera.PRE_RENDER
    ATON._rttZsensor.setViewport( new osg.Viewport( 0, 0, ATON._rttZsensorSize[0], ATON._rttZsensorSize[1] ) );
    ATON._rttZsensor.setReferenceFrame( osg.Transform.ABSOLUTE_RF );

	// Attach the target texture to RTT camera
    ATON._rttFrontTex = new osg.Texture();
    ATON._rttFrontTex.setTextureSize( ATON._rttFrontSize[0], ATON._rttFrontSize[1] );
	ATON._rttFrontTex.setInternalFormat( osg.Texture.RGBA ); // osg.Texture.RGB
    ATON._rttFrontTex.setMinFilter( 'LINEAR' ); // NEAREST_MIPMAP_NEAREST
    ATON._rttFrontTex.setMagFilter( 'LINEAR' );

    ATON._rttZsensorTex = new osg.Texture();
    ATON._rttZsensorTex.setTextureSize( ATON._rttZsensorSize[0], ATON._rttZsensorSize[1] );
	ATON._rttZsensorTex.setInternalFormat( osg.Texture.RGBA ); // osg.Texture.RGB
    ATON._rttZsensorTex.setMinFilter( 'LINEAR' ); // NEAREST_MIPMAP_NEAREST
    ATON._rttZsensorTex.setMagFilter( 'LINEAR' );


    ATON._rttFront.attachTexture( osg.FrameBufferObject.COLOR_ATTACHMENT0, ATON._rttFrontTex );
    ATON._rttFront.attachRenderBuffer( osg.FrameBufferObject.DEPTH_ATTACHMENT, osg.FrameBufferObject.DEPTH_COMPONENT16 );

    ATON._rttZsensor.attachTexture( osg.FrameBufferObject.COLOR_ATTACHMENT0, ATON._rttZsensorTex );
    ATON._rttZsensor.attachRenderBuffer( osg.FrameBufferObject.DEPTH_ATTACHMENT, osg.FrameBufferObject.DEPTH_COMPONENT16 );


	ATON._root.addChild(ATON._rttFront); // so we traverse RTT cam
    ATON._root.addChild(ATON._rttZsensor); // so we traverse RTT cam

    ATON._setupRTTfrontSensor();
    ATON._setupRTTzSensor();

    if (!ATON._isMobile) ATON._initHUD();
};

ATON._initHUD = function(){
    ATON._HUD = new osg.Camera();
    ATON._HUD.getOrCreateStateSet().setAttributeAndModes( 
        new osg.BlendFunc(), 
        osg.StateAttribute.ON
        );

    // RTT Quads
    ATON._rttFrontQuad = osg.createTexturedQuadGeometry(
        5, 5, 0,
        ATON._rttFrontSize[0]*5, 0, 0,
        0, ATON._rttFrontSize[1]*5, 0
        );
    ATON._rttFrontQuad.getOrCreateStateSet().setTextureAttributeAndModes( 0, ATON._rttFrontTex );

    ATON._rttZsensorQuad = osg.createTexturedQuadGeometry(
        150, 5, 0,
        ATON._rttZsensorSize[0]*5, 0, 0,
        0, ATON._rttZsensorSize[1]*5, 0
        );
    ATON._rttZsensorQuad.getOrCreateStateSet().setTextureAttributeAndModes( 0, ATON._rttZsensorTex );


    ATON._HUD.setNodeMask( ATON_MASK_UI );

	osg.mat4.ortho(ATON._HUD.getProjectionMatrix(), 0, ATON._canvas.width, 0, ATON._canvas.height, -5, 5);

	osg.mat4.translate(ATON._HUD.getViewMatrix(), ATON._HUD.getViewMatrix(), [25.0, 25.0, 0.0]);
    
	ATON._HUD.setRenderOrder( osg.Camera.NESTED_RENDER, 0 );
    ATON._HUD.setReferenceFrame( osg.Transform.ABSOLUTE_RF );

	// TODO: disable BLEND
	//this._HUD.getOrCreateStateSet().

	// add rendered RTT quad to HUD
	if (ATON._rttFrontQuad !== undefined)  ATON._HUD.addChild( ATON._rttFrontQuad );
    if (ATON._rttZsensorQuad !== undefined) ATON._HUD.addChild( ATON._rttZsensorQuad );

	ATON._root.addChild(ATON._HUD);
};

ATON._setupRTTfrontSensor = function(){
	var canvasRTT = document.createElement('canvas');
	var rttCTX    = canvasRTT.getContext( '2d' );
    
    canvasRTT.width  = ATON._rttFrontSize[0];
    canvasRTT.height = ATON._rttFrontSize[1];

	var rowSize  = canvasRTT.width  * 4; // 4
	var colSize  = canvasRTT.height * 4;
	var buffSize = rowSize * canvasRTT.height;

	var pixels = new Uint8Array( buffSize );

    if (canvasRTT === undefined) return;

    var gl = undefined;
    ATON._tLastFrontSensor = 0.0;

	// on RTT cam frame completed
	var RTTendFrameFrontSensor = function( state ){
        if (!ATON._bUseCollisions) return;

        var freqPoll = 0.05;
        if (ATON._vrState) freqPoll = 0.2;

        if ((ATON._time - ATON._tLastFrontSensor) < freqPoll) return;

		gl = state.getGraphicContext();

        // FB sync
        if (gl.checkFramebufferStatus( gl.FRAMEBUFFER ) !== gl.FRAMEBUFFER_COMPLETE) return;

        gl.readPixels( 0, 0, canvasRTT.width, canvasRTT.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels );
        ATON._tLastFrontSensor = ATON._time;

        var qX = Math.floor( canvasRTT.width  * ATON._screenQueryNormalized[0] );
        var qY = Math.floor( canvasRTT.height * ATON._screenQueryNormalized[1] );

        var base = (qY * rowSize) + (qX * 4);

        var r = pixels[ base ]; // OK
        var g = pixels[ base + 1 ]; // OK
        var b = pixels[ base + 2 ]; // OK
        var a = pixels[ base + 3 ]; // OK

        // Depth
        var d = ((255 - a) / 255.0) * ATON._sensorLookAhead;
        //console.log(d);
        //console.log([r,g,b]);

        if (b >= 230) ATON._bZflat = true;
        else ATON._bZflat = false;

/*
        var M = osg.mat4.create();
        osg.mat4.identity( M );
        osg.mat4.mul(M, M, ATON._rttFront.getViewMatrix());
        osg.mat4.mul(M, M, ATON._rttFront.getProjectionMatrix());
        ////osg.mat4.mul(M, M, ATON._rttFront.getViewport().computeWindowMatrix([]));

        //osg.mat4.multiply(M, ATON._rttFront.getProjectionMatrix(), ATON._rttFront.getViewMatrix());
        osg.mat4.invert(M,M);

        var P = osg.vec3.create();
        P[0] = (ATON._screenQueryNormalized[0]*2.0) - 1.0;
        P[1] = 1.0 - (ATON._screenQueryNormalized[1]*2.0);
        P[2] = d;
        //P[3] = 1.0;

        //console.log(P);

        osg.vec3.transformMat4(P, P,M);

        //P[3] = 1.0/P[3];
        //P[0] *= P[3];
        //P[1] *= P[3];
        //P[2] *= P[3];

        //P[0] = ATON._currPOV.pos[0] - P[0];
        //P[1] = ATON._currPOV.pos[1] - P[1];
        //P[2] = ATON._currPOV.pos[2] - P[2];

        //console.log(P);
*/

        // CENTER
/*
        var qMidX = Math.floor( canvasRTT.width * 0.5 );
        var qMidY = Math.floor( canvasRTT.width * 0.5 );
        base = (qMidY * rowSize) + (qMidX*4);

        r = pixels[ base ];
        g = pixels[ base + 1 ];
        b = pixels[ base + 2 ];
        a = pixels[ base + 3 ];
*/

        // CLOSEST AVG
        var count = 0;
        r = 0;
        g = 0;
        b = 0;
        a = 0;

        var idmin,jdmin;

        for (var i=0; i<canvasRTT.width; i++){
            for (var j=0; j<canvasRTT.height; j++){
                base = (j * rowSize) + (i*4);

                var mm = pixels[ base + 3 ];
                if (mm > a){
                    a = mm;
                    idmin = i;
                    jdmin = j;
                    }
                }
            }

        // AVG Kernel (kernSize x kernSize) - MUST BE < RTT size
        var kernSize = 2;
        for (var i=-kernSize; i<=kernSize; i++){
            for (var j=-kernSize; j<=kernSize; j++){
                var ii = idmin + i;
                var jj = jdmin + j;

                if (ii < 0) ii=0;
                if (jj < 0) jj=0;
                if (ii >= canvasRTT.width)  ii=canvasRTT.width-1;
                if (jj >= canvasRTT.height) jj=canvasRTT.height-1;

                base = (jj * rowSize) + (ii*4);

                r += pixels[ base ];
                g += pixels[ base + 1 ];
                b += pixels[ base + 2 ];

                count++;
                }
            }

        r /= count;
        g /= count;
        b /= count;


        // Weighted AVG
/*
        var count = 0;
        r = 0;
        g = 0;
        b = 0;
        a = 0;

        for (var i=0; i<canvasRTT.width; i++){
            for (var j=0; j<canvasRTT.height; j++){
                base = (j * rowSize) + (i*4);

                var mm  = pixels[ base + 3 ];
                var pmm = (mm / 255.0);
                //pmm *= pmm;

                r += (pixels[ base ] * pmm );
                g += (pixels[ base + 1 ] * pmm );
                b += (pixels[ base + 2 ] * pmm);
                if (mm > a) a = mm;

                count++;
                }
            }

        r /= count;
        g /= count;
        b /= count;
*/

        ATON._frontDistance = (1.0 - (a / 255.0)) * ATON._sensorLookAhead;
        ATON._frontCollideNormal[0] = ((r / 255.0) - 0.5) * 2.0;
        ATON._frontCollideNormal[1] = ((g / 255.0) - 0.5) * 2.0;
        ATON._frontCollideNormal[2] = ((b / 255.0) - 0.5) * 2.0;

        //console.log(ATON._frontCollideNormal);
		};

	ATON._rttFront.setFinalDrawCallback( RTTendFrameFrontSensor );
    //window.setInterval(RTTendFrameFrontSensor, 100);
};
/*
ATON._setupRTTzSensor = function(){
 	var canvasRTT = document.createElement('canvas');
	var rttCTX    = canvasRTT.getContext( '2d' );
    
    canvasRTT.width  = ATON._rttZsensorSize[0];
    canvasRTT.height = ATON._rttZsensorSize[1];

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, 1024, gl.STATIC_DRAW);
};
*/
ATON._setupRTTzSensor = function(){
	var canvasRTT = document.createElement('canvas');
	var rttCTX    = canvasRTT.getContext( '2d' );
    
    canvasRTT.width  = ATON._rttZsensorSize[0];
    canvasRTT.height = ATON._rttZsensorSize[1];

	var rowSize  = canvasRTT.width  * 4; // 4
	var colSize  = canvasRTT.height * 4;
	var buffSize = rowSize * canvasRTT.height;

	var pixels = new Uint8Array( buffSize );

    if (canvasRTT === undefined) return;

    var gl = undefined;
    ATON._tLastZsensor = 0.0;

	// on RTT cam frame completed
	var RTTendFrameZsensor = function( state ){
        if (!ATON._bUseGravity) return;

        //ATON._bSensorZready = false;

        var freqPoll = 0.05;
        if (ATON._vrState) freqPoll = 0.2;

        if ((ATON._time - ATON._tLastZsensor) < freqPoll) return;

		gl = state.getGraphicContext();

        // FB sync
        if (gl.checkFramebufferStatus( gl.FRAMEBUFFER ) !== gl.FRAMEBUFFER_COMPLETE) return;

        gl.readPixels( 0, 0, canvasRTT.width, canvasRTT.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels );
        ATON._tLastZsensor = ATON._time;

        var qX = Math.floor( canvasRTT.width  * 0.5 );
        var qY = Math.floor( canvasRTT.height * 0.5 );

        var base = (qY * rowSize) + (qX * 4);

        //var r = pixels[ base ];
        //var g = pixels[ base + 1 ];
        //var b = pixels[ base + 2 ];
        var a = pixels[ base + 3 ];

        // Height
        if (a === 0) ATON._gDist = -1;
        else ATON._gDist = ((255 - a) / 255.0) * ATON._sensorLookAhead;
        //console.log(ATON._gDist);

        //ATON._bSensorZready = true;
        };

    ATON._rttZsensor.setFinalDrawCallback( RTTendFrameZsensor );
    //window.setInterval(RTTendFrameZsensor, 100);
};


// Collisions & Gravity
ATON._handleGravity = function(){
    if (ATON._rttZsensor === undefined) return;

    var hOffs = 0.5;

    ATON._gSenseBottom[0] = ATON._currPOV.pos[0];
    ATON._gSenseBottom[1] = ATON._currPOV.pos[1];
    ATON._gSenseBottom[2] = ATON._currPOV.pos[2] - ATON._sensorLookAhead;

    ATON._gSenseTop[0] = ATON._currPOV.pos[0];
    ATON._gSenseTop[1] = ATON._currPOV.pos[1];
    ATON._gSenseTop[2] = ATON._currPOV.pos[2] + hOffs; //ATON._sensorLookAhead;

    var dir = ATON._direction.slice(0);
    dir[2] = 0.0;

    // Updates Z sensor RTT camera
    osg.mat4.lookAt( ATON._rttZsensor.getViewMatrix(), ATON._gSenseTop, ATON._gSenseBottom, dir );
/*
    osg.mat4.ortho(
        ATON._rttZsensor.getProjectionMatrix(),
        -1, 1, 
        -1, 1, 
        0.01, ATON._sensorLookAhead
        );
*/
    var info = {};
    osg.mat4.getPerspective( info, ATON._camera.getProjectionMatrix() );
    // our custom proj (optimized near/far and FOV)
    osg.mat4.perspective(
        ATON._rttZsensor.getProjectionMatrix(),
        ATON_DEG2RAD * 30, // 100, when we move to unified RTT sensing
        info.aspectRatio,
        0.001, ATON._sensorLookAhead
        );

    //return;
    // Fall algo
    if (ATON._gDist < 0){
        ATON._tLastGravImp = ATON._time;
        return;
        }
    
    var dH = (ATON._collideShape[1] + hOffs);

    if (ATON._gDist <= dH ){
        ATON._tLastGravImp = ATON._time;
        var f = dH - ATON._gDist;

        if ( f > 0.1){
            //var t = (ATON._time - ATON._tLastGravImp)/0.5;
            ATON._currPOV.pos[2] += (2.0 * ATON._dtFrame);
            }
/*
        if (f < -0.05){
            //var t = (ATON._time - ATON._tLastGravImp)/0.5;
            ATON._currPOV.pos[2] -= 0.01;
            console.log("YAYYY");
            }
*/
/*
        // Store abs impact Height
        if (!ATON._bGravImpact) ATON._vLastIH = ATON._currPOV.pos[2] - ATON._collideShape[1];

        ATON._tLastGravImp = ATON._time;

        ATON._currPOV.pos[2] = ATON._vLastIH + ATON._collideShape[1]; // + f;
        if (ATON._bGravImpact) ATON._currPOV.pos[2] += f;
        
        //ATON._currPOV.pos[2] += ATON._gDist + ATON._collideShape[1];
*/
        ATON._bGravImpact = true;
        }
    else {
        var ga = 9.8 * (ATON._time - ATON._tLastGravImp);

        ATON._currPOV.pos[2] -= (ga * ATON._dtFrame); // 0.015
        ATON._bGravImpact = false;
        }
};


ATON._handleCollisions = function(){
    var d = ATON._collideShape[0];
    var D = d * 5.0;
    var R = osg.vec3.create();
/*
    var dir = osg.vec3.create();
    osg.vec3.sub( dir, ATON._currPOV.target, ATON._currPOV.pos);
    osg.vec3.normalize( dir, dir );
*/
    //console.log(dir);

    // Soft
/*
    if (ATON._frontDistance > D) return;
    var rot = 0.01;
    R[0] = (ATON._frontCollideNormal[0]*rot);
    R[1] = (ATON._frontCollideNormal[1]*rot);
    R[2] = (ATON._frontCollideNormal[2]*rot);

    ATON._currPOV.target[0] += R[0];
    ATON._currPOV.target[1] += R[1];
    ATON._currPOV.target[2] += R[2];
*/
    // Hard Collisions
    if (ATON._frontDistance > d) return;
    var m = (d - ATON._frontDistance);// * ATON._dtFrame;

    R[0] = ATON._frontCollideNormal[0];
    R[1] = ATON._frontCollideNormal[1];
    R[2] = ATON._frontCollideNormal[2];


    //osg.vec3.lerp(R, R, ATON._direction, 0.25);
    //R = ATON.utils.reflect( ATON._direction, R );
    //osg.vec3.add(R, R,dir);
    //osg.vec3.normalize(R,R);

    R[0] *= (m);
    R[1] *= (m);
    R[2] *= (m);

    ATON._currPOV.pos[0] += R[0];
    ATON._currPOV.pos[1] += R[1];
    ATON._currPOV.pos[2] += R[2];

    //ATON._currPOV.target[0] += R[0];
    //ATON._currPOV.target[1] += R[1];
    //ATON._currPOV.target[2] += R[2];
};


// Main Update routines
//==========================================================================
ATON._updateCallback = function(){
    ATON._time = 0;
    ATON._tLastLowFreq = 0;
    ATON._prevDirection = osg.vec3.create();
};
/** @lends ATON._updateCallback.prototype */
ATON._updateCallback.prototype = {
    update: function ( node, nv ){

        ATON._currFPS = (1.0 / nv.getFrameStamp()._deltaTime);
/*
        if (ATON._time > 1.0){
            if (ATON._currFPS < ATON._dynamicFPSrange[0] && ATON._viewer._devicePixelRatio>0.25) ATON._viewer._devicePixelRatio -= 0.05;
            //if (ATON._currFPS >= ATON._dynamicFPSrange[1] && ATON._viewer._devicePixelRatio<2.0)  ATON._viewer._devicePixelRatio += 0.05;

            console.log(ATON._currFPS, ATON._viewer._devicePixelRatio);
            }
*/
        ATON._time = nv.getFrameStamp().getSimulationTime();
        ATON._mainSS.getUniform('time').setFloat( ATON._time );

        //console.log(1.0/ATON._dtFrame);

        var manip = ATON._viewer.getManipulator();

        //================ Navigation computations: we grab _currPOV and modify it, then update manip 
        // Store previous view data
        ATON._prevPOV.pos[0] = ATON._currPOV.pos[0];
        ATON._prevPOV.pos[1] = ATON._currPOV.pos[1];
        ATON._prevPOV.pos[2] = ATON._currPOV.pos[2];
        ATON._prevPOV.target[0] = ATON._currPOV.target[0];
        ATON._prevPOV.target[1] = ATON._currPOV.target[1];
        ATON._prevPOV.target[2] = ATON._currPOV.target[2];

        manip.getTarget( ATON._currPOV.target );
        manip.getEyePosition( ATON._currPOV.pos );

        ATON._prevDirection[0] = ATON._direction[0];
        ATON._prevDirection[1] = ATON._direction[1];
        ATON._prevDirection[2] = ATON._direction[2];

        // POV transitions
        if (ATON._tPOVcall >= 0.0){
            if (ATON._vrState) ATON._handlePOVrequestVR(); 
            else ATON._handlePOVrequest();
            }

        // Polarization
        // MagNodes
        if (ATON._tPOVcall < 0.0 /*&& !ATON._vrState*/) ATON._handleMagNetClosest();
        // QV
        if (ATON._tPOVcall < 0.0 && ATON._polarizeLocomotionQV) ATON._polarizeLocomotionQV();

        // Generic Constraints
        if (ATON.applyPOVconstraints) ATON.applyPOVconstraints();

        // VR Controllers FIXME:
        //if (ATON._vrState && !ATON._isMobile) ATON._handleVRcontrollers();
        /*if (!ATON._isMobile)*/ ATON._handleGamepads();

        // Updates direction
        osg.vec3.sub( ATON._direction, ATON._currPOV.target, ATON._currPOV.pos);
        osg.vec3.normalize( ATON._direction, ATON._direction );

        // Gravity and Collisions
/*
        if (ATON._tPOVcall < 0.0){

            if (ATON._bUseGravity) ATON._handleGravity();
            if (ATON._bUseCollisions) ATON._handleCollisions();
            }
*/
/*
        // SAFE
        manip.setTarget(ATON._currPOV.target);
        manip.setEyePosition(ATON._currPOV.pos);
*/
        // Store velocity vector (NOT USED)
/*
        ATON._vVelocity[0] = (ATON._currPOV.pos[0] - ATON._prevPOV.pos[0]);
        ATON._vVelocity[1] = (ATON._currPOV.pos[1] - ATON._prevPOV.pos[1]);
        ATON._vVelocity[2] = (ATON._currPOV.pos[2] - ATON._prevPOV.pos[2]);
        //console.log(ATON._vVelocity);
*/

        if (ATON._vrState || ATON._isMobile){
            ATON._dOriTol = ATON.STD_D_ORI_MOBILE;
            ATON._dPosTol = ATON.STD_D_POS_MOBILE;
            }
        else {
            ATON._dOriTol = ATON.STD_D_ORI_DESKTOP;
            ATON._dPosTol = ATON.STD_D_POS_DESKTOP;
            }

        
        // Deltas
        ATON._dOri = osg.vec3.dot(ATON._prevDirection, ATON._direction);
        ATON._dPos = osg.vec3.squaredDistance(ATON._currPOV.pos, ATON._prevPOV.pos);
        //console.log(ATON._dPos);
        
        // Query/Intersection routines
        if (ATON._dOri > ATON._dOriTol && ATON._dPos < ATON._dPosTol && (ATON._tPOVcall < 0.0) && (ATON._nodeReqs==0)){
            ATON._handleVisHover();
            
            // Handle Descriptors HOVER
            if (ATON._numDescriptors > 0) ATON._handleDescriptorsHover();

            // Polarization (QVs)
            if (ATON._polarizeLocomotionQV){
                if (ATON.polarizedAffordance) ATON.polarizedAffordance();
                }
            
            //if (ATON._hoverColor[3]<1.0) ATON._hoverColor[3] += 0.1;
            //console.log(dOri);

            // Dynamic density
            //ATON._viewer._devicePixelRatio = ATON._baseDevicePixelRatio;
            }
        else {
            ATON._hoveredVisData = undefined;
            //if (ATON._hoverColor[3]>0.0) ATON._hoverColor[3] -= 0.1;

            // Dynamic density
            //ATON._viewer._devicePixelRatio = ATON._baseDevicePixelRatio * 0.5;
            }

        ATON._mainSS.getUniform('uHoverColor').setFloat4(ATON._hoverColor);

        if (ATON._hoveredVisData === undefined){
            if (ATON._hoverColor[3]>0.0) ATON._hoverColor[3] -= 0.1;
            }
        
        ATON.trackVR();

/*
        // Store prev-POV
        ATON._prevPOV.pos[0] = ATON._currPOV.pos[0];
        ATON._prevPOV.pos[1] = ATON._currPOV.pos[1];
        ATON._prevPOV.pos[2] = ATON._currPOV.pos[2];
        ATON._prevPOV.target[0] = ATON._currPOV.target[0];
        ATON._prevPOV.target[1] = ATON._currPOV.target[1];
        ATON._prevPOV.target[2] = ATON._currPOV.target[2];
*/
        ATON._mainSS.getUniform('uViewDirWorld').setFloat3( ATON._direction );
        ATON._mainSS.getUniform('uWorldEyePos').setFloat3(ATON._currPOV.pos);

        manip.setTarget(ATON._currPOV.target);
        manip.setEyePosition(ATON._currPOV.pos);
        //================ End of Navigation

        // Descriptors
/*
        if (ATON._hoveredDescriptor){            
            //ATON._mainSS.getUniform('uHoverColor').setFloat4([0,1,1, 0.5]);

            let D = ATON.descriptors[ATON._hoveredDescriptor];
            let dBS = D.node.getBoundingSphere();
            var C = dBS._center.slice(0);
            
            //console.log(dBS._center,dBS._radius);
            
            //ATON._descrSS.getUniform('uHoverPos').setFloat3(C);
            ATON._descrSS.getUniform('uHoverRadius').setFloat(dBS._radius * 0.95);
            }
        else {
            ATON._descrSS.getUniform('uHoverRadius').setFloat(0.1);
            }
*/

/*
        if (ATON._HMD)
            console.log(ATON._HMD.stageParameters); // .sittingToStandingTransform[13]
            //console.log(ATON._HMD.getPose());
*/

        // LP/Env
        if (ATON._LProtM){
            osg.mat4.setTranslation(ATON._LProtM, ATON._currPOV.pos);
            }

        // Handle transform animations
        ATON._handleTransformAnims();

        // Execute custom onTick routines
        for (let uf = 0; uf < ATON.onTickRoutines.length; uf++) {
            const UF = ATON.onTickRoutines[uf];
            UF();
            }

        return true;
        }
};

ATON._handleTransformAnims = function(){
    let numAnim = ATON._reqTransAnim.length;
    if (numAnim <= 0) return; 

    for (let a = 0; a < numAnim; a++){
        let anim = ATON._reqTransAnim[a];

        // TODO:
        }
};

// Low-freq update callbacks
/*
ATON._lowUpdateCallback = setInterval(function(){
    //ATON._handleVisHover();
    console.time( 'kdtree build' );
    var treeBuilder = new osg.KdTreeBuilder({
        _numVerticesProcessed: 0,
        _targetNumTrianglesPerLeaf: 50,
        _maxNumLevels: 20
        });
    treeBuilder.apply( ATON._rootScene );
    console.timeEnd( 'kdtree build' );
}, 4000);
*/

// Used to add custom onTick routine
ATON.addOnTickRoutine = function( uf ){
    ATON.onTickRoutines.push( uf );
};

ATON._handleDescriptorsHover = function(){
        //var dp;
        if (!ATON._vrState){
            ATON._pickedDescriptorData = ATON._handleScreenPick(ATON._screenQuery[0],ATON._screenQuery[1], ATON_MASK_DESCRIPTORS);
            }
        else {
            ATON._pickedDescriptorData = ATON._handle3DPick(/*ATON._rootDescriptors*/ ATON._worldTransform, ATON_MASK_DESCRIPTORS);
            }
        
        if (ATON._pickedDescriptorData){
            ATON._descrSS.getUniform('uHoverPos').setFloat3(ATON._pickedDescriptorData.p);

            // last (deeper) descriptorID on the path
            var hovD = undefined;
            if (ATON._pickedDescriptorsPath.length>0) hovD = ATON._pickedDescriptorsPath[ATON._pickedDescriptorsPath.length-1];

            // squared distances to curr eye position
            let distE2D = osg.vec3.squaredDistance(ATON._currPOV.pos, ATON._pickedDescriptorData.p);
            let distE2V = undefined;
            if (ATON._hoveredVisData) distE2V = osg.vec3.squaredDistance(ATON._currPOV.pos, ATON._hoveredVisData.p);

            var bOccluded = false;
            if (distE2V && ATON._bQueryUseOcclusion){
                if (distE2V < distE2D) bOccluded = true;
                }

            // On Hover:
            // Volumetric
            var bPickedVolumetric = false;
            if (hovD !== ATON._hoveredDescriptor){
                
                //ATON._hoveredDescriptor = hovD;
                //let hD = ATON.descriptors[ATON._hoveredDescriptor];
                let hD = ATON.descriptors[hovD];

                if (hD && !bOccluded){
                    if (!hD._bSurface){
                        if (hD.onHover) hD.onHover();
                        ATON.fireEvent("ShapeDescriptorHovered", hD);
                        bPickedVolumetric = true;
                        ATON._hoveredDescriptor = hovD;
                        }
                    else if (ATON._hoveredVisData){ // FIXME: kinda ok, but we have occlusion
                        let dC = hD.node.getBoundingSphere()._center;
                        let distS = osg.vec3.squaredDistance(dC, ATON._pickedDescriptorData.p); // semantic distance
                        let distV = osg.vec3.squaredDistance(dC, ATON._hoveredVisData.p); // visible distance
                        if (distV <= distS){
                            if (hD.onHover) hD.onHover();
                            ATON.fireEvent("ShapeDescriptorHovered", hD);
                            ATON._hoveredDescriptor = hovD;
                            }
                        }
                    }
                }

/*
            if (ATON._hoveredVisData){
                for (let pd = 0; pd < ATON._pickedDescriptorsPath.length; pd++){
                    const PDkey = ATON._pickedDescriptorsPath[pd];
                    
                    let hhD = ATON.descriptors[PDkey];
                    if (hhD && hhD._bSurface){ // && PDkey !== ATON._hoveredDescriptor
                        let dC = hhD.node.getBoundingSphere()._center;
                        let distS = osg.vec3.squaredDistance(dC, ATON._pickedDescriptorData.p); // semantic distance
                        let distV = osg.vec3.squaredDistance(dC, ATON._hoveredVisData.p); // visible distance

                        //console.log(distS,distV);

                        if (distV <= distS){
                            ATON._hoveredDescriptor = PDkey;
                            if (hhD.onHover) hhD.onHover();
                            ATON.fireEvent("ShapeDescriptorHovered", hhD);
                            }
                        }
                    }
                }
*/
            }

        // On Leave
        else {
            if (ATON._hoveredDescriptor) ATON.fireEvent("ShapeDescriptorLeft");
            ATON._hoveredDescriptor = undefined;
            }

        // Surface FIXME:
/*
        //if (bPickedVolumetric) return;

        if (ATON._hoveredVisData){
            var dCandidate = undefined;
            var rmin = undefined;

            for (var d in ATON.descriptors){
                const DD = ATON.descriptors[d];
                if (DD._bSurface){
                    const dbs = DD.node.getBoundingSphere();
                    const DC = dbs._center;
                    const DR = dbs._radius * dbs._radius;

                    let distV = osg.vec3.squaredDistance(DC, ATON._hoveredVisData.p); // visible distance
                    if (distV < DR){
                        if (rmin === undefined || (DR<rmin) ){ 
                            dCandidate = d;
                            rmin = DR;
                            }
                        }
                    }
                }

            if (dCandidate !== ATON._hoveredDescriptor){
                //ATON._hoveredDescriptor = dCandidate;

                let DFinal = ATON.descriptors[dCandidate];
                if (DFinal){
                    ATON._hoveredDescriptor = dCandidate;

                    if (DFinal.onHover) DFinal.onHover();
                    ATON.fireEvent("ShapeDescriptorHovered", DFinal);
                    }
                }
            }
*/
};

// Hover on Visible-Graph: Called each update
ATON._handleVisHover = function(){
        // STD
        if (!ATON._vrState && !ATON._bDevOri){
            ATON._hoveredVisData = ATON._handleScreenPick(ATON._screenQuery[0],ATON._screenQuery[1], ATON_MASK_VISIBLE);
            }
        // VR
        else {
            // We have right controller active
            if (ATON._activeVRcontrollers[ATON_VR_CONTROLLER_R]){
                var pStart = ATON._vrControllersPos[ATON_VR_CONTROLLER_R];
                var pEnd   = osg.vec3.create();
                var LA     = 20.0;

                pEnd[0] = pStart[0] + (ATON._vrControllersDir[ATON_VR_CONTROLLER_R][0] * LA);
                pEnd[1] = pStart[1] + (ATON._vrControllersDir[ATON_VR_CONTROLLER_R][1] * LA);
                pEnd[2] = pStart[2] + (ATON._vrControllersDir[ATON_VR_CONTROLLER_R][2] * LA);

                ATON._hoveredVisData = ATON._handle3DPick(
                    ATON._worldTransform, //ATON._rootScene, 
                    ATON_MASK_VISIBLE,
                    LA, // unused
                    pStart,
                    pEnd
                    );
                }
            // Use egocentric ray
            else ATON._hoveredVisData = ATON._handle3DPick(/*ATON._rootScene*/ATON._worldTransform, ATON_MASK_VISIBLE);
            }

        if (ATON._hoveredVisData){
            ATON._mainSS.getUniform('uHoverPos').setFloat3(ATON._hoveredVisData.p);
            ATON._computeAffordanceHover();
            }
        //else ATON._mainSS.getUniform('uHoverAffordance').setFloat( 0.0 );
};

// Compute Surface Affordance
// HoveredData must be valid
ATON._computeAffordanceHover = function(){
    //if (ATON._hoveredVisData === undefined) return;

    // Surface Affordance
    //ATON._surfAff = 0.0; // cumulative with other parameters
    var pn = ATON._hoveredVisData.n;
    var pp = ATON._hoveredVisData.p;
    
    // Determine walkable surface
    if (pn[2] < 0.8 && ATON._bFirstPersonMode){
        ATON._bSurfAffordable = false;
        //ATON._surfAff = 0.1;
        ATON._hoverColor[0] = 1.0;
        ATON._hoverColor[1] = 0.0;
        ATON._hoverColor[2] = 0.0;
        ATON._hoverColor[3] = 0.3;
        }
    else {
        ATON._bSurfAffordable = true;
        //ATON._surfAff = 1.0;
        ATON._hoverColor[0] = 0.0;
        ATON._hoverColor[1] = 1.0;
        ATON._hoverColor[2] = 0.0;
        ATON._hoverColor[3] = 1.0;
        }
};


// Realize
//==========================================================================
ATON.realize = function( canvas ){
	if (canvas === undefined){
		console.log("ERROR: you must provide a valid canvas element");
		return;
		}

    ATON._canvas = canvas;

    // Device detection
    //ATON._isMobile = ATON.utils.detectMobileDevice();
    ATON.utils.detectDeviceCapab();
    ATON._bDevOri  = false;

    ATON._initGraph();

    ATON._initCoreUniforms();

    // Current and Home POV
    ATON._prevPOV  = new ATON.pov; 
    ATON._currPOV  = new ATON.pov;
    ATON._homePOV  = new ATON.pov;
    ATON._homeAuto = true;

    // Transitions
    ATON._fromPOV      = new ATON.pov;
    ATON._toPOV        = new ATON.pov;
    ATON._tPOVcall     = -1.0;
    ATON._tPOVduration = ATON_STD_POV_DURATION;
    ATON._reqPOVi      = -1; // DB index

    // Realize and run the main Viewer
    ATON._viewer = new osgViewer.Viewer( canvas, {
        'antialias': ATON._isMobile? false : true, // FIXME: some artifacts on mobile, fixes VR issues 
        //'stats': true,
        'overrideDevicePixelRatio': 1, // if specified override the device pixel ratio
        'enableFrustumCulling': true,
        //'alpha': true,
        //'scrollwheel': false,
        //'webgl2': true,
        });

    ATON._viewer.init();
    ATON._viewer.setLightingMode( osgViewer.View.LightingMode.NO_LIGHT );

    // Orbit (default) 
    ATON._viewer.setupManipulator();
    
    ATON._orbitMan = ATON._viewer.getManipulator();
    //ATON._orbitMan = new osgGA.OrbitManipulator({ inputManager: this._viewer.getInputManager() });
    //ATON._viewer.setManipulator( ATON._orbitMan );
    
    ATON._orbitMan.setNode(ATON._rootScene);
    //console.log(ATON._orbitMan);

    // First person
    ATON._firstPerMan = new osgGA.FirstPersonManipulator({ inputManager: this._viewer.getInputManager() });
    ATON._firstPerMan.setNode( ATON._rootScene );
    ATON.setFirstPersonStep(2.0);

    // Voids space-key calls
    ATON._orbitMan.computeHomePosition    = function(){};
    ATON._firstPerMan.computeHomePosition = function(){};

    // POV List (DB)
    ATON.POVlist = new Array();

    // Descriptors List (direct access by unique name ID)
    ATON.descriptors = {}; //new Array();

    // MagNet (TODO)
    ATON.MagNet = new Array();


    ATON._viewer.setSceneData( ATON._root );

    ATON._viewer.run();

    ATON._camera = ATON._viewer.getCamera();
    ATON._camera.setNearFarRatio( ATON_NEARFARRATIO_STD );

    ATON.setFOV( ATON_STD_FOV );    // sets default FOV for std viewer


    // Register update callbacks and listeners
	ATON._root.addUpdateCallback( new ATON._updateCallback() );
    //ATON._root.setCullCallback( new ATON._cullCallback() );
    ATON._attachListeners();


    // Load Core Shaders
    ATON.loadCoreShaders( ATON.shadersFolder );

    // Speech
    ATON.initSpeechSynthesis();
    ATON.initSpeechRecognition();

/*
    if ( window.screenfull ) {
        document.addEventListener( window.screenfull.raw.fullscreenchange, function () {
            console.log( 'toggle VR mode' );
            ATON.toggleVR();
        }.bind( this ) );
    }
*/

/*
    if (!ATON._isMobile)
    else {

        }
*/

/*
    var displayGraph = osgUtil.DisplayGraph.instance();
    displayGraph.setDisplayGraphRenderer( true );
    displayGraph.createGraph( ATON._root );
*/

    // Experimental
    //ATON._viewer.setManipulator( ATON._firstPerMan );

/*
    var LWcode = _loaderWorker.toString();
    LWcode = LWcode.substring(LWcode.indexOf("{")+1, LWcode.lastIndexOf("}"));

    var LWblob = new Blob([LWcode], {type: "application/javascript"});
    this.loadWorker = new Worker(URL.createObjectURL(LWblob));
*/
};

ATON.setDevicePixelRatio = function(r){
    if (!ATON._viewer) return;
    if (!r || r <= 0.0) return;

    ATON._viewer._devicePixelRatio = r;
    ATON._baseDevicePixelRatio = r;
    //console.log("PixelRatio: "+r);
};


// Listeners
//==========================================================================
ATON._attachListeners = function(){

    // MULTI-TOUCH
	Hammer(ATON._canvas).on("doubletap", function(e){
        if (ATON._vrState) return;
/*
    if (e.center !== undefined){
        // remap to current canvas sizes

        var x = e.center.x * ( ATON._canvas.width / ATON._canvas.clientWidth );
        var y = ( ATON._canvas.clientHeight - e.center.y ) * ( ATON._canvas.height / ATON._canvas.clientHeight );

        //var x = e.center.x * ( CanvasInfo.W / CanvasInfo.clientW );
        //var y = ( CanvasInfo.clientH - e.center.y ) * ( CanvasInfo.H / CanvasInfo.clientH );
*/

        //if (!ATON._bZflat) return; // TEST

        var pData = ATON._handleScreenPick(ATON._screenQuery[0],ATON._screenQuery[1], ATON_MASK_VISIBLE);
        if (pData){
            var pp = pData.p;
            console.log("Point: ["+pp[0].toFixed(3)+","+pp[1].toFixed(3)+","+pp[2].toFixed(3)+"]");
            console.log("Eye:   ["+ATON._currPOV.pos[0].toFixed(3)+","+ATON._currPOV.pos[1].toFixed(3)+","+ATON._currPOV.pos[2].toFixed(3)+"]");

            if (ATON._bFirstPersonMode){
                ATON._requestFirstPersonTrans(pData);
                }
            else {
                var nPOV = new ATON.pov;
                var E = osg.vec3.create();

                if (ATON._polPos && ATON._polForce>0.0){
                    E[0] = ATON._polPos[0];
                    E[1] = ATON._polPos[1];
                    E[2] = ATON._polPos[2];
                    }
                else osg.vec3.lerp(E, ATON._currPOV.pos, pp, 0.5);

                nPOV.pos    = E;
                nPOV.target = pp;
                nPOV.fov    = ATON._currPOV.fov;

                ATON.requestPOV(nPOV, 1.0);
                }

            }
		});

    var midX = ( 0.5 * ATON._canvas.width); /// (ATON._canvas.clientWidth * 0.5) );
    var midY = ( 0.5 * ATON._canvas.height); /// (ATON._canvas.clientHeight * 0.5) );

    Hammer(ATON._canvas).on("tap", function(evt){
        if (ATON._bQueryAxisAligned){
            ATON._screenQuery[0] = midX;
            ATON._screenQuery[1] = midY;
            }

        else {
            ATON._screenQuery[0] = evt.center.x * ( ATON._canvas.width / ATON._canvas.clientWidth );
            ATON._screenQuery[1] = ( ATON._canvas.clientHeight - evt.center.y ) * ( ATON._canvas.height / ATON._canvas.clientHeight );
            }
        //console.log(evt.center);
        });

    // MOUSE COORDS
	ATON._canvas.addEventListener('mousemove', function(evt){
        if (ATON._vrState) return;

        /*
	    var rect = ATON._canvas.getBoundingClientRect();
		var mx = evt.clientX - rect.left;
		var my = evt.clientY - rect.top;
        */

        if (ATON._bQueryAxisAligned){
            ATON._screenQuery[0] = midX;
            ATON._screenQuery[1] = midY;

            ATON._screenQueryNormalized[0] = 0.5;
            ATON._screenQueryNormalized[1] = 0.5;
            }

        else {
            ATON._screenQuery[0] = evt.clientX * ( ATON._canvas.width / ATON._canvas.clientWidth );
            ATON._screenQuery[1] = ( ATON._canvas.clientHeight - evt.clientY ) * ( ATON._canvas.height / ATON._canvas.clientHeight );

            ATON._screenQueryNormalized[0] = (ATON._screenQuery[0] / ATON._canvas.width).toFixed( 3 );
            ATON._screenQueryNormalized[1] = (ATON._screenQuery[1] / ATON._canvas.height).toFixed( 3 );
            }


        //console.log( ATON._screenQueryNormalized );
        }, false);
          
    // Mouse buttons
    ATON._canvas.addEventListener('mousedown', function(e){
        if (e.button === 1) ATON.fireEvent("MouseMidButton");      // middle-click
        if (e.button === 2) ATON.fireEvent("MouseRightButton");    // right-click
        });

    // KEYBOARD
	$(function(){
		$(document).keydown(function(e){
            ATON.fireEvent("KeyPress", e.key);

	    	if (e.keyCode == 32) { // space
                e.preventDefault();
				//console.log('space');
                ATON.requestHome();

                //return false;
	    		}
	    	if (e.keyCode == 107) { // +
                var currFOV = ATON._currPOV.fov;
                currFOV += 0.5;

                ATON.setFOV(currFOV);
	    		}
	    	if (e.keyCode == 109) { // -
                var currFOV = ATON._currPOV.fov;
                currFOV -= 0.5;
                if (currFOV<=0.5) currFOV = 0.5;

                ATON.setFOV(currFOV);
	    		}
/*
	    	if (e.key == 'v'){ // v
				ATON.toggleVR();
	    		}
            if (e.keyCode == 13){ // ENTER
                if (ATON._vrState) ATON._requestFirstPersonTrans(ATON._hoveredVisData);
                }

	    	if (e.key == 'c'){
				ATON._bUseCollisions = !ATON._bUseCollisions;
	    		}
	    	if (e.key == 'g'){
				ATON._bUseGravity = !ATON._bUseGravity;
	    		}
	    	if (e.key == 'f'){
                if (ATON._hoveredDescriptor){
                    let D = ATON.descriptors[ATON._hoveredDescriptor];
				    if (D.onSelect) D.onSelect();  
                    else ATON.requestPOVbyDescriptor(ATON._hoveredDescriptor, 0.3);
                    }
                else ATON.requestPOVbyActiveGraph(0.3);
	    		}
*/
/*
	    	if (e.keyCode == 102){ // numpad right
                var nexti = (ATON._reqPOVi + 1) % ATON.POVlist.length;
                ATON.requestPOVbyIndex( nexti );
                //console.log(nexti);
	    		}
*/				
	  		});
		});

    ATON.on("KeyPress", (k)=>{
        if (k === 'v') ATON.toggleVR();
        if (k === 'f'){
            if (ATON._hoveredDescriptor){
                let D = ATON.descriptors[ATON._hoveredDescriptor];
				if (D.onSelect) D.onSelect();  
                else ATON.requestPOVbyDescriptor(ATON._hoveredDescriptor, 0.3);
                }
            else ATON.requestPOVbyActiveGraph(0.3);
            }
        });

    // On resize
    $(window).on('load resize', ATON._onResize );

    // HMD on / off FIXME:
    window.addEventListener("vrdisplayactivate", function() {

        if ( ATON._viewer.getVRDisplay() ) ATON._viewer.setPresentVR( true ).then( ATON._switchVR.bind(this) );
        else ATON._switchVR();

        console.log("HMD active");
        });
    window.addEventListener("vrdisplaydeactivate", function() {

        if ( ATON._viewer.getVRDisplay() ) ATON._viewer.setPresentVR( false ).then( ATON._switchVR.bind(this) );
        else ATON._switchVR();

        console.log("HMD off");
        });

    console.log("Listeners registered.");
};

ATON._onResize = function(){
    console.log("On resize");
};

ATON.toggleDeviceOrientation = function(b){
    ATON._bDevOri = b;
    ATON._viewer.getInputManager().setEnable(InputGroups.FPS_MANIPULATOR_DEVICEORIENTATION, b);

    //ATON._viewer.getEventProxy().DeviceOrientation.setEnable( b );
};

// Scene Management
//==========================================================================

ATON._initGraph = function(){
    ATON._root = new osg.Node();        // the very root
    ATON._mainGroup = new osg.Node();   // main group

    ATON._rootScene     = new osg.Node();
    ATON._rootDescriptors = new osg.Node();
    ATON._rootUI          = new osg.Node();
    //ATON._rootUIspace    // TODO: separate group for unscaled UI

    // Main world transform
    ATON._worldTransform = ATON.createTransformNode();
    ATON._worldTransform.addChild(ATON._rootScene);
    ATON._worldTransform.addChild(ATON._rootDescriptors);
    ATON._worldTransform.addChild(ATON._rootUI);

    ATON._mainGroup.addChild(ATON._worldTransform);

    //ATON._mainGroup.addChild(ATON._rootScene);
    //ATON._mainGroup.addChild(ATON._rootDescriptors);

    // LP
    ATON._LPT = new osg.MatrixTransform();
    ATON._mainGroup.addChild(ATON._LPT);

    //ATON._mainGroup.addChild(ATON._rootScene);
    //ATON._mainGroup.addChild(ATON._rootDescriptors);
    //ATON._mainGroup.addChild(ATON._rootUI);

    ATON._root.addChild(ATON._mainGroup);

    // Masks
    ATON._rootScene.setNodeMask( ATON_MASK_VISIBLE );
    ATON._rootDescriptors.setNodeMask( ATON_MASK_DESCRIPTORS );
    ATON._rootUI.setNodeMask( ATON_MASK_UI );
    ATON._LPT.setNodeMask( ATON_MASK_NO_PICK );

    // IVs
    ATON._IVvis.setIntersector(ATON._LSIvis);
    ATON._IVvis.setTraversalMask( ATON_MASK_VISIBLE );
    ATON._IVdesc.setIntersector(ATON._LSIdesc);
    ATON._IVdesc.setTraversalMask( ATON_MASK_DESCRIPTORS );

    // Layers (visible SG)
    ATON.layers = {}; //new Array();

    ATON.nodes = {};

    // StateSets
    ATON._mainSS  = ATON._mainGroup.getOrCreateStateSet();

    ATON._visSS   = ATON._rootScene.getOrCreateStateSet();
    ATON._descrSS = ATON._rootDescriptors.getOrCreateStateSet();
    ATON._uiSS    = ATON._rootUI.getOrCreateStateSet();

    // Best blending
/*
    ATON._mainSS.setAttributeAndModes( 
        new osg.BlendFunc(osg.BlendFunc.SRC_ALPHA, osg.BlendFunc.ONE_MINUS_SRC_ALPHA),
        osg.StateAttribute.ON
        );
*/
    // Descriptors ss
    ATON._descrSS.setAttributeAndModes( 
        new osg.BlendFunc(osg.BlendFunc.SRC_ALPHA, osg.BlendFunc.ONE_MINUS_SRC_ALPHA),
        //new osg.BlendFunc(osg.BlendFunc.SRC_ALPHA, osg.BlendFunc.ONE), 
        osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE
        );

    ATON._descrSS.setTextureAttributeAndModes( 0, ATON.utils.createFillTexture([1,1,1, 0.2]) ); // def color
    ATON._descrSS.setRenderingHint('TRANSPARENT_BIN');
    //ATON._descrSS.setBinNumber(11);

    //ATON._descrSS.setAttributeAndModes( osg.LIGHTING, osg.StateAttribute.OFF);

    ATON._descrSS.setAttributeAndModes(
        new osg.CullFace( 'BACK' ),
        osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE
        );

    var df = new osg.Depth( osg.Depth.LESS ); // osg.Depth.ALWAYS
    df.setRange(0.0,1.0);
    df.setWriteMask(false); // important
    ATON._descrSS.setAttributeAndModes( df, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);

    // without shader
	//var material = new osg.Material();
	//material.setDiffuse( [1,0,0, 0.2] );
	//ATON._descrSS.setAttributeAndModes( material,osg.StateAttribute.ON);

    // UI ss
    ATON._uiSS.setRenderingHint('TRANSPARENT_BIN');
    //ATON._uiSS.setBinNumber(12);
    ATON._uiSS.setTextureAttributeAndModes( ATON_SM_UNIT_BASE, ATON.utils.fallbackWhiteTex );
    ATON._uiSS.setAttributeAndModes(
        //new osg.BlendFunc(), // osg.BlendFunc.SRC_ALPHA, osg.BlendFunc.ONE_MINUS_SRC_ALPHA 
        new osg.BlendFunc(osg.BlendFunc.SRC_ALPHA, osg.BlendFunc.ONE_MINUS_SRC_ALPHA),
        osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE
        );

    ATON._uiSS.setAttributeAndModes( df, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);

    // Check
    //ATON._rootUI.setCullingActive( false );
    //ATON._rootDescriptors.setCullingActive( false );
        
    // TODO, move to VR onswitch?
    //ATON.createVRcontrollers();
};

/* TODO: use loading webWorkers
ATON.addGraphXXX = function( url, onComplete ){
    var self = this;

    ATON.loadWorker.postMessage(url);
};
*/

ATON.updateHoverRadius = function(r){
    if (r !== undefined) ATON._hoverRadius = r;
    ATON._mainSS.getUniform('uHoverRadius').setFloat(ATON._hoverRadius);
};

/*
    LAYERS - TO BE DEPRECATED
==================================*/
/*
ATON.createNewLayer = function(uniqueName){
    if (uniqueName.length <= 1) return; // too short
    if (ATON.layers[uniqueName]) return; // already created

    // First time, create the layer
    let L = new osg.MatrixTransform();
    L.setName(uniqueName);
    L._layermask = 0xf;

    ATON._rootScene.addChild( L );
    ATON.layers[uniqueName] = L;

    console.log("Created new layer "+uniqueName);
    return L;
};
*/
/*
// Create new layer (visible sg)
ATON.addNewLayer = function(uniqueName, parentName){
    if (uniqueName.length <= 1) return; // too short
    if (ATON.layers[uniqueName]) return; // already created

    // First time, create the layer
    ATON.layers[uniqueName] = new osg.MatrixTransform(); //new osg.Node();
    ATON.layers[uniqueName].setName(uniqueName);
    //ATON.layers[uniqueName].setNodeMask(ATON_MASK_VISIBLE);

    ATON.layers[uniqueName]._layerMask = 0xf;

    var parentLayer = undefined;
    if (parentName && ATON.layers[parentName]){
        parentLayer = ATON.layers[parentName];
        parentLayer.addChild(ATON.layers[uniqueName]);
        }
    else ATON._rootScene.addChild( ATON.layers[uniqueName] );

    console.log("Created new layer "+uniqueName);
    return ATON.layers[uniqueName];
};

ATON.getLayer = function(layerName){
    return ATON.layers[layerName];
};

ATON.setLayerMask = function(layerName, mask){
    let layer = ATON.layers[layerName];
    if (layer === undefined) return;

    layer._layerMask = mask;
    layer.setNodeMask(mask);
};

ATON.switchLayer = function(layerName, value){
    let layer = ATON.layers[layerName];
    if (layer === undefined) return;

    if (value){
        layer.setNodeMask(layer._layerMask);
        ATON.fireEvent("LayerSwitch", { name:layerName, value:true } );
        ATON._buildKDTree(ATON._rootScene);
        }
    else {
        layer.setNodeMask(0x0);
        ATON.fireEvent("LayerSwitch", { name:layerName, value:false } );
        //ATON._buildKDTree(ATON._rootScene);
        }
};

ATON.toggleLayer = function(layerName){
    let layer = ATON.layers[layerName];
    if (layer === undefined) return;
    
    if (layer.getNodeMask() === 0x0) ATON.switchLayer(layerName,true);
    else ATON.switchLayer(layerName,false);
};

ATON.isolateLayer = function(layerName){
    for (var key in ATON.layers){
        if (key === layerName) ATON.switchLayer(key, true);
        else ATON.switchLayer(key, false);
        }
};

ATON.switchAllLayers = function(value){
    for (var key in ATON.layers){
        let layer = ATON.layers[key];

        if (value){
            ATON.switchLayer(key, true);
            //layer.setNodeMask(layer._layerMask);
            //ATON.fireEvent("LayerSwitch", { name:key, value:true } );
            }
        else {
            ATON.switchLayer(key, false);
            //layer.setNodeMask(0x0);
            //ATON.fireEvent("LayerSwitch", { name:key, value:false } );
            }
        }
};

ATON.transformLayerByMatrix = function(layerName, M){
    let layer = ATON.layers[layerName];
    if (layer === undefined) return;

    layer.setMatrix( M );
};

ATON.translateLayer = function(layerName, v){
    let layer = ATON.layers[layerName];
    if (layer === undefined) return;

    var M = layer.getMatrix();
    osg.mat4.setTranslation(M, v );
};
*/
/*
ATON.gotoLayer = function(layerName, duration){
    let layer = ATON.layers[layerName];
    if (layer === undefined) return;

    if (r === undefined) r = 0.2;

    layer.dirtyBound();

    var r = layer.getBoundingSphere()._radius;
    var tgt = layer.getBoundingSphere()._center;
    var pos = osg.vec3.create();
    pos[0] = tgt[0] + r;
    pos[1] = tgt[1] + r;
    pos[2] = tgt[2] + r;

    //osg.vec3.lerp(pos, tgt, ATON._currPOV.pos, r);
    //var pov = new ATON.pov("", pos, tgt);
    var pov = new ATON.pov("", ATON._currPOV.pos, tgt);

    ATON.requestPOV(pov, duration);
};
*/

// FIXME: to be DEPRECATED
//--------------------------
ATON.addGraph = function( url, options, onComplete ){
    //var self = this;

    var basepath = ATON.utils.getBaseFolder(url);
    //console.log(basepath);

/*
    var opt = {};
    opt.databasePath = basepath;
    //opt.readNodeURL  = function(){ console.log("XXXX"); };
    //opt.prefixURL    = basepath;
*/
    ATON._nodeReqs++;

    var layerName = undefined;
    if (options && options.layer.length > 1){
        layerName = options.layer;
        ATON.addNewLayer(layerName);
        }

    console.log("...Loading "+ url);
    ATON.fireEvent("NodeRequestFired");    //ATON.onNodeRequestFired();

    var request = osgDB.readNodeURL( url /*, { databasePath: basepath }*/ /*, opt*/ );
    request.then( function ( node ){
        if (ATON._nodeReqs > 0) ATON._nodeReqs--;

        //node.accept( new ATON.utils.dbPathVisitor(basepath) );
        //console.log(node);

        // TS-Visitor (NOT WORKING)
/*
        console.time( 'TS Visitor' );
        var tangentVisitor = new osgUtil.TangentSpaceGenerator();
        node.accept( tangentVisitor );
        console.timeEnd( 'TS Visitor' );
*/

        var N;

        // Procedural Rules
        if (options && options.transformRules){
            N = new osg.Node();
            ATON.utils.generateProduction(node, options.transformRules, N);
            }
        else N = node;

        // Two-Phase pLOD
        if (options && options.hiresurl && options.hirespxsize){
            var plod = new osg.PagedLOD();
            plod.setRangeMode(osg.PagedLOD.PIXEL_SIZE_ON_SCREEN);
            //plod.addChild(node, options.hirespxsize, Number.MAX_VALUE);
            plod.addChild(node, 0.0, options.hirespxsize);

            //plod.setFileName(1, options.hiresurl);

            //plod.setRange(1, 0.0,options.hirespxsize);
            plod.setRange(1, options.hirespxsize, Number.MAX_VALUE);

            plod.setFunction(1, function(parent){
                //console.log("fire!");
                
                var g = new osg.Node();
                g.addChild(node);
                var r = osgDB.readNodeURL( options.hiresurl);
                //ATON._nodeReqs++;
                r.then( function ( hrnode ){
                    //g.addChild( hrnode );
                    g.children[0] = hrnode;
                    ATON._buildKDTree(ATON._rootScene);
                    
                    //if (ATON._nodeReqs > 0) ATON._nodeReqs--;
                    });

                return g;
                });

            N = plod;
            //console.log(N._perRangeDataList[1]);
            }

        // Layer
        if (layerName) ATON.layers[layerName].addChild( N );
        else ATON._rootScene.addChild( N );

        console.log(url + " loaded.");
        
        ATON._onNodeRequestComplete();

        //ATON._rootScene.getBoundingSphere()._radius
        //console.log( ATON._homePOV.pos = ATON._rootScene.getBoundingSphere() );

        if (onComplete !== undefined) onComplete();
        }).catch( function(e) {
            console.error("Unable to load "+url+" - "+e);
        });
};

ATON._buildKDTree = function(node){
    console.time( 'kdtree build' );
    var treeBuilder = new osg.KdTreeBuilder({
        _numVerticesProcessed: 0,
        _targetNumTrianglesPerLeaf: 50,
        _maxNumLevels: 20
        });
    treeBuilder.apply( node );
    console.timeEnd( 'kdtree build' );
};

ATON._onNodeRequestComplete = function(){

    // Bound recomputation
    //ATON._viewer.getManipulator().computeHomePosition();
    if (ATON._homeAuto) ATON.recomputeHome();

    ATON.fireEvent("NodeRequestCompleted");

    if (ATON._nodeReqs > 0) return; // All node requests are completed

    console.log("ALL COMPLETE");
    //ATON.requestHome();
    //console.log(ATON._rootScene);

    // KD-tree
    ATON._buildKDTree(ATON._rootScene);

    // LP/Sky - near plane issues
/*
    var rVis = ATON._rootScene.getBoundingSphere()._radius;
    var cVis = ATON._rootScene.getBoundingSphere()._center.slice(0);
    osg.mat4.setTranslation(ATON._LProtM, cVis);
    osg.mat4.scale(ATON._LProtM, ATON._LProtM, [rVis,rVis,rVis]);
*/
    ATON.fireEvent("AllNodeRequestsCompleted");
    //if (ATON.onAllNodeRequestsCompleted) ATON.onAllNodeRequestsCompleted();
};

// Build panorama geometry
ATON._buildPanoramaGeom = function(){
    let panoNode = osg.createTexturedSphere(40.0, 32,32);

    panoNode.setCullingActive( false );
    panoNode.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );

    // Local Z-up rotation (fix) and add our child uv-sphere
    var Mrz = osg.mat4.create();
    osg.mat4.rotate(Mrz, Mrz, -Math.PI/2.0, ATON_X_AXIS);

    var ZT = new osg.MatrixTransform();
    ZT.setMatrix(Mrz);
    ZT.addChild(panoNode);

    // Env Transform
    ATON._LProtM = osg.mat4.create();
    osg.mat4.rotate(ATON._LProtM, ATON._LProtM, Math.PI/2.0, ATON_Z_AXIS);
    ATON._LPT.addChild(ZT);

    ATON._LPT.setMatrix(ATON._LProtM);
    ATON._LPT.setCullingActive( false );

    var D = new osg.Depth( osg.Depth.LEQUAL );
    D.setRange(1.0, 1.0);
    ATON._LPT.getOrCreateStateSet().setAttributeAndModes(D, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE);
};

// Panorama as uniform RGB(A) color
ATON.setMainPanoramaAsUniformColor = function(color){
    let CTexture = ATON.utils.createFillTexture(color);

    ATON._buildPanoramaGeom();

    ATON._LPT.getOrCreateStateSet().setTextureAttributeAndModes( ATON_SM_UNIT_BASE, CTexture );
};

// Panorama as image
ATON.setMainPanorama = function(urlpano){
    let CTexture = new osg.Texture();
    
    osgDB.readImageURL( urlpano ).then( function ( data ){      
        CTexture.setImage( data );

        CTexture.setMinFilter( osg.Texture.LINEAR ); // important!
        CTexture.setMagFilter( osg.Texture.LINEAR );
        CTexture.setWrapS( osg.Texture.CLAMP_TO_EDGE ); // CLAMP_TO_EDGE / REPEAT
        CTexture.setWrapT( osg.Texture.CLAMP_TO_EDGE );

        // Fix pano flip
        CTexture.setFlipY( false );

        ATON._buildPanoramaGeom();

        ATON._LPT.getOrCreateStateSet().setTextureAttributeAndModes( ATON_SM_UNIT_BASE, CTexture );

        console.log("Panorama "+urlpano+" loaded.");
        });
};


ATON.addIBL = function(folderurl /*, position*/){

    var LPtexture = new osg.Texture();

    osgDB.readImageURL( folderurl + "/LP.png" ).then( function ( data ){      
        LPtexture.setImage( data );

        LPtexture.setMinFilter( osg.Texture.LINEAR ); // important!
        LPtexture.setMagFilter( osg.Texture.LINEAR );
        LPtexture.setWrapS( osg.Texture.CLAMP_TO_EDGE ); // CLAMP_TO_EDGE / REPEAT
        LPtexture.setWrapT( osg.Texture.CLAMP_TO_EDGE );

        // Fix pano flip
        LPtexture.setFlipY( false );

        ATON._visSS.setTextureAttributeAndModes( ATON_SM_UNIT_LP, LPtexture );
        console.log("LightProbe "+folderurl+" loaded.");
        });
    
    ATON.setMainPanorama(folderurl + "/color.jpg");

/*
    var CTexture = new osg.Texture();
    osgDB.readImageURL( folderurl + "/color.jpg" ).then( function ( data ){      
        CTexture.setImage( data );

        CTexture.setMinFilter( osg.Texture.LINEAR ); // important!
        CTexture.setMagFilter( osg.Texture.LINEAR );
        CTexture.setWrapS( osg.Texture.CLAMP_TO_EDGE ); // CLAMP_TO_EDGE / REPEAT
        CTexture.setWrapT( osg.Texture.CLAMP_TO_EDGE );

        // Fix pano flip
        CTexture.setFlipY( false );

        var panoNode = osg.createTexturedSphere(40.0, 32,32);
	    panoNode.setCullingActive( false );
	    panoNode.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );

        // Local Z-up rotation (fix) and add our child uv-sphere
        var Mrz = osg.mat4.create();
        osg.mat4.rotate(Mrz, Mrz, -Math.PI/2.0, ATON_X_AXIS);

        var ZT = new osg.MatrixTransform();
        ZT.setMatrix(Mrz);
        ZT.addChild(panoNode);

        // Env Transform
        ATON._LProtM = osg.mat4.create();
        osg.mat4.rotate(ATON._LProtM, ATON._LProtM, Math.PI/2.0, ATON_Z_AXIS);
        ATON._LPT.addChild(ZT);

        ATON._LPT.setMatrix(ATON._LProtM);
        ATON._LPT.setCullingActive( false );

        var D = new osg.Depth( osg.Depth.LEQUAL );
        D.setRange(1.0, 1.0);
        ATON._LPT.getOrCreateStateSet().setAttributeAndModes( 
            D, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE 
            );

        ATON._LPT.getOrCreateStateSet().setTextureAttributeAndModes( ATON_SM_UNIT_BASE, CTexture );
        //ATON._LPT.getOrCreateStateSet().setTextureAttributeAndModes( osg.LIGHTING, osg.StateAttribute.OFF);

        console.log("LP Color "+folderurl+" loaded.");

        ATON.toggleLightProbePass(true);
        });
*/

    ATON.toggleLightProbePass(true);
};

// GLSL flags
ATON.toggleLightProbePass = function(b){
    ATON._useLP = b;
    ATON.loadCoreShaders( ATON.shadersFolder );   
};

ATON.toggleAOPass = function(b){
    ATON._usePassAO = b;
    ATON.loadCoreShaders( ATON.shadersFolder );   
};

ATON.toggleSessionEncoderPass = function(b, ils){
    ATON._useQUSVsenc = b;
    ATON._useQUSVils  = ils;
    ATON.loadCoreShaders( ATON.shadersFolder ); 
};


// For LP
ATON._cullCallback = function () {
    this.cull = function ( node, nv ) {
        // overwrite matrix, remove translate so environment is always at camera origin
        osg.mat4.setTranslation( nv.getCurrentModelViewMatrix(), [ 0, 0, 0 ] );
        var m = nv.getCurrentModelViewMatrix();
        osg.mat4.copy( ATON._mainSS.getUniform('uLProtation').getInternalArray(), m );
        return true;
    };
};


// Shading Models
//==========================================================================
ATON._initCoreUniforms = function(){
    ATON.GLSLuniforms = {};

    ATON.GLSLuniforms.BaseSampler             = osg.Uniform.createInt1( ATON_SM_UNIT_BASE, 'BaseSampler' );
    ATON.GLSLuniforms.AmbientOcclusionSampler = osg.Uniform.createInt1( ATON_SM_UNIT_AO, 'AmbientOcclusionSampler' );
    ATON.GLSLuniforms.NormalMapSampler        = osg.Uniform.createInt1( ATON_SM_UNIT_NORM, 'NormalMapSampler' );
    ATON.GLSLuniforms.ComboSampler            = osg.Uniform.createInt1( ATON_SM_UNIT_COMBO, 'ComboSampler' );
    ATON.GLSLuniforms.LightProbeSampler       = osg.Uniform.createInt1( ATON_SM_UNIT_LP, 'LightProbeSampler' );

    // Globals
    ATON._hoverRadius = 0.5;
    ATON._hoverColor  = osg.vec4.fromValues(0.0,1.0,0.0, 1.0);
    ATON._fogColor    = osg.vec4.fromValues(1.0,1.0,1.0, 0.0);

    osg.mat4.identity(ATON._mLProtation);
    ATON._mainSS.addUniform( osg.Uniform.createFloat1( 0.0, 'time' ) );
    ATON._mainSS.addUniform( osg.Uniform.createFloat1( 0.7, 'uExposure' ) );
    ATON._mainSS.addUniform( osg.Uniform.createFloat1( 0.5, 'uGIContrib' ) );
    ATON._mainSS.addUniform( osg.Uniform.createFloat3( osg.vec3.create(), 'uViewDirWorld' ) );
    ATON._mainSS.addUniform( osg.Uniform.createFloat3( osg.vec3.create(), 'uWorldEyePos' ) );
    ATON._mainSS.addUniform( osg.Uniform.createMatrix4( ATON._mLProtation, 'uLProtation' ) );
    ATON._mainSS.addUniform( osg.Uniform.createFloat1( 300.0, 'uFogDistance' ) ); // 120
    ATON._mainSS.addUniform( osg.Uniform.createFloat4( ATON._fogColor, 'uFogColor') );
    ATON._mainSS.addUniform( osg.Uniform.createFloat3( osg.vec3.create(), 'uHoverPos' ) );
    //ATON._mainSS.addUniform( osg.Uniform.createFloat1( 0.0, 'uHoverAffordance' ) );
    ATON._mainSS.addUniform( osg.Uniform.createFloat4( ATON._hoverColor, 'uHoverColor' ) );
    ATON._mainSS.addUniform( osg.Uniform.createFloat1( ATON._hoverRadius, 'uHoverRadius' ) );
    ATON._mainSS.addUniform( osg.Uniform.createFloat1( 1.0, 'uDim' ) );

    ATON._mainSS.addUniform( ATON.GLSLuniforms.BaseSampler );

    // Descriptors
    ATON._descrSS.addUniform( osg.Uniform.createFloat3( osg.vec3.create(), 'uHoverPos' ) );
    ATON._descrSS.addUniform( osg.Uniform.createFloat1( 5.0, 'uHoverRadius' ) );

    // QUSV
    if (ATON.QVhandler){
        ATON.GLSLuniforms.QUSVSampler = osg.Uniform.createInt1( ATON_SM_UNIT_QV, 'QUSVSampler' );
        ATON._mainSS.addUniform( ATON.GLSLuniforms.QUSVSampler );
        ATON._mainSS.addUniform( osg.Uniform.createFloat1( 0.0, 'uQVslider') );
        ATON._mainSS.addUniform( osg.Uniform.createFloat1( 0.0, 'uQVradius') );
        ATON._mainSS.addUniform( osg.Uniform.createFloat3( [0.0,0.0,0.0], 'uQVmin' ) );
        ATON._mainSS.addUniform( osg.Uniform.createFloat3( [10.0,10.0,10.0], 'uQVext' ) );
        ATON._mainSS.setTextureAttributeAndModes( ATON_SM_UNIT_QV, ATON.utils.fallbackAlphaTex );
        }

    // LP
    ATON._LPT.getOrCreateStateSet().setTextureAttributeAndModes( ATON_SM_UNIT_BASE, ATON.utils.fallbackWhiteTex );
    
    // Visible SG
    //ATON._visSS.addUniform( ATON.GLSLuniforms.BaseSampler );
    ATON._visSS.addUniform( ATON.GLSLuniforms.AmbientOcclusionSampler );
    ATON._visSS.addUniform( ATON.GLSLuniforms.NormalMapSampler );
    ATON._visSS.addUniform( ATON.GLSLuniforms.ComboSampler );
    ATON._visSS.addUniform( ATON.GLSLuniforms.LightProbeSampler );
    // STD Texture-Units
    ATON._visSS.setTextureAttributeAndModes( ATON_SM_UNIT_BASE,    ATON.utils.fallbackWhiteTex );
    ATON._visSS.setTextureAttributeAndModes( ATON_SM_UNIT_AO,      ATON.utils.fallbackWhiteTex );
    ATON._visSS.setTextureAttributeAndModes( ATON_SM_UNIT_NORM,    ATON.utils.fallbackNormTex );
    ATON._visSS.setTextureAttributeAndModes( ATON_SM_UNIT_COMBO,   ATON.utils.fallbackRedTex ); //
    ATON._visSS.setTextureAttributeAndModes( ATON_SM_UNIT_LP,      ATON.utils.fallbackWhiteTex );

    // UI SG
    //ATON._uiSS.addUniform( ATON.GLSLuniforms.BaseSampler );
    ATON._uiSS.setTextureAttributeAndModes( ATON_SM_UNIT_BASE, ATON.utils.fallbackWhiteTex );
};

ATON.setDim = function(v){
    ATON._mainSS.getUniform('uDim').setFloat( v );
};

ATON.setFogColor = function(fogcol){
    ATON._fogColor = fogcol.slice(0);
    ATON._mainSS.getUniform('uFogColor').setFloat4(ATON._fogColor);
};

ATON._addGLSLprecision = function(glsldata){
    if (ATON._bHighP){
        glsldata = "#ifdef GL_ES\nprecision highp int;\nprecision highp float;\n#endif\n" + glsldata;
        }
    else {
        glsldata = "#ifdef GL_ES\nprecision mediump int;\nprecision mediump float;\n#endif\n" + glsldata;
        }

    return glsldata;
};


ATON.loadCoreShaders = function(path){
    //var self = this;

	$.get( path + "/main.glsl", function(glsldata){
        glsldata = ATON._addGLSLprecision(glsldata);

		// Pre-directives
		if (ATON._isMobile) glsldata = "#define MOBILE_DEVICE 1\n" + glsldata;
        if (ATON._useLP) glsldata = "#define USE_LP 1\n" + glsldata;
        if (ATON._usePassAO) glsldata = "#define USE_PASS_AO 1\n" + glsldata;

        if (ATON._useQUSVsenc) glsldata = "#define USE_QUSV_SENC 1\n" + glsldata;
        if (ATON._useQUSVils)  glsldata = "#define USE_ILSIGN 1\n" + glsldata;

		glsldata += '\n';

		var program = new osg.Program(
			new osg.Shader( 'VERTEX_SHADER', "#define VERTEX_SH 1\n" + glsldata ),
			new osg.Shader( 'FRAGMENT_SHADER', "#define FRAGMENT_SH 1\n" + glsldata )
			);

		ATON._glslCoreProgram = program;
        ATON._onCoreShadersLoaded();

		}, "text");

	$.get( path + "/descriptors.glsl", function(glsldata){
        glsldata = ATON._addGLSLprecision(glsldata);

		// Pre-directives
		if (ATON._isMobile) glsldata = "#define MOBILE_DEVICE 1\n" + glsldata;

		glsldata += '\n';

		var program = new osg.Program(
			new osg.Shader( 'VERTEX_SHADER', "#define VERTEX_SH 1\n" + glsldata ),
			new osg.Shader( 'FRAGMENT_SHADER', "#define FRAGMENT_SH 1\n" + glsldata )
			);

		ATON._glslDescriptorsProgram = program;
        ATON._onDescriptorsShadersLoaded();

		}, "text");

	$.get( path + "/ui.glsl", function(glsldata){
        glsldata = ATON._addGLSLprecision(glsldata);

		// Pre-directives
		if (ATON._isMobile) glsldata = "#define MOBILE_DEVICE 1\n" + glsldata;

		glsldata += '\n';

		var program = new osg.Program(
			new osg.Shader( 'VERTEX_SHADER', "#define VERTEX_SH 1\n" + glsldata ),
			new osg.Shader( 'FRAGMENT_SHADER', "#define FRAGMENT_SH 1\n" + glsldata )
			);

		ATON._glslUIProgram = program;
        ATON._onUIShadersLoaded();
		}, "text");

/*
	$.get( path + "/front.glsl", function(glsldata){
		// Pre-directives
		if (ATON._isMobile) glsldata = "#define MOBILE_DEVICE 1\n" + glsldata;

		glsldata += '\n';

		var program = new osg.Program(
			new osg.Shader( 'VERTEX_SHADER', "#define VERTEX_SH 1\n" + glsldata ),
			new osg.Shader( 'FRAGMENT_SHADER', "#define FRAGMENT_SH 1\n" + glsldata )
			);

		ATON._glslFrontProgram = program;
        ATON._onFrontShaderLoaded();
		}, "text");
*/
};
/*
ATON.loadCustomShadersForLayer = function(glslpath, layername, onComplete){
    let G = ATON.getLayer(layername);
    if (!G){
        if (onComplete) onComplete();
        return;
        }

	$.get( glslpath, function(glsldata){
        glsldata = ATON._addGLSLprecision(glsldata);

		// Pre-directives
		if (ATON._isMobile) glsldata = "#define MOBILE_DEVICE 1\n" + glsldata;

		glsldata += '\n';

		var program = new osg.Program(
			new osg.Shader( 'VERTEX_SHADER', "#define VERTEX_SH 1\n" + glsldata ),
			new osg.Shader( 'FRAGMENT_SHADER', "#define FRAGMENT_SH 1\n" + glsldata )
			);

        G.getOrCreateStateSet().setAttributeAndModes( program );

        if (onComplete) onComplete();
        
		}, "text");
};
*/
ATON._onCoreShadersLoaded = function(){
    console.log("Core Shaders loaded.");
    ATON._rootScene.getOrCreateStateSet().setAttributeAndModes( ATON._glslCoreProgram );
};

ATON._onDescriptorsShadersLoaded = function(){
    console.log("Descriptors Shaders loaded.");
    ATON._rootDescriptors.getOrCreateStateSet().setAttributeAndModes( ATON._glslDescriptorsProgram );
};

ATON._onUIShadersLoaded = function(){
    console.log("UI Shaders loaded.");
    ATON._rootUI.getOrCreateStateSet().setAttributeAndModes( ATON._glslUIProgram );  
    ATON._LPT.getOrCreateStateSet().setAttributeAndModes( ATON._glslUIProgram );
};

ATON._onFrontShaderLoaded = function(){
    console.log("Front shader loaded.");
    //ATON._initRTTs();
};


// VR
//==========================================================================

// AlcuTrans (FIXME:)
ATON.setAlcuTransFactor = function(f){
    if (ATON._wVR === undefined) return;
    ATON._wVR._worldScale = f;
    console.log("AlcuTrans f: " + f);
};


/**
 * Toggle VR mode (WebVR)
 */
ATON.toggleVR = function(){
    var viewer = ATON._viewer;
    if ( viewer.getVRDisplay() ) viewer.setPresentVR( !ATON._vrState ).then( ATON._switchVR.bind(this) );
    else ATON._switchVR();
};

ATON._switchVR = function(){
//ATON.toggleVR = function(){
    var viewer = ATON._viewer;

    //viewer.setPresentVR( !ATON._vrState );

    // Enable VR
    if ( !ATON._vrState ){
        // Detach the model from scene and cache it
        ATON._root.removeChild( ATON._mainGroup );

        if (ATON._HUD !== undefined) ATON._HUD.setNodeMask(0x0);


        //viewer.setPresentVR( true );
        ATON._bFirstPersonMode = true;

        //ATON._canvas.width = 2160;
        //ATON._canvas.width = 1200;
        //$(".view3D").width  = 1080; //2160;
        //$(".view3D").height = 1200;


        viewer.setManipulator( ATON._firstPerMan );
        ATON._firstPerMan.setEyePosition(ATON._currPOV.pos);
        ATON._firstPerMan.setTarget(ATON._currPOV.target);
        //ATON._firstPerMan.setNode( ATON._rootScene );
    
        // FP intertials
/*
        //ATON._firstPerMan.setStepFactor(1.0);
        ATON._firstPerMan.setDelay(100.0); // 0.0
        // it's not really clear how the controllers are overriding (or not) the
        // delay property of the manipulators
        var ctrls = ATON._firstPerMan._controllerList;
        var ctrlNames = Object.keys( ctrls );
        for ( var i = 0, nbCtrlNames = ctrlNames.length; i < nbCtrlNames; ++i ){
            var ct = ctrls[ ctrlNames[ i ] ];
            if ( ct._delay !== undefined ) ct._delay = 100.0;
            }
*/

        // If no vrNode (first time vr is toggled), create one
        // The _dpfGroup will be attached to it
        if ( !ATON._vrNode ) {
            if ( navigator.getVRDisplays ) {

                // 7APR18
                viewer.getInputManager().setEnable(InputGroups.FPS_MANIPULATOR_WEBVR, true);
                //viewer.getEventProxy().WebVR.setEnable( true );
                
                ////var HMD = viewer._eventProxy.WebVR.getHmd();

                // 7APR18
                ATON._HMD = viewer.getVRDisplay();
                ATON._vrNode = osgUtil.WebVR.createScene( viewer, ATON._mainGroup, ATON._HMD );
                //ATON._vrNode = osgUtil.WebVR.createScene( viewer, ATON._mainGroup, viewer._eventProxy.WebVR.getHmd() );

                //console.log(ATON._HMD.getPose().position);

                //console.log(viewer.getVRDisplay().getPose());
                //ATON._vrFDpose = viewer.getVRDisplay().getPose();

                //viewer._eventProxy.WebVR.setWorldScale(0.5);

                // Save handy data - DEPRECATED
/*
                ATON._wVR      = viewer._eventProxy.WebVR;
                ATON._vrFDpose = viewer._eventProxy.WebVR._frameData.pose;

                if (ATON._wVR._hmd !== undefined){
                    //console.log(ATON._vrFDpose);

                    //ATON._wVR._worldScale = 10.0; // Trans. matrix mult.

                    //ATON._wVR._hmd.capabilities.hasExternalDisplay = false;
                    }
*/
                //console.log(viewer._eventProxy.WebVR);
                //console.log(navigator.getVRDisplays);
            	}

            else {
                viewer.getInputManager().setEnable(InputGroups.FPS_MANIPULATOR_DEVICEORIENTATION, true);
                
                ATON._vrNode = osgUtil.WebVRCustom.createScene(viewer, ATON._mainGroup, {
                    isCardboard: true,
                    vResolution: ATON._canvas.height,
                    hResolution: ATON._canvas.width
                    });
/* 7APR18
                viewer.getEventProxy().DeviceOrientation.setEnable( true );
                ATON._vrNode = osgUtil.WebVRCustom.createScene( viewer, ATON._mainGroup, {
                    isCardboard: true,
                    vResolution: this._canvas.height,
                    hResolution: this._canvas.width
                    });
*/
                }
        }


        // Attach the vrNode to scene instead of the model
        ATON._root.addChild( ATON._vrNode );

/* not used
        // 2D Query
        ATON._screenQuery           = [0,0];
        ATON._screenQueryNormalized = [0.5,0.5];
*/
        // Post
        // Correct way to fix NearFar, we operate on RTT-cameras
        for (var c = 0; c < ATON._vrNode.children.length; c++) ATON._vrNode.children[c]._nearFarRatio = ATON_NEARFARRATIO_VR;

        //console.log(wVR);
        //if (wVR) ATON._S2ST = wVR._hmd.stageParameters.sittingToStandingTransform;

        //viewer.setPresentVR( true );
        //if (ATON._vrHMD) ATON._vrHMD.requestPresent( [{ source: ATON._canvas }] );
        ATON.fireEvent("VRmode", true);

        if (ATON._vrResMult>1.0 && ATON._isMobile) ATON.setDevicePixelRatio(ATON._baseDevicePixelRatio * ATON._vrResMult);
    	}

    // Disable VR
    else {
        if (ATON._HUD !== undefined) ATON._HUD.setNodeMask(ATON_MASK_UI);

        //viewer.setPresentVR( false );
        //if (ATON._vrHMD) ATON._vrHMD.exitPresent();

        //ATON.setFirstPersonMode(false);

        ATON._bFirstPersonMode = false;
        viewer.setManipulator( ATON._orbitMan );
        //ATON._orbitMan.setEyePosition(ATON._currPOV.pos);
        //ATON._orbitMan.setTarget(ATON._currPOV.target);

        viewer.getInputManager().setEnable(InputGroups.FPS_MANIPULATOR_WEBVR, false);
        viewer.getInputManager().setEnable(InputGroups.FPS_MANIPULATOR_DEVICEORIENTATION, false);
/* 7APR18
        viewer._eventProxy.WebVR.setEnable( false );
        viewer._eventProxy.DeviceOrientation.setEnable( false );
*/      
        
        // Detach the vrNode and reattach the modelNode
        ATON._root.removeChild( ATON._vrNode );
        ATON._root.addChild( ATON._mainGroup );

        ATON._HMD = undefined;
        ATON.fireEvent("VRmode", false);
        if (ATON._vrResMult>1.0 && ATON._isMobile) ATON.setDevicePixelRatio(ATON._baseDevicePixelRatio);
    	}

    ATON._vrState = !ATON._vrState;
};

// Handle 3D Query (eg. VR)
ATON._handle3DPick = function(gnode, mask, lookAhead, pStart, pEnd){
    if (gnode === undefined) return;
    if (lookAhead === undefined) lookAhead = 50.0;

    //if (ATON._vrLSI === undefined) ATON._vrLSI = new osgUtil.LineSegmentIntersector();

    //var lookAhead = 50.0;

    // Setup SegmentIntersector
    if (pStart === undefined) pStart = ATON._currPOV.pos;
    if (pEnd   === undefined){
        //var vrTGT = osg.vec3.create();
        //vrTGT = ATON._currPOV.pos.slice(0);
        //osg.vec3.add(vrTGT, vrTGT, osg.vec3.scale([], ATON._firstPerMan._direction, lookAhead ) );
        //pEnd = vrTGT;
        pEnd = osg.vec3.create();
        pEnd[0] = ATON._currPOV.pos[0] + (ATON._direction[0]*lookAhead);
        pEnd[1] = ATON._currPOV.pos[1] + (ATON._direction[1]*lookAhead);
        pEnd[2] = ATON._currPOV.pos[2] + (ATON._direction[2]*lookAhead);
        }

    var hits;

    if (mask === ATON_MASK_DESCRIPTORS){
        ATON._LSIdesc.reset();
        ATON._LSIdesc.set( pStart, pEnd );

        ATON._IVdesc.reset();
        gnode.accept( ATON._IVdesc );

        hits = ATON._LSIdesc.getIntersections();
        }
    
    if (mask === ATON_MASK_VISIBLE){
        ATON._LSIvis.reset();
        ATON._LSIvis.set( pStart, pEnd );

        ATON._IVvis.reset();
        gnode.accept( ATON._IVvis );

        hits = ATON._LSIvis.getIntersections();
        }

    //ATON._vrLSI.set( ATON._currPOV.pos, vrTGT );
    
/*
    if (ATON._vrIV === undefined){
        ATON._vrIV = new osgUtil.IntersectionVisitor();
        ATON._vrIV.setIntersector(ATON._vrLSI);
        if (mask !== undefined) ATON._vrIV.setTraversalMask( mask );
        }
    else ATON._vrIV.reset();
*/



    //gnode.accept( ATON._vrIV );

    //var hits = ATON._vrLSI.getIntersections();
    if (hits.length === 0) return undefined;

    //console.log("HIT!!");
    return ATON._hitsOperator(hits, mask);
};

ATON.createVRcontrollers = function(){
    //if (ATON._controllerModel !== undefined) return;

    ATON._vrContrDH = 0.0;

    ATON._controllerTransLeft  = new osg.MatrixTransform();
    ATON._controllerTransRight = new osg.MatrixTransform();

    var model = osg.createTexturedSphere(0.1, 15,15);

	//var material = new osg.Material();
	//material.setTransparency( 0.5 );
	//material.setDiffuse( [1,1,1, 0.5] );
	//this._controllerModel.getOrCreateStateSet().setAttributeAndModes( material );
/*
	this._controllerModel.getOrCreateStateSet().setTextureAttributeAndModes( 0, ATON.utils.fallbackWhiteTex );
	this._controllerModel.getOrCreateStateSet().setRenderingHint('TRANSPARENT_BIN');
	//this._controllerModel.getOrCreateStateSet().setBinNumber(12);
	this._controllerModel.getOrCreateStateSet().setAttributeAndModes( new osg.BlendFunc(), osg.StateAttribute.ON );
*/
    ATON._controllerTransLeft.addChild( model );
    ATON._controllerTransRight.addChild( model );

    ATON._rootUI.addChild( ATON._controllerTransLeft );
    ATON._rootUI.addChild( ATON._controllerTransRight );
};

ATON.setVRcontrollerModel = function(url, hand){
    var request = osgDB.readNodeURL( url );
    request.then( function ( node ){
        //ATON._controllerModel = node;

        // 
        if (hand === undefined){
            ATON._controllerTransLeft.removeChildren();
            ATON._controllerTransRight.removeChildren();

            ATON._controllerTransLeft.addChild( node );
            ATON._controllerTransRight.addChild( node );
            }
        else {
            if (hand === ATON_VR_CONTROLLER_L){
                ATON._controllerTransLeft.removeChildren();
                ATON._controllerTransLeft.addChild( node );
                }
            else {
                ATON._controllerTransRight.removeChildren();
                ATON._controllerTransRight.addChild( node );
                }
            }
        
        //ATON._controllerTransLeft.addChild( ATON._controllerModel );
        //ATON._controllerTransRight.addChild( ATON._controllerModel );
        });
};

ATON._handleGamepads = function(){
    this.gamepads = navigator.getGamepads();
    
    let gpXaxis;
    let gpYaxis;

    for (var g = 0; g < this.gamepads.length; ++g){
        var gamepad = this.gamepads[g];

        // The array may contain undefined gamepads, so check for that as
        // well as a non-null pose.
        if (gamepad){
            let bLeft = (gamepad.hand && gamepad.hand == "left");
            
            // buttons
			for (var b = 0; b < gamepad.buttons.length; ++b){
                
                // QV polarization
                //if (ATON.vroadcast) ATON.vroadcast._bQFpol = gamepad.buttons[2].pressed;

				if (gamepad.buttons[b].pressed){
                    if (bLeft) ATON.fireEvent("LeftGamepadButtonPress", {button: b});
                    else ATON.fireEvent("RightGamepadButtonPress", {button: b});

					//console.log("GM: Pressed button "+b);

                    // 3 = A, 4 = B
                    if (b === 1) ATON._requestFirstPersonTrans(ATON._hoveredVisData);
                    if (b === 2) ATON.speechRecognitionStart();
					if (b === 3) ATON.requestHome();
					//else ATON._requestFirstPersonTrans(ATON._hoveredVisData);       
					}
				}
            
            // Axes
            if (bLeft) ATON.fireEvent("LeftGamepadAxes", {x: gamepad.axes[0], y: gamepad.axes[1]});
            else ATON.fireEvent("RightGamepadAxes", {x: gamepad.axes[0], y: gamepad.axes[1]});

            //gpXaxis = gamepad.axes[0]; // -1 left
            //gpYaxis = gamepad.axes[1]; // -1 fwd

            /*
            if (g === 0){
                if (gpXaxis){
                    ATON._hoverRadius += (gpXaxis*0.01);
                    ATON.updateHoverRadius(ATON._hoverRadius);
                    }
                }
            */

            // left
/*
            if (g === 0 && gpXaxis && ATON.tracer){
                const fm = 0.0001;
                ATON.tracer._tNorm += (fm * gpXaxis);

                if (ATON.tracer._tNorm > 1.0) ATON.tracer._tNorm = 1.0;
                if (ATON.tracer._tNorm < 0.0) ATON.tracer._tNorm = 0.0;

                ATON._mainSS.getUniform('uQVslider').setFloat( ATON.tracer._tNorm );
                }
            // right
            if (g === 1 && gpXaxis && ATON.tracer){
                ATON.tracer._tRad += (0.01 * gpXaxis);

                if (ATON.tracer._tRad > 10.0) ATON.tracer._tRad = 10.0;
                if (ATON.tracer._tRad < 0.1) ATON.tracer._tRad  = 0.1;

                ATON._mainSS.getUniform('uQVradius').setFloat( ATON.tracer._tRad );
                }
*/

			}
        }
};

// FIXME:
ATON._handlePositionalGamepad = function(gamepad){
    if (ATON._vrFDpose === undefined) return;
    //console.log(ATON._vrFDpose);

    var locPos = ATON._vrFDpose.position;
    //if (locPos === undefined) return;

    var q = osg.quat.create(); // = gamepad.pose.orientation;

    q[0] = gamepad.pose.orientation[0];
    q[1] = -gamepad.pose.orientation[2];
    q[2] = gamepad.pose.orientation[1];
    q[3] = gamepad.pose.orientation[3];

    var p = gamepad.pose.position;

    // Quat direction
    var oDir = osg.vec3.create();
    //osg.quat.getAxisAngle(oDir, q);
    osg.vec3.transformQuat(oDir, ATON_Y_AXIS, q);

    // OK!
    p[0] -= locPos[0];
    p[1] -= locPos[1];
    p[2] -= locPos[2];

    if ("hand" in gamepad){
        var cspaceP = osg.vec3.fromValues( p[0], -p[2], p[1] );

        // LEFT
        //===============================================================================
        if (gamepad.hand === "left"){
            ATON._activeVRcontrollers[ATON_VR_CONTROLLER_L] = true;
            //if (ATON._vrOffsL === undefined) ATON._vrOffsL = cspaceP[2] - wVR._pos[2];

            var TLmat = ATON._controllerTransLeft.getMatrix();

            var posL = osg.vec3.create();
            osg.vec3.add(posL, cspaceP, ATON._currPOV.pos);

            //posL[2] += ATON._vrOffsL;
            //if (wVR) osg.vec3.add(posL, posL, wVR._pos);

            //osg.mat4.fromQuat( TLmat, q );
            //osg.mat4.setTranslation(TLmat,  posL );
            osg.mat4.fromRotationTranslation(TLmat, q, posL);

            // Update globals
            osg.mat4.getTranslation(ATON._vrControllersPos[ATON_VR_CONTROLLER_L], TLmat);
            ATON._vrControllersDir[ATON_VR_CONTROLLER_L][0] = oDir[0];
            ATON._vrControllersDir[ATON_VR_CONTROLLER_L][1] = oDir[1];
            ATON._vrControllersDir[ATON_VR_CONTROLLER_L][2] = oDir[2];


            //osg.mat4.multiply( TLmat, S2ST, TLmat );

            // Buttons
            for (var j = 0; j < gamepad.buttons.length; ++j) {
                if (gamepad.buttons[j].pressed){
                    console.log("LEFT: Pressed button "+j);
                    //if (j === 3) ATON._vrContrDH = cspaceP[2]; //wVR._pos[2];// - cspaceP[2]);
                    }
                }
            }
        
        // RIGHT
        //===============================================================================
        if (gamepad.hand === "right"){
            ATON._activeVRcontrollers[ATON_VR_CONTROLLER_R] = true;

            var TRmat = ATON._controllerTransRight.getMatrix();

            var posR = osg.vec3.create();
            osg.vec3.add(posR, cspaceP, ATON._currPOV.pos);

            //osg.mat4.fromQuat( TRmat, q );
            //osg.mat4.setTranslation(TRmat,  posR );
            osg.mat4.fromRotationTranslation(TRmat, q, posR);

            // Update globals
            osg.mat4.getTranslation(ATON._vrControllersPos[ATON_VR_CONTROLLER_R], TRmat);
            //osg.vec3.transformMat4Rotate( oDir, osg.vec3.fromValues(0,1,0), TLmat );
            //osg.quat.getAxisAngle(oDir, osg.mat4.getRotation([], TRmat));

            ATON._vrControllersDir[ATON_VR_CONTROLLER_R][0] = oDir[0];
            ATON._vrControllersDir[ATON_VR_CONTROLLER_R][1] = oDir[1];
            ATON._vrControllersDir[ATON_VR_CONTROLLER_R][2] = oDir[2];
            //console.log(oDir);

            //osg.mat4.multiply( TRmat, S2ST, TRmat );

            // Buttons
            for (var j = 0; j < gamepad.buttons.length; ++j) {
                // 1: front
                // 2: long handle

                var accel = osg.vec3.squaredDistance(locPos, p) - 0.4;
                //console.log(accel);

                if (gamepad.buttons[j].pressed){
                    //if (j === 2) ATON._firstPerMan.getForwardInterpolator().setTarget( accel );
                    if (j == 1) ATON._requestFirstPersonTrans(ATON._hoveredVisData);
                    if (j == 2) ATON.setAlcuTransFactor(20.0);

                    console.log("RIGHT: Pressed button "+j);
                    }
                else {
                    if (ATON._wVR) {
                        if (ATON._wVR._worldScale>=1.005) ATON._wVR._worldScale -= 0.005;
                        }

                    //ATON.setAlcuTransFactor(1.0);
                    //console.log("Unpressed");
                    }
                }
            }
        }

        // Haptics
/*
        if ("hapticActuators" in gamepad && gamepad.hapticActuators.length > 0){
            for (var j = 0; j < gamepad.buttons.length; ++j) {
                if (gamepad.buttons[j].pressed){
                    // Vibrate the gamepad using to the value of the button as
                    // the vibration intensity.
                    gamepad.hapticActuators[0].pulse(gamepad.buttons[j].value, 100);
                
                    break;
                    }
                }
            }
*/
};

ATON._handleVRcontrollers = function(){
    ATON._activeVRcontrollers[ATON_VR_CONTROLLER_L] = false;
    ATON._activeVRcontrollers[ATON_VR_CONTROLLER_R] = false;

    //if (ATON._vrFDpose === undefined) return;

    // Loop over every gamepad and if we find any that have a pose use it.
    //var vrGamepads = [];

    //var wVR = ATON._viewer._eventProxy.WebVR;
    //console.log(wVR._pos);
    //console.log(wVR);
    //var locPos = ATON._vrFDpose.position;

    var gamepads = navigator.getGamepads();
    //console.log(gamepads);
    
    for (var i = 0; i < gamepads.length; ++i){
        var gamepad = gamepads[i];

        // The array may contain undefined gamepads, so check for that as
        // well as a non-null pose.
        if (gamepad){

            // VR Controller
            if (gamepad.pose){
                ATON._handlePositionalGamepad(gamepad);
                }
            }
        }

};

// Update useful VR data
ATON.trackVR = function(){
    if (!ATON._vrState) return;
    if (ATON._HMD === undefined) return;

    let pose = ATON._HMD.getPose();

    // Positional tracking
    if (ATON._HMD.stageParameters === undefined) return;

    ATON._VR.vel = pose.linearVelocity; // meters per second
    ATON._VR.acc = pose.linearAcceleration; // meters per second per second
    //console.log(ATON._VR.vel);

    ATON._VR.Ax = ATON._HMD.stageParameters.sizeX;
    ATON._VR.Az = ATON._HMD.stageParameters.sizeZ;

    var hmdpos = pose.position; // in meters
    if (hmdpos === undefined) return;

    // should be -0.5 to 0.5
    ATON._VR.hmdNormPos[0] = hmdpos[0] / ATON._VR.Ax;
    ATON._VR.hmdNormPos[1] = hmdpos[2] / ATON._VR.Az;
};

/*
    MEASUREMENTS
===========================================*/
// TODO:
ATON.measureSegment = function(){
    if (!ATON._hoveredVisData) return;

    // first point
    if (!ATON._bMeasuring){
        ATON._measurePoint = ATON._hoveredVisData.p.slice(0);

        ATON._bMeasuring = true;
        }
    // second point
    else {

        ATON._bMeasuring = false;
        }
};


/*
    AUDIO
===========================================*/
ATON.initSpeechSynthesis = function(){
    ATON._bPlayingT2S = false;

    // get all voices that browser offers
	var available_voices = window.speechSynthesis.getVoices();

	ATON._t2sVoice = '';
	// find voice by language locale "en-US"
	// if not then select the first voice
	for(var i=0; i<available_voices.length; i++) {
		if(available_voices[i].lang === 'en-US') {
			ATON._t2sVoice = available_voices[i];
			break;
		    }
	    }
	if (ATON._t2sVoice === '') ATON._t2sVoice = available_voices[0];
/*
    ATON._t2sUtter = new SpeechSynthesisUtterance();
    ATON._t2sUtter.rate  = 1.2;
    ATON._t2sUtter.pitch = 1.0;
    ATON._t2sUtter.voice = ATON._t2sVoice;

    // event after text has been spoken
    ATON._t2sUtter.onend = function(){
        //console.log('Speech has finished');
        ATON._bPlayingT2S = false;
        }
*/
};

ATON.speechSynthesis = function(text){
    if (ATON._bPlayingT2S) return;
    //window.speechSynthesis.cancel();

    ATON._bPlayingT2S = true;

    ATON._t2sUtter = new SpeechSynthesisUtterance();
    ATON._t2sUtter.rate  = 1.2;
    ATON._t2sUtter.pitch = 1.0;
    ATON._t2sUtter.voice = ATON._t2sVoice;
    ATON._t2sUtter.text = text;

    window.speechSynthesis.speak(ATON._t2sUtter);

    // event after text has been spoken
    ATON._t2sUtter.onend = function(){
        //console.log('Speech has finished');
        ATON._bPlayingT2S = false;
        }
};


ATON.initSpeechRecognition = function(){
    ATON._bSpeechListening = false;

    const SpeechRecognition = window.speechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition === undefined){
        console.log("Could not initialize SpeechRecognition");
        return;
        }

    ATON._recognition = new SpeechRecognition();

    /*
    try {
        const SpeechRecognition = window.speechRecognition || window.webkitSpeechRecognition;
        ATON._recognition = new SpeechRecognition();
        //ATON._recognition.continuous = true;
        }
    catch(e) {
        console.error(e);
        }
*/
    ATON._recognition.onstart = function(){
        ATON._bSpeechListening = true;
        ATON.fireEvent("SpeechRecognition", true);
        console.log('Voice recognition activated. Try speaking into the microphone.');
        };

    ATON._recognition.onspeechend = function(){
        ATON._bSpeechListening = false;
        ATON.fireEvent("SpeechRecognition", false);
        console.log('You were quiet for a while so voice recognition turned itself off.');
        };

    ATON._recognition.onerror = function(event){
        ATON._bSpeechListening = false;
        if(event.error == 'no-speech') console.log('No speech was detected. Try again.');
        };

    ATON._recognition.onresult = function(event) {
        // event is a SpeechRecognitionEvent object.
        // It holds all the lines we have captured so far. 
        // We only need the current one.
        var current = event.resultIndex;

        // Get a transcript of what was said.
        ATON._speechRecogText = event.results[current][0].transcript;

        ATON._speechRecogText = ATON._speechRecogText.toLowerCase().trim();

        console.log(ATON._speechRecogText);
        ATON.fireEvent("SpeechRecognitionText", ATON._speechRecogText);
        };
};

ATON.speechRecognitionStart = function(){
    if (ATON._recognition === undefined) return;
    if (ATON._bSpeechListening) return;

    ATON._bSpeechListening = true;
    ATON._recognition.start(); 
    ATON.fireEvent("SpeechRecognition", true);
};

ATON.speechRecognitionStop = function(){
    if (ATON._recognition === undefined) return;

    ATON._bSpeechListening = false;
    ATON._recognition.stop();
    ATON.fireEvent("SpeechRecognition", false);
};
