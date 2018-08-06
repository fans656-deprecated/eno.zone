import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

import { getVisitor, getOwner } from './util';
import { registerServiceWorker } from './stome/serviceworker'

import App from './App';
import { init as stomeInit } from './stome/init';

import './css/style.css'

window.onerror = function unhandledError(errorMessage, url, lineNumber) {
  alert(errorMessage, url, lineNumber);
  return false;
}

stomeInit();

registerServiceWorker();

const visitor = getVisitor();
const owner = getOwner();

window.isMobile = window.matchMedia('(max-device-width: 800px)').matches;

window.owner = owner;
window.visitor = visitor;

visitor.owner = owner.owner = owner;

document.title = `Home - ${owner['username']}`;

ReactDOM.render((
  <BrowserRouter>
    <App visitor={visitor} owner={owner}/>
  </BrowserRouter>
), document.getElementById('root'));
