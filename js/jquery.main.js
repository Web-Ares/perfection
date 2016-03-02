$(function () {

    $('.site').each(function () {
        new Screen($(this));
    });

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
        _obj.getNiceScroll(0).doScrollTo(_obj.getNiceScroll(0).getScrollTop()-Math.abs(itemTopPosition), 300);
    };
    sliderDown = function (curentTopPosition, cur_screen) {
        if (cur_screen.next('.screen').length > 0) {
            var itemTopPosition = cur_screen.next('.screen').offset().top;
        } else {
            var itemTopPosition = 0;
        }
        console.log('downTo',_obj.getNiceScroll(0).getScrollTop());
        _obj.getNiceScroll(0).doScrollTo(_obj.getNiceScroll(0).getScrollTop()+itemTopPosition, 300);
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

        $('.site').getNiceScroll(0).unbindAll();

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
            _item.mousewheel(_func);
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

