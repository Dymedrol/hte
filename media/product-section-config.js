/**
 * Конфигурационный модуль для Product Section
 * Универсальная система конфигурации для всех программ
 */


class ProductSectionConfig {
  constructor() {
    this.PRODUCT_CONFIG = null;
    this.PRICE_CONFIG = null;
    this.allergensData = null;
    this.daysData = null;
    this.dishesData = null;
    this.currentPrice = 0;
  }

  /**
   * Загружает конфигурацию продукта из JSON файла
   * @param {string} configPath - путь к файлу конфигурации
   * @returns {Promise<Object>} - загруженная конфигурация
   */
  async loadProductConfig(configPath) {
    try {
      this.PRODUCT_CONFIG = window.PROGRAM_CONFIG;
      window.PRODUCT_CONFIG = this.PRODUCT_CONFIG;
      
      return this.PRODUCT_CONFIG;
    } catch (error) {
      console.error('Error loading product config:', error);
      throw error;
    }
  }

  /**
   * Загружает данные блюд из JSON файла
   * @param {string} dishesPath - путь к файлу с данными блюд
   * @returns {Promise<Object>} - загруженные данные блюд
   */
  async loadDishesData(dishesPath) {
    try {
      this.dishesData = window.PROGRAM_DISHES_DATA;
      
      // Добавляем mealOptions из данных блюд в конфигурацию
      this.addMealOptionsToConfig();
      
      // Обновляем глобальную переменную для совместимости
      window.dishesData = this.dishesData;
      window.ALL_DISHES_DATA = this.dishesData;
      
      return this.dishesData;
    } catch (error) {
      console.error('Error loading dishes data:', error);
      throw error;
    }
  }



  /**
   * Создает совместимую структуру данных для универсальной системы
   */
  createCompatibleDataStructure(allData) {
    // console.log('Creating compatible data structure from multiple files...');
    
    // Берем первый файл как основу для совместимой структуры
    const firstDataKey = Object.keys(allData)[0];
    const firstData = allData[firstDataKey];
    
    if (!firstData) {
      console.error('No data files loaded');
      return;
    }
    
    // Создаем совместимую структуру на основе первого файла
    // Для Premium программы meal-options не устанавливаем, так как они динамические
    this.dishesData = {
      programName: firstData.programName || '',
      calorieOption: firstData.calorieOption || 0,
      dietType: firstData.dietType || '',
      totalDays: firstData.totalDays || 0,
      dishesByDay: firstData.dishesByDay || {}
    };
    
    // console.log('Created compatible structure:', {
    //   programName: this.dishesData.programName,
    //   calorieOption: this.dishesData.calorieOption,
    //   totalDays: this.dishesData.totalDays,
    //   daysCount: Object.keys(this.dishesData.dishesByDay).length
    // });
  }

  /**
   * Добавляет mealOptions из данных блюд в конфигурацию
   */
  addMealOptionsToConfig() {
    if (this.dishesData?.mealOptions) {
      this.PRODUCT_CONFIG = this.PRODUCT_CONFIG || {};
      this.PRODUCT_CONFIG.mealOptions = this.dishesData.mealOptions;
    }
  }

  /**
   * Инициализирует конфигурацию цен на основе PRODUCT_CONFIG
   */
  initializePriceConfig() {
    if (!this.PRODUCT_CONFIG) {
      console.error('PRODUCT_CONFIG not available');
      return;
    }

    this.PRICE_CONFIG = {
      basePrice: this.PRODUCT_CONFIG.basePrice || 0,
      caloriePrices: this.PRODUCT_CONFIG.calorieOptions?.reduce((acc, option) => {
        acc[option.value] = option.price;
        return acc;
      }, {}) || {},
      mealDiscounts: this.PRODUCT_CONFIG.mealOptions?.reduce((acc, option) => {
        // Используем только price параметр (положительные значения для доплат, отрицательные для скидок)
        if (option.price !== undefined) {
          acc[option.id] = option.price;
        }
        return acc;
      }, {}) || {}
    };

    this.currentPrice = this.PRICE_CONFIG.basePrice;
    
    // Обновляем глобальную переменную для совместимости
    window.PRICE_CONFIG = this.PRICE_CONFIG;
  }

