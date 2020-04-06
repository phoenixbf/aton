/*!
    @preserve

    ATON EMviq
    depends on ATON.core

 	@author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/

ATON.emviq = {};

// Default yED datakeys
ATON.emviq.YED_dNodeGraphics = "d6";
ATON.emviq.YED_dEdgeGraphics = "d10";
ATON.emviq.YED_dAttrDesc     = "d5";
ATON.emviq.YED_dAttrURL      = "d4";

ATON.emviq.YED_sSeriation = "ellipse";          // USV Series
ATON.emviq.YED_sUS        = "rectangle";        // SU (or US)
ATON.emviq.YED_sUSVS      = "parallelogram";    // Structural Virtual SU
ATON.emviq.YED_sUSVN      = "hexagon";          // Non-structural Virtual SU
ATON.emviq.YED_sSF        = "octagon";          // (virtual) special find

/*
const EMVIQ_YED_ATTR_NODEGRAPHICS = "nodegraphics";
const EMVIQ_YED_ATTR_EDGEGRAPHICS = "edgegraphics";
const EMVIQ_YED_ATTR_DESCRIPTION  = "description"
const EMVIQ_YED_ATTR_URL          = "url";

const EMVIQ_YED_BPMN_DOCUMENT     = "ARTIFACT_TYPE_DATA_OBJECT";
const EMVIQ_YED_BPMN_PROPERTY     = "ARTIFACT_TYPE_ANNOTATION";

const EMVIQ_STR_COMBINER          = "COMBINER";
const EMVIQ_STR_EXTRACTOR         = "EXTRACTOR";
*/

ATON.emviq.NODETYPES = {
    SERIATION:0,
    US:1,
    USVS:2,
    USVN:3,
    SPECIALFIND:4,

    COMBINER:5,
    EXTRACTOR:6,
    DOCUMENT:7,
    PROPERTY:8,
    CONTINUITY:9
};

ATON.emviq.nodeTexColors = [];

ATON.emviq.x2js = new X2JS({attributePrefix:"@"});

// EM List
ATON.emviq.EMlist = [];

// Utility function
ATON.emviq._comparePeriod = function( a, b ){
    if ( a.min < b.min ) return -1;
    if ( a.min > b.min ) return 1;
    return 0;
};

//ATON.emviq.fulltransp = ATON.utils.createFillTexture([0,0,0,0]);


/*
ATON.emviq.xmlToJson = function(xml) {
	
	// Create the return object
	var obj = {};

	if (xml.nodeType == 1) { // element
		// do attributes
		if (xml.attributes.length > 0) {
		obj["@attributes"] = {};
			for (var j = 0; j < xml.attributes.length; j++) {
				var attribute = xml.attributes.item(j);
				obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
			}
		}
	} else if (xml.nodeType == 3) { // text
		obj = xml.nodeValue;
	}

	// do children
	if (xml.hasChildNodes()) {
		for(var i = 0; i < xml.childNodes.length; i++) {
			var item = xml.childNodes.item(i);
			var nodeName = item.nodeName;
			if (typeof(obj[nodeName]) == "undefined") {
				obj[nodeName] = ATON.emviq.xmlToJson(item);
			} else {
				if (typeof(obj[nodeName].push) == "undefined") {
					var old = obj[nodeName];
					obj[nodeName] = [];
					obj[nodeName].push(old);
				}
				obj[nodeName].push(ATON.emviq.xmlToJson(item));
			}
		}
	}
	return obj;
};
*/


