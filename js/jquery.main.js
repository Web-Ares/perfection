$(function () {
    if ($('.drop-menu').length) {
        menu = new Menu();
    }

    $('.site').each(function () {
        new Screen($(this));
    });

    $.each( $( '.formats__slider' ), function() {

        new SliderFormats ( $( this ) );

    } );

});

var Screen = function (obj) {

    //private properties
    var _self = this,
        _obj = obj;
    var _fullPage;
    var _item = _obj.find('.screen');

    _obj[0].obj = _self;

    //private methods


    var _initContentScroll = function () {

            //_obj.niceScroll({
            //    cursorcolor: '#000',
            //    zindex: 10,
            //    autohidemode: false,
            //    horizrailenabled: false,
            //    cursorborderradius: 0,
            //    cursorwidth: '5px',
            //    bouncescroll: true,
            //    mousescrollstep: 24,
            //    //usetransition: true,
            //    enablemousewheel: false,
            //    touchbehavior:false,
            //    cursorfixedheight: 50
            //});

            $('#fullpage').fullpage({
                loopHorizontal: false,
                normalScrollElementTouchThreshold: 50,
                afterResize:function(link,index) {

                },
                //onLeave:function(link,index) {
                //    console.log('leave');
                //},
                //onSlideLeave:function(link,index) {
                //    console.log('slideleave');
                //}
                scrollOverflow: true
            });

        },
        _onEvents = function () {
            $(window).resize(function () {
                //$.fn.fullpage.destroy('all');
                //$('#fullpage').fullpage({
                //    loopHorizontal: false,
                //    normalScrollElementTouchThreshold: 50,
                //    scrollOverflow: true
                //});
                _sizeEvents();
            });
        },
        _sizeEvents = function(){
            //if ($(window).width() <= 768) {
            //    $('.screen').css('min-height',$(window).height());
            //    $('.screen').removeAttr('height');
            //}
        },
        _init = function () {
            _initContentScroll();
            _sizeEvents();
            _onEvents();
        };

    //public properties

    //public methods
    _init();
};

var SliderFormats = function( obj ) {

    //private properties
    var _self = this,
        _obj = obj,
        _objInner = _obj.find( '>div'),
        _items = _objInner.find( '.formats__slider-item'),
        _itemsArrow = _items.find( '>span'),
        _textItems = _objInner.find( '.formats__slider-text>div'),
        _timer,
        _distance = 0 ,
        _window = $( window );

    //private methods
    var _addEvents = function() {

            _items.on( {
                'mouseenter': function() {

                    if( _window.width() >= 992 ) {

                        _changeText( $( this ) );

                    }
                }
            } );

            _items.on( {
                'click': function() {

                    if( _window.width() < 992 ) {

                        _changeText( $( this ) );

                    }

                    return false

                }
            } );

            _obj.on( {

                'mouseenter': function(){

                    clearInterval( _timer );

                },

                'mouseleave': function(){

                    _changeNext();

                }

            } );

            _window.on( {
                'resize': function() {

                    _positionItems();

                }
            } )

        },
        _changeText = function( item ) {

            var itemIndex = item.index(),
                textBlock = _textItems.eq( itemIndex );

            _items.removeClass( 'active' );

            item.addClass( 'active' );

            _textItems.removeClass( 'visible' );

            textBlock.addClass( 'visible' );

            clearInterval( _timer );

        },
        _positionItems = function() {

            if( _window.width() < 768 ) {

                _distance = 0;

            } else if( _window.width() >= 768 && _window.width() < 1200 ) {

                _distance = 70;

            } else {

                _distance = 54;

            }

            var radius = (_objInner.width() + _distance) / 2 + 'px',
                start = -90,
                numberOfElements = _items.length,
                slice = 360 / numberOfElements;

            _items.each( function( i ) {

                var curItem = $( this ),
                    rotate = slice * i + start,
                    rotateReverse = rotate * -1;

                curItem.css( {
                    '-webkit-transform': 'rotate(' + rotate + 'deg) translate(' + radius + ') rotate(' + rotateReverse + 'deg)',
                    'transform': 'rotate(' + rotate + 'deg) translate(' + radius + ') rotate(' + rotateReverse + 'deg)'
                } );

                _itemsArrow.css( {
                    '-webkit-transform': 'rotate(' + rotate + 'deg) rotate(' + rotateReverse + 'deg)',
                    'transform': 'rotate(' + rotate + 'deg) rotate(' + rotateReverse + 'deg)'
                } );

            } );
        },
        _changeNext = function() {

            _timer = setInterval( function() {

                var activeItem = _items.filter( '.active'),
                    nextItem = activeItem.next(),
                    nextItemIndex = nextItem.index(),
                    currentTextBlock = _textItems.eq( nextItemIndex );

                if( nextItem.index() == - 1 ) {

                    nextItem = _items.eq( 0 );
                    currentTextBlock = _textItems.eq( 0 );

                }

                _items.removeClass( 'active' );

                _textItems.removeClass( 'visible' );

                nextItem.addClass( 'active' );

                currentTextBlock.addClass( 'visible' );

            }, 5000 );

        },
        _startView = function() {


            setTimeout( function () {

                clearInterval( _timer );

                _items.eq(0).addClass( 'active' );

                var activeItem = _items.filter( '.active'),
                    activeItemIndex = activeItem.index(),
                    currentTextBlock = _textItems.eq( activeItemIndex );

                currentTextBlock.addClass( 'visible' );

            },3000 );


            _changeNext();

        },
        _init = function() {

            _obj[ 0 ].obj = _self;
            _startView();
            _positionItems();
            _addEvents();

        };

    _init();
};

