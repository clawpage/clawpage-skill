(function insightHub() {
  var state = { tag: "all", q: "" };

  var items = [
    { tag: "product", title: "__I18N_TEXT_0128__,__I18N_TEXT_0129__", note: "__I18N_TEXT_0130__ 1 __I18N_TEXT_0131__." },
    { tag: "growth", title: "__I18N_TEXT_0132__", note: "__I18N_TEXT_0133__ 20:00-22:00 __I18N_TEXT_0134__." },
    { tag: "ops", title: "FAQ __I18N_TEXT_0135__", note: "__I18N_TEXT_0136__." },
    { tag: "product", title: "__I18N_TEXT_0137__,__I18N_TEXT_0138__", note: "__I18N_TEXT_0139__ 3 __I18N_TEXT_0140__." },
  ];

  var searchInput = document.getElementById("search-input");
  var listEl = document.getElementById("card-list");
  var chips = document.querySelectorAll("[data-tag]");

  function render() {
    var q = state.q.trim().toLowerCase();
    var visible = items.filter(function(item) {
      var matchTag = state.tag === "all" || item.tag === state.tag;
      var text = (item.title + " " + item.note).toLowerCase();
      var matchQ = !q || text.indexOf(q) >= 0;
      return matchTag && matchQ;
    });

    listEl.innerHTML = visible.map(function(item) {
      return '<article class="card"><h3>' + item.title + '</h3><p>' + item.note + "</p></article>";
    }).join("");

    if (visible.length === 0) {
      listEl.innerHTML = '<article class="card"><p>__I18N_TEXT_0141__ / No matching insight.</p></article>';
    }
  }

  chips.forEach(function(chip) {
    chip.addEventListener("click", function() {
      state.tag = chip.getAttribute("data-tag") || "all";
      chips.forEach(function(btn) { btn.classList.remove("active"); });
      chip.classList.add("active");
      render();
    });
  });

  searchInput.addEventListener("input", function() {
    state.q = searchInput.value || "";
    render();
  });

  render();
})();
