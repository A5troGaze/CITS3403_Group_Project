(function () {
  // ====== DOM handles ======
  const overlay      = document.getElementById('obstacleOverlay');
  const countdownBar = document.getElementById('countdownBar');
  const hintIcon     = document.getElementById('hintIcon');
  const hintText     = document.getElementById('hintText');
  const warningIcon  = document.getElementById('warningIcon');
  const distanceBar  = document.getElementById('distanceBar');
  const bug          = document.getElementById('bug');
  const bugGlow      = document.getElementById('bugGlow');
  const brightnessControls = document.getElementById('brightnessControls');
  const brightnessUpBtn    = document.getElementById('brightnessUpBtn');
  const brightnessDownBtn  = document.getElementById('brightnessDownBtn');
  const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

  // ====== Constants ======
  const WIN_DISTANCE   = 500;   // metres to win
  const BASE_SPEED_MPS = 2.5;   // metres per second at speedMul = 1.0
  const WARNING_MS     = 1500;  // warning phase length before overlay hits
  const FADE_MS        = 300;   // overlay fade-in duration (matches CSS)
  const FLICKER_MS     = 80;    // flicker bg toggle interval

  // ====== Mutable game state ======
  const S = {
    status: 'idle',
    startMs: 0,         
    bonusMs: 0,         
    speedMul: 1.0,
    nextObstacleAt: 0,  
    flickerInterval: null,
    warningTimeout: null,
    obstacle: null,     
    finalTime: 0
  };

  // ====== Difficulty curve ======
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
    clearTimers();
    hideOverlay(true);
    hideWarning();
    bug.classList.remove('bug-dim', 'bug-happy', 'bug-bounce');
    bugGlow.classList.add('d-none');
    document.querySelector('.scroll-stripes').classList.remove('paused');
    document.getElementById('victoryBanner').classList.remove('show');
    document.querySelectorAll('.victory-sparkle').forEach(s => s.remove());

    S.startMs = performance.now();
    S.bonusMs = 0; 
    S.speedMul = 1.0;
    S.obstacle = null;
    S.nextObstacleAt = S.startMs + 2500; 
    brightnessControls.classList.remove('d-none');
    setStatus('idle');
    requestAnimationFrame(loop);
  }

 function endGame(reason, msg) {
    setStatus(reason); 
    clearTimers();
    hideOverlay(true);
    hideWarning();
    brightnessControls.classList.add('d-none');

    if (reason === 'won') {
        const endTime = performance.now();
        S.finalTime = ((endTime - S.startMs - S.bonusMs) / 1000).toFixed(2);
        playWinAnimation();
    } else if (reason === 'over') {
      
      // --- AUTO-RESTART LOGIC ---
      console.log("Failed:", msg);
      
      // Briefly flash the screen red to indicate a mistake
      overlay.className = '';            
      overlay.style.background = 'rgba(255, 0, 0, 0.4)';     
      overlay.style.display = 'block';
      overlay.classList.add('show');

      // Auto-restart after a tiny 400ms delay so the player can process the failure
      setTimeout(() => {
        startGame();
      }, 400);

    }
  }

  function playWinAnimation() {
    const stripes = document.querySelector('.scroll-stripes');
    const banner  = document.getElementById('victoryBanner');
    const world   = document.getElementById('gameWorld');

    stripes.classList.add('paused');
    bug.classList.remove('bug-dim', 'bug-bounce');
    bugGlow.classList.add('d-none');
    bug.classList.add('bug-happy');
    banner.classList.add('show');

    const SPARKLE_COUNT = 8;
    for (let i = 0; i < SPARKLE_COUNT; i++) {
      const s = document.createElement('i');
      s.className = 'bi bi-star-fill victory-sparkle';
      const angle = (i / SPARKLE_COUNT) * Math.PI * 2;
      const dist  = 90 + Math.random() * 40;
      s.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      s.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
      s.style.left = '13%';
      s.style.top  = 'calc(50% - 1rem)';
      world.appendChild(s);
    }

    setTimeout(() => {
      bootstrap.Modal.getOrCreateInstance(document.getElementById('winModal')).show();
      
      console.log(`Brightness Bug beaten in ${S.finalTime} seconds.`);
      
      fetch('/submit_brightness_bug', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ 
          time: S.finalTime,
          task_name: 'brightness_bug'
        })
      })
      .then(response => response.json())
      .then(data => {
        if (!data.success) console.error("Error saving time:", data.error);
        setTimeout(() => { window.location.href = "/questionnaire"; }, 3000);
      })
      .catch(error => {
        console.error("Fetch Error:", error);
        setTimeout(() => { window.location.href = "/questionnaire"; }, 3000);
      });

    }, 2500);
  }

  function clearTimers() {
    if (S.flickerInterval) { clearInterval(S.flickerInterval); S.flickerInterval = null; }
    if (S.warningTimeout)  { clearTimeout(S.warningTimeout);   S.warningTimeout = null; }
  }

  // ====== The main loop ======
  function loop() {
    if (S.status === 'over' || S.status === 'won') return;

    const now     = performance.now();
    const elapsed = elapsedSec();
    const metres  = metresFromElapsed(elapsed);

    if (metres >= WIN_DISTANCE) { endGame('won'); return; }

    S.speedMul = 1.0 + Math.floor(elapsed / 10) * 0.1;

    distanceBar.style.width = (metres / WIN_DISTANCE * 100).toFixed(2) + '%';

    if (S.status === 'idle' && now >= S.nextObstacleAt) {
      beginWarning(elapsed);
    }

    if (S.status === 'obstacle' && S.obstacle) {
      const remain = S.obstacle.deadline - now;
      if (remain <= 0) {
        endGame('over', 'You ran out of time!');
        return;
      }
      countdownBar.style.width = (remain / S.obstacle.windowMs * 100).toFixed(2) + '%';
    }

    requestAnimationFrame(loop);
  }

  function metresFromElapsed(sec) {
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

    if (type === 'flash') bugGlow.classList.remove('d-none');
    if (type === 'blackout') bug.classList.add('bug-dim');

    S.warningTimeout = setTimeout(() => triggerObstacle(type), WARNING_MS);
  }

  function triggerObstacle(type) {
    if (S.status !== 'warning') return; 
    hideWarning();
    showOverlay(type);

    S.obstacle.deadline = performance.now() + S.obstacle.windowMs + FADE_MS;
    setStatus('obstacle');

    if (type === 'flicker') {
      let on = false;
      S.flickerInterval = setInterval(() => {
        overlay.style.background = on ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)';
        on = !on;
      }, FLICKER_MS);
    }
  }

  function onConfirm() {
    if (S.status !== 'obstacle' || !S.obstacle) return;
    
    // Auto-restart if they hit the wrong button
    if (S.obstacle.type !== 'flicker') {
      endGame('over', 'Wrong button pressed!');
      return;
    }

    S.obstacle.confirmsGot++;
    if (S.obstacle.confirmsGot < S.obstacle.confirmsNeeded) return; 

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
    overlay.className = '';            
    overlay.classList.add(type);       
    overlay.style.background = '';     
    overlay.style.display = 'block';
    countdownBar.style.width = '100%';

    if (type === 'flash') {
      hintIcon.className = 'bi bi-brightness-low overlay-hint';
      hintText.textContent = 'TOO BRIGHT — dim your screen (Tap Dim 3x)';
      hintText.style.color = '#000';
    } else if (type === 'blackout') {
      hintIcon.className = 'bi bi-brightness-high overlay-hint';
      hintText.textContent = 'TOO DARK — max your brightness (Tap Brighten 3x)';
      hintText.style.color = '#fff';
    } else {
      hintIcon.className = 'bi bi-lightning-charge-fill overlay-hint';
      // --- UPDATED FOR MOBILE ---
      hintText.textContent = 'FLICKER — Smash B or Tap Screen 3× fast!';
      hintText.style.color = '#ffc107';
    }

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
  document.addEventListener('keydown', (e) => {
    if (e.key === 'b' || e.key === 'B') onConfirm();
  });

  // --- MOBILE TAP/CLICK FIX ---
  overlay.addEventListener('pointerdown', (e) => {
      if (S.status === 'obstacle' && S.obstacle && S.obstacle.type === 'flicker') {
          // Prevent mobile zoom/highlight weirdness on rapid tapping
          e.preventDefault(); 
          onConfirm();
      } else if (S.status === 'obstacle' && S.obstacle && S.obstacle.type !== 'flicker') {
          // If they tap the screen during a blackout/flash, auto-fail them
          endGame('over', 'Wrong input! Use the brightness buttons.');
      }
  });

  function adjustBrightness(dir) {
    if (S.status !== 'obstacle' || !S.obstacle) return;
    const t = S.obstacle.type;
    const matches = (dir === -1 && t === 'flash') ||
                    (dir === +1 && t === 'blackout');
    
    // Auto-restart if they adjust the wrong way
    if (!matches) {
      endGame('over', 'Wrong brightness adjusted!');
      return;
    }
    
    S.obstacle.adjustTaps = (S.obstacle.adjustTaps || 0) + 1;
    const alpha = Math.max(0.45, 0.92 - S.obstacle.adjustTaps * 0.12);
    
    if (t === 'flash')        overlay.style.background = `rgba(255,255,255,${alpha})`;
    else if (t === 'blackout') overlay.style.background = `rgba(0,0,0,${alpha})`;
    
    if (S.obstacle.adjustTaps >= 3) {
      S.obstacle.confirmsGot = S.obstacle.confirmsNeeded;
      
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
  }
  
  brightnessUpBtn.addEventListener('click',   () => adjustBrightness(+1));
  brightnessDownBtn.addEventListener('click', () => adjustBrightness(-1));

  // ====== Pre-game flow ======
  function initGame() {
    const instructionsEl = document.getElementById('instructionsModal');
    const agreementEl    = document.getElementById('agreementModal');
    const continueBtn    = document.getElementById('instructionsContinueBtn');
    const agreeBtn       = document.getElementById('agreeBtn');
    const cd             = document.getElementById('agreeCountdown');

    const instructions = bootstrap.Modal.getOrCreateInstance(instructionsEl);
    const agreement    = bootstrap.Modal.getOrCreateInstance(agreementEl);

    instructions.show();

    continueBtn.addEventListener('click', () => {
      instructionsEl.addEventListener('hidden.bs.modal', () => {
        agreement.show();
      }, { once: true });
      instructions.hide();
    });

    agreementEl.addEventListener('shown.bs.modal', () => {
      let remaining = 5;
      const tick = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
          clearInterval(tick);
          agreeBtn.disabled = false;
          agreeBtn.textContent = "Agree (Let's Go)";
        } else {
          cd.textContent = remaining;
        }
      }, 1000);
    }, { once: true });

    agreeBtn.addEventListener('click', () => {
      agreementEl.addEventListener('hidden.bs.modal', () => {
        startGame();
      }, { once: true });
      agreement.hide();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
  } else {
    initGame();
  }
})();