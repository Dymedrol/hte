/**
 * Адаптер для программы "Перезагрузка"
 * Работает с формой #hte-product-form вместо JSON конфигурации
 * Изолирован от других программ
 */



class ReloadProgramAdapter {
  constructor() {
    this.form = null;
    this.isReloadProgram = false;
    this.formConfig = null;
    this.priceObserver = null;
    this.daysMapping = {}; // Mapping между ключами данных и radio values
  }

  /**
   * Проверяет, находимся ли мы на странице программы "Перезагрузка"
   */
  isReloadProgramPage() {
    const productSection = document.getElementById('productSection');
    return productSection && productSection.getAttribute('data-program') === 'reload';
  }

  /**
   * Инициализирует адаптер
   */
  async initialize() {
    this.isReloadProgram = this.isReloadProgramPage();
    
    if (!this.isReloadProgram) {
      console.log('📦 Не страница Reload, адаптер не активирован');
      return false;
    }

    console.log('🔄 RELOAD ADAPTER: Инициализация адаптера для программы "Перезагрузка"');
    
    this.form = document.getElementById('hte-product-form');
    if (!this.form) {
      console.error('❌ RELOAD ADAPTER: Форма #hte-product-form не найдена');
      return false;
    }

    // ВАЖНО: Ждем готовности формы (InSales загружает опции асинхронно)
    await this.waitForFormReady();
    
    // Парсим форму и создаем конфигурацию
    this.formConfig = this.parseFormConfiguration();
    
    // Наблюдаем за изменениями цены в форме
    this.observeFormPriceChanges();
    
    // Устанавливаем начальное состояние: выбираем первую опцию дней если ничего не выбрано
    this.initializeDefaultDaysSelection();
    
    console.log('✅ RELOAD ADAPTER: Адаптер успешно инициализирован');
    return true;
  }

