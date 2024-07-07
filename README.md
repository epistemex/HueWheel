Hue Wheel for JavaScript
========================

[![Demo snapshot](http://i.imgur.com/by5YtY3.png)](http://epistemex.github.io/huewheel/)<br>
*<sup>Snapshot from tint demo.</sup>*

HueWheel is a HSL/HSV HTML5 color wheel *control*. Supports HSL/HSV <-> RGB values with many options for
appearance and functionality. The control can be controlled with both mouse and touch/pen.


Features
--------

- Rotating knobs changing values in real-time.
- HSL/HSV color space with built-in color-space convertion between RGB, HSL and HSV.
- Hue, Saturation, Lightness/Brightness (depending on chosen color-space mode) can be controlled individually with controls or programatically.
- Supports mouse and touch/pen
- Supports keys for accesibility (when control is active)
- Highly configurable (visible controls, sizes, start values, converted RGB <-> HSL/HSV, colors and more)
- **New**: optional CTRL-key lock of hue while moving saturation slider

_Help keep the project alive by supporting the developer:_

[![PayPalMe](https://github.com/epistemex/transformation-matrix-js/assets/70324091/04203267-58f0-402b-9589-e2dee6e7c510)](https://paypal.me/KenNil)

Examples
========

All visible features activated
------------------------------

<img src="https://i.imgur.com/h0y4KNq.png" alt="All controls activated" />


Color spot disabled
-------------------

You will still receive color value as RGB, HSL/HSV in the onchange event. This is useful
if you want to present the current color in a custom way.

<img src="https://i.imgur.com/Ig9NB5N.png" alt="Color spot disabled" />


Lightness wheel disabled
------------------------

Lightness can still be changed programatically but is not visible in the control. Useful when you only want to
tint an image using the luminance from the image as input instead.


Saturation slider disabled
--------------------------

Saturation can still be changed programatically but is not visible in the control.

<img src="https://i.imgur.com/CSA3lSC.png" alt="Saturation slider disabled" />


Usage
-----

Create an instance with reference to the element you want to replace with the
control:

    var hueWheel = new HueWheel( element|"id", [options] );

See included documentation for details on options and methods.


Note on Internet Explorer
-------------------------

For touch-enabled devices using internet explorer -

To make MSPointerMove event work properly you need to redirect all pointer events using CSS:

    html {
        -ms-touch-action: none;
        }

This will allow the hue wheel to work with IE 10/11 and touch. As it's prefixed it
won't affect other browsers. See included demos for example.

Also, if you get selected text and don't want this you can use:

    element.addEventListener('selectstart', function(e) { e.preventDefault(); }, false);

[Read more here](http://msdn.microsoft.com/en-us/library/ie/hh673557%28v=vs.85%29.aspx)


License
-------

Released under [MIT license](http://choosealicense.com/licenses/mit/). You can use this class in both commercial and non-commercial projects provided that full header (minified and developer versions) is included.

*&copy; 2013-2016, 2024 Epistemex*

![Epistemex](https://i.imgur.com/wZSsyt8.png)
