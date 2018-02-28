/*	
    @preserve

    ATON 2.0 MAIN Vertex + Fragment Shaders
	bruno.fanini_AT_gmail.com
=========================================================*/
// COMMON
//========================================================

//#define MOBILE_DEVICE 1

#ifdef GL_ES
precision mediump float;
precision mediump int;
#endif

#define PI     3.1415926535897932
#define PI_DBL 6.2831853071795865

#define ATON_LP_MAX_H   480


varying vec2 osg_TexCoord0;
varying vec2 osg_TexCoord1;
varying vec2 osg_TexCoord2;
varying vec2 osg_TexCoord3;
varying vec3 vWorldVertex;
varying vec3 vViewVertex;
varying vec3 vViewNormal;
varying vec3 vWorldNormal;
varying vec3 EyeDir;
//varying vec4 osg_VertexWorld;

uniform sampler2D BaseSampler;		        // 0
uniform sampler2D AmbientOcclusionSampler;	// 1
uniform sampler2D NormalMapSampler;		    // 2
uniform sampler2D ComboSampler;		        // 3 (Rough, Met, Emiss)
uniform sampler2D LightProbeSampler;

uniform vec3 uWorldEyePos;
uniform vec3 uViewDirWorld;
//uniform vec3 EyeWorld;
uniform vec3 uHoverPos;
uniform float uHoverAffordance;

uniform float time;

/*
struct User {
    int id;
    vec3 position;
    vec3 target;
};

uniform User Users[128];
*/

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
	//vWorldVertex = Vertex;
    vWorldVertex = vec3(uModelMatrix * vec4(Vertex, 1.0));

	osg_TexCoord0 = TexCoord0;
	osg_TexCoord1 = TexCoord1;
	osg_TexCoord2 = TexCoord0;
    osg_TexCoord3 = TexCoord0;

    vViewVertex    = vec3(uModelViewMatrix * vec4(Vertex, 1.0));

    vViewNormal = uModelViewNormalMatrix * Normal;
    vViewNormal = normalize(vViewNormal);

    // If using Tangents
    //vViewTangent = vec4(uModelViewNormalMatrix * Tangent.xyz, Tangent.w);

    //vWorldNormal  = Normal;
    vWorldNormal  = uModelNormalMatrix * Normal; //vWorldNormal;
    vWorldNormal  = normalize(vWorldNormal);

/*
	//vec3 normal   = normalize( Normal );
	vec4 position = vec4( Vertex, 1.0);

	//normal   = vec3(uModelViewNormalMatrix * vec4(Normal, 1.0));
	position = uModelViewMatrix * position;
*/
    vec4 wPosition = uProjectionMatrix * vec4(vViewVertex,1.0);


    //EyeDir = normalize(Vertex - uWorldEyePos); // OK for World
    EyeDir = normalize(Vertex); // OK (new)

    //EyeDir = normalize(vec3(uProjectionMatrix * vec4(Vertex,1.0)) - uWorldEyePos);
    //EyeDir = uViewDirWorld;
    //EyeDir = normalize(wPosition.xyz - uWorldEyePos);
    //EyeDir = normalize(Vertex);

    gl_Position = wPosition;
}

#endif




//=========================================================
// FRAGMENT SHADER
//=========================================================
#ifdef FRAGMENT_SH

#ifndef MOBILE_DEVICE
#extension GL_OES_standard_derivatives : enable
#endif

uniform float uExposure;
uniform float uGIContrib;
uniform float uFogDistance;

uniform mat4 uModelViewMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uLProtation;

// GLOBALS
//=========================================================
vec4 FinalFragment;


// FUNCTIONS
//=========================================================
// Screen
float screen(float a, float b){
    return 1.0 - ((1.0 - a)*(1.0 - b));
}
vec4 screenVec4(vec4 A, vec4 B){
    vec4 ovec;
    ovec.r = screen(A.r,B.r);
    ovec.g = screen(A.g,B.g);
    ovec.b = screen(A.b,B.b);
    return ovec;
}

#ifndef MOBILE_DEVICE
// W/out precomputed TBN
// http://www.thetenthplanet.de/archives/1180
mat3 CotangentFrame( vec3 N, vec3 p, vec2 uv ){
    // get edge vectors of the pixel triangle
    vec3 dp1  = dFdx( p );
    vec3 dp2  = dFdy( p );
    vec2 duv1 = dFdx( uv );
    vec2 duv2 = dFdy( uv );

    // solve the linear system
    vec3 dp2perp = cross( dp2, N );
    vec3 dp1perp = cross( N, dp1 );
    vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
    vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;

    // construct a scale-invariant frame
    float invmax = inversesqrt( max( dot(T,T), dot(B,B) ) );
    return mat3( T * invmax, B * invmax, N );
}

