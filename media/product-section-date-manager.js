/**
 * Модуль управления датами для Product Section
 * Отвечает за генерацию дат, навигацию по дням и расчет дней программы
 */


class DateManager {
  constructor(config) {
    this.config = config;
    this.programStartDate = null;
    this.programDuration = 0;
    this.tomorrowDate = null;
    this.currentIndex = 0;
    this.daysArray = [];
  }

  /**
   * Инициализирует даты программы
   */
  initializeProgramDates() {
    // Проверяем, не инициализированы ли уже даты
    if (this.tomorrowDate && this.programStartDate && this.programDuration > 0) {
      return;
    }

    // Получаем первый доступный день доставки используя ту же логику что и getNearestDeliveryDate
    if (typeof window.currentTime !== 'undefined' && window.currentTime) {
      const currentTime = new Date(window.currentTime);
      const currentHour = currentTime.getHours();
      const currentMinutes = currentTime.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinutes;
      const deadlineTimeInMinutes = 13 * 60 + 30; // 13:30
      
      // Получаем график доставки из конфигурации
      const deliverySchedule = window.PRODUCT_CONFIG?.deliverySchedule || window.PROGRAM_CONFIG?.deliverySchedule || 'every-day';
      
      if (currentTimeInMinutes < deadlineTimeInMinutes) {
        // Если заказ до 13:30 - доставка на следующий день
        this.tomorrowDate = new Date(currentTime);
        this.tomorrowDate.setDate(currentTime.getDate() + 1);
      } else {
        // Если заказ после 13:30 - доставка через день
        this.tomorrowDate = new Date(currentTime);
        this.tomorrowDate.setDate(currentTime.getDate() + 2);
      }
      
      // Устанавливаем время в 00:00:00 для корректного сравнения дат
      this.tomorrowDate.setHours(0, 0, 0, 0);
    } else {
      console.error('DateManager: переменная currentTime не определена! Система дат не будет работать.');
      return;
    }

    // ИСПРАВЛЕНИЕ: Программа начинается с первого доступного дня доставки, а не с фиксированной даты
    // Это обеспечивает корректный расчет дней программы
    this.programStartDate = new Date(this.tomorrowDate);
    
    // Получаем длительность программы
    this.programDuration = this.config.getProgramDuration();

    // Логируем информацию о подключенной программе
    console.log('=== ПРОГРАММА ПОДКЛЮЧЕНА ===');
    console.log('Название программы:', this.config.getProgramName());
    console.log('Количество дней в программе:', this.programDuration);
    console.log('Дата начала программы (исправлено):', this.programStartDate.toDateString());
    console.log('Глобальная дата (currentTime):', typeof window.currentTime !== 'undefined' ? window.currentTime.toDateString() : 'Не определена');
    console.log('Первый доступный день доставки:', this.tomorrowDate.toDateString());
    console.log('================================');
  }

  /**
   * Форматирует дату в формат "Понедельник, 1 сентября"
   * @param {Date} date - дата для форматирования
   * @returns {string} - отформатированная дата
   */
  formatDateForDisplay(date) {
    const daysOfWeek = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    
    const dayOfWeek = daysOfWeek[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    
    return `${dayOfWeek}, ${day} ${month}`;
  }

  /**
   * Вычисляет день программы для заданной даты
   * @param {Date} targetDate - целевая дата
   * @returns {number} - индекс дня программы (0-based)
   */
  calculateProgramDayForDate(targetDate) {
    if (!this.programStartDate || !this.programDuration) {
      console.error('Program start date or duration not initialized');
      return 0;
    }
    
    // ИСПРАВЛЕНИЕ: Упрощенная логика - считаем дни от начала программы
    // Программа начинается с первого дня доставки (tomorrowDate)
    const timeDiff = targetDate.getTime() - this.programStartDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
    
    // Если дата раньше начала программы, возвращаем первый день
    if (daysDiff < 0) {
      return 0;
    }
    
    // Вычисляем остаток от деления для циклического повторения
    const programDayIndex = daysDiff % this.programDuration;
    
    // Убеждаемся, что индекс не превышает длительность программы
    return Math.min(programDayIndex, this.programDuration - 1);
  }

  /**
   * Генерирует массив дат на 180 дней вперед от завтрашнего дня
   * @returns {Array} - массив объектов с датами и информацией о днях программы
   */
  generateDaysArray() {
    // Инициализируем даты программы, если еще не инициализированы
    if (!this.tomorrowDate) {
      this.initializeProgramDates();
      
      // Если после инициализации tomorrowDate все еще не определена, возвращаем пустой массив
      if (!this.tomorrowDate) {
        return [];
      }
    }
    
    const days = [];
    const currentDate = new Date(this.tomorrowDate);
    
    for (let i = 0; i < 180; i++) {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() + i);
      
      // Вычисляем, какой день программы должен быть показан для этой даты
      const programDayIndex = this.calculateProgramDayForDate(date);
      
      days.push({
        date: date,
        displayText: this.formatDateForDisplay(date),
        programDayIndex: programDayIndex
      });
    }
    
    this.daysArray = days;
    return days;
  }

