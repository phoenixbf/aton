/*	
    @preserve

    BASIC Vertex + Fragment Shaders
	author: bruno.fanini_AT_gmail.com - CNR ISPC

=========================================================*/
// COMMON
//========================================================

//#define MOBILE_DEVICE 1

//#define USE_LP 1
//#define USE_PASS_AO 1


#define PI     3.1415926535897932
#define PI2    (PI * 0.5)
#define PI_DBL 6.2831853071795865


varying vec2 osg_TexCoord0;
//varying vec2 osg_TexCoord1;
//varying vec2 osg_TexCoord2;
//varying vec2 osg_TexCoord3;
varying vec3 vWorldVertex;
varying vec3 vViewVertex;
varying vec3 vViewNormal;
varying vec3 vWorldNormal;
varying vec3 EyeDir;
//varying vec4 osg_VertexWorld;

uniform sampler2D BaseSampler;		        // 0

uniform vec3 uWorldEyePos;
uniform vec3 uViewDirWorld;
//uniform vec3 EyeWorld;
uniform vec3 uHoverPos;
//uniform float uHoverAffordance;
uniform vec4 uHoverColor;
uniform float uHoverRadius;

// sections/cuts
uniform float uTopCut;

uniform float time;
uniform float uDim;


//=========================================================
// VERTEX SHADER
//=========================================================
#ifdef VERTEX_SH

attribute vec3 Normal;
attribute vec3 Vertex;
//attribute vec4 Tangent; // if using Tangents

attribute vec2 TexCoord0;
attribute vec2 TexCoord1;

uniform mat3 uModelViewNormalMatrix;
uniform mat3 uModelNormalMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;


void main(){
    vWorldVertex = vec3(uModelMatrix * vec4(Vertex, 1.0));

	osg_TexCoord0 = TexCoord0;

    vViewVertex = vec3(uViewMatrix * vec4(vWorldVertex,1.0));

    vViewNormal = uModelViewNormalMatrix * Normal;
    vViewNormal = normalize(vViewNormal);

    // If using Tangents
    //vViewTangent = vec4(uModelViewNormalMatrix * Tangent.xyz, Tangent.w);

    vWorldNormal  = uModelNormalMatrix * Normal; //vWorldNormal;
    vWorldNormal  = normalize(vWorldNormal);

    vec4 wPosition = uProjectionMatrix * vec4(vViewVertex,1.0);

    EyeDir = normalize(Vertex);

    gl_Position = wPosition;
}

#endif




//=========================================================
// FRAGMENT SHADER
//=========================================================
#ifdef FRAGMENT_SH

uniform float uFogDistance;
uniform vec4 uFogColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uLProtation;


//========================================================
// MAIN
//=====================================================
void main(){

    vec4 baseAlbedo = texture2D(BaseSampler, osg_TexCoord0);
    vec4 FinalFragment = baseAlbedo;

    float alphaContrib = baseAlbedo.a;

    float fragDist = (gl_FragCoord.z / gl_FragCoord.w);


    //=====================================================
    // Fog Pass
    //=====================================================
#ifndef MOBILE_DEVICE

    vec4 fogColor = uFogColor; //vec4(1,1,1, 0.0);

    fogColor.a = 0.0;
    fogColor.rgb *= alphaContrib;

    float f = fragDist / uFogDistance;
    f = clamp(f, 0.0,1.0);

    //fogColor = max(fogColor, (FinalFragment*0.6));

    //FinalFragment.rgb *= alphaContrib;
    FinalFragment = mix(FinalFragment,fogColor, f);
#endif

    //=====================================================
    // Hover Pass (IF)
    //=====================================================
    float hpd = distance(uHoverPos, vWorldVertex);
    hpd /= uHoverRadius; //0.5; // radius
    hpd = 1.0- clamp(hpd, 0.0,1.0);

    hpd *= 5.0; // 20 hardening
    hpd = clamp(hpd, 0.0,1.0);


    FinalFragment = mix(FinalFragment, uHoverColor, /*hpd * mix(0.3,0.5, uHoverAffordance)*/hpd*0.3*uHoverColor.a);

    //=====================================================
    // FINALIZE
    //=====================================================
    FinalFragment.a = alphaContrib;

	gl_FragColor = FinalFragment;
}
#endif