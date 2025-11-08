import { h } from "../utils/dom.js";

const MASTODON_URL = "https://mastodon.gamedev.place/@bitbraindev";

export class FooterBar {
  constructor() {
    this.root = this.#build();
  }

  get element() {
    return this.root;
  }

  #build() {
    const credits = h(
      "span",
      { className: "site-footer-credits" },
      "made with ♥ by ",
      h(
        "a",
        {
          className: "site-footer-link",
          attrs: {
            rel: "me",
            href: MASTODON_URL,
          },
        },
        "bitbrain",
      ),
    );

    return h("footer", { className: "site-footer fade-in" }, credits);
  }
}


