var mainSwiper;
$(function () {
    $('.drop-menu').each(function () {
        new Menu($(this));
    });

    $.each($('.pixel-grid__slider'), function () {

        new SliderSingle($(this));

    });

    $.each($('.formats__slider'), function () {

        new SliderFormats($(this));

    });

    $.each($('.preloader'), function () {

        new Preloader($(this));

    });

});


var Preloader = function (obj) {

    var _obj = obj,
        _deelay = _obj.data('deelay'),
        _window = $(window);

    var _onEvents = function () {

            _window.on({
                load: function () {

                    setTimeout(function () {
                        _obj.addClass('hide');

                        setTimeout(function () {
                            _obj.remove();

                            $('.site').each(function () {
                                mainSwiper = new Screen($(this));
                            });

                        }, 400);

                    }, _deelay);

                }
            });

        },

        _init = function () {
            _onEvents();
        };

    _init();
};


var Screen = function (obj) {

    //private properties
    var _self = this,
        _obj = obj,
        _swiper,
        _screenHeight = $(window).height(),
        _item = _obj.find('.pages__item');


    _obj[0].obj = _self;

    //private methods


    var _initContentScroll = function () {
            _swiper = new Swiper('.site', {
                direction: 'vertical',
                slidesPerView: 'auto',
                scrollbarDraggable: true,
                scrollbarSnapOnRelease: true,
                paginationClickable: false,
                spaceBetween: 0,
                slideActiveClass: 'active',
                simulateTouch: true,
                mousewheelControl: true,
                scrollbar: '.swiper-scrollbar',
                scrollbarHide: false,
                grabCursor: false,
                longSwipes: false,
                resistance:false,
                iOSEdgeSwipeDetection:true,
                threshold: 10,
                freeMode: false,
                autoHeight:false
            });
            var startScroll, touchStart, touchCurrent;
            _swiper.slides.on('touchstart', function (e) {
                startScroll = this.scrollTop;
                touchStart = e.targetTouches[0].pageY;
            }, true);
            _swiper.slides.on('touchmove', function (e) {
                touchCurrent = e.targetTouches[0].pageY;
                var touchesDiff = touchCurrent - touchStart;
                var slide = this;
                var onlyScrolling =
                    ( slide.scrollHeight > slide.offsetHeight ) &&
                    (
                        ( touchesDiff < 0 && startScroll === 0 ) ||
                        ( touchesDiff > 0 && startScroll === ( slide.scrollHeight - slide.offsetHeight ) ) ||
                        ( startScroll > 0 && startScroll < ( slide.scrollHeight - slide.offsetHeight ) )
                    );
                if (onlyScrolling) {
                    e.stopPropagation();
                }
            }, true);
        },

        _blockAnalize = function () {
            _screenHeight = $(window).height();

            _item.each(function (i) {
                _wrapHeight = $(this).find('>div').outerHeight();
                if (_screenHeight < _wrapHeight) {
                    if ($(window).width() <= 768) {
                        $(this).css('overflow', 'scroll');
                    }else{
                        $(this).css('overflow', 'hidden');
                    }

                }
            });
        },
        _onEvents = function(){
            $(window).on('resize',function(){
                    _blockAnalize();
            })
        },
        _sizeEvents = function () {
            if ($(window).width() <= 768) {
                _initContentScroll();
                _blockAnalize();
            } else {
                _initContentScroll();
            }
        },
        _init = function () {
            _sizeEvents();
            _onEvents();
        },
        _detachSwiper = function () {
            _swiper.detachEvents();
            _swiper.scrollbar.disableDraggable();
            _swiper.disableMousewheelControl();
        },
        _atachSwiper = function () {
            _swiper.attachEvents();
            _swiper.scrollbar.enableDraggable();
            _swiper.enableMousewheelControl();
        };

    //public properties
    _self.detachSwiper = function () {
        _detachSwiper();
    };
    _self.atachSwiper = function () {
        _atachSwiper();
    };
    //public methods
    _init();
};

