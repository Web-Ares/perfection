$(function () {
    $( '.drop-menu' ).each( function() {
        new Menu( $( this ) );
    } );

    $.each($('.pixel-grid__slider'), function () {

        new SliderSingle($(this));

    });

    $.each($('.formats__slider'), function () {

        new SliderFormats($(this));

    });

    $.each($( '.preloader' ), function () {

        new Preloader($(this));

    });

});


var Preloader = function ( obj ) {

    var _obj = obj,
        _deelay = _obj.data('deelay'),
        _window = $( window);

    var _onEvents = function () {

            _window.on({
                load: function(){

                    setTimeout(function () {
                        _obj.addClass( 'hide' );

                        setTimeout(function () {
                            $('.site').each(function () {
                                new Screen($(this));
                            });
                            _obj.remove()

                        },400);

                    }, _deelay);

                }
            });

        },

        _init = function () {
            _onEvents();
        };

    _init();
};
var  _swiper;

var Screen = function ( obj ) {

    //private properties
    var _self = this,
        _obj = obj,

        _item = _obj.find( '.screen' );


    _obj[ 0 ].obj = _self;

    //private methods


    var _initContentScroll = function () {
            _swiper = new Swiper( '.site', {
                direction: 'vertical',
                slidesPerView: 1,
                scrollbarDraggable: true,
                scrollbarSnapOnRelease: true,
                paginationClickable: false,
                spaceBetween: 0,
                slideActiveClass: 'active',
                simulateTouch: true,
                mousewheelControl: true,
                scrollbar: '.swiper-scrollbar',
                scrollbarHide: false,
                hashnav: true,
                grabCursor: false,
                onSlideChangeEnd: function() {
                    _swiper.detachEvents();
                    _item.addClass('swiper-slide2');
                    _item.removeClass('swiper-slide');

                }
            });

            _obj.mouseenter(function () {
                _swiper.detachEvents();
                _swiper.params.simulateTouch = false;
                _swiper.params.onlyExternal = false;
                _swiper.attachEvents();
            });
        },
        _initNicescroll = function(){
            _item.niceScroll({
                cursorcolor: 'transparent',
                cursorborder: "0 solid transparent",
                zindex: 10,
                autohidemode: true,
                horizrailenabled: false,
                cursorborderradius: 0,
                cursoropacitymin: 1,
                cursorwidth: '5px',
                mousescrollstep: 24,
                enablemousewheel: true,
                touchbehavior: true,
                usetransition: true,
                smoothscroll:false
            });
            _item.getNiceScroll()
        },
        _onEvents = function () {
            $( '.site.swiper-container-vertical > .swiper-scrollbar' ).mouseenter(function () {
                _swiper.detachEvents();
                _swiper.params.simulateTouch = true;
                _swiper.params.onlyExternal = true;
                _swiper.attachEvents();

            });

            $( '.site.swiper-container-vertical > .swiper-scrollbar' ).mouseleave(function () {
                _swiper.detachEvents();
                _swiper.params.simulateTouch = false;
                _swiper.params.onlyExternal = false;
                _swiper.attachEvents();
            });
        },

        _sizeEvents = function () {
            if ( $(window).width() <= 768 ) {
                _initContentScroll();
                _initNicescroll();
                _item.css('overflow-y','auto');
            } else {
                _initContentScroll();
            }
        },
        _init = function () {
            _sizeEvents();
            _onEvents();
        };

    //public properties

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
        _btn = $( '.drop-menu-btn' ),
        _parentWrap = $( '.site__header' ),
        _menuContent = _obj.find( '.drop-menu__inner-wrap' );

    var is_article = false;
    var _onEvents = function () {
            _btn.on({
                click: function () {
                    if (_parentWrap.hasClass('site__header_drop-menu')) {
                        _parentWrap.removeClass( 'site__header_drop-menu' );
                        _swiper.attachEvents();

                    } else {
                        _parentWrap.addClass( 'site__header_drop-menu' );
                        _swiper.detachEvents();
                    }
                }
            })
        },
        _initContentScroll = function(){
            _menuContent.niceScroll({
                cursorcolor: '#fff',
                zindex: 10,
                autohidemode: false,
                horizrailenabled: false,
                cursorborderradius: 0,
                cursorwidth: '2px'
            });
            console.log(_menuContent)
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
                loop: true,
                spaceBetween: 30

            });

        },
        _init = function () {

            _initSlider();
            _obj[0].obj = _self;

        };

    _init();
};
