import React from 'react';
import { Link } from 'react-router-dom';

import { fetchJSON } from './util';
import conf from './conf'
import './css/Nav.css';

export default class Nav extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      nav: conf.default.nav,
    };
  }

  async componentDidMount() {
    const note = await fetchJSON('POST', '/api/query-note', {
      alias: 'nav',
    });
    if (note) {
      const nav = [];
      try {
        note.note.links.forEach(link => {
          nav.push({
            name: link.name,
            href: link.href,
          });
        });
        this.setState({nav: nav});
      } catch (e) {
        // ignore
      }
    }
  }

  render() {
    let links = [];
    this.state.nav.forEach((link, i) => {
      links.push(<li key={i}><a href={link.href}>{link.name}</a></li>);
    });
    return <nav><ul>{links}</ul></nav>;
  }
}
