$(function () {

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
        var isFind = false;
        for (var i = $(_item).length - 1; i >= 0; i--) {
            var itemTopPosition = $(_item[i]).offset().top;

            if (curentTopPosition > itemTopPosition && !isFind) {
                _obj.getNiceScroll(0).doScrollTo(itemTopPosition, 300);
                isFind = true;
                return false;
            }
        }
        return isFind;
    };
    isDown = function (curentTopPosition) {
        var isFind = false;
        _item.each(function () {
            var itemTopPosition = $(this).offset().top;
            if (curentTopPosition < itemTopPosition && !isFind) {
                _obj.getNiceScroll(0).doScrollTo(itemTopPosition, 300);
                isFind = true;
                return false;
            }

        });
        return isFind;
    };
    _func = function (event) {
        var curentTopPosition = $('.site').getNiceScroll(0).getScrollTop();
        _item.unmousewheel(_func);

        console.log($('.site').getNiceScroll(0).getScrollTop());
        $('.site').getNiceScroll(0).unbindAll();

        if (event.deltaY > 0) {//вверх
            isUp(curentTopPosition)
                setTimeout(function () {
                    _item.mousewheel(_func);
                }, 500);

        } else {// вниз
            isDown(curentTopPosition);
                setTimeout(function () {
                    _item.mousewheel(_func);
                }, 500);

        }

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

