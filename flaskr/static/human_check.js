// ─────────────────────────────────────────────
//  human_check.js
//
//  Sections:
//    1.  State & config
//    2.  Progress bar
//    3.  Logging & flags
//    4.  Timer bars
//    5.  Status messages
//    6.  Modal
//    7.  Suspicious flash
//    8.  Question routing
//    9.  Q1 — Moving checkbox
//   10.  Q2 — CAPTCHA grid
//   11.  Final screen
//   12.  Boot
// ─────────────────────────────────────────────


// ── 1. State & config ────────────────────────

const TOTAL_QUESTIONS = 5;
const PROGRESS_PER_Q  = { 1: 20, 2: 20, 3: 20, 4: 20, 5: 20 };

const Quiz = {
  current: 1,
  progress: 0,
  flags: 0,
  log: [],
  timers: {},
  scheduled: new Set(),
  handlers: [],
  q1: {},
  q2: {},
  modal: null,
  modalCb: null,
  reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
};

Quiz.track = (id) => { Quiz.scheduled.add(id); return id; };

Quiz.clearAll = () => {
  Quiz.scheduled.forEach((id) => { clearTimeout(id); clearInterval(id); });
  Quiz.scheduled.clear();
  Object.keys(Quiz.timers).forEach(clearTimerBar);
  Quiz.handlers.forEach(([el, ev, fn]) => el && el.removeEventListener(ev, fn));
  Quiz.handlers = [];
};

matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
  Quiz.reducedMotion = e.matches;
});


// ── 2. Progress bar ──────────────────────────

function setProgress(val) {
  Quiz.progress = Math.max(0, Math.min(100, val));
  document.getElementById('progress-fill').style.width = Quiz.progress + '%';
  document.getElementById('progress-pct').textContent  = Math.round(Quiz.progress) + '%';
}


// ── 3. Logging & flags ───────────────────────

function log(msg, type = 'info') {
  Quiz.log.push({ msg, type, time: new Date().toLocaleTimeString() });
}

function addFlag(msg) {
  Quiz.flags++;
  log('[FLAG] ' + msg, 'danger');
}


// ── 4. Timer bars ────────────────────────────
//  CSS-transition driven: set 100%, force reflow, set 0% with a long
//  linear transition. A setTimeout fallback fires onExpire even if the
//  tab has been backgrounded (transitionend can be unreliable then).

function startTimerBar(id, duration, onExpire) {
  clearTimerBar(id);
  const fill = document.getElementById(id);
  if (!fill) return;

  fill.style.transition = 'none';
  fill.style.width      = '100%';
  fill.classList.remove('warn');
  void fill.offsetWidth;

  fill.style.transition = `width ${duration}ms linear, background .3s`;
  fill.style.width      = '0%';

  const warnTimer   = setTimeout(() => fill.classList.add('warn'), duration * 0.75);
  const expireTimer = setTimeout(onExpire, duration + 50);
  Quiz.timers[id] = { warnTimer, expireTimer };
}

function clearTimerBar(id) {
  const t = Quiz.timers[id];
  if (t) {
    clearTimeout(t.warnTimer);
    clearTimeout(t.expireTimer);
    delete Quiz.timers[id];
  }
  const fill = document.getElementById(id);
  if (fill) {
    fill.style.transition = 'none';
    fill.classList.remove('warn');
  }
}


// ── 5. Status messages ───────────────────────

function showStatus(id, type, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  const bsClass = type === 'danger' ? 'alert-danger'
                : type === 'warn'   ? 'alert-warning'
                : 'alert-info';
  el.className   = 'alert ' + bsClass + ' py-2 mt-3';
  el.textContent = msg;
  el.classList.remove('d-none');
}

function hideStatus(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('d-none');
  el.textContent = '';
}


// ── 6. Modal ─────────────────────────────────

const SURE_MESSAGES = [
  'Are you sure? This action has been noted.',
  'Please confirm. Hesitation is suspicious.',
  'Are you certain? Most humans are not.',
  'Confirm you wish to proceed. This will be recorded.',
  'Are you sure? Your response time is being monitored.',
];

// Selectors that the random "are you sure?" interceptor must NOT eat, or the actual mechanic clicks would get swallowed.
const MODAL_WHITELIST = '.captcha-tile, #captcha-submit, #captcha-refresh, #moving-checkbox, #slider-track, #logic-options, #floating-bicycle, #q1-give-up, #placeholder-restart, #sure-modal';

