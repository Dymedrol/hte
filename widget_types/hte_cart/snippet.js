// Управление overlay при загрузке
let isRemovingItems = false;

// Функция для показа overlay
function showCartLoadingOverlay() {
    isRemovingItems = true;
    // Пытаемся найти overlay, если его еще нет - создаем
    let overlay = document.getElementById('cartLoadingOverlay');
    if (!overlay) {
        // Создаем overlay, если его нет в DOM
        overlay = document.createElement('div');
        overlay.id = 'cartLoadingOverlay';
        overlay.className = 'cart-loading-overlay';
        overlay.innerHTML = '<div class="loading-spinner"></div>';
        document.body.appendChild(overlay);
    }
    overlay.classList.add('active');
}

// Функция для скрытия overlay
function hideCartLoadingOverlay() {
    const overlay = document.getElementById('cartLoadingOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        overlay.classList.add('hidden');
    }
}

// Проверяем при загрузке страницы, нужно ли показывать overlay
// Overlay видим по умолчанию в HTML, скрывается через inline скрипт если нет удаления
// Этот скрипт обрабатывает случай, когда есть процесс удаления
(function() {
    // Проверяем, есть ли флаг в sessionStorage о процессе удаления
    const wasRemovingItems = sessionStorage.getItem('cartRemovingItems');
    
    // Если флаг был установлен, overlay уже видим (inline скрипт его не скрыл)
    if (wasRemovingItems === 'true') {
        // Очищаем флаг
        sessionStorage.removeItem('cartRemovingItems');
        
        // Ждем загрузки и скрываем overlay
        function hideOverlayAfterLoad() {
            window.addEventListener('load', function() {
                setTimeout(function() {
                    hideCartLoadingOverlay();
                }, 300);
            });
        }
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', hideOverlayAfterLoad);
        } else {
            hideOverlayAfterLoad();
        }
    }
    // Если флага нет, overlay уже скрыт inline скриптом, ничего не делаем
})();

EventBus.subscribe('delete_items:insales:cart', function(data) {
    showCartLoadingOverlay();
    window.location.reload();
});

// Функция для определения ближайшего времени доставки
function updateDeliveryNoteSummary() {
    const deliveryNoteElement = document.querySelector('.delivery-note-summary');
    if (!deliveryNoteElement) return;
    
    const programItems = document.querySelectorAll('.cart-item.cart-item_program');
    
    console.log('Найдено программ в корзине:', programItems.length);
    
    if (programItems.length > 0) {
        // Есть программы - анализируем даты доставки из комментариев
        let earliestDeliveryInfo = null;
        
        programItems.forEach((item, index) => {
            const commentInput = item.querySelector('input[data-comment]');
            if (!commentInput) return;
            
            const comment = commentInput.value || '';
            console.log(`Программа ${index + 1}, комментарий:`, comment);
            
            const commentParts = comment.split('|');
            
            let deliveryDate = null;
            let deliveryTime = null;
            
            commentParts.forEach(part => {
                const trimmedPart = part.trim();
                
                // Ищем дату доставки
                if (trimmedPart.startsWith('Даты доставки:')) {
                    const datePart = trimmedPart.split('Даты доставки:')[1]?.trim();
                    if (datePart) {
                        deliveryDate = datePart;
                        console.log(`Найдена дата доставки: ${datePart}`);
                    }
                }
                
                // Ищем время доставки
                if (trimmedPart.startsWith('Время доставки:')) {
                    const timePart = trimmedPart.split('Время доставки:')[1]?.trim();
                    if (timePart) {
                        deliveryTime = timePart;
                        console.log(`Найдено время доставки: ${timePart}`);
                    }
                }
            });
            
            if (deliveryDate && deliveryTime) {
                // Парсим дату для сравнения
                const parsedDate = parseDeliveryDate(deliveryDate);
                console.log(`Парсированная дата:`, parsedDate);
                
                if (parsedDate) {
                    // Если это первая найденная дата или дата раньше текущей самой ранней
                    if (!earliestDeliveryInfo || parsedDate < earliestDeliveryInfo.date) {
                        earliestDeliveryInfo = {
                            date: parsedDate,
                            time: deliveryTime
                        };
                        console.log(`Новая самая ранняя дата: ${deliveryDate} с ${deliveryTime}`);
                    }
                }
            }
        });
        
        if (earliestDeliveryInfo) {
            const formattedDate = formatDeliveryDate(earliestDeliveryInfo.date);
            deliveryNoteElement.textContent = `Ближайшая доставка: ${formattedDate} с ${earliestDeliveryInfo.time}`;
            console.log(`Установлена ближайшая доставка: ${formattedDate} с ${earliestDeliveryInfo.time}`);
        } else {
            console.log('Не удалось найти даты в программах, используем логику по времени');
            // Если не удалось найти даты в программах, используем логику по времени
            updateDeliveryNoteByTime(deliveryNoteElement);
        }
    } else {
        console.log('Нет программ в корзине, проверяем товары полезного магазина и питомцев');
        // Нет программ - проверяем товары полезного магазина и карточки питомцев
        const hasOtherItemsDelivery = analyzeOtherItemsDelivery(deliveryNoteElement);
        
        if (!hasOtherItemsDelivery) {
            console.log('Не найдено дат в других товарах, используем логику по времени');
            // Если не нашли даты в других товарах - используем логику по времени
            updateDeliveryNoteByTime(deliveryNoteElement);
        }
    }
}

