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
        
        this.init();
    }
    
    init() {
        // Ждем загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupElements();
                this.cleanDeliveryAddressesOnLoad();
            });
        } else {
            this.setupElements();
            this.cleanDeliveryAddressesOnLoad();
        }
    }
    
    // Очистка адресов доставки при загрузке страницы
    cleanDeliveryAddressesOnLoad() {
        console.log('🧹 Очистка адресов доставки при загрузке страницы...');
        
        // Находим все поля комментариев в корзине
        const commentInputs = document.querySelectorAll('input[data-comment]');
        console.log('🔍 Найдено полей комментариев для очистки:', commentInputs.length);
        
        if (commentInputs.length === 0) {
            // Попробуем альтернативный селектор
            const altInputs = document.querySelectorAll('input[name*="order_line_comments"]');
            console.log('🔍 Альтернативный поиск - найдено полей:', altInputs.length);
            
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
        
        console.log('✅ Очистка адресов доставки завершена');
    }
    
    // Очистка одного поля комментария от адреса доставки
    cleanSingleCommentField(input, index) {
        const currentValue = input.value || '';
        console.log(`🧹 Очищаем поле ${index + 1}:`, input.name, 'текущее значение:', currentValue);
        
        if (!currentValue.trim()) {
            console.log(`⏭️ Поле ${index + 1} пустое, пропускаем`);
            return;
        }
        
        // Удаляем адрес доставки из комментария
        const cleanedValue = this.removeDeliveryAddressFromComment(currentValue);
        console.log(`🧹 Очищенное значение поля ${index + 1}:`, cleanedValue);
        
        // Обновляем значение только если оно изменилось
        if (cleanedValue !== currentValue) {
            input.value = cleanedValue;
            
            // Принудительно вызываем событие change для уведомления других скриптов
            const changeEvent = new Event('change', { bubbles: true });
            input.dispatchEvent(changeEvent);
            
            // Также вызываем событие input
            const inputEvent = new Event('input', { bubbles: true });
            input.dispatchEvent(inputEvent);
            
            console.log(`✅ Поле ${index + 1} очищено и события отправлены`);
        } else {
            console.log(`⏭️ Поле ${index + 1} не содержало адрес доставки`);
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
        console.log('✅ AddressPopupManager инициализирован');
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
        
        if (this.finalConfirmBtn) {
            this.finalConfirmBtn.addEventListener('click', () => this.finalConfirm());
        }
    }
    
    openPopup(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🏠 Открытие попапа выбора адреса доставки');
        
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
        console.log('❌ Закрытие попапа выбора адреса доставки');
        
        this.popup.classList.remove('active');
        document.body.style.overflow = ''; // Восстанавливаем скролл страницы
    }
    
    handleKeydown(e) {
        if (e.key === 'Escape' && this.popup?.classList.contains('active')) {
            console.log('❌ Закрытие попапа выбора адреса доставки по клавише Escape');
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
            
            console.log('✅ Яндекс карта инициализирована');
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
        
        console.log('✅ Зоны доставки загружены на карту');
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
                
                console.log('📍 Выбрана точка:', address, coords);
                console.log('🚚 Зона доставки:', deliveryZone);
            }
        });
    }
    
    // Определение зоны доставки по координатам
    getDeliveryZone(coords) {
        console.log('🔍 Проверяем зону для координат:', coords);
        
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
            console.log(`🔍 Проверка зоны "${zone.name}":`, isInside);
            if (isInside) {
                console.log(`✅ Найдена зона: ${zone.name}`);
                return zone.name;
            }
        }
        
        console.log('❌ Зона не найдена');
        return 'Зона доставки не определена';
    }
    
    // Поиск товара доставки по зоне
    findDeliveryProductByZone(deliveryZone) {
        console.log('🔍 Поиск товара доставки для зоны:', deliveryZone);
        
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
    
    // Определение товара доставки по зоне и условиям
    determineDeliveryProduct(deliveryZone) {
        console.log('🎯 Определение товара доставки для зоны:', deliveryZone);
        
        const cartTotal = this.getCartTotal();
        const programDays = this.getProgramDaysCount();
        const deliveryTime = this.getProgramDeliveryTime();
        
        console.log('📊 Условия доставки:', {
            zone: deliveryZone,
            cartTotal: cartTotal,
            programDays: programDays,
            deliveryTime: deliveryTime
        });
        
        let deliveryProduct = null;
        let isFreeDelivery = false;
        
        if (deliveryZone === 'Курьером в пределах МКАД' || deliveryZone === 'МКАД + 35 км') {
            if (cartTotal >= 3000) {
                console.log('✅ Доставка бесплатна (сумма >= 3000)');
                isFreeDelivery = true;
            } else {
                console.log('💰 Доставка платная (сумма < 3000)');
                const productTitle = deliveryZone === 'Курьером в пределах МКАД' ? 
                    'Курьером в пределах МКАД' : 'Курьером за МКАД';
                deliveryProduct = this.findDeliveryProductByTitle(productTitle);
            }
        } else if (deliveryZone === 'Сити 1') {
            console.log('🏢 Зона Сити 1');
            deliveryProduct = this.findDeliveryProductByTitle('Сити 1');
        } else if (deliveryZone === 'Сити 2') {
            console.log('🏢 Зона Сити 2, время:', deliveryTime);
            const productTitle = deliveryTime === 'before_7am' ? 
                'Сити 2 до 7 утра' : 'Сити 2 после 7 утра';
            deliveryProduct = this.findDeliveryProductByTitle(productTitle);
        }
        
        return {
            product: deliveryProduct,
            isFree: isFreeDelivery,
            quantity: programDays,
            zone: deliveryZone
        };
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
        
        // Обновляем общую сумму
        const totalElement = document.querySelector('[data-cart-total-price]');
        if (totalElement && cartData.total_price) {
            totalElement.textContent = cartData.total_price_formatted || `${cartData.total_price} ₽`;
        }
        
        // Обновляем количество товаров
        const countElement = document.querySelector('[data-cart-item-count]');
        if (countElement && cartData.items_count) {
            countElement.textContent = cartData.items_count;
        }
        
        // Обновляем полную сумму
        const fullTotalElement = document.querySelector('[data-cart-full-total-price]');
        if (fullTotalElement && cartData.total_price) {
            fullTotalElement.textContent = cartData.total_price_formatted || `${cartData.total_price} ₽`;
        }
        
        console.log('✅ Отображение корзины обновлено');
    }
    
    // Обновление отображения цены доставки
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
        } else if (deliveryInfo.product) {
            const totalPrice = deliveryInfo.product.price * deliveryInfo.quantity;
            deliveryPriceElement.textContent = `${totalPrice} ₽`;
            deliveryPriceElement.style.color = '#333'; // Обычный цвет
            console.log('💰 Цена доставки обновлена:', totalPrice, '₽');
        } else {
            deliveryPriceElement.textContent = '-';
            deliveryPriceElement.style.color = '#999';
            console.log('❓ Цена доставки не определена');
        }
    }
    
    // Обработка выбора адреса доставки
    async handleDeliverySelection(deliveryZone) {
        console.log('🎯 Обработка выбора доставки для зоны:', deliveryZone);
        
        try {
            // Ждем загрузки данных о продуктах доставки
            await this.waitForDostavkaProducts();
            
            // Определяем товар доставки
            const deliveryInfo = this.determineDeliveryProduct(deliveryZone);
            
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
                } else {
                    console.error('❌ Не удалось добавить товар доставки в корзину');
                }
            } else if (deliveryInfo.isFree) {
                console.log('✅ Доставка бесплатна, товар не добавляем');
            } else {
                console.log('ℹ️ Товар доставки не требуется или не найден');
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
                        
                        // Ищем соответствующий товар доставки
                        this.findDeliveryProductByZone(deliveryZone);
                        
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
        
        // Ищем соответствующий товар доставки
        this.findDeliveryProductByZone(deliveryZone);
        
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
            // Для многоквартирного дома показываем все поля
            this.toggleFormFields(true, ['apartment', 'floor', 'entrance', 'intercom']);
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
        console.log('🔍 Проверяем наличие адреса:', this.selectedAddress);
        
        if (!this.selectedAddress) {
            console.warn('❌ Адрес не выбран!');
            return;
        }
        
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

// Экспорт для модульных систем (если используется)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AddressPopupManager;
}
