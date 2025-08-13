// Простой поп-ап для выбора количества
// Дима, сюда пихай актуальную цену, она встанет в верстку и будет использовать в рассчетах
let calendarPrice = null; // Переменная для хранения цены календаря

// Дим, тут у нас выводится посчитанное количество дней в календаре, забирай отсюда
let calendarDaysCount = 0; // Количество выделенных дней в календаре

// Дим, там будет перечисление дат, которое надо забрать в корзину
let deliveryDates = []; // Массив дат для доставки

// Дима, тут будет выбранное время доставки (например: "06:00 - 07:00"), забирай отсюда для корзины
let selectedDeliveryTime = null; // Переменная для хранения выбранного времени доставки

// Функция для форматирования даты в формате "18 апреля"
function formatDateForDelivery(date) {
  const day = date.getDate();
  const month = date.getMonth();
  
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];
  
  return `${day} ${months[month]}`;
}

// Функция для отметки чекбокса "с супом" в форме
function markSoupCheckbox(mealOptions) {
  const form = document.getElementById('hte-product-form');
  if (!form) {
    console.log('❌ Форма hte-product-form не найдена');
    return;
  }
  
  // Ищем .accessory-values__item с текстом "с супом"
  const accessoryItems = form.querySelectorAll('.accessory-values__item');
  let soupCheckbox = null;
  
  accessoryItems.forEach(item => {
    const spanElement = item.querySelector('span[data-product-accessory-values-item-name]');
    if (spanElement && spanElement.textContent.toLowerCase().includes('с супом')) {
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (checkbox) {
        soupCheckbox = checkbox;
      }
    }
  });
  
  if (!soupCheckbox) {
    console.log('❌ Чекбокс "с супом" не найден в форме');
    return;
  }
  
  // Проверяем, есть ли строка "с супом" в mealOptions (без учета регистра)
  const hasSoup = mealOptions.toLowerCase().includes('с супом');
  
  // Отмечаем или снимаем отметку с чекбокса
  soupCheckbox.checked = hasSoup;
  
  // Генерируем событие change для уведомления других обработчиков
  const changeEvent = new Event('change', { bubbles: true });
  soupCheckbox.dispatchEvent(changeEvent);
  
  console.log(`✅ Чекбокс "с супом" ${hasSoup ? 'отмечен' : 'снята отметка'}`);
}

// Функция для отметки чекбокса "с перекусом" в форме
function markSnackCheckbox(mealOptions) {
  const form = document.getElementById('hte-product-form');
  if (!form) {
    console.log('❌ Форма hte-product-form не найдена');
    return;
  }
  
  // Ищем .accessory-values__item с текстом "с перекусом"
  const accessoryItems = form.querySelectorAll('.accessory-values__item');
  let snackCheckbox = null;
  
  accessoryItems.forEach(item => {
    const spanElement = item.querySelector('span[data-product-accessory-values-item-name]');
    if (spanElement && spanElement.textContent.toLowerCase().includes('с перекусом')) {
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (checkbox) {
        snackCheckbox = checkbox;
      }
    }
  });
  
  if (!snackCheckbox) {
    console.log('❌ Чекбокс "с перекусом" не найден в форме');
    return;
  }
  
  // Проверяем, есть ли строка "с перекусом" в mealOptions (без учета регистра)
  const hasSnack = mealOptions.toLowerCase().includes('с перекусом');
  
  // Отмечаем или снимаем отметку с чекбокса
  snackCheckbox.checked = hasSnack;
  
  // Генерируем событие change для уведомления других обработчиков
  const changeEvent = new Event('change', { bubbles: true });
  snackCheckbox.dispatchEvent(changeEvent);
  
  console.log(`✅ Чекбокс "с перекусом" ${hasSnack ? 'отмечен' : 'снята отметка'}`);
}

// Функция для получения ближайшей доступной даты доставки
function getNearestDeliveryDate() {
  // Получаем график доставки из конфигурации
  const deliverySchedule = window.PRODUCT_CONFIG?.deliverySchedule || window.PROGRAM_CONFIG?.deliverySchedule || 'every-day';
  
  // Получаем время из глобальной переменной (не реальное время пользователя)
  const currentTime = window.currentTime ? new Date(window.currentTime) : new Date();
  
  // Определяем время заказа (часы и минуты) из глобального времени
  const globalHour = currentTime.getHours();
  const globalMinutes = currentTime.getMinutes();
  const globalTimeInMinutes = globalHour * 60 + globalMinutes;
  
  // Время дедлайна для заказа (13:30 = 13 * 60 + 30 = 810 минут)
  const deadlineTimeInMinutes = 13 * 60 + 30; // 13:30
  
  let deliveryDate;
  
  if (globalTimeInMinutes < deadlineTimeInMinutes) {
    // Если заказ до 13:30 - доставка на следующий день
    deliveryDate = new Date(currentTime);
    deliveryDate.setDate(currentTime.getDate() + 1);
  } else {
    // Если заказ после 13:30 - доставка через день
    deliveryDate = new Date(currentTime);
    deliveryDate.setDate(currentTime.getDate() + 2);
  }
  
  // Устанавливаем время в 00:00:00 для корректного сравнения дат
  deliveryDate.setHours(0, 0, 0, 0);
  
  // Если график "через день", корректируем дату
  if (deliverySchedule === 'every-other-day') {
    // График "через день" - дата уже корректна
  }
  
  return deliveryDate;
}



