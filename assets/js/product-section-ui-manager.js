/**
 * Модуль управления UI элементами для Product Section
 * Отвечает за инициализацию DOM элементов и обработку событий
 */



class UIManager {
  constructor(config, dateManager, dishesManager, priceManager) {
    this.config = config;
    this.dateManager = dateManager;
    this.dishesManager = dishesManager;
    this.priceManager = priceManager;
    
    // SettingsPanelBuilder для динамического создания панели
    this.settingsPanelBuilder = null;
    
    // Флаг для избежания пересчета цены во время инициализации
    this.isInitializing = false;
    
    // DOM элементы
    this.elements = {
      // Day navigation
      prevBtn: null,
      nextBtn: null,
      daysContainer: null,
      dayItems: null,
      
      // Calorie options
      calorieOptions: null,
      calorieOptionsContainer: null,
      
      // Diet options
      dietOptions: null,
      
      // Meal options
      toggleSwitches: null,
      
      // Price elements
      totalPriceElement: null,
      pricePeriodElement: null
    };
    
    this.isInitialized = false;
  }

  /**
   * Инициализирует все DOM элементы
   */
  initializeDOMElements() {
    // Day navigation
    this.elements.prevBtn = document.querySelector('.prev-btn');
    this.elements.nextBtn = document.querySelector('.next-btn');
    this.elements.daysContainer = document.querySelector('.days-container');
    this.elements.dayItems = document.querySelectorAll('.day-item');
    
    // Calorie options
    this.elements.calorieOptions = document.querySelectorAll('.calorie-option');
    this.elements.calorieOptionsContainer = document.querySelector('.calorie-options');
    
    // Diet options
    this.elements.dietOptions = document.querySelectorAll('.diet-option');
    
    // Meal options
    this.elements.toggleSwitches = document.querySelectorAll('.toggle-switch');
    
    // Price elements
    this.elements.totalPriceElement = document.querySelector('.total-price');
    this.elements.pricePeriodElement = document.querySelector('.price-period');
    
    // console.log('DOM elements initialized:', this.elements);
  }

  /**
   * Инициализирует все обработчики событий
   */
  initializeEventListeners() {
    this.initializeDayNavigation();
    this.initializeCalorieOptions();
    this.initializeDietOptions();
    this.initializeMealOptions();
    this.initializeAllergenElements();
    
    // console.log('Event listeners initialized');
  }

  /**
   * Инициализирует навигацию по дням
   */
  initializeDayNavigation() {
    if (this.elements.prevBtn && this.elements.nextBtn && this.elements.daysContainer && this.elements.dayItems.length > 0) {
      this.elements.prevBtn.addEventListener('click', () => {
        if (this.dateManager.goToPreviousDay()) {
          this.updateDays();
        }
      });

      this.elements.nextBtn.addEventListener('click', () => {
        if (this.dateManager.goToNextDay()) {
          this.updateDays();
        }
      });

      // Инициализация при загрузке страницы - всегда обновляем дни
      this.updateDays();
    }
  }

  /**
   * Инициализирует опции калорийности
   */
  initializeCalorieOptions() {
    if (this.elements.calorieOptions && this.elements.calorieOptions.length > 0) {
      this.elements.calorieOptions.forEach(option => {
        option.addEventListener('click', () => {
          this.setActiveCalorieOption(option);
        });
      });

      // Инициализация - устанавливаем рамку на первый активный элемент калорийности
      const initialActive = document.querySelector('.calorie-option.active');
      if (initialActive) {
        this.setActiveCalorieOption(initialActive);
      }
    }
  }

  /**
   * Инициализирует опции диеты
   */
  initializeDietOptions() {
    if (this.elements.dietOptions && this.elements.dietOptions.length > 0) {
      this.elements.dietOptions.forEach(option => {
        option.addEventListener('click', () => {
          this.setActiveDietOption(option);
        });
      });
    }
  }

