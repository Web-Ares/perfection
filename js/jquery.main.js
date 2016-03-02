$(function () {

    menu = new Menu();

    $('.site').each(function () {
        new Screen($(this));
    });

});

var Screen = function (obj) {

    //private properties
    var _self = this,
        _obj = obj,
        _oldTopPosition = 0,
        _item = _obj.find('.screen');

    _obj[0].obj = _self;

    //private methods
    isUp = function (curentTopPosition) {
        for (var i = $(_item).length - 1; i >= 0; i--) {
            var itemTopPosition = $(_item[i]).offset().top;

            if (curentTopPosition > itemTopPosition) {
                _obj.getNiceScroll(0).doScrollTo(itemTopPosition, 300);
                setTimeout(function () {
                    _item.mousewheel(function(e){
                        _func(e);
                    });
                }, 1000);
                return false;
            }

        }
        return false;
    };
    isDown = function (curentTopPosition) {
        _item.each(function () {
            var itemTopPosition = $(this).offset().top;
            if (curentTopPosition < itemTopPosition) {
                _obj.getNiceScroll(0).doScrollTo(itemTopPosition, 300);
                setTimeout(function () {
                    _item.mousewheel(function(e){
                        _func(e);
                    });
                }, 1000);
                return false;
            }

        });

        return false;
    };
    _func = function (event) {
        //var curentTopPosition = $('.site').getNiceScroll(0).getScrollTop();
        //_item.unmousewheel();
        //
        //console.log($('.site').getNiceScroll(0).getScrollTop());
        ////$('.site').getNiceScroll(0).unbindAll();
        //
        //if (event.deltaY > 0) {//вверх
        //    if (!isUp(curentTopPosition)) {
        //        setTimeout(function () {
        //            _item.mousewheel(function(e){
        //                _func(e);
        //            });
        //        }, 1000);
        //    }
        //} else {// вниз
        //    if (!isDown(curentTopPosition)) {
        //        setTimeout(function () {
        //            _item.mousewheel(function(e){
        //                _func(e);
        //            });
        //        }, 1000);
        //    }
        //}


    };
    var _onEvents = function () {

            _item.mousewheel(function(e){
                _func(e);
            });
        },
        _initContentScroll = function () {
            _obj.niceScroll({
                cursorcolor: '#000',
                zindex: 10,
                autohidemode: false,
                horizrailenabled: false,
                cursorborderradius: 0,
                cursorwidth: '5px'

            });
        },
        _init = function () {
            _onEvents();
            _initContentScroll();
        };

    //public properties

    //public methods
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
                if(_header.hasClass('site__header_blog-article')){
                    is_article=true;
                }
                if (!_header.hasClass('active')) {
                    if (curItemScroll >= 400) {
                        if(is_article)
                            _header.removeClass('site__header_blog-article');

                        _header.addClass('fixed_header');
                        $('.site').css({paddingTop: _self.headerHeight});
                        _getDemo.addClass('btn_blue');
                        setTimeout(function () {
                            _header.css({top: 0})
                        }, 500)
                    } else {
                        if(is_article)
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

