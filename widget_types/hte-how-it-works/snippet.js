// How It Works Section JavaScript
function initHowItWorks() {
    const startEatingBtn = document.querySelector('.start-eating-btn');
    
    if (startEatingBtn) {
        startEatingBtn.addEventListener('click', function() {
            // Открываем поп-ап с квизом
            if (typeof openQuizPopup === 'function') {
                openQuizPopup();
            } else {
                console.log('Quiz popup not available');
            }
        });
    }
}

initHowItWorks();