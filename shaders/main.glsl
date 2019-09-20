/*	
    @preserve

    ATON 2.0 MAIN Vertex + Fragment Shaders
	bruno.fanini_AT_gmail.com
=========================================================*/
// COMMON
//========================================================

//#define MOBILE_DEVICE 1

//#define USE_LP 1
//#define USE_PASS_AO 1

//#define USE_QV 1

//#define USE_QUSV_SENC 1
//#define USE_ILSIGN 1


#define PI     3.1415926535897932
#define PI2    (PI * 0.5)
#define PI_DBL 6.2831853071795865

#define ATON_LP_MAX_H   480

#define QV_SLICE_RES  64 //64 //256
#define QV_Z_SLICES   64 //64 //32
#define QV_SIZE       QV_SLICE_RES*QV_Z_SLICES


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
uniform sampler2D QUSVSampler;

uniform vec3 uWorldEyePos;
uniform vec3 uViewDirWorld;
//uniform vec3 EyeWorld;
uniform vec3 uHoverPos;
//uniform float uHoverAffordance;
uniform vec4 uHoverColor;
uniform float uHoverRadius;

// TODO: box for sections/cuts
uniform vec3 uCutMin;
uniform vec3 uCutMax;

uniform vec3 uQVmin;
uniform vec3 uQVext;
uniform float uQVslider;
uniform float uQVradius;

uniform float time;
uniform float uDim;

/*
struct User {
    int id;
    vec3 position;
    vec3 target;
};

uniform User Users[128];
*/

//vec4 UCOLORS[6];


vec4 QVEncodeLocation(vec3 worldLoc){
    vec4 qusvCol;
    qusvCol.r = (worldLoc.x - uQVmin.x) / uQVext.x;
    qusvCol.g = (worldLoc.y - uQVmin.y) / uQVext.y;
    qusvCol.b = (worldLoc.z - uQVmin.z) / uQVext.z;

    return qusvCol;
}

vec3 QVDecodeLocation(vec4 frag){
    vec3 loc;
    loc.x = (frag.r * uQVext.x) + uQVmin.x;
    loc.y = (frag.g * uQVext.y) + uQVmin.y;
    loc.z = (frag.b * uQVext.z) + uQVmin.z;

    loc.x += (uQVext.x/512.0); // was 510
    loc.y += (uQVext.y/512.0);
    loc.z += (uQVext.z/512.0);

    return loc;
}

vec3 QVgetNormalized(vec3 worldLoc){
    vec3 P;
    P.x = (worldLoc.x - uQVmin.x) / uQVext.x;
    P.y = (worldLoc.y - uQVmin.y) / uQVext.y;
    P.z = (worldLoc.z - uQVmin.z) / uQVext.z;

    return P; 
}

// z: 0=outside
vec3 QVAuvAdapter(vec3 worldLoc){
    vec3 P = QVgetNormalized(worldLoc);
    vec3 R;

/*  NOT WORKING WHY?
    R.x = P.x / float(QV_SIZE);
    R.y = 1.0 - P.y;

    int t = int(P.z * float(QV_TSIZE)); // tile index

    R.x += (float(t)/float(QV_SIZE));
*/

    int i,j,t;
    i = int(P.x * float(QV_SLICE_RES));
    j = int(P.y * float(QV_SLICE_RES));

    t = int(P.z * float(QV_Z_SLICES)); // tile index

    i += (t * QV_SLICE_RES);

    R.x = float(i)/float(QV_SIZE);
    R.y = float(QV_SLICE_RES-j)/float(QV_SLICE_RES);

/*
    int i,j,z;
    i = int(P.x * float(QV_TSIZE));
    j = int(P.y * float(QV_TSIZE));
    z = int(P.z * float(QV_TSIZE));

    int offX = int( float(z) / float(QV_TILING) );
    int offY = z - int(QV_TILING * offX);

    i += (QV_TSIZE * offX);
    j += (QV_TSIZE * offY);

    R.x = float(i)/512.0;
    R.y = float(j)/512.0;
*/

    // uv-coords
/*
    R.x = floor(P.x / float(QV_TILING));
    R.y = floor(P.y / float(QV_TILING));

    int z = int(P.z * float(QV_TSIZE));
    int offX = int(z / QV_TILING);
    int offY = z - int(QV_TILING * offX); //mod(z,int(QV_TILING)); // // mod(z,QV_TILING)

    R.x += (float(offX) / float(QV_TILING));
    R.y += (float(offY) / float(QV_TILING));
*/
    return R;
}

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

    //vViewVertex    = vec3(uModelViewMatrix * vec4(Vertex, 1.0));
    vViewVertex    = vec3(uViewMatrix * vec4(vWorldVertex,1.0));

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
uniform vec4 uFogColor;

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



