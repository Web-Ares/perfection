$(function () {

    $.each( $( '.drop-menu' ), function() {
        new  Menu( $( this ) );
    } );

    $.each( $( '.preloader' ), function() {
        new Preloader( $( this ) );
    } );

    $.each( $('.pixel-grid__slider'), function() {
        new SliderSingle( $( this ) );
    } );

    $.each( $('.formats__slider'), function() {
        new SliderFormats( $( this ) );
    } );

});

var Menu = function (obj) {
    var _obj = obj,
        _site = $( '.site' ),
        _btn = $( '.drop-menu-btn' ),
        _header = $( '.site__header' ),
        _siteSections = $( '.pages__item' ),
        _menuContent = _obj.find( '.drop-menu__inner-wrap'),
        _window = $( window );

    var is_article = false;
    var _onEvents = function() {
            _btn.on( {
                click: function() {

                    if( _header.hasClass( 'site__header_drop-menu' ) ) {
                        _header.removeClass( 'site__header_drop-menu' );

                        $('body').css ( { 'overflow': 'visible' } )
                    } else {
                        _header.addClass( 'site__header_drop-menu' );

                        $('body').css ( {  'overflow': 'hidden' } )
                    }
                }
            } );
            _window.on( {

                scroll: function() {
                    _siteSections.each( function() {
                        var siteSectionsTop = $( this ).offset().top,
                            siteSectionsHeight = $( this ).height(),
                            spaceBeforeBloc = 160;

                        if( siteSectionsTop <= _window.scrollTop() ) {
                            _header.removeClass( 'white' );
                            _header.addClass( $( this ).data( 'header-color' ) );
                        }

                        if( ( siteSectionsTop - spaceBeforeBloc <= _window.scrollTop() ) && ( siteSectionsTop + siteSectionsHeight + spaceBeforeBloc >= _window.scrollTop() ) ) {
                            $( this ).addClass( 'active' );
                        }

                    } );
                }
            } )
        },
        _contentScroll = function() {
            _menuContent.outerHeight( 'auto' );
            if( _menuContent.outerHeight() > _window.outerHeight() - 140 ) {
                _menuContent.outerHeight( '100%' );
                _initContentScroll();
                _menuContent.getNiceScroll().show();
                _menuContent.getNiceScroll().resize();
            } else {
                _menuContent.outerHeight( 'auto' );
                _menuContent.getNiceScroll().hide();
            }
        },
        _initContentScroll = function() {
            _menuContent.niceScroll( {
                cursorcolor: '#fff',
                zindex: 10,
                autohidemode: false,
                horizrailenabled: false,
                cursorborderradius: 0,
                cursorwidth: '2px'
            } );
        },
        init = function() {
            _onEvents();
        };

    init()
};

var Preloader = function ( obj ) {

    var _obj = obj,
        _deelay = _obj.data( 'deelay' ),
        _window = $( window);

    var _onEvents = function () {

            _window.on({
                load: function(){

                    setTimeout(function () {
                        _obj.addClass( 'hide' );

                        /*setTimeout(function () {
                            $('.site').each(function () {
                                new Screen($(this));
                            });
                            _obj.remove()

                        },400);*/

                    }, _deelay);

                }
            });

        },

        _init = function () {
            _onEvents();
        };

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
                loop: true

            });

        },
        _init = function () {

            _initSlider();
            _obj[0].obj = _self;

        };

    _init();
};