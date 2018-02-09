/*!
    @preserve

 	ATON js Library

 	@author Bruno Fanini
	VHLab, CNR ITABC

==================================================================================*/

'use strict';

/* DEPRECATED
var OSG = window.OSG;
var osg = OSG.osg;
OSG.globalify();    // All (osgDB, osgGA, etc...)
*/
var OSG       = window.OSG;
var osg       = OSG.osg;
var osgDB     = OSG.osgDB;
var osgViewer = OSG.osgViewer;
var osgUtil   = OSG.osgUtil;
var osgGA     = OSG.osgGA;
var osgText   = OSG.osgText;



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



// ATON Initialization
//==========================================================================
ATON._canvas   = undefined;
ATON._isMobile = false;

// STD resource folders
ATON.shadersFolder = "shaders";

// VR
ATON._vrState = false;
ATON._vrNode  = undefined;

ATON._activeVRcontrollers = [false, false];
ATON._vrControllersPos    = [osg.vec3.create(), osg.vec3.create()];
ATON._vrControllersDir    = [osg.vec3.create(), osg.vec3.create()];

// MASKS
ATON._maskVisible     = 1 << 2; // 11
ATON._maskDescriptors = 1 << 3;
ATON._maskUI          = 1 << 4;
ATON._maskLP          = 1 << 5;

// Assets/Node Loading
ATON._nodeReqs = 0;

// QUERIES
ATON._LSIdesc = new osgUtil.LineSegmentIntersector();
ATON._IVdesc  = new osgUtil.IntersectionVisitor();
ATON._LSIvis  = new osgUtil.LineSegmentIntersector();
ATON._IVvis   = new osgUtil.IntersectionVisitor();

// Not used (and deprecated)
//ATON._reservedHitsMatrixStack = new osg.MatrixMemoryPool();

ATON._numDescriptors        = 0;
ATON._pickedDescriptorsPath = []; // Array of unique names (picked descriptors-path)
ATON._pickedDescriptorData  = undefined; // 3D point & norm of picked descriptor
ATON._hoveringDescriptor    = false;
ATON._screenQuery           = osg.vec2.create();
ATON._screenQueryNormalized = osg.vec2.create();    // in 0--1
ATON._hoveredVisData        = undefined; // hovered 3D point & norm in visible graph

ATON._bZflat = false;

// NAV
ATON._bFirstPersonMode = false;
ATON._tPOVprogress     = 0.0;
ATON._povLerP          = osg.vec3.create();
ATON._povLerT          = osg.vec3.create();

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

// User custom functions/event control
ATON.onUpdate                   = undefined;
ATON.onDescriptorHover          = undefined;
ATON.onAllNodeRequestsCompleted = undefined;


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
}


// Fallbacks
ATON.utils.bkIM       = new window.Image();
ATON.utils.bkIM.src   = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNg+A8AAQIBANEay48AAAAASUVORK5CYII=';
ATON.utils.wIM        = new window.Image();
ATON.utils.wIM.src    = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIW2P8DwQACgAD/il4QJ8AAAAASUVORK5CYII=';
ATON.utils.normIM     = new window.Image();
ATON.utils.normIM.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAMAAABFaP0WAAAAA1BMVEV/f/99cpgDAAAACklEQVR4AWMAAwAABgABeV6XjwAAAABJRU5ErkJggg==';
ATON.utils.redIM      = new window.Image();
ATON.utils.redIM.src  = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAMAAAAoyzS7AAAAA1BMVEX/AAAZ4gk3AAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==';

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


