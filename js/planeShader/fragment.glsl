uniform float uTime;

varying vec2 vUv;
uniform vec3 uLight;
varying vec3 vPosition;
varying vec3 v_worldPosition;
varying vec3 vNormal;
const float PI = 3.141592653589793238;

float getScatter(vec3 camera, vec3 dir, vec3 light, float d) {
  // light to ray origin
  vec3 q = camera - light;

  // coefficient
  float b = dot(dir, q);
  float c = dot(q, q);

  // evaluate integral
  float t = c - b * b;
  float s = 1. / sqrt(max(.0001, t));
  float l = s * (atan((d + b) * s) - atan(b * s));

  return pow(max(0., l / 150.) , .4);
}

void main() {
 
  vec3 cameraToWorld = v_worldPosition - cameraPosition;
  vec3 cameraToWorldDir = normalize(cameraToWorld);
  float cameraToWorldDist = length(cameraToWorld);

  vec3 lightToWorld = normalize(uLight -v_worldPosition);
  float diffusion = max(0.,dot(vNormal, lightToWorld));

  float scatter = getScatter(cameraPosition, cameraToWorldDir, uLight, cameraToWorldDist);
  float dist = length(uLight - vPosition);

  gl_FragColor = vec4(1. - dist, 0., 0., 1.);
  gl_FragColor = vec4(diffusion, 0., 0., 1.);
  gl_FragColor = vec4(scatter, 0., 0., 1.);

}