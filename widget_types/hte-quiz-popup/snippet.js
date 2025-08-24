// Quiz Popup JavaScript
class QuizPopup {
    constructor() {
        this.overlay = document.getElementById('quiz-popup-overlay');
        this.closeBtn = document.getElementById('quiz-popup-close');
        this.nextBtn = document.getElementById('quiz-next-btn');
        this.backBtn = document.getElementById('quiz-back-btn');
        this.options = document.querySelectorAll('.quiz-option');
        this.selectedOption = null;
        this.currentStep = 1;
        this.answers = {};
        
        // Проверяем, что все необходимые элементы найдены
        if (!this.overlay) {
            console.error('Quiz popup overlay not found. HTML component may not be loaded yet.');
            return;
        }
        
        if (!this.closeBtn) {
            console.warn('Quiz popup close button not found.');
        }
        
        if (!this.nextBtn) {
            console.warn('Quiz popup next button not found.');
        }
        
        if (this.options.length === 0) {
            console.warn('Quiz popup options not found.');
        }
        
        console.log('QuizPopup constructor: Elements found - overlay:', !!this.overlay, 'closeBtn:', !!this.closeBtn, 'nextBtn:', !!this.nextBtn, 'options:', this.options.length);
        
        this.init();
    }
    
    init() {
        // Проверяем, что overlay существует перед инициализацией
        if (!this.overlay) {
            console.error('Cannot initialize quiz popup: overlay not found');
            return;
        }
        
        // Close button event
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }
        
