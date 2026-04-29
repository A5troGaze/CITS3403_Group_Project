// ----------------------------
// NAVIGATION GRAPH
// ----------------------------
const nodes = {
    start: {
    text: "Remember... don't lie this time. Do you want to go to the next level?",
    yes: "node3",
    no: "node2"
    },

    node2: {
    text: "Are you procrastinating?",
    yes: "node4",
    no: "node5"
    },

    node3: {
    text: "Do you enjoy games of chance?",
    yes: "node4",
    no: "node5"
    },

    node4: {
    text: "Do you like surprises?",
    yes: "SECRET",
    no: "node8"
    },

    node5: {
    text: "Haha... there is no escape. Are you ready?",
    yes: "node6",
    no: "node11"
    },

    node6: {
    text: "There is no game... You are part of an experiment. Would you like to enter your details for a chance to win an iPad?",
    yes: "node7",
    no: "node9"
    },

    node7: {
    text: "You said you don't like games of chance. Liar. Back to the start for you.",
    yes: "start",
    no: "node12",
    yesText: "I am a liar; I deserve this...",
    noText: "No!"
    },

    node8: {
    text: "Nah, everyone likes surprises. Do you want to play some russian roulette?",
    yes: "node13",
    no: "node9"
    },

    node9: {
    text: "You're missing out... But okay. Do you want to go to the next level now?",
    yes: "NEXT_LEVEL",
    no: "node10"
    },

    node10: {
    text: "That was a rhetorical question... Wisdom has been chasing you for a long time, but you have always been faster, huh?",
    yes: "NEXT_LEVEL",
    yesText: "Yeah...",
    buttons: ["yes"]
    },

    node11: {
    text: "That was rhetorical...",
    yes: "node6",
    yesText: "Oh...",
    buttons: ["yes"]
    },

    node12: {
    text: "No is not an option.",
    yes: "start",
    yesText: "Oh...",
    buttons: ["yes"]
    },

    node13: {
    text: "Damn, you freaky. You also said you don't like surprises though... Back to the start for you.",
    yes: "start",
    yesText: "I am freaky; I deserve this...",
    buttons: ["yes"]
    }

};

// ----------------------------
// STATE
// ----------------------------
let currentNode = null;
const modal = new bootstrap.Modal(document.getElementById('questionModal'));

// ----------------------------
// FLOW CONTROL
// ----------------------------
function next(nodeId, choice) {
    currentNode = nodes[nodeId][choice];
    handleNode(currentNode);
}

function answer(choice) {
    const nextId = nodes[currentNode][choice];
    handleNode(nextId);
}

// ----------------------------
// NODE HANDLER
// ----------------------------
function handleNode(id) {

    if (id === "NEXT_LEVEL") {
        modal.hide();
        stopTimerAndSave('standard_ending'); // Pass the name of this specific ending
        return;
    }

    if (id === "SECRET") {
        modal.hide(); 
        stopTimerAndSave('secret_ending'); // Pass the name of the secret ending
        return;
    }

    currentNode = id;
    const node = nodes[id];

    document.getElementById("questionText").innerText = nodes[id].text;

    const yesBtn = document.getElementById("yesBtn");
    const noBtn = document.getElementById("noBtn");

    // --- SET BUTTON TEXT ---
    yesBtn.innerText = node.yesText || "Yes";
    noBtn.innerText = node.noText || "No";

    // --- SHOW/HIDE BUTTONS ---
    yesBtn.style.display = "inline-block";
    noBtn.style.display = "inline-block";

    if (node.buttons) {
        yesBtn.style.display = node.buttons.includes("yes") ? "inline-block" : "none";
        noBtn.style.display = node.buttons.includes("no") ? "inline-block" : "none";
    }

    modal.show();
}

let startTime = performance.now(); 

function stopTimerAndSave(taskName) {
    if (!startTime) return;

    const endTime = performance.now();
    const timeTakenSec = ((endTime - startTime) / 1000).toFixed(2);
    
    const resultText = document.getElementById('result-text');
    if(resultText) {
        resultText.innerText = `You finished the ${taskName} in ${timeTakenSec} seconds! Saving...`;
    }

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
        if (data.success) {
            alert(`Score saved! You reached the ${taskName} in ${timeTakenSec}s.`);
        } else {
            alert("Error saving time!");
        }
    });
}
