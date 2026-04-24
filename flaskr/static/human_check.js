// ─────────────────────────────────────────────
//  human_check.js
//  All logic for the Human Verification quiz.
//  Sections:
//    1. State & config
//    2. Progress bar
//    3. Logging & flags
//    4. Timer bars
//    5. Status messages
//    6. Modal
//    7. Suspicious flash
//    8. Question routing
//    9. Q1 — Moving checkbox
//   10. Q2 — CAPTCHA grid
//   11. Q3 — Cat fingers
//   12. Q4 — Pain slider
//   13. Q5 — Logic puzzle
//   14. Final screen
//   15. Boot
// ─────────────────────────────────────────────
 
 
// ── 1. State & config ─────────────────────────
 
const TOTAL_QUESTIONS = 5;
// Each question adds this much progress per cycle
const PROGRESS_PER_Q = { 1: 8, 2: 16, 3: 24, 4: 32, 5: 40 };
 
let currentQ         = 1;
let progressVal      = 0;
let flagCount        = 0;
let sessionLog       = [];
let modalCallback    = null;
let progressInterval = null;
const timerIntervals = {};
 
 
// ── 2. Progress bar ───────────────────────────
 
function setProgress(val) {
  progressVal = Math.max(0, Math.min(100, val));
  document.getElementById('progress-fill').style.width = progressVal + '%';
  document.getElementById('progress-pct').textContent  = Math.round(progressVal) + '%';
}
 
function startProgressWobble() {
  clearInterval(progressInterval);
  progressInterval = setInterval(() => {
    if (Math.random() < 0.3) {
      setProgress(progressVal - (Math.random() * 10 + 3));
    }
  }, 3500);
}
 
 
// ── 3. Logging & flags ────────────────────────
 
function log(msg, type = 'info') {
  sessionLog.push({ msg, type, time: new Date().toLocaleTimeString() });
}
 
function addFlag(msg) {
  flagCount++;
  log('[FLAG] ' + msg, 'danger');
}
 
 
// ── 4. Timer bars ─────────────────────────────
 
function startTimerBar(id, duration, onExpire) {
  clearTimerBar(id);
  const fill = document.getElementById(id);
  if (!fill) return;
  fill.style.width = '100%';
  const start = Date.now();
  timerIntervals[id] = setInterval(() => {
    const elapsed = Date.now() - start;
    const pct = Math.max(0, 100 - (elapsed / duration * 100));
    fill.style.width      = pct + '%';
    fill.style.background = pct < 25 ? '#cc2200' : '#e67e00';
    if (elapsed >= duration) { clearTimerBar(id); onExpire(); }
  }, 50);
}
 
function clearTimerBar(id) {
  if (timerIntervals[id]) { clearInterval(timerIntervals[id]); delete timerIntervals[id]; }
}
 
 
// ── 5. Status messages ────────────────────────
 
function showStatus(id, type, msg) {
  const el = document.getElementById(id);
  // Map internal type to Bootstrap alert class
  const bsClass = type === 'danger' ? 'alert-danger' : type === 'warn' ? 'alert-warning' : 'alert-info';
  el.className   = 'alert ' + bsClass + ' py-2 mt-3';
  el.textContent = msg;
  el.classList.remove('d-none');
}
 
function hideStatus(id) {
  const el = document.getElementById(id);
  el.classList.add('d-none');
  el.textContent = '';
}
 
 
// ── 6. Modal ──────────────────────────────────
 
const SURE_MESSAGES = [
  'Are you sure? This action has been noted.',
  'Please confirm. Hesitation is suspicious.',
  'Are you certain? Most humans are not.',
  'Confirm you wish to proceed. This will be recorded.',
  'Are you sure? Your response time is being monitored.',
];
 
let bsModal = null;
 
function showModal(msg, cb) {
  document.getElementById('sure-modal-body').textContent = msg;
  modalCallback = cb;
  if (!bsModal) bsModal = new bootstrap.Modal(document.getElementById('sure-modal'), { backdrop: 'static', keyboard: false });
  bsModal.show();
}
 
function closeModal(confirmed) {
  bsModal.hide();
  if (modalCallback) modalCallback(confirmed);
  modalCallback = null;
}
 