  /**
   * Инициализирует опции приемов пищи
   */
  initializeMealOptions() {
    if (this.elements.toggleSwitches && this.elements.toggleSwitches.length > 0) {
      this.elements.toggleSwitches.forEach(switchElement => {
        switchElement.addEventListener('click', () => {
          this.toggleSwitch(switchElement);
        });
      });
    }
  }

  /**
   * Инициализирует элементы аллергенов
   * Теперь аллергены создаются динамически в SettingsPanelBuilder
   */
  initializeAllergenElements() {
    // Проверяем, включены ли аллергены в конфигурации
    const allergenConfig = window.PRODUCT_CONFIG?.allergens || this.config?.PRODUCT_CONFIG?.allergens;
    
    if (!allergenConfig?.enabled) {
      // Аллергены отключены - они не будут созданы в SettingsPanelBuilder
      return;
    }
    
    // Обновляем информационный блок аллергенов из конфигурации
    if (typeof updateAllergenInfo === 'function') {
      updateAllergenInfo();
    }
    
    // Проверяем, есть ли глобальная функция инициализации аллергенов
    if (typeof initializeAllergenElements === 'function') {
      initializeAllergenElements();
    }
    
    if (typeof initializeAllergenEventListeners === 'function') {
      initializeAllergenEventListeners();
    }
    
    if (typeof generateAllergenItems === 'function' && this.config.allergensData) {
      generateAllergenItems(this.config.allergensData);
    } else {
      console.warn('⚠️ Данные аллергенов не найдены или функция generateAllergenItems недоступна');
    }
  }

  /**
   * Обновляет отображение дней
   */
  updateDays() {
    // Получаем данные для текущего индекса
    const currentDayData = this.dateManager.getCurrentDayData();
    
    if (!currentDayData) {
      console.error('No data for current index:', this.dateManager.getCurrentIndex());
      return;
    }
    
    // Обновляем текст текущего дня
    const currentDay = this.elements.dayItems[0];
    if (currentDay) {
      currentDay.textContent = currentDayData.displayText;
    }
    
    // Обновляем отображение блюд и КБЖУ
    this.dishesManager.updateDishesAndNutrition();
    
    // console.log('Day updated:', {
    //   displayText: currentDayData.displayText,
    //   calendarDate: currentDayData.date.toDateString(),
    //   programDay: currentDayData.programDayIndex + 1,
    //   navigationIndex: this.dateManager.getCurrentIndex() + 1
    // });
  }

  /**
   * Устанавливает активную опцию калорийности
   * @param {HTMLElement} clickedOption - нажатая опция
   */
  setActiveCalorieOption(clickedOption) {
    // Убираем активный класс у всех кнопок
    this.elements.calorieOptions.forEach(option => {
      option.classList.remove('active');
    });
    
    // Добавляем активный класс к нажатой кнопке
    clickedOption.classList.add('active');
    
    // Получаем позицию и размер активной кнопки
    const activeRect = clickedOption.getBoundingClientRect();
    const containerRect = this.elements.calorieOptionsContainer.getBoundingClientRect();
    
    // Вычисляем позицию рамки относительно контейнера
    const left = activeRect.left - containerRect.left;
    const width = activeRect.width;
    
    // Применяем стили к псевдоэлементу через CSS переменные
    this.elements.calorieOptionsContainer.style.setProperty('--active-left', `${left}px`);
    this.elements.calorieOptionsContainer.style.setProperty('--active-width', `${width}px`);
    
    // Получаем значение калорий из нажатой кнопки
    const calorieValue = clickedOption.querySelector('.calorie-value').textContent;
    // console.log('Selected calorie option:', calorieValue);
    
    // Пересчитываем цену при изменении калорийности (только если не во время инициализации)
    if (!this.isInitializing) {
      this.priceManager.recalculateTotalPrice();
    }
    
    // Обновляем отображение блюд и КБЖУ при изменении калорийности
    this.dishesManager.updateDishesAndNutrition();
    
    // Сохраняем настройки
    this.saveSettings();
  }

