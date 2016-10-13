/*!
 *	Hue Wheel 1.2.0
 *	(c) 2013-2016 Epistemex.com
 *	License: MIT
*/

/**
 * Create a new instance of a Hue wheel, replacing the content of given parent element with the control.
 *
 * @param {String|HTMLElement} parent - parent element or ID of parent element to turn into a control (content will be replaced with the control).
 * @param {Object} [options] Options given as a JSON object
 * @param {Number} [options.diameter=250] diameter (in pixels) of control
 * @param {Number} [options.shadowBlur=0] diameter (in pixels) of shadow
 * @param {String} [options.shadowColor='black'] CSS color of shadow if active (see shadowBlur)
 * @param {Number} [options.hue=0] Initial hue angle [0, 360]
 * @param {Number} [options.saturation=1] Initial saturation value [0.0, 1.0]
 * @param {Number} [options.lightness=0.5] Initial lightness value [0.0, 1.0]
 * @param {Array} [options.rgb] Initial RGB value given as an array [r,g,b]
 * @param {Boolean} [options.changeSaturation=false] Enable control to change saturation
 * @param {Boolean} [options.changeLightness=false] Enable control to change lightness
 * @param {String} [options.colorSpace='hsl'] Color space to use in control
 * @param {Boolean} [options.showColorSpot=true] Show current color in center of control
 * @param {Object|Function} [options.onChange] Function to call when current color changes
 * @param {Number} [options.colorSpotWidth=0.7] If showColor is used this is the ratio of the radius from center to the edge of hue wheel. Value can be [0.0, 1.0].
 * @param {Number} [options.colorSpotBorder=2] If showColor is used this is the width of the border. A value of 0 turns the border off.
 * @param {String} [options.colorSpotBorderColor='black'] If showColor and colorBorder > 0 this will be the color of the border.
 * @param {Number} [options.thicknessHue] Thickness of hue ring in pixels
 * @param {Number} [options.thicknessLightness] Thickness of lightness ring in pixels
 * @param {Number} [options.hueKnobSize=0.1] A value [0.0, 1.0] determining the size of the hue knob relative to radius.
 * @param {String} [options.hueKnobColor='white'] Color of hue knob.
 * @param {String} [options.lightnessKnobColor='white'] Color of lightness knob (if ligthness ring is visible).
 * @param {String} [options.hueKnobColorSelected='#777'] Color for hue knob when selected
 * @param {String} [options.lightnessKnobColorSelected='#777'] Color of lightness knob when selected (if ligthness ring is visible).
 * @param {Boolean} [options.lightnessRingClickable=false] Makes lightness ring clickable (outside knob, inside ring).
 * @param {Boolean} [options.hueKnobShadow=false] Use shadow with hue knob if shadow is activated.
 * @param {Boolean} [options.useKeys=true] Enable usage of keys to control hsl when control is active.
 * @param {Number} [options.hueKeyDelta=1] Delta values to increment/decrement the hue value with when its hotkey is pressed.
 * @param {Number} [options.saturationKeyDelta=1] Delta values to increment/decrement the saturation value with when its hotkey is pressed.
 * @param {Number} [options.lightnessKeyDelta=1] Delta values to increment/decrement the lightness value with when its hotkey is pressed.
 * @param {Number} [options.keyShiftFactor=10] When the shift key is held down the delta values are multiplied with this factor when using the hotkeys.
 * @param {Number} [options.hueKeyCodeUp=33] Key code to use to increase hue value (default page up).
 * @param {Number} [options.hueKeyCodeDown=34] Key code to use to decrease hue value (default page down).
 * @param {Number} [options.saturationKeyCodeUp=37] Key code to use to increase hue value (default left arrow key).
 * @param {Number} [options.saturationKeyCodeDown=39] Key code to use to decrease hue value (default right arrow key).
 * @param {Number} [options.lightnessKeyCodeUp=38] Key code to use to increase lightness value (default up arrow key).
 * @param {Number} [options.lightnessKeyCodeDown=40] Key code to use to increase lightness value (default down arrow key).
 * @param {Boolean} [options.tabable=true] Allows the control to be selected and operated with tab key and hotkeys.
 * @param {Boolean} [options.ctrlLock=true] Allow holding CTRL key to lock hue while moving saturation slider
 * @constructor
 */
