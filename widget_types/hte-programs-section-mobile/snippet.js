$(document).ready(function() {
    // Quiz button functionality
    const $quizButton = $('.quiz-button');
    if ($quizButton.length) {
        console.log('Quiz button found!!!!', $quizButton);
        $quizButton.on('click', function() {
            console.log('Quiz button clicked');
            // Открываем поп-ап с квизом
            if (typeof openQuizPopup === 'function') {
                openQuizPopup();
            } else {
                console.log('Quiz popup not available');
            }
        });
    }
});