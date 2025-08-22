// Subscription Popup Auto-Open Manager
class SubscriptionPopupAutoManager {
  constructor() {
    this.storageKey = 'subscription_popup_closed';
    this.subscribedKey = 'subscription_popup_subscribed';
    this.delayMs = 30000; // 30 секунд
    this.rememberHours = 48; // 48 часов
    this.subscribedMonths = 6; // 6 месяцев (полгода)
    this.isInitialized = false;
  }

  // Проверяет, можно ли показать попап
  canShowPopup() {
    // Сначала проверяем, не подписался ли пользователь
    const subscribedData = localStorage.getItem(this.subscribedKey);
    if (subscribedData) {
      try {
        const { timestamp } = JSON.parse(subscribedData);
        const now = Date.now();
        const monthsPassed = (now - timestamp) / (1000 * 60 * 60 * 24 * 30.44); // ~30.44 дней в месяце
        
        if (monthsPassed < this.subscribedMonths) {
          console.log(`⏰ Пользователь подписался ${Math.round(monthsPassed * 100) / 100} месяцев назад, не показываем попап`);
          return false;
        } else {
          // Прошло полгода, удаляем данные о подписке
          localStorage.removeItem(this.subscribedKey);
          console.log('🔄 Прошло полгода с подписки, сбрасываем память');
        }
      } catch (error) {
        console.error('Ошибка чтения данных о подписке:', error);
        localStorage.removeItem(this.subscribedKey);
      }
    }

    // Затем проверяем, не закрывал ли пользователь попап недавно
    const closedData = localStorage.getItem(this.storageKey);
    if (!closedData) return true;

    try {
      const { timestamp } = JSON.parse(closedData);
      const now = Date.now();
      const hoursPassed = (now - timestamp) / (1000 * 60 * 60);
      
      return hoursPassed >= this.rememberHours;
    } catch (error) {
      console.error('Ошибка чтения данных попапа:', error);
      return true;
    }
  }

  // Запоминает, что попап был закрыт
  rememberPopupClosed() {
    const data = {
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      console.log('✅ Попап подписки закрыт, запоминаем на 48 часов');
    } catch (error) {
      console.error('Ошибка сохранения данных попапа:', error);
    }
  }

  // Запоминает, что пользователь подписался
  rememberUserSubscribed() {
    const data = {
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(this.subscribedKey, JSON.stringify(data));
      console.log('🎉 Пользователь подписался! Попап не будет показываться полгода');
    } catch (error) {
      console.error('Ошибка сохранения данных о подписке:', error);
    }
  }

  // Показывает попап
  showPopup() {
    const popup = document.getElementById('subscriptionPopup');
    if (popup) {
      popup.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      // Сбрасываем состояние бабла при каждом открытии
      this.hideCheckboxBubble();
      
      console.log('🎯 Автоматически показываем попап подписки');
    }
  }

