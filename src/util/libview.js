'use strict';

module.exports = Object.freeze({
  getEmSize (element) {
    // http://stackoverflow.com/questions/16010204/get-reference-of-window-object-from-a-dom-element
    const window = element.ownerDocument.defaultView;
    const computedStyle = window.getComputedStyle(element);
    const parsedFontSize = computedStyle.fontSize.match(/^(\d+)px$/);
    if (!parsedFontSize) {
      throw Error(`Expected font size in pixels. Got ${computedStyle.fontSize}`);
    }
    return Number(parsedFontSize[1]);
  }
});

