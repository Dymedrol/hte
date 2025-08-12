/**
 * Инициализация универсального Product Section
 * Автоматически загружает конфигурацию и инициализирует модуль
 */

class ProductSectionInitializer {
  constructor() {
    this.config = null;
    this.productSection = null;
    this.isInitialized = false;
  }

  /**
   * Загружает конфигурацию из HTML
   * @returns {Object|null} - конфигурация или null
   */
  async loadConfigFromHTML() {
    try {
      const mainConfig = window.PROGRAM_CONFIG;
      const dishesData = window.PROGRAM_DISHES_DATA;
      
      // Ждем загрузки аллергенов если они еще не загружены
      if (!window.ALLERGENS_CONFIG && typeof loadAllergensConfig === 'function') {
        try {
          await loadAllergensConfig();
        } catch (error) {
          console.error('❌ Ошибка загрузки аллергенов:', error);
        }
      }
      
      this.config = {
        configPath: 'data/premium/premium-config.json',
        dishesPath: null,
        allergensConfig: window.ALLERGENS_CONFIG || null,
        programInfo: {
          name: mainConfig.programName || '',
          description: mainConfig.description || {},
          duration: mainConfig.totalDays || 30,
          image: mainConfig.image || '',
          popupImage: mainConfig.popupImage || ''
        },
        defaults: {
          calories: mainConfig.calorieOptions?.[0]?.value || '1000',
          diet: mainConfig.dietTypes?.[0]?.value || 'classic',
          allergenPrice: mainConfig.allergens?.allergenPrice || 300
        },
        mainConfig: mainConfig,
        dishesData: dishesData
      };
      
      return this.config;
    } catch (error) {

      return null;
    }
  }

  /**
   * Загружает конфигурацию из data-атрибутов
   * @returns {Object|null} - конфигурация или null
   */
  loadConfigFromDataAttributes() {
    try {
      const productSection = document.getElementById('productSection');
      if (!productSection) {

        return null;
      }

      this.config = {
        configPath: productSection.dataset.configPath || '',
        dishesPath: productSection.dataset.dishesPath || '',
        allergensConfig: productSection.dataset.allergensConfig ? 
          JSON.parse(productSection.dataset.allergensConfig) : null,
        programInfo: {
          name: productSection.dataset.programName || '',
          description: {
            title: productSection.dataset.descriptionTitle || '',
            text: productSection.dataset.descriptionText || ''
          },
          duration: parseInt(productSection.dataset.programDuration) || 0,
          image: productSection.dataset.programImage || '',
          popupImage: productSection.dataset.popupImage || ''
        },
        defaults: {
          calories: productSection.dataset.defaultCalories || '1000',
          diet: productSection.dataset.defaultDiet || 'classic',
          allergenPrice: parseInt(productSection.dataset.allergenPrice) || 300
        }
      };


      return this.config;
    } catch (error) {

      return null;
    }
  }

  /**
   * Обновляет UI с информацией о программе
   */
  updateProgramInfo() {
    // console.log('Updating program info...');
    // console.log('Config:', this.config);
    
    if (!this.config?.programInfo) {
      
      return;
    }

    const { programInfo } = this.config;
          // console.log('Program info:', programInfo);

    // Обновляем название программы
    const titleElement = document.getElementById('program-title');
          // console.log('Title element:', titleElement);
    if (titleElement && programInfo.name) {
      titleElement.textContent = programInfo.name;
              // console.log('✅ Updated title:', programInfo.name);
    } else {
      
    }

    // Обновляем длительность программы
    this.updateProgramDuration();

    // Обновляем описание
    const descriptionTitleElement = document.getElementById('program-description-title');
          // console.log('Description title element:', descriptionTitleElement);
    if (descriptionTitleElement && programInfo.description?.title) {
      descriptionTitleElement.textContent = programInfo.description.title;
              // console.log('✅ Updated description title:', programInfo.description.title);
    } else {
      
    }

    const descriptionTextElement = document.getElementById('program-description-text');
          // console.log('Description text element:', descriptionTextElement);
    if (descriptionTextElement && programInfo.description?.text) {
      descriptionTextElement.textContent = programInfo.description.text;
              // console.log('✅ Updated description text:', programInfo.description.text);
    } else {
      
    }

    // Обновляем изображение в попапе
    const popupImageElement = document.getElementById('popupImage');
    if (popupImageElement && programInfo.popupImage) {
      popupImageElement.style.backgroundImage = `url(${programInfo.popupImage})`;
    }

    const popupImageTitleElement = document.getElementById('popupImageTitle');
    if (popupImageTitleElement && programInfo.name) {
      popupImageTitleElement.textContent = programInfo.name.toUpperCase();
    }

    // Обновляем цену аллергенов
    const allergenPriceElement = document.getElementById('allergen-price');
    if (allergenPriceElement && this.config.defaults?.allergenPrice) {
      allergenPriceElement.textContent = `+${this.config.defaults.allergenPrice} ₽`;
    }
  }

