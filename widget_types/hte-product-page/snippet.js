EventBus.subscribe('change_quantity:insales:product', function (data) {
  console.log('!!!!!');
  const quantityValue = document.querySelector('[data-quantity-value]');
  quantityValue.textContent = data.action.quantity.current;
  const totalPrice = document.querySelector('[data-product-price]');
  totalPrice.textContent = data.action.quantity.current * data.action.price + ' ₽';
}); 


// Функция инициализации слайдера
function initProductSlider() {
    // Проверяем, есть ли уже элементы
    const elements = checkElements();
    if (elements.allFound) {
      setupSlider(elements);
      return;
    }
    
    // Если элементы не найдены, используем MutationObserver
    const observer = new MutationObserver((mutations) => {
      const elements = checkElements();
      if (elements.allFound) {
        observer.disconnect();
        setupSlider(elements);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Таймаут на случай, если MutationObserver не сработает
    setTimeout(() => {
      observer.disconnect();
      const elements = checkElements();
      if (elements.allFound) {
        setupSlider(elements);
      }
    }, 2000);
  }

  
  // Функция настройки слайдера
  function setupSlider(elements) {
    const { minusBtn, plusBtn, quantityValue, thumbnails, 
            mainImage, prevArrow, nextArrow, addToCartBtn } = elements;
    
    // Quantity controls
    let quantity = 2; // Starting quantity
    
    minusBtn.addEventListener('click', function() {
      if (quantity > 1) {
        quantity--;
        updateQuantity();
      }
    });
    
    plusBtn.addEventListener('click', function() {
      quantity++;
      updateQuantity();
    });
    
    function updateQuantity() {
      quantityValue.textContent = quantity + ' шт.';
      // Update total price (700 * quantity)
      const totalPrice = document.querySelector('.product-price-value');
      if (totalPrice) {
        totalPrice.textContent = (quantity * 700) + ' ₽';
      }
    }
    
    // Gallery navigation
    let currentIndex = 0;
    
    // Function to update main image and active thumbnail
    function updateGallery(index) {
      if (index < 0) index = thumbnails.length - 1;
      if (index >= thumbnails.length) index = 0;
      
      currentIndex = index;
      
      // Remove active class from all thumbnails
      thumbnails.forEach(t => t.classList.remove('active'));
      // Add active class to current thumbnail
      thumbnails[currentIndex].classList.add('active');
      
      // Update main image
      if (mainImage && thumbnails[currentIndex].dataset.image) {
        mainImage.src = thumbnails[currentIndex].dataset.image;
      }
    }
    
    // Click on thumbnails
    thumbnails.forEach((thumbnail, index) => {
      // Тестовый обработчик для проверки кликабельности
      thumbnail.addEventListener('mousedown', function(e) {
        // MouseDown по миниатюре
      });
      
      thumbnail.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        updateGallery(index);
      });
    });
    
    // Click on main image to go to next
    mainImage.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      updateGallery(currentIndex + 1);
    });
    
    // Previous arrow click
    
    // Тестовый обработчик для проверки кликабельности
    prevArrow.addEventListener('mousedown', function(e) {
      // MouseDown по предыдущей стрелке
    });
    
    prevArrow.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      updateGallery(currentIndex - 1);
    });
    
    // Next arrow click
    
    // Тестовый обработчик для проверки кликабельности
    nextArrow.addEventListener('mousedown', function(e) {
      // MouseDown по следующей стрелке
    });
    
    nextArrow.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      updateGallery(currentIndex + 1);
    });
    
    // Add to cart button
    addToCartBtn.addEventListener('click', function() {
      // Simple cart functionality
      alert('Товар добавлен в корзину!');
    });
  }
  
  // Инициализация при загрузке DOM
  document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем слайдер с небольшой задержкой
    setTimeout(() => {
      try {
        initProductSlider();
      } catch (error) {
        // Ошибка инициализации слайдера
      }
    }, 100);
  });
  
  // Экспортируем функции для использования в других модулях
  window.ProductSlider = {
    init: initProductSlider,
    setupSlider: setupSlider
  };
  