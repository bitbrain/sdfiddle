import { h } from "../utils/dom.js";

const DEMO_SELECT_ID = "demo-select";

export class HeaderBar {
  constructor({ demos = [], initialDemoId, onDemoChange } = {}) {
    this.demos = demos;
    this.initialDemoId = initialDemoId ?? "";
    this.onDemoChange = onDemoChange;
    this.root = this.#build();
  }

  get element() {
    return this.root;
  }

  setSelectedDemo(demoId) {
    if (!this.select) return;
    const targetValue = demoId ?? "";
    this.select.value = targetValue;
  }

  #build() {
    const contents = [this.#logo()];
    const picker = this.#demoPicker();
    if (picker) contents.push(picker);
    return h("header", { className: "site-header fade-in" }, contents);
  }

  #demoPicker() {
    if (!this.demos.length) {
      return null;
    }

    const options = [
      h("option", { attrs: { value: "" } }, "Custom shader"),
      ...this.demos.map((demo) => h("option", { attrs: { value: demo.id } }, demo.label)),
    ];

    this.select = h("select", { className: "demo-select", attrs: { id: DEMO_SELECT_ID } }, options);
    this.select.value = this.initialDemoId;
    this.select.addEventListener("change", (event) => {
      const value = event.target.value;
      this.onDemoChange?.(value || null);
    });

    const label = h("label", { className: "demo-label", attrs: { for: DEMO_SELECT_ID } }, "Demo");
    return h("div", { className: "demo-picker" }, label, this.select);
  }

  #logo() {
    return h("img", {
      className: "site-logo",
      attrs: {
        src: "logo.png",
        alt: "SDFiddle logo",
        decoding: "async",
      },
    });
  }
}

