document.addEventListener("DOMContentLoaded", function () {
    const loaderBar = document.getElementById("loaderBar");

    if (!loaderBar) return; 

    // --- 1. START THE TIMER ---
    const startTime = performance.now();

    let progress = 0;
    let direction = 1;
    let finished = false;
    let oscillate = false;
    let pauseCount = 0;

    const messages = [
        "Loading assets...",
        "Fetching data...",
        "Still working on it...",
        "Almost there...",
        "Just a moment..."
    ];

    let msgIndex = 0;
    let clickCount = 0;

    function updateBar(value) {
        loaderBar.style.width = value + "%";
        loaderBar.setAttribute("aria-valuenow", value);
    }

    function finishLevel(message) {
        if (finished) return;
        finished = true;

        // --- 2. STOP THE TIMER IMMEDIATELY ---
        const endTime = performance.now();
        const timeTakenSec = ((endTime - startTime) / 1000).toFixed(2);
        console.log(`Loading screen beaten in ${timeTakenSec} seconds.`);

        clearInterval(interval);
        clearInterval(messageInterval);
        clearTimeout(timer);

        loaderBar.textContent = message;

        const finishInterval = setInterval(() => {
            if (progress < 100) {
                progress++;
                updateBar(progress);
            } else {
                clearInterval(finishInterval);
                loaderBar.classList.remove("progress-bar-animated");

                fetch('/submit_loading_screen', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        time: timeTakenSec,
                        task_name: 'loading_screen' 
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (!data.success) console.error("Error saving time:", data.error);
                    
                    setTimeout(() => {
                        window.location.href = "/maze_game"; 
                    }, 2500);
                })
                .catch(error => {
                    console.error("Fetch Error:", error);
                    setTimeout(() => {
                        window.location.href = "/maze_game"; 
                    }, 2500);
                });
            }
        }, 20);
    }

    // oscillate between 75% and 95%
    const interval = setInterval(() => {
        if (finished) return;

        if (!oscillate) {
            progress += 1;

            if (progress >= 75) {
                progress = 75;
                oscillate = true;
            }
        } else {
            if (progress >= 97 && direction === 1 && pauseCount < 15) {
                pauseCount++;
                updateBar(progress);
                return;
            }

            pauseCount = 0;
            progress += direction * 1;

            if (progress >= 99) {
                progress = 99;
                direction = -1;
            }

            if (progress <= 75) {
                progress = 75;
                direction = 1;
            }
        }

        updateBar(progress);
    }, 20);

    const messageInterval = setInterval(() => {
        if (finished) return;
        msgIndex = (msgIndex + 1) % messages.length;
        loaderBar.textContent = messages[msgIndex];
    }, 1500);

    const timer = setTimeout(() => {
        finishLevel("Lol you passed the level congrats!!!");
    }, 30000);

    // click to end loading
    loaderBar.addEventListener("click", function () {
        if (finished) return;
        clickCount++;

        if (clickCount >= 3) {
            finishLevel("Done! Congrats you passed the level!");
        }
    });
});