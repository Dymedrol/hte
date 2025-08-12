// 02. Конфигурация аллергенов - общий список для всех программ

// Глобальная переменная для аллергенов
// let ALLERGENS_CONFIG = null;

// Функция для загрузки конфигурации аллергенов
async function loadAllergensConfig() {
  // Если уже загружено, возвращаем существующую конфигурацию
  if (ALLERGENS_CONFIG && window.ALLERGENS_CONFIG) {
    return ALLERGENS_CONFIG;
  }
  
  try {
    const response = await fetch('data/allergens.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    ALLERGENS_CONFIG = await response.json();
    
    // Обновляем глобальную переменную
    window.ALLERGENS_CONFIG = ALLERGENS_CONFIG;
    
    // Инициализируем аллергены после загрузки конфигурации
    if (typeof generateAllergenItems === 'function') {
      generateAllergenItems(ALLERGENS_CONFIG.data);
    }
    
    return ALLERGENS_CONFIG;
  } catch (error) {
    console.error('❌ Ошибка загрузки аллергенов:', error);
    throw error;
  }
}

// Загружаем конфигурацию при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  loadAllergensConfig();
});

// Экспортируем конфигурацию
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ALLERGENS_CONFIG;
}

// Экспортируем в глобальную область видимости
window.ALLERGENS_CONFIG = ALLERGENS_CONFIG; 
