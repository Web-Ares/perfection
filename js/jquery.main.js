/*! iScroll v5.1.1 ~ (c) 2008-2014 Matteo Spinelli ~ http://cubiq.org/license */
(function (window, document, Math) {
    var rAF = window.requestAnimationFrame	||
        window.webkitRequestAnimationFrame	||
        window.mozRequestAnimationFrame		||
        window.oRequestAnimationFrame		||
        window.msRequestAnimationFrame		||
        function (callback) { window.setTimeout(callback, 1000 / 60); };

    var utils = (function () {
        var me = {};

        var _elementStyle = document.createElement('div').style;
        var _vendor = (function () {
            var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
                transform,
                i = 0,
                l = vendors.length;

            for ( ; i < l; i++ ) {
                transform = vendors[i] + 'ransform';
                if ( transform in _elementStyle ) return vendors[i].substr(0, vendors[i].length-1);
            }

            return false;
        })();

        function _prefixStyle (style) {
            if ( _vendor === false ) return false;
            if ( _vendor === '' ) return style;
            return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
        }

        me.getTime = Date.now || function getTime () { return new Date().getTime(); };

        me.extend = function (target, obj) {
            for ( var i in obj ) {
                target[i] = obj[i];
            }
        };

        me.addEvent = function (el, type, fn, capture) {
            el.addEventListener(type, fn, !!capture);
        };

        me.removeEvent = function (el, type, fn, capture) {
            el.removeEventListener(type, fn, !!capture);
        };

        me.momentum = function (current, start, time, lowerMargin, upperMargin, wrapperSize, deceleration) {
            var distance = current - start,
                speed = Math.abs(distance) / time,
                destination,
                duration;

            deceleration = deceleration === undefined ? 0.0012 : deceleration;

            destination = current + ( speed * speed ) / ( 2 * deceleration ) * ( distance < 0 ? -1 : 1 );
            duration = speed / deceleration;

            if ( destination < lowerMargin ) {
                destination = wrapperSize ? lowerMargin - ( wrapperSize / 2.5 * ( speed / 8 ) ) : lowerMargin;
                distance = Math.abs(destination - current);
                duration = distance / speed;
            } else if ( destination > upperMargin ) {
                destination = upperMargin;
                distance = Math.abs(destination - current);
                duration = distance / speed;
            } else if ( destination > 0 ) {
                destination = wrapperSize ? wrapperSize / 2.5 * ( speed / 8 ) : 0;
                distance = Math.abs(current) + destination;
                duration = distance / speed;
            }

            return {
                destination: Math.round(destination),
                duration: duration
            };
        };

        var _transform = _prefixStyle('transform');

        me.extend(me, {
            hasTransform: _transform !== false,
            hasPerspective: _prefixStyle('perspective') in _elementStyle,
            hasTouch: 'ontouchstart' in window,
            hasPointer: navigator.msPointerEnabled,
            hasTransition: _prefixStyle('transition') in _elementStyle
        });

        // This should find all Android browsers lower than build 535.19 (both stock browser and webview)
        me.isBadAndroid = /Android /.test(window.navigator.appVersion) && !(/Chrome\/\d/.test(window.navigator.appVersion));

        me.extend(me.style = {}, {
            transform: _transform,
            transitionTimingFunction: _prefixStyle('transitionTimingFunction'),
            transitionDuration: _prefixStyle('transitionDuration'),
            transitionDelay: _prefixStyle('transitionDelay'),
            transformOrigin: _prefixStyle('transformOrigin')
        });

        me.hasClass = function (e, c) {
            var re = new RegExp("(^|\\s)" + c + "(\\s|$)");
            return re.test(e.className);
        };

        me.addClass = function (e, c) {
            if ( me.hasClass(e, c) ) {
                return;
            }

            var newclass = e.className.split(' ');
            newclass.push(c);
            e.className = newclass.join(' ');
        };

        me.removeClass = function (e, c) {
            if ( !me.hasClass(e, c) ) {
                return;
            }

            var re = new RegExp("(^|\\s)" + c + "(\\s|$)", 'g');
            e.className = e.className.replace(re, ' ');
        };

        me.offset = function (el) {
            var left = -el.offsetLeft,
                top = -el.offsetTop;

            // jshint -W084
            while (el = el.offsetParent) {
                left -= el.offsetLeft;
                top -= el.offsetTop;
            }
            // jshint +W084

            return {
                left: left,
                top: top
            };
        };

        me.preventDefaultException = function (el, exceptions) {
            for ( var i in exceptions ) {
                if ( exceptions[i].test(el[i]) ) {
                    return true;
                }
            }

            return false;
        };

        me.extend(me.eventType = {}, {
            touchstart: 1,
            touchmove: 1,
            touchend: 1,

            mousedown: 2,
            mousemove: 2,
            mouseup: 2,

            MSPointerDown: 3,
            MSPointerMove: 3,
            MSPointerUp: 3
        });

        var customEase = function(p, _type, _power){
            var r = (_type == 1) ? 1 - p : (_type == 2) ? p : (p < 0.5) ? p * 2 : (1 - p) * 2;
            if (_power == 1) {
                r *= r;
            } else if (_power == 2) {
                r *= r * r;
            } else if (_power == 3) {
                r *= r * r * r;
            } else if (_power == 4) {
                r *= r * r * r * r;
            }
            return (_type == 1) ? 1 - r : (_type == 2) ? r : (p < 0.5) ? r / 2 : 1 - (r / 2);
        };

        me.extend(me.ease = {}, {
            quadratic: {
                style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                fn: function (k) {
                    return k * ( 2 - k );
                }
            },
            circular: {
                style: 'cubic-bezier(0.1, 0.57, 0.1, 1)',	// Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
                fn: function (k) {
                    return Math.sqrt( 1 - ( --k * k ) );
                    // return -Math.cos(p * Math.PI/2) + 1;
                }
            },
            easeInOutCirc: {
                style: 'cubic-bezier(0.785, 0.135, 0.15, 0.86)',
                fn: function (p) {
                    return ((p*=2) < 1) ? -0.5 * (Math.sqrt(1 - p * p) - 1) : 0.5 * (Math.sqrt(1 - (p -= 2) * p) + 1);
                }
            },
            cubicOut: {
                style: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
                fn: function(p){
                    return customEase(p,1,2);
                }
            },
            cubicInOut: {
                style: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
                fn: function(p){
                    return customEase(p,3,2);
                }
            },
            circIn: {
                style: 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
                fn: function(p){
                    return -(Math.sqrt(1 - (p * p)) - 1);
                }
            },
            expoOut: {
                style: 'cubic-bezier(0.19, 1, 0.22, 1)',
                fn: function(p){
                    return 1 - Math.pow(2, -10 * p);
                }
            },
            expoIn: {
                style: 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
                fn: function(p){
                    return Math.pow(2, 10 * (p - 1)) - 0.001;
                }
            },
            expoInOut: {
                style: 'cubic-bezier(1, 0, 0, 1)',
                fn: function(p){
                    return ((p*=2) < 1) ? 0.5 * Math.pow(2, 10 * (p - 1)) : 0.5 * (2 - Math.pow(2, -10 * (p - 1)));
                }
            },
            circOut: {
                style: 'cubic-bezier(0.075, 0.82, 0.165, 1)',
                fn: function(p){
                    return Math.sqrt(1 - (p = p - 1) * p);
                }
            },
            circInOut: {
                style: 'cubic-bezier(0.785, 0.135, 0.15, 0.86)',
                fn: function(p){
                    return ((p*=2) < 1) ? -0.5 * (Math.sqrt(1 - p * p) - 1) : 0.5 * (Math.sqrt(1 - (p -= 2) * p) + 1);
                }
            },
            back: {
                style: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                fn: function (k) {
                    var b = 4;
                    return ( k = k - 1 ) * k * ( ( b + 1 ) * k + b ) + 1;
                }
            },
            bounce: {
                style: '',
                fn: function (k) {
                    if ( ( k /= 1 ) < ( 1 / 2.75 ) ) {
                        return 7.5625 * k * k;
                    } else if ( k < ( 2 / 2.75 ) ) {
                        return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
                    } else if ( k < ( 2.5 / 2.75 ) ) {
                        return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
                    } else {
                        return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
                    }
                }
            },
            elastic: {
                style: '',
                fn: function (k) {
                    var f = 0.22,
                        e = 0.4;

                    if ( k === 0 ) { return 0; }
                    if ( k == 1 ) { return 1; }

                    return ( e * Math.pow( 2, - 10 * k ) * Math.sin( ( k - f / 4 ) * ( 2 * Math.PI ) / f ) + 1 );
                }
            }
        });

        me.tap = function (e, eventName) {
            var ev = document.createEvent('Event');
            ev.initEvent(eventName, true, true);
            ev.pageX = e.pageX;
            ev.pageY = e.pageY;
            e.target.dispatchEvent(ev);
        };

        me.click = function (e) {
            var target = e.target,
                ev;

            if ( !(/(SELECT|INPUT|TEXTAREA|BUTTON|EMBED|OBJECT)/i).test(target.tagName) ) {
                ev = document.createEvent('MouseEvents');
                ev.initMouseEvent('click', true, true, e.view, 1,
                    target.screenX, target.screenY, target.clientX, target.clientY,
                    e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
                    0, null);

                ev._constructed = true;
                target.dispatchEvent(ev);
            }
        };

        return me;
    })();

    function IScroll (el, options) {
        var iscroll = this;
        this.wrapper = typeof el == 'string' ? document.querySelector(el) : el;

        this.options = {

            resizeScrollbars: true,

            mouseWheelSpeed: 20,

            snapThreshold: 0.334,

// INSERT POINT: OPTIONS

            startX: 0,
            startY: 0,
            scrollY: true,
            directionLockThreshold: 5,
            momentum: true,

            bounce: true,
            bounceTime: 600,
            bounceEasing: '',

            preventDefault: true,
            preventDefaultException: { tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT|EMBED|OBJECT)$/ },

            HWCompositing: true,
            useTransition: true,
            useTransform: true
        };

        for ( var i in options ) {
            this.options[i] = options[i];
        }

        this.scroller = this.options.scrollerSelector ? this.wrapper.querySelector(this.options.scrollerSelector) : this.wrapper.children[0];
        this.scrollerStyle = this.scroller.style;		// cache style for better performance

        // Normalize options
        this.translateZ = this.options.HWCompositing && utils.hasPerspective ? ' translateZ(0)' : '';

        this.options.useTransition = utils.hasTransition && this.options.useTransition;
        this.options.useTransform = utils.hasTransform && this.options.useTransform;

        this.options.eventPassthrough = this.options.eventPassthrough === true ? 'vertical' : this.options.eventPassthrough;
        this.options.preventDefault = !this.options.eventPassthrough && this.options.preventDefault;

        // If you want eventPassthrough I have to lock one of the axes
        this.options.scrollY = this.options.eventPassthrough == 'vertical' ? false : this.options.scrollY;
        this.options.scrollX = this.options.eventPassthrough == 'horizontal' ? false : this.options.scrollX;

        // With eventPassthrough we also need lockDirection mechanism
        this.options.freeScroll = this.options.freeScroll && !this.options.eventPassthrough;
        this.options.directionLockThreshold = this.options.eventPassthrough ? 0 : this.options.directionLockThreshold;

        this.options.bounceEasing = typeof this.options.bounceEasing == 'string' ? utils.ease[this.options.bounceEasing] || utils.ease.circular : this.options.bounceEasing;

        this.options.resizePolling = this.options.resizePolling === undefined ? 60 : this.options.resizePolling;

        if ( this.options.tap === true ) {
            this.options.tap = 'tap';
        }

        if ( this.options.shrinkScrollbars == 'scale' ) {
            this.options.useTransition = false;
        }

        this.options.invertWheelDirection = this.options.invertWheelDirection ? -1 : 1;

        if ( this.options.probeType == 3 ) {
            this.options.useTransition = false;	}

// INSERT POINT: NORMALIZATION

        // Some defaults
        this.x = 0;
        this.y = 0;
        this.directionX = 0;
        this.directionY = 0;
        this._events = {};

// INSERT POINT: DEFAULTS

        this._init();
        this.refresh();

        this.scrollTo(this.options.startX, this.options.startY);
        this.enable();

    }

    IScroll.prototype = {
        version: '5.1.1',

        _init: function () {
            this._initEvents();

            if ( this.options.scrollbars || this.options.indicators ) {
                this._initIndicators();
            }

            if ( this.options.mouseWheel ) {
                this._initWheel();
            }

            if ( this.options.snap ) {
                this._initSnap();
            }

            if ( this.options.keyBindings ) {
                this._initKeys();
            }

// INSERT POINT: _init

        },

        destroy: function () {
            this._initEvents(true);

            this._execEvent('destroy');
        },

        _transitionEnd: function (e) {
            if ( e.target != this.scroller || !this.isInTransition ) {
                return;
            }

            this._transitionTime();
            if ( !this.resetPosition(this.options.bounceTime) ) {
                this.isInTransition = false;
                this.moved = false;
                this._execEvent('scrollEnd');
            }
        },

        _start: function (e) {

            // React to left mouse button only
            if ( utils.eventType[e.type] != 1 ) {
                if ((/(SELECT|INPUT|TEXTAREA|BUTTON|EMBED|OBJECT)/i).test(e.target.tagName)) return;
                if ( e.button !== 0 ) return;
                if ( $(e.target).attr('data-prevent') ) return;
            }

            clearTimeout(this.wheelTimeout);
            this.wheelSnap = false;

            if ( !this.enabled || (this.initiated && utils.eventType[e.type] !== this.initiated) ) {
                return;
            }

            if ( this.options.preventDefault && !utils.isBadAndroid && !utils.preventDefaultException(e.target, this.options.preventDefaultException) ) {
                e.preventDefault();
            }

            var point = e.touches ? e.touches[0] : e,
                pos;

            this.initiated	= utils.eventType[e.type];
            this.moved		= false;
            this.distX		= 0;
            this.distY		= 0;
            this.directionX = 0;
            this.directionY = 0;
            this.directionLocked = 0;

            this._transitionTime();

            this.startTime = utils.getTime();

            if ( this.options.useTransition && this.isInTransition ) {
                this.isInTransition = false;
                pos = this.getComputedPosition();
                this._translate(Math.round(pos.x), Math.round(pos.y));
                this.moved = false;
                this._execEvent('scrollEnd');
            } else if ( !this.options.useTransition && this.isAnimating ) {
                this.isAnimating = false;
                this.moved = false;
                this._execEvent('scrollEnd');
            }

            this.startX    = this.x;
            this.startY    = this.y;
            this.absStartX = this.x;
            this.absStartY = this.y;
            this.pointX    = point.pageX;
            this.pointY    = point.pageY;
            this.moved	   = false;

            this._execEvent('beforeScrollStart');
            this._execEvent('grab');
        },

        _move: function (e) {
            if ( !this.enabled || utils.eventType[e.type] !== this.initiated ) {
                return;
            }

            if ( this.options.preventDefault ) {	// increases performance on Android? TODO: check!
                e.preventDefault();
            }

            var point		= e.touches ? e.touches[0] : e,
                deltaX		= point.pageX - this.pointX,
                deltaY		= point.pageY - this.pointY,
                timestamp	= utils.getTime(),
                newX, newY,
                absDistX, absDistY;

            this.pointX		= point.pageX;
            this.pointY		= point.pageY;

            this.distX		+= deltaX;
            this.distY		+= deltaY;
            absDistX		= Math.abs(this.distX);
            absDistY		= Math.abs(this.distY);

            // We need to move at least 10 pixels for the scrolling to initiate
            if ( timestamp - this.endTime > 300 && (absDistX < 10 && absDistY < 10) ) {
                return;
            }

            // If you are scrolling in one direction lock the other
            if ( !this.directionLocked && !this.options.freeScroll ) {
                if ( absDistX > absDistY + this.options.directionLockThreshold ) {
                    this.directionLocked = 'h';		// lock horizontally
                } else if ( absDistY >= absDistX + this.options.directionLockThreshold ) {
                    this.directionLocked = 'v';		// lock vertically
                } else {
                    this.directionLocked = 'n';		// no lock
                }
            }

            if ( this.directionLocked == 'h' ) {
                if ( this.options.eventPassthrough == 'vertical' ) {
                    e.preventDefault();
                } else if ( this.options.eventPassthrough == 'horizontal' ) {
                    this.initiated = false;
                    return;
                }

                deltaY = 0;
            } else if ( this.directionLocked == 'v' ) {
                if ( this.options.eventPassthrough == 'horizontal' ) {
                    e.preventDefault();
                } else if ( this.options.eventPassthrough == 'vertical' ) {
                    this.initiated = false;
                    return;
                }

                deltaX = 0;
            }

            deltaX = this.hasHorizontalScroll ? deltaX : 0;
            deltaY = this.hasVerticalScroll ? deltaY : 0;

            newX = this.x + deltaX;
            newY = this.y + deltaY;

            // Slow down if outside of the boundaries
            if ( newX > 0 || newX < this.maxScrollX ) {
                newX = this.options.bounce ? this.x + deltaX / (this.options.boundDeceleration || 7) : newX > 0 ? 0 : this.maxScrollX;
            }
            if ( newY > 0 || newY < this.maxScrollY ) {
                newY = this.options.bounce ? this.y + deltaY / (this.options.boundDeceleration || 7) : newY > 0 ? 0 : this.maxScrollY;
            }

            // if (newY < this.maxScrollY) newY = this.maxScrollY;
            // if (newX < this.maxScrollX) newX = this.maxScrollX;
            // if (newY > this.minScrollY) newY = this.minScrollY;
            // if (newX > this.minScrollX) newX = this.minScrollX;

            this.directionX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
            this.directionY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

            if ( !this.moved ) {
                this._execEvent('scrollStart');
            }

            this.moved = true;

            this._translate(newX, newY);

            /* REPLACE START: _move */
            if ( timestamp - this.startTime > 300 ) {
                this.startTime = timestamp;
                this.startX = this.x;
                this.startY = this.y;

                if ( this.options.probeType == 1 ) {
                    this._execEvent('scroll');
                }
            }

            if ( this.options.probeType > 1 ) {
                this._execEvent('scroll');
            }
            /* REPLACE END: _move */

        },

        reset: function(){
            this.isInTransition = 0;
            this.initiated = 0;
            this.endTime = utils.getTime();
        },

        _end: function (e) {

            if (!this.enabled) return;

            if (this.options.preventDefault && !utils.preventDefaultException(e.target, this.options.preventDefaultException) ) {
                e.preventDefault();
            }

            if (!this.moved && !$.contains(this.wrapper, e.target)) return;

            if (!this.moved) {
                this.startX = Math.round(this.x);
                this.startY = Math.round(this.y);
            };

            var point = e.changedTouches ? e.changedTouches[0] : e,
                momentumX,
                momentumY,
                duration = utils.getTime() - this.startTime,
                newX = Math.round(this.x),
                newY = Math.round(this.y),
                distanceX = Math.abs(newX - this.startX),
                distanceY = Math.abs(newY - this.startY),
                time = 0,
                easing = '';

            this.isInTransition = 0;
            this.initiated = 0;
            this.endTime = utils.getTime();


            // reset if we are outside of the boundaries
            if (this.resetPosition(this.options.bounceTime)) return;

            this.scrollTo(newX, newY);	// ensures that the last position is rounded

            // if ( this._events.flick && duration < 200 && distanceX < 100 && distanceY < 100 && (newY != this.maxScrollY || newX != this.maxScrollX) ) {
            // 	this._execEvent('flick');
            // 	return;
            // }

            // start momentum animation if needed
            if ( this.options.momentum && duration < 300 && this.moved) {
                momentumX = this.hasHorizontalScroll ? utils.momentum(this.x, this.startX, duration, this.maxScrollX, this.minScrollX, this.options.bounce ? this.wrapperWidth : 0, this.options.deceleration) : { destination: newX, duration: 0 };
                momentumY = this.hasVerticalScroll ? utils.momentum(this.y, this.startY, duration, this.maxScrollY, this.minScrollY, this.options.bounce ? this.wrapperHeight : 0, this.options.deceleration) : { destination: newY, duration: 0 };
                newX = momentumX.destination;
                newY = momentumY.destination;
                time = Math.max(momentumX.duration, momentumY.duration);
                this.isInTransition = 1;
            }

            if ( this.options.snap ) {
                var snap = this._nearestSnap(newX, newY);
                this.currentPage = snap;
                time = this.options.snapSpeed || Math.max(
                        Math.max(
                            Math.min(Math.abs(newX - snap.x), 1000),
                            Math.min(Math.abs(newY - snap.y), 1000)
                        ), this.options.snapSpeed);
                newX = snap.x;
                newY = snap.y;
                this.directionX = 0;
                this.directionY = 0;
                easing = this.options.bounceEasing;
            }

// INSERT POINT: _end

            if ( newX != this.x || newY != this.y ) {
                // change easing function when scroller goes out of the boundaries
                if ( newX > 0 || newX < this.maxScrollX || newY > 0 || newY < this.maxScrollY ) {
                    easing = utils.ease.quadratic;
                }

                if (newY < this.maxScrollY) newY = this.maxScrollY;
                if (newX < this.maxScrollX) newX = this.maxScrollX;
                if (newY > 0) newY = 0;
                if (newX > 0) newX = 0;
                if (newX!=this.x || newY!=this.y) this.scrollTo(newX, newY, time, easing);

                // return;
            }
            // if (utils.eventType[e.type] !== this.initiated) { return; }

            // we scrolled less than 10 pixels
            if ( !this.moved ) {
                if ( this.options.tap && $.contains(this.wrapper, e.target) ) {
                    utils.tap(e, this.options.tap);
                }
                if ( this.options.click && $.contains(this.wrapper, e.target) ) {
                    utils.click(e);
                }
                this._execEvent('scrollCancel');
                return;
            }

            this.moved = false;
            // this._execEvent('scrollEnd');

        },

        _resize: function () {
            var that = this;

            clearTimeout(this.resizeTimeout);

            this.resizeTimeout = setTimeout(function () {
                that.refresh();
            }, this.options.resizePolling);
        },

        resetPosition: function (time) {

            this._execEvent('scrollReset');

            if (this.preventReset) return false;

            var x = this.x,
                y = this.y;

            var maxY = this.options.forceBounds ? this.maxScrollY : -this.scrollerHeight+this.wrapperHeight,
                maxX = -this.scrollerWidth+this.wrapperWidth;

            time = time || 0;

            if ( !this.hasHorizontalScroll || this.x > 0 ) {
                x = 0;
            } else if ( this.x < maxX ) {
                x = maxX;
            }

            if ( !this.hasVerticalScroll || this.y > 0 ) {
                y = 0;
            } else if ( this.y < maxY ) {
                y = maxY;
            }

            if ( x == this.x && y == this.y ) {
                return false;
            }

            if (!this.enabled) {
                this.scrollTo(x, y, this.options.snapSpeed, utils.ease.circOut);
            } else {
                this.scrollTo(x, y, time, this.options.bounceEasing);
            }

            return true;
        },

        disable: function () {
            this._execEvent('disable');
            this.enabled = false;
        },

        enable: function () {
            this._execEvent('enable');
            this.enabled = true;
        },

        refresh: function () {

            // if (this.options.snap && this.options.scrollY) {
            // 	alert('before iscroll refresh')
            // 	alert(this.wrapper.clientHeight)
            // }

            // var rf = this.wrapper.offsetHeight;		// Force reflow
            // if (this.options.snap && this.options.scrollY) {
            // 	this.wrapperWidth	= site.sizes.width;
            // 	this.wrapperHeight	= site.sizes.height;
            // } else {
            this.wrapperWidth	= this.wrapper.clientWidth;
            this.wrapperHeight	= this.wrapper.clientHeight;
            // }

            if (this==window) return;

            /* REPLACE START: refresh */

            this.scrollerWidth	= this.scroller.offsetWidth;
            this.scrollerHeight	= this.scroller.offsetHeight;

            this.minScrollX		= 0;
            this.minScrollY		= 0;

            this.maxScrollX		= this.wrapperWidth - this.scrollerWidth;
            this.maxScrollY		= this.wrapperHeight - this.scrollerHeight;

            /* REPLACE END: refresh */

            this.hasHorizontalScroll	= this.options.scrollX && (this.options.forceBounds || this.maxScrollX < 0);
            this.hasVerticalScroll		= this.options.scrollY && (this.options.forceBounds || this.maxScrollY < 0);

            if ( !this.hasHorizontalScroll ) {
                this.maxScrollX = 0;
                this.scrollerWidth = this.wrapperWidth;
            }

            if ( !this.hasVerticalScroll ) {
                this.maxScrollY = 0;
                this.scrollerHeight = this.wrapperHeight;
            }

            this.endTime = 0;
            this.directionX = 0;
            this.directionY = 0;

            this.wrapperOffset = utils.offset(this.wrapper);

            this._execEvent('refresh');

            this.resetPosition();

// INSERT POINT: _refresh

        },

        on: function (type, fn) {
            if ( !this._events[type] ) {
                this._events[type] = [];
            }

            this._events[type].push(fn);
        },

        off: function (type, fn) {
            if ( !this._events[type] ) {
                return;
            }

            var index = this._events[type].indexOf(fn);

            if ( index > -1 ) {
                this._events[type].splice(index, 1);
            }
        },

        _execEvent: function (type) {

            // if (type=='scroll') console.time('iscroll');

            if ( !this._events[type] ) {
                return;
            }

            var i = 0,
                l = this._events[type].length;

            if ( !l ) {
                return;
            }

            for ( ; i < l; i++ ) {
                this._events[type][i].apply(this);//, [].slice.call(arguments, 1));
            }

            // if (type=='scroll') console.timeEnd('iscroll');

        },

        scrollBy: function (x, y, time, easing) {
            x = this.x + x;
            y = this.y + y;
            time = time || 0;

            this.scrollTo(x, y, time, easing);
        },

        scrollTo: function (x, y, time, easing) {
            if (this.hold) return;

            easing = easing || utils.ease.circular;

            this.isInTransition = this.options.useTransition && time > 0;

            if ( !time || (this.options.useTransition && easing.style) ) {
                this._transitionTimingFunction(easing.style);
                this._transitionTime(time);
                this._translate(x, y);
            } else {
                this._animate(x, y, time, easing.fn);
            }

        },

        scrollToElement: function (el, time, offsetX, offsetY, easing) {
            el = el.nodeType ? el : this.scroller.querySelector(el);

            if ( !el ) {
                return;
            }

            var pos = utils.offset(el);

            pos.left -= this.wrapperOffset.left;
            pos.top  -= this.wrapperOffset.top;

            // if offsetX/Y are true we center the element to the screen
            if ( offsetX === true ) {
                offsetX = Math.round(el.offsetWidth / 2 - this.wrapper.offsetWidth / 2);
            }
            if ( offsetY === true ) {
                offsetY = Math.round(el.offsetHeight / 2 - this.wrapper.offsetHeight / 2);
            }

            pos.left -= offsetX || 0;
            pos.top  -= offsetY || 0;

            pos.left = pos.left > 0 ? 0 : pos.left < this.maxScrollX ? this.maxScrollX : pos.left;
            pos.top  = pos.top  > 0 ? 0 : pos.top  < this.maxScrollY ? this.maxScrollY : pos.top;

            time = time === undefined || time === null || time === 'auto' ? Math.max(Math.abs(this.x-pos.left), Math.abs(this.y-pos.top)) : time;

            this.scrollTo(pos.left, pos.top, time, easing);
        },

        _transitionTime: function (time) {
            time = time || 0;

            this.scrollerStyle[utils.style.transitionDuration] = time + 'ms';

            if ( !time && utils.isBadAndroid ) {
                this.scrollerStyle[utils.style.transitionDuration] = '0.001s';
            }


            if ( this.indicators ) {
                for ( var i = this.indicators.length; i--; ) {
                    this.indicators[i].transitionTime(time);
                }
            }


// INSERT POINT: _transitionTime

        },

        _transitionTimingFunction: function (easing) {
            this.scrollerStyle[utils.style.transitionTimingFunction] = easing;


            if ( this.indicators ) {
                for ( var i = this.indicators.length; i--; ) {
                    this.indicators[i].transitionTimingFunction(easing);
                }
            }


// INSERT POINT: _transitionTimingFunction

        },

        _translate: function (x, y) {
            if (this.hold) return;
            if (this.options.useTransform && !this.options.fake) {

                /* REPLACE START: _translate */

                this.scrollerStyle[utils.style.transform] = 'translate(' + x + 'px,' + Math.round(y) + 'px)' + this.translateZ;

                /* REPLACE END: _translate */

            } else if (!this.options.fake) {
                x = Math.round(x);
                y = Math.round(y);
                this.scrollerStyle.left = x + 'px';
                this.scrollerStyle.top = y + 'px';
            }

            this.x = x;
            this.y = y;

            if ( this.indicators ) {
                for ( var i = this.indicators.length; i--; ) {
                    this.indicators[i].updatePosition();
                }
            }


// INSERT POINT: _translate

        },

        _initEvents: function (remove) {
            var eventType = remove ? utils.removeEvent : utils.addEvent,
                target = this.options.bindToWrapper ? this.wrapper : window;

            eventType(window, 'orientationchange', this);
            // eventType(window, 'resize', this);

            if ( this.options.click ) {
                eventType(this.wrapper, 'click', this, true);
            }

            if ( !this.options.disableMouse ) {
                eventType(this.wrapper, 'mousedown', this);
                eventType(target, 'mousemove', this);
                eventType(target, 'mousecancel', this);
                eventType(target, 'mouseup', this);
            }

            if ( utils.hasPointer && !this.options.disablePointer ) {
                eventType(this.wrapper, 'MSPointerDown', this);
                eventType(target, 'MSPointerMove', this);
                eventType(target, 'MSPointerCancel', this);
                eventType(target, 'MSPointerUp', this);
            }

            if ( utils.hasTouch && !this.options.disableTouch ) {
                eventType(this.wrapper, 'touchstart', this);
                eventType(target, 'touchmove', this);
                eventType(target, 'touchcancel', this);
                eventType(target, 'touchend', this);
            }

            eventType(this.scroller, 'transitionend', this);
            eventType(this.scroller, 'webkitTransitionEnd', this);
            eventType(this.scroller, 'oTransitionEnd', this);
            eventType(this.scroller, 'MSTransitionEnd', this);
        },

        getComputedPosition: function () {
            var matrix = window.getComputedStyle(this.scroller, null),
                x, y;

            if ( this.options.useTransform ) {
                matrix = matrix[utils.style.transform].split(')')[0].split(', ');
                x = +(matrix[12] || matrix[4]);
                y = +(matrix[13] || matrix[5]);
            } else {
                x = +matrix.left.replace(/[^-\d.]/g, '');
                y = +matrix.top.replace(/[^-\d.]/g, '');
            }

            return { x: x, y: y };
        },

        _initIndicators: function () {
            var interactive = this.options.interactiveScrollbars,
                customStyle = typeof this.options.scrollbars != 'string',
                indicators = [],
                indicator;

            var that = this;

            this.indicators = [];

            if ( this.options.scrollbars ) {
                // Vertical scrollbar
                if ( this.options.scrollY ) {
                    indicator = {
                        el: createDefaultScrollbar('v', interactive, this.options.scrollbars),
                        interactive: interactive,
                        defaultScrollbars: true,
                        customStyle: customStyle,
                        resize: this.options.resizeScrollbars,
                        shrink: this.options.shrinkScrollbars,
                        fade: this.options.fadeScrollbars,
                        listenX: false
                    };

                    this.wrapper.appendChild(indicator.el);
                    indicators.push(indicator);
                }

                // Horizontal scrollbar
                if ( this.options.scrollX ) {
                    indicator = {
                        el: createDefaultScrollbar('h', interactive, this.options.scrollbars),
                        interactive: interactive,
                        defaultScrollbars: true,
                        customStyle: customStyle,
                        resize: this.options.resizeScrollbars,
                        shrink: this.options.shrinkScrollbars,
                        fade: this.options.fadeScrollbars,
                        listenY: false
                    };

                    this.wrapper.appendChild(indicator.el);
                    indicators.push(indicator);
                }
            }

            if ( this.options.indicators ) {
                // TODO: check concat compatibility
                indicators = indicators.concat(this.options.indicators);
            }

            for ( var i = indicators.length; i--; ) {
                this.indicators.push( new Indicator(this, indicators[i]) );
            }

            // TODO: check if we can use array.map (wide compatibility and performance issues)
            function _indicatorsMap (fn) {
                for ( var i = that.indicators.length; i--; ) {
                    fn.call(that.indicators[i]);
                }
            }

            if ( this.options.fadeScrollbars ) {
                this.on('scrollEnd', function () {
                    _indicatorsMap(function () {
                        this.fade();
                    });
                });

                this.on('scrollCancel', function () {
                    _indicatorsMap(function () {
                        this.fade();
                    });
                });

                this.on('scrollStart', function () {
                    _indicatorsMap(function () {
                        this.fade(1);
                    });
                });

                this.on('beforeScrollStart', function () {
                    _indicatorsMap(function () {
                        this.fade(1, true);
                    });
                });
            }


            this.on('refresh', function () {
                _indicatorsMap(function () {
                    this.refresh();
                });
            });

            this.on('destroy', function () {
                _indicatorsMap(function () {
                    this.destroy();
                });

                delete this.indicators;
            });
        },

        _initWheel: function () {
            var that = this;
            that.newActionTime = Date.now();
            that.lastDeltaY = 0;
            that.lastDeltasY = [];
            that.lastDirection = 0;
            $(that.wrapper).on('mousewheel', function(e){
                that._wheel(e);
            });

            // utils.addEvent(this.wrapper, 'wheel', this);
            // utils.addEvent(this.wrapper, 'mousewheel', this);
            // utils.addEvent(this.wrapper, 'DOMMouseScroll', this);

            this.on('destroy', function () {
                // utils.removeEvent(this.wrapper, 'wheel', this);
                // utils.removeEvent(this.wrapper, 'mousewheel', this);
                // utils.removeEvent(this.wrapper, 'DOMMouseScroll', this);
                $(that.wrapper).off('mousewheel');
            });
        },

        _wheel: function (e) {

            if (!this.enabled) {
                this.lastDirection = e.deltaY < 0 ? -1 : 1;
                this.lastDeltaY = e.deltaY;
                this.lastDeltasY.push(e.deltaY);
                if (this.lastDeltasY.length>4) this.lastDeltasY.shift();
            }
            if (!this.enabled || this.moved || this.snapping) return;
            if (this.indicators && this.indicators[0].moved) return;

            e.preventDefault();
            // e.stopPropagation();

            var wheelDeltaX, wheelDeltaY,
                newX, newY,
                that = this;

            if ( this.wheelTimeout === undefined ) {
                that._execEvent('scrollStart');
                this.absStartX = this.x;
                this.absStartY = this.y;
                this.wheelSnap = false;
            }

            // Execute the scrollEnd event after 400ms the wheel stopped scrolling
            clearTimeout(that.wheelTimeout);
            that.wheelTimeout = setTimeout(function () {
                if (that.moved) return;
                // if (that.options.forceBounds) {
                // 	that.resetPosition(that.options.bounceTime*0.6);
                // }
                // if (that.options.snap) {
                // 	that.wheelSnap = true;
                // 	that._execEvent('beforeWheelSnap');
                // 	var snap = that._nearestSnap(that.x, that.y);
                // 	time = that.options.snapSpeed || Math.max(
                // 		Math.max(
                // 			Math.min(Math.abs(newX - snap.x), 1000),
                // 			Math.min(Math.abs(newY - snap.y), 1000)
                // 		), that.options.snapSpeed);
                // 	newX = snap.x;
                // 	newY = snap.y;
                // 	that.directionX = 0;
                // 	that.directionY = 0;
                // 	that.currentPage = snap;
                // 	var easing = that.options.bounceEasing;
                // 	if (newX!=that.x || newY!=that.y) that.scrollTo(newX, newY, time, easing);
                // 	that.wheelSnap = false;
                // }
                that.moved = false;
                // that._execEvent('scrollEnd');
                that.wheelTimeout = undefined;
            }, this.options.wheelDelay || 400);

            if (typeof that.isStepScrolling == 'undefined') that.isStepScrolling = (e.deltaFactor && e.deltaFactor > this.options.mouseWheelSpeed);

            if ( 'deltaX' in e ) {
                if (that.isStepScrolling) {
                    wheelDeltaX = -e.deltaX * e.deltaFactor;
                    wheelDeltaY = -e.deltaY * e.deltaFactor;
                } else if (e.deltaMode === 1) {
                    wheelDeltaX = -e.deltaX * this.options.mouseWheelSpeed;
                    wheelDeltaY = -e.deltaY * this.options.mouseWheelSpeed;
                } else {
                    wheelDeltaX = -e.deltaX;
                    wheelDeltaY = -e.deltaY;
                }
            } else if ( 'wheelDeltaX' in e ) {
                wheelDeltaX = e.wheelDeltaX / 120 * this.options.mouseWheelSpeed;
                wheelDeltaY = e.wheelDeltaY / 120 * this.options.mouseWheelSpeed;
            } else if ( 'wheelDelta' in e ) {
                wheelDeltaX = wheelDeltaY = e.wheelDelta / 120 * this.options.mouseWheelSpeed;
            } else if ( 'detail' in e ) {
                wheelDeltaX = wheelDeltaY = -e.detail / 3 * this.options.mouseWheelSpeed;
            } else {
                return;
            }

            this.directionY = (-wheelDeltaY)>0 ? 1 : -1;

            wheelDeltaX *= this.options.invertWheelDirection;
            wheelDeltaY *= this.options.invertWheelDirection;

            if ( !this.hasVerticalScroll ) {
                wheelDeltaX = wheelDeltaY;
                wheelDeltaY = 0;
            } else {
                wheelDeltaX = 0;
            }

            newX = this.x + wheelDeltaX;
            newY = this.y + wheelDeltaY;

            // if (newY < this.maxScrollY) newY = this.maxScrollY;
            // if (newX < this.maxScrollX) newX = this.maxScrollX;
            // if (newY > this.minScrollY) newY = this.minScrollY;
            // if (newX > this.minScrollX) newX = this.minScrollX;

            var maxY = this.options.forceBounds && this.options.pullSize ? -this.options.pullSize*1.3 : -this.scrollerHeight+this.wrapperHeight,
                maxX = -this.scrollerWidth+this.wrapperWidth;

            // var curDelta = Math.abs(wheelDeltaY) - Math.abs(that.lastDeltaY);

            that.lastDeltasY.push(wheelDeltaY);
            if (that.lastDeltasY.length>4) that.lastDeltasY.shift();

            var isLarger = true;
            for (var i=1; i<that.lastDeltasY.length; i++) {
                if (Math.abs(that.lastDeltasY[i-1]) >= Math.abs(that.lastDeltasY[i])) {
                    isLarger = false;
                    break;
                }
            };

            var now = Date.now(),
                isNewAction = ((Math.abs(wheelDeltaY)>=5) && (isLarger || that.isStepScrolling) && (now - that.newActionTime > (that.isStepScrolling ? 350 : 400) )),
                isNewDirection = (e.deltaY < 0 ? -1 : 1) != that.lastDirection,
                current = that.pages[0][that.currentPage.pageY];

            if (newX < maxX) newX = maxX;
            if (newX > 0) newX = 0;
            if (newY > 0) {
                var isBefore = true;
                newY = 0;
            }
            if (newY < maxY) {
                var isAfter = true;
                newY = maxY;
            }
            if (isBefore || isAfter) {
                if (isNewAction) {
                    that.newActionTime = now;
                    if (that.options.prevTrigger && isBefore && !app.device.isMobile) return that.options.prevTrigger();
                    if (that.options.nextTrigger && isAfter && !app.device.isMobile) return that.options.nextTrigger();
                    that.enabled = false;
                    that.scrollTo(0, isBefore ? 40 : maxY-40, that.options.snapSpeed*0.7, utils.ease.cubicInOut);
                    setTimeout(function(){
                        that.enabled = true;
                    }, this.options.snapSpeed*1.5);
                }
                that.lastDirection = wheelDeltaY < 0 ? -1 : 1;
                that.lastDeltaY = wheelDeltaY;
                return false;
            }

            if (newX==this.x && newY==this.y) {
                this._execEvent('scroll');
                return false;
            }

            if (newY >= maxY && newX >= maxX && newY<=0 && newX<=0 && !that.options.snap) {
                this.scrollTo(newX, newY, 0);
                if ( this.options.probeType > 1 ) this._execEvent('scroll');
            }

            if (that.options.snap) {
                if (isNewAction && that.isSnapped) that.isSnapped = false;
                if (newY < current.y && newY > current.y - current.height + that.wrapperHeight) {
                    if (!that.isSnapped) this.scrollTo(newX, newY, 0);
                    if ( this.options.probeType > 1 ) this._execEvent('scroll');
                } else if (isNewAction) { // || isNewDirection
                    that.newActionTime = now;
                    newX = this.currentPage.pageX;
                    newY = this.currentPage.pageY;
                    if ( wheelDeltaY > 0 ) {
                        newY = Math.max(newY-1, 0);
                        that.isSnapped = true;
                        that.scrollTo(0, that.pages[0][newY].y - that.pages[0][newY].height + that.wrapperHeight, that.options.snapSpeed, that.options.expoInOut);
                    } else if ( wheelDeltaY < 0 ) {
                        newY++;
                        that.isSnapped = true;
                        newY = Math.min(that.pages[0].length-1, newY);
                        that.goToPage(newX, newY, that.options.snapSpeed, that.options.expoInOut);
                    }
                    that.currentPage = {
                        x: 0,
                        y: that.pages[0][newY],
                        pageY: newY,
                        pageX: 0
                    }
                }
                that.lastDirection = wheelDeltaY < 0 ? -1 : 1;
                that.lastDeltaY = wheelDeltaY;
                return;
            }

            return; // disable default snapping

            if ( this.options.snap ) {
                newX = this.currentPage.pageX;
                newY = this.currentPage.pageY;

                if ( wheelDeltaX > 0 ) {
                    newX--;
                } else if ( wheelDeltaX < 0 ) {
                    newX++;
                }

                if ( wheelDeltaY > 0 ) {
                    newY--;
                } else if ( wheelDeltaY < 0 ) {
                    newY++;
                }

                this.goToPage(newX, newY);
            }

            return;

            newX = this.x + Math.round(this.hasHorizontalScroll ? wheelDeltaX : 0);
            newY = this.y + Math.round(this.hasVerticalScroll ? wheelDeltaY : 0);

            if ( newX > 0 ) {
                newX = 0;
            } else if ( newX < this.maxScrollX ) {
                newX = this.maxScrollX;
            }

            if ( newY > 0 ) {
                newY = 0;
                // } else if ( newY > this.minScrollY ) {
                // 	newY = this.minScrollY;
            } else if ( newY < this.maxScrollY ) {
                newY = this.maxScrollY;
            }
            this.scrollTo(newX, newY, 0);

            if ( this.options.probeType > 1 ) {
                this._execEvent('scroll');
            }

// INSERT POINT: _wheel
        },

        _initSnap: function () {
            this.currentPage = {};

            if ( typeof this.options.snap == 'string' ) {
                this.options.snap = this.scroller.querySelectorAll(this.options.snap);
            }

            this.on('refresh', function () {
                var i = 0, l,
                    m = 0, n,
                    cx, cy,
                    x = 0, y,
                    stepX = this.options.snapStepX || this.wrapperWidth,
                    stepY = this.options.snapStepY || this.wrapperHeight,
                    el;

                this.pages = [];

                if ( !this.wrapperWidth || !this.wrapperHeight || !this.scrollerWidth || !this.scrollerHeight ) {
                    return;
                }

                if ( this.options.snap === true ) {
                    cx = Math.round( stepX / 2 );
                    cy = Math.round( stepY / 2 );

                    while ( x > -this.scrollerWidth ) {
                        this.pages[i] = [];
                        l = 0;
                        y = 0;

                        while ( y > -this.scrollerHeight ) {
                            this.pages[i][l] = {
                                x: Math.max(x, this.maxScrollX),
                                y: Math.max(y, this.maxScrollY),
                                width: stepX,
                                height: stepY,
                                cx: x - cx,
                                cy: y - cy
                            };

                            y -= stepY;
                            l++;
                        }

                        x -= stepX;
                        i++;
                    }
                } else {
                    el = this.options.snap;
                    l = el.length;
                    n = -1;

                    for ( ; i < l; i++ ) {
                        if ( i === 0 || el[i].offsetLeft <= el[i-1].offsetLeft ) {
                            m = 0;
                            n++;
                        }

                        if ( !this.pages[m] ) {
                            this.pages[m] = [];
                        }

                        x = Math.max(-el[i].offsetLeft, this.maxScrollX);
                        y = Math.max(-el[i].offsetTop, this.maxScrollY);
                        cx = x - Math.round(el[i].offsetWidth / 2);
                        cy = y - Math.round(el[i].offsetHeight / 2);

                        this.pages[m][n] = {
                            x: x,
                            y: y,
                            width: el[i].offsetWidth,
                            height: el[i].offsetHeight,
                            cx: cx,
                            cy: cy
                        };

                        if ( x > this.maxScrollX ) {
                            m++;
                        }
                    }
                }

                this.goToPage(this.currentPage.pageX || 0, this.currentPage.pageY || 0, 0);

                // Update snap threshold if needed
                if ( this.options.snapThreshold % 1 === 0 ) {
                    this.snapThresholdX = this.options.snapThreshold;
                    this.snapThresholdY = this.options.snapThreshold;
                } else {
                    this.snapThresholdX = Math.round(this.wrapperWidth * this.options.snapThreshold);
                    this.snapThresholdY = Math.round(this.wrapperHeight * this.options.snapThreshold);
                }
            });

            this.on('flick', function () {
                var time = this.options.snapSpeed || Math.max(
                        Math.max(
                            Math.min(Math.abs(this.x - this.startX), 1000),
                            Math.min(Math.abs(this.y - this.startY), 1000)
                        ), this.options.snapSpeed);


                this.goToPage(
                    this.currentPage.pageX + this.directionX,
                    this.currentPage.pageY + this.directionY,
                    time
                );
            });
        },

        _nearestSnap: function (x, y) {
            if ( !this.pages.length ) {
                return { x: 0, y: 0, pageX: 0, pageY: 0 };
            }
            var i = 0,
                l = this.pages.length,
                m = 0,
                defY = y;

            // Check if we exceeded the snap threshold
            if (this.wheelSnap || Math.abs(x - this.absStartX) <= this.snapThresholdX && Math.abs(y - this.absStartY) <= this.snapThresholdY) {

                // return this.currentPage;
                x = this.currentPage.x;
                y = this.currentPage.y;
                i = this.currentPage.pageX;
                m = this.currentPage.pageY;


            } else {

                var maxY = -this.scrollerHeight+this.wrapperHeight,
                    maxX = -this.scrollerWidth+this.wrapperWidth;

                if ( x >= 0 ) {
                    x = 0;
                } else if ( x <= maxX ) {
                    x = maxX;
                }

                if ( y >= 0 ) {
                    y = 0;
                } else if ( y <= maxY ) {
                    y = maxY;
                }

                for ( ; i < l; i++ ) {
                    if ( x >= this.pages[i][0].cx ) {
                        x = this.pages[i][0].x;
                        break;
                    }
                }

                l = this.pages[i].length;

                for ( ; m < l; m++ ) {
                    if ( y >= this.pages[0][m].cy ) {
                        y = this.pages[0][m].y;
                        break;
                    }
                }

                if ( i == this.currentPage.pageX ) {
                    i += this.directionX;
                    if ( i < 0 ) {
                        i = 0;
                    } else if ( i >= this.pages.length ) {
                        i = this.pages.length - 1;
                    }

                    x = this.pages[i][0].x;
                }

                if ( m == this.currentPage.pageY && (defY>=this.pages[0][m].y+this.snapThresholdY || defY <= this.pages[0][m].y-this.pages[0][m].height+this.wrapperHeight-this.snapThresholdY)) {
                    m += this.directionY;
                }

                if ( m < 0 ) {
                    m = 0;
                } else if ( m >= this.pages[0].length-1 ) {
                    m = this.pages[0].length - 1;
                }

                y = this.pages[0][m].y;
            }

            if (this.hasVerticalScroll && ((this.pages[0][m].height>this.wrapperHeight) || (this.pages[0][this.currentPage.pageY].height>this.wrapperHeight)) ) {
                var currentTop = this.currentPage.y,
                    currentBottom = this.currentPage.y-this.pages[0][this.currentPage.pageY].height+this.wrapperHeight,
                    distance = Math.abs(defY - this.absStartY);
                if (defY>=currentBottom && defY<=currentTop) {
                    return { x:0, y:defY, pageX:0, pageY:this.currentPage.pageY }
                } else if (m < this.currentPage.pageY && this.absStartY+this.snapThresholdY<currentTop) {
                    return { x:0, y:this.currentPage.y, pageX:0, pageY:this.currentPage.pageY }
                } else if (m < this.currentPage.pageY) {
                    return { x:0, y:this.pages[0][m].y-this.pages[0][m].height+this.wrapperHeight, pageX:0, pageY:m }
                } else if (m > this.currentPage.pageY && this.absStartY-this.snapThresholdY>currentBottom) {
                    return { x:0, y:this.currentPage.y-this.pages[0][this.currentPage.pageY].height+this.wrapperHeight, pageX:0, pageY:m }
                } else if (m > this.currentPage.pageY) {
                    return { x:0, y:this.pages[0][m].y, pageX:0, pageY:m }
                } else if (defY < this.pages[0][m].y-this.pages[0][m].height+this.wrapperHeight) {
                    return { x:0, y:this.pages[0][m].y-this.pages[0][m].height+this.wrapperHeight, pageX:0, pageY:m }
                }
            };

            return {
                x: x,
                y: y,
                pageX: i,
                pageY: m
            };

        },

        goToPage: function (x, y, time, easing) {
            easing = easing || this.options.bounceEasing;

            if (!this.pages) return;

            if ( x >= this.pages.length ) {
                x = this.pages.length - 1;
            } else if ( x < 0 ) {
                x = 0;
            }

            if (!this.pages[x]) return;

            if (y >= this.pages[x].length ) {
                y = this.pages[x].length - 1;
            } else if ( y < 0 ) {
                y = 0;
            }

            var posX = this.pages[x][y].x,
                posY = this.pages[x][y].y;

            time = time === undefined ? this.options.snapSpeed || Math.max(
                Math.max(
                    Math.min(Math.abs(posX - this.x), 1000),
                    Math.min(Math.abs(posY - this.y), 1000)
                ), 300) : time;

            this.currentPage = {
                x: posX,
                y: posY,
                pageX: x,
                pageY: y
            };

            this.scrollTo(posX, posY, time, easing);
        },

        next: function (time, easing) {
            var x = this.currentPage.pageX,
                y = this.currentPage.pageY;

            x++;

            if ( x >= this.pages.length && this.hasVerticalScroll ) {
                x = 0;
                y++;
            }

            this.goToPage(x, y, time, easing);
        },

        prev: function (time, easing) {
            var x = this.currentPage.pageX,
                y = this.currentPage.pageY;

            x--;

            if ( x < 0 && this.hasVerticalScroll ) {
                x = 0;
                y--;
            }

            this.goToPage(x, y, time, easing);
        },

        _initKeys: function (e) {
            // default key bindings
            var keys = {
                pageUp: 33,
                pageDown: 34,
                end: 35,
                home: 36,
                left: 37,
                up: 38,
                right: 39,
                down: 40
            };
            var i;

            // if you give me characters I give you keycode
            if ( typeof this.options.keyBindings == 'object' ) {
                for ( i in this.options.keyBindings ) {
                    if ( typeof this.options.keyBindings[i] == 'string' ) {
                        this.options.keyBindings[i] = this.options.keyBindings[i].toUpperCase().charCodeAt(0);
                    }
                }
            } else {
                this.options.keyBindings = {};
            }

            for ( i in keys ) {
                this.options.keyBindings[i] = this.options.keyBindings[i] || keys[i];
            }

            utils.addEvent(window, 'keydown', this);

            this.on('destroy', function () {
                utils.removeEvent(window, 'keydown', this);
            });
        },

        _key: function (e) {
            if ( !this.enabled ) {
                return;
            }

            var snap = this.options.snap,	// we are using this alot, better to cache it
                newX = snap ? this.currentPage.pageX : this.x,
                newY = snap ? this.currentPage.pageY : this.y,
                now = utils.getTime(),
                prevTime = this.keyTime || 0,
                acceleration = 0.250,
                pos;

            if ( this.options.useTransition && this.isInTransition ) {
                pos = this.getComputedPosition();

                this._translate(Math.round(pos.x), Math.round(pos.y));
                this.isInTransition = false;
            }

            this.keyAcceleration = now - prevTime < 200 ? Math.min(this.keyAcceleration + acceleration, 50) : 0;

            switch ( e.keyCode ) {
                case this.options.keyBindings.pageUp:
                    if ( this.hasHorizontalScroll && !this.hasVerticalScroll ) {
                        newX += snap ? 1 : this.wrapperWidth;
                    } else {
                        newY += snap ? 1 : this.wrapperHeight;
                    }
                    break;
                case this.options.keyBindings.pageDown:
                    if ( this.hasHorizontalScroll && !this.hasVerticalScroll ) {
                        newX -= snap ? 1 : this.wrapperWidth;
                    } else {
                        newY -= snap ? 1 : this.wrapperHeight;
                    }
                    break;
                case this.options.keyBindings.end:
                    newX = snap ? this.pages.length-1 : this.maxScrollX;
                    newY = snap ? this.pages[0].length-1 : this.maxScrollY;
                    break;
                case this.options.keyBindings.home:
                    newX = 0;
                    newY = 0;
                    break;
                case this.options.keyBindings.left:
                    newX += snap ? -1 : 5 + this.keyAcceleration>>0;
                    break;
                case this.options.keyBindings.up:
                    newY += snap ? 1 : 5 + this.keyAcceleration>>0;
                    break;
                case this.options.keyBindings.right:
                    newX -= snap ? -1 : 5 + this.keyAcceleration>>0;
                    break;
                case this.options.keyBindings.down:
                    newY -= snap ? 1 : 5 + this.keyAcceleration>>0;
                    break;
                default:
                    return;
            }

            if ( snap ) {
                this.goToPage(newX, newY);
                return;
            }

            if ( newX > 0 ) {
                newX = 0;
                this.keyAcceleration = 0;
            } else if ( newX < this.maxScrollX ) {
                newX = this.maxScrollX;
                this.keyAcceleration = 0;
            }

            if ( newY > 0 ) {
                newY = 0;
                this.keyAcceleration = 0;
            } else if ( newY < this.maxScrollY ) {
                newY = this.maxScrollY;
                this.keyAcceleration = 0;
            }

            this.scrollTo(newX, newY, 0);

            this.keyTime = now;
        },

        _animate: function (destX, destY, duration, easingFn) {

            var that = this,
                startX = this.x,
                startY = this.y,
                startTime = utils.getTime(),
                destTime = startTime + duration;

            this.lastAnimation = [destX, destY, duration];

            this._execEvent('animate');

            function step () {

                if (that.lastAnimation[0] != destX || that.lastAnimation[1] != destY) return;

                var now = utils.getTime(),
                    newX, newY,
                    easing;

                if ( now >= destTime ) {
                    that.isAnimating = false;
                    that._translate(destX, destY);

                    if ( !that.resetPosition(that.options.bounceTime) ) {
                        that.moved = false;
                        that._execEvent('scrollEnd');
                    }

                    return;
                }

                if (!that.isAnimating) return;

                now = ( now - startTime ) / duration;
                easing = easingFn(now);
                newX = ( destX - startX ) * easing + startX;
                newY = ( destY - startY ) * easing + startY;
                that._translate(newX, newY);

                if ( that.isAnimating ) {
                    rAF(step);
                }

                if ( that.options.probeType == 3 ) {
                    that._execEvent('scroll');
                }
            }

            that.isAnimating = true;
            that._execEvent('scrollStart');
            step();

        },

        handleEvent: function (e) {
            switch ( e.type ) {
                case 'touchstart':
                case 'MSPointerDown':
                case 'mousedown':
                    this._start(e);
                    break;
                case 'touchmove':
                case 'MSPointerMove':
                case 'mousemove':
                    this._move(e);
                    break;
                case 'touchend':
                case 'MSPointerUp':
                case 'mouseup':
                case 'touchcancel':
                case 'MSPointerCancel':
                case 'mousecancel':
                    this._end(e);
                    break;
                case 'orientationchange':
                case 'resize':
                    // this._resize();
                    break;
                case 'transitionend':
                case 'webkitTransitionEnd':
                case 'oTransitionEnd':
                case 'MSTransitionEnd':
                    this._transitionEnd(e);
                    break;
                // case 'wheel':
                // case 'DOMMouseScroll':
                // case 'mousewheel':
                // 	this._wheel(e);
                // 	break;
                case 'keydown':
                    this._key(e);
                    break;
                case 'click':
                    if ( !e._constructed ) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    break;
            }
        }
    };
    function createDefaultScrollbar (direction, interactive, type) {
        var scrollbar = document.createElement('div'),
            indicator = document.createElement('div');

        if ( type === true ) {
            scrollbar.style.cssText = 'position:absolute;z-index:9999';
            indicator.style.cssText = '-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;position:absolute;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.9);border-radius:3px';
        }

        indicator.className = 'iScrollIndicator';

        if ( direction == 'h' ) {
            if ( type === true ) {
                scrollbar.style.cssText += ';height:7px;left:2px;right:2px;bottom:0';
                indicator.style.height = '100%';
            }
            scrollbar.className = 'iScrollHorizontalScrollbar';
        } else {
            if ( type === true ) {
                scrollbar.style.cssText += ';width:7px;bottom:2px;top:2px;right:1px';
                indicator.style.width = '100%';
            }
            scrollbar.className = 'iScrollVerticalScrollbar';
        }

        scrollbar.style.cssText += ';overflow:hidden';

        if ( !interactive ) {
            scrollbar.style.pointerEvents = 'none';
        }

        scrollbar.appendChild(indicator);

        return scrollbar;
    }

    function Indicator (scroller, options) {
        this.wrapper = typeof options.el == 'string' ? document.querySelector(options.el) : options.el;
        this.wrapperStyle = this.wrapper.style;
        this.indicator = this.wrapper.children[0];
        this.indicatorStyle = this.indicator.style;
        this.scroller = scroller;

        this.options = {
            listenX: true,
            listenY: true,
            interactive: false,
            resize: true,
            defaultScrollbars: false,
            shrink: false,
            fade: false,
            speedRatioX: 0,
            speedRatioY: 0
        };

        for ( var i in options ) {
            this.options[i] = options[i];
        }

        this.sizeRatioX = 1;
        this.sizeRatioY = 1;
        this.maxPosX = 0;
        this.maxPosY = 0;

        if ( this.options.interactive ) {
            if ( !this.options.disableTouch ) {
                utils.addEvent(this.indicator, 'touchstart', this);
                utils.addEvent(window, 'touchend', this);
            }
            if ( !this.options.disablePointer ) {
                utils.addEvent(this.indicator, 'MSPointerDown', this);
                utils.addEvent(window, 'MSPointerUp', this);
            }
            if ( !this.options.disableMouse ) {
                utils.addEvent(this.indicator, 'mousedown', this);
                utils.addEvent(window, 'mouseup', this);
            }
        }

        if ( this.options.fade ) {
            this.wrapperStyle[utils.style.transform] = this.scroller.translateZ;
            this.wrapperStyle[utils.style.transitionDuration] = utils.isBadAndroid ? '0.001s' : '0ms';
            this.wrapperStyle.opacity = '0';
        }
    }

    Indicator.prototype = {
        handleEvent: function (e) {
            switch ( e.type ) {
                case 'touchstart':
                case 'MSPointerDown':
                case 'mousedown':
                    this._start(e);
                    break;
                case 'touchmove':
                case 'MSPointerMove':
                case 'mousemove':
                    this._move(e);
                    break;
                case 'touchend':
                case 'MSPointerUp':
                case 'mouseup':
                case 'touchcancel':
                case 'MSPointerCancel':
                case 'mousecancel':
                    this._end(e);
                    break;
            }
        },

        destroy: function () {
            if ( this.options.interactive ) {
                utils.removeEvent(this.indicator, 'touchstart', this);
                utils.removeEvent(this.indicator, 'MSPointerDown', this);
                utils.removeEvent(this.indicator, 'mousedown', this);

                utils.removeEvent(window, 'touchmove', this);
                utils.removeEvent(window, 'MSPointerMove', this);
                utils.removeEvent(window, 'mousemove', this);

                utils.removeEvent(window, 'touchend', this);
                utils.removeEvent(window, 'MSPointerUp', this);
                utils.removeEvent(window, 'mouseup', this);
            }

            if ( this.options.defaultScrollbars ) {
                this.wrapper.parentNode.removeChild(this.wrapper);
            }
        },

        _start: function (e) {

            var point = e.touches ? e.touches[0] : e;

            $(this.wrapper).addClass('i-scrolling');

            e.preventDefault();
            e.stopPropagation();

            this.transitionTime();

            this.initiated = true;
            this.moved = false;
            this.wheelTimeout = undefined;
            this.wheelSnap = false;
            this.lastPointX	= point.pageX;
            this.lastPointY	= point.pageY;

            this.startTime	= utils.getTime();

            if ( !this.options.disableTouch ) {
                utils.addEvent(window, 'touchmove', this);
            }
            if ( !this.options.disablePointer ) {
                utils.addEvent(window, 'MSPointerMove', this);
            }
            if ( !this.options.disableMouse ) {
                utils.addEvent(window, 'mousemove', this);
            }

            this.scroller._execEvent('beforeScrollStart');
        },

        _move: function (e) {
            var point = e.touches ? e.touches[0] : e,
                deltaX, deltaY,
                newX, newY,
                timestamp = utils.getTime();

            if ( !this.moved ) {
                this.scroller._execEvent('scrollStart');
            }
            clearTimeout(this.wheelTimeout);
            this.wheelSnap = false;

            this.moved = true;

            deltaX = point.pageX - this.lastPointX;
            this.lastPointX = point.pageX;

            deltaY = point.pageY - this.lastPointY;
            this.lastPointY = point.pageY;

            newX = this.x + deltaX;
            newY = this.y + deltaY;

            this._pos(newX, newY);


            if ( this.scroller.options.probeType == 1 && timestamp - this.startTime > 300 ) {
                this.startTime = timestamp;
                this.scroller._execEvent('scroll');
            } else if ( this.scroller.options.probeType > 1 ) {
                this.scroller._execEvent('scroll');
            }


// INSERT POINT: indicator._move

            e.preventDefault();
            e.stopPropagation();
        },

        _end: function (e) {

            if ( !this.initiated ) return;

            clearTimeout(this.wheelTimeout);
            this.wheelSnap = false;

            this.initiated = false;

            $(this.wrapper).removeClass('i-scrolling');

            e.preventDefault();
            e.stopPropagation();

            utils.removeEvent(window, 'touchmove', this);
            utils.removeEvent(window, 'MSPointerMove', this);
            utils.removeEvent(window, 'mousemove', this);

            if ( this.scroller.options.snap ) {
                var snap = this.scroller._nearestSnap(this.scroller.x, this.scroller.y);

                var time = this.options.snapSpeed || Math.max(
                        Math.max(
                            Math.min(Math.abs(this.scroller.x - snap.x), 1000),
                            Math.min(Math.abs(this.scroller.y - snap.y), 1000)
                        ), this.options.snapSpeed);


                if ( this.scroller.x != snap.x || this.scroller.y != snap.y ) {
                    this.scroller.directionX = 0;
                    this.scroller.directionY = 0;
                    this.scroller.currentPage = snap;
                    this.scroller.scrollTo(snap.x, snap.y, time, this.scroller.options.bounceEasing);
                }
            }

            if ( this.moved ) {
                this.moved = false;
                this.scroller._execEvent('scrollEnd');
            }
        },

        transitionTime: function (time) {
            time = time || 0;
            this.indicatorStyle[utils.style.transitionDuration] = time + 'ms';

            if ( !time && utils.isBadAndroid ) {
                this.indicatorStyle[utils.style.transitionDuration] = '0.001s';
            }
        },

        transitionTimingFunction: function (easing) {
            this.indicatorStyle[utils.style.transitionTimingFunction] = easing;
        },

        refresh: function () {
            this.transitionTime();

            if ( this.options.listenX && !this.options.listenY ) {
                this.indicatorStyle.display = this.scroller.hasHorizontalScroll ? 'block' : 'none';
            } else if ( this.options.listenY && !this.options.listenX ) {
                this.indicatorStyle.display = this.scroller.hasVerticalScroll ? 'block' : 'none';
            } else {
                this.indicatorStyle.display = this.scroller.hasHorizontalScroll || this.scroller.hasVerticalScroll ? 'block' : 'none';
            }

            if ( this.scroller.hasHorizontalScroll && this.scroller.hasVerticalScroll ) {
                utils.addClass(this.wrapper, 'iScrollBothScrollbars');
                utils.removeClass(this.wrapper, 'iScrollLoneScrollbar');

                if ( this.options.defaultScrollbars && this.options.customStyle ) {
                    if ( this.options.listenX ) {
                        this.wrapper.style.right = '8px';
                    } else {
                        this.wrapper.style.bottom = '8px';
                    }
                }
            } else {
                utils.removeClass(this.wrapper, 'iScrollBothScrollbars');
                utils.addClass(this.wrapper, 'iScrollLoneScrollbar');

                if ( this.options.defaultScrollbars && this.options.customStyle ) {
                    if ( this.options.listenX ) {
                        this.wrapper.style.right = '2px';
                    } else {
                        this.wrapper.style.bottom = '2px';
                    }
                }
            }

            var r = this.wrapper.offsetHeight;	// force refresh

            if ( this.options.listenX ) {
                this.wrapperWidth = this.wrapper.clientWidth;
                if ( this.options.resize ) {
                    this.indicatorWidth = Math.max(Math.round(this.wrapperWidth * this.wrapperWidth / (this.scroller.scrollerWidth || this.wrapperWidth || 1)), 8);
                    this.indicatorStyle.width = this.indicatorWidth + 'px';
                } else {
                    this.indicatorWidth = this.indicator.clientWidth;
                }

                this.maxPosX = this.wrapperWidth - this.indicatorWidth;

                if ( this.options.shrink == 'clip' ) {
                    this.minBoundaryX = -this.indicatorWidth + 8;
                    this.maxBoundaryX = this.wrapperWidth - 8;
                } else {
                    this.minBoundaryX = 0;
                    this.maxBoundaryX = this.maxPosX;
                }

                this.sizeRatioX = this.options.speedRatioX || (this.scroller.maxScrollX && (this.maxPosX / this.scroller.maxScrollX));
            }

            if ( this.options.listenY ) {
                this.wrapperHeight = this.wrapper.clientHeight;
                if ( this.options.resize ) {
                    this.indicatorHeight = Math.round(this.wrapperHeight * this.wrapperHeight / (this.scroller.scrollerHeight || this.wrapperHeight || 1));
                    this.indicatorStyle.height = this.indicatorHeight + 'px';
                } else {
                    this.indicatorHeight = this.indicator.clientHeight;
                }

                this.maxPosY = this.wrapperHeight - this.indicatorHeight;

                if ( this.options.shrink == 'clip' ) {
                    this.minBoundaryY = -this.indicatorHeight + 8;
                    this.maxBoundaryY = this.wrapperHeight - 8;
                } else {
                    this.minBoundaryY = 0;
                    this.maxBoundaryY = this.maxPosY;
                }

                this.maxPosY = this.wrapperHeight - this.indicatorHeight;
                this.sizeRatioY = this.options.speedRatioY || (this.scroller.maxScrollY && (this.maxPosY / this.scroller.maxScrollY));
            }

            this.updatePosition();
        },

        updatePosition: function () {
            var x = this.options.listenX && Math.round(this.sizeRatioX * this.scroller.x) || 0,
                y = this.options.listenY && Math.round(this.sizeRatioY * this.scroller.y) || 0;

            if ( !this.options.ignoreBoundaries ) {
                if ( x < this.minBoundaryX ) {
                    if ( this.options.shrink == 'scale' ) {
                        this.width = Math.max(this.indicatorWidth + x, 8);
                        this.indicatorStyle.width = this.width + 'px';
                    }
                    x = this.minBoundaryX;
                } else if ( x > this.maxBoundaryX ) {
                    if ( this.options.shrink == 'scale' ) {
                        this.width = Math.max(this.indicatorWidth - (x - this.maxPosX), 8);
                        this.indicatorStyle.width = this.width + 'px';
                        x = this.maxPosX + this.indicatorWidth - this.width;
                    } else {
                        x = this.maxBoundaryX;
                    }
                } else if ( this.options.shrink == 'scale' && this.width != this.indicatorWidth ) {
                    this.width = this.indicatorWidth;
                    this.indicatorStyle.width = this.width + 'px';
                }

                if ( y < this.minBoundaryY ) {
                    if ( this.options.shrink == 'scale' ) {
                        this.height = Math.max(this.indicatorHeight + y * 3, 8);
                        this.indicatorStyle.height = this.height + 'px';
                    }
                    y = this.minBoundaryY;
                } else if ( y > this.maxBoundaryY ) {
                    if ( this.options.shrink == 'scale' ) {
                        this.height = Math.max(this.indicatorHeight - (y - this.maxPosY) * 3, 8);
                        this.indicatorStyle.height = this.height + 'px';
                        y = this.maxPosY + this.indicatorHeight - this.height;
                    } else {
                        y = this.maxBoundaryY;
                    }
                } else if ( this.options.shrink == 'scale' && this.height != this.indicatorHeight ) {
                    this.height = this.indicatorHeight;
                    this.indicatorStyle.height = this.height + 'px';
                }
            }

            this.x = x;
            this.y = y;

            if ( this.scroller.options.useTransform ) {
                this.indicatorStyle[utils.style.transform] = 'translate(' + x + 'px,' + y + 'px)' + this.scroller.translateZ;
            } else {
                this.indicatorStyle.left = x + 'px';
                this.indicatorStyle.top = y + 'px';
            }
        },

        _pos: function (x, y) {
            if ( x < 0 ) {
                x = 0;
            } else if ( x > this.maxPosX ) {
                x = this.maxPosX;
            }

            if ( y < 0 ) {
                y = 0;
            } else if ( y > this.maxPosY ) {
                y = this.maxPosY;
            }

            x = this.options.listenX ? Math.round(x / this.sizeRatioX) : this.scroller.x;
            y = this.options.listenY ? Math.round(y / this.sizeRatioY) : this.scroller.y;

            this.scroller.scrollTo(x, y);
        },

        fade: function (val, hold) {
            if ( hold && !this.visible ) {
                return;
            }

            clearTimeout(this.fadeTimeout);
            this.fadeTimeout = null;

            var time = val ? 250 : 500,
                delay = val ? 0 : 300;

            val = val ? '1' : '0';

            this.wrapperStyle[utils.style.transitionDuration] = time + 'ms';

            this.fadeTimeout = setTimeout((function (val) {
                this.wrapperStyle.opacity = val;
                this.visible = +val;
            }).bind(this, val), delay);
        }
    };

    IScroll.utils = utils;

    if ( typeof module != 'undefined' && module.exports ) {
        module.exports = IScroll;
    } else {
        window.IScroll = IScroll;
    }

})(window, document, Math);
/*!
 * jQuery Mousewheel 3.1.13
 *
 * Copyright 2015 jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */
!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof exports?module.exports=a:a(jQuery)}(function(a){function b(b){var g=b||window.event,h=i.call(arguments,1),j=0,l=0,m=0,n=0,o=0,p=0;if(b=a.event.fix(g),b.type="mousewheel","detail"in g&&(m=-1*g.detail),"wheelDelta"in g&&(m=g.wheelDelta),"wheelDeltaY"in g&&(m=g.wheelDeltaY),"wheelDeltaX"in g&&(l=-1*g.wheelDeltaX),"axis"in g&&g.axis===g.HORIZONTAL_AXIS&&(l=-1*m,m=0),j=0===m?l:m,"deltaY"in g&&(m=-1*g.deltaY,j=m),"deltaX"in g&&(l=g.deltaX,0===m&&(j=-1*l)),0!==m||0!==l){if(1===g.deltaMode){var q=a.data(this,"mousewheel-line-height");j*=q,m*=q,l*=q}else if(2===g.deltaMode){var r=a.data(this,"mousewheel-page-height");j*=r,m*=r,l*=r}if(n=Math.max(Math.abs(m),Math.abs(l)),(!f||f>n)&&(f=n,d(g,n)&&(f/=40)),d(g,n)&&(j/=40,l/=40,m/=40),j=Math[j>=1?"floor":"ceil"](j/f),l=Math[l>=1?"floor":"ceil"](l/f),m=Math[m>=1?"floor":"ceil"](m/f),k.settings.normalizeOffset&&this.getBoundingClientRect){var s=this.getBoundingClientRect();o=b.clientX-s.left,p=b.clientY-s.top}return b.deltaX=l,b.deltaY=m,b.deltaFactor=f,b.offsetX=o,b.offsetY=p,b.deltaMode=0,h.unshift(b,j,l,m),e&&clearTimeout(e),e=setTimeout(c,200),(a.event.dispatch||a.event.handle).apply(this,h)}}function c(){f=null}function d(a,b){return k.settings.adjustOldDeltas&&"mousewheel"===a.type&&b%120===0}var e,f,g=["wheel","mousewheel","DOMMouseScroll","MozMousePixelScroll"],h="onwheel"in document||document.documentMode>=9?["wheel"]:["mousewheel","DomMouseScroll","MozMousePixelScroll"],i=Array.prototype.slice;if(a.event.fixHooks)for(var j=g.length;j;)a.event.fixHooks[g[--j]]=a.event.mouseHooks;var k=a.event.special.mousewheel={version:"3.1.12",setup:function(){if(this.addEventListener)for(var c=h.length;c;)this.addEventListener(h[--c],b,!1);else this.onmousewheel=b;a.data(this,"mousewheel-line-height",k.getLineHeight(this)),a.data(this,"mousewheel-page-height",k.getPageHeight(this))},teardown:function(){if(this.removeEventListener)for(var c=h.length;c;)this.removeEventListener(h[--c],b,!1);else this.onmousewheel=null;a.removeData(this,"mousewheel-line-height"),a.removeData(this,"mousewheel-page-height")},getLineHeight:function(b){var c=a(b),d=c["offsetParent"in a.fn?"offsetParent":"parent"]();return d.length||(d=a("body")),parseInt(d.css("fontSize"),10)||parseInt(c.css("fontSize"),10)||16},getPageHeight:function(b){return a(b).height()},settings:{adjustOldDeltas:!0,normalizeOffset:!0}};a.fn.extend({mousewheel:function(a){return a?this.bind("mousewheel",a):this.trigger("mousewheel")},unmousewheel:function(a){return this.unbind("mousewheel",a)}})});
/*! sly 1.6.0 - 17th Jul 2015 | https://github.com/darsain/sly */
!function(a,b,c){"use strict";function d(b,p,q){function K(c){var d=0,e=Gb.length;if(yb.old=a.extend({},yb),wb=tb?0:ub[rb.horizontal?"width":"height"](),Bb=zb[rb.horizontal?"width":"height"](),xb=tb?b:vb[rb.horizontal?"outerWidth":"outerHeight"](),Gb.length=0,yb.start=0,yb.end=H(xb-wb,0),Rb){d=Ib.length,Hb=vb.children(rb.itemSelector),Ib.length=0;var f,g=j(vb,rb.horizontal?"paddingLeft":"paddingTop"),h=j(vb,rb.horizontal?"paddingRight":"paddingBottom"),i="border-box"===a(Hb).css("boxSizing"),l="none"!==Hb.css("float"),m=0,n=Hb.length-1;xb=0,Hb.each(function(b,c){var d=a(c),e=c.getBoundingClientRect(),i=G(rb.horizontal?e.width||e.right-e.left:e.height||e.bottom-e.top),k=j(d,rb.horizontal?"marginLeft":"marginTop"),o=j(d,rb.horizontal?"marginRight":"marginBottom"),p=i+k+o,q=!k||!o,r={};r.el=c,r.size=q?i:p,r.half=r.size/2,r.start=xb+(q?k:0),r.center=r.start-G(wb/2-r.size/2),r.end=r.start-wb+r.size,b||(xb+=g),xb+=p,rb.horizontal||l||o&&k&&b>0&&(xb-=I(k,o)),b===n&&(r.end+=h,xb+=h,m=q?o:0),Ib.push(r),f=r}),vb[0].style[rb.horizontal?"width":"height"]=(i?xb:xb-g-h)+"px",xb-=m,Ib.length?(yb.start=Ib[0][Pb?"center":"start"],yb.end=Pb?f.center:xb>wb?f.end:yb.start):yb.start=yb.end=0}if(yb.center=G(yb.end/2+yb.start/2),V(),Ab.length&&Bb>0&&(rb.dynamicHandle?(Cb=yb.start===yb.end?Bb:G(Bb*wb/xb),Cb=k(Cb,rb.minHandleSize,Bb),Ab[0].style[rb.horizontal?"width":"height"]=Cb+"px"):Cb=Ab[rb.horizontal?"outerWidth":"outerHeight"](),Db.end=Bb-Cb,ec||N()),!tb&&wb>0){var o=yb.start,p="";if(Rb)a.each(Ib,function(a,b){Pb?Gb.push(b.center):b.start+b.size>o&&o<=yb.end&&(o=b.start,Gb.push(o),o+=wb,o>yb.end&&o<yb.end+wb&&Gb.push(yb.end))});else for(;o-wb<yb.end;)Gb.push(o),o+=wb;if(Eb[0]&&e!==Gb.length){for(var q=0;q<Gb.length;q++)p+=rb.pageBuilder.call(sb,q);Fb=Eb.html(p).children(),Fb.eq(Jb.activePage).addClass(rb.activeClass)}}if(Jb.slideeSize=xb,Jb.frameSize=wb,Jb.sbSize=Bb,Jb.handleSize=Cb,Rb){c&&null!=rb.startAt&&(T(rb.startAt),sb[Qb?"toCenter":"toStart"](rb.startAt));var r=Ib[Jb.activeItem];L(Qb&&r?r.center:k(yb.dest,yb.start,yb.end))}else c?null!=rb.startAt&&L(rb.startAt,1):L(k(yb.dest,yb.start,yb.end));ob("load")}function L(a,b,c){if(Rb&&cc.released&&!c){var d=U(a),e=a>yb.start&&a<yb.end;Qb?(e&&(a=Ib[d.centerItem].center),Pb&&rb.activateMiddle&&T(d.centerItem)):e&&(a=Ib[d.firstItem].start)}cc.init&&cc.slidee&&rb.elasticBounds?a>yb.end?a=yb.end+(a-yb.end)/6:a<yb.start&&(a=yb.start+(a-yb.start)/6):a=k(a,yb.start,yb.end),ac.start=+new Date,ac.time=0,ac.from=yb.cur,ac.to=a,ac.delta=a-yb.cur,ac.tweesing=cc.tweese||cc.init&&!cc.slidee,ac.immediate=!ac.tweesing&&(b||cc.init&&cc.slidee||!rb.speed),cc.tweese=0,a!==yb.dest&&(yb.dest=a,ob("change"),ec||M()),Z(),V(),W(),O()}function M(){if(sb.initialized){if(!ec)return ec=t(M),void(cc.released&&ob("moveStart"));ac.immediate?yb.cur=ac.to:ac.tweesing?(ac.tweeseDelta=ac.to-yb.cur,D(ac.tweeseDelta)<.1?yb.cur=ac.to:yb.cur+=ac.tweeseDelta*(cc.released?rb.swingSpeed:rb.syncSpeed)):(ac.time=I(+new Date-ac.start,rb.speed),yb.cur=ac.from+ac.delta*a.easing[rb.easing](ac.time/rb.speed,ac.time,0,1,rb.speed)),ac.to===yb.cur?(yb.cur=ac.to,cc.tweese=ec=0):ec=t(M),ob("move"),tb||(m?vb[0].style[m]=n+(rb.horizontal?"translateX":"translateY")+"("+-yb.cur+"px)":vb[0].style[rb.horizontal?"left":"top"]=-G(yb.cur)+"px"),!ec&&cc.released&&ob("moveEnd"),N()}}function N(){Ab.length&&(Db.cur=yb.start===yb.end?0:((cc.init&&!cc.slidee?yb.dest:yb.cur)-yb.start)/(yb.end-yb.start)*Db.end,Db.cur=k(G(Db.cur),Db.start,Db.end),_b.hPos!==Db.cur&&(_b.hPos=Db.cur,m?Ab[0].style[m]=n+(rb.horizontal?"translateX":"translateY")+"("+Db.cur+"px)":Ab[0].style[rb.horizontal?"left":"top"]=Db.cur+"px"))}function O(){Fb[0]&&_b.page!==Jb.activePage&&(_b.page=Jb.activePage,Fb.removeClass(rb.activeClass).eq(Jb.activePage).addClass(rb.activeClass),ob("activePage",_b.page))}function P(){bc.speed&&yb.cur!==(bc.speed>0?yb.end:yb.start)||sb.stop(),hc=cc.init?t(P):0,bc.now=+new Date,bc.pos=yb.cur+(bc.now-bc.lastTime)/1e3*bc.speed,L(cc.init?bc.pos:G(bc.pos)),cc.init||yb.cur!==yb.dest||ob("moveEnd"),bc.lastTime=bc.now}function Q(a,b,d){if("boolean"===e(b)&&(d=b,b=c),b===c)L(yb[a],d);else{if(Qb&&"center"!==a)return;var f=sb.getPos(b);f&&L(f[a],d,!Qb)}}function R(a){return null!=a?i(a)?a>=0&&a<Ib.length?a:-1:Hb.index(a):-1}function S(a){return R(i(a)&&0>a?a+Ib.length:a)}function T(a,b){var c=R(a);return!Rb||0>c?!1:((_b.active!==c||b)&&(Hb.eq(Jb.activeItem).removeClass(rb.activeClass),Hb.eq(c).addClass(rb.activeClass),_b.active=Jb.activeItem=c,W(),ob("active",c)),c)}function U(a){a=k(i(a)?a:yb.dest,yb.start,yb.end);var b={},c=Pb?0:wb/2;if(!tb)for(var d=0,e=Gb.length;e>d;d++){if(a>=yb.end||d===Gb.length-1){b.activePage=Gb.length-1;break}if(a<=Gb[d]+c){b.activePage=d;break}}if(Rb){for(var f=!1,g=!1,h=!1,j=0,l=Ib.length;l>j;j++)if(f===!1&&a<=Ib[j].start+Ib[j].half&&(f=j),h===!1&&a<=Ib[j].center+Ib[j].half&&(h=j),j===l-1||a<=Ib[j].end+Ib[j].half){g=j;break}b.firstItem=i(f)?f:0,b.centerItem=i(h)?h:b.firstItem,b.lastItem=i(g)?g:b.centerItem}return b}function V(b){a.extend(Jb,U(b))}function W(){var a=yb.dest<=yb.start,b=yb.dest>=yb.end,c=(a?1:0)|(b?2:0);if(_b.slideePosState!==c&&(_b.slideePosState=c,Yb.is("button,input")&&Yb.prop("disabled",a),Zb.is("button,input")&&Zb.prop("disabled",b),Yb.add(Vb)[a?"addClass":"removeClass"](rb.disabledClass),Zb.add(Ub)[b?"addClass":"removeClass"](rb.disabledClass)),_b.fwdbwdState!==c&&cc.released&&(_b.fwdbwdState=c,Vb.is("button,input")&&Vb.prop("disabled",a),Ub.is("button,input")&&Ub.prop("disabled",b)),Rb&&null!=Jb.activeItem){var d=0===Jb.activeItem,e=Jb.activeItem>=Ib.length-1,f=(d?1:0)|(e?2:0);_b.itemsButtonState!==f&&(_b.itemsButtonState=f,Wb.is("button,input")&&Wb.prop("disabled",d),Xb.is("button,input")&&Xb.prop("disabled",e),Wb[d?"addClass":"removeClass"](rb.disabledClass),Xb[e?"addClass":"removeClass"](rb.disabledClass))}}function X(a,b,c){if(a=S(a),b=S(b),a>-1&&b>-1&&a!==b&&(!c||b!==a-1)&&(c||b!==a+1)){Hb.eq(a)[c?"insertAfter":"insertBefore"](Ib[b].el);var d=b>a?a:c?b:b-1,e=a>b?a:c?b+1:b,f=a>b;null!=Jb.activeItem&&(a===Jb.activeItem?_b.active=Jb.activeItem=c?f?b+1:b:f?b:b-1:Jb.activeItem>d&&Jb.activeItem<e&&(_b.active=Jb.activeItem+=f?1:-1)),K()}}function Y(a,b){for(var c=0,d=$b[a].length;d>c;c++)if($b[a][c]===b)return c;return-1}function Z(){cc.released&&!sb.isPaused&&sb.resume()}function $(a){return G(k(a,Db.start,Db.end)/Db.end*(yb.end-yb.start))+yb.start}function _(){cc.history[0]=cc.history[1],cc.history[1]=cc.history[2],cc.history[2]=cc.history[3],cc.history[3]=cc.delta}function ab(a){cc.released=0,cc.source=a,cc.slidee="slidee"===a}function bb(b){var c="touchstart"===b.type,d=b.data.source,e="slidee"===d;cc.init||!c&&eb(b.target)||("handle"!==d||rb.dragHandle&&Db.start!==Db.end)&&(!e||(c?rb.touchDragging:rb.mouseDragging&&b.which<2))&&(c||f(b),ab(d),cc.init=0,cc.$source=a(b.target),cc.touch=c,cc.pointer=c?b.originalEvent.touches[0]:b,cc.initX=cc.pointer.pageX,cc.initY=cc.pointer.pageY,cc.initPos=e?yb.cur:Db.cur,cc.start=+new Date,cc.time=0,cc.path=0,cc.delta=0,cc.locked=0,cc.history=[0,0,0,0],cc.pathToLock=e?c?30:10:0,u.on(c?x:w,cb),sb.pause(1),(e?vb:Ab).addClass(rb.draggedClass),ob("moveStart"),e&&(fc=setInterval(_,10)))}function cb(a){if(cc.released="mouseup"===a.type||"touchend"===a.type,cc.pointer=cc.touch?a.originalEvent[cc.released?"changedTouches":"touches"][0]:a,cc.pathX=cc.pointer.pageX-cc.initX,cc.pathY=cc.pointer.pageY-cc.initY,cc.path=E(F(cc.pathX,2)+F(cc.pathY,2)),cc.delta=rb.horizontal?cc.pathX:cc.pathY,cc.released||!(cc.path<1)){if(!cc.init){if(cc.path<rb.dragThreshold)return cc.released?db():c;if(!(rb.horizontal?D(cc.pathX)>D(cc.pathY):D(cc.pathX)<D(cc.pathY)))return db();cc.init=1}f(a),!cc.locked&&cc.path>cc.pathToLock&&cc.slidee&&(cc.locked=1,cc.$source.on(z,g)),cc.released&&(db(),rb.releaseSwing&&cc.slidee&&(cc.swing=(cc.delta-cc.history[0])/40*300,cc.delta+=cc.swing,cc.tweese=D(cc.swing)>10)),L(cc.slidee?G(cc.initPos-cc.delta):$(cc.initPos+cc.delta))}}function db(){clearInterval(fc),cc.released=!0,u.off(cc.touch?x:w,cb),(cc.slidee?vb:Ab).removeClass(rb.draggedClass),setTimeout(function(){cc.$source.off(z,g)}),yb.cur===yb.dest&&cc.init&&ob("moveEnd"),sb.resume(1),cc.init=0}function eb(b){return~a.inArray(b.nodeName,B)||a(b).is(rb.interactive)}function fb(){sb.stop(),u.off("mouseup",fb)}function gb(a){switch(f(a),this){case Ub[0]:case Vb[0]:sb.moveBy(Ub.is(this)?rb.moveBy:-rb.moveBy),u.on("mouseup",fb);break;case Wb[0]:sb.prev();break;case Xb[0]:sb.next();break;case Yb[0]:sb.prevPage();break;case Zb[0]:sb.nextPage()}}function hb(a){return dc.curDelta=(rb.horizontal?a.deltaY||a.deltaX:a.deltaY)||-a.wheelDelta,dc.curDelta/=1===a.deltaMode?3:100,Rb?(o=+new Date,dc.last<o-dc.resetTime&&(dc.delta=0),dc.last=o,dc.delta+=dc.curDelta,D(dc.delta)<1?dc.finalDelta=0:(dc.finalDelta=G(dc.delta/1),dc.delta%=1),dc.finalDelta):dc.curDelta}function ib(a){a.originalEvent[r]=sb;var b=+new Date;if(J+rb.scrollHijack>b&&Sb[0]!==document&&Sb[0]!==window)return void(J=b);if(rb.scrollBy&&yb.start!==yb.end){var c=hb(a.originalEvent);(rb.scrollTrap||c>0&&yb.dest<yb.end||0>c&&yb.dest>yb.start)&&f(a,1),sb.slideBy(rb.scrollBy*c)}}function jb(a){rb.clickBar&&a.target===zb[0]&&(f(a),L($((rb.horizontal?a.pageX-zb.offset().left:a.pageY-zb.offset().top)-Cb/2)))}function kb(a){if(rb.keyboardNavBy)switch(a.which){case rb.horizontal?37:38:f(a),sb["pages"===rb.keyboardNavBy?"prevPage":"prev"]();break;case rb.horizontal?39:40:f(a),sb["pages"===rb.keyboardNavBy?"nextPage":"next"]()}}function lb(a){return eb(this)?void(a.originalEvent[r+"ignore"]=!0):void(this.parentNode!==vb[0]||a.originalEvent[r+"ignore"]||sb.activate(this))}function mb(){this.parentNode===Eb[0]&&sb.activatePage(Fb.index(this))}function nb(a){rb.pauseOnHover&&sb["mouseenter"===a.type?"pause":"resume"](2)}function ob(a,b){if($b[a]){for(qb=$b[a].length,C.length=0,pb=0;qb>pb;pb++)C.push($b[a][pb]);for(pb=0;qb>pb;pb++)C[pb].call(sb,a,b)}}var pb,qb,rb=a.extend({},d.defaults,p),sb=this,tb=i(b),ub=a(b),vb=rb.slidee?a(rb.slidee).eq(0):ub.children().eq(0),wb=0,xb=0,yb={start:0,center:0,end:0,cur:0,dest:0},zb=a(rb.scrollBar).eq(0),Ab=zb.children().eq(0),Bb=0,Cb=0,Db={start:0,end:0,cur:0},Eb=a(rb.pagesBar),Fb=0,Gb=[],Hb=0,Ib=[],Jb={firstItem:0,lastItem:0,centerItem:0,activeItem:null,activePage:0},Kb=new l(ub[0]),Lb=new l(vb[0]),Mb=new l(zb[0]),Nb=new l(Ab[0]),Ob="basic"===rb.itemNav,Pb="forceCentered"===rb.itemNav,Qb="centered"===rb.itemNav||Pb,Rb=!tb&&(Ob||Qb||Pb),Sb=rb.scrollSource?a(rb.scrollSource):ub,Tb=rb.dragSource?a(rb.dragSource):ub,Ub=a(rb.forward),Vb=a(rb.backward),Wb=a(rb.prev),Xb=a(rb.next),Yb=a(rb.prevPage),Zb=a(rb.nextPage),$b={},_b={},ac={},bc={},cc={released:1},dc={last:0,delta:0,resetTime:200},ec=0,fc=0,gc=0,hc=0;tb||(b=ub[0]),sb.initialized=0,sb.frame=b,sb.slidee=vb[0],sb.pos=yb,sb.rel=Jb,sb.items=Ib,sb.pages=Gb,sb.isPaused=0,sb.options=rb,sb.dragging=cc,sb.reload=function(){K()},sb.getPos=function(a){if(Rb){var b=R(a);return-1!==b?Ib[b]:!1}var c=vb.find(a).eq(0);if(c[0]){var d=rb.horizontal?c.offset().left-vb.offset().left:c.offset().top-vb.offset().top,e=c[rb.horizontal?"outerWidth":"outerHeight"]();return{start:d,center:d-wb/2+e/2,end:d-wb+e,size:e}}return!1},sb.moveBy=function(a){bc.speed=a,!cc.init&&bc.speed&&yb.cur!==(bc.speed>0?yb.end:yb.start)&&(bc.lastTime=+new Date,bc.startPos=yb.cur,ab("button"),cc.init=1,ob("moveStart"),s(hc),P())},sb.stop=function(){"button"===cc.source&&(cc.init=0,cc.released=1)},sb.prev=function(){sb.activate(null==Jb.activeItem?0:Jb.activeItem-1)},sb.next=function(){sb.activate(null==Jb.activeItem?0:Jb.activeItem+1)},sb.prevPage=function(){sb.activatePage(Jb.activePage-1)},sb.nextPage=function(){sb.activatePage(Jb.activePage+1)},sb.slideBy=function(a,b){a&&(Rb?sb[Qb?"toCenter":"toStart"](k((Qb?Jb.centerItem:Jb.firstItem)+rb.scrollBy*a,0,Ib.length)):L(yb.dest+a,b))},sb.slideTo=function(a,b){L(a,b)},sb.toStart=function(a,b){Q("start",a,b)},sb.toEnd=function(a,b){Q("end",a,b)},sb.toCenter=function(a,b){Q("center",a,b)},sb.getIndex=R,sb.activate=function(a,b){var c=T(a);rb.smart&&c!==!1&&(Qb?sb.toCenter(c,b):c>=Jb.lastItem?sb.toStart(c,b):c<=Jb.firstItem?sb.toEnd(c,b):Z())},sb.activatePage=function(a,b){i(a)&&L(Gb[k(a,0,Gb.length-1)],b)},sb.resume=function(a){rb.cycleBy&&rb.cycleInterval&&("items"!==rb.cycleBy||Ib[0]&&null!=Jb.activeItem)&&!(a<sb.isPaused)&&(sb.isPaused=0,gc?gc=clearTimeout(gc):ob("resume"),gc=setTimeout(function(){switch(ob("cycle"),rb.cycleBy){case"items":sb.activate(Jb.activeItem>=Ib.length-1?0:Jb.activeItem+1);break;case"pages":sb.activatePage(Jb.activePage>=Gb.length-1?0:Jb.activePage+1)}},rb.cycleInterval))},sb.pause=function(a){a<sb.isPaused||(sb.isPaused=a||100,gc&&(gc=clearTimeout(gc),ob("pause")))},sb.toggle=function(){sb[gc?"pause":"resume"]()},sb.set=function(b,c){a.isPlainObject(b)?a.extend(rb,b):rb.hasOwnProperty(b)&&(rb[b]=c)},sb.add=function(b,c){var d=a(b);Rb?(null==c||!Ib[0]||c>=Ib.length?d.appendTo(vb):Ib.length&&d.insertBefore(Ib[c].el),null!=Jb.activeItem&&c<=Jb.activeItem&&(_b.active=Jb.activeItem+=d.length)):vb.append(d),K()},sb.remove=function(b){if(Rb){var c=S(b);if(c>-1){Hb.eq(c).remove();var d=c===Jb.activeItem;null!=Jb.activeItem&&c<Jb.activeItem&&(_b.active=--Jb.activeItem),K(),d&&(_b.active=null,sb.activate(Jb.activeItem))}}else a(b).remove(),K()},sb.moveAfter=function(a,b){X(a,b,1)},sb.moveBefore=function(a,b){X(a,b)},sb.on=function(a,b){if("object"===e(a))for(var c in a)a.hasOwnProperty(c)&&sb.on(c,a[c]);else if("function"===e(b))for(var d=a.split(" "),f=0,g=d.length;g>f;f++)$b[d[f]]=$b[d[f]]||[],-1===Y(d[f],b)&&$b[d[f]].push(b);else if("array"===e(b))for(var h=0,i=b.length;i>h;h++)sb.on(a,b[h])},sb.one=function(a,b){function c(){b.apply(sb,arguments),sb.off(a,c)}sb.on(a,c)},sb.off=function(a,b){if(b instanceof Array)for(var c=0,d=b.length;d>c;c++)sb.off(a,b[c]);else for(var e=a.split(" "),f=0,g=e.length;g>f;f++)if($b[e[f]]=$b[e[f]]||[],null==b)$b[e[f]].length=0;else{var h=Y(e[f],b);-1!==h&&$b[e[f]].splice(h,1)}},sb.destroy=function(){return Sb.add(Ab).add(zb).add(Eb).add(Ub).add(Vb).add(Wb).add(Xb).add(Yb).add(Zb).off("."+r),u.off("keydown",kb),Wb.add(Xb).add(Yb).add(Zb).removeClass(rb.disabledClass),Hb&&null!=Jb.activeItem&&Hb.eq(Jb.activeItem).removeClass(rb.activeClass),Eb.empty(),tb||(ub.off("."+r),Kb.restore(),Lb.restore(),Mb.restore(),Nb.restore(),a.removeData(b,r)),Ib.length=Gb.length=0,_b={},sb.initialized=0,sb},sb.init=function(){if(!sb.initialized){sb.on(q);var a=["overflow","position"],b=["position","webkitTransform","msTransform","transform","left","top","width","height"];Kb.save.apply(Kb,a),Mb.save.apply(Mb,a),Lb.save.apply(Lb,b),Nb.save.apply(Nb,b);var c=Ab;return tb||(c=c.add(vb),ub.css("overflow","hidden"),m||"static"!==ub.css("position")||ub.css("position","relative")),m?n&&c.css(m,n):("static"===zb.css("position")&&zb.css("position","relative"),c.css({position:"absolute"})),rb.forward&&Ub.on(A,gb),rb.backward&&Vb.on(A,gb),rb.prev&&Wb.on(z,gb),rb.next&&Xb.on(z,gb),rb.prevPage&&Yb.on(z,gb),rb.nextPage&&Zb.on(z,gb),Sb.on(y,ib),zb[0]&&zb.on(z,jb),Rb&&rb.activateOn&&ub.on(rb.activateOn+"."+r,"*",lb),Eb[0]&&rb.activatePageOn&&Eb.on(rb.activatePageOn+"."+r,"*",mb),Tb.on(v,{source:"slidee"},bb),Ab&&Ab.on(v,{source:"handle"},bb),u.on("keydown",kb),tb||(ub.on("mouseenter."+r+" mouseleave."+r,nb),ub.on("scroll."+r,h)),sb.initialized=1,K(!0),rb.cycleBy&&!tb&&sb[rb.startPaused?"pause":"resume"](),sb}}}function e(a){return null==a?String(a):"object"==typeof a||"function"==typeof a?Object.prototype.toString.call(a).match(/\s([a-z]+)/i)[1].toLowerCase()||"object":typeof a}function f(a,b){a.preventDefault(),b&&a.stopPropagation()}function g(b){f(b,1),a(this).off(b.type,g)}function h(){this.scrollLeft=0,this.scrollTop=0}function i(a){return!isNaN(parseFloat(a))&&isFinite(a)}function j(a,b){return 0|G(String(a.css(b)).replace(/[^\-0-9.]/g,""))}function k(a,b,c){return b>a?b:a>c?c:a}function l(a){var b={};return b.style={},b.save=function(){if(a&&a.nodeType){for(var c=0;c<arguments.length;c++)b.style[arguments[c]]=a.style[arguments[c]];return b}},b.restore=function(){if(a&&a.nodeType){for(var c in b.style)b.style.hasOwnProperty(c)&&(a.style[c]=b.style[c]);return b}},b}var m,n,o,p="sly",q="Sly",r=p,s=b.cancelAnimationFrame||b.cancelRequestAnimationFrame,t=b.requestAnimationFrame,u=a(document),v="touchstart."+r+" mousedown."+r,w="mousemove."+r+" mouseup."+r,x="touchmove."+r+" touchend."+r,y=(document.implementation.hasFeature("Event.wheel","3.0")?"wheel.":"mousewheel.")+r,z="click."+r,A="mousedown."+r,B=["INPUT","SELECT","BUTTON","TEXTAREA"],C=[],D=Math.abs,E=Math.sqrt,F=Math.pow,G=Math.round,H=Math.max,I=Math.min,J=0;u.on(y,function(a){var b=a.originalEvent[r],c=+new Date;(!b||b.options.scrollHijack<c-J)&&(J=c)}),function(a){function b(a){var b=(new Date).getTime(),d=Math.max(0,16-(b-c)),e=setTimeout(a,d);return c=b,e}t=a.requestAnimationFrame||a.webkitRequestAnimationFrame||b;var c=(new Date).getTime(),d=a.cancelAnimationFrame||a.webkitCancelAnimationFrame||a.clearTimeout;s=function(b){d.call(a,b)}}(window),function(){function a(a){for(var d=0,e=b.length;e>d;d++){var f=b[d]?b[d]+a.charAt(0).toUpperCase()+a.slice(1):a;if(null!=c.style[f])return f}}var b=["","Webkit","Moz","ms","O"],c=document.createElement("div");m=a("transform"),n=a("perspective")?"translateZ(0) ":""}(),b[q]=d,a.fn[p]=function(b,c){var f,g;return a.isPlainObject(b)||(("string"===e(b)||b===!1)&&(f=b===!1?"destroy":b,g=Array.prototype.slice.call(arguments,1)),b={}),this.each(function(e,h){var i=a.data(h,r);i||f?i&&f&&i[f]&&i[f].apply(i,g):i=a.data(h,r,new d(h,b,c).init())})},d.defaults={slidee:null,horizontal:!1,itemNav:null,itemSelector:null,smart:!1,activateOn:null,activateMiddle:!1,scrollSource:null,scrollBy:0,scrollHijack:300,scrollTrap:!1,dragSource:null,mouseDragging:!1,touchDragging:!1,releaseSwing:!1,swingSpeed:.2,elasticBounds:!1,dragThreshold:3,interactive:null,scrollBar:null,dragHandle:!1,dynamicHandle:!1,minHandleSize:50,clickBar:!1,syncSpeed:.5,pagesBar:null,activatePageOn:null,pageBuilder:function(a){return"<li>"+(a+1)+"</li>"},forward:null,backward:null,prev:null,next:null,prevPage:null,nextPage:null,cycleBy:null,cycleInterval:5e3,pauseOnHover:!1,startPaused:!1,moveBy:300,speed:0,easing:"swing",startAt:null,keyboardNavBy:null,draggedClass:"dragged",activeClass:"active",disabledClass:"disabled"}}(jQuery,window);
/*!
 * VERSION: 1.17.0
 * DATE: 2015-05-27
 * UPDATES AND DOCS AT: http://greensock.com
 * 
 * Includes all of the following: TweenLite, TweenMax, TimelineLite, TimelineMax, EasePack, CSSPlugin, RoundPropsPlugin, BezierPlugin, AttrPlugin, DirectionalRotationPlugin
 *
 * @license Copyright (c) 2008-2015, GreenSock. All rights reserved.
 * This work is subject to the terms at http://greensock.com/standard-license or for
 * Club GreenSock members, the software agreement that was issued with your membership.
 * 
 * @author: Jack Doyle, jack@greensock.com
 **/
var _gsScope="undefined"!=typeof module&&module.exports&&"undefined"!=typeof global?global:this||window;(_gsScope._gsQueue||(_gsScope._gsQueue=[])).push(function(){"use strict";_gsScope._gsDefine("TweenMax",["core.Animation","core.SimpleTimeline","TweenLite"],function(t,e,i){var s=function(t){var e,i=[],s=t.length;for(e=0;e!==s;i.push(t[e++]));return i},r=function(t,e,s){i.call(this,t,e,s),this._cycle=0,this._yoyo=this.vars.yoyo===!0,this._repeat=this.vars.repeat||0,this._repeatDelay=this.vars.repeatDelay||0,this._dirty=!0,this.render=r.prototype.render},n=1e-10,a=i._internals,o=a.isSelector,h=a.isArray,l=r.prototype=i.to({},.1,{}),_=[];r.version="1.17.0",l.constructor=r,l.kill()._gc=!1,r.killTweensOf=r.killDelayedCallsTo=i.killTweensOf,r.getTweensOf=i.getTweensOf,r.lagSmoothing=i.lagSmoothing,r.ticker=i.ticker,r.render=i.render,l.invalidate=function(){return this._yoyo=this.vars.yoyo===!0,this._repeat=this.vars.repeat||0,this._repeatDelay=this.vars.repeatDelay||0,this._uncache(!0),i.prototype.invalidate.call(this)},l.updateTo=function(t,e){var s,r=this.ratio,n=this.vars.immediateRender||t.immediateRender;e&&this._startTime<this._timeline._time&&(this._startTime=this._timeline._time,this._uncache(!1),this._gc?this._enabled(!0,!1):this._timeline.insert(this,this._startTime-this._delay));for(s in t)this.vars[s]=t[s];if(this._initted||n)if(e)this._initted=!1,n&&this.render(0,!0,!0);else if(this._gc&&this._enabled(!0,!1),this._notifyPluginsOfEnabled&&this._firstPT&&i._onPluginEvent("_onDisable",this),this._time/this._duration>.998){var a=this._time;this.render(0,!0,!1),this._initted=!1,this.render(a,!0,!1)}else if(this._time>0||n){this._initted=!1,this._init();for(var o,h=1/(1-r),l=this._firstPT;l;)o=l.s+l.c,l.c*=h,l.s=o-l.c,l=l._next}return this},l.render=function(t,e,i){this._initted||0===this._duration&&this.vars.repeat&&this.invalidate();var s,r,o,h,l,_,u,c,f=this._dirty?this.totalDuration():this._totalDuration,p=this._time,m=this._totalTime,d=this._cycle,g=this._duration,v=this._rawPrevTime;if(t>=f?(this._totalTime=f,this._cycle=this._repeat,this._yoyo&&0!==(1&this._cycle)?(this._time=0,this.ratio=this._ease._calcEnd?this._ease.getRatio(0):0):(this._time=g,this.ratio=this._ease._calcEnd?this._ease.getRatio(1):1),this._reversed||(s=!0,r="onComplete",i=i||this._timeline.autoRemoveChildren),0===g&&(this._initted||!this.vars.lazy||i)&&(this._startTime===this._timeline._duration&&(t=0),(0===t||0>v||v===n)&&v!==t&&(i=!0,v>n&&(r="onReverseComplete")),this._rawPrevTime=c=!e||t||v===t?t:n)):1e-7>t?(this._totalTime=this._time=this._cycle=0,this.ratio=this._ease._calcEnd?this._ease.getRatio(0):0,(0!==m||0===g&&v>0)&&(r="onReverseComplete",s=this._reversed),0>t&&(this._active=!1,0===g&&(this._initted||!this.vars.lazy||i)&&(v>=0&&(i=!0),this._rawPrevTime=c=!e||t||v===t?t:n)),this._initted||(i=!0)):(this._totalTime=this._time=t,0!==this._repeat&&(h=g+this._repeatDelay,this._cycle=this._totalTime/h>>0,0!==this._cycle&&this._cycle===this._totalTime/h&&this._cycle--,this._time=this._totalTime-this._cycle*h,this._yoyo&&0!==(1&this._cycle)&&(this._time=g-this._time),this._time>g?this._time=g:0>this._time&&(this._time=0)),this._easeType?(l=this._time/g,_=this._easeType,u=this._easePower,(1===_||3===_&&l>=.5)&&(l=1-l),3===_&&(l*=2),1===u?l*=l:2===u?l*=l*l:3===u?l*=l*l*l:4===u&&(l*=l*l*l*l),this.ratio=1===_?1-l:2===_?l:.5>this._time/g?l/2:1-l/2):this.ratio=this._ease.getRatio(this._time/g)),p===this._time&&!i&&d===this._cycle)return m!==this._totalTime&&this._onUpdate&&(e||this._callback("onUpdate")),void 0;if(!this._initted){if(this._init(),!this._initted||this._gc)return;if(!i&&this._firstPT&&(this.vars.lazy!==!1&&this._duration||this.vars.lazy&&!this._duration))return this._time=p,this._totalTime=m,this._rawPrevTime=v,this._cycle=d,a.lazyTweens.push(this),this._lazy=[t,e],void 0;this._time&&!s?this.ratio=this._ease.getRatio(this._time/g):s&&this._ease._calcEnd&&(this.ratio=this._ease.getRatio(0===this._time?0:1))}for(this._lazy!==!1&&(this._lazy=!1),this._active||!this._paused&&this._time!==p&&t>=0&&(this._active=!0),0===m&&(2===this._initted&&t>0&&this._init(),this._startAt&&(t>=0?this._startAt.render(t,e,i):r||(r="_dummyGS")),this.vars.onStart&&(0!==this._totalTime||0===g)&&(e||this._callback("onStart"))),o=this._firstPT;o;)o.f?o.t[o.p](o.c*this.ratio+o.s):o.t[o.p]=o.c*this.ratio+o.s,o=o._next;this._onUpdate&&(0>t&&this._startAt&&this._startTime&&this._startAt.render(t,e,i),e||(this._totalTime!==m||s)&&this._callback("onUpdate")),this._cycle!==d&&(e||this._gc||this.vars.onRepeat&&this._callback("onRepeat")),r&&(!this._gc||i)&&(0>t&&this._startAt&&!this._onUpdate&&this._startTime&&this._startAt.render(t,e,i),s&&(this._timeline.autoRemoveChildren&&this._enabled(!1,!1),this._active=!1),!e&&this.vars[r]&&this._callback(r),0===g&&this._rawPrevTime===n&&c!==n&&(this._rawPrevTime=0))},r.to=function(t,e,i){return new r(t,e,i)},r.from=function(t,e,i){return i.runBackwards=!0,i.immediateRender=0!=i.immediateRender,new r(t,e,i)},r.fromTo=function(t,e,i,s){return s.startAt=i,s.immediateRender=0!=s.immediateRender&&0!=i.immediateRender,new r(t,e,s)},r.staggerTo=r.allTo=function(t,e,n,a,l,u,c){a=a||0;var f,p,m,d,g=n.delay||0,v=[],y=function(){n.onComplete&&n.onComplete.apply(n.onCompleteScope||this,arguments),l.apply(c||n.callbackScope||this,u||_)};for(h(t)||("string"==typeof t&&(t=i.selector(t)||t),o(t)&&(t=s(t))),t=t||[],0>a&&(t=s(t),t.reverse(),a*=-1),f=t.length-1,m=0;f>=m;m++){p={};for(d in n)p[d]=n[d];p.delay=g,m===f&&l&&(p.onComplete=y),v[m]=new r(t[m],e,p),g+=a}return v},r.staggerFrom=r.allFrom=function(t,e,i,s,n,a,o){return i.runBackwards=!0,i.immediateRender=0!=i.immediateRender,r.staggerTo(t,e,i,s,n,a,o)},r.staggerFromTo=r.allFromTo=function(t,e,i,s,n,a,o,h){return s.startAt=i,s.immediateRender=0!=s.immediateRender&&0!=i.immediateRender,r.staggerTo(t,e,s,n,a,o,h)},r.delayedCall=function(t,e,i,s,n){return new r(e,0,{delay:t,onComplete:e,onCompleteParams:i,callbackScope:s,onReverseComplete:e,onReverseCompleteParams:i,immediateRender:!1,useFrames:n,overwrite:0})},r.set=function(t,e){return new r(t,0,e)},r.isTweening=function(t){return i.getTweensOf(t,!0).length>0};var u=function(t,e){for(var s=[],r=0,n=t._first;n;)n instanceof i?s[r++]=n:(e&&(s[r++]=n),s=s.concat(u(n,e)),r=s.length),n=n._next;return s},c=r.getAllTweens=function(e){return u(t._rootTimeline,e).concat(u(t._rootFramesTimeline,e))};r.killAll=function(t,i,s,r){null==i&&(i=!0),null==s&&(s=!0);var n,a,o,h=c(0!=r),l=h.length,_=i&&s&&r;for(o=0;l>o;o++)a=h[o],(_||a instanceof e||(n=a.target===a.vars.onComplete)&&s||i&&!n)&&(t?a.totalTime(a._reversed?0:a.totalDuration()):a._enabled(!1,!1))},r.killChildTweensOf=function(t,e){if(null!=t){var n,l,_,u,c,f=a.tweenLookup;if("string"==typeof t&&(t=i.selector(t)||t),o(t)&&(t=s(t)),h(t))for(u=t.length;--u>-1;)r.killChildTweensOf(t[u],e);else{n=[];for(_ in f)for(l=f[_].target.parentNode;l;)l===t&&(n=n.concat(f[_].tweens)),l=l.parentNode;for(c=n.length,u=0;c>u;u++)e&&n[u].totalTime(n[u].totalDuration()),n[u]._enabled(!1,!1)}}};var f=function(t,i,s,r){i=i!==!1,s=s!==!1,r=r!==!1;for(var n,a,o=c(r),h=i&&s&&r,l=o.length;--l>-1;)a=o[l],(h||a instanceof e||(n=a.target===a.vars.onComplete)&&s||i&&!n)&&a.paused(t)};return r.pauseAll=function(t,e,i){f(!0,t,e,i)},r.resumeAll=function(t,e,i){f(!1,t,e,i)},r.globalTimeScale=function(e){var s=t._rootTimeline,r=i.ticker.time;return arguments.length?(e=e||n,s._startTime=r-(r-s._startTime)*s._timeScale/e,s=t._rootFramesTimeline,r=i.ticker.frame,s._startTime=r-(r-s._startTime)*s._timeScale/e,s._timeScale=t._rootTimeline._timeScale=e,e):s._timeScale},l.progress=function(t){return arguments.length?this.totalTime(this.duration()*(this._yoyo&&0!==(1&this._cycle)?1-t:t)+this._cycle*(this._duration+this._repeatDelay),!1):this._time/this.duration()},l.totalProgress=function(t){return arguments.length?this.totalTime(this.totalDuration()*t,!1):this._totalTime/this.totalDuration()},l.time=function(t,e){return arguments.length?(this._dirty&&this.totalDuration(),t>this._duration&&(t=this._duration),this._yoyo&&0!==(1&this._cycle)?t=this._duration-t+this._cycle*(this._duration+this._repeatDelay):0!==this._repeat&&(t+=this._cycle*(this._duration+this._repeatDelay)),this.totalTime(t,e)):this._time},l.duration=function(e){return arguments.length?t.prototype.duration.call(this,e):this._duration},l.totalDuration=function(t){return arguments.length?-1===this._repeat?this:this.duration((t-this._repeat*this._repeatDelay)/(this._repeat+1)):(this._dirty&&(this._totalDuration=-1===this._repeat?999999999999:this._duration*(this._repeat+1)+this._repeatDelay*this._repeat,this._dirty=!1),this._totalDuration)},l.repeat=function(t){return arguments.length?(this._repeat=t,this._uncache(!0)):this._repeat},l.repeatDelay=function(t){return arguments.length?(this._repeatDelay=t,this._uncache(!0)):this._repeatDelay},l.yoyo=function(t){return arguments.length?(this._yoyo=t,this):this._yoyo},r},!0),_gsScope._gsDefine("TimelineLite",["core.Animation","core.SimpleTimeline","TweenLite"],function(t,e,i){var s=function(t){e.call(this,t),this._labels={},this.autoRemoveChildren=this.vars.autoRemoveChildren===!0,this.smoothChildTiming=this.vars.smoothChildTiming===!0,this._sortChildren=!0,this._onUpdate=this.vars.onUpdate;var i,s,r=this.vars;for(s in r)i=r[s],h(i)&&-1!==i.join("").indexOf("{self}")&&(r[s]=this._swapSelfInParams(i));h(r.tweens)&&this.add(r.tweens,0,r.align,r.stagger)},r=1e-10,n=i._internals,a=s._internals={},o=n.isSelector,h=n.isArray,l=n.lazyTweens,_=n.lazyRender,u=[],c=_gsScope._gsDefine.globals,f=function(t){var e,i={};for(e in t)i[e]=t[e];return i},p=a.pauseCallback=function(t,e,i,s){var n,a=t._timeline,o=a._totalTime,h=t._startTime,l=0>t._rawPrevTime||0===t._rawPrevTime&&a._reversed,_=l?0:r,c=l?r:0;if(e||!this._forcingPlayhead){for(a.pause(h),n=t._prev;n&&n._startTime===h;)n._rawPrevTime=c,n=n._prev;for(n=t._next;n&&n._startTime===h;)n._rawPrevTime=_,n=n._next;e&&e.apply(s||a.vars.callbackScope||a,i||u),(this._forcingPlayhead||!a._paused)&&a.seek(o)}},m=function(t){var e,i=[],s=t.length;for(e=0;e!==s;i.push(t[e++]));return i},d=s.prototype=new e;return s.version="1.17.0",d.constructor=s,d.kill()._gc=d._forcingPlayhead=!1,d.to=function(t,e,s,r){var n=s.repeat&&c.TweenMax||i;return e?this.add(new n(t,e,s),r):this.set(t,s,r)},d.from=function(t,e,s,r){return this.add((s.repeat&&c.TweenMax||i).from(t,e,s),r)},d.fromTo=function(t,e,s,r,n){var a=r.repeat&&c.TweenMax||i;return e?this.add(a.fromTo(t,e,s,r),n):this.set(t,r,n)},d.staggerTo=function(t,e,r,n,a,h,l,_){var u,c=new s({onComplete:h,onCompleteParams:l,callbackScope:_,smoothChildTiming:this.smoothChildTiming});for("string"==typeof t&&(t=i.selector(t)||t),t=t||[],o(t)&&(t=m(t)),n=n||0,0>n&&(t=m(t),t.reverse(),n*=-1),u=0;t.length>u;u++)r.startAt&&(r.startAt=f(r.startAt)),c.to(t[u],e,f(r),u*n);return this.add(c,a)},d.staggerFrom=function(t,e,i,s,r,n,a,o){return i.immediateRender=0!=i.immediateRender,i.runBackwards=!0,this.staggerTo(t,e,i,s,r,n,a,o)},d.staggerFromTo=function(t,e,i,s,r,n,a,o,h){return s.startAt=i,s.immediateRender=0!=s.immediateRender&&0!=i.immediateRender,this.staggerTo(t,e,s,r,n,a,o,h)},d.call=function(t,e,s,r){return this.add(i.delayedCall(0,t,e,s),r)},d.set=function(t,e,s){return s=this._parseTimeOrLabel(s,0,!0),null==e.immediateRender&&(e.immediateRender=s===this._time&&!this._paused),this.add(new i(t,0,e),s)},s.exportRoot=function(t,e){t=t||{},null==t.smoothChildTiming&&(t.smoothChildTiming=!0);var r,n,a=new s(t),o=a._timeline;for(null==e&&(e=!0),o._remove(a,!0),a._startTime=0,a._rawPrevTime=a._time=a._totalTime=o._time,r=o._first;r;)n=r._next,e&&r instanceof i&&r.target===r.vars.onComplete||a.add(r,r._startTime-r._delay),r=n;return o.add(a,0),a},d.add=function(r,n,a,o){var l,_,u,c,f,p;if("number"!=typeof n&&(n=this._parseTimeOrLabel(n,0,!0,r)),!(r instanceof t)){if(r instanceof Array||r&&r.push&&h(r)){for(a=a||"normal",o=o||0,l=n,_=r.length,u=0;_>u;u++)h(c=r[u])&&(c=new s({tweens:c})),this.add(c,l),"string"!=typeof c&&"function"!=typeof c&&("sequence"===a?l=c._startTime+c.totalDuration()/c._timeScale:"start"===a&&(c._startTime-=c.delay())),l+=o;return this._uncache(!0)}if("string"==typeof r)return this.addLabel(r,n);if("function"!=typeof r)throw"Cannot add "+r+" into the timeline; it is not a tween, timeline, function, or string.";r=i.delayedCall(0,r)}if(e.prototype.add.call(this,r,n),(this._gc||this._time===this._duration)&&!this._paused&&this._duration<this.duration())for(f=this,p=f.rawTime()>r._startTime;f._timeline;)p&&f._timeline.smoothChildTiming?f.totalTime(f._totalTime,!0):f._gc&&f._enabled(!0,!1),f=f._timeline;return this},d.remove=function(e){if(e instanceof t)return this._remove(e,!1);if(e instanceof Array||e&&e.push&&h(e)){for(var i=e.length;--i>-1;)this.remove(e[i]);return this}return"string"==typeof e?this.removeLabel(e):this.kill(null,e)},d._remove=function(t,i){e.prototype._remove.call(this,t,i);var s=this._last;return s?this._time>s._startTime+s._totalDuration/s._timeScale&&(this._time=this.duration(),this._totalTime=this._totalDuration):this._time=this._totalTime=this._duration=this._totalDuration=0,this},d.append=function(t,e){return this.add(t,this._parseTimeOrLabel(null,e,!0,t))},d.insert=d.insertMultiple=function(t,e,i,s){return this.add(t,e||0,i,s)},d.appendMultiple=function(t,e,i,s){return this.add(t,this._parseTimeOrLabel(null,e,!0,t),i,s)},d.addLabel=function(t,e){return this._labels[t]=this._parseTimeOrLabel(e),this},d.addPause=function(t,e,s,r){var n=i.delayedCall(0,p,["{self}",e,s,r],this);return n.data="isPause",this.add(n,t)},d.removeLabel=function(t){return delete this._labels[t],this},d.getLabelTime=function(t){return null!=this._labels[t]?this._labels[t]:-1},d._parseTimeOrLabel=function(e,i,s,r){var n;if(r instanceof t&&r.timeline===this)this.remove(r);else if(r&&(r instanceof Array||r.push&&h(r)))for(n=r.length;--n>-1;)r[n]instanceof t&&r[n].timeline===this&&this.remove(r[n]);if("string"==typeof i)return this._parseTimeOrLabel(i,s&&"number"==typeof e&&null==this._labels[i]?e-this.duration():0,s);if(i=i||0,"string"!=typeof e||!isNaN(e)&&null==this._labels[e])null==e&&(e=this.duration());else{if(n=e.indexOf("="),-1===n)return null==this._labels[e]?s?this._labels[e]=this.duration()+i:i:this._labels[e]+i;i=parseInt(e.charAt(n-1)+"1",10)*Number(e.substr(n+1)),e=n>1?this._parseTimeOrLabel(e.substr(0,n-1),0,s):this.duration()}return Number(e)+i},d.seek=function(t,e){return this.totalTime("number"==typeof t?t:this._parseTimeOrLabel(t),e!==!1)},d.stop=function(){return this.paused(!0)},d.gotoAndPlay=function(t,e){return this.play(t,e)},d.gotoAndStop=function(t,e){return this.pause(t,e)},d.render=function(t,e,i){this._gc&&this._enabled(!0,!1);var s,n,a,o,h,u=this._dirty?this.totalDuration():this._totalDuration,c=this._time,f=this._startTime,p=this._timeScale,m=this._paused;if(t>=u)this._totalTime=this._time=u,this._reversed||this._hasPausedChild()||(n=!0,o="onComplete",h=!!this._timeline.autoRemoveChildren,0===this._duration&&(0===t||0>this._rawPrevTime||this._rawPrevTime===r)&&this._rawPrevTime!==t&&this._first&&(h=!0,this._rawPrevTime>r&&(o="onReverseComplete"))),this._rawPrevTime=this._duration||!e||t||this._rawPrevTime===t?t:r,t=u+1e-4;else if(1e-7>t)if(this._totalTime=this._time=0,(0!==c||0===this._duration&&this._rawPrevTime!==r&&(this._rawPrevTime>0||0>t&&this._rawPrevTime>=0))&&(o="onReverseComplete",n=this._reversed),0>t)this._active=!1,this._timeline.autoRemoveChildren&&this._reversed?(h=n=!0,o="onReverseComplete"):this._rawPrevTime>=0&&this._first&&(h=!0),this._rawPrevTime=t;else{if(this._rawPrevTime=this._duration||!e||t||this._rawPrevTime===t?t:r,0===t&&n)for(s=this._first;s&&0===s._startTime;)s._duration||(n=!1),s=s._next;t=0,this._initted||(h=!0)}else this._totalTime=this._time=this._rawPrevTime=t;if(this._time!==c&&this._first||i||h){if(this._initted||(this._initted=!0),this._active||!this._paused&&this._time!==c&&t>0&&(this._active=!0),0===c&&this.vars.onStart&&0!==this._time&&(e||this._callback("onStart")),this._time>=c)for(s=this._first;s&&(a=s._next,!this._paused||m);)(s._active||s._startTime<=this._time&&!s._paused&&!s._gc)&&(s._reversed?s.render((s._dirty?s.totalDuration():s._totalDuration)-(t-s._startTime)*s._timeScale,e,i):s.render((t-s._startTime)*s._timeScale,e,i)),s=a;else for(s=this._last;s&&(a=s._prev,!this._paused||m);)(s._active||c>=s._startTime&&!s._paused&&!s._gc)&&(s._reversed?s.render((s._dirty?s.totalDuration():s._totalDuration)-(t-s._startTime)*s._timeScale,e,i):s.render((t-s._startTime)*s._timeScale,e,i)),s=a;this._onUpdate&&(e||(l.length&&_(),this._callback("onUpdate"))),o&&(this._gc||(f===this._startTime||p!==this._timeScale)&&(0===this._time||u>=this.totalDuration())&&(n&&(l.length&&_(),this._timeline.autoRemoveChildren&&this._enabled(!1,!1),this._active=!1),!e&&this.vars[o]&&this._callback(o)))}},d._hasPausedChild=function(){for(var t=this._first;t;){if(t._paused||t instanceof s&&t._hasPausedChild())return!0;t=t._next}return!1},d.getChildren=function(t,e,s,r){r=r||-9999999999;for(var n=[],a=this._first,o=0;a;)r>a._startTime||(a instanceof i?e!==!1&&(n[o++]=a):(s!==!1&&(n[o++]=a),t!==!1&&(n=n.concat(a.getChildren(!0,e,s)),o=n.length))),a=a._next;return n},d.getTweensOf=function(t,e){var s,r,n=this._gc,a=[],o=0;for(n&&this._enabled(!0,!0),s=i.getTweensOf(t),r=s.length;--r>-1;)(s[r].timeline===this||e&&this._contains(s[r]))&&(a[o++]=s[r]);return n&&this._enabled(!1,!0),a},d.recent=function(){return this._recent},d._contains=function(t){for(var e=t.timeline;e;){if(e===this)return!0;e=e.timeline}return!1},d.shiftChildren=function(t,e,i){i=i||0;for(var s,r=this._first,n=this._labels;r;)r._startTime>=i&&(r._startTime+=t),r=r._next;if(e)for(s in n)n[s]>=i&&(n[s]+=t);return this._uncache(!0)},d._kill=function(t,e){if(!t&&!e)return this._enabled(!1,!1);for(var i=e?this.getTweensOf(e):this.getChildren(!0,!0,!1),s=i.length,r=!1;--s>-1;)i[s]._kill(t,e)&&(r=!0);return r},d.clear=function(t){var e=this.getChildren(!1,!0,!0),i=e.length;for(this._time=this._totalTime=0;--i>-1;)e[i]._enabled(!1,!1);return t!==!1&&(this._labels={}),this._uncache(!0)},d.invalidate=function(){for(var e=this._first;e;)e.invalidate(),e=e._next;return t.prototype.invalidate.call(this)},d._enabled=function(t,i){if(t===this._gc)for(var s=this._first;s;)s._enabled(t,!0),s=s._next;return e.prototype._enabled.call(this,t,i)},d.totalTime=function(){this._forcingPlayhead=!0;var e=t.prototype.totalTime.apply(this,arguments);return this._forcingPlayhead=!1,e},d.duration=function(t){return arguments.length?(0!==this.duration()&&0!==t&&this.timeScale(this._duration/t),this):(this._dirty&&this.totalDuration(),this._duration)},d.totalDuration=function(t){if(!arguments.length){if(this._dirty){for(var e,i,s=0,r=this._last,n=999999999999;r;)e=r._prev,r._dirty&&r.totalDuration(),r._startTime>n&&this._sortChildren&&!r._paused?this.add(r,r._startTime-r._delay):n=r._startTime,0>r._startTime&&!r._paused&&(s-=r._startTime,this._timeline.smoothChildTiming&&(this._startTime+=r._startTime/this._timeScale),this.shiftChildren(-r._startTime,!1,-9999999999),n=0),i=r._startTime+r._totalDuration/r._timeScale,i>s&&(s=i),r=e;this._duration=this._totalDuration=s,this._dirty=!1}return this._totalDuration}return 0!==this.totalDuration()&&0!==t&&this.timeScale(this._totalDuration/t),this},d.paused=function(e){if(!e)for(var i=this._first,s=this._time;i;)i._startTime===s&&"isPause"===i.data&&(i._rawPrevTime=0),i=i._next;return t.prototype.paused.apply(this,arguments)},d.usesFrames=function(){for(var e=this._timeline;e._timeline;)e=e._timeline;return e===t._rootFramesTimeline},d.rawTime=function(){return this._paused?this._totalTime:(this._timeline.rawTime()-this._startTime)*this._timeScale},s},!0),_gsScope._gsDefine("TimelineMax",["TimelineLite","TweenLite","easing.Ease"],function(t,e,i){var s=function(e){t.call(this,e),this._repeat=this.vars.repeat||0,this._repeatDelay=this.vars.repeatDelay||0,this._cycle=0,this._yoyo=this.vars.yoyo===!0,this._dirty=!0},r=1e-10,n=e._internals,a=n.lazyTweens,o=n.lazyRender,h=new i(null,null,1,0),l=s.prototype=new t;return l.constructor=s,l.kill()._gc=!1,s.version="1.17.0",l.invalidate=function(){return this._yoyo=this.vars.yoyo===!0,this._repeat=this.vars.repeat||0,this._repeatDelay=this.vars.repeatDelay||0,this._uncache(!0),t.prototype.invalidate.call(this)},l.addCallback=function(t,i,s,r){return this.add(e.delayedCall(0,t,s,r),i)},l.removeCallback=function(t,e){if(t)if(null==e)this._kill(null,t);else for(var i=this.getTweensOf(t,!1),s=i.length,r=this._parseTimeOrLabel(e);--s>-1;)i[s]._startTime===r&&i[s]._enabled(!1,!1);return this},l.removePause=function(e){return this.removeCallback(t._internals.pauseCallback,e)},l.tweenTo=function(t,i){i=i||{};var s,r,n,a={ease:h,useFrames:this.usesFrames(),immediateRender:!1};for(r in i)a[r]=i[r];return a.time=this._parseTimeOrLabel(t),s=Math.abs(Number(a.time)-this._time)/this._timeScale||.001,n=new e(this,s,a),a.onStart=function(){n.target.paused(!0),n.vars.time!==n.target.time()&&s===n.duration()&&n.duration(Math.abs(n.vars.time-n.target.time())/n.target._timeScale),i.onStart&&n._callback("onStart")},n},l.tweenFromTo=function(t,e,i){i=i||{},t=this._parseTimeOrLabel(t),i.startAt={onComplete:this.seek,onCompleteParams:[t],callbackScope:this},i.immediateRender=i.immediateRender!==!1;var s=this.tweenTo(e,i);return s.duration(Math.abs(s.vars.time-t)/this._timeScale||.001)},l.render=function(t,e,i){this._gc&&this._enabled(!0,!1);var s,n,h,l,_,u,c=this._dirty?this.totalDuration():this._totalDuration,f=this._duration,p=this._time,m=this._totalTime,d=this._startTime,g=this._timeScale,v=this._rawPrevTime,y=this._paused,T=this._cycle;if(t>=c)this._locked||(this._totalTime=c,this._cycle=this._repeat),this._reversed||this._hasPausedChild()||(n=!0,l="onComplete",_=!!this._timeline.autoRemoveChildren,0===this._duration&&(0===t||0>v||v===r)&&v!==t&&this._first&&(_=!0,v>r&&(l="onReverseComplete"))),this._rawPrevTime=this._duration||!e||t||this._rawPrevTime===t?t:r,this._yoyo&&0!==(1&this._cycle)?this._time=t=0:(this._time=f,t=f+1e-4);else if(1e-7>t)if(this._locked||(this._totalTime=this._cycle=0),this._time=0,(0!==p||0===f&&v!==r&&(v>0||0>t&&v>=0)&&!this._locked)&&(l="onReverseComplete",n=this._reversed),0>t)this._active=!1,this._timeline.autoRemoveChildren&&this._reversed?(_=n=!0,l="onReverseComplete"):v>=0&&this._first&&(_=!0),this._rawPrevTime=t;else{if(this._rawPrevTime=f||!e||t||this._rawPrevTime===t?t:r,0===t&&n)for(s=this._first;s&&0===s._startTime;)s._duration||(n=!1),s=s._next;t=0,this._initted||(_=!0)}else 0===f&&0>v&&(_=!0),this._time=this._rawPrevTime=t,this._locked||(this._totalTime=t,0!==this._repeat&&(u=f+this._repeatDelay,this._cycle=this._totalTime/u>>0,0!==this._cycle&&this._cycle===this._totalTime/u&&this._cycle--,this._time=this._totalTime-this._cycle*u,this._yoyo&&0!==(1&this._cycle)&&(this._time=f-this._time),this._time>f?(this._time=f,t=f+1e-4):0>this._time?this._time=t=0:t=this._time));if(this._cycle!==T&&!this._locked){var x=this._yoyo&&0!==(1&T),w=x===(this._yoyo&&0!==(1&this._cycle)),b=this._totalTime,P=this._cycle,k=this._rawPrevTime,S=this._time;if(this._totalTime=T*f,T>this._cycle?x=!x:this._totalTime+=f,this._time=p,this._rawPrevTime=0===f?v-1e-4:v,this._cycle=T,this._locked=!0,p=x?0:f,this.render(p,e,0===f),e||this._gc||this.vars.onRepeat&&this._callback("onRepeat"),w&&(p=x?f+1e-4:-1e-4,this.render(p,!0,!1)),this._locked=!1,this._paused&&!y)return;this._time=S,this._totalTime=b,this._cycle=P,this._rawPrevTime=k}if(!(this._time!==p&&this._first||i||_))return m!==this._totalTime&&this._onUpdate&&(e||this._callback("onUpdate")),void 0;if(this._initted||(this._initted=!0),this._active||!this._paused&&this._totalTime!==m&&t>0&&(this._active=!0),0===m&&this.vars.onStart&&0!==this._totalTime&&(e||this._callback("onStart")),this._time>=p)for(s=this._first;s&&(h=s._next,!this._paused||y);)(s._active||s._startTime<=this._time&&!s._paused&&!s._gc)&&(s._reversed?s.render((s._dirty?s.totalDuration():s._totalDuration)-(t-s._startTime)*s._timeScale,e,i):s.render((t-s._startTime)*s._timeScale,e,i)),s=h;else for(s=this._last;s&&(h=s._prev,!this._paused||y);)(s._active||p>=s._startTime&&!s._paused&&!s._gc)&&(s._reversed?s.render((s._dirty?s.totalDuration():s._totalDuration)-(t-s._startTime)*s._timeScale,e,i):s.render((t-s._startTime)*s._timeScale,e,i)),s=h;this._onUpdate&&(e||(a.length&&o(),this._callback("onUpdate"))),l&&(this._locked||this._gc||(d===this._startTime||g!==this._timeScale)&&(0===this._time||c>=this.totalDuration())&&(n&&(a.length&&o(),this._timeline.autoRemoveChildren&&this._enabled(!1,!1),this._active=!1),!e&&this.vars[l]&&this._callback(l)))},l.getActive=function(t,e,i){null==t&&(t=!0),null==e&&(e=!0),null==i&&(i=!1);var s,r,n=[],a=this.getChildren(t,e,i),o=0,h=a.length;for(s=0;h>s;s++)r=a[s],r.isActive()&&(n[o++]=r);return n},l.getLabelAfter=function(t){t||0!==t&&(t=this._time);var e,i=this.getLabelsArray(),s=i.length;for(e=0;s>e;e++)if(i[e].time>t)return i[e].name;return null},l.getLabelBefore=function(t){null==t&&(t=this._time);for(var e=this.getLabelsArray(),i=e.length;--i>-1;)if(t>e[i].time)return e[i].name;return null},l.getLabelsArray=function(){var t,e=[],i=0;for(t in this._labels)e[i++]={time:this._labels[t],name:t};return e.sort(function(t,e){return t.time-e.time}),e},l.progress=function(t,e){return arguments.length?this.totalTime(this.duration()*(this._yoyo&&0!==(1&this._cycle)?1-t:t)+this._cycle*(this._duration+this._repeatDelay),e):this._time/this.duration()},l.totalProgress=function(t,e){return arguments.length?this.totalTime(this.totalDuration()*t,e):this._totalTime/this.totalDuration()},l.totalDuration=function(e){return arguments.length?-1===this._repeat?this:this.duration((e-this._repeat*this._repeatDelay)/(this._repeat+1)):(this._dirty&&(t.prototype.totalDuration.call(this),this._totalDuration=-1===this._repeat?999999999999:this._duration*(this._repeat+1)+this._repeatDelay*this._repeat),this._totalDuration)},l.time=function(t,e){return arguments.length?(this._dirty&&this.totalDuration(),t>this._duration&&(t=this._duration),this._yoyo&&0!==(1&this._cycle)?t=this._duration-t+this._cycle*(this._duration+this._repeatDelay):0!==this._repeat&&(t+=this._cycle*(this._duration+this._repeatDelay)),this.totalTime(t,e)):this._time},l.repeat=function(t){return arguments.length?(this._repeat=t,this._uncache(!0)):this._repeat},l.repeatDelay=function(t){return arguments.length?(this._repeatDelay=t,this._uncache(!0)):this._repeatDelay},l.yoyo=function(t){return arguments.length?(this._yoyo=t,this):this._yoyo},l.currentLabel=function(t){return arguments.length?this.seek(t,!0):this.getLabelBefore(this._time+1e-8)},s},!0),function(){var t=180/Math.PI,e=[],i=[],s=[],r={},n=_gsScope._gsDefine.globals,a=function(t,e,i,s){this.a=t,this.b=e,this.c=i,this.d=s,this.da=s-t,this.ca=i-t,this.ba=e-t},o=",x,y,z,left,top,right,bottom,marginTop,marginLeft,marginRight,marginBottom,paddingLeft,paddingTop,paddingRight,paddingBottom,backgroundPosition,backgroundPosition_y,",h=function(t,e,i,s){var r={a:t},n={},a={},o={c:s},h=(t+e)/2,l=(e+i)/2,_=(i+s)/2,u=(h+l)/2,c=(l+_)/2,f=(c-u)/8;return r.b=h+(t-h)/4,n.b=u+f,r.c=n.a=(r.b+n.b)/2,n.c=a.a=(u+c)/2,a.b=c-f,o.b=_+(s-_)/4,a.c=o.a=(a.b+o.b)/2,[r,n,a,o]},l=function(t,r,n,a,o){var l,_,u,c,f,p,m,d,g,v,y,T,x,w=t.length-1,b=0,P=t[0].a;for(l=0;w>l;l++)f=t[b],_=f.a,u=f.d,c=t[b+1].d,o?(y=e[l],T=i[l],x=.25*(T+y)*r/(a?.5:s[l]||.5),p=u-(u-_)*(a?.5*r:0!==y?x/y:0),m=u+(c-u)*(a?.5*r:0!==T?x/T:0),d=u-(p+((m-p)*(3*y/(y+T)+.5)/4||0))):(p=u-.5*(u-_)*r,m=u+.5*(c-u)*r,d=u-(p+m)/2),p+=d,m+=d,f.c=g=p,f.b=0!==l?P:P=f.a+.6*(f.c-f.a),f.da=u-_,f.ca=g-_,f.ba=P-_,n?(v=h(_,P,g,u),t.splice(b,1,v[0],v[1],v[2],v[3]),b+=4):b++,P=m;f=t[b],f.b=P,f.c=P+.4*(f.d-P),f.da=f.d-f.a,f.ca=f.c-f.a,f.ba=P-f.a,n&&(v=h(f.a,P,f.c,f.d),t.splice(b,1,v[0],v[1],v[2],v[3]))},_=function(t,s,r,n){var o,h,l,_,u,c,f=[];if(n)for(t=[n].concat(t),h=t.length;--h>-1;)"string"==typeof(c=t[h][s])&&"="===c.charAt(1)&&(t[h][s]=n[s]+Number(c.charAt(0)+c.substr(2)));if(o=t.length-2,0>o)return f[0]=new a(t[0][s],0,0,t[-1>o?0:1][s]),f;for(h=0;o>h;h++)l=t[h][s],_=t[h+1][s],f[h]=new a(l,0,0,_),r&&(u=t[h+2][s],e[h]=(e[h]||0)+(_-l)*(_-l),i[h]=(i[h]||0)+(u-_)*(u-_));return f[h]=new a(t[h][s],0,0,t[h+1][s]),f},u=function(t,n,a,h,u,c){var f,p,m,d,g,v,y,T,x={},w=[],b=c||t[0];u="string"==typeof u?","+u+",":o,null==n&&(n=1);for(p in t[0])w.push(p);if(t.length>1){for(T=t[t.length-1],y=!0,f=w.length;--f>-1;)if(p=w[f],Math.abs(b[p]-T[p])>.05){y=!1;break}y&&(t=t.concat(),c&&t.unshift(c),t.push(t[1]),c=t[t.length-3])}for(e.length=i.length=s.length=0,f=w.length;--f>-1;)p=w[f],r[p]=-1!==u.indexOf(","+p+","),x[p]=_(t,p,r[p],c);for(f=e.length;--f>-1;)e[f]=Math.sqrt(e[f]),i[f]=Math.sqrt(i[f]);if(!h){for(f=w.length;--f>-1;)if(r[p])for(m=x[w[f]],v=m.length-1,d=0;v>d;d++)g=m[d+1].da/i[d]+m[d].da/e[d],s[d]=(s[d]||0)+g*g;for(f=s.length;--f>-1;)s[f]=Math.sqrt(s[f])}for(f=w.length,d=a?4:1;--f>-1;)p=w[f],m=x[p],l(m,n,a,h,r[p]),y&&(m.splice(0,d),m.splice(m.length-d,d));return x},c=function(t,e,i){e=e||"soft";var s,r,n,o,h,l,_,u,c,f,p,m={},d="cubic"===e?3:2,g="soft"===e,v=[];if(g&&i&&(t=[i].concat(t)),null==t||d+1>t.length)throw"invalid Bezier data";for(c in t[0])v.push(c);for(l=v.length;--l>-1;){for(c=v[l],m[c]=h=[],f=0,u=t.length,_=0;u>_;_++)s=null==i?t[_][c]:"string"==typeof(p=t[_][c])&&"="===p.charAt(1)?i[c]+Number(p.charAt(0)+p.substr(2)):Number(p),g&&_>1&&u-1>_&&(h[f++]=(s+h[f-2])/2),h[f++]=s;for(u=f-d+1,f=0,_=0;u>_;_+=d)s=h[_],r=h[_+1],n=h[_+2],o=2===d?0:h[_+3],h[f++]=p=3===d?new a(s,r,n,o):new a(s,(2*r+s)/3,(2*r+n)/3,n);h.length=f}return m},f=function(t,e,i){for(var s,r,n,a,o,h,l,_,u,c,f,p=1/i,m=t.length;--m>-1;)for(c=t[m],n=c.a,a=c.d-n,o=c.c-n,h=c.b-n,s=r=0,_=1;i>=_;_++)l=p*_,u=1-l,s=r-(r=(l*l*a+3*u*(l*o+u*h))*l),f=m*i+_-1,e[f]=(e[f]||0)+s*s},p=function(t,e){e=e>>0||6;var i,s,r,n,a=[],o=[],h=0,l=0,_=e-1,u=[],c=[];for(i in t)f(t[i],a,e);for(r=a.length,s=0;r>s;s++)h+=Math.sqrt(a[s]),n=s%e,c[n]=h,n===_&&(l+=h,n=s/e>>0,u[n]=c,o[n]=l,h=0,c=[]);return{length:l,lengths:o,segments:u}},m=_gsScope._gsDefine.plugin({propName:"bezier",priority:-1,version:"1.3.4",API:2,global:!0,init:function(t,e,i){this._target=t,e instanceof Array&&(e={values:e}),this._func={},this._round={},this._props=[],this._timeRes=null==e.timeResolution?6:parseInt(e.timeResolution,10);var s,r,n,a,o,h=e.values||[],l={},_=h[0],f=e.autoRotate||i.vars.orientToBezier;this._autoRotate=f?f instanceof Array?f:[["x","y","rotation",f===!0?0:Number(f)||0]]:null;for(s in _)this._props.push(s);for(n=this._props.length;--n>-1;)s=this._props[n],this._overwriteProps.push(s),r=this._func[s]="function"==typeof t[s],l[s]=r?t[s.indexOf("set")||"function"!=typeof t["get"+s.substr(3)]?s:"get"+s.substr(3)]():parseFloat(t[s]),o||l[s]!==h[0][s]&&(o=l);if(this._beziers="cubic"!==e.type&&"quadratic"!==e.type&&"soft"!==e.type?u(h,isNaN(e.curviness)?1:e.curviness,!1,"thruBasic"===e.type,e.correlate,o):c(h,e.type,l),this._segCount=this._beziers[s].length,this._timeRes){var m=p(this._beziers,this._timeRes);this._length=m.length,this._lengths=m.lengths,this._segments=m.segments,this._l1=this._li=this._s1=this._si=0,this._l2=this._lengths[0],this._curSeg=this._segments[0],this._s2=this._curSeg[0],this._prec=1/this._curSeg.length}if(f=this._autoRotate)for(this._initialRotations=[],f[0]instanceof Array||(this._autoRotate=f=[f]),n=f.length;--n>-1;){for(a=0;3>a;a++)s=f[n][a],this._func[s]="function"==typeof t[s]?t[s.indexOf("set")||"function"!=typeof t["get"+s.substr(3)]?s:"get"+s.substr(3)]:!1;s=f[n][2],this._initialRotations[n]=this._func[s]?this._func[s].call(this._target):this._target[s]}return this._startRatio=i.vars.runBackwards?1:0,!0},set:function(e){var i,s,r,n,a,o,h,l,_,u,c=this._segCount,f=this._func,p=this._target,m=e!==this._startRatio;if(this._timeRes){if(_=this._lengths,u=this._curSeg,e*=this._length,r=this._li,e>this._l2&&c-1>r){for(l=c-1;l>r&&e>=(this._l2=_[++r]););this._l1=_[r-1],this._li=r,this._curSeg=u=this._segments[r],this._s2=u[this._s1=this._si=0]}else if(this._l1>e&&r>0){for(;r>0&&(this._l1=_[--r])>=e;);0===r&&this._l1>e?this._l1=0:r++,this._l2=_[r],this._li=r,this._curSeg=u=this._segments[r],this._s1=u[(this._si=u.length-1)-1]||0,this._s2=u[this._si]
}if(i=r,e-=this._l1,r=this._si,e>this._s2&&u.length-1>r){for(l=u.length-1;l>r&&e>=(this._s2=u[++r]););this._s1=u[r-1],this._si=r}else if(this._s1>e&&r>0){for(;r>0&&(this._s1=u[--r])>=e;);0===r&&this._s1>e?this._s1=0:r++,this._s2=u[r],this._si=r}o=(r+(e-this._s1)/(this._s2-this._s1))*this._prec}else i=0>e?0:e>=1?c-1:c*e>>0,o=(e-i*(1/c))*c;for(s=1-o,r=this._props.length;--r>-1;)n=this._props[r],a=this._beziers[n][i],h=(o*o*a.da+3*s*(o*a.ca+s*a.ba))*o+a.a,this._round[n]&&(h=Math.round(h)),f[n]?p[n](h):p[n]=h;if(this._autoRotate){var d,g,v,y,T,x,w,b=this._autoRotate;for(r=b.length;--r>-1;)n=b[r][2],x=b[r][3]||0,w=b[r][4]===!0?1:t,a=this._beziers[b[r][0]],d=this._beziers[b[r][1]],a&&d&&(a=a[i],d=d[i],g=a.a+(a.b-a.a)*o,y=a.b+(a.c-a.b)*o,g+=(y-g)*o,y+=(a.c+(a.d-a.c)*o-y)*o,v=d.a+(d.b-d.a)*o,T=d.b+(d.c-d.b)*o,v+=(T-v)*o,T+=(d.c+(d.d-d.c)*o-T)*o,h=m?Math.atan2(T-v,y-g)*w+x:this._initialRotations[r],f[n]?p[n](h):p[n]=h)}}}),d=m.prototype;m.bezierThrough=u,m.cubicToQuadratic=h,m._autoCSS=!0,m.quadraticToCubic=function(t,e,i){return new a(t,(2*e+t)/3,(2*e+i)/3,i)},m._cssRegister=function(){var t=n.CSSPlugin;if(t){var e=t._internals,i=e._parseToProxy,s=e._setPluginRatio,r=e.CSSPropTween;e._registerComplexSpecialProp("bezier",{parser:function(t,e,n,a,o,h){e instanceof Array&&(e={values:e}),h=new m;var l,_,u,c=e.values,f=c.length-1,p=[],d={};if(0>f)return o;for(l=0;f>=l;l++)u=i(t,c[l],a,o,h,f!==l),p[l]=u.end;for(_ in e)d[_]=e[_];return d.values=p,o=new r(t,"bezier",0,0,u.pt,2),o.data=u,o.plugin=h,o.setRatio=s,0===d.autoRotate&&(d.autoRotate=!0),!d.autoRotate||d.autoRotate instanceof Array||(l=d.autoRotate===!0?0:Number(d.autoRotate),d.autoRotate=null!=u.end.left?[["left","top","rotation",l,!1]]:null!=u.end.x?[["x","y","rotation",l,!1]]:!1),d.autoRotate&&(a._transform||a._enableTransforms(!1),u.autoRotate=a._target._gsTransform),h._onInitTween(u.proxy,d,a._tween),o}})}},d._roundProps=function(t,e){for(var i=this._overwriteProps,s=i.length;--s>-1;)(t[i[s]]||t.bezier||t.bezierThrough)&&(this._round[i[s]]=e)},d._kill=function(t){var e,i,s=this._props;for(e in this._beziers)if(e in t)for(delete this._beziers[e],delete this._func[e],i=s.length;--i>-1;)s[i]===e&&s.splice(i,1);return this._super._kill.call(this,t)}}(),_gsScope._gsDefine("plugins.CSSPlugin",["plugins.TweenPlugin","TweenLite"],function(t,e){var i,s,r,n,a=function(){t.call(this,"css"),this._overwriteProps.length=0,this.setRatio=a.prototype.setRatio},o=_gsScope._gsDefine.globals,h={},l=a.prototype=new t("css");l.constructor=a,a.version="1.17.0",a.API=2,a.defaultTransformPerspective=0,a.defaultSkewType="compensated",a.defaultSmoothOrigin=!0,l="px",a.suffixMap={top:l,right:l,bottom:l,left:l,width:l,height:l,fontSize:l,padding:l,margin:l,perspective:l,lineHeight:""};var _,u,c,f,p,m,d=/(?:\d|\-\d|\.\d|\-\.\d)+/g,g=/(?:\d|\-\d|\.\d|\-\.\d|\+=\d|\-=\d|\+=.\d|\-=\.\d)+/g,v=/(?:\+=|\-=|\-|\b)[\d\-\.]+[a-zA-Z0-9]*(?:%|\b)/gi,y=/(?![+-]?\d*\.?\d+|[+-]|e[+-]\d+)[^0-9]/g,T=/(?:\d|\-|\+|=|#|\.)*/g,x=/opacity *= *([^)]*)/i,w=/opacity:([^;]*)/i,b=/alpha\(opacity *=.+?\)/i,P=/^(rgb|hsl)/,k=/([A-Z])/g,S=/-([a-z])/gi,R=/(^(?:url\(\"|url\())|(?:(\"\))$|\)$)/gi,O=function(t,e){return e.toUpperCase()},A=/(?:Left|Right|Width)/i,C=/(M11|M12|M21|M22)=[\d\-\.e]+/gi,D=/progid\:DXImageTransform\.Microsoft\.Matrix\(.+?\)/i,M=/,(?=[^\)]*(?:\(|$))/gi,z=Math.PI/180,I=180/Math.PI,F={},N=document,E=function(t){return N.createElementNS?N.createElementNS("http://www.w3.org/1999/xhtml",t):N.createElement(t)},L=E("div"),X=E("img"),B=a._internals={_specialProps:h},Y=navigator.userAgent,j=function(){var t=Y.indexOf("Android"),e=E("a");return c=-1!==Y.indexOf("Safari")&&-1===Y.indexOf("Chrome")&&(-1===t||Number(Y.substr(t+8,1))>3),p=c&&6>Number(Y.substr(Y.indexOf("Version/")+8,1)),f=-1!==Y.indexOf("Firefox"),(/MSIE ([0-9]{1,}[\.0-9]{0,})/.exec(Y)||/Trident\/.*rv:([0-9]{1,}[\.0-9]{0,})/.exec(Y))&&(m=parseFloat(RegExp.$1)),e?(e.style.cssText="top:1px;opacity:.55;",/^0.55/.test(e.style.opacity)):!1}(),U=function(t){return x.test("string"==typeof t?t:(t.currentStyle?t.currentStyle.filter:t.style.filter)||"")?parseFloat(RegExp.$1)/100:1},q=function(t){window.console&&console.log(t)},V="",G="",W=function(t,e){e=e||L;var i,s,r=e.style;if(void 0!==r[t])return t;for(t=t.charAt(0).toUpperCase()+t.substr(1),i=["O","Moz","ms","Ms","Webkit"],s=5;--s>-1&&void 0===r[i[s]+t];);return s>=0?(G=3===s?"ms":i[s],V="-"+G.toLowerCase()+"-",G+t):null},Z=N.defaultView?N.defaultView.getComputedStyle:function(){},Q=a.getStyle=function(t,e,i,s,r){var n;return j||"opacity"!==e?(!s&&t.style[e]?n=t.style[e]:(i=i||Z(t))?n=i[e]||i.getPropertyValue(e)||i.getPropertyValue(e.replace(k,"-$1").toLowerCase()):t.currentStyle&&(n=t.currentStyle[e]),null==r||n&&"none"!==n&&"auto"!==n&&"auto auto"!==n?n:r):U(t)},$=B.convertToPixels=function(t,i,s,r,n){if("px"===r||!r)return s;if("auto"===r||!s)return 0;var o,h,l,_=A.test(i),u=t,c=L.style,f=0>s;if(f&&(s=-s),"%"===r&&-1!==i.indexOf("border"))o=s/100*(_?t.clientWidth:t.clientHeight);else{if(c.cssText="border:0 solid red;position:"+Q(t,"position")+";line-height:0;","%"!==r&&u.appendChild)c[_?"borderLeftWidth":"borderTopWidth"]=s+r;else{if(u=t.parentNode||N.body,h=u._gsCache,l=e.ticker.frame,h&&_&&h.time===l)return h.width*s/100;c[_?"width":"height"]=s+r}u.appendChild(L),o=parseFloat(L[_?"offsetWidth":"offsetHeight"]),u.removeChild(L),_&&"%"===r&&a.cacheWidths!==!1&&(h=u._gsCache=u._gsCache||{},h.time=l,h.width=100*(o/s)),0!==o||n||(o=$(t,i,s,r,!0))}return f?-o:o},H=B.calculateOffset=function(t,e,i){if("absolute"!==Q(t,"position",i))return 0;var s="left"===e?"Left":"Top",r=Q(t,"margin"+s,i);return t["offset"+s]-($(t,e,parseFloat(r),r.replace(T,""))||0)},K=function(t,e){var i,s,r,n={};if(e=e||Z(t,null))if(i=e.length)for(;--i>-1;)r=e[i],(-1===r.indexOf("-transform")||Pe===r)&&(n[r.replace(S,O)]=e.getPropertyValue(r));else for(i in e)(-1===i.indexOf("Transform")||be===i)&&(n[i]=e[i]);else if(e=t.currentStyle||t.style)for(i in e)"string"==typeof i&&void 0===n[i]&&(n[i.replace(S,O)]=e[i]);return j||(n.opacity=U(t)),s=Ne(t,e,!1),n.rotation=s.rotation,n.skewX=s.skewX,n.scaleX=s.scaleX,n.scaleY=s.scaleY,n.x=s.x,n.y=s.y,Se&&(n.z=s.z,n.rotationX=s.rotationX,n.rotationY=s.rotationY,n.scaleZ=s.scaleZ),n.filters&&delete n.filters,n},J=function(t,e,i,s,r){var n,a,o,h={},l=t.style;for(a in i)"cssText"!==a&&"length"!==a&&isNaN(a)&&(e[a]!==(n=i[a])||r&&r[a])&&-1===a.indexOf("Origin")&&("number"==typeof n||"string"==typeof n)&&(h[a]="auto"!==n||"left"!==a&&"top"!==a?""!==n&&"auto"!==n&&"none"!==n||"string"!=typeof e[a]||""===e[a].replace(y,"")?n:0:H(t,a),void 0!==l[a]&&(o=new fe(l,a,l[a],o)));if(s)for(a in s)"className"!==a&&(h[a]=s[a]);return{difs:h,firstMPT:o}},te={width:["Left","Right"],height:["Top","Bottom"]},ee=["marginLeft","marginRight","marginTop","marginBottom"],ie=function(t,e,i){var s=parseFloat("width"===e?t.offsetWidth:t.offsetHeight),r=te[e],n=r.length;for(i=i||Z(t,null);--n>-1;)s-=parseFloat(Q(t,"padding"+r[n],i,!0))||0,s-=parseFloat(Q(t,"border"+r[n]+"Width",i,!0))||0;return s},se=function(t,e){(null==t||""===t||"auto"===t||"auto auto"===t)&&(t="0 0");var i=t.split(" "),s=-1!==t.indexOf("left")?"0%":-1!==t.indexOf("right")?"100%":i[0],r=-1!==t.indexOf("top")?"0%":-1!==t.indexOf("bottom")?"100%":i[1];return null==r?r="center"===s?"50%":"0":"center"===r&&(r="50%"),("center"===s||isNaN(parseFloat(s))&&-1===(s+"").indexOf("="))&&(s="50%"),t=s+" "+r+(i.length>2?" "+i[2]:""),e&&(e.oxp=-1!==s.indexOf("%"),e.oyp=-1!==r.indexOf("%"),e.oxr="="===s.charAt(1),e.oyr="="===r.charAt(1),e.ox=parseFloat(s.replace(y,"")),e.oy=parseFloat(r.replace(y,"")),e.v=t),e||t},re=function(t,e){return"string"==typeof t&&"="===t.charAt(1)?parseInt(t.charAt(0)+"1",10)*parseFloat(t.substr(2)):parseFloat(t)-parseFloat(e)},ne=function(t,e){return null==t?e:"string"==typeof t&&"="===t.charAt(1)?parseInt(t.charAt(0)+"1",10)*parseFloat(t.substr(2))+e:parseFloat(t)},ae=function(t,e,i,s){var r,n,a,o,h,l=1e-6;return null==t?o=e:"number"==typeof t?o=t:(r=360,n=t.split("_"),h="="===t.charAt(1),a=(h?parseInt(t.charAt(0)+"1",10)*parseFloat(n[0].substr(2)):parseFloat(n[0]))*(-1===t.indexOf("rad")?1:I)-(h?0:e),n.length&&(s&&(s[i]=e+a),-1!==t.indexOf("short")&&(a%=r,a!==a%(r/2)&&(a=0>a?a+r:a-r)),-1!==t.indexOf("_cw")&&0>a?a=(a+9999999999*r)%r-(0|a/r)*r:-1!==t.indexOf("ccw")&&a>0&&(a=(a-9999999999*r)%r-(0|a/r)*r)),o=e+a),l>o&&o>-l&&(o=0),o},oe={aqua:[0,255,255],lime:[0,255,0],silver:[192,192,192],black:[0,0,0],maroon:[128,0,0],teal:[0,128,128],blue:[0,0,255],navy:[0,0,128],white:[255,255,255],fuchsia:[255,0,255],olive:[128,128,0],yellow:[255,255,0],orange:[255,165,0],gray:[128,128,128],purple:[128,0,128],green:[0,128,0],red:[255,0,0],pink:[255,192,203],cyan:[0,255,255],transparent:[255,255,255,0]},he=function(t,e,i){return t=0>t?t+1:t>1?t-1:t,0|255*(1>6*t?e+6*(i-e)*t:.5>t?i:2>3*t?e+6*(i-e)*(2/3-t):e)+.5},le=a.parseColor=function(t){var e,i,s,r,n,a;return t&&""!==t?"number"==typeof t?[t>>16,255&t>>8,255&t]:(","===t.charAt(t.length-1)&&(t=t.substr(0,t.length-1)),oe[t]?oe[t]:"#"===t.charAt(0)?(4===t.length&&(e=t.charAt(1),i=t.charAt(2),s=t.charAt(3),t="#"+e+e+i+i+s+s),t=parseInt(t.substr(1),16),[t>>16,255&t>>8,255&t]):"hsl"===t.substr(0,3)?(t=t.match(d),r=Number(t[0])%360/360,n=Number(t[1])/100,a=Number(t[2])/100,i=.5>=a?a*(n+1):a+n-a*n,e=2*a-i,t.length>3&&(t[3]=Number(t[3])),t[0]=he(r+1/3,e,i),t[1]=he(r,e,i),t[2]=he(r-1/3,e,i),t):(t=t.match(d)||oe.transparent,t[0]=Number(t[0]),t[1]=Number(t[1]),t[2]=Number(t[2]),t.length>3&&(t[3]=Number(t[3])),t)):oe.black},_e="(?:\\b(?:(?:rgb|rgba|hsl|hsla)\\(.+?\\))|\\B#.+?\\b";for(l in oe)_e+="|"+l+"\\b";_e=RegExp(_e+")","gi");var ue=function(t,e,i,s){if(null==t)return function(t){return t};var r,n=e?(t.match(_e)||[""])[0]:"",a=t.split(n).join("").match(v)||[],o=t.substr(0,t.indexOf(a[0])),h=")"===t.charAt(t.length-1)?")":"",l=-1!==t.indexOf(" ")?" ":",",_=a.length,u=_>0?a[0].replace(d,""):"";return _?r=e?function(t){var e,c,f,p;if("number"==typeof t)t+=u;else if(s&&M.test(t)){for(p=t.replace(M,"|").split("|"),f=0;p.length>f;f++)p[f]=r(p[f]);return p.join(",")}if(e=(t.match(_e)||[n])[0],c=t.split(e).join("").match(v)||[],f=c.length,_>f--)for(;_>++f;)c[f]=i?c[0|(f-1)/2]:a[f];return o+c.join(l)+l+e+h+(-1!==t.indexOf("inset")?" inset":"")}:function(t){var e,n,c;if("number"==typeof t)t+=u;else if(s&&M.test(t)){for(n=t.replace(M,"|").split("|"),c=0;n.length>c;c++)n[c]=r(n[c]);return n.join(",")}if(e=t.match(v)||[],c=e.length,_>c--)for(;_>++c;)e[c]=i?e[0|(c-1)/2]:a[c];return o+e.join(l)+h}:function(t){return t}},ce=function(t){return t=t.split(","),function(e,i,s,r,n,a,o){var h,l=(i+"").split(" ");for(o={},h=0;4>h;h++)o[t[h]]=l[h]=l[h]||l[(h-1)/2>>0];return r.parse(e,o,n,a)}},fe=(B._setPluginRatio=function(t){this.plugin.setRatio(t);for(var e,i,s,r,n=this.data,a=n.proxy,o=n.firstMPT,h=1e-6;o;)e=a[o.v],o.r?e=Math.round(e):h>e&&e>-h&&(e=0),o.t[o.p]=e,o=o._next;if(n.autoRotate&&(n.autoRotate.rotation=a.rotation),1===t)for(o=n.firstMPT;o;){if(i=o.t,i.type){if(1===i.type){for(r=i.xs0+i.s+i.xs1,s=1;i.l>s;s++)r+=i["xn"+s]+i["xs"+(s+1)];i.e=r}}else i.e=i.s+i.xs0;o=o._next}},function(t,e,i,s,r){this.t=t,this.p=e,this.v=i,this.r=r,s&&(s._prev=this,this._next=s)}),pe=(B._parseToProxy=function(t,e,i,s,r,n){var a,o,h,l,_,u=s,c={},f={},p=i._transform,m=F;for(i._transform=null,F=e,s=_=i.parse(t,e,s,r),F=m,n&&(i._transform=p,u&&(u._prev=null,u._prev&&(u._prev._next=null)));s&&s!==u;){if(1>=s.type&&(o=s.p,f[o]=s.s+s.c,c[o]=s.s,n||(l=new fe(s,"s",o,l,s.r),s.c=0),1===s.type))for(a=s.l;--a>0;)h="xn"+a,o=s.p+"_"+h,f[o]=s.data[h],c[o]=s[h],n||(l=new fe(s,h,o,l,s.rxp[h]));s=s._next}return{proxy:c,end:f,firstMPT:l,pt:_}},B.CSSPropTween=function(t,e,s,r,a,o,h,l,_,u,c){this.t=t,this.p=e,this.s=s,this.c=r,this.n=h||e,t instanceof pe||n.push(this.n),this.r=l,this.type=o||0,_&&(this.pr=_,i=!0),this.b=void 0===u?s:u,this.e=void 0===c?s+r:c,a&&(this._next=a,a._prev=this)}),me=function(t,e,i,s,r,n){var a=new pe(t,e,i,s-i,r,-1,n);return a.b=i,a.e=a.xs0=s,a},de=a.parseComplex=function(t,e,i,s,r,n,a,o,h,l){i=i||n||"",a=new pe(t,e,0,0,a,l?2:1,null,!1,o,i,s),s+="";var u,c,f,p,m,v,y,T,x,w,b,k,S=i.split(", ").join(",").split(" "),R=s.split(", ").join(",").split(" "),O=S.length,A=_!==!1;for((-1!==s.indexOf(",")||-1!==i.indexOf(","))&&(S=S.join(" ").replace(M,", ").split(" "),R=R.join(" ").replace(M,", ").split(" "),O=S.length),O!==R.length&&(S=(n||"").split(" "),O=S.length),a.plugin=h,a.setRatio=l,u=0;O>u;u++)if(p=S[u],m=R[u],T=parseFloat(p),T||0===T)a.appendXtra("",T,re(m,T),m.replace(g,""),A&&-1!==m.indexOf("px"),!0);else if(r&&("#"===p.charAt(0)||oe[p]||P.test(p)))k=","===m.charAt(m.length-1)?"),":")",p=le(p),m=le(m),x=p.length+m.length>6,x&&!j&&0===m[3]?(a["xs"+a.l]+=a.l?" transparent":"transparent",a.e=a.e.split(R[u]).join("transparent")):(j||(x=!1),a.appendXtra(x?"rgba(":"rgb(",p[0],m[0]-p[0],",",!0,!0).appendXtra("",p[1],m[1]-p[1],",",!0).appendXtra("",p[2],m[2]-p[2],x?",":k,!0),x&&(p=4>p.length?1:p[3],a.appendXtra("",p,(4>m.length?1:m[3])-p,k,!1)));else if(v=p.match(d)){if(y=m.match(g),!y||y.length!==v.length)return a;for(f=0,c=0;v.length>c;c++)b=v[c],w=p.indexOf(b,f),a.appendXtra(p.substr(f,w-f),Number(b),re(y[c],b),"",A&&"px"===p.substr(w+b.length,2),0===c),f=w+b.length;a["xs"+a.l]+=p.substr(f)}else a["xs"+a.l]+=a.l?" "+p:p;if(-1!==s.indexOf("=")&&a.data){for(k=a.xs0+a.data.s,u=1;a.l>u;u++)k+=a["xs"+u]+a.data["xn"+u];a.e=k+a["xs"+u]}return a.l||(a.type=-1,a.xs0=a.e),a.xfirst||a},ge=9;for(l=pe.prototype,l.l=l.pr=0;--ge>0;)l["xn"+ge]=0,l["xs"+ge]="";l.xs0="",l._next=l._prev=l.xfirst=l.data=l.plugin=l.setRatio=l.rxp=null,l.appendXtra=function(t,e,i,s,r,n){var a=this,o=a.l;return a["xs"+o]+=n&&o?" "+t:t||"",i||0===o||a.plugin?(a.l++,a.type=a.setRatio?2:1,a["xs"+a.l]=s||"",o>0?(a.data["xn"+o]=e+i,a.rxp["xn"+o]=r,a["xn"+o]=e,a.plugin||(a.xfirst=new pe(a,"xn"+o,e,i,a.xfirst||a,0,a.n,r,a.pr),a.xfirst.xs0=0),a):(a.data={s:e+i},a.rxp={},a.s=e,a.c=i,a.r=r,a)):(a["xs"+o]+=e+(s||""),a)};var ve=function(t,e){e=e||{},this.p=e.prefix?W(t)||t:t,h[t]=h[this.p]=this,this.format=e.formatter||ue(e.defaultValue,e.color,e.collapsible,e.multi),e.parser&&(this.parse=e.parser),this.clrs=e.color,this.multi=e.multi,this.keyword=e.keyword,this.dflt=e.defaultValue,this.pr=e.priority||0},ye=B._registerComplexSpecialProp=function(t,e,i){"object"!=typeof e&&(e={parser:i});var s,r,n=t.split(","),a=e.defaultValue;for(i=i||[a],s=0;n.length>s;s++)e.prefix=0===s&&e.prefix,e.defaultValue=i[s]||a,r=new ve(n[s],e)},Te=function(t){if(!h[t]){var e=t.charAt(0).toUpperCase()+t.substr(1)+"Plugin";ye(t,{parser:function(t,i,s,r,n,a,l){var _=o.com.greensock.plugins[e];return _?(_._cssRegister(),h[s].parse(t,i,s,r,n,a,l)):(q("Error: "+e+" js file not loaded."),n)}})}};l=ve.prototype,l.parseComplex=function(t,e,i,s,r,n){var a,o,h,l,_,u,c=this.keyword;if(this.multi&&(M.test(i)||M.test(e)?(o=e.replace(M,"|").split("|"),h=i.replace(M,"|").split("|")):c&&(o=[e],h=[i])),h){for(l=h.length>o.length?h.length:o.length,a=0;l>a;a++)e=o[a]=o[a]||this.dflt,i=h[a]=h[a]||this.dflt,c&&(_=e.indexOf(c),u=i.indexOf(c),_!==u&&(-1===u?o[a]=o[a].split(c).join(""):-1===_&&(o[a]+=" "+c)));e=o.join(", "),i=h.join(", ")}return de(t,this.p,e,i,this.clrs,this.dflt,s,this.pr,r,n)},l.parse=function(t,e,i,s,n,a){return this.parseComplex(t.style,this.format(Q(t,this.p,r,!1,this.dflt)),this.format(e),n,a)},a.registerSpecialProp=function(t,e,i){ye(t,{parser:function(t,s,r,n,a,o){var h=new pe(t,r,0,0,a,2,r,!1,i);return h.plugin=o,h.setRatio=e(t,s,n._tween,r),h},priority:i})},a.useSVGTransformAttr=c||f;var xe,we="scaleX,scaleY,scaleZ,x,y,z,skewX,skewY,rotation,rotationX,rotationY,perspective,xPercent,yPercent".split(","),be=W("transform"),Pe=V+"transform",ke=W("transformOrigin"),Se=null!==W("perspective"),Re=B.Transform=function(){this.perspective=parseFloat(a.defaultTransformPerspective)||0,this.force3D=a.defaultForce3D!==!1&&Se?a.defaultForce3D||"auto":!1},Oe=window.SVGElement,Ae=function(t,e,i){var s,r=N.createElementNS("http://www.w3.org/2000/svg",t),n=/([a-z])([A-Z])/g;for(s in i)r.setAttributeNS(null,s.replace(n,"$1-$2").toLowerCase(),i[s]);return e.appendChild(r),r},Ce=N.documentElement,De=function(){var t,e,i,s=m||/Android/i.test(Y)&&!window.chrome;return N.createElementNS&&!s&&(t=Ae("svg",Ce),e=Ae("rect",t,{width:100,height:50,x:100}),i=e.getBoundingClientRect().width,e.style[ke]="50% 50%",e.style[be]="scaleX(0.5)",s=i===e.getBoundingClientRect().width&&!(f&&Se),Ce.removeChild(t)),s}(),Me=function(t,e,i,s,r){var n,o,h,l,_,u,c,f,p,m,d,g,v,y,T=t._gsTransform,x=Fe(t,!0);T&&(v=T.xOrigin,y=T.yOrigin),(!s||2>(n=s.split(" ")).length)&&(c=t.getBBox(),e=se(e).split(" "),n=[(-1!==e[0].indexOf("%")?parseFloat(e[0])/100*c.width:parseFloat(e[0]))+c.x,(-1!==e[1].indexOf("%")?parseFloat(e[1])/100*c.height:parseFloat(e[1]))+c.y]),i.xOrigin=l=parseFloat(n[0]),i.yOrigin=_=parseFloat(n[1]),s&&x!==Ie&&(u=x[0],c=x[1],f=x[2],p=x[3],m=x[4],d=x[5],g=u*p-c*f,o=l*(p/g)+_*(-f/g)+(f*d-p*m)/g,h=l*(-c/g)+_*(u/g)-(u*d-c*m)/g,l=i.xOrigin=n[0]=o,_=i.yOrigin=n[1]=h),T&&(r||r!==!1&&a.defaultSmoothOrigin!==!1?(o=l-v,h=_-y,T.xOffset+=o*x[0]+h*x[2]-o,T.yOffset+=o*x[1]+h*x[3]-h):T.xOffset=T.yOffset=0),t.setAttribute("data-svg-origin",n.join(" "))},ze=function(t){return!!(Oe&&"function"==typeof t.getBBox&&t.getCTM&&(!t.parentNode||t.parentNode.getBBox&&t.parentNode.getCTM))},Ie=[1,0,0,1,0,0],Fe=function(t,e){var i,s,r,n,a,o=t._gsTransform||new Re,h=1e5;if(be?s=Q(t,Pe,null,!0):t.currentStyle&&(s=t.currentStyle.filter.match(C),s=s&&4===s.length?[s[0].substr(4),Number(s[2].substr(4)),Number(s[1].substr(4)),s[3].substr(4),o.x||0,o.y||0].join(","):""),i=!s||"none"===s||"matrix(1, 0, 0, 1, 0, 0)"===s,(o.svg||t.getBBox&&ze(t))&&(i&&-1!==(t.style[be]+"").indexOf("matrix")&&(s=t.style[be],i=0),r=t.getAttribute("transform"),i&&r&&(-1!==r.indexOf("matrix")?(s=r,i=0):-1!==r.indexOf("translate")&&(s="matrix(1,0,0,1,"+r.match(/(?:\-|\b)[\d\-\.e]+\b/gi).join(",")+")",i=0))),i)return Ie;for(r=(s||"").match(/(?:\-|\b)[\d\-\.e]+\b/gi)||[],ge=r.length;--ge>-1;)n=Number(r[ge]),r[ge]=(a=n-(n|=0))?(0|a*h+(0>a?-.5:.5))/h+n:n;return e&&r.length>6?[r[0],r[1],r[4],r[5],r[12],r[13]]:r},Ne=B.getTransform=function(t,i,s,n){if(t._gsTransform&&s&&!n)return t._gsTransform;var o,h,l,_,u,c,f=s?t._gsTransform||new Re:new Re,p=0>f.scaleX,m=2e-5,d=1e5,g=Se?parseFloat(Q(t,ke,i,!1,"0 0 0").split(" ")[2])||f.zOrigin||0:0,v=parseFloat(a.defaultTransformPerspective)||0;if(f.svg=!(!t.getBBox||!ze(t)),f.svg&&(Me(t,Q(t,ke,r,!1,"50% 50%")+"",f,t.getAttribute("data-svg-origin")),xe=a.useSVGTransformAttr||De),o=Fe(t),o!==Ie){if(16===o.length){var y,T,x,w,b,P=o[0],k=o[1],S=o[2],R=o[3],O=o[4],A=o[5],C=o[6],D=o[7],M=o[8],z=o[9],F=o[10],N=o[12],E=o[13],L=o[14],X=o[11],B=Math.atan2(C,F);f.zOrigin&&(L=-f.zOrigin,N=M*L-o[12],E=z*L-o[13],L=F*L+f.zOrigin-o[14]),f.rotationX=B*I,B&&(w=Math.cos(-B),b=Math.sin(-B),y=O*w+M*b,T=A*w+z*b,x=C*w+F*b,M=O*-b+M*w,z=A*-b+z*w,F=C*-b+F*w,X=D*-b+X*w,O=y,A=T,C=x),B=Math.atan2(M,F),f.rotationY=B*I,B&&(w=Math.cos(-B),b=Math.sin(-B),y=P*w-M*b,T=k*w-z*b,x=S*w-F*b,z=k*b+z*w,F=S*b+F*w,X=R*b+X*w,P=y,k=T,S=x),B=Math.atan2(k,P),f.rotation=B*I,B&&(w=Math.cos(-B),b=Math.sin(-B),P=P*w+O*b,T=k*w+A*b,A=k*-b+A*w,C=S*-b+C*w,k=T),f.rotationX&&Math.abs(f.rotationX)+Math.abs(f.rotation)>359.9&&(f.rotationX=f.rotation=0,f.rotationY+=180),f.scaleX=(0|Math.sqrt(P*P+k*k)*d+.5)/d,f.scaleY=(0|Math.sqrt(A*A+z*z)*d+.5)/d,f.scaleZ=(0|Math.sqrt(C*C+F*F)*d+.5)/d,f.skewX=0,f.perspective=X?1/(0>X?-X:X):0,f.x=N,f.y=E,f.z=L,f.svg&&(f.x-=f.xOrigin-(f.xOrigin*P-f.yOrigin*O),f.y-=f.yOrigin-(f.yOrigin*k-f.xOrigin*A))}else if(!(Se&&!n&&o.length&&f.x===o[4]&&f.y===o[5]&&(f.rotationX||f.rotationY)||void 0!==f.x&&"none"===Q(t,"display",i))){var Y=o.length>=6,j=Y?o[0]:1,U=o[1]||0,q=o[2]||0,V=Y?o[3]:1;f.x=o[4]||0,f.y=o[5]||0,l=Math.sqrt(j*j+U*U),_=Math.sqrt(V*V+q*q),u=j||U?Math.atan2(U,j)*I:f.rotation||0,c=q||V?Math.atan2(q,V)*I+u:f.skewX||0,Math.abs(c)>90&&270>Math.abs(c)&&(p?(l*=-1,c+=0>=u?180:-180,u+=0>=u?180:-180):(_*=-1,c+=0>=c?180:-180)),f.scaleX=l,f.scaleY=_,f.rotation=u,f.skewX=c,Se&&(f.rotationX=f.rotationY=f.z=0,f.perspective=v,f.scaleZ=1),f.svg&&(f.x-=f.xOrigin-(f.xOrigin*j+f.yOrigin*q),f.y-=f.yOrigin-(f.xOrigin*U+f.yOrigin*V))}f.zOrigin=g;for(h in f)m>f[h]&&f[h]>-m&&(f[h]=0)}return s&&(t._gsTransform=f,f.svg&&(xe&&t.style[be]?e.delayedCall(.001,function(){Be(t.style,be)}):!xe&&t.getAttribute("transform")&&e.delayedCall(.001,function(){t.removeAttribute("transform")}))),f},Ee=function(t){var e,i,s=this.data,r=-s.rotation*z,n=r+s.skewX*z,a=1e5,o=(0|Math.cos(r)*s.scaleX*a)/a,h=(0|Math.sin(r)*s.scaleX*a)/a,l=(0|Math.sin(n)*-s.scaleY*a)/a,_=(0|Math.cos(n)*s.scaleY*a)/a,u=this.t.style,c=this.t.currentStyle;if(c){i=h,h=-l,l=-i,e=c.filter,u.filter="";var f,p,d=this.t.offsetWidth,g=this.t.offsetHeight,v="absolute"!==c.position,y="progid:DXImageTransform.Microsoft.Matrix(M11="+o+", M12="+h+", M21="+l+", M22="+_,w=s.x+d*s.xPercent/100,b=s.y+g*s.yPercent/100;if(null!=s.ox&&(f=(s.oxp?.01*d*s.ox:s.ox)-d/2,p=(s.oyp?.01*g*s.oy:s.oy)-g/2,w+=f-(f*o+p*h),b+=p-(f*l+p*_)),v?(f=d/2,p=g/2,y+=", Dx="+(f-(f*o+p*h)+w)+", Dy="+(p-(f*l+p*_)+b)+")"):y+=", sizingMethod='auto expand')",u.filter=-1!==e.indexOf("DXImageTransform.Microsoft.Matrix(")?e.replace(D,y):y+" "+e,(0===t||1===t)&&1===o&&0===h&&0===l&&1===_&&(v&&-1===y.indexOf("Dx=0, Dy=0")||x.test(e)&&100!==parseFloat(RegExp.$1)||-1===e.indexOf("gradient("&&e.indexOf("Alpha"))&&u.removeAttribute("filter")),!v){var P,k,S,R=8>m?1:-1;for(f=s.ieOffsetX||0,p=s.ieOffsetY||0,s.ieOffsetX=Math.round((d-((0>o?-o:o)*d+(0>h?-h:h)*g))/2+w),s.ieOffsetY=Math.round((g-((0>_?-_:_)*g+(0>l?-l:l)*d))/2+b),ge=0;4>ge;ge++)k=ee[ge],P=c[k],i=-1!==P.indexOf("px")?parseFloat(P):$(this.t,k,parseFloat(P),P.replace(T,""))||0,S=i!==s[k]?2>ge?-s.ieOffsetX:-s.ieOffsetY:2>ge?f-s.ieOffsetX:p-s.ieOffsetY,u[k]=(s[k]=Math.round(i-S*(0===ge||2===ge?1:R)))+"px"}}},Le=B.set3DTransformRatio=B.setTransformRatio=function(t){var e,i,s,r,n,a,o,h,l,_,u,c,p,m,d,g,v,y,T,x,w,b,P,k=this.data,S=this.t.style,R=k.rotation,O=k.rotationX,A=k.rotationY,C=k.scaleX,D=k.scaleY,M=k.scaleZ,I=k.x,F=k.y,N=k.z,E=k.svg,L=k.perspective,X=k.force3D;if(!(((1!==t&&0!==t||"auto"!==X||this.tween._totalTime!==this.tween._totalDuration&&this.tween._totalTime)&&X||N||L||A||O)&&(!xe||!E)&&Se))return R||k.skewX||E?(R*=z,b=k.skewX*z,P=1e5,e=Math.cos(R)*C,r=Math.sin(R)*C,i=Math.sin(R-b)*-D,n=Math.cos(R-b)*D,b&&"simple"===k.skewType&&(v=Math.tan(b),v=Math.sqrt(1+v*v),i*=v,n*=v,k.skewY&&(e*=v,r*=v)),E&&(I+=k.xOrigin-(k.xOrigin*e+k.yOrigin*i)+k.xOffset,F+=k.yOrigin-(k.xOrigin*r+k.yOrigin*n)+k.yOffset,xe&&(k.xPercent||k.yPercent)&&(m=this.t.getBBox(),I+=.01*k.xPercent*m.width,F+=.01*k.yPercent*m.height),m=1e-6,m>I&&I>-m&&(I=0),m>F&&F>-m&&(F=0)),T=(0|e*P)/P+","+(0|r*P)/P+","+(0|i*P)/P+","+(0|n*P)/P+","+I+","+F+")",E&&xe?this.t.setAttribute("transform","matrix("+T):S[be]=(k.xPercent||k.yPercent?"translate("+k.xPercent+"%,"+k.yPercent+"%) matrix(":"matrix(")+T):S[be]=(k.xPercent||k.yPercent?"translate("+k.xPercent+"%,"+k.yPercent+"%) matrix(":"matrix(")+C+",0,0,"+D+","+I+","+F+")",void 0;if(f&&(m=1e-4,m>C&&C>-m&&(C=M=2e-5),m>D&&D>-m&&(D=M=2e-5),!L||k.z||k.rotationX||k.rotationY||(L=0)),R||k.skewX)R*=z,d=e=Math.cos(R),g=r=Math.sin(R),k.skewX&&(R-=k.skewX*z,d=Math.cos(R),g=Math.sin(R),"simple"===k.skewType&&(v=Math.tan(k.skewX*z),v=Math.sqrt(1+v*v),d*=v,g*=v,k.skewY&&(e*=v,r*=v))),i=-g,n=d;else{if(!(A||O||1!==M||L||E))return S[be]=(k.xPercent||k.yPercent?"translate("+k.xPercent+"%,"+k.yPercent+"%) translate3d(":"translate3d(")+I+"px,"+F+"px,"+N+"px)"+(1!==C||1!==D?" scale("+C+","+D+")":""),void 0;e=n=1,i=r=0}l=1,s=a=o=h=_=u=0,c=L?-1/L:0,p=k.zOrigin,m=1e-6,x=",",w="0",R=A*z,R&&(d=Math.cos(R),g=Math.sin(R),o=-g,_=c*-g,s=e*g,a=r*g,l=d,c*=d,e*=d,r*=d),R=O*z,R&&(d=Math.cos(R),g=Math.sin(R),v=i*d+s*g,y=n*d+a*g,h=l*g,u=c*g,s=i*-g+s*d,a=n*-g+a*d,l*=d,c*=d,i=v,n=y),1!==M&&(s*=M,a*=M,l*=M,c*=M),1!==D&&(i*=D,n*=D,h*=D,u*=D),1!==C&&(e*=C,r*=C,o*=C,_*=C),(p||E)&&(p&&(I+=s*-p,F+=a*-p,N+=l*-p+p),E&&(I+=k.xOrigin-(k.xOrigin*e+k.yOrigin*i)+k.xOffset,F+=k.yOrigin-(k.xOrigin*r+k.yOrigin*n)+k.yOffset),m>I&&I>-m&&(I=w),m>F&&F>-m&&(F=w),m>N&&N>-m&&(N=0)),T=k.xPercent||k.yPercent?"translate("+k.xPercent+"%,"+k.yPercent+"%) matrix3d(":"matrix3d(",T+=(m>e&&e>-m?w:e)+x+(m>r&&r>-m?w:r)+x+(m>o&&o>-m?w:o),T+=x+(m>_&&_>-m?w:_)+x+(m>i&&i>-m?w:i)+x+(m>n&&n>-m?w:n),O||A?(T+=x+(m>h&&h>-m?w:h)+x+(m>u&&u>-m?w:u)+x+(m>s&&s>-m?w:s),T+=x+(m>a&&a>-m?w:a)+x+(m>l&&l>-m?w:l)+x+(m>c&&c>-m?w:c)+x):T+=",0,0,0,0,1,0,",T+=I+x+F+x+N+x+(L?1+-N/L:1)+")",S[be]=T};l=Re.prototype,l.x=l.y=l.z=l.skewX=l.skewY=l.rotation=l.rotationX=l.rotationY=l.zOrigin=l.xPercent=l.yPercent=l.xOffset=l.yOffset=0,l.scaleX=l.scaleY=l.scaleZ=1,ye("transform,scale,scaleX,scaleY,scaleZ,x,y,z,rotation,rotationX,rotationY,rotationZ,skewX,skewY,shortRotation,shortRotationX,shortRotationY,shortRotationZ,transformOrigin,svgOrigin,transformPerspective,directionalRotation,parseTransform,force3D,skewType,xPercent,yPercent,smoothOrigin",{parser:function(t,e,i,s,n,o,h){if(s._lastParsedTransform===h)return n;s._lastParsedTransform=h;var l,_,u,c,f,p,m,d,g,v=t._gsTransform,y=s._transform=Ne(t,r,!0,h.parseTransform),T=t.style,x=1e-6,w=we.length,b=h,P={},k="transformOrigin";if("string"==typeof b.transform&&be)u=L.style,u[be]=b.transform,u.display="block",u.position="absolute",N.body.appendChild(L),l=Ne(L,null,!1),N.body.removeChild(L),null!=b.xPercent&&(l.xPercent=ne(b.xPercent,y.xPercent)),null!=b.yPercent&&(l.yPercent=ne(b.yPercent,y.yPercent));else if("object"==typeof b){if(l={scaleX:ne(null!=b.scaleX?b.scaleX:b.scale,y.scaleX),scaleY:ne(null!=b.scaleY?b.scaleY:b.scale,y.scaleY),scaleZ:ne(b.scaleZ,y.scaleZ),x:ne(b.x,y.x),y:ne(b.y,y.y),z:ne(b.z,y.z),xPercent:ne(b.xPercent,y.xPercent),yPercent:ne(b.yPercent,y.yPercent),perspective:ne(b.transformPerspective,y.perspective)},m=b.directionalRotation,null!=m)if("object"==typeof m)for(u in m)b[u]=m[u];else b.rotation=m;"string"==typeof b.x&&-1!==b.x.indexOf("%")&&(l.x=0,l.xPercent=ne(b.x,y.xPercent)),"string"==typeof b.y&&-1!==b.y.indexOf("%")&&(l.y=0,l.yPercent=ne(b.y,y.yPercent)),l.rotation=ae("rotation"in b?b.rotation:"shortRotation"in b?b.shortRotation+"_short":"rotationZ"in b?b.rotationZ:y.rotation,y.rotation,"rotation",P),Se&&(l.rotationX=ae("rotationX"in b?b.rotationX:"shortRotationX"in b?b.shortRotationX+"_short":y.rotationX||0,y.rotationX,"rotationX",P),l.rotationY=ae("rotationY"in b?b.rotationY:"shortRotationY"in b?b.shortRotationY+"_short":y.rotationY||0,y.rotationY,"rotationY",P)),l.skewX=null==b.skewX?y.skewX:ae(b.skewX,y.skewX),l.skewY=null==b.skewY?y.skewY:ae(b.skewY,y.skewY),(_=l.skewY-y.skewY)&&(l.skewX+=_,l.rotation+=_)}for(Se&&null!=b.force3D&&(y.force3D=b.force3D,p=!0),y.skewType=b.skewType||y.skewType||a.defaultSkewType,f=y.force3D||y.z||y.rotationX||y.rotationY||l.z||l.rotationX||l.rotationY||l.perspective,f||null==b.scale||(l.scaleZ=1);--w>-1;)i=we[w],c=l[i]-y[i],(c>x||-x>c||null!=b[i]||null!=F[i])&&(p=!0,n=new pe(y,i,y[i],c,n),i in P&&(n.e=P[i]),n.xs0=0,n.plugin=o,s._overwriteProps.push(n.n));return c=b.transformOrigin,y.svg&&(c||b.svgOrigin)&&(d=y.xOffset,g=y.yOffset,Me(t,se(c),l,b.svgOrigin,b.smoothOrigin),n=me(y,"xOrigin",(v?y:l).xOrigin,l.xOrigin,n,k),n=me(y,"yOrigin",(v?y:l).yOrigin,l.yOrigin,n,k),(d!==y.xOffset||g!==y.yOffset)&&(n=me(y,"xOffset",v?d:y.xOffset,y.xOffset,n,k),n=me(y,"yOffset",v?g:y.yOffset,y.yOffset,n,k)),c=xe?null:"0px 0px"),(c||Se&&f&&y.zOrigin)&&(be?(p=!0,i=ke,c=(c||Q(t,i,r,!1,"50% 50%"))+"",n=new pe(T,i,0,0,n,-1,k),n.b=T[i],n.plugin=o,Se?(u=y.zOrigin,c=c.split(" "),y.zOrigin=(c.length>2&&(0===u||"0px"!==c[2])?parseFloat(c[2]):u)||0,n.xs0=n.e=c[0]+" "+(c[1]||"50%")+" 0px",n=new pe(y,"zOrigin",0,0,n,-1,n.n),n.b=u,n.xs0=n.e=y.zOrigin):n.xs0=n.e=c):se(c+"",y)),p&&(s._transformType=y.svg&&xe||!f&&3!==this._transformType?2:3),n},prefix:!0}),ye("boxShadow",{defaultValue:"0px 0px 0px 0px #999",prefix:!0,color:!0,multi:!0,keyword:"inset"}),ye("borderRadius",{defaultValue:"0px",parser:function(t,e,i,n,a){e=this.format(e);var o,h,l,_,u,c,f,p,m,d,g,v,y,T,x,w,b=["borderTopLeftRadius","borderTopRightRadius","borderBottomRightRadius","borderBottomLeftRadius"],P=t.style;for(m=parseFloat(t.offsetWidth),d=parseFloat(t.offsetHeight),o=e.split(" "),h=0;b.length>h;h++)this.p.indexOf("border")&&(b[h]=W(b[h])),u=_=Q(t,b[h],r,!1,"0px"),-1!==u.indexOf(" ")&&(_=u.split(" "),u=_[0],_=_[1]),c=l=o[h],f=parseFloat(u),v=u.substr((f+"").length),y="="===c.charAt(1),y?(p=parseInt(c.charAt(0)+"1",10),c=c.substr(2),p*=parseFloat(c),g=c.substr((p+"").length-(0>p?1:0))||""):(p=parseFloat(c),g=c.substr((p+"").length)),""===g&&(g=s[i]||v),g!==v&&(T=$(t,"borderLeft",f,v),x=$(t,"borderTop",f,v),"%"===g?(u=100*(T/m)+"%",_=100*(x/d)+"%"):"em"===g?(w=$(t,"borderLeft",1,"em"),u=T/w+"em",_=x/w+"em"):(u=T+"px",_=x+"px"),y&&(c=parseFloat(u)+p+g,l=parseFloat(_)+p+g)),a=de(P,b[h],u+" "+_,c+" "+l,!1,"0px",a);return a},prefix:!0,formatter:ue("0px 0px 0px 0px",!1,!0)}),ye("backgroundPosition",{defaultValue:"0 0",parser:function(t,e,i,s,n,a){var o,h,l,_,u,c,f="background-position",p=r||Z(t,null),d=this.format((p?m?p.getPropertyValue(f+"-x")+" "+p.getPropertyValue(f+"-y"):p.getPropertyValue(f):t.currentStyle.backgroundPositionX+" "+t.currentStyle.backgroundPositionY)||"0 0"),g=this.format(e);if(-1!==d.indexOf("%")!=(-1!==g.indexOf("%"))&&(c=Q(t,"backgroundImage").replace(R,""),c&&"none"!==c)){for(o=d.split(" "),h=g.split(" "),X.setAttribute("src",c),l=2;--l>-1;)d=o[l],_=-1!==d.indexOf("%"),_!==(-1!==h[l].indexOf("%"))&&(u=0===l?t.offsetWidth-X.width:t.offsetHeight-X.height,o[l]=_?parseFloat(d)/100*u+"px":100*(parseFloat(d)/u)+"%");d=o.join(" ")}return this.parseComplex(t.style,d,g,n,a)},formatter:se}),ye("backgroundSize",{defaultValue:"0 0",formatter:se}),ye("perspective",{defaultValue:"0px",prefix:!0}),ye("perspectiveOrigin",{defaultValue:"50% 50%",prefix:!0}),ye("transformStyle",{prefix:!0}),ye("backfaceVisibility",{prefix:!0}),ye("userSelect",{prefix:!0}),ye("margin",{parser:ce("marginTop,marginRight,marginBottom,marginLeft")}),ye("padding",{parser:ce("paddingTop,paddingRight,paddingBottom,paddingLeft")}),ye("clip",{defaultValue:"rect(0px,0px,0px,0px)",parser:function(t,e,i,s,n,a){var o,h,l;return 9>m?(h=t.currentStyle,l=8>m?" ":",",o="rect("+h.clipTop+l+h.clipRight+l+h.clipBottom+l+h.clipLeft+")",e=this.format(e).split(",").join(l)):(o=this.format(Q(t,this.p,r,!1,this.dflt)),e=this.format(e)),this.parseComplex(t.style,o,e,n,a)}}),ye("textShadow",{defaultValue:"0px 0px 0px #999",color:!0,multi:!0}),ye("autoRound,strictUnits",{parser:function(t,e,i,s,r){return r}}),ye("border",{defaultValue:"0px solid #000",parser:function(t,e,i,s,n,a){return this.parseComplex(t.style,this.format(Q(t,"borderTopWidth",r,!1,"0px")+" "+Q(t,"borderTopStyle",r,!1,"solid")+" "+Q(t,"borderTopColor",r,!1,"#000")),this.format(e),n,a)},color:!0,formatter:function(t){var e=t.split(" ");return e[0]+" "+(e[1]||"solid")+" "+(t.match(_e)||["#000"])[0]}}),ye("borderWidth",{parser:ce("borderTopWidth,borderRightWidth,borderBottomWidth,borderLeftWidth")}),ye("float,cssFloat,styleFloat",{parser:function(t,e,i,s,r){var n=t.style,a="cssFloat"in n?"cssFloat":"styleFloat";return new pe(n,a,0,0,r,-1,i,!1,0,n[a],e)}});var Xe=function(t){var e,i=this.t,s=i.filter||Q(this.data,"filter")||"",r=0|this.s+this.c*t;100===r&&(-1===s.indexOf("atrix(")&&-1===s.indexOf("radient(")&&-1===s.indexOf("oader(")?(i.removeAttribute("filter"),e=!Q(this.data,"filter")):(i.filter=s.replace(b,""),e=!0)),e||(this.xn1&&(i.filter=s=s||"alpha(opacity="+r+")"),-1===s.indexOf("pacity")?0===r&&this.xn1||(i.filter=s+" alpha(opacity="+r+")"):i.filter=s.replace(x,"opacity="+r))};ye("opacity,alpha,autoAlpha",{defaultValue:"1",parser:function(t,e,i,s,n,a){var o=parseFloat(Q(t,"opacity",r,!1,"1")),h=t.style,l="autoAlpha"===i;return"string"==typeof e&&"="===e.charAt(1)&&(e=("-"===e.charAt(0)?-1:1)*parseFloat(e.substr(2))+o),l&&1===o&&"hidden"===Q(t,"visibility",r)&&0!==e&&(o=0),j?n=new pe(h,"opacity",o,e-o,n):(n=new pe(h,"opacity",100*o,100*(e-o),n),n.xn1=l?1:0,h.zoom=1,n.type=2,n.b="alpha(opacity="+n.s+")",n.e="alpha(opacity="+(n.s+n.c)+")",n.data=t,n.plugin=a,n.setRatio=Xe),l&&(n=new pe(h,"visibility",0,0,n,-1,null,!1,0,0!==o?"inherit":"hidden",0===e?"hidden":"inherit"),n.xs0="inherit",s._overwriteProps.push(n.n),s._overwriteProps.push(i)),n
}});var Be=function(t,e){e&&(t.removeProperty?(("ms"===e.substr(0,2)||"webkit"===e.substr(0,6))&&(e="-"+e),t.removeProperty(e.replace(k,"-$1").toLowerCase())):t.removeAttribute(e))},Ye=function(t){if(this.t._gsClassPT=this,1===t||0===t){this.t.setAttribute("class",0===t?this.b:this.e);for(var e=this.data,i=this.t.style;e;)e.v?i[e.p]=e.v:Be(i,e.p),e=e._next;1===t&&this.t._gsClassPT===this&&(this.t._gsClassPT=null)}else this.t.getAttribute("class")!==this.e&&this.t.setAttribute("class",this.e)};ye("className",{parser:function(t,e,s,n,a,o,h){var l,_,u,c,f,p=t.getAttribute("class")||"",m=t.style.cssText;if(a=n._classNamePT=new pe(t,s,0,0,a,2),a.setRatio=Ye,a.pr=-11,i=!0,a.b=p,_=K(t,r),u=t._gsClassPT){for(c={},f=u.data;f;)c[f.p]=1,f=f._next;u.setRatio(1)}return t._gsClassPT=a,a.e="="!==e.charAt(1)?e:p.replace(RegExp("\\s*\\b"+e.substr(2)+"\\b"),"")+("+"===e.charAt(0)?" "+e.substr(2):""),t.setAttribute("class",a.e),l=J(t,_,K(t),h,c),t.setAttribute("class",p),a.data=l.firstMPT,t.style.cssText=m,a=a.xfirst=n.parse(t,l.difs,a,o)}});var je=function(t){if((1===t||0===t)&&this.data._totalTime===this.data._totalDuration&&"isFromStart"!==this.data.data){var e,i,s,r,n,a=this.t.style,o=h.transform.parse;if("all"===this.e)a.cssText="",r=!0;else for(e=this.e.split(" ").join("").split(","),s=e.length;--s>-1;)i=e[s],h[i]&&(h[i].parse===o?r=!0:i="transformOrigin"===i?ke:h[i].p),Be(a,i);r&&(Be(a,be),n=this.t._gsTransform,n&&(n.svg&&this.t.removeAttribute("data-svg-origin"),delete this.t._gsTransform))}};for(ye("clearProps",{parser:function(t,e,s,r,n){return n=new pe(t,s,0,0,n,2),n.setRatio=je,n.e=e,n.pr=-10,n.data=r._tween,i=!0,n}}),l="bezier,throwProps,physicsProps,physics2D".split(","),ge=l.length;ge--;)Te(l[ge]);l=a.prototype,l._firstPT=l._lastParsedTransform=l._transform=null,l._onInitTween=function(t,e,o){if(!t.nodeType)return!1;this._target=t,this._tween=o,this._vars=e,_=e.autoRound,i=!1,s=e.suffixMap||a.suffixMap,r=Z(t,""),n=this._overwriteProps;var l,f,m,d,g,v,y,T,x,b=t.style;if(u&&""===b.zIndex&&(l=Q(t,"zIndex",r),("auto"===l||""===l)&&this._addLazySet(b,"zIndex",0)),"string"==typeof e&&(d=b.cssText,l=K(t,r),b.cssText=d+";"+e,l=J(t,l,K(t)).difs,!j&&w.test(e)&&(l.opacity=parseFloat(RegExp.$1)),e=l,b.cssText=d),this._firstPT=f=e.className?h.className.parse(t,e.className,"className",this,null,null,e):this.parse(t,e,null),this._transformType){for(x=3===this._transformType,be?c&&(u=!0,""===b.zIndex&&(y=Q(t,"zIndex",r),("auto"===y||""===y)&&this._addLazySet(b,"zIndex",0)),p&&this._addLazySet(b,"WebkitBackfaceVisibility",this._vars.WebkitBackfaceVisibility||(x?"visible":"hidden"))):b.zoom=1,m=f;m&&m._next;)m=m._next;T=new pe(t,"transform",0,0,null,2),this._linkCSSP(T,null,m),T.setRatio=be?Le:Ee,T.data=this._transform||Ne(t,r,!0),T.tween=o,T.pr=-1,n.pop()}if(i){for(;f;){for(v=f._next,m=d;m&&m.pr>f.pr;)m=m._next;(f._prev=m?m._prev:g)?f._prev._next=f:d=f,(f._next=m)?m._prev=f:g=f,f=v}this._firstPT=d}return!0},l.parse=function(t,e,i,n){var a,o,l,u,c,f,p,m,d,g,v=t.style;for(a in e)f=e[a],o=h[a],o?i=o.parse(t,f,a,this,i,n,e):(c=Q(t,a,r)+"",d="string"==typeof f,"color"===a||"fill"===a||"stroke"===a||-1!==a.indexOf("Color")||d&&P.test(f)?(d||(f=le(f),f=(f.length>3?"rgba(":"rgb(")+f.join(",")+")"),i=de(v,a,c,f,!0,"transparent",i,0,n)):!d||-1===f.indexOf(" ")&&-1===f.indexOf(",")?(l=parseFloat(c),p=l||0===l?c.substr((l+"").length):"",(""===c||"auto"===c)&&("width"===a||"height"===a?(l=ie(t,a,r),p="px"):"left"===a||"top"===a?(l=H(t,a,r),p="px"):(l="opacity"!==a?0:1,p="")),g=d&&"="===f.charAt(1),g?(u=parseInt(f.charAt(0)+"1",10),f=f.substr(2),u*=parseFloat(f),m=f.replace(T,"")):(u=parseFloat(f),m=d?f.replace(T,""):""),""===m&&(m=a in s?s[a]:p),f=u||0===u?(g?u+l:u)+m:e[a],p!==m&&""!==m&&(u||0===u)&&l&&(l=$(t,a,l,p),"%"===m?(l/=$(t,a,100,"%")/100,e.strictUnits!==!0&&(c=l+"%")):"em"===m?l/=$(t,a,1,"em"):"px"!==m&&(u=$(t,a,u,m),m="px"),g&&(u||0===u)&&(f=u+l+m)),g&&(u+=l),!l&&0!==l||!u&&0!==u?void 0!==v[a]&&(f||"NaN"!=f+""&&null!=f)?(i=new pe(v,a,u||l||0,0,i,-1,a,!1,0,c,f),i.xs0="none"!==f||"display"!==a&&-1===a.indexOf("Style")?f:c):q("invalid "+a+" tween value: "+e[a]):(i=new pe(v,a,l,u-l,i,0,a,_!==!1&&("px"===m||"zIndex"===a),0,c,f),i.xs0=m)):i=de(v,a,c,f,!0,null,i,0,n)),n&&i&&!i.plugin&&(i.plugin=n);return i},l.setRatio=function(t){var e,i,s,r=this._firstPT,n=1e-6;if(1!==t||this._tween._time!==this._tween._duration&&0!==this._tween._time)if(t||this._tween._time!==this._tween._duration&&0!==this._tween._time||this._tween._rawPrevTime===-1e-6)for(;r;){if(e=r.c*t+r.s,r.r?e=Math.round(e):n>e&&e>-n&&(e=0),r.type)if(1===r.type)if(s=r.l,2===s)r.t[r.p]=r.xs0+e+r.xs1+r.xn1+r.xs2;else if(3===s)r.t[r.p]=r.xs0+e+r.xs1+r.xn1+r.xs2+r.xn2+r.xs3;else if(4===s)r.t[r.p]=r.xs0+e+r.xs1+r.xn1+r.xs2+r.xn2+r.xs3+r.xn3+r.xs4;else if(5===s)r.t[r.p]=r.xs0+e+r.xs1+r.xn1+r.xs2+r.xn2+r.xs3+r.xn3+r.xs4+r.xn4+r.xs5;else{for(i=r.xs0+e+r.xs1,s=1;r.l>s;s++)i+=r["xn"+s]+r["xs"+(s+1)];r.t[r.p]=i}else-1===r.type?r.t[r.p]=r.xs0:r.setRatio&&r.setRatio(t);else r.t[r.p]=e+r.xs0;r=r._next}else for(;r;)2!==r.type?r.t[r.p]=r.b:r.setRatio(t),r=r._next;else for(;r;){if(2!==r.type)if(r.r&&-1!==r.type)if(e=Math.round(r.s+r.c),r.type){if(1===r.type){for(s=r.l,i=r.xs0+e+r.xs1,s=1;r.l>s;s++)i+=r["xn"+s]+r["xs"+(s+1)];r.t[r.p]=i}}else r.t[r.p]=e+r.xs0;else r.t[r.p]=r.e;else r.setRatio(t);r=r._next}},l._enableTransforms=function(t){this._transform=this._transform||Ne(this._target,r,!0),this._transformType=this._transform.svg&&xe||!t&&3!==this._transformType?2:3};var Ue=function(){this.t[this.p]=this.e,this.data._linkCSSP(this,this._next,null,!0)};l._addLazySet=function(t,e,i){var s=this._firstPT=new pe(t,e,0,0,this._firstPT,2);s.e=i,s.setRatio=Ue,s.data=this},l._linkCSSP=function(t,e,i,s){return t&&(e&&(e._prev=t),t._next&&(t._next._prev=t._prev),t._prev?t._prev._next=t._next:this._firstPT===t&&(this._firstPT=t._next,s=!0),i?i._next=t:s||null!==this._firstPT||(this._firstPT=t),t._next=e,t._prev=i),t},l._kill=function(e){var i,s,r,n=e;if(e.autoAlpha||e.alpha){n={};for(s in e)n[s]=e[s];n.opacity=1,n.autoAlpha&&(n.visibility=1)}return e.className&&(i=this._classNamePT)&&(r=i.xfirst,r&&r._prev?this._linkCSSP(r._prev,i._next,r._prev._prev):r===this._firstPT&&(this._firstPT=i._next),i._next&&this._linkCSSP(i._next,i._next._next,r._prev),this._classNamePT=null),t.prototype._kill.call(this,n)};var qe=function(t,e,i){var s,r,n,a;if(t.slice)for(r=t.length;--r>-1;)qe(t[r],e,i);else for(s=t.childNodes,r=s.length;--r>-1;)n=s[r],a=n.type,n.style&&(e.push(K(n)),i&&i.push(n)),1!==a&&9!==a&&11!==a||!n.childNodes.length||qe(n,e,i)};return a.cascadeTo=function(t,i,s){var r,n,a,o,h=e.to(t,i,s),l=[h],_=[],u=[],c=[],f=e._internals.reservedProps;for(t=h._targets||h.target,qe(t,_,c),h.render(i,!0,!0),qe(t,u),h.render(0,!0,!0),h._enabled(!0),r=c.length;--r>-1;)if(n=J(c[r],_[r],u[r]),n.firstMPT){n=n.difs;for(a in s)f[a]&&(n[a]=s[a]);o={};for(a in n)o[a]=_[r][a];l.push(e.fromTo(c[r],i,o,n))}return l},t.activate([a]),a},!0),function(){var t=_gsScope._gsDefine.plugin({propName:"roundProps",priority:-1,API:2,init:function(t,e,i){return this._tween=i,!0}}),e=t.prototype;e._onInitAllProps=function(){for(var t,e,i,s=this._tween,r=s.vars.roundProps instanceof Array?s.vars.roundProps:s.vars.roundProps.split(","),n=r.length,a={},o=s._propLookup.roundProps;--n>-1;)a[r[n]]=1;for(n=r.length;--n>-1;)for(t=r[n],e=s._firstPT;e;)i=e._next,e.pg?e.t._roundProps(a,!0):e.n===t&&(this._add(e.t,t,e.s,e.c),i&&(i._prev=e._prev),e._prev?e._prev._next=i:s._firstPT===e&&(s._firstPT=i),e._next=e._prev=null,s._propLookup[t]=o),e=i;return!1},e._add=function(t,e,i,s){this._addTween(t,e,i,i+s,e,!0),this._overwriteProps.push(e)}}(),function(){var t=/(?:\d|\-|\+|=|#|\.)*/g,e=/[A-Za-z%]/g;_gsScope._gsDefine.plugin({propName:"attr",API:2,version:"0.4.0",init:function(i,s){var r,n,a,o,h;if("function"!=typeof i.setAttribute)return!1;this._target=i,this._proxy={},this._start={},this._end={},this._suffix={};for(r in s)this._start[r]=this._proxy[r]=n=i.getAttribute(r)+"",this._end[r]=a=s[r]+"",this._suffix[r]=o=e.test(a)?a.replace(t,""):e.test(n)?n.replace(t,""):"",o&&(h=a.indexOf(o),-1!==h&&(a=a.substr(0,h))),this._addTween(this._proxy,r,parseFloat(n),a,r)||(this._suffix[r]=""),"="===a.charAt(1)&&(this._end[r]=this._firstPT.s+this._firstPT.c+o),this._overwriteProps.push(r);return!0},set:function(t){this._super.setRatio.call(this,t);for(var e,i=this._overwriteProps,s=i.length,r=1===t?this._end:t?this._proxy:this._start,n=r===this._proxy;--s>-1;)e=i[s],this._target.setAttribute(e,r[e]+(n?this._suffix[e]:""))}})}(),_gsScope._gsDefine.plugin({propName:"directionalRotation",version:"0.2.1",API:2,init:function(t,e){"object"!=typeof e&&(e={rotation:e}),this.finals={};var i,s,r,n,a,o,h=e.useRadians===!0?2*Math.PI:360,l=1e-6;for(i in e)"useRadians"!==i&&(o=(e[i]+"").split("_"),s=o[0],r=parseFloat("function"!=typeof t[i]?t[i]:t[i.indexOf("set")||"function"!=typeof t["get"+i.substr(3)]?i:"get"+i.substr(3)]()),n=this.finals[i]="string"==typeof s&&"="===s.charAt(1)?r+parseInt(s.charAt(0)+"1",10)*Number(s.substr(2)):Number(s)||0,a=n-r,o.length&&(s=o.join("_"),-1!==s.indexOf("short")&&(a%=h,a!==a%(h/2)&&(a=0>a?a+h:a-h)),-1!==s.indexOf("_cw")&&0>a?a=(a+9999999999*h)%h-(0|a/h)*h:-1!==s.indexOf("ccw")&&a>0&&(a=(a-9999999999*h)%h-(0|a/h)*h)),(a>l||-l>a)&&(this._addTween(t,i,r,r+a,i),this._overwriteProps.push(i)));return!0},set:function(t){var e;if(1!==t)this._super.setRatio.call(this,t);else for(e=this._firstPT;e;)e.f?e.t[e.p](this.finals[e.p]):e.t[e.p]=this.finals[e.p],e=e._next}})._autoCSS=!0,_gsScope._gsDefine("easing.Back",["easing.Ease"],function(t){var e,i,s,r=_gsScope.GreenSockGlobals||_gsScope,n=r.com.greensock,a=2*Math.PI,o=Math.PI/2,h=n._class,l=function(e,i){var s=h("easing."+e,function(){},!0),r=s.prototype=new t;return r.constructor=s,r.getRatio=i,s},_=t.register||function(){},u=function(t,e,i,s){var r=h("easing."+t,{easeOut:new e,easeIn:new i,easeInOut:new s},!0);return _(r,t),r},c=function(t,e,i){this.t=t,this.v=e,i&&(this.next=i,i.prev=this,this.c=i.v-e,this.gap=i.t-t)},f=function(e,i){var s=h("easing."+e,function(t){this._p1=t||0===t?t:1.70158,this._p2=1.525*this._p1},!0),r=s.prototype=new t;return r.constructor=s,r.getRatio=i,r.config=function(t){return new s(t)},s},p=u("Back",f("BackOut",function(t){return(t-=1)*t*((this._p1+1)*t+this._p1)+1}),f("BackIn",function(t){return t*t*((this._p1+1)*t-this._p1)}),f("BackInOut",function(t){return 1>(t*=2)?.5*t*t*((this._p2+1)*t-this._p2):.5*((t-=2)*t*((this._p2+1)*t+this._p2)+2)})),m=h("easing.SlowMo",function(t,e,i){e=e||0===e?e:.7,null==t?t=.7:t>1&&(t=1),this._p=1!==t?e:0,this._p1=(1-t)/2,this._p2=t,this._p3=this._p1+this._p2,this._calcEnd=i===!0},!0),d=m.prototype=new t;return d.constructor=m,d.getRatio=function(t){var e=t+(.5-t)*this._p;return this._p1>t?this._calcEnd?1-(t=1-t/this._p1)*t:e-(t=1-t/this._p1)*t*t*t*e:t>this._p3?this._calcEnd?1-(t=(t-this._p3)/this._p1)*t:e+(t-e)*(t=(t-this._p3)/this._p1)*t*t*t:this._calcEnd?1:e},m.ease=new m(.7,.7),d.config=m.config=function(t,e,i){return new m(t,e,i)},e=h("easing.SteppedEase",function(t){t=t||1,this._p1=1/t,this._p2=t+1},!0),d=e.prototype=new t,d.constructor=e,d.getRatio=function(t){return 0>t?t=0:t>=1&&(t=.999999999),(this._p2*t>>0)*this._p1},d.config=e.config=function(t){return new e(t)},i=h("easing.RoughEase",function(e){e=e||{};for(var i,s,r,n,a,o,h=e.taper||"none",l=[],_=0,u=0|(e.points||20),f=u,p=e.randomize!==!1,m=e.clamp===!0,d=e.template instanceof t?e.template:null,g="number"==typeof e.strength?.4*e.strength:.4;--f>-1;)i=p?Math.random():1/u*f,s=d?d.getRatio(i):i,"none"===h?r=g:"out"===h?(n=1-i,r=n*n*g):"in"===h?r=i*i*g:.5>i?(n=2*i,r=.5*n*n*g):(n=2*(1-i),r=.5*n*n*g),p?s+=Math.random()*r-.5*r:f%2?s+=.5*r:s-=.5*r,m&&(s>1?s=1:0>s&&(s=0)),l[_++]={x:i,y:s};for(l.sort(function(t,e){return t.x-e.x}),o=new c(1,1,null),f=u;--f>-1;)a=l[f],o=new c(a.x,a.y,o);this._prev=new c(0,0,0!==o.t?o:o.next)},!0),d=i.prototype=new t,d.constructor=i,d.getRatio=function(t){var e=this._prev;if(t>e.t){for(;e.next&&t>=e.t;)e=e.next;e=e.prev}else for(;e.prev&&e.t>=t;)e=e.prev;return this._prev=e,e.v+(t-e.t)/e.gap*e.c},d.config=function(t){return new i(t)},i.ease=new i,u("Bounce",l("BounceOut",function(t){return 1/2.75>t?7.5625*t*t:2/2.75>t?7.5625*(t-=1.5/2.75)*t+.75:2.5/2.75>t?7.5625*(t-=2.25/2.75)*t+.9375:7.5625*(t-=2.625/2.75)*t+.984375}),l("BounceIn",function(t){return 1/2.75>(t=1-t)?1-7.5625*t*t:2/2.75>t?1-(7.5625*(t-=1.5/2.75)*t+.75):2.5/2.75>t?1-(7.5625*(t-=2.25/2.75)*t+.9375):1-(7.5625*(t-=2.625/2.75)*t+.984375)}),l("BounceInOut",function(t){var e=.5>t;return t=e?1-2*t:2*t-1,t=1/2.75>t?7.5625*t*t:2/2.75>t?7.5625*(t-=1.5/2.75)*t+.75:2.5/2.75>t?7.5625*(t-=2.25/2.75)*t+.9375:7.5625*(t-=2.625/2.75)*t+.984375,e?.5*(1-t):.5*t+.5})),u("Circ",l("CircOut",function(t){return Math.sqrt(1-(t-=1)*t)}),l("CircIn",function(t){return-(Math.sqrt(1-t*t)-1)}),l("CircInOut",function(t){return 1>(t*=2)?-.5*(Math.sqrt(1-t*t)-1):.5*(Math.sqrt(1-(t-=2)*t)+1)})),s=function(e,i,s){var r=h("easing."+e,function(t,e){this._p1=t>=1?t:1,this._p2=(e||s)/(1>t?t:1),this._p3=this._p2/a*(Math.asin(1/this._p1)||0),this._p2=a/this._p2},!0),n=r.prototype=new t;return n.constructor=r,n.getRatio=i,n.config=function(t,e){return new r(t,e)},r},u("Elastic",s("ElasticOut",function(t){return this._p1*Math.pow(2,-10*t)*Math.sin((t-this._p3)*this._p2)+1},.3),s("ElasticIn",function(t){return-(this._p1*Math.pow(2,10*(t-=1))*Math.sin((t-this._p3)*this._p2))},.3),s("ElasticInOut",function(t){return 1>(t*=2)?-.5*this._p1*Math.pow(2,10*(t-=1))*Math.sin((t-this._p3)*this._p2):.5*this._p1*Math.pow(2,-10*(t-=1))*Math.sin((t-this._p3)*this._p2)+1},.45)),u("Expo",l("ExpoOut",function(t){return 1-Math.pow(2,-10*t)}),l("ExpoIn",function(t){return Math.pow(2,10*(t-1))-.001}),l("ExpoInOut",function(t){return 1>(t*=2)?.5*Math.pow(2,10*(t-1)):.5*(2-Math.pow(2,-10*(t-1)))})),u("Sine",l("SineOut",function(t){return Math.sin(t*o)}),l("SineIn",function(t){return-Math.cos(t*o)+1}),l("SineInOut",function(t){return-.5*(Math.cos(Math.PI*t)-1)})),h("easing.EaseLookup",{find:function(e){return t.map[e]}},!0),_(r.SlowMo,"SlowMo","ease,"),_(i,"RoughEase","ease,"),_(e,"SteppedEase","ease,"),p},!0)}),_gsScope._gsDefine&&_gsScope._gsQueue.pop()(),function(t,e){"use strict";var i=t.GreenSockGlobals=t.GreenSockGlobals||t;if(!i.TweenLite){var s,r,n,a,o,h=function(t){var e,s=t.split("."),r=i;for(e=0;s.length>e;e++)r[s[e]]=r=r[s[e]]||{};return r},l=h("com.greensock"),_=1e-10,u=function(t){var e,i=[],s=t.length;for(e=0;e!==s;i.push(t[e++]));return i},c=function(){},f=function(){var t=Object.prototype.toString,e=t.call([]);return function(i){return null!=i&&(i instanceof Array||"object"==typeof i&&!!i.push&&t.call(i)===e)}}(),p={},m=function(s,r,n,a){this.sc=p[s]?p[s].sc:[],p[s]=this,this.gsClass=null,this.func=n;var o=[];this.check=function(l){for(var _,u,c,f,d=r.length,g=d;--d>-1;)(_=p[r[d]]||new m(r[d],[])).gsClass?(o[d]=_.gsClass,g--):l&&_.sc.push(this);if(0===g&&n)for(u=("com.greensock."+s).split("."),c=u.pop(),f=h(u.join("."))[c]=this.gsClass=n.apply(n,o),a&&(i[c]=f,"function"==typeof define&&define.amd?define((t.GreenSockAMDPath?t.GreenSockAMDPath+"/":"")+s.split(".").pop(),[],function(){return f}):s===e&&"undefined"!=typeof module&&module.exports&&(module.exports=f)),d=0;this.sc.length>d;d++)this.sc[d].check()},this.check(!0)},d=t._gsDefine=function(t,e,i,s){return new m(t,e,i,s)},g=l._class=function(t,e,i){return e=e||function(){},d(t,[],function(){return e},i),e};d.globals=i;var v=[0,0,1,1],y=[],T=g("easing.Ease",function(t,e,i,s){this._func=t,this._type=i||0,this._power=s||0,this._params=e?v.concat(e):v},!0),x=T.map={},w=T.register=function(t,e,i,s){for(var r,n,a,o,h=e.split(","),_=h.length,u=(i||"easeIn,easeOut,easeInOut").split(",");--_>-1;)for(n=h[_],r=s?g("easing."+n,null,!0):l.easing[n]||{},a=u.length;--a>-1;)o=u[a],x[n+"."+o]=x[o+n]=r[o]=t.getRatio?t:t[o]||new t};for(n=T.prototype,n._calcEnd=!1,n.getRatio=function(t){if(this._func)return this._params[0]=t,this._func.apply(null,this._params);var e=this._type,i=this._power,s=1===e?1-t:2===e?t:.5>t?2*t:2*(1-t);return 1===i?s*=s:2===i?s*=s*s:3===i?s*=s*s*s:4===i&&(s*=s*s*s*s),1===e?1-s:2===e?s:.5>t?s/2:1-s/2},s=["Linear","Quad","Cubic","Quart","Quint,Strong"],r=s.length;--r>-1;)n=s[r]+",Power"+r,w(new T(null,null,1,r),n,"easeOut",!0),w(new T(null,null,2,r),n,"easeIn"+(0===r?",easeNone":"")),w(new T(null,null,3,r),n,"easeInOut");x.linear=l.easing.Linear.easeIn,x.swing=l.easing.Quad.easeInOut;var b=g("events.EventDispatcher",function(t){this._listeners={},this._eventTarget=t||this});n=b.prototype,n.addEventListener=function(t,e,i,s,r){r=r||0;var n,h,l=this._listeners[t],_=0;for(null==l&&(this._listeners[t]=l=[]),h=l.length;--h>-1;)n=l[h],n.c===e&&n.s===i?l.splice(h,1):0===_&&r>n.pr&&(_=h+1);l.splice(_,0,{c:e,s:i,up:s,pr:r}),this!==a||o||a.wake()},n.removeEventListener=function(t,e){var i,s=this._listeners[t];if(s)for(i=s.length;--i>-1;)if(s[i].c===e)return s.splice(i,1),void 0},n.dispatchEvent=function(t){var e,i,s,r=this._listeners[t];if(r)for(e=r.length,i=this._eventTarget;--e>-1;)s=r[e],s&&(s.up?s.c.call(s.s||i,{type:t,target:i}):s.c.call(s.s||i))};var P=t.requestAnimationFrame,k=t.cancelAnimationFrame,S=Date.now||function(){return(new Date).getTime()},R=S();for(s=["ms","moz","webkit","o"],r=s.length;--r>-1&&!P;)P=t[s[r]+"RequestAnimationFrame"],k=t[s[r]+"CancelAnimationFrame"]||t[s[r]+"CancelRequestAnimationFrame"];g("Ticker",function(t,e){var i,s,r,n,h,l=this,u=S(),f=e!==!1&&P,p=500,m=33,d="tick",g=function(t){var e,a,o=S()-R;o>p&&(u+=o-m),R+=o,l.time=(R-u)/1e3,e=l.time-h,(!i||e>0||t===!0)&&(l.frame++,h+=e+(e>=n?.004:n-e),a=!0),t!==!0&&(r=s(g)),a&&l.dispatchEvent(d)};b.call(l),l.time=l.frame=0,l.tick=function(){g(!0)},l.lagSmoothing=function(t,e){p=t||1/_,m=Math.min(e,p,0)},l.sleep=function(){null!=r&&(f&&k?k(r):clearTimeout(r),s=c,r=null,l===a&&(o=!1))},l.wake=function(){null!==r?l.sleep():l.frame>10&&(R=S()-p+5),s=0===i?c:f&&P?P:function(t){return setTimeout(t,0|1e3*(h-l.time)+1)},l===a&&(o=!0),g(2)},l.fps=function(t){return arguments.length?(i=t,n=1/(i||60),h=this.time+n,l.wake(),void 0):i},l.useRAF=function(t){return arguments.length?(l.sleep(),f=t,l.fps(i),void 0):f},l.fps(t),setTimeout(function(){f&&5>l.frame&&l.useRAF(!1)},1500)}),n=l.Ticker.prototype=new l.events.EventDispatcher,n.constructor=l.Ticker;var O=g("core.Animation",function(t,e){if(this.vars=e=e||{},this._duration=this._totalDuration=t||0,this._delay=Number(e.delay)||0,this._timeScale=1,this._active=e.immediateRender===!0,this.data=e.data,this._reversed=e.reversed===!0,U){o||a.wake();var i=this.vars.useFrames?j:U;i.add(this,i._time),this.vars.paused&&this.paused(!0)}});a=O.ticker=new l.Ticker,n=O.prototype,n._dirty=n._gc=n._initted=n._paused=!1,n._totalTime=n._time=0,n._rawPrevTime=-1,n._next=n._last=n._onUpdate=n._timeline=n.timeline=null,n._paused=!1;var A=function(){o&&S()-R>2e3&&a.wake(),setTimeout(A,2e3)};A(),n.play=function(t,e){return null!=t&&this.seek(t,e),this.reversed(!1).paused(!1)},n.pause=function(t,e){return null!=t&&this.seek(t,e),this.paused(!0)},n.resume=function(t,e){return null!=t&&this.seek(t,e),this.paused(!1)},n.seek=function(t,e){return this.totalTime(Number(t),e!==!1)},n.restart=function(t,e){return this.reversed(!1).paused(!1).totalTime(t?-this._delay:0,e!==!1,!0)},n.reverse=function(t,e){return null!=t&&this.seek(t||this.totalDuration(),e),this.reversed(!0).paused(!1)},n.render=function(){},n.invalidate=function(){return this._time=this._totalTime=0,this._initted=this._gc=!1,this._rawPrevTime=-1,(this._gc||!this.timeline)&&this._enabled(!0),this},n.isActive=function(){var t,e=this._timeline,i=this._startTime;return!e||!this._gc&&!this._paused&&e.isActive()&&(t=e.rawTime())>=i&&i+this.totalDuration()/this._timeScale>t},n._enabled=function(t,e){return o||a.wake(),this._gc=!t,this._active=this.isActive(),e!==!0&&(t&&!this.timeline?this._timeline.add(this,this._startTime-this._delay):!t&&this.timeline&&this._timeline._remove(this,!0)),!1},n._kill=function(){return this._enabled(!1,!1)},n.kill=function(t,e){return this._kill(t,e),this},n._uncache=function(t){for(var e=t?this:this.timeline;e;)e._dirty=!0,e=e.timeline;return this},n._swapSelfInParams=function(t){for(var e=t.length,i=t.concat();--e>-1;)"{self}"===t[e]&&(i[e]=this);return i},n._callback=function(t){var e=this.vars;e[t].apply(e[t+"Scope"]||e.callbackScope||this,e[t+"Params"]||y)},n.eventCallback=function(t,e,i,s){if("on"===(t||"").substr(0,2)){var r=this.vars;if(1===arguments.length)return r[t];null==e?delete r[t]:(r[t]=e,r[t+"Params"]=f(i)&&-1!==i.join("").indexOf("{self}")?this._swapSelfInParams(i):i,r[t+"Scope"]=s),"onUpdate"===t&&(this._onUpdate=e)}return this},n.delay=function(t){return arguments.length?(this._timeline.smoothChildTiming&&this.startTime(this._startTime+t-this._delay),this._delay=t,this):this._delay},n.duration=function(t){return arguments.length?(this._duration=this._totalDuration=t,this._uncache(!0),this._timeline.smoothChildTiming&&this._time>0&&this._time<this._duration&&0!==t&&this.totalTime(this._totalTime*(t/this._duration),!0),this):(this._dirty=!1,this._duration)},n.totalDuration=function(t){return this._dirty=!1,arguments.length?this.duration(t):this._totalDuration},n.time=function(t,e){return arguments.length?(this._dirty&&this.totalDuration(),this.totalTime(t>this._duration?this._duration:t,e)):this._time},n.totalTime=function(t,e,i){if(o||a.wake(),!arguments.length)return this._totalTime;if(this._timeline){if(0>t&&!i&&(t+=this.totalDuration()),this._timeline.smoothChildTiming){this._dirty&&this.totalDuration();var s=this._totalDuration,r=this._timeline;if(t>s&&!i&&(t=s),this._startTime=(this._paused?this._pauseTime:r._time)-(this._reversed?s-t:t)/this._timeScale,r._dirty||this._uncache(!1),r._timeline)for(;r._timeline;)r._timeline._time!==(r._startTime+r._totalTime)/r._timeScale&&r.totalTime(r._totalTime,!0),r=r._timeline}this._gc&&this._enabled(!0,!1),(this._totalTime!==t||0===this._duration)&&(this.render(t,e,!1),I.length&&V())}return this},n.progress=n.totalProgress=function(t,e){return arguments.length?this.totalTime(this.duration()*t,e):this._time/this.duration()},n.startTime=function(t){return arguments.length?(t!==this._startTime&&(this._startTime=t,this.timeline&&this.timeline._sortChildren&&this.timeline.add(this,t-this._delay)),this):this._startTime},n.endTime=function(t){return this._startTime+(0!=t?this.totalDuration():this.duration())/this._timeScale},n.timeScale=function(t){if(!arguments.length)return this._timeScale;if(t=t||_,this._timeline&&this._timeline.smoothChildTiming){var e=this._pauseTime,i=e||0===e?e:this._timeline.totalTime();this._startTime=i-(i-this._startTime)*this._timeScale/t}return this._timeScale=t,this._uncache(!1)},n.reversed=function(t){return arguments.length?(t!=this._reversed&&(this._reversed=t,this.totalTime(this._timeline&&!this._timeline.smoothChildTiming?this.totalDuration()-this._totalTime:this._totalTime,!0)),this):this._reversed},n.paused=function(t){if(!arguments.length)return this._paused;var e,i,s=this._timeline;return t!=this._paused&&s&&(o||t||a.wake(),e=s.rawTime(),i=e-this._pauseTime,!t&&s.smoothChildTiming&&(this._startTime+=i,this._uncache(!1)),this._pauseTime=t?e:null,this._paused=t,this._active=this.isActive(),!t&&0!==i&&this._initted&&this.duration()&&this.render(s.smoothChildTiming?this._totalTime:(e-this._startTime)/this._timeScale,!0,!0)),this._gc&&!t&&this._enabled(!0,!1),this};var C=g("core.SimpleTimeline",function(t){O.call(this,0,t),this.autoRemoveChildren=this.smoothChildTiming=!0});n=C.prototype=new O,n.constructor=C,n.kill()._gc=!1,n._first=n._last=n._recent=null,n._sortChildren=!1,n.add=n.insert=function(t,e){var i,s;if(t._startTime=Number(e||0)+t._delay,t._paused&&this!==t._timeline&&(t._pauseTime=t._startTime+(this.rawTime()-t._startTime)/t._timeScale),t.timeline&&t.timeline._remove(t,!0),t.timeline=t._timeline=this,t._gc&&t._enabled(!0,!0),i=this._last,this._sortChildren)for(s=t._startTime;i&&i._startTime>s;)i=i._prev;return i?(t._next=i._next,i._next=t):(t._next=this._first,this._first=t),t._next?t._next._prev=t:this._last=t,t._prev=i,this._recent=t,this._timeline&&this._uncache(!0),this},n._remove=function(t,e){return t.timeline===this&&(e||t._enabled(!1,!0),t._prev?t._prev._next=t._next:this._first===t&&(this._first=t._next),t._next?t._next._prev=t._prev:this._last===t&&(this._last=t._prev),t._next=t._prev=t.timeline=null,t===this._recent&&(this._recent=this._last),this._timeline&&this._uncache(!0)),this},n.render=function(t,e,i){var s,r=this._first;for(this._totalTime=this._time=this._rawPrevTime=t;r;)s=r._next,(r._active||t>=r._startTime&&!r._paused)&&(r._reversed?r.render((r._dirty?r.totalDuration():r._totalDuration)-(t-r._startTime)*r._timeScale,e,i):r.render((t-r._startTime)*r._timeScale,e,i)),r=s},n.rawTime=function(){return o||a.wake(),this._totalTime};var D=g("TweenLite",function(e,i,s){if(O.call(this,i,s),this.render=D.prototype.render,null==e)throw"Cannot tween a null target.";this.target=e="string"!=typeof e?e:D.selector(e)||e;var r,n,a,o=e.jquery||e.length&&e!==t&&e[0]&&(e[0]===t||e[0].nodeType&&e[0].style&&!e.nodeType),h=this.vars.overwrite;if(this._overwrite=h=null==h?Y[D.defaultOverwrite]:"number"==typeof h?h>>0:Y[h],(o||e instanceof Array||e.push&&f(e))&&"number"!=typeof e[0])for(this._targets=a=u(e),this._propLookup=[],this._siblings=[],r=0;a.length>r;r++)n=a[r],n?"string"!=typeof n?n.length&&n!==t&&n[0]&&(n[0]===t||n[0].nodeType&&n[0].style&&!n.nodeType)?(a.splice(r--,1),this._targets=a=a.concat(u(n))):(this._siblings[r]=G(n,this,!1),1===h&&this._siblings[r].length>1&&Z(n,this,null,1,this._siblings[r])):(n=a[r--]=D.selector(n),"string"==typeof n&&a.splice(r+1,1)):a.splice(r--,1);else this._propLookup={},this._siblings=G(e,this,!1),1===h&&this._siblings.length>1&&Z(e,this,null,1,this._siblings);(this.vars.immediateRender||0===i&&0===this._delay&&this.vars.immediateRender!==!1)&&(this._time=-_,this.render(-this._delay))},!0),M=function(e){return e&&e.length&&e!==t&&e[0]&&(e[0]===t||e[0].nodeType&&e[0].style&&!e.nodeType)},z=function(t,e){var i,s={};for(i in t)B[i]||i in e&&"transform"!==i&&"x"!==i&&"y"!==i&&"width"!==i&&"height"!==i&&"className"!==i&&"border"!==i||!(!E[i]||E[i]&&E[i]._autoCSS)||(s[i]=t[i],delete t[i]);t.css=s};n=D.prototype=new O,n.constructor=D,n.kill()._gc=!1,n.ratio=0,n._firstPT=n._targets=n._overwrittenProps=n._startAt=null,n._notifyPluginsOfEnabled=n._lazy=!1,D.version="1.17.0",D.defaultEase=n._ease=new T(null,null,1,1),D.defaultOverwrite="auto",D.ticker=a,D.autoSleep=120,D.lagSmoothing=function(t,e){a.lagSmoothing(t,e)},D.selector=t.$||t.jQuery||function(e){var i=t.$||t.jQuery;return i?(D.selector=i,i(e)):"undefined"==typeof document?e:document.querySelectorAll?document.querySelectorAll(e):document.getElementById("#"===e.charAt(0)?e.substr(1):e)};var I=[],F={},N=D._internals={isArray:f,isSelector:M,lazyTweens:I},E=D._plugins={},L=N.tweenLookup={},X=0,B=N.reservedProps={ease:1,delay:1,overwrite:1,onComplete:1,onCompleteParams:1,onCompleteScope:1,useFrames:1,runBackwards:1,startAt:1,onUpdate:1,onUpdateParams:1,onUpdateScope:1,onStart:1,onStartParams:1,onStartScope:1,onReverseComplete:1,onReverseCompleteParams:1,onReverseCompleteScope:1,onRepeat:1,onRepeatParams:1,onRepeatScope:1,easeParams:1,yoyo:1,immediateRender:1,repeat:1,repeatDelay:1,data:1,paused:1,reversed:1,autoCSS:1,lazy:1,onOverwrite:1,callbackScope:1},Y={none:0,all:1,auto:2,concurrent:3,allOnStart:4,preexisting:5,"true":1,"false":0},j=O._rootFramesTimeline=new C,U=O._rootTimeline=new C,q=30,V=N.lazyRender=function(){var t,e=I.length;for(F={};--e>-1;)t=I[e],t&&t._lazy!==!1&&(t.render(t._lazy[0],t._lazy[1],!0),t._lazy=!1);I.length=0};U._startTime=a.time,j._startTime=a.frame,U._active=j._active=!0,setTimeout(V,1),O._updateRoot=D.render=function(){var t,e,i;if(I.length&&V(),U.render((a.time-U._startTime)*U._timeScale,!1,!1),j.render((a.frame-j._startTime)*j._timeScale,!1,!1),I.length&&V(),a.frame>=q){q=a.frame+(parseInt(D.autoSleep,10)||120);for(i in L){for(e=L[i].tweens,t=e.length;--t>-1;)e[t]._gc&&e.splice(t,1);0===e.length&&delete L[i]}if(i=U._first,(!i||i._paused)&&D.autoSleep&&!j._first&&1===a._listeners.tick.length){for(;i&&i._paused;)i=i._next;i||a.sleep()}}},a.addEventListener("tick",O._updateRoot);var G=function(t,e,i){var s,r,n=t._gsTweenID;if(L[n||(t._gsTweenID=n="t"+X++)]||(L[n]={target:t,tweens:[]}),e&&(s=L[n].tweens,s[r=s.length]=e,i))for(;--r>-1;)s[r]===e&&s.splice(r,1);return L[n].tweens},W=function(t,e,i,s){var r,n,a=t.vars.onOverwrite;return a&&(r=a(t,e,i,s)),a=D.onOverwrite,a&&(n=a(t,e,i,s)),r!==!1&&n!==!1},Z=function(t,e,i,s,r){var n,a,o,h;if(1===s||s>=4){for(h=r.length,n=0;h>n;n++)if((o=r[n])!==e)o._gc||o._kill(null,t,e)&&(a=!0);else if(5===s)break;return a}var l,u=e._startTime+_,c=[],f=0,p=0===e._duration;for(n=r.length;--n>-1;)(o=r[n])===e||o._gc||o._paused||(o._timeline!==e._timeline?(l=l||Q(e,0,p),0===Q(o,l,p)&&(c[f++]=o)):u>=o._startTime&&o._startTime+o.totalDuration()/o._timeScale>u&&((p||!o._initted)&&2e-10>=u-o._startTime||(c[f++]=o)));for(n=f;--n>-1;)if(o=c[n],2===s&&o._kill(i,t,e)&&(a=!0),2!==s||!o._firstPT&&o._initted){if(2!==s&&!W(o,e))continue;o._enabled(!1,!1)&&(a=!0)}return a},Q=function(t,e,i){for(var s=t._timeline,r=s._timeScale,n=t._startTime;s._timeline;){if(n+=s._startTime,r*=s._timeScale,s._paused)return-100;s=s._timeline}return n/=r,n>e?n-e:i&&n===e||!t._initted&&2*_>n-e?_:(n+=t.totalDuration()/t._timeScale/r)>e+_?0:n-e-_};n._init=function(){var t,e,i,s,r,n=this.vars,a=this._overwrittenProps,o=this._duration,h=!!n.immediateRender,l=n.ease;if(n.startAt){this._startAt&&(this._startAt.render(-1,!0),this._startAt.kill()),r={};for(s in n.startAt)r[s]=n.startAt[s];if(r.overwrite=!1,r.immediateRender=!0,r.lazy=h&&n.lazy!==!1,r.startAt=r.delay=null,this._startAt=D.to(this.target,0,r),h)if(this._time>0)this._startAt=null;else if(0!==o)return}else if(n.runBackwards&&0!==o)if(this._startAt)this._startAt.render(-1,!0),this._startAt.kill(),this._startAt=null;else{0!==this._time&&(h=!1),i={};for(s in n)B[s]&&"autoCSS"!==s||(i[s]=n[s]);if(i.overwrite=0,i.data="isFromStart",i.lazy=h&&n.lazy!==!1,i.immediateRender=h,this._startAt=D.to(this.target,0,i),h){if(0===this._time)return}else this._startAt._init(),this._startAt._enabled(!1),this.vars.immediateRender&&(this._startAt=null)}if(this._ease=l=l?l instanceof T?l:"function"==typeof l?new T(l,n.easeParams):x[l]||D.defaultEase:D.defaultEase,n.easeParams instanceof Array&&l.config&&(this._ease=l.config.apply(l,n.easeParams)),this._easeType=this._ease._type,this._easePower=this._ease._power,this._firstPT=null,this._targets)for(t=this._targets.length;--t>-1;)this._initProps(this._targets[t],this._propLookup[t]={},this._siblings[t],a?a[t]:null)&&(e=!0);else e=this._initProps(this.target,this._propLookup,this._siblings,a);if(e&&D._onPluginEvent("_onInitAllProps",this),a&&(this._firstPT||"function"!=typeof this.target&&this._enabled(!1,!1)),n.runBackwards)for(i=this._firstPT;i;)i.s+=i.c,i.c=-i.c,i=i._next;this._onUpdate=n.onUpdate,this._initted=!0},n._initProps=function(e,i,s,r){var n,a,o,h,l,_;if(null==e)return!1;F[e._gsTweenID]&&V(),this.vars.css||e.style&&e!==t&&e.nodeType&&E.css&&this.vars.autoCSS!==!1&&z(this.vars,e);for(n in this.vars){if(_=this.vars[n],B[n])_&&(_ instanceof Array||_.push&&f(_))&&-1!==_.join("").indexOf("{self}")&&(this.vars[n]=_=this._swapSelfInParams(_,this));else if(E[n]&&(h=new E[n])._onInitTween(e,this.vars[n],this)){for(this._firstPT=l={_next:this._firstPT,t:h,p:"setRatio",s:0,c:1,f:!0,n:n,pg:!0,pr:h._priority},a=h._overwriteProps.length;--a>-1;)i[h._overwriteProps[a]]=this._firstPT;(h._priority||h._onInitAllProps)&&(o=!0),(h._onDisable||h._onEnable)&&(this._notifyPluginsOfEnabled=!0)}else this._firstPT=i[n]=l={_next:this._firstPT,t:e,p:n,f:"function"==typeof e[n],n:n,pg:!1,pr:0},l.s=l.f?e[n.indexOf("set")||"function"!=typeof e["get"+n.substr(3)]?n:"get"+n.substr(3)]():parseFloat(e[n]),l.c="string"==typeof _&&"="===_.charAt(1)?parseInt(_.charAt(0)+"1",10)*Number(_.substr(2)):Number(_)-l.s||0;l&&l._next&&(l._next._prev=l)}return r&&this._kill(r,e)?this._initProps(e,i,s,r):this._overwrite>1&&this._firstPT&&s.length>1&&Z(e,this,i,this._overwrite,s)?(this._kill(i,e),this._initProps(e,i,s,r)):(this._firstPT&&(this.vars.lazy!==!1&&this._duration||this.vars.lazy&&!this._duration)&&(F[e._gsTweenID]=!0),o)
},n.render=function(t,e,i){var s,r,n,a,o=this._time,h=this._duration,l=this._rawPrevTime;if(t>=h)this._totalTime=this._time=h,this.ratio=this._ease._calcEnd?this._ease.getRatio(1):1,this._reversed||(s=!0,r="onComplete",i=i||this._timeline.autoRemoveChildren),0===h&&(this._initted||!this.vars.lazy||i)&&(this._startTime===this._timeline._duration&&(t=0),(0===t||0>l||l===_&&"isPause"!==this.data)&&l!==t&&(i=!0,l>_&&(r="onReverseComplete")),this._rawPrevTime=a=!e||t||l===t?t:_);else if(1e-7>t)this._totalTime=this._time=0,this.ratio=this._ease._calcEnd?this._ease.getRatio(0):0,(0!==o||0===h&&l>0)&&(r="onReverseComplete",s=this._reversed),0>t&&(this._active=!1,0===h&&(this._initted||!this.vars.lazy||i)&&(l>=0&&(l!==_||"isPause"!==this.data)&&(i=!0),this._rawPrevTime=a=!e||t||l===t?t:_)),this._initted||(i=!0);else if(this._totalTime=this._time=t,this._easeType){var u=t/h,c=this._easeType,f=this._easePower;(1===c||3===c&&u>=.5)&&(u=1-u),3===c&&(u*=2),1===f?u*=u:2===f?u*=u*u:3===f?u*=u*u*u:4===f&&(u*=u*u*u*u),this.ratio=1===c?1-u:2===c?u:.5>t/h?u/2:1-u/2}else this.ratio=this._ease.getRatio(t/h);if(this._time!==o||i){if(!this._initted){if(this._init(),!this._initted||this._gc)return;if(!i&&this._firstPT&&(this.vars.lazy!==!1&&this._duration||this.vars.lazy&&!this._duration))return this._time=this._totalTime=o,this._rawPrevTime=l,I.push(this),this._lazy=[t,e],void 0;this._time&&!s?this.ratio=this._ease.getRatio(this._time/h):s&&this._ease._calcEnd&&(this.ratio=this._ease.getRatio(0===this._time?0:1))}for(this._lazy!==!1&&(this._lazy=!1),this._active||!this._paused&&this._time!==o&&t>=0&&(this._active=!0),0===o&&(this._startAt&&(t>=0?this._startAt.render(t,e,i):r||(r="_dummyGS")),this.vars.onStart&&(0!==this._time||0===h)&&(e||this._callback("onStart"))),n=this._firstPT;n;)n.f?n.t[n.p](n.c*this.ratio+n.s):n.t[n.p]=n.c*this.ratio+n.s,n=n._next;this._onUpdate&&(0>t&&this._startAt&&t!==-1e-4&&this._startAt.render(t,e,i),e||(this._time!==o||s)&&this._callback("onUpdate")),r&&(!this._gc||i)&&(0>t&&this._startAt&&!this._onUpdate&&t!==-1e-4&&this._startAt.render(t,e,i),s&&(this._timeline.autoRemoveChildren&&this._enabled(!1,!1),this._active=!1),!e&&this.vars[r]&&this._callback(r),0===h&&this._rawPrevTime===_&&a!==_&&(this._rawPrevTime=0))}},n._kill=function(t,e,i){if("all"===t&&(t=null),null==t&&(null==e||e===this.target))return this._lazy=!1,this._enabled(!1,!1);e="string"!=typeof e?e||this._targets||this.target:D.selector(e)||e;var s,r,n,a,o,h,l,_,u,c=i&&this._time&&i._startTime===this._startTime&&this._timeline===i._timeline;if((f(e)||M(e))&&"number"!=typeof e[0])for(s=e.length;--s>-1;)this._kill(t,e[s],i)&&(h=!0);else{if(this._targets){for(s=this._targets.length;--s>-1;)if(e===this._targets[s]){o=this._propLookup[s]||{},this._overwrittenProps=this._overwrittenProps||[],r=this._overwrittenProps[s]=t?this._overwrittenProps[s]||{}:"all";break}}else{if(e!==this.target)return!1;o=this._propLookup,r=this._overwrittenProps=t?this._overwrittenProps||{}:"all"}if(o){if(l=t||o,_=t!==r&&"all"!==r&&t!==o&&("object"!=typeof t||!t._tempKill),i&&(D.onOverwrite||this.vars.onOverwrite)){for(n in l)o[n]&&(u||(u=[]),u.push(n));if((u||!t)&&!W(this,i,e,u))return!1}for(n in l)(a=o[n])&&(c&&(a.f?a.t[a.p](a.s):a.t[a.p]=a.s,h=!0),a.pg&&a.t._kill(l)&&(h=!0),a.pg&&0!==a.t._overwriteProps.length||(a._prev?a._prev._next=a._next:a===this._firstPT&&(this._firstPT=a._next),a._next&&(a._next._prev=a._prev),a._next=a._prev=null),delete o[n]),_&&(r[n]=1);!this._firstPT&&this._initted&&this._enabled(!1,!1)}}return h},n.invalidate=function(){return this._notifyPluginsOfEnabled&&D._onPluginEvent("_onDisable",this),this._firstPT=this._overwrittenProps=this._startAt=this._onUpdate=null,this._notifyPluginsOfEnabled=this._active=this._lazy=!1,this._propLookup=this._targets?{}:[],O.prototype.invalidate.call(this),this.vars.immediateRender&&(this._time=-_,this.render(-this._delay)),this},n._enabled=function(t,e){if(o||a.wake(),t&&this._gc){var i,s=this._targets;if(s)for(i=s.length;--i>-1;)this._siblings[i]=G(s[i],this,!0);else this._siblings=G(this.target,this,!0)}return O.prototype._enabled.call(this,t,e),this._notifyPluginsOfEnabled&&this._firstPT?D._onPluginEvent(t?"_onEnable":"_onDisable",this):!1},D.to=function(t,e,i){return new D(t,e,i)},D.from=function(t,e,i){return i.runBackwards=!0,i.immediateRender=0!=i.immediateRender,new D(t,e,i)},D.fromTo=function(t,e,i,s){return s.startAt=i,s.immediateRender=0!=s.immediateRender&&0!=i.immediateRender,new D(t,e,s)},D.delayedCall=function(t,e,i,s,r){return new D(e,0,{delay:t,onComplete:e,onCompleteParams:i,callbackScope:s,onReverseComplete:e,onReverseCompleteParams:i,immediateRender:!1,lazy:!1,useFrames:r,overwrite:0})},D.set=function(t,e){return new D(t,0,e)},D.getTweensOf=function(t,e){if(null==t)return[];t="string"!=typeof t?t:D.selector(t)||t;var i,s,r,n;if((f(t)||M(t))&&"number"!=typeof t[0]){for(i=t.length,s=[];--i>-1;)s=s.concat(D.getTweensOf(t[i],e));for(i=s.length;--i>-1;)for(n=s[i],r=i;--r>-1;)n===s[r]&&s.splice(i,1)}else for(s=G(t).concat(),i=s.length;--i>-1;)(s[i]._gc||e&&!s[i].isActive())&&s.splice(i,1);return s},D.killTweensOf=D.killDelayedCallsTo=function(t,e,i){"object"==typeof e&&(i=e,e=!1);for(var s=D.getTweensOf(t,e),r=s.length;--r>-1;)s[r]._kill(i,t)};var $=g("plugins.TweenPlugin",function(t,e){this._overwriteProps=(t||"").split(","),this._propName=this._overwriteProps[0],this._priority=e||0,this._super=$.prototype},!0);if(n=$.prototype,$.version="1.10.1",$.API=2,n._firstPT=null,n._addTween=function(t,e,i,s,r,n){var a,o;return null!=s&&(a="number"==typeof s||"="!==s.charAt(1)?Number(s)-Number(i):parseInt(s.charAt(0)+"1",10)*Number(s.substr(2)))?(this._firstPT=o={_next:this._firstPT,t:t,p:e,s:i,c:a,f:"function"==typeof t[e],n:r||e,r:n},o._next&&(o._next._prev=o),o):void 0},n.setRatio=function(t){for(var e,i=this._firstPT,s=1e-6;i;)e=i.c*t+i.s,i.r?e=Math.round(e):s>e&&e>-s&&(e=0),i.f?i.t[i.p](e):i.t[i.p]=e,i=i._next},n._kill=function(t){var e,i=this._overwriteProps,s=this._firstPT;if(null!=t[this._propName])this._overwriteProps=[];else for(e=i.length;--e>-1;)null!=t[i[e]]&&i.splice(e,1);for(;s;)null!=t[s.n]&&(s._next&&(s._next._prev=s._prev),s._prev?(s._prev._next=s._next,s._prev=null):this._firstPT===s&&(this._firstPT=s._next)),s=s._next;return!1},n._roundProps=function(t,e){for(var i=this._firstPT;i;)(t[this._propName]||null!=i.n&&t[i.n.split(this._propName+"_").join("")])&&(i.r=e),i=i._next},D._onPluginEvent=function(t,e){var i,s,r,n,a,o=e._firstPT;if("_onInitAllProps"===t){for(;o;){for(a=o._next,s=r;s&&s.pr>o.pr;)s=s._next;(o._prev=s?s._prev:n)?o._prev._next=o:r=o,(o._next=s)?s._prev=o:n=o,o=a}o=e._firstPT=r}for(;o;)o.pg&&"function"==typeof o.t[t]&&o.t[t]()&&(i=!0),o=o._next;return i},$.activate=function(t){for(var e=t.length;--e>-1;)t[e].API===$.API&&(E[(new t[e])._propName]=t[e]);return!0},d.plugin=function(t){if(!(t&&t.propName&&t.init&&t.API))throw"illegal plugin definition.";var e,i=t.propName,s=t.priority||0,r=t.overwriteProps,n={init:"_onInitTween",set:"setRatio",kill:"_kill",round:"_roundProps",initAll:"_onInitAllProps"},a=g("plugins."+i.charAt(0).toUpperCase()+i.substr(1)+"Plugin",function(){$.call(this,i,s),this._overwriteProps=r||[]},t.global===!0),o=a.prototype=new $(i);o.constructor=a,a.API=t.API;for(e in n)"function"==typeof t[e]&&(o[n[e]]=t[e]);return a.version=t.version,$.activate([a]),a},s=t._gsQueue){for(r=0;s.length>r;r++)s[r]();for(n in p)p[n].func||t.console.log("GSAP encountered missing dependency: com.greensock."+n)}o=!1}}("undefined"!=typeof module&&module.exports&&"undefined"!=typeof global?global:this||window,"TweenMax");
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.
(function(){function n(n){function t(t,r,e,u,i,o){for(;i>=0&&o>i;i+=n){var a=u?u[i]:i;e=r(e,t[a],a,t)}return e}return function(r,e,u,i){e=b(e,i,4);var o=!k(r)&&m.keys(r),a=(o||r).length,c=n>0?0:a-1;return arguments.length<3&&(u=r[o?o[c]:c],c+=n),t(r,e,u,o,c,a)}}function t(n){return function(t,r,e){r=x(r,e);for(var u=O(t),i=n>0?0:u-1;i>=0&&u>i;i+=n)if(r(t[i],i,t))return i;return-1}}function r(n,t,r){return function(e,u,i){var o=0,a=O(e);if("number"==typeof i)n>0?o=i>=0?i:Math.max(i+a,o):a=i>=0?Math.min(i+1,a):i+a+1;else if(r&&i&&a)return i=r(e,u),e[i]===u?i:-1;if(u!==u)return i=t(l.call(e,o,a),m.isNaN),i>=0?i+o:-1;for(i=n>0?o:a-1;i>=0&&a>i;i+=n)if(e[i]===u)return i;return-1}}function e(n,t){var r=I.length,e=n.constructor,u=m.isFunction(e)&&e.prototype||a,i="constructor";for(m.has(n,i)&&!m.contains(t,i)&&t.push(i);r--;)i=I[r],i in n&&n[i]!==u[i]&&!m.contains(t,i)&&t.push(i)}var u=this,i=u._,o=Array.prototype,a=Object.prototype,c=Function.prototype,f=o.push,l=o.slice,s=a.toString,p=a.hasOwnProperty,h=Array.isArray,v=Object.keys,g=c.bind,y=Object.create,d=function(){},m=function(n){return n instanceof m?n:this instanceof m?void(this._wrapped=n):new m(n)};"undefined"!=typeof exports?("undefined"!=typeof module&&module.exports&&(exports=module.exports=m),exports._=m):u._=m,m.VERSION="1.8.3";var b=function(n,t,r){if(t===void 0)return n;switch(null==r?3:r){case 1:return function(r){return n.call(t,r)};case 2:return function(r,e){return n.call(t,r,e)};case 3:return function(r,e,u){return n.call(t,r,e,u)};case 4:return function(r,e,u,i){return n.call(t,r,e,u,i)}}return function(){return n.apply(t,arguments)}},x=function(n,t,r){return null==n?m.identity:m.isFunction(n)?b(n,t,r):m.isObject(n)?m.matcher(n):m.property(n)};m.iteratee=function(n,t){return x(n,t,1/0)};var _=function(n,t){return function(r){var e=arguments.length;if(2>e||null==r)return r;for(var u=1;e>u;u++)for(var i=arguments[u],o=n(i),a=o.length,c=0;a>c;c++){var f=o[c];t&&r[f]!==void 0||(r[f]=i[f])}return r}},j=function(n){if(!m.isObject(n))return{};if(y)return y(n);d.prototype=n;var t=new d;return d.prototype=null,t},w=function(n){return function(t){return null==t?void 0:t[n]}},A=Math.pow(2,53)-1,O=w("length"),k=function(n){var t=O(n);return"number"==typeof t&&t>=0&&A>=t};m.each=m.forEach=function(n,t,r){t=b(t,r);var e,u;if(k(n))for(e=0,u=n.length;u>e;e++)t(n[e],e,n);else{var i=m.keys(n);for(e=0,u=i.length;u>e;e++)t(n[i[e]],i[e],n)}return n},m.map=m.collect=function(n,t,r){t=x(t,r);for(var e=!k(n)&&m.keys(n),u=(e||n).length,i=Array(u),o=0;u>o;o++){var a=e?e[o]:o;i[o]=t(n[a],a,n)}return i},m.reduce=m.foldl=m.inject=n(1),m.reduceRight=m.foldr=n(-1),m.find=m.detect=function(n,t,r){var e;return e=k(n)?m.findIndex(n,t,r):m.findKey(n,t,r),e!==void 0&&e!==-1?n[e]:void 0},m.filter=m.select=function(n,t,r){var e=[];return t=x(t,r),m.each(n,function(n,r,u){t(n,r,u)&&e.push(n)}),e},m.reject=function(n,t,r){return m.filter(n,m.negate(x(t)),r)},m.every=m.all=function(n,t,r){t=x(t,r);for(var e=!k(n)&&m.keys(n),u=(e||n).length,i=0;u>i;i++){var o=e?e[i]:i;if(!t(n[o],o,n))return!1}return!0},m.some=m.any=function(n,t,r){t=x(t,r);for(var e=!k(n)&&m.keys(n),u=(e||n).length,i=0;u>i;i++){var o=e?e[i]:i;if(t(n[o],o,n))return!0}return!1},m.contains=m.includes=m.include=function(n,t,r,e){return k(n)||(n=m.values(n)),("number"!=typeof r||e)&&(r=0),m.indexOf(n,t,r)>=0},m.invoke=function(n,t){var r=l.call(arguments,2),e=m.isFunction(t);return m.map(n,function(n){var u=e?t:n[t];return null==u?u:u.apply(n,r)})},m.pluck=function(n,t){return m.map(n,m.property(t))},m.where=function(n,t){return m.filter(n,m.matcher(t))},m.findWhere=function(n,t){return m.find(n,m.matcher(t))},m.max=function(n,t,r){var e,u,i=-1/0,o=-1/0;if(null==t&&null!=n){n=k(n)?n:m.values(n);for(var a=0,c=n.length;c>a;a++)e=n[a],e>i&&(i=e)}else t=x(t,r),m.each(n,function(n,r,e){u=t(n,r,e),(u>o||u===-1/0&&i===-1/0)&&(i=n,o=u)});return i},m.min=function(n,t,r){var e,u,i=1/0,o=1/0;if(null==t&&null!=n){n=k(n)?n:m.values(n);for(var a=0,c=n.length;c>a;a++)e=n[a],i>e&&(i=e)}else t=x(t,r),m.each(n,function(n,r,e){u=t(n,r,e),(o>u||1/0===u&&1/0===i)&&(i=n,o=u)});return i},m.shuffle=function(n){for(var t,r=k(n)?n:m.values(n),e=r.length,u=Array(e),i=0;e>i;i++)t=m.random(0,i),t!==i&&(u[i]=u[t]),u[t]=r[i];return u},m.sample=function(n,t,r){return null==t||r?(k(n)||(n=m.values(n)),n[m.random(n.length-1)]):m.shuffle(n).slice(0,Math.max(0,t))},m.sortBy=function(n,t,r){return t=x(t,r),m.pluck(m.map(n,function(n,r,e){return{value:n,index:r,criteria:t(n,r,e)}}).sort(function(n,t){var r=n.criteria,e=t.criteria;if(r!==e){if(r>e||r===void 0)return 1;if(e>r||e===void 0)return-1}return n.index-t.index}),"value")};var F=function(n){return function(t,r,e){var u={};return r=x(r,e),m.each(t,function(e,i){var o=r(e,i,t);n(u,e,o)}),u}};m.groupBy=F(function(n,t,r){m.has(n,r)?n[r].push(t):n[r]=[t]}),m.indexBy=F(function(n,t,r){n[r]=t}),m.countBy=F(function(n,t,r){m.has(n,r)?n[r]++:n[r]=1}),m.toArray=function(n){return n?m.isArray(n)?l.call(n):k(n)?m.map(n,m.identity):m.values(n):[]},m.size=function(n){return null==n?0:k(n)?n.length:m.keys(n).length},m.partition=function(n,t,r){t=x(t,r);var e=[],u=[];return m.each(n,function(n,r,i){(t(n,r,i)?e:u).push(n)}),[e,u]},m.first=m.head=m.take=function(n,t,r){return null==n?void 0:null==t||r?n[0]:m.initial(n,n.length-t)},m.initial=function(n,t,r){return l.call(n,0,Math.max(0,n.length-(null==t||r?1:t)))},m.last=function(n,t,r){return null==n?void 0:null==t||r?n[n.length-1]:m.rest(n,Math.max(0,n.length-t))},m.rest=m.tail=m.drop=function(n,t,r){return l.call(n,null==t||r?1:t)},m.compact=function(n){return m.filter(n,m.identity)};var S=function(n,t,r,e){for(var u=[],i=0,o=e||0,a=O(n);a>o;o++){var c=n[o];if(k(c)&&(m.isArray(c)||m.isArguments(c))){t||(c=S(c,t,r));var f=0,l=c.length;for(u.length+=l;l>f;)u[i++]=c[f++]}else r||(u[i++]=c)}return u};m.flatten=function(n,t){return S(n,t,!1)},m.without=function(n){return m.difference(n,l.call(arguments,1))},m.uniq=m.unique=function(n,t,r,e){m.isBoolean(t)||(e=r,r=t,t=!1),null!=r&&(r=x(r,e));for(var u=[],i=[],o=0,a=O(n);a>o;o++){var c=n[o],f=r?r(c,o,n):c;t?(o&&i===f||u.push(c),i=f):r?m.contains(i,f)||(i.push(f),u.push(c)):m.contains(u,c)||u.push(c)}return u},m.union=function(){return m.uniq(S(arguments,!0,!0))},m.intersection=function(n){for(var t=[],r=arguments.length,e=0,u=O(n);u>e;e++){var i=n[e];if(!m.contains(t,i)){for(var o=1;r>o&&m.contains(arguments[o],i);o++);o===r&&t.push(i)}}return t},m.difference=function(n){var t=S(arguments,!0,!0,1);return m.filter(n,function(n){return!m.contains(t,n)})},m.zip=function(){return m.unzip(arguments)},m.unzip=function(n){for(var t=n&&m.max(n,O).length||0,r=Array(t),e=0;t>e;e++)r[e]=m.pluck(n,e);return r},m.object=function(n,t){for(var r={},e=0,u=O(n);u>e;e++)t?r[n[e]]=t[e]:r[n[e][0]]=n[e][1];return r},m.findIndex=t(1),m.findLastIndex=t(-1),m.sortedIndex=function(n,t,r,e){r=x(r,e,1);for(var u=r(t),i=0,o=O(n);o>i;){var a=Math.floor((i+o)/2);r(n[a])<u?i=a+1:o=a}return i},m.indexOf=r(1,m.findIndex,m.sortedIndex),m.lastIndexOf=r(-1,m.findLastIndex),m.range=function(n,t,r){null==t&&(t=n||0,n=0),r=r||1;for(var e=Math.max(Math.ceil((t-n)/r),0),u=Array(e),i=0;e>i;i++,n+=r)u[i]=n;return u};var E=function(n,t,r,e,u){if(!(e instanceof t))return n.apply(r,u);var i=j(n.prototype),o=n.apply(i,u);return m.isObject(o)?o:i};m.bind=function(n,t){if(g&&n.bind===g)return g.apply(n,l.call(arguments,1));if(!m.isFunction(n))throw new TypeError("Bind must be called on a function");var r=l.call(arguments,2),e=function(){return E(n,e,t,this,r.concat(l.call(arguments)))};return e},m.partial=function(n){var t=l.call(arguments,1),r=function(){for(var e=0,u=t.length,i=Array(u),o=0;u>o;o++)i[o]=t[o]===m?arguments[e++]:t[o];for(;e<arguments.length;)i.push(arguments[e++]);return E(n,r,this,this,i)};return r},m.bindAll=function(n){var t,r,e=arguments.length;if(1>=e)throw new Error("bindAll must be passed function names");for(t=1;e>t;t++)r=arguments[t],n[r]=m.bind(n[r],n);return n},m.memoize=function(n,t){var r=function(e){var u=r.cache,i=""+(t?t.apply(this,arguments):e);return m.has(u,i)||(u[i]=n.apply(this,arguments)),u[i]};return r.cache={},r},m.delay=function(n,t){var r=l.call(arguments,2);return setTimeout(function(){return n.apply(null,r)},t)},m.defer=m.partial(m.delay,m,1),m.throttle=function(n,t,r){var e,u,i,o=null,a=0;r||(r={});var c=function(){a=r.leading===!1?0:m.now(),o=null,i=n.apply(e,u),o||(e=u=null)};return function(){var f=m.now();a||r.leading!==!1||(a=f);var l=t-(f-a);return e=this,u=arguments,0>=l||l>t?(o&&(clearTimeout(o),o=null),a=f,i=n.apply(e,u),o||(e=u=null)):o||r.trailing===!1||(o=setTimeout(c,l)),i}},m.debounce=function(n,t,r){var e,u,i,o,a,c=function(){var f=m.now()-o;t>f&&f>=0?e=setTimeout(c,t-f):(e=null,r||(a=n.apply(i,u),e||(i=u=null)))};return function(){i=this,u=arguments,o=m.now();var f=r&&!e;return e||(e=setTimeout(c,t)),f&&(a=n.apply(i,u),i=u=null),a}},m.wrap=function(n,t){return m.partial(t,n)},m.negate=function(n){return function(){return!n.apply(this,arguments)}},m.compose=function(){var n=arguments,t=n.length-1;return function(){for(var r=t,e=n[t].apply(this,arguments);r--;)e=n[r].call(this,e);return e}},m.after=function(n,t){return function(){return--n<1?t.apply(this,arguments):void 0}},m.before=function(n,t){var r;return function(){return--n>0&&(r=t.apply(this,arguments)),1>=n&&(t=null),r}},m.once=m.partial(m.before,2);var M=!{toString:null}.propertyIsEnumerable("toString"),I=["valueOf","isPrototypeOf","toString","propertyIsEnumerable","hasOwnProperty","toLocaleString"];m.keys=function(n){if(!m.isObject(n))return[];if(v)return v(n);var t=[];for(var r in n)m.has(n,r)&&t.push(r);return M&&e(n,t),t},m.allKeys=function(n){if(!m.isObject(n))return[];var t=[];for(var r in n)t.push(r);return M&&e(n,t),t},m.values=function(n){for(var t=m.keys(n),r=t.length,e=Array(r),u=0;r>u;u++)e[u]=n[t[u]];return e},m.mapObject=function(n,t,r){t=x(t,r);for(var e,u=m.keys(n),i=u.length,o={},a=0;i>a;a++)e=u[a],o[e]=t(n[e],e,n);return o},m.pairs=function(n){for(var t=m.keys(n),r=t.length,e=Array(r),u=0;r>u;u++)e[u]=[t[u],n[t[u]]];return e},m.invert=function(n){for(var t={},r=m.keys(n),e=0,u=r.length;u>e;e++)t[n[r[e]]]=r[e];return t},m.functions=m.methods=function(n){var t=[];for(var r in n)m.isFunction(n[r])&&t.push(r);return t.sort()},m.extend=_(m.allKeys),m.extendOwn=m.assign=_(m.keys),m.findKey=function(n,t,r){t=x(t,r);for(var e,u=m.keys(n),i=0,o=u.length;o>i;i++)if(e=u[i],t(n[e],e,n))return e},m.pick=function(n,t,r){var e,u,i={},o=n;if(null==o)return i;m.isFunction(t)?(u=m.allKeys(o),e=b(t,r)):(u=S(arguments,!1,!1,1),e=function(n,t,r){return t in r},o=Object(o));for(var a=0,c=u.length;c>a;a++){var f=u[a],l=o[f];e(l,f,o)&&(i[f]=l)}return i},m.omit=function(n,t,r){if(m.isFunction(t))t=m.negate(t);else{var e=m.map(S(arguments,!1,!1,1),String);t=function(n,t){return!m.contains(e,t)}}return m.pick(n,t,r)},m.defaults=_(m.allKeys,!0),m.create=function(n,t){var r=j(n);return t&&m.extendOwn(r,t),r},m.clone=function(n){return m.isObject(n)?m.isArray(n)?n.slice():m.extend({},n):n},m.tap=function(n,t){return t(n),n},m.isMatch=function(n,t){var r=m.keys(t),e=r.length;if(null==n)return!e;for(var u=Object(n),i=0;e>i;i++){var o=r[i];if(t[o]!==u[o]||!(o in u))return!1}return!0};var N=function(n,t,r,e){if(n===t)return 0!==n||1/n===1/t;if(null==n||null==t)return n===t;n instanceof m&&(n=n._wrapped),t instanceof m&&(t=t._wrapped);var u=s.call(n);if(u!==s.call(t))return!1;switch(u){case"[object RegExp]":case"[object String]":return""+n==""+t;case"[object Number]":return+n!==+n?+t!==+t:0===+n?1/+n===1/t:+n===+t;case"[object Date]":case"[object Boolean]":return+n===+t}var i="[object Array]"===u;if(!i){if("object"!=typeof n||"object"!=typeof t)return!1;var o=n.constructor,a=t.constructor;if(o!==a&&!(m.isFunction(o)&&o instanceof o&&m.isFunction(a)&&a instanceof a)&&"constructor"in n&&"constructor"in t)return!1}r=r||[],e=e||[];for(var c=r.length;c--;)if(r[c]===n)return e[c]===t;if(r.push(n),e.push(t),i){if(c=n.length,c!==t.length)return!1;for(;c--;)if(!N(n[c],t[c],r,e))return!1}else{var f,l=m.keys(n);if(c=l.length,m.keys(t).length!==c)return!1;for(;c--;)if(f=l[c],!m.has(t,f)||!N(n[f],t[f],r,e))return!1}return r.pop(),e.pop(),!0};m.isEqual=function(n,t){return N(n,t)},m.isEmpty=function(n){return null==n?!0:k(n)&&(m.isArray(n)||m.isString(n)||m.isArguments(n))?0===n.length:0===m.keys(n).length},m.isElement=function(n){return!(!n||1!==n.nodeType)},m.isArray=h||function(n){return"[object Array]"===s.call(n)},m.isObject=function(n){var t=typeof n;return"function"===t||"object"===t&&!!n},m.each(["Arguments","Function","String","Number","Date","RegExp","Error"],function(n){m["is"+n]=function(t){return s.call(t)==="[object "+n+"]"}}),m.isArguments(arguments)||(m.isArguments=function(n){return m.has(n,"callee")}),"function"!=typeof/./&&"object"!=typeof Int8Array&&(m.isFunction=function(n){return"function"==typeof n||!1}),m.isFinite=function(n){return isFinite(n)&&!isNaN(parseFloat(n))},m.isNaN=function(n){return m.isNumber(n)&&n!==+n},m.isBoolean=function(n){return n===!0||n===!1||"[object Boolean]"===s.call(n)},m.isNull=function(n){return null===n},m.isUndefined=function(n){return n===void 0},m.has=function(n,t){return null!=n&&p.call(n,t)},m.noConflict=function(){return u._=i,this},m.identity=function(n){return n},m.constant=function(n){return function(){return n}},m.noop=function(){},m.property=w,m.propertyOf=function(n){return null==n?function(){}:function(t){return n[t]}},m.matcher=m.matches=function(n){return n=m.extendOwn({},n),function(t){return m.isMatch(t,n)}},m.times=function(n,t,r){var e=Array(Math.max(0,n));t=b(t,r,1);for(var u=0;n>u;u++)e[u]=t(u);return e},m.random=function(n,t){return null==t&&(t=n,n=0),n+Math.floor(Math.random()*(t-n+1))},m.now=Date.now||function(){return(new Date).getTime()};var B={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","`":"&#x60;"},T=m.invert(B),R=function(n){var t=function(t){return n[t]},r="(?:"+m.keys(n).join("|")+")",e=RegExp(r),u=RegExp(r,"g");return function(n){return n=null==n?"":""+n,e.test(n)?n.replace(u,t):n}};m.escape=R(B),m.unescape=R(T),m.result=function(n,t,r){var e=null==n?void 0:n[t];return e===void 0&&(e=r),m.isFunction(e)?e.call(n):e};var q=0;m.uniqueId=function(n){var t=++q+"";return n?n+t:t},m.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};var K=/(.)^/,z={"'":"'","\\":"\\","\r":"r","\n":"n","\u2028":"u2028","\u2029":"u2029"},D=/\\|'|\r|\n|\u2028|\u2029/g,L=function(n){return"\\"+z[n]};m.template=function(n,t,r){!t&&r&&(t=r),t=m.defaults({},t,m.templateSettings);var e=RegExp([(t.escape||K).source,(t.interpolate||K).source,(t.evaluate||K).source].join("|")+"|$","g"),u=0,i="__p+='";n.replace(e,function(t,r,e,o,a){return i+=n.slice(u,a).replace(D,L),u=a+t.length,r?i+="'+\n((__t=("+r+"))==null?'':_.escape(__t))+\n'":e?i+="'+\n((__t=("+e+"))==null?'':__t)+\n'":o&&(i+="';\n"+o+"\n__p+='"),t}),i+="';\n",t.variable||(i="with(obj||{}){\n"+i+"}\n"),i="var __t,__p='',__j=Array.prototype.join,"+"print=function(){__p+=__j.call(arguments,'');};\n"+i+"return __p;\n";try{var o=new Function(t.variable||"obj","_",i)}catch(a){throw a.source=i,a}var c=function(n){return o.call(this,n,m)},f=t.variable||"obj";return c.source="function("+f+"){\n"+i+"}",c},m.chain=function(n){var t=m(n);return t._chain=!0,t};var P=function(n,t){return n._chain?m(t).chain():t};m.mixin=function(n){m.each(m.functions(n),function(t){var r=m[t]=n[t];m.prototype[t]=function(){var n=[this._wrapped];return f.apply(n,arguments),P(this,r.apply(m,n))}})},m.mixin(m),m.each(["pop","push","reverse","shift","sort","splice","unshift"],function(n){var t=o[n];m.prototype[n]=function(){var r=this._wrapped;return t.apply(r,arguments),"shift"!==n&&"splice"!==n||0!==r.length||delete r[0],P(this,r)}}),m.each(["concat","join","slice"],function(n){var t=o[n];m.prototype[n]=function(){return P(this,t.apply(this._wrapped,arguments))}}),m.prototype.value=function(){return this._wrapped},m.prototype.valueOf=m.prototype.toJSON=m.prototype.value,m.prototype.toString=function(){return""+this._wrapped},"function"==typeof define&&define.amd&&define("underscore",[],function(){return m})}).call(this);

/**
 * vivus - JavaScript library to make drawing animation on SVG
 * @version v0.2.2
 * @link https://github.com/maxwellito/vivus
 * @license MIT
 */

'use strict';

(function (window, document) {

    'use strict';

    /**
     * Pathformer
     * Beta version
     *
     * Take any SVG version 1.1 and transform
     * child elements to 'path' elements
     *
     * This code is purely forked from
     * https://github.com/Waest/SVGPathConverter
     */

    /**
     * Class constructor
     *
     * @param {DOM|String} element Dom element of the SVG or id of it
     */
    function Pathformer(element) {
        // Test params
        if (typeof element === 'undefined') {
            throw new Error('Pathformer [constructor]: "element" parameter is required');
        }

        // Set the element
        if (element.constructor === String) {
            element = document.getElementById(element);
            if (!element) {
                throw new Error('Pathformer [constructor]: "element" parameter is not related to an existing ID');
            }
        }
        if (element.constructor instanceof window.SVGElement || /^svg$/i.test(element.nodeName)) {
            this.el = element;
        } else {
            throw new Error('Pathformer [constructor]: "element" parameter must be a string or a SVGelement');
        }

        // Start
        this.scan(element);
    }

    /**
     * List of tags which can be transformed
     * to path elements
     *
     * @type {Array}
     */
    Pathformer.prototype.TYPES = ['line', 'elipse', 'circle', 'polygon', 'polyline', 'rect'];

    /**
     * List of attribute names which contain
     * data. This array list them to check if
     * they contain bad values, like percentage.
     *
     * @type {Array}
     */
    Pathformer.prototype.ATTR_WATCH = ['cx', 'cy', 'points', 'r', 'rx', 'ry', 'x', 'x1', 'x2', 'y', 'y1', 'y2'];

    /**
     * Finds the elements compatible for transform
     * and apply the liked method
     *
     * @param  {object} options Object from the constructor
     */
    Pathformer.prototype.scan = function (svg) {
        var fn, element, pathData, pathDom,
            elements = svg.querySelectorAll(this.TYPES.join(','));
        for (var i = 0; i < elements.length; i++) {
            element = elements[i];
            fn = this[element.tagName.toLowerCase() + 'ToPath'];
            pathData = fn(this.parseAttr(element.attributes));
            pathDom = this.pathMaker(element, pathData);
            element.parentNode.replaceChild(pathDom, element);
        }
    };


    /**
     * Read `line` element to extract and transform
     * data, to make it ready for a `path` object.
     *
     * @param  {DOMelement} element Line element to transform
     * @return {object}             Data for a `path` element
     */
    Pathformer.prototype.lineToPath = function (element) {
        var newElement = {};
        newElement.d = 'M' + element.x1 + ',' + element.y1 + 'L' + element.x2 + ',' + element.y2;
        return newElement;
    };

    /**
     * Read `rect` element to extract and transform
     * data, to make it ready for a `path` object.
     * The radius-border is not taken in charge yet.
     * (your help is more than welcomed)
     *
     * @param  {DOMelement} element Rect element to transform
     * @return {object}             Data for a `path` element
     */
    Pathformer.prototype.rectToPath = function (element) {
        var newElement = {},
            x = parseFloat(element.x) || 0,
            y = parseFloat(element.y) || 0,
            width = parseFloat(element.width) || 0,
            height = parseFloat(element.height) || 0;
        newElement.d  = 'M' + x + ' ' + y + ' ';
        newElement.d += 'L' + (x + width) + ' ' + y + ' ';
        newElement.d += 'L' + (x + width) + ' ' + (y + height) + ' ';
        newElement.d += 'L' + x + ' ' + (y + height) + ' Z';
        return newElement;
    };

    /**
     * Read `polyline` element to extract and transform
     * data, to make it ready for a `path` object.
     *
     * @param  {DOMelement} element Polyline element to transform
     * @return {object}             Data for a `path` element
     */
    Pathformer.prototype.polylineToPath = function (element) {
        var i, path;
        var newElement = {};
        var points = element.points.split(' ');

        // Reformatting if points are defined without commas
        if (element.points.indexOf(',') === -1) {
            var formattedPoints = [];
            for (i = 0; i < points.length; i+=2) {
                formattedPoints.push(points[i] + ',' + points[i+1]);
            }
            points = formattedPoints;
        }

        // Generate the path.d value
        path = 'M' + points[0];
        for(i = 1; i < points.length; i++) {
            if (points[i].indexOf(',') !== -1) {
                path += 'L' + points[i];
            }
        }
        newElement.d = path;
        return newElement;
    };

    /**
     * Read `polygon` element to extract and transform
     * data, to make it ready for a `path` object.
     * This method rely on polylineToPath, because the
     * logic is similar. The path created is just closed,
     * so it needs an 'Z' at the end.
     *
     * @param  {DOMelement} element Polygon element to transform
     * @return {object}             Data for a `path` element
     */
    Pathformer.prototype.polygonToPath = function (element) {
        var newElement = Pathformer.prototype.polylineToPath(element);
        newElement.d += 'Z';
        return newElement;
    };

    /**
     * Read `elipse` element to extract and transform
     * data, to make it ready for a `path` object.
     *
     * @param  {DOMelement} element Elipse element to transform
     * @return {object}             Data for a `path` element
     */
    Pathformer.prototype.elipseToPath = function (element) {
        var startX = element.cx - element.rx,
            startY = element.cy;
        var endX = parseFloat(element.cx) + parseFloat(element.rx),
            endY = element.cy;

        var newElement = {};
        newElement.d = 'M' + startX + ',' + startY +
            'A' + element.rx + ',' + element.ry + ' 0,1,1 ' + endX + ',' + endY +
            'A' + element.rx + ',' + element.ry + ' 0,1,1 ' + startX + ',' + endY;
        return newElement;
    };

    /**
     * Read `circle` element to extract and transform
     * data, to make it ready for a `path` object.
     *
     * @param  {DOMelement} element Circle element to transform
     * @return {object}             Data for a `path` element
     */
    Pathformer.prototype.circleToPath = function (element) {
        var newElement = {};
        var startX = element.cx - element.r,
            startY = element.cy;
        var endX = parseFloat(element.cx) + parseFloat(element.r),
            endY = element.cy;
        newElement.d =  'M' + startX + ',' + startY +
            'A' + element.r + ',' + element.r + ' 0,1,1 ' + endX + ',' + endY +
            'A' + element.r + ',' + element.r + ' 0,1,1 ' + startX + ',' + endY;
        return newElement;
    };

    /**
     * Create `path` elements form original element
     * and prepared objects
     *
     * @param  {DOMelement} element  Original element to transform
     * @param  {object} pathData     Path data (from `toPath` methods)
     * @return {DOMelement}          Path element
     */
    Pathformer.prototype.pathMaker = function (element, pathData) {
        var i, attr, pathTag = document.createElementNS('http://www.w3.org/2000/svg','path');
        for(i = 0; i < element.attributes.length; i++) {
            attr = element.attributes[i];
            if (this.ATTR_WATCH.indexOf(attr.name) === -1) {
                pathTag.setAttribute(attr.name, attr.value);
            }
        }
        for(i in pathData) {
            pathTag.setAttribute(i, pathData[i]);
        }
        return pathTag;
    };

    /**
     * Parse attributes of a DOM element to
     * get an object of attribute => value
     *
     * @param  {NamedNodeMap} attributes Attributes object from DOM element to parse
     * @return {object}                  Object of attributes
     */
    Pathformer.prototype.parseAttr = function (element) {
        var attr, output = {};
        for (var i = 0; i < element.length; i++) {
            attr = element[i];
            // Check if no data attribute contains '%', or the transformation is impossible
            if (this.ATTR_WATCH.indexOf(attr.name) !== -1 && attr.value.indexOf('%') !== -1) {
                throw new Error('Pathformer [parseAttr]: a SVG shape got values in percentage. This cannot be transformed into \'path\' tags. Please use \'viewBox\'.');
            }
            output[attr.name] = attr.value;
        }
        return output;
    };

    'use strict';

    var requestAnimFrame, cancelAnimFrame, parsePositiveInt;

    /**
     * Vivus
     * Beta version
     *
     * Take any SVG and make the animation
     * to give give the impression of live drawing
     *
     * This in more than just inspired from codrops
     * At that point, it's a pure fork.
     */

    /**
     * Class constructor
     * option structure
     *   type: 'delayed'|'async'|'oneByOne'|'script' (to know if the item must be drawn asynchronously or not, default: delayed)
     *   duration: <int> (in frames)
     *   start: 'inViewport'|'manual'|'autostart' (start automatically the animation, default: inViewport)
     *   delay: <int> (delay between the drawing of first and last path)
     *   dashGap <integer> whitespace extra margin between dashes
     *   pathTimingFunction <function> timing animation function for each path element of the SVG
     *   animTimingFunction <function> timing animation function for the complete SVG
     *   forceRender <boolean> force the browser to re-render all updated path items
     *   selfDestroy <boolean> removes all extra styling on the SVG, and leaves it as original
     *
     * The attribute 'type' is by default on 'delayed'.
     *  - 'delayed'
     *    all paths are draw at the same time but with a
     *    little delay between them before start
     *  - 'async'
     *    all path are start and finish at the same time
     *  - 'oneByOne'
     *    only one path is draw at the time
     *    the end of the first one will trigger the draw
     *    of the next one
     *
     * All these values can be overwritten individually
     * for each path item in the SVG
     * The value of frames will always take the advantage of
     * the duration value.
     * If you fail somewhere, an error will be thrown.
     * Good luck.
     *
     * @constructor
     * @this {Vivus}
     * @param {DOM|String}   element  Dom element of the SVG or id of it
     * @param {Object}       options  Options about the animation
     * @param {Function}     callback Callback for the end of the animation
     */
    function Vivus (element, options, callback) {

        // Setup
        this.isReady = false;
        this.setElement(element, options);
        this.setOptions(options);
        this.setCallback(callback);

        if (this.isReady) {
            this.init();
        }
    }

    /**
     * Timing functions
     **************************************
     *
     * Default functions to help developers.
     * It always take a number as parameter (between 0 to 1) then
     * return a number (between 0 and 1)
     */
    Vivus.LINEAR          = function (x) {return x;};
    Vivus.EASE            = function (x) {return -Math.cos(x * Math.PI) / 2 + 0.5;};
    Vivus.EASE_OUT        = function (x) {return 1 - Math.pow(1-x, 3);};
    Vivus.EASE_IN         = function (x) {return Math.pow(x, 3);};
    Vivus.EASE_OUT_BOUNCE = function (x) {
        var base = -Math.cos(x * (0.5 * Math.PI)) + 1,
            rate = Math.pow(base,1.5),
            rateR = Math.pow(1 - x, 2),
            progress = -Math.abs(Math.cos(rate * (2.5 * Math.PI) )) + 1;
        return (1- rateR) + (progress * rateR);
    };


    /**
     * Setters
     **************************************
     */

    /**
     * Check and set the element in the instance
     * The method will not return anything, but will throw an
     * error if the parameter is invalid
     *
     * @param {DOM|String}   element  SVG Dom element or id of it
     */
    Vivus.prototype.setElement = function (element, options) {
        // Basic check
        if (typeof element === 'undefined') {
            throw new Error('Vivus [constructor]: "element" parameter is required');
        }

        // Set the element
        if (element.constructor === String) {
            element = document.getElementById(element);
            if (!element) {
                throw new Error('Vivus [constructor]: "element" parameter is not related to an existing ID');
            }
        }
        this.parentEl = element;

        // Create the object element if the property `file` exists in the options object
        if (options && options.file) {
            var objElm = document.createElement('object');
            objElm.setAttribute('type', 'image/svg+xml');
            objElm.setAttribute('data', options.file);
            element.appendChild(objElm);
            element = objElm;
        }

        switch (element.constructor) {
            case window.SVGSVGElement:
            case window.SVGElement:
                this.el = element;
                this.isReady = true;
                break;

            case window.HTMLObjectElement:
                // If the Object is already loaded
                this.el = element.contentDocument && element.contentDocument.querySelector('svg');
                if (this.el) {
                    this.isReady = true;
                    return;
                }

                // If we have to wait for it
                var self = this;
                element.addEventListener('load', function () {
                    self.el = element.contentDocument && element.contentDocument.querySelector('svg');
                    if (!self.el) {
                        throw new Error('Vivus [constructor]: object loaded does not contain any SVG');
                    }
                    else {
                        self.isReady = true;
                        self.init();
                    }
                });
                break;

            default:
                throw new Error('Vivus [constructor]: "element" parameter is not valid (or miss the "file" attribute)');
        }
    };

    /**
     * Set up user option to the instance
     * The method will not return anything, but will throw an
     * error if the parameter is invalid
     *
     * @param  {object} options Object from the constructor
     */
    Vivus.prototype.setOptions = function (options) {
        var allowedTypes = ['delayed', 'async', 'oneByOne', 'scenario', 'scenario-sync'];
        var allowedStarts =  ['inViewport', 'manual', 'autostart'];

        // Basic check
        if (options !== undefined && options.constructor !== Object) {
            throw new Error('Vivus [constructor]: "options" parameter must be an object');
        }
        else {
            options = options || {};
        }

        // Set the animation type
        if (options.type && allowedTypes.indexOf(options.type) === -1) {
            throw new Error('Vivus [constructor]: ' + options.type + ' is not an existing animation `type`');
        }
        else {
            this.type = options.type || allowedTypes[0];
        }

        // Set the start type
        if (options.start && allowedStarts.indexOf(options.start) === -1) {
            throw new Error('Vivus [constructor]: ' + options.start + ' is not an existing `start` option');
        }
        else {
            this.start = options.start || allowedStarts[0];
        }

        this.isIE        = (window.navigator.userAgent.indexOf('MSIE') !== -1);
        this.duration    = parsePositiveInt(options.duration, 120);
        this.delay       = parsePositiveInt(options.delay, null);
        this.dashGap     = parsePositiveInt(options.dashGap, 2);
        this.forceRender = options.hasOwnProperty('forceRender') ? !!options.forceRender : this.isIE;
        this.selfDestroy = !!options.selfDestroy;
        this.onReady     = options.onReady;

        this.animTimingFunction = options.animTimingFunction || Vivus.LINEAR;
        this.pathTimingFunction = options.pathTimingFunction || Vivus.LINEAR;

        if (this.delay >= this.duration) {
            throw new Error('Vivus [constructor]: delay must be shorter than duration');
        }
    };

    /**
     * Set up callback to the instance
     * The method will not return enything, but will throw an
     * error if the parameter is invalid
     *
     * @param  {Function} callback Callback for the animation end
     */
    Vivus.prototype.setCallback = function (callback) {
        // Basic check
        if (!!callback && callback.constructor !== Function) {
            throw new Error('Vivus [constructor]: "callback" parameter must be a function');
        }
        this.callback = callback || function () {};
    };


    /**
     * Core
     **************************************
     */

    /**
     * Map the svg, path by path.
     * The method return nothing, it just fill the
     * `map` array. Each item in this array represent
     * a path element from the SVG, with informations for
     * the animation.
     *
     * ```
     * [
     *   {
 *     el: <DOMobj> the path element
 *     length: <number> length of the path line
 *     startAt: <number> time start of the path animation (in frames)
 *     duration: <number> path animation duration (in frames)
 *   },
     *   ...
     * ]
     * ```
     *
     */
    Vivus.prototype.mapping = function () {
        var i, paths, path, pAttrs, pathObj, totalLength, lengthMeter, timePoint;
        timePoint = totalLength = lengthMeter = 0;
        paths = this.el.querySelectorAll('path');

        for (i = 0; i < paths.length; i++) {
            path = paths[i];
            pathObj = {
                el: path,
                length: Math.ceil(path.getTotalLength())
            };
            // Test if the path length is correct
            if (isNaN(pathObj.length)) {
                if (window.console && console.warn) {
                    console.warn('Vivus [mapping]: cannot retrieve a path element length', path);
                }
                continue;
            }
            totalLength += pathObj.length;
            this.map.push(pathObj);
            path.style.strokeDasharray  = pathObj.length + ' ' + (pathObj.length + this.dashGap);
            path.style.strokeDashoffset = pathObj.length;

            // Fix IE glitch
            if (this.isIE) {
                pathObj.length += this.dashGap;
            }
            this.renderPath(i);
        }

        totalLength = totalLength === 0 ? 1 : totalLength;
        this.delay = this.delay === null ? this.duration / 3 : this.delay;
        this.delayUnit = this.delay / (paths.length > 1 ? paths.length - 1 : 1);

        for (i = 0; i < this.map.length; i++) {
            pathObj = this.map[i];

            switch (this.type) {
                case 'delayed':
                    pathObj.startAt = this.delayUnit * i;
                    pathObj.duration = this.duration - this.delay;
                    break;

                case 'oneByOne':
                    pathObj.startAt = lengthMeter / totalLength * this.duration;
                    pathObj.duration = pathObj.length / totalLength * this.duration;
                    break;

                case 'async':
                    pathObj.startAt = 0;
                    pathObj.duration = this.duration;
                    break;

                case 'scenario-sync':
                    path = paths[i];
                    pAttrs = this.parseAttr(path);
                    pathObj.startAt = timePoint + (parsePositiveInt(pAttrs['data-delay'], this.delayUnit) || 0);
                    pathObj.duration = parsePositiveInt(pAttrs['data-duration'], this.duration);
                    timePoint = pAttrs['data-async'] !== undefined ? pathObj.startAt : pathObj.startAt + pathObj.duration;
                    this.frameLength = Math.max(this.frameLength, (pathObj.startAt + pathObj.duration));
                    break;

                case 'scenario':
                    path = paths[i];
                    pAttrs = this.parseAttr(path);
                    pathObj.startAt = parsePositiveInt(pAttrs['data-start'], this.delayUnit) || 0;
                    pathObj.duration = parsePositiveInt(pAttrs['data-duration'], this.duration);
                    this.frameLength = Math.max(this.frameLength, (pathObj.startAt + pathObj.duration));
                    break;
            }
            lengthMeter += pathObj.length;
            this.frameLength = this.frameLength || this.duration;
        }
    };

    /**
     * Interval method to draw the SVG from current
     * position of the animation. It update the value of
     * `currentFrame` and re-trace the SVG.
     *
     * It use this.handle to store the requestAnimationFrame
     * and clear it one the animation is stopped. So this
     * attribute can be used to know if the animation is
     * playing.
     *
     * Once the animation at the end, this method will
     * trigger the Vivus callback.
     *
     */
    Vivus.prototype.drawer = function () {
        var self = this;
        this.currentFrame += this.speed;

        if (this.currentFrame <= 0) {
            this.stop();
            this.reset();
            this.callback(this);
        } else if (this.currentFrame >= this.frameLength) {
            this.stop();
            this.currentFrame = this.frameLength;
            this.trace();
            if (this.selfDestroy) {
                this.destroy();
            }
            this.callback(this);
        } else {
            this.trace();
            this.handle = requestAnimFrame(function () {
                self.drawer();
            });
        }
    };

    /**
     * Draw the SVG at the current instant from the
     * `currentFrame` value. Here is where most of the magic is.
     * The trick is to use the `strokeDashoffset` style property.
     *
     * For optimisation reasons, a new property called `progress`
     * is added in each item of `map`. This one contain the current
     * progress of the path element. Only if the new value is different
     * the new value will be applied to the DOM element. This
     * method save a lot of resources to re-render the SVG. And could
     * be improved if the animation couldn't be played forward.
     *
     */
    Vivus.prototype.trace = function () {
        var i, progress, path, currentFrame;
        currentFrame = this.animTimingFunction(this.currentFrame / this.frameLength) * this.frameLength;
        for (i = 0; i < this.map.length; i++) {
            path = this.map[i];
            progress = (currentFrame - path.startAt) / path.duration;
            progress = this.pathTimingFunction(Math.max(0, Math.min(1, progress)));
            if (path.progress !== progress) {
                path.progress = progress;
                path.el.style.strokeDashoffset = Math.floor(path.length * (1 - progress));
                this.renderPath(i);
            }
        }
    };

    /**
     * Method forcing the browser to re-render a path element
     * from it's index in the map. Depending on the `forceRender`
     * value.
     * The trick is to replace the path element by it's clone.
     * This practice is not recommended because it's asking more
     * ressources, too much DOM manupulation..
     * but it's the only way to let the magic happen on IE.
     * By default, this fallback is only applied on IE.
     *
     * @param  {Number} index Path index
     */
    Vivus.prototype.renderPath = function (index) {
        if (this.forceRender && this.map && this.map[index]) {
            var pathObj = this.map[index],
                newPath = pathObj.el.cloneNode(true);
            pathObj.el.parentNode.replaceChild(newPath, pathObj.el);
            pathObj.el = newPath;
        }
    };

    /**
     * When the SVG object is loaded and ready,
     * this method will continue the initialisation.
     *
     * This this mainly due to the case of passing an
     * object tag in the constructor. It will wait
     * the end of the loading to initialise.
     *
     */
    Vivus.prototype.init = function () {
        // Set object variables
        this.frameLength = 0;
        this.currentFrame = 0;
        this.map = [];

        // Start
        new Pathformer(this.el);
        this.mapping();
        this.starter();

        if (this.onReady) {
            this.onReady(this);
        }
    };

    /**
     * Trigger to start of the animation.
     * Depending on the `start` value, a different script
     * will be applied.
     *
     * If the `start` value is not valid, an error will be thrown.
     * Even if technically, this is impossible.
     *
     */
    Vivus.prototype.starter = function () {
        switch (this.start) {
            case 'manual':
                return;

            case 'autostart':
                this.play();
                break;

            case 'inViewport':
                var self = this,
                    listener = function () {
                        if (self.isInViewport(self.parentEl, 1)) {
                            self.play();
                            window.removeEventListener('scroll', listener);
                        }
                    };
                window.addEventListener('scroll', listener);
                listener();
                break;
        }
    };


    /**
     * Controls
     **************************************
     */

    /**
     * Get the current status of the animation between
     * three different states: 'start', 'progress', 'end'.
     * @return {string} Instance status
     */
    Vivus.prototype.getStatus = function () {
        return this.currentFrame === 0 ? 'start' : this.currentFrame === this.frameLength ? 'end' : 'progress';
    };


    /**
     * Controls
     **************************************
     */

    /**
     * Reset the instance to the initial state : undraw
     * Be careful, it just reset the animation, if you're
     * playing the animation, this won't stop it. But just
     * make it start from start.
     *
     */
    Vivus.prototype.reset = function () {
        return this.setFrameProgress(0);
    };

    /**
     * Set the instance to the final state : drawn
     * Be careful, it just set the animation, if you're
     * playing the animation on rewind, this won't stop it.
     * But just make it start from the end.
     *
     */
    Vivus.prototype.finish = function () {
        return this.setFrameProgress(1);
    };

    /**
     * Set the level of progress of the drawing.
     *
     * @param {number} progress Level of progress to set
     */
    Vivus.prototype.setFrameProgress = function (progress) {
        progress = Math.min(1, Math.max(0, progress));
        this.currentFrame = Math.round(this.frameLength * progress);
        this.trace();
        return this;
    };

    /**
     * Play the animation at the desired speed.
     * Speed must be a valid number (no zero).
     * By default, the speed value is 1.
     * But a negative value is accepted to go forward.
     *
     * And works with float too.
     * But don't forget we are in JavaScript, se be nice
     * with him and give him a 1/2^x value.
     *
     * @param  {number} speed Animation speed [optional]
     */
    Vivus.prototype.play = function (speed) {
        if (speed && typeof speed !== 'number') {
            throw new Error('Vivus [play]: invalid speed');
        }
        this.speed = speed || 1;
        if (!this.handle) {
            this.drawer();
        }
        return this;
    };

    /**
     * Stop the current animation, if on progress.
     * Should not trigger any error.
     *
     */
    Vivus.prototype.stop = function () {
        if (this.handle) {
            cancelAnimFrame(this.handle);
            delete this.handle;
        }
        return this;
    };

    /**
     * Destroy the instance.
     * Remove all bad styling attributes on all
     * path tags
     *
     */
    Vivus.prototype.destroy = function () {
        var i, path;
        for (i = 0; i < this.map.length; i++) {
            path = this.map[i];
            path.el.style.strokeDashoffset = null;
            path.el.style.strokeDasharray = null;
            this.renderPath(i);
        }
    };


    /**
     * Utils methods
     * from Codrops
     **************************************
     */

    /**
     * Parse attributes of a DOM element to
     * get an object of {attributeName => attributeValue}
     *
     * @param  {object} element DOM element to parse
     * @return {object}         Object of attributes
     */
    Vivus.prototype.parseAttr = function (element) {
        var attr, output = {};
        if (element && element.attributes) {
            for (var i = 0; i < element.attributes.length; i++) {
                attr = element.attributes[i];
                output[attr.name] = attr.value;
            }
        }
        return output;
    };

    /**
     * Reply if an element is in the page viewport
     *
     * @param  {object} el Element to observe
     * @param  {number} h  Percentage of height
     * @return {boolean}
     */
    Vivus.prototype.isInViewport = function (el, h) {
        var scrolled   = this.scrollY(),
            viewed       = scrolled + this.getViewportH(),
            elBCR        = el.getBoundingClientRect(),
            elHeight     = elBCR.height,
            elTop        = scrolled + elBCR.top,
            elBottom     = elTop + elHeight;

        // if 0, the element is considered in the viewport as soon as it enters.
        // if 1, the element is considered in the viewport only when it's fully inside
        // value in percentage (1 >= h >= 0)
        h = h || 0;

        return (elTop + elHeight * h) <= viewed && (elBottom) >= scrolled;
    };

    /**
     * Alias for document element
     *
     * @type {DOMelement}
     */
    Vivus.prototype.docElem = window.document.documentElement;

    /**
     * Get the viewport height in pixels
     *
     * @return {integer} Viewport height
     */
    Vivus.prototype.getViewportH = function () {
        var client = this.docElem.clientHeight,
            inner = window.innerHeight;

        if (client < inner) {
            return inner;
        }
        else {
            return client;
        }
    };

    /**
     * Get the page Y offset
     *
     * @return {integer} Page Y offset
     */
    Vivus.prototype.scrollY = function () {
        return window.pageYOffset || this.docElem.scrollTop;
    };

    /**
     * Alias for `requestAnimationFrame` or
     * `setTimeout` function for deprecated browsers.
     *
     */
    requestAnimFrame = (function () {
        return (
            window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function(/* function */ callback){
                return window.setTimeout(callback, 1000 / 60);
            }
        );
    })();

    /**
     * Alias for `cancelAnimationFrame` or
     * `cancelTimeout` function for deprecated browsers.
     *
     */
    cancelAnimFrame = (function () {
        return (
            window.cancelAnimationFrame       ||
            window.webkitCancelAnimationFrame ||
            window.mozCancelAnimationFrame    ||
            window.oCancelAnimationFrame      ||
            window.msCancelAnimationFrame     ||
            function(id){
                return window.clearTimeout(id);
            }
        );
    })();

    /**
     * Parse string to integer.
     * If the number is not positive or null
     * the method will return the default value
     * or 0 if undefined
     *
     * @param {string} value String to parse
     * @param {*} defaultValue Value to return if the result parsed is invalid
     * @return {number}
     *
     */
    parsePositiveInt = function (value, defaultValue) {
        var output = parseInt(value, 10);
        return (output >= 0) ? output : defaultValue;
    };


    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], function() {
            return Vivus;
        });
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = Vivus;
    } else {
        // Browser globals
        window.Vivus = Vivus;
    }

}(window, document));
$.fn.bg = function(){

    this.each(function(){

        var $block = $(this),
            $video = $block.find('.bg__video');
        // $mobileBG = $block.find('.bg__image_mobile');

        // if ($mobileBG.length && app.device.isMobile) {
        // 	$block.find('.bg__image').not('.bg__image_mobile, .bg__image_phone').remove();
        // } else {
        // 	$mobileBG.remove();
        // }
        // $mobileBG = null;

        if (app.device.isMobile || app.config.noVideo) {

            $video.remove();

        } else if ($video.length) {

            var src = $video.attr('src'),
                isEnabled = true;

            $video.attr('poster', '/build/images/blank.gif');

            var $screen = $block.closest('.screen'),
                $canvas = $('<canvas class="bg__canvas" />').appendTo($block),
                canvas = $canvas[0],
                ctx = canvas.getContext('2d'),
                played = false,
                ratio = $video.data('ratio') || 16/9,
                isEnded = false,
                isLoop = $video.attr('loop'),
                isStarted = false;

            var resize = function(){
                var screenRatio = app.sizes.width / app.sizes.height;
                var position = (screenRatio>ratio) ? {
                    left: 0,
                    top: -(app.sizes.width / ratio - app.sizes.height)/2,
                    width: app.sizes.width,
                    height: app.sizes.width / ratio
                } : {
                    left: -(app.sizes.height * ratio - app.sizes.width)/2,
                    top: 0,
                    width: app.sizes.height * ratio,
                    height: app.sizes.height
                };
                $video.add($canvas).css(position);
                canvas.width = position.width;
                canvas.height = position.height;
                position = null;
            };

            if (!isLoop) $video.on('ended', function(){
                isEnded = true;
            });

            var delay;

            var play = function(){
                if (played || isEnded) return false;
                played = true;
                if (!isEnabled) {
                    isEnabled = true;
                    $video[0].src = src;
                    $video[0].load();
                }
                $video.addClass('bg__video_enabled');
                $canvas.removeClass('bg__canvas_enabled');
                if ($video.data('delay')) {
                    delay = setTimeout(function(){
                        $video[0].play();
                    }, 750);
                } else {
                    $video[0].play();
                }
            };

            $video.one('playing', function(){
                isStarted = true;
            });

            $screen.on('leave', function(){
                pause();
                if (isStarted) {
                    $canvas.addClass('bg__canvas_enabled');
                    ctx.drawImage($video[0], 0, 0, canvas.width, canvas.height);
                }
            });

            // $screen.on('unleave', function(){
            // 	play();
            // });

            var pause = function(){
                clearTimeout(delay);
                if (!played || isEnded) return false;
                played = false;
                $video[0].pause();
            };

            app.dom.$window.on('resize', resize);
            resize();

            $screen.on('show fullShow return', play);

            $screen.on('fullHide', function(){
                pause();
                if (isEnabled && !isEnded) {
                    $video.removeClass('bg__video_enabled');
                    $canvas.removeClass('bg__canvas_enabled');
                    isEnabled = false;
                    $video[0].src = '';
                    if ($video[0].currentTime) $video[0].currentTime = 0;
                    $video[0].load();
                }
            });

        }

    });

};
$.fn.clock = function() {
    var $page = $(this);

    $page.find('[data-clock]').each(function() {

        var $clock = $(this)
            , time = $clock.data('clock')
            , diff = new Date(time) - Date.now()
            , $sArrow = $clock.find('[data-clock-arrow="s"]')
            , $mArrow = $clock.find('[data-clock-arrow="m"]')
            , $hArrow = $clock.find('[data-clock-arrow="h"]')
            , setRotate = function($block, degree) {
                $block.css({
                    '-webkit-transform': 'rotate(' + degree + 'deg)',
                    '-moz-transform': 'rotate(' + degree + 'deg)',
                    '-ms-transform': 'rotate(' + degree + 'deg)',
                    '-o-transform': 'rotate(' + degree + 'deg)',
                    'transform': 'rotate(' + degree + 'deg)'
                });
            }
            , rotate = function($block, d, value) {
                if (d==24) {
                    if (value>=12) value = value-12;
                    d = 12;
                }
                var angle = ((value / d) * 360) - 90;
                if (value === (d - 1)) {
                    setRotate($block, angle);
                    setTimeout(function() {
                        $block.addClass('i-no-transition');
                        setTimeout(function() {
                            setRotate($block, angle - 360);
                        }, 20);
                    }, 120);
                } else if ($block.hasClass('i-no-transition')) {
                    $block.removeClass('i-no-transition');
                    setTimeout(function() {
                        setRotate($block, angle);
                    }, 20);
                } else {
                    setRotate($block, angle);
                }
            }
            , tick = function() {
                var now = new Date(Date.now() + diff);
                rotate($sArrow, 60, now.getSeconds());
                rotate($mArrow, 60, now.getMinutes());
                rotate($hArrow, 24, now.getHours() + now.getMinutes()/60);
            }
            ;
        tick();
        setInterval(tick, 1000);
    });
};

(function(dom){

    // light effect
    var effect = {
        show: function($block, position, size, ratio, offset){
            // $block[0].style.opacity = 1;
            $block[0].style[prefixed.transform] = 'translateY(' + Math.round( (offset || 0) + size-position*size) + 'px) translateZ(0)';
            // if (position==0) $block[0].style[prefixed.transform] = 'translateY(110%)';
        },
        hide: function($block, position, size, ratio, offset){
            // $block[0].style.opacity = (1-position*0.4).toFixed(3);
            $block[0].style[prefixed.transform] = 'translateY(' + Math.round( (offset || 0) + -(ratio-1)*size - (position*size)) + 'px) translateZ(0)';
            // if (position==1) $block[0].style[prefixed.transform] = 'translateY(-110%)';
            // if (position==0) $block[0].style[prefixed.transform] = 'translateY(' + Math.round(-(ratio-1)*size) + 'px) translateZ(0)';
        },
        move: function($block, position, size){
            // $block[0].style.opacity = 1;
            $block[0].style[prefixed.transform] = 'translateY(' + Math.round(-position*size) + 'px) translateZ(0)';
        }
    };
    app.effect = effect;

    $.fn.marquee = function(options){

        var settings = {
            index: 0,
            vertical: true,
            screens: '.screen',
            mousewheel: true,
            nextClass: 'screen_next',
            duration: 550,
            prev: false,
            next: false
        };
        $.extend(settings, options);

        var $frame = this,
            $screens = $frame.find(settings.screens),
            screens = [],
            overlayed = false,
            name = $frame.data('name');

        // marquee
        var marquee = {
            $block: $frame,
            index: 0,
            prevIndex: 0,
            progress: 0,
            size: 0,
            scrolling: false,
            enabled: true,
            duration: settings.duration
        };

        // screens
        $screens.each(function(i){
            var $block = $(this);
            // api
            var api = $block.api('screen');
            api.state = {
                isVisible: false,
                isEndShow: false,
                isStartShow: false,
                isFullShow: false,
                isFullHide: (settings.index==i) ? false : true
            };
            // screen
            var screen = {
                index: i,
                $block: $block,
                api: api,
                ratio: 1
            };
            // save screen
            screens.push(screen);
            // decor
            if (i && settings.nextClass) $block.addClass(settings.nextClass);
        });

        // {fn} resize fake
        var resize = function(){
            var offset = 0;
            marquee.size = settings.vertical ? $frame.height() : app.sizes.width;
            $.each(screens, function(i, screen){
                if (settings.vertical){
                    screen.$block.removeClass('screen_long').height(marquee.size);
                    var $frame = screen.$block.find('.screen__frame'),
                        height = $frame.length ? Math.max(marquee.size, $frame.length ? $frame.outerHeight() : 0) : 0;
                    if (height>marquee.size) {
                        screen.$block.addClass('screen_long');
                        screen.size = height;
                        screen.$block.height(height);
                    } else {
                        screen.$block.removeClass('screen_long');
                        screen.size = marquee.size;
                    }
                } else {
                    screen.size = app.sizes.width;
                }
                screen.offset = offset;
                screen.ratio = screen.size/marquee.size;
                offset += screen.size;
            });
        };
        dom.$root.addClass('root_resize');
        resize();

        // scroll
        var scroll = new IScroll($frame[0], {
            disableMouse: true,
            mouseWheel: settings.mousewheel,
            invertWheelDirection: true,
            scrollX: !settings.vertical,
            scrollY: settings.vertical,
            bounce: true,
            snap: '.screen',
            eventPassthrough: settings.vertical ? 'horizontal' : true,
            probeType: 3,
            tap: false,
            click: false,
            snapSpeed: 350,
            // bounceEasing: 'circOut',
            preventDefault: true,
            scrollbars: settings.vertical ? 'custom' : false,
            interactiveScrollbars: settings.vertical && !app.device.support.touch,
            // fake: true,
            prevTrigger: settings.prev,
            nextTrigger: settings.next
        });
        scroll.disable();
        dom.$root.removeClass('root_resize');

        // update state
        marquee.updateState = function(){
            if (scroll.scrollerHeight > scroll.wrapperHeight) {
                marquee.enable();
            } else {
                marquee.disable();
            }
        };

        // {fn} set limits
        marquee.setLimits = function(index){
            index = Math.min(Math.max(0, index), screens.length-1);
            var isLast = index >= screens.length-1,
                isFirst = index==0;
            // min limit
            scroll[settings.vertical ? 'minScrollY' : 'minScrollX'] = -screens[index].offset + (isFirst ? 0 : screens[index-1].size);
            // max limit
            scroll[settings.vertical ? 'maxScrollY' : 'maxScrollX'] = -screens[index].offset - (isLast ? screens[index].size-marquee.size : screens[index].size);
            // set current page
            scroll.currentPage = { x:0, y:0, pageX:0, pageY:0 };
            scroll.currentPage[settings.vertical ? 'y' : 'x'] = -screens[index].offset;
            scroll.currentPage[settings.vertical ? 'pageY' : 'pageX'] = index;
        };

        // {fn} update params
        marquee.update = function(){
            var position = -Math.round(scroll[settings.vertical ? 'y' : 'x']),
                index = 0;
            // get screen index
            for (var i=0; i<screens.length; i++) {
                if (position >= screens[i].offset) index = i;
            };
            // position
            marquee.position = (position-screens[index].offset) / screens[index].size;
            // progress
            marquee.progress = index+marquee.position;
            // indexes
            if (marquee.index!=index) {
                marquee.prevIndex = marquee.index;
                marquee.index = index;
            };
        };

        // {fn} hide invisibles
        marquee.hideInvisibles = function(){
            // for (var i=0; i<screens.length; i++) {
            // 	if (i!=marquee.index && i!=marquee.index+1) {
            // 		if (i>marquee.index+1) effect.show(screens[i].$block, 0, marquee.size, screens[i].ratio);
            // 		if (i<marquee.index) effect.hide(screens[i].$block, 1, marquee.size, screens[i].ratio);
            // 		screens[i].$block[0].style.display = 'none';
            // 	}
            // };
        };

        // {fn} hide invisibles
        marquee.callScreensAPI = function(){
            var isLast = marquee.index>=screens.length-1,
                ratio = 1 / screens[marquee.index].ratio,
                position = { top:0, bottom:0 };
            // position
            position.top = marquee.position / ratio;
            position.bottom = marquee.position*screens[marquee.index].ratio - (screens[marquee.index].ratio - 1);
            if (app.device.isMobile) {
                // show and hide
                if (position.bottom>0.6) {
                    if (screens[marquee.index].api.state.isVisible) {
                        screens[marquee.index].api.state.isVisible = false;
                        screens[marquee.index].$block.triggerHandler('hide');
                    }
                    if (!isLast && !screens[marquee.index+1].api.state.isVisible) {
                        screens[marquee.index+1].api.state.isVisible = true;
                        screens[marquee.index+1].$block.triggerHandler('show');
                    }
                } else if (position.top>0.4) {
                    if (screens[marquee.index] && !screens[marquee.index].api.state.isVisible) {
                        screens[marquee.index].api.state.isVisible = true;
                        screens[marquee.index].$block.triggerHandler('show');
                    }
                    if (!isLast && screens[marquee.index+1].api.state.isVisible) {
                        screens[marquee.index+1].api.state.isVisible = false;
                        screens[marquee.index+1].$block.triggerHandler('hide');
                    }
                }
                // show start and end of next screen
                if (!isLast) {
                    if (position.bottom>0.1 && !screens[marquee.index+1].api.state.isStartShow) {
                        screens[marquee.index+1].api.state.isStartShow = true;
                        screens[marquee.index+1].$block.triggerHandler('startShow');
                    } else if (position.bottom<0.1 && screens[marquee.index+1].api.state.isStartShow) {
                        screens[marquee.index+1].api.state.isStartShow = false;
                    }
                    if (position.bottom>0.9 && !screens[marquee.index+1].api.state.isEndShow) {
                        screens[marquee.index+1].api.state.isEndShow = true;
                        screens[marquee.index+1].$block.triggerHandler('endShow');
                    } else if (position.bottom<0.9 && screens[marquee.index+1].api.state.isEndShow) {
                        screens[marquee.index+1].api.state.isEndShow = false;
                    }
                }
                // show start and end of current screen
                if (screens[marquee.index] && position.bottom<0.9 && !screens[marquee.index].api.state.isEndShow) {
                    screens[marquee.index].api.state.isEndShow = true;
                    screens[marquee.index].$block.triggerHandler('endShow');
                } else if (screens[marquee.index] && position.bottom>0.9 && screens[marquee.index].api.state.isEndShow) {
                    screens[marquee.index].api.state.isEndShow = false;
                }
                if (screens[marquee.index] && position.bottom<0.1 && !screens[marquee.index].api.state.isStartShow) {
                    screens[marquee.index].api.state.isStartShow = true;
                    screens[marquee.index].$block.triggerHandler('startShow');
                } else if (screens[marquee.index] && position.bottom>0.1 && screens[marquee.index].api.state.isStartShow) {
                    screens[marquee.index].api.state.isStartShow = false;
                }
            }
            // full show
            if (screens[marquee.index] && position.top>=0 && position.bottom<=0) {
                if (!screens[marquee.index].api.state.isFullShow) {
                    screens[marquee.index].api.state.isFullShow = true;
                    if (!app.device.isMobile) screens[marquee.index].$block.triggerHandler('show');
                    screens[marquee.index].$block.triggerHandler('fullShow');
                };
                for (var i=0; i<screens.length; i++) {
                    if (i!=marquee.index && screens[i].api.state.isFullShow) screens[i].api.state.isFullShow = false;
                };
            } else {
                for (var i=0; i<screens.length; i++) {
                    if (screens[i].api.state.isFullShow) {
                        screens[i].api.state.isFullShow = false;
                    }
                };
            };
            var visible = [Math.floor(marquee.progress), Math.ceil(marquee.progress)];
            // full hide
            if (marquee.animated) return false;
            for (var i=0; i<screens.length; i++) {
                if (i==visible[0] || i==visible[1]) {
                    screens[i].api.state.isFullHide = false;
                    // screens[i].$block[0].style.display = 'block';
                } else if (!screens[i].api.state.isFullHide) {
                    // screens[i].$block[0].style.display = 'none';
                    if (!app.device.isMobile) screens[marquee.index].$block.triggerHandler('hide');
                    screens[i].$block.triggerHandler('fullHide');
                    screens[i].api.state.isFullHide = true;
                }
            }
        };

        // mark nav
        marquee.markNav = function(){
            if (settings.navPrev) settings.navPrev[marquee.progress<=0.5 ? 'addClass' : 'removeClass']('i-disabled');
            if (settings.navNext) settings.navNext[marquee.progress>=screens.length-1.5 ? 'addClass' : 'removeClass']('i-disabled');
        };

        // redraw
        marquee.draw = function(){
            if (marquee.animated) return false;
            if (!effect.move || screens[marquee.index].ratio*marquee.position >= screens[marquee.index].ratio-1) {
                var position = 1-Math.abs(screens[marquee.index].ratio*marquee.position-screens[marquee.index].ratio);
                if (marquee.index>=0) effect.hide(screens[marquee.index].$block, position, marquee.size, screens[marquee.index].ratio);
                if (marquee.index<screens.length-1) effect.show(screens[marquee.index+1].$block, position, marquee.size, screens[marquee.index+1].ratio);
            } else {
                if (marquee.index>=0) effect.move(screens[marquee.index].$block, screens[marquee.index].ratio*marquee.position, marquee.size, screens[marquee.index].ratio);
                if (marquee.index<screens.length-1) effect.show(screens[marquee.index+1].$block, 0, marquee.size, screens[marquee.index+1].ratio);
            }
            // hide invisibles
            marquee.hideInvisibles();
            // mark nav buttons
            marquee.markNav();
        };

        // {fn} on scroll start
        marquee.onScrollStart = function(){
            marquee.scrolling = true;
        };

        // var triggerScrollEvent = function(){
        // 	$frame.triggerHandler('scroll', {
        // 		index: marquee.index,
        // 		position: marquee.position,
        // 		progress: marquee.progress,
        // 		size: marquee.size,
        // 		y: scroll.y
        // 	});
        // };

        // {fn} on scroll
        marquee.onScroll = function(){
            index = 0;
            marquee.update();
            // marquee.draw();
            if (app.device.isMobile) marquee.callScreensAPI();
            if (scroll.moved) {
                var position = scroll[settings.vertical ? 'y' : 'x'] - scroll[settings.vertical ? 'pointY' : 'pointX'];
                for (var i=0; i<screens.length; i++) {
                    if (position <= -screens[i].offset && position >= -screens[i].offset-screens[i].size) index = i;
                };
                marquee.setLimits(index);
            } else if (scroll.indicators && scroll.indicators[0].moved) {
                for (var i=0; i<screens.length; i++) {
                    if (scroll[settings.vertical ? 'y' : 'x']-marquee.size/2 <= -screens[i].offset && scroll[settings.vertical ? 'y' : 'x']+marquee.size/2 >= -screens[i].offset-screens[i].size) index = i;
                };
                marquee.setLimits(index);
            };
            // triggerScrollEvent();
        };

        // interactive
        marquee.grabTimer = false;
        var interactiveStart = function(){
            clearTimeout(marquee.grabTimer);
            if (!marquee.scrolling) {
                $frame.addClass('i-drag');
                marquee.scrolling = true;
            }
        };
        var interactiveEnd = function(){
            if (marquee) clearTimeout(marquee.grabTimer);
            if (marquee && marquee.scrolling) {
                $frame.removeClass('i-drag');
                marquee.scrolling = false;
            }
        };

        // {event} before wheel snap
        scroll.on('beforeWheelSnap', function(){
            index = 0;
            for (var i=0; i<screens.length; i++) {
                if (scroll[settings.vertical ? 'y' : 'x']-marquee.size/2 <= -screens[i].offset && scroll[settings.vertical ? 'y' : 'x']+marquee.size/2 >= -screens[i].offset-screens[i].size) index = i;
            };
            scroll.absStartX = settings.vertical ? 0 : -screens[index].offset;
            scroll.absStartY = -settings.vertical ? -screens[index].offset : 0;
            marquee.setLimits(index);
        });

        // {fn} on scroll end
        marquee.onScrollEnd = function(){
            // marquee.refresh();
            marquee.onScroll();
            app.utils.raf(marquee.refresh);
            // triggerScrollEvent();
        };

        // {fn} refresh
        marquee.refresh = function(){
            marquee.update();
            // marquee.draw();
            marquee.callScreensAPI();
            marquee.setLimits(marquee.index);
        };

        // {fn} resize
        marquee.resize = function(){
            if (!marquee) return false;
            dom.$root.addClass('root_resize');
            resize();
            if (marquee.enabled) screens[marquee.index].$block.triggerHandler('endShow');
            scroll.refresh();
            marquee.refresh();
            marquee.updateState();
            dom.$root.removeClass('root_resize');
        };

        // {fn} enable
        marquee.enable = function(){
            $frame.addClass('marquee_enabled');
            marquee.enabled = true;
            scroll.enable();
            marquee.enableKeyboard();
            $frame.on('dragstart.marquee', function(){
                return false;
            });
        };

        // {fn} disable
        marquee.disable = function(){
            $frame.removeClass('marquee_enabled');
            marquee.enabled = false;
            scroll.disable();
            marquee.disableKeyboard();
            $frame.off('dragstart.marquee');
        };

        // {event} scroll start
        scroll.on('scrollStart', function(){
            if (!marquee) return false;
            marquee.onScrollStart();
        });

        // {event} scroll move
        scroll.on('scroll', function(){
            if (!marquee) return false;
            marquee.onScroll();
            if (scroll.moved) interactiveStart();
        });

        // {event} scroll end
        scroll.on('scrollEnd', function(){
            if (!marquee) return false;
            marquee.onScrollEnd();
            interactiveEnd();
        });

        // {event} grab
        scroll.on('grab', function(){
            if (!marquee) return false;
            // interavtive
            interactiveStart();
            marquee.grabTimer = setTimeout(function(){
                if (scroll) scroll.reset();
                interactiveEnd();
            }, 500);
            // update
            var index = 0,
                position = scroll[settings.vertical ? 'y' : 'x'] - scroll[settings.vertical ? 'pointY' : 'pointX'];
            for (var i=0; i<screens.length; i++) {
                if (position <= -screens[i].offset && position >= -screens[i].offset-screens[i].size) index = i;
            };
            marquee.setLimits(index);
        });

        // {event} scroll end
        scroll.on('animate', function(){
            screens[marquee.index].$block.triggerHandler('leave');
        });

        // {event} window resize
        dom.$window.on('resize', marquee.resize);

        // set limits on first screen
        marquee.setLimits(0);

        // {fn} scroll to
        marquee.scrollTo = function(index, duration){
            duration = duration===undefined ? settings.duration : duration;
            scroll.goToPage(!settings.vertical ? index : 0, settings.vertical ? index : 0, duration, IScroll.utils.ease.cubicOut);
            if (duration==0) marquee.refresh();
        };

        // {fn} prev
        marquee.prev = function(duration){
            if (marquee.scrolling) return false;
            duration = duration===undefined ? settings.duration : duration;
            var remaining = (-scroll.y - screens[marquee.index].offset);
            if (settings.vertical && remaining) {
                scroll.scrollBy(0, Math.min(remaining, marquee.size), duration, IScroll.utils.ease.cubicOut);
            } else if (settings.vertical && scroll.y<=-marquee.size) {
                scroll.scrollBy(0, marquee.size, duration, IScroll.utils.ease.cubicOut);
            } else if (marquee.index>0) {
                scroll.prev(duration, IScroll.utils.ease.cubicOut);
            }
        };

        // {fn} next
        marquee.next = function(duration){
            if (marquee.scrolling) return false;
            duration = duration===undefined ? settings.duration : duration;
            var remaining = (screens[marquee.index].offset + screens[marquee.index].size) - (-scroll.y + marquee.size)
            if (remaining>marquee.size*0.1 && settings.vertical) {
                scroll.scrollBy(0, -Math.min(remaining, marquee.size), duration, IScroll.utils.ease.cubicOut);
            } else if (marquee.index<screens.length-1) {
                scroll.next(duration, IScroll.utils.ease.cubicOut);
            }
        };

        // {fn} get marquee param
        marquee.get = function(parameter){
            return marquee[parameter];
        };

        // {fn} destroy marquee
        marquee.destroy = function(){
            marquee.disable();
            screens[marquee.index].$block.triggerHandler('fullHide');
            $frame.removeData('marquee');
            scroll.destroy();
            $frame = null;
            scroll = null;
            marquee = null;
        };

        // scroll
        if (settings.vertical) {
            var $scroll = $frame.find('.iScrollVerticalScrollbar');
            $scroll.addClass('ui-scroll').prepend('<div class="ui-scroll__bar" />');
            $scroll.find('.iScrollIndicator').addClass('ui-scroll__handle').prepend('<div class="ui-scroll__handle__inner" />');
        };

        // {event} click on prev
        if (settings.navPrev) settings.navPrev.on('click', function(){
            marquee.prev();
        });

        // {event} click on next
        if (settings.navNext) settings.navNext.on('click', function(){
            marquee.next();
        });

        // {event} enable keyboard
        var keyboardEventName = 'keydown.marquee-' + (name ? name : '') + (settings.vertical ? 'v' : 'h');
        marquee.enableKeyboard = function(){
            if (!app.device.support.touch) dom.$document.on(keyboardEventName, function(e){
                if (!$(e.target).is('input,textarea,select')) {
                    if (e.which==(settings.vertical ? 38 : 37)) marquee.prev();
                    if (e.which==(settings.vertical ? 40 : 39)) marquee.next();
                }
            });
        };

        // {event} disable keyboard
        marquee.disableKeyboard = function(){
            if (!app.device.support.touch) dom.$document.off(keyboardEventName);
        };

        marquee.activate = function(){
            var $screen = screens[marquee.index].$block;
            $frame.triggerHandler('init', { marquee: marquee });
            $screen.triggerHandler('show');
            $screen.triggerHandler('fullShow');
            marquee.updateState();
            if (settings.index) {
                marquee.scrollTo(settings.index=='last' ? screens.length-1 : settings.index, 0);
                scroll._execEvent('scrollEnd');
                settings.index = false;
            }
        };

        // api
        marquee.scroll = scroll;
        marquee.screens = screens;
        $frame.data('marquee', {
            screens: screens,
            scrollTo: marquee.scrollTo,
            get: marquee.get,
            scroll: scroll,
            updateState: marquee.updateState,
            update: marquee.onScroll,
            resize: marquee.resize,
            activate: marquee.activate,
            enable: marquee.enable,
            disable: marquee.disable,
            destroy: marquee.destroy,
            enableKeyboard: marquee.enableKeyboard,
            disableKeyboard: marquee.disableKeyboard
        });

        return marquee;

    };

})(app.dom);
$.fn.mouseScreen = function(){

    if (app.device.isMobile) return this;

    this.each(function(){

        var $screen = $(this),
            $mouse = $screen.find('.mouse'),
            isRemoved = false,
            isAnimated = false;

        var remove = function(){
            if (isRemoved) return false;
            isRemoved = true;
            $mouse.remove();
            $mouse = null;
            $screen = null;
        };

        $screen.one('show', function(){
            if (isAnimated || isRemoved) return false;
            var isAnimated = true;
            TweenMax.to($mouse[0], 0.5, {
                opacity: 0,
                delay: 4,
                ease: Cubic.easeIn,
                onComplete: remove
            });
        });

        $screen.on('fullHide', function(){
            if (isAnimated || isRemoved) return false;
            remove();
        });

    });

}
/* --- Prepare : plugin --- */
$.fn.prepare = function(){

    var $block = this;

    // Backgrounds
    $block.find('.bg').bg();

    // JS Links
    $block.find('.js-link').on('click.js-link', function(){
        if (app.isAnimated) return false;
        var href = $(this).attr('href') || $(this).data('href'),
            currentState = app.router.parse(app.router.get()),
            targetState = app.router.parse(href);
        if (currentState.mode!=targetState.mode || currentState.item!=targetState.item) {
            app.router.forceTo = app.router.parse(href);
            app.router.moveTo(href);
        } else if (app.menu.isOpened) {
            app.menu.close();
        }
        return false;
    });

    // Fast click
    FastClick.attach($block[0]);

};
$.fn.rotatorScreen = function(){

    var delay = 4000,
        activeClass = 'rotator__item_active';

    this.each(function(){

        var $screen = $(this),
            $rotator = $screen.find('.rotator'),
            $items = $rotator.find('.rotator__item'),
            count = $items.length,
            index = 0,
            played = false,
            interval;

        var activate = function(i){
            $items.eq(index).removeClass(activeClass);
            $items.eq(i).addClass(activeClass);
            index = i;
        };
        activate(0);

        var play = function(){
            if (played) return false;
            played = true;
            clearInterval(interval);
            interval = setInterval(function(){
                activate((index+1>=count) ? 0 : index+1);
            }, delay);
        };

        var pause = function(){
            if (!played) return false;
            played = false;
            clearInterval(interval);
        };

        $screen.on('show fullShow return', play);
        $screen.on('hide fullHide leave', pause);

    });

};
$.fn.screen = function(settings){

    var isWork = !settings.$logo.hasClass('ui-logo');
    settings.index = settings.index || 0;

    // each screens
    this.each(function(index){

        // vars
        var $screen = $(this),
            logoTheme = ($screen.data('logo-theme') || $screen.data('ui-theme')) || 'normal',
            menuTheme = ($screen.data('menu-theme') || $screen.data('ui-theme')) || 'normal',
            phoneLogoTheme = ($screen.data('phone-logo-theme') || $screen.data('phone-ui-theme')) || logoTheme,
            phoneMenuTheme = ($screen.data('phone-menu-theme') || $screen.data('phone-ui-theme')) || menuTheme;

        var $frame = $screen.find('.screen__frame').wrapInner('<div class="screen__frame__inner-wrap"><div class="screen__frame__inner" />'),
            $phonePicture = $screen.find('.screen__phone-picture').prependTo($frame).wrap('<div class="screen__phone-picture-wrap" />');

        // {event} on show end of  screen
        $screen.on('show return beforeShow', function(e){
            if (isWork && app.device.isWorkPanelVisible) {
                settings.$logo.toggleClass(
                    'work__logo_light',
                    app.device.isPhone ? phoneLogoTheme == 'light' : logoTheme=='light'
                );
                settings.$logo.toggleClass(
                    'work__logo_secondary',
                    app.device.isPhone ? phoneLogoTheme == 'secondary' : logoTheme=='secondary'
                );
            } else {
                app.dom.ui.$logo.toggleClass(
                    'ui-logo_light',
                    (app.device.isPhone || !app.device.isWorkPanelVisible) ? phoneLogoTheme == 'light' : logoTheme=='light'
                );
            };
            app.dom.ui.$menu.toggleClass(
                'ui-menu_light',
                app.device.isPhone ? phoneMenuTheme == 'light' : menuTheme=='light'
            );
        });

        if (settings.index!==index) $screen.addClass('screen_inactive');

        var $next = $screen.next('.screen'),
            $afterNext = $next.next('.screen'),
            $prev = $screen.prev('.screen'),
            $links = $screen.find('.js-link');
        $screen.one('fullShow', function(){
            $screen.add($next).add($afterNext).add($prev).removeClass('screen_inactive').loadBG();
            $next = null;
            $prev = null;
        });

        $screen.one('fullShow', function(){
            $links.each(function(){
                var state = app.router.parse( $(this).attr('href') );
                if (state.mode=='work') app.works.preload( state.item );
                state = null;
            });
            $links = null;
        });

        // {fn} check visibibily
        // var isVisible = function(){
        // 	return $work.data('work') && $work.data('work').state.active;
        // }

        // {event} on show screen
        // $screen.on('show', function(){
        // 	if (!isVisible()) return;
        // 	if ($work.data('work') && $work.data('work').setScrollColor) $work.data('work').setScrollColor($screen.data('color'));
        // 	site.ui.fill('nav', $screen.data('color'));
        // });

        // {event} on show start of  screen
        // $screen.on('startShow', function(){
        // 	if (!isVisible()) return;
        // 	site.ui.fill('like', $screen.data('color'));
        // 	site.ui.fill('lang', $screen.data('color'));
        // 	site.ui.fill('works', $screen.data('color'));
        // 	$work.data('color', $screen.data('color'));
        // });

        // mode classes
        $screen.find('.screen__content').addClass('screen__content_in-' + settings.mode)
            .find('.screen__content__data').addClass('screen__content__data_in-' + settings.mode);
        $screen.find('.screen__title').addClass('screen__title_in-' + settings.mode)
            .toggleClass('screen__title_titled', $frame.hasClass('screen__frame_titled'))
            .toggleClass('screen__title_titled_with-phone-picture', !!$phonePicture.length);
        $frame.find('.screen__frame__inner').addClass('screen__frame__inner_in-' + settings.mode)
            .toggleClass('screen__frame__inner_titled', $frame.hasClass('screen__frame_titled'))
            .toggleClass('screen__frame__inner_titled_beta', $frame.hasClass('screen__frame_titled_beta'))
            .toggleClass('screen__frame__inner_titled_massive', $frame.hasClass('screen__frame_titled_massive'))
            .toggleClass('screen__frame__inner_phone-bottom', $frame.hasClass('screen__frame_phone-bottom'))
            .toggleClass('screen__frame__inner_with-phone-picture', !!$phonePicture.length);

    });

    return this;

};
(function(utils, dom, works){


    $.fn.workCover = function($work, workName){

        this.find('.screen__frame__inner').addClass('work__cover__inner');

        var videoURL = 'http://chulakov-fantasy.s3.amazonaws.com/cases/#name#.mp4';
        var videoURL2 = 'http://fantasy.co/data/#name#.mp4';

        this.each(function(){

            if (!app.works.items[workName].video) return false;

            var $cover = $(this),
                src = (app.works.items[workName].videoAlternate ? videoURL2 : videoURL).replace('#name#', workName);

            // if (app.device.isIOS) {
            // 	$('<a class="work__cover__play" />').attr('href', src).appendTo($cover);
            // 	return false;
            // };

            var $play = $('<i class="work__cover__play" />').appendTo($cover),
                $videoWrap = $('<div class="work__cover__video" />').appendTo($cover),
                $video = $([]);

            var video = {
                timer: null,
                loaded: false,
                visible: false,
                playing: false,
                toggle: function(){
                    if (video.visible && video.playing) {
                        video.pause();
                    } else if (video.visible && !video.playing) {
                        video.play();
                    } else if (!video.visible) {
                        video.show();
                    }
                },
                play: function(){
                    if (!video.loaded) video.load();
                    video.playing = true;
                    $video[0].play();
                    $play.addClass('work__cover__play_pause');
                },
                pause: function(){
                    video.playing = false;
                    $video[0].pause();
                    $play.removeClass('work__cover__play_pause');
                },
                show: function(){
                    if (video.visible) return false;
                    video.visible = true;
                    $videoWrap.addClass('work__cover__video_visible');
                    video.play();
                    app.dom.$root.addClass('root_work_video root_work_video_force');
                    app.utils.delayRender(function(){
                        app.dom.$root.removeClass('root_work_video_force');
                        $videoWrap.addClass('work__cover__video_visible_animated');
                        ui.hide();
                    });
                    app.utils.delayDuration(function(){
                        app.dom.$root.on('mousemove.work-cover', function(){
                            ui.show();
                            ui.waitToHide();
                        });
                        $play.add($video).on('click.work-cover', function(){
                            ui.show();
                            ui.waitToHide();
                        });
                    });
                },
                hide: function(){
                    if (!video.visible) return false;
                    video.visible = false;
                    video.pause();
                    $play.removeClass('work__cover__play_pause');
                    $videoWrap.removeClass('work__cover__video_visible_animated');
                    app.dom.$root.addClass('root_work_video_force').removeClass('root_work_video');
                    app.utils.delayRender(function(){
                        app.dom.$root.removeClass('root_work_video_force');
                    });
                    app.utils.delayDuration(function(){
                        $videoWrap.removeClass('work__cover__video_visible');
                    });
                    app.dom.$root.off('mousemove.work-cover');
                    $play.add($video).off('click.work-cover');
                },
                load: function(){
                    clearTimeout(video.timer);
                    if (video.loaded) return false;
                    video.loaded = true;
                    if (!$video.length) {
                        $video = $('<video class="work__cover__video__player" preload="none" />').appendTo($videoWrap).on('click', video.toggle);
                    }
                    $video[0].src = src;
                    if (!app.device.isMobile) $video[0].load();
                },
                unload: function(){
                    clearTimeout(video.timer);
                    if (!video.loaded) return false;
                    video.loaded = false;
                    if (!app.device.isMobile) {
                        $video[0].src = '';
                        if ($video[0].currentTime) $video[0].currentTime = 0;
                        $video[0].load();
                    }
                }
            };

            $video.on('ended', video.pause);

            var ui = {
                timer: null,
                visible: true,
                show: function(){
                    if (ui.visible) return false;
                    ui.visible = true;
                    clearTimeout(ui.timer);
                    app.dom.$root.removeClass('root_work_no-ui');
                },
                hide: function(){
                    if (!ui.visible) return false;
                    ui.visible = false;
                    clearTimeout(ui.timer);
                    app.dom.$root.addClass('root_work_no-ui');
                },
                waitToHide: function(){
                    clearTimeout(ui.timer);
                    ui.timer = setTimeout(ui.hide, 1500);
                }
            };

            $work.on('close', function(){
                clearTimeout(ui.timer);
                ui.show();
                video.hide();
                video.unload();
            });

            $cover.on('fullShow', function(){
                video.timer = setTimeout(video.load, 1000);
            });

            $cover.on('fullHide', function(){
                clearTimeout(ui.timer);
                clearTimeout(video.timer);
                ui.show();
                video.hide();
                video.unload();
            });

            $work.find('.work__case__marquee').on('scroll', function(e, data){
                if (video.visible && data.progress!=0) {
                    ui.show();
                } else if (video.visible && data.progress==0) {
                    ui.waitToHide();
                }
            });

            $play.on('click', video.toggle);

        });

    };

})(app.utils, app.dom, app.works);
(function(device, dom, sizes){

    /* --- Mobile --- */
    device.support = Modernizr;

    /* --- Mobile --- */
    device.isMobile = device.support.touch;
    dom.$html.addClass(device.isMobile ? 'd-mobile' : 'd-no-mobile');

    /* --- Check --- */
    device.check = function(){
        device.isTablet = (sizes.width<1024);
        device.isPhone = (sizes.width<768);
        device.isWorkPanelVisible = (sizes.width>887);
        dom.$html.addClass(device.isPhone ? 'd-phone' : 'd-no-phone');
        dom.$html.removeClass(device.isPhone ? 'd-no-phone' : 'd-phone');
        return device.isPhone;
    };
    app.dom.$window.on('resize.check', device.check);

    /* --- Retina --- */
    device.isRetina = (window.devicePixelRatio && window.devicePixelRatio>1);

    /* --- iOS --- */
    if (navigator.userAgent.match(/iPad/i)) {
        dom.$html.addClass('d-ipad');
        device.isIPad = true;
    };
    if (navigator.userAgent.match(/(iPhone|iPod touch)/i)) {
        dom.$html.addClass('d-iphone');
        device.isIPhone = true;
    };
    if (navigator.userAgent.match(/(iPad|iPhone|iPod touch)/i)) {
        dom.$html.addClass('d-ios');
        device.isIOS = true;
    };
    if (navigator.userAgent.match(/.*CPU.*OS 7_\d/i)) {
        dom.$html.addClass('d-ios7');
        device.isIOS7 = true;
    };

    /* --- iPad (for fix wrong window height) --- */
    if (dom.$html.hasClass('d-ipad d-ios7')) {
        dom.$window.on('resize orientationchange focusout', function(){
            window.scrollTo(0,0);
        });
    };

})(app.device, app.dom, app.sizes);
(function(loader){
    // history
    loader.history = [];
    // {fn} load resources
    loader.resources = function(resources, complete, callback){
        // check callbacks
        complete = complete || $.noop;
        callback = callback || $.noop;
        // unchached resources
        var unchached = [];
        for (var i=0; i<resources.length; i++) {
            if (loader.history.indexOf(resources[i])<0) unchached.push(resources[i]);
        };
        // if resources is empty
        if (!unchached.length) return complete();
        // load
        Modernizr.load({
            load: unchached,
            callback: function(url){
                loader.history.push(url);
                callback();
            },
            complete: complete
        });
    };
    // {fn} load images
    loader.images = function($block, complete, callback){
        var loaded = 0;
        // check callbacks
        complete = complete || $.noop;
        callback = callback || $.noop;
        // init plugin
        $block.imagesLoaded().always(complete).progress(function(instance, i){
            loaded++;
            console.log(i.img.src)
            callback(loaded, instance.images.length)
        });
    }
    // {fn} load data
    loader.data = function(url, complete, data){
        return $.ajax({
            url: url,
            method: 'post',
            success: complete,
            data: data || {}
        });
    };
})(app.loader);
(function(menu, dom, utils, pages, works){

    menu.isOpened = false;
    dom.$root.addClass('root_menu_closed');

    var $overlay = $('<i class="menu__overlay" />').insertBefore(dom.ui.$menu);

    // show timeline
    var showTimeline = new TimelineLite({
        paused: true,
        onComplete: function(){
            menu.isFreeze = false;
        }
    });
    showTimeline
        .fromTo(app.dom.$menu[0], 0.33333, { x: '0%', opacity: 1, display: 'none' }, { x: '-100%', opacity: 1, display: 'block', ease: Cubic.easeOut }, 0)
        .fromTo($overlay[0], app.config.duration/1000, { opacity: 0, display: 'none' }, { opacity: 0.8, display: 'block', ease: Cubic.easeOut }, 0);

    // show timeline
    var hideTimeline = new TimelineLite({
        paused: true,
        onComplete: function(){
            menu.isFreeze = false;
            if (pages.name && !works.name) pages.activate(pages.name);
        }
    });

    hideTimeline
        .fromTo(app.dom.$menu[0], 0.2, { opacity: 1, display: 'block' }, { opacity: 0, ease: Cubic.easeOut, display:'none' }, 0)
        .to($overlay[0], 0.2, { opacity: 0, display:'none', ease: Cubic.easeOut }, 0);

    menu.open = function(){
        if (menu.isFreeze || menu.isOpened) return false;
        menu.isFreeze = true;
        menu.isOpened = true;
        if (pages.name && !works.name) pages.deactivate(pages.name);
        showTimeline.restart();
        dom.$root.addClass('root_menu_opened').removeClass('root_menu_closed');
        // app.marquee.disable();
    };

    menu.close = function(force){
        if (menu.isFreeze || !menu.isOpened) return false;
        menu.isOpened = false;
        if (force) {
            app.dom.$menu.add($overlay).css('display', 'none');
            // if (pages.name && !works.name) pages.activate(pages.name);
        } else {
            menu.isFreeze = true;
            hideTimeline.restart();
        }
        dom.$root.removeClass('root_menu_opened').addClass('root_menu_closed');
        // app.marquee.enable();
    };

    menu.toggle = function(){
        menu.isOpened ? menu.close() : menu.open();
    };

    dom.ui.$menu.on('click', menu.toggle);

    $overlay.on('click', function(){
        menu.close();
    });

})(app.menu, app.dom, app.utils, app.pages, app.works);
(function(works, dom, utils, loader, pages, router, menu){

    var $pages = dom.$root.find('.pages');

    pages.open = function(name, screenName, callback, toWork){
        if (works.name) {
            menu.close();
            works.close();
        };
        // names
        if (pages.name==name || app.isAnimated) return false;
        var prevName = pages.name;
        app.utils.beforeAnimation();
        pages.name = name;
        // vars
        var page = pages.items[name];
        router.set(name=='home' ? '' : name, page.title);
        var templateName = (page.hasPhoneTemplate && app.device.isPhone) ? 'page-' + name + '-phone-template' : 'page-' + name + '-template',
            html = document.getElementById(templateName).innerHTML;
        if (app.device.isMobile) html = html.replace(/<video([ a-zA-Z0-9\-\_\.\:\/\"\=]*)><\/video>/g, '');
        page.$block = $(html);
        pages.show(name, prevName, screenName, callback, toWork);
        templateName = null;
        html = null;
    };

    pages.show = function(name, prevName, screenName, callback, toWork){
        var page = pages.items[name];
        dom.$root.addClass('root_page_' + name);
        // render page
        var $screens = page.$block.find('.screen'),
            screenNameIndex = screenName ? $screens.index($screens.filter('[data-name="'+screenName+'"]')) : 0;
        $screens.screen({
            'mode': 'page',
            '$logo': dom.ui.$logo,
            'index': screenNameIndex
        }).first().loadBG();
        page.$block.appendTo($pages).show().prepare();
        // page plugin
        if (page.plugins) page.plugins.forEach(function(pluginName){
            page.$block[pluginName](page);
        });
        // marquee
        utils.delayRender(function(){
            page.marquee = page.$block.marquee({
                index: screenNameIndex
            });
        });
        // {fn} activate page
        var activate = function(){
            if (!prevName) page.$block.addClass('page_active_force');
            page.$block.addClass('page_active page_opening');
            if (!!prevName) pages.close(prevName);
            var $overlay = $('<div class="page__overlay" />').insertBefore(page.$block);
            if (menu.isOpened) menu.close(true);
            page.marquee.screens[page.marquee.index].$block.triggerHandler('beforeShow');
            TweenMax.to(page.$block[0], app.config.moveTime/1000, {
                opacity: 1,
                ease: Cubic.easeOut,
                onComplete: function(){
                    $overlay.remove();
                    if (page.$block) page.$block.removeClass('page_opening');
                    if (page.marquee) page.marquee.activate();
                    app.utils.afterAnimation();
                }
            });
            if (callback) callback();
            $screens = null;
        };
        // page state
        if (works.name) {
            // menu.close();
            works.close();
            utils.delayDuration(activate);
            // } else if (menu.isOpened) {
            // menu.close();
            // utils.delayRender(activate);
        } else {
            utils.delayRender(activate);
        }
    };

    pages.activate = function(name){
        var page = pages.items[name];
        router.set(name=='home' ? '' : name, page.title);
        page.marquee.updateState();
        page.marquee.screens[page.marquee.index].$block.triggerHandler('return');
    };

    pages.deactivate = function(name){
        var page = pages.items[name];
        if (!page.marquee.enabled) return false;
        page.marquee.disable();
        page.marquee.screens[page.marquee.index].$block.triggerHandler('leave');
    };

    pages.close = function(name, force){
        dom.$root.removeClass('root_page_' + name);
        var page = pages.items[name];
        page.$block.triggerHandler('close');
        page.marquee.screens[page.marquee.index].$block.triggerHandler('fullHide');
        page.marquee.disable();
        page.$block.remove();
        var remove = function(){
            page.marquee.destroy();
            page.$block.remove();
            page.$block = null;
        };
        if (force) {
            remove();
        } else {
            utils.delayDuration(remove);
        }
    };

})(app.works, app.dom, app.utils, app.loader, app.pages, app.router, app.menu);

(function(router, works, pages, utils){

    // vars
    router.base = '/';
    router.isManual = false;
    router.forceTo = false;
    var matcher = /^\/?([a-z0-9_-]+)\/?([a-z0-9_-]*)\/?\#?([a-z0-9_-]*)?$/i;

    History.options.disableSuid = true;

    router.check = function(){
        var state = router.parse(router.get());
        if (router.forceTo && (router.forceTo.mode!=state.mode || router.forceTo.item!=state.item)) {
            router.moveTo(router.forceTo);
            return false;
        } else {
            router.forceTo = false;
        }
        if ((state.mode=='work' && app.works.name != state.item) || (state.mode=='work' && app.works.name != state.item) || (state.mode=='pages' && app.pages.name != state.item)) router.moveTo(state);
    };

    History.Adapter.bind(window, 'statechange', function(e){
        if (router.isManual || app.isAnimated) return false;
        router.moveTo(router.get());
    });

    // {fn} api: set url
    router.set = function(url, title, replace){
        if (!app.isAnimated) return false;
        router.isManual = true;
        History[replace ? 'replaceState' : 'pushState'](null, title || null, router.base + url);
        utils.delayRender(function(){
            router.isManual = false;
        });
        if (typeof ga!=='undefined') ga('send', 'pageview', router.base + url);
    };

    // {fn} api: back to prev screen
    router.get = function(){
        var hash = History.getState().hash;
        // if (hash.indexOf('#')>=0) hash = hash.split('#')[1];
        if (hash.indexOf(router.base)==0) hash = hash.replace(router.base, '');
        hash = hash.replace('.', '').split('?')[0];
        // var regExp = new RegExp(/^\/?(.*)\/?$/);
        return hash;
    };

    // {fn} move to
    router.moveTo = function(value, force){
        var state = (typeof value == 'string') ? router.parse(value) : value;
        if (force) router.forceTo = state;
        if (state && state.mode=='work') {
            app.works.open(state.item, state.hash ? state.hash : false);
        } else if (state && state.mode=='pages') {
            app.pages.open(state.item, state.hash ? state.hash : false);
        } else {
            return false;
        }
    };

    // {fn} api: get url
    router.back = function(){
        if (!app.isAnimated) History.back();
    };

    // {fn} parse
    router.parse = function(string) {
        var match = string.match(matcher);
        if (match && !match[3]) match[3] = false;
        if (string=='/' || string=='') {
            return { mode: 'pages', item: 'home' };
        } else if (match && match[1]=='work' && works.items[match[2]]) {
            return { mode: 'work', item: match[2], hash: match[3] };
        } else if (match && pages.items[match[1]]) {
            return { mode: 'pages', item: match[1], hash: match[3] };
        } else {
            return false;
        }
    };

})(app.router, app.works, app.pages, app.utils);
(function(sizes){
    // {fn} update sizes
    var update = function(){
        sizes.width = app.dom.$window.width();
        sizes.height = parseInt(window.innerHeight,10);
    };
    // {event} window resize
    app.dom.$window.on('resize.app', update);
    // init
    update();
    app.device.check();
})(app.sizes);
(function(utils, config){

    utils.delayRender = function(callback){
        return setTimeout(callback, config.renderDelay);
    };

    utils.delayDuration = function(callback){
        return setTimeout(callback, config.duration);
    };

    utils.delayMove = function(callback){
        return setTimeout(callback, config.moveTime);
    };

    utils.delayFaster = function(callback){
        return setTimeout(callback, config.faster);
    };

    utils.raf = function(callback){
        var func = window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame;
        if (func) {
            return func(callback);
        } else {
            return window.setTimeout(callback, 1000 / 60);
        }
    };

    utils.caf = function(frame){
        var func = window.cancelAnimationFrame ||
            window.webkitCancelRequestAnimationFrame ||
            window.mozCancelRequestAnimationFrame ||
            window.oCancelRequestAnimationFrame ||
            window.msCancelRequestAnimationFrame ||
            clearTimeout;
        func(frame);
        frame = null;
    }

    utils.beforeAnimation = function(){
        app.isAnimated = true;
    };

    utils.afterAnimation = function(){
        app.isAnimated = false;
        app.router.check();
    };

    // utils.prepareTemplate = function(string){
    // 	console.time('tmp')
    // 	return string.replace(/\<img ([a-zA-Z0-9\/\"\'\=\-\.\:_ ]{1,})(bg__image)/g, '<i $1$2');
    // 	console.timeEnd('tmp')
    // }

})(app.utils, app.config);
(function(works, dom, utils, loader, pages){

    var $works = dom.$root.find('.works'),
        $back = dom.$root.find('.works__back'),
        $overlay = dom.$root.find('.works__overlay');

    $(function(){
        var prevName = false;
        for (name in works.items) {
            if (works.items[name].category!='legacy') {
                works.items[name].prev = prevName;
                if (prevName) works.items[prevName].next = name;
                prevName = name;
            }
        };
    });

    works.open = function(name, theme, toPrev){
        if (!works.items[name] || works.items[name].disabled || works.name==name || app.isAnimated) return false;
        var prevName = !toPrev ? (works.name || false) : false,
            $prevWork = prevName ? works.$work : false;
        works.name = name;
        app.utils.beforeAnimation();
        // disable page
        pages.deactivate(pages.name);
        // vars
        var settings = works.items[name];
        // loaded = { resources:false, html:false, images:false };
        // url
        app.router.set('work/'+name, settings.title, prevName || toPrev);
        // load css
        // loader.resources(settings.css, function(){
        // 	loaded.resources = true;
        // 	if (loaded.resources && loaded.html && loaded.images) works.show(name, prevName, $prevWork, theme);
        // });
        // load html
        // loader.data('/works/build.php', function(html){
        works.$work = $(document.getElementById('work-' + name + '-template').innerHTML);
        // 	loaded.html = true;
        // works.$work = $(html);
        loader.images(works.$work, function(){
            // loaded.images = true;
            works.show(name, prevName, $prevWork, theme, toPrev);
        });
        // }, { name: name });
    };

    works.show = function(name, prevName, $prevWork, theme, toPrev){
        // check work is still active
        if (works.name!=name) return false;
        // render work
        if (toPrev) {
            works.$work.addClass('work_active');
            app.utils.afterAnimation();
        } else if (prevName) {
            works.$work.addClass('work_next');
            setTimeout(function(){
                $prevWork.remove();
                $prevWork = null;
            }, app.config.moveTime)
        } else {
            $overlay.addClass('works__overlay_show');
            $back.addClass('works__back_show');
        }
        var $logo =  works.$work.find('.work__logo_primary');
        if (theme) $logo.addClass('work__logo_' + theme);
        works.$work.find('.screen').screen({
            'mode': 'work',
            '$logo': $logo
        }).first().loadBG();
        works.$work.appendTo($works).show().prepare();
        works.$work.find('.work__cover').workCover(works.$work, name);
        // plugins
        var work = works.items[name];
        if (work.plugins) work.plugins.forEach(function(pluginName){
            works.$work[pluginName]();
        });
        // next
        if (works.items[name].next || (works.items[name].prev && works.items[name].isNext)) {
            var next = function(){
                if (nextTriggered || works.isChanging || app.isAnimated) return false;
                nextTriggered = true;
                works.isChanging = true;
                var marquee = works.marquee;
                clearTimeout(delay);
                works.items[works.items[name].next].isNext = true;
                var theme = works.items[works.items[name].next]['next-theme'];
                if (marquee) marquee.disable();
                works.$prev = works.$work;
                works.$prev.addClass('work_prev');
                $footer.addClass('work__next_active').off('click');
                app.dom.ui.$menu.toggleClass('ui-menu_' + theme);
                marquee.screens.forEach(function(screen, i){
                    if (i<marquee.screens.length-1) {
                        screen.$block.remove();
                    } else {
                        screen.$block.css('top', screen.offset);
                    }
                });
                app.utils.delayDuration(function(){
                    if (marquee) marquee.destroy();
                    marquee = null;
                    works.open(works.items[name].next, theme);
                    works.isChanging = false;
                });
            };
            var prev = function(){
                if (prevTriggered || works.isChanging || app.isAnimated) return false;
                prevTriggered = true;
                works.isChanging = true;
                if (works.marquee) {
                    works.marquee.screens.forEach(function(screen, i){
                        if (i>0) screen.$block.remove();
                    });
                    works.marquee.destroy();
                    works.marquee = null;
                }
                works.$prev = works.$work;
                works.open(works.items[name].prev, 'normal', function(){
                    works.$prev.addClass('work_hide-next')
                    TweenMax.fromTo(works.$prev[0], app.config.duration/1000, {
                        y: 0
                    }, {
                        y: app.sizes.height,
                        ease: Cubic.easeIn,
                        onComplete: function(){
                            works.isChanging = false;
                            works.$prev.remove();
                            works.$prev = null;
                            works.isChanging = false;
                        }
                    });
                });
            };
            works.marquee = works.$work.find('.marquee').marquee({
                index: toPrev ? 'last' : 0,
                prev: works.items[name].prev && works.items[name].isNext ? prev : false,
                next: works.items[name].next ? function(){
                    clearTimeout(delay);
                    footerVisible ? next() : showFooter();
                } : false
            });
            if (toPrev) toPrev();
            var $getInTouch = works.marquee.screens[works.marquee.screens.length-1].$block,
                $footer = $getInTouch.find('.work__next'),
                nextTriggered = false,
                prevTriggered = false,
                footerVisible = false,
                delay;
            var showFooter = function(){
                footerVisible = true;
                clearTimeout(delay);
                $footer.addClass('work__next_show');
            };
            $footer.on('click', next);
            $getInTouch.on('fullShow', function(){
                delay = setTimeout(showFooter, app.config.moveTime);
            });
            if (app.device.isMobile) {
                works.marquee.scroll.on('scrollReset', function(){
                    showFooter();
                    if (app.isAnimated || nextTriggered || prevTriggered) return false;
                    if (works.items[name].next && -works.marquee.scroll.y - 20 > works.marquee.scroll.scrollerHeight-works.marquee.scroll.wrapperHeight) {
                        next();
                    } else if (works.items[name].prev && works.items[name].isNext && works.marquee.scroll.y > 20) {
                        prev();
                    }
                });
            }
        } else {
            works.marquee = works.$work.find('.marquee').marquee();
        }
        var onComplete = function(){
            dom.$root.addClass('root_work_opened');
            works.$work.removeClass('work_opening');
            works.$work.addClass('work_active');
            app.utils.afterAnimation();
        };
        works.marquee.activate();
        if (!toPrev) {
            works.$work.addClass('work_active work_opening');
            if (!prevName) {
                $back.addClass('works__back_active');
                $overlay.addClass('works__overlay_active');
                dom.$root.addClass('root_work');
                TweenMax.fromTo(works.$work[0], app.config.moveTime/1000, {
                    x: app.sizes.width - (app.device.isWorkPanelVisible ? $back.width() : 0)
                }, {
                    x: 0,
                    ease: Expo.easeInOut,
                    onComplete: onComplete
                });
            } else {
                TweenMax.fromTo(works.$work[0], app.config.duration/1000, {
                    opacity: 0
                }, {
                    opacity: 1,
                    onComplete: function(){
                        onComplete();
                        if (works.$prev) {
                            works.$prev.remove();
                            works.$prev = null;
                        }
                    }
                });
            }
        };
    };

    works.close = function(){
        if (!works.name || !works.$work || app.isAnimated) return false;
        works.name = false;
        app.utils.beforeAnimation();
        works.$work.triggerHandler('close');
        dom.$root.removeClass('root_work_opened');
        app.dom.$root.removeClass('root_works-back-hover').addClass('root_work_close');
        $back.removeClass('works__back_active');
        $overlay.removeClass('works__overlay_active');
        works.$work.removeClass('work_active');
        if (works.marquee) works.marquee.disable();
        utils.delayRender(function(){
            dom.$root.removeClass('root_work');
        });
        TweenMax.fromTo(works.$work[0], 0.8, {
            x: 0
        }, {
            x: app.sizes.width - (app.device.isWorkPanelVisible ? $back.width() : 0),
            ease: Expo.easeInOut,
            onComplete: function(){
                pages.activate(pages.name);
                if (works.marquee) works.marquee.destroy();
                works.marquee = null;
                dom.$root.removeClass('root_work_close');
                $overlay.removeClass('works__overlay_show');
                $back.removeClass('works__back_show');
                works.$work.remove();
                works.$work = null;
                app.utils.afterAnimation();
            }
        });
        for (name in works.items) {
            works.items[name].isNext = false;
        };
    };

    works.preload = function(name){
        if (works.items[name].preload) {
            works.items[name].preload.forEach(function(url){
                var image = new Image();
                image.src = url.replace('~', '/works/'+name+'/images/');
            });
        }
    };

    $overlay.add($back).on('click', function(){
        app.router.moveTo({ mode:'pages', item:app.pages.name }, true);
    });

    $back.hover(function(){
        if (works.name) app.dom.$root.addClass('root_works-back-hover');
    }, function(){
        app.dom.$root.removeClass('root_works-back-hover');
    })

})(app.works, app.dom, app.utils, app.loader, app.pages);
$(function(){

    (function(dom, router){

        // Disable document events
        dom.$document.on('touchmove MSPointerMove', function(e){
            e.preventDefault();
        });
        dom.$window.on('mousewheel', function(e){
            e.preventDefault();
        });

        // Prepare block
        dom.$root.prepare();

        // Logo
        dom.ui.$logo.on('click', function(){
            if (app.works.name && app.pages.name) {
                // router.back();
                router.moveTo({ mode:'pages', item:app.pages.name }, true);
                return false;
            } else if (app.pages.name!='home') {
                router.moveTo('');
                return false;
            }
        });

        // Open URL
        var run = function(){
            var state = router.parse(router.get());
            if (state.mode != 'pages') {
                app.pages.open('work');
                router.forceTo = state;
            } else {
                router.moveTo(state);
            }
        };
        // if (app.device.isMobile) {
        run();
        // } else {
        // 	var afterlag = new Afterlag();
        // 	afterlag.run(run);
        // }

    })(app.dom, app.router);

});
$.fn.aboutPage = function(){

    var $introScreen = $(this).find('.about__intro');
    $introScreen.rotatorScreen();
    $introScreen.mouseScreen();

};
$.fn.contactPage = function(){

    var $page = this,
        isPhone = app.device.isPhone;

    app.dom.$window.on('resize.contact', function(){
        if (isPhone != app.device.isPhone) {
            app.dom.$window.off('resize.contact');
            app.pages.close('contact', true);
            app.pages.name = false;
            app.pages.open('contact');
        }
    });

    $page.on('close', function(){
        app.dom.$window.off('resize.contact');
    });

};
$.fn.homePage = function(){

    this.find('.home__intro_fantasy').mouseScreen();

};
(function(pages){

    var translateY = function($block, value){
        $block[0].style[prefixed.transform] = 'translateY(' + value + 'px)';
    };

    var translateX = function(block, value){
        block.style[prefixed.transform] = 'translateX(' + value + 'px)';
    };

    $.fn.workPage = function(){

        var $page = $(this),
            $marqueeContent = $page.find('.marquee__content'),
            $cats = $page.find('.works__category'),
            $screens = $page.find('.screen').addClass('screen_disabled'),
            $homeScreen = $page.find('.works__home'),
            $homeScreenInner = $page.find('.works__home__inner'),
            $panel = $page.find('.works__home__categories').insertAfter($marqueeContent),
            $panelItems = $panel.find('.works__home__categories__item'),
            count = $panelItems.length,
            name = 'work';

        $screens.on('fullShow', function(){
            $(this).removeClass('screen_disabled');
        });

        $screens.on('fullHide', function(){
            $(this).addClass('screen_disabled');
        });

        $homeScreen.rotatorScreen();

        $panel.add($panel.find('*')).attr('data-prevent', 'true');

        var getAnimatedProgress = function(marquee){
            marquee = marquee || pages.items[name].marquee;
            var progress = (marquee.animated.fromY - marquee.scroll.y)/(marquee.animated.fromY - marquee.animated.toY);
            if (marquee.animated.fromIndex > marquee.animated.toIndex) progress = 1-progress;
            return progress;
        }

        var getProgress = function(progress){
            var marquee = pages.items[name].marquee;
            if (typeof progress == 'undefined') progress = marquee.get('progress');
            if (marquee.animated && (marquee.animated.fromIndex==0 || marquee.animated.toIndex==0)) {
                var progress = getAnimatedProgress(marquee);
            } else if (marquee.animated) {
                var progress = 1;
            } else {
                var progress = Math.max(Math.min(progress, 1), 0);
            }
            return Math.max(Math.min(progress, 1), 0);
        };

        var panel = {
            isCompact: false,
            compactClass: 'works__home__categories_compact',
            itemCompactClass: 'works__home__categories__item_compact',
            update: function(){
                panel.height = app.device.isPhone ? 0 : $panel.outerHeight();
            },
            move: function(progress){
                progress = getProgress(progress);
                if (!panel.isCompact && progress>0) {
                    panel.isCompact = true;
                    $panel.addClass(panel.compactClass);
                    $panelItems.addClass(panel.itemCompactClass);
                } else if (panel.isCompact && progress<=0) {
                    panel.isCompact = false;
                    $panel.removeClass(panel.compactClass);
                    $panelItems.removeClass(panel.itemCompactClass);
                }
                translateY($panel, -app.sizes.height*progress);
                translateY($homeScreenInner, -panel.height*progress);
            },
            lastProgress: 0,
            moveItemsFrame: null,
            makeMoveItems: function(){
                // console.time('frame')
                var progress = getProgress();
                if (panel.lastProgress!=progress) {
                    var padding = (app.sizes.width > 1500 ? 250 : 110);
                    for (var i=0; i<count; i++){
                        if (i<count/2) {
                            translateX($panelItems[i], padding * progress * (count/2 - i) / (count/2) )
                        } else if (i>count/2) {
                            translateX($panelItems[i], - padding * progress * (i - count/2 ) / (count/2) )
                        }
                    }
                    panel.lastProgress = progress;
                    padding = null;
                }
                progress = null;
                // console.timeEnd('frame');
            },
            moveItems: function(){
                app.utils.caf(panel.moveItemsFrame);
                panel.moveItemsFrame = app.utils.raf(function(){
                    panel.makeMoveItems();
                    panel.moveItems();
                });
            }
        };
        if (!app.device.isPhone) panel.update();

        var page = {
            update: function(){
                page.height = app.sizes.height - panel.height;
                $page.height(page.height);
            },
            move: function(progress){
                progress = getProgress(progress);
                translateY($page, panel.height*progress);
            }
        };
        if (!app.device.isPhone) page.update();

        $cats.each(function(i){
            $(this).on('fullShow', function(){
                var name = $(this).attr('data-name');

                var cc = -1;
                var names = [];
                $cats.each(function() {
                    var namec = $(this).attr('data-name');

                    if (names.indexOf(namec) !== -1) {
                        return true;
                    }

                    names.push(namec);
                    cc++;

                    if (namec == name) {
                        return false;
                    }
                });

                console.log('cc', cc);

                $panelItems.removeClass('works__home__categories__item_active').eq(cc).addClass('works__home__categories__item_active');
            });
            // $(this).on('fullHide', function(){
            // 	var name = $(this).attr('data-name');

            // 	var cc = -1;
            // 	$cats.each(function() {
            // 		cc++;
            // 		var namec = $(this).attr('data-name');

            // 		if (namec == name) {
            // 			return false;
            // 		}
            // 	});

            // 	$panelItems.eq(cc).removeClass('works__home__categories__item_active');
            // });
        });

        var scrollTo = function(index){
            var marquee = pages.items[name].marquee,
                curIndex = marquee.index;
            if (marquee.animated || curIndex==index) return false;
            var marquee = pages.items[name].marquee;
            marquee.disable();
            marquee.animated = {
                fromIndex: curIndex,
                toIndex: index,
                fromY: marquee.scroll.y,
                toY: -marquee.screens[index].offset,
                bottom: Math.max(curIndex, index),
                top: Math.min(curIndex, index)
            };
            marquee.screens.forEach(function(screen, i){
                if (i!=curIndex && i!=index) screen.$block.css('display', 'none');
            });
            marquee.screens[marquee.animated.top].$block.css('margin-top', marquee.screens[marquee.animated.top].offset);
            // marquee.screens[marquee.animated.bottom].$block.css('margin-top', marquee.screens[marquee.animated.bottom].offset - marquee.screens[marquee.animated.top].offset - marquee.screens[marquee.animated.top].size);
            marquee.scroll.options.fake = true;
            marquee.scrollTo(index);
        };

        $panelItems.on('click', function(){
            if (pages.items[name].marquee.animated) return false;
            var index = $(this).data('index');
            scrollTo(index);
        });

        $page.data('work-page', {
            scrollTo: scrollTo
        });

        app.dom.$window.on('resize.work-page', function(){
            if (app.device.isPhone) {
                panel.update();
                page.update();
                page.move(0);
                panel.move(0);
            } else {
                var progress = $page.data('marquee').get('progress');
                panel.update();
                page.update();
                panel.move(progress);
                panel.makeMoveItems();
                page.move(progress);
            }
        });

        $page.on('close', function(){
            app.dom.$window.off('resize.work-page');
            app.utils.caf(panel.moveItemsFrame);
        });

        $page.on('init', function(e, data){
            var marquee = data.marquee;
            var onScroll = function(){
                var progress = getProgress();
                if (!app.device.isPhone) {
                    panel.move(progress);
                    page.move(progress);
                }
                if (marquee.animated && marquee.scroll.y==marquee.animated.toY) {
                    marquee.scroll.options.fake = false;
                    marquee.screens.forEach(function(screen){
                        screen.$block.css({ 'display': 'block', 'margin-top': 0 });
                    });
                    marquee.scrollTo(marquee.animated.toIndex, 0);
                    marquee.animated = false;
                    panel.makeMoveItems();
                    app.utils.caf(panel.moveItemsFrame);
                    marquee.enable();
                    marquee.refresh();
                } else if (marquee.animated) {
                    var progress = getAnimatedProgress(marquee);
                    if (marquee.animated.fromIndex<marquee.animated.toIndex) {
                        translateY( $marqueeContent, marquee.animated.fromY - marquee.size * progress );
                    } else {
                        translateY( $marqueeContent, marquee.animated.toY - marquee.size + marquee.size * (1-progress) );
                    }
                    bottom = null;
                    top = null;
                }
                progress = null;
            }
            marquee.scroll.on('scroll', onScroll);
            marquee.scroll.on('scrollStart', function(){
                if (!app.device.isPhone) panel.moveItems();
            });
            marquee.scroll.on('scrollEnd', function(){
                onScroll();
                panel.makeMoveItems();
                app.utils.caf(panel.moveItemsFrame);
            });
        });

    };

})(app.pages);
$.fn.adobeCase = function() {

    function startAnim() {
        $('.cards .card').eq(0).addClass('card-selected');

        $('.card-selected').eq(0).on('animationend webkitAnimationEnd', doneAnim);
        $('.cards__wrapper').addClass('startShuffle');
    }

    function halfAnim() {
        $('.card-selected').off('animationend webkitAnimationEnd', halfAnim);
        $('.card-selected').removeClass('card-selected').addClass('card-unselected');
        $('.card-unselected').on('animationend webkitAnimationEnd', doneAnim);
    }

    function doneAnim() {
        $('.card-selected').eq(0).off('animationend webkitAnimationEnd', doneAnim);
        $('.cards__wrapper').removeClass('startShuffle');

        var oldCard = $('.card-selected').eq(0).addClass('chidden').removeClass('card-selected');
        oldCard.appendTo($('.cards'));

        setTimeout(function() {
            oldCard.removeClass('chidden');
        }, 50);

        if (!$('.cards .card').eq(0).hasClass("blue")) {
            setTimeout(function() {
                startAnim();
            }, 500);
        }
    }

    var animateSearch = function($elem) {
        var toWrite = "how do I adjust the spacing  between characters";
        var toWriteLen = 27;

        var suggestions = [
            'between characters',
            'between objects',
            'between columns in a grid',
            'between Artboards in Illustrator',
            'between guides',
            'between columns in a grid',
            'between Artboards in Illustrator',
            'between guides'
        ];

        var writeChar = function(num) {
            var html = [];
            var foundSpace = 0;
            var foundSpaceAfter = 0;
            var cursor = false;

            for (var i = 0; i < toWrite.length; i++) {
                var char = toWrite[i];

                if (char == " ") {
                    char = "&nbsp;";
                }

                if (i <= Math.min(toWriteLen, num)) {
                    html.push('<span class="char-w">' + char + '</span>');

                    if (char == "&nbsp;") {
                        foundSpace++;
                    }
                } else {
                    if (!cursor) {
                        cursor = true;

                        html.push('<span class="cursor"></span>');
                    }

                    if (char == "&nbsp;") {
                        foundSpaceAfter++;
                    }

                    //display suggested text only after first word
                    if (foundSpace > 1 && foundSpaceAfter < 3) {
                        html.push('<span class="char-s">' + char + '</span>');
                    } else {
                        break;
                    }
                }
            }

            $elem.find('.input').html(html.join(''));

            if (num < toWriteLen) {
                setTimeout(function() {
                    writeChar(num+1);
                }, 100);
            } else {
                writeSuggestion(0);
            }
        };

        var writeSuggestion = function(num) {
            var suggestion = suggestions[num];

            var $suggestion = $('<div>How do I adjust the spacing <span class="output-blue">' + suggestion + '</div></div>');

            $elem.find('.search__output').append($suggestion);

            setTimeout(function() {
                $suggestion.addClass('loaded');
            }, 50);

            if (num+1 < suggestions.length) {
                setTimeout(function() {
                    writeSuggestion(num+1);
                }, 50);
            } else {
                showCursor();
            }
        };

        var showCursor = function() {
            $elem.find('.search__cursor').addClass('loaded');
            var $active = $elem.find('.search__output').children().eq(0).addClass('active');

            setTimeout(function() {
                $active = $active.removeClass('active')
                    .next().addClass('active');
            }, 400);

            setTimeout(function() {
                $active.removeClass('active')
                    .next().addClass('active');
            }, 800);
        };

        setTimeout(function() {
            writeChar(0);
        }, 1000);
    };

    var animateDesign = function($elem) {
        setTimeout(function() {
            $elem.find('.tooltip__circle__outer').addClass('loaded');
            $elem.find('.tooltip__bar').addClass('loaded');
        }, 1200);
    };

    var animateHelp = function($elem) {
        var changeScreen = function() {
            var $active = $elem.find('.bg__mac ul li.active');
            $active.removeClass('active');

            var $next = $active.next().length ? $active.next() : $active.parent().children().eq(0);
            $next.addClass('active');

            setTimeout(function() {
                changeScreen();
            }, 3000);
        };

        setTimeout(function() {
            changeScreen();
        }, 3000);
    };

    // var sly = new Sly($('.adobe .adobe__slideshow .slideshow__slider')[0], {
    // 	itemNav: 'forceCentered',
    // 	horizontal: true,
    // 	// easing: 'easeOutExpo',
    // 	smart: true,
    // 	mouseDragging: true,
    // 	touchDragging: true,
    // 	releaseSwing: true,
    // 	// scrollBy: 0,
    // 	speed: 600,
    // 	elasticBounds: true,
    // 	activateMiddle: true,
    // 	startAt: 0,
    // });

    // var slideshowInited = false;

    // var checkSlideshow = function() {
    // 	if (app.device.isPhone) {
    // 		$('.adobe .adobe__slideshow .slideshow__slider ul li').width(Math.floor($('.adobe .adobe__slideshow .slideshow__slider').width()));
    // 	} else {
    // 		$('.adobe .adobe__slideshow .slideshow__slider ul li').width(Math.floor($('.adobe .adobe__slideshow .slideshow__slider').width()/3));
    // 	}

    // 	if (!slideshowInited) {
    // 		sly.init();
    // 	} else {
    // 		sly.reload();
    // 	}
    // };

    // checkSlideshow();

    // app.dom.$window.on('resize.adobe', checkSlideshow);

    // if (app.device.isPhone) {
    // 	sly.next();
    // }

    $('.work.adobe .screen').on('show.adobe', function() {

        if (app.device.isPhone) {
            return false;
        }

        if ($(this).hasClass("adobe__doc") && !$(this).hasClass('loaded')) {
            new Vivus($('.adobe .adobe__doc svg')[0], {
                type: 'oneByOne',
                duration: 100,
                start: 'autostart'
            }, function() {
                $('.adobe .adobe__doc svg').attr('class', 'loaded');
            });
        }

        if ($(this).hasClass("adobe__cover") && !$(this).hasClass('loaded')) {
            animateSearch($(this));
        }

        if ($(this).hasClass("adobe__design") && !$(this).hasClass('loaded')) {
            animateDesign($(this));
        }
        if ($(this).hasClass("adobe__help") && !$(this).hasClass('loaded')) {
            animateHelp($(this));
        }

        if (!$(this).hasClass('loaded') && $(this).hasClass('adobe__slideshow')) {
            sly.next();
        }

        $(this).addClass('loaded');

        if ($(this).hasClass("adobe__personal") && !$(this).hasClass("animDone")){
            startAnim();
            $(this).addClass("animDone");
        }
    });
};
$.fn.healthcareCase = function(){

    this.find('.healthcare__details__list').each(function(){

        var $list = $(this).wrap('<div class="healthcare__details__slider" />'),
            $slider = $list.parent(),
            inited = false;

        var sly = new Sly($slider[0], {
            itemNav: 'basic',
            horizontal: true,
            // easing: 'easeOutExpo',
            smart: true,
            mouseDragging: false,
            touchDragging: true,
            releaseSwing: true,
            scrollBy: 0,
            speed: 600,
            elasticBounds: true
        });

        var check = function(){
            if (app.device.isPhone && !inited) {
                inited = true;
                sly.init();
            } else if (app.device.isPhone && inited) {
                sly.reload();
            } else {
                inited = false;
                sly.destroy();
                $list.removeAttr('style');
            }
        };
        check();

        $slider.closest('.screen').on('show', check);

        app.dom.$window.on('resize.healthcare', check);

    });

};
$.fn.shoppingCase = function() {
    var mouseHelper = function(options) {
        var self = this;

        options = $.extend({
            x: 0,
            y: 0,
            $container: $(document.body),
            stepDelay: 100,
            delay: 0,
            elem: null,
        }, options);

        var getPositionOfElem = function(elem) {
            var x = elem.$elem.offset().left - options.$container.offset().left;
            var y = elem.$elem.offset().top - options.$container.offset().top;

            if (elem.x == 'center') {
                x += elem.$elem.width()/2 - 10; //10 because of mouse size
            } else {
                x += elem.x;
            }

            if (elem.y == 'center') {
                y += elem.$elem.height()/2 + 10; //10 because of mouse size
            } else {
                y += elem.y;
            }

            return {
                x: x,
                y: y
            };
        };

        if (options.elem) {
            options = $.extend(options, getPositionOfElem(options.elem));
        }

        var $mouse = $('<div class="mouse__helper"><div></div></div>');

        $mouse.css({
            top: options.y,
            left: options.x
        }).find('div').css({
            backgroundImage: 'url(' + $('.work.shopping .shopping__cover.work__cover').attr('data-images') + 'mouse.png)',
        });

        options.$container.append($mouse);

        this.queue = [{
            type: 'display',
            duration: 300,
        }];

        if (options.delay) {
            this.queue.unshift({
                type: 'delay',
                duration: options.delay
            });
        }

        this.processing = true;

        this.move = function(x, y, duration, cb) {
            if (typeof x == 'object') {
                cb = duration;
                duration = y;
                var pos = getPositionOfElem(x);
                x = pos.x;
                y = pos.y;
            }

            this.queue.push({
                type: 'move',
                x: x,
                y: y,
                duration: duration || 500,
                cb: cb
            });
            this.step();

            return this;
        };

        this.click = function(cb) {
            this.queue.push({
                type: 'click',
                cb: cb,
                duration: 800
            });
            this.step();

            return this;
        };

        this.hide = function(cb) {
            this.queue.push({
                type: 'hide',
                cb: cb
            });
            this.step();

            return this;
        };

        this.remove = function() {
            this.queue = [];
            $mouse.remove();
        };

        this.step = function() {
            if (this.processing || !this.queue.length) {
                return false;
            }

            var item = this.queue.shift();
            this.processing = true;

            switch (item.type) {
                case 'display':
                    $mouse.css({
                        transition: 'all ' + item.duration + 'ms',
                        opacity: 1
                    });
                    break;

                case 'move':
                    $mouse.css({
                        transition: 'all ' + item.duration + 'ms',
                        top: typeof item.y == 'function' ? item.y() : item.y,
                        left: typeof item.x == 'function' ? item.x() : item.x,
                    });

                    setTimeout(function() {
                        self.callback(item.cb);
                    }, item.duration);
                    break;

                case 'click':
                    $mouse.addClass('clicked');

                    setTimeout(function() {
                        $mouse.removeClass('clicked').addClass('clicked-after');

                        setTimeout(function() {
                            $mouse.removeClass('clicked-after');

                            self.callback(item.cb);
                        }, 500);
                    }, 300);
                    break;

                case 'hide':
                    $mouse.css({
                        transition: 'all 300ms',
                        opacity: 0
                    });

                    setTimeout(function() {
                        self.callback(item.cb);
                    }, 300);
                    break;
            }

            this.process(item.duration + options.stepDelay);

            return true;
        };

        this.callback = function(cb) {
            if (typeof cb == 'function') {
                cb();
            }
        };

        this.processTimeout = null;
        this.process = function(timeout) {
            if (this.processTimeout) {
                clearTimeout(this.processTimeout);
            }

            this.processTimeout = setTimeout(function() {
                this.processing = false;
                this.step();
            }.bind(this), timeout);
        };

        setTimeout(function() {
            self.processing = false;
            self.step();
        }, 50);

        return this;
    };

    var getCaseScreen = function(name) {
        return $('.work.shopping .shopping__' + name);
    };

    var reset = {
        explore: function() {
            var $screen = getCaseScreen('explore');
            var $animation = $screen.find('.explore__animation');
            $animation.find('.zoom__circle').removeClass('opened');
        },
        outfits: function() {
            var $screen = getCaseScreen('outfits');
            var $slider = $screen.find('.outfits__slider');
            var $topSlider = $screen.find('.top__slider');
            var $bottomSlider = $screen.find('.bottom__slider');
            var $bottomLock = $screen.find('.lock.lock__bottom');
            $bottomLock.removeClass('locked');
            $topSlider.children().removeClass('active').removeAttr('style').eq(0).addClass('active');

        },
        technical: function() {
            var $screen = getCaseScreen('technical');
            var $bottom = $screen.find('.technical__bottom');
            var $shoe = $screen.find('.technical__shoe');
            var $icon = $bottom.find('ul li.action__steam');

            $icon.removeClass('active');
        },
        filter: function() {
            var $screen = getCaseScreen('filter');
            var $filter = $screen.find('.filter__view');
            var $filters = $filter.find('.filters');
            var $select = $filters.find('.default__filter .select').eq(0);
            var $product = $filter.find('.products > li').eq(0);

            $select.find('.value').html($select.find('ul li').eq(0).html());
            $filter.removeClass('changed');
            $product.removeClass('hovered');
            $filter.find('.products li .product__name span').html('Men');
        }
    };

    var tryReset = function(name) {
        if (name) {
            var $screen = getCaseScreen(name);

            if (!$screen.hasClass('active')) {
                $screen.removeClass('animating');

                if (typeof reset[name] == 'function') {
                    $screen.removeClass('animating to__reset');
                    reset[name]();
                }
            } else {
                $screen.addClass('to__reset');
            }
        } else {
            $('.shopping .screen.to__reset').each(function() {
                var names = $(this).attr('class').match(/shopping__([a-zA-Z0-9_]+)/);
                names = names ? names[1] : "";

                if (typeof reset[names] == 'function') {
                    $(this).removeClass('animating to__reset');
                    reset[names]();
                }
            });
        }
    };

    var animations = {
        explore: function() {
            var $screen = getCaseScreen('explore');
            var $animation = $screen.find('.explore__animation');
            var $hexagon = $screen.find('.hexagons > div').eq(0);

            var mouse = new mouseHelper({
                $container: $animation,
                x: $hexagon.offset().left - $animation.offset().left - 200,
                y: $hexagon.offset().top - $animation.offset().top - 200
            });

            mouse.move(
                $hexagon.offset().left - $animation.offset().left + 5,
                $hexagon.offset().top - $animation.offset().top + 10,
                1000
            ).click(function() {
                    $animation.find('.zoom__circle').addClass('opened');
                }).hide(function() {
                    mouse.remove();
                    tryReset('explore');
                });
        },
        outfits: function() {
            var $screen = getCaseScreen('outfits');
            var $slider = $screen.find('.outfits__slider');
            var $topSlider = $screen.find('.top__slider');
            var $bottomSlider = $screen.find('.bottom__slider');
            var $bottomLock = $screen.find('.lock.lock__bottom');

            var $activeTop = $topSlider.children('.active');

            var start = window.innerHeight > 880 ? {
                $elem: $bottomLock,
                x: -400,
                y: -200
            } : {
                $elem: $activeTop,
                x: -400,
                y: -50
            };

            var mouse = new mouseHelper({
                $container: $slider,
                elem: start
            });

            if (window.innerHeight > 880) {
                mouse.move({
                    $elem: $bottomLock,
                    x: 'center',
                    y: 'center'
                }, 1000).click(function() {
                    $bottomLock.addClass('locked');
                });
            }

            mouse.move({
                $elem: $activeTop,
                x: 'center',
                y: 'center'
            }).click(function() {
                $activeTop.removeClass('active')
                    .next().addClass('active');

                $activeTop.parent().children().css({
                    transform: 'translate3d(-100%, 0, 0)'
                });
            }).hide(function() {
                setTimeout(function() {
                    mouse.remove();
                    tryReset('outfits');
                }, 300);
            });
        },
        technical: function() {
            var $screen = getCaseScreen('technical');
            var $bottom = $screen.find('.technical__bottom');
            var $shoe = $screen.find('.technical__shoe');
            var $icon = $bottom.find('ul li.action__steam');

            var pipes = [];

            var doneCb = null;

            var createPipes = function(cb) {
                var bottom = 25;
                var right = 27;

                for (var i = 0; i < 3; i++) {
                    var $pipe = $('<div class="steam__pipe"></div>');
                    $pipe.css({
                        bottom: bottom + '%',
                        right: right + '%',
                    });
                    $shoe.append($pipe);

                    pipes.push({
                        $elem: $pipe,
                        steam: []
                    });

                    bottom -= 2;
                    right -= 9;
                }

                doneCb = cb;

                requestAnimationFrame(createSteam);
            };

            var maxParticles = 1000;

            var createSteam = function() {
                if (pipes.length) {
                    requestAnimationFrame(createSteam);
                } else {
                    return doneCb();
                }

                var i, j, k;

                for (i = pipes.length - 1; i >= 0; i--) {
                    var pipe = pipes[i];

                    for (j = pipe.steam.length - 1; j >= 0; j--) {
                        var steam = pipe.steam[j];

                        steam.x += steam.velocity.x;
                        steam.y += steam.velocity.y;

                        if (steam.y < -80) {
                            steam.opacity *= 0.7;
                        } else {
                            steam.opacity *= 1.04;
                        }

                        if (steam.y < -30) {
                            steam.scale *= 1.02;
                        } else {
                            steam.scale *= 1.07;
                        }

                        steam.$elem.css({
                            transform: 'translate3d(' + steam.x + 'px, ' + steam.y + 'px, 0) scale(' + steam.scale + ')',
                            opacity: steam.opacity
                        });

                        if (steam.opacity <= 0.05) {
                            steam.$elem.remove();
                            pipe.steam.splice(j, 1);
                        }
                    }

                    if (maxParticles > 0) {
                        for (k = 0; k < 2; k++) {
                            pipe.steam.push(createSteamParticle(pipe.$elem));
                            maxParticles--;
                        }
                    }

                    if (!pipe.steam.length) {
                        pipe.$elem.remove();

                        pipes.splice(i, 1);
                    }
                }

            };

            var createSteamParticle = function($pipe) {
                var $elem = $('<div class="steam"></div>');
                $elem.css({
                    backgroundImage: 'url(' + $('.work.shopping .shopping__cover.work__cover').attr('data-images') + 'smoke.png)',
                    opacity: 0.3,
                    transform: 'scale(0.5)'
                });
                $pipe.append($elem);

                return {
                    $elem: $elem,
                    opacity: 0.3,
                    x: 0,
                    y: 0,
                    scale: 0.5,
                    velocity: {
                        x: 1.5 + (-(Math.floor(Math.random() * 120)/100) + 0.6),
                        y: -2
                    }
                };
            };

            var mouse = new mouseHelper({
                $container: $bottom,
                x: $icon.offset().left - $bottom.offset().left - 200,
                y: $icon.offset().top - $bottom.offset().top + 150,
                //load of shoe
                delay: 700
            });

            mouse.move(
                $icon.offset().left - $bottom.offset().left + ($icon.width()/2),
                $icon.offset().top - $bottom.offset().top + ($icon.height()/2) + 15,
                1000
            ).click(function() {
                    $icon.addClass('active');

                    createPipes(function() {
                        mouse.hide(function() {
                            mouse.remove();
                            tryReset('technical');
                        });
                    });
                });
        },
        filter: function() {
            var $screen = getCaseScreen('filter');
            var $filter = $screen.find('.filter__view');
            var $filters = $filter.find('.filters');
            var $select = $filters.find('.default__filter .select').eq(0);
            var $product = $filter.find('.products > li').eq(0);

            var mouse = new mouseHelper({
                $container: $filter,
                elem: {
                    $elem: $select,
                    x: -150,
                    y: 250
                },
            });

            mouse.move({
                $elem: $select,
                x: 'center',
                y: 'center'
            }, 1000).click(function() {
                $select.addClass('toggled');
            }).move({
                $elem: $select.find('ul li').eq(-1),
                x: 'center',
                y: 'center',
            }, 700).click(function() {
                $select.removeClass('toggled').find('.value').html($select.find('ul li').eq(-1).html());

                $filter.addClass('changed');

                setTimeout(function() {
                    $filter.find('.products li .product__name span').html('Woman');
                }, 300);
            }).move({
                $elem: $product,
                x: 'center',
                y: 'center',
            }, 800, function() {
                $product.addClass('hovered');
            }).move({
                $elem: $product.find('a.add-to-cart'),
                x: 30,
                y: 5
            }, 700).hide(function() {
                mouse.remove();
                tryReset('filter');
            });
        }
    };


    $('.work.shopping .screen').on('show.shopping', function() {
        if (app.device.isPhone) {
            return false;
        }

        var name = $(this).attr('class').match(/shopping__([a-zA-Z0-9_]+)/);
        name = name ? name[1] : "";

        if (!$(this).hasClass('animating') && animations[name]) {
            $(this).addClass('animating');
            animations[name]();
        }

        $(this).addClass('loaded');

        $(this).parent().children().removeClass('active');
        $(this).addClass('active');
        tryReset();
    });
};
$.fn.synackCase = function(){

    var terminalPaused = true;
    var animateTerminal = function($elem) {
        var text = [
            'Last login: Tue May 19 16:01:39',
            ' ',
            '      ___           ___           ___           ___           ___           ___     ',
            '     /\\  \\         |\\__\\         /\\__\\         /\\  \\         /\\  \\         /\\__\\    ',
            '    /::\\  \\        |:|  |       /::|  |       /::\\  \\       /::\\  \\       /:/  /    ',
            '   /:/\\ \\  \\       |:|  |      /:|:|  |      /:/\\:\\  \\     /:/\\:\\  \\     /:/__/     ',
            '  _\\:\\~\\ \\  \\      |:|__|__   /:/|:|  |__   /::\\~\\:\\  \\   /:/  \\:\\  \\   /::\\__\\____ ',
            ' /\\ \\:\\ \\ \\__\\     /::::\\__\\ /:/ |:| /\\__\\ /:/\\:\\ \\:\\__\\ /:/__/ \\:\\__\\ /:/\\:::::\\__\\',
            ' \\:\\ \\:\\ \\/__/    /:/~~/~    \\/__|:|/:/  / \\/__\\:\\/:/  / \\:\\  \\  \\/__/ \\/_|:|~~|~   ',
            '  \\:\\ \\:\\__\\     /:/  /          |:/:/  /       \\::/  /   \\:\\  \\          |:|  |    ',
            '   \\:\\/:/  /     \\/__/           |::/  /        /:/  /     \\:\\  \\         |:|  |    ',
            '    \\::/  /                      /:/  /        /:/  /       \\:\\__\\        |:|  |    ',
            '     \\/__/                       \\/__/         \\/__/         \\/__/         \\|__|    ',
            ' ',
            '******************************** SYNACK RED TEAM ********************************',
            ' ',
            'Application & Resume Review',
            'Video Interview',
            'Live Practical Assessment',
            'Background Check',
            'Ongoing Community Management',
            '<A>pply now',
            'Admin: ? Current User$ ',
        ];

        var sentence = 0;
        var character = 0;

        var animateChar = function($row, sen, char) {
            if (terminalPaused) {
                return setTimeout(function() {
                    animateChar($row, sen, char);
                }, (sen > 1 && sen < 13) ? 1 : 10);
            }

            var convertedChar = text[sen][char].replace(' ', '&nbsp;');

            $row.append('<span class="' + ((sen > 1 && sen < 13) ? 'red' : '') + '">' + convertedChar + '</span>');

            if ((sen > 1 && sen < 13)) {
                if (char < text[sen].length-1) {
                    char++;
                    convertedChar = text[sen][char].replace(' ', '&nbsp;');
                    $row.append('<span class="red">' + convertedChar + '</span>');

                    if (char < text[sen].length-1) {
                        char++;
                        convertedChar = text[sen][char].replace(' ', '&nbsp;');
                        $row.append('<span class="red">' + convertedChar + '</span>');
                    }
                }
            }

            if (char < text[sen].length-1) {
                if (app.device.isPhone) {
                    animateChar($row, sen, char+1);
                } else {
                    setTimeout(function() {
                        animateChar($row, sen, char+1);
                    }, (sen > 1 && sen < 13) ? 1 : 10);
                }
            } else {
                if (app.device.isPhone) {
                    if (sen < text.length-1) {
                        animateSentence(sen+1);
                    }
                } else {
                    $row.append('<span class="cursor">&nbsp;</span>');
                    if (sen < text.length-1) {
                        setTimeout(function() {
                            $row.find('.cursor').remove();
                            animateSentence(sen+1);
                        }, ((sen > 1 && sen < 13) ? 5 : 1000));
                    }
                }
            }
        };

        var animateSentence = function(sen) {
            var $row = $('<div class="terminal__row"></div>');

            $elem.find('.terminal__body').append($row);

            animateChar($row, sen, 0);
        };

        animateSentence(0);
    };

    var animateLogo = function($elem) {
        var $svg = $elem.find('.cover__logo svg');


        var displayLine = function() {
            var $list = $svg.find('path:not(.loaded)');
            var len = $list.length;
            var rand = Math.floor(Math.random() * len);
            var rand2 = Math.floor(Math.random() * len);

            $list.eq(rand).attr('class', 'cls-4 loaded');
            $list.eq(rand2).attr('class', 'cls-4 loaded');

            if (len > 1) {
                setTimeout(function() {
                    displayLine();
                }, 5);
            }
        };
        var displayCircle = function() {
            var $list = $svg.find('circle:not(.loaded)');
            var len = $list.length;
            var rand = Math.floor(Math.random() * len);
            var rand2 = Math.floor(Math.random() * len);

            $list.eq(rand).attr('class', 'cls-280 loaded');
            $list.eq(rand2).attr('class', 'cls-280 loaded');

            if (len > 1) {
                setTimeout(function() {
                    displayCircle();
                }, 5);
            }
        };

        if (app.device.isPhone) {
            $svg.find('path').attr('class', 'cls-4 loaded');
            $svg.find('circle').attr('class', 'cls-280 loaded');
        } else {
            displayCircle();
            displayLine();
        }
    };

    var animatePlanes = function() {
        $('.synack .synack__ilustrations .plane').eq(0).addClass('on');

    };


    var animatingIcons = [];
    var iconsPaused = true;
    var animateIcons = function($elem) {
        var animateIcon = function() {
            if (iconsPaused) {
                return setTimeout(function() {
                    animateIcon();
                }, 500);
            }

            var $list = $elem.find('svg:not(.loaded):not(.loading)');
            var len = $list.length;
            var rand = Math.floor(Math.random() * len);
            var $icon = $list.eq(rand);

            $icon.attr('class', 'loading');
            var viv = new Vivus($icon[0], {type: 'delayed', duration: 100, forceRender: true, start: 'autostart'}, function() {
                $icon.attr('class', 'loaded');
            });

            animatingIcons.push(viv);

            if (len > 1) {
                setTimeout(function() {
                    animateIcon();
                }, 500);
            }
        };

        if (!app.device.isPhone) {
            animateIcon();
        } else {
            $elem.find('svg:nth-child(6)').attr('class', 'loaded');
        }
    };

    var animatePins = function($elem) {
        var part = 0;
        var animatePin = function() {
            if ($elem.hasClass('active')) {
                var $pin = $('<div class="cover__pin">\
					<div><div></div></div>\
					<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid" width="42" height="36.5" viewBox="0 0 84 73">\
						<path d="M80.638,10.954 C80.638,10.954 67.188,19.051 67.188,19.051 C67.188,19.051 67.060,19.115 67.060,19.115 C62.279,21.513 58.579,25.915 56.031,32.229 C56.031,32.229 78.231,18.813 78.231,18.813 C78.231,18.813 74.862,29.790 74.862,29.790 C74.862,29.790 44.923,47.876 44.923,47.876 C45.922,36.284 49.823,19.285 63.621,12.262 C63.621,12.262 83.999,0.000 83.999,0.000 C83.999,0.000 80.638,10.954 80.638,10.954 ZM42.000,4.692 C42.000,4.692 49.729,18.407 49.729,18.407 C49.729,18.407 34.271,18.407 34.271,18.407 C34.271,18.407 42.000,4.692 42.000,4.692 ZM9.135,29.790 C9.135,29.790 5.769,18.813 5.769,18.813 C5.769,18.813 27.969,32.229 27.969,32.229 C25.419,25.915 21.721,21.513 16.940,19.115 C16.940,19.115 16.812,19.051 16.812,19.051 C16.812,19.051 3.359,10.954 3.359,10.954 C3.359,10.954 0.001,0.000 0.001,0.000 C0.001,0.000 20.378,12.262 20.378,12.262 C34.175,19.285 38.078,36.284 39.077,47.876 C39.077,47.876 9.135,29.790 9.135,29.790 ZM72.630,37.071 C72.630,37.071 69.264,48.047 69.264,48.047 C69.264,48.047 49.425,60.032 49.425,60.032 C49.425,60.032 54.379,63.021 54.379,63.021 C54.379,63.021 54.387,71.998 54.387,71.998 C54.387,71.998 42.000,64.517 42.000,64.517 C42.000,64.517 29.613,71.998 29.613,71.998 C29.613,71.998 29.621,63.021 29.621,63.021 C29.621,63.021 34.575,60.032 34.575,60.032 C34.575,60.032 14.736,48.047 14.736,48.047 C14.736,48.047 11.370,37.071 11.370,37.071 C11.370,37.071 42.000,55.551 42.000,55.551 C42.000,55.551 72.630,37.071 72.630,37.071 Z" fill-rule="evenodd"/>\
					</svg>\
				</div>');

                if (Math.floor(Math.random() * 2) === 0) {
                    $pin.addClass('red');
                }

                var posX = Math.floor(Math.random() * 26);
                var posY = 0;
                var moveXBy = part*26;

                switch (part) {
                    case 0:
                        posY = Math.floor(Math.random() * 31);
                        part = 1;
                        break;

                    case 1:
                        posY = Math.floor(Math.random() * 61);
                        part = 2;
                        break;

                    case 2:
                        posY = Math.floor(Math.random() * 31);
                        part = 0;
                        break;
                }

                $pin.css({
                    bottom: (posY+5) + '%',
                    left: (posX+moveXBy+10) + '%',
                });

                if (posX < 40) {
                    $pin.addClass('lefted');
                }

                $elem.find('.cover__image').append($pin);

                setTimeout(function() {
                    $pin.addClass('loaded');
                }, 100);

                setTimeout(function() {
                    $pin.addClass('unloaded');
                }, 7000);

                setTimeout(function() {
                    $pin.remove();
                }, 7500);
            }

            setTimeout(function() {
                animatePin();
            }, app.device.isPhone ? 5000 : 1500);
        };

        animatePin();
    };

    var sly = new Sly($('.synack .synack__slideshow .slideshow__slider')[0], {
        itemNav: 'forceCentered',
        horizontal: true,
        // easing: 'easeOutExpo',
        smart: true,
        mouseDragging: true,
        touchDragging: true,
        releaseSwing: true,
        // scrollBy: 0,
        speed: 600,
        elasticBounds: true,
        activateMiddle: true,
        startAt: 0,
    });

    var slideshowInited = false;

    var checkSlideshow = function() {
        if (app.device.isPhone) {
            $('.synack .synack__slideshow .slideshow__slider ul li').width(Math.floor($('.synack .synack__slideshow .slideshow__slider').width()));
        } else {
            $('.synack .synack__slideshow .slideshow__slider ul li').width(Math.floor($('.synack .synack__slideshow .slideshow__slider').width()/3));
        }

        if (!slideshowInited) {
            sly.init();
        } else {
            sly.reload();
        }
    };

    checkSlideshow();

    app.dom.$window.on('resize.synack', checkSlideshow);

    if (app.device.isPhone) {
        $('.work.synack .screen').addClass('loaded');
        animatePins($('.work.synack .synack__cover'));
        animatePlanes();
        animateTerminal($(this));
        animateLogo($(this));
        animateIcons($(this));
        sly.next();
    } else {
        $('.work.synack .screen').on('show.synack', function() {
            terminalPaused = true;
            iconsPaused = true;

            animatingIcons.forEach(function(viv) {
                viv.stop();
            });

            if ($(this).hasClass('synack__geek')) {
                terminalPaused = false;
            }

            if ($(this).hasClass('synack__icons')) {
                iconsPaused = false;
                animatingIcons.forEach(function(viv) {
                    viv.play();
                });
            }

            if (!$(this).hasClass('loaded') && $(this).hasClass('synack__geek')) {
                setTimeout(function() {
                    animateTerminal($(this));
                }.bind(this), 600);
            }
            if (!$(this).hasClass('loaded') && $(this).hasClass('synack__site')) {
                animateLogo($(this));
            }
            if (!$(this).hasClass('loaded') && $(this).hasClass('synack__ilustrations')) {
                animatePlanes($(this));
            }
            if (!$(this).hasClass('loaded') && $(this).hasClass('synack__icons')) {
                animateIcons($(this));
            }
            if (!$(this).hasClass('loaded') && $(this).hasClass('synack__cover')) {
                animatePins($(this));
            }
            if (!$(this).hasClass('loaded') && $(this).hasClass('synack__slideshow')) {
                sly.next();
            }

            $(this).addClass('loaded');

            $(this).parent().children().removeClass('active');
            $(this).addClass('active');
        });
    }

    var face = function() {
        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = (window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || window.oRequestAnimationFrame || function (callback) {
                return window.setTimeout(callback, 1000 / 60);
            });
        }


        (function ($, window) {

            function Constellation (canvas, options) {
                var $canvas = $(canvas),
                    context = canvas.getContext('2d'),
                    defaults = {
                        star: {
                            color: 'rgba(255, 255, 255, .8)',
                            width: 1
                        },
                        line: {
                            color: 'rgba(255, 255, 255, .5)',
                            width: 0.2
                        },
                        position: {
                            x: 0, // This value will be overwritten at startup
                            y: 0 // This value will be overwritten at startup
                        },
                        width: $(canvas).parent().width(),
                        height: $(canvas).parent().height(),
                        velocity: 0.1,
                        length: 150,
                        distance: 120,
                        radius: 150,
                        name: 'constellation',
                        stars: []
                    },
                    config = $.extend(true, {}, defaults, options);

                function Star () {
                    this.x = Math.random() * canvas.width;
                    this.y = Math.random() * canvas.height;

                    this.vx = (config.velocity - (Math.random() * 0.5));
                    this.vy = (config.velocity - (Math.random() * 0.5));

                    this.radius = Math.random() * config.star.width;
                }

                Star.prototype = {
                    create: function(){
                        context.beginPath();
                        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
                        context.fill();
                    },

                    animate: function(){
                        var i;
                        for (i = 0; i < config.length; i++) {

                            var star = config.stars[i];

                            if (star.y < 0 || star.y > canvas.height) {
                                star.vx = star.vx;
                                star.vy = - star.vy;
                            } else if (star.x < 0 || star.x > canvas.width) {
                                star.vx = - star.vx;
                                star.vy = star.vy;
                            }

                            star.x += star.vx;
                            star.y += star.vy;
                        }
                    },

                    line: function(){
                        var length = config.length,
                            iStar,
                            jStar,
                            i,
                            j;

                        for (i = 0; i < length; i++) {
                            for (j = 0; j < length; j++) {
                                iStar = config.stars[i];
                                jStar = config.stars[j];

                                if (
                                    (iStar.x - jStar.x) < config.distance &&
                                    (iStar.y - jStar.y) < config.distance &&
                                    (iStar.x - jStar.x) > - config.distance &&
                                    (iStar.y - jStar.y) > - config.distance
                                ) {
                                    if (
                                        (iStar.x - config.position.x) < config.radius &&
                                        (iStar.y - config.position.y) < config.radius &&
                                        (iStar.x - config.position.x) > - config.radius &&
                                        (iStar.y - config.position.y) > - config.radius
                                    ) {
                                        context.beginPath();
                                        context.moveTo(iStar.x, iStar.y);
                                        context.lineTo(jStar.x, jStar.y);
                                        context.stroke();
                                        context.closePath();
                                    }
                                }
                            }
                        }
                    }
                };

                this.createStars = function () {
                    var length = config.length,
                        star,
                        i;

                    context.clearRect(0, 0, canvas.width, canvas.height);

                    for (i = 0; i < length; i++) {
                        config.stars.push(new Star());
                        star = config.stars[i];

                        star.create();
                    }

                    star.line();
                    star.animate();
                };

                this.setCanvas = function () {
                    canvas.width = config.width;
                    canvas.height = config.height;
                };

                this.setContext = function () {
                    context.fillStyle = config.star.color;
                    context.strokeStyle = config.line.color;
                    context.lineWidth = config.line.width;
                };

                this.setInitialPosition = function () {
                    if (!options || !options.hasOwnProperty('position')) {
                        config.position = {
                            x: canvas.width * 0.5,
                            y: canvas.height * 0.5
                        };
                    }
                };

                this.loop = function (callback) {
                    if (!$('.synack').length) {
                        return false;
                    }

                    if ($(canvas).parents('.screen').hasClass('active')) {
                        callback();
                    }

                    window.requestAnimationFrame(function () {
                        this.loop(callback);
                    }.bind(this));
                };

                this.bind = function () {
                    $(document).on('mousemove.' + config.name, function(e){
                        if (!$('.synack').length) {
                            $(document).unbind('mousemove.synackFace');
                            $(document).unbind('mousemove.synackIlustrations');
                        }
                        config.position.x = e.pageX - $canvas.offset().left;
                        config.position.y = e.pageY - $canvas.offset().top;
                    });
                };

                this.init = function () {
                    this.setCanvas();
                    this.setContext();
                    this.setInitialPosition();
                    this.loop(this.createStars);
                    this.bind();
                };
            }

            $.fn.constellation = function (options) {
                return this.each(function () {
                    var c = new Constellation(this, options);
                    c.init();
                });
            };
        })($, window);

        // Init plugin
        $('.synack .synack__face canvas').constellation({
            name: 'synackFace',
            line: {
                color: 'rgba(255, 0, 0, .8)'
            }
        });

        $('.synack .synack__ilustrations canvas').constellation({
            name: 'synackIlustrations',
            line: {
                color: 'rgba(0, 107, 255, .5)'
            },
            star: {
                color: 'rgba(0, 107, 255, .8)'
            }
        });

        // Init plugin
        // $('.synack .synack__understanding canvas').constellation({
        // 	name: 'synackUnderstanding',
        // 	star: {
        // 		color: 'rgba(0, 0, 0, .8)',
        // 	},
        // 	line: {
        // 		color: 'rgba(1, 108, 255, .8)'
        // 	}
        // });
    };

    if (!app.device.isPhone) {
        face();
    }

};