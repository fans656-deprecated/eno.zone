import React from 'react';

import Nav from './Nav';
import UserSpan from './UserSpan';

import './css/Header.css';

const Header = ({user, consoleHandlers}) => (
  <header className="reverse-color">
    <Nav user={user}/>
    <div className="right" style={{
      marginLeft: 'auto',
      display: 'inline-flex',
      alignItems: 'center',
    }}>
      <UserSpan user={user}/>
    </div>
  </header>
);

export default Header;
