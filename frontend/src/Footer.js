import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from 'react-icons-kit';
import { ic_help as HelpIcon } from 'react-icons-kit/md/';

import './css/Footer.css';

const Footer = (props) => (
  <footer className="reverse-color"
    style={{
      lineHeight: '3',
      position: 'relative',
      textAlign: 'center',
      fontFamily: 'Consolas',
    }}
  >
    <Link to="/">{props.owner.username}'s site</Link>
    <Link to="/help"
      style={{
        display: 'inline-flex',
        position: 'absolute',
        right: '1em',
        height: '100%',
      }}
    >
      <Icon icon={HelpIcon} size={18}/>
    </Link>
  </footer>
);

export default Footer;
