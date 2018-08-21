const EventEmitter = require('events');

const internals = {
  mockEventProps: {
    setTimeout: 0,
    setInterval: 0,
    verbose: false,
    on: true
  }
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
  on: internals.mockEventProps.on,
  allResponses: [],

  initialize() {
    this.allResponses = this.allResponses.concat(this.responses);
  },

  headers() {
    return {
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Headers': 'Content-type,Authorization',
      'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
      'Access-Control-Allow-Origin': `${internals.protocol}//${internals.host}`,
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
      if (this.url !== url && star === -1 || !new RegExp(this.url.replace(/[-[\]{}()+?.,\\^$|#\s]/g, '\\$&').replace(/\*/g, '.+')).test(url)) {
        return false;
      }
    }
    return true;
  },

  clear() {
    mockHandlers[this.id] = null;
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
    //return `mock-event-${this.id}-error`;
    return 'error';
  },

  dispatchError(errorMessage) {
    this.evtSource.emit(this.errorEventName(), errorMessage);
  },

  stream(responses) {
    /* Handling the stream output via this.setInterval attribute, 
    ironically it's being handled with the `setTimeout` function. */
    const self = this;
    let timeoutId;
    let timeoutValue;

    const streamIt = function () {
      if (responses.length) {
        const response = responses.shift();
        if (self.evtSource.readyState === self.evtSource.OPEN){
          self.lastResponseId = response.lastEventId;
          self.dispatchEvent(response);
          self.stream(responses);
        } else {
          if (this.verbose) console.warn("Missed response because EventSource.close()", response);
          self.dispatchError("`EventSource` instance closed while sending.");
        }
      } else {
        clearTimeout(timeoutId);
        timeoutId = false;
      }
    };

    if (!timeoutId) {
      if (self.setInterval instanceof Array) {
        const min = self.setInterval[0];
        const max = self.setInterval[1];
        timeoutValue = Math.random() * (max - min) + min;
        timeoutId = setTimeout(streamIt, timeoutValue);
      } else {
        timeoutValue = self.setInterval;
        timeoutId = setTimeout(streamIt, timeoutValue);
      }

      // Logging on `verbose` = True
      if (this.verbose && responses.length) {
        console.info("Send stream in " + timeoutValue + " milliseconds.");
      }
    }
  },

  stop() {
    this.on = false;
  },

  start() {
    this.on = true;
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
      Origin: `${internals.protocol}//${internals.host}`,
      Referer: `${internals.protocol}//${internals.host}`,
      // 'User-Agent': window.navigator.userAgent
    };
  }

  // Creates event of type `error`
  // eslint-disable-next-line class-methods-use-this
  error(message) {
    this.emit('error', message);
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
        mockHandler.evtSource = this;

        // mockHandler dispatches error event
        // EventSource calls `onerror` method
        this.listenForErrors(mockHandler);

        if (this.readyState === null) {
          this.readyState = this.CONNECTING;
        }

        if (this.readyState == this.CONNECTING) {
          if (this.onopen) {
            this.onopen({
              message: 'You are open!',
              apology: 'I did not know what else to say.'
            });
          }
          this.readyState = this.OPEN;
        }

        if (!(mockHandler.allResponses.length || mockHandler.response)) this.error(`Handler ${mockHandler.url} requires response type attribute`);

        if (mockHandler.response) mockHandler.response(mockHandler, this);

        if (mockHandler.responses) mockHandler.stream([...mockHandler.responses]);
      });

      if (this.handler === undefined) {
        /* A handler was never found for this `EventSource`
        instance. In this case we send a Timeout Error. */
        this.error('Timeout Error');
      }
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

  clear(i) {
    if (i || i === 0) {
      mockHandlers[i] = null;
    } else {
      mockHandlers = [];
    }
  }
  
  handlers(i) {
    if (i || i === 0) return mockHandlers[i];
    return mockHandlers;
  }
  
  missed() {
    return missed;
  }
}


module.exports = {
  MockEvent,
  EventSource
};