  /**
   * Обновляет длительность программы
   */
  updateProgramDuration() {
    const durationElement = document.getElementById('program-duration');
    if (!durationElement) {
      
      return;
    }

    // Пытаемся получить актуальную длительность из выбранной программы
    let actualDuration = 0;
    
    // Если есть доступ к ProductSection, получаем актуальную длительность
    if (window.productSection && window.productSection.isReady()) {
      const systemInfo = window.productSection.getSystemInfo();
      if (systemInfo.programDuration > 0) {
        actualDuration = systemInfo.programDuration;
      }
    }
    
    if (actualDuration > 0) {
      durationElement.textContent = actualDuration;
      // console.log('✅ Updated duration:', actualDuration);
    } else {
      durationElement.textContent = '';
      // console.log('⏳ Duration not ready yet, showing empty...');
    }
  }

  /**
   * Создает опции калорийности
   * @deprecated Перенесено в SettingsPanelBuilder
   */
  createCalorieOptions() {
    const calorieOptions = this.config?.mainConfig?.calorieOptions;
    if (!calorieOptions) {
      console.warn('⚠️ Опции калорийности не найдены в конфигурации');
      return;
    }

    const calorieOptionsContainer = document.getElementById('calorieOptions');
    const calorieSelectionGroup = document.querySelector('.calorie-selection-group');
    
    if (!calorieOptionsContainer) {
      console.warn('⚠️ Контейнер опций калорийности не найден');
      return;
    }

    // Если в конфиге только 1 вариант калорийности, скрываем всю секцию выбора калорийности
    // НО создаем скрытую опцию для корректного расчета цены
    if (calorieOptions.length <= 1) {
      if (calorieSelectionGroup) {
        calorieSelectionGroup.classList.add('hidden');
      }
      
      // Создаем скрытую опцию калорийности для корректного расчета цены
      const defaultCalories = calorieOptions[0]?.value;
      calorieOptionsContainer.innerHTML = `
        <button class="calorie-option active hidden" data-calories="${defaultCalories}">
          <span class="calorie-value">${defaultCalories}</span>
          <span class="calorie-unit">${calorieOptions[0]?.unit || 'ккал'}</span>
        </button>
      `;
      return;
    }

    // Если есть несколько вариантов калорийности, показываем секцию
    if (calorieSelectionGroup) {
      calorieSelectionGroup.classList.remove('hidden');
    }

    const defaultCalories = this.config?.defaults?.calories || calorieOptions[0]?.value;

    calorieOptionsContainer.innerHTML = '';

    calorieOptions.forEach(option => {
      const button = document.createElement('button');
      button.className = `calorie-option ${option.value === defaultCalories ? 'active' : ''}`;
      button.setAttribute('data-calories', option.value);
      button.innerHTML = `
        <span class="calorie-value">${option.value}</span>
        <span class="calorie-unit">${option.unit || 'ккал'}</span>
      `;
      calorieOptionsContainer.appendChild(button);
    });
    
    // Инициализируем позицию рамки для первой активной опции
    setTimeout(() => {
      const activeOption = calorieOptionsContainer.querySelector('.calorie-option.active');
      if (activeOption) {
        const activeRect = activeOption.getBoundingClientRect();
        const containerRect = calorieOptionsContainer.getBoundingClientRect();
        
        const left = activeRect.left - containerRect.left;
        const width = activeRect.width;
        
        calorieOptionsContainer.style.setProperty('--active-left', `${left}px`);
        calorieOptionsContainer.style.setProperty('--active-width', `${width}px`);
      }
    }, 0);
  }