// Build standard color palette
ATON.emviq.buildNodeColorPalette = function(opacity){
    let gm = 4.0; // multiplier corrections
    let rm = 2.0;

    let offmult = 0.3;

    //let gcol = ATON.utils.createFillTexture([0.231, 0.791, 0.226, opacity]);
    //let rcol = ATON.utils.createFillTexture([0.728, 0.233, 0.233, opacity]);

    let gcol = ATON.utils.createFillTexture([0.031*gm, 0.191*gm, 0.026*gm, opacity]);
    let rcol = ATON.utils.createFillTexture([0.328*rm, 0.033*rm, 0.033*rm, opacity]);

    let gcoloff = ATON.utils.createFillTexture([0.031*gm, 0.191*gm, 0.026*gm, opacity*offmult]);
    let rcoloff = ATON.utils.createFillTexture([0.328*rm, 0.033*rm, 0.033*rm, opacity*offmult]);

    ATON.emviq.nodeTexColors = [
        gcol,   // SERIATION
        rcol,   // US
        ATON.utils.createFillTexture([0.018, 0.275, 0.799, opacity]),   // USVN
        gcol,   // USVS
        ATON.utils.createFillTexture([0.799, 0.753, 0.347, opacity])    // SF
        //
        ];

    ATON.emviq.nodeTexColorsOff = [
        gcoloff,    // SERIATION
        rcoloff,    // US
        ATON.utils.createFillTexture([0.018, 0.275, 0.799, opacity*offmult]),   // USVN
        gcoloff,    // USVS
        ATON.utils.createFillTexture([0.799, 0.753, 0.347, opacity*offmult])    // SF
        ];
};

ATON.emviq.buildNodeColorPalette(0.5);


// Single EM
//=========================================================
ATON.emviq.EM = function(){
    this._id        = -1;
    this.graphDBurl = undefined;
    this._jxRoot    = undefined;

    this.timeline   = [];   // sorted array of periods
    this.proxyNodes = {};   // Fast access to proxies by ID (e.g. "US100")
    this.EMnodes    = {};   // EM nodes

    //this._pgTrans   = new osg.MatrixTransform();
    //this.proxyGraph = new osg.Node();
    //this._srcGraphs = [];

    this.folderProxies = undefined;
};

