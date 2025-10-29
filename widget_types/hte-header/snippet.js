// Флаг для предотвращения повторной инициализации
let headerInitialized = false;

// Переменные для отслеживания прокрутки
let lastScrollTop = 0;
let scrollThreshold = 1; // Минимальное расстояние прокрутки для срабатывания
let ticking = false;

// Гистерезис для предотвращения дерганья
const HIDE_THRESHOLD = 5; // Порог для скрытия хедера
const SHOW_THRESHOLD = 3; // Порог для показа хедера (меньше для более быстрого показа)

// Переменные для отслеживания viewport
let lastViewportHeight = window.innerHeight;
let isViewportChanging = false;

// Функция для надежного определения позиции скролла
function getScrollPosition() {
  // Определяем мобильные устройства
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  let scrollPosition = 0;
  
  if (isMobile) {
    // Для мобильных устройств используем несколько методов
    const methods = [
      () => window.pageYOffset,
      () => document.documentElement.scrollTop,
      () => document.body.scrollTop,
      () => window.scrollY,
      () => document.scrollingElement?.scrollTop,
      () => 0
    ];
    
    for (const method of methods) {
      try {
        const value = method();
        if (value !== undefined && value !== null && !isNaN(value)) {
          scrollPosition = value;
          break;
        }
      } catch (e) {
        continue;
      }
    }
  } else {
    scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || window.scrollY || 0;
  }
  
  // Клампим отрицательные значения (защита от bounce-эффектов Safari)
  return Math.max(0, scrollPosition);
}

