/**
 * Адаптер попапа для программы "Перезагрузка"
 * Модифицирует попап для выбора только одной даты вместо диапазона
 * Изолирован от других программ
 */

class ReloadPopupAdapter {
  constructor() {
    this.isReloadProgram = false;
    this.originalQuantityPopupInit = null;
  }

  /**
   * Проверяет, находимся ли мы на странице программы "Перезагрузка"
   */
  isReloadProgramPage() {
    const productSection = document.getElementById('productSection');
    return productSection && productSection.getAttribute('data-program') === 'reload';
  }

  /**
   * Инициализирует адаптер попапа
   */
  initialize() {
    this.isReloadProgram = this.isReloadProgramPage();
    
    if (!this.isReloadProgram) {
      console.log('📦 RELOAD POPUP: Не страница Reload, адаптер попапа не активирован');
      return false;
    }

    console.log('🔄 RELOAD POPUP: Инициализация адаптера попапа для программы "Перезагрузка"');
    
    // Модифицируем попап для одной даты
    this.modifyPopupForSingleDate();
    
    // Оборачиваем стандартную инициализацию календаря
    this.wrapCalendarInitialization();
    
    console.log('✅ RELOAD POPUP: Адаптер попапа успешно инициализирован');
    return true;
  }

  /**
   * Модифицирует попап для выбора одной даты
   */
  modifyPopupForSingleDate() {
    const popup = document.getElementById('quantityPopup');
    if (!popup) {
      console.warn('⚠️ RELOAD POPUP: Попап не найден');
      return;
    }

    // Находим второй инпут даты и скрываем его
    const endDateInput = document.getElementById('endDateInput');
    const endDateField = endDateInput?.closest('.input-field');
    
    if (endDateField) {
      endDateField.style.display = 'none';
      console.log('✅ RELOAD POPUP: Второй инпут даты скрыт');
    }

    // Меняем placeholder первого инпута
    const startDateInput = document.getElementById('startDateInput');
    if (startDateInput) {
      startDateInput.placeholder = 'Выберите дату доставки';
      console.log('✅ RELOAD POPUP: Placeholder обновлен');
    }

    // Меняем заголовок попапа
    const popupTitle = popup.querySelector('.popup-title');
    if (popupTitle) {
      popupTitle.textContent = 'ВЫБЕРИТЕ ДАТУ И ВРЕМЯ ДОСТАВКИ';
      console.log('✅ RELOAD POPUP: Заголовок попапа обновлен');
    }

    // Меняем описание попапа
    const popupDescription = popup.querySelector('.popup-description');
    if (popupDescription) {
      popupDescription.textContent = 'Пожалуйста, укажите желаемую дату и временной слот для доставки.';
      console.log('✅ RELOAD POPUP: Описание попапа обновлено');
    }
    
    // Переопределяем функцию updateCalendarDisplay для Reload программы
    this.overrideUpdateCalendarDisplay();
  }
  
  /**
   * Переопределяет функцию updateCalendarDisplay для показа суммы без "за N дней"
   */
  overrideUpdateCalendarDisplay() {
    // Сохраняем оригинальную функцию
    const originalUpdateCalendarDisplay = window.updateCalendarDisplay;
    
    window.updateCalendarDisplay = () => {
      // Для Reload программы - свой формат отображения
      if (this.isReloadProgram) {
        const calendarTotalValue = document.querySelector('.total-value');
        const popupTotal = document.querySelector('.popup-total');
        
        if (!calendarTotalValue || !popupTotal) return;
        
        // Получаем цену из глобальной переменной
        const calendarPrice = window.calendarPrice || '0';
        const daysCount = window.calendarDaysCount || 0;
        
        if (daysCount === 0) {
          // Скрываем popup-total если дата не выбрана
          popupTotal.style.display = 'none';
        } else {
          // Показываем popup-total
          popupTotal.style.display = 'block';
          
          // Рассчитываем общую стоимость
          const totalPrice = parseInt(calendarPrice.replace(/\s/g, '')) * daysCount;
          
          // ВАЖНО: Для Reload показываем только сумму без "за N дней"
          calendarTotalValue.textContent = `${totalPrice.toLocaleString('ru-RU')} ₽`;
          
          console.log('✅ RELOAD POPUP: Итого обновлено:', totalPrice);
        }
      } else {
        // Для других программ - вызываем оригинальную функцию
        if (originalUpdateCalendarDisplay) {
          originalUpdateCalendarDisplay();
        }
      }
    };
    
    console.log('✅ RELOAD POPUP: Функция updateCalendarDisplay переопределена');
  }

