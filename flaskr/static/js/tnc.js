// 1. Declare the startTime variable at the very top so the whole file can see it
let startTime;

// 2. Start the timer function
function startTimer() {
    // isLoggedIn comes from the HTML <script> tag we added earlier
    if (!isLoggedIn) {
        console.log("Guest user: Timer disabled.");
        return; 
    }
    startTime = performance.now();
    console.log("Timer started for T&C Quiz!");
}

// 3. Actually run the timer function when the file loads
startTimer();


// 4. Wait for the HTML form to load, then attach the submit logic
document.addEventListener('DOMContentLoaded', function() {
    
    const quizForm = document.getElementById('legalQuiz');

    if (quizForm) {
        quizForm.addEventListener('submit', function(event) {
            
            // Stop the page reload
            event.preventDefault(); 

            // THIS is the line that was crashing! It will work now because startTime is defined above.
            if (!isLoggedIn || !startTime) {
                alert("You must be logged in to record a time!");
                return;
            }

            // Calculate time taken
            const endTime = performance.now();
            const timeTakenSec = ((endTime - startTime) / 1000).toFixed(2);

            // Grab the answers
            const formData = new FormData(this);
            const userAnswers = Object.fromEntries(formData.entries());

            // Send to Flask
            fetch('/submit_quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    time: timeTakenSec,
                    task_name: 'tnc_quiz',
                    answers: userAnswers 
                })
            })
            .then(response => response.json())
            .then(data => {
                const resultBox = document.getElementById('quizResults');
                const resultTitle = document.getElementById('resultTitle');
                const resultMessage = document.getElementById('resultMessage');
                
                resultBox.classList.remove('d-none', 'alert-success', 'alert-danger');

                // Handle Success
                if (data.success) {
                    resultBox.classList.add('alert-success');
                    resultTitle.innerHTML = "🎉 Adequate Score";
                    resultMessage.innerHTML = "Congrats. You can actually read. <br><strong>Redirecting...</strong>";
                    
                    startTime = null; // Stop the timer
                    resultBox.scrollIntoView({ behavior: 'smooth' });

                    // Redirect after 2.5 seconds
                    setTimeout(() => {
                        window.location.href = "/signin"; 
                    }, 2500); 

                } else {
                    // Handle Failure
                    resultBox.classList.add('alert-danger');
                    resultTitle.innerHTML = "🚨 Quiz Failed";
                    resultMessage.innerHTML = "You did not read the terms closely enough. The timer is still running!";
                    resultBox.scrollIntoView({ behavior: 'smooth' });
                }
            })
            .catch(error => {
                console.error("Error submitting quiz:", error);
                alert("Something went wrong connecting to the server.");
            });
        });
    }
});