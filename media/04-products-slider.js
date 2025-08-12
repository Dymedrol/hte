// 04. Products Slider Functionality
class ProductsSlider {
  constructor() {
    this.productsGrid = document.querySelector('.products-grid');
    this.prevBtn = document.querySelector('.products-prev-btn');
    this.nextBtn = document.querySelector('.products-next-btn');
    this.productCards = document.querySelectorAll('.product-card');
    
    this.currentIndex = 0;
    this.totalProducts = this.productCards.length;
    
    this.init();
  }
  
  init() {
    // console.log('Initializing ProductsSlider...');
    // console.log('ProductsGrid:', this.productsGrid);
    // console.log('PrevBtn:', this.prevBtn);
    // console.log('NextBtn:', this.nextBtn);
    // console.log('ProductCards:', this.productCards.length);
    
    if (!this.productsGrid || !this.prevBtn || !this.nextBtn) {
      console.warn('Products slider elements not found');
      return;
    }
    
    // Добавляем обработчики событий
    this.prevBtn.addEventListener('click', () => {
      this.slidePrev();
    });
    this.nextBtn.addEventListener('click', () => {
      // console.log('Next button clicked');
      this.slideNext();
    });
    
    // Добавляем обработчик изменения размера окна
    window.addEventListener('resize', () => {
      // Сбрасываем индекс при изменении размера окна
      this.currentIndex = 0;
      this.scrollToIndex(0);
    });
    
    // Инициализируем состояние кнопок
    this.updateButtonStates();
    // console.log('ProductsSlider initialized successfully');
  }
  
  slideNext() {
    // console.log('slideNext called, currentIndex:', this.currentIndex);
    this.currentIndex += 2; // Всегда сдвигаем на 2 карточки
    
    // Если достигли конца, начинаем сначала (бесконечный слайдер)
    if (this.currentIndex >= this.totalProducts) {
      this.currentIndex = 0;
    }
    
    // console.log('New currentIndex:', this.currentIndex);
    this.scrollToIndex(this.currentIndex);
    this.updateButtonStates();
  }
  
  slidePrev() {
    // console.log('slidePrev called, currentIndex:', this.currentIndex);
    this.currentIndex -= 2; // Всегда сдвигаем на 2 карточки
    
    // Если достигли начала, переходим к концу (бесконечный слайдер)
    if (this.currentIndex < 0) {
      this.currentIndex = this.totalProducts - 2;
    }
    
    // console.log('New currentIndex:', this.currentIndex);
    this.scrollToIndex(this.currentIndex);
    this.updateButtonStates();
  }
  
  scrollToIndex(index) {
    if (this.productCards[index]) {
      const cardWidth = this.productCards[0].offsetWidth;
      const gap = parseInt(getComputedStyle(this.productsGrid).gap) || 20;
      const scrollPosition = index * (cardWidth + gap);
      
      // console.log('Scrolling to position:', scrollPosition, 'cardWidth:', cardWidth, 'gap:', gap);
      
      this.productsGrid.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }
  

  
  updateButtonStates() {
    // Кнопки всегда активны для бесконечного слайдера
    this.prevBtn.disabled = false;
    this.nextBtn.disabled = false;
  }
}

// Глобальная переменная для слайдера
let productsSlider = null;

// Функция инициализации слайдера
function initProductsSlider() {
  // Проверяем, что элементы существуют
  const productsGrid = document.querySelector('.products-grid');
  const prevBtn = document.querySelector('.products-prev-btn');
  const nextBtn = document.querySelector('.products-next-btn');
  const productCards = document.querySelectorAll('.product-card');
  
  if (!productsGrid || !prevBtn || !nextBtn || productCards.length === 0) {
    console.warn('Products slider elements not found, will retry later');
    return false;
  }
  
  // Создаем слайдер только если его еще нет
  if (!productsSlider) {
    productsSlider = new ProductsSlider();
    // console.log('ProductsSlider initialized successfully');
  }
  
  return true;
}

// Инициализация слайдера после загрузки DOM (fallback)
// Убираем автоматическую инициализацию, так как она будет вызвана из additional-products.js
// document.addEventListener('DOMContentLoaded', () => {
//   if (!initProductsSlider()) {
//     setTimeout(() => {
//       initProductsSlider();
//     }, 100);
//   }
// });

// Экспортируем функцию для вызова из других скриптов
window.initProductsSlider = initProductsSlider; 
