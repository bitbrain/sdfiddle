import { ShaderEditor } from "./components/ShaderEditor.js";
import { PreviewCanvas } from "./components/PreviewCanvas.js";
import { OptionsPanel } from "./components/OptionsPanel.js";
import { ExportPanel } from "./components/ExportPanel.js";
import { defaultShader } from "./utils/defaultShader.js";
import { parseShader } from "./utils/parser.js";

const appRoot = document.getElementById("app-root");

const initialOptions = {
  width: 512,
  height: 512,
  layout: "split",
  backgroundHex: "#000000",
  backgroundAlpha: 0,
  antialias: true,
};

const state = {
  shaderSource: defaultShader,
  parseOk: true,
  options: { ...initialOptions },
};

const editor = new ShaderEditor({
  initialValue: defaultShader,
  onChange: handleShaderChange,
  onDiagnostics: handleDiagnostics,
});

const preview = new PreviewCanvas({
  width: initialOptions.width,
  height: initialOptions.height,
  background: hexAlphaToRgba(initialOptions.backgroundHex, initialOptions.backgroundAlpha),
  antialias: initialOptions.antialias,
  onCompile: handleCompile,
});

const optionsPanel = new OptionsPanel({
  options: initialOptions,
  onOptionsChange: handleOptionsChange,
  onLayoutChange: handleLayoutChange,
});

const exportPanel = new ExportPanel();
exportPanel.setSnapshotProvider(() => preview.snapshotToBlob());

appRoot.append(editor.element, preview.element, optionsPanel.element, exportPanel.element);

// Initial render
const initialParse = parseShader(defaultShader);
if (initialParse.ok) {
  preview.updateShader(defaultShader);
  editor.setStatus("Compiled", "ok");
  editor.setLog("Shader ready.");
  preview.setStatus("Rendering", "ok");
} else {
  editor.setStatus("Parse issue", "error");
  editor.setLog(initialParse.diagnostics.map((d) => d.message).join("\n"), "error");
  preview.setStatus("Awaiting fix", "error");
}

function handleShaderChange(source, parseResult) {
  state.shaderSource = source;
  if (!parseResult?.ok) {
    editor.setStatus("Parse issue", "error");
    editor.setLog(parseResult.diagnostics.map((d) => `• ${d.message}`).join("\n"), "error");
    state.parseOk = false;
    preview.setStatus("Waiting for valid shader", "error");
    return;
  }

  state.parseOk = true;
  preview.updateShader(source);
}

function handleDiagnostics(parseResult) {
  if (parseResult.ok) {
    editor.setStatus("Valid syntax", "ok");
    editor.setLog("Shader parsed cleanly.");
  } else {
    editor.setStatus("Parse issue", "error");
    editor.setLog(parseResult.diagnostics.map((d) => `• ${d.message}`).join("\n"), "error");
  }
}

function handleCompile(result) {
  if (result.ok) {
    editor.setStatus("Compiled", "ok");
    editor.setLog(result.log);
    preview.setStatus("Rendering", "ok");
  } else {
    editor.setStatus("Compile error", "error");
    editor.setLog(result.log, "error");
    preview.setStatus("Compile error", "error");
  }
}

function handleOptionsChange(newOptions) {
  state.options = { ...newOptions };
  preview.resize(newOptions.width, newOptions.height);
  preview.updateBackground(hexAlphaToRgba(newOptions.backgroundHex, newOptions.backgroundAlpha));
  preview.setAntialiasing(newOptions.antialias);
}

function handleLayoutChange(layout) {
  appRoot.classList.toggle("layout-stack", layout === "stack");
}

function hexAlphaToRgba(hex, alpha) {
  const sanitized = hex.replace("#", "");
  const bigint = parseInt(sanitized, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  return [r, g, b, alpha];
}

