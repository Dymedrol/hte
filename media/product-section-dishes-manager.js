/**
 * Модуль управления блюдами и питанием для Product Section
 * Отвечает за фильтрацию блюд, расчет КБЖУ и обновление галереи
 */


class DishesManager {
  constructor(config, dateManager) {
    this.config = config;
    this.dateManager = dateManager;
    this.dishesData = null;
  }

  /**
   * Устанавливает данные блюд
   * @param {Object} dishesData - данные блюд
   */
  setDishesData(dishesData) {
    this.dishesData = dishesData;
  }

  /**
   * Парсит строку nutrition для получения КБЖУ
   * @param {string} nutritionString - строка с данными о питании
   * @param {number} targetCalories - целевая калорийность
   * @returns {Object} - объект с КБЖУ
   */
  getNutritionForCalories(nutritionString, targetCalories) {
    if (!nutritionString || typeof nutritionString !== 'string') {
      console.error('Invalid nutrition string:', nutritionString);
      return { calories: 0, protein: 0, fat: 0, carbs: 0 };
    }

    // Проверяем, есть ли разделитель "|" (для других программ)
    if (nutritionString.includes('|')) {
      const sets = nutritionString.split('|');
      
      // Получаем доступные калорийности из конфигурации
      const availableCalories = this.config.getAvailableCalories();
      
      // Находим индекс для выбранной калорийности
      const index = availableCalories.indexOf(targetCalories);
      

      const targetIndex = index >= 0 ? index : 0;
      
      if (sets.length <= targetIndex) {
        console.error(`Nutrition data not available for ${targetCalories} calories. Available sets: ${sets.length}`);
        return { calories: 0, protein: 0, fat: 0, carbs: 0 };
      }
      
      const [calories, protein, fat, carbs] = sets[targetIndex].split(',').map(Number);
      return { calories, protein, fat, carbs };
    } else {
      // Для Premium программы - nutrition уже соответствует выбранной калорийности
      const [calories, protein, fat, carbs] = nutritionString.split(',').map(Number);
      return { calories, protein, fat, carbs };
    }
  }

  /**
   * Получает отфильтрованные блюда для текущего дня
   * @returns {Array} - массив отфильтрованных блюд
   */
  /**
   * Получает текущие данные блюд на основе выбранных опций
   * @returns {Object} - данные блюд для текущих опций
   */
  getCurrentDishesData() {
    // Для Premium программы - получаем данные из соответствующего файла
    if (this.config.PRODUCT_CONFIG?.dataFiles) {
      const selectedCalories = this.getSelectedCalories();
      const selectedDiet = this.getSelectedDiet();
      
      if (selectedCalories && selectedDiet) {
        const dataKey = `${selectedCalories}-${selectedDiet}`;
        const currentData = this.dishesData[dataKey];
        
        if (currentData) {
          return currentData;
        }
      }
      
      // Если не найдены текущие данные, возвращаем первый файл
      const firstKey = Object.keys(this.dishesData)[0];

      return this.dishesData[firstKey];
    }
    
    // Для других программ - возвращаем dishesData как есть
    return this.dishesData;
  }

