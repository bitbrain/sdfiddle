export const shaderDemos = [
  {
    id: "wobble",
    label: "Wobble",
    source: `// Signed distance field demo
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
`,
  },
  {
    id: "2d-light",
    label: "2D Light",
    source: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  // Centered UV coordinates, normalized -1..1
  vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
  float r = length(uv);

  // Light radius fills the canvas (edge of texture)
  float radius = 0.48; // slightly less than half to avoid cutoff
  float x = clamp(r / radius, 0.0, 1.0);

  // Physically-inspired smooth falloff (inverse-square shaped)
  // Maps to 1 at center, 0 at edge, with soft realistic gradient
  float intensity = (1.0 - x*x);
  intensity = intensity * intensity; // smoother curve, less "exponential"

  // Optional gamma tweak for perceived brightness
  intensity = pow(intensity, 1.0 / 1.6);

  // Subtle dither to eliminate visible banding
  float dither = fract(sin(dot(fragCoord, vec2(12.9898,78.233))) * 43758.5453);
  intensity += (dither - 0.5) / 512.0;

  // White light color with intensity-driven alpha
  vec3 color = vec3(1.0);
  float alpha = clamp(intensity, 0.0, 1.0);

  fragColor = vec4(color * intensity, alpha);
}
`,
  },
];

export const defaultDemoId = "wobble";

export const defaultShader =
  shaderDemos.find((demo) => demo.id === defaultDemoId)?.source ?? shaderDemos[0].source;

export const customShaderTemplate = `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  fragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`;

