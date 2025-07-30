EventBus.subscribe('accessories-rendered:insales:ui_accessories', function (data) {
    console.log('Была выполнена инициализация компонента ui-accessories', data);
    $('.accessory-values__item input').click();
});

console.log('cccccc');
console.log('!!!', program);