  /**
   * Получает выбранную калорийность
   */
  getSelectedCalories() {
    const activeCalorieOption = document.querySelector('.calorie-option.active');
    if (activeCalorieOption) {
      return activeCalorieOption.getAttribute('data-calories');
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
    return null;
  }

  getFilteredDishes() {
    const currentDishesData = this.getCurrentDishesData();
    
    if (!currentDishesData || !currentDishesData.dishesByDay) {
      console.warn('No dishes data available');
      return [];
    }

    // Получаем ключ дня программы для текущего дня
    const currentDayKey = this.dateManager.getCurrentProgramDayKey();
    const dayData = currentDishesData.dishesByDay[currentDayKey];
    
    if (!dayData || !dayData.dishes) {
      console.warn(`No dishes found for day: ${currentDayKey}`);
      return [];
    }
    
    let filteredDishes = [...dayData.dishes];
    
    // Получаем название программы для определения логики фильтрации
    const programName = this.config.getProgramName();
    
    if (programName === 'СТАРТ') {
      // Для программы СТАРТ: супы и снеки скрыты по умолчанию, показываются только при активации toggles
      
      // Проверяем переключатель "С супом"
      const soupToggle = document.querySelector('.meal-option:nth-child(1) .toggle-switch');
      if (!soupToggle?.classList.contains('active')) {
        // Если toggle НЕ активен, убираем супы
        filteredDishes = filteredDishes.filter(dish => !dish.isSoup);
      }
      
      // Проверяем переключатель "С перекусом"
      const snackToggle = document.querySelector('.meal-option:nth-child(2) .toggle-switch');
      if (!snackToggle?.classList.contains('active')) {
        // Если toggle НЕ активен, убираем перекусы
        filteredDishes = filteredDishes.filter(dish => !dish.isSnack);
      }
    } else {
      // Для других программ (Premium, Detox и т.д.): стандартная логика - убираем блюда при активации toggles
      
      // Проверяем переключатель "Убрать завтрак и перекус"
      const breakfastToggle = document.querySelector('.meal-option:nth-child(1) .toggle-switch');
      if (breakfastToggle?.classList.contains('active')) {
        filteredDishes = filteredDishes.filter(dish => !dish.isBreakfast && !dish.isSnack);
      }
      
      // Проверяем переключатель "Убрать ужин и перекус"
      const dinnerToggle = document.querySelector('.meal-option:nth-child(2) .toggle-switch');
      if (dinnerToggle?.classList.contains('active')) {
        filteredDishes = filteredDishes.filter(dish => !dish.isDinner && !dish.isSnack);
      }
    }
    
    return filteredDishes;
  }

  /**
   * Рассчитывает общий КБЖУ для отфильтрованных блюд
   * @param {Array} filteredDishes - отфильтрованные блюда
   * @param {number} targetCalories - целевая калорийность
   * @returns {Object} - общий КБЖУ
   */
  calculateTotalNutrition(filteredDishes, targetCalories) {
    if (!filteredDishes || filteredDishes.length === 0) {
      return { calories: 0, protein: 0, fat: 0, carbs: 0 };
    }
    
    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;
    
    filteredDishes.forEach((dish, index) => {
      const nutrition = this.getNutritionForCalories(dish.nutrition, targetCalories);
      
      totalCalories += nutrition.calories;
      totalProtein += nutrition.protein;
      totalFat += nutrition.fat;
      totalCarbs += nutrition.carbs;
    });
    
    const result = {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein),
      fat: Math.round(totalFat),
      carbs: Math.round(totalCarbs)
    };
    
    return result;
  }

  /**
   * Обновляет отображение КБЖУ
   * @param {Object} totalNutrition - общий КБЖУ
   */
  updateNutritionDisplay(totalNutrition) {
    const nutritionItems = document.querySelectorAll('.nutrition-item');
    if (nutritionItems.length >= 4) {
      nutritionItems[0].textContent = `К ${totalNutrition.calories}`;
      nutritionItems[1].textContent = `Б ${totalNutrition.protein}`;
      nutritionItems[2].textContent = `Ж ${totalNutrition.fat}`;
      nutritionItems[3].textContent = `У ${totalNutrition.carbs}`;
    }
  }

  /**
   * Обновляет галерею блюд с отфильтрованными данными
   * @param {Array} filteredDishes - отфильтрованные блюда
   */
  updateDishesGallery(filteredDishes) {
    const dishesGallery = document.querySelector('.dishes-gallery');
    
    if (!dishesGallery) {
      console.error('Dishes gallery not found');
      return;
    }
    
    // Очищаем текущее содержимое
    dishesGallery.innerHTML = '';
    
    // Создаем новые элементы блюд
    filteredDishes.forEach((dish, index) => {
      const dishItem = document.createElement('div');
      dishItem.className = 'dish-item';
      
      dishItem.innerHTML = `
        <img src="${dish.image}" alt="${dish.alt || dish.name}" />
        <div class="dish-overlay">
          <span>${dish.name}</span>
        </div>
      `;
      
      dishesGallery.appendChild(dishItem);
    });
  }

