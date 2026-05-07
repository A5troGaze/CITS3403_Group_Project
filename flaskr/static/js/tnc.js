let startTime;

function startTimer() {
    startTime = performance.now();
    console.log("Timer started for T&C Quiz!");
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
        const resultMessage = document.getElementById('resultMessage');
        
        if (!data.success) {
        return console.error("Failed to save time:", data.error);
        }
    });
}

startTimer();

document.getElementById('legalQuiz').addEventListener('submit', function(event) {
    event.preventDefault();

    const answers = {
        q1: 'B',
        q2: 'D',
        q3: 'C',
        q4: 'C',
        q5: 'B'
    };

    let score = 0;
    let total = 5;

    const formData = new FormData(this);
    for (let [question, answer] of formData.entries()) {
        if (answers[question] === answer) {
            score++;
        }
    }

    const resultBox = document.getElementById('quizResults');
    const resultTitle = document.getElementById('resultTitle');
    const resultMessage = document.getElementById('resultMessage');

    resultBox.classList.remove('d-none', 'alert-success', 'alert-danger');

    if (score === total) {
        resultBox.classList.add('alert-success');
        resultTitle.innerHTML = "🎉 Adequate Score";
        resultMessage.innerHTML = "Congrats. You can actually read, surprisingly.";
        
        stopTimerAndSave('tnc_quiz'); 
        
    } else {
        resultBox.classList.add('alert-danger');
        resultTitle.innerHTML = "🚨 Quiz Failed (" + score + "/" + total + ")";
        resultMessage.innerHTML = "You did not read the terms closely enough. Use your eyes.";
    }
    
    resultBox.scrollIntoView({ behavior: 'smooth' });
});