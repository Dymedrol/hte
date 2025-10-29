/**
 * Address Popup Manager
 * Управление попапом выбора адреса доставки в корзине с Яндекс картами
 */


class AddressPopupManager {
    constructor() {
        this.popup = null;
        this.chooseAddressBtn = null;
        this.closeBtn = null;
        this.overlay = null;
        
        // Элементы карты
        this.map = null;
        this.mapContainer = null;
        this.addressInput = null;
        this.searchBtn = null;
        this.suggestionsContainer = null;
        this.selectedAddressEl = null;
        this.confirmBtn = null;
        this.locationBtn = null;
        
        // Элементы второго шага
        this.step1 = null;
        this.step2 = null;
        this.confirmedAddressEl = null;
        this.backToStep1Btn = null;
        this.houseTypeToggle = null;
        this.apartmentInput = null;
        this.floorInput = null;
        this.entranceInput = null;
        this.intercomInput = null;
        this.courierCommentInput = null;
        this.charCounter = null;
        this.finalConfirmBtn = null;
        this.checkoutBtn = null;
        
        // Состояние
        this.selectedCoordinates = null;
        this.selectedAddress = null;
        this.suggestions = [];
        this.geocoder = null;
        this.currentStep = 1;
        this.deliveryZones = null;
        this.savedDeliveryData = null;
        this.virtualCart = null; // Виртуальная корзина для отслеживания всех товаров
        this.cartItemCountObserver = null; // Наблюдатель за изменениями data-cart-item-count
        
        this.init();
    }
    