  /**
   * Ждет готовности формы (пока не появятся опции дней)
   */
  async waitForFormReady() {
    const maxAttempts = 20; // Максимум 2 секунды ожидания
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const daysInputs = this.form.querySelectorAll('input[name="kolichestvo_dnej"]');
      if (daysInputs.length > 0) {
        console.log('✅ RELOAD ADAPTER: Форма готова, найдено опций:', daysInputs.length);
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    console.warn('⚠️ RELOAD ADAPTER: Таймаут ожидания готовности формы');
  }

  /**
   * Устанавливает начальное состояние выбора дней в форме
   */
  initializeDefaultDaysSelection() {
    const daysInputs = this.form.querySelectorAll('input[name="kolichestvo_dnej"]');
    const hasSelected = Array.from(daysInputs).some(input => input.checked);
    
    if (!hasSelected && daysInputs.length > 0) {
      // Выбираем первую опцию по умолчанию
      daysInputs[0].checked = true;
      const changeEvent = new Event('change', { bubbles: true });
      daysInputs[0].dispatchEvent(changeEvent);
      console.log('✅ RELOAD ADAPTER: Выбрана опция дней по умолчанию');
    }
  }

  /**
   * Парсит форму и создает конфигурацию для ProductSection
   */
  parseFormConfiguration() {
    const programConfig = window.PROGRAM_CONFIG;
    
    if (!programConfig) {
      console.error('❌ RELOAD ADAPTER: window.PROGRAM_CONFIG не найден');
      return null;
    }

    // Парсим опции "Количество дней" из формы и используем их как calorieOptions
    const daysOptions = this.parseDaysOptionsFromForm();

    const config = {
      programName: programConfig.programName || 'ПЕРЕЗАГРУЗКА',
      startDate: programConfig.startDate || null,
      calorieOptions: daysOptions, // ВАЖНО: используем опции дней вместо калорий
      dietTypes: [], // Пустой массив - диеты не используются
      mealOptions: programConfig.mealOptions || [],
      allergens: programConfig.allergens || { enabled: false },
      basePrice: 0, // Будет обновляться из формы
      deliverySchedule: programConfig.deliverySchedule,
      deliveryTimeSlots: programConfig.deliveryTimeSlots,
      duration: programConfig.duration || (programConfig.totalDays ?? null)
    };

    console.log('📋 RELOAD ADAPTER: Конфигурация создана:', config);
    return config;
  }

  /**
   * Парсит опции количества дней из формы
   */
  parseDaysOptionsFromForm() {
    const daysInputs = this.form.querySelectorAll('input[name="kolichestvo_dnej"]');
    const options = [];

    // Получаем доступные ключи из PROGRAM_DISHES_DATA
    const availableKeys = window.PROGRAM_DISHES_DATA ? Object.keys(window.PROGRAM_DISHES_DATA) : [];
    
    console.log('📊 Доступные ключи данных:', availableKeys);

    daysInputs.forEach((input, index) => {
      const label = input.nextElementSibling;
      if (label && label.tagName === 'SPAN') {
        const text = label.textContent.trim();
        const match = text.match(/(\d+)/);
        if (match) {
          const daysCount = match[1];
          
          // ВАЖНО: Используем ключ из PROGRAM_DISHES_DATA, а не value формы
          // Находим ключ, который содержит калорийность для этого количества дней
          let dataKey = availableKeys[index] || input.value;
          
          // Сохраняем mapping между radio value и ключом данных
          if (!this.daysMapping) {
            this.daysMapping = {};
          }
          this.daysMapping[dataKey] = input.value; // mapping: "1300-classic" -> "1"
          
          // Извлекаем калорийность из ключа (например, из "1300-classic" -> "1300")
          const calorieMatch = dataKey.match(/^(\d+)/);
          const calorieValue = calorieMatch ? calorieMatch[1] : dataKey;
          
          options.push({
            value: calorieValue, // Используем калорийность из ключа данных!
            label: daysCount,     // Число дней (10, 21, ...)
            unit: 'дней',
            price: 0, // Цена берется из формы динамически
            daysText: text, // Полный текст: "10 дней", "21 день"
            radioValue: input.value, // Сохраняем оригинальный value для синхронизации
            dataKey: dataKey // Полный ключ данных
          });
        }
      }
    });

    console.log('📅 RELOAD ADAPTER: Опции количества дней из формы:', options);
    console.log('🔗 RELOAD ADAPTER: Mapping для синхронизации:', this.daysMapping);
    return options;
  }

  /**
   * Синхронизирует выбор количества дней с формой
   * @param {string} selectedValue - калорийность из data-calories (1300, 1500, ...)
   */
  syncDaysToForm(selectedValue) {
    const daysInputs = this.form.querySelectorAll('input[name="kolichestvo_dnej"]');
    
    // Ищем соответствующий radioValue для выбранной калорийности
    const option = this.formConfig?.calorieOptions?.find(opt => opt.value === selectedValue);
    const radioValue = option?.radioValue;
    
    if (!radioValue) {
      console.warn('⚠️ RELOAD ADAPTER: Не найден radioValue для калорийности:', selectedValue);
      return;
    }
    
    daysInputs.forEach(input => {
      if (input.value === radioValue) {
        input.checked = true;
        
        // Генерируем событие change для пересчета цены InSales
        const changeEvent = new Event('change', { bubbles: true });
        input.dispatchEvent(changeEvent);
        
        const label = input.nextElementSibling;
        console.log('✅ RELOAD ADAPTER: Количество дней синхронизировано с формой:', label?.textContent.trim());
      }
    });

    // Обновляем цену сразу (без задержки) - цена обновится через MutationObserver
    // Но делаем небольшую задержку, чтобы InSales успел обновить DOM
    setTimeout(() => this.updatePriceInPanel(), 50);
  }

  /**
   * Получает текущую цену из формы
   */
  getPriceFromForm() {
    const priceElement = this.form.querySelector('[data-product-card-price]');
    if (!priceElement) {
      console.warn('⚠️ RELOAD ADAPTER: Элемент цены не найден в форме');
      return 0;
    }

    const priceText = priceElement.textContent.trim();
    const priceMatch = priceText.match(/[\d\s]+/);
    if (!priceMatch) {
      console.warn('⚠️ RELOAD ADAPTER: Не удалось извлечь цену из текста:', priceText);
      return 0;
    }

    const price = parseInt(priceMatch[0].replace(/\s/g, ''));
    console.log('💰 RELOAD ADAPTER: Цена из формы:', price);
    return price;
  }

  /**
   * Наблюдает за изменениями цены в форме
   */
  observeFormPriceChanges() {
    const priceElement = this.form.querySelector('[data-product-card-price]');
    if (!priceElement) {
      console.warn('⚠️ RELOAD ADAPTER: Элемент цены не найден для наблюдения');
      return;
    }

    // Создаем MutationObserver для отслеживания изменений
    this.priceObserver = new MutationObserver((mutations) => {
      console.log('🔄 RELOAD ADAPTER: Обнаружено изменение цены в форме');
      this.updatePriceInPanel();
    });

    // Настраиваем наблюдение
    this.priceObserver.observe(priceElement, {
      childList: true,
      characterData: true,
      subtree: true
    });

    console.log('👁️ RELOAD ADAPTER: Наблюдение за ценой в форме активировано');
  }

  /**
   * Обновляет цену в боковой панели из формы
   */
  updatePriceInPanel() {
    const price = this.getPriceFromForm();
    const totalPriceElement = document.querySelector('.total-price');
    
    if (totalPriceElement && price > 0) {
      // Обновляем без анимации для избежания мерцания
      totalPriceElement.textContent = `${price.toLocaleString('ru-RU')} ₽`;
      console.log('✅ RELOAD ADAPTER: Цена обновлена в панели:', price);
    }
  }

  /**
   * Обновляет блюда при изменении опций
   */
  updateDishes() {
    // Обновляем отображение блюд через DishesManager
    if (window.productSection && window.productSection.dishesManager) {
      window.productSection.dishesManager.updateDishesAndNutrition();
      console.log('✅ RELOAD ADAPTER: Блюда обновлены');
    }
  }

  /**
   * Получает конфигурацию для ProductSection
   */
  getConfiguration() {
    return this.formConfig;
  }

  /**
   * Перехватывает события изменения опций
   */
  interceptOptionChanges() {
    // Перехватываем клики по опциям количества дней (отображаются как calorie-option)
    document.addEventListener('click', (e) => {
      if (!this.isReloadProgram) return;

      const calorieOption = e.target.closest('.calorie-option');
      if (calorieOption) {
        // data-calories содержит калорийность (1300, 1500, ...)
        const selectedValue = calorieOption.getAttribute('data-calories');
        console.log('🔄 RELOAD ADAPTER: Изменено количество дней, калорийность:', selectedValue);
        
        // Синхронизируем с формой (переключаем radio + пересчитываем цену)
        this.syncDaysToForm(selectedValue);
        
        // Обновляем блюда с небольшой задержкой
        setTimeout(() => this.updateDishes(), 50);
      }

      const toggleSwitch = e.target.closest('.toggle-switch');
      if (toggleSwitch && toggleSwitch.closest('.meal-option')) {
        setTimeout(() => {
          console.log('🔄 RELOAD ADAPTER: Изменена meal option');
          this.updateDishes();
        }, 50);
      }
    });

    console.log('👂 RELOAD ADAPTER: Перехват событий изменения опций активирован');
  }

  /**
   * Уничтожает адаптер
   */
  destroy() {
    if (this.priceObserver) {
      this.priceObserver.disconnect();
      this.priceObserver = null;
    }
    console.log('🗑️ RELOAD ADAPTER: Адаптер уничтожен');
  }
}

// Создаем глобальный экземпляр адаптера
window.ReloadProgramAdapter = ReloadProgramAdapter;

// Экспортируем для модулей
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReloadProgramAdapter;
}
;
