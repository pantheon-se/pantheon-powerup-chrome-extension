/**
 * Mutation Observer utility class
 */

export class DOMObserver {
  constructor() {
    window.pantheonListeners = [];
    this.observer = null;

    // try {
    //   this.MutationObserver =
    //     window.MutationObserver || window.WebKitMutationObserver;
    // } catch (e) {
    //   throw new Error(e);
    // }

    // Watch for changes in the document
    this.observer = new window.MutationObserver(this.check);
    this.observer.observe(window.document, {
      childList: true,
      subtree: true,
    });
  }

  /**
   *
   * @param {string} selector The DOM selector of the element.
   * @param {function} fn The callback function to run.
   * @param {boolean} repeat If the callback should run on every detection.
   */
  ready(selector, fn, repeat) {
    repeat = repeat ?? false;
    console.log('selector', selector);
    // Store the selector and callback to be monitored
    window.pantheonListeners.push({
      selector: selector,
      fn: fn,
      repeat: repeat,
    });
    // Check if the element is currently in the DOM
    this.check();
  }

  check() {
    // Check the DOM for elements matching a stored selector
    let listenLenda = window.pantheonListeners?.length;
    if (listenLenda != undefined) {
      for (let i = 0, len = listenLenda, listener, elements; i < len; i++) {
        listener = window.pantheonListeners[i];
        // Query for elements matching the specified selector
        elements = window.document.querySelectorAll(listener.selector);
        for (let j = 0, jLen = elements.length, element; j < jLen; j++) {
          element = elements[j];
          // Make sure the callback isn't invoked with the
          // same element more than once if repeat is false.
          if (!element.ready) {
            if (listener.repeat == false) {
              element.ready = true;
            }

            // Invoke the callback with the element
            listener.fn.call(element);
          }
        }
      }
    }
  }
}
