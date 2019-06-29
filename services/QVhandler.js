/*
    Quantized Volume Handler
=============================================*/

const Jimp = require('jimp');
const aabb  = require('aabb-3d');
const fs    = require('fs');


var QVhandler = {};


const QV_SLICE_RES = 64; //64; //256; //128;
const QV_Z_SLICES  = 64; //64; //16; //32;
const QV_SIZE      = QV_SLICE_RES*QV_Z_SLICES;

const QV_SQUARE_NUM_TILES = 16;
const QV_SQUARE_TILE_RES  = QV_SQUARE_NUM_TILES*QV_SQUARE_NUM_TILES;

const QV_LAYOUT_STRIP  = 0;
const QV_LAYOUT_SQUARE = 1;


// Volume class
//==========================================================================
QVhandler.QV = function() {
    this.vol = aabb([-1.0, -1.0, -1.0], [1.0, 1.0, 1.0]);

    this._PAbin  = undefined;
    this._PAcol  = undefined;
    this.atlas   = undefined;

    this.layout   = undefined;
    this._voxSize = [1.0,1.0,1.0];
    this.setLayout(QV_LAYOUT_STRIP);

    this._lastAtlasCoords = [0,0];
};

/*
QVhandler.QV.prototype = {

};
*/

/*
QVhandler.QV.initAtlases = function(){
    for (let a = 0; a < this.atlases.length; a++) {
        if (this.layout === QV_LAYOUT_STRIP){
            this.atlases[a] = new Jimp(QV_SIZE, QV_SLICE_RES, 0x00000000); // ...or init with opaque black (0x000000ff)
            }
        if (this.layout === QV_LAYOUT_SQUARE){
            this.atlases[a] = new Jimp(QV_SIZE, QV_SIZE, 0x00000000); // ...or init with opaque black (0x000000ff)
            }
        }
};
*/

QVhandler.QV.prototype.setName = function(name){
    this.name = name;
};

QVhandler.QV.prototype.setOutAtlas = function(path){
    this.atlaspath = path;
};

QVhandler.QV.prototype.setLayout = function(layout){
    this.layout = layout;

    if (layout === QV_LAYOUT_STRIP){
        this.atlas = new Jimp(QV_SIZE, QV_SLICE_RES, 0x00000000); // ...or init with opaque black (0x000000ff)
        }
    if (layout === QV_LAYOUT_SQUARE){
        this.atlas = new Jimp(QV_SIZE, QV_SIZE, 0x00000000); // ...or init with opaque black (0x000000ff)
        }

    this.atlas.quality(100);
};

QVhandler.QV.prototype.setOriginAndExtents = function(origin,ext){
    this.vol = aabb(origin, ext);

    if (this.layout === QV_LAYOUT_STRIP){
        this._voxSize[0] = ext[0] / QV_SLICE_RES;
        this._voxSize[1] = ext[1] / QV_SLICE_RES;
        this._voxSize[2] = ext[2] / QV_SLICE_RES;
        console.log("Voxel Size: "+this._voxSize);
        }
};

QVhandler.QV.prototype.getNormLocationInVolume = function(loc){
    var px = (loc[0] - this.vol.x0()) / this.vol.width();
    var py = (loc[1] - this.vol.y0()) / this.vol.height();
    var pz = (loc[2] - this.vol.z0()) / this.vol.depth();

    return [px,py,pz];
};

QVhandler.QV.prototype.encodeLocationToRGBA = function(loc){
    var P = this.getNormLocationInVolume(loc);

    var col = new Uint8Array(4);
    col[0] = 0;
    col[1] = 0;
    col[2] = 0;
    col[3] = 0;

    if (P[0] > 1.0 || P[0] < 0.0) return col;
    if (P[1] > 1.0 || P[1] < 0.0) return col;
    if (P[2] > 1.0 || P[2] < 0.0) return col;

    col[0] = parseInt(P[0] * 255.0);
    col[1] = parseInt(P[1] * 255.0);
    col[2] = parseInt(P[2] * 255.0);
    col[3] = 255;

    return col;
};