  /**
   * Создает опции диеты
   * @deprecated Перенесено в SettingsPanelBuilder
   */
  createDietOptions() {
    const dietTypes = this.config?.mainConfig?.dietTypes;
    if (!dietTypes) {
      console.warn('⚠️ Типы диет не найдены в конфигурации');
      return;
    }

    const dietOptionsContainer = document.getElementById('dietOptions');
    const dietSelectionGroup = document.querySelector('.diet-selection-group');
    
    if (!dietOptionsContainer) {
      console.warn('⚠️ Контейнер опций диеты не найден');
      return;
    }

    // Если в конфиге только 1 вариант диеты, скрываем всю секцию выбора диеты и разделительную линию
    // НО создаем скрытую опцию для корректного расчета цены
    if (dietTypes.length <= 1) {
      if (dietSelectionGroup) {
        dietSelectionGroup.classList.add('hidden');
      }
      
      // Скрываем разделительную линию под блоком выбора диеты
      const dietSeparator = document.querySelector('.diet-separator');
      if (dietSeparator) {
        dietSeparator.classList.add('hidden');
      }
      
      // Создаем скрытую опцию диеты для корректного расчета цены
      const defaultDiet = dietTypes[0]?.value;
      dietOptionsContainer.innerHTML = `
        <button class="diet-option active hidden" data-diet-type="${defaultDiet}">
          <span class="diet-label">${dietTypes[0]?.label || defaultDiet}</span>
        </button>
      `;
      
      return;
    }

    // Если есть несколько вариантов диеты, показываем секцию и разделительную линию
    if (dietSelectionGroup) {
      dietSelectionGroup.classList.remove('hidden');
    }
    
    // Показываем разделительную линию под блоком выбора диеты
    const dietSeparator = document.querySelector('.diet-separator');
    if (dietSeparator) {
      dietSeparator.classList.remove('hidden');
    }

    const defaultDiet = this.config?.defaults?.diet || dietTypes[0]?.value;

    dietOptionsContainer.innerHTML = '';

    dietTypes.forEach(diet => {
      const button = document.createElement('button');
      button.className = `diet-option ${diet.value === defaultDiet ? 'active' : ''}`;
      button.setAttribute('data-diet-type', diet.value);
      button.textContent = diet.label;
      dietOptionsContainer.appendChild(button);
    });
  }

  /**
   * Создает опции приемов пищи
   */
  createMealOptions() {
    // Получаем mealOptions на основе текущих выбранных опций
    let mealOptions = this.getCurrentMealOptions();
    
    const mealOptionsContainer = document.getElementById('mealOptions');
    const mealOptionsSeparator = document.querySelector('.meal-options-separator');
    
    if (!mealOptionsContainer) {
      console.warn('Meal options container not found');
      return;
    }

    // Если нет meal-options, скрываем модуль и линию над ним
    if (!mealOptions || mealOptions.length === 0) {
      if (mealOptionsContainer) {
        mealOptionsContainer.classList.add('hidden');
      }
      if (mealOptionsSeparator) {
        mealOptionsSeparator.classList.add('hidden');
      }
      return;
    }

    // Если есть meal-options, показываем модуль
    if (mealOptionsContainer) {
      mealOptionsContainer.classList.remove('hidden');
    }
    
    // Показываем разделительную линию только если есть аллергены
    const hasAllergens = this.config.PRODUCT_CONFIG?.allergens?.enabled === true;
    if (mealOptionsSeparator) {
      if (hasAllergens) {
        mealOptionsSeparator.classList.remove('hidden');
      } else {
        mealOptionsSeparator.classList.add('hidden');
      }
    }
    
    mealOptionsContainer.innerHTML = '';

    mealOptions.forEach((option, index) => {
      const div = document.createElement('div');
      div.className = 'meal-option';
      div.innerHTML = `
        <div class="toggle-switch">
          <div class="toggle-circle"></div>
        </div>
        <span>${option.label}</span>
      `;
      mealOptionsContainer.appendChild(div);
      
      // Добавляем обработчик события сразу после создания элемента
      const toggleSwitch = div.querySelector('.toggle-switch');
      if (toggleSwitch) {
        // Удаляем старые обработчики, если они есть
        toggleSwitch.removeEventListener('click', this.handleMealOptionToggle);
        
        // Добавляем новый обработчик
        toggleSwitch.addEventListener('click', this.handleMealOptionToggle.bind(this));
      }
    });
  }

  /**
   * Получает текущие mealOptions на основе выбранных опций
   */
  getCurrentMealOptions() {
    const selectedCalories = this.getSelectedCalories();
    const selectedDiet = this.getSelectedDiet();
    
    if (selectedCalories && selectedDiet) {
      const dataKey = `${selectedCalories}-${selectedDiet}`;
      const mealOptions = window.productSection?.config?.dishesData?.[dataKey]?.mealOptions;
      
      if (mealOptions && Array.isArray(mealOptions) && mealOptions.length > 0) {
        return mealOptions;
      } else {
        return null;
      }
    }
    
    return null;
  }