// Функция для анализа товаров полезного магазина и карточек питомцев
function analyzeOtherItemsDelivery(deliveryNoteElement) {
    console.log('🔍 Анализ товаров полезного магазина и карточек питомцев...');
    
    let earliestDeliveryInfo = null;
    
    // 1. Анализируем обычные товары (не программы, не доставка)
    const allCartItems = document.querySelectorAll('.cart-item');
    const regularItems = [];
    
    allCartItems.forEach(item => {
        const canonicalCollection = item.getAttribute('data-canonical-collection') || '';
        const isPetsItem = item.classList.contains('cart-item_pets');
        const isPetsSummary = item.classList.contains('cart-item_pets-summary');
        
        // Исключаем программы и товары доставки, но включаем обычные товары для питомцев
        if (!canonicalCollection.includes('program') && 
            !canonicalCollection.includes('dostavka') &&
            !isPetsSummary) { // Не включаем сводные карточки на этом этапе
            regularItems.push(item);
        }
    });
    
    console.log('Найдено обычных товаров:', regularItems.length);
    
    // Анализируем обычные товары
    regularItems.forEach((item, index) => {
        const comment = getItemComment(item);
        if (!comment) return;
        
        console.log(`Товар ${index + 1}, комментарий:`, comment);
        
        const deliveryInfo = extractDeliveryInfo(comment);
        if (deliveryInfo.date && deliveryInfo.time) {
            const parsedDate = parseDeliveryDate(deliveryInfo.date);
            
            if (parsedDate) {
                if (!earliestDeliveryInfo || parsedDate < earliestDeliveryInfo.date) {
                    earliestDeliveryInfo = {
                        date: parsedDate,
                        time: deliveryInfo.time
                    };
                    console.log(`✅ Новая самая ранняя дата из товаров: ${deliveryInfo.date} с ${deliveryInfo.time}`);
                }
            }
        }
    });
    
    // 2. Анализируем объединенные карточки питомцев
    const petsSummaryCards = document.querySelectorAll('.cart-item_pets-summary');
    console.log('Найдено карточек питомцев:', petsSummaryCards.length);
    
    petsSummaryCards.forEach((card, index) => {
        const petsId = card.getAttribute('data-pets-id');
        console.log(`🐾 Карточка питомца ${index + 1}, pets-id: ${petsId}`);
        
        // Находим все товары для этого питомца
        const petsItems = document.querySelectorAll(`.cart-item_pets`);
        
        petsItems.forEach(petsItem => {
            const comment = getItemComment(petsItem);
            if (!comment) return;
            
            // Проверяем, что это товар для нужного питомца
            if (comment.includes(`pets-id: ${petsId}`) || comment.includes(`pets-id:${petsId}`)) {
                const deliveryInfo = extractDeliveryInfo(comment);
                
                if (deliveryInfo.date && deliveryInfo.time) {
                    const parsedDate = parseDeliveryDate(deliveryInfo.date);
                    
                    if (parsedDate) {
                        if (!earliestDeliveryInfo || parsedDate < earliestDeliveryInfo.date) {
                            earliestDeliveryInfo = {
                                date: parsedDate,
                                time: deliveryInfo.time
                            };
                            console.log(`✅ Новая самая ранняя дата из товаров питомцев: ${deliveryInfo.date} с ${deliveryInfo.time}`);
                        }
                    }
                }
            }
        });
    });
    
    // 3. Устанавливаем результат
    if (earliestDeliveryInfo) {
        const formattedDate = formatDeliveryDate(earliestDeliveryInfo.date);
        deliveryNoteElement.textContent = `Ближайшая доставка: ${formattedDate} с ${earliestDeliveryInfo.time}`;
        console.log(`✅ Установлена ближайшая доставка из других товаров: ${formattedDate} с ${earliestDeliveryInfo.time}`);
        return true;
    }
    
    console.log('❌ Не найдено дат доставки в товарах полезного магазина и питомцев');
    return false;
}

// Функция для получения комментария товара
function getItemComment(item) {
    // Сначала пробуем получить из data-comment атрибута
    const dataComment = item.getAttribute('data-comment');
    if (dataComment) {
        return dataComment;
    }
    
    // Затем пробуем из input[data-comment]
    const commentInput = item.querySelector('input[data-comment]');
    if (commentInput) {
        return commentInput.value || '';
    }
    
    return null;
}

