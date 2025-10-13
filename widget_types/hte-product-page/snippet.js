EventBus.subscribe('change_quantity:insales:product', function (data) {
  const quantityValue = document.querySelector('[data-quantity-value]');
  quantityValue.textContent = data.action.quantity.current;
  const totalPrice = document.querySelector('[data-product-price]');
  totalPrice.textContent = data.action.quantity.current * data.action.price + ' ₽';
}); 

// Product Card JavaScript - Component Version

// Функция инициализации слайдера
function initProductSlider() {
  // Проверяем, есть ли уже элементы
  const elements = checkElements();
  if (elements.allFound) {
    setupSlider(elements);
    return;
  }
  
  // Если элементы не найдены, используем MutationObserver
  const observer = new MutationObserver((mutations) => {
    const elements = checkElements();
    if (elements.allFound) {
      observer.disconnect();
      setupSlider(elements);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Таймаут на случай, если MutationObserver не сработает
  setTimeout(() => {
    observer.disconnect();
    const elements = checkElements();
    if (elements.allFound) {
      setupSlider(elements);
    }
  }, 2000);
}

// Функция проверки наличия элементов
function checkElements() {
  // Сначала ищем в общем DOM
  let thumbnails = document.querySelectorAll('.product-thumbnail');
  let mainImage = document.querySelector('.product-main-image img');
  let prevArrow = document.querySelector('.product-prev-arrow');
  let nextArrow = document.querySelector('.product-next-arrow');
  
  // Если элементы не найдены, ищем в конкретном компоненте
  if (!thumbnails.length || !mainImage || !prevArrow || !nextArrow) {
    const productCard = document.querySelector('#product-card');
    if (productCard) {
      // Ищем элементы с разными селекторами
      thumbnails = productCard.querySelectorAll('.product-thumbnail') || thumbnails;
      mainImage = productCard.querySelector('.product-main-image img') || mainImage;
      prevArrow = productCard.querySelector('.product-prev-arrow') || prevArrow;
      nextArrow = productCard.querySelector('.product-next-arrow') || nextArrow;
      
      // Если все еще не найдены, ищем по более общим селекторам
      if (!thumbnails.length || !mainImage || !prevArrow || !nextArrow) {
        // Ищем все кнопки и изображения в компоненте
        const allButtons = productCard.querySelectorAll('button');
        const allImages = productCard.querySelectorAll('img');
        const allDivs = productCard.querySelectorAll('div');
      }
    }
  }
  
  // Проверяем, что все элементы найдены и thumbnails не пустой
  const allFound = thumbnails && thumbnails.length > 0 && mainImage && 
                  prevArrow && nextArrow;
  
  // Дополнительная проверка DOM
  if (allFound) {
    // Проверка стилей
    const prevArrowStyles = window.getComputedStyle(prevArrow);
    const nextArrowStyles = window.getComputedStyle(nextArrow);
  }
  
  return {
    thumbnails, mainImage, prevArrow, nextArrow, allFound
  };
}

// Функция настройки слайдера
function setupSlider(elements) {
  const { thumbnails, mainImage, prevArrow, nextArrow } = elements;
  
  // Gallery navigation
  let currentIndex = 0;
  
  // Function to update main image and active thumbnail
  function updateGallery(index) {
    if (index < 0) index = thumbnails.length - 1;
    if (index >= thumbnails.length) index = 0;
    
    currentIndex = index;
    
    // Remove active class from all thumbnails
    thumbnails.forEach(t => t.classList.remove('active'));
    // Add active class to current thumbnail
    thumbnails[currentIndex].classList.add('active');
    
    // Update main image
    if (mainImage && thumbnails[currentIndex].dataset.image) {
      mainImage.src = thumbnails[currentIndex].dataset.image;
    }
  }
  
  // Click on thumbnails
  thumbnails.forEach((thumbnail, index) => {
    // Тестовый обработчик для проверки кликабельности
    thumbnail.addEventListener('mousedown', function(e) {
      // MouseDown по миниатюре
    });
    
    thumbnail.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      updateGallery(index);
    });
  });
  
  // Click on main image to go to next
  mainImage.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    updateGallery(currentIndex + 1);
  });
  
  // Previous arrow click
  
  // Тестовый обработчик для проверки кликабельности
  prevArrow.addEventListener('mousedown', function(e) {
    // MouseDown по предыдущей стрелке
  });
  
  prevArrow.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    updateGallery(currentIndex - 1);
  });
  
  // Next arrow click
  
  // Тестовый обработчик для проверки кликабельности
  nextArrow.addEventListener('mousedown', function(e) {
    // MouseDown по следующей стрелке
  });
  
  nextArrow.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    updateGallery(currentIndex + 1);
  });
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
  // Инициализируем слайдер с небольшой задержкой
  setTimeout(() => {
    try {
      initProductSlider();
    } catch (error) {
      // Ошибка инициализации слайдера
    }
  }, 100);
});

