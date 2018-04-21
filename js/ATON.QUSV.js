/*!
    @preserve

    ATON QUSV Module
    depends on ATON.core

 	@author Bruno Fanini
	VHLab, CNR ITABC

==================================================================================*/

ATON.QUSV = {};

const ATON_SM_UNIT_QUSV = 6;

ATON.QUSV.vMin = [0.0, 0.0, 0.0];
ATON.QUSV.vExt = [10.0, 10.0, 10.0];



ATON.QUSV.setPositionAndExtents = function(vMin, vExt) {
    ATON.QUSV.vMin = vMin.slice(0);
    ATON.QUSV.vExt = vExt.slice(0);

    ATON._mainSS.getUniform('uQUSVmin').setFloat3( ATON.QUSV.vMin );
    ATON._mainSS.getUniform('uQUSVsize').setFloat3( ATON.QUSV.vExt );
};

ATON.QUSV.loadILSign = function(path){
    var ILSTexture = new osg.Texture();
    osgDB.readImageURL( path ).then( function ( data ){      
        ILSTexture.setImage( data );

        ILSTexture.setMinFilter( osg.Texture.NEAREST ); // important!
        ILSTexture.setMagFilter( osg.Texture.NEAREST );
        ILSTexture.setWrapS( osg.Texture.CLAMP_TO_EDGE ); // CLAMP_TO_EDGE / REPEAT
        ILSTexture.setWrapT( osg.Texture.CLAMP_TO_EDGE );

        ATON._mainSS.setTextureAttributeAndModes( ATON_SM_UNIT_QUSV, ILSTexture );
        console.log("ILSignature "+path+" loaded.");
        });
};