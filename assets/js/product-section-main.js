/**
 * Основной модуль Product Section
 * Универсальная система для всех программ питания
 * Объединяет все подмодули в единую систему
 */

class ProductSection {
  constructor() {
    this.config = null;
    this.dateManager = null;
    this.dishesManager = null;
    this.priceManager = null;
    this.uiManager = null;
    
    this.isInitialized = false;
  }

  /**
   * Инициализирует Product Section с указанными путями к данным
   * @param {Object} options - опции инициализации
   * @param {string} options.configPath - путь к файлу конфигурации
   * @param {string} options.dishesPath - путь к файлу с данными блюд
   * @param {Object} options.allergensConfig - конфигурация аллергенов
   * @param {Object} options.adaptedConfig - адаптированная конфигурация (для Premium)
   * @param {Object} options.adaptedDishesData - адаптированные данные блюд (для Premium)
   * @param {Object} options.premiumAdapter - Premium адаптер (для Premium)
   * @returns {Promise<boolean>} - true если инициализация прошла успешно
   */
  async initialize(options) {
    try {
      // console.log('Initializing Product Section with options:', options);
      
      // Создаем конфигурацию
      this.config = new ProductSectionConfig();
      
      // Проверяем, есть ли основной конфиг (загруженный из HTML)
      if (options.mainConfig) {
        // console.log('Using main config from HTML');
        this.config.PRODUCT_CONFIG = options.mainConfig;
        // Устанавливаем глобальную переменную для доступа из других модулей
        window.PRODUCT_CONFIG = options.mainConfig;
      } else {
        // Стандартная загрузка
        if (options.configPath) {
          await this.config.loadProductConfig(options.configPath);
          // Устанавливаем глобальную переменную
          window.PRODUCT_CONFIG = this.config.PRODUCT_CONFIG;
        }
      }
      
      // Загружаем данные блюд (всегда через loadDishesData)
      const dishesData = await this.config.loadDishesData(options.dishesPath);
      this.config.dishesData = dishesData;
      
      // Инициализируем конфигурацию цен
      this.config.initializePriceConfig();
      
      // Инициализируем данные аллергенов
      if (options.allergensConfig) {
        this.config.initializeAllergensData(options.allergensConfig);
      }
      
      // Инициализируем данные дней
      if (this.config.PRODUCT_CONFIG?.daysData) {
        this.config.initializeDaysData(this.config.PRODUCT_CONFIG.daysData);
      }
      
      // Создаем менеджеры
      this.dateManager = new DateManager(this.config);
      this.dishesManager = new DishesManager(this.config, this.dateManager);
      this.priceManager = new PriceManager(this.config);
      this.uiManager = new UIManager(this.config, this.dateManager, this.dishesManager, this.priceManager);
      
      // Устанавливаем данные блюд в менеджер блюд
      this.dishesManager.setDishesData(this.config.dishesData);
      
      // Инициализируем даты программы
      this.dateManager.initializeProgramDates();
      
      // Инициализируем UI
      this.uiManager.initialize();
      
      // Загружаем настройки
      this.uiManager.loadSettings();
      
      // Обновляем meal options при смене данных (после инициализации UI)
      if (this.uiManager && this.uiManager.settingsPanelBuilder) {
        this.uiManager.settingsPanelBuilder.refreshMealOptions();
      }
      
      // Валидируем структуру данных
      this.validateDataStructure();
      
      this.isInitialized = true;
      // console.log('Product Section initialized successfully');
      
      // Инициализируем аллергены после готовности Product Section
      if (typeof window.initializeAllergensWhenReady === 'function') {
        window.initializeAllergensWhenReady();
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing Product Section:', error);
      return false;
    }
  }

  /**
   * Валидирует структуру данных
   * @returns {boolean} - true если данные валидны
   */
  validateDataStructure() {
    if (!this.config.isConfigLoaded()) {
      console.warn('Data not loaded yet, skipping validation');
      return false;
    }
    
    const configCalories = this.config.getAvailableCalories();
    
    // Проверяем, есть ли множественные файлы данных (Premium случай)
    if (window.ALL_DISHES_DATA && typeof window.ALL_DISHES_DATA === 'object' && !Array.isArray(window.ALL_DISHES_DATA)) {
      // Premium случай: множественные файлы данных
      const dataKeys = Object.keys(window.ALL_DISHES_DATA);
      // console.log(`Premium validation: found ${dataKeys.length} data files`);
      
      // Проверяем, что все комбинации калорийности и диеты загружены
      const expectedKeys = Object.keys(this.config.PRODUCT_CONFIG?.dataFiles || {});
      if (dataKeys.length !== expectedKeys.length) {
        return false;
      }
      
      // console.log('Premium validation passed: all data files loaded');
    } else {
      // Стандартный случай: один файл данных
      const dishesCalories = this.config.dishesData?.calorieOptions || 
                            (this.config.dishesData?.calorieOption ? [parseInt(this.config.dishesData.calorieOption)] : []);
      
      if (configCalories.length !== dishesCalories.length) {
        return false;
      }
      
      for (let i = 0; i < configCalories.length; i++) {
        if (configCalories[i] !== dishesCalories[i]) {
          return false;
        }
      }
    }
    
    // Проверяем структуру данных блюд
    let dishesDataToValidate;
    
    // Для Premium программы берем первый файл данных для валидации
    if (this.config.PRODUCT_CONFIG?.dataFiles) {
      const firstDataKey = Object.keys(this.config.dishesData)[0];
      dishesDataToValidate = this.config.dishesData[firstDataKey];
    } else {
      dishesDataToValidate = this.config.dishesData;
    }
    
    const days = Object.keys(dishesDataToValidate.dishesByDay || {});
    if (days.length === 0) {
      return false;
    }
    
    // Проверяем первый день как пример
    const firstDay = dishesDataToValidate.dishesByDay[days[0]];
    if (!firstDay || !firstDay.dishes || firstDay.dishes.length === 0) {
      return false;
    }
    
    // Проверяем структуру первого блюда
    const firstDish = firstDay.dishes[0];
    if (!firstDish.nutrition || typeof firstDish.nutrition !== 'string') {
      return false;
    }
    
    // Проверяем nutrition только если это не Premium данные (где nutrition - одна строка)
    if (firstDish.nutrition.includes('|')) {
      const nutritionSets = firstDish.nutrition.split('|');
      if (nutritionSets.length !== configCalories.length) {
        return false;
      }
    }
    
    // console.log('Data structure validation passed');
    return true;
  }

  /**
   * Обновляет отображение блюд и КБЖУ
   */
  updateDishesAndNutrition() {
    if (this.dishesManager) {
      this.dishesManager.updateDishesAndNutrition();
    }
  }

  /**
   * Пересчитывает цену
   */
  recalculatePrice() {
    if (this.priceManager) {
      this.priceManager.recalculateTotalPrice();
    }
  }

  /**
   * Обновляет отображение дней
   */
  updateDays() {
    if (this.uiManager) {
      this.uiManager.updateDays();
    }
  }

  /**
   * Сохраняет настройки
   */
  saveSettings() {
    if (this.uiManager) {
      this.uiManager.saveSettings();
    }
  }

  /**
   * Загружает настройки
   */
  loadSettings() {
    if (this.uiManager) {
      this.uiManager.loadSettings();
    }
  }

  /**
   * Получает текущую цену
   * @returns {number} - текущая цена
   */
  getCurrentPrice() {
    return this.priceManager ? this.priceManager.getCurrentPrice() : 0;
  }

  /**
   * Получает название программы
   * @returns {string} - название программы
   */
  getProgramName() {
    return this.config ? this.config.getProgramName() : 'Программа';
  }

  /**
   * Получает статистику по блюдам
   * @returns {Object} - статистика по блюдам
   */
  getDishesStatistics() {
    return this.dishesManager ? this.dishesManager.getDishesStatistics() : null;
  }

  /**
   * Получает детализацию цены
   * @returns {Object} - детализация цены
   */
  getPriceBreakdown() {
    return this.priceManager ? this.priceManager.getPriceBreakdown() : null;
  }

  /**
   * Проверяет, инициализирована ли система
   * @returns {boolean} - true если система инициализирована
   */
  isReady() {
    return this.isInitialized && this.config && this.config.isConfigLoaded();
  }

  /**
   * Получает информацию о системе
   * @returns {Object} - информация о системе
   */
  getSystemInfo() {
    return {
      isInitialized: this.isInitialized,
      isConfigLoaded: this.config ? this.config.isConfigLoaded() : false,
      programName: this.getProgramName(),
      programDuration: this.config ? this.config.getProgramDuration() : 0,
      currentPrice: this.getCurrentPrice(),
      currentDay: this.dateManager ? this.dateManager.getCurrentProgramDayKey() : null,
      dishesStatistics: this.getDishesStatistics(),
      priceBreakdown: this.getPriceBreakdown()
    };
  }

  /**
   * Сбрасывает настройки
   */
  resetSettings() {
    localStorage.removeItem('hte-settings');
    if (this.uiManager) {
      this.uiManager.loadSettings();
    }
  }

  /**
   * Метод для обновления данных при смене программы
   */
  updateProgramData(newDishesData) {
    if (!this.isInitialized) {
      console.warn('⚠️ ProductSection not initialized yet');
      return;
    }
    
    // Обновляем данные в конфигурации
    this.config.dishesData = newDishesData;
    window.dishesData = newDishesData;
    window.ALL_DISHES_DATA = newDishesData;
    
    // Обновляем данные в менеджере блюд
    this.dishesManager.setDishesData(newDishesData);
    
    // Обновляем meal options
    if (this.uiManager && this.uiManager.settingsPanelBuilder) {
      this.uiManager.settingsPanelBuilder.refreshMealOptions();
    }
    
    // Пересчитываем цену
    if (this.priceManager) {
      this.priceManager.recalculateTotalPrice();
    }
    
    // Обновляем блюда и КБЖУ
    if (this.dishesManager) {
      this.dishesManager.updateDishesAndNutrition();
    }
  }

  /**
   * Уничтожает экземпляр и очищает ресурсы
   */
  destroy() {
    // Очищаем обработчики событий
    if (this.uiManager && this.uiManager.elements) {
      // Удаляем обработчики событий для кнопок
      if (this.uiManager.elements.prevBtn) {
        this.uiManager.elements.prevBtn.replaceWith(this.uiManager.elements.prevBtn.cloneNode(true));
      }
      if (this.uiManager.elements.nextBtn) {
        this.uiManager.elements.nextBtn.replaceWith(this.uiManager.elements.nextBtn.cloneNode(true));
      }
      
      // Удаляем обработчики событий для опций калорийности
      if (this.uiManager.elements.calorieOptions) {
        this.uiManager.elements.calorieOptions.forEach(option => {
          option.replaceWith(option.cloneNode(true));
        });
      }
      
      // Удаляем обработчики событий для опций диеты
      if (this.uiManager.elements.dietOptions) {
        this.uiManager.elements.dietOptions.forEach(option => {
          option.replaceWith(option.cloneNode(true));
        });
      }
      
      // Удаляем обработчики событий для переключателей
      if (this.uiManager.elements.toggleSwitches) {
        this.uiManager.elements.toggleSwitches.forEach(switchElement => {
          switchElement.replaceWith(switchElement.cloneNode(true));
        });
      }
    }
    
    // Очищаем ссылки
    this.config = null;
    this.dateManager = null;
    this.dishesManager = null;
    this.priceManager = null;
    this.uiManager = null;
    
    this.isInitialized = false;
    

  }
}

// Глобальная функция для инициализации Product Section
window.initProductSection = async function(options) {
  const productSection = new ProductSection();
  const success = await productSection.initialize(options);
  
  if (success) {
    // Сохраняем экземпляр глобально для доступа
    window.productSection = productSection;
    
    // Обновляем отображение
    productSection.updateDishesAndNutrition();
    productSection.recalculatePrice();
    
    // console.log('Product Section ready:', productSection.getSystemInfo());
  }
  
  return success;
};

// Экспортируем класс для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProductSection;
} else {
  window.ProductSection = ProductSection;
}
