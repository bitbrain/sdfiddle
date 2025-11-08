import { h } from "../utils/dom.js";

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
      this.exportButton,
      this.status,
    );
  }

  async #downloadPng() {
    this.#setStatus("Preparing export...");
    try {
      const blob = await this.snapshotProvider();
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
    }
  }

  #setStatus(message, mode = "info") {
    this.status.textContent = message;
    this.status.dataset.mode = mode;
  }
}