    init() {
        // Ждем загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupElements();
                this.cleanDeliveryAddressesOnLoad();
                this.initCartObserver();
                this.checkAndRemoveExpiredItems();
            });
        } else {
            this.setupElements();
            this.cleanDeliveryAddressesOnLoad();
            this.initCartObserver();
            this.checkAndRemoveExpiredItems();
        }
    }
    
    // Очистка адресов доставки при загрузке страницы
    cleanDeliveryAddressesOnLoad() {
      
        // Сначала удаляем товары доставки из корзины
        this.removeDeliveryProductsFromCart();
        
        // Находим все поля комментариев в корзине
        const commentInputs = document.querySelectorAll('input[data-comment]');
        
        if (commentInputs.length === 0) {
            // Попробуем альтернативный селектор
            const altInputs = document.querySelectorAll('input[name*="order_line_comments"]');
            
            if (altInputs.length > 0) {
                altInputs.forEach((input, index) => {
                    this.cleanSingleCommentField(input, index);
                });
            }
            return;
        }
        
        commentInputs.forEach((input, index) => {
            this.cleanSingleCommentField(input, index);
        });
        
    }
    
    // Проверка и удаление товаров с просроченными датами доставки
    async checkAndRemoveExpiredItems() {
        console.log('🔍 Проверка товаров на просроченные даты доставки...');
        
        try {
            // Обновляем виртуальную корзину
            await this.refreshCart();
            
            if (!this.virtualCart || !this.virtualCart.items) {
                console.log('❌ Виртуальная корзина недоступна');
                return;
            }
            
            const expiredItems = [];
            const currentDate = this.getCurrentMoscowDate();
            console.log('📅 Текущая дата (Москва):', currentDate);
            
            // Проверяем каждый товар
            this.virtualCart.items.forEach((item, index) => {
                // Получаем комментарий
                let comment = item.comment;
                if (!comment) {
                    comment = this.getCommentFromDOM(item);
                }
                
                if (!comment) {
                    console.log(`⏭️ Товар ${index + 1} "${item.title}": нет комментария`);
                    return;
                }
                
                // Парсим даты из комментария
                const dates = this.parseDatesFromComment(comment);
                
                if (dates.length === 0) {
                    console.log(`⏭️ Товар ${index + 1} "${item.title}": нет дат доставки`);
                    return;
                }
                
                // Проверяем, все ли даты просрочены
                const allDatesExpired = dates.every(date => this.isDateExpired(date, currentDate));
                
                if (allDatesExpired) {
                    console.log(`❌ Товар ${index + 1} "${item.title}": все даты просрочены (${dates.join(', ')})`);
                    expiredItems.push({
                        item: item,
                        dates: dates,
                        variantId: item.variant_id
                    });
                } else {
                    console.log(`✅ Товар ${index + 1} "${item.title}": есть актуальные даты (${dates.join(', ')})`);
                }
            });
            
            // Если есть товары с просроченными датами - удаляем их
            if (expiredItems.length > 0) {
                console.log(`🗑️ Найдено товаров с просроченными датами: ${expiredItems.length}`);
                
                // Удаляем каждый просроченный товар
                for (const expiredItem of expiredItems) {
                    console.log(`🗑️ Удаляем товар "${expiredItem.item.title}" (variant_id: ${expiredItem.variantId})`);
                    
                    const success = await this.removeCartItemByVariantId(expiredItem.variantId);
                    
                    if (success) {
                        console.log(`✅ Товар "${expiredItem.item.title}" успешно удален`);
                    } else {
                        console.error(`❌ Не удалось удалить товар "${expiredItem.item.title}"`);
                    }
                }
                
                // Перезагружаем страницу после удаления всех просроченных товаров
                console.log('🔄 Перезагрузка страницы после удаления просроченных товаров...');
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                console.log('✅ Просроченных товаров не найдено');
            }
            
        } catch (error) {
            console.error('❌ Ошибка при проверке просроченных товаров:', error);
        }
    }
    
    // Получение текущей даты по московскому времени
    getCurrentMoscowDate() {
        const moscowOffset = 3; // Москва UTC+3
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const moscowTime = new Date(utc + (moscowOffset * 3600000));
        
        // Возвращаем дату в формате YYYY-MM-DD
        const year = moscowTime.getFullYear();
        const month = String(moscowTime.getMonth() + 1).padStart(2, '0');
        const day = String(moscowTime.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }
    
    // Проверка, является ли дата просроченной
    isDateExpired(dateString, currentDate) {
        if (!dateString || !currentDate) {
            return false;
        }
        
        // Сравниваем строки напрямую (обе в формате YYYY-MM-DD)
        const isExpired = dateString < currentDate;
        
        console.log(`📅 Проверка даты: ${dateString} < ${currentDate} = ${isExpired}`);
        
        return isExpired;
    }
    
    // Инициализация наблюдателя за изменениями data-cart-total-price
    initCartObserver() {
        
        const cartTotalPriceElement = document.querySelector('[data-cart-total-price]');
        if (!cartTotalPriceElement) {
            return;
        }
        
        // Создаем наблюдатель за изменениями
        this.cartItemCountObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    this.handleCartTotalPriceChange();
                }
            });
        });
        
        // Начинаем наблюдение
        this.cartItemCountObserver.observe(cartTotalPriceElement, {
            childList: true,
            characterData: true,
            subtree: true
        });
        
    }
    
    // Обработка изменений в data-cart-total-price
    handleCartTotalPriceChange() {
        
        const cartTotalPriceElement = document.querySelector('[data-cart-total-price]');
        if (!cartTotalPriceElement) {
            return;
        }
        
        const cartTotalText = cartTotalPriceElement.textContent;
        
        // Пробуем разные способы извлечения числового значения
        let cartTotal = null;
        
        // Способ 1: Ищем число с валютным символом, включая десятичные (например: "55243.5 ₽")
        const match1 = cartTotalText.match(/(\d+(?:[.,]\d+)?(?:\s\d+)*)\s*[₽$€]/);
        if (match1) {
            const cleaned1 = match1[1].replace(/\s/g, '').replace(',', '.');
            cartTotal = parseFloat(cleaned1);
        }
        
        // Способ 2: Ищем числа с десятичной частью (например: "55243.5" или "55243,5")
        const match2 = cartTotalText.match(/\d+[.,]?\d*/);
        if (match2 && !cartTotal) {
            const cleaned2 = match2[0].replace(',', '.');
            cartTotal = parseFloat(cleaned2);
        }
        
        // Способ 3: Ищем числа с пробелами и десятичными (например: "55 243.5")
        const match3 = cartTotalText.match(/(\d+(?:\s\d+)*(?:[.,]\d+)?)/);
        if (match3 && !cartTotal) {
            const cleaned3 = match3[1].replace(/\s/g, '').replace(',', '.');
            cartTotal = parseFloat(cleaned3);
        }
        
        // Способ 4: Ищем числа с разделителями (пробелы, запятые, точки)
        const match4 = cartTotalText.match(/[\d\s,.]+/);
        if (match4 && !cartTotal) {
            const cleaned4 = match4[0].replace(/\s/g, '').replace(',', '.');
            cartTotal = parseFloat(cleaned4);
        }

        if (isNaN(cartTotal) || cartTotal === null) {
            return;
        }
        
        // Вычисляем стоимость доставки
        const deliveryPrice = this.calculateCurrentDeliveryPrice();
        
        // Вычисляем стоимость товаров (без доставки)
        const productsPrice = cartTotal - deliveryPrice;
        
        // Обновляем #cart-total-price
        this.updateCartTotalPrice(productsPrice);
    }
    
    // Вычисление текущей стоимости доставки
    calculateCurrentDeliveryPrice() {
        if (!this.virtualCart || !this.virtualCart.items) {
            return 0;
        }
        
        // Получаем список variant_id товаров доставки
        const deliveryVariantIds = [];
        if (window.dostavkaProducts && window.dostavkaProducts.products) {
            window.dostavkaProducts.products.forEach(product => {
                if (product.variants && product.variants.length > 0) {
                    product.variants.forEach(variant => {
                        deliveryVariantIds.push(variant.id);
                    });
                }
            });
        }
        
        // Суммируем стоимость товаров доставки
        let deliveryPrice = 0;
        this.virtualCart.items.forEach(item => {
            const variantId = item.variant_id;
            if (deliveryVariantIds.includes(variantId)) {
                // Пробуем разные поля для получения цены
                const price = item.price || item.total_price || item.line_price || item.amount || 0;
                
                if (price === 0 || price === undefined || price === null) {
                    console.warn(`⚠️ Товар доставки "${item.title}" имеет неопределенную цену:`, item);
                    return;
                }
                
                // Для товаров доставки price уже содержит общую стоимость за все дни
                // Не нужно умножать на quantity
                const itemTotal = price;
                deliveryPrice += itemTotal;
            }
        });
        
        return deliveryPrice;
    }
    
    // Обновление #cart-total-price
    updateCartTotalPrice(productsPrice) {
        const cartTotalPriceElement = document.getElementById('cart-total-price');
        if (!cartTotalPriceElement) {
            console.warn('⚠️ Элемент #cart-total-price не найден');
            return;
        }
        
        // Округляем до целого числа
        const roundedPrice = Math.round(productsPrice);
        const formattedPrice = `${roundedPrice} ₽`;
        cartTotalPriceElement.textContent = formattedPrice;
    }
    
    // Автоматическое обновление итоговой суммы корзины
    updateCartTotalPriceAuto() {
        if (!this.virtualCart || !this.virtualCart.total_price) {
            console.warn('⚠️ Нет данных о стоимости корзины');
            return;
        }
        
        const deliveryPrice = this.calculateCurrentDeliveryPrice();
        const productsPrice = this.virtualCart.total_price - deliveryPrice;
        const totalPrice = this.virtualCart.total_price;
        const roundedTotalPrice = Math.round(totalPrice);
        const formattedTotalPrice = `${roundedTotalPrice} ₽`;
        
        // Обновляем стоимость товаров (без доставки)
        this.updateCartTotalPrice(productsPrice);
        
        // Обновляем итоговую сумму (с доставкой) в [data-cart-full-total-price]
        const totalPriceElement = document.querySelector('[data-cart-full-total-price]');
        if (totalPriceElement) {
            totalPriceElement.textContent = formattedTotalPrice;
            console.log('💰 Обновлена итоговая сумма [data-cart-full-total-price]:', formattedTotalPrice);
        }
        
        // Также обновляем .total-price
        const totalPriceClassElement = document.querySelector('.total-price');
        if (totalPriceClassElement) {
            totalPriceClassElement.textContent = formattedTotalPrice;
            console.log('💰 Обновлена итоговая сумма .total-price:', formattedTotalPrice);
        }
        
        console.log('💰 Автоматически обновлена итоговая сумма:', Math.round(productsPrice), '₽ (товары),', roundedTotalPrice, '₽ (общая)');
    }
    
    // Удаление товаров доставки из корзины при загрузке страницы
    async removeDeliveryProductsFromCart() {
        
        // Ждем загрузки данных о продуктах доставки
        try {
            await this.waitForDostavkaProducts();
        } catch (error) {
            return;
        }
        
        if (!window.dostavkaProducts || !window.dostavkaProducts.products) {
            return;
        }
        
        // Обновляем виртуальную корзину
        await this.refreshCart();
        if (!this.virtualCart || !this.virtualCart.items) {
            return;
        }
        
        // Получаем список variant_id товаров доставки
        const deliveryVariantIds = [];
        window.dostavkaProducts.products.forEach(product => {
            if (product.variants && product.variants.length > 0) {
                product.variants.forEach(variant => {
                    deliveryVariantIds.push(variant.id);
                });
            }
        });
        
        // Находим товары доставки в виртуальной корзине
        const deliveryVariantsToRemove = [];
        
        
        this.virtualCart.items.forEach((item, index) => {
            const variantId = item.variant_id;
            const productId = item.product_id;
            const productTitle = item.title || item.product_title || 'Неизвестно';
            
            
            if (variantId) {
                const variantIdInt = parseInt(variantId);
                if (deliveryVariantIds.includes(variantIdInt)) {
                    deliveryVariantsToRemove.push(variantIdInt);
                }
            }
        });
        
        if (deliveryVariantsToRemove.length === 0) {
            return;
        }
        
        console.log(`🗑️ Найдено товаров доставки для удаления: ${deliveryVariantsToRemove.length}`);
        
        // Удаляем каждый товар доставки по variant_id
        for (const variantId of deliveryVariantsToRemove) {
            const success = await this.removeCartItemByVariantId(variantId);
            if (success) {
                console.log(`✅ Товар доставки удален (variant_id: ${variantId})`);
            } else {
                console.error('❌ Не удалось удалить товар по variant_id:', variantId);
            }
        }
        
        // Перезагружаем страницу после удаления товаров доставки
        console.log('🔄 Перезагрузка страницы после удаления товаров доставки...');
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }
    
    // Удаление существующих товаров доставки из корзины (при смене зоны)
    async removeExistingDeliveryProducts() {
        
        if (!window.dostavkaProducts || !window.dostavkaProducts.products) {
            return;
        }
        
        if (!this.virtualCart || !this.virtualCart.items) {
            await this.refreshCart();
            if (!this.virtualCart || !this.virtualCart.items) {
                return;
            }
        }
        
        // Получаем список variant_id товаров доставки
        const deliveryVariantIds = [];
        window.dostavkaProducts.products.forEach(product => {
            if (product.variants && product.variants.length > 0) {
                product.variants.forEach(variant => {
                    deliveryVariantIds.push(variant.id);
                });
            }
        });
        
        // Находим товары доставки в виртуальной корзине
        const deliveryVariantsToRemove = [];
        
        
        this.virtualCart.items.forEach((item, index) => {
            const variantId = item.variant_id;
            const productId = item.product_id;
            const productTitle = item.title || item.product_title || 'Неизвестно';
            
            
            if (variantId) {
                const variantIdInt = parseInt(variantId);   
                
                if (deliveryVariantIds.includes(variantIdInt)) {
                    deliveryVariantsToRemove.push(variantIdInt);
                } else {
                }
            } else {
            }
        });
        
        if (deliveryVariantsToRemove.length === 0) {
            return;
        }
        
        
        // Удаляем каждый товар доставки по variant_id
        for (const variantId of deliveryVariantsToRemove) {
            const success = await this.removeCartItemByVariantId(variantId);
            if (success) {
            } else {
                console.error('❌ Не удалось удалить товар по variant_id:', variantId);
            }
        }
        
    }
    
    // Удаление товара из корзины по variant_id
    async removeCartItemByVariantId(variantId) {
        
        // Предпочтительно используем внутренний AJAX API InSales, если доступен
        if (window.ajaxAPI && ajaxAPI.cart && typeof ajaxAPI.cart.remove === 'function') {
            try {
                
                return await new Promise((resolve) => {
                    ajaxAPI.cart.remove(variantId)
                        .done((onDone) => {
                            resolve(true);
                        })
                        .fail((onFail) => {
                            console.error('❌ ajaxAPI.cart.remove onFail для variant_id', variantId, ':', onFail);
                            resolve(false);
                        });
                });
            } catch (err) {
                console.error('❌ Ошибка ajaxAPI.cart.remove для variant_id', variantId, ':', err);
                return false;
            }
        } else {
            console.warn('⚠️ ajaxAPI.cart.remove недоступен для variant_id:', variantId);
            return false;
        }
    }
    
    // Удаление одного товара из корзины по item_id (старый метод, оставляем для совместимости)
    async removeCartItem(itemId) {
        
        // Предпочтительно используем внутренний AJAX API InSales, если доступен
        if (window.ajaxAPI && ajaxAPI.cart && typeof ajaxAPI.cart.remove === 'function') {
            try {
                
                return await new Promise((resolve) => {
                    ajaxAPI.cart.remove(itemId)
                        .done((onDone) => {
                            resolve(true);
                        })
                        .fail((onFail) => {
                            console.error('❌ ajaxAPI.cart.remove onFail для item_id', itemId, ':', onFail);
                            resolve(false);
                        });
                });
            } catch (err) {
                console.error('❌ Ошибка ajaxAPI.cart.remove для item_id', itemId, ':', err);
                return false;
            }
        } else {
            console.warn('⚠️ ajaxAPI.cart.remove недоступен для item_id:', itemId);
            return false;
        }
    }
    
    // Очистка одного поля комментария от адреса доставки
    cleanSingleCommentField(input, index) {
        const currentValue = input.value || '';
        
        if (!currentValue.trim()) {
            console.log(`⏭️ Поле ${index + 1} пустое, пропускаем`);
            return;
        }
        
        // Удаляем адрес доставки из комментария
        const cleanedValue = this.removeDeliveryAddressFromComment(currentValue);
        
        // Обновляем значение только если оно изменилось
        if (cleanedValue !== currentValue) {
            input.value = cleanedValue;
            
            // Принудительно вызываем событие change для уведомления других скриптов
            const changeEvent = new Event('change', { bubbles: true });
            input.dispatchEvent(changeEvent);
            
            // Также вызываем событие input
            const inputEvent = new Event('input', { bubbles: true });
            input.dispatchEvent(inputEvent);
            
        } else {
        }
    }
    
    setupElements() {
        // Получаем основные элементы
        this.chooseAddressBtn = document.getElementById('choose-delivery-address');
        this.popup = document.getElementById('addressPopup');
        this.closeBtn = document.getElementById('addressPopupClose');
        this.overlay = this.popup?.querySelector('.popup-overlay');
        
        // Получаем элементы карты
        this.mapContainer = document.getElementById('yandexMap');
        this.addressInput = document.getElementById('addressInput');
        this.searchBtn = document.getElementById('searchAddressBtn');
        this.suggestionsContainer = document.getElementById('addressSuggestions');
        this.selectedAddressEl = document.getElementById('selectedAddress');
        this.confirmBtn = document.getElementById('confirmAddressBtn');
        this.locationBtn = document.getElementById('useCurrentLocation');
        
        // Получаем элементы второго шага
        this.step1 = document.getElementById('step1');
        this.step2 = document.getElementById('step2');
        this.confirmedAddressEl = document.getElementById('confirmedAddress');
        this.backToStep1Btn = document.getElementById('backToStep1Btn');
        this.houseTypeToggle = document.getElementById('houseTypeToggle');
        this.apartmentInput = document.getElementById('apartmentInput');
        this.floorInput = document.getElementById('floorInput');
        this.entranceInput = document.getElementById('entranceInput');
        this.intercomInput = document.getElementById('intercomInput');
        this.courierCommentInput = document.getElementById('courierCommentInput');
        this.charCounter = document.getElementById('charCounter');
        this.finalConfirmBtn = document.getElementById('finalConfirmBtn');
        this.checkoutBtn = document.getElementById('checkoutBtn');
        
        if (!this.popup) {
            console.warn('❌ Попап адреса доставки не найден');
            return;
        }
        
        this.setupEventListeners();
        this.initYandexMaps();
    }
    
    setupEventListeners() {
        // Открытие попапа
        if (this.chooseAddressBtn) {
            this.chooseAddressBtn.addEventListener('click', (e) => this.openPopup(e));
        }
        
        // Закрытие попапа по кнопке закрытия
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closePopup());
        }
        
        // Закрытие попапа по клику на overlay
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.closePopup());
        }
        
        // Закрытие попапа по клавише Escape
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // События для работы с адресом
        if (this.addressInput) {
            this.addressInput.addEventListener('input', (e) => this.handleAddressInput(e));
            this.addressInput.addEventListener('keydown', (e) => this.handleAddressKeydown(e));
        }
        
        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', () => this.searchAddress());
        }
        
        if (this.confirmBtn) {
            this.confirmBtn.addEventListener('click', () => this.confirmAddress());
        }
        
        if (this.locationBtn) {
            this.locationBtn.addEventListener('click', () => this.useCurrentLocation());
        }
        
        // События для второго шага
        if (this.backToStep1Btn) {
            this.backToStep1Btn.addEventListener('click', () => this.goToStep1());
        }
        
        if (this.houseTypeToggle) {
            this.houseTypeToggle.addEventListener('change', () => this.handleHouseTypeChange());
        }
        
        if (this.courierCommentInput) {
            this.courierCommentInput.addEventListener('input', () => this.updateCharCounter());
        }
        
        // Добавляем обработчики событий для полей формы для отслеживания изменений валидации
        // Добавляем обработчики для поля типа дома для обновления обязательности
        if (this.houseTypeToggle) {
            const initialToggle = () => {
                // При инициализации убираем обязательность полей
                this.setRequiredFields(['apartment', 'floor', 'entrance'], false);
            };
            
            // Проверяем текущее состояние переключателя и устанавливаем правильную обязательность
            initialToggle();
        }
        
        const requiredFields = ['apartmentInput', 'floorInput', 'entranceInput'];
        requiredFields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (field) {
                field.addEventListener('input', () => {
                    // Очищаем ошибки валидации при изменении текста в поле
                    this.clearValidationErrors();
                });
                
                field.addEventListener('blur', () => {
                    // Проверяем валидацию при уходе фокуса с поля
                    const validationResult = this.validateForm();
                    if (!validationResult.isValid) {
                        const fieldError = validationResult.errors.find(error => 
                            error.field === fieldName.replace('Input', '')
                        );
                        if (fieldError) {
                            field.classList.add('error-field');
                        } else {
                            field.classList.remove('error-field');
                        }
                    } else {
                        field.classList.remove('error-field');
                    }
                });
            }
        });
        
        if (this.finalConfirmBtn) {
            this.finalConfirmBtn.addEventListener('click', () => this.finalConfirm());
        }
    }
    
    openPopup(e) {
        e.preventDefault();
        e.stopPropagation();
        
        this.popup.classList.add('active');
        document.body.style.overflow = 'hidden'; // Блокируем скролл страницы
        
        // Инициализируем карту при открытии попапа
        if (this.mapContainer && !this.map) {
            this.initYandexMaps();
        }
        
        // Восстанавливаем сохраненные данные
        this.restoreData();
    }
    
    closePopup() {
        
        this.popup.classList.remove('active');
        document.body.style.overflow = ''; // Восстанавливаем скролл страницы
    }
    
    handleKeydown(e) {
        if (e.key === 'Escape' && this.popup?.classList.contains('active')) {
            this.closePopup();
        }
    }
    
    // Инициализация Яндекс карт
    initYandexMaps() {
        if (typeof ymaps === 'undefined') {
            console.warn('❌ Яндекс карты не загружены');
            return;
        }
        
        if (!this.mapContainer) {
            console.warn('❌ Контейнер карты не найден');
            return;
        }
        
        // Центр по умолчанию - Москва
        const defaultCenter = [55.7558, 37.6176];
        
        ymaps.ready(() => {
            this.map = new ymaps.Map(this.mapContainer, {
                center: defaultCenter,
                zoom: 10,
                controls: ['zoomControl', 'fullscreenControl']
            });
            
            // Отключаем ненужные кнопки
            this.map.controls.remove('routeButtonControl'); // "Как добраться"
            this.map.controls.remove('trafficControl'); // "Доехать на такси"
            this.map.controls.remove('typeSelector'); // "Открыть в Яндекс картах"
            this.map.controls.remove('rulerControl'); // "Создать свою карту"
            
            // Инициализируем геокодер
            this.geocoder = ymaps.geocode;
            
            // Добавляем обработчик клика по карте
            this.map.events.add('click', (e) => this.onMapClick(e));
            
            // Загружаем зоны доставки
            this.loadDeliveryZones();
            
        });
    }
    
    // Загрузка зон доставки
    loadDeliveryZones() {
        if (!this.map) return;
        
        // GeoJSON данные зон доставки
        const zonesData = [
            {
                "type": "FeatureCollection",
                "metadata": {"name": "map_zones"},
                "features": [{
                    "type": "Feature",
                    "id": 4212529,
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[37.53248257695315,55.75011699897059],[37.537267637835726,55.75141191568539],[37.532268000231994,55.75292461422045],[37.53190321980597,55.75155713731801],[37.53215104653224,55.75085988111901],[37.53248257695315,55.75011699897059]]]
                    },
                    "properties": {
                        "description": "Сити 1",
                        "fill": "#1e98ff",
                        "fill-opacity": 0.6,
                        "stroke": "#1e98ff",
                        "stroke-width": "5",
                        "stroke-opacity": 0.9
                    }
                }]
            },
            {
                "type": "FeatureCollection",
                "metadata": {"name": "map_zones"},
                "features": [{
                    "type": "Feature",
                    "id": 4212537,
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[37.53453178464038,55.74669191761924],[37.53640933095079,55.745911247302686],[37.54070086537463,55.746661659378084],[37.54505677281481,55.74828346821939],[37.54089398442371,55.7522287801537],[37.533319426165654,55.75021986770592],[37.53329796849352,55.74773883847245],[37.53453178464038,55.74669191761924]]]
                    },
                    "properties": {
                        "description": "Сити 2",
                        "fill": "#177bc9",
                        "fill-opacity": 0.6,
                        "stroke": "#177bc9",
                        "stroke-width": "5",
                        "stroke-opacity": 0.9
                    }
                }]
            },
            {
                "type": "FeatureCollection",
                "metadata": {"name": "map_zones"},
                "features": [{
                    "type": "Feature",
                    "id": 4212649,
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[37.5064609091796,55.60111992929819],[37.57134890966789,55.57953804441696],[37.63898349218743,55.568839901073595],[37.69288516455071,55.57564814913548],[37.78785477775908,55.61899858530381],[37.83742404394525,55.653178427384134],[37.843603853515575,55.755925588079585],[37.833990816406214,55.82478842681217],[37.726874117187464,55.88581148943177],[37.57306552343746,55.90973096317616],[37.408957247070234,55.87152990755072],[37.36535525732415,55.768895069488],[37.38612628393546,55.713599484790905],[37.43436313085933,55.65977790041621],[37.5064609091796,55.60111992929819]]]
                    },
                    "properties": {
                        "description": "Курьером в пределах МКАД",
                        "fill": "#1bad03",
                        "fill-opacity": 0.1,
                        "stroke": "#97a100",
                        "stroke-width": "5",
                        "stroke-opacity": 0.9
                    }
                }]
            },
            {
                "type": "FeatureCollection",
                "metadata": {"name": "map_zones"},
                "features": [{
                    "type": "Feature",
                    "id": 4212641,
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[36.949448507995726,55.93440650068838],[36.86842433807372,55.74972967959321],[36.9185494601438,55.69120710611395],[37.023606222839426,55.64502459403604],[37.009186667175236,55.61200356381504],[36.984467428894106,55.54237374047321],[36.99820033905028,55.53147070602599],[37.125229757995385,55.45662522438377],[37.229599875183226,55.42227329237873],[37.35044948455803,55.40977423456701],[37.48228542205822,55.35347930649619],[37.64708034393298,55.334696444094504],[37.828354757995484,55.34721934633287],[38.05906764862059,55.37225322418111],[38.20600978729243,55.45194263814179],[38.302140158386074,55.53692260275264],[38.361191672058055,55.624826811592875],[38.4271096408079,55.70245337414583],[38.438095968932906,55.7799253966545],[38.44358913299535,55.88812692394725],[38.37217800018306,55.97755074295318],[38.24034206268305,56.032950983558],[38.075547140807814,56.08212870226475],[37.89976589080825,56.143512325739046],[37.72947780487095,56.157310093884256],[37.49876491424564,56.1557772542049],[37.49637935203488,56.138712006136984],[37.38031856414771,56.13469448027331],[37.298951071472125,56.122231018448225],[37.23200313446037,56.098827107472815],[37.17535488006587,56.078672952076445],[37.134382488252704,56.06849588008205],[37.03184596893314,56.02679933995201],[36.949448507995726,55.93440650068838]]]
                    },
                    "properties": {
                        "description": "МКАД + 35 км",
                        "fill": "#ff931e",
                        "fill-opacity": 0.2,
                        "stroke": "#ff931e",
                        "stroke-width": "5",
                        "stroke-opacity": 0.9
                    }
                }]
            }
        ];
        
        // Добавляем зоны на карту
        zonesData.forEach(zoneData => {
            ymaps.geoQuery(zoneData).addToMap(this.map);
        });
        
    }
    
    // Обработчик клика по карте
    onMapClick(e) {
        const coords = e.get('coords');
        this.selectedCoordinates = coords;
        
        // Получаем адрес по координатам
        this.geocoder(coords).then((res) => {
            const firstGeoObject = res.geoObjects.get(0);
            if (firstGeoObject) {
                const address = firstGeoObject.getAddressLine();
                this.selectedAddress = address;
                
                // Определяем зону доставки
                const deliveryZone = this.getDeliveryZone(coords);
                
                // Обрабатываем выбор доставки
                this.handleDeliverySelection(deliveryZone);
                
                // Обновляем UI
                this.updateSelectedAddress(address, deliveryZone);
                this.updateConfirmButton(deliveryZone !== 'Зона доставки не определена');
                
                // Добавляем маркер на карту
                this.addMarker(coords, address);
                
                // Обновляем адрес в комментарии если он уже был сохранен
                if (this.savedDeliveryData) {
                    this.updateDeliveryAddressInComment(address, coords);
                }
                
            }
        });
    }
    
    // Определение зоны доставки по координатам
    getDeliveryZone(coords) {
        
        // Проверяем, попадает ли точка в зоны доставки
        const zones = [
            { name: 'Сити 1', coords: [[37.53248257695315,55.75011699897059],[37.537267637835726,55.75141191568539],[37.532268000231994,55.75292461422045],[37.53190321980597,55.75155713731801],[37.53215104653224,55.75085988111901],[37.53248257695315,55.75011699897059]] },
            { name: 'Сити 2', coords: [[37.53453178464038,55.74669191761924],[37.53640933095079,55.745911247302686],[37.54070086537463,55.746661659378084],[37.54505677281481,55.74828346821939],[37.54089398442371,55.7522287801537],[37.533319426165654,55.75021986770592],[37.53329796849352,55.74773883847245],[37.53453178464038,55.74669191761924]] },
            { name: 'Курьером в пределах МКАД', coords: [[37.5064609091796,55.60111992929819],[37.57134890966789,55.57953804441696],[37.63898349218743,55.568839901073595],[37.69288516455071,55.57564814913548],[37.78785477775908,55.61899858530381],[37.83742404394525,55.653178427384134],[37.843603853515575,55.755925588079585],[37.833990816406214,55.82478842681217],[37.726874117187464,55.88581148943177],[37.57306552343746,55.90973096317616],[37.408957247070234,55.87152990755072],[37.36535525732415,55.768895069488],[37.38612628393546,55.713599484790905],[37.43436313085933,55.65977790041621],[37.5064609091796,55.60111992929819]] },
            { name: 'МКАД + 35 км', coords: [[36.949448507995726,55.93440650068838],[36.86842433807372,55.74972967959321],[36.9185494601438,55.69120710611395],[37.023606222839426,55.64502459403604],[37.009186667175236,55.61200356381504],[36.984467428894106,55.54237374047321],[36.99820033905028,55.53147070602599],[37.125229757995385,55.45662522438377],[37.229599875183226,55.42227329237873],[37.35044948455803,55.40977423456701],[37.48228542205822,55.35347930649619],[37.64708034393298,55.334696444094504],[37.828354757995484,55.34721934633287],[38.05906764862059,55.37225322418111],[38.20600978729243,55.45194263814179],[38.302140158386074,55.53692260275264],[38.361191672058055,55.624826811592875],[38.4271096408079,55.70245337414583],[38.438095968932906,55.7799253966545],[38.44358913299535,55.88812692394725],[38.37217800018306,55.97755074295318],[38.24034206268305,56.032950983558],[38.075547140807814,56.08212870226475],[37.89976589080825,56.143512325739046],[37.72947780487095,56.157310093884256],[37.49876491424564,56.1557772542049],[37.49637935203488,56.138712006136984],[37.38031856414771,56.13469448027331],[37.298951071472125,56.122231018448225],[37.23200313446037,56.098827107472815],[37.17535488006587,56.078672952076445],[37.134382488252704,56.06849588008205],[37.03184596893314,56.02679933995201],[36.949448507995726,55.93440650068838]] }
        ];
        
        // Простая проверка попадания точки в полигон (алгоритм ray casting)
        for (const zone of zones) {
            const isInside = this.isPointInPolygon(coords, zone.coords);
            if (isInside) {
                return zone.name;
            }
        }
        
        return 'Зона доставки не определена';
    }
    
    // Поиск товара доставки по зоне
    findDeliveryProductByZone(deliveryZone) {   
        
        // Проверяем наличие данных о продуктах доставки
        if (!window.dostavkaProducts) {
            console.warn('❌ window.dostavkaProducts не найден');
            console.log('🔍 Проверяем глобальные переменные:', Object.keys(window).filter(key => key.includes('dostavka')));
            return null;
        }
        
        if (!window.dostavkaProducts.products) {
            console.warn('❌ window.dostavkaProducts не содержит products');
            console.log('📦 Содержимое window.dostavkaProducts:', window.dostavkaProducts);
            return null;
        }
        
        if (!Array.isArray(window.dostavkaProducts.products)) {
            console.warn('❌ window.dostavkaProducts.products не является массивом');
            console.log('📦 Тип products:', typeof window.dostavkaProducts.products);
            return null;
        }
        
        console.log('📦 Доступные продукты доставки:', window.dostavkaProducts.products.length);
        
        // Маппинг зон доставки на названия товаров
        const zoneToProductMapping = {
            'Сити 1': 'Сити 1',
            'Сити 2': 'Сити 2 до 7 утра', // По умолчанию до 7 утра
            'Курьером в пределах МКАД': 'Курьером в пределах МКАД',
            'МКАД + 35 км': 'Курьером за МКАД'
        };
        
        // Определяем название товара для зоны
        const productTitle = zoneToProductMapping[deliveryZone];
        
        if (!productTitle) {
            console.warn('❌ Не найден маппинг для зоны:', deliveryZone);
            return null;
        }
        
        console.log('🎯 Ищем товар с названием:', productTitle);
        
        // Ищем товар по названию
        const deliveryProduct = window.dostavkaProducts.products.find(product => 
            product.title === productTitle
        );
        
        if (deliveryProduct) {
            console.log('✅ Найден товар доставки:', deliveryProduct);
            this.logDeliveryProductInfo(deliveryProduct, deliveryZone);
            return deliveryProduct;
        } else {
            console.warn('❌ Товар доставки не найден для зоны:', deliveryZone);
            console.log('📋 Доступные товары:', window.dostavkaProducts.products.map(p => p.title));
            return null;
        }
    }
    
    // Логирование информации о товаре доставки
    logDeliveryProductInfo(product, zone) {
        console.log('🚚 ===== ИНФОРМАЦИЯ О ТОВАРЕ ДОСТАВКИ =====');
        console.log('📍 Зона доставки:', zone);
        console.log('📦 ID товара:', product.id);
        console.log('🏷️ Название:', product.title);
        console.log('💰 Цена:', product.price_formatted);
        console.log('🔗 URL:', product.url);
        console.log('✅ Доступность:', product.available ? 'Доступен' : 'Недоступен');
        
        if (product.variants && product.variants.length > 0) {
            console.log('📋 Варианты товара:');
            product.variants.forEach((variant, index) => {
                console.log(`  ${index + 1}. ID: ${variant.id}, Цена: ${variant.price_formatted}, Доступность: ${variant.available ? 'Да' : 'Нет'}`);
            });
        }
        
        if (product.tags && product.tags.length > 0) {
            console.log('🏷️ Теги:', product.tags.join(', '));
        }
        
        console.log('🚚 ===========================================');
    }
    
    // Получение общей суммы корзины
    getCartTotal() {
        const totalElement = document.querySelector('[data-cart-total-price]');
        if (totalElement) {
            const totalText = totalElement.textContent || totalElement.innerText;
            // Извлекаем число из текста (убираем валюту и пробелы)
            const totalMatch = totalText.match(/[\d\s]+/);
            if (totalMatch) {
                const total = parseInt(totalMatch[0].replace(/\s/g, ''));
                console.log('💰 Общая сумма корзины:', total);
                return total;
            }
        }
        console.warn('❌ Не удалось получить общую сумму корзины');
        return 0;
    }
    
    // Получение количества дней программы питания
    getProgramDaysCount() {
        let totalDays = 0;
        
        // Ищем все товары программ в корзине
        const programItems = document.querySelectorAll('[data-canonical-collection*="program"]');
        
        programItems.forEach(item => {
            const quantityInput = item.querySelector('input[name*="quantity"]');
            if (quantityInput) {
                const quantity = parseInt(quantityInput.value) || 0;
                totalDays += quantity;
                console.log('📅 Найдена программа с количеством дней:', quantity);
            }
        });
        
        console.log('📅 Общее количество дней программ:', totalDays);
        return totalDays;
    }
    
    // Получение времени доставки программы
    getProgramDeliveryTime() {
        // Ищем время доставки в комментариях товаров программ
        const programItems = document.querySelectorAll('[data-canonical-collection*="program"]');
        
        for (const item of programItems) {
            const commentInput = item.querySelector('input[data-comment]');
            if (commentInput && commentInput.value) {
                const comment = commentInput.value;
                console.log('🕐 Проверяем комментарий программы:', comment);
                
                // Ищем время доставки в комментарии
                const timeMatch = comment.match(/Время доставки:\s*([^|]+)/);
                if (timeMatch) {
                    const deliveryTime = timeMatch[1].trim();
                    console.log('🕐 Найдено время доставки:', deliveryTime);
                    
                    // Проверяем, до 7 утра или после
                    const timeMatch2 = deliveryTime.match(/(\d{1,2}):(\d{2})/);
                    if (timeMatch2) {
                        const hours = parseInt(timeMatch2[1]);
                        const isBefore7AM = hours < 7;
                        console.log('🕐 Время доставки:', hours + ':' + timeMatch2[2], isBefore7AM ? 'до 7 утра' : 'после 7 утра');
                        return isBefore7AM ? 'before_7am' : 'after_7am';
                    }
                }
            }
        }
        
        console.log('🕐 Время доставки не найдено, используем по умолчанию');
        return 'after_7am'; // По умолчанию после 7 утра
    }
    
    /**
     * Получает время доставки для конкретной даты
     * Если есть программа - берет время из программы
     * Если программы нет - берет самое раннее время из всех товаров этого дня
     */
    getDeliveryTimeForDate(date) {
        if (!this.virtualCart || !this.virtualCart.items) {
            console.log('❌ Виртуальная корзина недоступна для определения времени');
            return 'after_7am';
        }
        
        console.log(`🕐 Определяем время доставки для даты: ${date}`);
        
        let earliestHour = 24; // Максимальное значение
        let hasProgram = false;
        let programHour = null;
        
        this.virtualCart.items.forEach(item => {
            // Получаем комментарий
            let comment = item.comment;
            if (!comment) {
                comment = this.getCommentFromDOM(item);
            }
            
            if (!comment) return;
            
            // Проверяем, есть ли эта дата в товаре
            const itemDates = this.parseDatesFromComment(comment);
            if (!itemDates.includes(date)) return;
            
            console.log(`📦 Товар "${item.title}" доставляется ${date}`);
            
            // Проверяем, является ли товар программой
            const isProgram = this.isProgramItem(item);
            
            // Извлекаем время доставки
            const timeMatch = comment.match(/Время доставки:\s*([^|]+)/);
            if (timeMatch) {
                const deliveryTime = timeMatch[1].trim();
                const hourMatch = deliveryTime.match(/(\d{1,2}):(\d{2})/);
                
                if (hourMatch) {
                    const hours = parseInt(hourMatch[1]);
                    console.log(`🕐 Товар "${item.title}": время ${hours}:${hourMatch[2]}, программа: ${isProgram}`);
                    
                    // Если это программа, приоритет выше
                    if (isProgram) {
                        hasProgram = true;
                        programHour = hours;
                        console.log(`✅ Найдена программа с временем ${hours}:${hourMatch[2]}`);
                    } else if (!hasProgram && hours < earliestHour) {
                        // Если программы еще не нашли, запоминаем самое раннее время
                        earliestHour = hours;
                        console.log(`⏰ Обновлено самое раннее время: ${hours}:${hourMatch[2]}`);
                    }
                }
            }
        });
        
        // Определяем итоговое время
        let finalHour = hasProgram ? programHour : earliestHour;
        
        if (finalHour < 24) {
            const result = finalHour < 7 ? 'before_7am' : 'after_7am';
            console.log(`🕐 Итоговое время для ${date}: ${finalHour}:00 → ${result} (${hasProgram ? 'из программы' : 'самое раннее'})`);
            return result;
        }
        
        console.log(`🕐 Время для ${date} не найдено, используем по умолчанию: after_7am`);
        return 'after_7am'; // По умолчанию
    }
    
    /**
     * Получает время доставки для конкретной даты
     * Если есть программа - берет время из программы
     * Если программы нет - берет самое раннее время из всех товаров этого дня
     */
    getDeliveryTimeForDate(date) {
        if (!this.virtualCart || !this.virtualCart.items) {
            console.log('❌ Виртуальная корзина недоступна для определения времени');
            return 'after_7am';
        }
        
        console.log(`🕐 Определяем время доставки для даты: ${date}`);
        
        let earliestHour = 24; // Максимальное значение
        let hasProgram = false;
        let programHour = null;
        
        this.virtualCart.items.forEach(item => {
            // Получаем комментарий
            let comment = item.comment;
            if (!comment) {
                comment = this.getCommentFromDOM(item);
            }
            
            if (!comment) return;
            
            // Проверяем, есть ли эта дата в товаре
            const itemDates = this.parseDatesFromComment(comment);
            if (!itemDates.includes(date)) return;
            
            console.log(`📦 Товар "${item.title}" доставляется ${date}`);
            
            // Проверяем, является ли товар программой
            const isProgram = this.isProgramItem(item);
            
            // Извлекаем время доставки
            const timeMatch = comment.match(/Время доставки:\s*([^|]+)/);
            if (timeMatch) {
                const deliveryTime = timeMatch[1].trim();
                const hourMatch = deliveryTime.match(/(\d{1,2}):(\d{2})/);
                
                if (hourMatch) {
                    const hours = parseInt(hourMatch[1]);
                    console.log(`🕐 Товар "${item.title}": время ${hours}:${hourMatch[2]}, программа: ${isProgram}`);
                    
                    // Если это программа, приоритет выше
                    if (isProgram) {
                        hasProgram = true;
                        programHour = hours;
                        console.log(`✅ Найдена программа с временем ${hours}:${hourMatch[2]}`);
                    } else if (!hasProgram && hours < earliestHour) {
                        // Если программы еще не нашли, запоминаем самое раннее время
                        earliestHour = hours;
                        console.log(`⏰ Обновлено самое раннее время: ${hours}:${hourMatch[2]}`);
                    }
                }
            }
        });
        
        // Определяем итоговое время
        let finalHour = hasProgram ? programHour : earliestHour;
        
        if (finalHour < 24) {
            const result = finalHour < 7 ? 'before_7am' : 'after_7am';
            console.log(`🕐 Итоговое время для ${date}: ${finalHour}:00 → ${result} (${hasProgram ? 'из программы' : 'самое раннее'})`);
            return result;
        }
        
        console.log(`🕐 Время для ${date} не найдено, используем по умолчанию: after_7am`);
        return 'after_7am'; // По умолчанию
    }
    
    // Определение товара доставки по зоне и условиям (ОБНОВЛЕННАЯ ВЕРСИЯ)
    determineDeliveryProduct(deliveryZone) {
        console.log('🎯 Определение товара доставки для зоны:', deliveryZone);
        
        const deliveryTime = this.getProgramDeliveryTime();
        
        // Используем новую функцию расчета доставки
        const deliveryInfo = this.calculateDeliveryByZone(deliveryZone, deliveryTime);
        
        console.log('📊 Результат расчета доставки:', deliveryInfo);
        
        return deliveryInfo;
    }
    
    // Поиск товара доставки по названию
    findDeliveryProductByTitle(title) {
        if (!window.dostavkaProducts || !window.dostavkaProducts.products) {
            console.warn('❌ window.dostavkaProducts не найден');
            return null;
        }
        
        const product = window.dostavkaProducts.products.find(p => p.title === title);
        if (product) {
            console.log('✅ Найден товар доставки:', product.title, product.price_formatted);
        } else {
            console.warn('❌ Товар доставки не найден:', title);
        }
        
        return product;
    }
    
    // Добавление товара доставки в корзину через API Insales
    async addDeliveryProductToCart(product, quantity) {
        console.log('🛒 Добавление товара доставки в корзину:', product.title, 'количество:', quantity);
        
        if (!product || !product.variants || product.variants.length === 0) {
            console.error('❌ Товар доставки не найден или не имеет вариантов');
            return false;
        }
        
        const variant = product.variants[0]; // Берем первый вариант
        
        // Предпочтительно используем внутренний AJAX API InSales, если доступен
        if (window.ajaxAPI && ajaxAPI.cart && typeof ajaxAPI.cart.add === 'function') {
            try {
                console.log('➡️ Используем ajaxAPI.cart.add');
                const variantMap = {};
                variantMap[variant.id] = quantity;
                
                return await new Promise((resolve) => {
                    ajaxAPI.cart.add(variantMap, {})
                        .done((onDone) => {
                            console.log('✅ ajaxAPI.cart.add onDone:', onDone);
                            resolve(true);
                        })
                        .fail((onFail) => {
                            console.error('❌ ajaxAPI.cart.add onFail:', onFail);
                            resolve(false);
                        });
                });
            } catch (err) {
                console.error('❌ Ошибка ajaxAPI.cart.add:', err);
                // Падем на запасной вариант ниже
            }
        }
        
        // Fallback на прямой запрос, если ajaxAPI недоступен
        try {
            console.log('↘️ ajaxAPI недоступен, используем fetch /cart_items.json');
            const response = await fetch('/cart_items.json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    variant_id: variant.id,
                    quantity: quantity
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Товар доставки добавлен в корзину (fetch):', result);
                
                if (result && (result.cart_item || result.items || result.total_price)) {
                    return true;
                }
                
                console.error('❌ Неожиданный ответ при добавлении (fetch):', result);
                return false;
            } else {
                const errorText = await response.text();
                console.error('❌ Ошибка fetch при добавлении:', response.status, response.statusText, errorText);
                return false;
            }
        } catch (error) {
            console.error('❌ Исключение fetch при добавлении:', error);
            return false;
        }
    }
    
    // Обновление корзины без перезагрузки страницы
    async refreshCart() {
        console.log('🔄 Обновление корзины...');
        
        // Предпочтительно используем внутренний AJAX API InSales, если доступен
        if (window.ajaxAPI && ajaxAPI.cart && typeof ajaxAPI.cart.get === 'function') {
            try {
                console.log('➡️ Используем ajaxAPI.cart.get');
                
                return await new Promise((resolve) => {
                    ajaxAPI.cart.get()
                        .done((onDone) => {
                            console.log('✅ ajaxAPI.cart.get onDone:', onDone);
                            
                            // Сохраняем данные корзины в виртуальную корзину
                            this.virtualCart = onDone;
                            console.log('💾 Виртуальная корзина обновлена:', this.virtualCart);
                            
                            // Обновляем отображение корзины
                            this.updateCartDisplay(onDone);
                            resolve(true);
                        })
                        .fail((onFail) => {
                            console.error('❌ ajaxAPI.cart.get onFail:', onFail);
                            resolve(false);
                        });
                });
            } catch (err) {
                console.error('❌ Ошибка ajaxAPI.cart.get:', err);
                // Падем на запасной вариант ниже
            }
        }
        
        // Fallback на прямой запрос, если ajaxAPI недоступен
        try {
            console.log('↘️ ajaxAPI недоступен, используем fetch /cart.json');
            const response = await fetch('/cart.json', {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (response.ok) {
                const cartData = await response.json();
                console.log('✅ Данные корзины обновлены (fetch):', cartData);
                
                // Сохраняем данные корзины в виртуальную корзину
                this.virtualCart = cartData;
                console.log('💾 Виртуальная корзина обновлена (fetch):', this.virtualCart);
                
                // Обновляем отображение корзины
                this.updateCartDisplay(cartData);
                return true;
            } else {
                console.error('❌ Ошибка fetch при обновлении корзины:', response.status, response.statusText);
                return false;
            }
        } catch (error) {
            console.error('❌ Исключение fetch при обновлении корзины:', error);
            return false;
        }
    }
    
    // Обновление отображения корзины
    updateCartDisplay(cartData) {
        console.log('🔄 Обновление отображения корзины...');
        
        // Округляем цену до целого числа
        const roundedTotalPrice = Math.round(cartData.total_price);
        
        // Обновляем общую сумму
        const totalElement = document.querySelector('[data-cart-total-price]');
        if (totalElement && cartData.total_price) {
            totalElement.textContent = `${roundedTotalPrice} ₽`;
        }
        
        // Обновляем количество товаров
        // const countElement = document.querySelector('[data-cart-item-count]');
        // if (countElement && cartData.items_count) {
        //     countElement.textContent = cartData.items_count;
        // }
        
        // Обновляем полную сумму
        const fullTotalElement = document.querySelector('[data-cart-full-total-price]');
        if (fullTotalElement && cartData.total_price) {
            fullTotalElement.textContent = `${roundedTotalPrice} ₽`;
        }
        
        // Обновляем итоговую сумму в .total-price
        const totalPriceElement = document.querySelector('.total-price');
        if (totalPriceElement && cartData.total_price) {
            totalPriceElement.textContent = `${roundedTotalPrice} ₽`;
            console.log('💰 Итоговая сумма обновлена в .total-price:', `${roundedTotalPrice} ₽`);
        } else if (totalPriceElement) {
            console.warn('⚠️ Элемент .total-price найден, но нет данных о цене');
        } else {
            console.warn('⚠️ Элемент .total-price не найден');
        }
        
        console.log('✅ Отображение корзины обновлено');
    }
    
    // Обновление отображения цены доставки (ОБНОВЛЕННАЯ ВЕРСИЯ)
    updateDeliveryPriceDisplay(deliveryInfo) {
        const deliveryPriceElement = document.getElementById('delivery-price');
        if (!deliveryPriceElement) {
            console.warn('❌ Элемент #delivery-price не найден');
            return;
        }
        
        if (deliveryInfo.isFree) {
            deliveryPriceElement.textContent = 'Бесплатно';
            deliveryPriceElement.style.color = '#28a745'; // Зеленый цвет
            console.log('✅ Доставка отмечена как бесплатная');
        } else if (deliveryInfo.product && deliveryInfo.quantity > 0) {
            const totalPrice = deliveryInfo.product.price * deliveryInfo.quantity;
            
            // Добавляем информацию о платных и бесплатных днях для зон МКАД
            if (deliveryInfo.paidDays !== undefined && deliveryInfo.freeDays !== undefined) {
                if (deliveryInfo.freeDays > 0) {
                    deliveryPriceElement.innerHTML = `${totalPrice} ₽<br><small style="color: #28a745;">(${deliveryInfo.paidDays} платных, ${deliveryInfo.freeDays} бесплатных дней)</small>`;
                } else {
                    deliveryPriceElement.innerHTML = `${totalPrice} ₽<br><small style="color: #666;">(${deliveryInfo.paidDays} дней)</small>`;
                }
            } else {
                deliveryPriceElement.textContent = `${totalPrice} ₽`;
            }
            
            deliveryPriceElement.style.color = '#333'; // Обычный цвет
            console.log('💰 Цена доставки обновлена:', totalPrice, '₽', deliveryInfo);
        } else {
            deliveryPriceElement.textContent = '-';
            deliveryPriceElement.style.color = '#999';
            console.log('❓ Цена доставки не определена');
        }
    }
    
    // Обработка выбора адреса доставки
    async handleDeliverySelection(deliveryZone) {
        console.log('🎯 Обработка выбора доставки для зоны:', deliveryZone);
        console.log('🔍 handleDeliverySelection вызван, начинаем обработку...');
        
        try {
            // Ждем загрузки данных о продуктах доставки
            console.log('⏳ Ждем загрузки данных о продуктах доставки...');
            await this.waitForDostavkaProducts();
            console.log('✅ Данные о продуктах доставки загружены');
            
            // Удаляем предыдущие товары доставки из корзины
            console.log('🗑️ Удаляем предыдущие товары доставки перед добавлением нового...');
            await this.removeExistingDeliveryProducts();
            console.log('✅ Удаление предыдущих товаров доставки завершено');
            
            // Определяем товар доставки
            const deliveryInfo = this.determineDeliveryProduct(deliveryZone);
            console.log('📊 Информация о доставке:', deliveryInfo);
            
            // Обновляем отображение цены
            this.updateDeliveryPriceDisplay(deliveryInfo);
            
            // Если доставка не бесплатная и есть товар, добавляем в корзину
            if (!deliveryInfo.isFree && deliveryInfo.product && deliveryInfo.quantity > 0) {
                console.log('🛒 Добавляем товар доставки в корзину...');
                const success = await this.addDeliveryProductToCart(deliveryInfo.product, deliveryInfo.quantity);
                
                if (success) {
                    console.log('✅ Товар доставки успешно добавлен в корзину');
                    
                    // Обновляем корзину без перезагрузки страницы
                    await this.refreshCart();
                    
                    // Обновляем итоговую сумму в интерфейсе
                    this.updateCartTotalPriceAuto();
                } else {
                    console.error('❌ Не удалось добавить товар доставки в корзину');
                }
            } else {
                console.log('❌ Товар доставки не будет добавлен:', {
                    isFree: deliveryInfo.isFree,
                    hasProduct: !!deliveryInfo.product,
                    quantity: deliveryInfo.quantity,
                    deliveryInfo: deliveryInfo
                });
            }
            
            if (deliveryInfo.isFree) {
                console.log('✅ Доставка бесплатна, товар не добавляем');
                
                // Обновляем корзину после удаления товара доставки
                console.log('🔄 Обновляем корзину после удаления товара доставки...');
                await this.refreshCart();
                
                // Обновляем итоговую сумму в интерфейсе
                this.updateCartTotalPriceAuto();
            } else {
                console.log('ℹ️ Товар доставки не требуется или не найден');
                
                // Обновляем корзину в любом случае
                console.log('🔄 Обновляем корзину...');
                await this.refreshCart();
                
                // Обновляем итоговую сумму в интерфейсе
                this.updateCartTotalPriceAuto();
            }
            
            return deliveryInfo;
        } catch (error) {
            console.error('❌ Ошибка при обработке выбора доставки:', error);
            return null;
        }
    }
    
    // Ожидание загрузки window.dostavkaProducts
    waitForDostavkaProducts(maxAttempts = 10, delay = 500) {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            
            const checkProducts = () => {
                attempts++;
                console.log(`🔍 Попытка ${attempts}/${maxAttempts} проверки window.dostavkaProducts`);
                
                if (window.dostavkaProducts && 
                    window.dostavkaProducts.products && 
                    Array.isArray(window.dostavkaProducts.products) && 
                    window.dostavkaProducts.products.length > 0) {
                    console.log('✅ window.dostavkaProducts загружен успешно');
                    resolve(window.dostavkaProducts);
                    return;
                }
                
                if (attempts >= maxAttempts) {
                    console.error('❌ Превышено максимальное количество попыток ожидания window.dostavkaProducts');
                    reject(new Error('window.dostavkaProducts не загружен'));
                    return;
                }
                
                console.log(`⏳ Ожидание ${delay}ms перед следующей попыткой...`);
                setTimeout(checkProducts, delay);
            };
            
            checkProducts();
        });
    }
    
    // Поиск товара доставки с ожиданием загрузки данных
    async findDeliveryProductByZoneAsync(deliveryZone) {
        console.log('🔍 Асинхронный поиск товара доставки для зоны:', deliveryZone);
        
        try {
            // Ждем загрузки данных о продуктах доставки
            await this.waitForDostavkaProducts();
            
            // Теперь ищем товар
            return this.findDeliveryProductByZone(deliveryZone);
        } catch (error) {
            console.error('❌ Ошибка при ожидании загрузки window.dostavkaProducts:', error);
            return null;
        }
    }
    
    // Проверка попадания точки в полигон (алгоритм ray casting)
    isPointInPolygon(point, polygon) {
        // point: [широта, долгота] - формат Яндекс карт
        // polygon: [[долгота, широта], ...] - формат GeoJSON
        const lat = point[0], lon = point[1];
        let inside = false;
        
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const lon1 = polygon[i][0], lat1 = polygon[i][1];
            const lon2 = polygon[j][0], lat2 = polygon[j][1];
            
            if (((lat1 > lat) !== (lat2 > lat)) && (lon < (lon2 - lon1) * (lat - lat1) / (lat2 - lat1) + lon1)) {
                inside = !inside;
            }
        }
        
        return inside;
    }
    
    // Добавление маркера на карту
    addMarker(coords, address) {
        // Удаляем предыдущий маркер
        this.map.geoObjects.removeAll();
        
        // Создаем новый маркер
        const marker = new ymaps.Placemark(coords, {
            balloonContent: address
        }, {
            preset: 'islands#redDotIcon',
            draggable: true
        });
        
        // Добавляем маркер на карту
        this.map.geoObjects.add(marker);
        
        // Обработчик перетаскивания маркера
        marker.events.add('dragend', () => {
            const newCoords = marker.geometry.getCoordinates();
            this.selectedCoordinates = newCoords;
            
            // Получаем новый адрес
            this.geocoder(newCoords).then((res) => {
                const firstGeoObject = res.geoObjects.get(0);
                if (firstGeoObject) {
                    const newAddress = firstGeoObject.getAddressLine();
                    this.selectedAddress = newAddress;
                    this.updateSelectedAddress(newAddress);
                    marker.properties.set('balloonContent', newAddress);
                    
                    // Обновляем адрес в комментарии если он уже был сохранен
                    if (this.savedDeliveryData) {
                        this.updateDeliveryAddressInComment(newAddress, newCoords);
                    }
                }
            });
        });
    }
    
    // Обработчик ввода в поле адреса
    handleAddressInput(e) {
        const query = e.target.value.trim();
        
        if (query.length < 3) {
            this.hideSuggestions();
            return;
        }
        
        // Поиск адресов через геокодер
        this.geocoder(query).then((res) => {
            this.suggestions = res.geoObjects.toArray();
            this.showSuggestions();
        });
    }
    
    // Обработчик клавиш в поле адреса
    handleAddressKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.searchAddress();
        } else if (e.key === 'Escape') {
            this.hideSuggestions();
        }
    }
    
    // Поиск адреса
    searchAddress() {
        const query = this.addressInput.value.trim();
        
        if (!query) return;
        
        this.geocoder(query).then((res) => {
            const firstGeoObject = res.geoObjects.get(0);
            if (firstGeoObject) {
                const coords = firstGeoObject.geometry.getCoordinates();
                const address = firstGeoObject.getAddressLine();
                
                this.selectedCoordinates = coords;
                this.selectedAddress = address;
                
                // Определяем зону доставки
                const deliveryZone = this.getDeliveryZone(coords);
                
                // Обрабатываем выбор доставки
                this.handleDeliverySelection(deliveryZone);
                
                // Центрируем карту на найденном адресе
                this.map.setCenter(coords, 15);
                
                // Добавляем маркер
                this.addMarker(coords, address);
                
                // Обновляем UI
                this.updateSelectedAddress(address, deliveryZone);
                this.updateConfirmButton(deliveryZone !== 'Зона доставки не определена');
                this.hideSuggestions();
                
                // Обновляем адрес в комментарии если он уже был сохранен
                if (this.savedDeliveryData) {
                    this.updateDeliveryAddressInComment(address, coords);
                }
                
                console.log('🔍 Найден адрес:', address, coords);
                console.log('🚚 Зона доставки:', deliveryZone);
            }
        });
    }
    
    // Использование текущего местоположения
    useCurrentLocation() {
        if (!navigator.geolocation) {
            console.warn('❌ Геолокация не поддерживается');
            return;
        }
        
        this.locationBtn.disabled = true;
        this.locationBtn.textContent = 'Определяем...';
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = [position.coords.latitude, position.coords.longitude];
                
                // Центрируем карту на текущем местоположении
                this.map.setCenter(coords, 15);
                
                // Получаем адрес
                this.geocoder(coords).then((res) => {
                    const firstGeoObject = res.geoObjects.get(0);
                    if (firstGeoObject) {
                        const address = firstGeoObject.getAddressLine();
                        
                        this.selectedCoordinates = coords;
                        this.selectedAddress = address;
                        
                        // Определяем зону доставки
                        const deliveryZone = this.getDeliveryZone(coords);
                        
                        // Обрабатываем выбор доставки (вместо только поиска товара)
                        this.handleDeliverySelection(deliveryZone);
                        
                        // Добавляем маркер
                        this.addMarker(coords, address);
                        
                        // Обновляем UI
                        this.updateSelectedAddress(address, deliveryZone);
                        this.updateConfirmButton(deliveryZone !== 'Зона доставки не определена');
                        
                        // Обновляем адрес в комментарии если он уже был сохранен
                        if (this.savedDeliveryData) {
                            this.updateDeliveryAddressInComment(address, coords);
                        }
                        
                        console.log('📍 Текущее местоположение:', address, coords);
                        console.log('🚚 Зона доставки:', deliveryZone);
                    }
                });
                
                this.locationBtn.disabled = false;
                this.locationBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 1C5.24 1 3 3.24 3 6C3 9.5 8 15 8 15S13 9.5 13 6C13 3.24 10.76 1 8 1ZM8 8.25C6.76 8.25 5.75 7.24 5.75 6C5.75 4.76 6.76 3.75 8 3.75C9.24 3.75 10.25 4.76 10.25 6C10.25 7.24 9.24 8.25 8 8.25Z" fill="currentColor"/>
                    </svg>
                    Мое местоположение
                `;
            },
            (error) => {
                console.error('❌ Ошибка геолокации:', error);
                this.locationBtn.disabled = false;
                this.locationBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 1C5.24 1 3 3.24 3 6C3 9.5 8 15 8 15S13 9.5 13 6C13 3.24 10.76 1 8 1ZM8 8.25C6.76 8.25 5.75 7.24 5.75 6C5.75 4.76 6.76 3.75 8 3.75C9.24 3.75 10.25 4.76 10.25 6C10.25 7.24 9.24 8.25 8 8.25Z" fill="currentColor"/>
                    </svg>
                    Мое местоположение
                `;
            }
        );
    }
    
    // Показ подсказок адресов
    showSuggestions() {
        if (!this.suggestionsContainer || this.suggestions.length === 0) return;
        
        const suggestionsHTML = this.suggestions.slice(0, 5).map((geoObject, index) => {
            const address = geoObject.getAddressLine();
            return `
                <div class="suggestion-item" data-index="${index}">
                    ${address}
                </div>
            `;
        }).join('');
        
        this.suggestionsContainer.innerHTML = suggestionsHTML;
        this.suggestionsContainer.style.display = 'block';
        
        // Добавляем обработчики кликов
        this.suggestionsContainer.querySelectorAll('.suggestion-item').forEach((item, index) => {
            item.addEventListener('click', () => this.selectSuggestion(index));
        });
    }
    
    // Скрытие подсказок
    hideSuggestions() {
        if (this.suggestionsContainer) {
            this.suggestionsContainer.style.display = 'none';
        }
    }
    
    // Выбор подсказки
    selectSuggestion(index) {
        const geoObject = this.suggestions[index];
        const coords = geoObject.geometry.getCoordinates();
        const address = geoObject.getAddressLine();
        
        this.selectedCoordinates = coords;
        this.selectedAddress = address;
        
        // Обновляем поле ввода
        this.addressInput.value = address;
        
        // Центрируем карту
        this.map.setCenter(coords, 15);
        
        // Добавляем маркер
        this.addMarker(coords, address);
        
        // Определяем зону доставки
        const deliveryZone = this.getDeliveryZone(coords);
        
        // Обрабатываем выбор доставки (вместо только поиска товара)
        this.handleDeliverySelection(deliveryZone);
        
        // Обновляем UI
        this.updateSelectedAddress(address, deliveryZone);
        this.updateConfirmButton(deliveryZone !== 'Зона доставки не определена');
        this.hideSuggestions();
        
        // Обновляем адрес в комментарии если он уже был сохранен
        if (this.savedDeliveryData) {
            this.updateDeliveryAddressInComment(address, coords);
        }
    }
    
    // Обновление отображения выбранного адреса
    updateSelectedAddress(address, deliveryZone = null) {
        if (this.selectedAddressEl) {
            let displayText = address;
            if (deliveryZone) {
                displayText += ` (${deliveryZone})`;
            }
            this.selectedAddressEl.textContent = displayText;
        }
    }
    
    // Обновление состояния кнопки подтверждения
    updateConfirmButton(enabled) {
        if (this.confirmBtn) {
            this.confirmBtn.disabled = !enabled;
        }
    }
    
    // Обновление состояния кнопки оформления
    updateCheckoutButton(enabled) {
        if (this.checkoutBtn) {
            this.checkoutBtn.disabled = !enabled;
        }
    }
    
    // Обновление отображения адреса в корзине
    updateCartAddressDisplay() {
        if (!this.chooseAddressBtn) return;
        
        if (this.selectedAddress) {
            // Определяем зону доставки для отображения
            const deliveryZone = this.getDeliveryZone(this.selectedCoordinates);
            
            // Создаем HTML для отображения адреса
            this.chooseAddressBtn.innerHTML = `
                <div class="selected-address-display">
                    <div class="address-text">${this.selectedAddress}</div>
                    <button type="button" class="change-address-btn" id="changeAddressBtn">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M12 4L4 12M4 4L12 12" stroke="var(--hte-black)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            `;
            
            // Добавляем обработчик для кнопки "Изменить адрес"
            const changeBtn = this.chooseAddressBtn.querySelector('#changeAddressBtn');
            if (changeBtn) {
                changeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.openPopup(e);
                });
            }
            
            console.log('✅ Адрес обновлен в корзине:', this.selectedAddress);
        } else {
            // Возвращаем исходный текст кнопки
            this.chooseAddressBtn.innerHTML = 'Выбрать адрес доставки';
        }
    }
    
    // Подтверждение выбранного адреса
    confirmAddress() {
        if (!this.selectedAddress || !this.selectedCoordinates) {
            console.warn('❌ Адрес не выбран');
            return;
        }
        
        console.log('✅ Адрес подтвержден:', this.selectedAddress, this.selectedCoordinates);
        
        // Переходим ко второму шагу
        this.goToStep2();
    }
    
    // Переход ко второму шагу
    goToStep2() {
        this.currentStep = 2;
        
        // Скрываем первый шаг
        if (this.step1) {
            this.step1.style.display = 'none';
        }
        
        // Показываем второй шаг
        if (this.step2) {
            this.step2.style.display = 'flex';
        }
        
        // Устанавливаем подтвержденный адрес
        if (this.confirmedAddressEl) {
            this.confirmedAddressEl.textContent = this.selectedAddress;
        }
        
        // Очищаем предыдущие ошибки валидации
        this.clearValidationErrors();
        
        // Проверяем тип дома и устанавливаем соответствующую обязательность полей
        const isPrivateHouse = this.houseTypeToggle?.checked;
        if (isPrivateHouse) {
            // Для частного дома убираем обязательность
            this.setRequiredFields(['apartment', 'floor', 'entrance'], false);
        } else {
            // Для многоквартирного дома устанавливаем обязательность
            this.setRequiredFields(['apartment', 'floor', 'entrance'], true);
        }
        
        // Обновляем заголовок попапа
        this.updatePopupTitle('Детали доставки', 'Укажите дополнительную информацию для курьера');
        
        console.log('🔄 Переход ко второму шагу');
    }
    
    // Возврат к первому шагу
    goToStep1() {
        this.currentStep = 1;
        
        // Скрываем второй шаг
        if (this.step2) {
            this.step2.style.display = 'none';
        }
        
        // Показываем первый шаг
        if (this.step1) {
            this.step1.style.display = 'flex';
        }
        
        // Обновляем заголовок попапа
        this.updatePopupTitle('Укажите ваш адрес', 'Введите адрес или выберите точку на карте для расчета доступных слотов доставки.');
        
        console.log('🔄 Возврат к первому шагу');
    }
    
    // Обновление заголовка попапа
    updatePopupTitle(title, description) {
        const titleEl = this.popup?.querySelector('.popup-title');
        const descEl = this.popup?.querySelector('.popup-description');
        
        if (titleEl) titleEl.textContent = title;
        if (descEl) descEl.textContent = description;
    }
    
    // Обработка изменения типа дома
    handleHouseTypeChange() {
        const isPrivateHouse = this.houseTypeToggle?.checked;
        
        // Показываем/скрываем поля в зависимости от типа дома
        if (isPrivateHouse) {
            // Для частного дома скрываем поля квартиры, этажа, подъезда, домофона
            this.toggleFormFields(false, ['apartment', 'floor', 'entrance', 'intercom']);
        } else {
            // Для многоквартирного дома показываем все поля и делаем некоторые обязательными
            this.toggleFormFields(true, ['apartment', 'floor', 'entrance', 'intercom']);
            this.setRequiredFields(['apartment', 'floor', 'entrance'], true);
        }
        
        console.log('🏠 Тип дома изменен:', isPrivateHouse ? 'Частный дом' : 'Многоквартирный дом');
    }
    
    // Переключение видимости полей формы
    toggleFormFields(show, fieldNames) {
        fieldNames.forEach(fieldName => {
            const field = document.getElementById(fieldName + 'Input');
            console.log(`🔍 Поиск поля ${fieldName}:`, field);
            
            if (field) {
                const formGroup = field.closest('.form-group');
                console.log(`📦 Form group для ${fieldName}:`, formGroup);
                
                if (formGroup) {
                    formGroup.style.display = show ? 'flex' : 'none';
                    console.log(`✅ ${show ? 'Показано' : 'Скрыто'} поле ${fieldName}`);
                }
            } else {
                console.warn(`❌ Поле ${fieldName} не найдено`);
            }
        });
    }
    
    // Установка обязательности полей
    setRequiredFields(fieldNames, required) {
        fieldNames.forEach(fieldName => {
            const field = document.getElementById(fieldName + 'Input');
            
            if (field) {
                field.required = required;
                
                // Добавляем/удаляем визуальный индикатор обязательности
                const formGroup = field.closest('.form-group');
                if (formGroup) {
                    const label = formGroup.querySelector('label') || field.previousElementSibling;
                    
                    if (required) {
                        // Добавляем звездочку к обязательным полям
                        field.classList.add('required-field');
                        field.setAttribute('aria-required', 'true');
                        
                        // Добавляем визуальный индикатор обязательности
                        if (label) {
                            if (!label.querySelector('.required-indicator')) {
                                const requiredSpan = document.createElement('span');
                                requiredSpan.className = 'required-indicator';
                                requiredSpan.style.color = '#ff6b6b';
                                requiredSpan.style.marginLeft = '4px';
                                requiredSpan.textContent = '*';
                                label.appendChild(requiredSpan);
                            }
                        }
                    } else {
                        // Убираем звездочку с необязательных полей
                        field.classList.remove('required-field');
                        field.removeAttribute('aria-required');
                        
                        // Убираем визуальный индикатор обязательности
                        if (label) {
                            const requiredSpan = label.querySelector('.required-indicator');
                            if (requiredSpan) {
                                requiredSpan.remove();
                            }
                        }
                    }
                }
                
                console.log(`✅ Поле ${fieldName} ${required ? 'сделано' : 'убрано из'} обязательным`);
            } else {
                console.warn(`❌ Поле ${fieldName} не найдено для установки обязательности`);
            }
        });
    }
    
    // Валидация формы
    validateForm() {
        const isPrivateHouse = this.houseTypeToggle?.checked;
        
        // Если частный дом выбран, валидация не нужна
        if (isPrivateHouse) {
            console.log('✅ Частный дом выбран, валидация не требуется');
            return { isValid: true, errors: [] };
        }
        
        const requiredFields = ['apartment', 'floor', 'entrance'];
        const errors = [];
        
        requiredFields.forEach(fieldName => {
            const field = document.getElementById(fieldName + 'Input');
            if (field) {
                const value = (field.value || '').trim();
                
                if (!value) {
                    errors.push({
                        field: fieldName,
                        message: this.getFieldDisplayName(fieldName) + ' обязателен для заполнения'
                    });
                    
                    // Добавляем визуальный индикатор ошибки
                    field.classList.add('error-field');
                    field.setCustomValidity(this.getFieldDisplayName(fieldName) + ' обязателен для заполнения');
                } else {
                    // Убираем визуальный индикатор ошибки
                    field.classList.remove('error-field');
                    field.setCustomValidity('');
                }
            }
        });
        
        const isValid = errors.length === 0;
        console.log(`📋 Валидация формы: ${isValid ? 'пройдена' : 'не пройдена'}`, errors);
        
        return { isValid, errors };
    }
    
    // Получение отображаемого имени поля
    getFieldDisplayName(fieldName) {
        const names = {
            'apartment': 'Квартира',
            'floor': 'Этаж',
            'entrance': 'Подъезд',
            'intercom': 'Домофон'
        };
        
        return names[fieldName] || fieldName;
    }
    
    // Показ ошибок валидации пользователю
    showValidationErrors(errors) {
        // Сначала очищаем предыдущие ошибки
        this.clearValidationErrors();
        
        // Добавляем сообщение об ошибке в интерфейсе
        const errorContainer = this.popup?.querySelector('.validation-errors');
        if (errorContainer) {
            errorContainer.innerHTML = '';
        } else {
            // Создаем контейнер для ошибок если его нет
            const existingErrors = this.popup?.querySelector('.validation-errors');
            if (!existingErrors && this.popup) {
                const errorsDiv = document.createElement('div');
                errorsDiv.className = 'validation-errors';
                errorsDiv.style.cssText = 'color: #ff6b6b; margin-bottom: 16px; padding: 8px 12px; background: #fff5f5; border-radius: 4px; border: 1px solid #ffebee;';
                
                // Вставляем перед кнопкой финального подтверждения
                const finalConfirmSection = this.popup?.querySelector('.final-confirmation-section');
                if (finalConfirmSection) {
                    finalConfirmSection.parentNode.insertBefore(errorsDiv, finalConfirmSection);
                } else {
                    this.popup.insertBefore(errorsDiv, this.popup.firstChild);
                }
            }
        }
        
        // Добавляем ошибки в контейнер
        if (errors.length > 0) {
            const errorContainer = this.popup?.querySelector('.validation-errors');
            if (errorContainer) {
                const errorList = document.createElement('ul');
                errorList.style.cssText = 'margin: 0; padding-left: 16px; list-style: none;';
                
                errors.forEach(error => {
                    const li = document.createElement('li');
                    li.style.cssText = 'margin-bottom: 4px;';
                    li.textContent = error.message;
                    errorList.appendChild(li);
                });
                
                errorContainer.innerHTML = '<strong>Пожалуйста, заполните обязательные поля:</strong>';
                errorContainer.appendChild(errorList);
            }
        }
        
        console.log('📄 Показаны ошибки валидации:', errors);
    }
    
    // Очистка ошибок валидации
    clearValidationErrors() {
        const errorContainer = this.popup?.querySelector('.validation-errors');
        if (errorContainer) {
            errorContainer.innerHTML = '';
            errorContainer.style.display = 'none';
        }
        
        // Убираем визуальные индикаторы ошибок с полей
        const errorFields = this.popup?.querySelectorAll('.error-field');
        if (errorFields) {
            errorFields.forEach(field => {
                field.classList.remove('error-field');
                field.setCustomValidity('');
            });
        }
    }
    
    // Обновление счетчика символов
    updateCharCounter() {
        if (!this.courierCommentInput || !this.charCounter) return;
        
        const currentLength = this.courierCommentInput.value.length;
        const maxLength = this.courierCommentInput.maxLength;
        
        this.charCounter.textContent = `${currentLength}/${maxLength}`;
        
        // Меняем цвет при приближении к лимиту
        if (currentLength > maxLength * 0.9) {
            this.charCounter.style.color = '#ff6b6b';
        } else if (currentLength > maxLength * 0.8) {
            this.charCounter.style.color = '#ffa726';
        } else {
            this.charCounter.style.color = '#9D9D9D';
        }
    }
    
    // Финальное подтверждение
    finalConfirm() {
        console.log('✅ Финальное подтверждение доставки');
        
        // Проверяем наличие адреса
        if (!this.selectedAddress) {
            console.warn('❌ Адрес не выбран!');
            return;
        }
        
        // Валидируем форму
        const validationResult = this.validateForm();
        if (!validationResult.isValid) {
            console.warn('❌ Форма не прошла валидацию:', validationResult.errors);
            
            // Показываем сообщения об ошибках пользователю
            this.showValidationErrors(validationResult.errors);
            return;
        }
        
        // Собираем данные формы
        const deliveryData = {
            address: this.selectedAddress,
            coordinates: this.selectedCoordinates,
            houseType: this.houseTypeToggle?.checked ? 'private' : 'apartment',
            apartment: this.apartmentInput?.value || '',
            floor: this.floorInput?.value || '',
            entrance: this.entranceInput?.value || '',
            intercom: this.intercomInput?.value || '',
            comment: this.courierCommentInput?.value || ''
        };
        
        console.log('📦 Данные доставки:', deliveryData);
        
        // Обновляем комментарий заказа с адресом доставки
        console.log('📝 Вызываем updateOrderComment...');
        this.updateOrderComment(deliveryData);
        
        // Активируем кнопку оформления
        this.updateCheckoutButton(true);
        
        // Обновляем текст кнопки оформления
        if (this.checkoutBtn) {
            this.checkoutBtn.textContent = 'Перейти к оформлению';
        }
        
        // Обновляем отображение адреса в корзине
        this.updateCartAddressDisplay();
        
        // Здесь можно добавить логику отправки данных на сервер
        // Например, обновление корзины или отправка заказа
        
        // Закрываем попап
        this.closePopup();
        
        // Сбрасываем только UI (сохраняем данные)
        this.resetUI();
    }
    
    // Обновление комментария заказа с адресом доставки
    updateOrderComment(deliveryData) {
        console.log('📝 Обновление комментария заказа с адресом доставки');
        console.log('📦 Данные доставки:', deliveryData);
        
        // Формируем строку адреса доставки
        let deliveryAddressString = `Адрес доставки: ${deliveryData.address}`;
        
        // Добавляем дополнительные детали если они есть
        const details = [];
        if (deliveryData.apartment) details.push(`кв. ${deliveryData.apartment}`);
        if (deliveryData.floor) details.push(`эт. ${deliveryData.floor}`);
        if (deliveryData.entrance) details.push(`под. ${deliveryData.entrance}`);
        if (deliveryData.intercom) details.push(`домофон ${deliveryData.intercom}`);
        
        if (details.length > 0) {
            deliveryAddressString += ` (${details.join(', ')})`;
        }
        
        // Добавляем комментарий курьера если есть
        if (deliveryData.comment) {
            deliveryAddressString += ` | Комментарий: ${deliveryData.comment}`;
        }
        
        console.log('🏠 Строка адреса доставки:', deliveryAddressString);
        
        // Находим все поля комментариев в корзине
        const commentInputs = document.querySelectorAll('input[data-comment]');
        console.log('🔍 Найдено полей комментариев:', commentInputs.length);
        
        if (commentInputs.length === 0) {
            console.warn('❌ Поля комментариев не найдены!');
            // Попробуем альтернативный селектор
            const altInputs = document.querySelectorAll('input[name*="order_line_comments"]');
            console.log('🔍 Альтернативный поиск - найдено полей:', altInputs.length);
            if (altInputs.length > 0) {
                altInputs.forEach(input => {
                    console.log('📝 Обновляем альтернативное поле:', input.name, input.value);
                    this.updateSingleCommentField(input, deliveryAddressString);
                });
            }
            return;
        }
        
        commentInputs.forEach((input, index) => {
            console.log(`📝 Обрабатываем поле ${index + 1}:`, input.name, 'текущее значение:', input.value);
            this.updateSingleCommentField(input, deliveryAddressString);
        });
        
        // Сохраняем данные доставки для возможного обновления
        this.savedDeliveryData = deliveryData;
    }
    
    // Обновление одного поля комментария
    updateSingleCommentField(input, deliveryAddressString) {
        const currentValue = input.value || '';
        console.log('📝 Текущее значение поля:', currentValue);
        
        // Удаляем предыдущий адрес доставки если он есть
        let updatedValue = this.removeDeliveryAddressFromComment(currentValue);
        console.log('🧹 Очищенное значение:', updatedValue);
        
        // Добавляем новый адрес доставки
        if (updatedValue.trim()) {
            updatedValue += ` | ${deliveryAddressString}`;
        } else {
            updatedValue = deliveryAddressString;
        }
        
        console.log('✅ Новое значение поля:', updatedValue);
        
        // Обновляем значение поля
        input.value = updatedValue;
        
        // Принудительно вызываем событие change для уведомления других скриптов
        const changeEvent = new Event('change', { bubbles: true });
        input.dispatchEvent(changeEvent);
        
        // Также вызываем событие input
        const inputEvent = new Event('input', { bubbles: true });
        input.dispatchEvent(inputEvent);
        
        console.log('✅ Поле обновлено и события отправлены');
    }
    
    // Удаление адреса доставки из комментария
    removeDeliveryAddressFromComment(comment) {
        if (!comment) return '';
        
        console.log('🧹 Удаляем адрес доставки из комментария:', comment);
        
        // Разбиваем комментарий по разделителю "|"
        const parts = comment.split('|');
        const filteredParts = [];
        
        for (const part of parts) {
            const trimmedPart = part.trim();
            console.log('🔍 Проверяем часть:', trimmedPart);
            
            // Пропускаем части, которые содержат адрес доставки или комментарий курьера
            if (!trimmedPart.startsWith('Адрес доставки:') && 
                !trimmedPart.startsWith('Комментарий:') &&
                !trimmedPart.includes('кв.') && // Дополнительная проверка на детали адреса
                !trimmedPart.includes('эт.') &&
                !trimmedPart.includes('под.') &&
                !trimmedPart.includes('домофон')) {
                filteredParts.push(trimmedPart);
                console.log('✅ Часть сохранена:', trimmedPart);
            } else {
                console.log('❌ Часть удалена:', trimmedPart);
            }
        }
        
        const result = filteredParts.join(' | ').trim();
        console.log('🧹 Результат очистки:', result);
        return result;
    }
    
    // Обновление адреса доставки в комментарии (при изменении адреса)
    updateDeliveryAddressInComment(newAddress, newCoordinates) {
        console.log('🔄 Обновление адреса доставки в комментарии');
        console.log('🏠 Новый адрес:', newAddress);
        
        if (!this.savedDeliveryData) {
            console.warn('❌ Нет сохраненных данных доставки для обновления');
            return;
        }
        
        // Обновляем сохраненные данные
        this.savedDeliveryData.address = newAddress;
        this.savedDeliveryData.coordinates = newCoordinates;
        
        // Формируем новый адрес доставки
        let deliveryAddressString = `Адрес доставки: ${newAddress}`;
        
        // Добавляем дополнительные детали если они есть
        const details = [];
        if (this.savedDeliveryData.apartment) details.push(`кв. ${this.savedDeliveryData.apartment}`);
        if (this.savedDeliveryData.floor) details.push(`эт. ${this.savedDeliveryData.floor}`);
        if (this.savedDeliveryData.entrance) details.push(`под. ${this.savedDeliveryData.entrance}`);
        if (this.savedDeliveryData.intercom) details.push(`домофон ${this.savedDeliveryData.intercom}`);
        
        if (details.length > 0) {
            deliveryAddressString += ` (${details.join(', ')})`;
        }
        
        // Добавляем комментарий курьера если есть
        if (this.savedDeliveryData.comment) {
            deliveryAddressString += ` | Комментарий: ${this.savedDeliveryData.comment}`;
        }
        
        console.log('🏠 Обновленная строка адреса:', deliveryAddressString);
        
        // Находим все поля комментариев в корзине
        const commentInputs = document.querySelectorAll('input[data-comment]');
        console.log('🔍 Найдено полей для обновления:', commentInputs.length);
        
        if (commentInputs.length === 0) {
            console.warn('❌ Поля комментариев не найдены для обновления!');
            // Попробуем альтернативный селектор
            const altInputs = document.querySelectorAll('input[name*="order_line_comments"]');
            console.log('🔍 Альтернативный поиск - найдено полей:', altInputs.length);
            if (altInputs.length > 0) {
                altInputs.forEach(input => {
                    this.updateSingleCommentField(input, deliveryAddressString);
                });
            }
            return;
        }
        
        commentInputs.forEach((input, index) => {
            console.log(`🔄 Обновляем поле ${index + 1}:`, input.name);
            this.updateSingleCommentField(input, deliveryAddressString);
        });
    }
    
    // Сброс состояния (только при полном сбросе)
    resetState() {
        this.selectedCoordinates = null;
        this.selectedAddress = null;
        this.suggestions = [];
        this.currentStep = 1;
        this.savedDeliveryData = null;
        
        // Сбрасываем первый шаг
        if (this.addressInput) {
            this.addressInput.value = '';
        }
        
        if (this.selectedAddressEl) {
            this.selectedAddressEl.textContent = 'Адрес не выбран';
        }
        
        this.updateConfirmButton(false);
        this.updateCheckoutButton(false);
        this.hideSuggestions();
        
        // Очищаем ошибки валидации
        this.clearValidationErrors();
        
        if (this.map) {
            this.map.geoObjects.removeAll();
        }
        
        // Сбрасываем второй шаг
        if (this.houseTypeToggle) {
            this.houseTypeToggle.checked = false;
        }
        
        if (this.apartmentInput) {
            this.apartmentInput.value = '';
        }
        
        if (this.floorInput) {
            this.floorInput.value = '';
        }
        
        if (this.entranceInput) {
            this.entranceInput.value = '';
        }
        
        if (this.intercomInput) {
            this.intercomInput.value = '';
        }
        
        if (this.courierCommentInput) {
            this.courierCommentInput.value = '';
        }
        
        if (this.charCounter) {
            this.charCounter.textContent = '0/300';
            this.charCounter.style.color = '#9D9D9D';
        }
        
        // Убираем обязательность полей
        this.setRequiredFields(['apartment', 'floor', 'entrance'], false);
        
        // Показываем первый шаг, скрываем второй
        if (this.step1) {
            this.step1.style.display = 'flex';
        }
        
        if (this.step2) {
            this.step2.style.display = 'none';
        }
        
        // Восстанавливаем заголовок
        this.updatePopupTitle('Укажите ваш адрес', 'Введите адрес или выберите точку на карте для расчета доступных слотов доставки.');
        
        // Показываем все поля формы
        this.toggleFormFields(true, ['apartment', 'floor', 'entrance', 'intercom']);
        
        // Восстанавливаем исходное отображение кнопки в корзине
        this.updateCartAddressDisplay();
    }
    
    // Сброс только UI при закрытии попапа (сохраняем данные)
    resetUI() {
        this.suggestions = [];
        this.currentStep = 1;
        
        this.hideSuggestions();
        
        // Очищаем ошибки валидации
        this.clearValidationErrors();
        
        // Показываем первый шаг, скрываем второй
        if (this.step1) {
            this.step1.style.display = 'flex';
        }
        
        if (this.step2) {
            this.step2.style.display = 'none';
        }
        
        // Восстанавливаем заголовок
        this.updatePopupTitle('Укажите ваш адрес', 'Введите адрес или выберите точку на карте для расчета доступных слотов доставки.');
        
        // Убираем обязательность полей
        this.setRequiredFields(['apartment', 'floor', 'entrance'], false);
        
        // Показываем все поля формы
        this.toggleFormFields(true, ['apartment', 'floor', 'entrance', 'intercom']);
    }
    
    // Восстановление сохраненных данных при открытии попапа
    restoreData() {
        // Если есть сохраненный адрес, восстанавливаем его
        if (this.selectedAddress && this.selectedCoordinates) {
            // Восстанавливаем поле ввода адреса
            if (this.addressInput) {
                this.addressInput.value = this.selectedAddress;
            }
            
            // Восстанавливаем отображение выбранного адреса
            if (this.selectedAddressEl) {
                this.selectedAddressEl.textContent = this.selectedAddress;
            }
            
            // Активируем кнопку подтверждения
            this.updateConfirmButton(true);
            
            // Если карта уже инициализирована, добавляем маркер
            if (this.map) {
                this.addMarker(this.selectedCoordinates, this.selectedAddress);
            }
            
            console.log('🔄 Восстановлены данные адреса:', this.selectedAddress);
        }
    }
    
    // Публичные методы для внешнего управления
    isOpen() {
        return this.popup?.classList.contains('active') || false;
    }
    
    forceClose() {
        if (this.isOpen()) {
            this.closePopup();
        }
    }
    
    // Получение выбранного адреса
    getSelectedAddress() {
        return {
            address: this.selectedAddress,
            coordinates: this.selectedCoordinates
        };
    }
    
    // ==================== НОВЫЕ ФУНКЦИИ ДЛЯ РАСЧЕТА ДОСТАВКИ ====================
    
    /**
     * Парсит даты из комментария товара
     * Ищет строки "Выбранные даты:", "Массив дат:", "Дата доставки:" и "ISO даты:" и извлекает даты
     */
    parseDatesFromComment(comment) {
        console.log('🔍 Парсинг дат из комментария:', comment);
        
        if (!comment || typeof comment !== 'string') {
            console.log('❌ Комментарий пустой или не строка');
            return [];
        }
        
        const dates = [];
        
        // Разбиваем комментарий на части по разделителю |
        const commentParts = comment.split('|');
        
        // Сначала ищем ISO даты (самый надежный формат)
        for (const part of commentParts) {
            const trimmedPart = part.trim();
            
            if (trimmedPart.includes('ISO даты:')) {
                const datePart = trimmedPart.split('ISO даты:')[1];
                if (datePart) {
                    // Убираем квадратные скобки
                    let dateString = datePart.trim().replace(/[\[\]]/g, '');
                    
                    // Разбиваем по запятым, если есть несколько дат
                    const datesList = dateString.split(',').map(d => d.trim());
                    
                    // Парсим ISO даты (формат YYYY-MM-DD)
                    const isoPattern = /(\d{4})-(\d{1,2})-(\d{1,2})/g;
                    
                    datesList.forEach(dateStr => {
                        const match = dateStr.match(isoPattern);
                        if (match) {
                            match.forEach(isoDate => {
                                if (!dates.includes(isoDate)) {
                                    dates.push(isoDate);
                                    console.log('✅ Найдена ISO дата:', isoDate);
                                }
                            });
                        }
                    });
                }
                
                // Если нашли ISO даты, возвращаем их и выходим
                if (dates.length > 0) {
                    console.log('📅 Найдены ISO даты в комментарии:', dates);
                    return dates.sort();
                }
            }
        }
        
        // Если ISO дат нет, парсим другие форматы
        const datePatterns = [
            /(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/gi,
            /(\d{1,2})\.(\d{1,2})\.(\d{4})/g,
            /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
            /(\d{4})-(\d{1,2})-(\d{1,2})/g
        ];
        
        const monthNames = {
            'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3, 'мая': 4, 'июня': 5,
            'июля': 6, 'августа': 7, 'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
        };
        
        for (const part of commentParts) {
            const trimmedPart = part.trim();
            
            // Ищем блоки с датами (включая товары для питомцев)
            if (trimmedPart.includes('Выбранные даты:') || trimmedPart.includes('Массив дат:') || trimmedPart.includes('Дата доставки:') || trimmedPart.includes('Даты доставки:')) {
                let datePart = null;
                
                if (trimmedPart.includes('Выбранные даты:')) {
                    datePart = trimmedPart.split('Выбранные даты:')[1];
                } else if (trimmedPart.includes('Массив дат:')) {
                    datePart = trimmedPart.split('Массив дат:')[1];
                } else if (trimmedPart.includes('Даты доставки:')) {
                    datePart = trimmedPart.split('Даты доставки:')[1];
                } else if (trimmedPart.includes('Дата доставки:')) {
                    datePart = trimmedPart.split('Дата доставки:')[1];
                }
                
                if (datePart) {
                    // Убираем квадратные скобки
                    let dateString = datePart.trim().replace(/[\[\]]/g, '');
                    
                    // Убираем время если оно есть в конце строки
                    if (dateString.includes(', время:')) {
                        dateString = dateString.split(', время:')[0].trim();
                    } else if (dateString.includes(',время:')) {
                        dateString = dateString.split(',время:')[0].trim();
                    }
                    
                    // Парсим даты из строки (может быть несколько через запятую)
                    for (let i = 0; i < datePatterns.length; i++) {
                        const pattern = datePatterns[i];
                        let match;
                        
                        while ((match = pattern.exec(dateString)) !== null) {
                            let parsedDate = null;
                            
                            if (i === 0) {
                                // Формат "19 марта"
                                const day = parseInt(match[1]);
                                const monthName = match[2].toLowerCase();
                                const month = monthNames[monthName];
                                if (month !== undefined) {
                                    const currentYear = new Date().getFullYear();
                                    parsedDate = new Date(currentYear, month, day);
                                }
                            } else if (i === 1) {
                                // Формат "19.03.2024"
                                const day = parseInt(match[1]);
                                const month = parseInt(match[2]) - 1;
                                const year = parseInt(match[3]);
                                parsedDate = new Date(year, month, day);
                            } else if (i === 2) {
                                // Формат "19/03/2024"
                                const day = parseInt(match[1]);
                                const month = parseInt(match[2]) - 1;
                                const year = parseInt(match[3]);
                                parsedDate = new Date(year, month, day);
                            } else if (i === 3) {
                                // Формат "2024-03-19"
                                const year = parseInt(match[1]);
                                const month = parseInt(match[2]) - 1;
                                const day = parseInt(match[3]);
                                parsedDate = new Date(year, month, day);
                            }
                            
                            if (parsedDate && !isNaN(parsedDate.getTime())) {
                                // Приводим к формату YYYY-MM-DD для уникальности
                                const dateKey = parsedDate.toISOString().split('T')[0];
                                if (!dates.includes(dateKey)) {
                                    dates.push(dateKey);
                                }
                            }
                        }
                    }
                }
            }
        }
        
        console.log('📅 Найдены даты в комментарии:', dates);
        return dates.sort();
    }
    
    /**
     * Получает все уникальные даты доставки из всех товаров в корзине
     */
    getAllUniqueDeliveryDates() {
        if (!this.virtualCart || !this.virtualCart.items) {
            console.log('❌ Виртуальная корзина или товары не найдены');
            return [];
        }
        
        console.log('🔍 Анализируем товары в корзине:', this.virtualCart.items.length, 'товаров');
        
        const allDates = new Set();
        
        this.virtualCart.items.forEach((item, index) => {
            // Получаем комментарий из DOM, если его нет в виртуальной корзине
            let comment = item.comment;
            if (!comment) {
                console.log(`🔍 Ищем комментарий в DOM для товара "${item.title}" (ID: ${item.id})`);
                comment = this.getCommentFromDOM(item);
                console.log(`📝 Получен комментарий из DOM для товара ${index + 1}:`, comment);
            }
            
            console.log(`📦 Товар ${index + 1}:`, {
                title: item.title,
                comment: comment,
                hasComment: !!comment,
                itemId: item.id,
                hasId: !!item.id
            });
            
            if (comment) {
                const dates = this.parseDatesFromComment(comment);
                console.log(`📅 Найдены даты в товаре ${index + 1}:`, dates);
                dates.forEach(date => allDates.add(date));
            } else {
                console.log(`❌ У товара ${index + 1} нет комментария`);
            }
        });
        
        const uniqueDates = Array.from(allDates).sort();
        console.log('📅 Все уникальные даты доставки:', uniqueDates);
        return uniqueDates;
    }
    
    /**
     * Получает комментарий товара из DOM элементов корзины
     */
    getCommentFromDOM(item) {
        if (!item) {
            return null;
        }
        
        let cartItem = null;
        
        // Сначала пытаемся найти по ID, если он есть
        if (item.id) {
            cartItem = document.querySelector(`[data-item-id="${item.id}"]`);
        }
        
        // Если не найден по ID, ищем по названию товара
        if (!cartItem && item.title) {
            cartItem = this.findCartItemInDOM(item);
        }
        
        if (!cartItem) {
            console.log(`❌ Не найден элемент корзины для товара "${item.title}" (ID: ${item.id})`);
            return null;
        }
        
        // Сначала ищем по атрибуту data-comment у .cart-item
        const commentAttr = cartItem.getAttribute('data-comment');
        if (commentAttr) {
            console.log(`✅ Найден комментарий в атрибуте data-comment для товара "${item.title}":`, commentAttr);
            return commentAttr;
        }
        
        // Затем ищем в поле input с data-comment
        const commentInput = cartItem.querySelector('input[data-comment]');
        if (commentInput && commentInput.value) {
            console.log(`✅ Найден комментарий в input[data-comment] для товара "${item.title}":`, commentInput.value);
            return commentInput.value;
        }
        
        console.log(`❌ Комментарий не найден в DOM для товара "${item.title}"`);
        console.log(`🔍 Проверяемые элементы:`, {
            cartItem: cartItem,
            hasDataComment: cartItem.hasAttribute('data-comment'),
            dataCommentValue: cartItem.getAttribute('data-comment'),
            commentInput: commentInput,
            inputValue: commentInput?.value
        });
        return null;
    }
    
    /**
     * Вычисляет стоимость товаров для конкретной даты
     */
    calculateItemsCostForDate(date) {
        if (!this.virtualCart || !this.virtualCart.items) {
            return 0;
        }
        
        let totalCost = 0;
        
        this.virtualCart.items.forEach(item => {
            // Получаем комментарий из DOM, если его нет в виртуальной корзине
            let comment = item.comment;
            if (!comment) {
                comment = this.getCommentFromDOM(item);
            }
            
            if (!comment) return;
            
            const itemDates = this.parseDatesFromComment(comment);
            
            // Если товар доставляется в эту дату
            if (itemDates.includes(date)) {
                console.log(`📦 Товар "${item.title}" доставляется в ${date}`);
                
                // Проверяем, является ли товар программой питания
                const isProgram = this.isProgramItem(item);
                
                // Проверяем, является ли товар рационом для питомцев
                const isPetsItem = comment && comment.includes('pets-id:');
                
                if (isPetsItem) {
                    // Для товаров питомцев: вся стоимость в один день доставки
                    const itemTotalPrice = item.total_price || 0;
                    console.log(`🐾 Товар для питомцев "${item.title}": ${itemTotalPrice} ₽ (полная стоимость в один день)`);
                    totalCost += itemTotalPrice;
                } else if (isProgram) {
                    // Для программ: цена программы в день
                    const dailyPrice = this.getProgramDailyPrice(item);
                    console.log(`💰 Программа "${item.title}": ${dailyPrice} ₽/день`);
                    totalCost += dailyPrice;
                } else {
                    // Для обычных товаров: цена за штуку × количество в день
                    const dailyQuantity = this.getDailyQuantity(item);
                    const totalPrice = this.getRealItemPrice(item);
                    const totalQuantity = item.quantity || 1;
                    const pricePerUnit = totalPrice / totalQuantity;
                    const itemCost = pricePerUnit * dailyQuantity;
                    console.log(`💰 Товар "${item.title}": ${totalPrice} ₽ (за ${totalQuantity} шт) ÷ ${totalQuantity} = ${pricePerUnit} ₽/шт × ${dailyQuantity} шт = ${itemCost} ₽`);
                    totalCost += itemCost;
                }
            }
        });
        
        console.log(`💰 Стоимость товаров на ${date}: ${totalCost} ₽`);
        return totalCost;
    }
    
    /**
     * Проверяет, является ли товар программой питания
     */
    isProgramItem(item) {
        // Сначала проверяем, не товар ли это для питомцев
        let comment = item.comment || '';
        if (!comment) {
            comment = this.getCommentFromDOM(item) || '';
        }
        
        // Если в комментарии есть pets-id, это товар для питомцев, а НЕ программа
        if (comment && comment.includes('pets-id:')) {
            console.log(`🐾 Товар "${item.title}" это рацион для питомцев, НЕ программа`);
            return false;
        }
        
        // Проверяем по названию - если это рацион для питомцев
        const itemTitle = item.title ? item.title.toLowerCase() : '';
        const petsKeywords = ['рацион для собак', 'рацион для кошек', 'рацион для щенков', 'рацион для котят', 'для взрослых собак', 'для взрослых кошек'];
        
        for (const keyword of petsKeywords) {
            if (itemTitle.includes(keyword)) {
                console.log(`🐾 Товар "${item.title}" это рацион для питомцев (по названию), НЕ программа`);
                return false;
            }
        }
        
        // Проверяем по canonical_collection
        if (item.canonical_collection && item.canonical_collection.includes('program')) {
            return true;
        }
        
        // Дополнительная проверка по названию программы (на случай, если canonical_collection не работает)
        const programNames = ['старт', 'база', 'премиум', 'комфорт', 'спорт', 'детокс', 'перезагрузка'];
        
        for (const programName of programNames) {
            if (itemTitle.includes(programName)) {
                console.log(`✅ Товар "${item.title}" определен как программа по названию`);
                return true;
            }
        }
        
        console.log(`❌ Товар "${item.title}" не является программой`);
        return false;
    }
    
    /**
     * Находит элемент товара в DOM по названию
     */
    findCartItemInDOM(item) {
        if (!item || !item.title) {
            return null;
        }
        
        // Сначала пытаемся найти по ID, если он есть
        if (item.id) {
            const cartItem = document.querySelector(`[data-item-id="${item.id}"]`);
            if (cartItem) {
                return cartItem;
            }
        }
        
        // Если не найден по ID, ищем по названию товара
        console.log(`🔍 Ищем товар "${item.title}" по названию в DOM...`);
        const allCartItems = document.querySelectorAll('.cart-item');
        console.log(`🔍 Найдено элементов .cart-item в DOM: ${allCartItems.length}`);
        
        let bestMatch = null;
        let bestMatchLength = 0;
        
        for (let i = 0; i < allCartItems.length; i++) {
            const element = allCartItems[i];
            const titleElement = element.querySelector('.cart-item-title');
            const titleText = titleElement ? titleElement.textContent.trim() : 'Нет заголовка';
            console.log(`🔍 Элемент ${i + 1}: "${titleText}"`);
            
            if (titleElement) {
                const domTitle = titleElement.textContent.trim();
                const virtualTitle = item.title.trim();
                
                // Точное совпадение - сразу возвращаем
                if (domTitle === virtualTitle) {
                    console.log(`✅ Найден товар "${item.title}" в DOM (точное совпадение)`);
                    return element;
                }
                
                // Частичное совпадение - ищем самое длинное
                if (domTitle.includes(virtualTitle) || virtualTitle.includes(domTitle)) {
                    const matchLength = Math.min(domTitle.length, virtualTitle.length);
                    if (matchLength > bestMatchLength) {
                        bestMatch = element;
                        bestMatchLength = matchLength;
                        console.log(`🔍 Кандидат на совпадение (длина ${matchLength}): "${domTitle}"`);
                    }
                }
            }
        }
        
        // Если нашли частичное совпадение, возвращаем лучшее
        if (bestMatch) {
            const bestTitle = bestMatch.querySelector('.cart-item-title')?.textContent.trim();
            console.log(`✅ Найден товар "${item.title}" в DOM (лучшее совпадение: "${bestTitle}")`);
            return bestMatch;
        }
        
        console.log(`❌ Не найден элемент корзины для товара "${item.title}"`);
        console.log(`🔍 Ищем похожие названия...`);
        
        // Попробуем найти частичное совпадение
        for (let i = 0; i < allCartItems.length; i++) {
            const element = allCartItems[i];
            const titleElement = element.querySelector('.cart-item-title');
            if (titleElement) {
                const titleText = titleElement.textContent.trim();
                if (titleText.includes('База') || item.title.includes('База')) {
                    console.log(`🔍 Найдено частичное совпадение: "${titleText}" vs "${item.title}"`);
                }
            }
        }
        
        return null;
    }
    
    /**
     * Получает реальную цену товара из DOM или виртуальной корзины
     */
    getRealItemPrice(item) {
        // Сначала пытаемся получить цену из виртуальной корзины
        if (item.price && item.price > 0) {
            return item.price;
        }
        
        // Если цена в виртуальной корзине неверная, ищем в DOM
        const cartItem = this.findCartItemInDOM(item);
        if (cartItem) {
            // Ищем элемент с ценой в DOM
            const priceElement = cartItem.querySelector('.price-amount');
            if (priceElement) {
                const priceText = priceElement.textContent || '';
                const price = this.parsePriceFromText(priceText);
                if (price > 0) {
                    console.log(`💰 Найдена цена в DOM для товара "${item.title}": ${price} ₽`);
                    return price;
                }
            }
        }
        
        console.log(`❌ Не удалось найти цену для товара "${item.title}"`);
        return 0;
    }
    
    /**
     * Парсит цену из текста (убирает валюту и пробелы)
     */
    parsePriceFromText(priceText) {
        if (!priceText) return 0;
        
        // Убираем все кроме цифр и запятых/точек
        const cleanPrice = priceText.replace(/[^\d,.]/g, '');
        
        // Заменяем запятую на точку для корректного парсинга
        const normalizedPrice = cleanPrice.replace(',', '.');
        
        const price = parseFloat(normalizedPrice);
        return isNaN(price) ? 0 : price;
    }
    
    /**
     * Получает дневную стоимость программы
     */
    getProgramDailyPrice(item) {
        // Логика получения дневной стоимости программы
        // Может быть в комментарии или вычисляться из общей стоимости
        let comment = item.comment || '';
        
        // Если комментария нет в item, получаем из DOM
        if (!comment) {
            comment = this.getCommentFromDOM(item) || '';
        }
        
        // Пытаемся найти информацию о дневной стоимости в комментарии
        const commentParts = comment.split('|');
        for (const part of commentParts) {
            if (part.includes('Цена в день:')) {
                const pricePart = part.split('Цена в день:')[1];
                if (pricePart) {
                    const price = parseInt(pricePart.trim());
                    if (!isNaN(price)) {
                        console.log(`💰 Цена программы "${item.title}" из комментария: ${price} ₽/день`);
                        return price;
                    }
                }
            }
        }
        
        // Если не найдено в комментарии, вычисляем из общей стоимости
        // ВАЖНО: Используем total_price из виртуальной корзины, а не цену из DOM
        const totalPrice = item.total_price || 0;
        const quantity = item.quantity || 1;
        
        if (totalPrice > 0) {
            const calculatedPrice = totalPrice / quantity;
            console.log(`💰 Расчет цены программы "${item.title}": ${totalPrice} ₽ (total_price) / ${quantity} дней = ${calculatedPrice} ₽/день`);
            return calculatedPrice;
        }
        
        // Запасной вариант: если total_price отсутствует, используем getRealItemPrice
        const fallbackPrice = this.getRealItemPrice(item);
        const fallbackCalculated = fallbackPrice / quantity;
        console.log(`⚠️ Расчет цены программы "${item.title}" (запасной): ${fallbackPrice} ₽ / ${quantity} дней = ${fallbackCalculated} ₽/день`);
        return fallbackCalculated;
    }
    
    /**
     * Получает количество товара в день
     */
    getDailyQuantity(item) {
        let comment = item.comment || '';
        
        // Если комментария нет в item, получаем из DOM
        if (!comment) {
            comment = this.getCommentFromDOM(item) || '';
        }
        
        // Ищем информацию о количестве в день
        const commentParts = comment.split('|');
        for (const part of commentParts) {
            if (part.includes('Количество в день:')) {
                const quantityPart = part.split('Количество в день:')[1];
                if (quantityPart) {
                    const quantity = parseInt(quantityPart.trim());
                    if (!isNaN(quantity)) {
                        return quantity;
                    }
                }
            }
        }
        
        // По умолчанию возвращаем 1
        console.log(`📦 Количество в день для товара "${item.title}": 1 шт (по умолчанию)`);
        return 1;
    }
    
    /**
     * Новая функция расчета доставки по зонам
     */
    calculateDeliveryByZone(deliveryZone, deliveryTime) {
        console.log('🚚 Расчет доставки для зоны:', deliveryZone, 'время:', deliveryTime);
        
        // Получаем все уникальные даты доставки
        const uniqueDates = this.getAllUniqueDeliveryDates();
        
        if (uniqueDates.length === 0) {
            console.log('❌ Нет дат доставки в корзине');
            return {
                product: null,
                isFree: false,
                quantity: 0,
                zone: deliveryZone,
                paidDays: 0,
                freeDays: 0
            };
        }
        
        console.log('📅 Уникальные даты доставки:', uniqueDates);
        
        // Логика для зон "Сити 1" и "Сити 2"
        if (deliveryZone === 'Сити 1' || deliveryZone === 'Сити 2') {
            return this.calculateCityZoneDelivery(deliveryZone, deliveryTime, uniqueDates);
        }
        
        // Логика для зон МКАД
        if (deliveryZone === 'Курьером в пределах МКАД' || deliveryZone === 'МКАД + 35 км' || deliveryZone === 'Курьером за МКАД') {
            return this.calculateMKADZoneDelivery(deliveryZone, uniqueDates);
        }
        
        console.log('❌ Неизвестная зона доставки:', deliveryZone);
        return {
            product: null,
            isFree: false,
            quantity: 0,
            zone: deliveryZone,
            paidDays: 0,
            freeDays: 0
        };
    }
    
    /**
     * Расчет доставки для зон "Сити 1" и "Сити 2"
     * Стоимость = количество уникальных дат × стоимость доставки в день
     */
    calculateCityZoneDelivery(deliveryZone, deliveryTime, uniqueDates) {
        console.log('🏢 Расчет для зон Сити:', deliveryZone);
        
        if (deliveryZone === 'Сити 1') {
            const deliveryProduct = this.findDeliveryProductByTitle('Сити 1');
            const quantity = uniqueDates.length;
            
            console.log('🏢 Результат для Сити 1:', {
                product: deliveryProduct?.title,
                quantity: quantity,
                totalPrice: deliveryProduct ? deliveryProduct.price * quantity : 0
            });
            
            return {
                product: deliveryProduct,
                isFree: false,
                quantity: quantity,
                zone: deliveryZone,
                paidDays: quantity,
                freeDays: 0
            };
        } else if (deliveryZone === 'Сити 2') {
            // Для Сити 2 анализируем каждый день отдельно
            const deliveryDays = {
                'before_7am': [],
                'after_7am': []
            };
            
            console.log('🏢 Анализируем время доставки для каждого дня...');
            
            // Определяем время для каждого дня
            uniqueDates.forEach(date => {
                const timeForDate = this.getDeliveryTimeForDate(date);
                deliveryDays[timeForDate].push(date);
                console.log(`📅 ${date}: ${timeForDate}`);
            });
            
            // Определяем какого товара больше
            const before7Count = deliveryDays['before_7am'].length;
            const after7Count = deliveryDays['after_7am'].length;
            
            console.log('🏢 Распределение дней:', {
                before_7am: before7Count,
                after_7am: after7Count
            });
            
            // Берем тот вариант, которого больше дней
            const primaryTime = before7Count > after7Count ? 'before_7am' : 'after_7am';
            const productTitle = primaryTime === 'before_7am' ? 
                'Сити 2 до 7 утра' : 'Сити 2 после 7 утра';
            
            const deliveryProduct = this.findDeliveryProductByTitle(productTitle);
            const quantity = uniqueDates.length;
            
            console.log('🏢 Результат для Сити 2:', {
                product: productTitle,
                quantity: quantity,
                totalPrice: deliveryProduct ? deliveryProduct.price * quantity : 0,
                selectedTime: primaryTime,
                reason: `${primaryTime === 'before_7am' ? before7Count : after7Count} дней из ${quantity}`
            });
            
            return {
                product: deliveryProduct,
                isFree: false,
                quantity: quantity,
                zone: deliveryZone,
                paidDays: quantity,
                freeDays: 0
            };
        }
    }
    
    /**
     * Расчет доставки для зон МКАД
     * Анализирует каждый день отдельно: если сумма >= 3000, то день бесплатный
     */
    calculateMKADZoneDelivery(deliveryZone, uniqueDates) {
        console.log('🚛 Расчет для зон МКАД:', deliveryZone);
        
        const paidDays = [];
        const freeDays = [];
        
        // Анализируем каждый уникальный день
        uniqueDates.forEach(date => {
            const dayCost = this.calculateItemsCostForDate(date);
            
            if (dayCost >= 3000) {
                freeDays.push(date);
                console.log(`✅ ${date}: бесплатная доставка (${dayCost} ₽ >= 3000)`);
            } else {
                paidDays.push(date);
                console.log(`💰 ${date}: платная доставка (${dayCost} ₽ < 3000)`);
            }
        });
        
        console.log('🚛 Результат анализа дней:', {
            paidDays: paidDays,
            freeDays: freeDays,
            totalPaidDays: paidDays.length,
            totalFreeDays: freeDays.length
        });
        
        // Если все дни бесплатные
        if (paidDays.length === 0) {
            return {
                product: null,
                isFree: true,
                quantity: 0,
                zone: deliveryZone,
                paidDays: 0,
                freeDays: freeDays.length
            };
        }
        
        // Находим товар доставки для платных дней
        const productTitle = deliveryZone === 'Курьером в пределах МКАД' ? 
            'Курьером в пределах МКАД' : 'Курьером за МКАД';
        const deliveryProduct = this.findDeliveryProductByTitle(productTitle);
        
        return {
            product: deliveryProduct,
            isFree: false,
            quantity: paidDays.length, // Количество платных дней
            zone: deliveryZone,
            paidDays: paidDays.length,
            freeDays: freeDays.length
        };
    }
}

