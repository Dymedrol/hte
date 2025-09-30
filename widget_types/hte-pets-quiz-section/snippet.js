// Pets Quiz Component JavaScript

// Delivery Date Popup Class
class DeliveryDatePopup {
  constructor() {
    this.popup = null;
    this.selectedDate = null;
    this.selectedTime = null;
    this.displayMonth = new Date();
    this.maxMonthsAhead = 6;
    this.currentDate = new Date();
    
    // Устанавливаем текущее время по московскому времени (UTC+3)
    const moscowOffset = 3;
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    this.currentDate = new Date(utc + (moscowOffset * 3600000));
    
    this.init();
  }
  
  init() {
    this.popup = document.getElementById('deliveryDatePopup');
    if (!this.popup) return;
    
    this.bindEvents();
    this.renderCalendar();
  }
  
  bindEvents() {
    // Кнопки навигации календаря
    const prevBtn = document.getElementById('deliveryCalendarPrev');
    const nextBtn = document.getElementById('deliveryCalendarNext');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.previousMonth());
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextMonth());
    }
    
    // Кнопка закрытия
    const closeBtn = document.getElementById('deliveryPopupClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
    
    // Закрытие по клику на overlay
    const overlay = this.popup?.querySelector('.popup-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => this.close());
    }
    
    // Обработчики для полей ввода
    const dateInput = document.getElementById('deliveryDateInput');
    const timeInput = document.getElementById('deliveryTimeInput');
    
    if (dateInput) {
      dateInput.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleCalendar();
      });
    }
    
    if (timeInput) {
      timeInput.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleTimeDropdown();
      });
    }
    
    // Обработчики для выбора времени
    const timeItems = document.querySelectorAll('.time-item');
    timeItems.forEach(item => {
      item.addEventListener('click', () => {
        this.selectTime(item.dataset.time, item.textContent);
      });
    });
    
    // Кнопка подтверждения
    const confirmBtn = document.getElementById('deliveryPopupConfirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => this.confirm());
    }
    
    // Закрытие дропдаунов при клике вне их
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.calendar-dropdown') && !e.target.closest('#deliveryDateInput')) {
        this.closeCalendar();
      }
      if (!e.target.closest('.delivery-time-dropdown') && !e.target.closest('#deliveryTimeInput')) {
        this.closeTimeDropdown();
      }
    });
  }
  
  open() {
    if (this.popup) {
      this.popup.classList.add('active');
      this.renderCalendar();
    }
  }
  
  close() {
    if (this.popup) {
      this.popup.classList.remove('active');
      this.selectedDate = null;
      this.selectedTime = null;
      this.closeCalendar();
      this.closeTimeDropdown();
      this.updateConfirmButton();
      this.updateInputs();
    }
  }
  
  confirm() {
    if (this.selectedDate && this.selectedTime && this.onConfirm) {
      this.onConfirm({
        date: this.selectedDate,
        time: this.selectedTime
      });
      this.close();
    }
  }
  
  setOnConfirm(callback) {
    this.onConfirm = callback;
  }
  
  previousMonth() {
    const newMonth = new Date(this.displayMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    
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
    
    const maxMonth = new Date(this.currentDate);
    maxMonth.setMonth(maxMonth.getMonth() + this.maxMonthsAhead);
    maxMonth.setDate(1);
    maxMonth.setHours(0, 0, 0, 0);
    
    if (newMonth <= maxMonth) {
      this.displayMonth = newMonth;
      this.renderCalendar();
    }
  }
  
  toggleCalendar() {
    const calendar = document.getElementById('deliveryDateCalendar');
    if (calendar) {
      calendar.classList.toggle('active');
      this.closeTimeDropdown();
    }
  }
  
  closeCalendar() {
    const calendar = document.getElementById('deliveryDateCalendar');
    if (calendar) {
      calendar.classList.remove('active');
    }
  }
  
  toggleTimeDropdown() {
    const dropdown = document.getElementById('deliveryTimeDropdown');
    if (dropdown) {
      dropdown.classList.toggle('active');
      this.closeCalendar();
    }
  }
  
  closeTimeDropdown() {
    const dropdown = document.getElementById('deliveryTimeDropdown');
    if (dropdown) {
      dropdown.classList.remove('active');
    }
  }
  
  selectTime(timeValue, timeText) {
    this.selectedTime = timeValue;
    
    // Обновляем поле ввода времени
    const timeInput = document.getElementById('deliveryTimeInput');
    if (timeInput) {
      timeInput.value = timeText;
    }
    
    // Обновляем визуальное состояние элементов времени
    const timeItems = document.querySelectorAll('.time-item');
    timeItems.forEach(item => {
      item.classList.remove('selected');
      if (item.dataset.time === timeValue) {
        item.classList.add('selected');
      }
    });
    
    this.closeTimeDropdown();
    this.updateConfirmButton();
  }
  
  updateInputs() {
    const dateInput = document.getElementById('deliveryDateInput');
    const timeInput = document.getElementById('deliveryTimeInput');
    
    if (dateInput) {
      dateInput.value = '';
    }
    if (timeInput) {
      timeInput.value = '';
    }
  }

  renderCalendar() {
    const grid = document.getElementById('deliveryCalendarGrid');
    if (!grid) return;
    
    // Очищаем сетку, оставляя заголовки дней недели
    const headers = grid.querySelectorAll('.calendar-day-header');
    grid.innerHTML = '';
    headers.forEach(header => grid.appendChild(header));
    
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
        dayElement.classList.add('selectable');
        dayElement.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectDate(currentDate);
        });
      }
      
      grid.appendChild(dayElement);
    }
    
    // Обновляем заголовок календаря
    this.updateCalendarHeader();
    
    // Обновляем кнопки навигации
    this.updateNavigationButtons();
  }
  
  applyDayStyles(dayElement, date) {
    // Удаляем все классы состояний
    dayElement.classList.remove('selected', 'selectable', 'unavailable');
    
    // Проверяем, можно ли выбрать эту дату
    const isSelectable = this.isDateSelectable(date);
    
    if (!isSelectable) {
      dayElement.classList.add('unavailable');
      return;
    }
    
    dayElement.classList.add('selectable');
    
    // Проверяем, выбрана ли эта дата
    if (this.selectedDate && this.isSameDate(date, this.selectedDate)) {
      dayElement.classList.add('selected');
    }
  }
  
  isDateSelectable(date) {
    // Завтрашний день как минимум
    const tomorrow = new Date(this.currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    // Максимальная дата (через 6 месяцев)
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
    
    // Обновляем поле ввода даты
    const dateInput = document.getElementById('deliveryDateInput');
    if (dateInput) {
      dateInput.value = this.formatDateForInput(date);
    }
    
    this.renderCalendar();
    this.closeCalendar();
    this.updateConfirmButton();
  }
  
  updateConfirmButton() {
    const confirmBtn = document.getElementById('deliveryPopupConfirm');
    if (confirmBtn) {
      confirmBtn.disabled = !this.selectedDate || !this.selectedTime;
    }
  }
  
  formatDateForInput(date) {
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    
    return `${day} ${months[month]} ${year}`;
  }
  
  
  updateCalendarHeader() {
    const monthElement = document.querySelector('.calendar-month');
    const yearElement = document.querySelector('.calendar-year');
    
    if (monthElement) {
      monthElement.textContent = this.getMonthName(this.displayMonth.getMonth());
    }
    if (yearElement) {
      yearElement.textContent = this.displayMonth.getFullYear();
    }
  }
  
  updateNavigationButtons() {
    const prevBtn = document.getElementById('deliveryCalendarPrev');
    const nextBtn = document.getElementById('deliveryCalendarNext');
    
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
  
  formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }
}

