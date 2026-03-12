(function insightHub() {
  var state = { tag: "all", q: "" };

  var items = [
    { tag: "product", title: "功能上线后，首日引导最关键", note: "新功能说明应放在入口 1 屏内。" },
    { tag: "growth", title: "转化高峰出现在晚间", note: "重点活动建议 20:00-22:00 推送。" },
    { tag: "ops", title: "FAQ 置顶可减少重复咨询", note: "标准化问题优先卡片化。" },
    { tag: "product", title: "选项越少，完成率越高", note: "移动端每步不超过 3 个决策项。" },
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
      listEl.innerHTML = '<article class="card"><p>暂无匹配结果 / No matching insight.</p></article>';
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