// Инициализируем менеджер попапа
const addressPopupManager = new AddressPopupManager();

// Делаем менеджер глобально доступным
window.addressPopupManager = addressPopupManager;

// Функция для тестирования обновления комментария
window.testUpdateComment = function() {
    console.log('🧪 Тестирование обновления комментария...');
    
    // Находим поля комментариев
    const commentInputs = document.querySelectorAll('input[data-comment]');
    console.log('🔍 Найдено полей с data-comment:', commentInputs.length);
    
    const altInputs = document.querySelectorAll('input[name*="order_line_comments"]');
    console.log('🔍 Найдено полей с order_line_comments:', altInputs.length);
    
    // Тестовые данные
    const testData = {
        address: 'Тестовый адрес, д. 1',
        coordinates: [55.7558, 37.6176],
        houseType: 'apartment',
        apartment: '10',
        floor: '5',
        entrance: '2',
        intercom: '123',
        comment: 'Тестовый комментарий'
    };
    
    if (window.addressPopupManager) {
        console.log('📝 Вызываем updateOrderComment с тестовыми данными...');
        window.addressPopupManager.updateOrderComment(testData);
    } else {
        console.error('❌ addressPopupManager не найден!');
    }
};

// Функция для проверки полей комментариев
window.checkCommentFields = function() {
    console.log('🔍 Проверка полей комментариев...');
    
    const commentInputs = document.querySelectorAll('input[data-comment]');
    console.log('📝 Поля с data-comment:', commentInputs.length);
    commentInputs.forEach((input, index) => {
        console.log(`  ${index + 1}. name: ${input.name}, value: "${input.value}"`);
    });
    
    const altInputs = document.querySelectorAll('input[name*="order_line_comments"]');
    console.log('📝 Поля с order_line_comments:', altInputs.length);
    altInputs.forEach((input, index) => {
        console.log(`  ${index + 1}. name: ${input.name}, value: "${input.value}"`);
    });
};

