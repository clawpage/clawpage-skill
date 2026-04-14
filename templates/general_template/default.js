(function bootClawpagesTemplate() {
  function isDarkTheme() {
    var bg = getComputedStyle(document.documentElement).getPropertyValue("--bg-0").trim();
    if (!bg) return false;
    var tmp = document.createElement("div");
    tmp.style.color = bg;
    document.body.appendChild(tmp);
    var rgb = getComputedStyle(tmp).color;
    document.body.removeChild(tmp);
    var m = rgb.match(/\d+/g);
    if (!m) return false;
    var luminance = (0.299 * Number(m[0]) + 0.587 * Number(m[1]) + 0.114 * Number(m[2])) / 255;
    return luminance < 0.5;
  }

  function renderMermaidBlocks() {
    if (!window.mermaid) return;
    var dark = isDarkTheme();
    mermaid.initialize({ startOnLoad: false, theme: dark ? "dark" : "default", securityLevel: "loose" });
    var blocks = document.querySelectorAll("pre[data-lang='mermaid'] code");
    blocks.forEach(function (codeEl) {
      var source = codeEl.textContent || "";
      var container = document.createElement("div");
      container.className = "mermaid";
      container.textContent = source;
      var pre = codeEl.closest("pre");
      if (!pre || !pre.parentNode) return;
      pre.parentNode.replaceChild(container, pre);
    });
    mermaid.run({ querySelector: ".mermaid" });
  }

  function renderMarkdownSnippets() {
    if (!window.marked || !window.DOMPurify) return;
    var nodes = document.querySelectorAll("[data-md]");
    nodes.forEach(function (node) {
      var md = node.getAttribute("data-md") || "";
      var html = marked.parse(md);
      node.innerHTML = DOMPurify.sanitize(html);
    });
  }

  function startClock() {
    var nodes = document.querySelectorAll("[data-clock]");
    if (nodes.length === 0) return;

    function tick() {
      var now = new Date();
      var value = now.toLocaleTimeString("zh-CN", { hour12: false });
      nodes.forEach(function (node) {
        node.textContent = value;
      });
    }

    tick();
    setInterval(tick, 1000);
  }

  function closeZoomOverlay() {
    var overlay = document.querySelector(".claw-zoom-overlay");
    if (overlay) overlay.remove();
  }

  function initChartZoom() {
    document.addEventListener("click", function (e) {
      var target = e.target.closest(".mermaid");
      if (!target) return;
      var svg = target.querySelector("svg");
      if (!svg) return;
      e.stopPropagation();

      var overlay = document.createElement("div");
      overlay.className = "claw-zoom-overlay";
      var clone = svg.cloneNode(true);
      clone.style.maxWidth = "95vw";
      clone.style.maxHeight = "88vh";
      clone.style.width = "auto";
      clone.style.height = "auto";
      clone.removeAttribute("width");
      clone.removeAttribute("height");
      overlay.appendChild(clone);

      var closeBtn = document.createElement("button");
      closeBtn.className = "claw-zoom-close";
      closeBtn.setAttribute("aria-label", "Close");
      closeBtn.textContent = "\u00d7";
      overlay.appendChild(closeBtn);

      overlay.addEventListener("click", function (ev) {
        if (ev.target === overlay || ev.target === closeBtn) closeZoomOverlay();
      });
      document.body.appendChild(overlay);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeZoomOverlay();
    });
  }

  renderMarkdownSnippets();
  renderMermaidBlocks();
  startClock();
  initChartZoom();
})();
