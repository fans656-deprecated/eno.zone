import React from 'react';
import { Icon } from 'react-icons-kit';
import { threeDCube } from 'react-icons-kit/metrize/'

import { Display } from '../constants';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.env = props.env;
    this.note = props.note;
  }

  render() {
    let comp;
    switch (this.env.display) {
      case Display.InNote:
        comp = this.renderInNote();
        break;
      case Display.InList:
        comp = this.renderInList();
        break;
      case Display.Single:
        comp = this.renderSingle();
        break;
      default:
        break;
    }
    if (comp == null) comp = this.renderDefault();
    return comp;
  }

  renderInNote() {
    return this.renderDefault();
  }

  renderInList() {
    return this.renderDefault();
  }

  renderSingle() {
    return this.renderDefault();
  }

  renderDefault() {
    return (
      <a
        href={this.note.href()}
        style={{
          color: 'steelblue',
          display: 'inline-flex',
          alignItems: 'center',
          fontSize: '1.2em',
        }}
      >
        <Icon icon={threeDCube} size={26}/>
        <span style={{marginLeft: '.2em'}}>
          {this.note.type()}
        </span>
      </a>
    );
  }
}