// Функция для ручной очистки адресов доставки
window.cleanDeliveryAddresses = function() {
    console.log('🧹 Ручная очистка адресов доставки...');
    
    if (window.addressPopupManager) {
        window.addressPopupManager.cleanDeliveryAddressesOnLoad();
    } else {
        console.error('❌ addressPopupManager не найден!');
    }
};

// Функция для тестирования поиска товара доставки
window.testDeliveryProductSearch = function(zoneName) {
    console.log('🧪 Тестирование поиска товара доставки для зоны:', zoneName);
    
    if (window.addressPopupManager) {
        const product = window.addressPopupManager.findDeliveryProductByZone(zoneName);
        if (product) {
            console.log('✅ Товар найден:', product);
        } else {
            console.log('❌ Товар не найден');
        }
        return product;
    } else {
        console.error('❌ addressPopupManager не найден!');
        return null;
    }
};

// Функция для проверки доступных товаров доставки
window.checkDeliveryProducts = function() {
    console.log('🔍 Проверка доступных товаров доставки...');
    
    if (window.dostavkaProducts && window.dostavkaProducts.products) {
        console.log('📦 Всего товаров доставки:', window.dostavkaProducts.products.length);
        console.log('📋 Список товаров:');
        window.dostavkaProducts.products.forEach((product, index) => {
            console.log(`  ${index + 1}. "${product.title}" - ${product.price_formatted} (ID: ${product.id})`);
        });
    } else {
        console.error('❌ window.dostavkaProducts не найден!');
    }
};

