// Programs Section JavaScript
function initProgramsSection() {
    // Проверяем, что элементы существуют
    const tabButtons = document.querySelectorAll('.tab-button');
    const programCards = document.querySelectorAll('.program-card');
    const individualCard = document.querySelector('.program-card[data-category="individual"]');

    // Если элементы не найдены, выходим
    if (!tabButtons.length || !programCards.length) {
        console.warn('Programs section elements not found');
        return;
    }

    // Tab switching functionality
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Filter cards based on selected tab
            filterCards(targetTab);
        });
    });

    function filterCards(selectedTab) {
        // Get all regular cards (excluding individual)
        const regularCards = Array.from(programCards).filter(card => 
            card.getAttribute('data-category') !== 'individual'
        );

        if (selectedTab === 'all') {
            // Show all regular cards
            regularCards.forEach(card => {
                showCard(card);
            });
        } else {
            // Define which cards to show for each tab (exactly 3 cards per tab)
            const tabCardMappings = {
                'daily': ['premium', 'base', 'start'],
                'weight-loss': ['start', 'detox', 'reload'],
                'sport': ['sport', 'premium', 'base']
            };
            
            const targetCategories = tabCardMappings[selectedTab] || [];
            
            // Show/hide cards based on selected tab
            regularCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                if (targetCategories.includes(cardCategory)) {
                    showCard(card);
                } else {
                    hideCard(card);
                }
            });
        }
        
        // Individual card is always visible
        if (individualCard) {
            showCard(individualCard);
        }
    }

    function showCard(card) {
        card.style.display = 'flex';
    }

    function hideCard(card) {
        card.style.display = 'none';
    }

    // Initialize with "all" tab active
    const allTab = document.querySelector('.tab-button[data-tab="all"]');
    if (allTab) {
        allTab.classList.add('active');
        filterCards('all');
    }
    
    // Quiz button functionality
    const quizButton = document.querySelector('.quiz-button');
    if (quizButton) {
        quizButton.addEventListener('click', function() {
            // Открываем поп-ап с квизом
            if (typeof openQuizPopup === 'function') {
                openQuizPopup();
            } else {
                console.log('Quiz popup not available');
            }
        });
    }
    
    // Individual program button functionality
    const individualProgramBtn = document.querySelector('.program-card .add-to-cart-btn');
    if (individualProgramBtn) {
        individualProgramBtn.addEventListener('click', function() {
            // Открываем поп-ап с квизом
            if (typeof openQuizPopup === 'function') {
                openQuizPopup();
            } else {
                console.log('Quiz popup not available');
            }
        });
    }
} 

initProgramsSection();