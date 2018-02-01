/*	
    @preserve

    ATON 2.0 DESCRIPTORS Vertex + Fragment Shaders
	bruno.fanini_AT_gmail.com
=========================================================*/
// COMMON
//========================================================

//#define MOBILE_DEVICE 1

#ifdef GL_ES
precision mediump float;
precision mediump int;
#endif

//varying vec2 osg_TexCoord0;
//varying vec3 osg_FragVertex;
//varying vec3 osg_FragEye;
//varying vec3 osg_FragNormal;
//varying vec3 osg_FragNormalWorld;
varying vec4 vColor;


//=========================================================
// VERTEX SHADER
//=========================================================
#ifdef VERTEX_SH

attribute vec3 Normal;
attribute vec3 Vertex;
attribute vec4 Color;
//attribute Material;

uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;


void main(){
	vColor = Color;
	gl_Position = uProjectionMatrix * (uModelViewMatrix * vec4(Vertex, 1.0));
}

#endif




//=========================================================
// FRAGMENT SHADER
//=========================================================
#ifdef FRAGMENT_SH

uniform float time;

// MAIN
//==============
void main(){
    //vec4 baseAlbedo = texture2D(BaseSampler, osg_TexCoord0);

    // FIXME: get color from ???
    vec4 FinalFragment = vec4(0.5,1,0, 1.0);

	float alpha;
	if (true){ // bHighlight
		float f = (sin(time*3.0) + 1.0);
		f *= 0.5;
		alpha = mix(0.7, 0.3, f);
		}
	else alpha = 0.2;

    FinalFragment.a = alpha;

	gl_FragColor = FinalFragment;
}
#endif