// Procedural routines
ATON.utils.generateTransformFromString = function( transtring ){
    if (transtring == '') return undefined;

    var T = new osg.MatrixTransform();
    var M = osg.mat4.create();

    T.setMatrix( M );

    // split by (multiple) whitespaces
    var values = transtring.trim().split(/\s+/).map(parseFloat);
    if (values.length < 3) return undefined;

    var vTrans = osg.vec3.fromValues(values[0],values[1],values[2]);

    // Translate
    //$osg.Matrix.makeTranslate( values[0],values[1],values[2], M );
    osg.mat4.translate(M, M, vTrans );

    //console.log('Trans: '+values[0]+' '+values[1]+' '+values[2]);

    if (values.length >= 6){
        var rmx = osg.mat4.create();
        var rmy = osg.mat4.create();
        var rmz = osg.mat4.create();
/*$
        osg.Matrix.makeRotate( values[3], 1.0, 0.0, 0.0, rmx );
        osg.Matrix.makeRotate( values[4], 0.0, 1.0, 0.0, rmy );
        osg.Matrix.makeRotate( values[5], 0.0, 0.0, 1.0, rmz );
*/
        osg.mat4.rotate(rmx, rmx, values[3], ATON_X_AXIS);
        osg.mat4.rotate(rmy, rmy, values[4], ATON_Y_AXIS);
        osg.mat4.rotate(rmz, rmz, values[5], ATON_Z_AXIS);

        //osg.Matrix.preMult( M, rm );

        osg.mat4.multiply(M, M, rmx);
        osg.mat4.multiply(M, M, rmy);
        osg.mat4.multiply(M, M, rmz);
/*$
        osg.Matrix.preMult( M, rmx );
        osg.Matrix.preMult( M, rmy );
        osg.Matrix.preMult( M, rmz );
*/
        //console.log('Rot: '+values[3]+' '+values[4]+' '+values[5]);

        if (values.length >= 9){
            var vScale = osg.vec3.fromValues(values[6],values[7],values[8]);

            // Scale
            var sm = osg.mat4.create();
            //$ osg.Matrix.makeScale( values[6],values[7],values[8], sm );
            osg.mat4.fromScaling( sm, vScale);

            //$ osg.Matrix.preMult( M, sm );
            osg.mat4.multiply(M, M,sm);
            //console.log('Scale: '+values[6]+' '+values[7]+' '+values[8]);
            }
        }

    //console.log( T );
    return T;
};

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

// TODO: Actor
//==========================================================================
ATON.actor = function(){
    this.id = -1;
    this.transform = new osg.MatrixTransform();
    this.representation = new osg.Node();
};

ATON.actor.prototype = {
    // todo
};




// Descriptors
//==========================================================================
ATON.descriptor = function(uname){
    this.uname = uname;
    this.node  = undefined; // a geometry shape for leaves, a group for upper hierarchy
    
    this.loading         = false;
    this._onLoadComplete = undefined;

    // Init event handlers
    this.onHover  = undefined;
    this.onSelect = undefined;
    //this.onLeave  = undefined;
};

ATON.descriptor.prototype = {
    isRoot: function(){
        return (this.parent === undefined);
        },
    
    getUniqueID: function(){
        if (this.node === undefined) return undefined;
        return this.node.getName();
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

        var CLV = new ATON.utils.clearNamesVisitor();
        data.accept( CLV );

        if (options && options.transformRules){
            var N = new osg.Node();
            ATON.utils.generateProduction(node, options.transformRules, N);
            ATON.descriptors[unid].node  = N;
            }
        else ATON.descriptors[unid].node = data;


        ATON.descriptors[unid].node.setName(unid); // FIXME: maybe set from outside?
        ATON.descriptors[unid].loading = false;

        ATON._groupDescriptors.addChild( ATON.descriptors[unid].node ); // data

        if (ATON.descriptors[unid]._onLoadComplete !== undefined) ATON.descriptors[unid]._onLoadComplete();

        console.log("Descriptor node "+url+" loaded and registered as: "+unid);
        }); 

};

ATON.addParentToDescriptor = function(unid, parent_unid){
    if (ATON.descriptors[unid] === undefined) return;

    //console.log(ATON.descriptors);

    // First time
    if (ATON.descriptors[parent_unid] === undefined){
        ATON.descriptors[parent_unid] = new ATON.descriptor(parent_unid);
        ATON.descriptors[parent_unid].loading = false;
        
        ATON.descriptors[parent_unid].node = new osg.Node();
        ATON.descriptors[parent_unid].node.setName(parent_unid);

        // This becomes the new root
        ATON._groupDescriptors.removeChildren();
        ATON._groupDescriptors.addChild( ATON.descriptors[parent_unid].node );

        //console.log("FIRST TIME parent: "+parent_unid);
        }

    // If child completed, connect them
    if (!ATON.descriptors[unid].loading){
        ATON.descriptors[parent_unid].node.addChild( ATON.descriptors[unid].node );
        console.log("Descriptor node: "+unid+" is child of: "+parent_unid);
        }
    // Still loading... delay relationship to descriptor routine.
    else {
        ATON.descriptors[unid]._onLoadComplete = function(){ ATON.descriptors[parent_unid].node.addChild( ATON.descriptors[unid].node ) };
        console.log("Descriptor node: "+unid+" will be child of: "+parent_unid);
        }

};


// Annotations
//==========================================================================
ATON.annotation = function(){
    this.classList = []; // Keywords
};

