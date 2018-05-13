import React from 'react';
import { Link } from 'react-router-dom';

//import { getNote } from './util';
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
    //let nav = await getNote({owner: this.props.owner, id: '_nav'});
    //if (nav) {
    //  this.setState({nav: nav});
    //}
  }

  render() {
    let links = [];
    this.state.nav.forEach((link, i) => {
      let a = null;
      if (link.url) {
        a = <a href={link.url}>{link.name}</a>;
      } else if (link.to) {
        a = <Link to={link.to}>{link.name}</Link>;
      }
      if (a) {
        links.push(<li key={i}>{a}</li>);
      }
    });
    return <nav><ul>{links}</ul></nav>;
  }
}
