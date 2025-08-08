// Advantages Section JavaScript
function initAdvantagesSection() {
    const advantageButton = document.querySelector('.advantage-card__button');
    
    if (advantageButton) {
        advantageButton.addEventListener('click', function() {
            // Открываем поп-ап с квизом
            if (typeof openQuizPopup === 'function') {
                openQuizPopup();
            } else {
                console.log('Quiz popup not available');
            }
        });
    }
}

initAdvantagesSection();