(function stockTerminal() {
  var chartNode = document.getElementById("chart");
  if (!chartNode || !window.echarts) return;

  var chart = echarts.init(chartNode);
  var priceEl = document.getElementById("price-value");
  var changeEl = document.getElementById("change-value");
  var buttons = document.querySelectorAll("[data-range]");

  function buildData(days) {
    var labels = [];
    var values = [];
    var base = 100;
    for (var i = 0; i < days; i += 1) {
      base += (Math.random() - 0.48) * 2;
      labels.push(String(i + 1));
      values.push(Number(base.toFixed(2)));
    }
    return { labels: labels, values: values };
  }

  function render(days) {
    var data = buildData(days);
    var first = data.values[0];
    var last = data.values[data.values.length - 1];
    var diff = Number((last - first).toFixed(2));

    priceEl.textContent = last.toFixed(2);
    changeEl.textContent = (diff >= 0 ? "+" : "") + diff.toFixed(2);
    changeEl.style.color = diff >= 0 ? "#22c55e" : "#ef4444";

    chart.setOption({
      grid: { top: 20, right: 10, bottom: 20, left: 34 },
      xAxis: { type: "category", data: data.labels, axisLabel: { color: "#94a3b8" } },
      yAxis: { type: "value", axisLabel: { color: "#94a3b8" }, splitLine: { lineStyle: { color: "#1e293b" } } },
      series: [{ type: "line", data: data.values, smooth: true, symbol: "none", lineStyle: { width: 2, color: "#38bdf8" } }],
      tooltip: { trigger: "axis" },
    });
  }

  buttons.forEach(function(btn) {
    btn.addEventListener("click", function() {
      buttons.forEach(function(item) { item.classList.remove("active"); });
      btn.classList.add("active");
      render(Number(btn.getAttribute("data-range")) || 7);
    });
  });

  render(7);
  window.addEventListener("resize", function() { chart.resize(); });
})();