        // Overlay click to close
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });
        
        // Option selection events
        this.options.forEach(option => {
            option.addEventListener('click', () => this.selectOption(option));
        });
        
        // Next button event
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextStep());
        }
        
        // Back button event
        if (this.backBtn) {
            this.backBtn.addEventListener('click', () => this.prevStep());
        }
        
        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });
        
        // Program item click handlers
        this.initProgramItemClickHandlers();
        
        // Setup quiz popup link handlers
        this.setupQuizPopupLinks();
        
        console.log('Quiz popup initialized successfully');
    }
    
    open() {
        if (this.overlay) {
            this.overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            console.log('Quiz popup opened');
        } else {
            console.error('Cannot open quiz popup: overlay not found');
        }
    }
    
    close() {
        if (this.overlay) {
            this.overlay.classList.remove('active');
            document.body.style.overflow = '';
            this.reset();
        }
    }
    
    isOpen() {
        return this.overlay && this.overlay.classList.contains('active');
    }
    
    // Проверка готовности поп-апа
    isReady() {
        return this.overlay && this.closeBtn && this.nextBtn;
    }
    
    selectOption(option) {
        // Remove previous selection in current step
        const currentStepElement = document.querySelector(`.quiz-step[data-step="${this.currentStep}"]`);
        if (currentStepElement) {
            const stepOptions = currentStepElement.querySelectorAll('.quiz-option');
            stepOptions.forEach(opt => {
                opt.classList.remove('selected');
                const radio = opt.querySelector('.quiz-option-radio');
                if (radio) {
                    radio.setAttribute('data-active', 'no');
                }
            });
        }
        
        // Select new option
        option.classList.add('selected');
        const radio = option.querySelector('.quiz-option-radio');
        if (radio) {
            radio.setAttribute('data-active', 'yes');
        }
        
        this.selectedOption = option.getAttribute('data-value');
        console.log('Option selected:', this.selectedOption, 'for step:', this.currentStep);
        
        // Enable next button
        if (this.nextBtn) {
            this.nextBtn.disabled = false;
        }
    }
    
    nextStep() {
        console.log('nextStep called, currentStep:', this.currentStep);
        
        if (!this.selectedOption) return;
        
        // Save current answer
        this.answers[`step${this.currentStep}`] = this.selectedOption;
        
        // Check for individual program (fast path)
        if (this.currentStep === 1 && this.selectedOption === 'individual') {
            console.log('Individual program selected - fast path to results');
            this.showResults();
            return;
        }
        
        // Check for high calorie selection (skip step 3)
        if (this.currentStep === 2 && parseInt(this.selectedOption) >= 2300) {
            console.log('High calorie selected - skip step 3, go to results');
            this.showResults();
            return;
        }
        
        if (this.currentStep < 4) {
            this.currentStep++;
            console.log('Moving to step:', this.currentStep);
            this.showStep(this.currentStep);
        }
        // Note: No else clause needed since step 4 doesn't have a next button
    }
    
    showResults() {
        console.log('showResults method called');
        console.log('Current answers:', this.answers);
        
        // Use the new showStep logic for step 4
        this.currentStep = 4;
        this.showStep(4);
    }
    
    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
        }
    }
    
    showStep(step) {
        console.log('showStep called with step:', step);
        
        // Hide all steps
        document.querySelectorAll('.quiz-step').forEach(stepEl => {
            stepEl.style.display = 'none';
        });
        
        // Hide all headers
        document.querySelectorAll('.quiz-header').forEach(headerEl => {
            headerEl.style.display = 'none';
        });
        
        // Filter step 2 options based on step 1 selection
        if (step === 2) {
            this.filterStep2Options();
        }
        
        // Show current step
        const currentStepEl = document.querySelector(`.quiz-step[data-step="${step}"]`);
        if (currentStepEl) {
            currentStepEl.style.display = 'block';
        }
        
        // Show current header
        const currentHeaderEl = document.querySelector(`.quiz-header[data-step="${step}"]`);
        if (currentHeaderEl) {
            currentHeaderEl.style.display = 'block';
        }
        
        // Update progress
        this.updateProgress(step);
        
        // Show/hide back button
        if (this.backBtn) {
            this.backBtn.style.display = step > 1 ? 'inline-flex' : 'none';
        }
        
        // Special handling for step 4 (results)
        if (step === 4) {
            console.log('🎯 Step 4 reached - showing results immediately');
            this.showAppropriateProgramItems();
            
            // Hide next button on step 4 - results are shown immediately
            if (this.nextBtn) {
                this.nextBtn.style.display = 'none';
            }
        } else {
            // Regular step handling
            if (this.nextBtn) {
                const nextBtnText = this.nextBtn.querySelector('.quiz-next-btn-text');
                if (nextBtnText) {
                    nextBtnText.textContent = 'Дальше';
                    console.log('Button text set to:', nextBtnText.textContent, 'for step:', step);
                }
                
                // Show buttons for all steps
                this.nextBtn.style.display = 'inline-flex';
            }
            
            // Reset selection for new step
            this.selectedOption = null;
            if (this.nextBtn) {
                this.nextBtn.disabled = true;
            }
            
            // Restore previous selection if exists
            const savedAnswer = this.answers[`step${step}`];
            if (savedAnswer) {
                const option = document.querySelector(`.quiz-step[data-step="${step}"] .quiz-option[data-value="${savedAnswer}"]`);
                if (option) {
                    this.selectOption(option);
                }
            }
        }
    }
    
    filterStep2Options() {
        const step1Answer = this.answers.step1;
        const step2Options = document.querySelectorAll('.quiz-step[data-step="2"] .quiz-option');
        
        step2Options.forEach(option => {
            const goalType = option.getAttribute('data-goal');
            if (goalType && goalType !== step1Answer) {
                option.style.display = 'none';
            } else {
                option.style.display = 'flex';
            }
        });
    }
    
    showAppropriateProgramItems() {
        const step2Answer = this.answers.step2;
        const step3Answer = this.answers.step3;
        
        // Helper function to log program with calories
        const logProgramWithCalories = (programName, expectedCalories, element) => {
            if (element) {
                const caloriesElement = element.querySelector('.quiz-program-item-calories');
                const caloriesText = caloriesElement ? caloriesElement.textContent : 'N/A';
                console.log(`✅ ${programName}: SHOWN (${expectedCalories} КК) - HTML shows: ${caloriesText}`);
            }
        };
        
        console.log('=== QUIZ RESULTS ANALYSIS ===');
        console.log('showAppropriateProgramItems called');
        console.log('step2Answer (calories):', step2Answer);
        console.log('step3Answer (preferences):', step3Answer);
        console.log('all answers:', this.answers);
        
        // Hide all program items initially
        const allItems = document.querySelectorAll('.quiz-programs-list .quiz-program-item:not(.individual-program-item)');
        allItems.forEach(item => {
            item.style.display = 'none';
        });
        
        // Always show individual program item
        const individualItem = document.querySelector('.quiz-programs-list .individual-program-item');
        if (individualItem) {
            individualItem.style.display = 'flex';
            console.log('✅ Individual Program: ALWAYS SHOWN');
        }
        
        // Show appropriate items based on calorie selection
        if (!step2Answer) {
            console.log('❌ No step2Answer, returning early');
            return;
        }
        
        if (step2Answer === '2300') {
            console.log('🎯 Showing Sport Program for 2300 calories');
            const sportItem = document.querySelector('.quiz-programs-list .sport-program-item');
            if (sportItem) {
                sportItem.style.display = 'flex';
                logProgramWithCalories('Sport Program', '2300', sportItem);
            }
        } else if (step2Answer === '2800') {
            console.log('🎯 Showing Sport Program for 2800 calories');
            const sport2800Item = document.querySelector('.quiz-programs-list .sport-2800-program-item');
            if (sport2800Item) {
                sport2800Item.style.display = 'flex';
                logProgramWithCalories('Sport Program', '2800', sport2800Item);
            }
        } else if (step2Answer === '1800') {
            console.log('🎯 Processing 1800 calories');
            // Show items based on step 3 preferences
            if (!step3Answer) {
                console.log('❌ No step3Answer for 1800 calories, returning early');
                return;
            }
            
            if (step3Answer === 'no-preference') {
                console.log('📋 For 1800 calories + no-preference: showing Premium 1800 + Base 1800');
                const premium1800NoPrefItem = document.querySelector('.quiz-programs-list .premium-1800-no-preference-item');
                const base1800Item = document.querySelector('.quiz-programs-list .base-1800-program-item');
                
                if (premium1800NoPrefItem) {
                    premium1800NoPrefItem.style.display = 'flex';
                    logProgramWithCalories('Premium Program', '1800', premium1800NoPrefItem);
                }
                if (base1800Item) {
                    base1800Item.style.display = 'flex';
                    logProgramWithCalories('Base Program', '1800', base1800Item);
                }
            } else if (step3Answer === 'pescatarian') {
                console.log('📋 For 1800 calories + pescatarian: showing Premium 1800 with pescatarian option');
                const premium1800PescatarianItem = document.querySelector('.quiz-programs-list .premium-1800-pescatarian-item');
                if (premium1800PescatarianItem) {
                    premium1800PescatarianItem.style.display = 'flex';
                    logProgramWithCalories('Premium Program with pescatarian option', '1800', premium1800PescatarianItem);
                }
            } else if (step3Answer === 'vegetarian') {
                console.log('📋 For 1800 calories + vegetarian: showing Premium 1800 with vegetarian option');
                const premium1800VegetarianItem = document.querySelector('.quiz-programs-list .premium-1800-vegetarian-item');
                if (premium1800VegetarianItem) {
                    premium1800VegetarianItem.style.display = 'flex';
                    logProgramWithCalories('Premium Program with vegetarian option', '1800', premium1800VegetarianItem);
                }
            } else if (step3Answer === 'vegan') {
                console.log('📋 For 1800 calories + vegan: showing Premium 1800 with vegan option');
                const premium1800VeganItem = document.querySelector('.quiz-programs-list .premium-1800-vegan-item');
                if (premium1800VeganItem) {
                    premium1800VeganItem.style.display = 'flex';
                    logProgramWithCalories('Premium Program with vegan option', '1800', premium1800VeganItem);
                }
            }
        } else if (step2Answer === '1300') {
            console.log('🎯 Processing 1300 calories');
            // Show items based on step 3 preferences
            if (!step3Answer) {
                console.log('❌ No step3Answer for 1300 calories, returning early');
                return;
            }
            
            if (step3Answer === 'no-preference') {
                console.log('📋 For 1300 calories + no-preference: showing Premium 1300 + Base 1300 + Start 1300');
                const premium1300NoPrefItem = document.querySelector('.quiz-programs-list .premium-1300-no-preference-item');
                const base1300Item = document.querySelector('.quiz-programs-list .base-1300-program-item');
                const start1300Item = document.querySelector('.quiz-programs-list .start-1300-program-item');
                
                if (premium1300NoPrefItem) {
                    premium1300NoPrefItem.style.display = 'flex';
                    logProgramWithCalories('Premium Program', '1300', premium1300NoPrefItem);
                }
                if (base1300Item) {
                    base1300Item.style.display = 'flex';
                    logProgramWithCalories('Base Program', '1300', base1300Item);
                }
                if (start1300Item) {
                    start1300Item.style.display = 'flex';
                    logProgramWithCalories('Start Program', '1300', start1300Item);
                }
            } else if (step3Answer === 'pescatarian') {
                console.log('📋 For 1300 calories + pescatarian: showing Premium 1300 with pescatarian option');
                const premium1300PescatarianItem = document.querySelector('.quiz-programs-list .premium-1300-pescatarian-item');
                if (premium1300PescatarianItem) {
                    premium1300PescatarianItem.style.display = 'flex';
                    logProgramWithCalories('Premium Program with pescatarian option', '1300', premium1300PescatarianItem);
                }
            } else if (step3Answer === 'vegetarian') {
                console.log('📋 For 1300 calories + vegetarian: showing Premium 1300 with vegetarian option');
                const premium1300VegetarianItem = document.querySelector('.quiz-programs-list .premium-1300-vegetarian-item');
                if (premium1300VegetarianItem) {
                    premium1300VegetarianItem.style.display = 'flex';
                    logProgramWithCalories('Premium Program with vegetarian option', '1300', premium1300VegetarianItem);
                }
            } else if (step3Answer === 'vegan') {
                console.log('📋 For 1300 calories + vegan: showing Premium 1300 with vegan option');
                const premium1300VeganItem = document.querySelector('.quiz-programs-list .premium-1300-vegan-item');
                if (premium1300VeganItem) {
                    premium1300VeganItem.style.display = 'flex';
                    logProgramWithCalories('Premium Program with vegan option', '1300', premium1300VeganItem);
                }
            }
        } else if (step2Answer === '1000') {
            console.log('🎯 Processing 1000 calories');
            // Show items based on step 3 preferences
            if (!step3Answer) {
                console.log('❌ No step3Answer for 1000 calories, returning early');
                return;
            }
            
            if (step3Answer === 'no-preference') {
                console.log('📋 For 1000 calories + no-preference: showing Premium 1000 + Detox + Start 1000');
                const premium1000NoPrefItem = document.querySelector('.quiz-programs-list .premium-1000-no-preference-item');
                const detoxItem = document.querySelector('.quiz-programs-list .detox-program-item');
                const start1000Item = document.querySelector('.quiz-programs-list .start-1000-program-item');
                
                if (premium1000NoPrefItem) {
                    premium1000NoPrefItem.style.display = 'flex';
                    logProgramWithCalories('Premium Program', '1000', premium1000NoPrefItem);
                }
                if (detoxItem) {
                    detoxItem.style.display = 'flex';
                    logProgramWithCalories('Detox Program', '1000', detoxItem);
                }
                if (start1000Item) {
                    start1000Item.style.display = 'flex';
                    logProgramWithCalories('Start Program', '1000', start1000Item);
                }
            } else if (step3Answer === 'pescatarian') {
                console.log('📋 For 1000 calories + pescatarian: showing Premium 1000 with pescatarian option');
                const premium1000PescatarianItem = document.querySelector('.quiz-programs-list .premium-1000-pescatarian-item');
                if (premium1000PescatarianItem) {
                    premium1000PescatarianItem.style.display = 'flex';
                    logProgramWithCalories('Premium Program with pescatarian option', '1000', premium1000PescatarianItem);
                }
            } else if (step3Answer === 'vegetarian') {
                console.log('📋 For 1000 calories + vegetarian: showing Premium 1000 with vegetarian option + Detox');
                const premium1000VegetarianItem = document.querySelector('.quiz-programs-list .premium-1000-vegetarian-item');
                const detoxItem = document.querySelector('.quiz-programs-list .detox-program-item');
                if (premium1000VegetarianItem) {
                    premium1000VegetarianItem.style.display = 'flex';
                    logProgramWithCalories('Premium Program with vegetarian option', '1000', premium1000VegetarianItem);
                }
                if (detoxItem) {
                    detoxItem.style.display = 'flex';
                    logProgramWithCalories('Detox Program', '1000', detoxItem);
                }
            } else if (step3Answer === 'vegan') {
                console.log('📋 For 1000 calories + vegan: showing Premium 1000 with vegan option + Detox');
                const premium1000VeganItem = document.querySelector('.quiz-programs-list .premium-1000-vegan-item');
                const detoxItem = document.querySelector('.quiz-programs-list .detox-program-item');
                if (premium1000VeganItem) {
                    premium1000VeganItem.style.display = 'flex';
                    logProgramWithCalories('Premium Program with vegan option', '1000', premium1000VeganItem);
                }
                if (detoxItem) {
                    detoxItem.style.display = 'flex';
                    logProgramWithCalories('Detox Program', '1000', detoxItem);
                }
            }
        }
        
        console.log('=== QUIZ RESULTS ANALYSIS COMPLETE ===');
    }
    
    initProgramItemClickHandlers() {
        // Map of program item classes to their corresponding pages
        const programPages = {
            'sport-program-item': '/product/sport',
            'sport-2800-program-item': '/product/sport',
            'premium-1000-no-preference-item': '/product/premium',
            'premium-1000-pescatarian-item': '/product/premium',
            'premium-1000-vegetarian-item': '/product/premium',
            'premium-1000-vegan-item': '/product/premium',
            'premium-1300-no-preference-item': '/product/premium',
            'premium-1300-pescatarian-item': '/product/premium',
            'premium-1300-vegetarian-item': '/product/premium',
            'premium-1300-vegan-item': '/product/premium',
            'premium-1800-no-preference-item': '/product/premium',
            'premium-1800-pescatarian-item': '/product/premium',
            'premium-1800-vegetarian-item': '/product/premium',
            'premium-1800-vegan-item': '/product/premium',
            'base-1300-program-item': '/product/base',
            'base-1800-program-item': '/product/base',
            'start-1000-program-item': '/product/start',
            'start-1300-program-item': '/product/start',
            'reload-program-item': '/product/perezagruzka',
            'detox-program-item': '/product/detox',
            'individual-program-item': '/page/individual-program'
        };
        
        // Add click handlers to all program items
        const programItems = document.querySelectorAll('.quiz-program-item');
        programItems.forEach(item => {
            item.addEventListener('click', () => {
                // Find the matching program class
                let programClass = null;
                for (const className of item.classList) {
                    if (programPages[className]) {
                        programClass = className;
                        break;
                    }
                }
                
                if (programClass && programPages[programClass]) {
                    const targetPage = programPages[programClass];
                    console.log(`Opening program page: ${targetPage} for ${programClass}`);
                    
                    // Close quiz popup
                    this.close();
                    
                    // Navigate to the program page
                    window.location.href = targetPage;
                }
            });
        });
    }
    
    updateCalorieIndicator(card, calories) {
        let indicator = card.querySelector('.calorie-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'calorie-indicator';
            card.appendChild(indicator);
        }
        indicator.setAttribute('data-calories', calories);
        indicator.textContent = `${calories} КК`;
    }
    
    updateProgress(step) {
        const stepText = document.querySelector('.quiz-step-text');
        const stepCounter = document.querySelector('.quiz-step-counter');
        const progressSteps = document.querySelectorAll('.quiz-progress-step');
        
        if (stepText) {
            stepText.textContent = `Шаг ${step}`;
        }
        
        if (stepCounter) {
            stepCounter.textContent = `${step}/4`;
        }
        
        progressSteps.forEach((stepEl, index) => {
            if (index < step) {
                stepEl.classList.add('active');
            } else {
                stepEl.classList.remove('active');
            }
        });
    }
    
    reset() {
        console.log('Reset method called');
        
        // Reset all selections
        this.options.forEach(opt => {
            opt.classList.remove('selected');
            const radio = opt.querySelector('.quiz-option-radio');
            if (radio) {
                radio.setAttribute('data-active', 'no');
            }
        });
        
        this.selectedOption = null;
        this.currentStep = 1;
        this.answers = {};
        
        console.log('Reset completed - currentStep:', this.currentStep, 'answers:', this.answers);
        
        // Hide all program items
        const allProgramItems = document.querySelectorAll('.quiz-programs-list .quiz-program-item');
        allProgramItems.forEach(item => {
            item.style.display = 'none';
        });
        
        // Reset to first step
        this.showStep(1);
        
        // Disable next button
        if (this.nextBtn) {
            this.nextBtn.disabled = true;
        }
        
        // Reset button text back to "Дальше"
        const nextBtnText = this.nextBtn?.querySelector('.quiz-next-btn-text');
        if (nextBtnText) {
            nextBtnText.textContent = 'Дальше';
        }
        
        console.log('Reset method finished');
    }
    
    // Настраивает открытие по ссылке
    setupQuizPopupLinks() {
        // Отслеживаем клики по ссылкам с href="#open_quiz_popup"
        const quizPopupLinks = document.querySelectorAll('a[href="#open_quiz_popup"]');
        quizPopupLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('click');
                this.open();
            });
        });
        
        // Отслеживаем клики по кнопкам с href="#open_quiz_popup"
        const quizPopupButtons = document.querySelectorAll('button[href="#open_quiz_popup"]');
        quizPopupButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('click');
                this.open();
            });
        });
        
        // Отслеживаем клики по элементам с data-атрибутом
        const quizPopupDataElements = document.querySelectorAll('[data-href="#open_quiz_popup"]');
        quizPopupDataElements.forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('click');
                this.open();
            });
        });
        
        // Отслеживаем клики по элементам с классом open-quiz-popup
        const quizPopupClassElements = document.querySelectorAll('.open-quiz-popup');
        quizPopupClassElements.forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('click');
                this.open();
            });
        });
        
        console.log('✅ Настройка открытия quiz попапа по ссылке настроена');
    }
}

// Global quiz popup instance
let quizPopup = null;

// Initialize quiz popup
function initQuizPopup() {
    quizPopup = new QuizPopup();
}

// Function to open quiz popup (can be called from other components)
function openQuizPopup() {
    if (quizPopup && quizPopup.isReady && quizPopup.isReady()) {
        quizPopup.open();
    } else {
        console.warn('Quiz popup not ready yet. Please wait for page to fully load.');
        // Попытка инициализации, если поп-ап еще не готов
        if (typeof initQuizPopup === 'function') {
            initQuizPopup();
            setTimeout(() => {
                if (quizPopup && quizPopup.isReady && quizPopup.isReady()) {
                    quizPopup.open();
                } else {
                    console.error('Failed to initialize quiz popup after retry');
                }
            }, 200);
        }
    }
}

// Инициализация теперь происходит через main.js после загрузки HTML компонента

// Export for use in other files
window.openQuizPopup = openQuizPopup; 
window.initQuizPopup = initQuizPopup;

// Инициализируем после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    initQuizPopup();
});         
