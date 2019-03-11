/*
    Quantized Volume Handler
=============================================*/

const Jimp = require('jimp');
const aabb  = require('aabb-3d');


var QVhandler = {};


const QV_SLICE_RES = 64; //64; //256; //128;
const QV_Z_SLICES  = 64; //64; //16; //32;
const QV_SIZE      = QV_SLICE_RES*QV_Z_SLICES;

const QV_SQUARE_NUM_TILES = 16;
const QV_SQUARE_TILE_RES  = QV_SQUARE_NUM_TILES*QV_SQUARE_NUM_TILES;


// QV class
QVhandler.QV = function(outimgpath) {
    this.vol = aabb([-1.0, -1.0, -1.0], [1.0, 1.0, 1.0]);
    
    this.PA = new Jimp(QV_SIZE, QV_SLICE_RES, 0x00000000); // ...or init with opaque black (0x000000ff)
    this.PA.quality(100);

    this._PAbin  = undefined;
    this._PAcol  = undefined;
    this.imgpath = outimgpath;
};

QVhandler.QV.setPositionAndExtents = function(start,ext){
    this.vol = aabb(start, ext);
};

QVhandler.QV.getNormLocationInVolume = function(loc){
    var px = (loc[0] - this.vol.x0()) / this.vol.width();
    var py = (loc[1] - this.vol.y0()) / this.vol.height();
    var pz = (loc[2] - this.vol.z0()) / this.vol.depth();

    return [px,py,pz];
};

QVhandler.QV.encodeLocationToRGBA = function(loc){
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

QVhandler.QV.encodeDeltaToRGBA = function(A,B){
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

QVhandler.QV.adapter = function(loc){
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
QVhandler.QV.adapterSquare = function(loc){
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

// voxel ignition - TODO:
QVhandler.QV.igniteLocation = function(loc, col8, rank){
    if (rank <= 2) return false; // low rank
    if (rank > 255) rank = 255; // max rank

    let ij = this.adapter(loc);
    if (ij === undefined) return false;

    var prevCol = this.PA.getPixelColor(i,j);

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

    this._lastPolIndexes[0] = i;
    this._lastPolIndexes[1] = j;
    this._lastPolCol = this._PAcol;

    this.PA.setPixelColor(this._PAcol, i,j);
    return true;
};

module.exports = QVhandler;