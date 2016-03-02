$(function () {


    $('.site').each(function () {
        new Screen($(this));
    });

    var Menu = function () {
        var _self = this, _btn = $('.site__header__menu-drop'),
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

});

var Screen = function (obj) {

    //private properties
    var _self = this,
        _obj = obj,
        _item = _obj.find('.screen');

    _obj[0].obj = _self;

    //private methods
    sliderUp = function (curentTopPosition, cur_screen) {
        if (cur_screen.prev('.screen').length > 0) {
            var itemTopPosition = cur_screen.prev('.screen').offset().top;
        } else {
            var itemTopPosition = 0;
        }
        _obj.getNiceScroll(0).doScrollTo(_obj.getNiceScroll(0).getScrollTop() - Math.abs(itemTopPosition), 300);
    };

    sliderDown = function (curentTopPosition, cur_screen) {
        if (cur_screen.next('.screen').length > 0) {
            var itemTopPosition = cur_screen.next('.screen').offset().top;
        } else {
            var itemTopPosition = 0;
        }
        console.log('downTo', _obj.getNiceScroll(0).getScrollTop());
        _obj.getNiceScroll(0).doScrollTo(_obj.getNiceScroll(0).getScrollTop() + itemTopPosition, 300);
    };

    _mobileEvents = function (event) {
        if ($(event.target).hasClass('screen')) {
            var cur_screen = $(event.target);
        } else {
            var cur_screen = $(event.target).parents('.screen');
        }

        var curentTopPosition = $('.site').getNiceScroll(0).getScrollTop();
        if (event.deltaY > 0) {//вверх
            console.log('up');
            sliderUp(curentTopPosition, cur_screen)
        } else {// вниз
            console.log('down');
            sliderDown(curentTopPosition, cur_screen);
        }
    };

    _func = function (event) {
        console.log($('.site').getNiceScroll(0));
        if ($(event.target).hasClass('screen')) {
            var cur_screen = $(event.target);
        } else {
            var cur_screen = $(event.target).parents('.screen');
        }

        var curentTopPosition = $('.site').getNiceScroll(0).getScrollTop();
        _item.unmousewheel(_func);

        //$('.site').getNiceScroll(0).unbindAll();

        if (event.deltaY > 0) {//вверх
            sliderUp(curentTopPosition, cur_screen)
        } else {// вниз
            sliderDown(curentTopPosition, cur_screen);
        }

        setTimeout(function () {
            _item.mousewheel(_func);
        }, 1000);
    };

    var _onEvents = function () {
            $(window).resize(function () {
                _checkEvents();
            })
        },
        _checkEvents = function(){
            if ($(window).width() >= 768) {
                //_item.mousewheel(_func);
            } else {
                console.log($('.site').niceScroll());
                $('.site').getNiceScroll(0).scrollend(function(info){
                    console.log(info,'info');
                });
                //$('.site').getNiceScroll(0).scrollstart(function(info){
                //    console.log(info,'info');
                //});
                //$('.site').getNiceScroll(0).onscroll(function(info){
                //    console.log(info,'info');
                //});
                _item.unmousewheel(_func);
            }
        },
        _initContentScroll = function () {
            _obj.niceScroll({
                cursorcolor: '#000',
                zindex: 10,
                autohidemode: false,
                horizrailenabled: false,
                cursorborderradius: 0,
                cursorwidth: '5px',
                touchbehavior:true,
                bouncescroll: false

            });
        },
        _init = function () {
            //_checkEvents();
            //_onEvents();
            _initContentScroll();
        };

    //public properties

    //public methods
    _init();
};

