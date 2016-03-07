( function(){

    $( function() {
        $( '.pages' ).each( function(){
            new Pages( $( this ) );
        } );
    } );

    var Pages = function (obj) {

        //private properties
        var _self = this,
            _obj = obj,
            _window = $( window ),
            _action = false,
            _first = true,
            _timer = setTimeout( function(){}, 0),
            _pages = obj.find( '.pages__item' );

        //private methods
        var _addEvents = function () {

                _obj.on( {
                    scroll: function(){

                        if( !_action ){
                            clearTimeout( _timer );
                            _timer = setTimeout( function(){

                                _checkPagePosition();

                            }, 100 );
                        }

                    }
                } );

                _pages.on( {
                    'wheel': function( e ){

                        _scroll( e );

                    }
                } );

            },
            _checkPagePosition = function(){
                var maxHeight = 0,
                    currentPage,
                    tempPage,
                    shouldScroll,
                    direction,
                    pageInfo;

                _pages.each( function(){
                    tempPage = $( this );
                    pageInfo = _getPageHeightInWindow( tempPage );

                    if( pageInfo.pageHeight > maxHeight ) {
                        maxHeight = pageInfo.pageHeight;
                        currentPage = tempPage;
                        shouldScroll = pageInfo.shouldScroll;
                        direction = pageInfo.direction;
                    }

                } );

                if( shouldScroll ){
                    _action = true;

                    if( direction ){
                        _obj.animate( {
                            scrollTop: _obj.scrollTop() + Math.round( currentPage.offset().top + currentPage.height() - _window.height() )
                        }, {
                            duration: 1000,
                            easing: 'easeInOutCubic',
                            complete: function(){
                                _pages.removeClass( 'active' );
                                currentPage.addClass( 'active' );
                                _action = false;
                            }
                        } );
                    } else {
                        _obj.animate( {
                            scrollTop: _obj.scrollTop() + Math.round( currentPage.offset().top )
                        }, {
                            duration: 1000,
                            easing: 'easeInOutCubic',
                            complete: function(){
                                _pages.removeClass( 'active' );
                                currentPage.addClass( 'active' );
                                _action = false;
                            }
                        } );
                    }

                } else {

                    if(currentPage){
                        _pages.removeClass( 'active' );
                        currentPage.addClass( 'active' );
                    }

                }

            },
            _getMaxScroll = function(){
                _maxScroll = 0;
                _pages.each( function(){
                    _maxScroll += $( this ).height();
                } );
                _maxScroll -= _window.height();
            },
            _getPageHeightInWindow = function( page ){
                var height = 0,
                    offsetTop = page.offset().top,
                    offsetBottom = offsetTop + page.height(),
                    shouldScroll = true,
                    direction = 0,
                    windowHeight = _window.height();

                if( offsetTop < 0 && offsetBottom > windowHeight ) {
                    height = windowHeight;
                    shouldScroll = false;
                } else if( offsetTop > 0 && offsetTop < windowHeight ){

                    height = windowHeight - offsetTop;
                } else if( offsetBottom > 0 && offsetBottom < windowHeight ){
                    height = offsetBottom;
                    direction = 1;
                }

                return {
                    shouldScroll: shouldScroll,
                    pageHeight: height,
                    direction: direction
                };
            },
            _getScrollDirection = function( e ) {
                var direction = 0;

                if( e.originalEvent.wheelDelta ) {
                    direction = ( e.originalEvent.wheelDelta < 0 ) ? 1 : -1;
                } else {
                    direction = ( e.originalEvent.deltaY > 0 ) ? 1 : -1;
                }

                return direction;
            },
            _init = function () {
                _addEvents();
                _getMaxScroll();
                _obj[0].obj = _self;
                _obj.niceScroll( {
                    cursorwidth: '15px',
                    cursorborder: 0,
                    cursorborderradius: '0px',
                    cursorcolor: '#1565c0',
                    horizrailenabled: false,
                    autohidemode: false,
                    zindex: 1
                } );
            },
            _scroll = function( e ){
                if( !_action ) {
                    var currentPage,
                        nextPage,
                        direction = _getScrollDirection( e );


                    currentPage = _pages.filter( '.active' );

                    if( direction ){

                        if( _first ){
                            _first = false;
                            e.stopPropagation();
                        } else {
                            if( direction < 0 ){
                                nextPage = currentPage.prev();

                                if( nextPage.length ) {
                                    if( Math.round( currentPage.offset().top ) == 0 ) {
                                        _toNextPage( currentPage, nextPage );
                                    }
                                }

                            } else if( direction > 0 ){

                                nextPage = currentPage.next();

                                if( nextPage.length ) {

                                    if( Math.round( nextPage.offset().top ) == _window.height() ) {
                                        _toNextPage( currentPage, nextPage );
                                    }
                                }

                            }
                        }

                    } else {
                        e.stopPropagation();
                    }
                } else {
                    e.stopPropagation();
                }
            },
            _toNextPage = function( currentPage, nextPage ){
                _action = true;
                _obj.animate( { scrollTop: _obj.scrollTop() + Math.round( nextPage.offset().top ) }, {
                    duration: 1500,
                    easing: 'easeInOutCubic',
                    complete: function(){
                        currentPage.removeClass( 'active' );
                        nextPage.addClass( 'active' );
                        _action = false;
                        _first = true;
                    }
                } );
            };

        //public properties

        //public methods
        _init();

    };
} )();