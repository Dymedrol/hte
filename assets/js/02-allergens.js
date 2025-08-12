// 02. Функции для работы с аллергенами

// Глобальные переменные для аллергенов
let selectedAllergenIds = []; // Массив ID выбранных аллергенов
let allergenTrigger, allergenDropdown, allergenSearch, allergenTagsContainer;

/**
 * Генерирует HTML элементы для списка аллергенов
 * @param {Array} allergensData - Массив данных аллергенов
 */
function generateAllergenItems(allergensData) {
  const allergenList = document.querySelector('.allergen-list');
  if (!allergenList) return;
  
  allergenList.innerHTML = '';
  
  // Проверяем, включены ли аллергены в программе
  if (!window.PRODUCT_CONFIG?.allergens?.enabled) {
    allergenList.innerHTML = '<div class="allergen-item" style="justify-content: center; color: var(--hte-grey-text);">Аллергены недоступны для данной программы</div>';
    return;
  }
  
  // Дополнительная проверка готовности конфигурации
  if (!window.PRODUCT_CONFIG?.allergens) {
    return;
  }
  
  allergensData.forEach(allergen => {
    const item = document.createElement('div');
    item.className = 'allergen-item';
    item.setAttribute('data-allergen', allergen.value);
    item.setAttribute('data-allergen-id', allergen.id);
    
    // Проверяем, является ли аллерген бесплатным
    const isFree = window.PRODUCT_CONFIG?.allergens?.freeAllergenIds?.includes(allergen.id);
    const allergenPrice = window.PRODUCT_CONFIG?.allergens?.allergenPrice || 0;
    
    item.innerHTML = `
      <div class="checkbox">
        <div class="checkbox-inner"></div>
      </div>
      <span class="allergen-name">${allergen.name}</span>
      <span class="allergen-price" style="display: none;">+${allergenPrice}₽</span>
    `;
    
    // Добавляем обработчик клика
    item.addEventListener('click', () => {
      selectAllergen(item, allergensData);
    });
    
    allergenList.appendChild(item);
  });
  
  // Убеждаемся, что контейнер allergen-tags скрыт, если нет выбранных аллергенов
  if (allergenTagsContainer && selectedAllergenIds.length === 0) {
    allergenTagsContainer.classList.add('hidden');
  }
}

/**
 * Переключает видимость dropdown с аллергенами
 */
function toggleAllergenDropdown() {
  allergenDropdown.classList.toggle('active');
}

/**
 * Выбирает/отменяет выбор аллергена
 * @param {HTMLElement} item - Элемент аллергена
 * @param {Array} allergensData - Массив данных аллергенов
 */
function selectAllergen(item, allergensData) {
  const allergenId = item.getAttribute('data-allergen-id');
  const allergenName = item.getAttribute('data-allergen');
  const checkbox = item.querySelector('.checkbox');
  
  if (selectedAllergenIds.includes(allergenId)) {
    // Убираем из выбранных
    selectedAllergenIds = selectedAllergenIds.filter(id => id !== allergenId);
    item.classList.remove('selected');
    checkbox.classList.remove('active');
    removeAllergenTagByName(allergenName);
  } else {
    // Проверяем максимальное количество аллергенов
    const maxAllergens = window.PRODUCT_CONFIG?.allergens?.maxAllergens || 10;
    if (selectedAllergenIds.length >= maxAllergens) {
      console.warn(`Достигнут максимум аллергенов: ${maxAllergens}`);
      return; // Не добавляем аллерген
    }
    
    // Добавляем к выбранным
    selectedAllergenIds.push(allergenId);
    item.classList.add('selected');
    checkbox.classList.add('active');
    addAllergenTag(allergenName);
  }
  
  updatePriceIndication();
  // console.log('Selected allergen IDs:', selectedAllergenIds);
  
  // Логируем обновленную конфигурацию при изменении аллергенов
  if (window.logSelectedConfiguration && typeof window.logSelectedConfiguration === 'function') {
    window.logSelectedConfiguration();
  }
  
  // Не сохраняем аллергены в localStorage при перезагрузке страницы они должны сбрасываться
}