// Экспортируем функции для использования в других модулях
window.ProductSlider = {
  init: initProductSlider,
  checkElements: checkElements,
  setupSlider: setupSlider
};

// ===== DELIVERY TIME POPUP FUNCTIONALITY =====

// Глобальные переменные для попапа
let calendarPrice = null;
let calendarDaysCount = 0;
let deliveryDates = [];
let selectedDeliveryTime = null;

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

// Функция для рендеринга временных слотов
function renderTimeSlots() {
  const timeList = document.getElementById('timeList');
  if (!timeList) return;

  // Стандартные временные слоты для товаров
  const defaultTimeSlots = [
    { value: '06:00-07:00', label: '06:00 - 07:00' },
    { value: '07:00-08:00', label: '07:00 - 08:00' },
    { value: '08:00-09:00', label: '08:00 - 09:00' },
    { value: '09:00-10:00', label: '09:00 - 10:00' }
  ];

  // Очищаем существующие слоты
  timeList.innerHTML = '';

  // Рендерим каждый временной слот
  defaultTimeSlots.forEach(slot => {
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
        
        // Убираем класс selected со всех временных слотов
        document.querySelectorAll('.time-slot').forEach(slot => {
          slot.classList.remove('selected');
        });
        
        // Добавляем класс selected к выбранному временному слоту
        const timeSlot = item.querySelector('.time-slot');
        if (timeSlot) {
          timeSlot.classList.add('selected');
        }
        
        if (deliveryTimeInput) {
          deliveryTimeInput.value = timeValue;
          selectedDeliveryTime = timeValue;
          window.selectedDeliveryTime = selectedDeliveryTime;
        }
        
        // Обновляем состояние кнопки добавления в корзину
        updateAddToCartButtonState();
        
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

// Функция для проверки валидности выбора даты и времени доставки
function validateDeliverySelection() {
  const startDateInput = document.getElementById('startDateInput');
  const hasDateSelected = startDateInput && startDateInput.value.trim() !== '';
  
  const deliveryTimeInput = document.getElementById('deliveryTimeInput');
  const hasTimeSelected = deliveryTimeInput && deliveryTimeInput.value.trim() !== '';
  
  const hasGlobalTime = window.selectedDeliveryTime && window.selectedDeliveryTime.trim() !== '';
  
  const selectedTimeSlot = document.querySelector('.time-slot.selected');
  const hasTimeSlotSelected = selectedTimeSlot !== null;
  
  const isValid = hasDateSelected && (hasTimeSelected || hasGlobalTime || hasTimeSlotSelected);
  
  return isValid;
}

// Функция для обновления состояния кнопки добавления в корзину
function updateAddToCartButtonState() {
  const addToCartPopupBtn = document.getElementById('addToCartPopupBtn');
  if (!addToCartPopupBtn) return;
  
  const isValid = validateDeliverySelection();
  
  if (isValid) {
    addToCartPopupBtn.disabled = false;
    addToCartPopupBtn.classList.remove('disabled');
    addToCartPopupBtn.style.opacity = '1';
    addToCartPopupBtn.style.cursor = 'pointer';
  } else {
    addToCartPopupBtn.disabled = true;
    addToCartPopupBtn.classList.add('disabled');
    addToCartPopupBtn.style.opacity = '0.5';
    addToCartPopupBtn.style.cursor = 'not-allowed';
  }
}

// Функция для формирования строки с информацией о заказе
function generateOrderInfoString() {
  const parts = [];
  
  // 1. Даты доставки - передаем массив всех дат в диапазоне
  let deliveryDatesText = 'Не выбрано';
  let deliveryDatesArray = [];
  
  if (window.selectedDeliveryDates && window.selectedDeliveryDates.length > 0) {
    const formattedDates = window.selectedDeliveryDates.map(date => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    });
    
    deliveryDatesArray = formattedDates;
    
    // Передаем массив всех дат в диапазоне
    deliveryDatesText = `[${formattedDates.join(', ')}]`;
  }
  parts.push(`Даты доставки: ${deliveryDatesText}`);
  
  // 2. Массив выбранных дат (для обработки на сервере)
  if (deliveryDatesArray.length > 0) {
    parts.push(`Количество дней: ${deliveryDatesArray.length}`);
    parts.push(`Выбранные даты: [${deliveryDatesArray.join(', ')}]`);
    
    // Добавляем ISO формат дат для удобства обработки
    const isoDates = window.selectedDeliveryDates.map(date => {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD формат
    });
    parts.push(`ISO даты: [${isoDates.join(', ')}]`);
  }
  
  // 3. Время доставки
  let deliveryTimeText = 'Не выбрано';
  if (window.selectedDeliveryTime) {
    deliveryTimeText = window.selectedDeliveryTime;
  } else {
    const selectedTimeSlot = document.querySelector('.time-slot.selected');
    if (selectedTimeSlot) {
      deliveryTimeText = selectedTimeSlot.textContent.trim();
    }
  }
  parts.push(`Время доставки: ${deliveryTimeText}`);
  
  // 4. Информация о количестве товара
  const quantityPerDay = document.querySelector('[data-quantity-value]') ? 
    parseInt(document.querySelector('[data-quantity-value]').textContent) || 1 : 1;
  const deliveryDaysCount = calculateDeliveryDaysCount();
  const totalQuantity = quantityPerDay * deliveryDaysCount;
  
  parts.push(`Количество в день: ${quantityPerDay} шт`);
  parts.push(`Количество дней доставки: ${deliveryDaysCount}`);
  parts.push(`Итоговое количество: ${totalQuantity} шт`);
  
  // Объединяем все части с разделителем "|"
  return parts.join('|');
}

// Функция для сброса всех выбранных дат в поп-апа
function resetPopupDates() {
  calendarDaysCount = 0;
  deliveryDates = [];
  selectedDeliveryTime = null;
  
  if (window.calendarDaysCount !== undefined) {
    window.calendarDaysCount = 0;
  }
  if (window.selectedDeliveryDates !== undefined) {
    window.selectedDeliveryDates = [];
  }
  if (window.selectedDeliveryTime !== undefined) {
    window.selectedDeliveryTime = null;
  }
  
  const startDateInput = document.getElementById('startDateInput');
  const endDateInput = document.getElementById('endDateInput');
  const deliveryTimeInput = document.getElementById('deliveryTimeInput');
  
  if (startDateInput) startDateInput.value = '';
  if (endDateInput) endDateInput.value = '';
  if (deliveryTimeInput) deliveryTimeInput.value = '';
  
  updateAddToCartButtonState();
  
  const calendarDays = document.querySelectorAll('.calendar-day');
  calendarDays.forEach(day => {
    day.classList.remove('selected', 'range-start', 'range-end', 'range-middle', 'range-preview', 'excluded');
  });
  
  const timeSlots = document.querySelectorAll('.time-slot');
  timeSlots.forEach(slot => {
    slot.classList.remove('selected');
  });
}

// Функция инициализации попапа
function initQuantityPopup() {
  if (window.quantityPopupInitialized) {
    return;
  }
  
  const popup = document.getElementById('quantityPopup');
  if (!popup) {
    setTimeout(initQuantityPopup, 100);
    return;
  }
  
  const addToCartBtn = document.querySelector('.product-add-to-cart-btn');
  const closeBtn = document.getElementById('popupClose');
  const overlay = popup.querySelector('.popup-overlay');

  if (!addToCartBtn) {
    setTimeout(initQuantityPopup, 100);
    return;
  }

  // Открытие поп-апа по кнопке "Добавить в корзину"
  addToCartBtn.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Получаем актуальную цену товара
    const totalPriceElement = document.querySelector('[data-product-price]');
    if (totalPriceElement) {
      const currentPrice = totalPriceElement.textContent.trim();
      calendarPrice = currentPrice.replace('₽', '').trim();
    }
    
    // Сбрасываем даты при открытии поп-апа
    resetPopupDates();
    
    // ВАЖНО: Сбрасываем месяц попапа к текущему месяцу при открытии
    // Это гарантирует, что календарь в попапе не будет зависеть от календаря на основной странице
    popupCurrentDisplayMonth = null;
    popupCurrentDisplayYear = null;
    
    popup.classList.add('active');
  });
  
  // Рендерим временные слоты при инициализации
  renderTimeSlots();
  
  // Функциональность календарей в попапе
  const startDateInput = document.getElementById('startDateInput');
  const startDateCalendar = document.getElementById('startDateCalendar');
  const endDateInput = document.getElementById('endDateInput');
  
  if (startDateInput && startDateCalendar) {
    startDateInput.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const isActive = startDateCalendar.classList.contains('active');
      
      if (isActive) {
        startDateCalendar.classList.remove('active');
      } else {
        startDateCalendar.classList.add('active');
        startDateCalendar.setAttribute('data-field-type', 'start');
        renderSimpleCalendar(startDateCalendar, 'start');
      }
    });
  }
  
  if (endDateInput && startDateCalendar) {
    endDateInput.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const isActive = startDateCalendar.classList.contains('active');
      
      if (isActive) {
        startDateCalendar.classList.remove('active');
      } else {
        startDateCalendar.classList.add('active');
        startDateCalendar.setAttribute('data-field-type', 'end');
        renderSimpleCalendar(startDateCalendar, 'end');
      }
    });
  }
  
  // Обработчики навигации календаря
  if (startDateCalendar) {
    const prevBtn = startDateCalendar.querySelector('.calendar-nav-btn.prev-btn');
    const nextBtn = startDateCalendar.querySelector('.calendar-nav-btn.next-btn');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigateCalendarMonth(startDateCalendar, -1);
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigateCalendarMonth(startDateCalendar, 1);
      });
    }
    
    // Обновляем состояние кнопок навигации
    updateCalendarNavigationButtons(startDateCalendar);
  }
  
  // Функциональность дроп-дауна времени доставки
  const deliveryTimeInput = document.getElementById('deliveryTimeInput');
  const deliveryTimeDropdown = document.getElementById('deliveryTimeDropdown');
  const inputFieldWithIcon = deliveryTimeInput?.closest('.input-field.with-icon');
  
  if (deliveryTimeInput && deliveryTimeDropdown) {
    deliveryTimeInput.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const isActive = deliveryTimeDropdown.classList.contains('active');
      
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

  // Добавляем обработчик клика для кнопки "Добавить в корзину" в попапе
  const addToCartPopupBtn = document.getElementById('addToCartPopupBtn');
  if (addToCartPopupBtn) {
    addToCartPopupBtn.addEventListener('click', () => {
      // Проверяем валидность выбора даты и времени
      if (!validateDeliverySelection()) {
        alert('Пожалуйста, выберите дату и время доставки перед добавлением товара в корзину.');
        return;
      }
      
      // Формируем строку с информацией о заказе
      const orderInfoString = generateOrderInfoString();
      
      // Находим форму hte-product-form
      const form = document.getElementById('hte-product-form');
      if (!form) {
        console.log('❌ Форма hte-product-form не найдена');
        return;
      }
      
      // Находим поле comment и устанавливаем значение
      const commentInput = form.querySelector('input[name="comment"]');
      if (commentInput) {
        commentInput.value = orderInfoString;
      }
      
      // Рассчитываем итоговое количество товара
      const totalQuantity = calculateTotalQuantity();
      
      // Находим поле quantity в скрытой форме и устанавливаем итоговое количество
      const quantityInput = form.querySelector('input[name="quantity"]');
      if (quantityInput) {
        quantityInput.value = totalQuantity;
        console.log(`✅ Установлено итоговое количество: ${totalQuantity} шт`);
      } else {
        console.log('❌ Поле quantity не найдено в форме');
      }
      
      // Находим кнопку с id addToCartBtn в форме
      const addToCartBtn = form.querySelector('#addToCartBtn');
      if (!addToCartBtn) {
        console.log('❌ Кнопка с id addToCartBtn не найдена в форме');
        return;
      }
      
      // Программно кликаем по кнопке добавления в корзину
      addToCartBtn.click();
      
      // Закрываем попап
      popup.classList.remove('active');
      resetPopupDates();
    });
  }
  
  // Инициализируем состояние кнопки добавления в корзину
  updateAddToCartButtonState();
  
  window.quantityPopupInitialized = true;
}