// Random "are you sure?" on ~18% of clicks
document.addEventListener('click', (e) => {
  if (e.target.closest('#sure-modal')) return;
  if (Math.random() < 0.18) {
    e.stopImmediatePropagation();
    e.preventDefault();
    showModal(SURE_MESSAGES[Math.floor(Math.random() * SURE_MESSAGES.length)], (yes) => {
      if (!yes) addFlag('User cancelled action — possible avoidance behaviour');
    });
  }
}, true);
 
 
// ── 7. Suspicious flash ───────────────────────
 
function flashSuspicious() {
  const el = document.getElementById('suspicious-overlay');
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 1800);
  addFlag('Suspicious interaction pattern detected');
}
 
 
// ── 8. Question routing ───────────────────────
 
function resetQ(qid, msg) {
  addFlag(msg);
  const banner = document.getElementById(qid + '-reset-banner');
  banner.textContent = '⚠ ' + msg;
  banner.classList.remove('d-none');
  setTimeout(() => { banner.classList.add('d-none'); initCurrentQ(); }, 2400);
}
 
function advanceQ(from) {
  setProgress(progressVal + PROGRESS_PER_Q[from]);
  flashSuspicious();
  setTimeout(() => {
    showModal('Suspicious activity detected. Please re-verify before continuing.', () => {
      if (progressVal >= 100) {
        showFinal();
        return;
      }
 
      document.getElementById('q' + from + '-card').classList.add('d-none');
      currentQ = from + 1;
 
      if (currentQ <= TOTAL_QUESTIONS) {
        document.getElementById('q' + currentQ + '-card').classList.remove('d-none');
        initCurrentQ();
      } else {
        currentQ = 1;
        showModal('Verification incomplete. Please restart the sequence.', () => {
          document.getElementById('q' + TOTAL_QUESTIONS + '-card').classList.add('d-none');
          document.getElementById('q1-card').classList.remove('d-none');
          initCurrentQ();
        });
      }
    });
  }, 600);
}
 
function initCurrentQ() {
  const fns = { 1: initQ1, 2: initQ2, 3: initQ3, 4: initQ4, 5: initQ5 };
  if (fns[currentQ]) fns[currentQ]();
}
 
 
// ── 9. Q1 — Moving checkbox ───────────────────
 
let q1StartTime = null;
 
function initQ1() {
  q1StartTime = null;
  hideStatus('q1-status');
 
  // Clone to remove stale listeners on reset
  const old = document.getElementById('moving-checkbox');
  const cb  = old.cloneNode(true);
  cb.checked         = false;
  cb.style.left      = '16px';
  cb.style.top       = '50%';
  cb.style.transform = 'translateY(-50%)';
  old.parentNode.replaceChild(cb, old);
 
  cb.addEventListener('mouseover', onCheckboxHover);
  cb.addEventListener('change',    onCheckboxChange);
 
  startTimerBar('q1-timer', 18000, () =>
    resetQ('q1', 'Response time exceeded. Session reset for security.')
  );
}
 
function onCheckboxHover() {
  if (!q1StartTime) q1StartTime = Date.now();
  const area = document.getElementById('checkbox-area');
  const cb   = document.getElementById('moving-checkbox');
  cb.style.transform = 'none';
  cb.style.left = (Math.random() * (area.offsetWidth  - 28) + 4) + 'px';
  cb.style.top  = (Math.random() * (area.offsetHeight - 28) + 4) + 'px';
}
 
function onCheckboxChange() {
  if (!q1StartTime) return;
  if (Date.now() - q1StartTime < 1800) {
    resetQ('q1', 'Response was too fast. Automated behaviour detected.');
    return;
  }
  clearTimerBar('q1-timer');
  advanceQ(1);
}
 
 
// ── 10. Q2 — CAPTCHA grid ─────────────────────
 
const TILE_TYPES = ['cat', 'hydrant', 'toilet', 'stickfigure'];
 
