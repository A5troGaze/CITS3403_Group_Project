const questions = [
                {
                    text: "Is Rick ever going to give you up?",
                    correct: "No",
                    taunt: "...Really? Think again."
                },
                {
                    text: "Is Rick ever going to let you down?",
                    correct: "No",
                    taunt: "Come on, you know this."
                },
                {
                    text: "Is Rick ever going to run around?",
                    correct: "No",
                    taunt: "Rick would never. Never."
                },
                {
                    text: "Is Rick ever going to  desert you?",
                    correct: "No",
                    taunt: "Rick loves us too much."
                },
                {
                    text: "Is Rick ever going to make you cry?",
                    correct: "No",
                    taunt: "He's Rick Astley. Show some respect."
                },
                {
                    text: "Is Rick ever going to say goodbye?",
                    correct: "No",
                    taunt: "You clearly haven't been paying attention."
                }
            ];

            let current = 0;

            const questionText = document.getElementById("question-text");
            const feedback = document.getElementById("feedback");
            const btnYes = document.getElementById("btn-yes");
            const btnNo = document.getElementById("btn-no");
            const overlay = document.getElementById("goodbye-msg");

            function loadQuestion() {
                questionText.innerText = questions[current].text;
                feedback.innerText = "";
            }

            function handleAnswer(answer) {
                const q = questions[current];

                if (answer === q.correct) {
                    feedback.style.color = "";
                    feedback.innerText = "";
                    current++;

                    if (current >= questions.length) {
                        // show goodbye popup then redirect
                        overlay.style.display = "flex";
                        setTimeout(() => {
                            window.location.href = "/"; // change to your next page
                        }, 4000);
                    } else {
                        loadQuestion();
                    }
                } else {
                    feedback.style.color = "#dc3545";
                    feedback.innerText = q.taunt;
                }
            }

            btnYes.addEventListener("click", () => handleAnswer("Yes"));
            btnNo.addEventListener("click", () => handleAnswer("No"));

            loadQuestion();