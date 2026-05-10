(function () {
  // ====== DOM handles ======
  const overlay      = document.getElementById('obstacleOverlay');
  const confirmBtn   = document.getElementById('confirmBtn');
  const countdownBar = document.getElementById('countdownBar');
  const hintIcon     = document.getElementById('hintIcon');
  const hintText     = document.getElementById('hintText');
  const warningIcon  = document.getElementById('warningIcon');
  const scoreBadge   = document.getElementById('scoreBadge');
  const distanceBar  = document.getElementById('distanceBar');
  const bug          = document.getElementById('bug');
  const bugGlow      = document.getElementById('bugGlow');
  const brightnessControls = document.getElementById('brightnessControls');
  const brightnessUpBtn    = document.getElementById('brightnessUpBtn');
  const brightnessDownBtn  = document.getElementById('brightnessDownBtn');

  // ====== Constants ======
  const WIN_DISTANCE   = 500;   // metres to win
  const BASE_SPEED_MPS = 2.5;   // metres per second at speedMul = 1.0
  const WARNING_MS     = 1500;  // warning phase length before overlay hits
  const FADE_MS        = 300;   // overlay fade-in duration (matches CSS)
  const FLICKER_MS     = 80;    // flicker bg toggle interval

  // ====== Mutable game state ======
  // status: 'idle' | 'warning' | 'obstacle' | 'over' | 'won'
  const S = {
    status: 'idle',
    startMs: 0,         // performance.now() when run started
    bonusMs: 0,         // accumulated time-bonus from fast confirms
    speedMul: 1.0,
    nextObstacleAt: 0,  // performance.now() target for next warning
    flickerInterval: null,
    warningTimeout: null,
    obstacle: null,     // { type, deadline, windowMs, confirmsNeeded, confirmsGot }
  };

  // ====== Difficulty curve (pure fns of elapsed seconds) ======
  // Spec: 0–30s wide+slow, 30–60s mixed, 60–90s rapid+flicker, 90+s frantic.
  function reactionWindowMs(elapsed) {
    if (elapsed < 30) return 2500;
    if (elapsed < 60) return 1800;
    if (elapsed < 90) return 1200;
    return 800;
  }
  function obstaclePool(elapsed) {
    if (elapsed < 30) return ['flash'];
    if (elapsed < 60) return ['flash', 'blackout'];
    if (elapsed < 90) return ['flash', 'blackout', 'flicker'];
    // 90+s: flicker bursts more common
    return ['flash', 'blackout', 'flicker', 'flicker'];
  }
  function nextGapMs(elapsed) {
    if (elapsed < 30) return 4000 + Math.random() * 1000;
    if (elapsed < 60) return 2800 + Math.random() * 800;
    if (elapsed < 90) return 1800 + Math.random() * 600;
    return 1200 + Math.random() * 500;
  }

  // ====== Helpers ======
  function elapsedSec() {
    return (performance.now() - S.startMs - S.bonusMs) / 1000;
  }

  function setStatus(next) { S.status = next; }

  // ====== Game lifecycle ======
  function startGame() {
    // Clear any leftover state from a previous run.
    clearTimers();
    hideOverlay(true);
    hideWarning();
    bug.classList.remove('bug-dim', 'bug-happy', 'bug-bounce');
    bugGlow.classList.add('d-none');
    // Tear down win-celebration leftovers so a retry-after-win is clean.
    document.querySelector('.scroll-stripes').classList.remove('paused');
    document.getElementById('victoryBanner').classList.remove('show');
    document.querySelectorAll('.victory-sparkle').forEach(s => s.remove());

    S.startMs = performance.now();
    S.bonusMs = 0;
    S.speedMul = 1.0;
    S.obstacle = null;
    S.nextObstacleAt = S.startMs + 2500; // first obstacle 2.5s in
    brightnessControls.classList.remove('d-none');
    setStatus('idle');
    requestAnimationFrame(loop);
  }

  function endGame(reason, msg) {
    setStatus(reason); // 'over' or 'won'
    clearTimers();
    hideOverlay(true);
    hideWarning();
    brightnessControls.classList.add('d-none');

    if (reason === 'over') {
      document.getElementById('gameOverMsg').textContent = msg;
      document.getElementById('finalTime').textContent = elapsedSec().toFixed(1);
      document.getElementById('finalDistance').textContent = Math.floor(metresFromElapsed(elapsedSec()));
      new bootstrap.Modal(document.getElementById('gameOverModal')).show();
    } else {
      // Win path: play the celebration first, then open the modal so the
      // player actually sees the bug's reaction before being pulled into UI.
      playWinAnimation();
    }
  }

  // Plays for ~2.5s after a win. Pauses the scrolling world, switches the
  // bug to its happy/dance animation, drops in a banner, and shoots sparkles
  // outward in 8 directions from the bug's position. Then opens the win
  // modal. startGame() is responsible for cleaning all of this up on reset.
  function playWinAnimation() {
    const stripes = document.querySelector('.scroll-stripes');
    const banner  = document.getElementById('victoryBanner');
    const world   = document.getElementById('gameWorld');

    stripes.classList.add('paused');
    bug.classList.remove('bug-dim', 'bug-bounce');
    bugGlow.classList.add('d-none');
    bug.classList.add('bug-happy');
    banner.classList.add('show');

    // 8 sparkles in a starburst. Each gets a unique --dx/--dy that the
    // sparkleFloat keyframes consume to fly the sparkle outward.
    const SPARKLE_COUNT = 8;
    for (let i = 0; i < SPARKLE_COUNT; i++) {
      const s = document.createElement('i');
      s.className = 'bi bi-star-fill victory-sparkle';
      const angle = (i / SPARKLE_COUNT) * Math.PI * 2;
      const dist  = 90 + Math.random() * 40;
      s.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      s.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
      // Anchor the sparkle on top of the bug (bug sits at left:12%, mid-height).
      s.style.left = '13%';
      s.style.top  = 'calc(50% - 1rem)';
      world.appendChild(s);
    }

    // Modal opens after the banner's 2.5s animation completes.
    setTimeout(() => {
      new bootstrap.Modal(document.getElementById('winModal')).show();
    }, 2500);
  }

  function clearTimers() {
    if (S.flickerInterval) { clearInterval(S.flickerInterval); S.flickerInterval = null; }
    if (S.warningTimeout)  { clearTimeout(S.warningTimeout);   S.warningTimeout = null; }
  }

  // ====== The main loop ======
  // Drives score, distance, speed bumps, and obstacle scheduling/timeout.
  function loop() {
    if (S.status === 'over' || S.status === 'won') return;

    const now     = performance.now();
    const elapsed = elapsedSec();
    const metres  = metresFromElapsed(elapsed);

    // Win condition
    if (metres >= WIN_DISTANCE) { endGame('won'); return; }

    // Speed multiplier bumps every 10 seconds (spec: "automatically every 10s").
    S.speedMul = 1.0 + Math.floor(elapsed / 10) * 0.1;

    // Update HUD
    scoreBadge.textContent = elapsed.toFixed(1) + ' s';
    distanceBar.style.width = (metres / WIN_DISTANCE * 100).toFixed(2) + '%';

    // Schedule a new obstacle if we're idle and the gap has elapsed.
    if (S.status === 'idle' && now >= S.nextObstacleAt) {
      beginWarning(elapsed);
    }

    // Tick the active obstacle's countdown bar; time out if expired.
    if (S.status === 'obstacle' && S.obstacle) {
      const remain = S.obstacle.deadline - now;
      if (remain <= 0) {
        const failMsg = S.obstacle.type === 'flash'
          ? 'The bug got zapped by the light!'
          : S.obstacle.type === 'blackout'
            ? 'The bug vanished into the dark!'
            : 'The bug short-circuited from the flicker!';
        endGame('over', failMsg);
        return;
      }
      countdownBar.style.width = (remain / S.obstacle.windowMs * 100).toFixed(2) + '%';
    }

    requestAnimationFrame(loop);
  }

  function metresFromElapsed(sec) {
    // Distance is integral of speed over time, but speedMul is piecewise
    // constant per 10s bucket. A simple linear approximation using the
    // current multiplier is close enough for a 500m total — the player
    // doesn't notice a few metres' drift.
    return sec * BASE_SPEED_MPS * S.speedMul;
  }

  // ====== Obstacle flow ======
  function beginWarning(elapsed) {
    const pool = obstaclePool(elapsed);
    const type = pool[Math.floor(Math.random() * pool.length)];
    const windowMs = reactionWindowMs(elapsed);

    S.obstacle = { type, windowMs, deadline: 0, confirmsNeeded: type === 'flicker' ? 3 : 1, confirmsGot: 0 };
    setStatus('warning');
    showWarning(type);

    // Visual cue near the bug during the warning phase.
    if (type === 'flash') bugGlow.classList.remove('d-none');
    if (type === 'blackout') bug.classList.add('bug-dim');

    S.warningTimeout = setTimeout(() => triggerObstacle(type), WARNING_MS);
  }

  function triggerObstacle(type) {
    if (S.status !== 'warning') return; // safety: aborted mid-warning
    hideWarning();
    showOverlay(type);

    S.obstacle.deadline = performance.now() + S.obstacle.windowMs + FADE_MS;
    setStatus('obstacle');

    if (type === 'flicker') {
      // Toggle bg between near-white and near-black at FLICKER_MS rate.
      let on = false;
      S.flickerInterval = setInterval(() => {
        overlay.style.background = on ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)';
        on = !on;
      }, FLICKER_MS);
    }
  }

  function onConfirm() {
    if (S.status !== 'obstacle' || !S.obstacle) return;
    S.obstacle.confirmsGot++;
    if (S.obstacle.confirmsGot < S.obstacle.confirmsNeeded) {
      // Flicker needs 3 confirms — give a tiny visual nudge to the button.
      confirmBtn.classList.remove('btn-secondary');
      confirmBtn.classList.add('btn-warning');
      setTimeout(() => {
        confirmBtn.classList.add('btn-secondary');
        confirmBtn.classList.remove('btn-warning');
      }, 80);
      return;
    }

    // Success: −1 s bonus, fade overlay out, bounce, schedule next gap.
    S.bonusMs += 1000;
    bug.classList.add('bug-bounce');
    setTimeout(() => bug.classList.remove('bug-bounce'), 350);

    bug.classList.remove('bug-dim');
    bugGlow.classList.add('d-none');

    hideOverlay();
    S.obstacle = null;
    setStatus('idle');
    S.nextObstacleAt = performance.now() + nextGapMs(elapsedSec());
  }

  // ====== UI: overlays / warnings ======
  function showOverlay(type) {
    overlay.className = '';            // reset
    overlay.classList.add(type);       // sets background
    overlay.style.background = '';     // let CSS class set it (flicker overrides via JS)
    overlay.style.display = 'block';
    countdownBar.style.width = '100%';

    // Directional hint: dim screen for flash, brighten for blackout, mash for flicker.
    if (type === 'flash') {
      hintIcon.className = 'bi bi-brightness-low overlay-hint';
      hintText.textContent = 'TOO BRIGHT — dim your screen';
      hintText.style.color = '#000';
    } else if (type === 'blackout') {
      hintIcon.className = 'bi bi-brightness-high overlay-hint';
      hintText.textContent = 'TOO DARK — max your brightness';
      hintText.style.color = '#fff';
    } else {
      hintIcon.className = 'bi bi-lightning-charge-fill overlay-hint';
      hintText.textContent = 'FLICKER — confirm 3× fast!';
      hintText.style.color = '#ffc107';
    }

    // Trigger fade-in next frame so the transition fires.
    requestAnimationFrame(() => overlay.classList.add('show'));
  }

  function hideOverlay(immediate) {
    if (S.flickerInterval) { clearInterval(S.flickerInterval); S.flickerInterval = null; }
    overlay.classList.remove('show');
    if (immediate) {
      overlay.style.display = 'none';
    } else {
      setTimeout(() => { overlay.style.display = 'none'; }, FADE_MS);
    }
  }

  function showWarning(type) {
    warningIcon.className = 'bi ';
    if (type === 'flash')         warningIcon.className += 'bi-sun';
    else if (type === 'blackout') warningIcon.className += 'bi-moon-stars';
    else                          warningIcon.className += 'bi-lightning-charge';
    warningIcon.classList.add('show');
  }
  function hideWarning() {
    warningIcon.classList.remove('show');
  }

  // ====== Inputs ======
  confirmBtn.addEventListener('click', onConfirm);
  // 'B' key as a failsafe shortcut (spec).
  document.addEventListener('keydown', (e) => {
    if (e.key === 'b' || e.key === 'B') onConfirm();
  });

  // Mobile brightness controls. dir = -1 means "dim" (helps vs flash);
  // dir = +1 means "brighten" (helps vs blackout). Wrong direction is a
  // no-op so the player can't cheese a flash by tapping brighten. Each
  // matching tap softens the overlay alpha by a step, floored at 0.45 so
  // the obstacle stays clearly visible. Confirm is still required to
  // actually clear the obstacle — these buttons don't substitute for it.
  // Flicker isn't handled here: its background is overwritten every
  // FLICKER_MS by the interval, so any alpha tweak would just be clobbered.
  function adjustBrightness(dir) {
    if (S.status !== 'obstacle' || !S.obstacle) return;
    const t = S.obstacle.type;
    const matches = (dir === -1 && t === 'flash') ||
                    (dir === +1 && t === 'blackout');
    if (!matches) return;
    S.obstacle.adjustTaps = (S.obstacle.adjustTaps || 0) + 1;
    const alpha = Math.max(0.45, 0.92 - S.obstacle.adjustTaps * 0.12);
    if (t === 'flash')         overlay.style.background = `rgba(255,255,255,${alpha})`;
    else if (t === 'blackout') overlay.style.background = `rgba(0,0,0,${alpha})`;
  }
  brightnessUpBtn.addEventListener('click',   () => adjustBrightness(+1));
  brightnessDownBtn.addEventListener('click', () => adjustBrightness(-1));

  document.getElementById('retryBtn').addEventListener('click', () => {
    bootstrap.Modal.getInstance(document.getElementById('gameOverModal')).hide();
    startGame();
  });
  document.getElementById('playAgainBtn').addEventListener('click', () => {
    bootstrap.Modal.getInstance(document.getElementById('winModal')).hide();
    startGame();
  });

  // ====== Pre-game flow: instructions → agreement → start ======
  // The 5-second forced-reading timer on the agreement modal starts only
  // when that modal is actually shown — otherwise reading the instructions
  // slowly would defeat the timer.
  window.addEventListener('DOMContentLoaded', () => {
    const instructionsEl = document.getElementById('instructionsModal');
    const agreementEl    = document.getElementById('agreementModal');
    const continueBtn    = document.getElementById('instructionsContinueBtn');
    const agreeBtn       = document.getElementById('agreeBtn');
    const cd             = document.getElementById('agreeCountdown');

    const instructions = new bootstrap.Modal(instructionsEl);
    const agreement    = new bootstrap.Modal(agreementEl);

    // 1. Show instructions first.
    instructions.show();

    // 2. On Continue, swap to the agreement modal.
    continueBtn.addEventListener('click', () => {
      instructions.hide();
      agreement.show();
    });

    // 3. When the agreement modal finishes opening, kick off the 5s countdown.
    agreementEl.addEventListener('shown.bs.modal', () => {
      let remaining = 5;
      const tick = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
          clearInterval(tick);
          agreeBtn.disabled = false;
          agreeBtn.textContent = 'Agree';
        } else {
          cd.textContent = remaining;
        }
      }, 1000);
    }, { once: true });

    // 4. On Agree, the run starts.
    agreeBtn.addEventListener('click', () => {
      agreement.hide();
      startGame();
    });
  });
})();
