document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.co-order-information_title').forEach(title => {
    console.log('Processing title:', title.textContent);
    if (['Способ доставки', 'Адрес доставки'].includes(title.textContent)) {
      const parent = title.closest('.co-order-information_row');
      console.log('Parent element:', parent);
      if (parent) {
        parent.style.display = 'none';
        console.log('Hid parent element');
      } else {
        console.log('Could not find parent element');
      }
    }
  });
});
//-hello-//
;