  /**
   * Получает выбранную калорийность
   */
  getSelectedCalories() {
    // Сначала пытаемся найти активную опцию калорийности
    const activeCalorieOption = document.querySelector('.calorie-option.active');
    if (activeCalorieOption) {
      return activeCalorieOption.getAttribute('data-calories');
    }
    
    // Если активная опция не найдена, проверяем, скрыта ли секция калорийности
    const calorieSelectionGroup = document.querySelector('.calorie-selection-group');
    if (calorieSelectionGroup && calorieSelectionGroup.classList.contains('hidden')) {
      // Если секция скрыта, возвращаем первую доступную калорийность из конфига
      const calorieOptions = this.config?.mainConfig?.calorieOptions;
      if (calorieOptions && calorieOptions.length > 0) {
        const defaultCalories = this.config?.defaults?.calories || calorieOptions[0]?.value;
        return defaultCalories;
      }
    }
    
    return null;
  }

  /**
   * Получает выбранную диету
   */
  getSelectedDiet() {
    // Сначала пытаемся найти активную опцию диеты
    const activeDietOption = document.querySelector('.diet-option.active');
    if (activeDietOption) {
      return activeDietOption.getAttribute('data-diet-type');
    }
    
    // Если активная опция не найдена, проверяем, скрыта ли секция диеты
    const dietSelectionGroup = document.querySelector('.diet-selection-group');
    if (dietSelectionGroup && dietSelectionGroup.classList.contains('hidden')) {
      // Если секция скрыта, возвращаем первую доступную диету из конфига
      const dietTypes = this.config?.mainConfig?.dietTypes;
      if (dietTypes && dietTypes.length > 0) {
        const defaultDiet = this.config?.defaults?.diet || dietTypes[0]?.value;
        return defaultDiet;
      }
    }
    
    return null;
  }

  /**
   * Обновляет meal-options при изменении калорийности или диеты
   */
  updateMealOptions() {
    // Обновляем meal-options для всех типов программ
    this.createMealOptions();
    
    // Пересчитываем цену после обновления meal-options
    if (window.productSection && window.productSection.priceManager) {
      window.productSection.priceManager.recalculateTotalPrice();
    }
    
    // Обновляем блюда после обновления meal-options
    if (window.productSection && window.productSection.dishesManager) {
      window.productSection.dishesManager.updateDishesAndNutrition();
    }
    
    // Обновляем длительность программы
    this.updateProgramDuration();
  }

