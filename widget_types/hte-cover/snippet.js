$(function() {

  updateParallax($widget, 'load');

  $(window).on('load scroll resize', function(event) {
    updateParallax($widget, event.type);
  });

  function updateParallax($widget, event_type) {
    $widget.each(function(i, element) {
      let image = $(element).find('.banner-list__item-image');
      if (image.length) {
        window.requestAnimationFrame(()=> {
          parallaxScroll(image);
          if (event_type == 'scroll') {
            image.addClass('with-transition')
          }
        });
      }
    });
  }

  function parallaxScroll(element) {
    let imageSize = element.css('--offset-h');
    let winHeigth = $(window).outerHeight();
    let BoundingClientRect = element.parent().get(0).getBoundingClientRect();
    let elTop = BoundingClientRect.top;
    let elHeigth = BoundingClientRect.height;
    let picHeigth = elHeigth * imageSize;
    let range = picHeigth - elHeigth;

    let percent = (elTop - winHeigth) / ((winHeigth + elHeigth) / 100);
    element.css('transform', `translate3d(0px, ${+range * (percent / 100)}px, 0px) scale3d(1, 1, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg, 0deg)`);
  }

  EventBus.subscribe(['widget:input-setting:insales:system:editor', 'widget:change-setting:insales:system:editor'], () => {
    updateParallax($widget, 'system:editor')
  });
});
