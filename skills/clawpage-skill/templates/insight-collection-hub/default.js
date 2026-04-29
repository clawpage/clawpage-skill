(function insightHub() {
  var state = { tag: "all", q: "" };

  var items = [
    { tag: "product", title: "[INSIGHT_TITLE_1A], [INSIGHT_TITLE_1B]", note: "[INSIGHT_NOTE_1_PREFIX] 1 [INSIGHT_NOTE_1_SUFFIX]." },
    { tag: "growth", title: "[INSIGHT_TITLE_2]", note: "[INSIGHT_NOTE_2_PREFIX] 20:00-22:00 [INSIGHT_NOTE_2_SUFFIX]." },
    { tag: "ops", title: "FAQ [INSIGHT_TITLE_3]", note: "[INSIGHT_NOTE_3]." },
    { tag: "product", title: "[INSIGHT_TITLE_4A], [INSIGHT_TITLE_4B]", note: "[INSIGHT_NOTE_4_PREFIX] 3 [INSIGHT_NOTE_4_SUFFIX]." },
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
      listEl.innerHTML = '<article class="card"><p>[NO_MATCHING_INSIGHT]</p></article>';
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
