// --- DOM queries from html file ---
const toggle = document.querySelector(".toggle-btn");
const stopwatchDisplay = document.querySelector(".stopwatch-display");
const startStopBtn = document.querySelector(".start-stop-btn");
const resetBtn = document.querySelector(".reset-btn");
const aboutTrigger = document.querySelector(".about-section");
const aboutPage = document.querySelector(".about-page");

// --- Toggle button (visual only) ---
if (toggle) {
  toggle.addEventListener("click", () => {
    const isOn = toggle.classList.toggle("is-on");
    toggle.setAttribute("aria-checked", isOn);
  });
  // keyboard: toggle with Space or Enter
  toggle.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Spacebar" || e.key === "Enter") {
      e.preventDefault();
      toggle.click();
    }
  });
}

if (aboutTrigger && aboutPage) {
  // helper to set visible/hidden
  function setAboutVisible(visible) {
    if (visible) {
      aboutPage.style.display = "block"; // or "" to let CSS control it if you add a class
      aboutTrigger.setAttribute("aria-expanded", "true");
    } else {
      aboutPage.style.display = "none";
      aboutTrigger.setAttribute("aria-expanded", "false");
    }
  }

  // initialize ARIA and state
  aboutTrigger.setAttribute("role", "button"); // make it explicit it's interactive
  aboutTrigger.setAttribute("tabindex", "0");
  aboutTrigger.setAttribute(
    "aria-expanded",
    aboutPage.style.display !== "none"
  );

  // toggle on click
  aboutTrigger.addEventListener("click", () => {
    const isHidden = getComputedStyle(aboutPage).display === "none";
    setAboutVisible(isHidden);
  });

  // keyboard activation (Enter / Space)
  aboutTrigger.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      aboutTrigger.click();
    }
  });
}

// --- Stopwatch implementation ---
// State
let startTime = 0; // timestamp when started (to use performance.now() to avoid time drift)
let elapsedBefore = 0; // accumulated elapsed time when paused (ms)
let rafId = null; // requestAnimationFrame id
let running = false;

// Format milliseconds into MM:SS:mmm (minutes:seconds:milliseconds)
function formatTime(ms) {
  const totalMs = Math.max(0, Math.floor(ms));
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const milliseconds = totalMs % 1000;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  const mmm = String(milliseconds).padStart(3, "0");
  return `${mm}:${ss}:${mmm}`;
}

// Update display (called on every animation frame while running)
function update() {
  const now = performance.now();
  const elapsed = elapsedBefore + (now - startTime);
  if (stopwatchDisplay) stopwatchDisplay.textContent = formatTime(elapsed);
  rafId = requestAnimationFrame(update);
}

function start() {
  if (running) return;
  startTime = performance.now();
  running = true;
  // disable reset while running
  if (resetBtn) resetBtn.disabled = true;
  // change button text to 'Stop'
  if (startStopBtn) startStopBtn.textContent = "Stop";
  rafId = requestAnimationFrame(update);
}

function stop() {
  if (!running) return;
  running = false;
  // accumulate elapsed
  const now = performance.now();
  elapsedBefore += now - startTime;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  // enable reset when stopped/paused
  if (resetBtn) resetBtn.disabled = false;
  // change button text to 'Resume'
  if (startStopBtn) startStopBtn.textContent = "Resume";
}

function reset() {
  // Only allow reset when not running
  if (running) return;
  elapsedBefore = 0;
  startTime = 0;
  if (stopwatchDisplay) stopwatchDisplay.textContent = formatTime(0);
  // reset start button text
  if (startStopBtn) startStopBtn.textContent = "Start";
  // disable reset since time is zero
  if (resetBtn) resetBtn.disabled = true;
}

// Initialize display and reset button state
if (stopwatchDisplay) stopwatchDisplay.textContent = formatTime(0);
if (resetBtn) resetBtn.disabled = true;

// Wire up control handlers
if (startStopBtn) {
  startStopBtn.addEventListener("click", () => {
    // If not started yet or currently paused (button shows 'Start' or 'Resume') -> start
    const label = startStopBtn.textContent.trim().toLowerCase();
    if (!running && (label === "start" || label === "resume")) {
      start();
      return;
    }
    // If running -> stop
    if (running) {
      stop();
      return;
    }
  });
}

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    reset();
  });
}

// expose small API for console/debug (optional)
window.__stopwatch = { start, stop, reset };
