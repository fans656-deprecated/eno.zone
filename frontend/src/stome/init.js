import $ from 'jquery'

function newHandlerId(eventname) {
  return eventname + '-' + Date.now() + '-' + Math.random();
}

export function init() {
  window.handlers = {};
  window.handlers.keyup = {};

  window.on = (eventname, handler) => {
    let id = null;
    switch (eventname) {
      case 'keyup':
        id = newHandlerId(eventname);
        break;
      default:
        break;
    }
    if (id) window.handlers[eventname][id] = handler;
    return id;
  }

  window.off = (id) => {
    if (id) {
      try {
        const eventname = id.split('-')[0];
        delete window.handlers[eventname][id];
      } catch (e) {
        // do nothing
      }
    }
  }

  $('html').on('keyup', (ev) => {
    for (let key in window.handlers.keyup) {
      const handler = window.handlers.keyup[key];
      handler(ev);
    }
  });
}
