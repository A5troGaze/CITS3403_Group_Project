// JS for timer functionality

// document.addEventListener('DOMContentLoaded', () => {
    
//     let startTime = performance.now();
//     console.log("Page loaded. Timer started!");

//     const finishButton = document.getElementById('finish-btn'); // Change this to whatever they click to win
//     const resultText = document.getElementById('result-text');

//     if (finishButton) {
//         finishButton.addEventListener('click', () => {
//             stopTimerAndSave();
            
//             finishButton.disabled = true; 
//             finishButton.innerText = "Task Complete!";
//         });
//     }

//     function stopTimerAndSave() {
//         if (!startTime) return;

//         const endTime = performance.now();
//         const timeTakenMs = endTime - startTime;
//         const timeTakenSec = (timeTakenMs / 1000).toFixed(2); 
        
//         resultText.innerText = `You finished in ${timeTakenSec} seconds! Saving...`;

//         fetch('/save_time', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ 
//                 time: timeTakenSec,
//                 task_name: 'speedrun_task' // CHANGE THIS for each different game page!
//             })
//         })
//         .then(response => response.json())
//         .then(data => {
//             if (data.success) {
//                 resultText.classList.add('text-success'); 
//                 resultText.innerText = `Saved! ${data.message} (Time: ${timeTakenSec}s)`;
//             } else {
//                 resultText.classList.add('text-danger');
//                 resultText.innerText = "Error saving time!";
//             }
//         });
//     }
// });