import { h } from "../utils/dom.js";

const SUPER_SAMPLING_PRESETS = [
  {
    id: "balanced",
    label: "Balanced (max 12 samples)",
    config: { maxSamples: 12, minSamples: 4, threshold: 0.005 },
  },
  {
    id: "detailed",
    label: "Detailed (max 18 samples)",
    config: { maxSamples: 18, minSamples: 5, threshold: 0.0035 },
  },
  {
    id: "ultra",
    label: "Ultra (max 24 samples)",
    config: { maxSamples: 24, minSamples: 6, threshold: 0.002 },
  },
];

const DEFAULT_SUPER_SAMPLING_PRESET = SUPER_SAMPLING_PRESETS[0].id;

export class ExportPanel {
  constructor() {
    this.snapshotProvider = null;
    this.root = this.#build();
  }

  get element() {
    return this.root;
  }

  setSnapshotProvider(provider) {
    this.snapshotProvider = provider;
  }

  #build() {
    this.exportButton = h(
      "button",
      { className: "button-primary" },
      "Download PNG",
    );
    this.status = h("div", { className: "export-status" }, " ");

    this.superSampleToggle = h("input", {
      attrs: {
        type: "checkbox",
      },
    });
    this.superSampleLabel = h("span", {}, "High fidelity export");
    this.superSampleToggle.addEventListener("change", () => this.#handleSuperSamplingToggle());

    this.superSampleQuality = h(
      "select",
      {},
      ...SUPER_SAMPLING_PRESETS.map((preset) =>
        h(
          "option",
          {
            attrs: { value: preset.id },
          },
          preset.label,
        ),
      ),
    );
    this.superSampleQuality.value = DEFAULT_SUPER_SAMPLING_PRESET;
    this.superSampleQuality.disabled = true;

    this.superSampleHint = h(
      "span",
      { className: "help-text" },
      "Adds adaptive passes for crisper edges. Balanced is quickest; Ultra is slowest.",
    );
    this.superSampleHint.dataset.disabled = "true";

    const superSampleToggleGroup = h(
      "div",
      { className: "form-control toggle-control" },
      h("label", {}, "Adaptive super sampling"),
      h("label", { className: "toggle" }, this.superSampleToggle, this.superSampleLabel),
    );

    const superSampleQualityGroup = h(
      "div",
      { className: "form-control" },
      h("label", {}, "Quality preset"),
      this.superSampleQuality,
      this.superSampleHint,
    );

    this.superSampleSection = h("div", { className: "export-options" }, superSampleToggleGroup, superSampleQualityGroup);

    this.exportButton.addEventListener("click", () => {
      if (!this.snapshotProvider) {
        this.#setStatus("Preview not ready.", "error");
        return;
      }
      this.#downloadPng();
    });

    return h(
      "section",
      { className: "panel export-panel fade-in" },
      h("div", { className: "glow" }),
      h("h2", {}, "Export"),
      this.superSampleSection,
      this.exportButton,
      this.status,
    );
  }

  async #downloadPng() {
    if (!this.snapshotProvider) {
      this.#setStatus("Preview not ready.", "error");
      return;
    }

    if (this.exportButton) {
      this.exportButton.disabled = true;
    }

    this.#setStatus("Preparing export…");

    try {
      const exportOptions = this.#collectExportOptions();
      const blob = await this.snapshotProvider({
        ...exportOptions,
        onProgress: (info) => this.#handleProgress(info),
      });

      if (!blob) {
        this.#setStatus("Unable to export PNG.", "error");
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "sdfiddle.png";
      link.click();
      URL.revokeObjectURL(url);
      this.#setStatus("Exported as sdfiddle.png", "ok");
    } catch (error) {
      this.#setStatus("Export failed.", "error");
      console.error("PNG export error:", error);
    } finally {
      if (this.exportButton) {
        this.exportButton.disabled = false;
      }
    }
  }

  #handleSuperSamplingToggle() {
    if (!this.superSampleQuality) return;
    const enabled = this.superSampleToggle?.checked ?? false;
    this.superSampleQuality.disabled = !enabled;
    if (this.superSampleHint) {
      this.superSampleHint.dataset.disabled = enabled ? "false" : "true";
    }
    if (!this.exportButton?.disabled) {
      this.#setStatus(
        enabled ? "Adaptive super sampling enabled. Exports may take longer." : "Adaptive super sampling off.",
        "info",
      );
    }
  }

  #collectExportOptions() {
    if (!this.superSampleToggle?.checked) {
      return {};
    }
    const presetId = this.superSampleQuality?.value ?? DEFAULT_SUPER_SAMPLING_PRESET;
    const preset = SUPER_SAMPLING_PRESETS.find((option) => option.id === presetId) ?? SUPER_SAMPLING_PRESETS[0];
    return {
      superSampling: {
        mode: "adaptive",
        ...preset.config,
      },
    };
  }

  #handleProgress(info) {
    if (!info) return;
    const { stage, message, sample, total } = info;
    let text = message;
    if (!text && stage === "sampling" && typeof sample === "number" && typeof total === "number") {
      text = `Adaptive super sampling ${sample}/${total}`;
    }
    if (!text && stage === "finalize") {
      text = "Finalizing export…";
    }
    if (!text && stage === "start") {
      text = "Adaptive super sampling…";
    }
    if (!text) {
      return;
    }
    const mode = stage === "complete" ? "ok" : stage === "error" ? "error" : "info";
    this.#setStatus(text, mode);
  }

  #setStatus(message, mode = "info") {
    this.status.textContent = message;
    this.status.dataset.mode = mode;
  }
}