var SliderFormats = function (obj) {

    //private properties
    var _self = this,
        _obj = obj,
        _objInner = _obj.find('>div'),
        _items = _objInner.find('.formats__slider-item'),
        _itemsArrow = _items.find('.formats__slider-arrow'),
        _text = _objInner.find('.formats__slider-text'),
        _textItems = _text.find('>div'),
        _timer,
        _distance = 0,
        _window = $(window);

    //private methods
    var _addEvents = function () {

            _items.on({
                'mouseenter': function () {

                    if (_window.width() >= 992) {

                        _changeText($(this));

                    }
                }
            });

            _items.on({
                'click': function () {

                    if (_window.width() < 992) {

                        _changeText($(this));

                        clearInterval(_timer);

                        _changeNext();

                    }

                    return false

                }
            });

            _obj.on({

                'mouseenter': function () {

                    clearInterval(_timer);

                },

                'mouseleave': function () {

                    _changeNext();

                }

            });

            _window.on({
                'resize': function () {

                    _positionItems();

                }
            });

        },
        _changeText = function (item) {

            var itemIndex = item.index(),
                textBlock = _textItems.eq(itemIndex);

            _items.removeClass('active');

            item.addClass('active');

            _textItems.removeClass('visible');

            textBlock.addClass('visible');

            clearInterval(_timer);

        },
        _positionItems = function () {

            if (_window.width() < 768) {

                _distance = 20;

            } else if (_window.width() >= 768 && _window.width() < 1200) {

                _distance = 70;

            } else {

                _distance = 54;

            }

            var radius = (_objInner.width() + _distance) / 2 + 'px',
                start = -90,
                numberOfElements = _items.length,
                slice = 360 / numberOfElements;

            _items.each(function (i) {

                var curItem = $(this),
                    rotate = slice * i + start,
                    rotateReverse = rotate * -1;

                curItem.css({
                    '-webkit-transform': 'rotate(' + rotate + 'deg) translate(' + radius + ') rotate(' + rotateReverse + 'deg)',
                    'transform': 'rotate(' + rotate + 'deg) translate(' + radius + ') rotate(' + rotateReverse + 'deg)'
                });

            });

            _itemsArrow.each(function (i) {

                var curItem = $(this),
                    rotate = slice * i + start,
                    rotateReverse = rotate * -1,
                    rotate2 = slice * i;

                curItem.css({
                    '-webkit-transform': 'rotate(' + rotate + 'deg) rotate(' + (rotateReverse + rotate2) + 'deg)',
                    'transform': 'rotate(' + rotate + 'deg) rotate(' + (rotateReverse + rotate2) + 'deg)'
                });

            });
        },
        _changeNext = function () {

            _timer = setInterval(function () {

                var activeItem = _items.filter('.active'),
                    nextItem = activeItem.next(),
                    nextItemIndex = nextItem.index(),
                    currentTextBlock = _textItems.eq(nextItemIndex);

                if (nextItem.index() == -1) {

                    nextItem = _items.eq(0);
                    currentTextBlock = _textItems.eq(0);

                }

                _items.removeClass('active');

                _textItems.removeClass('visible');

                nextItem.addClass('active');

                currentTextBlock.addClass('visible');

            }, 5000);

        },
        _startView = function () {

            setTimeout(function () {

                var activeItem = _items.filter('.active'),
                    activeItemIndex = activeItem.index(),
                    currentTextBlock = _textItems.eq(activeItemIndex);

                currentTextBlock.addClass('visible');

                _text.addClass('visible-text');

                _changeNext();

            }, 2000);

        },
        _init = function () {

            _obj[0].obj = _self;
            _positionItems();
            _startView();
            _addEvents();
        };

    _init();
};

var Menu = function (obj) {
    var _obj = obj,
        _btn = $('.drop-menu-btn'),
        _parentWrap = $('.site__header'),
        _menuContent = _obj.find('.drop-menu__inner-wrap');

    var is_article = false;
    var _onEvents = function () {
            _btn.on({
                click: function () {
                    if (_parentWrap.hasClass('site__header_drop-menu')) {
                        _parentWrap.removeClass('site__header_drop-menu');
                        mainSwiper.atachSwiper();

                    } else {
                        _parentWrap.addClass('site__header_drop-menu');
                        mainSwiper.detachSwiper();
                    }
                }
            })
        },
        _initContentScroll = function () {
            _menuContent.niceScroll({
                cursorcolor: '#fff',
                zindex: 10,
                autohidemode: false,
                horizrailenabled: false,
                cursorborderradius: 0,
                cursorwidth: '2px'
            });
        },
        init = function () {
            _initContentScroll();
            _onEvents();
        };

    init()
};

var SliderSingle = function (obj) {

    //private properties
    var _self = this,
        _obj = obj,
        _sliderSwiper,
        _slider = _obj.find('.swiper-container');

    //private methods
    var _initSlider = function () {

            _sliderSwiper = new Swiper(_slider, {

                pagination: $('.swiper-pagination'),
                paginationClickable: true,
                loop: false,
                direction: 'horizontal',
                spaceBetween: 30

            });

        },
        _init = function () {

            _initSlider();
            _obj[0].obj = _self;

        };

    _init();
};