// Переменная для хранения текущего отображаемого месяца В ПОПАПЕ
// ВАЖНО: эти переменные используются ТОЛЬКО для календарей в попапе выбора даты,
// чтобы не влиять на календарь на основной странице для просмотра блюд
let popupCurrentDisplayMonth = null;
let popupCurrentDisplayYear = null;

// Функция навигации по месяцам В ПОПАПЕ
function navigateCalendarMonth(calendarElement, direction) {
  if (popupCurrentDisplayMonth === null || popupCurrentDisplayYear === null) {
    const currentDate = window.currentTime ? new Date(window.currentTime) : new Date();
    popupCurrentDisplayMonth = currentDate.getMonth();
    popupCurrentDisplayYear = currentDate.getFullYear();
  }
  
  popupCurrentDisplayMonth += direction;
  
  // Обработка перехода через границы года
  if (popupCurrentDisplayMonth < 0) {
    popupCurrentDisplayMonth = 11;
    popupCurrentDisplayYear--;
  } else if (popupCurrentDisplayMonth > 11) {
    popupCurrentDisplayMonth = 0;
    popupCurrentDisplayYear++;
  }
  
  // Получаем тип поля из атрибута
  const fieldType = calendarElement.getAttribute('data-field-type') || 'start';
  
  renderSimpleCalendar(calendarElement, fieldType);
}

