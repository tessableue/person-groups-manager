const questions = [
    {
        question: "What is the capital of California?",
        answer: "Sacramento"
    },
    {
        question: "What is the capital of Texas?",
        answer: "Austin"
    }
];

let currentQuestionIndex = 0;

function displayQuestion() {
    const questionElement = document.getElementById('question');
    questionElement.textContent = questions[currentQuestionIndex].question;
    document.getElementById('answer').value = '';
    document.getElementById('result').textContent = '';
    document.getElementById('result').className = '';
}

function checkAnswer() {
    const userAnswer = document.getElementById('answer').value.trim();
    const correctAnswer = questions[currentQuestionIndex].answer;
    const resultElement = document.getElementById('result');
    
    if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
        resultElement.textContent = "Correct! Well done!";
        resultElement.className = "correct";
    } else {
        resultElement.textContent = `Incorrect. The correct answer is ${correctAnswer}.`;
        resultElement.className = "incorrect";
    }

    // Move to next question after a short delay
    setTimeout(() => {
        currentQuestionIndex = (currentQuestionIndex + 1) % questions.length;
        displayQuestion();
    }, 2000);
}

// Initialize the quiz
displayQuestion();

// Add event listener for Enter key
document.getElementById('answer').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        checkAnswer();
    }
}); 