/* ES6 CHECK
class Shape {
    constructor (id, x, y) {
        this.id = id
        this.move(x, y)
    }
    move (x, y) {
        this.x = x
        this.y = y
    }
}
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

// Request transition to POV
ATON.requestPOV = function(pov, duration){
    if (ATON._tPOVcall >= 0.0) return; // already requested
    if (pov === undefined) return;

    ATON._fromPOV.pos    = ATON._currPOV.pos.slice(0);
    ATON._fromPOV.target = ATON._currPOV.target.slice(0);
    ATON._fromPOV.fov    = ATON._currPOV.fov;

    ATON._toPOV.pos      = pov.pos.slice(0);
    ATON._toPOV.target   = pov.target.slice(0);
    ATON._toPOV.fov      = pov.fov;

    if (duration !== undefined) ATON._tPOVduration = duration;
    else ATON._tPOVduration = ATON_STD_POV_DURATION;

    ATON._tPOVcall = ATON._time;
};

ATON.requestPOVbyName = function(povname){
    var n = ATON.POVlist.length;
    for (var i = 0; i < n; i++){
        if (ATON.POVlist[i].name === povname){
            ATON.requestPOVbyIndex(i);
            return;
            }
        }
};

ATON.requestPOVbyIndex = function(i){
    ATON.requestPOV(ATON.POVlist[i]);
    ATON._reqPOVi = i;
};

ATON.recomputeHome = function(){
    var r = ATON._groupVisible.getBoundingSphere()._radius;
    ATON._homePOV.fov    = ATON_STD_FOV;
    ATON._homePOV.target = ATON._groupVisible.getBoundingSphere()._center.slice(0);
    ATON._homePOV.pos[0] = ATON._homePOV.target[0] + r;
    ATON._homePOV.pos[1] = ATON._homePOV.target[1] + r;
    ATON._homePOV.pos[2] = ATON._homePOV.target[2] + (r*0.5);
};

ATON.setHome = function(position, target){
    ATON._homeAuto = false;
    
    ATON._homePOV.pos    = position;
    ATON._homePOV.target = target;
};

ATON.requestHome = function(){
    if (ATON._homePOV === undefined) return;

    ATON.requestPOV(ATON._homePOV);
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
    if (pickedData === undefined) return;
    if (!ATON._bSurfaceWalkable) return; // we do nothing if target surface has no affordance - FIXME we should update target anyway

    var pn = pickedData.n;
    var pp = pickedData.p;

    var nPOV = new ATON.pov;
    var E  = osg.vec3.create();
    var T  = osg.vec3.create();

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

    nPOV.pos    = E;
    nPOV.target = T;
    nPOV.fov    = ATON._currPOV.fov;

    var dT = Math.sqrt(dist2);
    if (ATON._vrState) dT *= 0.7;
    else dT *= 0.3;

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
        if (mask === ATON._maskDescriptors){
            ATON._pickedDescriptorsPath.length = 0; //= [];
            ATON._pickedDescriptorsPath = ATON.utils._getPickedNodeNames(closestNP);

            if (descrFunction !== undefined) descrFunction();
            }
        if (mask === ATON._maskVisible){
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
    this.nameID    = "";
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
    ATON._frontGroup.addChild(ATON._groupVisible);
    ATON._frontGroup.getOrCreateStateSet().setAttributeAndModes( ATON._glslFrontProgram, osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE );
    ATON._frontGroup.getOrCreateStateSet().addUniform( osg.Uniform.createFloat1( ATON._sensorLookAhead, 'lookAhead' ) );
    ATON._frontGroup.setNodeMask( ATON._maskUI );
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


    ATON._HUD.setNodeMask( ATON._maskUI );

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
};
/** @lends ATON._updateCallback.prototype */
ATON._updateCallback.prototype = {
    update: function ( node, nv ){
        ATON._time = nv.getFrameStamp().getSimulationTime();
        ATON._mainSS.getUniform('time').setFloat( ATON._time );
        
        // CHECK if this value is reliable
        ATON._dtFrame = (ATON._time - ATON._time);
        if ( ATON._dtFrame < 0 ) return true;

        //console.log(1.0/ATON._dtFrame);

        var manip = ATON._viewer.getManipulator();

        //================ Navigation computations: we grab _currPOV and modify it, then update manip 
        manip.getTarget( ATON._currPOV.target );
        manip.getEyePosition( ATON._currPOV.pos );

        // POV transitions
        if (ATON._tPOVcall >= 0.0){
            if (ATON._vrState) ATON._handlePOVrequestVR(); 
            else ATON._handlePOVrequest();
            }

        // MagNet
        if (ATON._tPOVcall < 0.0 /*&& !ATON._vrState*/) ATON._handleMagNetClosest();

        // VR Controllers
        //if (ATON._vrState && !ATON._isMobile) ATON._handleVRcontrollers();

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

        manip.setTarget(ATON._currPOV.target);
        manip.setEyePosition(ATON._currPOV.pos);

        // Store velocity vector
        ATON._vVelocity[0] = (ATON._currPOV.pos[0] - ATON._prevPOV.pos[0]);
        ATON._vVelocity[1] = (ATON._currPOV.pos[1] - ATON._prevPOV.pos[1]);
        ATON._vVelocity[2] = (ATON._currPOV.pos[2] - ATON._prevPOV.pos[2]);
        //console.log(ATON._vVelocity);

        // Store prev-POV
        ATON._prevPOV.pos[0] = ATON._currPOV.pos[0];
        ATON._prevPOV.pos[1] = ATON._currPOV.pos[1];
        ATON._prevPOV.pos[2] = ATON._currPOV.pos[2];
        ATON._prevPOV.target[0] = ATON._currPOV.target[0];
        ATON._prevPOV.target[1] = ATON._currPOV.target[1];
        ATON._prevPOV.target[2] = ATON._currPOV.target[2];

        ATON._mainSS.getUniform('uViewDirWorld').setFloat3( ATON._direction );
        ATON._mainSS.getUniform('uWorldEyePos').setFloat3(ATON._currPOV.pos);
        //================ End of Navigation

        // LP/Env
        if (ATON._LProtM){
            osg.mat4.setTranslation(ATON._LProtM, ATON._currPOV.pos);
            }

        // Handle Descriptors HOVER
        if (ATON._numDescriptors > 0) ATON._handleDescriptorsHover();
        
        ATON._handleVisHover();


        // Custom user hook
        if (ATON.onUpdate !== undefined) ATON.onUpdate();

        return true;
        }
};

