import { ShaderEditor } from "./components/ShaderEditor.js";
import { PreviewCanvas } from "./components/PreviewCanvas.js";
import { OptionsPanel } from "./components/OptionsPanel.js";
import { ExportPanel } from "./components/ExportPanel.js";
import { HeaderBar } from "./components/HeaderBar.js";
import { FooterBar } from "./components/FooterBar.js";
import {
  customShaderTemplate,
  defaultDemoId,
  defaultShader,
  shaderDemos,
} from "./utils/defaultShader.js";
import { parseShader } from "./utils/parser.js";

const appRoot = document.getElementById("app-root");

const initialOptions = {
  width: 1024,
  height: 1024,
  layout: "split",
  backgroundHex: "#000000",
  backgroundAlpha: 0,
  antialias: true,
};

const defaultDemo = shaderDemos.find((demo) => demo.id === defaultDemoId) ?? shaderDemos[0];

const state = {
  shaderSource: defaultShader,
  parseOk: true,
  options: { ...initialOptions },
  selectedDemoId: defaultDemo?.id ?? null,
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

const headerBar = new HeaderBar({
  demos: shaderDemos,
  initialDemoId: defaultDemo?.id,
  onDemoChange: handleDemoChange,
});
document.body.insertBefore(headerBar.element, appRoot);

const exportPanel = new ExportPanel();
exportPanel.setSnapshotProvider((options) => preview.snapshotToBlob(options));

appRoot.append(editor.element, preview.element, optionsPanel.element, exportPanel.element);

const footerBar = new FooterBar();
document.body.appendChild(footerBar.element);

// Initial render
const initialParse = parseShader(defaultShader);
if (initialParse.ok) {
  preview.updateShader(defaultShader);
  editor.setStatus("Compiled", "ok");
  editor.setLog(`Loaded demo: ${defaultDemo?.label ?? "Shader"}.`);
  preview.setStatus("Rendering", "ok");
} else {
  editor.setStatus("Parse issue", "error");
  editor.setLog(initialParse.diagnostics.map((d) => d.message).join("\n"), "error");
  preview.setStatus("Awaiting fix", "error");
}

function handleShaderChange(source, parseResult, meta = {}) {
  const { demoId } = meta;
  state.shaderSource = source;
  syncDemoSelection(source, demoId);
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

function handleDemoChange(demoId) {
  if (!demoId) {
    const parseResult = parseShader(customShaderTemplate);
    editor.setValue(customShaderTemplate);
    handleShaderChange(customShaderTemplate, parseResult, { demoId: null });

    if (parseResult.ok) {
      editor.setStatus("Compiled", "ok");
      editor.setLog("Loaded custom shader template.");
      preview.setStatus("Rendering", "ok");
    } else {
      editor.setStatus("Parse issue", "error");
      editor.setLog(parseResult.diagnostics.map((d) => `• ${d.message}`).join("\n"), "error");
      preview.setStatus("Waiting for valid shader", "error");
    }
    return;
  }

  const demo = shaderDemos.find((item) => item.id === demoId);
  if (!demo) return;

  const parseResult = parseShader(demo.source);
  editor.setValue(demo.source);
  handleShaderChange(demo.source, parseResult, { demoId: demo.id });

  if (parseResult.ok) {
    editor.setStatus("Compiled", "ok");
    editor.setLog(`Loaded demo: ${demo.label}.`);
    preview.setStatus("Rendering", "ok");
  } else {
    editor.setStatus("Parse issue", "error");
    editor.setLog(parseResult.diagnostics.map((d) => `• ${d.message}`).join("\n"), "error");
    preview.setStatus("Waiting for valid shader", "error");
  }
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

function syncDemoSelection(source, preferredDemoId) {
  if (preferredDemoId) {
    state.selectedDemoId = preferredDemoId;
    headerBar.setSelectedDemo(preferredDemoId);
    return;
  }

  const matchedDemo = shaderDemos.find((demo) => demo.source === source);
  if (matchedDemo) {
    state.selectedDemoId = matchedDemo.id;
    headerBar.setSelectedDemo(matchedDemo.id);
  } else {
    state.selectedDemoId = null;
    headerBar.setSelectedDemo(null);
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