  /**
   * Обработчик переключения meal-option
   */
  handleMealOptionToggle(event) {
    const toggle = event.currentTarget;
    
    // Переключаем состояние
    toggle.classList.toggle('active');
    
    // Пересчитываем цену при изменении приемов пищи
    if (window.productSection && window.productSection.priceManager) {
      window.productSection.priceManager.recalculateTotalPrice();
    }
    
    // Обновляем отображение блюд и КБЖУ при изменении приемов пищи
    if (window.productSection && window.productSection.dishesManager) {
      window.productSection.dishesManager.updateDishesAndNutrition();
    }
    
    // Обновляем длительность программы
    this.updateProgramDuration();
    
    // Логируем обновленную конфигурацию при изменении meal options
    if (window.logSelectedConfiguration && typeof window.logSelectedConfiguration === 'function') {
      window.logSelectedConfiguration();
    }
    
    // Сохраняем настройки
    this.saveSettings();
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
   * Инициализирует обработчики событий для опций
   */
  initializeEventListeners() {
    // Обработчики для опций калорийности
    const calorieOptions = document.querySelectorAll('.calorie-option');
    
    calorieOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Убираем активный класс у всех опций
        calorieOptions.forEach(opt => opt.classList.remove('active'));
        
        // Добавляем активный класс к нажатой опции
        option.classList.add('active');
        
        // Обновляем позицию и размер черной рамочки
        const container = document.querySelector('.calorie-options');
        if (container) {
          const activeRect = option.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          // Вычисляем позицию рамки относительно контейнера
          const left = activeRect.left - containerRect.left;
          const width = activeRect.width;
          
          // Применяем стили к псевдоэлементу через CSS переменные
          container.style.setProperty('--active-left', `${left}px`);
          container.style.setProperty('--active-width', `${width}px`);
        }
        
        // Пересчитываем цену
        if (window.productSection && window.productSection.priceManager) {
          window.productSection.priceManager.recalculateTotalPrice();
        }
        
        // Meal options обновляются в SettingsBuilder при изменении калорийности
        
        // Обновляем блюда при изменении калорийности
        if (window.productSection && window.productSection.dishesManager) {
          window.productSection.dishesManager.updateDishesAndNutrition();
        }
        
        // Обновляем длительность программы
        this.updateProgramDuration();
        
        // Логируем обновленную конфигурацию при изменении калорийности
        if (window.logSelectedConfiguration && typeof window.logSelectedConfiguration === 'function') {
          window.logSelectedConfiguration();
        }
      });
    });
    
    // Обработчики для опций диеты
    const dietOptions = document.querySelectorAll('.diet-option');
    
    dietOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Убираем активный класс у всех опций
        dietOptions.forEach(opt => opt.classList.remove('active'));
        
        // Добавляем активный класс к нажатой опции
        option.classList.add('active');
        
        // Пересчитываем цену
        if (window.productSection && window.productSection.priceManager) {
          window.productSection.priceManager.recalculateTotalPrice();
        }
        
        // Meal options обновляются в SettingsBuilder при изменении диеты
        
        // Обновляем блюда при изменении диеты
        if (window.productSection && window.productSection.dishesManager) {
          window.productSection.dishesManager.updateDishesAndNutrition();
        }
        
        // Обновляем длительность программы
        this.updateProgramDuration();
        
        // Логируем обновленную конфигурацию при изменении диеты
        if (window.logSelectedConfiguration && typeof window.logSelectedConfiguration === 'function') {
          window.logSelectedConfiguration();
        }
      });
    });
    
    // Обработчики для meal-options добавляются при создании элементов, не нужно вызывать здесь
  }

  /**
   * Инициализирует Product Section
   */
  async initialize() {
    try {
      // console.log('Initializing Product Section...');

      // Загружаем конфигурацию
      this.config = await this.loadConfigFromHTML() || this.loadConfigFromDataAttributes();

      console.log('🔍 this.config:', this.config);

      if (!this.config) {
        return false;
      }

      // Проверяем наличие необходимых путей
      if (!this.config.configPath) {
        
        return false;
      }
      
      // Для Premium программы dishesPath может отсутствовать, так как используются dataFiles
      if (!this.config.dishesPath && !this.config.mainConfig?.dataFiles) {
        console.error('Missing dishesPath or dataFiles in configuration');
        return false;
      }

      // Инициализируем Product Section
      const success = await initProductSection({
        configPath: this.config.configPath,
        dishesPath: this.config.dishesPath || null, // Может быть null для Premium
        allergensConfig: this.config.allergensConfig,
        mainConfig: this.config.mainConfig
      });

      if (!success) {
        console.error('Failed to initialize Product Section');
        return false;
      }

      // Обновляем UI с информацией о программе
      this.updateProgramInfo();

      // Создаем опции после инициализации
      setTimeout(() => {
        // Calorie и Diet options теперь создаются через SettingsPanelBuilder
        // Meal options создаются в SettingsBuilder, не дублируем вызов здесь
        
        // Пересчитываем цену после создания опций
        if (window.productSection && window.productSection.priceManager) {
          window.productSection.priceManager.recalculateTotalPrice();
        }
        
        // Обновляем длительность программы
        this.updateProgramDuration();
        
        // Инициализируем обработчики событий для опций
        this.initializeEventListeners();
        
        // Инициализируем аллергены после готовности Product Section
        if (typeof window.initializeAllergensWhenReady === 'function') {
          window.initializeAllergensWhenReady();
        }
        
        // Инициализируем additional-products
        if (typeof initAdditionalProducts === 'function') {
          initAdditionalProducts();
        }
      }, 100);

      this.isInitialized = true;
      // console.log('Product Section initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Error initializing Product Section:', error);
      return false;
    }
  }

  /**
   * Получает информацию о системе
   * @returns {Object} - информация о системе
   */
  getSystemInfo() {
    return {
      isInitialized: this.isInitialized,
      config: this.config,
      productSection: window.productSection ? window.productSection.getSystemInfo() : null
    };
  }
}

// Глобальная функция для инициализации
window.initializeProductSection = async function() {
  const initializer = new ProductSectionInitializer();
  return await initializer.initialize();
};

// Автоматическая инициализация отключена - инициализация происходит после загрузки компонентов
// document.addEventListener('DOMContentLoaded', async () => {
//   // Проверяем, есть ли Product Section на странице
//   const productSection = document.getElementById('productSection') || document.getElementById('product-section');
//   if (productSection) {
//     console.log('Product Section found, initializing...');
//     await window.initializeProductSection();
//   } else {
//     console.log('Product Section not found on this page');
//   }
// });

// Экспортируем класс для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProductSectionInitializer;
} else {
  window.ProductSectionInitializer = ProductSectionInitializer;
}
