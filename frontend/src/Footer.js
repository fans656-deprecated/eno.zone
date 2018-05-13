import React from 'react';
import { Link } from 'react-router-dom';

import './css/Footer.css';

const Footer = (props) => (
  <footer className="reverse-color">
    <Link to="/">{props.owner.username}'s site</Link>
  </footer>
);

export default Footer;
