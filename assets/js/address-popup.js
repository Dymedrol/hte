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
        
        // Состояние
        this.selectedCoordinates = null;
        this.selectedAddress = null;
        this.suggestions = [];
        this.geocoder = null;
        
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
            
            // Инициализируем геокодер
            this.geocoder = ymaps.geocode;
            
            // Добавляем обработчик клика по карте
            this.map.events.add('click', (e) => this.onMapClick(e));
            
            console.log('✅ Яндекс карта инициализирована');
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
                
                // Обновляем UI
                this.updateSelectedAddress(address);
                this.updateConfirmButton(true);
                
                // Добавляем маркер на карту
                this.addMarker(coords, address);
                
                console.log('📍 Выбрана точка:', address, coords);
            }
        });
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
                
                // Центрируем карту на найденном адресе
                this.map.setCenter(coords, 15);
                
                // Добавляем маркер
                this.addMarker(coords, address);
                
                // Обновляем UI
                this.updateSelectedAddress(address);
                this.updateConfirmButton(true);
                this.hideSuggestions();
                
                console.log('🔍 Найден адрес:', address, coords);
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
                        
                        // Добавляем маркер
                        this.addMarker(coords, address);
                        
                        // Обновляем UI
                        this.updateSelectedAddress(address);
                        this.updateConfirmButton(true);
                        
                        console.log('📍 Текущее местоположение:', address, coords);
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
        
        // Обновляем UI
        this.updateSelectedAddress(address);
        this.updateConfirmButton(true);
        this.hideSuggestions();
    }
    
    // Обновление отображения выбранного адреса
    updateSelectedAddress(address) {
        if (this.selectedAddressEl) {
            this.selectedAddressEl.textContent = address;
        }
    }
    
    // Обновление состояния кнопки подтверждения
    updateConfirmButton(enabled) {
        if (this.confirmBtn) {
            this.confirmBtn.disabled = !enabled;
        }
    }
    
    // Подтверждение выбранного адреса
    confirmAddress() {
        if (!this.selectedAddress || !this.selectedCoordinates) {
            console.warn('❌ Адрес не выбран');
            return;
        }
        
        console.log('✅ Адрес подтвержден:', this.selectedAddress, this.selectedCoordinates);
        
        // Здесь можно добавить логику сохранения адреса
        // Например, отправка на сервер или обновление UI корзины
        
        // Закрываем попап
        this.closePopup();
        
        // Сбрасываем состояние
        this.resetState();
    }
    
    // Сброс состояния
    resetState() {
        this.selectedCoordinates = null;
        this.selectedAddress = null;
        this.suggestions = [];
        
        if (this.addressInput) {
            this.addressInput.value = '';
        }
        
        if (this.selectedAddressEl) {
            this.selectedAddressEl.textContent = 'Адрес не выбран';
        }
        
        this.updateConfirmButton(false);
        this.hideSuggestions();
        
        if (this.map) {
            this.map.geoObjects.removeAll();
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