QVhandler.QV.prototype.encodeDeltaToRGBA = function(A,B){
    var col = new Uint8Array(4);
    col[0] = 0;
    col[1] = 0;
    col[2] = 0;
    col[3] = 0;

    var dx = (A[0]-B[0]) / (this.vol.width());
    var dy = (A[1]-B[1]) / (this.vol.height());
    var dz = (A[2]-B[2]) / (this.vol.depth());

    dx = clamp(dx, -1.0,1.0);
    dy = clamp(dy, -1.0,1.0);
    dz = clamp(dz, -1.0,1.0);

    dx = (dx*0.5) + 0.5;
    dy = (dy*0.5) + 0.5;
    dz = (dz*0.5) + 0.5;

    //console.log(dx,dy,dz);

    col[0] = parseInt(dx * 255.0);
    col[1] = parseInt(dy * 255.0);
    col[2] = parseInt(dz * 255.0);
    col[3] = 255;

    //console.log(col);

    return col;
};

// Adapter or Prism
QVhandler.QV.prototype.adapter = function(loc){
    // Normalized location inside volume
    var P = this.getNormLocationInVolume(loc);

    // Check outside volume
    if (P[0] > 1.0 || P[0] < 0.0) return undefined;
    if (P[1] > 1.0 || P[1] < 0.0) return undefined;
    if (P[2] > 1.0 || P[2] < 0.0) return undefined;

    //P[0] -= (1.0/QV_SLICE_RES);
    P[1] -= (1.0/QV_SLICE_RES);
    //P[2] -= (1.0/QV_SLICE_RES);


    var i,j,t;
    i = parseInt(P[0] * QV_SLICE_RES); // FIXME!!! (-1)
    j = parseInt(P[1] * QV_SLICE_RES);

    t = parseInt(P[2] * QV_Z_SLICES); // tile index

    i += (t * QV_SLICE_RES); // offset

    return [i,j];
};

// TODO:
QVhandler.QV.prototype.adapterSquare = function(loc){
    // Normalized location inside volume
    var P = this.getNormLocationInVolume(loc);

    // Check outside volume
    if (P[0] > 1.0 || P[0] < 0.0) return undefined;
    if (P[1] > 1.0 || P[1] < 0.0) return undefined;
    if (P[2] > 1.0 || P[2] < 0.0) return undefined;

    var i,j, tx,ty;
    i = parseInt(P[0] * QV_SQUARE_TILE_RES);
    j = parseInt(P[1] * QV_SQUARE_TILE_RES);

    //ty = parseInt(P[2] * QV_SQUARE_TILE_RES);

};

// location, RGBA 8bit, overlay policy function
QVhandler.QV.prototype.setVoxelFromLocation = function(loc, col8, ovrFunc){
    let atlascoords = this.adapter(loc); // TODO: switch dep on layout
    if (atlascoords === undefined) return false;

    var outcol = new Uint8Array(4);
    outcol[0] = col8[0];
    outcol[1] = col8[1];
    outcol[2] = col8[2];
    outcol[3] = col8[3];

    // Overlay policy function
    if (ovrFunc !== undefined){
        let pxcol = Jimp.intToRGBA( this.atlas.getPixelColor(atlascoords[0],atlascoords[1]) );
        var prevCol = new Uint8Array(4);
        prevCol[0] = pxcol.r;
        prevCol[1] = pxcol.g;
        prevCol[2] = pxcol.b;
        prevCol[3] = pxcol.a;

        outcol = ovrFunc(prevCol, outcol);
        }

    this._lastAtlasCoords[0] = atlascoords[0];
    this._lastAtlasCoords[1] = atlascoords[1];

    this._PAcol = Jimp.rgbaToInt(outcol[0],outcol[1],outcol[2], outcol[3]);
    //this._lastPolCol = this._PAcol;

    this.atlas.setPixelColor(this._PAcol, atlascoords[0],atlascoords[1]);
};

