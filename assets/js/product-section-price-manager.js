/**
 * Модуль управления ценами для Product Section
 * Отвечает за расчет цен, скидок и обновление отображения
 */

class PriceManager {
  constructor(config) {
    this.config = config;
    this.currentPrice = 0;
    this.totalPriceElement = null;
    this.pricePeriodElement = null;
  }

  /**
   * Инициализирует DOM элементы для отображения цены
   */
  initializePriceElements() {
    this.totalPriceElement = document.querySelector('.total-price');
    this.pricePeriodElement = document.querySelector('.price-period');
  }

  /**
   * Рассчитывает дополнительную стоимость за аллергены
   * @returns {number} - дополнительная стоимость
   */
  calculateAllergenExtraCost() {
    // Проверяем, есть ли глобальная функция для расчета аллергенов
    if (typeof calculateAllergenExtraCost === 'function') {
      return calculateAllergenExtraCost();
    }
    

    if (typeof selectedAllergenIds !== 'undefined' && selectedAllergenIds.length > 0) {
      // Предполагаем, что каждый аллерген добавляет 100 рублей
      return selectedAllergenIds.length * 100;
    }
    
    return 0;
  }

  /**
   * Рассчитывает стоимость за выбранную калорийность
   * @returns {number} - стоимость калорийности (основная цена для Premium)
   */
  calculateCalorieExtraCost() {
    const activeCalorieOption = document.querySelector('.calorie-option.active');
    
    if (activeCalorieOption) {
      const calorieValue = activeCalorieOption.querySelector('.calorie-value').textContent;
      return this.config.getCaloriePrice(parseInt(calorieValue));
    }
    
    // Если нет DOM элементов (программы с одной опцией), берем из конфигурации
    const calorieOptions = this.config.PRODUCT_CONFIG?.calorieOptions;
    if (calorieOptions && calorieOptions.length === 1) {
      return this.config.getCaloriePrice(parseInt(calorieOptions[0].value));
    }
    
    return 0;
  }

  /**
   * Рассчитывает стоимость за выбранную диету
   * @returns {number} - стоимость диеты
   */
  calculateDietExtraCost() {
    const activeDietOption = document.querySelector('.diet-option.active');
    if (activeDietOption) {
      const dietValue = activeDietOption.getAttribute('data-diet-type');
      return this.config.getDietPrice(dietValue);
    }
    
    // Если нет DOM элементов (программы с одной опцией), берем из конфигурации
    const dietTypes = this.config.PRODUCT_CONFIG?.dietTypes;
    if (dietTypes && dietTypes.length === 1) {
      return this.config.getDietPrice(dietTypes[0].value);
    }
    
    return 0;
  }

  /**
   * Рассчитывает стоимость за дополнительные опции приемов пищи
   * @returns {number} - общая стоимость (положительная для доплат, отрицательная для скидок)
   */
  calculateMealOptionsCost() {
    let totalCost = 0;
    
    // Получаем все активные meal-options
    const activeMealOptions = document.querySelectorAll('.meal-option .toggle-switch.active');
    
    activeMealOptions.forEach(toggle => {
      const mealOption = toggle.closest('.meal-option');
      const optionIndex = Array.from(mealOption.parentNode.children).indexOf(mealOption);
      
      // Получаем mealOptions для текущих выбранных опций
      let mealOptions = this.getCurrentMealOptions();
      
      if (mealOptions && mealOptions[optionIndex]) {
        const option = mealOptions[optionIndex];
        
        // Используем только price параметр (положительные значения для доплат, отрицательные для скидок)
        if (option.price !== undefined) {
          totalCost += option.price;
        }
      }
    });
    
    return totalCost;
  }

  /**
   * Получает meal-options для текущих выбранных опций
   */
  getCurrentMealOptions() {
    // Для Premium программы - получаем из соответствующего файла данных
    if (this.config.PRODUCT_CONFIG?.dataFiles) {
      const selectedCalories = this.getSelectedCalories();
      const selectedDiet = this.getSelectedDiet();
      
      if (selectedCalories && selectedDiet) {
        const dataKey = `${selectedCalories}-${selectedDiet}`;
        const mealOptions = this.config.dishesData?.[dataKey]?.mealOptions;
        
        if (mealOptions) {
          return mealOptions;
        }
      }
    }
    
    // Для других программ - из конфигурации
    return this.config.PRODUCT_CONFIG?.mealOptions || this.config.dishesData?.mealOptions;
  }

  /**
   * Получает выбранную калорийность
   */
  getSelectedCalories() {
    const activeCalorieOption = document.querySelector('.calorie-option.active');
    if (activeCalorieOption) {
      return activeCalorieOption.getAttribute('data-calories');
    }
    
    // Если нет DOM элементов (программы с одной опцией), берем из конфигурации
    const calorieOptions = this.config.PRODUCT_CONFIG?.calorieOptions;
    if (calorieOptions && calorieOptions.length === 1) {
      return calorieOptions[0].value;
    }
    
    return null;
  }

