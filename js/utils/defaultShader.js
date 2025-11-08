export const defaultShader = `// Signed distance field demo
float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

float map(vec3 p) {
  float d = sdSphere(p, 0.6);
  float wobble = sin(p.x * 4.0 + iTime * 1.4) * 0.05;
  return d + wobble;
}

vec3 estimateNormal(vec3 p) {
  const float e = 0.001;
  return normalize(vec3(
    map(p + vec3(e, 0.0, 0.0)) - map(p - vec3(e, 0.0, 0.0)),
    map(p + vec3(0.0, e, 0.0)) - map(p - vec3(0.0, e, 0.0)),
    map(p + vec3(0.0, 0.0, e)) - map(p - vec3(0.0, 0.0, e))
  ));
}

vec3 render(vec3 ro, vec3 rd) {
  float t = 0.0;
  const float maxT = 10.0;
  for (int i = 0; i < 128; i++) {
    vec3 p = ro + rd * t;
    float dist = map(p);
    if (dist < 0.001) {
      vec3 n = estimateNormal(p);
      vec3 lightDir = normalize(vec3(-0.6, 0.7, 0.4));
      float diff = clamp(dot(n, lightDir), 0.0, 1.0);
      float fresnel = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 3.0);
      return vec3(0.4, 0.7, 1.0) * diff + fresnel * vec3(0.6, 0.8, 1.2);
    }
    t += dist;
    if (t > maxT) break;
  }
  return vec3(0.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
  vec3 ro = vec3(0.0, 0.0, 2.5);
  vec3 rd = normalize(vec3(uv, -1.5));
  vec3 col = render(ro, rd);
  fragColor = vec4(col, length(col));
}
`;