// Функция для детальной проверки состояния window.dostavkaProducts
window.debugDostavkaProducts = function() {
    console.log('🔍 Детальная проверка window.dostavkaProducts...');
    
    console.log('🌐 window.dostavkaProducts существует:', !!window.dostavkaProducts);
    
    if (window.dostavkaProducts) {
        console.log('📦 Тип window.dostavkaProducts:', typeof window.dostavkaProducts);
        console.log('📦 Содержимое window.dostavkaProducts:', window.dostavkaProducts);
        
        if (window.dostavkaProducts.products) {
            console.log('📋 products существует:', !!window.dostavkaProducts.products);
            console.log('📋 Тип products:', typeof window.dostavkaProducts.products);
            console.log('📋 products является массивом:', Array.isArray(window.dostavkaProducts.products));
            console.log('📋 Количество products:', window.dostavkaProducts.products.length);
        } else {
            console.log('❌ products не существует');
        }
    }
    
    // Проверяем все глобальные переменные с dostavka
    const dostavkaKeys = Object.keys(window).filter(key => key.toLowerCase().includes('dostavka'));
    console.log('🔍 Глобальные переменные с dostavka:', dostavkaKeys);
    
    dostavkaKeys.forEach(key => {
        console.log(`  ${key}:`, window[key]);
    });
};