class PetsQuiz {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 3; // Изменено с 4 на 3
    this.selectedPetType = null;
    this.petWeight = null;
    this.excludedProducts = [];
    
    // Переменные для детального логирования расчетов
    this.calculationDetails = null;
    this.excludedAllergens = [];
    this.orderComment = null;
    
    // Переменные для найденных продуктов
    this.suitableProducts = [];
    this.distributedProducts = [];
    
    // Переменная для выбранной даты доставки
    this.selectedDeliveryDate = null;
    
    // Инициализируем попап выбора даты доставки
    this.deliveryDatePopup = null;
  }

  init() {
    this.bindEvents();
    this.updateProgress();
    this.initDeliveryDatePopup();
  }
  
  initDeliveryDatePopup() {
    // Инициализируем попап выбора даты доставки
    this.deliveryDatePopup = new DeliveryDatePopup();
    
    // Устанавливаем обработчик подтверждения выбора даты
    this.deliveryDatePopup.setOnConfirm((deliveryData) => {
      this.selectedDeliveryDate = deliveryData.date;
      this.selectedDeliveryTime = deliveryData.time;
      this.proceedToAddToCart();
    });
  }

  bindEvents() {
    // Add click events to pet options
    const petOptions = document.querySelectorAll('.pet-option');
    petOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        this.selectPetType(option);
      });
    });

    // Add click events to product items
    const productItems = document.querySelectorAll('.product-item');
    productItems.forEach(item => {
      item.addEventListener('click', (e) => {
        this.toggleProductSelection(item);
      });
    });

    // Add weight input events for all weight inputs
    this.bindWeightEvents();

    // Add navigation button events
    this.bindNavigationEvents();
  }

  bindWeightEvents() {
    // Bind events for all weight inputs
    const weightInputs = document.querySelectorAll('.weight-input');
    const minusBtns = document.querySelectorAll('.minus-btn');
    const plusBtns = document.querySelectorAll('.plus-btn');

    weightInputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        this.validateWeightInput(e.target, index);
      });
    });

    minusBtns.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const input = weightInputs[index];
        const currentValue = parseFloat(input.value) || 0;
        
        // Определяем шаг и минимальное значение в зависимости от типа питомца
        let step = 0.1; // По умолчанию 100 гр для кошек
        let minWeight = 0.1; // Минимум для всех питомцев (положительный вес)
        
        if (index === 0) {
          step = 0.5; // Щенки - 500 гр
        } else if (index === 1) {
          step = 0.5; // Взрослые собаки - 500 гр
        }
        
        const newValue = Math.max(minWeight, currentValue - step);
        input.value = newValue.toFixed(1);
        this.petWeight = newValue;
      });
    });

    plusBtns.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const input = weightInputs[index];
        const currentValue = parseFloat(input.value) || 0;
        
        // Определяем шаг в зависимости от типа питомца
        let step = 0.1; // По умолчанию 100 гр для кошек
        
        if (index === 0) {
          step = 0.5; // Щенки - 500 гр
        } else if (index === 1) {
          step = 0.5; // Взрослые собаки - 500 гр
        }
        
        const newValue = currentValue + step;
        input.value = newValue.toFixed(1);
        this.petWeight = newValue;
      });
    });
  }

  validateWeightInput(input, petIndex) {
    let value = input.value;
    
    // Убираем все нечисловые символы кроме точки
    value = value.replace(/[^0-9.]/g, '');
    
    // Убираем лишние точки (оставляем только первую)
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Если значение пустое, устанавливаем минимальное
    if (value === '' || value === '.') {
      input.value = '';
      return;
    }
    
    let numValue = parseFloat(value);
    
    // Проверяем корректность числа
    if (isNaN(numValue)) {
      input.value = '';
      return;
    }
    
    // Определяем минимальный вес для всех питомцев (положительный вес)
    let minWeight = 0.1;
    
    // Ограничиваем значение только по минимальному весу
    if (numValue < minWeight) {
      numValue = minWeight;
    }
    
    // Определяем точность в зависимости от типа питомца
    let precision = 1; // По умолчанию 1 знак для кошек (0.1 кг)
    if (petIndex === 0 || petIndex === 1) {
      // Для щенков и взрослых собак - точность до 0.5
      numValue = Math.round(numValue * 2) / 2;
      precision = 1;
    }
    
    // Обновляем значение в поле
    input.value = numValue.toFixed(precision);
    
    // Сохраняем вес
    this.petWeight = numValue;
  }

  toggleProductSelection(item) {
    item.classList.toggle('selected');
    const productName = item.dataset.product;
    
    if (item.classList.contains('selected')) {
      this.excludedProducts.push(productName);
    } else {
      const index = this.excludedProducts.indexOf(productName);
      if (index > -1) {
        this.excludedProducts.splice(index, 1);
      }
    }
  }

  bindNavigationEvents() {
    // Next button for puppy
    const btnNextStep1Puppy = document.getElementById('btn-next-step1-puppy');
    if (btnNextStep1Puppy) {
      btnNextStep1Puppy.addEventListener('click', () => {
        this.nextStep();
      });
    }

    // Next button for adult dog
    const btnNextStep1AdultDog = document.getElementById('btn-next-step1-adult-dog');
    if (btnNextStep1AdultDog) {
      btnNextStep1AdultDog.addEventListener('click', () => {
        this.nextStep();
      });
    }

    // Next button for cat
    const btnNextStep1Cat = document.getElementById('btn-next-step1-cat');
    if (btnNextStep1Cat) {
      btnNextStep1Cat.addEventListener('click', () => {
        this.nextStep();
      });
    }

    // Back button for step 2
    const btnBackStep2 = document.getElementById('btn-back-step2');
    if (btnBackStep2) {
      btnBackStep2.addEventListener('click', () => {
        this.previousStep();
      });
    }

    // Next button for step 2
    const btnNextStep2 = document.getElementById('btn-next-step2');
    if (btnNextStep2) {
      btnNextStep2.addEventListener('click', () => {
        this.calculateDiet();
        this.nextStep();
      });
    }

    // Back button for step 3
    const btnBackStep3 = document.getElementById('btn-back-step3');
    if (btnBackStep3) {
      btnBackStep3.addEventListener('click', () => {
        this.previousStep();
      });
    }

    // Add to cart button for step 3
    const btnAddToCart = document.getElementById('btn-add-to-cart');
    if (btnAddToCart) {
      btnAddToCart.addEventListener('click', () => {
        this.showDeliveryDatePopup();
      });
    }
  }

  getPetTypeInRussian(petType) {
    const petTypes = {
      'puppy': 'Щенок',
      'adult-dog': 'Взрослая собака',
      'cat': 'Кошка'
    };
    return petTypes[petType] || petType;
  }

  calculateDiet() {
    if (!this.selectedPetType || !this.petWeight) {
      console.error('Missing pet type or weight for calculation');
      return;
    }

    // Расчет порции на день по новым формулам
    let dailyAmountGrams = 0;
    
    switch(this.selectedPetType) {
      case 'puppy':
        dailyAmountGrams = this.petWeight * 60; // Щенок: вес(кг) * 60
        break;
      case 'adult-dog':
        dailyAmountGrams = this.petWeight * 30; // Собака: вес(кг) * 30
        break;
      case 'cat':
        dailyAmountGrams = this.petWeight * 45; // Кошка: вес(кг) * 45
        break;
      default:
        dailyAmountGrams = this.petWeight * 30; // По умолчанию как для собаки
    }

    // Питание продается на неделю (день * 7)
    const weeklyAmountGrams = dailyAmountGrams * 7;

    // Определяем размер пакетиков и их количество
    const packageInfo = this.calculatePackaging(weeklyAmountGrams);

    // Переменные для логирования (на русском для комментариев к заказу)
    this.calculationDetails = {
      petType: this.getPetTypeInRussian(this.selectedPetType),
      weight: `${this.petWeight} кг`,
      dailyAmount: `${Math.round(dailyAmountGrams)} грамм в день`,
      weeklyAmount: `${Math.round(weeklyAmountGrams)} грамм в неделю`,
      packaging: `Пакетики по ${packageInfo.packageSize} г × ${packageInfo.packageCount}шт (округлено в большую сторону)`,
      totalWeight: `${packageInfo.totalWeight} грамм общий вес`,
      packageRule: this.getPackageRule(weeklyAmountGrams),
      excessAmount: `${packageInfo.totalWeight - Math.round(weeklyAmountGrams)} грамм избыток (гарантия достаточного количества)`
    };

    this.excludedAllergens = this.excludedProducts.length > 0 
      ? `Исключены: ${this.excludedProducts.join(', ')}`
      : 'Аллергены не исключены';

    // Сохраняем результаты для отображения
    this.dietResults = {
      dailyAmount: Math.round(dailyAmountGrams),
      weeklyPackages: packageInfo.packageCount,
      petType: this.selectedPetType,
      weight: this.petWeight,
      excludedProducts: this.excludedProducts,
      packageSize: packageInfo.packageSize,
      totalWeight: packageInfo.totalWeight
    };

    // Детальное логирование (на русском для комментариев к заказу)
    console.log('=== РАСЧЕТ ПОРЦИИ ===');
    console.log('Тип питомца:', this.calculationDetails.petType);
    console.log('Вес питомца:', this.calculationDetails.weight);
    console.log('Дневная порция:', this.calculationDetails.dailyAmount);
    console.log('Недельная порция:', this.calculationDetails.weeklyAmount);
    console.log('Упаковка:', this.calculationDetails.packaging);
    console.log('Общий вес:', this.calculationDetails.totalWeight);
    console.log('Избыток:', this.calculationDetails.excessAmount);
    
    console.log('=== АЛЛЕРГЕНЫ ===');
    console.log(this.excludedAllergens);
    
    console.log('=== КОММЕНТАРИЙ К ЗАКАЗУ ===');
    this.orderComment = `${this.calculationDetails.petType}, ${this.calculationDetails.weight}. ${this.calculationDetails.dailyAmount}, ${this.calculationDetails.weeklyAmount}. ${this.calculationDetails.packaging}, ${this.calculationDetails.totalWeight}. ${this.calculationDetails.excessAmount}. ${this.excludedAllergens}.`;
    console.log(this.orderComment);
    
    console.log('=== РЕЗУЛЬТАТ РАСЧЕТА ===', this.dietResults);

    // Поиск подходящих продуктов
    this.suitableProducts = this.findSuitableProducts();

    // Распределяем пакетики между продуктами
    this.distributedProducts = this.distributeProductsEvenly();

    // Обновляем отображение результатов
    this.updateDietDisplay();
  }

  calculatePackaging(weeklyAmountGrams) {
    // Правила упаковки для собак и щенков
    // ВАЖНО: Количество пакетиков округляется в большую сторону (Math.ceil)
    // для гарантии достаточного количества корма
    if (this.selectedPetType === 'puppy' || this.selectedPetType === 'adult-dog') {
      let packageSize = 100; // По умолчанию 100гр
      let packageRule = '';
      
      // Сравниваем ВЕС ПИТОМЦА, а не недельную порцию!
      if (this.petWeight < 10) {
        // Меньше 10 кг - пакетики по 100 гр
        packageSize = 100;
                packageRule = 'Вес питомца меньше 10 кг → пакетики по 100 гр';
      } else if (this.petWeight >= 10 && this.petWeight <= 20) {
        // От 10 до 20 кг - пакетики по 250 гр
        packageSize = 250;
        packageRule = 'Вес питомца от 10 до 20 кг → пакетики по 250 гр';
      } else {
        // Больше 20 кг - пакетики по 500 гр
        packageSize = 500;
        packageRule = 'Вес питомца больше 20 кг → пакетики по 500 гр';
      }
      
      // Округляем количество пакетиков в большую сторону для гарантии достаточного количества
      const packageCount = Math.ceil(weeklyAmountGrams / packageSize);
      const totalWeight = packageCount * packageSize;
      
      return {
        packageSize: packageSize,
        packageCount: packageCount,
        totalWeight: totalWeight
      };
    } else {
      // Для кошек - пакетики по 100 гр (можно изменить правила позже)
      // ВАЖНО: Количество пакетиков округляется в большую сторону (Math.ceil)
      // для гарантии достаточного количества корма
      const packageSize = 100;
      // Округляем количество пакетиков в большую сторону для гарантии достаточного количества
      const packageCount = Math.ceil(weeklyAmountGrams / packageSize);
      const totalWeight = packageCount * packageSize;
      
      return {
        packageSize: packageSize,
        packageCount: packageCount,
        totalWeight: totalWeight
      };
    }
  }

  getPackageRule(weeklyAmountGrams) {
    if (this.selectedPetType === 'puppy' || this.selectedPetType === 'adult-dog') {
      if (this.petWeight < 10) {
        return 'Пакетики по 100 гр (вес питомца меньше 10 кг, округление в большую сторону)';
      } else if (this.petWeight >= 10 && this.petWeight <= 20) {
        return 'Пакетики по 250 гр (вес питомца от 10 до 20 кг, округление в большую сторону)';
      } else {
        return 'Пакетики по 500 гр (вес питомца больше 20 кг, округление в большую сторону)';
      }
    } else {
      return 'Пакетики по 100 гр (для кошек, округление в большую сторону)';
    }
  }

  // Поиск продуктов по типу питомца
  findProductsByPetType() {
    if (!window.petsProducts || !window.petsProducts.products) {
      console.error('Pets products not loaded');
      return [];
    }

    const petTypeKeywords = {
      'puppy': 'щенков',
      'adult-dog': 'взрослых собак',
      'cat': 'кошек'
    };

    const keyword = petTypeKeywords[this.selectedPetType];
    if (!keyword) {
      console.error('Unknown pet type:', this.selectedPetType);
      return [];
    }

    const suitableProducts = window.petsProducts.products.filter(product => {
      return product.title.toLowerCase().includes(keyword);
    });

    console.log(`Found ${suitableProducts.length} products for ${this.selectedPetType}:`, suitableProducts);
    return suitableProducts;
  }

  // Фильтрация продуктов по размеру упаковки
  filterProductsByPackageSize(products, packageSize) {
    const packageSizeStr = `${packageSize}г`;
    
    const filteredProducts = products.filter(product => {
      return product.title.includes(packageSizeStr);
    });

    console.log(`Found ${filteredProducts.length} products with package size ${packageSize}г:`, filteredProducts);
    return filteredProducts;
  }

  // Исключение продуктов с аллергенами
  excludeProductsWithAllergens(products) {
    if (!this.excludedProducts || this.excludedProducts.length === 0) {
      console.log('No allergens to exclude');
      return products;
    }

    // Словарь для преобразования аллергенов в разные падежи
    const allergenVariations = {
      'Говядина': ['говядина', 'говядиной', 'говядину', 'говядины', 'говяжьим', 'говяжьего', 'говяжьей'],
      'Курица': ['курица', 'курицей', 'курицу', 'курицы', 'куриным', 'куриного', 'куриной'],
      'Рыба': ['рыба', 'рыбой', 'рыбу', 'рыбы', 'рыбным', 'рыбного', 'рыбной'],
      'Индейка': ['индейка', 'индейкой', 'индейку', 'индейки', 'индюшиным', 'индюшиного', 'индюшиной'],
      'Огурец': ['огурец', 'огурцом', 'огурца', 'огурцы', 'огурцов', 'огурцами'],
      'Кабачок': ['кабачок', 'кабачком', 'кабачка', 'кабачки', 'кабачков', 'кабачками'],
      'Тыква': ['тыква', 'тыквой', 'тыкву', 'тыквы', 'тыквенным', 'тыквенного', 'тыквенной'],
      'Морковь': ['морковь', 'морковью', 'моркови', 'морковным', 'морковного', 'морковной'],
      'Капуста цветная': ['капуста цветная', 'капустой цветной', 'капусту цветную', 'капусты цветной', 'цветной капустой', 'цветной капусты'],
      'Капуста белокачанная': ['капуста белокачанная', 'капустой белокачанной', 'капусту белокачанную', 'капусты белокачанной', 'белокачанной капустой', 'белокачанной капусты'],
      'Рис': ['рис', 'рисом', 'риса', 'рисовым', 'рисового', 'рисовой']
    };

    const filteredProducts = products.filter(product => {
      const productTitle = product.title.toLowerCase();
      
      // Проверяем каждый исключенный аллерген
      const hasExcludedAllergen = this.excludedProducts.some(allergen => {
        // Получаем все варианты написания аллергена
        const variations = allergenVariations[allergen] || [allergen.toLowerCase()];
        
        // Проверяем, содержит ли название продукта любой из вариантов
        const foundVariation = variations.find(variation => {
          return productTitle.includes(variation);
        });
        
        // Логируем найденные совпадения для отладки
        if (foundVariation) {
          console.log(`❌ Исключен продукт "${product.title}" из-за аллергена "${allergen}" (найдено: "${foundVariation}")`);
        }
        
        return !!foundVariation;
      });

      return !hasExcludedAllergen;
    });

    console.log(`After excluding allergens, ${filteredProducts.length} products remain:`, filteredProducts);
    
    // Логируем оставшиеся продукты
    if (filteredProducts.length > 0) {
      console.log('✅ Оставшиеся продукты после исключения аллергенов:');
      filteredProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.title}`);
      });
    }
    
    return filteredProducts;
  }

  // Основной метод поиска подходящих продуктов
  findSuitableProducts() {
    console.log('=== ПОИСК ПОДХОДЯЩИХ ПРОДУКТОВ ===');
    console.log('Тип питомца:', this.selectedPetType);
    console.log('Размер упаковки:', this.dietResults?.packageSize);
    console.log('Исключенные аллергены:', this.excludedProducts);

    // Шаг 1: Поиск по типу питомца
    let products = this.findProductsByPetType();
    if (products.length === 0) {
      console.warn('No products found for pet type');
      return [];
    }

    // Шаг 2: Фильтрация по размеру упаковки
    if (this.dietResults?.packageSize) {
      products = this.filterProductsByPackageSize(products, this.dietResults.packageSize);
      if (products.length === 0) {
        console.warn('No products found with required package size');
        return [];
      }
    }

    // Шаг 3: Исключение продуктов с аллергенами
    products = this.excludeProductsWithAllergens(products);
    if (products.length === 0) {
      console.warn('No products found after excluding allergens');
      return [];
    }

    // Выводим все найденные продукты в консоль
    console.log(`=== ВСЕ ПОДХОДЯЩИЕ ПРОДУКТЫ (${products.length} шт.) ===`);
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.title}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Цена: ${product.variants[0].price} руб.`);
      console.log(`   URL: ${product.url}`);
      console.log(`   Общая стоимость за неделю: ${product.variants[0].price * this.dietResults.weeklyPackages} руб. (${this.dietResults.weeklyPackages} шт.)`);
      console.log('---');
    });

    return products;
  }

  // Распределение пакетиков между продуктами с приоритетом для продуктов без рыбы
  distributeProductsEvenly() {
    if (!this.suitableProducts || this.suitableProducts.length === 0) {
      console.log('No products to distribute');
      return [];
    }

    if (!this.dietResults || !this.dietResults.weeklyPackages) {
      console.log('No weekly packages to distribute');
      return [];
    }

    const totalPackages = this.dietResults.weeklyPackages;
    const productCount = this.suitableProducts.length;
    
    // Сортируем продукты: сначала без рыбы, потом с рыбой
    const sortedProducts = [...this.suitableProducts].sort((a, b) => {
      const aHasFish = this.productContainsFish(a.title);
      const bHasFish = this.productContainsFish(b.title);
      
      // Продукты без рыбы идут первыми (приоритет)
      if (aHasFish && !bHasFish) return 1;
      if (!aHasFish && bHasFish) return -1;
      return 0;
    });

    // Вычисляем базовое количество пакетиков на продукт
    const basePackagesPerProduct = Math.floor(totalPackages / productCount);
    const remainder = totalPackages % productCount;

    console.log(`=== РАСПРЕДЕЛЕНИЕ ПАКЕТИКОВ ===`);
    console.log(`Общее количество пакетиков: ${totalPackages}`);
    console.log(`Количество продуктов: ${productCount}`);
    console.log(`Базовое количество на продукт: ${basePackagesPerProduct}`);
    console.log(`Остаток для распределения: ${remainder}`);
    console.log(`Приоритет: продукты без рыбы получают больше пакетиков`);

    this.distributedProducts = sortedProducts.map((product, index) => {
      // Продукты без рыбы (первые в списке) получают дополнительный пакетик из остатка
      const packagesForThisProduct = basePackagesPerProduct + (index < remainder ? 1 : 0);
      const totalPrice = product.variants[0].price * packagesForThisProduct;
      const hasFish = this.productContainsFish(product.title);

      const distributedProduct = {
        ...product,
        packagesCount: packagesForThisProduct,
        totalPrice: totalPrice,
        pricePerPackage: product.variants[0].price,
        hasFish: hasFish
      };

      console.log(`${index + 1}. ${product.title}`);
      console.log(`   Содержит рыбу: ${hasFish ? 'Да' : 'Нет'}`);
      console.log(`   Пакетиков: ${packagesForThisProduct}`);
      console.log(`   Цена за пакетик: ${product.variants[0].price} руб.`);
      console.log(`   Общая стоимость: ${totalPrice} руб.`);
      console.log('---');

      return distributedProduct;
    });

    // Проверяем, что общее количество пакетиков совпадает
    const totalDistributedPackages = this.distributedProducts.reduce((sum, product) => sum + product.packagesCount, 0);
    console.log(`Проверка: общее количество распределенных пакетиков = ${totalDistributedPackages} (должно быть ${totalPackages})`);

    return this.distributedProducts;
  }

  // Проверка, содержит ли продукт рыбу
  productContainsFish(productTitle) {
    const fishKeywords = ['рыба', 'рыбой', 'рыбу', 'рыбы', 'рыбным', 'рыбного', 'рыбной'];
    const title = productTitle.toLowerCase();
    return fishKeywords.some(keyword => title.includes(keyword));
  }

  updateDietDisplay() {
    const dailyAmountElement = document.getElementById('daily-amount');
    const weeklyPackagesElement = document.getElementById('weekly-packages');
    const packageSizeElement = document.getElementById('package-size');
    const infoContentElement = document.querySelector('.info-content');
    const addToCartButton = document.getElementById('btn-add-to-cart');

    // Проверяем, есть ли подходящие продукты
    if (!this.suitableProducts || this.suitableProducts.length === 0) {
      // Если продуктов нет, показываем сообщение об отсутствии
      if (infoContentElement) {
        infoContentElement.innerHTML = '<p class="no-products-message">По данным запросам продуктов не найдено</p>';
      }
      
      // Деактивируем кнопку "Добавить в корзину"
      if (addToCartButton) {
        addToCartButton.disabled = true;
        addToCartButton.textContent = 'Продукты не найдены';
        addToCartButton.classList.add('disabled');
      }
      
      return;
    }

    // Если продукты найдены, восстанавливаем нормальный UI
    if (infoContentElement) {
      infoContentElement.innerHTML = `
        <p class="diet-info" id="diet-info">Ваш рацион: <span id="daily-amount">${this.dietResults.dailyAmount}</span> г корма в сутки</p>
        <p class="packages-info" id="packages-info">Это <span id="weekly-packages">${this.dietResults.weeklyPackages}</span> пакетиков по <span id="package-size">${this.dietResults.packageSize}</span> г на неделю</p>
      `;
    }

    // Активируем кнопку "Добавить в корзину"
    if (addToCartButton) {
      addToCartButton.disabled = false;
      addToCartButton.textContent = 'Добавить в корзину';
      addToCartButton.classList.remove('disabled');
    }

    // Обновляем картинку питомца на итоговом экране
    this.updatePetResultImage();
  }

  updatePetResultImage() {
    const imageContainer = document.querySelector('.image-container');
    if (!imageContainer) return;

    // Убираем все предыдущие классы
    imageContainer.classList.remove('result-dog', 'result-puppy', 'result-cat');
    
    // Добавляем соответствующий класс в зависимости от выбранного питомца
    if (this.selectedPetType === 'puppy') {
      imageContainer.classList.add('result-puppy');
    } else if (this.selectedPetType === 'adult-dog') {
      imageContainer.classList.add('result-dog');
    } else if (this.selectedPetType === 'cat') {
      imageContainer.classList.add('result-cat');
    }
  }

  showDeliveryDatePopup() {
    // Проверяем, есть ли распределенные продукты
    if (!this.distributedProducts || this.distributedProducts.length === 0) {
      alert('Нет доступных продуктов для добавления в корзину');
      return;
    }
    
    // Показываем попап выбора даты доставки
    if (this.deliveryDatePopup) {
      this.deliveryDatePopup.open();
    } else {
      // Если попап не инициализирован, добавляем в корзину без даты
      console.warn('Delivery date popup not initialized, adding to cart without date');
      this.proceedToAddToCart();
    }
  }
  
  proceedToAddToCart() {
    console.log('=== ДОБАВЛЕНИЕ В КОРЗИНУ ===');
    if (this.selectedDeliveryDate) {
      console.log('Выбранная дата доставки:', this.deliveryDatePopup.formatDate(this.selectedDeliveryDate));
    }
    if (this.selectedDeliveryTime) {
      console.log('Выбранное время доставки:', this.selectedDeliveryTime);
    }
    
    // Подготавливаем данные для корзины
    const cartItems = this.distributedProducts.map((product, index) => {
      const cartItem = {
        productId: product.id,
        variantId: product.variants[0].id,
        quantity: product.packagesCount,
        productTitle: product.title,
        pricePerPackage: product.pricePerPackage,
        totalPrice: product.totalPrice
      };

      console.log(`Товар ${index + 1}: ${product.title}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Количество: ${product.packagesCount} шт.`);
      console.log(`   Цена за штуку: ${product.pricePerPackage} руб.`);
      console.log(`   Общая стоимость: ${product.totalPrice} руб.`);
      console.log('---');

      return cartItem;
    });

    // Вычисляем общую стоимость
    const totalCartPrice = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalPackages = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    console.log(`Общее количество пакетиков: ${totalPackages}`);
    console.log(`Общая стоимость корзины: ${totalCartPrice} руб.`);

    // Подготавливаем данные для ajaxAPI.cart.add
    const cartData = {};
    const comments = {};

    cartItems.forEach((item, index) => {
      // Используем variantId как ключ для корзины
      cartData[item.variantId] = item.quantity;
      
      // Создаем комментарий для каждого товара с датой доставки
      let productComment = `${item.productTitle} (${item.quantity} шт. × ${item.pricePerPackage} руб. = ${item.totalPrice} руб.)`;
      
      // Добавляем дату и время доставки в комментарий к товару, если они выбраны
      if (this.selectedDeliveryDate) {
        const deliveryDateStr = this.deliveryDatePopup.formatDate(this.selectedDeliveryDate);
        let deliveryInfo = `Дата доставки: ${deliveryDateStr}`;
        if (this.selectedDeliveryTime) {
          deliveryInfo += `, время: ${this.selectedDeliveryTime}`;
        }
        productComment += ` | ${deliveryInfo}`;
      }
      
      comments[item.variantId] = productComment;
    });

    // Добавляем общий комментарий к заказу
    let generalComment = `Рацион для питомца: ${this.calculationDetails.petType}, ${this.calculationDetails.weight}. ${this.calculationDetails.dailyAmount}, ${this.calculationDetails.weeklyAmount}. ${this.calculationDetails.packaging}, ${this.calculationDetails.totalWeight}. ${this.calculationDetails.excessAmount}. ${this.excludedAllergens}.`;
    
    // Добавляем дату и время доставки в общий комментарий, если они выбраны
    if (this.selectedDeliveryDate) {
      const deliveryDateStr = this.deliveryDatePopup.formatDate(this.selectedDeliveryDate);
      let deliveryInfo = `Дата доставки: ${deliveryDateStr}`;
      if (this.selectedDeliveryTime) {
        deliveryInfo += `, время: ${this.selectedDeliveryTime}`;
      }
      generalComment += ` ${deliveryInfo}.`;
    }

    console.log('Данные для корзины:', cartData);
    console.log('Комментарии:', comments);
    console.log('Общий комментарий:', generalComment);

    // Показываем индикатор загрузки
    const addToCartButton = document.getElementById('btn-add-to-cart');
    if (addToCartButton) {
      addToCartButton.disabled = true;
      addToCartButton.textContent = 'Добавление...';
    }

    // Добавляем товары в корзину через AJAX API
    ajaxAPI.cart.add(cartData, {
      comments: comments,
      order_comment: generalComment
    })
    .done((response) => {
      console.log('Товары успешно добавлены в корзину:', response);
      
      // Показываем сообщение об успехе
      const message = `Программа добавлена в корзину!\n\n` +
        `Количество продуктов: ${cartItems.length}\n` +
        `Общее количество пакетиков: ${totalPackages}\n` +
        `Общая стоимость: ${totalCartPrice} руб.`;
      
      // Переходим на страницу корзины
      window.location.href = '/cart_items';
    })
    .fail((error) => {
      console.error('Ошибка при добавлении в корзину:', error);
      
      // Показываем сообщение об ошибке
      alert('Произошла ошибка при добавлении товаров в корзину. Попробуйте еще раз.');
      
      // Восстанавливаем кнопку
      if (addToCartButton) {
        addToCartButton.disabled = false;
        addToCartButton.textContent = 'Добавить в корзину';
      }
    });
  }

  getExcludedProducts() {
    return this.excludedProducts;
  }

  selectPetType(option) {
    // Remove previous selection
    const previousSelected = document.querySelector('.pet-option.selected');
    if (previousSelected) {
      previousSelected.classList.remove('selected');
      // Hide weight selector for previously selected option
      const prevWeightSelector = previousSelected.querySelector('.weight-selector');
      if (prevWeightSelector) {
        prevWeightSelector.style.display = 'none';
      }
      // Hide selected badge for previously selected option
      const prevSelectedBadge = previousSelected.querySelector('.selected-badge');
      if (prevSelectedBadge) {
        prevSelectedBadge.style.display = 'none';
      }
    }

    // Add selection to current option
    option.classList.add('selected');
    
    // Store selected pet type
    this.selectedPetType = option.dataset.petType;
    
    // Add visual feedback
    this.highlightSelection(option);
    
    // Show selected badge for selected option
    const selectedBadge = option.querySelector('.selected-badge');
    if (selectedBadge) {
      selectedBadge.style.display = 'block';
    }
    
    // Show weight selector for selected option
    const weightSelector = option.querySelector('.weight-selector');
    if (weightSelector) {
      weightSelector.style.display = 'flex';
      // Get the weight input for this option
      const weightInput = weightSelector.querySelector('.weight-input');
      if (weightInput) {
        this.petWeight = parseFloat(weightInput.value);
      }
    }
  }

  highlightSelection(option) {
    // Add selected class for styling (CSS will handle the border)
    option.classList.add('selected');
  }

  updateProgress() {
    // Находим только видимый прогресс бар (на текущем шаге)
    const currentStepElement = document.getElementById(`step-${this.currentStep}`);
    const progressSegments = currentStepElement ? currentStepElement.querySelectorAll('.progress-segment') : [];
    const stepCounters = document.querySelectorAll('.step-counter');
    
    // Update all step counters
    stepCounters.forEach(counter => {
      counter.textContent = `${this.currentStep}/${this.totalSteps}`;
    });
    
    // Update progress bar for current step
    // Теперь обновляем только видимый прогресс бар
    progressSegments.forEach((segment, index) => {
      if (index < this.currentStep) {
        segment.classList.add('active');
      } else {
        segment.classList.remove('active');
      }
    });
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.showStep(this.currentStep);
    }
  }

  showStep(stepNumber) {
    // Hide all steps
    const allSteps = document.querySelectorAll('.pets-quiz-section, .pets-quiz-step');
    allSteps.forEach(step => {
      step.style.display = 'none';
    });

    // Show current step
    const stepElement = document.getElementById(`step-${stepNumber}`);
    if (stepElement) {
      stepElement.style.display = 'flex';
    } else {
      console.error(`Step ${stepNumber} element not found`);
    }

    // Update progress bar for current step
    this.updateProgress();
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.showStep(this.currentStep);
    }
  }

  getSelectedPetType() {
    return this.selectedPetType;
  }

  reset() {
    this.currentStep = 1;
    this.selectedPetType = null;
    this.petWeight = null;
    this.excludedProducts = [];
    this.dietResults = null;
    this.suitableProducts = [];
    this.distributedProducts = [];
    this.selectedDeliveryDate = null;
    this.selectedDeliveryTime = null;
    
    this.showStep(1);
    
    // Remove all selections
    const selectedOptions = document.querySelectorAll('.pet-option.selected');
    selectedOptions.forEach(option => {
      option.classList.remove('selected');
      
      // Hide weight selector
      const weightSelector = option.querySelector('.weight-selector');
      if (weightSelector) {
        weightSelector.style.display = 'none';
      }
      
      // Hide selected badge
      const selectedBadge = option.querySelector('.selected-badge');
      if (selectedBadge) {
        selectedBadge.style.display = 'none';
      }
    });

    // Remove product selections
    const selectedProducts = document.querySelectorAll('.product-item.selected');
    selectedProducts.forEach(item => {
      item.classList.remove('selected');
    });

    // Reset weight inputs to default values
    const weightInputs = document.querySelectorAll('.weight-input');
    weightInputs[0].value = '5';   // Puppy default
    weightInputs[1].value = '25';  // Adult dog default
    weightInputs[2].value = '4';   // Cat default

    // Восстанавливаем UI для результатов
    const infoContentElement = document.querySelector('.info-content');
    const addToCartButton = document.getElementById('btn-add-to-cart');
    
    if (infoContentElement) {
      infoContentElement.innerHTML = `
        <p class="diet-info" id="diet-info">Ваш рацион: <span id="daily-amount">120</span> г корма в сутки</p>
        <p class="packages-info" id="packages-info">Это <span id="weekly-packages">9</span> пакетиков по <span id="package-size">100</span> г на неделю</p>
      `;
    }
    
    if (addToCartButton) {
      addToCartButton.disabled = false;
      addToCartButton.textContent = 'Добавить в корзину';
      addToCartButton.classList.remove('disabled');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const petsQuiz = new PetsQuiz();
  petsQuiz.init();
  
  // Делаем экземпляр доступным глобально для попапа
  window.petsQuiz = petsQuiz;
});