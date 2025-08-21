// Feedback Popup Manager
class FeedbackPopupManager {
  constructor() {
    this.isInitialized = false;
  }

  // Инициализирует попап
  init() {
    if (this.isInitialized) return;
    
    // Ждем загрузки компонента попапа
    const checkPopupLoaded = () => {
      const popup = document.getElementById('feedbackPopup');
      if (!popup) {
        // Попап еще не загружен, проверяем через 100ms
        setTimeout(checkPopupLoaded, 100);
        return;
      }

      // Попап загружен, настраиваем функциональность
      this.setupPopupFunctionality();
      this.isInitialized = true;
    };

    checkPopupLoaded();
  }

  // Настраивает функциональность попапа
  setupPopupFunctionality() {
    // Настраиваем отслеживание закрытия попапа
    this.setupCloseTracking();
    
    // Настраиваем валидацию формы
    this.setupFormValidation();
    
    // Настраиваем открытие по ссылке
    this.setupContactLink();
    
    console.log('✅ Функциональность попапа обратной связи настроена');
  }

  // Настраивает отслеживание закрытия попапа
  setupCloseTracking() {
    const popup = document.getElementById('feedbackPopup');
    const closeBtn = document.getElementById('feedbackPopupClose');
    const overlay = popup?.querySelector('.popup-overlay');

    if (!popup || !closeBtn || !overlay) return;

    // Функция закрытия
    const closePopup = () => {
      popup.classList.remove('active');
      document.body.style.overflow = '';
    };

    // Обработчики закрытия
    closeBtn.addEventListener('click', closePopup);
    overlay.addEventListener('click', closePopup);

    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && popup.classList.contains('active')) {
        closePopup();
      }
    });

    console.log('✅ Отслеживание закрытия попапа настроено');
  }

  // Настраивает валидацию формы
  setupFormValidation() {
    const submitBtn = document.getElementById('feedbackPopupBtn');

    if (!submitBtn) return;

    // Обработчик нажатия на кнопку
    submitBtn.addEventListener('click', () => {
      // Сначала очищаем все ошибки
      this.clearAllErrors();
      
      // Проверяем только обязательные поля
      const emailInput = document.getElementById('feedbackEmailInput');
      const wishesInput = document.getElementById('feedbackWishesInput');
      const agreementCheckbox = document.getElementById('feedbackAgreement');
      
      if (emailInput && wishesInput && agreementCheckbox) {
        const email = emailInput.value.trim();
        const wishes = wishesInput.value.trim();
        const isAgreed = agreementCheckbox.checked;
        
        // Простая валидация только обязательных полей
        let isValid = true;
        
        if (!email) {
          this.showFieldError(emailInput, 'Введите email');
          isValid = false;
        }
        
        if (!wishes) {
          this.showFieldError(wishesInput, 'Введите пожелания');
          isValid = false;
        }
        
        if (!isAgreed) {
          this.showCheckboxError(agreementCheckbox, 'Согласитесь с политикой конфиденциальности');
          isValid = false;
        }
        
        if (isValid) {
          // Форма валидна - можно отправлять
          console.log('✅ Форма обратной связи заполнена корректно');
          
          // Получаем значения необязательных полей для логирования
          const nameInput = document.getElementById('feedbackNameInput');
          const phoneInput = document.getElementById('feedbackPhoneInput');
          const name = nameInput ? nameInput.value.trim() : '';
          const phone = phoneInput ? phoneInput.value.trim() : '';
          
          console.log('📝 Данные:', { name, phone, email, wishes, isAgreed });
          
          // Здесь можно добавить логику отправки формы
          // Например, показать сообщение об успехе
          this.showSuccessMessage();
          
        } else {
          // Показываем общую ошибку
          console.log('❌ Форма содержит ошибки валидации');
        }
      }
    });

    // Добавляем обработчики для автоматического очищения ошибок
    this.setupErrorClearing();

    console.log('✅ Валидация формы настроена');
  }

  // Настраивает открытие по ссылке
  setupContactLink() {
    // Отслеживаем клики по ссылкам с href="#contact"
    const contactLinks = document.querySelectorAll('a[href="#contact"]');
    contactLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.showPopup();
      });
    });
    
    // Отслеживаем клики по ссылкам с href="#open_feedback_popup"
    const feedbackPopupLinks = document.querySelectorAll('a[href="#open_feedback_popup"]');
    feedbackPopupLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('click');
        this.showPopup();
      });
    });
    
    // Отслеживаем клики по кнопкам с href="#open_feedback_popup"
    const feedbackPopupButtons = document.querySelectorAll('button[href="#open_feedback_popup"]');
    feedbackPopupButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('click');
        this.showPopup();
      });
    });
    
    // Отслеживаем клики по элементам с data-атрибутом
    const feedbackPopupDataElements = document.querySelectorAll('[data-href="#open_feedback_popup"]');
    feedbackPopupDataElements.forEach(element => {
      element.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('click');
        this.showPopup();
      });
    });
    
    // Отслеживаем клики по элементам с классом open-feedback-popup
    const feedbackPopupClassElements = document.querySelectorAll('.open-feedback-popup');
    feedbackPopupClassElements.forEach(element => {
      element.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('click');
        this.showPopup();
      });
    });
    
    // Отслеживаем изменение URL (включая #contact)
    this.checkUrlForContact();
    
    // Отслеживаем изменения hash в URL
    window.addEventListener('hashchange', () => {
      this.checkUrlForContact();
    });
    
    console.log('✅ Настройка открытия по ссылке настроена');
  }
  
  // Проверяет URL на наличие #contact
  checkUrlForContact() {
    if (window.location.hash === '#contact') {
      this.showPopup();
    }
  }

  // Показывает ошибку для поля ввода
  showFieldError(inputElement, message) {
    const inputField = inputElement.closest('.input-field');
    if (inputField) {
      inputField.classList.add('error');
      const errorMessage = inputField.querySelector('.error-message');
      if (errorMessage) {
        errorMessage.textContent = message;
      }
    }
  }

  // Показывает ошибку для галочки
  showCheckboxError(checkboxElement, message) {
    const checkboxContainer = checkboxElement.closest('.popup-checkbox');
    if (checkboxContainer) {
      checkboxContainer.classList.add('error');
      const errorMessage = checkboxContainer.querySelector('.error-message');
      if (errorMessage) {
        errorMessage.textContent = message;
      }
    }
  }

  // Очищает ошибку для конкретного поля
  clearFieldError(inputElement) {
    const inputField = inputElement.closest('.input-field');
    if (inputField) {
      inputField.classList.remove('error');
    }
  }

  // Очищает ошибку для галочки
  clearCheckboxError(checkboxElement) {
    const checkboxContainer = checkboxElement.closest('.popup-checkbox');
    if (checkboxContainer) {
      checkboxContainer.classList.remove('error');
    }
  }

  // Очищает все ошибки
  clearAllErrors() {
    const errorFields = document.querySelectorAll('.feedback-popup .input-field.error, .feedback-popup .popup-checkbox.error');
    errorFields.forEach(field => {
      field.classList.remove('error');
    });
  }

  // Настраивает автоматическое очищение ошибок при вводе
  setupErrorClearing() {
    const emailInput = document.getElementById('feedbackEmailInput');
    const wishesInput = document.getElementById('feedbackWishesInput');
    const agreementCheckbox = document.getElementById('feedbackAgreement');

    // Очищаем ошибки при вводе в обязательные поля
    if (emailInput) {
      emailInput.addEventListener('input', () => this.clearFieldError(emailInput));
    }
    
    if (wishesInput) {
      wishesInput.addEventListener('input', () => this.clearFieldError(wishesInput));
    }

    // Очищаем ошибку при изменении галочки
    if (agreementCheckbox) {
      agreementCheckbox.addEventListener('change', () => this.clearCheckboxError(agreementCheckbox));
    }

    console.log('✅ Автоматическое очищение ошибок настроено');
  }

  // Показывает сообщение об успехе
  showSuccessMessage() {
    // Скрываем заголовок, форму и картинку
    const popupHeader = document.querySelector('.feedback-popup .popup-header');
    const popupForm = document.querySelector('.feedback-popup .popup-form');
    const popupRightSection = document.querySelector('.feedback-popup .popup-right-section');
    const popupThanks = document.getElementById('popupThanks');
    
    if (popupHeader && popupForm && popupRightSection && popupThanks) {
      // Скрываем заголовок
      popupHeader.style.display = 'none';
      // Скрываем форму
      popupForm.style.display = 'none';
      // Скрываем картинку
      popupRightSection.style.display = 'none';
      // Показываем экран благодарности
      popupThanks.style.display = 'flex';
      
      // Автоматически закрываем попап через 3 секунды
      setTimeout(() => {
        const popup = document.getElementById('feedbackPopup');
        if (popup) {
          popup.classList.remove('active');
          document.body.style.overflow = '';
        }
      }, 3000);
    }
  }

  // Показывает попап
  showPopup() {
    const popup = document.getElementById('feedbackPopup');
    if (popup) {
      popup.classList.add('active');
      document.body.style.overflow = 'hidden';
      console.log('🎯 Показываем попап обратной связи');
    }
  }

  // Скрывает попап
  hidePopup() {
    const popup = document.getElementById('feedbackPopup');
    if (popup) {
      popup.classList.remove('active');
      document.body.style.overflow = '';
      console.log('🚫 Скрываем попап обратной связи');
    }
  }
}

// Создаем глобальный экземпляр
window.feedbackPopupManager = new FeedbackPopupManager();
window.feedbackPopupManager.init();