const TILE_SVG = {
  cat: `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="34" r="16" fill="#ccc" stroke="#aaa" stroke-width="1.5"/>
    <circle cx="30" cy="30" r="13" fill="#ddd"/>
    <polygon points="14,20 20,8 26,20" fill="#ccc" stroke="#aaa" stroke-width="1"/>
    <polygon points="34,20 40,8 46,20" fill="#ccc" stroke="#aaa" stroke-width="1"/>
    <circle cx="25" cy="30" r="2.5" fill="#555"/>
    <circle cx="35" cy="30" r="2.5" fill="#555"/>
    <circle cx="26" cy="29" r="1"   fill="#fff"/>
    <circle cx="36" cy="29" r="1"   fill="#fff"/>
    <ellipse cx="30" cy="35" rx="3" ry="2" fill="#e8a0a0"/>
    <line x1="18" y1="34" x2="10" y2="31" stroke="#aaa" stroke-width="1"/>
    <line x1="18" y1="36" x2="10" y2="36" stroke="#aaa" stroke-width="1"/>
    <line x1="42" y1="34" x2="50" y2="31" stroke="#aaa" stroke-width="1"/>
    <line x1="42" y1="36" x2="50" y2="36" stroke="#aaa" stroke-width="1"/>
  </svg>`,
  hydrant: `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
    <rect x="22" y="42" width="16" height="8"  rx="2" fill="#e05" stroke="#c04" stroke-width="1.5"/>
    <rect x="18" y="30" width="24" height="16" rx="3" fill="#f16" stroke="#c04" stroke-width="1.5"/>
    <ellipse cx="30" cy="30" rx="12" ry="5" fill="#e05" stroke="#c04" stroke-width="1.5"/>
    <rect x="24" y="20" width="12" height="12" rx="2" fill="#f16" stroke="#c04" stroke-width="1.5"/>
    <ellipse cx="30" cy="20" rx="7" ry="4" fill="#e05" stroke="#c04" stroke-width="1.5"/>
    <rect x="10" y="34" width="8" height="5" rx="2" fill="#e05" stroke="#c04" stroke-width="1"/>
    <rect x="42" y="34" width="8" height="5" rx="2" fill="#e05" stroke="#c04" stroke-width="1"/>
    <circle cx="30" cy="37" r="3" fill="#c04"/>
  </svg>`,
  toilet: `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="8"  width="24" height="10" rx="3" fill="#ddd" stroke="#bbb" stroke-width="1.5"/>
    <rect x="16" y="16" width="28" height="6"  rx="2" fill="#eee" stroke="#bbb" stroke-width="1.5"/>
    <ellipse cx="30" cy="40" rx="18" ry="14" fill="#f5f5f5" stroke="#bbb" stroke-width="1.5"/>
    <ellipse cx="30" cy="40" rx="13" ry="10" fill="#e8e8e8" stroke="#bbb" stroke-width="1"/>
    <ellipse cx="30" cy="40" rx="8"  ry="6"  fill="#ccc"/>
    <rect x="27" y="52" width="6" height="6" rx="1" fill="#ddd" stroke="#bbb" stroke-width="1"/>
  </svg>`,
  stickfigure: `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="12" r="7" fill="none" stroke="#888" stroke-width="2"/>
    <line x1="30" y1="19" x2="30" y2="38" stroke="#888" stroke-width="2"/>
    <line x1="30" y1="26" x2="18" y2="32" stroke="#888" stroke-width="2"/>
    <line x1="30" y1="26" x2="42" y2="32" stroke="#888" stroke-width="2"/>
    <line x1="30" y1="38" x2="20" y2="52" stroke="#888" stroke-width="2"/>
    <line x1="30" y1="38" x2="40" y2="52" stroke="#888" stroke-width="2"/>
  </svg>`,
  bicycle: `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
    <circle cx="15" cy="40" r="10" fill="none" stroke="#555" stroke-width="2.5"/>
    <circle cx="45" cy="40" r="10" fill="none" stroke="#555" stroke-width="2.5"/>
    <circle cx="15" cy="40" r="2"  fill="#555"/>
    <circle cx="45" cy="40" r="2"  fill="#555"/>
    <line x1="15" y1="40" x2="28" y2="22" stroke="#555" stroke-width="2"/>
    <line x1="28" y1="22" x2="45" y2="40" stroke="#555" stroke-width="2"/>
    <line x1="28" y1="22" x2="22" y2="22" stroke="#555" stroke-width="2"/>
    <line x1="28" y1="22" x2="34" y2="22" stroke="#555" stroke-width="2"/>
    <line x1="22" y1="22" x2="18" y2="28" stroke="#555" stroke-width="1.5"/>
    <line x1="34" y1="22" x2="38" y2="28" stroke="#555" stroke-width="1.5"/>
    <ellipse cx="31" cy="20" rx="4" ry="2" fill="none" stroke="#555" stroke-width="1.5"/>
  </svg>`
};
 
let captchaSubmits = 0;
let captchaRows   = 3;
let bicycleIndex  = -1;
 
