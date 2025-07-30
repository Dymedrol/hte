/* eslint-disable linebreak-style */
var isTouch = !!('ontouchstart' in window || navigator.msMaxTouchPoints);
var mobilePoint = 768;

function getWidget(item) {
  return item.closest('.layout');
}

$(document).ready(function() {
  if (isTouch) {
    $(widget).find(".header").addClass("is-touch");
  }

  $(widget).find("[data-catalog-current]").each(function(index, el) {
    let currrent_link = $(el).data('catalog-current')
    let currrent_selector = `[data-navigation-link="${currrent_link}"]`;
    $(currrent_selector).addClass('is-current')
  })

  $(widget).find(".js-show-header-collections").on("click", function() {
    let thisWidget = getWidget($(this));

    thisWidget.each(function(index, el) {
      let lazyLoadCollectionList = new LazyLoad({
        container: $(el).get(0),
        elements_selector: '.lazyload'
      });

      try {
        lazyLoadCollectionList.loadAll()
      } catch (e) {
        console.log(e)
      }
    });

    let collections_menu = thisWidget.find(".header__collections");
    let collections_menu_content = collections_menu.find(".header__collections-content");

    if (collections_menu.is(".is-show")) {
      collections_menu.removeClass("is-show");
    } else {
      collections_menu.addClass("is-show");

      let max_height = $(window).height() - collections_menu.offset().top - 20;
      collections_menu_content.css("maxHeight", max_height);
    }

    $(this).toggleClass("is-active");
    thisWidget.find(".header__collections-overlay").toggleClass("is-show");
  });

  $(document).on("click", function(event) {
    let thisWidget = getWidget($(event.target).closest('.layout'));

    if ($(event.target).closest(".js-show-header-collections").length || $(event.target).closest(".header__collections-content").length) {
      return;
    }

    thisWidget.find(".header__collections.is-show").removeClass("is-show");
    thisWidget.find(".header__collections-overlay.is-show").removeClass("is-show");
    thisWidget.find(".js-show-header-collections").removeClass("is-active");
  });


  if ($(window).width() >= mobilePoint) {
    new InsalesCutList($(widget).find(".js-cut-list"), {
      moreBtnTitle: '<span class="icon icon-ellipsis-h"></span>',
      alwaysVisibleElem: '.is-current',
      minWidth: 767
    });
  }


  new InsalesCutList($(widget).find(".js-cut-list-menu"), {
    moreBtnTitle: '<span class="icon icon-ellipsis-h"></span>',
    showMoreOnHover: true,
    minWidth: 767
  });

  $(window).on('load', function() {
    $(widget).find(".js-cut-list").resize();
    $(widget).find(".js-cut-list-menu").resize();
  });

  if ($(widget).find(".header__collections .is-current").length) {
    if ($(window).width() < mobilePoint ) {
      $(widget).find(".header__collections .is-current").addClass("is-show");
    }
  }

  $(widget).find(".js-toggle-languages-list").on("click", function() {
    $(this).parents(".header__languages").toggleClass("is-show");
  });


  $(widget).find(".js-show-mobile-submenu").on("click", function() {
    $(this).parents(".header__collections-item:first").toggleClass("is-show-mobile");
  });


  $(".header__collections-item").hover(
    function() {
      var submenu = $(this).find("> .header__collections-submenu");

      if (submenu.length && submenu.offset().left + submenu.innerWidth() > $(window).width()) {
        submenu.addClass("is-right");
      }
    },
    function() {
      $(this).find("> .header__collections-submenu").removeClass("is-right");
    }
  )

  $(widget).find(".js-show-touch-submenu").on("click", function() {
    let thisWidget = getWidget($(this));

    var root_item = $(this).parents(".header__collections-item:last");
    var cur_item = $(this).parents(".header__collections-item:first");
    var submenu = cur_item.find("> .header__collections-submenu");

    if ($(window).width() >= mobilePoint) {
      if ($(this).parents(".cut-list__more-content").length) {
        $(this).parents(".cut-list__more-content").find("> .header__collections-item.is-show").each(function() {
          if ($(this).is(root_item) == false) {
            $(this).removeClass("is-show is-right").find(".header__collections-item.is-show").removeClass("is-show is-right");
          }
        });
      } else {
        thisWidget.find(".header__collections > .header__collections-item.is-show").each(function() {
          if ($(this).is(root_item) == false) {
            $(this).removeClass("is-show is-right").find(".header__collections-item.is-show").removeClass("is-show is-right");
          }
        });
      }
    }

    cur_item.toggleClass("is-show");

    if (submenu.length && submenu.offset().left + submenu.innerWidth() > $(window).width()) {
      submenu.addClass("is-right");
    }
  });

  $(document).on("click", function(event) {
    let thisWidget = getWidget($(event.target).closest('.layout'));

    if ($(event.target).closest(".header__collections").length) {
      return;
    }

    if ($(window).width() >= mobilePoint) {
      thisWidget.find(".header__collections-item").removeClass("is-show is-right");
    }
  });

  $(widget).find(".cut-list__drop-toggle").on("click", function() {
    let thisWidget = getWidget($(this));

    if ($(window).width() >= mobilePoint) {
      thisWidget.find(".header__collections-item").removeClass("is-show is-right");
    }
  });

  $(widget).find(".js-show-mobile-menu").on("click", function() {
    let thisWidget = getWidget($(this));

    thisWidget.find(".header").addClass("is-show-mobile");
    let targetElement = thisWidget.find(".header").get(0);
    bodyScrollLock.disableBodyScroll(targetElement);

    thisWidget.each(function(index, el) {
      let lazyLoadCollectionList = new LazyLoad({
        container: $(el).get(0),
        elements_selector: '.lazyload'
      });

      try {
        lazyLoadCollectionList.loadAll()
      } catch (e) {
        console.log(e)
      }
    });
  });

  $(widget).find(".js-hide-mobile-menu").on("click", function() {
    let thisWidget = getWidget($(this));

    thisWidget.find(".header").removeClass("is-show-mobile");
    let targetElement = thisWidget.find(".header").get(0);
    bodyScrollLock.enableBodyScroll(targetElement);
  });

  $(widget).find(".js-show-mobile-search").on("click", function() {
    $(this).parents(".header__search").toggleClass("is-show-mobile").find(".header__search-field").focus();
  });

  $(widget).find(".js-show-more-subcollections").on("click", function() {
    let thisWidget = getWidget($(this));

    let collections_menu = thisWidget.find(".header__collections-menu");
    let limit = collections_menu.attr("data-subcollections-items-limit");
    let collection_elem = $(this).parents(".header__collections-item.is-level-1");

    if ($(this).is(".is-active")) {
      $(this).removeClass("is-active");
      collection_elem.find('.header__collections-submenu .header__collections-item:nth-child(n+' + (parseInt(limit) + 1) + ')').addClass("is-hide");
    } else {
      $(this).addClass("is-active");
      collection_elem.find(".header__collections-submenu .header__collections-item").removeClass("is-hide");
    }
  });
});