ATON._handleDescriptorsHover = function(){
        //var dp;
        if (!ATON._vrState){
            ATON._pickedDescriptorData = ATON._handleScreenPick(ATON._screenQuery[0],ATON._screenQuery[1], ATON._maskDescriptors);
            }
        else {
            ATON._pickedDescriptorData = ATON._handle3DPick(ATON._groupDescriptors, ATON._maskDescriptors);
            }
        
        if (ATON._pickedDescriptorData){
            //console.log(dp);
            if (!ATON._hoveringDescriptor && ATON.onDescriptorHover !== undefined) ATON.onDescriptorHover();
            ATON._hoveringDescriptor = true;
            }
        else {
            ATON._hoveringDescriptor = false;
            } 
};

// Hover on Visible-Graph: Called each update
ATON._handleVisHover = function(){
        // STD
        if (!ATON._vrState){
            ATON._hoveredVisData = ATON._handleScreenPick(ATON._screenQuery[0],ATON._screenQuery[1], ATON._maskVisible);
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
                    ATON._groupVisible, 
                    ATON._maskVisible,
                    LA, // unused
                    pStart,
                    pEnd
                    );
                }
            // Use egocentric ray
            else ATON._hoveredVisData = ATON._handle3DPick(ATON._groupVisible, ATON._maskVisible);
            }

        if (ATON._hoveredVisData){
            ATON._mainSS.getUniform('uHoverPos').setFloat3(ATON._hoveredVisData.p);
            ATON._computeAffordanceHover();
            }
        else ATON._mainSS.getUniform('uHoverAffordance').setFloat( 0.0 );
};

// Compute Surface Affordance
// HoveredData must be valid
ATON._computeAffordanceHover = function(){
    //if (ATON._hoveredVisData === undefined) return;

    // Surface Affordance
    var aff = 0.0; // cumulative with other parameters
    var pn = ATON._hoveredVisData.n;
    var pp = ATON._hoveredVisData.p;
    
    // Determine walkable surface
    if (pn[2] < 0.8 && ATON._bFirstPersonMode){
        ATON._bSurfaceWalkable = false;
        aff = 0.1;
        }
    else {
        ATON._bSurfaceWalkable = true;
        aff = 1.0;
        }

    //console.log(aff);
    ATON._mainSS.getUniform('uHoverAffordance').setFloat( aff );
};


