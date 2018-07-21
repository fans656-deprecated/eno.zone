import React from 'react';
import $ from 'jquery';

import conf from './conf';
import api from './api';
import './css/Item.css';
import dirImg from './img/dir.png';
import fileImg from './img/file.png';

export default class Item extends React.Component {
  componentDidMount() {
    this.maybeHandleRenamingFocus();
  }

  componentDidUpdate() {
    this.maybeHandleRenamingFocus();
  }

  maybeHandleRenamingFocus(props) {
    const node = this.props.node;
    const renaming = this.props.renaming;
    if (renaming && node.isCurrentItem() && this.renameInput) {
      const renameInput = $(this.renameInput);
      renameInput.focus();
      const name = node.meta.name;
      if (name.indexOf('.') !== -1) {
        renameInput.get(0).setSelectionRange(0, name.lastIndexOf('.'));
      } else {
        renameInput.select();
      }
      this.resizeRenameInput();
    }
  }

  render() {
    const node = this.props.node;
    const meta = node.meta;

    let classes = ['item'];
    if (node.isCurrentItem()) {
      classes.push('active');
    }
    if (node.transfer || node.meta.status === 'init') {
      classes.push('transfer');
    }

    let icon = null;
    if (meta.listable) {
      icon = dirImg;
    } else {
      icon = fileImg;
    }

    let url = null;
    if (!node.transfer) {
      if (meta.listable) {
        url = meta.path;
      } else {
        url = conf.api_origin + meta.path;
      }
    }

    let label = null;
    if (this.props.renaming && node.isCurrentItem()) {
      label = (
        <textarea
          ref={ref => this.renameInput = ref}
          defaultValue={meta.name}
          onClick={this.onRenamingInputClick}
          onKeyDown={this.onRenameInputKeyDown}
          onBlur={this.stopRename}
          style={{
            zIndex: 9999,
            width: '100%',
            padding: 0,
            resize: 'none',
            textAlign: 'center',
          }}
        />
      );
    } else {
      label = (
        <a
          className="name"
          href={url}
          onClick={ev => ev.preventDefault()}
        >
          {meta.name}
        </a>
      );
    }

    return (
      <div
        className={classes.join(' ')}
        onClick={this.onClick}
        onMouseDown={ev => ev.preventDefault()}
      >
        {
          node.transfer && <TransferThumbInfo node={node}/>
        }
        <div className="item-info">
          <img className="thumbnail" src={icon} alt={meta.path} width={64}/>
          {label}
        </div>
      </div>
    );
  }

  getItem = () => {
    return this.props.node;
  }

  onClick = (ev) => {
    this.props.onClick(this.props.node);
    ev.stopPropagation();
  }

  onRenamingInputClick = (ev) => {
    ev.stopPropagation();
  }

  onRenameInputKeyDown = (ev) => {
    switch (ev.key) {
      case 'Enter':
        this.doRename();
        ev.preventDefault();
        ev.stopPropagation();
        break;
      default:
        this.resizeRenameInput();
        break;
    }
  }

  resizeRenameInput = () => {
    const input = this.renameInput;
    $(input).css('height', input.scrollHeight);
  }

  doRename = () => {
    if (this.renameInput) {
      console.log('rename to', this.renameInput.value);
      const newName = this.renameInput.value;
      if (newName.length > 0 && newName.length < 1024) {
        if (newName.indexOf('/') === -1) {
          this.props.node.rename(newName);
        }
      }
    }
    this.stopRename();
  }

  stopRename = () => {
    if (this.props.onStopRename) {
      this.props.onStopRename();
    }
  }

  activate = () => {
    this.setState({active: true});
  }

  deactivate = () => {
    this.setState({active: false});
  }
}

class TransferThumbInfo extends React.Component {
  render() {
    const node = this.props.node;
    const transfer = node.transfer;
    if (transfer.status === 'hashing') {
      const hashPercent = node.transfer.hashProgress.toFixed(0);
      return (
        <div className="transfer-thumb-info">
          <div>
            <span>Hashing... </span>
          </div>
          <div>
            <span>{hashPercent}</span>
            <span>%</span>
          </div>
        </div>
      );
    } else if (transfer.status === 'uploading') {
      const percent = node.transfer.progress.toFixed(2);
      return (
        <div className="transfer-thumb-info">
          <div>
            <span>Uploading... </span>
          </div>
          <div>
            <span>{percent}</span>
            <span>%</span>
          </div>
        </div>
      );
    }
  }
}