// Функция для логирования всех выбранных данных
function logSelectedConfiguration() {
  console.log('📋 ВЫБРАННАЯ КОНФИГУРАЦИЯ:');
  
  // Получаем конфигурацию из разных источников
  const config = window.PRODUCT_CONFIG || window.PROGRAM_CONFIG;
  
  // Проверяем, есть ли конфигурация
  if (!config) {
    console.log('⚠️ Конфигурация программы еще не загружена');
    return;
  }
  
  // 0. Название программы
  const programName = config?.programName || config?.name || 'Не указано';
  console.log(`0. 🏷️ Название программы: ${programName}`);
  
  // 1. Выбранная диета - получаем из UI или конфигурации
  let selectedDiet = 'Не выбрано';
  if (config?.dietTypes) {
    // Ищем активную кнопку диеты
    const activeDietButton = document.querySelector('.diet-option.active');
    if (activeDietButton) {
      const dietValue = activeDietButton.getAttribute('data-diet-type');
      const dietOption = config.dietTypes.find(diet => diet.value === dietValue);
      selectedDiet = dietOption?.label || dietValue;
    } else if (config.dietTypes.length === 1) {
      // Если только один вариант диеты, считаем его выбранным по умолчанию
      selectedDiet = config.dietTypes[0].label;
    }
  }
  
  console.log(`1. 🥗 Выбранная диета: ${selectedDiet}`);
  
  // Функция для выбора input с name="tip_pitaniya" в форме hte-product-form
  function selectTipPitaniyaInput(selectedDiet) {
    const form = document.getElementById('hte-product-form');
    if (!form) {
      console.log('❌ Форма hte-product-form не найдена');
      return;
    }
    
    // Ищем все input с name="tip_pitaniya" в форме
    const tipPitaniyaInputs = form.querySelectorAll('input[name="tip_pitaniya"]');
    
    if (tipPitaniyaInputs.length === 0) {
      console.log('❌ Input с name="tip_pitaniya" не найден в форме');
      return;
    }
    
    // Проходим по всем найденным input
    tipPitaniyaInputs.forEach(input => {
      // Ищем следующий span после input
      const nextSpan = input.nextElementSibling;
      
      if (nextSpan && nextSpan.tagName === 'SPAN') {
        const spanText = nextSpan.textContent.trim();
        
        // Проверяем, содержит ли span текст selectedDiet (без учета регистра)
        if (spanText.toLowerCase().includes(selectedDiet.toLowerCase())) {
          // Делаем этот input выбранным
          if (input.type === 'radio' || input.type === 'checkbox') {
            input.checked = true;
          } else {
            input.value = selectedDiet;
          }
          
          // Генерируем событие change для уведомления других обработчиков
          const changeEvent = new Event('change', { bubbles: true });
          input.dispatchEvent(changeEvent);
        }
      }
    });
  }
  
  // Вызываем функцию для выбора input
  selectTipPitaniyaInput(selectedDiet);
  
  // 2. Выбранная калорийность - получаем из UI или конфигурации
  let selectedCalories = 'Не выбрано';
  if (config?.calorieOptions) {
    // Ищем активную кнопку калорийности
    const activeCalorieButton = document.querySelector('.calorie-option.active');
    if (activeCalorieButton) {
      const calorieValue = activeCalorieButton.getAttribute('data-calories');
      const calorieOption = config.calorieOptions.find(cal => cal.value === calorieValue);
      selectedCalories = calorieOption?.label || calorieValue;
    } else if (config.calorieOptions.length === 1) {
      // Если только один вариант калорийности, считаем его выбранным по умолчанию
      selectedCalories = config.calorieOptions[0].label;
    }
  }
    console.log(`2. 🔥 Выбранная калорийность: ${selectedCalories}`);
  
  // Функция для выбора input с name="kalorijnost_" в форме hte-product-form
  function selectKalorijnostInput(selectedCalories) {
    const form = document.getElementById('hte-product-form');
    if (!form) {
      console.log('❌ Форма hte-product-form не найдена');
      return;
    }
    
    // Извлекаем число из строки selectedCalories
    const calorieNumber = selectedCalories.match(/\d+/);
    if (!calorieNumber) {
      console.log('❌ Не удалось извлечь число из строки калорийности:', selectedCalories);
      return;
    }
    
    const calorieValue = calorieNumber[0];
    
    // Ищем все input с name="kalorijnost_" в форме
    const kalorijnostInputs = form.querySelectorAll('input[name="kalorijnost_"]');
    
    if (kalorijnostInputs.length === 0) {
      console.log('❌ Input с name="kalorijnost_" не найден в форме');
      return;
    }
    
    // Проходим по всем найденным input
    kalorijnostInputs.forEach(input => {
      // Ищем следующий span после input
      const nextSpan = input.nextElementSibling;
      
      if (nextSpan && nextSpan.tagName === 'SPAN') {
        const spanText = nextSpan.textContent.trim();
        
        // Проверяем, содержит ли span число калорийности (без учета регистра)
        if (spanText.toLowerCase().includes(calorieValue.toLowerCase())) {
          // Делаем этот input выбранным
          if (input.type === 'radio' || input.type === 'checkbox') {
            input.checked = true;
          } else {
            input.value = calorieValue;
          }
          
          // Генерируем событие change для уведомления других обработчиков
          const changeEvent = new Event('change', { bubbles: true });
          input.dispatchEvent(changeEvent);
        }
      }
    });
  }
  
  // Вызываем функцию для выбора input калорийности
  selectKalorijnostInput(selectedCalories);  
  
  // 3. Выбранные meal options - получаем из UI
  let mealOptions = 'Не выбрано';
  // Ищем переключатели meal options
  const toggleSwitches = document.querySelectorAll('.meal-option .toggle-switch');
  if (toggleSwitches.length > 0) {
    const selectedMeals = [];
    toggleSwitches.forEach((toggle, index) => {
      if (toggle.classList.contains('active')) {
        // Получаем текст опции из соседнего span
        const optionText = toggle.closest('.meal-option').querySelector('span');
        if (optionText) {
          selectedMeals.push(optionText.textContent);
        } else {
          // Если span не найден, используем стандартные названия
          const mealLabels = ['Убрать завтрак и перекус', 'Убрать ужин и перекус'];
          selectedMeals.push(mealLabels[index] || `Опция ${index + 1}`);
        }
      }
    });
    if (selectedMeals.length > 0) {
      mealOptions = selectedMeals.join(', ');
    }
  }
  console.log(`3. 🍽️ Выбранные meal options: ${mealOptions}`);

  // Вызываем функцию для отметки чекбокса "с супом"
  markSoupCheckbox(mealOptions);
  
  // Вызываем функцию для отметки чекбокса "с перекусом"
  markSnackCheckbox(mealOptions);

  

  // 4. Выбранные аллергены
  let allergensText = 'Не выбрано';
  if (config?.allergens) {
    if (config.allergens.enabled === false) {
      allergensText = config.allergens.texts?.allergenText || 'Аллергены не исключаются';
    } else {
      // Получаем выбранные аллергены из DOM элементов
      const selectedAllergenItems = document.querySelectorAll('.allergen-item.selected');
      if (selectedAllergenItems.length > 0) {
        const allergenNames = Array.from(selectedAllergenItems).map(item => {
          const allergenName = item.querySelector('.allergen-name');
          return allergenName ? allergenName.textContent : 'Неизвестный аллерген';
        });
        allergensText = allergenNames.join(', ');
      } else if (config.allergens.texts?.allergenText) {
        // Если нет выбранных аллергенов, показываем текст из конфигурации
        allergensText = config.allergens.texts.allergenText;
      }
    }
  }
    console.log(`4. ⚠️ Выбранные аллергены: ${allergensText}`);
  
  // Функция для отметки чекбоксов в форме на основе выбранных аллергенов с ценой
  function markAllergenCheckboxes() {
    // Находим блок с аллергенами
    const allergenList = document.getElementById('allergenList');
    if (!allergenList) {
      console.log('❌ Блок allergenList не найден');
      return;
    }
    
    // Считаем количество выбранных аллергенов с видимым блоком цены
    const selectedAllergens = allergenList.querySelectorAll('.allergen-item.selected');
    let selectedCount = 0;
    
    selectedAllergens.forEach(allergen => {
      const priceBlock = allergen.querySelector('.allergen-price');
      if (priceBlock && priceBlock.style.display !== 'none') {
        selectedCount++;
      }
    });
    
    // Находим форму
    const form = document.getElementById('hte-product-form');
    if (!form) {
      console.log('❌ Форма hte-product-form не найдена');
      return;
    }
    
    // Ищем блок .accessory-item с текстом "Исключить продукт"
    const accessoryItems = form.querySelectorAll('.accessory-item');
    let targetAccessoryItem = null;
    
    accessoryItems.forEach(item => {
      const nameElement = item.querySelector('[data-product-accessory-name]');
      if (nameElement && nameElement.textContent.includes('Исключить продукт')) {
        targetAccessoryItem = item;
      }
    });
    
    if (!targetAccessoryItem) {
      console.log('❌ Блок .accessory-item с "Исключить продукт" не найден');
      return;
    }
    
    // Находим все чекбоксы в .accessory-values
    const accessoryValues = targetAccessoryItem.querySelector('.accessory-values');
    if (!accessoryValues) {
      console.log('❌ Блок .accessory-values не найден');
      return;
    }
    
    const checkboxes = accessoryValues.querySelectorAll('input[type="checkbox"]');
    
    // Отмечаем нужное количество чекбоксов
    checkboxes.forEach((checkbox, index) => {
      if (index < selectedCount) {
        checkbox.checked = true;
      } else {
        checkbox.checked = false;
      }
      
      // Генерируем событие change для уведомления других обработчиков
      const changeEvent = new Event('change', { bubbles: true });
      checkbox.dispatchEvent(changeEvent);
    });
    
    // Устанавливаем значение в input с name="allergens"
    const allergensInput = form.querySelector('input[name="allergens"]');
    
    if (allergensInput) {
      allergensInput.value = allergensText;
      
      // Генерируем событие change для уведомления других обработчиков
      const changeEvent = new Event('change', { bubbles: true });
      allergensInput.dispatchEvent(changeEvent);
      
      // Также генерируем событие input
      const inputEvent = new Event('input', { bubbles: true });
      allergensInput.dispatchEvent(inputEvent);

    } else {
      console.log('❌ Input с name="allergens" не найден в форме');
      console.log('🔍 Все input в форме:', form.querySelectorAll('input'));
    }
  }
  
  // Вызываем функцию для отметки чекбоксов
  markAllergenCheckboxes();  
  
  // 7. Итоговое количество выбранных дней
  const daysCount = window.calendarDaysCount || calendarDaysCount || 0;
  console.log(`7. 📅 Итоговое количество дней: ${daysCount}`);
  
  // 5. Итоговая цена за день
  console.log(`5. 💰 Итоговая цена за день: ${calendarPrice || 'Не выбрано'} ₽`);
  
  // 6. Итоговая цена (общая за количество дней)
  if (calendarPrice && daysCount) {
    const totalPrice = parseInt(calendarPrice.replace(/\s/g, '')) * daysCount;
    console.log(`6. 💳 Итоговая цена (общая): ${totalPrice.toLocaleString('ru-RU')} ₽`);
  } else {
    console.log('6. 💳 Итоговая цена (общая): Не рассчитано');
  }
  
  // Устанавливаем количество дней в input с name="quantity"
  const form = document.getElementById('hte-product-form');
  if (form) {
    const quantityInput = form.querySelector('input[name="quantity"]');
    if (quantityInput) {
      quantityInput.value = daysCount;
      
      // Генерируем событие change для уведомления других обработчиков
      const changeEvent = new Event('change', { bubbles: true });
      quantityInput.dispatchEvent(changeEvent);
    } else {
      console.log('❌ Input с name="quantity" не найден в форме');
    }
  
  } else {
    console.log('❌ Форма hte-product-form не найдена');
  }
  
  // 8. Начальная и конечная дата доставки
  if (window.calendarStartDate && window.calendarEndDate) {
    const startDate = new Date(window.calendarStartDate).toLocaleDateString('ru-RU');
    const endDate = new Date(window.calendarEndDate).toLocaleDateString('ru-RU');
    console.log(`8. 📆 Даты доставки: ${startDate} - ${endDate}`);

    // Устанавливаем даты доставки в input с name="delivery_dates"
    if (form) {
      const deliveryDatesInput = form.querySelector('input[name="delivery_dates"]');
      if (deliveryDatesInput) {

        deliveryDatesInput.value = `Даты доставки: ${startDate} - ${endDate}`;
        
        // Генерируем событие change для уведомления других обработчиков
        const changeEvent = new Event('change', { bubbles: true });
        deliveryDatesInput.dispatchEvent(changeEvent);
      } else {
        console.log('❌ Input с name="delivery_dates" не найден в форме');
      }
    }
  } else {
    console.log('8. 📆 Даты доставки: Не выбрано');
  }
  
  // 9. Массив дат в формате ("11.08.2025", "12.08.2025")
  if (deliveryDates.length > 0) {
    const formattedDates = deliveryDates.map(date => 
      date.toLocaleDateString('ru-RU')
    );
    console.log(`9. 📋 Массив дат: [${formattedDates.map(d => `"${d}"`).join(', ')}]`);
    if (form) {
      const deliveryDatesMassiveInput = form.querySelector('input[name="delivery_dates_massive"]');
      if (deliveryDatesMassiveInput) {
        deliveryDatesMassiveInput.value = `Массив дат: [${formattedDates.map(d => `"${d}"`).join(', ')}]`;
        
        // Генерируем событие change для уведомления других обработчиков
        const changeEvent = new Event('change', { bubbles: true });
        deliveryDatesMassiveInput.dispatchEvent(changeEvent);
      } else {
        console.log('❌ Input с name="delivery_dates_massive" не найден в форме');
      }
    }
  } else {
    console.log('9. 📋 Массив дат: Пустой');
  }
  
  // 10. Выбранное время доставки
  if (selectedDeliveryTime) {
    const timeRange = selectedDeliveryTime.split('-');
    if (timeRange.length === 2) {
      console.log(`10. 🕐 Время доставки: с ${timeRange[0]} до ${timeRange[1]}`);
    } else {
      console.log(`10. 🕐 Время доставки: ${selectedDeliveryTime}`);
    }
  } else {
    // Если время не выбрано, показываем первый доступный слот из конфигурации
    const config = window.PRODUCT_CONFIG || window.PROGRAM_CONFIG;
    if (config?.deliveryTimeSlots && config.deliveryTimeSlots.length > 0) {
      const firstSlot = config.deliveryTimeSlots[0];
      const timeRange = firstSlot.value.split('-');
      if (timeRange.length === 2) {
        console.log(`10. 🕐 Время доставки: с ${timeRange[0]} до ${timeRange[1]} (первый доступный слот)`);
      } else {
        console.log(`10. 🕐 Время доставки: ${firstSlot.value} (первый доступный слот)`);
      }
    } else {
      console.log('10. 🕐 Время доставки: с 06:00 до 07:00 (fallback)');
    }
  }
  
  console.log('📋 КОНЕЦ КОНФИГУРАЦИИ');
}

