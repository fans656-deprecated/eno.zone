import React from 'react';
import Surface from './surface';
import ContentSurface from './content-surface';
import Editor from './core/editor';
import { Mode } from './core/constants';
import './style.css';
import text from './tmp';

export default class Edi extends React.Component {
  constructor(props) {
    super(props);

    this.editor = new Editor(props.content, this.update);
    this.editor.onSave = props.onSave;
    this.editor.onQuit = props.onQuit;
    this.editor.onSaveAndQuit = props.onSaveAndQuit;
    this.editor.onPreview = props.onPreview;

    this.inInputMethod = false;
    this.activeSurface = null;
    this.state = {
      focused: false,
    };
  }

  open(fname, text) {
    this.editor.open(fname, text);
  }

  componentDidMount = () => {
    // for debug
    const editor = this.editor;
    const contentSurface = editor.contentSurface;
    const content = contentSurface.content;
    this.update();
  }

  render() {
    const classes = [this.props.className];
    if (this.state.focused) {
      classes.push('focused');
    }
    if (this.editor.isRecording()) {
      classes.push('recording');
    }
    return (
      <div
        className={['edi', ...classes].join(' ')}
        onFocus={this.onFocus}
        tabIndex="0"
      >
        <ContentSurface
          className="content"
          ref={ref => this.contentSurface = ref}
          input={this.input}
          surface={this.editor.contentSurface}
        />
        <Surface
          className="command"
          input={this.input}
          ref={ref => this.commandSurface = ref}
          surface={this.editor.commandSurface}
        />
        <textarea
          className="input-element"
          ref={ref => this.input = ref}
          onBlur={this.onBlur}
          onChange={this.onChange}
          onCompositionStart={this.onCompositionStart}
          onCompositionEnd={this.onCompositionEnd}
          onKeyDown={this.onKeyDown}
          onPaste={this.onPaste}
        />
      </div>
    );
  }

  update = (callback) => {
    if (!this.editor) {
      return;
    }
    if (this.editor.mode !== this.mode) {
      this.mode = this.editor.mode;
      switch (this.mode) {
        case Mode.Input:
        case Mode.Normal:
        case Mode.Visual:
          this.activateSurface(this.contentSurface);
          break;
        case Mode.Command:
          this.activateSurface(this.commandSurface);
          break;
        default:
          break;
      }
    }
    this.setState({}, () => {
      if (callback) callback();
    });
  }

  onFocus = () => {
    this.input.focus();
    this.setState({focused: true});
    this.activateSurface(this.activeSurface || this.contentSurface);
  }

  onBlur = () => {
    this.setState({focused: false});
    this.activeSurface.deactivate();
  }

  onKeyDown = (ev) => {
    if (this.inInputMethod) {
    } else {
      const state = this._getModifiersState(ev);
      let key = ev.key;
      if (key.length > 1) {
        switch (key) {
          case 'Backspace': key = '<bs>'; break;
          case 'Delete': key = '<del>'; break;
          case 'Enter': key = '<cr>'; break;
          case 'Tab': key = '<tab>'; break;
          default: key = ''; break;
        }
      } else {
        if (state.modified && !state.shiftOnly) {
          const chs = [];
          if (state.ctrl) chs.push('c');
          if (state.alt) chs.push('m');
          chs.push(key);
          key = `<${chs.join('-')}>`;
        }
      }
      if (key.length) {
        if (this.editor.feedKey(key)) {
          ev.preventDefault();
          ev.stopPropagation();
        }
      }
    }
  }

  onPaste = (ev) => {
    for (const item of ev.clipboardData.items) {
      this.editor.paste(item);
    }
  }

  onChange = () => {
    if (this.inInputMethod) {
    } else {
      this._takeInputValue();
      this.input.value = '';
    }
  }

  onCompositionStart = () => {
    this.inInputMethod = true;
  }

  onCompositionEnd = () => {
    this.inInputMethod = false;
    this._takeInputValue();
  }

  activateSurface = (surface) => {
    if (this.activeSurface) {
      this.activeSurface.deactivate();
    }
    surface.activate();
    this.activeSurface = surface;
  }

  _takeInputValue = () => {
    const text = this.input.value;
    this.editor.feedText(text);
    this.input.value = '';
  }

  _getModifiersState = (ev) => {
    const alt = ev.altKey;
    const ctrl = ev.ctrlKey;
    const shift = ev.shiftKey;
    return {
      alt: alt,
      altOnly: alt && !(ctrl || shift),
      ctrl: ctrl,
      ctrlOnly: ctrl && !(alt || shift),
      shift: shift,
      shiftOnly: shift && !(ctrl || alt),
      modified: alt || ctrl || shift,
    };
  }
}
