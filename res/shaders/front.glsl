/*	
    @preserve

    ATON 2.0 UI Vertex + Fragment Shaders
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
varying vec3 osg_FragVertex;
varying vec3 osg_FragEye;
varying vec3 osg_FragNormal;
varying vec3 osg_FragNormalWorld;

uniform float lookAhead;
uniform float time;


//=========================================================
// VERTEX SHADER
//=========================================================
#ifdef VERTEX_SH

attribute vec3 Normal;
attribute vec3 Vertex;
//attribute vec3 Tangent;
//attribute Material;

//attribute vec2 TexCoord0;

uniform mat3 uModelViewNormalMatrix;
uniform mat3 uModelNormalMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uModelMatrix;


void main(){
	osg_FragVertex = Vertex;

    osg_FragNormalWorld = Normal;
    osg_FragNormalWorld = uModelNormalMatrix * osg_FragNormalWorld;
    osg_FragNormalWorld = normalize(osg_FragNormalWorld);

	//osg_TexCoord0 = TexCoord0;

    osg_FragEye         = vec3(uModelViewMatrix * vec4(Vertex, 1.0));
    osg_FragNormal      = vec3(uModelViewNormalMatrix * Normal);

	//vec3 normal   = normalize( Normal );
	vec4 position = vec4( Vertex, 1.0);

    //pColor = Material.Diffuse;

	//normal   = vec3(uModelViewNormalMatrix * vec4(Normal, 1.0));
	vec4 wPosition = uProjectionMatrix * vec4(osg_FragEye,1.0);

    gl_Position = wPosition;
}

#endif




//=========================================================
// FRAGMENT SHADER
//=========================================================
#ifdef FRAGMENT_SH


// MAIN
//==============
void main(){
	//float dRange = 40.0;
	float dFrag  = (gl_FragCoord.z / gl_FragCoord.w);
	float D = dFrag / lookAhead;
    D = 1.0 - D;

    D = clamp(D, 0.0,1.0);

    vec3 vN = osg_FragNormalWorld + vec3(1,1,1);
    vN *= 0.5;

    vec4 final = vec4(vN, D);
    //final = mix(final,vec4(0,0,0, 1.0) ,D);

	gl_FragColor = final;
}
#endif