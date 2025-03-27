const questions = [
    {
        question: "Which state has the capital Sacramento?",
        answer: "California"
    },
    {
        question: "Which state has the capital Austin?",
        answer: "Texas"
    }
];

let currentQuestionIndex = 0;
let correctScore = 0;
let incorrectScore = 0;

const questionElement = document.getElementById('question');
const answerInput = document.getElementById('answer-input');
const submitButton = document.getElementById('submit-btn');
const resultContainer = document.getElementById('result');
const resultMessage = document.getElementById('result-message');
const nextButton = document.getElementById('next-btn');
const correctScoreElement = document.getElementById('correct-score');
const incorrectScoreElement = document.getElementById('incorrect-score');

function updateScore() {
    correctScoreElement.textContent = correctScore;
    incorrectScoreElement.textContent = incorrectScore;
}

function triggerConfetti() {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
    }, 250);
}

function displayQuestion() {
    questionElement.textContent = questions[currentQuestionIndex].question;
    answerInput.value = '';
    resultContainer.classList.add('hidden');
    questionElement.parentElement.classList.remove('hidden');
}

function checkAnswer() {
    const userAnswer = answerInput.value.trim();
    const correctAnswer = questions[currentQuestionIndex].answer;
    
    if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
        resultMessage.textContent = "Correct! Well done!";
        resultMessage.className = "correct";
        correctScore++;
        triggerConfetti();
    } else {
        resultMessage.textContent = `Incorrect. The correct answer is ${correctAnswer}.`;
        resultMessage.className = "incorrect";
        incorrectScore++;
    }
    
    updateScore();
    resultContainer.classList.remove('hidden');
    questionElement.parentElement.classList.add('hidden');
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        displayQuestion();
    } else {
        questionElement.textContent = "Quiz completed!";
        answerInput.style.display = 'none';
        submitButton.style.display = 'none';
        resultContainer.classList.add('hidden');
        questionElement.parentElement.classList.remove('hidden');
    }
}

submitButton.addEventListener('click', checkAnswer);
nextButton.addEventListener('click', nextQuestion);
answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkAnswer();
    }
});

// Start the quiz
displayQuestion(); 