// Get normal in tangent-space
vec3 getTSnormal(){
    vec3 rgbNorm = texture2D(NormalMapSampler, osg_TexCoord2.st).rgb;
    return ((2.0 * rgbNorm) - 1.0);
}

#endif

// PBR Values
float getAmbientOcclusionWeight(){
    float aow = texture2D(AmbientOcclusionSampler, osg_TexCoord1).r; // red channel
    return aow;
}

float getRoughnessWeight(){
    return texture2D(ComboSampler, osg_TexCoord0).r; // red channel
}
float getMetallicWeight(){
    return texture2D(ComboSampler, osg_TexCoord0).g; // green channel
}
float getEmissionWeight(){
    return texture2D(ComboSampler, osg_TexCoord0).b; // blue channel
}


// Env Fetch
vec3 envmapReflectionVector(const in mat4 transform, const in vec3 view, const in vec3 normal){
    vec3 lv = reflect(view, normal);
    //lv = normalize(lv);

    vec3 x = vec3(transform[0][0], transform[1][0], transform[2][0]);
    vec3 y = vec3(transform[0][1], transform[1][1], transform[2][1]);
    vec3 z = vec3(transform[0][2], transform[1][2], transform[2][2]);
    mat3 m = mat3(x,y,z);

    return normalize(m*lv);
}
vec3 envmapVector(const in mat4 transform, const in vec3 normal){
    vec3 lv = -normal;

    vec3 x = vec3(transform[0][0], transform[1][0], transform[2][0]);
    vec3 y = vec3(transform[0][1], transform[1][1], transform[2][1]);
    vec3 z = vec3(transform[0][2], transform[1][2], transform[2][2]);
    mat3 m = mat3(x,y,z);

    return normalize(m*lv);
}

// Returns (start, end, roughness-norm-offs, v-flip)
vec4 getPrefilterLPRange(float roughness){
    if (roughness <= 0.25) return vec4(0.0,0.53333, roughness/0.25, 0.0 );
    if (roughness <= 0.5) return vec4(0.53333,0.8, (roughness-0.25)/0.25, 1.0 ); // 
    if (roughness <= 0.75) return vec4(0.8,0.93333, (roughness-0.5)/0.25, 0.0 );
    return vec4(0.93333,1.0, (roughness-0.75)/0.25, 1.0 );
}

vec4 getLPvalue(vec3 norm, float roughness){
/*
    float eps = 0.000001;
    vec2 K   = vec2(norm.x,norm.y);
    float LK = length(K);
    if (LK < eps) norm = vec3(0.0,0.0,1.0);
*/
    
    float u = (atan(norm.x, norm.y) + PI) / PI_DBL;
    float v = acos(norm.z) / PI;

    float trim = 0.004;

    //v = clamp(v, trim,1.0-trim); // fix on z-up normals
    v = clamp(v, trim, 1.0);
    u = clamp(u, 0.0, 1.0);

    //float conv = abs( (v-0.5)*2.0 );
    //u = mix(u,1.0, conv*conv);

    //float lod = mix(0.0, 8.0, roughness);
    //return texture2D(LightProbeSampler, vec2(u,v), roughness);

    vec4 R = getPrefilterLPRange(roughness);
    float dH = (R.y - R.x);
    if (R.w > 0.0) v = 1.0 - v; // flip

    // First
    float v1 = mix(R.x,R.y, v);
    //v1 = clamp(v1, 0.001,1.0);
    v1 = clamp(v1, 0.0,1.0);
    vec4 A = texture2D(LightProbeSampler, vec2(u,v1));

    if (roughness >= 0.75) return A;

    // Second
    float v2 = mix(R.y, (R.y+(dH*0.5)), 1.0-v);
    //v2 = clamp(v2, 0.001,1.0);
    v2 = clamp(v2, 0.0,1.0);
    vec4 B = texture2D(LightProbeSampler, vec2(u,v2));

    // Interpolate
    return mix(A,B, R.z);
}