  /**
   * Получает данные текущего дня
   * @returns {Object|null} - данные текущего дня или null
   */
  getCurrentDayData() {
    if (this.daysArray.length === 0) {
      this.generateDaysArray();
    }
    
    if (this.currentIndex >= this.daysArray.length) {
      console.error('Current index out of bounds:', this.currentIndex);
      return null;
    }
    
    return this.daysArray[this.currentIndex];
  }

  /**
   * Переходит к предыдущему дню
   * @returns {boolean} - true если переход выполнен успешно
   */
  goToPreviousDay() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return true;
    }
    return false;
  }

  /**
   * Переходит к следующему дню
   * @returns {boolean} - true если переход выполнен успешно
   */
  goToNextDay() {
    // Максимум 180 дней
    if (this.currentIndex < 179) {
      this.currentIndex++;
      return true;
    }
    return false;
  }

  /**
   * Устанавливает текущий индекс дня
   * @param {number} index - новый индекс
   */
  setCurrentIndex(index) {
    if (index >= 0 && index < 180) {
      this.currentIndex = index;
    } else {
      console.error('Invalid day index:', index);
    }
  }

  /**
   * Получает текущий индекс дня
   * @returns {number} - текущий индекс
   */
  getCurrentIndex() {
    return this.currentIndex;
  }

  /**
   * Находит индекс дня для указанной даты
   * @param {Date} targetDate - дата для поиска
   * @returns {number} - индекс дня или -1 если не найден
   */
  getIndexForDate(targetDate) {
    if (this.daysArray.length === 0) {
      this.generateDaysArray();
    }
    
    const targetIndex = this.daysArray.findIndex(dayData => 
      this.isSameDate(dayData.date, targetDate)
    );
    
    return targetIndex;
  }

  /**
   * Проверяет, являются ли две даты одинаковыми (год, месяц, день)
   * @param {Date} date1 - первая дата
   * @param {Date} date2 - вторая дата
   * @returns {boolean} - true если даты одинаковые
   */
  isSameDate(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  /**
   * Получает ключ дня программы для текущего дня (1-based index)
   * @returns {string} - ключ дня программы (например, "day-1")
   */
  getCurrentProgramDayKey() {
    const currentDayData = this.getCurrentDayData();
    if (!currentDayData) {
      return 'day-1';
    }
    
    const programDayIndex = currentDayData.programDayIndex;
    // ИСПРАВЛЕНИЕ: programDayIndex уже правильно вычислен в calculateProgramDayForDate
    // Не нужно дополнительно делить по модулю
    return `day-${programDayIndex + 1}`;
  }

  /**
   * Получает отображаемый текст для текущего дня
   * @returns {string} - отображаемый текст даты
   */
  getCurrentDisplayText() {
    const currentDayData = this.getCurrentDayData();
    return currentDayData ? currentDayData.displayText : '';
  }

  /**
   * Получает индекс дня программы для текущего дня
   * @returns {number} - индекс дня программы (0-based)
   */
  getCurrentProgramDayIndex() {
    const currentDayData = this.getCurrentDayData();
    return currentDayData ? currentDayData.programDayIndex : 0;
  }

  /**
   * Проверяет, является ли дата выходным днем
   * @param {Date} date - дата для проверки
   * @returns {boolean} - true если это выходной день
   */
  isWeekend(date) {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 = воскресенье, 6 = суббота
  }

  /**
   * Получает количество дней до определенной даты
   * @param {Date} targetDate - целевая дата
   * @returns {number} - количество дней
   */
  getDaysUntil(targetDate) {
    if (typeof window.currentTime === 'undefined' || !window.currentTime) {
      console.error('DateManager.getDaysUntil: переменная currentTime не определена!');
      return 0;
    }
    
    const today = new Date(window.currentTime);
    const timeDiff = targetDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
}

// Экспортируем класс для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DateManager;
} else {
  window.DateManager = DateManager;
}
;