  /**
   * Устанавливает активную опцию диеты
   * @param {HTMLElement} clickedOption - нажатая опция
   */
  setActiveDietOption(clickedOption) {
    // Убираем активный класс у всех кнопок
    this.elements.dietOptions.forEach(option => {
      option.classList.remove('active');
    });
    
    // Добавляем активный класс к нажатой кнопке
    clickedOption.classList.add('active');
    
    // Получаем значение диеты из нажатой кнопки
    const dietValue = clickedOption.textContent;
    // console.log('Selected diet option:', dietValue);
    
    // Пересчитываем цену при изменении диеты (если у диет разные цены)
    this.priceManager.recalculateTotalPrice();
    
    // Сохраняем настройки
    this.saveSettings();
  }

  /**
   * Переключает состояние переключателя приема пищи
   * @param {HTMLElement} clickedSwitch - нажатый переключатель
   */
  toggleSwitch(clickedSwitch) {
    // Переключаем состояние
    clickedSwitch.classList.toggle('active');
    
    // Получаем текст опции
    const optionText = clickedSwitch.parentElement.querySelector('span').textContent;
    const isActive = clickedSwitch.classList.contains('active');
    
    // console.log('Toggle switch:', {
    //   option: optionText,
    //   active: isActive
    // });
    
    // Пересчитываем цену при изменении приемов пищи
    this.priceManager.recalculateTotalPrice();
    
    // Обновляем отображение блюд и КБЖУ при изменении приемов пищи
    this.dishesManager.updateDishesAndNutrition();
    
    // Логируем обновленную конфигурацию при изменении meal options
    if (window.logSelectedConfiguration && typeof window.logSelectedConfiguration === 'function') {
      window.logSelectedConfiguration();
    }
    
    // Обновляем чекбокс "с супом" при изменении meal options
    if (window.markSoupCheckbox && typeof window.markSoupCheckbox === 'function') {
      // Получаем текущие meal options
      const toggleSwitches = document.querySelectorAll('.meal-option .toggle-switch');
      let mealOptions = '';
      if (toggleSwitches.length > 0) {
        const selectedMeals = [];
        toggleSwitches.forEach((toggle, index) => {
          if (toggle.classList.contains('active')) {
            const optionText = toggle.closest('.meal-option').querySelector('span');
            if (optionText) {
              selectedMeals.push(optionText.textContent);
            }
          }
        });
        mealOptions = selectedMeals.join(', ');
      }
      window.markSoupCheckbox(mealOptions);
    }
    
    // Обновляем чекбокс "с перекусом" при изменении meal options
    if (window.markSnackCheckbox && typeof window.markSnackCheckbox === 'function') {
      // Получаем текущие meal options
      const toggleSwitches = document.querySelectorAll('.meal-option .toggle-switch');
      let mealOptions = '';
      if (toggleSwitches.length > 0) {
        const selectedMeals = [];
        toggleSwitches.forEach((toggle, index) => {
          if (toggle.classList.contains('active')) {
            const optionText = toggle.closest('.meal-option').querySelector('span');
            if (optionText) {
              selectedMeals.push(optionText.textContent);
            }
          }
        });
        mealOptions = selectedMeals.join(', ');
      }
      window.markSnackCheckbox(mealOptions);
    }
    
    // Обновляем чекбокс "Понизить глютен" при изменении meal options
    if (window.markGlutenCheckbox && typeof window.markGlutenCheckbox === 'function') {
      // Получаем текущие meal options
      const toggleSwitches = document.querySelectorAll('.meal-option .toggle-switch');
      let mealOptions = '';
      if (toggleSwitches.length > 0) {
        const selectedMeals = [];
        toggleSwitches.forEach((toggle, index) => {
          if (toggle.classList.contains('active')) {
            const optionText = toggle.closest('.meal-option').querySelector('span');
            if (optionText) {
              selectedMeals.push(optionText.textContent);
            }
          }
        });
        mealOptions = selectedMeals.join(', ');
      }
      window.markGlutenCheckbox(mealOptions);
    }
    
    // Обновляем чекбокс "Убрать завтрак и перекус" при изменении meal options
    if (window.markBreakfastCheckbox && typeof window.markBreakfastCheckbox === 'function') {
      // Получаем текущие meal options
      const toggleSwitches = document.querySelectorAll('.meal-option .toggle-switch');
      let mealOptions = '';
      if (toggleSwitches.length > 0) {
        const selectedMeals = [];
        toggleSwitches.forEach((toggle, index) => {
          if (toggle.classList.contains('active')) {
            const optionText = toggle.closest('.meal-option').querySelector('span');
            if (optionText) {
              selectedMeals.push(optionText.textContent);
            }
          }
        });
        mealOptions = selectedMeals.join(', ');
      }
      window.markBreakfastCheckbox(mealOptions);
    }
    
    // Обновляем чекбокс "Убрать ужин и перекус" при изменении meal options
    if (window.markDinnerCheckbox && typeof window.markDinnerCheckbox === 'function') {
      // Получаем текущие meal options
      const toggleSwitches = document.querySelectorAll('.meal-option .toggle-switch');
      let mealOptions = '';
      if (toggleSwitches.length > 0) {
        const selectedMeals = [];
        toggleSwitches.forEach((toggle, index) => {
          if (toggle.classList.contains('active')) {
            const optionText = toggle.closest('.meal-option').querySelector('span');
            if (optionText) {
              selectedMeals.push(optionText.textContent);
            }
          }
        });
        mealOptions = selectedMeals.join(', ');
      }
      window.markDinnerCheckbox(mealOptions);
    }
    
    // Сохраняем настройки
    this.saveSettings();
  }

