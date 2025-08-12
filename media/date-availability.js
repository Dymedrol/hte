// Глобальная логика проверки доступности дней
// Используется в обоих календарях (date-picker и calendar-dropdown)

/**
 * Проверяет, доступен ли день для выбора
 * Доступные дни - только те, что показываем в меню (начиная с завтрашнего дня)
 * 
 * @param {Date} date - Дата для проверки
 * @param {Date} currentTime - Текущее время (обычно из глобальной переменной currentTime)
 * @param {number} maxMonthsAhead - Максимальное количество месяцев вперед (по умолчанию 6)
 * @param {string} deliverySchedule - График доставки ("every-day" или "every-other-day")
 * @returns {boolean} - true если день доступен, false если недоступен
 */
function isDateAvailable(date, currentTime, maxMonthsAhead = 6, deliverySchedule = "every-day") {
  // Доступные дни - только те, что показываем в меню (начиная с завтрашнего дня)
  const tomorrow = new Date(currentTime);
  tomorrow.setDate(tomorrow.getDate() + 1); // Завтрашний день
  tomorrow.setHours(0, 0, 0, 0);
  
  const maxDate = new Date(currentTime);
  maxDate.setMonth(maxDate.getMonth() + maxMonthsAhead);
  maxDate.setHours(23, 59, 59, 999);
  
  // Базовая проверка диапазона
  if (date < tomorrow || date > maxDate) {
    return false;
  }
  
  // Проверка графика доставки
  if (deliverySchedule === "every-other-day") {
    return isDeliveryDay(date, tomorrow);
  }
  
  // Для "every-day" все дни в диапазоне доступны
  return true;
}

/**
 * Проверяет, доступен ли день для выбора в date-picker (без учета графика доставки)
 * Используется только для date-picker-calendar, который показывает все дни программы
 * 
 * @param {Date} date - Дата для проверки
 * @param {Date} currentTime - Текущее время (обычно из глобальной переменной currentTime)
 * @param {number} maxMonthsAhead - Максимальное количество месяцев вперед (по умолчанию 6)
 * @returns {boolean} - true если день доступен, false если недоступен
 */
function isDateAvailableForPicker(date, currentTime, maxMonthsAhead = 6) {
  // Доступные дни - только те, что показываем в меню (начиная с завтрашнего дня)
  const tomorrow = new Date(currentTime);
  tomorrow.setDate(tomorrow.getDate() + 1); // Завтрашний день
  tomorrow.setHours(0, 0, 0, 0);
  
  const maxDate = new Date(currentTime);
  maxDate.setMonth(maxDate.getMonth() + maxMonthsAhead);
  maxDate.setHours(23, 59, 59, 999);
  
  // Только базовая проверка диапазона, без учета графика доставки
  return date >= tomorrow && date <= maxDate;
}

/**
 * Получает первый доступный день (завтрашний день)
 * 
 * @param {Date} currentTime - Текущее время
 * @returns {Date} - Первый доступный день
 */
function getFirstAvailableDay(currentTime) {
  const tomorrow = new Date(currentTime);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

/**
 * Получает последний доступный день (6 месяцев вперед)
 * 
 * @param {Date} currentTime - Текущее время
 * @param {number} maxMonthsAhead - Максимальное количество месяцев вперед (по умолчанию 6)
 * @returns {Date} - Последний доступный день
 */
function getLastAvailableDay(currentTime, maxMonthsAhead = 6) {
  const maxDate = new Date(currentTime);
  maxDate.setMonth(maxDate.getMonth() + maxMonthsAhead);
  maxDate.setHours(23, 59, 59, 999);
  return maxDate;
}

/**
 * Проверяет, является ли день днем доставки для графика "через день"
 * 
 * @param {Date} date - Дата для проверки
 * @param {Date} firstDeliveryDay - Первый день доставки (завтрашний день)
 * @returns {boolean} - true если это день доставки, false если нет
 */
function isDeliveryDay(date, firstDeliveryDay) {
  // Вычисляем количество дней от первого дня доставки
  const timeDiff = date.getTime() - firstDeliveryDay.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
  
  // Для графика "через день" доступны только четные дни (0, 2, 4, 6...)
  // где 0 = первый день доставки
  return daysDiff >= 0 && daysDiff % 2 === 0;
}

// Экспортируем функции глобально
window.DateAvailability = {
  isDateAvailable,
  isDateAvailableForPicker,
  getFirstAvailableDay,
  getLastAvailableDay,
  isDeliveryDay
}; 