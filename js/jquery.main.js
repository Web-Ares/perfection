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
        var curentTopPosition = $('.site').getNiceScroll(0).getScrollTop();
        _item.unmousewheel();

        console.log($('.site').getNiceScroll(0).getScrollTop());
        //$('.site').getNiceScroll(0).unbindAll();

        if (event.deltaY > 0) {//вверх
            if (!isUp(curentTopPosition)) {
                setTimeout(function () {
                    _item.mousewheel(function(e){
                        _func(e);
                    });
                }, 1000);
            }
        } else {// вниз
            if (!isDown(curentTopPosition)) {
                setTimeout(function () {
                    _item.mousewheel(function(e){
                        _func(e);
                    });
                }, 1000);
            }
        }


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