// Функция для ожидания загрузки window.dostavkaProducts
window.waitForDostavkaProducts = function() {
    console.log('⏳ Ожидание загрузки window.dostavkaProducts...');
    
    if (window.addressPopupManager) {
        return window.addressPopupManager.waitForDostavkaProducts();
    } else {
        console.error('❌ addressPopupManager не найден!');
        return Promise.reject('addressPopupManager не найден');
    }
};

// Функция для тестирования расчета доставки
window.testDeliveryCalculation = function(zoneName) {
    console.log('🧪 Тестирование расчета доставки для зоны:', zoneName);
    
    if (window.addressPopupManager) {
        const deliveryInfo = window.addressPopupManager.determineDeliveryProduct(zoneName);
        console.log('📊 Результат расчета доставки:', deliveryInfo);
        return deliveryInfo;
    } else {
        console.error('❌ addressPopupManager не найден!');
        return null;
    }
};

// Функция для получения информации о корзине
window.getCartInfo = function() {
    console.log('🛒 Информация о корзине:');
    
    if (window.addressPopupManager) {
        const cartTotal = window.addressPopupManager.getCartTotal();
        const programDays = window.addressPopupManager.getProgramDaysCount();
        const deliveryTime = window.addressPopupManager.getProgramDeliveryTime();
        
        console.log('💰 Общая сумма корзины:', cartTotal);
        console.log('📅 Количество дней программ:', programDays);
        console.log('🕐 Время доставки:', deliveryTime);
        
        return {
            cartTotal: cartTotal,
            programDays: programDays,
            deliveryTime: deliveryTime
        };
    } else {
        console.error('❌ addressPopupManager не найден!');
        return null;
    }
};