  // Инициализирует автоматическое открытие
  init() {
    if (this.isInitialized) return;
    
    // Ждем загрузки компонента попапа
    const checkPopupLoaded = () => {
      const popup = document.getElementById('subscriptionPopup');
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

  // Настраивает основную функциональность попапа (работает всегда)
  setupPopupFunctionality() {
    // Настраиваем отслеживание закрытия попапа
    this.setupCloseTracking();
    
    // Настраиваем валидацию формы (работает всегда)
    this.setupFormValidation();
    
    // Настраиваем открытие по ссылке
    this.setupSubscriptionLink();
    
    // Настраиваем автоматическое открытие (если позволяет память)
    this.setupAutoOpen();
    
    console.log('✅ Основная функциональность попапа настроена');
  }

  // Настраивает автоматическое открытие
  setupAutoOpen() {
    // Проверяем, можно ли показать попап
    if (!this.canShowPopup()) {
      console.log('⏰ Попап подписки недавно закрывался или пользователь подписался, не показываем');
      return;
    }

    // Устанавливаем таймер на 30 секунд
    console.log('⏰ Устанавливаем таймер на показ попапа через 30 секунд');
    
    setTimeout(() => {
      if (this.canShowPopup()) {
        this.showPopup();
      }
    }, this.delayMs);
  }

  // Настраивает валидацию формы (работает всегда)
  setupFormValidation() {
    const subscribeBtn = document.getElementById('subscriptionPopupBtn');
    const agreementCheckbox = document.getElementById('subscriptionAgreement');

    if (!subscribeBtn) return;

    // Обработчик нажатия на кнопку подписки
    subscribeBtn.addEventListener('click', () => {
      // Проверяем, что email введен и галочка поставлена
      const emailInput = document.getElementById('subscriptionEmailInput');
      
      if (emailInput && agreementCheckbox) {
        const email = emailInput.value.trim();
        const isAgreed = agreementCheckbox.checked;
        
        if (email && isAgreed) {
          // Пользователь подписался - показываем экран благодарности
          this.showThanksScreen();
          // Запоминаем подписку
          this.rememberUserSubscribed();
          
          console.log('🎉 Подписка оформлена!');
        } else {
          // Показываем ошибки валидации (всегда, независимо от памяти)
          if (!email) {
            console.log('❌ Введите email');
            // Можно добавить подсветку поля email
          }
          if (!isAgreed) {
            console.log('❌ Согласитесь с политикой конфиденциальности');
            // Показываем бабл для галочки (всегда)
            this.showCheckboxBubble();
          }
        }
      }
    });

    // Обработчик изменения галочки - скрываем бабл при постановке
    if (agreementCheckbox) {
      agreementCheckbox.addEventListener('change', () => {
        if (agreementCheckbox.checked) {
          this.hideCheckboxBubble();
        }
      });
    }

    console.log('✅ Валидация формы настроена');
  }

  // Настраивает отслеживание закрытия попапа
  setupCloseTracking() {
    const popup = document.getElementById('subscriptionPopup');
    const closeBtn = document.getElementById('subscriptionPopupClose');
    const overlay = popup?.querySelector('.popup-overlay');

    if (!popup || !closeBtn || !overlay) return;

    // Функция закрытия с запоминанием
    const closePopup = () => {
      popup.classList.remove('active');
      document.body.style.overflow = '';
      this.rememberPopupClosed();
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

  // Показывает бабл для галочки
  showCheckboxBubble() {
    const bubble = document.getElementById('checkboxBubble');
    if (bubble) {
      bubble.classList.add('show');
      // Автоматически скрываем через 5 секунд
      setTimeout(() => {
        this.hideCheckboxBubble();
      }, 5000);
    }
  }

  // Скрывает бабл для галочки
  hideCheckboxBubble() {
    const bubble = document.getElementById('checkboxBubble');
    if (bubble) {
      bubble.classList.remove('show');
    }
  }

  // Показывает экран благодарности
  showThanksScreen() {
    const popupForm = document.getElementById('popupForm');
    const popupThanks = document.getElementById('popupThanks');
    
    if (popupForm && popupThanks) {
      // Скрываем форму
      popupForm.style.display = 'none';
      // Показываем экран благодарности
      popupThanks.style.display = 'flex';
      
      // Автоматически закрываем попап через 3 секунды
      setTimeout(() => {
        const popup = document.getElementById('subscriptionPopup');
        if (popup) {
          popup.classList.remove('active');
          document.body.style.overflow = '';
        }
      }, 3000);
    }
  }

  // Сбрасывает память о закрытии попапа (для тестирования)
  resetMemory() {
    localStorage.removeItem(this.storageKey);
    console.log('🔄 Память о закрытии попапа сброшена');
  }

  // Сбрасывает память о подписке (для тестирования)
  resetSubscriptionMemory() {
    localStorage.removeItem(this.subscribedKey);
    console.log('🔄 Память о подписке сброшена');
  }

  // Сбрасывает всю память (для тестирования)
  resetAllMemory() {
    this.resetMemory();
    this.resetSubscriptionMemory();
    console.log('🔄 Вся память о попапе сброшена');
  }

  // Показывает статистику
  getStats() {
    const closedData = localStorage.getItem(this.storageKey);
    const subscribedData = localStorage.getItem(this.subscribedKey);
    
    let result = '📊 Статистика попапа:\n\n';
    
    // Информация о закрытии
    if (!closedData) {
      result += '🚫 Попап никогда не закрывался\n';
    } else {
      try {
        const { timestamp } = JSON.parse(closedData);
        const now = Date.now();
        const hoursPassed = (now - timestamp) / (1000 * 60 * 60);
        const remainingHours = Math.max(0, this.rememberHours - hoursPassed);
        
        result += `🕐 Закрыт: ${new Date(timestamp).toLocaleString()}\n`;
        result += `⏱️ Прошло часов: ${Math.round(hoursPassed * 100) / 100}\n`;
        result += `⏳ Осталось часов: ${Math.round(remainingHours * 100) / 100}\n`;
        result += `🎯 Можно показать: ${remainingHours <= 0 ? 'Да' : 'Нет'}\n`;
      } catch (error) {
        result += '❌ Ошибка чтения данных о закрытии\n';
      }
    }
    
    result += '\n';
    
    // Информация о подписке
    if (!subscribedData) {
      result += '📧 Пользователь не подписывался\n';
    } else {
      try {
        const { timestamp } = JSON.parse(subscribedData);
        const now = Date.now();
        const monthsPassed = (now - timestamp) / (1000 * 60 * 60 * 24 * 30.44);
        const remainingMonths = Math.max(0, this.subscribedMonths - monthsPassed);
        
        result += `📧 Подписался: ${new Date(timestamp).toLocaleString()}\n`;
        result += `⏱️ Прошло месяцев: ${Math.round(monthsPassed * 100) / 100}\n`;
        result += `⏳ Осталось месяцев: ${Math.round(remainingMonths * 100) / 100}\n`;
        result += `🎯 Можно показать: ${remainingMonths <= 0 ? 'Да' : 'Нет'}\n`;
      } catch (error) {
        result += '❌ Ошибка чтения данных о подписке\n';
      }
    }
    
    return result;
  }

  // Настраивает открытие по ссылке
  setupSubscriptionLink() {
    // Отслеживаем клики по ссылкам с href="#open_subscription_popup"
    const subscriptionPopupLinks = document.querySelectorAll('a[href="#open_subscription_popup"]');
    subscriptionPopupLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('click');
        this.showPopup();
      });
    });
    
    // Отслеживаем клики по кнопкам с href="#open_subscription_popup"
    const subscriptionPopupButtons = document.querySelectorAll('button[href="#open_subscription_popup"]');
    subscriptionPopupButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('click');
        this.showPopup();
      });
    });
    
    // Отслеживаем клики по элементам с data-атрибутом
    const subscriptionPopupDataElements = document.querySelectorAll('[data-href="#open_subscription_popup"]');
    subscriptionPopupDataElements.forEach(element => {
      element.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('click');
        this.showPopup();
      });
    });
    
    // Отслеживаем клики по элементам с классом open-subscription-popup
    const subscriptionPopupClassElements = document.querySelectorAll('.open-subscription-popup');
    subscriptionPopupClassElements.forEach(element => {
      element.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('click');
        this.showPopup();
      });
    });
    
    console.log('✅ Настройка открытия попапа подписки по ссылке настроена');
  }
}

// Создаем глобальный экземпляр
window.subscriptionPopupAutoManager = new SubscriptionPopupAutoManager();

// Инициализируем после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  subscriptionPopupAutoManager.init();
});

// Что бы открыть попап subscription на кнопку или ссылку нужно либо добавить href="#open_subscription_popup", или класс '.open-subscription-popup', либо дата-атрибут data-href="#open_subscription_popup"