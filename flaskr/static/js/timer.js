let startTime;

function startTimer() {
    startTime = performance.now();
    console.log("Timer started!");
}

function stopTimerAndSave() {
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