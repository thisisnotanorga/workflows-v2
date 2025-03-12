//Cheat.js | Automaticly completes the quiz, works also if you already made it

function autoCompleteQuiz() {
    const quizContainer = document.querySelector('.quiz-container');
    if (quizContainer) {
        quizContainer.open = true;
        log('Quiz opened!', 'success');
    } else {
        log('Quiz container not found!', 'error');
        return;
    }

    createQuestions();
    log('Recreated questions!', 'success')
    

    qa.forEach((question, index) => {
        const correctAnswer = question.answer;
        const input = document.querySelector(`input[name="q${index}"][value="${correctAnswer}"]`);
        setTimeout(() => {
            if (input) {
                input.checked = true;
                log(`Set ${index} to '${correctAnswer}'!`, 'success');
            }
        }, index * 100);
    });

    setTimeout(() => {
        checkQuizResponses();
    }, qa.length * 100);
}