// Функция для тестирования добавления товара доставки
window.testAddDeliveryProduct = function(zoneName) {
    console.log('🧪 Тестирование добавления товара доставки для зоны:', zoneName);
    
    if (window.addressPopupManager) {
        return window.addressPopupManager.handleDeliverySelection(zoneName);
    } else {
        console.error('❌ addressPopupManager не найден!');
        return null;
    }
};

// Функция для обновления корзины
window.refreshCart = function() {
    console.log('🔄 Ручное обновление корзины...');
    
    if (window.addressPopupManager) {
        return window.addressPopupManager.refreshCart();
    } else {
        console.error('❌ addressPopupManager не найден!');
        return null;
    }
};

// Функция для обновления итоговой суммы в .total-price
window.updateTotalPrice = function() {
    console.log('💰 Ручное обновление итоговой суммы...');
    
    if (window.addressPopupManager && window.addressPopupManager.virtualCart) {
        const cartData = window.addressPopupManager.virtualCart;
        const totalPriceElement = document.querySelector('.total-price');
        
        if (totalPriceElement && cartData.total_price) {
            const formattedPrice = cartData.total_price_formatted || `${cartData.total_price} ₽`;
            totalPriceElement.textContent = formattedPrice;
            console.log('✅ Итоговая сумма обновлена в .total-price:', formattedPrice);
            return formattedPrice;
        } else {
            console.warn('⚠️ Элемент .total-price не найден или нет данных о цене');
            return null;
        }
    } else {
        console.error('❌ addressPopupManager или виртуальная корзина не найдены!');
        return null;
    }
};

// Функция для проверки всех элементов с итоговой суммой
window.checkTotalPriceElements = function() {
    console.log('🔍 Проверка всех элементов с итоговой суммой...');
    
    const selectors = [
        '.total-price',
        '[data-cart-total-price]',
        '[data-cart-full-total-price]',
        '[data-cart-item-count]',
        '#cart-total-price',
        '.cart-total',
        '.total-sum',
        '.final-price'
    ];
    
    selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        console.log(`🔍 Селектор "${selector}": найдено ${elements.length} элементов`);
        
        elements.forEach((element, index) => {
            console.log(`   ${index + 1}. Текст: "${element.textContent}"`);
            console.log(`      Элемент:`, element);
        });
    });
    
    if (window.addressPopupManager && window.addressPopupManager.virtualCart) {
        const cartData = window.addressPopupManager.virtualCart;
        console.log('💰 Текущая сумма в виртуальной корзине:', cartData.total_price);
        console.log('💰 Форматированная сумма:', cartData.total_price_formatted);
    }
};

// Функция для тестирования наблюдателя корзины
window.testCartObserver = function() {
    console.log('🧪 Тестирование наблюдателя корзины...');
    
    if (window.addressPopupManager) {
        // Принудительно вызываем обработчик изменений
        window.addressPopupManager.handleCartTotalPriceChange();
        
        // Проверяем стоимость доставки
        const deliveryPrice = window.addressPopupManager.calculateCurrentDeliveryPrice();
        console.log('🚚 Текущая стоимость доставки:', deliveryPrice);
        
        return deliveryPrice;
    } else {
        console.error('❌ addressPopupManager не найден!');
        return null;
    }
};

// Функция для ручного обновления #cart-total-price
window.updateCartTotalPrice = function() {
    console.log('💰 Ручное обновление #cart-total-price...');
    
    if (window.addressPopupManager) {
        window.addressPopupManager.handleCartTotalPriceChange();
    } else {
        console.error('❌ addressPopupManager не найден!');
    }
};

// Функция для проверки содержимого data-cart-total-price
window.checkCartTotalPriceContent = function() {
    console.log('🔍 Проверка содержимого data-cart-total-price...');
    
    const cartTotalPriceElement = document.querySelector('[data-cart-total-price]');
    if (!cartTotalPriceElement) {
        console.error('❌ Элемент [data-cart-total-price] не найден!');
        return null;
    }
    
    const content = cartTotalPriceElement.textContent;
    console.log('📊 Содержимое элемента:', content);
    console.log('📊 Тип:', typeof content);
    console.log('📊 Длина:', content.length);
    console.log('📊 Коды символов:', Array.from(content).map(char => char.charCodeAt(0)));
    
    // Пробуем разные способы извлечения числа
    const methods = [
        { name: 'Число с валютой (₽$€)', regex: /(\d+(?:\s\d+)*)\s*[₽$€]/ },
        { name: 'Только цифры', regex: /\d+/ },
        { name: 'Числа с пробелами', regex: /(\d+(?:\s\d+)*)/ },
        { name: 'Цифры и пробелы', regex: /[\d\s]+/ },
        { name: 'Цифры, пробелы, запятые', regex: /[\d\s,]+/ },
        { name: 'Цифры и точки', regex: /[\d.]+/ },
        { name: 'Все символы кроме букв', regex: /[^\w]+/ }
    ];
    
    methods.forEach(method => {
        const match = content.match(method.regex);
        if (match) {
            console.log(`🔍 ${method.name}:`, match[0]);
        } else {
            console.log(`❌ ${method.name}: не найдено`);
        }
    });
    
    return content;
};