// Realize
//==========================================================================
ATON.realize = function( canvas ){
	if (canvas === undefined){
		console.log("ERROR: you must provide a valid canvas element");
		return;
		}

    ATON._canvas = canvas;

    // Mobile detection
    ATON._isMobile = ATON.utils.detectMobileDevice();

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
        'antialias': true, // fixes VR issues 
        //'stats': true,
        //'overrideDevicePixelRatio': 1, // if specified override the device pixel ratio
        'enableFrustumCulling': true,
        //'alpha': true,
        //'scrollwheel': false,
        //'webgl2': true,
        });

    ATON._viewer.init();
    ATON._viewer.setLightingMode( osgViewer.View.LightingMode.NO_LIGHT );

    // Navigation 
    ATON._viewer.setupManipulator();
    ATON._orbitMan = ATON._viewer.getManipulator();
    ATON._orbitMan.setNode(ATON._groupVisible);

    // First person
    ATON._firstPerMan = new osgGA.FirstPersonManipulator();
    ATON._firstPerMan.setNode( ATON._groupVisible );
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

        var pData = ATON._handleScreenPick(ATON._screenQuery[0],ATON._screenQuery[1], ATON._maskVisible);
        if (pData){
            var pp = pData.p;
            console.log("Point: " + pp);
            console.log("Eye:   " + ATON._currPOV.pos);

            if (ATON._bFirstPersonMode){
                ATON._requestFirstPersonTrans(pData);
                }
            else {
                var nPOV = new ATON.pov;
                var E = osg.vec3.create();

                osg.vec3.lerp(E, ATON._currPOV.pos, pp, 0.5);

                nPOV.pos    = E;
                nPOV.target = pp;
                nPOV.fov    = ATON._currPOV.fov;

                ATON.requestPOV(nPOV, 1.0);
                }

            }
		});

    // MOUSE COORDS
	ATON._canvas.addEventListener('mousemove', function(evt) {
        if (ATON._vrState) return;

        /*
	    var rect = ATON._canvas.getBoundingClientRect();
		var mx = evt.clientX - rect.left;
		var my = evt.clientY - rect.top;
        */

        ATON._screenQuery[0] = evt.clientX * ( ATON._canvas.width / ATON._canvas.clientWidth );
        ATON._screenQuery[1] = ( ATON._canvas.clientHeight - evt.clientY ) * ( ATON._canvas.height / ATON._canvas.clientHeight );

        ATON._screenQueryNormalized[0] = (ATON._screenQuery[0] / ATON._canvas.width).toFixed( 3 );
        ATON._screenQueryNormalized[1] = (ATON._screenQuery[1] / ATON._canvas.height).toFixed( 3 )


        //console.log( ATON._screenQueryNormalized );
	  	}, false);

    // KEYBOARD
	$(function() {
		$(document).keydown(function(e) {
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
	    	if (e.keyCode == 86){ // v
				ATON.toggleVR();
	    		}
            if (e.keyCode == 13){ // ENTER
                if (ATON._vrState) ATON._requestFirstPersonTrans(ATON._hoveredVisData);
                }

	    	if (e.keyCode == 67){ // c
				ATON._bUseCollisions = !ATON._bUseCollisions;
	    		}
	    	if (e.keyCode == 71){ // g
				ATON._bUseGravity = !ATON._bUseGravity;
	    		}

	    	if (e.keyCode == 73){ // i

	    		}
	    	if (e.keyCode == 75){ // k

	    		}

	    	if (e.keyCode == 81){ // q

	    		}
	    	if (e.keyCode == 80){ // p
                var P = new ATON.pov;
                P.pos    = ATON._currPOV.pos.slice(0);
                P.target = ATON._currPOV.target.slice(0);
                P.fov    = ATON._currPOV.fov;

                ATON.addPOV(P);

                console.log(ATON._currPOV);
	    		}
	    	if (e.keyCode == 88){ // x
				//
	    		}
	    	if (e.keyCode == 102){ // numpad right
                var nexti = (ATON._reqPOVi + 1) % ATON.POVlist.length;
                ATON.requestPOVbyIndex( nexti );
                //console.log(nexti);
	    		}
				
	  		});
		});

    // On resize
    $(window).on('load resize', ATON._onResize );

    // HMD on / off
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


// Scene Management
//==========================================================================

