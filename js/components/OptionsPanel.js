import { h } from "../utils/dom.js";

const SIZE_PRESETS = [
  { label: "256 × 256", width: 256, height: 256 },
  { label: "512 × 512", width: 512, height: 512 },
  { label: "1024 × 1024", width: 1024, height: 1024 },
  { label: "1280 × 720", width: 1280, height: 720 },
];

export class OptionsPanel {
  constructor({ options, onOptionsChange, onLayoutChange }) {
    this.onOptionsChange = onOptionsChange;
    this.onLayoutChange = onLayoutChange;
    this.options = { ...options };
    this.root = this.#build();
    this.#hydrate();
  }

  get element() {
    return this.root;
  }

  #build() {
    this.sizeSelect = h(
      "select",
      {},
      ...SIZE_PRESETS.map((preset) =>
        h(
          "option",
          {
            attrs: {
              value: `${preset.width}x${preset.height}`,
            },
          },
          preset.label,
        ),
      ),
    );

    this.widthInput = h("input", {
      attrs: {
        type: "number",
        min: "64",
        max: "2048",
        step: "1",
      },
    });

    this.heightInput = h("input", {
      attrs: {
        type: "number",
        min: "64",
        max: "2048",
        step: "1",
      },
    });

    this.layoutSelect = h(
      "select",
      {},
      h("option", { attrs: { value: "split" } }, "Split view"),
      h("option", { attrs: { value: "stack" } }, "Stacked"),
    );

    this.backgroundPicker = h("input", {
      attrs: {
        type: "color",
      },
    });

    this.alphaSlider = h("input", {
      attrs: {
        type: "range",
        min: "0",
        max: "100",
        value: "0",
        class: "alpha-slider",
      },
    });

    this.alphaLabel = h("span", {}, "Transparency 100%");
    this.antialiasToggle = h("input", {
      attrs: {
        type: "checkbox",
      },
    });
    this.antialiasLabel = h("span", {}, "Anti-aliasing");

    this.sizeSelect.addEventListener("change", () => this.#handlePreset());
    this.widthInput.addEventListener("change", () => this.#emitOptions());
    this.heightInput.addEventListener("change", () => this.#emitOptions());
    this.layoutSelect.addEventListener("change", () => {
      const value = this.layoutSelect.value;
      this.options.layout = value;
      this.onLayoutChange?.(value);
    });
    this.backgroundPicker.addEventListener("input", () => this.#emitOptions());
    this.alphaSlider.addEventListener("input", () => this.#emitOptions());
    this.antialiasToggle.addEventListener("change", () => this.#emitOptions());

    const sizeGroup = h(
      "div",
      { className: "form-control" },
      h("label", {}, "Canvas preset"),
      this.sizeSelect,
    );

    const widthGroup = h(
      "div",
      { className: "form-control" },
      h("label", {}, "Width (px)"),
      this.widthInput,
    );

    const heightGroup = h(
      "div",
      { className: "form-control" },
      h("label", {}, "Height (px)"),
      this.heightInput,
    );

    const layoutGroup = h(
      "div",
      { className: "form-control" },
      h("label", {}, "Layout"),
      this.layoutSelect,
    );

    const backgroundGroup = h(
      "div",
      { className: "form-control" },
      h("label", {}, "Background"),
      this.backgroundPicker,
      this.alphaSlider,
      this.alphaLabel,
    );

    const aaGroup = h(
      "div",
      { className: "form-control toggle-control" },
      h("label", {}, "Anti-aliasing"),
      h("label", { className: "toggle" }, this.antialiasToggle, this.antialiasLabel),
    );

    return h(
      "section",
      { className: "panel options-panel fade-in" },
      h("div", { className: "glow" }),
      h("h2", {}, "Options"),
      h(
        "div",
        { className: "options-grid" },
        sizeGroup,
        widthGroup,
        heightGroup,
        layoutGroup,
        backgroundGroup,
        aaGroup,
      ),
    );
  }

  #hydrate() {
    const { width, height, layout, backgroundHex, backgroundAlpha, antialias } = this.options;
    this.widthInput.value = width;
    this.heightInput.value = height;
    this.layoutSelect.value = layout;
    this.backgroundPicker.value = backgroundHex;
    this.alphaSlider.value = Math.round(backgroundAlpha * 100);
    this.antialiasToggle.checked = Boolean(antialias);
    this.#updateAlphaLabel();

    const presetMatch = SIZE_PRESETS.find((preset) => preset.width === width && preset.height === height);
    if (presetMatch) {
      this.sizeSelect.value = `${presetMatch.width}x${presetMatch.height}`;
    } else {
      this.sizeSelect.value = "";
    }
  }

  #handlePreset() {
    const value = this.sizeSelect.value;
    if (!value) return;
    const [width, height] = value.split("x").map((v) => parseInt(v, 10));
    this.widthInput.value = width;
    this.heightInput.value = height;
    this.#emitOptions();
  }

  #emitOptions() {
    const width = Math.max(64, Math.min(2048, parseInt(this.widthInput.value, 10) || this.options.width));
    const height = Math.max(64, Math.min(2048, parseInt(this.heightInput.value, 10) || this.options.height));
    const backgroundHex = this.backgroundPicker.value || "#000000";
    const backgroundAlpha = (parseInt(this.alphaSlider.value, 10) || 0) / 100;
    const antialias = this.antialiasToggle.checked;
    this.options = { ...this.options, width, height, backgroundHex, backgroundAlpha, antialias };
    this.#updateAlphaLabel();
    this.onOptionsChange?.(this.options);
  }

  #updateAlphaLabel() {
    this.alphaLabel.textContent = `Transparency ${100 - Math.round(this.options.backgroundAlpha * 100)}%`;
  }
}

