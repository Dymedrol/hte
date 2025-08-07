
EventBus.subscribe('accessories-rendered:insales:ui_accessories', function (data) {
    const gallery = $('#dishes-gallery');
    let currentVariantOptions = [];
    const accessories = data.productJSON.accessories;

    for (let index = 0; index < data.productJSON.option_names.length; index++) {
        const obj = {
            'id': data.productJSON.option_names[index].id,
            'title': data.productJSON.option_names[index].title,
            'current_value': data.productJSON.options[index].current_value.title,
        }
        currentVariantOptions.push(obj);
    }

    function findByPermalink(obj, target) {
        if (typeof obj !== 'object' || obj === null) return null;
      
        if (obj.permalink === target) return obj;
      
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            if (typeof value === 'object') {
              const found = findByPermalink(value, target);
              if (found) return found;
            }
          }
        }
        return null;
    }

    // Костыль чтобы опции были выбраны по умолчанию
    const productTypeAccessories = findByPermalink(accessories, 'remove_breakfast');
    $(`*[data-product-accessories-item-id="${productTypeAccessories.id}"] input`).click();

    // Прячем инпуты с исключаемыми алергенами
    const excludeProductAccessories = findByPermalink(accessories, 'exclude_product');
    $(`*[data-product-accessories-item-id="${excludeProductAccessories.id}"]`).hide();

    // Показать/скрыть карточки завтрак/ужин
    $(".settings-panel input").change(function() {
        if ($(this).siblings().filter(function() {
            return $(this).text().toLowerCase().indexOf('завтрак') !== -1;
          }).length > 0) {
            gallery.toggleClass('removeBreakfast');
            updateNutritionSummary();
        }

        if ($(this).siblings().filter(function() {
            return $(this).text().toLowerCase().indexOf('ужин') !== -1;
          }).length > 0) {
            gallery.toggleClass('removeDiner');
            updateNutritionSummary();
        }
    });

    EventBus.subscribe('update_variant:insales:product', function (data) {
        // data.option_values — массив новых значений опций
        let changed = false;

        if (data.option_values && Array.isArray(data.option_values)) {
            data.option_values.forEach((option, idx) => {
                if (
                    currentVariantOptions[idx] &&
                    currentVariantOptions[idx].current_value !== option.title
                ) {
                    currentVariantOptions[idx].current_value = option.title;
                    changed = true;
                }
            });
        }

        if (changed) {
            updateNutritionSummary();
        }
    });

    // Получаем элементы навигации!
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const daysContainer = document.querySelector('.days-container');
    const dishesGallery = document.getElementById('dishes-gallery');
    
    // Получаем данные программы
    const dishesByDay = program.dishesByDay;
    const dayKeys = Object.keys(dishesByDay);
    let currentDayIndex = 0;

    function updateNutritionSummary() {
        // Получаем выбранную калорийность из currentVariantOptions
        let calorieValue = 2300; // Значение по умолчанию
        if (currentVariantOptions && Array.isArray(currentVariantOptions)) {
            const calOpt = currentVariantOptions.find(opt => 
                opt.title && opt.title.toLowerCase().includes('калорий')
            );
            if (calOpt && calOpt.current_value) {
                if (calOpt.current_value.includes('2500')) calorieValue = 2500;
                else if (calOpt.current_value.includes('3000')) calorieValue = 3000;
                else if (calOpt.current_value.includes('2300')) calorieValue = 2300;
            }
        }
    
        // Определяем индекс для нужного блока nutrition
        let nutritionIndex = 0;
        if (calorieValue === 2300) nutritionIndex = 0;
        else if (calorieValue === 2500) nutritionIndex = 1;
        else if (calorieValue === 3000) nutritionIndex = 2;
    
        // Получаем все видимые элементы .dish-item
        const dishItems = Array.from(document.querySelectorAll('.dish-item'))
            .filter(item => window.getComputedStyle(item).display !== 'none');
    
        // Массивы для хранения сумм
        let sumK = 0, sumB = 0, sumJ = 0, sumU = 0;
    
        dishItems.forEach(item => {
            const nutrition = item.getAttribute('data-nutrition');
            if (nutrition) {
                // Берём нужный блок по индексу
                const parts = nutrition.split('|');
                if (parts[nutritionIndex]) {
                    const [k, b, j, u] = parts[nutritionIndex].split(',').map(Number);
                    sumK += k || 0;
                    sumB += b || 0;
                    sumJ += j || 0;
                    sumU += u || 0;
                }
            }
        });
    
        // Обновляем значения на странице
        const kElem = document.querySelector('#data-k');
        const bElem = document.querySelector('#data-b');
        const jElem = document.querySelector('#data-j');
        const uElem = document.querySelector('#data-u');
        if (kElem) kElem.textContent = `К ${sumK}`;
        if (bElem) bElem.textContent = `Б ${sumB}`;
        if (jElem) jElem.textContent = `Ж ${sumJ}`;
        if (uElem) uElem.textContent = `У ${sumU}`;
    }
    
    // Функция для обновления отображения дня
    function updateDayDisplay() {   
        const currentDayKey = dayKeys[currentDayIndex];
        const currentDay = dishesByDay[currentDayKey];
        
        // Обновляем текст дня
        const dayItem = daysContainer.querySelector('.day-item');
        dayItem.textContent = currentDay.dayName;
        
        // Очищаем галерею блюд
        dishesGallery.innerHTML = '';
        
        // Добавляем блюда текущего дня
        currentDay.dishes.forEach(dish => {
            const dishElement = document.createElement('div');
            dishElement.className = 'dish-item';
        
            // Добавляем классы в зависимости от свойств блюда
            if (dish.isSnack) {
                dishElement.classList.add('isSnack');
            }
            if (dish.isDinner) {
                dishElement.classList.add('isDinner');
            }
            if (dish.isBreakfast) {
                dishElement.classList.add('isBreakfast');
            }
        
            // Добавляем data-атрибут с nutrition
            dishElement.setAttribute('data-nutrition', dish.nutrition);
        
            dishElement.innerHTML = `
                <img src="${dish.image}" alt="${dish.alt}">
                <div class="dish-overlay">
                    <span>${dish.name}</span>
                </div>
            `;
            dishesGallery.appendChild(dishElement);
        });
        
        // Обновляем состояние кнопок
        prevBtn.disabled = currentDayIndex === 0;
        nextBtn.disabled = currentDayIndex === dayKeys.length - 1;
        
        // Добавляем визуальные классы для неактивных кнопок
        prevBtn.classList.toggle('disabled', currentDayIndex === 0);
        nextBtn.classList.toggle('disabled', currentDayIndex === dayKeys.length - 1);

        updateNutritionSummary();
    }
    
    // Обработчик для кнопки "Предыдущий день"
    prevBtn.addEventListener('click', function() {
        if (currentDayIndex > 0) {
            currentDayIndex--;
            updateDayDisplay();
        }
    });
    
    // Обработчик для кнопки "Следующий день"
    nextBtn.addEventListener('click', function() {
        if (currentDayIndex < dayKeys.length - 1) {
            currentDayIndex++;
            updateDayDisplay();
        }
    });
    
    // Инициализация: отображаем первый день
    updateDayDisplay();

    // Управление выпадающим меню аллергенов
    const allergenTrigger = document.getElementById('allergen-trigger');
    const allergenDropdown = document.getElementById('allergen-dropdown');
    
    if (allergenTrigger && allergenDropdown) {
        // Обработчик клика по триггеру
        allergenTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            allergenDropdown.classList.toggle('active');
        });
        
        // Обработчик клика вне дропдауна для его закрытия
        document.addEventListener('click', function(e) {
            // Проверяем, что клик не внутри дропдауна, не по триггеру и не по инпутам в блоке accessories
            const isInsideDropdown = allergenDropdown.contains(e.target);
            const isTrigger = allergenTrigger.contains(e.target);
            const isAccessoriesInput = e.target.closest('[data-product-accessories-item-id]');
            
            if (!isInsideDropdown && !isTrigger && !isAccessoriesInput) {
                allergenDropdown.classList.remove('active');
            }
        });
        
        // Предотвращение закрытия при клике внутри дропдауна
        allergenDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    // Рендерим список аллергенов
    const allergenList = document.getElementById('allergen-list');
    if (allergenList && window.allergens && Array.isArray(window.allergens.data)) {
        allergenList.innerHTML = ''; // Очищаем на всякий случай
        window.allergens.data.forEach(allergen => {
            const item = document.createElement('div');
            item.className = 'allergen-item';
            item.setAttribute('data-allergen', allergen.value);
            item.setAttribute('data-allergen-id', allergen.id);

            item.innerHTML = `
                <div class="checkbox">
                    <div class="checkbox-inner"></div>
                </div>
                <span class="allergen-name">${allergen.name}</span>
                <span class="allergen-price" style="display: none;">+300₽</span>
            `;
            allergenList.appendChild(item);
        });
    }

    // Функция для обновления значения инпута
    function updateAllergenInputAndTags() {
        const allergenTags = document.getElementById('allergen-tags');
        const allergenNote = document.getElementById('allergen-note');
        const selectedItems = Array.from(document.querySelectorAll('.allergen-item.selected'));
        const input = document.getElementById('allergen-input');
        if (input) {
            input.value = selectedItems.map(item => item.getAttribute('data-allergen')).join(',');
        }

        // Показываем/скрываем блок allergen-note в зависимости от выбранных аллергенов
        if (allergenNote) {
            if (selectedItems.length > 0) {
                allergenNote.style.display = 'flex';
            } else {
                allergenNote.style.display = 'none';
            }
        }

        // Показываем/скрываем блок allergen-price только у аллергенов, выбранных после 3-го
        const allergenPriceElements = document.querySelectorAll('.allergen-price');
        allergenPriceElements.forEach(priceElement => {
            // Находим родительский элемент allergen-item
            const allergenItem = priceElement.closest('.allergen-item');
            if (allergenItem) {
                // Проверяем, выбран ли этот аллерген
                if (allergenItem.classList.contains('selected')) {
                    // Находим индекс этого аллергена среди выбранных
                    const selectedItemsArray = Array.from(selectedItems);
                    const itemIndex = selectedItemsArray.indexOf(allergenItem);
                    
                    // Показываем цену только если это 4-й или более поздний выбранный аллерген (индекс >= 3)
                    if (itemIndex >= 3) {
                        priceElement.style.display = 'inline';
                    } else {
                        priceElement.style.display = 'none';
                    }
                } else {
                    // Если аллерген не выбран, скрываем цену
                    priceElement.style.display = 'none';
                }
            }
        });

        // Управляем инпутами в блоке с data-product-accessories-item-id="4307001"
        const accessoriesBlock = document.querySelector(`[data-product-accessories-item-id="${excludeProductAccessories.id}"]`);
        if (accessoriesBlock) {
            const inputs = accessoriesBlock.querySelectorAll('input[type="checkbox"]');
            const extraAllergens = Math.max(0, selectedItems.length - 3); // Количество аллергенов сверх 3-х
            
            // Сначала снимаем все чекбоксы
            inputs.forEach(input => {
                if (input.checked) {
                    input.click();
                }
            });
            
            // Затем включаем нужное количество чекбоксов
            for (let i = 0; i < extraAllergens && i < inputs.length; i++) {
                if (!inputs[i].checked) {
                    inputs[i].click();
                }
            }
        }

        // Обновляем теги
        if (allergenTags) {
            allergenTags.innerHTML = '';
            selectedItems.forEach(item => {
                const value = item.getAttribute('data-allergen');
                const tag = document.createElement('span');
                tag.className = 'allergen-tag';
                tag.innerHTML = `
                    ${value}
                    <button class="remove-btn" type="button">×</button>
                `;
                tag.querySelector('.remove-btn').addEventListener('click', function(e) {
                    // Снимаем выбор с allergen-item
                    item.classList.remove('selected');
                    updateAllergenInputAndTags();
                });
                allergenTags.appendChild(tag);
            });
        }
    }

    // Делегирование клика по аллергенам
    if (allergenList) {
        allergenList.addEventListener('click', function(e) {
            const item = e.target.closest('.allergen-item');
            if (item) {
                item.classList.toggle('selected');
                updateAllergenInputAndTags();
            }
        });
    }

    // Поиск аллергенов
    const allergenSearch = document.getElementById('allergen-search');
    if (allergenSearch && allergenList) {
        allergenSearch.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            const allergenItems = allergenList.querySelectorAll('.allergen-item');
            
            allergenItems.forEach(item => {
                const allergenName = item.querySelector('.allergen-name').textContent.toLowerCase();
                
                if (searchTerm === '' || allergenName.startsWith(searchTerm)) {
                    item.style.display = 'flex'; // или 'block', в зависимости от CSS
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    // Date Picker Calendar - Календарь для выбора даты при клике на current-day
    class DatePickerCalendar {
        constructor() {
        // Проверяем, что currentTime существует
        if (typeof currentTime === 'undefined') {
            this.currentDate = new Date();
        } else {
            this.currentDate = new Date(currentTime);
        }
        
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
        // Получаем график доставки из данных программы
        let deliverySchedule = "every-day"; // по умолчанию каждый день
        
        if (window.dishesData && window.dishesData.deliverySchedule) {
            deliverySchedule = window.dishesData.deliverySchedule;
        }
        
        // Используем глобальную функцию проверки доступности
        if (typeof DateAvailability !== 'undefined' && DateAvailability.isDateAvailable) {
            return DateAvailability.isDateAvailable(date, this.currentDate, this.maxMonthsAhead, deliverySchedule);
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
        
        // Находим индекс дня в программе для выбранной даты
        if (typeof generateDaysArray === 'function' && typeof currentIndex !== 'undefined') {
            try {
            const daysArray = generateDaysArray();
            const targetIndex = daysArray.findIndex(dayData => 
                this.isSameDate(dayData.date, date)
            );
            
            if (targetIndex !== -1) {
                // Обновляем глобальный индекс и переходим к выбранному дню
                currentIndex = targetIndex;
                if (typeof updateDays === 'function') {
                updateDays();
                }
            }
            } catch (error) {
            console.error('Error selecting date:', error);
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

    new DatePickerCalendar();
});