// Функция для обновления состояния кнопок навигации В ПОПАПЕ
function updateCalendarNavigationButtons(calendarElement) {
  const prevBtn = calendarElement.querySelector('.calendar-nav-btn.prev-btn');
  const nextBtn = calendarElement.querySelector('.calendar-nav-btn.next-btn');
  
  if (!prevBtn || !nextBtn) return;
  
  const currentDate = window.currentTime ? new Date(window.currentTime) : new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Инициализируем, если не установлены
  if (popupCurrentDisplayMonth === null || popupCurrentDisplayYear === null) {
    popupCurrentDisplayMonth = currentMonth;
    popupCurrentDisplayYear = currentYear;
  }
  
  // Проверяем, можно ли перейти назад (не раньше текущего месяца)
  const canGoPrev = popupCurrentDisplayYear > currentYear || 
                   (popupCurrentDisplayYear === currentYear && popupCurrentDisplayMonth > currentMonth);
  
  // Проверяем, можно ли перейти вперед (не более чем на 6 месяцев вперед)
  const maxMonth = new Date(currentDate);
  maxMonth.setMonth(maxMonth.getMonth() + 6);
  const canGoNext = popupCurrentDisplayYear < maxMonth.getFullYear() || 
                   (popupCurrentDisplayYear === maxMonth.getFullYear() && popupCurrentDisplayMonth < maxMonth.getMonth());
  
  // Обновляем состояние кнопок
  prevBtn.disabled = !canGoPrev;
  nextBtn.disabled = !canGoNext;
  
  prevBtn.classList.toggle('disabled', !canGoPrev);
  nextBtn.classList.toggle('disabled', !canGoNext);
}