function initQ2() {
  hideStatus('q2-status');
  captchaSubmits = 0;
  captchaRows    = 3;
  bicycleIndex   = -1;
  document.getElementById('floating-bicycle').style.display = 'none';
  moveVerifyButton();
  renderGrid();
  startTimerBar('q2-timer', 22000, () =>
    resetQ('q2', 'Verification timed out. Please complete the CAPTCHA again.')
  );
}
 
function moveVerifyButton() {
  const btn  = document.getElementById('captcha-submit');
  const card = document.getElementById('q2-card');
  const cardW = card.offsetWidth  || 560;
  const cardH = card.offsetHeight || 420;
  const btnW  = 80;
  const btnH  = 36;
  const padding = 12;
  const x = Math.floor(Math.random() * (cardW - btnW - padding * 2)) + padding;
  const y = Math.floor(Math.random() * (cardH - btnH - padding * 2)) + padding;
  btn.style.left   = x + 'px';
  btn.style.top    = y + 'px';
  btn.style.bottom = 'auto';
  btn.style.right  = 'auto';
}
 
function showFloatingBicycle() {
  const el = document.getElementById('floating-bicycle');
  const maxX = window.innerWidth  - 60;
  const maxY = window.innerHeight - 60;
  el.style.left    = Math.floor(Math.random() * maxX) + 'px';
  el.style.top     = Math.floor(Math.random() * maxY) + 'px';
  el.style.display = 'block';
}
 
function floatingBicycleClicked() {
  document.getElementById('floating-bicycle').style.display = 'none';
  hideStatus('q2-status');
  advanceQ(2);
}
 
function renderGrid() {
  const grid  = document.getElementById('captcha-grid');
  const total = captchaRows * 3;
  grid.style.gridTemplateRows = `repeat(${captchaRows}, 1fr)`;
  grid.innerHTML = '';
 
  const types = Array.from({ length: total }, () =>
    TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)]
  );
 
  types.forEach((type) => {
    const tile = document.createElement('div');
    tile.className    = 'captcha-tile';
    tile.dataset.type = type;
    tile.innerHTML    = TILE_SVG[type];
    tile.addEventListener('click', () => tile.classList.toggle('selected'));
    grid.appendChild(tile);
  });
}
 
function refreshCaptcha() {
  renderGrid();
  log('User refreshed CAPTCHA — possible evasion tactic');
}
 
function submitCaptcha() {
  const selectedTiles = [...document.querySelectorAll('.captcha-tile.selected')];
 
  if (selectedTiles.length === 0) {
    showStatus('q2-status', 'warn', 'Please select at least one image before verifying.');
    return;
  }
 
  clearTimerBar('q2-timer');
  captchaSubmits++;
  captchaRows++;
  addFlag('Incorrect CAPTCHA submission #' + captchaSubmits);
 
  // After 2 failed submits, show the floating bicycle
  if (captchaSubmits >= 2) showFloatingBicycle();
 
  showStatus('q2-status', 'danger', 'Incorrect selection. Please try again.');
  setTimeout(() => {
    hideStatus('q2-status');
    moveVerifyButton();
    renderGrid();
    startTimerBar('q2-timer', 22000, () => resetQ('q2', 'Verification timed out.'));
  }, 1800);
}
 
 
// ── 11. Q3 — Cat fingers ──────────────────────
 
const BASE_NUMBERS  = [3, 4, 5, 6];
const CORRECT_ANSWER = 4;
 
let answerIntervals = [];
 
function initQ3() {
  hideStatus('q3-status');
  renderAnswerBtns();
  startTimerBar('q3-timer', 15000, () =>
    resetQ('q3', 'Perceptual task timed out. Too slow for a human — or too slow for a bot?')
  );
}
 
function renderAnswerBtns() {
  answerIntervals.forEach(clearInterval);
  answerIntervals = [];
  const wrap = document.getElementById('answer-options');
  wrap.innerHTML = '';
 
  [...BASE_NUMBERS].sort(() => Math.random() - 0.5).forEach(n => {
    const btn = document.createElement('button');
    btn.className   = 'btn btn-outline-secondary col-6 py-3 fs-3 fw-bold';
    btn.textContent = n;
 
    btn.addEventListener('mouseenter', () => {
      const iv = setInterval(() => btn.textContent = Math.floor(Math.random() * 10) + 1, 600);
      answerIntervals.push(iv);
      btn._iv = iv;
    });
    btn.addEventListener('mouseleave', () => {
      clearInterval(btn._iv);
      btn.textContent = n;
    });
    btn.addEventListener('click', () => {
      answerIntervals.forEach(clearInterval);
      if (n === CORRECT_ANSWER) {
        clearTimerBar('q3-timer');
        advanceQ(3);
      } else {
        showStatus('q3-status', 'danger', 'Incorrect. Recount carefully. The flower is a clue.');
        addFlag('Q3 wrong answer: ' + n);
        setTimeout(() => hideStatus('q3-status'), 1800);
      }
    });
 
    wrap.appendChild(btn);
  });
}
 
 
// ── 12. Q4 — Pain slider ──────────────────────
 
