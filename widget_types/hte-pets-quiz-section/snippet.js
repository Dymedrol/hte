// Pets Quiz Component JavaScript

class PetsQuiz {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 3; // Изменено с 4 на 3
    this.selectedPetType = null;
    this.petWeight = null;
    this.excludedProducts = [];
    
    // Переменные для детального логирования расчетов
    this.calculationDetails = null;
    this.excludedAllergens = [];
    this.orderComment = null;
  }

  init() {
    this.bindEvents();
    this.updateProgress();
  }

  bindEvents() {
    // Add click events to pet options
    const petOptions = document.querySelectorAll('.pet-option');
    petOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        this.selectPetType(option);
      });
    });

    // Add click events to product items
    const productItems = document.querySelectorAll('.product-item');
    productItems.forEach(item => {
      item.addEventListener('click', (e) => {
        this.toggleProductSelection(item);
      });
    });

    // Add weight input events for all weight inputs
    this.bindWeightEvents();

    // Add navigation button events
    this.bindNavigationEvents();
  }

  bindWeightEvents() {
    // Bind events for all weight inputs
    const weightInputs = document.querySelectorAll('.weight-input');
    const minusBtns = document.querySelectorAll('.minus-btn');
    const plusBtns = document.querySelectorAll('.plus-btn');

    weightInputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        this.validateWeightInput(e.target, index);
      });
    });

    minusBtns.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const input = weightInputs[index];
        const currentValue = parseFloat(input.value) || 0;
        
        // Определяем шаг и минимальное значение в зависимости от типа питомца
        let step = 0.1; // По умолчанию 100 гр для кошек
        let minWeight = 0.1; // Минимум для всех питомцев (положительный вес)
        
        if (index === 0) {
          step = 0.5; // Щенки - 500 гр
        } else if (index === 1) {
          step = 0.5; // Взрослые собаки - 500 гр
        }
        
        const newValue = Math.max(minWeight, currentValue - step);
        input.value = newValue.toFixed(1);
        this.petWeight = newValue;
      });
    });

    plusBtns.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const input = weightInputs[index];
        const currentValue = parseFloat(input.value) || 0;
        
        // Определяем шаг в зависимости от типа питомца
        let step = 0.1; // По умолчанию 100 гр для кошек
        
        if (index === 0) {
          step = 0.5; // Щенки - 500 гр
        } else if (index === 1) {
          step = 0.5; // Взрослые собаки - 500 гр
        }
        
        const newValue = currentValue + step;
        input.value = newValue.toFixed(1);
        this.petWeight = newValue;
      });
    });
  }

  validateWeightInput(input, petIndex) {
    let value = input.value;
    
    // Убираем все нечисловые символы кроме точки
    value = value.replace(/[^0-9.]/g, '');
    
    // Убираем лишние точки (оставляем только первую)
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Если значение пустое, устанавливаем минимальное
    if (value === '' || value === '.') {
      input.value = '';
      return;
    }
    
    let numValue = parseFloat(value);
    
    // Проверяем корректность числа
    if (isNaN(numValue)) {
      input.value = '';
      return;
    }
    
    // Определяем минимальный вес для всех питомцев (положительный вес)
    let minWeight = 0.1;
    
    // Ограничиваем значение только по минимальному весу
    if (numValue < minWeight) {
      numValue = minWeight;
    }
    
    // Определяем точность в зависимости от типа питомца
    let precision = 1; // По умолчанию 1 знак для кошек (0.1 кг)
    if (petIndex === 0 || petIndex === 1) {
      // Для щенков и взрослых собак - точность до 0.5
      numValue = Math.round(numValue * 2) / 2;
      precision = 1;
    }
    
    // Обновляем значение в поле
    input.value = numValue.toFixed(precision);
    
    // Сохраняем вес
    this.petWeight = numValue;
  }

  toggleProductSelection(item) {
    item.classList.toggle('selected');
    const productName = item.dataset.product;
    
    if (item.classList.contains('selected')) {
      this.excludedProducts.push(productName);
    } else {
      const index = this.excludedProducts.indexOf(productName);
      if (index > -1) {
        this.excludedProducts.splice(index, 1);
      }
    }
  }

  bindNavigationEvents() {
    // Next button for puppy
    const btnNextStep1Puppy = document.getElementById('btn-next-step1-puppy');
    if (btnNextStep1Puppy) {
      btnNextStep1Puppy.addEventListener('click', () => {
        this.nextStep();
      });
    }

    // Next button for adult dog
    const btnNextStep1AdultDog = document.getElementById('btn-next-step1-adult-dog');
    if (btnNextStep1AdultDog) {
      btnNextStep1AdultDog.addEventListener('click', () => {
        this.nextStep();
      });
    }

    // Next button for cat
    const btnNextStep1Cat = document.getElementById('btn-next-step1-cat');
    if (btnNextStep1Cat) {
      btnNextStep1Cat.addEventListener('click', () => {
        this.nextStep();
      });
    }

    // Back button for step 2
    const btnBackStep2 = document.getElementById('btn-back-step2');
    if (btnBackStep2) {
      btnBackStep2.addEventListener('click', () => {
        this.previousStep();
      });
    }

    // Next button for step 2
    const btnNextStep2 = document.getElementById('btn-next-step2');
    if (btnNextStep2) {
      btnNextStep2.addEventListener('click', () => {
        this.calculateDiet();
        this.nextStep();
      });
    }

    // Back button for step 3
    const btnBackStep3 = document.getElementById('btn-back-step3');
    if (btnBackStep3) {
      btnBackStep3.addEventListener('click', () => {
        this.previousStep();
      });
    }

    // Add to cart button for step 3
    const btnAddToCart = document.getElementById('btn-add-to-cart');
    if (btnAddToCart) {
      btnAddToCart.addEventListener('click', () => {
        this.addToCart();
      });
    }
  }

  getPetTypeInRussian(petType) {
    const petTypes = {
      'puppy': 'Щенок',
      'adult-dog': 'Взрослая собака',
      'cat': 'Кошка'
    };
    return petTypes[petType] || petType;
  }

  calculateDiet() {
    if (!this.selectedPetType || !this.petWeight) {
      console.error('Missing pet type or weight for calculation');
      return;
    }

    // Расчет порции на день по новым формулам
    let dailyAmountGrams = 0;
    
    switch(this.selectedPetType) {
      case 'puppy':
        dailyAmountGrams = this.petWeight * 60; // Щенок: вес(кг) * 60
        break;
      case 'adult-dog':
        dailyAmountGrams = this.petWeight * 30; // Собака: вес(кг) * 30
        break;
      case 'cat':
        dailyAmountGrams = this.petWeight * 45; // Кошка: вес(кг) * 45
        break;
      default:
        dailyAmountGrams = this.petWeight * 30; // По умолчанию как для собаки
    }

    // Питание продается на неделю (день * 7)
    const weeklyAmountGrams = dailyAmountGrams * 7;

    // Определяем размер пакетиков и их количество
    const packageInfo = this.calculatePackaging(weeklyAmountGrams);

    // Переменные для логирования (на русском для комментариев к заказу)
    this.calculationDetails = {
      petType: this.getPetTypeInRussian(this.selectedPetType),
      weight: `${this.petWeight} кг`,
      dailyAmount: `${Math.round(dailyAmountGrams)} грамм в день`,
      weeklyAmount: `${Math.round(weeklyAmountGrams)} грамм в неделю`,
      packaging: `Пакетики по ${packageInfo.packageSize} г × ${packageInfo.packageCount}шт (округлено в большую сторону)`,
      totalWeight: `${packageInfo.totalWeight} грамм общий вес`,
      packageRule: this.getPackageRule(weeklyAmountGrams),
      excessAmount: `${packageInfo.totalWeight - Math.round(weeklyAmountGrams)} грамм избыток (гарантия достаточного количества)`
    };

    this.excludedAllergens = this.excludedProducts.length > 0 
      ? `Исключены: ${this.excludedProducts.join(', ')}`
      : 'Аллергены не исключены';

    // Сохраняем результаты для отображения
    this.dietResults = {
      dailyAmount: Math.round(dailyAmountGrams),
      weeklyPackages: packageInfo.packageCount,
      petType: this.selectedPetType,
      weight: this.petWeight,
      excludedProducts: this.excludedProducts,
      packageSize: packageInfo.packageSize,
      totalWeight: packageInfo.totalWeight
    };

    // Детальное логирование (на русском для комментариев к заказу)
    console.log('=== РАСЧЕТ ПОРЦИИ ===');
    console.log('Тип питомца:', this.calculationDetails.petType);
    console.log('Вес питомца:', this.calculationDetails.weight);
    console.log('Дневная порция:', this.calculationDetails.dailyAmount);
    console.log('Недельная порция:', this.calculationDetails.weeklyAmount);
    console.log('Упаковка:', this.calculationDetails.packaging);
    console.log('Общий вес:', this.calculationDetails.totalWeight);
    console.log('Избыток:', this.calculationDetails.excessAmount);
    
    console.log('=== АЛЛЕРГЕНЫ ===');
    console.log(this.excludedAllergens);
    
    console.log('=== КОММЕНТАРИЙ К ЗАКАЗУ ===');
    this.orderComment = `${this.calculationDetails.petType}, ${this.calculationDetails.weight}. ${this.calculationDetails.dailyAmount}, ${this.calculationDetails.weeklyAmount}. ${this.calculationDetails.packaging}, ${this.calculationDetails.totalWeight}. ${this.calculationDetails.excessAmount}. ${this.excludedAllergens}.`;
    console.log(this.orderComment);
    
    console.log('=== РЕЗУЛЬТАТ РАСЧЕТА ===', this.dietResults);

    // Обновляем отображение результатов
    this.updateDietDisplay();
  }

  calculatePackaging(weeklyAmountGrams) {
    // Правила упаковки для собак и щенков
    // ВАЖНО: Количество пакетиков округляется в большую сторону (Math.ceil)
    // для гарантии достаточного количества корма
    if (this.selectedPetType === 'puppy' || this.selectedPetType === 'adult-dog') {
      let packageSize = 100; // По умолчанию 100гр
      let packageRule = '';
      
      // Сравниваем ВЕС ПИТОМЦА, а не недельную порцию!
      if (this.petWeight < 10) {
        // Меньше 10 кг - пакетики по 100 гр
        packageSize = 100;
                packageRule = 'Вес питомца меньше 10 кг → пакетики по 100 гр';
      } else if (this.petWeight >= 10 && this.petWeight <= 20) {
        // От 10 до 20 кг - пакетики по 250 гр
        packageSize = 250;
        packageRule = 'Вес питомца от 10 до 20 кг → пакетики по 250 гр';
      } else {
        // Больше 20 кг - пакетики по 500 гр
        packageSize = 500;
        packageRule = 'Вес питомца больше 20 кг → пакетики по 500 гр';
      }
      
      // Округляем количество пакетиков в большую сторону для гарантии достаточного количества
      const packageCount = Math.ceil(weeklyAmountGrams / packageSize);
      const totalWeight = packageCount * packageSize;
      
      return {
        packageSize: packageSize,
        packageCount: packageCount,
        totalWeight: totalWeight
      };
    } else {
      // Для кошек - пакетики по 100 гр (можно изменить правила позже)
      // ВАЖНО: Количество пакетиков округляется в большую сторону (Math.ceil)
      // для гарантии достаточного количества корма
      const packageSize = 100;
      // Округляем количество пакетиков в большую сторону для гарантии достаточного количества
      const packageCount = Math.ceil(weeklyAmountGrams / packageSize);
      const totalWeight = packageCount * packageSize;
      
      return {
        packageSize: packageSize,
        packageCount: packageCount,
        totalWeight: totalWeight
      };
    }
  }

  getPackageRule(weeklyAmountGrams) {
    if (this.selectedPetType === 'puppy' || this.selectedPetType === 'adult-dog') {
      if (this.petWeight < 10) {
        return 'Пакетики по 100 гр (вес питомца меньше 10 кг, округление в большую сторону)';
      } else if (this.petWeight >= 10 && this.petWeight <= 20) {
        return 'Пакетики по 250 гр (вес питомца от 10 до 20 кг, округление в большую сторону)';
      } else {
        return 'Пакетики по 500 гр (вес питомца больше 20 кг, округление в большую сторону)';
      }
    } else {
      return 'Пакетики по 100 гр (для кошек, округление в большую сторону)';
    }
  }

  updateDietDisplay() {
    const dailyAmountElement = document.getElementById('daily-amount');
    const weeklyPackagesElement = document.getElementById('weekly-packages');
    const packageSizeElement = document.getElementById('package-size');

    if (dailyAmountElement && this.dietResults) {
      dailyAmountElement.textContent = this.dietResults.dailyAmount;
    }

    if (weeklyPackagesElement && this.dietResults) {
      weeklyPackagesElement.textContent = this.dietResults.weeklyPackages;
    }

    if (packageSizeElement && this.dietResults) {
      packageSizeElement.textContent = this.dietResults.packageSize;
    }

    // Обновляем картинку питомца на итоговом экране
    this.updatePetResultImage();
  }

  updatePetResultImage() {
    const imageContainer = document.querySelector('.image-container');
    if (!imageContainer) return;

    // Убираем все предыдущие классы
    imageContainer.classList.remove('result-dog', 'result-puppy', 'result-cat');
    
    // Добавляем соответствующий класс в зависимости от выбранного питомца
    if (this.selectedPetType === 'puppy') {
      imageContainer.classList.add('result-puppy');
    } else if (this.selectedPetType === 'adult-dog') {
      imageContainer.classList.add('result-dog');
    } else if (this.selectedPetType === 'cat') {
      imageContainer.classList.add('result-cat');
    }
  }

  addToCart() {
    // Здесь можно реализовать функциональность добавления в корзину
    
    // Показываем сообщение об успехе
    alert('Программа добавлена в корзину!');
  }

  getExcludedProducts() {
    return this.excludedProducts;
  }

  selectPetType(option) {
    // Remove previous selection
    const previousSelected = document.querySelector('.pet-option.selected');
    if (previousSelected) {
      previousSelected.classList.remove('selected');
      // Hide weight selector for previously selected option
      const prevWeightSelector = previousSelected.querySelector('.weight-selector');
      if (prevWeightSelector) {
        prevWeightSelector.style.display = 'none';
      }
      // Hide selected badge for previously selected option
      const prevSelectedBadge = previousSelected.querySelector('.selected-badge');
      if (prevSelectedBadge) {
        prevSelectedBadge.style.display = 'none';
      }
    }

    // Add selection to current option
    option.classList.add('selected');
    
    // Store selected pet type
    this.selectedPetType = option.dataset.petType;
    
    // Add visual feedback
    this.highlightSelection(option);
    
    // Show selected badge for selected option
    const selectedBadge = option.querySelector('.selected-badge');
    if (selectedBadge) {
      selectedBadge.style.display = 'block';
    }
    
    // Show weight selector for selected option
    const weightSelector = option.querySelector('.weight-selector');
    if (weightSelector) {
      weightSelector.style.display = 'flex';
      // Get the weight input for this option
      const weightInput = weightSelector.querySelector('.weight-input');
      if (weightInput) {
        this.petWeight = parseFloat(weightInput.value);
      }
    }
  }

  highlightSelection(option) {
    // Add selected class for styling (CSS will handle the border)
    option.classList.add('selected');
  }

  updateProgress() {
    // Находим только видимый прогресс бар (на текущем шаге)
    const currentStepElement = document.getElementById(`step-${this.currentStep}`);
    const progressSegments = currentStepElement ? currentStepElement.querySelectorAll('.progress-segment') : [];
    const stepCounters = document.querySelectorAll('.step-counter');
    
    // Update all step counters
    stepCounters.forEach(counter => {
      counter.textContent = `${this.currentStep}/${this.totalSteps}`;
    });
    
    // Update progress bar for current step
    // Теперь обновляем только видимый прогресс бар
    progressSegments.forEach((segment, index) => {
      if (index < this.currentStep) {
        segment.classList.add('active');
      } else {
        segment.classList.remove('active');
      }
    });
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.showStep(this.currentStep);
    }
  }

  showStep(stepNumber) {
    // Hide all steps
    const allSteps = document.querySelectorAll('.pets-quiz-section, .pets-quiz-step');
    allSteps.forEach(step => {
      step.style.display = 'none';
    });

    // Show current step
    const stepElement = document.getElementById(`step-${stepNumber}`);
    if (stepElement) {
      stepElement.style.display = 'flex';
    } else {
      console.error(`Step ${stepNumber} element not found`);
    }

    // Update progress bar for current step
    this.updateProgress();
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.showStep(this.currentStep);
    }
  }

  getSelectedPetType() {
    return this.selectedPetType;
  }

  reset() {
    this.currentStep = 1;
    this.selectedPetType = null;
    this.petWeight = null;
    this.excludedProducts = [];
    this.dietResults = null;
    
    this.showStep(1);
    
    // Remove all selections
    const selectedOptions = document.querySelectorAll('.pet-option.selected');
    selectedOptions.forEach(option => {
      option.classList.remove('selected');
      
      // Hide weight selector
      const weightSelector = option.querySelector('.weight-selector');
      if (weightSelector) {
        weightSelector.style.display = 'none';
      }
      
      // Hide selected badge
      const selectedBadge = option.querySelector('.selected-badge');
      if (selectedBadge) {
        selectedBadge.style.display = 'none';
      }
    });

    // Remove product selections
    const selectedProducts = document.querySelectorAll('.product-item.selected');
    selectedProducts.forEach(item => {
      item.classList.remove('selected');
    });

    // Reset weight inputs to default values
    const weightInputs = document.querySelectorAll('.weight-input');
    weightInputs[0].value = '5';   // Puppy default
    weightInputs[1].value = '25';  // Adult dog default
    weightInputs[2].value = '4';   // Cat default
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const petsQuiz = new PetsQuiz();
  petsQuiz.init();
});