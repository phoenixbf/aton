/*	
    @preserve

    ATON 2.0 DESCRIPTORS Vertex + Fragment Shaders
	bruno.fanini_AT_gmail.com
=========================================================*/
// COMMON
//========================================================

//#define MOBILE_DEVICE 1

#define PI 		3.1415926535897932
#define PI2 	(PI*0.5)

//varying vec2 osg_TexCoord0;
//varying vec3 osg_FragVertex;
//varying vec3 osg_FragEye;
//varying vec3 osg_FragNormal;
//varying vec3 osg_FragNormalWorld;
varying vec4 vColor;
varying vec3 vWorldVertex;
varying vec3 vViewNormal;

uniform vec3 uHoverPos;
uniform float uHoverRadius;

//=========================================================
// VERTEX SHADER
//=========================================================
#ifdef VERTEX_SH

attribute vec3 Normal;
attribute vec3 Vertex;
attribute vec4 Color;

uniform mat3 uModelViewNormalMatrix;
uniform mat3 uModelNormalMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uModelMatrix;

void main(){
	vColor = Color;
	vWorldVertex = vec3(uModelMatrix * vec4(Vertex, 1.0));

    vViewNormal = uModelViewNormalMatrix * Normal;
    vViewNormal = normalize(vViewNormal);

	gl_Position = uProjectionMatrix * (uModelViewMatrix * vec4(Vertex, 1.0));
}

#endif




//=========================================================
// FRAGMENT SHADER
//=========================================================
#ifdef FRAGMENT_SH

uniform float time;
uniform sampler2D BaseSampler;

//uniform vec4 uMaterialDiffuse;


// MAIN
//==============
void main(){
	vec4 FinalFragment;

	//FinalFragment = uMaterialDiffuse;
    FinalFragment = texture2D(BaseSampler, vec2(0,0));
	float alpha = FinalFragment.a; //0.1;

/*
	FinalFragment.r = (cos(time) + 1.0) * 0.5;
	FinalFragment.g = (cos(time + PI2) + 1.0) * 0.5;
	FinalFragment.b = (cos(time + PI) + 1.0) * 0.5;
*/


#ifndef MOBILE_DEVICE	// bHighlight
	float f = dot(vViewNormal, vec3(0,0,1));
	f *= 0.7; //0.9;
	f = 1.0 - f;
	//f *= f;

	alpha *= f;
/*
	alpha = 1.0;

	float t = (sin(time*3.0) + 1.0);
	t *= 0.5;
	alpha = mix(alpha, alpha*0.5, t);
*/

#if 0
	float hpd = distance(uHoverPos, vWorldVertex);
    hpd /= uHoverRadius; // radius
    hpd = 1.0 - clamp(hpd, 0.0,1.0);
	
	//hpd = (hpd*0.8) + 0.2;

	alpha *= mix(0.7, 1.0, hpd);
	//alpha += (hpd * f);
	///alpha *= hpd * f;
	////if (hpd > 0.95) alpha += 0.2;
#endif

#endif

    FinalFragment.a = alpha;

	gl_FragColor = FinalFragment;
}
#endif