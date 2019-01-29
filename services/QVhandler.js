/*
    Quantized Volume Handler
=============================================*/

const Jimp = require('jimp');
const aabb  = require('aabb-3d');


var QVhandler = {};


QVhandler.QV_SLICE_RES = 64; //64; //256; //128;
QVhandler.QV_Z_SLICES  = 64; //64; //16; //32;
QVhandler.QV_SIZE      = QV_SLICE_RES*QV_Z_SLICES;

// QV class
QVhandler.QV = function(outimgpath) {
    this.vol = aabb([-1.0, -1.0, -1.0], [1.0, 1.0, 1.0]);
    
    this.PA = new Jimp(QVhandler.QV_SIZE, QVhandler.QV_SLICE_RES, 0x00000000); // ...or init with opaque black (0x000000ff)
    this.PA.quality(100);

    this._PAbin  = undefined;
    this._PAcol  = undefined;
    this.imgpath = outimgpath;
};

QVhandler.QV.setPositionAndExtents = function(start,ext){
    this.vol = aabb(start, ext);
};


module.exports = QVhandler;