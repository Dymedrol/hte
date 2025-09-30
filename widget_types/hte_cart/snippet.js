EventBus.subscribe('delete_items:insales:cart', function(data) {
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
        console.log('Нет программ в корзине, используем логику по времени');
        // Нет программ - используем логику по времени
        updateDeliveryNoteByTime(deliveryNoteElement);
    }
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

$(document).ready(function() {
    // Инициализируем управление meal-option-item для premium продуктов
    managePremiumMealOptions();
    
    // Инициализируем состояние toggle-switch
    initializeToggleSwitches();
    
    // Обновляем информацию о ближайшей доставке
    updateDeliveryNoteSummary();
    
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
    
    // Обрабатываем удаление всех товаров для питомцев
    $(document).on('click', '.js-pets-delete', function(e) {
        e.preventDefault();
        
        // Находим все товары для питомцев в корзине
        const petsItems = document.querySelectorAll('.cart-item_pets');
        const itemIds = [];
        
        petsItems.forEach(item => {
            const itemId = item.getAttribute('data-item-id');
            if (itemId) {
                itemIds.push(parseInt(itemId)); // Преобразуем в число
            }
        });
        
        if (itemIds.length === 0) {
            console.log('Нет товаров для питомцев для удаления');
            return;
        }
        
        console.log('Удаляем товары для питомцев:', itemIds);
        
        // Показываем индикатор загрузки
        const deleteBtn = this;
        const originalContent = deleteBtn.innerHTML;
        deleteBtn.innerHTML = '<div class="loading-spinner"></div>';
        deleteBtn.disabled = true;
        
        // Удаляем товары через Insales Cart.delete API
        Cart.delete({
            items: itemIds
        }, function(response) {
            if (response.success) {
                console.log('Все товары для питомцев успешно удалены');
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
});