/**
 * Добавляет тег аллергена в контейнер
 * @param {string} allergenName - Название аллергена
 */
function addAllergenTag(allergenName) {
  const tag = document.createElement('span');
  tag.className = 'allergen-tag';
  tag.innerHTML = `
    ${allergenName}
    <button class="remove-btn">×</button>
  `;
  
  // Добавляем обработчик для новой кнопки удаления
  const removeBtn = tag.querySelector('.remove-btn');
  removeBtn.addEventListener('click', () => {
    removeAllergenTag(removeBtn);
  });
  
  allergenTagsContainer.appendChild(tag);
  
  // Показываем контейнер allergen-tags, если это первый аллерген
  if (allergenTagsContainer.children.length === 1) {
    allergenTagsContainer.classList.remove('hidden');
  }
}

/**
 * Удаляет тег аллергена по названию
 * @param {string} allergenName - Название аллергена
 */
function removeAllergenTagByName(allergenName) {
  const tags = allergenTagsContainer.querySelectorAll('.allergen-tag');
  tags.forEach(tag => {
    if (tag.textContent.replace('×', '').trim() === allergenName) {
      tag.remove();
    }
  });
  
  // Скрываем контейнер allergen-tags, если не осталось аллергенов
  if (allergenTagsContainer.children.length === 0) {
    allergenTagsContainer.classList.add('hidden');
  }
}

/**
 * Удаляет тег аллергена при клике на кнопку удаления
 * @param {HTMLElement} clickedButton - Кнопка удаления
 */
function removeAllergenTag(clickedButton) {
  const allergenTag = clickedButton.closest('.allergen-tag');
  const allergenText = allergenTag.textContent.replace('×', '').trim();
  
  // Удаляем тег из DOM
  allergenTag.remove();
  
  // Скрываем контейнер allergen-tags, если это был последний аллерген
  if (allergenTagsContainer.children.length === 0) {
    allergenTagsContainer.classList.add('hidden');
  }
  
  // Удаляем из выбранных аллергенов
  const allergen = window.ALLERGENS_CONFIG?.data?.find(a => a.value === allergenText);
  if (allergen) {
    selectedAllergenIds = selectedAllergenIds.filter(id => id !== allergen.id);
    
    // Обновляем состояние чекбокса
    const allergenItem = document.querySelector(`[data-allergen-id="${allergen.id}"]`);
    if (allergenItem) {
      allergenItem.classList.remove('selected');
      const checkbox = allergenItem.querySelector('.checkbox');
      checkbox.classList.remove('active');
    }
  }
  

  
  // Обновляем отображение цен
  updatePriceIndication();
  
  // Не сохраняем аллергены в localStorage при перезагрузке страницы они должны сбрасываться
}

/**
 * Фильтрует аллергены по поисковому запросу
 * @param {string} searchTerm - Поисковый запрос
 */
