import React from 'react';
import $ from 'jquery';

export default class Caret extends React.Component {
  render() {
    return (
      <div
        className="caret"
        ref={ref => this.div = $(ref)}
      >
        &nbsp;
      </div>
    );
  }

  show = () => {
    this.div.css({
      display: 'inline-block',
    });
  }

  hide = () => {
    this.div.css({
      display: 'none',
    });
  }

  setBlock = (on) => {
    if (on) {
      this.div.addClass('block');
    } else {
      this.div.removeClass('block');
    }
  }

  setBlink = (on) => {
    if (on) {
      this.div.addClass('blink');
    } else {
      this.div.removeClass('blink');
    }
  }

  setPosition = (x, y) => {
    $(this.div).css({
      left: x,
      top: y,
    });
  }

  setWidth = (width) => {
    $(this.div).css({
      width: width,
    });
  }
}