// Функция для извлечения информации о дате и времени доставки из комментария
function extractDeliveryInfo(comment) {
    const commentParts = comment.split('|');
    let deliveryDate = null;
    let deliveryTime = null;
    
    commentParts.forEach(part => {
        const trimmedPart = part.trim();
        
        // Ищем дату доставки (разные форматы)
        if (trimmedPart.includes('Даты доставки:') || 
            trimmedPart.includes('Выбранные даты:') || 
            trimmedPart.includes('Массив дат:') || 
            trimmedPart.includes('Дата доставки:')) {
            
            let datePart = null;
            
            if (trimmedPart.includes('Выбранные даты:')) {
                datePart = trimmedPart.split('Выбранные даты:')[1];
            } else if (trimmedPart.includes('Массив дат:')) {
                datePart = trimmedPart.split('Массив дат:')[1];
            } else if (trimmedPart.includes('Дата доставки:')) {
                datePart = trimmedPart.split('Дата доставки:')[1];
            } else if (trimmedPart.includes('Даты доставки:')) {
                datePart = trimmedPart.split('Даты доставки:')[1];
            }
            
            if (datePart) {
                // Убираем время если оно есть в строке с датой
                let cleanDate = datePart.trim();
                if (cleanDate.includes(', время')) {
                    cleanDate = cleanDate.split(', время')[0].trim();
                } else if (cleanDate.includes(',время')) {
                    cleanDate = cleanDate.split(',время')[0].trim();
                }
                
                // Убираем квадратные скобки
                cleanDate = cleanDate.replace(/[\[\]]/g, '');
                
                // Если есть несколько дат через запятую, берем первую (самую раннюю)
                if (cleanDate.includes(',')) {
                    cleanDate = cleanDate.split(',')[0].trim();
                }
                
                deliveryDate = cleanDate;
            }
        }
        
        // Ищем время доставки
        if (trimmedPart.includes('Время доставки:')) {
            const timePart = trimmedPart.split('Время доставки:')[1];
            if (timePart) {
                deliveryTime = timePart.trim();
            }
        }
        
        // Также ищем время внутри строки с датой
        if (!deliveryTime && trimmedPart.includes('время:')) {
            const timePart = trimmedPart.split('время:')[1];
            if (timePart) {
                deliveryTime = timePart.trim();
            }
        }
    });
    
    return {
        date: deliveryDate,
        time: deliveryTime
    };
}

// Функция для обновления времени доставки на основе текущего времени
function updateDeliveryNoteByTime(deliveryNoteElement) {
    if (!window.currentTime) {
        // Если currentTime не определен, используем текущее время
        window.currentTime = new Date();
    }
    
    const currentTime = new Date(window.currentTime);
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const cutoffTimeInMinutes = 13 * 60 + 30; // 13:30
    
    let deliveryDate;
    
    if (currentTimeInMinutes < cutoffTimeInMinutes) {
        // До 13:30 - доставка завтра
        deliveryDate = new Date(currentTime);
        deliveryDate.setDate(deliveryDate.getDate() + 1);
    } else {
        // После 13:30 - доставка послезавтра
        deliveryDate = new Date(currentTime);
        deliveryDate.setDate(deliveryDate.getDate() + 2);
    }
    
    const formattedDate = formatDeliveryDate(deliveryDate);
    deliveryNoteElement.textContent = `Ближайшая доставка: ${formattedDate} с 6:00 до 10:00`;
}