  /**
   * Обновляет название программы
   */
  updateProgramTitle() {
    const titleElement = document.getElementById('program-title');
    if (titleElement) {
      const programName = this.config.getProgramName();
      titleElement.textContent = programName;
      // console.log('Program title updated:', programName);
    }
  }

  /**
   * Сохраняет настройки в localStorage
   */
  saveSettings() {
    // ОТКЛЮЧЕНО: Не сохраняем НИЧЕГО в localStorage
    // При перезагрузке страницы все настройки должны сбрасываться к значениям по умолчанию
    return;
  }

  /**
   * Загружает настройки из localStorage
   */
  loadSettings() {
    // ОТКЛЮЧЕНО: Не загружаем НИЧЕГО из localStorage
    // При каждой загрузке страницы используются только значения по умолчанию из конфигурации
    return;
  }

  /**
   * Инициализирует UI
   */
  initialize() {
    // Создаем и инициализируем панель настроек
    this.buildSettingsPanel();
    
    this.isInitialized = true;
    // console.log('UI Manager initialized');
  }

  /**
   * Создает панель настроек динамически
   */
  buildSettingsPanel() {
    // Загружаем SettingsPanelBuilder если еще не загружен
    if (typeof SettingsPanelBuilder === 'undefined') {
      console.warn('SettingsPanelBuilder not found, trying to load...');
      // В продакшене этот файл должен быть подключен заранее
      return;
    }

    // Создаем callback для инициализации остальных элементов после создания панели
    const onPanelComplete = () => {
      // Устанавливаем флаг инициализации
      this.isInitializing = true;
      
      // Инициализируем DOM элементы после создания панели
      this.initializeDOMElements();
      this.initializeEventListeners();
      this.updateProgramTitle();
      this.priceManager.initializePriceElements();
      this.initializeAllergenElements();
      
      // Сбрасываем флаг инициализации и делаем первый пересчет цены
      this.isInitializing = false;
      this.priceManager.recalculateTotalPrice();
    };

    this.settingsPanelBuilder = new SettingsPanelBuilder(this.config, onPanelComplete);
    this.settingsPanelBuilder.build();
    
    console.log('Settings panel built dynamically');
  }
}

// Экспортируем класс для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIManager;
} else {
  window.UIManager = UIManager;
}
;
