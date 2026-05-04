class VolumeSlider {
    constructor() {
        this.slider = document.getElementById('volume-slider');
        this.icon = document.getElementById('volume-icon');
        this.indicator = document.getElementById('volume-indicator');
        this.shape = document.getElementById('circle-mask-shape');
        this.input = document.getElementById('volume-input');

        this._lock = false;
        this._charging = false;
        this._charge = 0;
        this._volume = 0;
        this.soundVolume = 1;

        this.input.value = this._volume;

        this.icon.addEventListener('mousedown', () => { this.charge(); });
        this.icon.addEventListener('mouseup', () => { this.release(this._charge); });
        this.icon.addEventListener('touchstart', () => { this.charge(); });
        this.icon.addEventListener('touchend', () => { this.release(this._charge); });

        this._successCount = 0;
        this._counted = false;

    }
    /* begin charge cycle */

    charge() {
        if (this._lock) { return false; }
        this._lock = true;

        // reset
        this._charge = 0;
        this._charging = true;
        this._counted = false;

        // hide indicator
        // this.indicator.style.visibility = 'hidden';
        // this.indicator.style.opacity = '0';

        let cycle = () => {
            if (this._charging && ++this._charge < 100) {
                requestAnimationFrame(() => {
                    cycle();
                });
            }

            // update style icons
            this.shape.style.transform = `scale(${this._charge / 100})`;
            this.icon.style.transform = `rotate(${-0.35 * this._charge}deg)`;
        };
        setTimeout(() => cycle(), 100);
    }
    // release and fire based on charge
    release(charge) {
        this._charging = false;

        const releaseSound = document.getElementById("release-sound");
        if (releaseSound) {
            releaseSound.pause();
            releaseSound.currentTime = 0;

            setTimeout(() => {
                releaseSound.play();
            }, 10);
        }

        this.indicator.classList.remove("drop");
        this.indicator.style.opacity = "1";
        requestAnimationFrame(() => {
            this.shape.style.transform = `scale(0)`;
        });

        // animation vars
        let y_cap = charge * 0.35,
            y_start = -0.3 * charge,
            x_cap = (this.slider.querySelector('.volume-track').offsetWidth - this.indicator.offsetWidth) * (charge / 100),
            x_start = -10,
            duration = 20 + (4 * charge),
            start = new Date().getTime(),
            volume = this._volume,
            rotate;

        let y_swap = duration * 0.55;

        let y_duration_up = y_swap,
            y_duration_down = duration - y_swap;

        let y = y_start,
            y_diff_up = -y_cap,
            y_diff_down = (y_cap - y_start);

        // x animation
        let x = x_cap,
            x_diff = x_cap - 10;

        // display indicator
        this.indicator.style.visibility = 'visible';
        this.indicator.style.opacity = '1';

        // animation loop
        let animate = () => {
            let elapsed = new Date().getTime() - start;

            if (elapsed < duration) {
                requestAnimationFrame(() => {
                    animate();
                });

                if (elapsed < y_duration_up) {
                    y = this.easeOut(elapsed, y_start, y_diff_up, y_duration_up);
                } else {
                    y = this.easeIn(elapsed - y_duration_up, y_start - y_cap, y_diff_down, y_duration_down);
                }
                // set values
                x = this.linearTween(elapsed, 0, x_diff, duration);
                rotate = this.easeInOut(elapsed, -1.5 * this._charge, 1.5 * this._charge, duration);
                this._volume = this.easeOut(elapsed, volume, charge - volume, duration);
            } else {
                // end of animation
                this._lock = false;

                // set values
                x = x_cap;
                y = 0;
                rotate = 0;
                this._volume = charge;

                if (charge >= 98 && !this._counted) {
                    this._counted = true;
                    this._successCount++;

                    const hitSound = document.getElementById("hit-sound");
                    hitSound.pause();
                    hitSound.currentTime = 0;

                    setTimeout(() => {
                        hitSound.play();
                    }, 10);

                    this.soundVolume -= 0.2;
                    if (this.soundVolume < 0) {
                        this.soundVolume = 0;
                    }

                    document.getElementById("background-sound").volume = this.soundVolume;
                    document.getElementById("background-sound-2").volume = this.soundVolume * 0.4;


                    this.updateProgress(this._successCount, true, "#00ff99");

                    if (this._successCount >= 5) {
                        this.showAlert();
                    }
                } else if (charge < 98) {
                    this._successCount = 0;
                    this.soundVolume = 1;

                    document.getElementById("background-sound").volume = this.soundVolume;
                    document.getElementById("background-sound-2").volume = this.soundVolume * 0.4;

                    const missSound = document.getElementById("miss-sound");

                    missSound.pause();
                    missSound.currentTime = 0;

                    setTimeout(() => {
                        missSound.play();
                    }, 10);

                    this.updateProgress(0, true, "#ff4444");
                    this.showMissPopup();
                }

            }

            // render values
            this.icon.style.transform = `rotate(${rotate}deg)`;
            this.indicator.style.transform = `translateX(${x}px) translateY(${y}px)`;
            this.input.value = this._volume;
        };
        animate();
    }
    // linear progression
    linearTween(t, b, c, d) {
        return c * t / d + b;
    }
    // cubic ease in progression
    easeIn(t, b, c, d) {
        t /= d;
        return c * t * t * t + b;
    }

    // ease out
    easeOut(t, b, c, d) {
        t /= d;
        t--;
        return c * (t * t * t + 1) + b;
    }

    // ease in out
    easeInOut(t, b, c, d) {
        t /= d / 2;
        if (t < 1) {
            return c / 2 * t * t * t + b;
        }
        t -= 2;
        return c / 2 * (t * t * t + 2) + b;
    }

    updateProgress(count, flash = true, color = "#00ff99") {
        const circles = document.querySelectorAll(".progress-circle");

        if (count === 0 && color === "#ff4444") {
            circles.forEach(circle => {
                circle.classList.remove("win");
                circle.style.background = "#ff4444";
            });
            setTimeout(() => {
                circles.forEach(circle => circle.style.background = "#444");
            }, 400);
            return;
        }

        circles.forEach((circle, index) => {
            if (index < count) {
                circle.style.background = color;
                if (count === 5) {
                    circle.classList.add("win");
                }
            } else {
                circle.classList.remove("win");
                circle.style.background = "#444";
            }
        });
    }

    showMissPopup() {
        const numPoints = 9;
        const outerTips = [60, 55, 63, 50, 62, 58, 64, 52, 59];
        const outerValleys = [22, 20, 25, 18, 24, 21, 23, 19, 22];
        const innerTips = [38, 24, 40, 32, 39, 36, 41, 33, 37];
        const innerValleys = [14, 13, 16, 11, 15, 12, 14, 13, 15];

        function buildStar(tips, valleys) {
            let pts = [];
            for (let i = 0; i < numPoints; i++) {
                const tipAngle = (Math.PI * 2 / numPoints) * i - Math.PI / 2;
                const valAngle = tipAngle + Math.PI / numPoints;
                pts.push(`${(tips[i] * Math.cos(tipAngle)).toFixed(2)}, ${(tips[i] * Math.sin(tipAngle)).toFixed(2)}`);
                pts.push(`${(valleys[i] * Math.cos(valAngle)).toFixed(2)}, ${(valleys[i] * Math.sin(valAngle)).toFixed(2)}`);
            }
            return pts.join(' ');
        }
        document.getElementById('burst-outer').setAttribute('points', buildStar(outerTips, outerValleys));
        document.getElementById('burst-inner').setAttribute('points', buildStar(innerTips, innerValleys));

        const popup = document.getElementById('miss-popup');
        const svg = document.getElementById('burst-svg');

        popup.style.display = 'flex';
        svg.style.animation = 'none';
        void svg.offsetWidth;
        svg.style.animation = 'burstPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';

        setTimeout(() => {
            popup.style.display = 'none';
        }, 1800);
    }

}

window.addEventListener('load', () => {
    const popup = document.getElementById("volume-popup");
    const startBtn = document.getElementById("start-button");

    const bgSound = document.getElementById("background-sound");
    const bgSound2 = document.getElementById("background-sound-2");

    bgSound.pause();
    bgSound2.pause();

    startBtn.addEventListener("click", () => {
        popup.style.display = "none";

        bgSound.volume = 1;
        bgSound2.volume = 0.4;

        bgSound.play();
        bgSound2.play();

        new VolumeSlider();

    }, { once: true });

});
