

EventBus.subscribe('delete_items:insales:cart', function(data) {
    window.location.reload();
});

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
        }, 100);
    });
    
    // Обрабатываем добавление товара в корзину
    EventBus.subscribe('cart:item_added', function() {
        // Переинициализируем toggle-switch после добавления товара
        setTimeout(() => {
            managePremiumMealOptions();
            initializeToggleSwitches();
        }, 100);
    });
    
    // Обрабатываем удаление товара из корзины
    EventBus.subscribe('cart:item_removed', function() {
        // Переинициализируем после удаления товара
        setTimeout(() => {
            managePremiumMealOptions();
            initializeToggleSwitches();
        }, 100);
    });
    
    // Обрабатываем изменение количества товара
    EventBus.subscribe('cart:quantity_changed', function() {
        // Переинициализируем после изменения количества
        setTimeout(() => {
            managePremiumMealOptions();
            initializeToggleSwitches();
        }, 100);
    });
    
    // Обрабатываем изменение комментариев
    EventBus.subscribe('cart:comments_changed', function() {
        // Переинициализируем после изменения комментариев
        setTimeout(() => {
            managePremiumMealOptions();
            initializeToggleSwitches();
        }, 100);
    });
    
    // Обрабатываем полную перезагрузку корзины
    EventBus.subscribe('cart:reloaded', function() {
        // Переинициализируем после перезагрузки
        setTimeout(() => {
            managePremiumMealOptions();
            initializeToggleSwitches();
        }, 100);
    });
});