// Функция для рендеринга временных слотов
function renderTimeSlots() {
  const timeList = document.getElementById('timeList');
  if (!timeList) return;

  // Получаем конфигурацию из разных источников
  const config = window.PRODUCT_CONFIG || window.PROGRAM_CONFIG;
  if (!config || !config.deliveryTimeSlots) {
    console.warn('Конфигурация временных слотов не найдена');
    return;
  }

  // Очищаем существующие слоты
  timeList.innerHTML = '';

  // Рендерим каждый временной слот
  config.deliveryTimeSlots.forEach(slot => {
    const timeItem = document.createElement('div');
    timeItem.className = 'time-item';
    timeItem.setAttribute('data-time', slot.value);
    
    const timeSlot = document.createElement('span');
    timeSlot.className = 'time-slot';
    timeSlot.textContent = slot.label;
    
    timeItem.appendChild(timeSlot);
    timeList.appendChild(timeItem);
  });

  // Переинициализируем обработчики событий для новых элементов
  initTimeSlotEventListeners();
}

// Функция для инициализации обработчиков событий для временных слотов
function initTimeSlotEventListeners() {
  const timeItems = document.querySelectorAll('.time-item');
  const deliveryTimeInput = document.getElementById('deliveryTimeInput');
  const deliveryTimeDropdown = document.getElementById('deliveryTimeDropdown');
  const inputFieldWithIcon = deliveryTimeInput?.closest('.input-field.with-icon');

  if (timeItems) {
    timeItems.forEach(item => {
      item.addEventListener('click', () => {
        const timeValue = item.getAttribute('data-time');
        if (deliveryTimeInput) {
          deliveryTimeInput.value = timeValue;
          selectedDeliveryTime = timeValue;
          window.selectedDeliveryTime = selectedDeliveryTime;
        }
        
        // Обновляем информацию о доставке с новым временем
        updateDeliveryInfo();
        
        // Логируем обновленную конфигурацию при изменении времени доставки
        logSelectedConfiguration();
        
        // Закрываем дроп-даун
        if (deliveryTimeDropdown) {
          deliveryTimeDropdown.classList.remove('active');
        }
        if (inputFieldWithIcon) {
          inputFieldWithIcon.classList.remove('active');
        }
      });
    });
  }
}