// Простая функция рендеринга календаря В ПОПАПЕ
function renderSimpleCalendar(calendarElement, fieldType = 'start') {
  if (!calendarElement) return;
  
  const grid = calendarElement.querySelector('.calendar-grid');
  if (!grid) return;
  
  // Очищаем календарь, оставляя заголовки
  const headers = grid.querySelectorAll('.calendar-day-header');
  grid.innerHTML = '';
  headers.forEach(header => grid.appendChild(header));
  
  // Инициализируем текущий месяц, если не установлен
  if (popupCurrentDisplayMonth === null || popupCurrentDisplayYear === null) {
    const currentDate = window.currentTime ? new Date(window.currentTime) : new Date();
    popupCurrentDisplayMonth = currentDate.getMonth();
    popupCurrentDisplayYear = currentDate.getFullYear();
  }
  
  const year = popupCurrentDisplayYear;
  const month = popupCurrentDisplayMonth;
  
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
      dayElement.textContent = day;
      
      // Добавляем обработчик клика для активных дней
      dayElement.addEventListener('click', (e) => {
        e.stopPropagation();
        const selectedDate = new Date(year, month, day);
        const formattedDate = `${day} ${getMonthName(month)} ${year}`;
        
        if (fieldType === 'start') {
          const startDateInput = document.getElementById('startDateInput');
          if (startDateInput) {
            startDateInput.value = formattedDate;
          }
          // Устанавливаем выбранную дату в глобальную переменную
          window.selectedDeliveryDates = [selectedDate];
        } else if (fieldType === 'end') {
          const endDateInput = document.getElementById('endDateInput');
          if (endDateInput) {
            endDateInput.value = formattedDate;
          }
          // Если есть начальная дата, создаем диапазон
          if (window.selectedDeliveryDates && window.selectedDeliveryDates.length > 0) {
            const startDate = window.selectedDeliveryDates[0];
            const dates = [];
            const current = new Date(startDate);
            while (current <= selectedDate) {
              dates.push(new Date(current));
              current.setDate(current.getDate() + 1);
            }
            window.selectedDeliveryDates = dates;
          }
        }
        
        updateAddToCartButtonState();
        calendarElement.classList.remove('active');
      });
    } else {
      dayElement.className = 'calendar-day inactive';
      dayElement.textContent = day;
    }
    
    grid.appendChild(dayElement);
  }
  
  // Обновляем состояние кнопок навигации
  updateCalendarNavigationButtons(calendarElement);
}