  /**
   * Обновляет отображение блюд и КБЖУ
   */
  updateDishesAndNutrition() {
    // Проверяем, что данные загружены
    if (!this.dishesData) {
      console.warn('⚠️ Данные блюд еще не загружены, пропускаем обновление');
      return;
    }
    
    // Получаем отфильтрованные блюда
    const filteredDishes = this.getFilteredDishes();
    
    // Получаем выбранную калорийность
    const activeCalorieOption = document.querySelector('.calorie-option.active');
    const targetCalories = activeCalorieOption ? 
      parseInt(activeCalorieOption.getAttribute('data-calories')) : 
      this.config.getAvailableCalories()[0];
    
    // Рассчитываем общий КБЖУ
    const totalNutrition = this.calculateTotalNutrition(filteredDishes, targetCalories);
    
    // Обновляем отображение КБЖУ
    this.updateNutritionDisplay(totalNutrition);
    
    // Обновляем галерею блюд
    this.updateDishesGallery(filteredDishes);
  }

  /**
   * Получает блюда для конкретного дня программы
   * @param {string} dayKey - ключ дня (например, "day-1")
   * @returns {Array} - массив блюд для данного дня
   */
  getDishesForDay(dayKey) {
    const currentDishesData = this.getCurrentDishesData();
    if (!currentDishesData?.dishesByDay?.[dayKey]) {
      return [];
    }
    
    return currentDishesData.dishesByDay[dayKey].dishes || [];
  }

  /**
   * Получает информацию о блюде по ID
   * @param {string} dishId - ID блюда
   * @returns {Object|null} - информация о блюде или null
   */
  getDishById(dishId) {
    const currentDishesData = this.getCurrentDishesData();
    if (!currentDishesData?.dishesByDay) {
      return null;
    }
    
    for (const dayKey in currentDishesData.dishesByDay) {
      const dayDishes = currentDishesData.dishesByDay[dayKey].dishes || [];
      const dish = dayDishes.find(d => d.id === dishId);
      if (dish) {
        return dish;
      }
    }
    
    return null;
  }

  /**
   * Проверяет, содержит ли блюдо аллерген
   * @param {Object} dish - блюдо
   * @param {string} allergenId - ID аллергена
   * @returns {boolean} - true если блюдо содержит аллерген
   */
  dishContainsAllergen(dish, allergenId) {
    if (!dish.allergens || !Array.isArray(dish.allergens)) {
      return false;
    }
    
    return dish.allergens.includes(allergenId);
  }

  /**
   * Фильтрует блюда по аллергенам
   * @param {Array} dishes - массив блюд
   * @param {Array} excludedAllergens - массив исключаемых аллергенов
   * @returns {Array} - отфильтрованные блюда
   */
  filterDishesByAllergens(dishes, excludedAllergens) {
    if (!excludedAllergens || excludedAllergens.length === 0) {
      return dishes;
    }
    
    return dishes.filter(dish => {
      return !excludedAllergens.some(allergenId => 
        this.dishContainsAllergen(dish, allergenId)
      );
    });
  }

  /**
   * Получает статистику по блюдам
   * @returns {Object} - статистика по блюдам
   */
  getDishesStatistics() {
    const currentDishesData = this.getCurrentDishesData();
    if (!currentDishesData?.dishesByDay) {
      return { totalDays: 0, totalDishes: 0, averageDishesPerDay: 0 };
    }
    
    const days = Object.keys(currentDishesData.dishesByDay);
    let totalDishes = 0;
    
    days.forEach(dayKey => {
      const dayDishes = currentDishesData.dishesByDay[dayKey].dishes || [];
      totalDishes += dayDishes.length;
    });
    
    return {
      totalDays: days.length,
      totalDishes: totalDishes,
      averageDishesPerDay: Math.round(totalDishes / days.length)
    };
  }
}

// Экспортируем класс для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DishesManager;
} else {
  window.DishesManager = DishesManager;
}
;
