const EventEmitter = require('events');

const internals = {
  mockEventProps: {
    setTimeout: 0,
    setInterval: 0,
    verbose: false
  },
  origin: null
};

let mockHandlers = [];
const missed = [];


const baseHandler = {
  id: null,
  url: '',
  setInterval: internals.mockEventProps.setInterval,
  verbose: internals.mockEventProps.verbose,
  responses: [],
  response: null,
  proxy: null,
  allResponses: [],

  initialize() {
    this.allResponses = this.allResponses.concat(this.responses);
  },

  headers() {
    return {
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Headers': 'Content-type,Authorization',
      'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
      'Access-Control-Allow-Origin': internals.origin,
      'Access-Control-Expose-Headers': '*',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Content-type': 'text/event-stream',
      Date: (new Date()).toString()
    };
  },

  urlMatches(url) {
    const isFunction = functionToCheck => functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
    if (isFunction(this.url.test)) {
      // The user provided a regex for the url, test it
      if (!this.url.test(url)) {
        return false;
      }
    } else {
      const star = this.url.indexOf('*');
      if (((this.url !== url) && (star === -1)) || !new RegExp(this.url.replace(/[-[\]{}()+?.,\\^$|#\s]/g, '\\$&').replace(/\*/g, '.+')).test(url)) {
        return false;
      }
    }
    return true;
  },

  clear() {
    // mockHandlers[this.id] = null;
    mockHandlers = [];
    delete this;
  },

  dispatchEvent(response) {
    if (!(response.type && response.data)) {
      this.dispatchError('`type` and `data` are required on mock handler response object');
    } else {
      this.evtSource.emit(
        response.type,
        this.evtSource.url.includes('//') ? { ...response, origin: this.evtSource.url.split('/', 3).reduce((origin, parts) => `${origin}/${parts}`) } : response
      );
    }
  },

  errorEventName() {
    return 'error';
  },

  dispatchError(errorMessage) {
    this.evtSource.emit(this.errorEventName(), errorMessage);
  },

  interval() {
    if (this.setInterval instanceof Array) {
      let min;
      let max;
      const firstElement = 0;
      const secondElement = 1;
      if (this.setInterval[firstElement] < this.setInterval[secondElement]) {
        min = this.setInterval[firstElement];
        max = this.setInterval[secondElement];
      } else {
        min = this.setInterval[secondElement];
        max = this.setInterval[firstElement];
      }
      return (Math.random() * (max - min)) + min;
    }
    return this.setInterval;
  },

  stream(responses) {
    // Handling the stream output via this.setInterval attribute,
    // ironically it's being handled with the `setTimeout` function.
    let timeoutId;
    let timeoutValue;

    const streamIt = () => {
      if (responses.length) {
        const response = responses.shift();
        if (this.evtSource.readyState === this.evtSource.OPEN) {
          this.lastResponseId = response.lastEventId;
          this.dispatchEvent(response);
          this.stream(responses);
        } else {
          if (this.verbose) console.warn(`The following response was missed because EventSource.close(), ${JSON.stringify(response)}`); // eslint-disable-line no-console
          this.dispatchError('`EventSource` instance closed while sending.');
        }
      } else {
        clearTimeout(timeoutId);
        timeoutId = false;
      }
    };

    if (!timeoutId) {
      timeoutValue = this.interval();
      timeoutId = setTimeout(streamIt, timeoutValue);

      // Logging on `verbose` = True
      if (this.verbose && responses.length) console.info(`Send stream in ${timeoutValue} milliseconds.`); // eslint-disable-line no-console
    }
  }
};


class EventSource extends EventEmitter {
  constructor(url, settings) {
    super();
    this.url = url;
    this.settings = settings;
    this.CONNECTING = 0;
    this.OPEN = 1;
    this.CLOSED = 2;
    this.readyState = null;
    this.responses = [];
    if (url.includes('//')) {
      const originParts = url.split('/', 3);
      internals.origin = originParts.reduce((origin, parts) => `${origin}/${parts}`);
      internals.host = originParts[2].split(':', 1)[0]; // eslint-disable-line prefer-destructuring
    }

    this.scheduleEvents();
  }

  // eslint-disable-next-line class-methods-use-this
  headers() {
    return {
      Accept: 'text/event-stream',
      'Accept-Encoding': 'gzip, deflate, sdch',
      // 'Accept-Language': window.navigator.languages.join(','),
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      // 'Cookie': docCookies.cookiesToString(),
      Host: internals.host,
      // 'Last-event-id': this.handler.lastResponseId || '',
      Origin: internals.origin,
      Referer: internals.origin
    };
  }

  // Creates event of type `error`
  // eslint-disable-next-line class-methods-use-this
  error(message) {
    if (this.onerror) this.onerror(new Error(message));
  }


  close() {
    this.readyState = this.CLOSED;
  }

  // eslint-disable-next-line class-methods-use-this
  addEventListener(name, fn) {
    return this.addListener(name, fn);
  }


  listenForErrors(mockHandler) {
    this.addEventListener(mockHandler.errorEventName(), (event) => {
      this.error(event);
    });
  }

  // eslint-disable-next-line class-methods-use-this
  scheduleEvents() {
    // Properties are set in several statements
    // waiting for all properties to be set
    setTimeout(() => {
      // No `MockEvent` instances detected
      if (mockHandlers.length === 0) missed.push(this);

      mockHandlers.forEach((mockHandler) => {
        // `MockEvent` instance deleted
        if (mockHandler === null) return;

        if (!mockHandler.urlMatches(this.url)) {
          missed.push(this);
          return;
        }

        this.handler = mockHandler;
        mockHandler.evtSource = this; // eslint-disable-line no-param-reassign

        // mockHandler dispatches error event
        // EventSource calls `onerror` method
        this.listenForErrors(mockHandler);

        if (this.readyState === null) this.readyState = this.CONNECTING;
        if (this.readyState == this.CONNECTING) { // eslint-disable-line eqeqeq
          if (this.onopen) this.onopen({ message: 'The opening message.', anotherCustomeProp: { prop: 'whatever' } });
          this.readyState = this.OPEN;
        }
        if (!(mockHandler.allResponses.length || mockHandler.response)) this.error(`Handler for URL "${mockHandler.url}" requires response type attribute`);
        if (mockHandler.response) mockHandler.response(mockHandler, this);
        if (mockHandler.responses) mockHandler.stream([...mockHandler.responses]);
      });
      if (this.handler === undefined) this.error(`There was no event handler found for EventSource with url: ${this.url}`);
    }, internals.mockEventProps.setTimeout);
  }
}


class MockEvent {
  constructor(settings) {
    const i = mockHandlers.length;
    internals.mockEventProps.setInterval = settings.setInterval;
    internals.mockEventProps.verbose = !!settings.verbose;
    mockHandlers[i] = { ...baseHandler, ...settings, id: i };
    mockHandlers[i].initialize();
    return mockHandlers[i];
  }

  // eslint-disable-next-line class-methods-use-this
  clear(i) {
    if (i || i === 0) mockHandlers[i] = null;
    else mockHandlers = [];
  }

  // eslint-disable-next-line class-methods-use-this
  handlers(i) {
    if (i || i === 0) { return mockHandlers[i]; }
    return mockHandlers;
  }

  // eslint-disable-next-line class-methods-use-this
  missed() { return missed; }
}


module.exports = { MockEvent, EventSource };