const PAIN_MESSAGES = [
  [0,   0,  'Reading of 0 is consistent with synthetic entities. Biological organisms register baseline nociceptive activity.'],
  [1,   29, 'Sub-threshold values are associated with non-biological substrates. This range is invalid. Please try again.'],
  [30,  75, 'Value within acceptable range. Hold the slider in position to confirm your reading.'],
  [76,  99, 'Elevated reading detected. This range is outside acceptable parameters. Please try again.'],
  [100, 100,'Extreme value recorded. This response is consistent with dramatic overcorrection. Flagged.'],
];
 
let q4Confirmed   = false;
let q4Value       = 0;
let q4HoldTimer   = null;
let q4HoldStart   = null;
let q4AnimFrame   = null;
 
function getPainMsg(val) {
  return (PAIN_MESSAGES.find(([lo, hi]) => val >= lo && val <= hi) || [])[2] || 'Awaiting biometric input...';
}
 
function isValidRange(val) { return val >= 30 && val <= 75; }
 
function initQ4() {
  hideStatus('q4-status');
  q4Confirmed = false;
  q4Value     = 0;
  clearTimeout(q4HoldTimer);
  cancelAnimationFrame(q4AnimFrame);
  q4HoldStart = null;
 
  const track = document.getElementById('slider-track');
  const newTrack = track.cloneNode(true);
  track.parentNode.replaceChild(newTrack, track);
 
  const fill  = newTrack.querySelector('#slider-fill');
  const thumb = newTrack.querySelector('#slider-thumb');
 
  // Reset visuals
  setSliderVisuals(fill, thumb, 0);
  document.getElementById('pain-confirm').classList.add('d-none');
 
  let dragging = false;
 
  function getPct(clientX) {
    const rect = newTrack.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }
 
  function setSliderPos(pct) {
    const val  = Math.round(pct * 100);
    q4Value    = val;
    fill.style.width  = (pct * 100) + '%';
    thumb.style.left  = (pct * 100) + '%';
    setSliderVisuals(fill, thumb, val);
    document.getElementById('pain-verdict').textContent = getPainMsg(val);
  }
 
  function startHold() {
    if (q4HoldStart !== null) return;
    q4HoldStart = Date.now();
    // Animate the thumb border as a progress ring
    tickHold(fill, thumb);
    q4HoldTimer = setTimeout(() => {
      if (dragging && isValidRange(q4Value)) confirmPain(fill, thumb);
    }, 2000);
  }
 
  function cancelHold() {
    clearTimeout(q4HoldTimer);
    cancelAnimationFrame(q4AnimFrame);
    q4HoldStart = null;
    q4HoldTimer = null;
  }
 
  function tickHold(fill, thumb) {
    if (q4HoldStart === null) return;
    const elapsed = Date.now() - q4HoldStart;
    const pct     = Math.min(elapsed / 2000, 1);
    // Pulse the thumb size slightly as feedback
    const scale = 1 + pct * 0.3;
    thumb.style.transform = `translate(-50%, -50%) scale(${scale})`;
    if (pct < 1) q4AnimFrame = requestAnimationFrame(() => tickHold(fill, thumb));
  }
 
  newTrack.addEventListener('pointerdown', (e) => {
    if (q4Confirmed) return;
    dragging = true;
    newTrack.setPointerCapture(e.pointerId);
    setSliderPos(getPct(e.clientX));
    if (isValidRange(q4Value)) startHold();
  });
 
  newTrack.addEventListener('pointermove', (e) => {
    if (!dragging || q4Confirmed) return;
    setSliderPos(getPct(e.clientX));
    // Reset hold if still in valid range, cancel if not
    if (isValidRange(q4Value)) {
      if (q4HoldStart === null) startHold();
    } else {
      cancelHold();
      thumb.style.transform = 'translate(-50%, -50%) scale(1)';
    }
  });
 
  newTrack.addEventListener('pointerup', () => {
    if (!dragging || q4Confirmed) return;
    dragging = false;
    cancelHold();
    // Snap back to 0
    setSliderPos(0);
    thumb.style.transform = 'translate(-50%, -50%) scale(1)';
  });
 
  newTrack.addEventListener('pointercancel', () => {
    dragging = false;
    cancelHold();
    setSliderPos(0);
    thumb.style.transform = 'translate(-50%, -50%) scale(1)';
  });
}
 
