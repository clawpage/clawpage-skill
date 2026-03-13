(function conceptAnimationLab() {
  var steps = [
    { title: "[STEP] 1 / [INPUT]", desc: "[STEP_INPUT_DESC_A], [STEP_INPUT_DESC_B].", mode: "input" },
    { title: "[STEP] 2 / [TRANSFORM]", desc: "[STEP_TRANSFORM_DESC].", mode: "transform" },
    { title: "[STEP] 3 / [OUTPUT]", desc: "[STEP_OUTPUT_DESC].", mode: "output" },
  ];

  var index = 0;
  var titleEl = document.getElementById("step-title");
  var descEl = document.getElementById("step-desc");
  var prevBtn = document.getElementById("prev-btn");
  var nextBtn = document.getElementById("next-btn");
  var a = document.getElementById("node-a");
  var b = document.getElementById("node-b");
  var c = document.getElementById("node-c");

  function animate(mode) {
    if (!window.gsap) return;
    gsap.killTweensOf([a, b, c]);
    gsap.set([a, b, c], { scale: 1, opacity: 0.45 });

    if (mode === "input") gsap.to(a, { scale: 1.15, opacity: 1, duration: 0.28 });
    if (mode === "transform") gsap.to(b, { scale: 1.15, opacity: 1, duration: 0.28 });
    if (mode === "output") gsap.to(c, { scale: 1.15, opacity: 1, duration: 0.28 });
  }

  function render() {
    var step = steps[index];
    titleEl.textContent = step.title;
    descEl.textContent = step.desc;
    animate(step.mode);
  }

  prevBtn.addEventListener("click", function() {
    index = (index - 1 + steps.length) % steps.length;
    render();
  });

  nextBtn.addEventListener("click", function() {
    index = (index + 1) % steps.length;
    render();
  });

  render();
})();
