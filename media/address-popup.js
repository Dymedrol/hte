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
        
        this.init();
    }
    
    init() {
        // Ждем загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupElements());
        } else {
            this.setupElements();
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
                
                // Обновляем UI
                this.updateSelectedAddress(address, deliveryZone);
                this.updateConfirmButton(deliveryZone !== 'Зона доставки не определена');
                
                // Добавляем маркер на карту
                this.addMarker(coords, address);
                
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
                
                // Центрируем карту на найденном адресе
                this.map.setCenter(coords, 15);
                
                // Добавляем маркер
                this.addMarker(coords, address);
                
                // Обновляем UI
                this.updateSelectedAddress(address, deliveryZone);
                this.updateConfirmButton(deliveryZone !== 'Зона доставки не определена');
                this.hideSuggestions();
                
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
                        
                        // Добавляем маркер
                        this.addMarker(coords, address);
                        
                        // Обновляем UI
                        this.updateSelectedAddress(address, deliveryZone);
                        this.updateConfirmButton(deliveryZone !== 'Зона доставки не определена');
                        
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
        
        // Обновляем UI
        this.updateSelectedAddress(address, deliveryZone);
        this.updateConfirmButton(deliveryZone !== 'Зона доставки не определена');
        this.hideSuggestions();
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
    
    // Сброс состояния (только при полном сбросе)
    resetState() {
        this.selectedCoordinates = null;
        this.selectedAddress = null;
        this.suggestions = [];
        this.currentStep = 1;
        
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

// Экспорт для модульных систем (если используется)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AddressPopupManager;
}