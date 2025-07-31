
EventBus.subscribe('accessories-rendered:insales:ui_accessories', function (data) {
    const gallery = $('#dishes-gallery');
    let currentVariantOptions = [];

    for (let index = 0; index < data.productJSON.option_names.length; index++) {
        const obj = {
            'id': data.productJSON.option_names[index].id,
            'title': data.productJSON.option_names[index].title,
            'current_value': data.productJSON.options[index].current_value.title,
        }
        currentVariantOptions.push(obj);
    }

    // Костыль чтобы опции были выбраны по умолчанию
    $('.accessory-values__item input').click();


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
        console.log(data)

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
            if (!allergenDropdown.contains(e.target) && !allergenTrigger.contains(e.target)) {
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
});

