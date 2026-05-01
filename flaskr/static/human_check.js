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
//   10.  Final screen
//   11.  Boot
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

// Selectors that the random "are you sure?" interceptor must NOT eat,
// or the actual mechanic clicks would get swallowed.
const MODAL_WHITELIST = '.captcha-tile, #moving-checkbox, #slider-track, #logic-options, #floating-bicycle, #q1-give-up, #placeholder-restart, #sure-modal';

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

const Q_INITS = { 1: () => initQ1() };

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


// ── 10. Final screen ─────────────────────────

function showFinal() {
  Quiz.clearAll();
  setProgress(100);
  document.body.classList.remove('hc-immersive');
  document.body.classList.add('hc-completed');
  document.querySelectorAll('.hc-card:not(.d-none)').forEach(c => c.classList.add('d-none'));
  document.getElementById('final-card').classList.remove('d-none');
}


// ── 11. Boot ─────────────────────────────────

initQ1();
