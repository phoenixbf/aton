/*!
    @preserve

    ATON Emviq
    depends on ATON.core

 	@author Bruno Fanini
	VHLab, CNR ITABC

==================================================================================*/

ATON.emviq = {};

// Default yED datakeys
ATON.emviq.YED_dNodeGraphics = "d6";
ATON.emviq.YED_dEdgeGraphics = "d10";
ATON.emviq.YED_dAttrDesc     = "d5";
ATON.emviq.YED_dAttrURL      = "d4";

ATON.emviq.YED_sSeriation = "ellipse";          // USV Series
ATON.emviq.YED_sUS        = "rectangle";        // SU (or US)
ATON.emviq.YED_sSeriation = "parallelogram";    // Structural Virtual SU
ATON.emviq.YED_sSeriation = "hexagon";          // Non-structural Virtual SU
ATON.emviq.YED_sSeriation = "octagon";          // (virtual) special find

const EMVIQ_YED_ATTR_NODEGRAPHICS = "nodegraphics";
const EMVIQ_YED_ATTR_EDGEGRAPHICS = "edgegraphics";
const EMVIQ_YED_ATTR_DESCRIPTION  = "description"
const EMVIQ_YED_ATTR_URL          = "url";

const EMVIQ_YED_BPMN_DOCUMENT     = "ARTIFACT_TYPE_DATA_OBJECT";
const EMVIQ_YED_BPMN_PROPERTY     = "ARTIFACT_TYPE_ANNOTATION";

const EMVIQ_STR_COMBINER          = "COMBINER";
const EMVIQ_STR_EXTRACTOR         = "EXTRACTOR";


// EM List
ATON.emviq.EMlist = [];





// Single EM
ATON.emviq.EM = function(){
    this._id        = -1;
    this.graphDBurl = undefined;

    this._pgTrans   = new osg.MatrixTransform();
    this.proxyGraph = new osg.Node();
    this._srcGraphs = [];
};

ATON.emviq.EM.prototype = {

// Parse GraphML (yED)
parseGraphML: function(graphmlurl){
    this.graphDBurl = graphmlurl;

    self = this;

    $.get( graphmlurl, function(xml){

        var gml = $(xml).find('graphml').first();
        //console.log(gml);
        if (gml === undefined) return;

        var gmlRoot = $(gml).find('graph').first();
        if (gmlRoot === undefined) return;
        
        //console.log(  );

        self.realizeProxyGraphFromXMLnode(gmlRoot);
    },"xml").fail( function(){ // XML failed to load
		console.log("ERROR Loading EM GraphML");
    });

},

_getShapeString: function(xmlNode){
    var k = $(xmlNode).find("y:ShapeNode").first();
    if (k === undefined) return "";

    k = $(k).find("y:Shape").first();
    if (k === undefined) return "";
    //console.log(k);

    console.log( $(k).attr("type") );

    //.find("y:Shape")[0].attr("type");
    return $(k).attr("type");
},

_retrieveXMLnodeInfo: function(xmlNode){
    //var dNodeDesc = $(xmlNode).find("data[key="+ATON.emviq.YED_dAttrDesc+"]");
    //if (dNodeDesc) console.log(dNodeDesc.text());

    var dNodeGR = $(xmlNode).find("data[key="+ATON.emviq.YED_dNodeGraphics+"]").first();
    if (dNodeGR === undefined) return undefined;

    var R = {
        strShape: "",
        };

    R.strShape = this._getShapeString( dNodeGR );

    //console.log( this._getShapeString(dNodeGR) );

    //console.log(dNodeGR);
},

realizeProxyGraphFromXMLnode: function(xmlRoot){
    //console.log("---- Realizing ProxyGraph");
    self = this;

    var G = new osg.Node();

    $(xmlRoot).find('node').each( function (n) {

        // Recursive subgraph on this child
        var subG = $(this).find('graph').first();
        if (subG){
            var S = new osg.Node();
            S = self.realizeProxyGraphFromXMLnode(subG);
            G.addChild( S );
            }

        var nodeType; // TODO

        self._retrieveXMLnodeInfo(n);

        //console.log("XXX");
        //console.log( $(this).text() );
    });

    return G;
},

};