export function createElement(tag, { className, attrs, text, html } = {}) {
  const el = document.createElement(tag);
  if (className) {
    el.className = className;
  }

  if (attrs) {
    Object.entries(attrs).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      el.setAttribute(key, value);
    });
  }

  if (text !== undefined) {
    el.textContent = text;
  }

  if (html !== undefined) {
    el.innerHTML = html;
  }

  return el;
}

export function clearChildren(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

export function h(tag, options = {}, ...children) {
  const el = createElement(tag, options);
  children.flat().forEach((child) => {
    if (child === null || child === undefined) return;
    if (typeof child === "string") {
      el.appendChild(document.createTextNode(child));
    } else {
      el.appendChild(child);
    }
  });
  return el;
}