var Menu = function () {
    var _self = this,
        _btn = $('.drop-menu-btn'),
        _dropdown = $('.drop-menu'),
        _dropdownDiv = $('#wrapper'),
        _dropdownContent = $('.drop-menu__content'),
        _dropdownInner = $('.drop-menu__inner>div>div'),
        _header = $('header.site__header'),
        _getDemo = $('.site__header__items .get-demo'),
        _getDemo2 = $('.drop-menu__content .get-demo'),
        _watchVideo = $('.drop-menu__watch');

    var is_article = false;
    var addEvents = function () {
        _btn.on({
            click: function () {
                var cutItem = $(this);
                if (_header.hasClass('active')) {
                    $('.site').css({paddingTop: 0});
                    _header.removeClass('active');
                    _dropdown.fadeOut(400)
                } else {
                    _header.addClass('active');
                    $('.site').css({paddingTop: _self.headerHeight});
                    _dropdown.fadeIn(400);
                    setTimeout(function () {
                        addScroll()
                    }, 500)
                }
                return false
            }
        });
        _getDemo2.on({
            'click': function () {
                $('.site').css({paddingTop: 0});
                _header.removeClass('active');
                _dropdown.fadeOut(400);
                return false
            }
        });
        _watchVideo.on({
            'click': function () {
                $('.site').css({paddingTop: 0});
                _header.removeClass('active');
                _dropdown.fadeOut(400);
                return false
            }
        });
        $(window).on({
            'scroll': function () {
                var curItemScroll = $(window).scrollTop();
                if (_header.hasClass('site__header_blog-article')) {
                    is_article = true;
                }
                if (!_header.hasClass('active')) {
                    if (curItemScroll >= 400) {
                        if (is_article)
                            _header.removeClass('site__header_blog-article');

                        _header.addClass('fixed_header');
                        $('.site').css({paddingTop: _self.headerHeight});
                        _getDemo.addClass('btn_blue');
                        setTimeout(function () {
                            _header.css({top: 0})
                        }, 500)
                    } else {
                        if (is_article)
                            _header.addClass('site__header_blog-article');

                        _header.removeClass('fixed_header');
                        $('.site').css({paddingTop: 0});
                        _getDemo.removeClass('btn_blue');
                        if (curItemScroll > _self.headerHeight) {
                            _header.css({top: '-25%'})
                        } else {
                            _header.css({top: 0})
                        }
                    }
                }
            }
        });
        $(window).on({
            'resize': function () {
                posHeader()
            }
        });
        $(window).on({
            'load': function () {
                posHeader()
            }
        })
    }, addScroll = function () {
        self.myScroll = new IScroll('#wrapper', {
            mouseWheel: true,
            scrollbars: true,
            interactiveScrollbars: true,
            shrinkScrollbars: 'scale'
        })
    }, posHeader = function () {
        _self.headerHeight = _header.innerHeight();
        _self.headerOffset = _header.offset().top;
        _self.dropMenuPad = _dropdown[0].style.paddingTop;
        _self.winHeight = $(window).height();
        _dropdown.innerHeight(_self.winHeight + 30);
        _dropdownDiv.innerHeight(_dropdown.height() - 30);
        _dropdownInner.innerHeight(_dropdownContent.height() - 30)
    }, init = function () {
        posHeader();
        addEvents()
    };
    init()
};
