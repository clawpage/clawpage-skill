(function miniTapGame() {
  var score = 0;
  var seconds = 20;
  var timer = null;
  var running = false;

  var scoreEl = document.getElementById("score");
  var timeEl = document.getElementById("time");
  var tapBtn = document.getElementById("tap-btn");
  var startBtn = document.getElementById("start-btn");
  var resetBtn = document.getElementById("reset-btn");

  function render() {
    scoreEl.textContent = String(score);
    timeEl.textContent = String(seconds);
    tapBtn.disabled = !running;
  }

  function stop() {
    running = false;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    render();
  }

  function start() {
    if (running) return;
    score = 0;
    seconds = 20;
    running = true;
    render();

    timer = setInterval(function() {
      seconds -= 1;
      if (seconds <= 0) {
        seconds = 0;
        stop();
        alert("[GAME_OVER] [SCORE_LABEL]: " + score);
      }
      render();
    }, 1000);
  }

  startBtn.addEventListener("click", start);
  resetBtn.addEventListener("click", function() {
    score = 0;
    seconds = 20;
    stop();
    render();
  });
  tapBtn.addEventListener("click", function() {
    if (!running) return;
    score += 1;
    render();
  });

  render();
})();
