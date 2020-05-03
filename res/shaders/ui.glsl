/*	
    @preserve

    ATON 2.0 UI Vertex + Fragment Shaders
	bruno.fanini_AT_gmail.com
=========================================================*/
// COMMON
//========================================================

//#define MOBILE_DEVICE 1

varying vec2 osg_TexCoord0;
//varying vec3 osg_FragVertex;
//varying vec3 osg_FragEye;
//varying vec3 osg_FragNormal;
//varying vec3 osg_FragNormalWorld;
//varying vec4 pColor;

varying vec3 vViewNormal;


//=========================================================
// VERTEX SHADER
//=========================================================
#ifdef VERTEX_SH

attribute vec3 Normal;
attribute vec3 Vertex;
//attribute Material;

attribute vec2 TexCoord0;

uniform mat3 uModelViewNormalMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;


void main(){
	osg_TexCoord0 = TexCoord0;

    vViewNormal = uModelViewNormalMatrix * Normal;
    vViewNormal = normalize(vViewNormal);

    gl_Position = uProjectionMatrix * (uModelViewMatrix * vec4(Vertex, 1.0));
}

#endif




//=========================================================
// FRAGMENT SHADER
//=========================================================
#ifdef FRAGMENT_SH

uniform sampler2D BaseSampler; // 0
uniform float time;
uniform vec4 uTint;
uniform float uOpacity;

// MAIN
//==============
void main(){
    vec4 baseAlbedo = texture2D(BaseSampler, osg_TexCoord0);
    vec4 FinalFragment = baseAlbedo;
    float alpha = baseAlbedo.a * uOpacity;

    // Tint
    FinalFragment.rgb = mix(FinalFragment.rgb, uTint.rgb*FinalFragment.rgb, uTint.a);

#ifndef MOBILE_DEVICE
    float f = dot(vViewNormal, vec3(0,0,1));
    f = (1.0-f);

    alpha += f;
#endif   
    
    FinalFragment.a = alpha;
    //FinalFragment.rgb *= alpha;

	gl_FragColor = FinalFragment;
}
#endif