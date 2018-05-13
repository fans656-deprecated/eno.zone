import React from 'react';
import { Link } from 'react-router-dom';
import $ from 'jquery';
import IconPlus from 'react-icons/lib/md/add';

import { Icon } from './common';
import './css/OperationPanel.css';

export default class OperationPanel extends React.Component {
  constructor(props) {
    super(props);
    this.scrolling = false;
    this.lastY = null;
  }

  componentDidMount() {
    // mobile panel auto hide
    const isDesktop = window.matchMedia('(min-device-width: 800px)').matches;
    if (isDesktop) {
      return;
    }
    $(window).scroll(ev => {
      this.scrolling = true;
    });
    const deltaY = 100;
    const duration = 300;
    const panel = $('#panel');
    panel.hide(duration);
    this.scrollTimer = setInterval(() => {
      if (this.scrolling) {
        const y = $(window).scrollTop();
        if (this.lastY === null) {
          this.lastY = y;
        } else {
          // scroll down enough
          if (y - this.lastY > deltaY) {
            panel.hide(duration);
            this.lastY = y;
            // scroll up enough
          } else if (this.lastY - y > deltaY) {
            panel.show(duration);
            this.lastY = y;
          }
        }
        this.scrolling = false;
      }
    }, 250);
  }

  componentWillUnmount() {
    clearInterval(this.scrollTimer);
  }

  showConsole = () => {
    this.setState({consoleVisible: true});
  }

  render() {
    const items = [
      //<li onClick={this.showConsole} key="console"><a>
      //  <Icon title="Search" type={IconSearch}/>
      //</a></li>
    ];
    if (this.props.user.isOwner()) {
      items.push(
        <li key="new-note">
          <Link to="/new-note" title="New note"><Icon type={IconPlus} /></Link>
        </li>
      );
    }
    return (
      <ul id="panel" className="panel">
        {items}
      </ul>
    );
  }
}