function showModal(msg, cb) {
  document.getElementById('sure-modal-body').textContent = msg;
  Quiz.modalCb = cb;
  if (!Quiz.modal) {
    Quiz.modal = new bootstrap.Modal(
      document.getElementById('sure-modal'),
      { backdrop: 'static', keyboard: false }
    );
  }
  Quiz.modal.show();
}

function closeModal(confirmed) {
  if (Quiz.modal) Quiz.modal.hide();
  const cb = Quiz.modalCb;
  Quiz.modalCb = null;
  if (cb) cb(confirmed);
}

document.getElementById('sure-modal-cancel').addEventListener('click', () => closeModal(false));
document.getElementById('sure-modal-confirm').addEventListener('click', () => closeModal(true));

document.addEventListener('click', (e) => {
  if (e.target.closest(MODAL_WHITELIST)) return;
  if (Math.random() < 0.18) {
    e.stopImmediatePropagation();
    e.preventDefault();
    showModal(
      SURE_MESSAGES[Math.floor(Math.random() * SURE_MESSAGES.length)],
      (yes) => { if (!yes) addFlag('User cancelled action — possible avoidance behaviour'); }
    );
  }
}, true);


// ── 7. Suspicious flash ──────────────────────

function flashSuspicious() {
  const el = document.getElementById('suspicious-overlay');
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 1800);
  addFlag('Suspicious interaction pattern detected');
}


// ── 8. Question routing ──────────────────────

const Q_INITS = { 1: () => initQ1(), 2: () => initQ2() };

function resetQ(qid, msg) {
  Quiz.clearAll();
  addFlag(msg);
  const banner = document.getElementById(qid + '-reset-banner');
  if (banner) {
    banner.textContent = '⚠ ' + msg;
    banner.classList.remove('d-none');
  }
  Quiz.track(setTimeout(() => {
    if (banner) banner.classList.add('d-none');
    initCurrentQ();
  }, 2400));
}

function advanceQ(from) {
  Quiz.clearAll();
  setProgress(Quiz.progress + PROGRESS_PER_Q[from]);
  flashSuspicious();
  setTimeout(() => {
    showModal('Suspicious activity detected. Please re-verify before continuing.', () => {
      const fromCard = document.getElementById('q' + from + '-card');
      if (fromCard) fromCard.classList.add('d-none');

      if (Quiz.progress >= 100) { showFinal(); return; }

      Quiz.current = from + 1;
      const nextCard = document.getElementById('q' + Quiz.current + '-card');

      if (nextCard) {
        nextCard.classList.remove('d-none');
        initCurrentQ();
      } else {
        document.getElementById('placeholder-card').classList.remove('d-none');
      }
    });
  }, 600);
}

function initCurrentQ() {
  const fn = Q_INITS[Quiz.current];
  if (fn) fn();
}

function restartQuiz() {
  Quiz.clearAll();
  Quiz.current = 1;
  setProgress(0);
  document.getElementById('placeholder-card').classList.add('d-none');
  document.getElementById('final-card').classList.add('d-none');
  document.getElementById('q2-card').classList.add('d-none');
  document.getElementById('floating-bicycle').classList.add('d-none');
  document.body.classList.remove('hc-completed');
  document.body.classList.add('hc-immersive');
  document.getElementById('q1-card').classList.remove('d-none');
  initQ1();
}

document.getElementById('placeholder-restart').addEventListener('click', restartQuiz);


// ── 9. Q1 — Moving checkbox ──────────────────
//  Fleeing behaviour: pointermove on the area pushes the checkbox in the
//  opposite direction of the cursor when the cursor enters its proximity.
//  Position is driven entirely by `transform: translate(...)` so the CSS
//  transition handles the easing.
//
//  Anti-cheat: q1.startTime is set at initQ1() (not on first hover) so
//  clicking the checkbox before any cursor movement still trips the
//  too-fast guard.
//
//  Surrender: after 60% of the timer, a "Give up" link fades in.

