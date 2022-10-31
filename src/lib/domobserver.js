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

    this.chrome = chrome || {}; // eslint-disable-line no-undef

    window.addEventListener('message', this.handleFromWeb);
    this.injectScript(
      this.chrome.runtime.getURL('webAccessibleResources.js'),
      'body',
    );
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

  /**
   *
   * @param {*} filePath
   * @param {*} tag
   */
  injectScript(filePath, tag) {
    let node = document.getElementsByTagName(tag)[0];
    let script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', filePath);
    script.setAttribute('id', 'inject');
    node.appendChild(script);
  }

  /**
   *
   * @param {*} event
   */
  async handleFromWeb(event) {
    if (event.data.from) {
      console.log('event', event);
      const data = event.data.data;
      console.log('data', data);
      window.site = {};
      Object.assign(window.site, data);
    }
  }
}