  /**
   * Оборачивает инициализацию календаря для выбора одной даты
   */
  wrapCalendarInitialization() {
    // Сохраняем оригинальную функцию инициализации
    if (window.initQuantityPopup && !this.originalQuantityPopupInit) {
      this.originalQuantityPopupInit = window.initQuantityPopup;
    }

    // Переопределяем глобальную функцию initQuantityPopup для Reload
    const originalInit = window.initQuantityPopup;
    
    window.initQuantityPopup = () => {
      // Вызываем оригинальную инициализацию
      if (originalInit) {
        originalInit();
      }

      // Если это Reload программа, модифицируем поведение календаря
      if (this.isReloadProgram) {
        this.modifySingleDateBehavior();
      }
    };

    console.log('✅ RELOAD POPUP: Инициализация календаря обернута');
  }

  /**
   * Модифицирует поведение календаря для выбора одной даты
   */
  modifySingleDateBehavior() {
    // Переопределяем логику выбора в календаре
    if (window.calendarInstance) {
      // Сохраняем оригинальный метод
      const originalSelectDate = window.calendarInstance.selectDate;
      
      // Переопределяем метод selectDate
      window.calendarInstance.selectDate = (date) => {
        console.log('📅 RELOAD POPUP: Выбрана одна дата:', date);
        
        // Для Reload программы: устанавливаем и начальную и конечную дату одинаковыми
        window.calendarInstance.startDate = date;
        window.calendarInstance.endDate = date;
        window.calendarInstance.excludedDates = []; // Нет исключенных дат
        window.calendarInstance.activeInput = 'start'; // Всегда start для одной даты
        
        // Обновляем глобальные переменные
        window.calendarStartDate = date;
        window.calendarEndDate = date;
        window.calendarDaysCount = 1; // Всегда 1 день для Reload
        window.selectedDeliveryDates = [date];
        window.calendarExcludedDates = [];
        
        // Форматируем дату для отображения
        const formattedDate = this.formatDate(date);
        
        // Обновляем оба инпута одинаковой датой
        const startDateInput = document.getElementById('startDateInput');
        const endDateInput = document.getElementById('endDateInput');
        
        if (startDateInput) {
          startDateInput.value = formattedDate;
        }
        if (endDateInput) {
          endDateInput.value = formattedDate;
        }
        
        // Обновляем отображение календаря
        if (window.calendarInstance.renderCalendar) {
          window.calendarInstance.renderCalendar();
        }
        
        // Обновляем отображение в попапе
        if (window.updateCalendarDisplay) {
          window.updateCalendarDisplay();
        }
        
        // Обновляем состояние кнопки
        if (window.updateAddToCartButtonState) {
          window.updateAddToCartButtonState();
        }
        
        // Обновляем даты доставки
        if (window.updateDeliveryDates) {
          window.updateDeliveryDates();
        }
        
        // Закрываем календарь
        const startDateCalendar = document.getElementById('startDateCalendar');
        if (startDateCalendar) {
          startDateCalendar.classList.remove('active');
        }
        
        console.log('✅ RELOAD POPUP: Одна дата установлена:', {
          date: formattedDate,
          daysCount: 1
        });
      };
      
      // Отключаем hover эффекты для диапазона
      window.calendarInstance.handleDayHover = () => {
        // Ничего не делаем для Reload - нет hover эффекта
      };
      
      console.log('✅ RELOAD POPUP: Поведение календаря изменено на выбор одной даты');
    } else {
      console.warn('⚠️ RELOAD POPUP: calendarInstance не найден, будет попытка позже');
      
      // Повторная попытка через 500мс
      setTimeout(() => {
        if (window.calendarInstance) {
          this.modifySingleDateBehavior();
        }
      }, 500);
    }
  }

  /**
   * Форматирует дату
   */
  formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  /**
   * Уничтожает адаптер
   */
  destroy() {
    // Восстанавливаем оригинальную функцию
    if (this.originalQuantityPopupInit) {
      window.initQuantityPopup = this.originalQuantityPopupInit;
    }
    console.log('🗑️ RELOAD POPUP: Адаптер попапа уничтожен');
  }
}

// Создаем глобальный экземпляр
window.ReloadPopupAdapter = ReloadPopupAdapter;

// Экспортируем для модулей
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReloadPopupAdapter;
}
