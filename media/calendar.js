// Calendar Management - Новая простая логика
class Calendar {
  constructor() {
    // Проверяем, что currentTime существует - без неё календарь не работает
    if (typeof window.currentTime === 'undefined' || !window.currentTime) {
      console.error('Calendar: переменная currentTime не определена! Календарь не будет работать.');
      return;
    }
    
    this.currentDate = window.currentTime;
    
    // Состояние календаря
    this.startDate = null;
    this.endDate = null;
    this.hoverDate = null;
    this.isCalendarOpen = false;
    this.activeInput = 'start'; // 'start' или 'end'
    this.excludedDates = []; // Массив исключенных дат
    
    // Ограничения
    this.maxMonthsAhead = 6;
    this.displayMonth = new Date(this.currentDate);
    
    // Слой для hover эффектов
    this.hoverLayer = null;
    
    this.init();
  }
  
  init() {
    // Если DOM уже загружен, инициализируем сразу
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupEventListeners();
      });
    } else {
      // DOM уже загружен, инициализируем с небольшой задержкой
      setTimeout(() => {
        this.setupEventListeners();
      }, 100);
    }
  }
  
  setupEventListeners() {
    // Обработчики полей ввода
    const startInput = document.getElementById('startDateInput');
    const endInput = document.getElementById('endDateInput');
    
    // Сохраняем ссылку на this для использования в глобальной функции
    const self = this;
    
    // Создаем глобальную функцию для повторной инициализации
    window.reinitializeCalendarListeners = function() {
      const startInput = document.getElementById('startDateInput');
      const endInput = document.getElementById('endDateInput');
      
      // Удаляем старые listeners, если они были
      if (startInput && !startInput.hasCalendarListener) {
        startInput.addEventListener('click', () => {
          self.activeInput = 'start';
          self.openCalendar();
        });
        startInput.hasCalendarListener = true;
      }
      
      if (endInput && !endInput.hasCalendarListener) {
        endInput.addEventListener('click', () => {
          self.activeInput = 'end';
          self.openCalendar();
        });
        endInput.hasCalendarListener = true;
      }
    };
    
    if (startInput) {
      startInput.addEventListener('click', () => {
        this.activeInput = 'start';
        this.openCalendar();
      });
    }
    
    if (endInput) {
      endInput.addEventListener('click', () => {
        this.activeInput = 'end';
        this.openCalendar();
      });
    }
    
    // Обработчики навигации календаря
    document.addEventListener('click', (e) => {
      if (e.target.closest('.prev-btn')) {
        e.stopPropagation();
        this.previousMonth();
      } else if (e.target.closest('.next-btn')) {
        e.stopPropagation();
        this.nextMonth();
      }
    });
    
    // Закрытие календаря при клике вне его
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.calendar-dropdown') && 
          !e.target.closest('.input-field') && 
          this.isCalendarOpen) {
        this.closeCalendar();
      }
    });
  }
  
  openCalendar() {
    const calendar = document.getElementById('startDateCalendar');
    if (calendar) {
      calendar.classList.add('active');
      this.isCalendarOpen = true;
      this.renderCalendar();
      
      // Позиционируем календарь относительно активного инпута
      this.positionCalendar();
    }
  }
  
  positionCalendar() {
    const calendar = document.getElementById('startDateCalendar');
    const activeInputElement = document.getElementById(
      this.activeInput === 'start' ? 'startDateInput' : 'endDateInput'
    );
    
    if (calendar && activeInputElement) {
      // Простое решение: перемещаем календарь в DOM рядом с активным инпутом
      const inputContainer = activeInputElement.closest('.input-field') || activeInputElement.parentElement;
      
      if (inputContainer && inputContainer !== calendar.parentElement) {
        // Перемещаем календарь в контейнер активного инпута
        inputContainer.appendChild(calendar);
      }
    }
  }
  
  closeCalendar() {
    const calendar = document.getElementById('startDateCalendar');
    if (calendar) {
      calendar.classList.remove('active');
      this.isCalendarOpen = false;
      this.hoverDate = null;
    }
  }
  
  previousMonth() {
    const newMonth = new Date(this.displayMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    
    // Проверяем ограничения
    const currentMonth = new Date(this.currentDate);
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    if (newMonth >= currentMonth) {
      this.displayMonth = newMonth;
      this.renderCalendar();
    }
  }
  
  nextMonth() {
    const newMonth = new Date(this.displayMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    
    // Проверяем ограничения
    const maxMonth = new Date(this.currentDate);
    maxMonth.setMonth(maxMonth.getMonth() + this.maxMonthsAhead);
    maxMonth.setDate(1);
    maxMonth.setHours(0, 0, 0, 0);
    
    if (newMonth <= maxMonth) {
      this.displayMonth = newMonth;
      this.renderCalendar();
    }
  }
  
  renderCalendar() {
    const grid = document.getElementById('startDateGrid');
    const calendar = document.getElementById('startDateCalendar');
    
    if (!grid || !calendar) {
      return;
    }
    
    // Создаем hover слой если его нет
    this.createHoverLayer(grid);
    
    // Очищаем сетку, оставляя заголовки дней недели
    const headers = grid.querySelectorAll('.calendar-day-header');
    grid.innerHTML = '';
    headers.forEach(header => grid.appendChild(header));
    
    // Получаем данные месяца
    const year = this.displayMonth.getFullYear();
    const month = this.displayMonth.getMonth();
    
    // Первый день месяца
    const firstDay = new Date(year, month, 1);
    // Последний день месяца
    const lastDay = new Date(year, month + 1, 0);
    
    // День недели первого дня (0 = воскресенье, 1 = понедельник, ...)
    const firstDayOfWeek = firstDay.getDay();
    // Корректируем для понедельника как первого дня недели
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    // Добавляем пустые ячейки для выравнивания
    for (let i = 0; i < startOffset; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day inactive';
      emptyDay.textContent = '';
      grid.appendChild(emptyDay);
    }
    
    // Добавляем дни месяца
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day';
      dayElement.textContent = day;
      
      const currentDate = new Date(year, month, day);
      
      // Применяем стили
      this.applyDayStyles(dayElement, currentDate);
      
      // Добавляем обработчики для всех активных дней
      if (this.isDateSelectable(currentDate)) {
        dayElement.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectDate(currentDate);
        });
        
        dayElement.addEventListener('mouseenter', () => {
          this.handleDayHover(currentDate);
        });
        
        dayElement.addEventListener('mouseleave', () => {
          this.handleDayLeave();
        });
      }
      
      grid.appendChild(dayElement);
    }
    
    // Обновляем заголовок календаря
    this.updateCalendarHeader(calendar, year, month);
    
    // Обновляем кнопки навигации
    this.updateNavigationButtons(calendar);
  }
  
  applyDayStyles(dayElement, date) {
    // Удаляем все классы состояний
    dayElement.classList.remove('active', 'past', 'range-start', 'range-end', 'range-middle', 'range-preview', 'excluded', 'unavailable');
    
    // Проверяем, можно ли выбрать эту дату
    if (!this.isDateSelectable(date)) {
      dayElement.classList.add('unavailable');
      return;
    }
    
    dayElement.classList.add('active');
    
    // Проверяем, исключена ли дата
    if (this.isDateExcluded(date)) {
      dayElement.classList.add('excluded');
      return;
    }
    
    // Применяем классы только для выбранных дат (не для preview)
    if (this.startDate && this.isSameDate(date, this.startDate)) {
      dayElement.classList.add('range-start');
    } else if (this.endDate && this.isSameDate(date, this.endDate)) {
      dayElement.classList.add('range-end');
    } else if (this.isInSelectedRange(date)) {
      dayElement.classList.add('range-middle');
    }
  }
  
  isDateSelectable(date) {
    // Получаем график доставки из конфигурации программы
    let deliverySchedule = "every-day"; // по умолчанию каждый день
    
    // Проверяем сначала PROGRAM_CONFIG, потом старые источники
    if (window.PROGRAM_CONFIG && window.PROGRAM_CONFIG.deliverySchedule) {
      deliverySchedule = window.PROGRAM_CONFIG.deliverySchedule;
    } else if (window.PRODUCT_CONFIG && window.PRODUCT_CONFIG.deliverySchedule) {
      deliverySchedule = window.PRODUCT_CONFIG.deliverySchedule;
    } else if (window.dishesData && window.dishesData.deliverySchedule) {
      deliverySchedule = window.dishesData.deliverySchedule;
    }
    
    // Используем глобальную функцию проверки доступности
    if (typeof DateAvailability !== 'undefined' && DateAvailability.isDateAvailable) {
      const result = DateAvailability.isDateAvailable(date, this.currentDate, this.maxMonthsAhead, deliverySchedule);
      return result;
    }
    
    // Fallback к старой логике, если глобальная функция недоступна
    const today = new Date(this.currentDate);
    today.setHours(0, 0, 0, 0);
    
    const maxDate = new Date(this.currentDate);
    maxDate.setMonth(maxDate.getMonth() + this.maxMonthsAhead);
    maxDate.setHours(23, 59, 59, 999);
    
    return date >= today && date <= maxDate;
  }
  
  isSameDate(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }
  
  isInSelectedRange(date) {
    if (!this.startDate || !this.endDate) return false;
    
    const start = this.startDate < this.endDate ? this.startDate : this.endDate;
    const end = this.startDate < this.endDate ? this.endDate : this.startDate;
    
    return date >= start && date <= end;
  }
  
  toggleExcludedDate(date) {
    const dateString = date.toDateString(); // Используем toDateString() для сравнения
    
    const index = this.excludedDates.findIndex(d => d.toDateString() === dateString);
    
    if (index > -1) {
      // Удаляем дату из исключенных
      this.excludedDates.splice(index, 1);
    } else {
      // Добавляем дату в исключенные
      this.excludedDates.push(date);
    }
    this.renderCalendar();
    
    // Обновляем количество дней после изменения исключенных дат
    this.updateCalendarDaysCount();
  }
  
  isDateExcluded(date) {
    return this.excludedDates.some(d => d.toDateString() === date.toDateString());
  }
  

  
  selectDate(date) {
    
    // Если у нас уже есть полный диапазон и кликаем на день в диапазоне - исключаем его
    if (this.startDate && this.endDate && this.isInSelectedRange(date)) {
      this.toggleExcludedDate(date);
      return;
    }
    
    if (this.activeInput === 'start') {
      // Выбираем начальную дату
      this.startDate = date;
      
      // Если конечная дата раньше новой начальной, сбрасываем её
      if (this.endDate && this.endDate < this.startDate) {
        this.endDate = null;
      }
      
      // Очищаем исключенные дни при выборе новой начальной даты
      if (this.excludedDates.length > 0) {
        this.excludedDates = [];
      }
      
      this.updateInputs();
      
      // Переключаемся на выбор конечной даты
      this.activeInput = 'end';
    } else {
      // Выбираем конечную дату
      this.endDate = date;
      
      // Если конечная дата раньше начальной, меняем местами
      if (this.endDate < this.startDate) {
        const temp = this.startDate;
        this.startDate = this.endDate;
        this.endDate = temp;
        
        // Очищаем исключенные дни при перевороте диапазона
        if (this.excludedDates.length > 0) {
          this.excludedDates = [];
        }
      }
      
      this.updateInputs();
      this.hideHoverRange();
      
      // Закрываем календарь после выбора обеих дат
      setTimeout(() => {
        this.closeCalendar();
      }, 300);
    }
    

    
    this.renderCalendar();
  }
  
  createHoverLayer(grid) {
    // Создаем hover слой если его нет
    if (!this.hoverLayer) {
      this.hoverLayer = document.createElement('div');
      this.hoverLayer.className = 'calendar-hover-layer';
      this.hoverLayer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
        background: transparent;
      `;
      
      // Добавляем слой в контейнер поля ввода (родитель календаря)
      const calendar = document.getElementById('startDateCalendar');
      if (calendar && calendar.parentElement) {
        const parent = calendar.parentElement;
        parent.style.position = 'relative';
        parent.appendChild(this.hoverLayer);
              }
    }
  }
  
  handleDayHover(date) {
    // Hover эффект работает только при выборе конечной даты и если есть начальная дата
    if (this.activeInput === 'end' && this.startDate && !this.endDate && this.isDateSelectable(date)) {
      this.showHoverRange(date);
    }
  }
  
  showHoverRange(hoverDate) {
    if (!this.hoverLayer || !this.startDate) return;
    
    // Очищаем предыдущие hover элементы
    this.hoverLayer.innerHTML = '';
    
    // Определяем диапазон для показа
    const start = this.startDate < hoverDate ? this.startDate : hoverDate;
    const end = this.startDate < hoverDate ? hoverDate : this.startDate;
    
    // Получаем позиции для расчета
    const calendar = document.getElementById('startDateCalendar');
    const parentContainer = this.hoverLayer.parentElement;
    if (!calendar || !parentContainer) {
      return;
    }
    
    const calendarRect = calendar.getBoundingClientRect();
    const parentRect = parentContainer.getBoundingClientRect();
    
    // Создаем элементы для каждого дня в диапазоне
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dayElement = this.getDayElementByDate(currentDate);
      if (dayElement) {
        const dayRect = dayElement.getBoundingClientRect();
        const relativeTop = dayRect.top - parentRect.top;
        const relativeLeft = dayRect.left - parentRect.left;
        
        const hoverElement = document.createElement('div');
        hoverElement.className = 'calendar-hover-day';
        
        hoverElement.style.cssText = `
          position: absolute;
          top: ${relativeTop}px;
          left: ${relativeLeft}px;
          width: ${dayElement.offsetWidth}px;
          height: ${dayElement.offsetHeight}px;
          background-color: var(--hte-dark-accent);
          opacity: var(--opacity-low);
          border-radius: 50%;
          pointer-events: none;
        `;
        this.hoverLayer.appendChild(hoverElement);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  hideHoverRange() {
    if (this.hoverLayer) {
      this.hoverLayer.innerHTML = '';
    }
  }
  
  getDayElementByDate(date) {
    const grid = document.getElementById('startDateGrid');
    if (!grid) return null;
    
    const dayElements = grid.querySelectorAll('.calendar-day');
    for (let element of dayElements) {
      const elementDate = this.getDateFromElement(element);
      if (elementDate && this.isSameDate(elementDate, date)) {
        return element;
      }
    }
    return null;
  }
  
  getDateFromElement(element) {
    const day = parseInt(element.textContent);
    if (isNaN(day)) return null;
    
    const year = this.displayMonth.getFullYear();
    const month = this.displayMonth.getMonth();
    return new Date(year, month, day);
  }
  
  handleDayLeave() {
    this.hideHoverRange();
  }
  
  updateInputs() {
    const startInput = document.getElementById('startDateInput');
    const endInput = document.getElementById('endDateInput');
    
    if (startInput) {
      startInput.value = this.startDate ? this.formatDate(this.startDate) : '';
    }
    
    if (endInput) {
      endInput.value = this.endDate ? this.formatDate(this.endDate) : '';
    }
    
    // Обновляем количество дней в глобальной переменной
    this.updateCalendarDaysCount();
  }
  
  updateCalendarDaysCount() {
    if (this.startDate && this.endDate) {
      // Вычисляем общее количество дней в диапазоне
      const start = this.startDate < this.endDate ? this.startDate : this.endDate;
      const end = this.startDate < this.endDate ? this.endDate : this.startDate;
      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      // Подсчитываем исключенные дни, которые находятся в диапазоне
      const excludedInRange = this.excludedDates.filter(date => {
        return date >= start && date <= end;
      }).length;
      
      // Вычитаем исключенные дни из диапазона
      const activeDays = totalDays - excludedInRange;
      
      // Обновляем глобальные переменные
      if (window.calendarDaysCount !== undefined) {
        window.calendarDaysCount = activeDays;
        
        // Обновляем даты для доставки
        window.calendarStartDate = start;
        window.calendarEndDate = end;
        window.calendarExcludedDates = this.excludedDates;
        
        // Обновляем отображение
        if (window.updateCalendarDisplay) {
          window.updateCalendarDisplay();
        }
        
        // Обновляем даты доставки
        if (window.updateDeliveryDates) {
          window.updateDeliveryDates();
        }
      }
    } else {
      // Сбрасываем количество дней и даты
      if (window.calendarDaysCount !== undefined) {
        window.calendarDaysCount = 0;
        window.calendarStartDate = null;
        window.calendarEndDate = null;
        window.calendarExcludedDates = [];
        
        // Обновляем отображение
        if (window.updateCalendarDisplay) {
          window.updateCalendarDisplay();
        }
        
        // Обновляем даты доставки
        if (window.updateDeliveryDates) {
          window.updateDeliveryDates();
        }
      }
    }
  }
  
  formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }
  

  
  updateCalendarHeader(calendar, year, month) {
    const monthElement = calendar.querySelector('.calendar-month');
    const yearElement = calendar.querySelector('.calendar-year');
    
    if (monthElement) {
      monthElement.textContent = this.getMonthName(month);
    }
    if (yearElement) {
      yearElement.textContent = year;
    }
  }
  
  updateNavigationButtons(calendar) {
    const prevBtn = calendar.querySelector('.prev-btn');
    const nextBtn = calendar.querySelector('.next-btn');
    
    if (prevBtn && nextBtn) {
      const currentMonth = new Date(this.currentDate);
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      
      const maxMonth = new Date(this.currentDate);
      maxMonth.setMonth(maxMonth.getMonth() + this.maxMonthsAhead);
      maxMonth.setDate(1);
      maxMonth.setHours(0, 0, 0, 0);
      
      // Проверяем, можно ли перейти назад
      const canGoPrev = this.displayMonth > currentMonth;
      
      // Проверяем, можно ли перейти вперед
      const canGoNext = this.displayMonth < maxMonth;
      
      prevBtn.disabled = !canGoPrev;
      nextBtn.disabled = !canGoNext;
      
      prevBtn.classList.toggle('disabled', !canGoPrev);
      nextBtn.classList.toggle('disabled', !canGoNext);
    }
  }
  
  getMonthName(month) {
    const months = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return months[month];
  }

  // Метод для сброса состояния календаря
  reset() {
    // Сбрасываем состояние
    this.startDate = null;
    this.endDate = null;
    this.hoverDate = null;
    this.activeInput = 'start';
    this.excludedDates = [];
    
    // Сбрасываем глобальные переменные
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
    
    // Перерендериваем календарь для очистки визуального выделения
    this.renderCalendar();
  }
}

// Инициализация календаря после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  const calendar = new Calendar();
  
  // Делаем календарь глобально доступным
  window.calendarInstance = calendar;
}); 
