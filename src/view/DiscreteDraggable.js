'use strict';

const bindObservers = require('../util/bindObservers');
const libview = require('../util/libview');
const OutOfBoundsException = require('../OutOfBoundsException');

/**
 * Wraps an element so it can be dragged across a discrete grid of em units.
 */
module.exports =
class DiscreteDraggable {
  /**
   * @param element  Element to bind to
   * @param button   Which button to watch (1=left click, 2=right, 4=middle)
   * @param on_jump  Function to call when the element "jumps"
   *                 Parameters are (dx, dy)
   *                 If the change was out-of-bounds, throw an OutOfBoundsException
   *                 and this class will eat it.
   */
  constructor (element, button, on_jump) {
    bindObservers(this);

    this.element = element;
    this.button = button;
    this.on_jump = on_jump;

    this.element.addEventListener('mousedown', this._on_mouse_down);
  }

  get window () {
    // http://stackoverflow.com/questions/16010204/get-reference-of-window-object-from-a-dom-element
    return this.element.ownerDocument.defaultView;
  }

  _on_mouse_down (evt) {
    if (evt.buttons === this.button) {
      evt.stopPropagation();
      evt.preventDefault();

      this.emSize = libview.getEmSize(this.element);
      this.start_x = evt.pageX;
      this.start_y = evt.pageY;

      this.window.addEventListener('mousemove', this._on_mouse_drag);
      this.window.addEventListener('mouseup', this._on_mouse_up);
      this.window.addEventListener('click', this._on_click);
    }
  }

  _on_mouse_drag (evt) {
    //noinspection JSBitwiseOperatorUsage
    if (evt.buttons & this.button) {
      evt.stopPropagation();
      evt.preventDefault();

      const unitsMoved_x = Math.round((evt.pageX - this.start_x) / this.emSize);
      const unitsMoved_y = Math.round((evt.pageY - this.start_y) / this.emSize);
      if (unitsMoved_x !== 0 || unitsMoved_y !== 0) {
        try {
          this.on_jump(unitsMoved_x, unitsMoved_y);

          this.start_x += unitsMoved_x * this.emSize;
          this.start_y += unitsMoved_y * this.emSize;
        } catch (e) {
          if (e instanceof OutOfBoundsException) {
            // pass: part of the API
          }
          else{
            throw e;
          }
        }

      }
    }
    else {
      this._stopDrag();
    }
  }

  _on_mouse_up (evt) {
    evt.stopPropagation();
    evt.preventDefault();

    this._stopDrag();
  }

  _on_click (evt) {
    // A click event is generated when the cursor lets go of the dragged object.
    // Because the possible positions are quantized, it's very possible for the
    // cursor to not actually be over the dragged element when the mouse is
    // released.
    // To prevent these rogue clicks, we capture the event here.
    evt.stopPropagation();
    evt.preventDefault();
    this.window.removeEventListener('click', this._on_click);
  }

  _stopDrag() {
    this.window.removeEventListener('mousemove', this._on_mouse_drag);
    this.window.removeEventListener('mouseup', this._on_mouse_up);
  }
};