// Функция инициализации header
function initHeader() {
  if (headerInitialized) {
    return;
  }
  headerInitialized = true;
  
  // Mobile menu toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu-overlay');
  const mobileMenuClose = document.querySelector('.mobile-menu-close');



  if (menuToggle && mobileMenu && mobileMenuClose) {
    // Функции для блокировки скроллинга
    function disableScroll() {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }

    function enableScroll() {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    menuToggle.addEventListener('click', () => {
      mobileMenu.classList.add('active');
      // Показываем хедер при открытии мобильного меню
      const header = document.querySelector('.header');
      if (header) {
        header.classList.remove('hidden');
      }
      disableScroll();
    });

    mobileMenuClose.addEventListener('click', (e) => {
      e.stopPropagation();
      mobileMenu.classList.remove('active');
      enableScroll();
    });

    // Close menu when clicking outside
    mobileMenu.addEventListener('click', (e) => {
      if (e.target === mobileMenu) {
        mobileMenu.classList.remove('active');
        enableScroll();
      }
    });
  }

  // Programs dropdown functionality
  const programsDropdown = document.querySelector('.programs-dropdown');
  const dropdownMenu = document.querySelector('.programs-dropdown-menu');



  if (programsDropdown && dropdownMenu) {
    let hideTimeout;

    // Show dropdown on hover
    programsDropdown.addEventListener('mouseenter', () => {
      clearTimeout(hideTimeout);
      dropdownMenu.style.opacity = '1';
      dropdownMenu.style.visibility = 'visible';
    });

    // Hide dropdown when mouse leaves
    programsDropdown.addEventListener('mouseleave', () => {
      hideTimeout = setTimeout(() => {
        dropdownMenu.style.opacity = '0';
        dropdownMenu.style.visibility = 'hidden';
      }, 100);
    });

    // Показываем меню при наведении на само dropdown
    dropdownMenu.addEventListener('mouseenter', () => {
      clearTimeout(hideTimeout);
    });

    dropdownMenu.addEventListener('mouseleave', () => {
      hideTimeout = setTimeout(() => {
        dropdownMenu.style.opacity = '0';
        dropdownMenu.style.visibility = 'hidden';
      }, 100);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!programsDropdown.contains(e.target)) {
        dropdownMenu.style.opacity = '0';
        dropdownMenu.style.visibility = 'hidden';
      }
    });

    // Program card click handlers (desktop dropdown)
    const programCards = document.querySelectorAll('.dropdown-menu .program-card');

    programCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Проверяем, является ли карточка ссылкой
        if (card.tagName === 'A' && card.href) {
          // Если это ссылка, не предотвращаем переход
          return;
        }
        
        // Для остальных карточек предотвращаем переход и добавляем логику
        e.preventDefault();
        const programNameElement = card.querySelector('.program-name');
        if (programNameElement) {
          const programName = programNameElement.textContent;
          // Здесь можно добавить логику перехода на страницу программы
          // window.location.href = `/programs/${programName.toLowerCase()}`;
        }
      });
    });

    // Mobile program card click handlers
    const mobileProgramCards = document.querySelectorAll('.mobile-programs-grid .program-card');
    mobileProgramCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const programNameElement = card.querySelector('.program-name');
        if (programNameElement) {
          const programName = programNameElement.textContent;
          // Для мобильных карточек не предотвращаем переход по ссылке
          // если это ссылка (например, sport.html)
        }
      });
    });

    // "Посмотреть все" link handler
    const viewAllLink = document.querySelector('.dropdown-view-all');
    if (viewAllLink) {
      viewAllLink.addEventListener('click', (e) => {
        // Убираем preventDefault, чтобы ссылка работала
        // window.location.href = '/programs';
      });
    }
  }

  // Mobile programs functionality
  const mobileProgramsDropdown = document.querySelector('.mobile-menu-nav .nav-dropdown');
  const mobileProgramsGrid = document.querySelector('.mobile-programs-grid');
  const mobileProgramsHeader = document.querySelector('.mobile-menu-nav .nav-dropdown-header');



  if (mobileProgramsDropdown && mobileProgramsGrid && mobileProgramsHeader) {
    // Initially hide the programs grid
    mobileProgramsGrid.classList.remove('expanded');

    mobileProgramsHeader.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const isVisible = mobileProgramsGrid.classList.contains('expanded');
      const navArrow = mobileProgramsHeader.querySelector('.nav-arrow');
      
      if (isVisible) {
        // Скрываем меню
        mobileProgramsGrid.classList.remove('expanded');
        mobileProgramsGrid.style.marginTop = '0';
        if (navArrow) {
          navArrow.style.transform = 'rotate(0deg)';
        }
      } else {
        // Показываем меню
        mobileProgramsGrid.classList.add('expanded');
        mobileProgramsGrid.style.marginTop = '15px';
        if (navArrow) {
          navArrow.style.transform = 'rotate(180deg)';
        }
      }
    });
  }

  // Функция обработки прокрутки
  function handleScroll() {
    // Определяем мобильные устройства
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isAndroidChrome = /Android/.test(navigator.userAgent) && /Chrome/.test(navigator.userAgent);
    
    // Проверяем изменение высоты viewport (скрытие/показ панели браузера)
    const currentViewportHeight = window.innerHeight;
    const viewportHeightDiff = Math.abs(currentViewportHeight - lastViewportHeight);
    
    if (viewportHeightDiff > 50) { // Значительное изменение высоты viewport
      isViewportChanging = true;
      lastViewportHeight = currentViewportHeight;
      
      // При изменении viewport принудительно показываем хедер
      const header = document.querySelector('.header');
      if (header) {
        header.classList.remove('hidden');
      }
      
      // Не обрабатываем скролл во время изменения viewport
      return;
    } else if (isViewportChanging && viewportHeightDiff < 10) {
      // Viewport стабилизировался
      isViewportChanging = false;
    }
    
    // Используем надежную функцию определения скролла
    const currentScrollTop = getScrollPosition();
    
    const header = document.querySelector('.header');
    const mobileMenu = document.querySelector('.mobile-menu-overlay');
    
    
    if (!header) {
      return;
    }

    // Не скрываем хедер если мобильное меню открыто
    if (mobileMenu && mobileMenu.classList.contains('active')) {
      return;
    }

    // Проверяем направление скролла
    const scrollDifference = currentScrollTop - lastScrollTop;
    const isScrollingDown = scrollDifference > 0;
    const isScrollingUp = scrollDifference < 0;
    
    // Управление фоном хедера
    if (currentScrollTop > 0) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Гистерезис для предотвращения дерганья
    if (isScrollingDown && Math.abs(scrollDifference) >= HIDE_THRESHOLD && currentScrollTop > 0) {
      // Скрываем хедер только при значительном скролле вниз
      header.classList.add('hidden');
    } 
    else if (isScrollingUp && Math.abs(scrollDifference) >= SHOW_THRESHOLD) {
      // Показываем хедер при меньшем скролле вверх (более чувствительно)
      header.classList.remove('hidden');
    }

    lastScrollTop = currentScrollTop;
    ticking = false;
  }

  // Оптимизированная функция прокрутки с requestAnimationFrame
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(handleScroll);
      ticking = true;
    }
  }

  // Определяем мобильные устройства для специальной обработки
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  const isAndroidChrome = /Android/.test(navigator.userAgent) && /Chrome/.test(navigator.userAgent);
  
  // Обработчик изменения размера окна (для отслеживания изменений viewport)
  window.addEventListener('resize', () => {
    const newViewportHeight = window.innerHeight;
    const heightDiff = Math.abs(newViewportHeight - lastViewportHeight);
    
    if (heightDiff > 50) { // Значительное изменение высоты
      lastViewportHeight = newViewportHeight;
      
      // Принудительно показываем хедер при изменении viewport
      const header = document.querySelector('.header');
      if (header) {
        header.classList.remove('hidden');
      }
    }
  });
  
  // Добавляем обработчики прокрутки к разным элементам
  if (isMobile) {
    // Для всех мобильных устройств используем более простой подход без passive
    window.addEventListener('scroll', onScroll);
    document.addEventListener('scroll', onScroll);
    document.documentElement.addEventListener('scroll', onScroll);
    document.body.addEventListener('scroll', onScroll);
    
    // Дополнительные обработчики для мобильных устройств
    document.addEventListener('touchmove', onScroll, { passive: true });
    document.addEventListener('touchstart', onScroll, { passive: true });
    
    // Принудительный показ хедера при касании экрана (если хедер скрыт)
    document.addEventListener('touchstart', (e) => {
      if (header && header.classList.contains('hidden')) {
        header.classList.remove('hidden');
      }
    }, { passive: true });
    
    // Также пробуем добавить к основному контейнеру страницы
    const mainContainer = document.querySelector('main') || 
                         document.querySelector('#main') || 
                         document.querySelector('.main') ||
                         document.querySelector('[role="main"]');
    
    if (mainContainer) {
      mainContainer.addEventListener('scroll', onScroll);
    }
  } else {
    // Для десктопных браузеров используем passive события
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('scroll', onScroll, { passive: true });
    document.documentElement.addEventListener('scroll', onScroll, { passive: true });
    document.body.addEventListener('scroll', onScroll, { passive: true });
    
    // Также пробуем добавить к основному контейнеру страницы
    const mainContainer = document.querySelector('main') || 
                         document.querySelector('#main') || 
                         document.querySelector('.main') ||
                         document.querySelector('[role="main"]');
    
    if (mainContainer) {
      mainContainer.addEventListener('scroll', onScroll, { passive: true });
    }
  }
  
  // Инициализация фона хедера при загрузке
  const initialScrollTop = getScrollPosition();
  const header = document.querySelector('.header');
  if (header) {
    if (initialScrollTop > 0) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }
  
  // Дополнительный fallback для всех мобильных устройств
  if (isMobile) {
    // Добавляем обработчик изменения ориентации
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        const currentScroll = getScrollPosition();
        if (header) {
          if (currentScroll > 0) {
            header.classList.add('scrolled');
          } else {
            header.classList.remove('scrolled');
          }
          // Принудительно показываем хедер при смене ориентации
          header.classList.remove('hidden');
        }
        // Обновляем высоту viewport после смены ориентации
        lastViewportHeight = window.innerHeight;
      }, 100);
    });
    
    // Дополнительная проверка каждые 300ms для мобильных устройств
    setInterval(() => {
      if (header && !mobileMenu?.classList.contains('active') && !isViewportChanging) {
        const currentScroll = getScrollPosition();
        const scrollDiff = currentScroll - lastScrollTop;
        const isScrollingDown = scrollDiff > 0;
        const isScrollingUp = scrollDiff < 0;
        
        // Применяем гистерезис и в fallback механизме
        if (isScrollingDown && Math.abs(scrollDiff) >= HIDE_THRESHOLD && currentScroll > 0) {
          header.classList.add('hidden');
          lastScrollTop = currentScroll;
        } else if (isScrollingUp && Math.abs(scrollDiff) >= SHOW_THRESHOLD) {
          header.classList.remove('hidden');
          lastScrollTop = currentScroll;
        }
      }
    }, 300);
    
    // Дополнительный обработчик для Android Chrome
    if (isAndroidChrome) {
      // Более частые проверки для Android Chrome с гистерезисом
      setInterval(() => {
        if (header && !mobileMenu?.classList.contains('active') && !isViewportChanging) {
          const currentScroll = getScrollPosition();
          const scrollDiff = currentScroll - lastScrollTop;
          const isScrollingDown = scrollDiff > 0;
          const isScrollingUp = scrollDiff < 0;
          
          // Более чувствительные пороги для Android Chrome
          const androidHideThreshold = 3;
          const androidShowThreshold = 2;
          
          if (isScrollingDown && Math.abs(scrollDiff) >= androidHideThreshold && currentScroll > 0) {
            header.classList.add('hidden');
            lastScrollTop = currentScroll;
          } else if (isScrollingUp && Math.abs(scrollDiff) >= androidShowThreshold) {
            header.classList.remove('hidden');
            lastScrollTop = currentScroll;
          }
        }
      }, 200);
    }
  }
  

}

// Инициализируем после загрузки DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeader);
} else {
  initHeader();
}

// Дополнительная инициализация через небольшую задержку для гарантии
setTimeout(() => {
  if (!headerInitialized) {
    initHeader();
  }
}, 100);