// Функция для парсинга даты доставки из строки
function parseDeliveryDate(dateString) {
    console.log(`Парсинг даты: "${dateString}"`);
    
    // Поддерживаем различные форматы дат
    const datePatterns = [
        /(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/i,
        /(\d{1,2})\.(\d{1,2})\.(\d{4})/,
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        /(\d{4})-(\d{1,2})-(\d{1,2})/,
        /(\d{1,2})\.(\d{1,2})\.(\d{2})/,
        /(\d{1,2})\/(\d{1,2})\/(\d{2})/
    ];
    
    const monthNames = {
        'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3, 'мая': 4, 'июня': 5,
        'июля': 6, 'августа': 7, 'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
    };
    
    for (let i = 0; i < datePatterns.length; i++) {
        const pattern = datePatterns[i];
        const match = dateString.match(pattern);
        if (match) {
            console.log(`Найден паттерн ${i + 1}:`, match);
            
            if (i === 0) {
                // Формат "19 марта"
                const day = parseInt(match[1]);
                const monthName = match[2].toLowerCase();
                const month = monthNames[monthName];
                if (month !== undefined) {
                    const currentYear = new Date().getFullYear();
                    const result = new Date(currentYear, month, day);
                    console.log(`Результат парсинга:`, result);
                    return result;
                }
            } else if (i === 1) {
                // Формат "19.03.2024"
                const day = parseInt(match[1]);
                const month = parseInt(match[2]) - 1;
                const year = parseInt(match[3]);
                const result = new Date(year, month, day);
                console.log(`Результат парсинга:`, result);
                return result;
            } else if (i === 2) {
                // Формат "19/03/2024"
                const day = parseInt(match[1]);
                const month = parseInt(match[2]) - 1;
                const year = parseInt(match[3]);
                const result = new Date(year, month, day);
                console.log(`Результат парсинга:`, result);
                return result;
            } else if (i === 3) {
                // Формат "2024-03-19"
                const year = parseInt(match[1]);
                const month = parseInt(match[2]) - 1;
                const day = parseInt(match[3]);
                const result = new Date(year, month, day);
                console.log(`Результат парсинга:`, result);
                return result;
            } else if (i === 4) {
                // Формат "19.03.24"
                const day = parseInt(match[1]);
                const month = parseInt(match[2]) - 1;
                const year = 2000 + parseInt(match[3]);
                const result = new Date(year, month, day);
                console.log(`Результат парсинга:`, result);
                return result;
            } else if (i === 5) {
                // Формат "19/03/24"
                const day = parseInt(match[1]);
                const month = parseInt(match[2]) - 1;
                const year = 2000 + parseInt(match[3]);
                const result = new Date(year, month, day);
                console.log(`Результат парсинга:`, result);
                return result;
            }
        }
    }
    
    console.log(`Не удалось распарсить дату: "${dateString}"`);
    return null;
}

// Функция для форматирования даты в нужный формат
function formatDeliveryDate(date) {
    const months = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    
    return `${day} ${month}`;
}

// Функция для управления meal-option-item для premium продуктов
function managePremiumMealOptions() {
    const allCartItems = document.querySelectorAll('.cart-item');
    const premiumCartItems = document.querySelectorAll('.cart-item[data-product-handle="premium"]');
    
    console.log('Всего товаров в корзине:', allCartItems.length);
    console.log('Найдено premium товаров:', premiumCartItems.length);
    
    // Логируем все товары для отладки
    allCartItems.forEach((item, index) => {
        const handle = item.getAttribute('data-product-handle');
        const tags = item.querySelector('.cart-item-tags') ? 
            Array.from(item.querySelectorAll('.tag')).map(tag => tag.textContent.trim()) : [];
        console.log(`Товар ${index + 1}: handle="${handle}", теги:`, tags);
    });
    
    premiumCartItems.forEach((cartItem, index) => {
        console.log(`Обрабатываем premium товар ${index + 1}:`);
        
        // Проверяем наличие тега "1800" в cart-item-tags
        const cartItemTags = cartItem.querySelector('.cart-item-tags');
        const tags = cartItemTags ? Array.from(cartItemTags.querySelectorAll('.tag')).map(tag => tag.textContent.trim()) : [];
        const has1800Tag = tags.includes('1800');
        
        console.log('Найденные теги:', tags);
        console.log('Есть тег "1800":', has1800Tag);
        
        // Если нет тега "1800", пропускаем этот товар
        if (!has1800Tag) {
            console.log('Premium товар без тега "1800" - пропускаем');
            return;
        }
        
        const mealOptionsContainer = cartItem.querySelector('.cart-meal-options');
        if (!mealOptionsContainer) return;
        
        // Проверяем существующие meal-option-item
        const existingMealOptions = mealOptionsContainer.querySelectorAll('.meal-option-item');
        const existingTexts = Array.from(existingMealOptions).map(option => 
            option.querySelector('span')?.textContent.trim()
        );
        
        // Опции для скрытия/добавления
        const targetOptions = [
            'Убрать ужин и перекус',
            'Убрать завтрак и перекус'
        ];
        
        targetOptions.forEach(targetText => {
            const existingOption = Array.from(existingMealOptions).find(option => 
                option.querySelector('span')?.textContent.trim() === targetText
            );
            
            if (existingOption) {
                // Если опция существует - скрываем её
                existingOption.style.display = 'none';
                console.log('Скрыта meal-option-item:', targetText, 'для premium товара с тегом 1800');
            } else {
                // Если опции нет - добавляем её
                const newMealOption = document.createElement('div');
                newMealOption.className = 'meal-option-item';
                
                
                const span = document.createElement('span');
                span.textContent = targetText;
                newMealOption.appendChild(span);
                
                mealOptionsContainer.appendChild(newMealOption);
                console.log('Добавлена meal-option-item:', targetText, 'для premium товара с тегом 1800');
            }
        });
    });
}

// Функция для инициализации состояния toggle-switch
function initializeToggleSwitches() {
    const cartItems = document.querySelectorAll('.cart-item');
    
    cartItems.forEach(cartItem => {
        const commentInput = cartItem.querySelector('input[data-comment]');
        if (!commentInput) return;
        
        const currentComment = commentInput.value || '';
        if (!currentComment) return;
        
        const toggleItems = cartItem.querySelectorAll('.toggle-item');
        toggleItems.forEach(toggleItem => {
            const toggleText = toggleItem.querySelector('span');
            const toggleSwitch = toggleItem.querySelector('.toggle-switch');
            
            if (toggleText && toggleSwitch) {
                const toggleTextContent = toggleText.textContent.trim();
                
                // Проверяем, есть ли текст в комментарии
                if (currentComment.includes(toggleTextContent)) {
                    toggleSwitch.classList.add('active');
                }
            }
        });
    });
}

// Функция для обработки клика по toggle-switch
function handleToggleSwitchClick(event) {
    const switcher = event.target.closest('.toggle-switch');
    if (!switcher) return;
    
    // Переключаем активное состояние
    switcher.classList.toggle('active');
    
    // Находим родительский cart-item
    const cartItem = switcher.closest('.cart-item');
    if (!cartItem) return;
    
    // Находим инпут с data-comment
    const commentInput = cartItem.querySelector('input[data-comment]');
    if (!commentInput) return;
    
    // Находим span с текстом в том же toggle-item
    const toggleItem = switcher.closest('.toggle-item');
    const toggleText = toggleItem.querySelector('span');
    if (!toggleText) return;
    
    const toggleTextContent = toggleText.textContent.trim();
    let currentComment = commentInput.value || '';
    
    if (switcher.classList.contains('active')) {
        // Добавляем текст к комментарию
        if (currentComment) {
            currentComment += '|' + toggleTextContent;
        } else {
            currentComment = toggleTextContent;
        }
    } else {
        // Удаляем текст из комментария
        if (currentComment.includes(toggleTextContent)) {
            // Удаляем текст и лишние разделители
            currentComment = currentComment
                .replace('|' + toggleTextContent, '')
                .replace(toggleTextContent + '|', '')
                .replace(toggleTextContent, '');
            
            // Убираем двойные разделители
            currentComment = currentComment.replace(/\|\|/g, '|');
            
            // Убираем разделители в начале и конце
            currentComment = currentComment.replace(/^\||\|$/g, '');
        }
    }
    
    // Обновляем значение инпута
    commentInput.value = currentComment;
    
    console.log('Toggle switched:', {
        text: toggleTextContent,
        active: switcher.classList.contains('active'),
        newComment: currentComment
    });
}

// Функция для проверки комментариев товаров для питомцев
function checkPetsItemsComments() {
    console.log('🐾 ===== ПРОВЕРКА КОММЕНТАРИЕВ ТОВАРОВ ДЛЯ ПИТОМЦЕВ =====');
    
    const petsItems = document.querySelectorAll('.cart-item_pets');
    console.log('🔍 Найдено товаров для питомцев:', petsItems.length);
    
    petsItems.forEach((item, index) => {
        const itemId = item.getAttribute('data-item-id');
        const title = item.querySelector('.cart-item-title')?.textContent || 'Без названия';
        const dataComment = item.getAttribute('data-comment');
        
        console.log(`\n🐾 Товар для питомца ${index + 1}:`);
        console.log(`   📝 Название: ${title}`);
        console.log(`   🆔 ID: ${itemId}`);
        console.log(`   💬 Комментарий (data-comment):`, dataComment);
        
        // Извлекаем pets-id из комментария
        if (dataComment) {
            const petsIdMatch = dataComment.match(/pets-id:\s*(\S+)/);
            const petTypeMatch = dataComment.match(/Рацион для питомца:\s*([^|]+)/);
            
            console.log(`   🔑 pets-id:`, petsIdMatch ? petsIdMatch[1] : '❌ НЕ НАЙДЕН');
            console.log(`   🐕 Тип питомца:`, petTypeMatch ? petTypeMatch[1].trim() : '❌ НЕ НАЙДЕН');
            
            const hasDates = dataComment.includes('Даты доставки:') || 
                           dataComment.includes('Массив дат:') ||
                           dataComment.includes('Выбранные даты:');
            console.log(`   📅 Есть даты в комментарии:`, hasDates ? '✅ ДА' : '❌ НЕТ');
            
            if (hasDates) {
                console.log(`   📋 Полный комментарий:`, dataComment);
            }
        } else {
            console.log(`   ⚠️ Комментарий отсутствует!`);
        }
    });
    
    console.log('\n🐾 ===== КОНЕЦ ПРОВЕРКИ =====');
}

// Функция для проверки группировки питомцев в карточках
function checkPetsGrouping() {
    console.log('📊 ===== ПРОВЕРКА ГРУППИРОВКИ ТОВАРОВ ДЛЯ ПИТОМЦЕВ =====');
    
    // Проверяем индивидуальные товары для питомцев
    const individualPetsItems = document.querySelectorAll('.cart-item_pets:not(.cart-item_pets-summary)');
    console.log('🛍️ Найдено индивидуальных товаров для питомцев:', individualPetsItems.length);
    
    const itemsByPetsId = {};
    
    individualPetsItems.forEach((item, index) => {
        const itemId = item.getAttribute('data-item-id');
        const title = item.querySelector('.cart-item-title')?.textContent?.trim() || 'Без названия';
        const dataComment = item.getAttribute('data-comment');
        
        if (dataComment) {
            const petsIdMatch = dataComment.match(/pets-id:\s*([^\|]+)/);
            const petTypeMatch = dataComment.match(/Рацион для питомца:\s*([^\|]+)/);
            
            const petsId = petsIdMatch ? petsIdMatch[1].trim() : 'default';
            const petType = petTypeMatch ? petTypeMatch[1].trim() : 'Неизвестно';
            
            if (!itemsByPetsId[petsId]) {
                itemsByPetsId[petsId] = {
                    type: petType,
                    items: []
                };
            }
            itemsByPetsId[petsId].items.push(title);
        }
    });
    
    console.log('\n🔍 Группировка по pets-id:');
    Object.keys(itemsByPetsId).forEach(petsId => {
        const group = itemsByPetsId[petsId];
        console.log(`\n  🆔 pets-id: "${petsId}"`);
        console.log(`     🐕 Тип: ${group.type}`);
        console.log(`     📦 Товаров: ${group.items.length}`);
        console.log(`     🛍️ Список:`, group.items);
    });
    
    // Проверяем сводные карточки
    const petsSummaryCards = document.querySelectorAll('.cart-item_pets-summary');
    console.log('\n\n📋 ===== СВОДНЫЕ КАРТОЧКИ =====');
    console.log('🔍 Найдено сводных карточек:', petsSummaryCards.length);
    
    petsSummaryCards.forEach((card, index) => {
        const petsId = card.getAttribute('data-pets-id');
        const petType = card.getAttribute('data-pet-type');
        const title = card.querySelector('.cart-item-title')?.textContent || 'Без названия';
        const count = card.querySelector('.cart-item-tags .tag')?.textContent || '0';
        const price = card.querySelector('.price-amount')?.textContent || '0';
        const imageEl = card.querySelector('.cart-item-image');
        const imageUrl = imageEl ? imageEl.style.backgroundImage : 'нет';
        
        console.log(`\n📦 Карточка ${index + 1}:`);
        console.log(`   🔑 pets-id: "${petsId}"`);
        console.log(`   🐕 Тип питомца: "${petType}"`);
        console.log(`   📝 Заголовок: "${title}"`);
        console.log(`   🖼️ Картинка: ${imageUrl}`);
        console.log(`   📊 Количество товаров: ${count}`);
        console.log(`   💰 Итоговая цена: ${price}`);
        
        // Проверяем правильность заголовка и картинки
        const petTypeLower = petType.toLowerCase();
        let expectedTitle = 'Рацион для питомца';
        let expectedImage = 'puppy-icon.png';
        
        if (petTypeLower.includes('кошка') || petTypeLower.includes('котенок') || petTypeLower.includes('кот')) {
            expectedTitle = 'Рацион для котят и кошек';
            expectedImage = 'cat-icon.png';
        } else if (petTypeLower.includes('щенок')) {
            expectedTitle = 'Рацион для щенков';
            expectedImage = 'puppy-icon.png';
        } else if (petTypeLower.includes('собака') || petTypeLower.includes('взрослая собака') || petTypeLower.includes('пес')) {
            expectedTitle = 'Рацион для взрослой собаки';
            expectedImage = 'dog-icon.png';
        }
        
        const titleCorrect = title === expectedTitle;
        const imageCorrect = imageUrl.includes(expectedImage);
        
        console.log(`   ✅ Заголовок правильный: ${titleCorrect ? 'ДА' : 'НЕТ'} (ожидается: "${expectedTitle}")`);
        console.log(`   ✅ Картинка правильная: ${imageCorrect ? 'ДА' : 'НЕТ'} (ожидается: "${expectedImage}")`);
    });
    
    // Проверяем сводку в правой колонке (товары для питомцев убраны из сводки)
    console.log('\n\n💰 ===== СВОДКА В ПРАВОЙ КОЛОНКЕ =====');
    console.log('ℹ️ Товары для питомцев НЕ отображаются в правой колонке');
    console.log('ℹ️ Они показаны только в левой колонке в виде карточек-суммари');
    
    // Итоговая сводка
    console.log('\n\n📊 ===== ИТОГОВАЯ СВОДКА =====');
    console.log(`🛍️ Индивидуальных товаров для питомцев: ${individualPetsItems.length}`);
    console.log(`🆔 Уникальных pets-id: ${Object.keys(itemsByPetsId).length}`);
    console.log(`📋 Сводных карточек: ${petsSummaryCards.length}`);
    
    if (Object.keys(itemsByPetsId).length === petsSummaryCards.length) {
        console.log('✅ Количество сводных карточек соответствует количеству уникальных pets-id');
    } else {
        console.warn('⚠️ ВНИМАНИЕ! Количество сводных карточек НЕ соответствует количеству уникальных pets-id!');
        console.warn(`   Ожидается: ${Object.keys(itemsByPetsId).length}, найдено: ${petsSummaryCards.length}`);
    }
    
    console.log('\n📊 ===== КОНЕЦ ПРОВЕРКИ ГРУППИРОВКИ =====');
    
    return {
        individualItems: individualPetsItems.length,
        uniquePetsIds: Object.keys(itemsByPetsId).length,
        summaryCards: petsSummaryCards.length,
        itemsByPetsId: itemsByPetsId
    };
}

// Делаем функции доступными глобально
window.checkPetsItemsComments = checkPetsItemsComments;
window.checkPetsGrouping = checkPetsGrouping;

$(document).ready(function() {
    // Инициализируем управление meal-option-item для premium продуктов
    managePremiumMealOptions();
    
    // Инициализируем состояние toggle-switch
    initializeToggleSwitches();
    
    // Обновляем информацию о ближайшей доставке
    updateDeliveryNoteSummary();
    
    // Проверяем комментарии товаров для питомцев при загрузке
    setTimeout(() => {
        checkPetsItemsComments();
        checkPetsGrouping();
    }, 1000);
    
    // Используем делегирование событий для обработки всех toggle-switch
    document.addEventListener('click', handleToggleSwitchClick);
    
    // Наблюдаем за изменениями в DOM корзины
    const cartContainer = document.querySelector('.cart-items-left');
    if (cartContainer) {
        const observer = new MutationObserver(function(mutations) {
            let shouldReinitialize = false;
            
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    // Проверяем, были ли добавлены или удалены cart-item
                    const addedItems = Array.from(mutation.addedNodes).some(node => 
                        node.nodeType === 1 && (node.classList?.contains('cart-item') || node.querySelector?.('.cart-item'))
                    );
                    const removedItems = Array.from(mutation.removedNodes).some(node => 
                        node.nodeType === 1 && (node.classList?.contains('cart-item') || node.querySelector?.('.cart-item'))
                    );
                    
                    if (addedItems || removedItems) {
                        shouldReinitialize = true;
                    }
                }
            });
            
            if (shouldReinitialize) {
                setTimeout(() => {
                    managePremiumMealOptions();
                    initializeToggleSwitches();
                    updateDeliveryNoteSummary();
                }, 100);
            }
        });
        
        observer.observe(cartContainer, {
            childList: true,
            subtree: true
        });
    }
    
    // Обрабатываем обновление корзины
    EventBus.subscribe('cart:updated', function() {
        // Переинициализируем toggle-switch после обновления корзины
        setTimeout(() => {
            managePremiumMealOptions();
            initializeToggleSwitches();
            updateDeliveryNoteSummary();
        }, 100);
    });
    
    // Обрабатываем добавление товара в корзину
    EventBus.subscribe('cart:item_added', function() {
        // Переинициализируем toggle-switch после добавления товара
        setTimeout(() => {
            managePremiumMealOptions();
            initializeToggleSwitches();
            updateDeliveryNoteSummary();
        }, 100);
    });
    
    // Обрабатываем удаление товара из корзины
    EventBus.subscribe('cart:item_removed', function() {
        // Переинициализируем после удаления товара
        setTimeout(() => {
            managePremiumMealOptions();
            initializeToggleSwitches();
            updateDeliveryNoteSummary();
        }, 100);
    });
    
    // Обрабатываем изменение количества товара
    EventBus.subscribe('cart:quantity_changed', function() {
        // Переинициализируем после изменения количества
        setTimeout(() => {
            managePremiumMealOptions();
            initializeToggleSwitches();
            updateDeliveryNoteSummary();
        }, 100);
    });
    
    // Обрабатываем изменение комментариев
    EventBus.subscribe('cart:comments_changed', function() {
        // Переинициализируем после изменения комментариев
        setTimeout(() => {
            managePremiumMealOptions();
            initializeToggleSwitches();
            updateDeliveryNoteSummary();
        }, 100);
    });
    
    // Обрабатываем полную перезагрузку корзины
    EventBus.subscribe('cart:reloaded', function() {
        // Переинициализируем после перезагрузки
        setTimeout(() => {
            managePremiumMealOptions();
            initializeToggleSwitches();
            updateDeliveryNoteSummary();
        }, 100);
    });
    
    // Обрабатываем удаление товаров для питомцев по pets-id
    $(document).on('click', '.js-pets-delete', function(e) {
        e.preventDefault();
        
        const deleteBtn = this;
        const petsId = deleteBtn.getAttribute('data-pets-id');
        
        console.log('Удаление товаров для питомца с pets-id:', petsId);
        
        // Находим все товары для питомцев с этим pets-id
        const petsItems = document.querySelectorAll('.cart-item_pets');
        const itemIds = [];
        
        petsItems.forEach(item => {
            const itemId = item.getAttribute('data-item-id');
            const comment = item.getAttribute('data-comment');
            
            // Проверяем, содержит ли комментарий нужный pets-id
            if (itemId && comment) {
                if (petsId) {
                    // Если указан конкретный pets-id, проверяем его в комментарии
                    if (comment.includes(`pets-id: ${petsId}`) || comment.includes(`pets-id:${petsId}`)) {
                        itemIds.push(parseInt(itemId));
                        console.log(`Найден товар с pets-id ${petsId}:`, itemId);
                    }
                } else {
                    // Если pets-id не указан (для обратной совместимости), удаляем все товары для питомцев
                    itemIds.push(parseInt(itemId));
                }
            }
        });
        
        if (itemIds.length === 0) {
            console.log('Нет товаров для удаления с pets-id:', petsId);
            return;
        }
        
        console.log('Удаляем товары с ID:', itemIds);
        
        // Показываем индикатор загрузки
        const originalContent = deleteBtn.innerHTML;
        deleteBtn.innerHTML = '<div class="loading-spinner"></div>';
        deleteBtn.disabled = true;
        
        // Удаляем товары через Insales Cart.delete API
        Cart.delete({
            items: itemIds
        }, function(response) {
            if (response.success) {
                console.log('Товары для питомца успешно удалены');
                // Перезагружаем страницу для обновления корзины
                window.location.reload();
            } else {
                console.error('Ошибка при удалении товаров для питомцев:', response.error);
                // Восстанавливаем кнопку
                deleteBtn.innerHTML = originalContent;
                deleteBtn.disabled = false;
                alert('Произошла ошибка при удалении товаров. Попробуйте еще раз.');
            }
        });
    });
    
    // Обрабатываем удаление товаров для питомцев через мобильную ссылку по pets-id
    $(document).on('click', '.js-pets-delete-mobile', function(e) {
        e.preventDefault();
        
        const deleteLink = this;
        const petsId = deleteLink.getAttribute('data-pets-id');
        
        console.log('Удаление товаров для питомца с pets-id (мобильная версия):', petsId);
        
        // Находим все товары для питомцев с этим pets-id
        const petsItems = document.querySelectorAll('.cart-item_pets');
        const itemIds = [];
        
        petsItems.forEach(item => {
            const itemId = item.getAttribute('data-item-id');
            const comment = item.getAttribute('data-comment');
            
            // Проверяем, содержит ли комментарий нужный pets-id
            if (itemId && comment) {
                if (petsId) {
                    // Если указан конкретный pets-id, проверяем его в комментарии
                    if (comment.includes(`pets-id: ${petsId}`) || comment.includes(`pets-id:${petsId}`)) {
                        itemIds.push(parseInt(itemId));
                        console.log(`Найден товар с pets-id ${petsId}:`, itemId);
                    }
                } else {
                    // Если pets-id не указан (для обратной совместимости), удаляем все товары для питомцев
                    itemIds.push(parseInt(itemId));
                }
            }
        });
        
        if (itemIds.length === 0) {
            console.log('Нет товаров для удаления с pets-id:', petsId);
            return;
        }
        
        console.log('Удаляем товары с ID (мобильная версия):', itemIds);
        
        // Показываем индикатор загрузки
        const originalContent = deleteLink.innerHTML;
        deleteLink.innerHTML = 'Удаление...';
        deleteLink.style.pointerEvents = 'none';
        
        // Удаляем товары через Insales Cart.delete API
        Cart.delete({
            items: itemIds
        }, function(response) {
            if (response.success) {
                console.log('Товары для питомца успешно удалены (мобильная версия)');
                // Перезагружаем страницу для обновления корзины
                window.location.reload();
            } else {
                console.error('Ошибка при удалении товаров для питомцев (мобильная версия):', response.error);
                // Восстанавливаем ссылку
                deleteLink.innerHTML = originalContent;
                deleteLink.style.pointerEvents = 'auto';
                alert('Произошла ошибка при удалении товаров. Попробуйте еще раз.');
            }
        });
    });
});


// Промокоды
const $removeCouponBtn = $widget.find('[data-remove-coupon]');

$removeCouponBtn.on('click', function(e) {
    e.preventDefault();

    Cart.setCoupon({coupon: ' '});
    $(this).parents('.coupon-input').find('input').val('');
    $(this).removeClass('show-btn');
})

EventBus.subscribe('update_items:insales:cart', function(data) {
    if (data.coupon) {
      $removeCouponBtn.addClass('show-btn')
    }
});