ATON._initGraph = function(){
    ATON._root = new osg.Node();        // the very root
    ATON._mainGroup = new osg.Node();   // main group

    ATON._groupVisible     = new osg.Node();
    ATON._groupDescriptors = new osg.Node();
    ATON._groupUI          = new osg.Node();

    // Main world transform
    ATON._mainWorldTrans = new osg.MatrixTransform();
    ATON._mainWorldTrans.addChild(ATON._groupVisible);
    ATON._mainWorldTrans.addChild(ATON._groupDescriptors);

    ATON._mainGroup.addChild(ATON._mainWorldTrans);

    // LP
    ATON._LPT = new osg.MatrixTransform();
    ATON._mainGroup.addChild(ATON._LPT);

    //ATON._mainGroup.addChild(ATON._groupVisible);
    //ATON._mainGroup.addChild(ATON._groupDescriptors);

    ATON._mainGroup.addChild(ATON._groupUI);

    ATON._root.addChild(ATON._mainGroup);

    // Masks
    ATON._groupVisible.setNodeMask( ATON._maskVisible );
    ATON._groupDescriptors.setNodeMask( ATON._maskDescriptors );
    ATON._groupUI.setNodeMask( ATON._maskUI );
    ATON._LPT.setNodeMask( ATON._maskLP );

    // IVs
    ATON._IVvis.setIntersector(ATON._LSIvis);
    ATON._IVvis.setTraversalMask( ATON._maskVisible );
    ATON._IVdesc.setIntersector(ATON._LSIdesc);
    ATON._IVdesc.setTraversalMask( ATON._maskDescriptors );

    // Layers (visible SG)
    ATON.layers = {}; //new Array();

    // StateSets
    ATON._mainSS  = ATON._mainGroup.getOrCreateStateSet();
    ATON._visSS   = ATON._groupVisible.getOrCreateStateSet();
    ATON._descrSS = ATON._groupDescriptors.getOrCreateStateSet();
    ATON._uiSS    = ATON._groupUI.getOrCreateStateSet();

    // Descriptors ss
    ATON._descrSS.setAttributeAndModes( 
        new osg.BlendFunc(osg.BlendFunc.SRC_ALPHA, osg.BlendFunc.ONE), 
        osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE
        );
    ATON._descrSS.setRenderingHint('TRANSPARENT_BIN');

    // UI ss
    ATON._uiSS.setRenderingHint('TRANSPARENT_BIN');
    ATON._uiSS.setTextureAttributeAndModes( ATON_SM_UNIT_BASE, ATON.utils.fallbackWhiteTex );
    ATON._uiSS.setAttributeAndModes(
        new osg.BlendFunc(), // osg.BlendFunc.SRC_ALPHA, osg.BlendFunc.ONE_MINUS_SRC_ALPHA 
        osg.StateAttribute.ON //| osg.StateAttribute.OVERRIDE
        );

    // TODO, move to VR onswitch?
    ATON._createVRcontrollers();
};

/* TODO: use loading webWorkers
ATON.addGraphXXX = function( url, onComplete ){
    var self = this;

    ATON.loadWorker.postMessage(url);
};
*/

// Create new layer (visible sg)
ATON.addNewLayer = function(uniqueName){
    if (uniqueName.length <= 1) return; // too short
    if (ATON.layers[uniqueName]) return; // already created

    // First time, create the layer
    ATON.layers[uniqueName] = new osg.Node();
    ATON.layers[uniqueName].setName(uniqueName);
    //ATON.layers[uniqueName].setNodeMask(ATON._maskVisible);

    ATON._groupVisible.addChild( ATON.layers[uniqueName] );
    console.log("Created new layer "+uniqueName);
};

// TODO: rename?
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

        // Layer
        if (layerName) ATON.layers[layerName].addChild( N );
        else ATON._groupVisible.addChild( N );

        console.log(url + " loaded.");
        
        ATON._onNodeRequestComplete();

        //ATON._groupVisible.getBoundingSphere()._radius
        //console.log( ATON._homePOV.pos = ATON._groupVisible.getBoundingSphere() );

        if (onComplete !== undefined) onComplete();
        })
    .catch(function (e) {
        console.error("Unable to load "+url+" - "+e);
        });
};

ATON._onNodeRequestComplete = function(){

    // Bound recomputation
    //ATON._viewer.getManipulator().computeHomePosition();
    if (ATON._homeAuto) ATON.recomputeHome();

    if (ATON._nodeReqs > 0) return;
    // All node requests are completed
    //================================

    console.log("ALL COMPLETE");
    ATON.requestHome();
    //console.log(ATON._groupVisible);

    console.time( 'kdtree build' );
    var treeBuilder = new osg.KdTreeBuilder({
        _numVerticesProcessed: 0,
        _targetNumTrianglesPerLeaf: 50,
        _maxNumLevels: 20
        });
    treeBuilder.apply( ATON._groupVisible );
    console.timeEnd( 'kdtree build' );

    if (ATON.onAllNodeRequestsCompleted) ATON.onAllNodeRequestsCompleted();
};

