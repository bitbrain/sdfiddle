import { h } from "../utils/dom.js";

export class HeaderBar {
  constructor() {
    this.root = this.#build();
  }

  get element() {
    return this.root;
  }

  #build() {
    return h("header", { className: "site-header fade-in" }, this.#logo());
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