// MAIN
//==============
void main(){
    vec4 baseAlbedo = texture2D(BaseSampler, osg_TexCoord0);
    FinalFragment = baseAlbedo;

#ifndef MOBILE_DEVICE
    // Fill in base values
    vec3 tsNorm = getTSnormal();
#endif

    float alphaContrib = baseAlbedo.a;
    float aoContrib  = getAmbientOcclusionWeight();
    float emContrib  = getEmissionWeight();
    float rouContrib = getRoughnessWeight();
    float metContrib = getMetallicWeight();
    
    // move to user
    float nrmWeight = 0.9;
    float giContrib = 0.2; // 0.3


#if 0 // DEBUG
    vec3 rgbN = (vViewNormal + 1.0) * 0.5;
    gl_FragColor = vec4(rgbN,1.0);
    return;
#endif

    float ed = distance(uWorldEyePos, vWorldVertex);
    aoContrib *= clamp(ed, 0.0,1.0);

    //%CUSTOMPBR%

    //rouContrib = 1.0 - ( (baseAlbedo.r*baseAlbedo.g) - baseAlbedo.b );
    //rouContrib = 0.0;
    //metContrib = 0.0;
    //emContrib  = 0.0;
    //aoContrib = 1.0;


    //=====================================================
    // Core PBR
    //=====================================================
    vec3 viewLocal = normalize(vViewVertex); //vec3( uViewMatrix * vec4(vViewVertex,1.0) );

    vec3 norm      = vViewNormal;
    vec3 normWorld = vWorldNormal ;

    float fragDist = (gl_FragCoord.z / gl_FragCoord.w);



    // NormalMap Perturbation pass
    //=====================================================
#if 1
#ifndef MOBILE_DEVICE
    //if (flipGnorm) tsNorm.y = -tsNorm.y;

    vec3 tsn;

    // Local
    mat3 TBN = CotangentFrame( norm, viewLocal, osg_TexCoord2 );         
    tsn  = normalize(TBN * tsNorm); // to screen-space
    norm = mix(norm,tsn, nrmWeight);
    //tsn = mix(norm,tsn, nrmWeight);
    //norm = normalize( tsn );

    // World
    TBN = CotangentFrame( normWorld, EyeDir /*viewLocal*/, osg_TexCoord2 );         
    tsn = normalize(TBN * tsNorm); // to screen-space
    normWorld = mix(normWorld, tsn, nrmWeight);
    //tsn = mix(normWorld, tsn, nrmWeight);
    //normWorld = normalize( tsn );

#endif
#endif

#if 0 // DEBUG
    vec3 rgbN = (normWorld + 1.0) * 0.5;
    gl_FragColor = vec4(rgbN,1.0);
    return;
#endif

#ifndef MOBILE_DEVICE //======== Desktop

    // Fresnel
    float fresContrib;
    fresContrib = 1.0 - dot(norm, vec3(0,0,1));
    //fresContrib *= fragDist;
    //fresContrib = 1.0 - dot(mat3(uModelViewMatrix)*norm, vec3(0,0,1));
    //fresContrib *= fresContrib;
    fresContrib = clamp(fresContrib, 0.0,1.0);

#if 0 // DEBUG
    gl_FragColor = vec4(fresContrib,fresContrib,fresContrib, 1.0);
    return;
#endif




    ////vec3 nRef  = reflect(EyeDir, norm);
    vec3 nRef  = envmapReflectionVector(uModelViewMatrix, viewLocal, norm);
    vec3 nPT   = envmapVector(uModelViewMatrix, -viewLocal);
    //vec3 nRef  = reflect(EyeDir, normWorld);


    // TEST
    //vec3 dDir = EyeDir;
    //vec3 nRef = reflect(EyeDir, normWorld);

    //dDir = vec3(uModelMatrix * vec4(dDir, 1.0));
    //vec3 nRef = reflect(viewLocal, norm);

    //vec3 nRef = envmapReflectionVector(uLProtation, ViewDirWorld, vWorldNormal );
    //vec3 nRef = envmapReflectionVector(uModelViewMatrix, osg_VertexWorld.xyz, norm);
    //vec3 nRef = envmapReflectionVector(uModelViewMatrix, viewLocal, norm);
    //vec3 nRef = envmapReflectionVector(MMM, ViewDirWorld, vWorldNormal );

    vec4 reflFrag   = getLPvalue(nRef, rouContrib);
    //vec4 seeTruFrag = getLPvalue(-norm, rouContrib);
    vec4 giFrag     = getLPvalue(normWorld, 0.8); // 0.75
    vec4 ptFrag     = getLPvalue(nPT, 0.5);

    float emRefl = (1.0 - reflFrag.a);
    float emGI   = (1.0 - giFrag.a);

#if 0 // DEBUG
    gl_FragColor = ptFrag;
    return;
#endif


    // Dielectric/Metal Reflection Frag Pass
    //=====================================================
#if 1
    vec4 dmrFrag;

    vec4 metBase = reflFrag*baseAlbedo;
    vec4 metHL   = vec4(1.0); //mix(metBase,vec4(1,1,1,1), 0.2);
    vec4 specHL  = max(reflFrag,baseAlbedo);

    vec4 specFrag = mix(baseAlbedo*uExposure, specHL, emRefl*emRefl);
    vec4 metFrag  = mix(metBase*uExposure, metBase*metHL, emRefl );

    dmrFrag = mix(specFrag,metFrag, metContrib); // * (1.0-fresContrib)

    // Fresnel
    //dmrFrag = mix(dmrFrag, reflFrag, fresContrib);
    
    // GI Influence
    float giInfl = giContrib*(1.0-emRefl);
    dmrFrag += mix(vec4(0,0,0,0),giFrag*0.5, giContrib);
    //dmrFrag *= mix( vec4(1.0), giFrag, giInfl*0.5);

    //FinalFragment = reflFrag;

#if 0 // DEBUG
    gl_FragColor = reflFrag;
    return;
#endif


#endif

    // Diffuse/GI Pass
    //=====================================================
#if 0
    //FinalFragment = mix(FinalFragment,(giFrag + emGI), uGIContrib);
    //FinalFragment = mix(FinalFragment,FinalFragment);
    
    //FinalFragment += mix(0.0,emGI*2.0, rouContrib);
    float fgi = (emGI); // + rouContrib;
    //fgi += (uExposure*0.2);
    //fgi += (rouContrib*0.2);

    vec4 giTint = mix(baseAlbedo,giFrag, 0.5+fresContrib);
    //FinalFragment = mix(FinalFragment, max(baseAlbedo,FinalFragment), fgi);
    FinalFragment = mix(FinalFragment, max(giTint,FinalFragment), fgi);
#endif

#if 1 // NEW
    vec4 diffFrag = baseAlbedo * emGI;

    // GI Influence
    //diffFrag = max(diffFrag, ((giFrag+uExposure)*giContrib));
    
    //diffFrag += mix(vec4(0,0,0,0), giFrag*uExposure, giContrib); // OK
    
    diffFrag *= mix( vec4(1.0), giFrag*5.0, giContrib ); // 3.0
    diffFrag += (giFrag*0.1); // 0.2
    

    ////diffFrag = mix(diffFrag, giFrag, giContrib);

    //FinalFragment = diffFrag;
#endif


    // Combine Relf & Diff
    FinalFragment = mix( dmrFrag, diffFrag, rouContrib);
    //FinalFragment = dmrFrag;


#endif //======== Desktop


    //=====================================================
    // AO Pass
    //=====================================================
    //FinalFragment *= mix(aoContrib,1.0, emRefl);
    FinalFragment *= aoContrib;


    //=====================================================
    // Fresnel Pass
    //=====================================================
#ifndef MOBILE_DEVICE //======== Desktop

#if 1    
    float fr = fresContrib*0.5;
    fr *= mix(1.0,0.15, rouContrib);
    //FinalFragment = mix(FinalFragment,specFrag, fresContrib);
    FinalFragment = mix(FinalFragment, reflFrag, fr);
#endif


    //=====================================================
    // Fog Pass
    //=====================================================
    vec4 fogColor = ptFrag;
    fogColor.a = 0.0;

    float f = fragDist / uFogDistance;
    f = clamp(f, 0.0,1.0);

    fogColor = max(fogColor, (FinalFragment*0.6));
    FinalFragment = mix(FinalFragment,fogColor, f);

#endif //======== Desktop

    //=====================================================
    // Emission Pass
    //=====================================================
    FinalFragment = mix(FinalFragment, max(baseAlbedo,FinalFragment), emContrib);


    //=====================================================
    // Hover Pass (IF)
    //=====================================================
    //applyHoverPass();

    vec4 HoverColor;
    float hhf = (sin(time*3.0) + 1.0);
    hhf *= 0.5;

    float hpd = distance(uHoverPos, vWorldVertex);
    hpd /= 0.7; // radius
    hpd = clamp(hpd, 0.0,1.0);

    // Test binocular-disp
#if 0
    HoverColor = mix( mix(FinalFragment,vec4(1,1,0.4,1),0.5), mix(FinalFragment,vec4(0.2,0,0,1),0.5), hpd);
#else
    bool bCircle = true;
    if (hpd < 0.55 || hpd > 0.6) bCircle = false;

    vec4 HHcol = vec4((normWorld + 1.0) * 0.5, 1.0); //vec4(0,0.5,0, 1);
    //mix(HHcol, vec4(0,0.2,0, 1), hhf);

    if (!bCircle){
        HHcol *= (0.5 + (hhf*0.5)); //HHcol = vec4(0.5,1,0.5, 1);
        //FinalFragment = mix(max(HHcol,FinalFragment), FinalFragment, hpd);
        HoverColor = mix( screenVec4(HHcol,FinalFragment), FinalFragment, hpd);
        }
    else HoverColor = mix( vec4(0,0,0,1), FinalFragment, hpd);
#endif

    FinalFragment = mix(FinalFragment,HoverColor, uHoverAffordance);
    //alphaContrib = hpd;

    if(vWorldVertex.z > 7.0) discard;


    //=====================================================
    // FINALIZE
    //=====================================================
    FinalFragment.a = alphaContrib;
	gl_FragColor = FinalFragment;
}
#endif