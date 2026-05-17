
let startTime;
const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

function startTimer() {
    if (!isLoggedIn) {
        console.log("Guest user: Timer disabled.");
        return; 
    }
    startTime = performance.now();
    console.log("Timer started for T&C Quiz!");
}

startTimer();
    

//check and get quiz answers
    const quizForm = document.getElementById('legalQuiz');

    if (quizForm) {
        quizForm.addEventListener('submit', function(event) {
            
            event.preventDefault();

            //find submit button
            const submit_btn = quizForm.querySelector('button[type="submit"]');

            if (!isLoggedIn || !startTime) {
                alert("You must be logged in to record a time!");
                return;
            }

            //disable the submit button directly after submission --> prevents user from double submitting before even one fetch is resolved
            submit_btn.disabled = true;
            submit_btn.textContent = 'Submitting...'

            const endTime = performance.now();
            const timeTakenSec = ((endTime - startTime) / 1000).toFixed(2);

            const formData = new FormData(this);
            const userAnswers = Object.fromEntries(formData.entries());

            fetch('/submit_quiz', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
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

                if (data.success) {
                    resultBox.classList.add('alert-success');
                    resultTitle.innerHTML = "🎉 Adequate Score";
                    resultMessage.innerHTML = "Congrats. You can actually read. <br><strong>Redirecting...</strong>";
                    
                    startTime = null; // Stop the timer
                    resultBox.scrollIntoView({ behavior: 'smooth' });

                    setTimeout(() => {
                        window.location.href = "/signin"; 
                    }, 2500); 

                } else {
                    resultBox.classList.add('alert-danger');
                    resultTitle.innerHTML = "🚨 Quiz Failed";
                    resultMessage.innerHTML = "You did not read the terms closely enough. The timer is still running!";
                    resultBox.scrollIntoView({ behavior: 'smooth' });
                    //re-enable submit button with correct content
                    submit_btn.disabled = false;
                    submit_btn.textContent = "Submit Answers";
                }
            })
            .catch(error => {
                console.error("Error submitting quiz:", error);
                alert("Something went wrong connecting to the server.");
                //re-enable submit button with correct content
                submit_btn.disabled = false;
                submit_btn.textContent = "Submit Answers";
            });
        });
    }
//});