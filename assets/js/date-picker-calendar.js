// Date Picker Calendar - Календарь для выбора даты при клике на current-day
class DatePickerCalendar {
  constructor() {
    // Проверяем, что currentTime существует - без неё календарь не работает
    if (typeof window.currentTime === 'undefined' || !window.currentTime) {
      console.error('DatePickerCalendar: переменная currentTime не определена! Календарь не будет работать.');
      return;
    }
    
    this.currentDate = new Date(window.currentTime);
    
    // Состояние календаря
    this.selectedDate = null;
    this.isCalendarOpen = false;
    this.displayMonth = new Date(this.currentDate);
    
    // Ограничения
    this.maxMonthsAhead = 6;
    
    this.init();
  }
  
  init() {
    // Если DOM уже загружен, инициализируем сразу
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          this.setupEventListeners();
          this.createCalendarHTML();
        }, 100);
      });
    } else {
      // DOM уже загружен, инициализируем с небольшой задержкой
      setTimeout(() => {
        this.setupEventListeners();
        this.createCalendarHTML();
      }, 100);
    }
  }
  
  createCalendarHTML() {
    // Создаем HTML для календаря, если его еще нет
    if (!document.getElementById('datePickerCalendar')) {
      const calendarHTML = `
        <div class="date-picker-calendar" id="datePickerCalendar">
          <div class="date-picker-header">
            <button class="date-picker-nav-btn date-picker-prev-btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 12L6 8L10 4" stroke="#9D9D9D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="date-picker-title">
              <span class="date-picker-month">Месяц</span>
              <span class="date-picker-year">2025</span>
            </div>
            <button class="date-picker-nav-btn date-picker-next-btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 4L10 8L6 12" stroke="#9D9D9D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <div class="date-picker-grid" id="datePickerGrid">
            <!-- Дни недели -->
            <div class="date-picker-day-header">Пн</div>
            <div class="date-picker-day-header">Вт</div>
            <div class="date-picker-day-header">Ср</div>
            <div class="date-picker-day-header">Чт</div>
            <div class="date-picker-day-header">Пт</div>
            <div class="date-picker-day-header">Сб</div>
            <div class="date-picker-day-header">Вс</div>
            <!-- Дни месяца будут добавлены динамически -->
          </div>
        </div>
      `;
      
      // Добавляем календарь в body
      document.body.insertAdjacentHTML('beforeend', calendarHTML);
    }
  }
  
  setupEventListeners() {
    // Обработчик клика на current-day
    document.addEventListener('click', (e) => {
      if (e.target.closest('.current-day')) {
        e.stopPropagation();
        this.openCalendar(e.target.closest('.current-day'));
      }
    });
    
    // Обработчики навигации календаря
    document.addEventListener('click', (e) => {
      if (e.target.closest('.date-picker-prev-btn')) {
        e.stopPropagation();
        this.previousMonth();
      } else if (e.target.closest('.date-picker-next-btn')) {
        e.stopPropagation();
        this.nextMonth();
      }
    });
    
    // Закрытие календаря при клике вне его
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.date-picker-calendar') && 
          !e.target.closest('.current-day') && 
          this.isCalendarOpen) {
        this.closeCalendar();
      }
    });
  }
  
  openCalendar(currentDayElement) {
    const calendar = document.getElementById('datePickerCalendar');
    if (calendar) {
      calendar.classList.add('active');
      this.isCalendarOpen = true;
      this.renderCalendar();
      
      // Позиционируем календарь относительно current-day
      this.positionCalendar(currentDayElement);
    }
  }
  
  positionCalendar(currentDayElement) {
    const calendar = document.getElementById('datePickerCalendar');
    
    if (calendar && currentDayElement) {
      const dayRect = currentDayElement.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      // Позиционируем календарь под элементом current-day
      calendar.style.position = 'absolute';
      calendar.style.top = `${dayRect.bottom + scrollTop + 10}px`;
      calendar.style.left = `${dayRect.left + scrollLeft}px`;
      calendar.style.zIndex = '10000';
    }
  }
  
  closeCalendar() {
    const calendar = document.getElementById('datePickerCalendar');
    if (calendar) {
      calendar.classList.remove('active');
      this.isCalendarOpen = false;
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
    const grid = document.getElementById('datePickerGrid');
    const calendar = document.getElementById('datePickerCalendar');
    
    if (!grid || !calendar) {
      return;
    }
    
    // Очищаем сетку, оставляя заголовки дней недели
    const headers = grid.querySelectorAll('.date-picker-day-header');
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
      emptyDay.className = 'date-picker-day inactive';
      emptyDay.textContent = '';
      grid.appendChild(emptyDay);
    }
    
    // Добавляем дни месяца
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dayElement = document.createElement('div');
      dayElement.className = 'date-picker-day';
      dayElement.textContent = day;
      
      const currentDate = new Date(year, month, day);
      
      // Применяем стили
      this.applyDayStyles(dayElement, currentDate);
      
      // Добавляем обработчики для всех активных дней
      if (this.isDateSelectable(currentDate)) {
        dayElement.classList.add('selectable');
        dayElement.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectDate(currentDate);
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
    dayElement.classList.remove('active', 'past', 'selected', 'selectable', 'unavailable');
    
    // Проверяем, можно ли выбрать эту дату (раньше завтрашнего дня)
    const isSelectable = this.isDateSelectable(date);
    
    if (!isSelectable) {
      // Используем специальный класс для недоступных дней в нашем календаре
      dayElement.classList.add('unavailable');
      return;
    }
    
    dayElement.classList.add('active');
    
    // Проверяем, выбрана ли эта дата
    if (this.selectedDate && this.isSameDate(date, this.selectedDate)) {
      dayElement.classList.add('selected');
    }
  }
  
  isDateSelectable(date) {
    // Для date-picker используем функцию без учета графика доставки
    // Этот календарь показывает все дни программы, независимо от deliverySchedule
    if (typeof isDateAvailableForPicker === 'function') {
      return isDateAvailableForPicker(date, this.currentDate, this.maxMonthsAhead);
    }
    
    // Fallback к старой логике, если глобальная функция недоступна
    const tomorrow = new Date(this.currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const maxDate = new Date(this.currentDate);
    maxDate.setMonth(maxDate.getMonth() + this.maxMonthsAhead);
    maxDate.setHours(23, 59, 59, 999);
    
    return date >= tomorrow && date <= maxDate;
  }
  

  
  isSameDate(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }
  
  selectDate(date) {
    this.selectedDate = date;
    this.renderCalendar();
    
    // Новая логика для работы с product-section
    if (window.productSection && window.productSection.dateManager) {
      try {
        const dateManager = window.productSection.dateManager;
        const targetIndex = dateManager.getIndexForDate(date);
        
        if (targetIndex !== -1) {
          dateManager.setCurrentIndex(targetIndex);
          
          if (window.productSection.uiManager) {
            window.productSection.uiManager.updateDays();
          }
        }
      } catch (error) {
        console.error('Ошибка при выборе даты в календаре:', error);
      }
    }
    
    // Закрываем календарь
    setTimeout(() => {
      this.closeCalendar();
    }, 300);
  }
  
  updateCalendarHeader(calendar, year, month) {
    const monthElement = calendar.querySelector('.date-picker-month');
    const yearElement = calendar.querySelector('.date-picker-year');
    
    if (monthElement) {
      monthElement.textContent = this.getMonthName(month);
    }
    if (yearElement) {
      yearElement.textContent = year;
    }
  }
  
  updateNavigationButtons(calendar) {
    const prevBtn = calendar.querySelector('.date-picker-prev-btn');
    const nextBtn = calendar.querySelector('.date-picker-next-btn');
    
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
}

// Инициализация календаря после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  // Ждем немного, чтобы все остальные скрипты инициализировались
  setTimeout(() => {
    new DatePickerCalendar();
  }, 500);
}); 