function HueWheel(parent, options) {

	"use strict";

	var	me					= this,
		element 			= (typeof parent === "string") ? document.getElementById(parent) : parent,
		msPointer			= navigator.msPointerEnabled,
		canvas				= document.createElement('canvas'),
		ctx					= canvas.getContext('2d'),
		canvasStyle			= canvas.style,

		// pre-calcs
		pi					= Math.PI,
		d2r					= pi / 180,
		r2d					= 180 / pi,
		pi2					= 2 * pi,
		dlt					= 0.5 * pi,

		// options
		diameter			= 250,
		center				= diameter * 0.5,
		showColor			= true,
		isHSL				= true,
		useLuma				= true,
		useSat				= true,

		hue					= 0,
		saturation			= 1.0,
		lightness			= 0.5,
		oldhue 				= 0,

		useKeys				= true,
		hueKeyDelta			= 1,
		satKeyDelta			= 1,
		lightKeyDelta		= 1,
		hueKeyCodeUp		= 33,	// page up
		hueKeyCodeDown		= 34,	// page down
		satKeyCodeUp		= 37,	// arrow left
		satKeyCodeDown		= 39,	// arrow right
		lightKeyCodeUp		= 38,	// arrow up
		lightKeyCodeDown	= 40,	// arrow down
		keyShiftFactor		= 10,

		thickness			= Math.max(diameter * 0.12, 3),
		lumaThickness		= useLuma ? Math.max(diameter * 0.05, 3) : 0,
		knobWidth			= 0.1,
		shadow				= 0,
		hueShadow			= false,

		colorWidth			= 0.8,
		colorBorder			= 2,
		colorBorderColor	= '#000',
		hueKnobColor		= '#fff',
		lightKnobColor		= '#fff',
		hueKnobColorSel		= '#777',
		lightKnobColorSel	= '#777',
		lightClickable		= false,
		ctrlLock			= true,
		accessibility		= true,	// tabable

		// calced setup
		radiusHue,
		radiusLightness,
		lumaKnobWidth,
		lumaKnob,
		hueKnob,
		l,

		// internals
		isDown				= false,
		isLuma				= false,
		isTouch				= false,
		timeoutRef,
		x, y,						// current mouse position
		r, g, b,					// current RGB

		canvasEvent = canvas.addEventListener.bind(canvas),
		windowEvent = window.addEventListener.bind(window);

	/*
	 *	Parse options
	*/
	options = options || {};

	Object.keys(options).forEach(function(key) {

		var value = options[key];

		switch (key) {
			case "diameter":
				diameter = +value;
				center = diameter * 0.5;
				break;

			case "hue":
				hue = +value % 360;
				break;

			case "colorSpace":
				isHSL = value === "hsl";
				break;

			case "changeLightness":
				useLuma = !!value;
				lumaThickness = useLuma ? Math.max(diameter * 0.05, 3) : 0;
				break;

			case "changeSaturation":
				useSat = !!value;
				break;

			case "saturation":
				saturation = +value;
				break;

			case "lightness":
				lightness = +value;
				break;

			case "useKeys":
				useKeys = !!value;
				break;

			case "hueKeyDelta":
				hueKeyDelta = +value;
				break;

			case "saturationKeyDelta":
				satKeyDelta = +value;
				break;

			case "lightnessKeyDelta":
				lightKeyDelta = +value;
				break;

			case "hueKeyCodeUp":
				hueKeyCodeUp = +value;
				break;

			case "hueKeyCodeDown":
				hueKeyCodeDown = +value;
				break;

			case "saturationKeyCodeUp":
				satKeyCodeUp = +value;
				break;

			case "saturationKeyCodeDown":
				satKeyCodeDown = +value;
				break;

			case "lightnessKeyCodeUp":
				lightKeyCodeUp = +value;
				break;

			case "lightnessKeyCodeDown":
				lightKeyCodeDown = +value;
				break;

			case "shiftKeyFactor":
				keyShiftFactor = +value;
				break;

			case "thicknessHue":
				thickness = +value;
				break;

			case "thicknessLuma":
				lumaThickness = +value;
				break;

			case "hueKnobSize":
				knobWidth = +value;
				break;

			case "shadowBlur":
				shadow = +value;
				break;

			case "hueKnobShadow":
				hueShadow = !!value;
				break;

			case "showColorSpot":
				showColor = !!value;
				break;

			case "tabable":
				accessibility = !!value;
				break;

			case "colorSpotWidth":
				colorWidth = +value;
				break;

			case "colorSpotBorder":
				colorBorder = +value;
				break;

			case "colorSpotBorderColor":
				colorBorderColor = "" + value;
				break;

			case "hueKnobColor":
				hueKnobColor = "" + value;
				break;

			case "lightnessKnobColor":
				lightKnobColor = "" + value;
				break;

			case "hueKnobColorSelected":
				hueKnobColorSel = "" + value;
				break;

			case "lightnessKnobColorSelected":
				lightKnobColorSel = "" + value;
				break;

			case "lightnessRingClickable":
				lightClickable = !!value;
				break;

			case "ctrlLock":
				ctrlLock = !!value;
				break;

			case "rgb":
				if (Array.isArray(value) && value.length === 3) {
					var c = isHSL ? rgb2hsl(value[0], value[1], value[2]) : rgb2hsv(value[0], value[1], value[2]);
					hue = c.h;
					saturation = c.s;
					lightness = c.l;
					validateHSLV()
				}
				break;
		}
	});

	/*
	 *	Init callback vector
	*/
	this.onchange = options.onChange;

	/*
	 *	Init canvas for control
	*/
	canvas.id = (element.id || 'hueWheel') + '_canvas';
	if (accessibility) canvas.tabIndex = 0;

	/*
	 *	Generate control and insert into DOM
	*/
	generateCanvas();
	element.innerHTML = "";
	element.appendChild(canvas);

	/*
	 *	Init first draw and event
	*/
	render();
	sendEvent();

	/*
	 *	Setup mouse and touch handlers
	*/
	if (msPointer) {
		canvasEvent('MSPointerDown', mouseDown);
		windowEvent('MSPointerMove', mouseMove);
		windowEvent('MSPointerUp', mouseUp);
	}
	else {
		canvasEvent('mousedown', mouseDown);
		windowEvent('mousemove', mouseMove);
		windowEvent('mouseup', mouseUp);

		canvasEvent('touchstart', mouseDown);
		canvasEvent('touchmove', mouseMove);
		canvasEvent('touchend', mouseUp);
	}


	/*
	 *	Setup key handlers
	*/
	if (useKeys) canvasEvent('keydown', keyDown);

	/*
	 * *******  MOUSE handlers  *******
	*/

	function mouseDown(e) {

		getXY(e);

		canvasStyle.cursor = 'default';

		/*
		 *	Check if HUE knob
		*/
		getHueKnob(false);
		isDown = ctx.isPointInPath(x, y);

		if (isDown) {
			isLuma = false;
			clear();
			renderHueKnob(true);
			if (useLuma) renderLumaKnob(false);
			return false;
		}

		/*
		 *	Check if LUMA knob
		*/
		getLumaKnob(false);
		isDown = ctx.isPointInPath(x, y);

		if (isDown) {
			isLuma = true;
			clear();
			renderHueKnob(false);
			if (useLuma) renderLumaKnob(true);
			return false;
		}

		/*
		 *	Check if in HUE RING
		*/
		var tri = getTri(x, y),
			d = tri.dist,
			a = tri.angle;

		if (d > radiusHue - thickness * 0.5 && d < radiusHue + thickness * 0.5) {

			hue = a * r2d;
			if (hue < 0) hue += 360;

			clear();

			renderHueKnob(false);
			if (useLuma) renderLumaKnob(false);

			sendEvent();
		}

		/*
		 *	Check if in LIGHTNESS RING
		*/
		else if (lightClickable && d > radiusLightness - lumaThickness * 0.5 && d < radiusLightness + lumaThickness * 0.5) {

			var ta = a * r2d - 90;
			if (ta < 0) ta += 360;

			me.hsl(hue, saturation, ta / 360);

			sendEvent()
		}

		return false;
	}

	/*
	 *	Move handler
	 */
	function mouseMove(e) {

		getXY(e);

		var tri = getTri(x, y),
			d = tri.dist,
			a = tri.angle,
			isOver;

		if (isDown) {

			if (!isLuma) {

				if (ctrlLock && e.ctrlKey) {
					hue = oldhue;
				}
				else {
					hue = a  * r2d;
					if (hue < 0) hue += 360;
					oldhue = hue;
				}

				if (useSat) {
					if (d < 0) d = 0;
					if (d > radiusHue - l) d = radiusHue - l;
					saturation = d / (radiusHue - l);
				}

			}
			else {
				lightness = ((a + 0.5 * pi) / pi2 + 0.5) % 1.0;
			}

			validateHSLV();

			clear();
			renderHueKnob(!isLuma);

			if (useLuma) renderLumaKnob(isLuma);

			sendEvent();

		}
		else {

			getHueKnob(false);
			isOver = ctx.isPointInPath(x, y);

			if (isOver) {
				canvasStyle.cursor = "pointer";
				return false
			}

			/*
			 *	Check if LUMA knob
			*/
			getLumaKnob(false);
			isOver = ctx.isPointInPath(x, y);

			if (isOver) {
				canvasStyle.cursor = "pointer";
				return false;
			}

			/*
			 *	Check if HUE RING
			*/
			if (d > radiusHue - thickness * 0.5 && d < radiusHue + thickness * 0.5) {
				canvasStyle.cursor = "crosshair";
				return false;
			}

			canvasStyle.cursor = "default";
		}

		return false;
	}

	function mouseUp(e) {
		cevent(e);
		canvasStyle.cursor = "default";
		isDown = false;
		render()
	}

	/*
	 *	KEY handler (v.0.3)
	*/
	function keyDown(e) {

		var keyCode = e.charCode || e.keyCode,
			factor = e.shiftKey ? keyShiftFactor : 1,
			factor2 = factor * 0.01,
			hasChanged = false;

		switch(keyCode) {

			case hueKeyCodeUp:
				hue -= hueKeyDelta * factor;
				if (hue < 0) hue += 360;
				hasChanged = true;
				break;

			case hueKeyCodeDown:
				hue += hueKeyDelta * factor;
				hue %= 360;
				hasChanged = true;
				break;

			case satKeyCodeUp:
				if (!useSat) return;
				saturation -= satKeyDelta * factor2;
				hasChanged = true;
				break;

			case satKeyCodeDown:
				if (!useSat) return;
				saturation += satKeyDelta * factor2;
				hasChanged = true;
				break;

			case lightKeyCodeUp:
				if (!useLuma) return;
				lightness += lightKeyDelta * factor2;
				hasChanged = true;
				break;

			case lightKeyCodeDown:
				if (!useLuma) return;
				lightness -= lightKeyDelta * factor2;
				hasChanged = true;
				break;
		}

		if (hasChanged) {
			cevent(e);
			me.hsl(hue, saturation, lightness);
			sendEvent()
		}

	}

	/*
	 *	Get position
	*/
	function getXY(e) {

		cevent(e);

		var rect = canvas.getBoundingClientRect(),
			touches = e.targetTouches;

		isTouch = touches && (msPointer ? e.pointerType === e.MSPOINTER_TYPE_TOUCH : true);

		if (isTouch && (touches.length === 1 || (msPointer && e.isPrimary))) {
			x = touches[0].clientX;
			y = touches[0].clientY;
		}
		else {
			x = e.clientX;
			y = e.clientY;
		}

		x -= rect.left;
		y -= rect.top;
	}

	function cevent(e) {
		if (e.stopPropagation) e.stopPropagation();
		if (e.preventDefault) e.preventDefault();
	}

	/*
	 *	Calc angle and distance
	 */
	function getTri(x, y) {

		var dx = x - center,
			dy = y - center;

		return {
			dist: Math.sqrt(dx*dx + dy*dy),
			angle: Math.atan2(dy, dx)
		}
	}

	/*
	 *	Calc sizes
	*/
	function calcSizes() {
		radiusHue = (diameter - thickness - lumaThickness * 3 - shadow * (useLuma ? 1 : 2)) * 0.5 + 1;	// hue radius
		radiusLightness	= (diameter - lumaThickness - shadow) * 0.5 + 1;								// light. radius
		lumaKnobWidth = lumaThickness * 0.5;															// light knob
		lumaKnob = [center - 1, center + radiusLightness];
		hueKnob	= [center - thickness * 0.5, center];
		l = Math.max(diameter * knobWidth, 5);
	}

	/*
	 *	Render methods
	*/
	function generateCanvas() {

		var i,
			rad,
			oldRad,
			gwstep;

		calcSizes();

		gwstep = 7 / (radiusHue * pi) * r2d;

		canvas.width = canvas.height = diameter;

		/*
		 *	Render HUE wheel
		*/
		ctx.lineWidth = thickness;

		for(i = oldRad = 0; i < 360; i += gwstep) {

			rad = i * d2r;

			ctx.beginPath();
			ctx.arc(center, center, radiusHue, oldRad, rad + 0.01);
			ctx.strokeStyle = "hsl(" + i + ",100%,50%)";
			ctx.stroke();

			oldRad = rad;
		}

		ctx.globalCompositeOperation = 'destination-over';

		/*
		 *	Render shadow
		*/
		if (shadow > 0) {
			ctx.save();

			ctx.shadowColor = options.shadowColor || "#000";
			ctx.shadowBlur = shadow;

			ctx.beginPath();
			ctx.arc(center, center, radiusHue, 0, pi2);
			ctx.stroke();

			ctx.restore()
		}

		/*
		 *	Render lightness wheel
		*/
		if (useLuma) {

			ctx.lineWidth = lumaThickness;

			for(i = 0, oldRad = dlt; i < 360; i += gwstep) {

				rad = i * d2r + dlt;

				ctx.beginPath();
				ctx.arc(center, center, radiusLightness, oldRad, rad + 0.01);
				ctx.strokeStyle = "hsl(0,0%,+" + i / 3.60 + "%)";
				ctx.stroke();

				oldRad = rad;
			}
		}

		ctx.globalCompositeOperation = "source-over";

		/*
		 *	Set static elements as background image of element
		*/
		canvasStyle.backgroundImage = 'url(' + canvas.toDataURL() + ')';
		ctx.clearRect(0, 0, diameter, diameter);
	}

	function renderHueKnob(selected) {

		getHueKnob(true);

		if (hueShadow) {
			ctx.shadowColor = options.shadowColor || "#000";
			ctx.shadowBlur = shadow;
		}

		ctx.lineWidth = 1;
		ctx.strokeStyle = '#000';
		ctx.fillStyle = selected ? hueKnobColorSel : hueKnobColor;
		ctx.fill();

		ctx.shadowColor = "transparent";
		ctx.shadowBlur = 0;

		ctx.stroke();
	}

	function getHueKnob(drawLine) {

		ctx.setTransform(1, 0, 0, 1, 0, 0);

		ctx.translate(center, center);
		ctx.rotate(hue * d2r);
		ctx.translate(-center, -center);

		var	kx = center + l + (radiusHue - thickness * 0.5 - l) * (useSat ? saturation : 1.0);

		if (useSat && drawLine) {
			ctx.lineWidth = 1;

			ctx.beginPath();
			ctx.moveTo(center, center - 0.5);
			ctx.lineTo(center + radiusHue - thickness * 0.5, center - 0.5);
			ctx.strokeStyle = '#000';
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(center, center + 0.5);
			ctx.lineTo(center + radiusHue - thickness * 0.5, center + 0.5);
			ctx.strokeStyle = '#fff';
			ctx.stroke();
		}

		ctx.beginPath();
		ctx.moveTo(kx - 1, center);
		ctx.lineTo(kx - l, center - l * 0.7);
		ctx.lineTo(kx - l, center + l  * 0.7);
		ctx.closePath();
	}

	function renderLumaKnob(selected) {
		getLumaKnob(true, selected);
		ctx.setTransform(1, 0, 0, 1, 0, 0);
	}

	function getLumaKnob(render, selected) {

		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.translate(center, center);
		ctx.rotate(pi2 * lightness);
		ctx.translate(-center, -center);

		if (render) {
			ctx.beginPath();
			ctx.arc(lumaKnob[0], lumaKnob[1], lumaKnobWidth, 0, pi2);
			ctx.closePath();
			ctx.fillStyle = '#000';
			ctx.fill();

			ctx.beginPath();
			ctx.arc(lumaKnob[0], lumaKnob[1], lumaKnobWidth - 1, 0, pi2);
			ctx.closePath();
			ctx.fillStyle = selected ? lightKnobColorSel : lightKnobColor;
			ctx.fill();

		}
		else {
			ctx.beginPath();
			ctx.arc(lumaKnob[0], lumaKnob[1], lumaKnobWidth, 0, pi2);
			ctx.closePath();
		}
	}

	function render() {
		clear();
		renderHueKnob(false);
		if (useLuma) renderLumaKnob(false);
	}

	function clear() {

		getRGB();

		ctx.clearRect(0, 0, diameter, diameter);

		if (showColor) {
			var rd = (radiusHue - thickness * 0.5) * colorWidth;

			ctx.beginPath();
			ctx.arc(center, center, rd, 0, pi2);
			ctx.closePath();
			ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
			ctx.fill();

			ctx.lineWidth = colorBorder;
			ctx.strokeStyle = colorBorderColor;
			ctx.stroke();
		}
	}

	function getRGB() {
		var rgb = isHSL ? hsl2rgb(hue, saturation, lightness) : hsv2rgb(hue, saturation, lightness);
		r = rgb.r;
		g = rgb.g;
		b = rgb.b;
		//validate();
	}

	/*
	 *	Misc system and checks
	*/
	function sendEvent() {

		clearTimeout(timeoutRef);

		if (me.onchange)
			timeoutRef = setTimeout(me.onchange({
				h: hue % 360,
				s: saturation,
				l: lightness,
				v: lightness,
				r: r,
				g: g,
				b: b,
				x: x,
				y: y,
				isIE: msPointer,
				isTouch: isTouch
			}), 7);
	}

	function validateHSLV() {
		hue %= 360;
		saturation = Math.max(0, Math.min(saturation, 1));
		lightness = Math.max(0, Math.min(lightness, 1));
	}

	function validateRGB(r, g, b) {
		return {
			r: Math.max(0, Math.min(r|0, 255)),
			g: Math.max(0, Math.min(g|0, 255)),
			b: Math.max(0, Math.min(b|0, 255))
		}
	}

	/*
	 *	HSL and HSV <--> RGB
	*/
	function hsv2rgb(h, s, v) {

		h /= 60;

		var i = h|0,
			f = h - i,
			m = v * (1 - s),
			n = v * (1 - (s * f)),
			k = v * (1 - (s * (1 - f))),
			rgb;

		if (i === 0) rgb = [v, k, m];
		else if (i === 1) rgb = [n, v, m];
		else if (i === 2) rgb = [m, v, k];
		else if (i === 3) rgb = [m, n, v];
		else if (i === 4) rgb = [k, m, v];
		else rgb = [v, m, n];

		return validateRGB(rgb[0] * 255, rgb[1] * 255, rgb[2] * 255)
	}

	function hsl2rgb(h, s, l) {

		var r, g, b, q, p;

		h /= 360;

		if (s === 0) {
			r = g = b = l;
		}
		else {
			q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			p = 2 * l - q;

			r = hue2rgb(p, q, h + 0.333333);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 0.333333);
		}

		function hue2rgb(p, q, t) {
			t %= 1;
			if (t < 0.166667) return p + (q - p) * t * 6;
			if (t < 0.5) return q;
			if (t < 0.666667) return p + (q - p) * (0.666667 - t) * 6;
			return p;
		}

		return validateRGB(r * 255, g * 255, b * 255)
	}

	function rgb2hsl(r, g, b){

		r /= 255;
		g /= 255;
		b /= 255;

		var maxColor = Math.max(r, g, b),
			minColor = Math.min(r, g, b),
			d = (maxColor - minColor),
			h = 0,
			s = 0,
			l = (maxColor + minColor) * 0.5;

		if (maxColor !== minColor){

			if (l < 0.5) {
				s = d / (maxColor + minColor);
			}
			else {
				s = d / (2.0 - maxColor - minColor);
			}

			//Calculate H:
			if (r === maxColor) {
				h = (g - b) / d;
			}
			else if (g === maxColor) {
				h = 2.0 + (b - r) / d;
			}
			else {
				h = 4.0 + (r - g) / d;
			}
		}

		h *= 60;
		if (h < 0.0) h += 360.0;

		return {
			h: h,
			s: s,
			l: l
		}
	}

	function rgb2hsv(r, g, b) {

		r /= 255;
		g /= 255;
		b /= 255;

		var h, s, v, d,
			minRGB = Math.min(r, Math.min(g, b)),
			maxRGB = Math.max(r, Math.max(g, b));

		if (minRGB === maxRGB) {

			v = minRGB;

			return {
				h: 0,
				s: 0,
				v: v
			}
		}

		// Colors other than black-gray-white:
		d = (r === minRGB) ? g - b : ((b === minRGB) ? r - g : b - r);
		h = (r === minRGB) ? 3 : ((b === minRGB) ? 1 : 5);

		h = 60 * (h - d / (maxRGB - minRGB));
		s = (maxRGB - minRGB) / maxRGB;
		v = maxRGB;

		return {
			h: h,
			s: s,
			v: v
		}
	}

	/*
	 *	Exposed methods
	*/

	/**
	 * Set the Hue Wheel current value using HSL. If no arguments ar
	 * given current color is returned as Object with h, s, l as
	 * properties.
	 *
	 * @param {Number} [h] - Hue
	 * @param {Number} [s] - Saturation
	 * @param {Number} [l] - Lightness
	 * @returns {*}
	 */
	this.hsl = function(h, s, l) {

		if (!arguments.length) {

			if (isHSL) {
				return {h: hue, s: saturation, l: lightness};
			}
			else {

				var rgb = hsv2rgb(hue, saturation, lightness),
					hsl = rgb2hsl(rgb.r, rgb.g, rgb.b);

				return {h: hsl.h, s: hsl.s, l: hsl.l};
			}
		}

		setHSLV(h, s, l);

		return this;
	};

	/**
	 * Set the Hue Wheel current value using HSV. If no arguments ar
	 * given current color is returned as Object with h, s, v as
	 * properties.
	 *
	 * @param {Number} [h] - Hue
	 * @param {Number} [s] - Saturation
	 * @param {Number} [v] - Brightness
	 * @returns {*}
	 */
	this.hsv = function(h, s, v) {

		var rgb, hsv, hsl;

		if (!arguments.length) {
			if (isHSL) {
				rgb = hsl2rgb(hue, saturation, lightness);
				hsv = rgb2hsv(rgb.r, rgb.g, rgb.b);
				return {h: hsv.h, s: hsv.s, v: hsv.v};
			}
			else {
				return {h: hue, s: saturation, v: lightness};
			}
		}

		rgb = hsv2rgb(h, s, v);
		hsl = rgb2hsl(rgb.r, rgb.g, rgb.b);

		setHSLV(hsl.h, hsl.s, hsl.l);

		return this;
	};

	function setHSLV(h, s, l) {

		hue = h;
		saturation = s;
		lightness = l;
		validateHSLV();

		render();
		//sendEvent();
	}

	/**
	 * Set the Hue Wheel current value using RGB. If no arguments ar
	 * given current color is returned as Object with r, g, b as
	 * properties.
	 *
	 * @param {Number} [r] - red
	 * @param {Number} [g] - green
	 * @param {Number} [b] - blue
	 * @returns {*}
	 */
	this.rgb = function(r, g, b) {

		if (!arguments.length)
			return {h: hue, s: saturation, l: lightness, v: lightness};

		var rgb = validateRGB(r, g, b);

		r = rgb.r;
		g = rgb.g;
		b = rgb.b;

		var hsl = (isHSL) ? rgb2hsl(r, g, b) : rgb2hsv(r, g, b);

		hue = hsl.h;
		saturation = hsl.s;
		lightness = hsl.l || hsl.v;
		validateHSLV();

		render();
		sendEvent();

		return this;
	};

	/*
	 *	Internal helpers
	*/
	function isBool(a) {return (typeof a === 'boolean')}

	/*
	 *	METHODS
	*/

	/**
	 * Show or hide color spot. If no arguments are given the current
	 * state is returned.
	 *
	 * @param {Boolean} [state=true]
	 * @returns {*}
	 */
	this.showColor = function(state) {

		if (!arguments.length) return showColor;

		showColor = !!state;
		render();

		return this
	};

	/**
	 * Allow changing lightness (show or hide lightness ring).
	 * If no arguments are given the current state is returned.
	 *
	 * @param {Boolean} [state=true]
	 * @returns {*}
	 */
	this.changeLightness = function(state) {

		if (!arguments.length || !isBool(state))
			return useLuma;

		useLuma = state;

		lumaThickness = useLuma ? Math.max(diameter * 0.05, 3) : 0;

		generateCanvas();
		render();

		return this
	};

	/**
	 * Allow changing saturation (show or hide saturation slider).
	 * If no arguments are given the current state is returned.
	 *
	 * @param {Boolean} [state=true]
	 * @returns {*}
	 */
	this.changeSaturation = function(state) {

		if (!arguments.length) return useSat;

		useSat = !!state;

		generateCanvas();
		render();

		return this;
	};

	/**
	 * Change thickness of Hue ring. If no argument is given then
	 * current thickness is returned.
	 *
	 * @param {Number} [t] - Factor or width max 30% of control diameter
	 * @returns {*}
	 */
	this.thicknessHue = function(t) {

		if (!arguments.length) return thickness;

		if (t < 3) t = 3;
		if (t > diameter * 0.3) t = (diameter * 0.3)|0;

		thickness = t;

		generateCanvas();
		render();

		return this;
	};

	/**
	 * Change thickness of lightnes ring. If no argument is given then
	 * current thickness is returned.
	 *
	 * @param {Number} [t] - Factor or width max 20% of control diameter
	 * @returns {*}
	 */
	this.thicknessLightness = function(t) {

		if (!arguments.length) return thickness;

		if (t < 3) t = 3;
		if (t > diameter * 0.2) t = (diameter * 0.2)|0;

		lumaThickness = t;

		generateCanvas();
		render();

		return this
	};

	/**
	 * A normalized factor of control's radius used for the color
	 * spot. If no argument is given current radius factor is returned.
	 *
	 * @param {Number} [radiusFactor] - [0.0, 1.0]
	 * @returns {*}
	 */
	this.colorSpotRadius = function(radiusFactor) {

		if (!arguments.length) return colorWidth;

		colorWidth = +radiusFactor;

		generateCanvas();
		render();

		return this
	};

	/**
	 * Set or get color space (HSL or HSV).
	 *
	 * @param {String} [colSpace] - name of color space
	 * @returns {*}
	 */
	this.colorSpace = function(colSpace) {

		if (!arguments.length || (colSpace !== 'hsl' && colSpace !== 'hsv'))
			return isHSL ? 'hsl' : 'hsv';

		var rgb, c;

		if (isHSL && colSpace === 'hsv') {

			rgb = hsl2rgb(hue, saturation, lightness);
			c = rgb2hsv(rgb.r, rgb.g, rgb.b);

			hue = c.h;
			saturation = c.s;
			lightness = c.v;

		}
		else if (!isHSL && colSpace === 'hsl') {

			rgb = hsv2rgb(hue, saturation, lightness);
			c = rgb2hsl(rgb.r, rgb.g, rgb.b);

			hue = c.h;
			saturation = c.s;
			lightness = c.l;
		}

		isHSL = (colSpace === 'hsl');

		render();
		sendEvent();

		return this
	};

	/**
	 * Set or get if lightness ring should allow mouse to click anywhere
	 * in the ring to set new lightness. If off the knob only can be
	 * used.
	 *
	 * @param {Boolean} [state]
	 * @returns {*}
	 */
	this.lightnessClickable = function(state) {
		if (!arguments.length) return lightClickable;
		lightClickable = !!state;
		return this
	};

	/**
	 * Enable or disable holding the CTRL-key to lock Hue while moving
	 * saturation.
	 *
	 * @param state
	 * @returns {*}
	 */
	this.ctrlLock = function(state) {
		if (!arguments.length) return ctrlLock;
		ctrlLock = !!state;
		return this
	};

	/*
	 *	Convertion public vectors
	*/

	/**
	 * Convert RGB to HSL
	 * @method
	 * @param {number} r - red component [0, 255]
	 * @param {number} g - green component [0, 255]
	 * @param {number} b - blue component [0, 255]
	 * @returns {object} Object with properties h, s, l
	 */
	this.rgb2hsl = rgb2hsl;

	/**
	 * Convert RGB to HSL
	 * @method
	 * @param {number} r - red component [0, 255]
	 * @param {number} g - green component [0, 255]
	 * @param {number} b - blue component [0, 255]
	 * @returns {object} Object with properties h, s, v
	 */
	this.rgb2hsv = rgb2hsv;

	/**
	 * Convert HSV to RGB
	 * @method
	 * @param {number} h - hue [0, 360>
	 * @param {number} s - saturation [0.0, 1.0]
	 * @param {number} v - brightness [0.0, 1.0]
	 * @returns {object} Object with properties r, g, b
	 */
	this.hsv2rgb = hsv2rgb;

	/**
	 * Convert HSL to RGB
	 * @method
	 * @param {number} h - hue [0, 360>
	 * @param {number} s - saturation [0.0, 1.0]
	 * @param {number} l - lightness [0.0, 1.0]
	 * @returns {object} Object with properties r, g, b
	 */
	this.hsl2rgb = hsl2rgb;
}

/**
 * Event object for HueWheel (onchange)
 *
 * @event HueWheel#mouseEvent
 * @type {Object}
 * @prop {Number} h - current hue [0, 360>
 * @prop {Number} s - current saturation [0.0, 1.0]
 * @prop {Number} l - (if HSL mode) current lightness [0.0, 0.1]
 * @prop {Number} v - (if HSV mode) current brightness [0.0, 0.1]
 * @prop {Number} r - current red [0, 255]
 * @prop {Number} g - current green [0, 255]
 * @prop {Number} b - current blue [0, 255]
 * @prop {Number} x - current x position in wheel
 * @prop {Number} y - current y position in wheel
 * @prop {Boolean} isTouch - Event was triggered by touch and not mouse
 */
