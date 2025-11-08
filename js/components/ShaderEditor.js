import { h } from "../utils/dom.js";
import { highlightShader } from "../utils/highlight.js";
import { parseShader } from "../utils/parser.js";

export class ShaderEditor {
  constructor({ initialValue = "", onChange, onDiagnostics }) {
    this.onChange = onChange;
    this.onDiagnostics = onDiagnostics;
    this.root = this.#build(initialValue);
    this.textarea.value = initialValue;
    this.#updateHighlight(initialValue);
    this.#updateMeta(initialValue);
    this.setStatus("Awaiting changes", "idle");
    this.statusLog.textContent = "Ready.";
  }

  get element() {
    return this.root;
  }

  focus() {
    this.textarea.focus();
  }

  setValue(value) {
    this.textarea.value = value;
    this.#updateHighlight(value);
    this.#updateMeta(value);
  }

  setStatus(message, mode = "idle") {
    this.statusChip.textContent = message;
    this.statusChip.classList.remove("ok", "error");
    if (mode === "ok") this.statusChip.classList.add("ok");
    if (mode === "error") this.statusChip.classList.add("error");
  }

  setLog(message, mode = "info") {
    this.statusLog.textContent = message;
    this.statusLog.classList.toggle("error", mode === "error");
  }

  #build(initialValue) {
    this.codeLayer = h("pre", { className: "code-highlights", attrs: { "aria-hidden": "true" } }, h("code"));
    this.textarea = h("textarea", {
      attrs: {
        spellcheck: "false",
        "data-testid": "shader-source",
        autocomplete: "off",
      },
    });

    this.textarea.addEventListener("input", (event) => {
      const value = event.target.value;
      this.#updateHighlight(value);
      this.#updateMeta(value);
      const parseResult = parseShader(value);
      this.onDiagnostics?.(parseResult);
      this.onChange?.(value, parseResult);
    });

    this.textarea.addEventListener("scroll", () => {
      this.codeLayer.scrollTop = this.textarea.scrollTop;
      this.codeLayer.scrollLeft = this.textarea.scrollLeft;
    });

    const editorShell = h("div", { className: "editor-shell fade-in" }, this.textarea, this.codeLayer);

    this.statusChip = h("span", { className: "status-chip" }, "Ready");
    this.lineMeta = h("span", {}, "0 lines");
    const footer = h(
      "div",
      { className: "editor-footer" },
      h("span", {}, this.statusChip),
      this.lineMeta,
    );

    this.statusLog = h("div", { className: "status-log" });

    return h(
      "section",
      { className: "panel editor-panel" },
      h("div", { className: "glow" }),
      h("header", {}, h("h2", {}, "Shader Editor")),
      h(
        "p",
        { className: "editor-guide" },
        "Need syntax tips? ",
        h(
          "a",
          {
            attrs: {
              href: "howto.html",
              target: "_blank",
              rel: "noreferrer noopener",
            },
          },
          "SDFiddle how-to",
        ),
      ),
      editorShell,
      footer,
      this.statusLog,
    );
  }

  #updateHighlight(value) {
    const code = this.codeLayer.querySelector("code");
    code.innerHTML = highlightShader(value || "");
  }

  #updateMeta(value) {
    const lineCount = (value.match(/\n/g)?.length ?? 0) + 1;
    this.lineMeta.textContent = `${lineCount} ${lineCount === 1 ? "line" : "lines"}`;
  }
}

