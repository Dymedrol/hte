EventBus.subscribe('accessories-rendered:insales:ui_accessories', function (data) {
    const gallery = $('#dishes-gallery');
    let currentVariantOptions = [];

    for (let index = 0; index < data.productJSON.option_names.length; index++) {
        const obj = {
            'id': data.productJSON.option_names[index].id,
            'title': data.productJSON.option_names[index].title,
            'current_value': data.productJSON.options[index].current_value.title,
        }
        currentVariantOptions.push(obj);
    }

    // console.log('currentVariantOptions', currentVariantOptions)

    // Костыль чтобы опции были выбраны по умолчанию
    $('.accessory-values__item input').click();


    // Показать/скрыть карточки завтрак/ужин
    $(".settings-panel input").change(function() {
        if ($(this).siblings().filter(function() {
            return $(this).text().toLowerCase().indexOf('завтрак') !== -1;
          }).length > 0) {
            gallery.toggleClass('removeBreakfast')
        }

        if ($(this).siblings().filter(function() {
            return $(this).text().toLowerCase().indexOf('ужин') !== -1;
          }).length > 0) {
            gallery.toggleClass('removeDiner')
        }
    });

    EventBus.subscribe('update_variant:insales:product', function (data) {
        // data.option_values — массив новых значений опций
        let changed = false;
        if (data.option_values && Array.isArray(data.option_values)) {
            data.option_values.forEach((option, idx) => {
                if (
                    currentVariantOptions[idx] &&
                    currentVariantOptions[idx].current_value !== option.title
                ) {
                    currentVariantOptions[idx].current_value = option.title;
                    changed = true;
                }
            });
        }
        if (changed) {
            console.log('changed', currentVariantOptions)
            // Здесь можно вызвать функцию, которая обновит UI или выполнит другие действия
            // Например: updateDishesGallery();
            // console.log('currentVariantOptions обновлены:', currentVariantOptions);
        }
    });

});

