// Флаг для предотвращения повторной инициализации
let headerInitialized = false;

// Переменные для отслеживания прокрутки
let lastScrollTop = 0;
let scrollThreshold = 1; // Минимальное расстояние прокрутки для срабатывания
let ticking = false;

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
    // Пробуем разные способы получения позиции прокрутки
    const currentScrollTop = window.pageYOffset || 
                           document.documentElement.scrollTop || 
                           document.body.scrollTop || 
                           window.scrollY || 
                           0;
    
    const header = document.querySelector('.header');
    const mobileMenu = document.querySelector('.mobile-menu-overlay');
    
    
    if (!header) {
      return;
    }

    // Не скрываем хедер если мобильное меню открыто
    if (mobileMenu && mobileMenu.classList.contains('active')) {
      return;
    }

    // Проверяем, достаточно ли прокрутили для срабатывания
    const scrollDifference = Math.abs(currentScrollTop - lastScrollTop);
    
    if (scrollDifference < scrollThreshold) {
      return;
    }

    // Управление фоном хедера
    if (currentScrollTop > 0) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Если прокручиваем вниз и не в самом верху страницы
    if (currentScrollTop > lastScrollTop && currentScrollTop > 0) {
      // Скрываем хедер
      header.classList.add('hidden');
    } 
    // Если прокручиваем вверх
    else if (currentScrollTop < lastScrollTop) {
      // Показываем хедер
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

  // Добавляем обработчики прокрутки к разным элементам
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
  
  // Инициализация фона хедера при загрузке
  const initialScrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
  const header = document.querySelector('.header');
  if (header) {
    if (initialScrollTop > 0) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
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