// voxel ignition - TODO:
QVhandler.QV.prototype.OLD_setVoxelFromLocation = function(loc, col8, rank){
    if (rank <= 8) return false; // low rank
    if (rank > 255) rank = 255; // max rank

    let ij = this.adapter(loc);
    if (ij === undefined) return false;

    var prevCol = this.atlas.getPixelColor(i,j);

    // Cumulative
    //var A = Jimp.intToRGBA(prevCol).a + col8[3];
    //if (A > 255 ) A = 255;

    var A = Jimp.intToRGBA(prevCol).a;
    if (A > rank){
        sPOLnumCellsNEG++;
        return false;
        }

    if (A > 0) sPOLnumCellsRW++ // someone already written the cell

    A = rank;
    this._PAcol = Jimp.rgbaToInt(col8[0],col8[1],col8[2], A);

    this._lastAtlasCoords[0] = i;
    this._lastAtlasCoords[1] = j;
    //this._lastPolCol = this._PAcol;

    this.atlas.setPixelColor(this._PAcol, i,j);
    return true;
};

// TODO:
QVhandler.QV.prototype.setVoxelFromLocationAndRank = function(loc, col8, rank){
    if (rank <= 8) return false; // low rank
    if (rank > 255) rank = 255; // max rank

    let atlascoords = this.adapter(loc);
    if (atlascoords === undefined) return false;

    var prevCol = this.atlas.getPixelColor(atlascoords[0],atlascoords[1]);

    // ....

};


QVhandler.QV.prototype.writeAtlas = function( onSuccess ){
    this.atlas.write( this.atlaspath, onSuccess );
    console.log("Atlas written");
};

QVhandler.QV.prototype.readAtlasFromURL = function(url, onComplete){
    var self = this;
    Jimp.read(url, (err, pa) => {
        if (err) return;

        if (pa){
            self.atlas = pa;
            //self.atlas.write( self.atlaspath );
            console.log("Atlas read successfully");

            if (onComplete) onComplete();
            }
        });
};

// Handler
//==========================================================================
QVhandler.volgroup = {};
//QVhandler.list = [];
QVhandler.outFolder = __dirname+"/";

QVhandler.getOrCreateGroup = function(groupname){
    if (QVhandler.volgroup[groupname] === undefined){
        QVhandler.volgroup[groupname] = {};
        QVhandler.volgroup[groupname].list = [];
        }
    
    return QVhandler.volgroup[groupname];
};

QVhandler.getVolumesList = function(groupname){
    let G = QVhandler.volgroup[groupname];
    if (G === undefined) return [];
    if (G.list === undefined) return [];

    return G.list;
};

QVhandler.addVolume = function(origin, ext, groupname){

    let G = QVhandler.getOrCreateGroup(groupname);
    
    let id = G.list.length;
    
    let V = new QVhandler.QV();

    V.setOriginAndExtents(origin,ext);
    //V.setName(name);

    let outDir = QVhandler.outFolder + groupname;
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

    console.log("OUT folder for volume "+id+": "+outDir);
    V.setOutAtlas(outDir+"/qa"+id+".png");

    G.list.push(V);

    return V;
};

QVhandler.addFromJSON = function(vfile, groupname, onComplete){
    fs.readFile(vfile, 'utf-8', (err, data) => {
        if (err) console.log("QV json not found!");
        else {
            var QVdata = JSON.parse(data);
            if (QVdata.list){
                for (let v = 0; v < QVdata.list.length; v++){
                    //QVdata.list[v];

                    var V = QVhandler.addVolume(QVdata.list[v].position, QVdata.list[v].extents, groupname);
                    }
                }
            }

        if (onComplete) onComplete();
        });
};

QVhandler.setVoxelFromLocation = function(groupname, loc, col8, ovrFunc){
    let VL = QVhandler.getVolumesList(groupname);
    for (let v = 0; v < VL.length; v++) VL[v].setVoxelFromLocation(loc,col8, ovrFunc);
}

QVhandler.writeAllAtlases = function(groupname){
    let VL = QVhandler.getVolumesList(groupname);
    for (let v = 0; v < VL.length; v++) VL[v].writeAtlas();
};


module.exports = QVhandler;