  /**
   * Получает выбранную диету
   */
  getSelectedDiet() {
    const activeDietOption = document.querySelector('.diet-option.active');
    if (activeDietOption) {
      return activeDietOption.getAttribute('data-diet-type');
    }
    
    // Если нет DOM элементов (программы с одной опцией), берем из конфигурации
    const dietTypes = this.config.PRODUCT_CONFIG?.dietTypes;
    if (dietTypes && dietTypes.length === 1) {
      return dietTypes[0].value;
    }
    
    return null;
  }

  /**
   * Пересчитывает общую цену на основе всех выбранных опций
   */
  recalculateTotalPrice() {
    if (!this.config.isConfigLoaded()) {
      console.error('Config not loaded, cannot recalculate price');
      return;
    }
    
    // Для Premium программы цена калорийности является основной ценой
    let newPrice = this.calculateCalorieExtraCost();
    
    // Добавляем стоимость за выбранную диету
    newPrice += this.calculateDietExtraCost();
    
    // Добавляем стоимость за дополнительные аллергены
    newPrice += this.calculateAllergenExtraCost();
    
    // Добавляем стоимость за дополнительные опции приемов пищи
    newPrice += this.calculateMealOptionsCost();
    
    // Убеждаемся, что цена не стала отрицательной
    newPrice = Math.max(newPrice, 0);
    
    this.currentPrice = newPrice;
    this.updatePriceDisplay();
  }

  /**
   * Обновляет отображение цены
   */
  updatePriceDisplay() {
    if (!this.totalPriceElement) {
      console.error('Total price element not found');
      return;
    }
    
    // Сохраняем старую цену для анимации
    const oldPrice = this.currentPrice;
    
    // Форматируем цену с разделителями тысяч
    const formattedPrice = this.currentPrice.toLocaleString('ru-RU');
    this.totalPriceElement.textContent = `${formattedPrice} ₽`;
    
    // Добавляем анимацию изменения цены
    if (oldPrice !== this.currentPrice) {
      this.totalPriceElement.style.transition = 'color 0.3s ease';
      this.totalPriceElement.style.color = this.currentPrice > oldPrice ? '#ff6b6b' : '#51cf66';
      
      setTimeout(() => {
        this.totalPriceElement.style.color = '';
      }, 300);
    }
  }

  /**
   * Получает текущую цену
   * @returns {number} - текущая цена
   */
  getCurrentPrice() {
    return this.currentPrice;
  }

  /**
   * Устанавливает цену
   * @param {number} price - новая цена
   */
  setCurrentPrice(price) {
    this.currentPrice = Math.max(price, 0);
    this.updatePriceDisplay();
  }

  /**
   * Получает базовую цену
   * @returns {number} - базовая цена
   */
  getBasePrice() {
    return this.config.getBasePrice();
  }

  /**
   * Рассчитывает процент скидки от базовой цены
   * @returns {number} - процент скидки
   */
  getDiscountPercentage() {
    const basePrice = this.config.getBasePrice();
    if (basePrice === 0) return 0;
    
    const discount = basePrice - this.currentPrice;
    return Math.round((discount / basePrice) * 100);
  }

  /**
   * Форматирует цену для отображения
   * @param {number} price - цена для форматирования
   * @returns {string} - отформатированная цена
   */
  formatPrice(price) {
    return price.toLocaleString('ru-RU');
  }

  /**
   * Получает детализацию цены
   * @returns {Object} - детализация цены
   */
  getPriceBreakdown() {
    return {
      basePrice: this.config.getBasePrice(),
      allergenCost: this.calculateAllergenExtraCost(),
      calorieCost: this.calculateCalorieExtraCost(),
      mealOptionsCost: this.calculateMealOptionsCost(),
      finalPrice: this.currentPrice,
      discountPercentage: this.getDiscountPercentage()
    };
  }

  /**
   * Проверяет, есть ли активные опции приемов пищи
   * @returns {boolean} - true если есть активные опции
   */
  hasActiveMealOptions() {
    return this.calculateMealOptionsCost() !== 0;
  }

  /**
   * Получает информацию об активных опциях приемов пищи
   * @returns {Array} - массив активных опций
   */
  getActiveMealOptions() {
    const options = [];
    
    // Получаем все активные meal-options
    const activeMealOptions = document.querySelectorAll('.meal-option .toggle-switch.active');
    
    activeMealOptions.forEach(toggle => {
      const mealOption = toggle.closest('.meal-option');
      const optionIndex = Array.from(mealOption.parentNode.children).indexOf(mealOption);
      
      // Получаем mealOptions для текущих выбранных опций
      let mealOptions = this.getCurrentMealOptions();
      
      if (mealOptions && mealOptions[optionIndex]) {
        const option = mealOptions[optionIndex];
        
        if (option.price !== undefined) {
          options.push({
            type: 'meal',
            name: option.label,
            amount: option.price
          });
        }
      }
    });
    
    return options;
  }
}

// Экспортируем класс для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PriceManager;
} else {
  window.PriceManager = PriceManager;
}