// Функция для обновления информации о доставке
function updateDeliveryInfo() {
  const deliveryInfoElement = document.getElementById('deliveryInfo');
  if (!deliveryInfoElement) {
    console.log('❌ Элемент deliveryInfo не найден');
    return;
  }

  let deliveryText = '';

  // Получаем ближайшую доступную дату доставки
  const nearestDate = getNearestDeliveryDate();
  const formattedDate = formatDateForDelivery(nearestDate);
  
  // Формируем текст о ближайшей доставке
  deliveryText += `Ближайшая доставка ${formattedDate}`;

  // Всегда показываем первое доступное время из конфигурации
  const config = window.PRODUCT_CONFIG || window.PROGRAM_CONFIG;
  
  if (config?.deliveryTimeSlots && config.deliveryTimeSlots.length > 0) {
    const firstSlot = config.deliveryTimeSlots[0];
    const timeRange = firstSlot.value.split('-');
    if (timeRange.length === 2) {
      deliveryText += ` с ${timeRange[0]} до ${timeRange[1]}`;
    } else {
      deliveryText += ` • Время доставки: ${firstSlot.value}`;
    }
  } else {
    // Fallback если конфигурация не загружена
    deliveryText += ' с 06:00 до 07:00';
  }
  
  // Применяем плавную анимацию обновления
  deliveryInfoElement.classList.add('updating');
  
  // Обновляем текст с небольшой задержкой для плавности
  setTimeout(() => {
    deliveryInfoElement.textContent = deliveryText;
    deliveryInfoElement.classList.remove('updating');
  }, 150); // Половина времени анимации для плавности
}

