import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

import { getVisitor, getOwner } from './util';

import App from './App';
import './css/style.css';

const visitor = getVisitor();
const owner = getOwner();
visitor.owner = owner.owner = owner;

document.title = `Home - ${owner['username']}`;

ReactDOM.render((
  <BrowserRouter>
    <App visitor={visitor} owner={owner}/>
  </BrowserRouter>
), document.getElementById('root'));
