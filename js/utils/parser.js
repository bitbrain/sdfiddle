const MAIN_IMAGE_PATTERN = /void\s+mainImage\s*\(\s*out\s+vec4\s+\w+\s*,\s*in\s+vec2\s+\w+\s*\)/;

export function parseShader(source) {
  const diagnostics = [];

  if (!MAIN_IMAGE_PATTERN.test(source)) {
    diagnostics.push({
      level: "error",
      message: "Missing required function signature: void mainImage(out vec4 fragColor, in vec2 fragCoord)",
    });
  }

  const braceStack = [];
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (char === "{") {
      braceStack.push(i);
    } else if (char === "}") {
      if (!braceStack.length) {
        diagnostics.push({
          level: "error",
          message: `Unexpected closing brace at index ${i}`,
        });
        break;
      }
      braceStack.pop();
    }
  }

  if (braceStack.length) {
    diagnostics.push({
      level: "error",
      message: "Unclosed brace detected in shader source.",
    });
  }

  return {
    ok: diagnostics.length === 0,
    diagnostics,
  };
}

