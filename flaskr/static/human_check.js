/* ── Invisible verify button ── */
#captcha-submit         { opacity: 0; transition: opacity 0.15s; }
#captcha-submit:hover   { opacity: 1; }
.quiz-timer-bar {
  height: 3px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}
.quiz-timer-fill {
  height: 100%;
  width: 100%;
  background: #e67e00;
  border-radius: 2px;
}

/* ── Moving checkbox ── */
.moving-checkbox {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 17px;
  height: 17px;
  cursor: pointer;
}

/* ── CAPTCHA grid ── */
.captcha-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}
.captcha-tile {
  aspect-ratio: 1;
  background: #f7f7f7;
  border: 2px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.1s, background 0.1s;
}
.captcha-tile:hover    { border-color: #aaa; }
.captcha-tile.selected { border-color: #0d6efd; background: #eef4ff; }
.captcha-tile svg      { width: 100%; height: 100%; padding: 10px; }

/* ── Custom slider ── */
.custom-slider-track {
  position: relative;
  height: 6px;
  background: #dee2e6;
  border-radius: 3px;
  cursor: pointer;
  margin-bottom: 12px;
  user-select: none;
}
.custom-slider-fill {
  position: absolute;
  left: 0; top: 0;
  height: 100%;
  width: 0%;
  background: #212529;
  border-radius: 3px;
  pointer-events: none;
}
.custom-slider-fill.valid  { background: #198754; }
.custom-slider-fill.danger { background: #dc3545; }
.custom-slider-thumb {
  position: absolute;
  top: 50%;
  left: 0%;
  transform: translate(-50%, -50%);
  width: 22px;
  height: 22px;
  background: #fff;
  border: 2px solid #212529;
  border-radius: 50%;
  pointer-events: none;
  transition: transform 0.1s;
}
.custom-slider-thumb.valid  { border-color: #198754; }
.custom-slider-thumb.danger { border-color: #dc3545; }

/* ── Final log ── */
.final-log {
  max-height: 220px;
  overflow-y: auto;
  font-size: 0.78rem;
  line-height: 2;
}
.log-row        { color: #6c757d; }
.log-row.danger { color: #dc3545; }
.log-row.warn   { color: #e67e00; }
.log-verdict    { color: #dc3545; font-weight: 600; margin-top: 8px; }

/* ── Suspicious overlay ── */
.suspicious-overlay {
  display: none;
  position: fixed;
  inset: 0;
  border: 3px solid #dc3545;
  background: rgba(220,53,69,0.04);
  z-index: 900;
  pointer-events: none;
  animation: pulse-border 0.5s ease-in-out 3;
}
@keyframes pulse-border {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.2; }
}