// Функция инициализации попапа
function initQuantityPopup() {
  // Защита от повторной инициализации
  if (window.quantityPopupInitialized) {
    console.log('⚠️ Попап уже инициализирован, пропускаем');
    return;
  }
  
  const popup = document.getElementById('quantityPopup');
  
  // Проверяем, существует ли popup на текущей странице
  if (!popup) {
    console.log('❌ Попап quantityPopup не найден, повторная попытка через 100ms');
    setTimeout(initQuantityPopup, 100);
    return;
  }
  
  const addToCartBtn = document.querySelector('.add-to-cart-btn');
  const closeBtn = document.getElementById('popupClose');
  const overlay = popup.querySelector('.popup-overlay');

  // Проверяем, найдена ли кнопка "Заказать доставку"
  if (!addToCartBtn) {
    console.log('❌ Кнопка "Заказать доставку" не найдена, повторная попытка через 100ms');
    setTimeout(initQuantityPopup, 100);
    return;
  }

  console.log('✅ Попап и кнопка найдены, инициализируем обработчики');
  
  // Открытие поп-апа по кнопке "Заказать доставку"
  addToCartBtn.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('🖱️ Клик по кнопке "Заказать доставку"');
    
    // ШАГ 1: Получаем актуальную цену и кладем в переменную
    const totalPriceElement = document.querySelector('.total-price');
    if (totalPriceElement) {
      const currentPrice = totalPriceElement.textContent.trim();
      // Убираем "₽" из исходной цены и сохраняем в переменную
      calendarPrice = currentPrice.replace('₽', '').trim();
    }
    
    // ШАГ 2: Вставляем переменную в верстку
    const calendarTotalValue = document.querySelector('.total-value');
    if (calendarTotalValue && calendarPrice) {
      calendarTotalValue.textContent = `${calendarPrice} ₽ за ${calendarDaysCount} дней`;
    }
    
    // ШАГ 3: Проверяем и скрываем popup-total если дней не выбрано
    const popupTotal = document.querySelector('.popup-total');
    if (popupTotal && window.calendarDaysCount === 0) {
      popupTotal.style.display = 'none';
    } else if (popupTotal) {
      popupTotal.style.display = 'block';
    }
    
    // Обновляем даты доставки перед логированием
    updateDeliveryDates();
    
    // Логируем выбранную конфигурацию
    logSelectedConfiguration();
    
    // Сбрасываем даты при открытии поп-апа для чистого состояния
    resetPopupDates();
    
    popup.classList.add('active');
  });
  
  // Функция для обновления отображения цены в календаре
  function updateCalendarDisplay() {
    const calendarTotalValue = document.querySelector('.total-value');
    const popupTotal = document.querySelector('.popup-total');
    
    if (calendarTotalValue && calendarPrice) {
      calendarTotalValue.textContent = `${calendarPrice} ₽ за ${window.calendarDaysCount} дней`;
    }
    
    // Обновляем общую стоимость в popup-total
    if (popupTotal && calendarPrice && window.calendarDaysCount !== undefined) {
      if (window.calendarDaysCount === 0) {
        // Скрываем popup-total если дней не выбрано
        popupTotal.style.display = 'none';
      } else {
        // Показываем popup-total и обновляем стоимость
        popupTotal.style.display = 'block';
        
        const totalPrice = parseInt(calendarPrice.replace(/\s/g, '')) * window.calendarDaysCount;
        const totalValueElement = popupTotal.querySelector('.total-value');
        if (totalValueElement) {
          totalValueElement.textContent = `${totalPrice.toLocaleString('ru-RU')} ₽ за ${window.calendarDaysCount} дней`;
        }
      }
      
      // Логируем обновленную конфигурацию при изменении календаря
      if (window.calendarDaysCount > 0) {
        updateDeliveryDates();
        logSelectedConfiguration();
      }
    }
  }
  
  // Делаем функцию глобально доступной для календаря
  window.updateCalendarDisplay = updateCalendarDisplay;
  window.calendarDaysCount = calendarDaysCount;
  
  // Рендерим временные слоты при инициализации
  renderTimeSlots();
  
  // Функция для обновления дат доставки
  function updateDeliveryDates() {
    // Очищаем массив дат
    deliveryDates = [];
    
    // Если есть выбранные даты в календаре
    if (window.calendarDaysCount > 0 && window.calendarStartDate && window.calendarEndDate) {
      const start = new Date(window.calendarStartDate);
      const end = new Date(window.calendarEndDate);
      
      // Добавляем все даты в диапазоне, кроме исключенных
      const currentDate = new Date(start);
      while (currentDate <= end) {
        // Проверяем, не исключена ли дата
        const isExcluded = window.calendarExcludedDates && 
          window.calendarExcludedDates.some(excludedDate => 
            new Date(excludedDate).toDateString() === currentDate.toDateString()
          );
        
        if (!isExcluded) {
          deliveryDates.push(new Date(currentDate));
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
  }
  
  // Делаем функцию глобально доступной
  window.updateDeliveryDates = updateDeliveryDates;
  
  // Делаем переменные глобально доступными
  window.selectedDeliveryTime = selectedDeliveryTime;
  
  // Функциональность календарей в попапе
  const startDateInput = document.getElementById('startDateInput');
  const startDateCalendar = document.getElementById('startDateCalendar');
  const endDateInput = document.getElementById('endDateInput');
  
  // Пытаемся переинициализировать Calendar listeners теперь, когда попап открыт
  if (window.reinitializeCalendarListeners) {
    window.reinitializeCalendarListeners();
  }
  
  // Простой fallback на случай, если основной Calendar не работает
  if (startDateInput && startDateCalendar && !startDateInput.hasCalendarListener) {
    startDateInput.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const isActive = startDateCalendar.classList.contains('active');
      
      if (isActive) {
        startDateCalendar.classList.remove('active');
      } else {
        startDateCalendar.classList.add('active');
        
        if (window.calendarInstance && typeof window.calendarInstance.renderCalendar === 'function') {
          window.calendarInstance.activeInput = 'start';
          window.calendarInstance.renderCalendar();
        } else {
          renderSimpleCalendar(startDateCalendar);
        }
      }
    });
    startDateInput.hasCalendarListener = true;
  }
  
  if (endDateInput && !endDateInput.hasCalendarListener) {
    endDateInput.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const isActive = startDateCalendar.classList.contains('active');
      
      if (isActive) {
        startDateCalendar.classList.remove('active');
      } else {
        startDateCalendar.classList.add('active');
        
        if (window.calendarInstance && typeof window.calendarInstance.renderCalendar === 'function') {
          window.calendarInstance.activeInput = 'end';
          window.calendarInstance.renderCalendar();
        } else {
          renderSimpleCalendar(startDateCalendar);
        }
      }
    });
    endDateInput.hasCalendarListener = true;
  }
  
  // Обработчики навигации календаря
  if (startDateCalendar) {
    const prevBtn = startDateCalendar.querySelector('.prev-btn');
    const nextBtn = startDateCalendar.querySelector('.next-btn');
    const calendarGrid = startDateCalendar.querySelector('.calendar-grid');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Здесь будет логика перехода к предыдущему месяцу
        console.log('Предыдущий месяц');
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Здесь будет логика перехода к следующему месяцу
        console.log('Следующий месяц');
      });
    }
    
    // Обработчик выбора даты
    if (calendarGrid) {
      calendarGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('calendar-day') && !e.target.classList.contains('inactive') && !e.target.classList.contains('past')) {
          const selectedDate = e.target.textContent;
          const month = startDateCalendar.querySelector('.calendar-month').textContent;
          const year = startDateCalendar.querySelector('.calendar-year').textContent;
          
          // Форматируем дату для отображения
          const formattedDate = `${selectedDate} ${month} ${year}`;
          startDateInput.value = formattedDate;
          
          // Закрываем календарь
          startDateCalendar.classList.remove('active');
          
          console.log('Выбрана дата:', formattedDate);
        }
      });
    }
  }
  
  // Простая функция рендеринга календаря для случаев, когда основной Calendar недоступен
  function renderSimpleCalendar(calendarElement) {
    if (!calendarElement || !window.currentTime) {
      console.log('❌ renderSimpleCalendar: нет календаря или глобального времени');
      return;
    }
    
    // Проверяем, загружена ли конфигурация программы
    const currentDeliverySchedule = window.PRODUCT_CONFIG?.deliverySchedule || window.PROGRAM_CONFIG?.deliverySchedule || 'every-day';
    
    const grid = calendarElement.querySelector('.calendar-grid');
    if (!grid) {
      console.log('❌ renderSimpleCalendar: нет grid элемента');
      return;
    }
    
    // Очищаем календарь, оставляя заголовки
    const headers = grid.querySelectorAll('.calendar-day-header');
    grid.innerHTML = '';
    headers.forEach(header => grid.appendChild(header));
    
    // Берем текущую дату (сентябрь 2025)
    const currentDate = new Date(window.currentTime);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 8 = сентябрь
    
    // Обновляем заголовок
    const monthElement = calendarElement.querySelector('.calendar-month');
    const yearElement = calendarElement.querySelector('.calendar-year');
    if (monthElement) monthElement.textContent = getMonthName(month);
    if (yearElement) yearElement.textContent = year;
    
    // Первый день месяца
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Корректировка для понедельника как первого дня
    const firstDayOfWeek = firstDay.getDay();
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    // Пустые ячейки
    for (let i = 0; i < startOffset; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day inactive';
      grid.appendChild(emptyDay);
    }
    
    // Дни месяца
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dayElement = document.createElement('div');
      const currentDayDate = new Date(year, month, day);
      
      // Определяем, доступен ли день для доставки
      const isDeliveryDay = isDateAvailableForDelivery(currentDayDate);
      
      if (isDeliveryDay) {
        dayElement.className = 'calendar-day active';
        
        // Добавляем обработчик клика только для активных дней
        dayElement.addEventListener('click', (e) => {
          e.stopPropagation();
          const selectedDate = new Date(year, month, day);
          
          // Форматируем и записываем в поле
          const formattedDate = formatDate(selectedDate);
          const startDateInput = document.getElementById('startDateInput');
          if (startDateInput) {
            startDateInput.value = formattedDate;
          }
          
          // Закрываем календарь
          calendarElement.classList.remove('active');
        });
      } else {
        dayElement.className = 'calendar-day inactive';
      }
      
      dayElement.textContent = day;
      grid.appendChild(dayElement);
    }
    
    // Информация о календаре
    const deliverySchedule = window.PRODUCT_CONFIG?.deliverySchedule || window.PROGRAM_CONFIG?.deliverySchedule || 'every-day';
  }
  
  // Функция для проверки доступности даты для доставки
  function isDateAvailableForDelivery(date) {
    // Получаем время из глобальной переменной (не реальное время пользователя)
    const currentTime = window.currentTime ? new Date(window.currentTime) : new Date();
    const currentDate = new Date(currentTime);
    currentDate.setHours(0, 0, 0, 0);
    
    // Входные данные для отладки
    console.log(`📅 Текущая дата (глобальная): ${currentDate.toLocaleDateString('ru-RU')}`);
    
    // Проверяем, что дата не в прошлом относительно глобального времени
    if (date < currentDate) {
      console.log(`❌ Дата ${date.toLocaleDateString('ru-RU')} в прошлом относительно глобального времени`);
      return false;
    }
    
    // Получаем график доставки из конфигурации
    const deliverySchedule = window.PRODUCT_CONFIG?.deliverySchedule || window.PROGRAM_CONFIG?.deliverySchedule || 'every-day';
    
    if (deliverySchedule === 'every-other-day') {
      // Для графика "через день" проверяем, соответствует ли дата графику
      const daysDiff = Math.floor((date - currentDate) / (1000 * 60 * 60 * 24));
      
      // Используем время из глобальной переменной для определения первого дня доставки
      const globalHour = currentTime.getHours();
      const globalMinutes = currentTime.getMinutes();
      const globalTimeInMinutes = globalHour * 60 + globalMinutes;
      const deadlineTimeInMinutes = 13 * 60 + 30; // 13:30
      
      let firstDeliveryDay;
      if (globalTimeInMinutes < deadlineTimeInMinutes) {
        firstDeliveryDay = 1; // завтра
      } else {
        firstDeliveryDay = 2; // через день
      }
      
      // Проверяем, что дата соответствует графику "через день"
      const isAvailable = daysDiff >= firstDeliveryDay && (daysDiff - firstDeliveryDay) % 2 === 0;
      
      return isAvailable;
    }
    
    // Для ежедневной доставки все дни доступны
    return true;
  }
  
  // Вспомогательные функции
  function getMonthName(month) {
    const months = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return months[month];
  }
  
  function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }
  
  // Функциональность дроп-дауна времени доставки
  const deliveryTimeInput = document.getElementById('deliveryTimeInput');
  const deliveryTimeDropdown = document.getElementById('deliveryTimeDropdown');
  const inputFieldWithIcon = deliveryTimeInput?.closest('.input-field.with-icon');
  
  // Открытие/закрытие дроп-дауна по клику на input
  if (deliveryTimeInput && deliveryTimeDropdown) {
    deliveryTimeInput.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const isActive = deliveryTimeDropdown.classList.contains('active');
      
      // Закрываем все другие дроп-дауны
      document.querySelectorAll('.delivery-time-dropdown.active').forEach(dropdown => {
        if (dropdown !== deliveryTimeDropdown) {
          dropdown.classList.remove('active');
          dropdown.closest('.input-field.with-icon')?.classList.remove('active');
        }
      });
      
      // Переключаем текущий дроп-даун
      if (isActive) {
        deliveryTimeDropdown.classList.remove('active');
        inputFieldWithIcon?.classList.remove('active');
      } else {
        deliveryTimeDropdown.classList.add('active');
        inputFieldWithIcon?.classList.add('active');
      }
    });
  }

  // Закрытие дроп-дауна времени доставки при клике вне его
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.delivery-time-dropdown') && !e.target.closest('.input-field.with-icon')) {
      document.querySelectorAll('.delivery-time-dropdown.active').forEach(dropdown => {
        dropdown.classList.remove('active');
        dropdown.closest('.input-field.with-icon')?.classList.remove('active');
      });
    }
  });

  // Функция для сброса всех выбранных дат в поп-апа
  function resetPopupDates() {
    // Сбрасываем локальные переменные
    calendarDaysCount = 0;
    deliveryDates = [];
    selectedDeliveryTime = null;
    
    // Сбрасываем глобальные переменные календаря
    if (window.calendarDaysCount !== undefined) {
      window.calendarDaysCount = 0;
    }
    if (window.calendarStartDate !== undefined) {
      window.calendarStartDate = null;
    }
    if (window.calendarEndDate !== undefined) {
      window.calendarEndDate = null;
    }
    if (window.calendarExcludedDates !== undefined) {
      window.calendarExcludedDates = [];
    }
    
    // Сбрасываем поля ввода дат
    const startDateInput = document.getElementById('startDateInput');
    const endDateInput = document.getElementById('endDateInput');
    if (startDateInput) {
      startDateInput.value = '';
    }
    if (endDateInput) {
      endDateInput.value = '';
    }
    
    // Сбрасываем время доставки
    const deliveryTimeInput = document.getElementById('deliveryTimeInput');
    if (deliveryTimeInput) {
      deliveryTimeInput.value = '';
    }
    
    // Очищаем CSS стили календаря
    const calendarDays = document.querySelectorAll('.calendar-day');
    calendarDays.forEach(day => {
      day.classList.remove('selected', 'range-start', 'range-end', 'range-middle', 'range-preview', 'excluded');
    });
    
    // Сбрасываем состояние календаря
    if (window.calendarInstance) {
      window.calendarInstance.startDate = null;
      window.calendarInstance.endDate = null;
      window.calendarInstance.excludedDates = [];
      window.calendarInstance.activeInput = 'start';
    }
    
    // Обновляем даты доставки
    if (window.updateDeliveryDates) {
      window.updateDeliveryDates();
    }
    
    // Скрываем popup-total
    const popupTotal = document.querySelector('.popup-total');
    if (popupTotal) {
      popupTotal.style.display = 'none';
    }
  }

  // Закрытие поп-апа по клику на overlay или кнопку закрытия
  if (overlay) {
    overlay.addEventListener('click', () => {
      popup.classList.remove('active');
      resetPopupDates();
    });
  }
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      popup.classList.remove('active');
      resetPopupDates();
    });
  }
  
  // Закрытие по Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popup.classList.contains('active')) {
      popup.classList.remove('active');
      resetPopupDates();
    }
  });


  
  // Закрытие календаря при клике вне его
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.calendar-dropdown') && !e.target.closest('.input-field')) {
      document.querySelectorAll('.calendar-dropdown.active').forEach(calendar => {
        calendar.classList.remove('active');
      });
    }
  });

  // Инициализируем информацию о доставке
  // Ждем загрузки конфигурации продукта
  const initDeliveryInfo = () => {
    if (window.PRODUCT_CONFIG || window.PROGRAM_CONFIG) {
      updateDeliveryInfo();
      // Рендерим временные слоты из конфигурации
      renderTimeSlots();
    } else {
      // Если конфигурация еще не загружена, ждем
      setTimeout(initDeliveryInfo, 100);
    }
  };
  
  initDeliveryInfo();
  
  // Убираем дублирующие вызовы - оставляем только один при инициализации
  // Если нужна периодическая проверка, можно добавить позже по необходимости
  
  console.log('✅ Попап выбора времени доставки успешно инициализирован');
  window.quantityPopupInitialized = true; // Устанавливаем флаг после успешной инициализации
}

// Инициализация при загрузке DOM - УБИРАЕМ АВТОМАТИЧЕСКУЮ ИНИЦИАЛИЗАЦИЮ
// document.addEventListener('DOMContentLoaded', () => {
//   // Ждем загрузки компонентов
//   setTimeout(() => {
//     initQuantityPopup();
//   }, 100);
// });

// Делаем функцию глобально доступной для вызова из других скриптов
window.initQuantityPopup = initQuantityPopup;

// Делаем функцию логирования глобально доступной для других скриптов
window.logSelectedConfiguration = logSelectedConfiguration;

// Делаем функции для работы с датами глобально доступными
window.formatDateForDelivery = formatDateForDelivery;
window.getNearestDeliveryDate = getNearestDeliveryDate;
window.updateDeliveryInfo = updateDeliveryInfo;

// Делаем функции для работы с временными слотами глобально доступными
window.renderTimeSlots = renderTimeSlots;
window.initTimeSlotEventListeners = initTimeSlotEventListeners;

// Делаем функцию для отметки чекбокса "с супом" глобально доступной
window.markSoupCheckbox = markSoupCheckbox;

// Делаем функцию для отметки чекбокса "с перекусом" глобально доступной
window.markSnackCheckbox = markSnackCheckbox; 