  /**
   * Инициализирует данные аллергенов
   * @param {Object} allergensConfig - конфигурация аллергенов
   */
  initializeAllergensData(allergensConfig) {
    this.allergensData = allergensConfig?.data || null;
    
    // Обновляем глобальную переменную для совместимости
    window.allergensData = this.allergensData;
    
    // console.log('Allergens data initialized:', this.allergensData);
  }

  /**
   * Инициализирует данные дней
   * @param {Array} daysData - данные дней
   */
  initializeDaysData(daysData) {
    this.daysData = daysData || null;
    
    // Обновляем глобальную переменную для совместимости
    window.daysData = this.daysData;
    

  }

  /**
   * Получает доступные калорийности из конфигурации
   * @returns {Array<number>} - массив доступных калорийностей
   */
  getAvailableCalories() {
    if (this.PRODUCT_CONFIG?.calorieOptions) {
      return this.PRODUCT_CONFIG.calorieOptions.map(option => parseInt(option.value));
    } else if (this.dishesData?.calorieOptions) {
      return this.dishesData.calorieOptions;
    } else if (this.dishesData?.calorieOption) {
      // Для Premium данных, где calorieOption - единственное число
      return [parseInt(this.dishesData.calorieOption)];
    }
    return []; // нет данных
  }

  /**
   * Получает базовую цену
   * @returns {number} - базовая цена
   */
  getBasePrice() {
    return this.PRICE_CONFIG?.basePrice || 0;
  }

  /**
   * Получает цену для конкретной калорийности
   * @param {number} calories - калорийность
   * @returns {number} - цена для данной калорийности
   */
  getCaloriePrice(calories) {
    return this.PRICE_CONFIG?.caloriePrices?.[calories] || 0;
  }

  /**
   * Получает цену для конкретной диеты
   * @param {string} dietType - тип диеты
   * @returns {number} - цена для данной диеты
   */
  getDietPrice(dietType) {
    const dietOption = this.PRODUCT_CONFIG?.dietTypes?.find(diet => diet.value === dietType);
    return dietOption?.price || 0;
  }

  /**
   * Получает скидку для конкретной опции приема пищи
   * @param {string} mealOptionId - ID опции приема пищи
   * @returns {number} - скидка для данной опции
   */
  getMealDiscount(mealOptionId) {
    const discount = this.PRICE_CONFIG?.mealDiscounts?.[mealOptionId] || 0;
    return Math.abs(discount);
  }

  /**
   * Проверяет, загружена ли конфигурация
   * @returns {boolean} - true если конфигурация загружена
   */
  isConfigLoaded() {
    return this.PRODUCT_CONFIG !== null && this.dishesData !== null;
  }

  /**
   * Получает название программы
   * @returns {string} - название программы
   */
  getProgramName() {
    return this.PRODUCT_CONFIG?.programName || this.dishesData?.programName || '';
  }

  /**
   * Получает длительность программы
   * @returns {number} - количество дней в программе
   */
  getProgramDuration() {
    // Для Premium программы - получаем длительность из первого файла данных
    if (this.PRODUCT_CONFIG?.dataFiles) {
      const firstDataKey = Object.keys(this.dishesData)[0];
      const firstData = this.dishesData[firstDataKey];
      if (firstData?.dishesByDay) {
        return Object.keys(firstData.dishesByDay).length;
      }
    }
    
    // Для других программ
    if (this.dishesData?.dishesByDay) {
      return Object.keys(this.dishesData.dishesByDay).length;
    } else if (this.daysData) {
      return this.daysData.length;
    }
    
    return 0; // нет данных
  }

  /**
   * Получает дату начала программы
   * @returns {Date} - дата начала программы
   */
  getProgramStartDate() {
    // Для Premium программы - получаем дату из конфигурации
    if (this.PRODUCT_CONFIG?.startDate) {
      return new Date(this.PRODUCT_CONFIG.startDate);
    }
    
    // Для других программ
    if (this.dishesData?.startDate) {
      return new Date(this.dishesData.startDate);
    }
    
    return null; // нет данных
  }
}

// Экспортируем класс для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProductSectionConfig;
} else {
  window.ProductSectionConfig = ProductSectionConfig;
}
;