$(function() {
  EventBus.subscribe(['widget:input-setting:insales:system:editor', 'widget:change-setting:insales:system:editor'], () => {
    $(widget).find(".js-cut-list").resize();
    $(widget).find(".js-cut-list-menu").resize();
  });
});


EventBus.subscribe('widget:change-setting:insales:system:editor', (data) => {
  $(widget).find(".js-cut-list").resize();

  if (data.setting_name == 'subcollections-items-limit') {
    configureSubcollectionsItemsLimit(data.value);
  }
});

EventBus.subscribe('update_items:insales:favorites_products', (data) => {
  $(widget).find(".header__favorite").attr('data-badge-count', data.products.length);
});

EventBus.subscribe('update_items:insales:cart:light', (data) => {
  $(widget).find(".header__cart, .header__mobile-cart").attr('data-badge-count', data.order_lines.length);
});


function configureSubcollectionsItemsLimit(limit) {
  let collections_menu = $(widget).find(".header__collections-menu");
  collections_menu.attr("data-subcollections-items-limit", limit);

  $(widget).find(".header__collections-submenu").each(function() {
    let collection_elem = $(this).parents(".header__collections-item.is-level-1");
    let collection_elem_more_controls = collection_elem.find(".header__collections-show-more");

    $(this).find(".header__collections-item").removeClass("is-hide");
    $(this).find('.header__collections-item:nth-child(n+' + (parseInt(limit) + 1) + ')').addClass("is-hide");
    collection_elem_more_controls.find(".js-show-more-subcollections").removeClass("is-active");

    if ($(this).find(".header__collections-item").length > parseInt(limit)) {
      collection_elem_more_controls.addClass("is-show");
    } else {
      collection_elem_more_controls.removeClass("is-show");
    }
  });
}
