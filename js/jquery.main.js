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
    _func = function (event) {
        var curentTopPosition = $('.site').getNiceScroll(0).getScrollTop();
        _item.unmousewheel();

        console.log($('.site').getNiceScroll(0).getScrollTop());
        $('.site').getNiceScroll(0).unbindAll();

        if (event.deltaY > 0) {//вверх

            for (var i = $(_item).length-1; i >= 0; i--) {
                console.log(i, $(_item[i]).offset().top);
                var itemTopPosition = $(_item[i]).offset().top;

                if (curentTopPosition > itemTopPosition) {
                    console.log('itempos', itemTopPosition);
                    _obj.getNiceScroll(0).doScrollTop(itemTopPosition, 300);
                    setTimeout(function () {
                        _onEvents();
                    }, 800);
                    return false;
                }

            }
            setTimeout(function () {
                _onEvents();
            }, 800);
        } else {// вниз
            console.log('down');
            _item.each(function () {
                var itemTopPosition = $(this).offset().top;
                console.log(itemTopPosition, 'tuu');

                if (curentTopPosition < itemTopPosition) {

                    _obj.getNiceScroll(0).doScrollTop(itemTopPosition, 300);
                    setTimeout(function () {
                        _onEvents();
                    }, 800)
                    return false;
                }

            });
            setTimeout(function () {
                _onEvents();
            }, 800);
        }


    };
    var _onEvents = function () {

            _item.on({
                'mousewheel': _func

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

