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
