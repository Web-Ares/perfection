$(function () {

    $(document).on( 'invalid.wpcf7' , function () {
        $( '.contact-form' ).find( 'fieldset' ).removeClass( 'novalid' );
        $( '.contact-form' ).find( '.wpcf7-not-valid-tip' ).each( function() {
            $( this ).parents( 'fieldset' ).addClass( 'novalid' );
        })
    });

    $.each( $( '.anchor' ), function() {
        new Anchor( $( this ) );
    } );

    $.each( $( '.drop-menu' ), function() {
        new  Menu( $( this ) );
    } );

    $.each( $( '.preloader' ), function() {
        new Preloader( $( this ) );
    } );

    $.each( $( '.pixel-grid__slider' ), function() {
        new SliderSingle( $( this ) );
    } );

    $.each( $( '.formats__slider' ), function() {
        new SliderFormats( $( this ) );
    } );

    $.each( $( '.message-field' ), function() {
        new MessageHigh( $( this ) );
    } );

});

var Anchor = function ( obj ) {
    var _obj = obj,
        _window = $( 'html, body' );

    var _onEvents = function() {
            _obj.on( {
                click: function() {
                    _window.animate({
                        scrollTop: $( $.attr(this, 'href') ).offset().top + 20
                    }, 600);
                    return false;
                }
            } );
        },
        init = function() {
            _onEvents();
        };

    init()
};

var MessageHigh = function ( obj ) {

    var _obj = obj,
        _message = _obj.find( '.contact-form__message' ),
        _messageText = _obj.find( '.message-field__text' ),
        _messageHeight = _obj.find( '.message-field__height' );

    var _onEvents = function() {

            _obj.on( {
                'keydown' : function() {

                    _messageText.html( _message.val() + '___' );
                    _message.css( 'height', _messageText.height() + 25 );
                    _messageHeight.css( 'height', _messageText.height() );

                }
            } );

        },

        _init = function() {
            _onEvents();
        };

    _init();
};

var Menu = function ( obj ) {
    var _obj = obj,
        _btn = $( '.drop-menu-btn' ),
        _header = $( '.site__header' ),
        _siteSections = $( '.pages__item' ),
        _menuContent = _obj.find( '#scroll-wrap' ),
        _menuItem = _obj.find( '#scroll-wrap > div'),
        _action = false,
        _lastPos,
        _site = $( '.site' ),
        _window = $( window );

    var _onEvents = function() {
            _btn.on( {
                click: function() {
                    if( _header.hasClass( 'site__header_drop-menu' ) ) {
                        _site.css( 'height', 'auto' );
                        _window.scrollTop( siteScrollTop );
                        _header.removeClass( 'site__header_drop-menu' );
                        return false;
                    } else {
                        siteScrollTop = _window.scrollTop();
                        _header.addClass( 'site__header_drop-menu' );

                        // for css animation
                        setTimeout( function() {
                            _site.css ( 'height', '100%' );
                        }, 300);

                        return false;
                    }
                }
            } );
            _window.on( {
                'scroll': function () {
                    _action = _window.scrollTop() >= _header.innerHeight();
                    _colorTop();
                    _marginTop();
                },
                'DOMMouseScroll': function ( e ) {
                    var delta = e.originalEvent.detail;
                    if ( delta ) {
                        var direction = ( delta > 0 ) ? 1 : -1;
                        _checkScroll( direction );
                    }
                },
                'mousewheel': function ( e ) {
                    var delta = e.originalEvent.wheelDelta;
                    if ( delta ) {
                        var direction = ( delta > 0 ) ? -1 : 1;
                        _checkScroll( direction );
                    }
                },
                'touchmove': function ( e ) {
                    var currentPos = e.originalEvent.touches[0].clientY;
                    if ( currentPos > _lastPos ) {
                        _checkScroll( -1 );
                    } else if ( currentPos < _lastPos ) {
                        _checkScroll( 1 );
                    }
                    _lastPos = currentPos;
                }
            } )
        },
        _colorTop = function() {
            _siteSections.each( function() {
                var siteSectionsTop = $( this ).offset().top,
                    siteSectionsHeight = $( this ).height(),
                    spaceBeforeBloc = 160;
                if( siteSectionsTop <= _window.scrollTop() ) {
                    _header.removeClass( 'white' );
                    _header.addClass( $( this ).data( 'header-color' ) );
                }
                if( ( siteSectionsTop <= _window.scrollTop() + siteSectionsHeight - spaceBeforeBloc ) && ( siteSectionsTop + siteSectionsHeight + spaceBeforeBloc >= _window.scrollTop() ) ) {
                    $( this ).addClass( 'active' );
                }
            } );
        },
        _contentHeight = function() {
            _menuContent.css( 'height', _menuItem.height() )
            _initContentScroll();
        },
        _marginTop = function() {
            if( _window.scrollTop() > 0 ) {
                _header.removeClass( 'header-top' );
            } else {
                _header.addClass( 'header-top' );
            }
        },
        _checkScroll = function( direction ){
            if( direction > 0 && !_header.hasClass( 'site__header_hidden' ) && _action ) {
                _header.addClass( 'site__header_hidden' );
            }
            if( direction < 0 && _header.hasClass( 'site__header_hidden' ) && _action ) {
                _header.removeClass('site__header_hidden');
            }
        },
        _initContentScroll = function() {
            new IScroll( '#scroll-wrap', {
                mouseWheel: true,
                scrollbars: true,
                interactiveScrollbars: true,
                shrinkScrollbars: 'scale'
            });
        },
        init = function() {
            _colorTop();
            _contentHeight();
            _marginTop();
            _onEvents();
        };

    init()
};

var Preloader = function ( obj ) {

    var _obj = obj,
        _window = $( window );

    var _onEvents = function() {

            _window.on( {
                load: function(){

                    _obj.addClass( 'hide' );

                    setTimeout( function () {

                        _obj.remove()

                    }, 400 );

                }
            } );

        },

        _init = function() {
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

            if (_window.width() < 550) {

                _distance = 20;

            } else if (_window.width() >= 550 && _window.width() < 1200) {

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