function initQ1() {
  hideStatus('q1-status');

  const area   = document.getElementById('checkbox-area');
  const cb     = document.getElementById('moving-checkbox');
  const giveUp = document.getElementById('q1-give-up');
  const banner = document.getElementById('q1-reset-banner');

  cb.checked = false;
  cb.classList.remove('fleeing');
  banner.classList.add('d-none');
  giveUp.classList.add('d-none');

  Quiz.q1.startTime = Date.now();
  Quiz.q1.tx = 16;
  Quiz.q1.ty = Math.max(8, area.offsetHeight / 2 - 8);
  Quiz.q1.lastMove = 0;

  cb.style.transition = 'none';
  cb.style.transform  = `translate(${Quiz.q1.tx}px, ${Quiz.q1.ty}px)`;
  void cb.offsetWidth;
  cb.style.transition = '';

  const onMove = (e) => {
    const now = Date.now();
    if (now - Quiz.q1.lastMove < 30) return;
    Quiz.q1.lastMove = now;

    const rect = area.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const cx = Quiz.q1.tx + 8;
    const cy = Quiz.q1.ty + 8;
    const dx = cx - px;
    const dy = cy - py;
    const dist = Math.hypot(dx, dy);

    if (dist >= 60) return;

    const ux = dist > 0 ? dx / dist : 1;
    const uy = dist > 0 ? dy / dist : 0;
    const fleeDist = 60 - dist + 12;

    let nx = cx + ux * fleeDist - 8;
    let ny = cy + uy * fleeDist - 8;
    nx = Math.max(4, Math.min(area.offsetWidth  - 21, nx));
    ny = Math.max(4, Math.min(area.offsetHeight - 21, ny));

    Quiz.q1.tx = nx;
    Quiz.q1.ty = ny;
    cb.style.transform = `translate(${nx}px, ${ny}px)`;
    cb.classList.add('fleeing');
  };

  const onChange = () => {
    if (!cb.checked) return;
    const elapsed = Date.now() - Quiz.q1.startTime;
    if (elapsed < 400) {
      cb.checked = false;
      resetQ('q1', 'Suspicious instant click. Session reset for security.');
      return;
    }
    if (elapsed < 1800) {
      cb.checked = false;
      resetQ('q1', 'Response was too fast. Automated behaviour detected.');
      return;
    }
    advanceQ(1);
  };

  const onGiveUp = (e) => {
    e.preventDefault();
    showModal('Withdrawing is also suspicious.', (yes) => {
      addFlag('User attempted to withdraw from Q1');
      if (yes) resetQ('q1', 'Withdrawal noted. Restarting verification step.');
    });
  };

  area.addEventListener('pointermove', onMove);
  cb.addEventListener('change', onChange);
  giveUp.addEventListener('click', onGiveUp);
  Quiz.handlers.push([area, 'pointermove', onMove]);
  Quiz.handlers.push([cb, 'change', onChange]);
  Quiz.handlers.push([giveUp, 'click', onGiveUp]);

  startTimerBar('q1-timer', 18000, () =>
    resetQ('q1', 'Response time exceeded. Session reset for security.')
  );

  Quiz.track(setTimeout(() => giveUp.classList.remove('d-none'), 18000 * 0.6));
}


// ── 10. Q2 — CAPTCHA grid ────────────────────
//
//  The bicycle is intentionally never in the grid, so every submit
//  fails. Each retry: grid grows by 1 row (capped at 6), the Verify
//  button's peak hover-opacity drops further, and after 2 submits a
//  small floating bicycle appears outside the card. It has a 2.5s
//  arming grace before clicks register, so the user has a moment to
//  notice it. Clicking it is the only way to advance.
//
//  Phantom variant: 15% chance per render, one cat tile is replaced
//  with a cat-with-tiny-bicycle-wheel composite. Selecting it still
//  counts as wrong, but the flag message is more sneering.

const TILE_TYPES = ['cat', 'hydrant', 'toilet', 'stickfigure'];

