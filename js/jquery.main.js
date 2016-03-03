$(function () {
    $( '.drop-menu' ).each( function() {
        new Menu( $( this ) );
    } );

    $('.site').each(function () {
        new Screen($(this));
    });

    $.each($('.formats__slider'), function () {

        new SliderFormats($(this));

    });

});

var Screen = function (obj) {

    //private properties
    var _self = this,
        _obj = obj;
    var _fullPage;
    var _nicescroll=null;
    var _item = _obj.find('.screen');

    _obj[0].obj = _self;

    //private methods


    var _initContentScroll = function () {

            _nicescroll = _obj.niceScroll({
                cursorcolor: '#000',
                zindex: 10,
                autohidemode: false,
                horizrailenabled: false,
                cursorborderradius: 0,
                cursorwidth: '5px',
                bouncescroll: true,
                mousescrollstep: 24,
                enablemousewheel: false,
                touchbehavior: false,
                cursorfixedheight: 50,
                usetransition: true
            });

        },
        _initFullpage = function (options) {
            $('#fullpage').fullpage(options);
            $.fn.fullpage.reBuild();
        },
        _onEvents = function () {
            $(window).resize(function () {
                _sizeChange();
            });
        },

        _sizeChange = function () {
            if ($(window).width() <= 768) {
                if ($('.site').getNiceScroll(0)) {
                    $('.site').getNiceScroll(0).remove();
                }
            } else {
                $.fn.fullpage.destroy('all');
                _initFullpage();
                $.fn.fullpage.reBuild();
                _initContentScroll();
            }
        },
        _sizeEvents = function () {
            if ($(window).width() <= 768) {
                _initFullpage({
                    loopHorizontal: false,
                    normalScrollElementTouchThreshold: 50,
                    afterResize: function (link, index) {

                    },
                    afterLoad: function () {
                        setTimeout(function () {
                            console.log('load');
                        }, 250)
                    },
                    onLeave: function (link, index) {//события когда слайдят
                        console.log(index);
                    },
                    onSlideLeave: function (link, index) {
                        console.log('slideleave');
                    },
                    scrollOverflow: true
                });
            } else {
                _initFullpage({
                    loopHorizontal: false,
                    normalScrollElementTouchThreshold: 50,
                    onLeave: function (link, index) {//события когда слайдят
                       var pos_top = $(_item[index]).position().top;
                       var off_top = $(_item[index]).offset().top;
                        console.log(_obj.getNiceScroll(0));
                        //_obj.getNiceScroll(0).doScrollPos(pos_top, 300);
                    },
                    onSlideLeave: function (link, index) {//события когда слайдят
                        console.log(link, index,erwer,sfdfs);
                    }
                });
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
        _textItems = _objInner.find('.formats__slider-text>div'),
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

                _items.eq(0).addClass('active');

                var activeItem = _items.filter('.active'),
                    activeItemIndex = activeItem.index(),
                    currentTextBlock = _textItems.eq(activeItemIndex);

                currentTextBlock.addClass('visible');

            }, 3000);


        },
        _init = function () {

            _obj[0].obj = _self;
            _positionItems();
            _startView();
            _addEvents();
            _changeNext();
        };

    _init();
};

var Menu = function ( obj ) {
    var _obj = obj,
        _btn = $( '.drop-menu-btn' );

    var is_article = false;
    var onEvents = function () {
        _btn.on({
            click: function () {
                if ( _obj.hasClass( 'active' ) ) {
                    _obj.removeClass( 'active' );
                    $('#fullpage').fullpage({
                        loopHorizontal: false,
                        touchSensitivity: 20,
                        normalScrollElementTouchThreshold: 50,
                        scrollOverflow: false
                    });

                } else {
                    _obj.addClass( 'active' );
                    $.fn.fullpage.destroy( 'all' )
                }

            }
        })

        },
        init = function () {
            onEvents();
        };

    init()
};
