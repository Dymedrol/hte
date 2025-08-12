// 02. Dishes Gallery JavaScript

// Глобальная переменная для данных о блюдах
let dishesData = null;

// Функция для загрузки данных о блюдах
async function loadDishesData() {
  try {
    // Проверяем, есть ли уже загруженные данные
    if (window.dishesData) {
      return window.dishesData;
    }
    
    // Определяем файл данных на основе URL
    function getProgramTypeFromURL() {
      const pathname = window.location.pathname;
      const filename = pathname.split('/').pop();
      
      if (filename.includes('sport')) return 'sport';
      if (filename.includes('base')) return 'base';
              if (filename.includes('perezagruzka')) return 'perezagruzka';
      if (filename.includes('start')) return 'start';
      if (filename.includes('detox')) return 'detox';
      if (filename.includes('premium')) return 'premium';
      
      // По умолчанию возвращаем sport
      return 'sport';
    }
    
    const programType = getProgramTypeFromURL();
    const dataFile = `data/${programType}-dishes-data.json`;
    

    
    const response = await fetch(dataFile);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    dishesData = await response.json();
    

    
    // Обновляем глобальную переменную
    window.dishesData = dishesData;
    
    // Ждем загрузки компонентов перед инициализацией
    await waitForComponents();
    
    // Инициализируем gallery после загрузки данных
    initializeDishesGallery();
    
    return dishesData;
  } catch (error) {
    console.error('Error loading dishes data:', error);
    // Fallback: создаем базовые данные
    dishesData = {
      "calorieOptions": [2300, 2500, 3000],
      "calorieOptionsCount": 3,
      "dishesByDay": {
        "day-1": {
          "dayName": "День 1",
          "dishes": [
            {
              "id": 1,
              "name": "Куриная грудка с овощами",
              "image": "assets/dishes-1.jpg",
              "alt": "Куриная грудка с овощами",
              "nutrition": "320,35,8,12|350,38,9,13|380,41,10,14",
              "isBreakfast": true,
              "isSnack": false,
              "isDinner": false
            }
          ]
        }
      }
    };
    
    // Обновляем глобальную переменную
    window.dishesData = dishesData;
    
    // Ждем загрузки компонентов перед инициализацией
    await waitForComponents();
    initializeDishesGallery();
    
    return dishesData;
  }
}

// Функция для ожидания загрузки компонентов
async function waitForComponents() {
  let attempts = 0;
  const maxAttempts = 50; // 5 секунд максимум
  
  while (attempts < maxAttempts) {
    const dishesGallery = document.querySelector('.dishes-gallery');
    const currentDay = document.querySelector('.current-day');
    const dayItems = document.querySelectorAll('.day-item');
    
    if (dishesGallery && currentDay && dayItems.length > 0) {

      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  console.error('Dishes gallery, current day, or day items not found after 5 seconds');
}

// Функция для получения дня недели из строки даты
function getDayOfWeek(dateString) {
  const date = new Date(dateString);
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

// Функция для обновления dishes-gallery
function updateDishesGallery(dayKey) {
  // console.log('Updating dishes gallery for day:', dayKey);
  // console.log('Dishes data available:', !!dishesData);
  // console.log('Dishes data structure:', dishesData ? Object.keys(dishesData) : 'null');
  
  if (!dishesData) {
    console.error('Dishes data not loaded yet');
    return;
  }
  
  if (!dishesData.dishesByDay) {
    console.error('dishesByDay not found in dishes data');
    return;
  }
  
  if (!dishesData.dishesByDay[dayKey]) {
    console.error('No dishes data for day:', dayKey);

    return;
  }

  const dishesGallery = document.querySelector('.dishes-gallery');
  // console.log('Dishes gallery element:', dishesGallery);
  
  if (!dishesGallery) {
    console.error('Dishes gallery not found');
    return;
  }

  const dayData = dishesData.dishesByDay[dayKey];
  const dishes = dayData.dishes;
  // console.log('Day data:', dayData);
  // console.log('Dishes count:', dishes.length);

  // Очищаем текущее содержимое
  dishesGallery.innerHTML = '';

  // Создаем новые элементы блюд
  dishes.forEach((dish, index) => {
    const dishItem = document.createElement('div');
    dishItem.className = 'dish-item';
    
    dishItem.innerHTML = `
      <img src="${dish.image}" alt="${dish.alt}" />
      <div class="dish-overlay">
        <span>${dish.name}</span>
      </div>
    `;

    dishesGallery.appendChild(dishItem);
    // console.log(`Added dish ${index + 1}: ${dish.name}`);
  });

  // console.log(`Updated dishes gallery for ${dayData.dayName} with ${dishes.length} dishes`);
}

// Функция для получения текущего дня из day-navigation
function getCurrentDayFromNavigation() {
  const currentDayElement = document.querySelector('.current-day');
  // console.log('Current day element:', currentDayElement);
  
  if (!currentDayElement) {
    console.error('Current day element not found');
    return 'day-1'; // fallback к первому дню
  }

  const dayText = currentDayElement.textContent;
  // console.log('Day text:', dayText);
  
  if (!dayText || dayText.trim() === '') {
    console.error('Current day text is empty');
    return 'day-1'; // fallback к первому дню
  }
  
  // Новая логика: извлекаем номер дня программы из глобальной переменной currentIndex
  // и используем функцию calculateProgramDayForDate для получения правильного дня программы
  if (typeof currentIndex !== 'undefined' && typeof generateDaysArray === 'function') {
    try {
      const daysArray = generateDaysArray();
      if (daysArray && daysArray[currentIndex]) {
        const programDayIndex = daysArray[currentIndex].programDayIndex;
        return `day-${programDayIndex + 1}`;
      }
    } catch (error) {
      console.error('Error getting program day index:', error);
    }
  }
  
  // Fallback: извлекаем номер дня из текста (например, "День 15" -> "day-15")
  const dayMatch = dayText.match(/День (\d+)/);
  if (dayMatch) {
    const dayNumber = dayMatch[1];
    // console.log('Found day number:', dayNumber);
    return `day-${dayNumber}`;
  }

  console.log('No day number found, using fallback');
  return 'day-1'; // fallback к первому дню
}

// Функция для инициализации dishes gallery
function initializeDishesGallery() {
  // console.log('Initializing dishes gallery...');
  
  // Данные уже загружены, получаем текущий день
  const currentDay = getCurrentDayFromNavigation();
  // console.log('Current day determined:', currentDay);
  
  // Обновляем gallery
  updateDishesGallery(currentDay);
}

// Функция для обновления gallery при изменении дня в навигации
function onDayChanged() {
  // Проверяем, что данные загружены
  if (!dishesData) {
    // console.log('Dishes data not loaded yet, skipping update');
    return;
  }
  
  const currentDay = getCurrentDayFromNavigation();
  updateDishesGallery(currentDay);
}

// Экспортируем функции для использования в других файлах
window.DishesGallery = {
  initialize: initializeDishesGallery,
  update: updateDishesGallery,
  onDayChanged: onDayChanged,
  getCurrentDay: getCurrentDayFromNavigation
};

// Экспортируем данные блюд для использования в других файлах
window.dishesData = dishesData;

// Слушаем изменения в day-navigation (если есть события)
document.addEventListener('dayChanged', onDayChanged); 