ATON.emviq.EM.prototype = {

// Parse GraphML (yED)
parseGraphML: function(graphmlurl, onSuccess){
    this.graphDBurl = graphmlurl;

    self = this;

    $.get( graphmlurl, function(xml){

        //console.log(xml);
        //xml = xml.replace("y:", "YED_");

        ////var x = ATON.emviq.xmlToJson(xml);
        var jx = ATON.emviq.x2js.xml_str2json( xml );
        var headnode = jx.graphml.graph.node; //.graph;

        var tnode = self.findDataWithKey(headnode, ATON.emviq.YED_dNodeGraphics);
        if (tnode) self.buildTimeline(tnode.TableNode);

        //console.log(headnode);

        self._jxRoot = headnode.graph;
        self._mainRoot = jx.graphml.graph;

        if (onSuccess) onSuccess();

        //console.log( self.getAttribute(self._jxRoot.node[0], "id"));
/*
        for (let n = 0; n < self._jxRoot.node.length; n++) {
            const N = self._jxRoot.node[n];
            
            console.log(n+") Type: "+self.getNodeType(N)+", time: "+self.getNodeTime(N));
            }
*/
        //console.log(self._jxRoot.node[7]);
        //console.log( self.getNodeTime(self._jxRoot.node[7]));

/*


        var gml = $(xml).find('graphml').first();
        //console.log(gml);
        if (gml === undefined) return;

        var gmlRoot = $(gml).find('graph').first();
        if (gmlRoot === undefined) return;
        
        //console.log( gmlRoot.text() );

        self.realizeProxyGraphFromXMLnode(gmlRoot);
*/
    },"text").fail( function(){ // was "xml" type // XML failed to load
		console.log("ERROR Loading EM GraphML");
    });

},

getAttribute: function(node, attrname){
    if (!node) return undefined;
    return node["@"+attrname];
},

findDataWithKey(node, keyvalue){
    var data = node.data;
    if (!data) return undefined;

    if (Array.isArray(data)){
        if (data[0] && this.getAttribute(data[0],"key") === keyvalue ) return data[0];
        if (data[1] && this.getAttribute(data[1],"key") === keyvalue ) return data[1];
        if (data[2] && this.getAttribute(data[2],"key") === keyvalue ) return data[2];
        //if (this.getAttribute(data[3],"key") === keyvalue ) return data[3];
        }
    else if (this.getAttribute(data,"key") === keyvalue ) return data;
},

getNodeTime: function(node){
    if (!node.data) return undefined;

    var d = this.findDataWithKey(node, ATON.emviq.YED_dNodeGraphics);
    //if (!d) return undefined;

    var G = d.GenericNode || d.ShapeNode || d.SVGNode;
    if (!G) return undefined;

    G = G.Geometry;
    if (!G) return undefined;

    var t = parseFloat(this.getAttribute(G, "y"));
    return -t; // note: we reverse time
},

getNodeShape: function(node){
    if (!node.data) return undefined;

    var d = this.findDataWithKey(node, ATON.emviq.YED_dNodeGraphics);

    if (!d.ShapeNode) return undefined;
    var s = d.ShapeNode.Shape;

    if (!s) return undefined;

    return this.getAttribute(s, "type");

    //console.log(d);
},

getNodeFields: function(node){
    //console.log(node);

    let R = {
        xmlID: undefined,
        description: undefined,
        url: undefined,    
        label: undefined
        };

    // ID
    let attrID = this.getAttribute(node, "id");
    if (attrID){
        //console.log(attrID);
        R.xmlID = String(attrID);
        }

    // URL
    let du = this.findDataWithKey(node, ATON.emviq.YED_dAttrURL);
    if (du && du.__cdata){
        //console.log(du.__cdata);
        //console.log("URL>>>>"+du);
        R.url = du.__cdata; //String(du.__cdata);
        }
    
    // Description
    let dd = this.findDataWithKey(node, ATON.emviq.YED_dAttrDesc);
    if (dd) R.description = String(dd.__cdata);

    // Label
    let dl = this.findDataWithKey(node, ATON.emviq.YED_dNodeGraphics);
    if (dl){
        let bSwimlane = false;
        let m = dl.GenericNode || dl.SVGNode || dl.ShapeNode;
        if (!m && dl.TableNode){
            m = dl.TableNode;
            bSwimlane = true;
            }

        if (!bSwimlane && m){
            m = m.NodeLabel;
            //console.log(m.toString());
            if (m) R.label = m.toString();
            }
        }
    
    //console.log(R);

    return R;
},

getNodeType: function(node){
    if (!node.data) return undefined;

    let d  = this.findDataWithKey(node, ATON.emviq.YED_dNodeGraphics);
    let dd = this.findDataWithKey(node, ATON.emviq.YED_dAttrDesc);
    
    if (!d) return undefined;

    // Determine if continuity node
    if (dd && dd.__cdata){
        if (dd.__cdata === "_continuity") return ATON.emviq.NODETYPES.CONTINUITY;
        }

    // Determine first on shape
    if (d.ShapeNode){
        let s = d.ShapeNode.Shape;

        if (!s) return undefined;

        let a = this.getAttribute(s, "type");
        if (a === ATON.emviq.YED_sSeriation) return ATON.emviq.NODETYPES.SERIATION;
        if (a === ATON.emviq.YED_sSF) return ATON.emviq.NODETYPES.SPECIALFIND;
        if (a === ATON.emviq.YED_sUS) return ATON.emviq.NODETYPES.US;
        if (a === ATON.emviq.YED_sUSVN) return ATON.emviq.NODETYPES.USVN;
        if (a === ATON.emviq.YED_sUSVS) return ATON.emviq.NODETYPES.USVS;
        }

    // BPMN (Property or Document)
    if (d.GenericNode){
        let sp = d.GenericNode.StyleProperties;
        if (!sp) return;

        sp = this.getAttribute(sp.Property[3], "value");
        if (!sp) return;

        if (sp === "ARTIFACT_TYPE_DATA_OBJECT") return ATON.emviq.NODETYPES.DOCUMENT;
        if (sp === "ARTIFACT_TYPE_ANNOTATION") return ATON.emviq.NODETYPES.PROPERTY;
        }

    // SVG type
    if (d.SVGNode){
        let M = d.SVGNode.SVGModel;
        if (!M) return undefined;
        if (!M.SVGContent) return undefined;
        
        M = parseInt(this.getAttribute(M.SVGContent, "refid"));
        if (M === 1) return ATON.emviq.NODETYPES.EXTRACTOR;
        if (M === 2) return ATON.emviq.NODETYPES.COMBINER;
        }

    return undefined;   // not recognized
},

// Extract Timeline from yED mess
buildTimeline: function(tablenode){
    var g = tablenode.Geometry;
    if (!g) return;

    //console.log(tablenode);

    var yStart = parseFloat(this.getAttribute(g, "y"));
    //console.log(yStart);

    var nodelabels = tablenode.NodeLabel;
    if (!nodelabels) return;

    var TL = {}; // timeline
    this.timeline = []; // clear main timeline

    for (let i = 0; i < nodelabels.length; i++){
        var L = nodelabels[i];
        
        var pstr = L.toString().trim(); // period string
        //console.log(pstr);

        var strID = undefined;
        if (i>0) strID = "row_"+(i-1); // First nodelabel is header row
        //if (L.ModelParameter && L.ModelParameter.RowNodeLabelModelParameter) strID = ;

        var tMid = parseFloat(this.getAttribute(L, "y"));
        tMid += (0.5 * parseFloat(this.getAttribute(L, "width")) ); // "width" instead of "height" because label is rotated 90.deg

        var tColor =  this.getAttribute(L,"backgroundColor");
        if (tColor) tColor = ATON.utils.hexToRGBlin(tColor);
        //console.log(tColor);

        if (strID){
            TL[strID] = {};
            TL[strID].name  = pstr;
            TL[strID].min   = tMid + yStart;
            TL[strID].max   = tMid + yStart;
            if (tColor){
                TL[strID].color = [tColor[0], tColor[1], tColor[2], 0.5];
                TL[strID].tex   = ATON.utils.createFillTexture( TL[strID].color );
                }
            }
        }

    // Retrieve spans in a dirty dirty way...
    if (!tablenode.Table || !tablenode.Table.Rows || !tablenode.Table.Rows.Row) return;
    var spantable = tablenode.Table.Rows.Row;

    // For each row
    for (let r = 0; r < spantable.length; r++){
        var row = spantable[r];

        var rID = this.getAttribute(row, "id");
        var h   = 0.5 * parseFloat(this.getAttribute(row,"height"));

        if (TL[rID]){
            //console.log(rID);

            TL[rID].min += h;
            TL[rID].max -= h;

            // note: we reverse time
            TL[rID].min = -TL[rID].min;
            TL[rID].max = -TL[rID].max;

            // Add to main timeline
            this.timeline.push(TL[rID]);
            }
        }

    // Sort timeline
    this.timeline.sort( ATON.emviq._comparePeriod );

    this.timeline.forEach(p => {
        ATON.createDynamicGroupNode().as(p.name).attachToRoot();
        ATON.createDescriptorGroup(true).as(p.name).attachToRoot();
        if (p.color) ATON.getDescriptor(p.name).setBaseColor(p.color);
        });

    console.log(this.timeline);

},

getPeriodFromName: function(nameid){
    if (!this.timeline) return undefined;
    let numPeriods = this.timeline.length;

    for (let p = 0; p < numPeriods; p++){
        if (this.timeline[p].name === nameid) return this.timeline[p];
        }
        
    return undefined;
},

getPeriodIndexFromName: function(nameid){
    if (!this.timeline) return undefined;
    let numPeriods = this.timeline.length;

    for (let p = 0; p < numPeriods; p++){
        if (this.timeline[p].name === nameid) return p;
        }
        
    return undefined;
},

getPeriodIndexFromTime: function(t){
    if (!this.timeline) return undefined;
    let numPeriods = this.timeline.length;

    for (let p = 0; p < numPeriods; p++){
        if (this.timeline[p].min < t && t < this.timeline[p].max) return p;
        }

    //return (numPeriods-1);
    return undefined;
},

/*
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
*/

realizeFromJSONnode: function(graphnode){
    let G = new osg.Node();

    let nodes;
    if (!graphnode) nodes = this._jxRoot.node;
    else nodes = graphnode.node;
    // TODO: check array

    for (let i = 0; i < nodes.length; i++){
        let n = nodes[i];
        let bProxyNode = false;

        // recursive step for sub-graphs (yED sub-groups)
        if (n.graph){
            var subG = this.realizeFromJSONnode(n.graph);
            if (subG) G.addChild(subG);
            }

        let type   = this.getNodeType(n);
        let t      = this.getNodeTime(n);
        let fields = this.getNodeFields(n);

        let pid = this.getPeriodIndexFromTime(t);

        if (this.folderProxies && fields.label){
            let periodName = undefined;

            //let periodColor = undefined;
            //let periodTexture = undefined;

            if (this.timeline[pid]){
                periodName = this.timeline[pid].name;
                //if (this.timeline[pid].tex) periodTexture = this.timeline[pid].tex;
                //if (this.timeline[pid].color) periodColor = this.timeline[pid].color;
                ////console.log(periodName,periodColor);
                }


            // Single proxy
            if (type === ATON.emviq.NODETYPES.SPECIALFIND || type === ATON.emviq.NODETYPES.US || type === ATON.emviq.NODETYPES.USVN || type === ATON.emviq.NODETYPES.USVS ){
                bProxyNode = true;
                
                if (periodName){
                    let pshape = ATON.createDescriptorShape(this.folderProxies + fields.label + "_m.osgjs").as(fields.label);
                    pshape.attachTo(periodName);
                    }
                }

            // Procedural proxy
            if (type === ATON.emviq.NODETYPES.SERIATION){
                bProxyNode = true;

                if (periodName){
                    let procp = ATON.createDescriptorProductionFromASCII(
                        this.folderProxies + fields.label + "_m.osgjs",
                        this.folderProxies + fields.label + "-inst.txt"
                        ).as(fields.label);
                    
                    procp.attachTo(periodName);
                    }
                }

            if (bProxyNode){
                let pkey = fields.label;

                this.proxyNodes[pkey] = {};
                this.proxyNodes[pkey].type = type;
                this.proxyNodes[pkey].time = t;
                this.proxyNodes[pkey].periodName = periodName;

                if (fields.description) this.proxyNodes[pkey].description = fields.description;
                if (fields.url) this.proxyNodes[pkey].url = fields.url;

                //let P = ATON.addParentToDescriptor(pkey, periodName );
                }

            // If accepted, push into EM nodes
            if (type && periodName && fields.xmlID){
                let EMkey = fields.xmlID;

                this.EMnodes[EMkey] = new osg.Node();
                this.EMnodes[EMkey]._EMdata = {};
                let EMdata = this.EMnodes[EMkey]._EMdata;

                EMdata.type = type;
                EMdata.time = t;
                EMdata.periodName = periodName;
                if (fields.label)       EMdata.label = fields.label;
                if (fields.description) EMdata.description = fields.description;
                if (fields.url)         EMdata.url = fields.url;

                //console.log(EMdata);
                }
            }

        //console.log(this.EMnodes);
        }

    return G;
},

// Build EM nodes relationships
buildEMgraph: function(graphnode){
    if (!graphnode) graphnode = this._mainRoot;

    //console.log(graphnode);
    if (!graphnode.edge) return; // no edges found in GraphML

    let numEdges = graphnode.edge.length;
    for (let i = 0; i < numEdges; i++){
        let E = graphnode.edge[i];
        if (E){
            let sourceID = String(this.getAttribute(E,"source"));
            let targetID = String(this.getAttribute(E,"target"));

            let sourceNode = this.EMnodes[sourceID];
            let targetNode = this.EMnodes[targetID];

            if (sourceNode && targetNode){
                sourceNode.addChild(targetNode);
                //if (sourceNode._EMdata.type === ATON.emviq.NODETYPES.CONTINUITY) console.log(sourceNode._EMdata);
                }
            //console.log(sourceID+" > "+targetID);
            }
        }
},

buildContinuity: function(){
    for (let n in this.EMnodes){
        let N = this.EMnodes[n];

        if (N._EMdata.type === ATON.emviq.NODETYPES.CONTINUITY){
            let T = N.children[0];
            let iend = this.getPeriodIndexFromName(N._EMdata.periodName);

            if (T && iend){
                let istart = this.getPeriodIndexFromName(T._EMdata.periodName);
                //console.log(T._EMdata);
                //console.log(istart,iend);

                let proxyid = T._EMdata.label;

                for (let p = (istart+1); p <= iend; p++) {
                    let period = this.timeline[p].name;
                    
                    ATON.getDescriptor(period).add(proxyid);
                    }
                }
            }
        }
},

buildRec: function(){
    for (let p in this.timeline){
        let pname = this.timeline[p].name;
        //console.log(pname);
        let currGroup = ATON.getDescriptor(pname);
        let recGroup = ATON.getDescriptor(pname + " Rec");

        if (currGroup && recGroup){
            for (let c in currGroup.children) recGroup.add(currGroup.children[c]); 
            }
        }
},

};