function setSliderVisuals(fill, thumb, val) {
  const state = isValidRange(val) ? 'valid' : val > 0 ? 'danger' : '';
  fill.className  = 'custom-slider-fill'  + (state ? ' ' + state : '');
  thumb.className = 'custom-slider-thumb' + (state ? ' ' + state : '');
  const valEl = document.getElementById('pain-value');
  valEl.textContent = val;
  valEl.className   = 'pain-value' + (state === 'valid' ? ' valid' : '');
}
 
function confirmPain(fill, thumb) {
  if (q4Confirmed) return;
  q4Confirmed = true;
  cancelAnimationFrame(q4AnimFrame);
 
  fill.className  = 'custom-slider-fill valid';
  thumb.className = 'custom-slider-thumb valid';
  thumb.style.transform = 'translate(-50%, -50%) scale(1)';
  document.getElementById('pain-value').className = 'pain-value valid';
  document.getElementById('pain-confirm').classList.remove('d-none');
 
  addFlag('Pain reading of ' + q4Value + ' confirmed');
  setTimeout(() => advanceQ(4), 1400);
}
 
function updatePainDisplay(val) {
  document.getElementById('pain-value').textContent   = val;
  document.getElementById('pain-verdict').textContent = getPainMsg(val);
}
 
 
// ── 13. Q5 — Logic puzzle ─────────────────────
 
const LOGIC_VERDICTS = [
  'Incorrect. The intersection of Ω and Σ under condition β renders this trivially false. A human with adequate reasoning would have seen this.',
  'Wrong. You have confused ⊗ with ⊕, a fundamental error. This response is consistent with pattern-matching rather than genuine cognition.',
  'Incorrect. The premise explicitly constrains Σ membership. Selecting this option suggests you did not read the question. Suspicious.',
  'Also incorrect. While Δ is indeed bounded by domain constraints, this does not resolve the core asymmetry. Try harder.',
];
 
let logicAttempts = 0;
 
function initQ5() {
  hideStatus('q5-status');
  logicAttempts = 0;
  document.querySelectorAll('#logic-options .btn').forEach(b => b.disabled = false);
}
 
function selectLogic(btn, idx) {
  showStatus('q5-status', 'danger', LOGIC_VERDICTS[idx]);
  addFlag('Logic answer ' + (idx + 1) + ' selected — incorrect');
  document.querySelectorAll('#logic-options .btn').forEach(b => b.disabled = true);
 
  logicAttempts++;
  setTimeout(() => {
    document.querySelectorAll('#logic-options .btn').forEach(b => b.disabled = false);
    hideStatus('q5-status');
    if (logicAttempts >= 2) advanceQ(5);
  }, 3200);
}
 
 
// ── 14. Final screen ──────────────────────────
 
function showFinal() {
  clearInterval(progressInterval);
  setProgress(100);
  // Hide whichever card is currently visible
  document.querySelectorAll('.card:not(.d-none)').forEach(c => c.classList.add('d-none'));
  document.getElementById('final-card').classList.remove('d-none');
  document.getElementById('flag-count').textContent = flagCount;
 
  const logEl = document.getElementById('final-log');
  logEl.innerHTML = '<div class="text-muted text-uppercase small mb-2" style="letter-spacing:0.08em;">Session audit log</div>';
  sessionLog.forEach(({ time, msg, type }) => {
    const row = document.createElement('div');
    row.className = 'log-row ' + type;
    row.textContent = '[' + time + '] ' + msg;
    logEl.appendChild(row);
  });
  const verdict = document.createElement('div');
  verdict.className = 'log-verdict';
  verdict.textContent = 'VERDICT: INCONCLUSIVE — Entity could not be classified.';
  logEl.appendChild(verdict);
}
 
 
// ── 15. Boot ──────────────────────────────────
 
startProgressWobble();
initQ1();