const TILE_SVG = {
  cat: `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="34" r="16" fill="#ccc" stroke="#aaa" stroke-width="1.5"/>
    <circle cx="30" cy="30" r="13" fill="#ddd"/>
    <polygon points="14,20 20,8 26,20" fill="#ccc" stroke="#aaa" stroke-width="1"/>
    <polygon points="34,20 40,8 46,20" fill="#ccc" stroke="#aaa" stroke-width="1"/>
    <circle cx="25" cy="30" r="2.5" fill="#555"/>
    <circle cx="35" cy="30" r="2.5" fill="#555"/>
    <circle cx="26" cy="29" r="1" fill="#fff"/>
    <circle cx="36" cy="29" r="1" fill="#fff"/>
    <ellipse cx="30" cy="35" rx="3" ry="2" fill="#e8a0a0"/>
    <line x1="18" y1="34" x2="10" y2="31" stroke="#aaa" stroke-width="1"/>
    <line x1="18" y1="36" x2="10" y2="36" stroke="#aaa" stroke-width="1"/>
    <line x1="42" y1="34" x2="50" y2="31" stroke="#aaa" stroke-width="1"/>
    <line x1="42" y1="36" x2="50" y2="36" stroke="#aaa" stroke-width="1"/>
  </svg>`,
  hydrant: `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
    <rect x="22" y="42" width="16" height="8" rx="2" fill="#c44" stroke="#a33" stroke-width="1.5"/>
    <rect x="18" y="30" width="24" height="16" rx="3" fill="#d55" stroke="#a33" stroke-width="1.5"/>
    <ellipse cx="30" cy="30" rx="12" ry="5" fill="#c44" stroke="#a33" stroke-width="1.5"/>
    <rect x="24" y="20" width="12" height="12" rx="2" fill="#d55" stroke="#a33" stroke-width="1.5"/>
    <ellipse cx="30" cy="20" rx="7" ry="4" fill="#c44" stroke="#a33" stroke-width="1.5"/>
    <rect x="10" y="34" width="8" height="5" rx="2" fill="#c44" stroke="#a33" stroke-width="1"/>
    <rect x="42" y="34" width="8" height="5" rx="2" fill="#c44" stroke="#a33" stroke-width="1"/>
    <circle cx="30" cy="37" r="3" fill="#a33"/>
  </svg>`,
  toilet: `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="8" width="24" height="10" rx="3" fill="#ddd" stroke="#bbb" stroke-width="1.5"/>
    <rect x="16" y="16" width="28" height="6" rx="2" fill="#eee" stroke="#bbb" stroke-width="1.5"/>
    <ellipse cx="30" cy="40" rx="18" ry="14" fill="#f5f5f5" stroke="#bbb" stroke-width="1.5"/>
    <ellipse cx="30" cy="40" rx="13" ry="10" fill="#e8e8e8" stroke="#bbb" stroke-width="1"/>
    <ellipse cx="30" cy="40" rx="8" ry="6" fill="#ccc"/>
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
  cat_phantom: `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="34" r="16" fill="#ccc" stroke="#aaa" stroke-width="1.5"/>
    <circle cx="30" cy="30" r="13" fill="#ddd"/>
    <polygon points="14,20 20,8 26,20" fill="#ccc" stroke="#aaa" stroke-width="1"/>
    <polygon points="34,20 40,8 46,20" fill="#ccc" stroke="#aaa" stroke-width="1"/>
    <circle cx="25" cy="30" r="2.5" fill="#555"/>
    <circle cx="35" cy="30" r="2.5" fill="#555"/>
    <ellipse cx="30" cy="35" rx="3" ry="2" fill="#e8a0a0"/>
    <circle cx="48" cy="50" r="5" fill="none" stroke="#777" stroke-width="1"/>
    <line x1="48" y1="45" x2="48" y2="55" stroke="#777" stroke-width="0.6"/>
    <line x1="43" y1="50" x2="53" y2="50" stroke="#777" stroke-width="0.6"/>
    <ellipse cx="46" cy="50" rx="6" ry="3" fill="#ccc" stroke="#aaa" stroke-width="1"/>
  </svg>`,
};

function initQ2() {
  hideStatus('q2-status');
  Quiz.q2 = { submits: 0, rows: 3, hasPhantom: false };

  const submitBtn  = document.getElementById('captcha-submit');
  const refreshBtn = document.getElementById('captcha-refresh');
  const fb         = document.getElementById('floating-bicycle');

  fb.classList.add('d-none');
  fb.classList.remove('armed');
  submitBtn.style.removeProperty('--peak-opacity');

  moveVerifyButton();
  renderGrid();

  const onSubmit  = () => submitCaptcha();
  const onRefresh = (e) => {
    e.preventDefault();
    renderGrid();
    log('User refreshed CAPTCHA — possible evasion tactic');
  };
  const onFloating = () => {
    if (!fb.classList.contains('armed')) return;
    fb.classList.add('d-none');
    advanceQ(2);
  };

  submitBtn.addEventListener('click', onSubmit);
  refreshBtn.addEventListener('click', onRefresh);
  fb.addEventListener('click', onFloating);
  Quiz.handlers.push([submitBtn,  'click', onSubmit]);
  Quiz.handlers.push([refreshBtn, 'click', onRefresh]);
  Quiz.handlers.push([fb,         'click', onFloating]);

  startTimerBar('q2-timer', 22000, () =>
    resetQ('q2', 'Verification timed out. Please complete the CAPTCHA again.')
  );
}

function moveVerifyButton() {
  const btn  = document.getElementById('captcha-submit');
  const card = document.getElementById('q2-card');
  const cardW = card.offsetWidth  || 560;
  const cardH = card.offsetHeight || 520;
  const padding = 16;
  const btnW = 80;
  const btnH = 36;

  // Constrain to bottom-right quadrant so the user has a search area,
  // not the whole card.
  const minX = Math.floor(cardW * 0.55);
  const maxX = cardW - btnW - padding;
  const minY = Math.floor(cardH * 0.75);
  const maxY = cardH - btnH - padding;

  btn.style.left   = (minX + Math.floor(Math.random() * Math.max(1, maxX - minX))) + 'px';
  btn.style.top    = (minY + Math.floor(Math.random() * Math.max(1, maxY - minY))) + 'px';
  btn.style.bottom = 'auto';
  btn.style.right  = 'auto';
  btn.style.zIndex = '10';
}

function renderGrid() {
  const grid  = document.getElementById('captcha-grid');
  const total = Quiz.q2.rows * 3;
  grid.style.gridTemplateRows = `repeat(${Quiz.q2.rows}, 1fr)`;
  grid.innerHTML = '';

  // Pick a random tile type for each cell. Bicycle is never in TILE_TYPES.
  const types = Array.from({ length: total }, () =>
    TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)]
  );

  // Phantom: 15% chance to swap one cat tile for a cat_phantom variant.
  Quiz.q2.hasPhantom = false;
  if (Math.random() < 0.15) {
    const catIndices = types.reduce((acc, t, i) => (t === 'cat' ? acc.concat(i) : acc), []);
    if (catIndices.length > 0) {
      const idx = catIndices[Math.floor(Math.random() * catIndices.length)];
      types[idx] = 'cat_phantom';
      Quiz.q2.hasPhantom = true;
    }
  }

  types.forEach((type) => {
    const tile = document.createElement('div');
    tile.className    = 'captcha-tile';
    tile.dataset.type = type;
    tile.innerHTML    = TILE_SVG[type];
    tile.addEventListener('click', () => tile.classList.toggle('selected'));
    grid.appendChild(tile);
  });
}

function submitCaptcha() {
  const selectedTiles = [...document.querySelectorAll('.captcha-tile.selected')];
  if (selectedTiles.length === 0) {
    showStatus('q2-status', 'warn', 'Please select at least one image before verifying.');
    return;
  }

  clearTimerBar('q2-timer');
  Quiz.q2.submits++;
  Quiz.q2.rows = Math.min(6, Quiz.q2.rows + 1);

  const phantomSelected = selectedTiles.some(t => t.dataset.type === 'cat_phantom');
  addFlag(phantomSelected
    ? 'Bicycle-adjacent feature detected — inconclusive'
    : 'Incorrect CAPTCHA submission #' + Quiz.q2.submits);

  // Tier the verify-button hover opacity downward each retry.
  const btn = document.getElementById('captcha-submit');
  if (Quiz.q2.submits === 1)      btn.style.setProperty('--peak-opacity', '0.6');
  else if (Quiz.q2.submits >= 2)  btn.style.setProperty('--peak-opacity', '0.35');

  if (Quiz.q2.submits >= 2) showFloatingBicycle();

  showStatus('q2-status', 'danger', 'Incorrect selection. Please try again.');
  Quiz.track(setTimeout(() => {
    hideStatus('q2-status');
    moveVerifyButton();
    renderGrid();
    startTimerBar('q2-timer', 22000, () => resetQ('q2', 'Verification timed out.'));
  }, 1800));
}

function showFloatingBicycle() {
  const fb = document.getElementById('floating-bicycle');
  fb.classList.remove('d-none');
  fb.classList.remove('armed');
  Quiz.track(setTimeout(() => fb.classList.add('armed'), 2500));
}


// ── 11. Final screen ─────────────────────────

function showFinal() {
  Quiz.clearAll();
  setProgress(100);
  document.body.classList.remove('hc-immersive');
  document.body.classList.add('hc-completed');
  document.querySelectorAll('.hc-card:not(.d-none)').forEach(c => c.classList.add('d-none'));
  document.getElementById('final-card').classList.remove('d-none');
}


// ── 12. Boot ─────────────────────────────────

initQ1();
