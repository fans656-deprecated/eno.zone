import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery'
import { BrowserRouter } from 'react-router-dom';

import { getVisitor, getOwner } from './util';
import { registerServiceWorker } from './stome/serviceworker'

import App from './App';

import './css/style.css'

function newHandlerId(eventname) {
  return eventname + '-' + Date.now() + '-' + Math.random();
}

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

registerServiceWorker();

const visitor = getVisitor();
const owner = getOwner();
visitor.owner = owner.owner = owner;

document.title = `Home - ${owner['username']}`;

ReactDOM.render((
  <BrowserRouter>
    <App visitor={visitor} owner={owner}/>
  </BrowserRouter>
), document.getElementById('root'));
