/**
 * SettingsPanelBuilder - Класс для динамического создания панели настроек
 * Создает элементы только на основе имеющихся данных в конфигурации
 */


class SettingsPanelBuilder {
  constructor(config, onComplete = null) {
    this.config = config;
    this.container = document.getElementById('settingsPanel');
    this.onComplete = onComplete;
    this.elements = {
      calorieSection: null,
      dietSection: null,
      mealOptionsSection: null,
      allergenSection: null,
      orderSummary: null
    };
  }

  /**
   * Инициализирует панель настроек
   */
  build() {
    if (!this.container) {
      console.warn('Settings panel container not found');
      return;
    }

    // Очищаем контейнер
    this.container.innerHTML = '';

    // Создаем секции только если есть соответствующие данные в конфигурации
    this.buildCalorieSection();
    this.buildDietSection();
    this.buildMealOptionsSection(); // meal-options создаются динамически в updateMealOptions
    this.buildAllergenSection();
    this.buildOrderSummary();
    
    // Создаем meal options независимо от других опций
    this.updateMealOptions();
    
    // Инициализируем event listeners после создания всех секций
    this.initializeEventListeners();
    
    // Вызываем callback если он был передан
    if (this.onComplete && typeof this.onComplete === 'function') {
      this.onComplete();
    }
  }

  /**
   * Создает секцию выбора калорийности
   */
  buildCalorieSection() {
    const calorieOptions = this.config.PRODUCT_CONFIG?.calorieOptions;
    
    if (!calorieOptions || calorieOptions.length === 0) {
      console.log('Calorie options not found, skipping calorie section');
      return;
    }

    // Если только один вариант калорийности, не создаем секцию выбора
    if (calorieOptions.length === 1) {
      console.log('Only one calorie option available, skipping calorie section');
      return;
    }

    const section = this.createSection('calorie-selection-group');
    const header = this.createSettingHeader('Выберите необходимую калорийность');
    const optionsContainer = this.createCalorieOptions(calorieOptions);

    section.appendChild(header);
    section.appendChild(optionsContainer);

    this.container.appendChild(section);
    // Применяем анимацию появления
    this.applyAppearAnimation(section);
    this.elements.calorieSection = section;
  }

  /**
   * Создает секцию выбора типа питания
   */
  buildDietSection() {
    const dietTypes = this.config.PRODUCT_CONFIG?.dietTypes;
    
    if (!dietTypes || dietTypes.length === 0) {
      console.log('Diet types not found, skipping diet section');
      return;
    }

    // Если только один тип питания, не создаем секцию выбора
    if (dietTypes.length === 1) {
      console.log('Only one diet type available, skipping diet section');
      return;
    }

    const section = this.createSection('diet-selection-group');
    const header = this.createSettingHeader('Выберите тип питания');
    const optionsContainer = this.createDietOptions(dietTypes);

    section.appendChild(header);
    section.appendChild(optionsContainer);

    this.container.appendChild(section);
    // Применяем анимацию появления
    this.applyAppearAnimation(section);
    this.elements.dietSection = section;

    // Добавляем разделительную линию после diet section только если есть другие опции
    // Проверяем, есть ли аллергены или meal options
    const hasAllergens = this.config.PRODUCT_CONFIG?.allergens?.enabled === true;
    const hasMealOptions = this.getCurrentMealOptions()?.length > 0;
    
    if (hasAllergens || hasMealOptions) {
      this.addSeparator('diet-separator');
    }
  }

  /**
   * Создает секцию meal options (только если они нужны)
   */
  buildMealOptionsSection() {
    // Meal options создаются динамически в updateMealOptions()
    // Не создаем контейнер заранее - он будет создан только при необходимости
    this.elements.mealOptionsSection = null;
  }

  /**
   * Обновляет meal options на основе выбранных калорий и диеты
   */
  updateMealOptions() {
    // Получаем meal options из конфигурации или данных
    let mealOptions = this.getCurrentMealOptions();

    // Удаляем существующие meal options и separator если они есть
    this.removeMealOptionsSection();

    // Если нет meal-options, ничего не создаем
    if (!mealOptions || mealOptions.length === 0) {
      // Обновляем стиль order summary (может измениться наличие опций)
      this.updateOrderSummaryStyle();
      return;
    }
    
    // Создаем новую секцию meal options
    this.createMealOptionsSection(mealOptions);
    
    // Обновляем стиль order summary (может измениться наличие опций)
    this.updateOrderSummaryStyle();
  }

