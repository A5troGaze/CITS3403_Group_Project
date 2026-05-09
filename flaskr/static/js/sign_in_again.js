// hint 1
const hint1 = document.getElementById("usernameHint");

hint1.addEventListener("mouseenter", function () {
    hint1.textContent = "HINT: Maybe it's not that complicated...";
});
hint1.addEventListener("mouseleave", function () {
    hint1.textContent = "Other people will be able to see your username.";
});

// hint 2
const hint2 = document.getElementById("signupHint");

hint2.addEventListener("mouseenter", function () {
    hint2.innerHTML = "HINT: Make sure you're looking at the right <strong>Sign In</strong>";
});
hint2.addEventListener("mouseleave", function () {
    hint2.innerHTML = "Don't have an account? <a href=\"#\" onclick=\"return false;\">Sign up</a>";
});


const form = document.getElementById("signInForm");

form.addEventListener("submit", function (event) {
    event.preventDefault();
    alert("You really thought we'd make it that easy? Have a good look around and try again!");
});

// pass level
function showAlert(message) {
    const popup = document.getElementById("alertPopup");
    const popupMessage = document.getElementById("popupMessage");

    popupMessage.textContent = message;
    popup.style.display = "block";
}

const header = document.getElementById("signInHeader");

header.addEventListener("click", function () {
    showAlert("You passed the level!");
});


let startTime;

function startTimer() {
    startTime = performance.now();
    console.log("Timer started!");
}

function stopTimerAndSave(taskName) {
    if (!startTime) return; 

    const endTime = performance.now();
    const timeTakenMs = endTime - startTime;
    const timeTakenSec = (timeTakenMs / 1000).toFixed(2); 
    
    console.log(`Task completed in ${timeTakenSec} seconds. Saving...`);

    fetch('/save_time', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            time: timeTakenSec,
            task_name: taskName 
        })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error("Failed to save time:", data.error);
        }
    });
}

startTimer();