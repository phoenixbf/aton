/*	
    @preserve

    Sample Vertex + Fragment Shaders
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

    // Waving
    float amp = 0.5;
    vWorldVertex += vec3(amp*cos(vWorldVertex.z - time), amp*sin(vWorldVertex.z - time), 0.0);

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

    //=====================================================
    // FINALIZE
    //=====================================================
    FinalFragment.a = alphaContrib;

	gl_FragColor = FinalFragment;
}
#endif