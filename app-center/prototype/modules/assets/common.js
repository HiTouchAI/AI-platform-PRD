(function () {
  "use strict";

  function mountAppBar() {
    const target = document.querySelector("[data-appbar]");
    if (!target) return;
    target.innerHTML = `<header class="appbar"><div class="appbar-inner"><a class="brand-logo" href="index.html" aria-label="返回工作台">H</a><div class="brand-name">大旗财税AI</div><div class="user-avatar" title="Rita">R</div></div></header>`;
  }

  function toast(message, tone = "success") {
    document.querySelector(".toast")?.remove();
    const node = document.createElement("div");
    node.className = `toast ${tone}`;
    node.textContent = message;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 3200);
  }

  function safeReturn(value, fallback = "app-center.html") {
    const allowed = ["index.html", "app-center.html", "session.html", "renderer.html"];
    const file = String(value || "").split("?")[0];
    return allowed.includes(file) ? value : fallback;
  }

  mountAppBar();
  window.HiTouchUI = { mountAppBar, toast, safeReturn };
})();