  /**
   * Получает meal options для текущих выбранных опций
   */
  getCurrentMealOptions() {
    // Сначала пробуем получить meal options для конкретной комбинации калорий и диеты
    const selectedCalories = this.getSelectedCalories();
    const selectedDiet = this.getSelectedDiet();
    
    // Если есть выбранная комбинация, ищем соответствующие данные
    if (selectedCalories && selectedDiet) {
      const dataKey = `${selectedCalories}-${selectedDiet}`;
      
      // Проверяем в dishesData (для Premium программ с множественными файлами)
      if (this.config.dishesData && this.config.dishesData[dataKey]?.mealOptions) {
        return this.config.dishesData[dataKey].mealOptions;
      }
      
      // Проверяем в глобальной переменной PROGRAM_DISHES_DATA
      if (window.PROGRAM_DISHES_DATA && window.PROGRAM_DISHES_DATA[dataKey]?.mealOptions) {
        return window.PROGRAM_DISHES_DATA[dataKey].mealOptions;
      }
    }
    
    // Fallback: пробуем взять из PRODUCT_CONFIG (для простых программ)
    if (this.config.PRODUCT_CONFIG?.mealOptions) {
      return this.config.PRODUCT_CONFIG.mealOptions;
    }
    
    // Fallback: ищем в загруженных данных на верхнем уровне
    if (this.config.dishesData?.mealOptions) {
      return this.config.dishesData.mealOptions;
    }
    
    // Последний fallback: берем meal options из первого доступного файла данных
    if (this.config.dishesData) {
      for (const [key, data] of Object.entries(this.config.dishesData)) {
        if (data?.mealOptions) {
          return data.mealOptions;
        }
      }
    }
    
    // Последняя попытка - из глобальной переменной
    if (window.PROGRAM_DISHES_DATA) {
      for (const [key, data] of Object.entries(window.PROGRAM_DISHES_DATA)) {
        if (data?.mealOptions) {
          return data.mealOptions;
        }
      }
    }
    
    return null;
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
      return activeDietOption.getAttribute('data-diet');
    }
    return null;
  }

  /**
   * Обработчик переключения meal option
   */
  handleMealOptionToggle(event) {
    const toggleSwitch = event.target.closest('.toggle-switch');
    if (!toggleSwitch) return;

    toggleSwitch.classList.toggle('active');
    
    // Пересчитываем цену после изменения
    if (window.productSection && window.productSection.priceManager) {
      window.productSection.priceManager.recalculateTotalPrice();
    }
    
    // Обновляем отображение блюд и КБЖУ при изменении приемов пищи
    if (window.productSection && window.productSection.dishesManager) {
      window.productSection.dishesManager.updateDishesAndNutrition();
    }
    
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
  }

  /**
   * Создает секцию аллергенов
   */
  buildAllergenSection() {
    const allergenConfig = this.config.PRODUCT_CONFIG?.allergens;
    
    if (!allergenConfig?.enabled) {
      console.log('Allergens disabled, skipping allergen section');
      return;
    }

    const section = document.createElement('div');
    section.className = 'allergen-section';

    // Создаем заголовок аллергенов
    const header = this.createAllergenHeader(allergenConfig);
    section.appendChild(header);

    // Создаем dropdown аллергенов
    const dropdown = this.createAllergenDropdown();
    section.appendChild(dropdown);

    // Создаем контейнер для выбранных тегов
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'allergen-tags allergen-tags-container';
    tagsContainer.id = 'allergenTags';
    section.appendChild(tagsContainer);

    // Создаем информационную заметку
    const note = this.createAllergenNote();
    section.appendChild(note);

    this.container.appendChild(section);
    // Применяем анимацию появления
    this.applyAppearAnimation(section);
    this.elements.allergenSection = section;
  }

  /**
   * Создает секцию итоговой стоимости
   */
  buildOrderSummary() {
    const summary = document.createElement('div');
    summary.className = 'order-summary';
    
    // Проверяем есть ли у продукта какие-либо опции
    if (!this.hasAnyOptions()) {
      summary.classList.add('no-options');
    }

    const priceInfo = document.createElement('div');
    priceInfo.className = 'price-info';

    const priceLabel = document.createElement('span');
    priceLabel.className = 'price-label';
    priceLabel.textContent = 'Итого:';

    const priceDisplay = document.createElement('div');
    priceDisplay.className = 'price-display';

    const totalPrice = document.createElement('span');
    totalPrice.className = 'total-price';
    totalPrice.id = 'totalPrice';
    totalPrice.textContent = '0 ₽';

    const pricePeriod = document.createElement('span');
    pricePeriod.className = 'price-period';
    pricePeriod.id = 'pricePeriod';
    pricePeriod.textContent = '/ день';

    priceDisplay.appendChild(totalPrice);
    priceDisplay.appendChild(pricePeriod);

    priceInfo.appendChild(priceLabel);
    priceInfo.appendChild(priceDisplay);

    const orderActions = document.createElement('div');
    orderActions.className = 'order-actions';

    const addToCartBtn = document.createElement('button');
    addToCartBtn.className = 'add-to-cart-btn';
    addToCartBtn.id = 'addToCartBtn';
    addToCartBtn.textContent = 'Заказать доставку';

    const deliveryInfo = document.createElement('p');
    deliveryInfo.className = 'delivery-info';
    deliveryInfo.id = 'deliveryInfo';

    orderActions.appendChild(addToCartBtn);
    orderActions.appendChild(deliveryInfo);

    summary.appendChild(priceInfo);
    summary.appendChild(orderActions);

    this.container.appendChild(summary);
    this.elements.orderSummary = summary;
  }

  /**
   * Создает секцию meal options с данными
   */
  createMealOptionsSection(mealOptions) {
    const mealOptionsContainer = document.createElement('div');
    mealOptionsContainer.className = 'meal-options';
    mealOptionsContainer.id = 'mealOptions';

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
      
      // Добавляем обработчик события
      const toggleSwitch = div.querySelector('.toggle-switch');
      if (toggleSwitch) {
        toggleSwitch.addEventListener('click', this.handleMealOptionToggle.bind(this));
      } else {
        console.warn('⚠️ Toggle switch not found for meal option', index);
      }
    });

    // Применяем анимацию появления к контейнеру meal options
    this.applyAppearAnimation(mealOptionsContainer);

    // Вставляем meal options перед секцией аллергенов
    const allergenSection = this.elements.allergenSection;
    if (allergenSection) {
      this.container.insertBefore(mealOptionsContainer, allergenSection);
    } else {
      // Если секции аллергенов нет, вставляем перед order summary
      const orderSummary = this.elements.orderSummary;
      if (orderSummary) {
        this.container.insertBefore(mealOptionsContainer, orderSummary);
      } else {
        this.container.appendChild(mealOptionsContainer);
      }
    }
    
    this.elements.mealOptionsSection = mealOptionsContainer;

    // Добавляем разделительную линию после meal options только если есть аллергены
    const hasAllergens = this.config.PRODUCT_CONFIG?.allergens?.enabled === true;
    
    if (hasAllergens) {
      const separator = document.createElement('hr');
      separator.className = 'separator-line meal-options-separator';
      
      if (allergenSection) {
        this.container.insertBefore(separator, allergenSection);
      } else {
        const orderSummary = this.elements.orderSummary;
        if (orderSummary) {
          this.container.insertBefore(separator, orderSummary);
        } else {
          this.container.appendChild(separator);
        }
      }
    }
  }

  /**
   * Удаляет секцию meal options и связанные элементы
   */
  removeMealOptionsSection() {
    // Удаляем meal options container
    const existingContainer = document.getElementById('mealOptions');
    if (existingContainer) {
      existingContainer.remove();
    }

    // Удаляем separator
    const existingSeparator = document.querySelector('.meal-options-separator');
    if (existingSeparator) {
      existingSeparator.remove();
    }

    this.elements.mealOptionsSection = null;
  }

  /**
   * Создает базовую секцию настроек
   */
  createSection(className) {
    const section = document.createElement('div');
    section.className = `setting-group ${className}`;
    return section;
  }

  /**
   * Создает заголовок секции настроек
   */
  createSettingHeader(text) {
    const header = document.createElement('div');
    header.className = 'setting-header';

    const infoIcon = document.createElement('div');
    infoIcon.className = 'info-icon';
    infoIcon.innerHTML = `
      <svg width="2" height="10" viewBox="0 0 2 10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0.400024 2.975H1.60002V9.18269H0.400024V2.975ZM0.400024 0.817307H1.60002V2.14423H0.400024V0.817307Z" fill="#D4D4CD"/>
      </svg>
    `;

    const span = document.createElement('span');
    span.textContent = text;

    header.appendChild(infoIcon);
    header.appendChild(span);

    return header;
  }

  /**
   * Создает контейнер опций калорийности
   */
  createCalorieOptions(calorieOptions) {
    const container = document.createElement('div');
    container.className = 'calorie-options';
    container.id = 'calorieOptions';

    calorieOptions.forEach((option, index) => {
      const optionElement = document.createElement('div');
      optionElement.className = `calorie-option ${index === 0 ? 'active' : ''}`;
      optionElement.setAttribute('data-calories', option.value);
      optionElement.setAttribute('data-price', option.price);

      const value = document.createElement('span');
      value.className = 'calorie-value';
      value.textContent = option.label;

      const unit = document.createElement('span');
      unit.className = 'calorie-unit';
      unit.textContent = option.unit;

      optionElement.appendChild(value);
      optionElement.appendChild(unit);

      container.appendChild(optionElement);
    });

    return container;
  }

  /**
   * Создает контейнер опций типа питания
   */
  createDietOptions(dietTypes) {
    const container = document.createElement('div');
    container.className = 'diet-options';
    container.id = 'dietOptions';

    dietTypes.forEach((diet, index) => {
      const optionElement = document.createElement('div');
      optionElement.className = `diet-option ${index === 0 ? 'active' : ''}`;
      optionElement.setAttribute('data-diet', diet.value);
      optionElement.setAttribute('data-diet-type', diet.value);
      optionElement.setAttribute('data-price', diet.price);

      const label = document.createElement('span');
      label.textContent = diet.label;

      optionElement.appendChild(label);
      container.appendChild(optionElement);
    });

    return container;
  }

  /**
   * Создает заголовок секции аллергенов
   */
  createAllergenHeader(allergenConfig) {
    const header = document.createElement('div');
    header.className = 'allergen-header';

    const trigger = document.createElement('h3');
    trigger.className = 'allergen-trigger';
    trigger.textContent = 'Исключить аллергены';

    const info = document.createElement('p');
    info.className = 'allergen-info';
    info.id = 'allergenInfo';

    const infoText = document.createElement('span');
    infoText.className = 'info-text';
    infoText.id = 'allergenInfoText';

    const freeText = document.createElement('span');
    freeText.className = 'free-text';
    freeText.id = 'allergenFreeText';
    freeText.textContent = allergenConfig.texts?.allergenText || 'Вы можете исключить до 3 аллергенов';

    infoText.appendChild(freeText);

    // Добавляем информацию о цене если есть платные аллергены
    if (allergenConfig.allergenPrice > 0) {
      const separator = document.createElement('br');
      separator.className = 'allergen-info-separator';
      separator.id = 'allergenInfoSeparator';

      const paidText = document.createElement('span');
      paidText.className = 'paid-text';
      paidText.id = 'allergenPaidText';
      paidText.textContent = 'За каждое дополнительное исключение: ';

      infoText.appendChild(separator);
      infoText.appendChild(paidText);

      const price = document.createElement('span');
      price.className = 'price';
      price.id = 'allergen-price';
      price.textContent = `+${allergenConfig.allergenPrice} ₽`;

      info.appendChild(infoText);
      info.appendChild(price);
    } else {
      info.appendChild(infoText);
    }

    header.appendChild(trigger);
    header.appendChild(info);

    return header;
  }

  /**
   * Создает dropdown аллергенов
   */
  createAllergenDropdown() {
    const dropdown = document.createElement('div');
    dropdown.className = 'allergen-dropdown';

    const dropdownHeader = document.createElement('div');
    dropdownHeader.className = 'dropdown-header';
    const headerSpan = document.createElement('span');
    headerSpan.textContent = 'Выберите, что исключить:';
    dropdownHeader.appendChild(headerSpan);

    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';

    const searchIcon = document.createElement('div');
    searchIcon.className = 'search-icon';
    searchIcon.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.5 11.5L14 14M13 7.5C13 10.5376 10.5376 13 7.5 13C4.46243 13 2 10.5376 2 7.5C2 4.46243 4.46243 2 7.5 2C10.5376 2 13 4.46243 13 7.5Z" stroke="#D4D4CD" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'allergen-search';
    searchInput.placeholder = 'Поиск';

    searchContainer.appendChild(searchIcon);
    searchContainer.appendChild(searchInput);

    const allergenList = document.createElement('div');
    allergenList.className = 'allergen-list';
    allergenList.id = 'allergenList';

    const loadingAllergens = document.createElement('div');
    loadingAllergens.className = 'loading-allergens';
    allergenList.appendChild(loadingAllergens);

    dropdown.appendChild(dropdownHeader);
    dropdown.appendChild(searchContainer);
    dropdown.appendChild(allergenList);

    return dropdown;
  }

  /**
   * Создает информационную заметку об аллергенах
   */
  createAllergenNote() {
    const note = document.createElement('div');
    note.className = 'allergen-note';

    const infoIcon = document.createElement('div');
    infoIcon.className = 'info-icon';
    infoIcon.innerHTML = `
      <svg width="2" height="10" viewBox="0 0 2 10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0.400024 2.975H1.60002V9.18269H0.400024V2.975ZM0.400024 0.817307H1.60002V2.14423H0.400024V0.817307Z" fill="#D4D4CD"/>
      </svg>
    `;

    const span = document.createElement('span');
    span.textContent = 'Указанные продукты будут исключены из вашего меню';

    note.appendChild(infoIcon);
    note.appendChild(span);

    return note;
  }

  /**
   * Добавляет разделительную линию
   */
  addSeparator(className) {
    const separator = document.createElement('hr');
    separator.className = `separator-line ${className}`;
    this.container.appendChild(separator);
  }

  /**
   * Инициализирует event listeners для созданных элементов
   */
  initializeEventListeners() {
    // Event listeners для calorie options
    const calorieOptions = document.querySelectorAll('.calorie-option');
    calorieOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        this.handleCalorieOptionClick(e);
      });
    });

    // Event listeners для diet options
    const dietOptions = document.querySelectorAll('.diet-option');
    dietOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        this.handleDietOptionClick(e);
      });
    });

    // Простая отложенная проверка meal options на случай асинхронной загрузки данных
    setTimeout(() => {
      const existingMealOptions = document.getElementById('mealOptions');
      if (!existingMealOptions || existingMealOptions.children.length === 0) {
        this.updateMealOptions();
      }
    }, 300);
  }

  /**
   * Обработчик клика по calorie option
   */
  handleCalorieOptionClick(event) {
    const clickedOption = event.target.closest('.calorie-option');
    if (!clickedOption) return;

    // Убираем active класс у всех опций
    document.querySelectorAll('.calorie-option').forEach(option => {
      option.classList.remove('active');
    });

    // Добавляем active класс к выбранной опции
    clickedOption.classList.add('active');

    // Обновляем meal options
    this.updateMealOptions();

    // Пересчитываем цену
    if (window.productSection && window.productSection.priceManager) {
      window.productSection.priceManager.recalculateTotalPrice();
    }
  }

  /**
   * Обработчик клика по diet option
   */
  handleDietOptionClick(event) {
    const clickedOption = event.target.closest('.diet-option');
    if (!clickedOption) return;

    // Убираем active класс у всех опций
    document.querySelectorAll('.diet-option').forEach(option => {
      option.classList.remove('active');
    });

    // Добавляем active класс к выбранной опции
    clickedOption.classList.add('active');

    // Обновляем meal options
    this.updateMealOptions();

    // Пересчитываем цену
    if (window.productSection && window.productSection.priceManager) {
      window.productSection.priceManager.recalculateTotalPrice();
    }
  }

  /**
   * Публичный метод для обновления meal options при смене данных
   */
  refreshMealOptions() {
    this.updateMealOptions();
  }

  /**
   * Проверяет есть ли у продукта какие-либо опции для выбора
   */
  hasAnyOptions() {
    const config = this.config.PRODUCT_CONFIG;
    if (!config) return false;
    
    // Проверяем калории (больше одной опции)
    const hasCalorieOptions = config.calorieOptions && config.calorieOptions.length > 1;
    
    // Проверяем диеты (больше одной опции)  
    const hasDietOptions = config.dietTypes && config.dietTypes.length > 1;
    
    // Проверяем meal options (есть ли в текущей комбинации)
    const hasMealOptions = this.getCurrentMealOptions()?.length > 0;
    
    // Проверяем аллергены (включены ли)
    const hasAllergenOptions = config.allergens?.enabled === true;
    
    return hasCalorieOptions || hasDietOptions || hasMealOptions || hasAllergenOptions;
  }

  /**
   * Обновляет стиль order summary в зависимости от наличия опций
   */
  updateOrderSummaryStyle() {
    const orderSummary = this.elements.orderSummary;
    if (!orderSummary) return;
    
    if (this.hasAnyOptions()) {
      orderSummary.classList.remove('no-options');
    } else {
      orderSummary.classList.add('no-options');
    }
  }

  /**
   * Применяет анимацию появления к элементу
   */
  applyAppearAnimation(element) {
    element.classList.add('settings-panel-animate');
    
    // Удаляем класс анимации после её завершения
    element.addEventListener('animationend', () => {
      element.classList.remove('settings-panel-animate');
    }, { once: true });
  }

  /**
   * Возвращает созданные элементы для дальнейшего использования
   */
  getElements() {
    return this.elements;
  }
}

// Экспортируем класс для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SettingsPanelBuilder;
}
;