// Функция для проверки доступности даты для доставки
function isDateAvailableForDelivery(date) {
  const currentTime = window.currentTime ? new Date(window.currentTime) : new Date();
  const currentDate = new Date(currentTime);
  currentDate.setHours(0, 0, 0, 0);
  
  // Определяем время заказа
  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinutes;
  const deadlineTimeInMinutes = 13 * 60 + 30; // 13:30
  
  // Вычисляем ближайшую доступную дату доставки
  let nearestDeliveryDate;
  if (currentTimeInMinutes < deadlineTimeInMinutes) {
    // До 13:30 - доставка на следующий день
    nearestDeliveryDate = new Date(currentDate);
    nearestDeliveryDate.setDate(currentDate.getDate() + 1);
  } else {
    // После 13:30 - доставка через день (+2 дня)
    nearestDeliveryDate = new Date(currentDate);
    nearestDeliveryDate.setDate(currentDate.getDate() + 2);
  }
  
  // Проверяем, что дата не раньше ближайшей доступной даты
  return date >= nearestDeliveryDate;
}

// Вспомогательные функции
function getMonthName(month) {
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  return months[month];
}

// Инициализация глобальных переменных
if (!window.selectedDeliveryDates) {
  window.selectedDeliveryDates = [];
}
if (!window.selectedDeliveryTime) {
  window.selectedDeliveryTime = null;
}

// Инициализация попапа при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    try {
      initProductSlider();
      initQuantityPopup();
      updateDeliveryInfo();
    } catch (error) {
      console.error('Ошибка инициализации:', error);
    }
  }, 100);
});

// Функция для расчета количества дней доставки
function calculateDeliveryDaysCount() {
  if (!window.selectedDeliveryDates || window.selectedDeliveryDates.length === 0) {
    return 1; // По умолчанию 1 день
  }
  
  return window.selectedDeliveryDates.length;
}

// Функция для расчета итогового количества товара
function calculateTotalQuantity() {
  // Получаем количество товара в день из правого блока
  const quantityValueElement = document.querySelector('[data-quantity-value]');
  const quantityPerDay = quantityValueElement ? parseInt(quantityValueElement.textContent) || 1 : 1;
  
  // Получаем количество дней доставки
  const deliveryDaysCount = calculateDeliveryDaysCount();
  
  // Итоговое количество = количество в день × количество дней доставки
  const totalQuantity = quantityPerDay * deliveryDaysCount;
  
  console.log(`📊 Расчет количества: ${quantityPerDay} шт/день × ${deliveryDaysCount} дней = ${totalQuantity} шт`);
  
  return totalQuantity;
}

// Функция для обновления информации о доставке
function updateDeliveryInfo() {
  const deliveryInfoElement = document.querySelector('.product-delivery-info');
  if (!deliveryInfoElement) {
    console.log('❌ Элемент .product-delivery-info не найден');
    return;
  }

  let deliveryText = '';

  // Получаем ближайшую доступную дату доставки
  const nearestDate = getNearestDeliveryDate();
  const formattedDate = formatDateForDelivery(nearestDate);
  
  // Формируем текст о ближайшей доставке
  deliveryText += `Ближайшая доставка: ${formattedDate}`;

  // Показываем время доставки с 6:00 до 10:00
  deliveryText += ' с 6:00 до 10:00';

  // Обновляем текст
  deliveryInfoElement.textContent = deliveryText;
}

// Делаем функции глобально доступными
window.initQuantityPopup = initQuantityPopup;
window.generateOrderInfoString = generateOrderInfoString;
window.validateDeliverySelection = validateDeliverySelection;
window.updateAddToCartButtonState = updateAddToCartButtonState;
window.updateDeliveryInfo = updateDeliveryInfo;
window.calculateDeliveryDaysCount = calculateDeliveryDaysCount;
window.calculateTotalQuantity = calculateTotalQuantity;

  