ATON.switchLayer = function(layerName, value){
    if (ATON.layers[layerName] === undefined) return;

    if (value === true) ATON.layers[layerName].setNodeMask(0xf);
    else ATON.layers[layerName].setNodeMask(0x0);
};


ATON.addLightProbe = function(folderurl /*, position*/){

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
/*
        var LPm = new osg.Material();
        LPm.setEmission(osg.vec4.fromValues(1,1,1,1));
        LPm.setAmbient(osg.vec4.fromValues(1,1,1,1));
        LPm.setDiffuse(osg.vec4.fromValues(1,1,1,1));
        LPm.setSpecular(osg.vec4.fromValues(1,1,1,1));
        LPm.setShininess(osg.vec4.fromValues(1,1,1,1));
        ATON._LPT.getOrCreateStateSet().setAttributeAndModes( LPm );
   
        ATON._LPT.getOrCreateStateSet().setAttributeAndModes(
            new osg.BlendFunc(osg.BlendFunc.SRC_ALPHA, osg.BlendFunc.ONE_MINUS_SRC_ALPHA), 
            osg.StateAttribute.ON | osg.StateAttribute.OVERRIDE
            );
*/
        ATON._LPT.getOrCreateStateSet().setTextureAttributeAndModes( ATON_SM_UNIT_BASE, CTexture );
        //ATON._LPT.getOrCreateStateSet().setTextureAttributeAndModes( osg.LIGHTING, osg.StateAttribute.OFF);

        console.log("LP Color "+folderurl+" loaded.");
        });
    

        

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
    osg.mat4.identity(ATON._mLProtation);
    ATON._mainSS.addUniform( osg.Uniform.createFloat1( 0.0, 'time' ) );
    ATON._mainSS.addUniform( osg.Uniform.createFloat1( 0.7, 'uExposure' ) );
    ATON._mainSS.addUniform( osg.Uniform.createFloat1( 0.5, 'uGIContrib' ) );
    ATON._mainSS.addUniform( osg.Uniform.createFloat3( osg.vec3.create(), 'uViewDirWorld' ) );
    ATON._mainSS.addUniform( osg.Uniform.createFloat3( osg.vec3.create(), 'uWorldEyePos' ) );
    ATON._mainSS.addUniform( osg.Uniform.createMatrix4( ATON._mLProtation, 'uLProtation' ) );
    ATON._mainSS.addUniform( osg.Uniform.createFloat1( 70.0, 'uFogDistance' ) );
    ATON._mainSS.addUniform( osg.Uniform.createFloat3( osg.vec3.create(), 'uHoverPos' ) );
    ATON._mainSS.addUniform( osg.Uniform.createFloat1( 0.0, 'uHoverAffordance' ) );

    ATON._mainSS.addUniform( ATON.GLSLuniforms.BaseSampler );

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

