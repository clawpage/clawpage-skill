(function bootClawpagesTemplate() {
  function renderMermaidBlocks() {
    if (!window.mermaid) return;
    mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "loose" });
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

  renderMarkdownSnippets();
  renderMermaidBlocks();
  startClock();
})();
