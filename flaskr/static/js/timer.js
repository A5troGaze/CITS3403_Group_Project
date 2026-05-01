let startTime;

// Call this when the task/game begins
function startTimer() {
    startTime = performance.now();
    console.log("Timer started!");
}

// Call this when they finish the task
function stopTimerAndSave() {
    if (!startTime) return; // Prevent stopping before starting

    const endTime = performance.now();
    
    const timeTakenMs = endTime - startTime;
    const timeTakenSec = (timeTakenMs / 1000).toFixed(2); // e.g., 14.52
    
    console.log(`Task completed in ${timeTakenSec} seconds. Saving...`);

    fetch('/save_time', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            time: timeTakenSec,
            task_name: 'secret_task' // Change this depending on which page/game this is!
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`Awesome! Your time of ${timeTakenSec}s was saved!`);
        } else {
            console.error("Failed to save time:", data.error);
        }
    });
}