function filterAllergens(searchTerm) {
  const allergenItems = document.querySelectorAll('.allergen-item');
  const searchWords = searchTerm.toLowerCase().trim().split(' ').filter(word => word.length > 0);
  
  allergenItems.forEach(item => {
    const name = item.querySelector('.allergen-name').textContent.toLowerCase();
    const nameWords = name.split(' ');
    
    // Проверяем, что каждое слово поиска совпадает с началом любого слова в названии
    const matches = searchWords.every(searchWord => {
      return nameWords.some(nameWord => nameWord.startsWith(searchWord));
    });
    
    if (matches) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

/**
 * Обновляет отображение цен для аллергенов
 */
function updatePriceIndication() {
  if (!window.PRODUCT_CONFIG?.allergens) {
    // Не выводим ошибку, просто выходим - конфигурация еще не готова
    return;
  }
  
  const selectedCount = selectedAllergenIds.length;
  
  // Скрываем все цены по умолчанию
  const allergenItems = document.querySelectorAll('.allergen-item');
  allergenItems.forEach(item => {
    const priceElement = item.querySelector('.allergen-price');
    if (priceElement) {
      priceElement.style.display = 'none';
    }
  });
  
  // Показываем цены для платных аллергенов
  const freeAllergenIds = window.PRODUCT_CONFIG.allergens.freeAllergenIds || [];
  const allergenPrice = window.PRODUCT_CONFIG.allergens.allergenPrice || 0;
  
  // Если цена за аллерген = 0, то все аллергены бесплатны
  if (allergenPrice > 0) {
    selectedAllergenIds.forEach((allergenId, index) => {
      let isFree = false;
      
      // Проверяем, бесплатен ли аллерген по списку ID
      if (freeAllergenIds.length > 0) {
        isFree = freeAllergenIds.includes(allergenId);
      }
      
      // Показываем цену только для платных аллергенов
      if (!isFree) {
        const item = document.querySelector(`[data-allergen-id="${allergenId}"]`);
        if (item) {
          const priceElement = item.querySelector('.allergen-price');
          if (priceElement) {
            priceElement.style.display = 'block';
          }
        }
      }
    });
  }
  
  // Показываем allergen-note только если есть выбранные аллергены
  const allergenNote = document.querySelector('.allergen-note');
  if (allergenNote) {
    if (selectedCount > 0) {
      allergenNote.style.display = 'flex';
    } else {
      allergenNote.style.display = 'none';
    }
  }
  
  // Управляем видимостью allergen-tags
  if (allergenTagsContainer) {
    if (selectedCount > 0) {
      allergenTagsContainer.classList.remove('hidden');
    } else {
      allergenTagsContainer.classList.add('hidden');
    }
  }
  
  // Пересчитываем общую цену
  if (typeof recalculateTotalPrice === 'function') {
    recalculateTotalPrice();
  } else if (window.productSection?.priceManager) {
    // Используем новую систему Product Section
    window.productSection.priceManager.recalculateTotalPrice();
  }
  
  // Логируем дополнительную стоимость
  const paidAllergens = selectedAllergenIds.filter((id) => {
    if (freeAllergenIds.length > 0) {
      return !freeAllergenIds.includes(id);
    }
    // Если список бесплатных пуст и цена > 0, то все аллергены платные
    return allergenPrice > 0;
  });
  const extraAllergens = paidAllergens.length;
  
  if (extraAllergens > 0) {
    // console.log(`Дополнительная стоимость: +${extraAllergens * PRODUCT_CONFIG.allergens.pricePerExtra}₽`);
    // console.log(`Бесплатные аллергены: ${selectedAllergenIds.slice(0, PRODUCT_CONFIG.allergens.freeLimit).join(', ')}`);
    // console.log(`Платные аллергены: ${paidAllergens.join(', ')}`);
  } else if (selectedCount > 0) {
    // console.log(`Выбрано аллергенов: ${selectedCount} (в пределах бесплатного лимита)`);
    // console.log(`Бесплатные аллергены: ${selectedAllergenIds.join(', ')}`);
  }
}

/**
 * Обновляет информационный блок аллергенов из конфигурации
 */
function updateAllergenInfo() {
  if (!window.PRODUCT_CONFIG?.allergens) {
    // Не выводим ошибку, просто выходим - конфигурация еще не готова
    return;
  }
  
  const allergenConfig = window.PRODUCT_CONFIG.allergens;
  const freeTextElement = document.getElementById('allergenFreeText');
  const paidTextElement = document.getElementById('allergenPaidText');
  const priceElement = document.getElementById('allergen-price');
  const separatorElement = document.getElementById('allergenInfoSeparator');
  
  // Обновляем текст об аллергенах из конфигурации
  if (freeTextElement && allergenConfig.texts?.allergenText) {
    freeTextElement.textContent = allergenConfig.texts.allergenText;
  }
  
  // Проверяем, показывать ли блок о платных аллергенах
  const allergenPrice = allergenConfig.allergenPrice || 0;
  const showPaidSection = allergenPrice > 0;
  
  // Управляем видимостью текста о платных аллергенах
  if (paidTextElement) {
    if (showPaidSection) {
      paidTextElement.style.display = 'inline';
    } else {
      paidTextElement.style.display = 'none';
    }
  }
  
  // Управляем видимостью и обновляем цену
  if (priceElement) {
    if (showPaidSection) {
      priceElement.textContent = `+${allergenPrice} ₽`;
      priceElement.style.display = 'inline';
    } else {
      priceElement.style.display = 'none';
    }
  }
  
  // Управляем разделителем между текстами
  if (separatorElement) {
    if (showPaidSection) {
      separatorElement.style.display = 'inline';
    } else {
      separatorElement.style.display = 'none';
    }
  }
}

/**
 * Обновляет отображение аллергенов при загрузке настроек
 * @param {Array} allergensData - Массив данных аллергенов
 */
function updateAllergenDisplay(allergensData) {
  // Очищаем существующие теги
  if (allergenTagsContainer) {
    allergenTagsContainer.innerHTML = '';
  }
  
  // Добавляем теги для выбранных аллергенов
  selectedAllergenIds.forEach(allergenId => {
    const allergen = allergensData.find(a => a.id === allergenId);
    if (allergen) {
      addAllergenTag(allergen.value);
    }
  });
  
  // Скрываем контейнер allergen-tags, если нет выбранных аллергенов
  if (selectedAllergenIds.length === 0) {
    allergenTagsContainer.classList.add('hidden');
  }
  
  // Обновляем состояние чекбоксов
  const allergenItems = document.querySelectorAll('.allergen-item');
  allergenItems.forEach(item => {
    const itemId = item.getAttribute('data-allergen-id');
    const checkbox = item.querySelector('.checkbox');
    
    if (selectedAllergenIds.includes(itemId)) {
      item.classList.add('selected');
      checkbox.classList.add('active');
    } else {
      item.classList.remove('selected');
      checkbox.classList.remove('active');
    }
  });
  
  updatePriceIndication();
}

/**
 * Инициализирует DOM элементы для аллергенов
 */
function initializeAllergenElements() {
  allergenTrigger = document.querySelector('.allergen-trigger');
  allergenDropdown = document.querySelector('.allergen-dropdown');
  allergenSearch = document.querySelector('.allergen-search');
  allergenTagsContainer = document.querySelector('.allergen-tags');
  
  // Проверяем, готова ли конфигурация аллергенов
  if (!window.ALLERGENS_CONFIG) {
    return;
  }
  
  // Генерируем элементы аллергенов
  generateAllergenItems(window.ALLERGENS_CONFIG.data);
  
  // Скрываем контейнер allergen-tags при инициализации, если нет выбранных аллергенов
  if (allergenTagsContainer && selectedAllergenIds.length === 0) {
    allergenTagsContainer.classList.add('hidden');
  }
  
  // Обновляем отображение цен и видимость для правильной инициализации
  if (typeof updatePriceIndication === 'function') {
    updatePriceIndication();
  }
}

/**
 * Проверяет доступность модуля аллергенов
 * @deprecated Аллергены теперь создаются динамически в SettingsPanelBuilder
 */
function checkAllergenModuleVisibility() {
  if (!window.PRODUCT_CONFIG?.allergens?.enabled) {
    // Аллергены отключены - секция не будет создана
    console.log('Allergens disabled in config');
    return false;
  }
  return true;
}

/**
 * Инициализирует обработчики событий для аллергенов
 */
function initializeAllergenEventListeners() {
  // Allergen dropdown
  if (allergenTrigger && allergenDropdown && allergenSearch) {
    allergenTrigger.addEventListener('click', toggleAllergenDropdown);

    allergenSearch.addEventListener('input', (e) => {
      filterAllergens(e.target.value);
    });

    // Закрытие dropdown при клике вне его
    document.addEventListener('click', (e) => {
      if (!allergenTrigger.contains(e.target) && !allergenDropdown.contains(e.target)) {
        allergenDropdown.classList.remove('active');
      }
    });
  }
}

/**
 * Рассчитывает дополнительную стоимость за аллергены
 * @returns {number} Дополнительная стоимость
 */
function calculateAllergenExtraCost() {
  if (!window.PRODUCT_CONFIG?.allergens) return 0;
  
  const allergenPrice = window.PRODUCT_CONFIG.allergens.allergenPrice || 0;
  const freeAllergenIds = window.PRODUCT_CONFIG.allergens.freeAllergenIds || [];
  
  // Подсчитываем количество платных аллергенов
  const paidAllergens = selectedAllergenIds.filter((id) => {
    if (freeAllergenIds.length > 0) {
      return !freeAllergenIds.includes(id);
    }
    // Если список бесплатных пуст и цена > 0, то все аллергены платные
    return allergenPrice > 0;
  });
  
  return paidAllergens.length * allergenPrice;
}

/**
 * Получает информацию о бесплатных и платных аллергенах
 * @returns {Object} Объект с бесплатными и платными аллергенами
 */
function getAllergenPricingInfo() {
  const selectedCount = selectedAllergenIds.length;
  
  if (selectedCount === 0 || !window.PRODUCT_CONFIG?.allergens) {
    return {
      free: [],
      paid: [],
      totalCost: 0
    };
  }
  
  const allergenPrice = window.PRODUCT_CONFIG.allergens.allergenPrice || 0;
  const freeAllergenIds = window.PRODUCT_CONFIG.allergens.freeAllergenIds || [];
  
  // Разделяем на бесплатные и платные
  const freeAllergens = [];
  const paidAllergens = [];
  
  selectedAllergenIds.forEach((id) => {
    let isFree = false;
    
    if (freeAllergenIds.length > 0) {
      isFree = freeAllergenIds.includes(id);
    }
    // Если список бесплатных пуст и цена = 0, то все аллергены бесплатны
    else if (allergenPrice === 0) {
      isFree = true;
    }
    
    if (isFree) {
      freeAllergens.push(id);
    } else {
      paidAllergens.push(id);
    }
  });
  
  return {
    free: freeAllergens,
    paid: paidAllergens,
    totalCost: paidAllergens.length * allergenPrice
  };
}

// Экспортируем функции для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateAllergenItems,
    toggleAllergenDropdown,
    selectAllergen,
    addAllergenTag,
    removeAllergenTagByName,
    removeAllergenTag,
    filterAllergens,
    updatePriceIndication,
    updateAllergenDisplay,
    initializeAllergenElements,
    initializeAllergenEventListeners,
    checkAllergenModuleVisibility,
    calculateAllergenExtraCost,
    getAllergenPricingInfo,
    selectedAllergenIds,
    initializeAllergensWhenReady
  };
} else {
  // Экспортируем в глобальную область для использования в других скриптах
  window.initializeAllergensWhenReady = initializeAllergensWhenReady;
}

// Инициализация аллергенов только после готовности PRODUCT_CONFIG
function initializeAllergensWhenReady() {
  // Проверяем, готова ли конфигурация
  if (!window.PRODUCT_CONFIG?.allergens) {
    // Если конфигурация не готова, ждем еще
    setTimeout(initializeAllergensWhenReady, 100);
    return;
  }
  
  // Инициализируем элементы аллергенов
  initializeAllergenElements();
  
  // Скрываем контейнер allergen-tags при загрузке, если нет выбранных аллергенов
  if (allergenTagsContainer && selectedAllergenIds.length === 0) {
    allergenTagsContainer.classList.add('hidden');
  }
  
  // Обновляем отображение цен и видимость для правильной инициализации
  if (typeof updatePriceIndication === 'function') {
    updatePriceIndication();
  }
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  // Запускаем ожидание готовности конфигурации
  initializeAllergensWhenReady();
}); 