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


                    document.getElementById("progress-message").innerText = `Status: ${this._successCount} / 5`;

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

                    document.getElementById("progress-message").innerText = `Status: 0 / 5`;
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

    showAlert() {
        document.getElementById("win-message").style.display = "block";

        const bgSound = document.getElementById("background-sound");
        const winSound = document.getElementById("win-sound");

        winSound.pause();
        winSound.currentTime = 0;

        setTimeout(() => {
            winSound.play();
        }, 10);
    }
}

window.addEventListener('load', () => {
    const bgSound = document.getElementById("background-sound");
    const bgSound2 = document.getElementById("background-sound-2");

    bgSound.volume = 1;
    bgSound2.volume = 0.4;

    bgSound.play().catch(() => {
        document.addEventListener("click", () => {
            bgSound.play();
            bgSound2.play();
        }, { once: true });
    });
    bgSound2.play().catch(() => { });

    new VolumeSlider();
});