// Функция для тестирования извлечения числа из конкретного текста
window.testNumberExtraction = function(text) {
    console.log('🧪 Тестирование извлечения числа из текста:', text);
    
    const methods = [
        { name: 'Число с валютой (₽$€)', regex: /(\d+(?:\s\d+)*)\s*[₽$€]/ },
        { name: 'Только цифры', regex: /\d+/ },
        { name: 'Числа с пробелами', regex: /(\d+(?:\s\d+)*)/ },
        { name: 'Цифры и пробелы', regex: /[\d\s]+/ },
        { name: 'Цифры, пробелы, запятые', regex: /[\d\s,]+/ }
    ];
    
    methods.forEach(method => {
        const match = text.match(method.regex);
        if (match) {
            let extractedNumber = null;
            if (method.regex.source.includes('(')) {
                // Если есть группы захвата, берем первую группу
                extractedNumber = match[1] ? parseInt(match[1].replace(/\s/g, '')) : parseInt(match[0].replace(/\s/g, ''));
            } else {
                extractedNumber = parseInt(match[0].replace(/\s/g, ''));
            }
            console.log(`✅ ${method.name}: "${match[0]}" -> ${extractedNumber}`);
        } else {
            console.log(`❌ ${method.name}: не найдено`);
        }
    });
};

// Функция для проверки структуры товаров в виртуальной корзине
window.checkVirtualCartItems = function() {
    console.log('🔍 Проверка структуры товаров в виртуальной корзине...');
    
    if (!window.addressPopupManager || !window.addressPopupManager.virtualCart) {
        console.error('❌ Виртуальная корзина недоступна!');
        return;
    }
    
    const cart = window.addressPopupManager.virtualCart;
    console.log('📊 Всего товаров в виртуальной корзине:', cart.items.length);
    
    cart.items.forEach((item, index) => {
        console.log(`📦 Товар ${index + 1}:`);
        console.log(`   - variant_id: ${item.variant_id}`);
        console.log(`   - product_id: ${item.product_id}`);
        console.log(`   - title: ${item.title}`);
        console.log(`   - quantity: ${item.quantity}`);
        console.log(`   - price: ${item.price}`);
        console.log(`   - total_price: ${item.total_price}`);
        console.log(`   - line_price: ${item.line_price}`);
        console.log(`   - amount: ${item.amount}`);
        console.log(`   - Все поля:`, Object.keys(item));
        console.log(`   - Полный объект:`, item);
    });
    
    // Проверяем товары доставки отдельно
    if (window.dostavkaProducts && window.dostavkaProducts.products) {
        const deliveryVariantIds = [];
        window.dostavkaProducts.products.forEach(product => {
            if (product.variants && product.variants.length > 0) {
                product.variants.forEach(variant => {
                    deliveryVariantIds.push(variant.id);
                });
            }
        });
        
        console.log('🚚 ID товаров доставки:', deliveryVariantIds);
        
        const deliveryItems = cart.items.filter(item => deliveryVariantIds.includes(item.variant_id));
        console.log('🚚 Товары доставки в корзине:', deliveryItems.length);
        
        deliveryItems.forEach((item, index) => {
            console.log(`🚚 Товар доставки ${index + 1}:`);
            console.log(`   - variant_id: ${item.variant_id}`);
            console.log(`   - title: ${item.title}`);
            console.log(`   - quantity: ${item.quantity}`);
            console.log(`   - price: ${item.price}`);
            console.log(`   - total_price: ${item.total_price}`);
            console.log(`   - line_price: ${item.line_price}`);
            console.log(`   - amount: ${item.amount}`);
        });
    }
};

// Функция для ручного удаления товаров доставки из корзины
window.removeDeliveryProducts = function() {
    console.log('🗑️ Ручное удаление товаров доставки из корзины...');
    
    if (window.addressPopupManager) {
        return window.addressPopupManager.removeDeliveryProductsFromCart();
    } else {
        console.error('❌ addressPopupManager не найден!');
        return null;
    }
};

// Функция для тестирования удаления существующих товаров доставки (при смене зоны)
window.removeExistingDeliveryProducts = function() {
    console.log('🗑️ Тестирование удаления существующих товаров доставки...');
    
    if (window.addressPopupManager) {
        return window.addressPopupManager.removeExistingDeliveryProducts();
    } else {
        console.error('❌ addressPopupManager не найден!');
        return null;
    }
};

// Функция для тестирования полного процесса смены зоны доставки
window.testDeliveryZoneChange = function(zoneName) {
    console.log('🧪 Тестирование смены зоны доставки на:', zoneName);
    
    if (window.addressPopupManager) {
        return window.addressPopupManager.handleDeliverySelection(zoneName);
    } else {
        console.error('❌ addressPopupManager не найден!');
        return null;
    }
};

// Функция для тестирования отображения доставки
window.testDeliveryDisplay = function() {
    console.log('🧪 Тестирование отображения доставки...');
    
    if (window.addressPopupManager) {
        // Проверяем элементы
        const deliveryPriceElement = document.getElementById('delivery-price');
        const cartTotalPriceElement = document.getElementById('cart-total-price');
        const totalPriceElement = document.querySelector('[data-cart-full-total-price]');
        
        console.log('📊 Элементы доставки:');
        console.log('- #delivery-price:', deliveryPriceElement?.textContent || 'не найден');
        console.log('- #cart-total-price:', cartTotalPriceElement?.textContent || 'не найден');
        console.log('- [data-cart-full-total-price]:', totalPriceElement?.textContent || 'не найден');
        
        // Проверяем виртуальную корзину
        if (window.addressPopupManager.virtualCart) {
            console.log('🛒 Виртуальная корзина:', window.addressPopupManager.virtualCart);
        } else {
            console.log('❌ Виртуальная корзина не найдена');
        }
        
        return {
            deliveryPrice: deliveryPriceElement?.textContent,
            cartTotalPrice: cartTotalPriceElement?.textContent,
            totalPrice: totalPriceElement?.textContent,
            virtualCart: window.addressPopupManager.virtualCart
        };
    } else {
        console.error('❌ addressPopupManager не найден!');
        return null;
    }
};

// Функция для сравнения виртуальной корзины и DOM
window.testCartComparison = function() {
    console.log('🧪 Сравнение виртуальной корзины и DOM...');
    
    if (!window.addressPopupManager || !window.addressPopupManager.virtualCart) {
        console.log('❌ Виртуальная корзина не найдена');
        return;
    }
    
    const virtualCart = window.addressPopupManager.virtualCart;
    console.log('📦 Виртуальная корзина:', virtualCart);
    
    if (virtualCart.items) {
        console.log('🔍 Товары в виртуальной корзине:');
        virtualCart.items.forEach((item, index) => {
            console.log(`📦 Товар ${index + 1}:`, {
                title: item.title,
                id: item.id,
                price: item.price,
                quantity: item.quantity,
                canonical_collection: item.canonical_collection
            });
        });
    }
    
    const domItems = document.querySelectorAll('.cart-item');
    console.log('🔍 Товары в DOM:');
    domItems.forEach((element, index) => {
        const titleElement = element.querySelector('.cart-item-title');
        const title = titleElement ? titleElement.textContent.trim() : 'Нет заголовка';
        const itemId = element.getAttribute('data-item-id');
        const dataComment = element.getAttribute('data-comment');
        const commentInput = element.querySelector('input[data-comment]');
        const commentValue = commentInput ? commentInput.value : null;
        
        console.log(`📦 DOM элемент ${index + 1}:`, {
            title: title,
            itemId: itemId,
            dataComment: dataComment,
            commentInput: commentValue
        });
    });
    
    return {
        virtualCart: virtualCart,
        domItems: Array.from(domItems).map(element => ({
            title: element.querySelector('.cart-item-title')?.textContent.trim(),
            itemId: element.getAttribute('data-item-id'),
            dataComment: element.getAttribute('data-comment'),
            commentInput: element.querySelector('input[data-comment]')?.value
        }))
    };
};

// Функция для тестирования парсинга дат
window.testParseDates = function(testComment) {
    console.log('🧪 Тестирование парсинга дат...');
    
    if (window.addressPopupManager) {
        if (testComment) {
            // Тестируем с переданным комментарием
            const dates = window.addressPopupManager.parseDatesFromComment(testComment);
            console.log('📅 Результат парсинга:', dates);
            return dates;
        } else {
            // Тестируем с комментариями из корзины
            const uniqueDates = window.addressPopupManager.getAllUniqueDeliveryDates();
            console.log('📅 Уникальные даты из корзины:', uniqueDates);
            return uniqueDates;
        }
    } else {
        console.error('❌ addressPopupManager не найден!');
        return null;
    }
};

// Функция для тестирования получения комментариев из DOM
window.testDOMComments = function() {
    console.log('🧪 Тестирование получения комментариев из DOM...');
    
    if (window.addressPopupManager && window.addressPopupManager.virtualCart) {
        const items = window.addressPopupManager.virtualCart.items;
        console.log('🔍 Тестируем', items.length, 'товаров из корзины');
        
        items.forEach((item, index) => {
            console.log(`📦 Товар ${index + 1}:`, item.title);
            
            // Тестируем получение комментария из DOM
            const domComment = window.addressPopupManager.getCommentFromDOM(item);
            console.log(`📝 Комментарий из DOM:`, domComment);
            
            // Тестируем парсинг дат
            if (domComment) {
                const dates = window.addressPopupManager.parseDatesFromComment(domComment);
                console.log(`📅 Найденные даты:`, dates);
            }
        });
        
        return items.map(item => ({
            title: item.title,
            domComment: window.addressPopupManager.getCommentFromDOM(item),
            parsedDates: window.addressPopupManager.getCommentFromDOM(item) ? 
                window.addressPopupManager.parseDatesFromComment(window.addressPopupManager.getCommentFromDOM(item)) : []
        }));
    } else {
        console.error('❌ addressPopupManager или виртуальная корзина не найдены!');
        return null;
    }
};

// Функция для проверки всех элементов корзины в DOM
window.checkDOMCartItems = function() {
    console.log('🧪 Проверка всех элементов корзины в DOM...');
    
    const cartItems = document.querySelectorAll('.cart-item');
    console.log('🔍 Найдено элементов .cart-item:', cartItems.length);
    
    cartItems.forEach((cartItem, index) => {
        const itemId = cartItem.getAttribute('data-item-id');
        const title = cartItem.querySelector('.cart-item-title')?.textContent || 'Без названия';
        const dataComment = cartItem.getAttribute('data-comment');
        const commentInput = cartItem.querySelector('input[data-comment]');
        const inputValue = commentInput?.value;
        
        console.log(`📦 Элемент ${index + 1}:`, {
            itemId: itemId,
            title: title,
            hasDataComment: !!dataComment,
            dataComment: dataComment,
            hasCommentInput: !!commentInput,
            inputValue: inputValue
        });
    });
    
    return Array.from(cartItems).map(cartItem => ({
        itemId: cartItem.getAttribute('data-item-id'),
        title: cartItem.querySelector('.cart-item-title')?.textContent || 'Без названия',
        dataComment: cartItem.getAttribute('data-comment'),
        inputValue: cartItem.querySelector('input[data-comment]')?.value
    }));
};

// Функция для тестирования поиска товара по названию
window.testFindItemByName = function(itemTitle) {
    console.log(`🧪 Тестирование поиска товара "${itemTitle}" по названию...`);
    
    const allCartItems = document.querySelectorAll('.cart-item');
    console.log('🔍 Найдено элементов .cart-item:', allCartItems.length);
    
    for (const element of allCartItems) {
        const titleElement = element.querySelector('.cart-item-title');
        const title = titleElement?.textContent?.trim();
        
        console.log(`📦 Проверяем элемент с названием: "${title}"`);
        
        if (title === itemTitle) {
            console.log(`✅ Найден товар "${itemTitle}"!`);
            
            const itemId = element.getAttribute('data-item-id');
            const dataComment = element.getAttribute('data-comment');
            const commentInput = element.querySelector('input[data-comment]');
            const inputValue = commentInput?.value;
            
            console.log('📝 Данные найденного элемента:', {
                itemId: itemId,
                title: title,
                hasDataComment: !!dataComment,
                dataComment: dataComment,
                hasCommentInput: !!commentInput,
                inputValue: inputValue
            });
            
            return {
                found: true,
                element: element,
                itemId: itemId,
                dataComment: dataComment,
                inputValue: inputValue
            };
        }
    }
    
    console.log(`❌ Товар "${itemTitle}" не найден`);
    return { found: false };
};

// Функция для проверки текущего состояния корзины
window.checkCartState = function() {
    console.log('🔍 Проверка текущего состояния корзины...');
    
    const cartItems = document.querySelectorAll('[data-item-id]');
    console.log('🛒 Всего товаров в DOM корзине:', cartItems.length);
    
    cartItems.forEach((item, index) => {
        const productId = item.getAttribute('data-product-id');
        const variantId = item.getAttribute('data-variant-id');
        const itemId = item.getAttribute('data-item-id');
        const productTitle = item.querySelector('.product-title, .cart-item-title, [data-product-title]')?.textContent || 'Неизвестно';
        
        console.log(`📦 Товар ${index + 1} (DOM):`);
        console.log(`   - productId: ${productId}`);
        console.log(`   - variantId: ${variantId}`);
        console.log(`   - itemId: ${itemId}`);
        console.log(`   - Название: ${productTitle}`);
        console.log(`   - Элемент:`, item);
    });
    
    // Проверяем виртуальную корзину
    if (window.addressPopupManager && window.addressPopupManager.virtualCart) {
        console.log('🛒 Всего товаров в виртуальной корзине:', window.addressPopupManager.virtualCart.items.length);
        
        window.addressPopupManager.virtualCart.items.forEach((item, index) => {
            console.log(`📦 Товар ${index + 1} (виртуальная корзина):`);
            console.log(`   - variant_id: ${item.variant_id}`);
            console.log(`   - product_id: ${item.product_id}`);
            console.log(`   - title: ${item.title || item.product_title}`);
            console.log(`   - quantity: ${item.quantity}`);
            console.log(`   - price: ${item.price}`);
        });
    } else {
        console.warn('⚠️ Виртуальная корзина недоступна');
    }
    
    if (window.dostavkaProducts && window.dostavkaProducts.products) {
        console.log('📦 Товары доставки в window.dostavkaProducts:');
        window.dostavkaProducts.products.forEach((product, index) => {
            console.log(`   ${index + 1}. ID: ${product.id}, Название: ${product.title}`);
            if (product.variants && product.variants.length > 0) {
                product.variants.forEach((variant, vIndex) => {
                    console.log(`      Вариант ${vIndex + 1}: variant_id: ${variant.id}, Название: ${variant.title}`);
                });
            }
        });
    } else {
        console.warn('⚠️ window.dostavkaProducts недоступен');
    }
};

// Функция для принудительного удаления товаров доставки по названию
window.forceRemoveDeliveryProducts = function() {
    console.log('🗑️ Принудительное удаление товаров доставки по названию...');
    
    const cartItems = document.querySelectorAll('[data-item-id]');
    const deliveryItemsToRemove = [];
    
    cartItems.forEach((item, index) => {
        const productTitle = item.querySelector('.product-title, .cart-item-title, [data-product-title]')?.textContent || '';
        const itemId = item.getAttribute('data-item-id');
        
        console.log(`🔍 Товар ${index + 1}: "${productTitle}"`);
        
        // Проверяем, содержит ли название товара ключевые слова доставки
        const isDeliveryProduct = productTitle.toLowerCase().includes('доставка') || 
                                 productTitle.toLowerCase().includes('сити') ||
                                 productTitle.toLowerCase().includes('зона');
        
        if (isDeliveryProduct && itemId) {
            deliveryItemsToRemove.push(itemId);
            console.log('🗑️ Найден товар доставки по названию:', productTitle, 'item ID:', itemId);
        }
    });
    
    if (deliveryItemsToRemove.length === 0) {
        console.log('✅ Товары доставки по названию не найдены');
        return;
    }
    
    console.log('🗑️ Удаляем товары доставки по названию:', deliveryItemsToRemove);
    
    // Удаляем каждый товар доставки
    deliveryItemsToRemove.forEach(async (itemId) => {
        if (window.addressPopupManager) {
            const success = await window.addressPopupManager.removeCartItem(itemId);
            if (success) {
                console.log('✅ Товар успешно удален по названию, item ID:', itemId);
            } else {
                console.error('❌ Не удалось удалить товар по названию, item ID:', itemId);
            }
        }
    });
};

// Функция для тестирования проверки просроченных товаров
window.testCheckExpiredItems = function() {
    console.log('🧪 Тестирование проверки просроченных товаров...');
    
    if (window.addressPopupManager) {
        return window.addressPopupManager.checkAndRemoveExpiredItems();
    } else {
        console.error('❌ addressPopupManager не найден!');
        return null;
    }
};

// Функция для проверки дат всех товаров
window.checkAllItemsDates = function() {
    console.log('🔍 Проверка дат всех товаров в корзине...');
    
    if (!window.addressPopupManager || !window.addressPopupManager.virtualCart) {
        console.error('❌ Виртуальная корзина недоступна');
        return null;
    }
    
    const currentDate = window.addressPopupManager.getCurrentMoscowDate();
    console.log('📅 Текущая дата (Москва):', currentDate);
    
    const itemsInfo = [];
    
    window.addressPopupManager.virtualCart.items.forEach((item, index) => {
        let comment = item.comment;
        if (!comment) {
            comment = window.addressPopupManager.getCommentFromDOM(item);
        }
        
        if (!comment) {
            itemsInfo.push({
                index: index + 1,
                title: item.title,
                hasComment: false,
                dates: [],
                isExpired: false
            });
            return;
        }
        
        const dates = window.addressPopupManager.parseDatesFromComment(comment);
        const allDatesExpired = dates.every(date => 
            window.addressPopupManager.isDateExpired(date, currentDate)
        );
        
        itemsInfo.push({
            index: index + 1,
            title: item.title,
            hasComment: true,
            dates: dates,
            isExpired: allDatesExpired,
            variantId: item.variant_id
        });
        
        console.log(`📦 Товар ${index + 1}: "${item.title}"`);
        console.log(`   Даты: ${dates.join(', ') || 'нет дат'}`);
        console.log(`   Просрочен: ${allDatesExpired ? '❌ ДА' : '✅ НЕТ'}`);
    });
    
    return itemsInfo;
};

// Функция для тестирования удаления товара по variant_id
window.removeCartItemByVariantId = function(variantId) {
    console.log('🗑️ Тестирование удаления товара по variant_id:', variantId);
    
    if (window.addressPopupManager) {
        return window.addressPopupManager.removeCartItemByVariantId(variantId);
    } else {
        console.error('❌ addressPopupManager не найден!');
        return null;
    }
};


// Экспорт для модульных систем (если используется)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AddressPopupManager;
}
;
