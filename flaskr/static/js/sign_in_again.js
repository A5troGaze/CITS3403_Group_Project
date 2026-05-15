const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
document.addEventListener('DOMContentLoaded', function() {
    let startTime;
    if (isLoggedIn) {
        startTime = performance.now();
        console.log("Timer started for Fake Sign-In!");
    }

    const hint1 = document.getElementById("usernameHint");
    if (hint1) {
        hint1.addEventListener("mouseenter", () => hint1.textContent = "HINT: Maybe it's not that complicated...");
        hint1.addEventListener("mouseleave", () => hint1.textContent = "Other people will be able to see your username.");
    }

    const hint2 = document.getElementById("signupHint");
    if (hint2) {
        hint2.addEventListener("mouseenter", () => hint2.innerHTML = "HINT: Make sure you're looking at the right <strong>Sign In</strong>");
        hint2.addEventListener("mouseleave", () => hint2.innerHTML = "Don't have an account? <a href=\"#\" onclick=\"return false;\">Sign up</a>");
    }

    const form = document.getElementById("signInForm");
    if (form) {
        form.addEventListener("submit", function (event) {
            event.preventDefault(); 
            alert("You really thought we'd make it that easy? Have a good look around and try again!");
        });
    }

    function showAlert(message) {
        const popup = document.getElementById("alertPopup");
        const popupMessage = document.getElementById("popupMessage");
        popupMessage.innerHTML = message;
        popup.style.display = "block";
    }

    const header = document.getElementById("signInHeader");
    if (header) {
        header.addEventListener("click", function () {
            
            if (!isLoggedIn || !startTime) {
                alert("You must be logged in to record a time!");
                return;
            }

            const endTime = performance.now();
            const timeTakenSec = ((endTime - startTime) / 1000).toFixed(2);

            fetch('/submit_fake_signin', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ 
                    time: timeTakenSec,
                    task_name: 'fake_signin'
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert(`You passed the level!<br><br> <br><strong>Redirecting...</strong>`);
                    startTime = null; 
                    
                    setTimeout(() => {
                        window.location.href = "/CAPTCHA"; // CHANGE THIS to your next page
                    }, 2500); 

                } else {
                    alert("Error saving time: " + data.error);
                }
            })
            .catch(error => {
                console.error("Error:", error);
                alert("Something went wrong connecting to the server.");
            });
        });
    }
});