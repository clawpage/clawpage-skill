(function utilityWorkbench() {
  var inputEl = document.getElementById("input-text");
  var modeEl = document.getElementById("mode");
  var outputEl = document.getElementById("output");
  var runBtn = document.getElementById("run-btn");
  var copyBtn = document.getElementById("copy-btn");

  function transform() {
    var value = inputEl.value || "";
    var mode = modeEl.value;

    if (mode === "trim") return value.trim();
    if (mode === "upper") return value.toUpperCase();
    if (mode === "lower") return value.toLowerCase();

    var chars = value.length;
    var words = value.trim() ? value.trim().split(/\s+/).length : 0;
    var lines = value ? value.split(/\n/).length : 0;
    return "chars: " + chars + "\nwords: " + words + "\nlines: " + lines;
  }

  runBtn.addEventListener("click", function() {
    outputEl.textContent = transform();
  });

  copyBtn.addEventListener("click", function() {
    var text = outputEl.textContent || "";
    if (!text) return;
    navigator.clipboard.writeText(text).then(function() {
      copyBtn.textContent = "[COPY_DONE]";
      setTimeout(function() {
        copyBtn.textContent = "[COPY_BUTTON]";
      }, 1000);
    });
  });
})();
