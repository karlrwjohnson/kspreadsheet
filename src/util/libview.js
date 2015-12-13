'use strict';

module.exports = Object.freeze({
  getEmSize (element) {
    const computedStyle = window.getComputedStyle(element);
    const parsedFontSize = computedStyle.fontSize.match(/^(\d+)px$/);
    if (!parsedFontSize) {
      throw Error(`Expected font size in pixels. Got ${computedStyle.fontSize}`);
    }
    return Number(parsedFontSize[1]);
  }
});

