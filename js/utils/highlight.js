const KEYWORDS = new Set([
  "if",
  "else",
  "for",
  "while",
  "return",
  "break",
  "continue",
  "discard",
  "const",
  "uniform",
  "struct",
  "void",
]);

const TYPES = new Set([
  "float",
  "int",
  "bool",
  "vec2",
  "vec3",
  "vec4",
  "mat2",
  "mat3",
  "mat4",
  "sampler2D",
  "samplerCube",
]);

const BUILTINS = new Set([
  "sin",
  "cos",
  "tan",
  "abs",
  "pow",
  "dot",
  "cross",
  "normalize",
  "length",
  "clamp",
  "mix",
  "min",
  "max",
  "fract",
  "floor",
  "ceil",
  "mod",
  "step",
  "smoothstep",
  "reflect",
  "refract",
  "distance",
  "sign",
]);

const OPERATORS = new Set(["+", "-", "*", "/", "=", "!", ">", "<", "%", "&", "|", "^", "~", "?"]);

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function pushToken(tokens, type, value) {
  tokens.push({
    type,
    value,
  });
}

export function highlightShader(source) {
  const tokens = [];
  let cursor = 0;

  while (cursor < source.length) {
    const char = source[cursor];
    const nextTwo = source.slice(cursor, cursor + 2);

    // Single-line comment
    if (nextTwo === "//") {
      const end = source.indexOf("\n", cursor);
      const value = end === -1 ? source.slice(cursor) : source.slice(cursor, end);
      pushToken(tokens, "comment", value);
      cursor += value.length;
      continue;
    }

    // Block comment
    if (nextTwo === "/*") {
      const endIdx = source.indexOf("*/", cursor + 2);
      const value = endIdx === -1 ? source.slice(cursor) : source.slice(cursor, endIdx + 2);
      pushToken(tokens, "comment", value);
      cursor += value.length;
      continue;
    }

    // String literal
    if (char === '"' || char === "'") {
      let end = cursor + 1;
      while (end < source.length) {
        if (source[end] === "\\" && end + 1 < source.length) {
          end += 2;
          continue;
        }
        if (source[end] === char) {
          end += 1;
          break;
        }
        end += 1;
      }
      pushToken(tokens, "string", source.slice(cursor, end));
      cursor = end;
      continue;
    }

    // Numbers
    if (/\d|\./.test(char)) {
      let end = cursor + 1;
      while (end < source.length && /[\d._eE-]/.test(source[end])) {
        end += 1;
      }
      pushToken(tokens, "number", source.slice(cursor, end));
      cursor = end;
      continue;
    }

    // Identifiers or keywords
    if (/[A-Za-z_]/.test(char)) {
      let end = cursor + 1;
      while (end < source.length && /[A-Za-z0-9_]/.test(source[end])) {
        end += 1;
      }
      const value = source.slice(cursor, end);
      if (KEYWORDS.has(value)) {
        pushToken(tokens, "keyword", value);
      } else if (TYPES.has(value)) {
        pushToken(tokens, "type", value);
      } else if (BUILTINS.has(value)) {
        pushToken(tokens, "function", value);
      } else {
        pushToken(tokens, null, value);
      }
      cursor = end;
      continue;
    }

    // Operators
    if (OPERATORS.has(char)) {
      let value = char;
      const combined = char + source[cursor + 1];
      if (["==", "!=", "<=", ">=", "++", "--", "&&", "||", "+=", "-=", "*=", "/="].includes(combined)) {
        value = combined;
        cursor += 1;
      }
      pushToken(tokens, "operator", value);
      cursor += 1;
      continue;
    }

    // Whitespace or other characters
    pushToken(tokens, null, char);
    cursor += 1;
  }

  return tokens
    .map(({ type, value }) => {
      const safe = escapeHtml(value);
      if (!type) return safe;
      return `<span class="code-token ${type}">${safe}</span>`;
    })
    .join("");
}

