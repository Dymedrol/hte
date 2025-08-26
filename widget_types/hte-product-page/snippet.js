EventBus.subscribe('change_quantity:insales:product', function (data) {
  const quantityValue = document.querySelector('[data-quantity-value]');
  quantityValue.textContent = data.action.quantity.current;
  const totalPrice = document.querySelector('[data-product-price]');
  totalPrice.textContent = data.action.quantity.current * data.action.price + ' ₽';
}); 


// Product Card JavaScript - Component Version

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

// Функция проверки наличия элементов
function checkElements() {
  // Сначала ищем в общем DOM
  let thumbnails = document.querySelectorAll('.product-thumbnail');
  let mainImage = document.querySelector('.product-main-image img');
  let prevArrow = document.querySelector('.product-prev-arrow');
  let nextArrow = document.querySelector('.product-next-arrow');
  
  // Если элементы не найдены, ищем в конкретном компоненте
  if (!thumbnails.length || !mainImage || !prevArrow || !nextArrow) {
    const productCard = document.querySelector('#product-card');
    if (productCard) {
      // Ищем элементы с разными селекторами
      thumbnails = productCard.querySelectorAll('.product-thumbnail') || thumbnails;
      mainImage = productCard.querySelector('.product-main-image img') || mainImage;
      prevArrow = productCard.querySelector('.product-prev-arrow') || prevArrow;
      nextArrow = productCard.querySelector('.product-next-arrow') || nextArrow;
      
      // Если все еще не найдены, ищем по более общим селекторам
      if (!thumbnails.length || !mainImage || !prevArrow || !nextArrow) {
        // Ищем все кнопки и изображения в компоненте
        const allButtons = productCard.querySelectorAll('button');
        const allImages = productCard.querySelectorAll('img');
        const allDivs = productCard.querySelectorAll('div');
      }
    }
  }
  
  // Проверяем, что все элементы найдены и thumbnails не пустой
  const allFound = thumbnails && thumbnails.length > 0 && mainImage && 
                  prevArrow && nextArrow;
  
  // Дополнительная проверка DOM
  if (allFound) {
    // Проверка стилей
    const prevArrowStyles = window.getComputedStyle(prevArrow);
    const nextArrowStyles = window.getComputedStyle(nextArrow);
  }
  
  return {
    thumbnails, mainImage, prevArrow, nextArrow, allFound
  };
}

// Функция настройки слайдера
function setupSlider(elements) {
  const { thumbnails, mainImage, prevArrow, nextArrow } = elements;
  
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
  checkElements: checkElements,
  setupSlider: setupSlider
};

  