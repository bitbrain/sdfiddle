import { h } from "../utils/dom.js";

const VERTEX_SOURCE = `
attribute vec2 position;
varying vec2 vUv;

void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_HEADER = `
precision highp float;

uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iBackground;
varying vec2 vUv;
`;

const FRAGMENT_FOOTER = `
void main() {
  vec4 color = vec4(0.0);
#ifdef SDF_AA_ON
  vec2 offsets[4];
  offsets[0] = vec2(-0.5, -0.5);
  offsets[1] = vec2(0.5, -0.5);
  offsets[2] = vec2(-0.5, 0.5);
  offsets[3] = vec2(0.5, 0.5);
  for (int i = 0; i < 4; i++) {
    vec4 sampleColor;
    mainImage(sampleColor, gl_FragCoord.xy + offsets[i]);
    color += sampleColor;
  }
  color *= 0.25;
#else
  mainImage(color, gl_FragCoord.xy);
#endif
  float coverage = step(0.0005, color.a);
  vec3 outColor = mix(iBackground.rgb, color.rgb, coverage);
  float outAlpha = mix(iBackground.a, clamp(color.a, 0.0, 1.0), coverage);
  gl_FragColor = vec4(outColor, outAlpha);
}
`;

export class PreviewCanvas {
  constructor({ width = 512, height = 512, background = [0, 0, 0, 0], antialias = true, onCompile }) {
    this.onCompile = onCompile;
    this.dimensions = { width, height };
    this.background = background;
    this.antialias = antialias;
    this.timeOrigin = performance.now();
    this.shaderSource = "";

    this.canvas = h("canvas", {
      attrs: {
        width: width.toString(),
        height: height.toString(),
        tabindex: "0",
        "aria-label": "SDF preview canvas",
      },
    });

    this.canvas.style.aspectRatio = `${width} / ${height}`;
    this.#applyCanvasBackground();

    this.gl = this.canvas.getContext("webgl", {
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });
    if (!this.gl) {
      throw new Error("WebGL not supported in this browser.");
    }

    this.#initGl();
    this.#startLoop();
    this.root = this.#build();
  }

  get element() {
    return this.root;
  }

  getCanvas() {
    return this.canvas;
  }

  snapshotToBlob() {
    return new Promise((resolve, reject) => {
      try {
        if (!this.canvas || !this.gl) {
          reject(new Error("Canvas unavailable."));
          return;
        }
        this.#draw(performance.now());
        this.gl.flush();
        if (typeof this.gl.finish === "function") {
          this.gl.finish();
        }
        this.canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Snapshot failed."));
            } else {
              resolve(blob);
            }
          },
          "image/png",
          1.0,
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  updateShader(source) {
    this.shaderSource = source;
    const compileResult = this.#compileProgram(source);
    if (!compileResult.ok) {
      this.onCompile?.({ ok: false, log: compileResult.log });
      return;
    }
    if (this.program) {
      this.gl.deleteProgram(this.program);
    }
    this.program = compileResult.program;
    this.locations = compileResult.locations;
    this.onCompile?.({ ok: true, log: "Shader compiled successfully." });
  }

  resize(width, height) {
    this.dimensions = { width, height };
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.aspectRatio = `${width} / ${height}`;
    this.gl.viewport(0, 0, width, height);
  }

  updateBackground(rgba) {
    this.background = rgba;
    this.#applyCanvasBackground();
  }

  setAntialiasing(enabled) {
    if (this.antialias === enabled) return;
    this.antialias = enabled;
    if (!this.shaderSource || !this.program) return;
    this.updateShader(this.shaderSource);
  }

  #applyCanvasBackground() {
    if (!this.canvas) return;
    const [r, g, b, a] = this.background;
    const css = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a.toFixed(3)})`;
    this.canvas.style.background = css;
  }

  #build() {
    this.status = h("span", {}, "Shader idle");
    const toolbar = h(
      "div",
      { className: "preview-toolbar" },
      h("h2", {}, "Preview"),
      this.status,
    );

    return h("section", { className: "panel preview-panel fade-in" }, h("div", { className: "glow" }), toolbar, this.canvas);
  }

  setStatus(message, mode = "info") {
    this.status.textContent = message;
    this.status.dataset.mode = mode;
  }

  #initGl() {
    const { gl } = this;
    this.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    const quadVertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
  }

  #startLoop() {
    const renderFrame = (timestamp) => {
      this.#draw(timestamp);
      this.raf = requestAnimationFrame(renderFrame);
    };
    this.raf = requestAnimationFrame(renderFrame);
  }

  #draw(timestamp) {
    const { gl, program, locations, dimensions } = this;
    if (!program || !locations) {
      return;
    }

    const elapsed = (timestamp - this.timeOrigin) / 1000;

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.enableVertexAttribArray(locations.position);
    gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);

    gl.viewport(0, 0, dimensions.width, dimensions.height);
    gl.uniform3f(locations.iResolution, dimensions.width, dimensions.height, 1.0);
    gl.uniform1f(locations.iTime, elapsed);
    gl.uniform4f(
      locations.iBackground,
      this.background[0],
      this.background[1],
      this.background[2],
      this.background[3],
    );

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  #compileProgram(userSource) {
    const { gl } = this;
    const vertexShader = this.#compileShader(gl.VERTEX_SHADER, VERTEX_SOURCE);
    if (!vertexShader.ok) {
      return { ok: false, log: vertexShader.log };
    }

    const defineAA = this.antialias ? "#define SDF_AA_ON\n" : "";
    const fragmentSource = `${FRAGMENT_HEADER}\n${defineAA}${userSource}\n${FRAGMENT_FOOTER}`;
    const fragmentShader = this.#compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    if (!fragmentShader.ok) {
      gl.deleteShader(vertexShader.shader);
      return { ok: false, log: fragmentShader.log };
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader.shader);
    gl.attachShader(program, fragmentShader.shader);
    gl.linkProgram(program);

    gl.deleteShader(vertexShader.shader);
    gl.deleteShader(fragmentShader.shader);

    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
      const log = gl.getProgramInfoLog(program) ?? "Unknown linking error.";
      gl.deleteProgram(program);
      return { ok: false, log };
    }

    const position = gl.getAttribLocation(program, "position");
    const iResolution = gl.getUniformLocation(program, "iResolution");
    const iTime = gl.getUniformLocation(program, "iTime");
    const iBackground = gl.getUniformLocation(program, "iBackground");

    return {
      ok: true,
      program,
      locations: { position, iResolution, iTime, iBackground },
      log: "OK",
    };
  }

  #compileShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    const success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
    if (!success) {
      const log = this.gl.getShaderInfoLog(shader) ?? "Shader compilation error.";
      this.gl.deleteShader(shader);
      return { ok: false, log };
    }

    return { ok: true, shader };
  }
}