ATON.loadCoreShaders = function(path){
    //var self = this;

	$.get( path + "/main.glsl", function(glsldata){
		// Pre-directives
		if (ATON._isMobile) glsldata = "#define MOBILE_DEVICE 1\n" + glsldata;

		glsldata += '\n';

		var program = new osg.Program(
			new osg.Shader( 'VERTEX_SHADER', "#define VERTEX_SH 1\n" + glsldata ),
			new osg.Shader( 'FRAGMENT_SHADER', "#define FRAGMENT_SH 1\n" + glsldata )
			);

		ATON._glslCoreProgram = program;
        ATON._onCoreShadersLoaded();
		}, "text");

	$.get( path + "/descriptors.glsl", function(glsldata){
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

ATON._onCoreShadersLoaded = function(){
    console.log("Core Shaders loaded.");

    ATON._groupVisible.getOrCreateStateSet().setAttributeAndModes( ATON._glslCoreProgram );
};

ATON._onDescriptorsShadersLoaded = function(){
    console.log("Descriptors Shaders loaded.");
    ATON._groupDescriptors.getOrCreateStateSet().setAttributeAndModes( ATON._glslDescriptorsProgram );
};

ATON._onUIShadersLoaded = function(){
    console.log("UI Shaders loaded.");
    ATON._groupUI.getOrCreateStateSet().setAttributeAndModes( ATON._glslUIProgram );  
    ATON._LPT.getOrCreateStateSet().setAttributeAndModes( ATON._glslUIProgram ); 
};

ATON._onFrontShaderLoaded = function(){
    console.log("Front shader loaded.");
    //ATON._initRTTs();
};


// VR
//==========================================================================
ATON.requestFullScreenVR = function () {

    if ( !navigator.getVRDisplays && window.screenfull ) {
        window.screenfull.request( ATON._canvas );
        } 
    else {
        // no fullscreen use the canvas or webvr
        ATON.toggleVR();
    }

    //$( '#button-enter-fullscreen' ).hide();
    //$( '#button-exit-fullscreen' ).show();
};
ATON.exitFullScreenVR = function () {

    if ( !navigator.getVRDisplays && window.screenfull ) {
        window.screenfull.exit();
        }
    else {
        ATON.toggleVR();
        }
};
ATON.initFullscreenEvent = function () {

    if ( window.screenfull && window.screenfull.enabled ) {
        document.addEventListener( window.screenfull.raw.fullscreenchange, function () {
            console.log( 'Am I fullscreen? ' + ( window.screenfull.isFullscreen ? 'Yes' : 'No' ) );
            ATON.toggleVR();
        } );
    }
};


// AlcuTrans
//==================
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
        //ATON._firstPerMan.setNode( ATON._groupVisible );
    
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

                viewer.getEventProxy().WebVR.setEnable( true );
                //var HMD = viewer._eventProxy.WebVR.getHmd();

                ATON._vrNode = osgUtil.WebVR.createScene( viewer, ATON._mainGroup, viewer._eventProxy.WebVR.getHmd() );

                //viewer._eventProxy.WebVR.setWorldScale(0.5);

                // Save handy data
                ATON._wVR      = viewer._eventProxy.WebVR;
                ATON._vrFDpose = viewer._eventProxy.WebVR._frameData.pose;

                if (ATON._wVR._hmd !== undefined){
                    //console.log(ATON._vrFDpose);

                    //ATON._wVR._worldScale = 10.0; // Trans. matrix mult.

                    //ATON._wVR._hmd.capabilities.hasExternalDisplay = false;
                    }

                //console.log(viewer._eventProxy.WebVR);
                //console.log(navigator.getVRDisplays);
            	}

            else {
                viewer.getEventProxy().DeviceOrientation.setEnable( true );
                ATON._vrNode = osgUtil.WebVRCustom.createScene( viewer, ATON._mainGroup, {
                    isCardboard: true,
                    vResolution: this._canvas.height,
                    hResolution: this._canvas.width
                    });
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
    	}

    // Disable VR
    else {
        if (ATON._HUD !== undefined) ATON._HUD.setNodeMask(ATON._maskUI);

        //viewer.setPresentVR( false );
        //if (ATON._vrHMD) ATON._vrHMD.exitPresent();

        //ATON.setFirstPersonMode(false);

        ATON._bFirstPersonMode = false;
        viewer.setManipulator( ATON._orbitMan );
        //ATON._orbitMan.setEyePosition(ATON._currPOV.pos);
        //ATON._orbitMan.setTarget(ATON._currPOV.target);

        viewer._eventProxy.WebVR.setEnable( false );
        viewer._eventProxy.DeviceOrientation.setEnable( false );
        // Detach the vrNode and reattach the modelNode
        ATON._root.removeChild( ATON._vrNode );
        ATON._root.addChild( ATON._mainGroup );
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
        var vrTGT = osg.vec3.create();
        vrTGT = ATON._currPOV.pos.slice(0);
        osg.vec3.add(vrTGT, vrTGT, osg.vec3.scale([], ATON._firstPerMan._direction, lookAhead ) );
        pEnd = vrTGT;
        }

    var hits;

    if (mask === ATON._maskDescriptors){
        ATON._LSIdesc.reset();
        ATON._LSIdesc.set( pStart, pEnd );

        ATON._IVdesc.reset();
        gnode.accept( ATON._IVdesc );

        hits = ATON._LSIdesc.getIntersections();
        }
    
    if (mask === ATON._maskVisible){
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

ATON._createVRcontrollers = function(){
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

    ATON._groupUI.addChild( ATON._controllerTransLeft );
    ATON._groupUI.addChild( ATON._controllerTransRight );
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

    if (ATON._vrFDpose === undefined) return;
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