//========================================================
// MAIN
//==============
void main(){
    vec4 baseAlbedo = texture2D(BaseSampler, osg_TexCoord0);
    FinalFragment = baseAlbedo;

#ifndef MOBILE_DEVICE
#ifdef USE_LP
    // Fill in base values
    vec3 tsNorm = getTSnormal();
#endif
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
    ed *= 2.0;
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
    vec3 normWorld = vWorldNormal;

    float fragDist = (gl_FragCoord.z / gl_FragCoord.w);



    // NormalMap Perturbation pass
    //=====================================================
#if 1
#ifndef MOBILE_DEVICE
#ifdef USE_LP
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
#endif

#if 0 // DEBUG
    vec3 rgbN = (normWorld + 1.0) * 0.5;
    gl_FragColor = vec4(rgbN,1.0);
    return;
#endif

#ifndef MOBILE_DEVICE //======== Desktop
#ifdef USE_LP

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
    //float giG = (giFrag.r + giFrag.g + giFrag.b) / 3.0;

    dmrFrag += mix(vec4(0,0,0,0), giFrag*0.5, giContrib); // 0.5
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


#endif // LP
#endif //======== Desktop


    //=====================================================
    // AO Pass
    //=====================================================
#ifdef USE_PASS_AO
    ////FinalFragment *= mix(aoContrib,1.0, emRefl);
    FinalFragment *= aoContrib;
#endif

    //=====================================================
    // Fresnel Pass
    //=====================================================
#ifndef MOBILE_DEVICE //======== Desktop
#ifdef USE_LP

#if 1    
    float fr = fresContrib*0.5;
    fr *= mix(1.0,0.15, rouContrib);
    //FinalFragment = mix(FinalFragment,specFrag, fresContrib);
    FinalFragment = mix(FinalFragment, reflFrag, fr);
#endif

#endif // LP

    //=====================================================
    // Fog Pass
    //=====================================================
#ifdef USE_LP
    vec4 fogColor = ptFrag;
#else
    vec4 fogColor = uFogColor; //vec4(1,1,1, 0.0);
#endif

    fogColor.a = 0.0;
    fogColor.rgb *= alphaContrib;

    float f = fragDist / uFogDistance;
    f = clamp(f, 0.0,1.0);

    //fogColor = max(fogColor, (FinalFragment*0.6));

    //FinalFragment.rgb *= alphaContrib;
    FinalFragment = mix(FinalFragment,fogColor, f);

#endif //======== Desktop

    //=====================================================
    // Emission Pass
    //=====================================================
    FinalFragment = mix(FinalFragment, max(baseAlbedo,FinalFragment), emContrib);


    //=====================================================
    // QV Pass
    //=====================================================
#ifdef USE_QV
    vec3 qvaCoords = QVAuvAdapter(vWorldVertex);

    float qn = 1.0;
    //float polDec = clamp(1.0 - (fragDist / 10.0), 0.0,1.0);

    vec4 QVAcol = texture2D(QUSVSampler, vec2(qvaCoords.x,qvaCoords.y));

    float DDD = 1.0; //1.0;
    float waveAlpha = 1.0;
    
#ifndef MOBILE_DEVICE
    vec3 qLoc   = QVDecodeLocation(QVAcol);
    vec3 vQnrm = normalize(qLoc - vWorldVertex);

    DDD = clamp(distance(uHoverPos,vWorldVertex), 0.0,2.0); // / distance(qLoc,vWorldVertex);
    DDD = 2.0 - DDD;

    DDD *= clamp(dot(normWorld,vQnrm), 0.0,1.0);

    //float qn = abs( dot(normWorld,vQnrm) );

    //vec3 qNP = QVgetNormalized(vWorldVertex) * PI * float(QV_SLICE_RES);
    //float qn = abs(sin(qNP.x)) * abs(sin(qNP.y)) * abs(sin(qNP.z));
    //qn = (qn * 0.5) + 0.5;

    //float qn = (1.0 + sin(time*10.0)) * 0.5;
    //float qn = sin((vWorldVertex.x * 20.0) + (vWorldVertex.y * 20.0) + (vWorldVertex.z * 20.0) + (time*20.0) );

    // waves
    qn = sin( (distance(qLoc,vWorldVertex) * 100.0) + (time * 5.0) );
    qn = (qn * 0.3) + 0.7;

    waveAlpha = QVAcol.a * qn; // * 0.5

    DDD *= 0.2;
#endif


#if 0   // Debug Voxels
    ////FinalFragment = mix(FinalFragment,QVAcol, QVAcol.a * 0.5);
    FinalFragment = mix(FinalFragment*uDim, FinalFragment*QVAcol*5.0, QVAcol.a * 0.5 * qn);
#else
    FinalFragment = mix(FinalFragment*uDim, FinalFragment*vec4(0,1,1,QVAcol.a)*5.0, QVAcol.a * DDD * waveAlpha);
#endif


#endif


#if 0   // Color-codes VE with QUSV voxel values
//#define USE_QUSV_SENC // hack
    vec4 qusvCol = QVEncodeLocation(vWorldVertex);

    if (qusvCol.r >= 0.0 && qusvCol.r <= 1.0 && qusvCol.g >= 0.0 && qusvCol.g <= 1.0 && qusvCol.b >= 0.0 && qusvCol.b <= 1.0)
        FinalFragment = mix(qusvCol, FinalFragment, 0.1);
        //FinalFragment = qusvCol * mix(aoContrib, 1.0, 0.5);
    else discard;
#endif



#ifdef USE_QUSV_SENC   // QUSV - Session Encoding
/*
    UCOLORS[0] = vec4(1.0,0.0,0.0, 0.0);
    UCOLORS[1] = vec4(1.0,1.0,0.0, 0.0);
    UCOLORS[2] = vec4(0.0,1.0,0.0, 0.0);
    UCOLORS[3] = vec4(0.0,1.0,1.0, 0.0);
    UCOLORS[4] = vec4(0.0,0.0,1.0, 0.0);
    UCOLORS[5] = vec4(1.0,0.0,1.0, 0.0);
*/

#if 0   // Color-codes VE with QUSV voxel values
    vec4 qusvCol = QVEncodeLocation(vWorldVertex);

    if (qusvCol.r >= 0.0 && qusvCol.r <= 1.0 && qusvCol.g >= 0.0 && qusvCol.g <= 1.0 && qusvCol.b >= 0.0 && qusvCol.b <= 1.0)
        //FinalFragment = mix(qusvCol, FinalFragment, 0.1);
        FinalFragment = qusvCol * mix(aoContrib, 1.0, 0.5);
#endif

    vec4 mIL;
    vec3 loc;
    float ql;
    float QF = 0.0;
    vec3 nrmLoc;

    vec4 fCol = vec4(1,0,0,1);
    float uNorm = 0.0;
    float qRad;
    //qRad = max(max(uQVext.x,uQVext.y),uQVext.z) / 255.0;
    

#ifdef USE_ILSIGN
    const int QUSV_MAX_RANGE  = 128; //64; //32;
    qRad = uQVradius; //1.5;

    int evalCap = int(uQVslider*float(QUSV_MAX_RANGE));
#else 
    const float harden = 3.5; //3.5;
    const int QUSV_MAX_RANGE  = 128;
    qRad = uQVradius; //3.0; // 3.0; //(uQVslider*500.0);
#endif

    const float QUSV_PATCH_SIZE = 4096.0;
    const float QUSV_ILS_SIZE   = 1024.0;

    float igW;


    for (int u=0; u<QUSV_MAX_RANGE; u++){
#ifdef USE_ILSIGN
        if (u < evalCap){
#endif

        uNorm = float(QUSV_MAX_RANGE-u)/float(QUSV_MAX_RANGE);

#ifdef USE_ILSIGN
        mIL = texture2D(QUSVSampler, vec2(float(u)/QUSV_ILS_SIZE, 0.0));
#else 
        mIL = texture2D(QUSVSampler, vec2(uQVslider, uNorm));
#endif

        if (mIL.a > 0.0){
            loc = QVDecodeLocation(mIL);

            nrmLoc = normalize(loc - vWorldVertex);
            ql = distance(loc, vWorldVertex) / qRad;
            ql = 1.0 - clamp(ql, 0.0,1.0);

            //fCol = mix(vec4(0,1,0,1),vec4(1,0,0,1), ql);

            //FinalFragment = mix(FinalFragment,fCol, ql*0.5*uNorm);
            //FinalFragment += mix(vec4(0,0,0,0),fCol, ql*0.7*uNorm);

            igW = mix(1.0,mIL.a, 0.7);
            //igW *= clamp(dot(normWorld,nrmLoc), 0.0,1.0); // normal w

#ifdef USE_ILSIGN
            QF += (ql * igW);
            //QF += (ql * mIL.a * 2.0);
            //QF = clamp(QF, 0.0,1.0);
#else
            QF += (ql * harden * igW); // 0.03
            //int uc = u - (6 * int(float(u)/6.0));
            //FinalFragment += mix(vec4(0,0,0,0), UCOLORS[uc], ql);
#endif
            QF = clamp(QF, 0.0,1.0);
            }
#ifdef USE_ILSIGN
        }
#endif
        }

//#ifdef USE_ILSIGN
    ////fCol = mix(vec4(0,1,0,1),vec4(1,0,0,1), QF);
    //fCol = mix(vec4(0,0,1,1),vec4(0,1,0,1), QF); // locomotion

    fCol = mix(vec4(0,0,1,1),vec4(0,1,0,1), smoothstep(0.0, 0.5, QF));
    fCol = mix(fCol,vec4(1,0,0,1), smoothstep(0.5, 1.0, QF));
//#endif

    //float qqq = (QF * PI);
	//fCol.r = (sin(qqq) + 1.0) * 0.5;
	//fCol.g = (sin(qqq + PI2) + 1.0) * 0.5;
	//fCol.b = (sin(qqq + PI) + 1.0) * 0.5;

    //FinalFragment = mix(FinalFragment, fCol, QF*0.5); // aoContrib*vec4(1,0,0,1)
    
    //FinalFragment += mix(vec4(0,0,0,0),fCol, QF);
    //FinalFragment = mix( FinalFragment*uDim, FinalFragment, QF);
    
    FinalFragment = mix( FinalFragment*uDim, baseAlbedo+fCol, QF);

#endif

    //=====================================================
    // Hover Pass (IF)
    //=====================================================
#ifndef USE_QUSV_SENC
//#ifndef MOBILE_DEVICE
    float hpd = distance(uHoverPos, vWorldVertex);
    hpd /= uHoverRadius; //0.5; // radius
    hpd = 1.0- clamp(hpd, 0.0,1.0);

    hpd *= 5.0; // 20 hardening
    hpd = clamp(hpd, 0.0,1.0);

    //vec4 HoverColor;
    //vec4 hovMax, hovMin;
    //hovMax = vec4((1.0-FinalFragment.r), 2.0, (1.0-FinalFragment.b), FinalFragment.a);
    //hovMin = vec4(2.0, (1.0-FinalFragment.g), (1.0-FinalFragment.b), FinalFragment.a);

    ////HoverColor = mix(hovMin,hovMax, uHoverAffordance);
    //HoverColor = mix(vec4(1,0,0,1),vec4(0,1,0,1), uHoverAffordance);

    //HoverColor = vec4(uHover.rgb, 1.0);

/*
    vec4 HoverColor;
    HoverColor = 1.0 - FinalFragment;

    HoverColor.r += mix(0.2,-0.2, uHoverAffordance);
    HoverColor.g += mix(-0.2,0.2, uHoverAffordance);
    HoverColor.b -= 0.2;
*/

/*
#ifdef USE_QV
    //HoverColor = mix(HoverColor, vec4(1,1,1,1), QVAcol.a*10.0);
    //hpd *= QVAcol.a;
#endif
*/

    FinalFragment = mix(FinalFragment, uHoverColor, /*hpd * mix(0.3,0.5, uHoverAffordance)*/hpd*0.3*uHoverColor.a);
//#endif
#endif

#if 0 // OLD
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

    //if(vWorldVertex.z > 7.0) discard;

#endif

#if 0 // Sections (TEST)
    float cutH = 790.0 + (sin(time*0.3)*15.0);

    if(vWorldVertex.z > (cutH-0.3)) FinalFragment = mix(FinalFragment, vec4(1,0,0, 0.0), 0.5);
    if(vWorldVertex.z > cutH) discard;

    //if(vWorldVertex.z > (cutH-0.2)) FinalFragment = vec4(1,0,0, 0.0);
#endif

#if 0
    float xx = distance(uHoverPos, vWorldVertex);

    if (xx < 1.0) discard;
#endif

#if 0 // TEST
    float xxx = (vWorldVertex.z - 8.0) / 24.0;
    xxx = clamp(xxx, 0.0,1.0);
    //xxx = max(xxx, dot(vWorldNormal, vec3(0,0,-1)));
    vec4 ccc = mix(vec4(0,1,0, 0.0), vec4(1,0,0, 0.0), xxx);

    FinalFragment = mix(FinalFragment, ccc, 0.7);
#endif

    //=====================================================
    // FINALIZE
    //=====================================================
    FinalFragment.a = alphaContrib;

    //FinalFragment.rgb *= uDim;

	gl_FragColor = FinalFragment;
}
#endif