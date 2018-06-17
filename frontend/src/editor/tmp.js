export const lines = `
foo.bar
this is just a test
import _ from 'lodash'
import katex from 'katex'

import './edi.css'
import 'katex/dist/katex.min.css'

import './embeds'

window.katex = katex;

const Mode = {
  selectionAnchorRange: null, selectionAnchorRange: null, selectionAnchorRange: null, selectionAnchorRange
  Selection: 'selection',
  Input: 'input',
  Normal: 'normal',
};

export default class Edi extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      focused: false,
      inIME: false,

      mode: Mode.Input,

      caretNode: null,
      caretOffset: 0, /////////////////// end

      content: [
        [
          {
            type: 'span',
            children: 'test',
          },
          {
            type: 'img',
            attrs: {
              src: 'https://ub:5000/fans656.jpg',
              alt: '',
              width: '32',
            },
          },
          {
            type: 'em',
            children: 'more',
          },
          {
            type: 'formula',
            value: 'f(x) = \\int_{-\\infty}^\\infty g(x)',
          },
          {
            type: 'span',
            children: ' on this later',
          },
        ],
        [
          {
            type: 'span',
            children: 'x',
          },
        ],
      ],
    };
  }

  render() {
    return (
      <div className={this._getEditorClassName()}>
        <div
          className="textarea"
          tabIndex="0"

          ref={ref => this.textarea = ref}

          onFocus={this.onFocus}
          onBlur={this.onBlur}
          onClick={this.onClick}
          onMouseDown={this.onMouseDown}
          onMouseUp={this.onMouseUp}
          onMouseMove={this.onMouseMove}
          onMouseLeave={this.onMouseLeave}
        >
          <div
            className="content"
            ref={ref => this.contentDiv = ref}
          >
            {renderContent(this.state.content)}
          </div>
          <input
            className="input"

            ref={ref => this.input = ref}

            onKeyDown={this.onInputKeyDown}
            onKeyUp={this.onInputKeyUp}

            onChange={this.onInputChange}
            onCompositionStart={this.onCompositionStart}
            onCompositionEnd={this.onCompositionEnd}
          />
        </div>
        <div
          className={'caret ' + this._caretClass()}
          ref={ref => this.caret = ref}
        >&nbsp;</div>
      </div>
    );
  }

  focus = () => {
    this.input.focus();
    const textNode = this.contentDiv.lastChild.lastChild;
    this._setCaretNode(textNode, 999999999);
    this.setState({focused: true});
  }

  blur = () => {
    this.setState({focused: false});
  }

  selectAll = () => {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(this.contentDiv);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  doEscape = () => {
    switch (this.state.mode) {
      case Mode.Input:
        this.switchToNormalMode();
        break;
      default:
        break;
    }
  }

  inInputMode = () => {
    return this.state.mode === Mode.Input;
  }

  inNormalMode = () => {
    return this.state.mode === Mode.Normal;
  }

  switchToNormalMode = async () => {
    await this._update({
      mode: Mode.Normal,
    });
    this._setCaretNode(this.state.caretNode, this.state.caretOffset);
  }

  switchToInputMode = async () => {
    this.input.focus();
    await this._update({
      mode: Mode.Input,
    });
    this._updateCaret();
  }

  onMouseDown = (ev) => {
    const range = document.caretRangeFromPoint(ev.clientX, ev.clientY);
    this._startSelection(range);
  }

  onMouseUp = (ev) => {
    this._stopSelection();
  }

  onMouseMove = (ev) => {
    if (this._isSelecting()) {
      this._doSelection(ev);
    }
  }

  onMouseLeave = () => {
    this._stopSelection();
  }

  onInputKeyDown = (ev) => {
    switch (this.state.mode) {
      case Mode.Input:
        this._handleInputModeKeyDown(ev);
        break;
      case Mode.Normal:
        this._handleNormalModeKeyDown(ev);
        break;
      default:
        break;
    }
  }

  onInputKeyUp = (ev) => {
    switch (this.state.mode) {
      case Mode.Input:
        this._handleInputModeKeyUp(ev);
        break;
      case Mode.Normal:
        this._handleNormalModeKeyUp(ev);
        break;
      default:
        break;
    }
  }

  onFocus = (ev) => {
    this.focus();
  }

  onBlur = (ev) => {
    this.blur();
  }

  onInputChange = (ev) => {
    if (!this.state.inIME) {
      this._takeInputValue();
    }
  }

  onCompositionStart = (ev) => {
    this.setState({inIME: true})
  }

  onCompositionEnd = async (ev) => {
    await this.setState({inIME: false});
    this._takeInputValue();
  }

  onClick = async (ev) => {
    const range = document.caretRangeFromPoint(ev.clientX, ev.clientY);
    const node = range.startContainer;
    switch (node.nodeType) {
      case Node.TEXT_NODE:
        await this._setCaretNode(node, range.startOffset);
        this._updateCaret();
        break;
      case Node.ELEMENT_NODE:
        //const elem = node.childNodes[range.startOffset];
        console.log('todo');
        break;
      default:
        console.log('onClick unknown nodetype', node);
        break;
    }
  }

  //onPaste = (ev) => {
  //  const clipboardData = ev.clipboardData;
  //  const items = clipboardData.items;
  //  for (let i = 0; i < items.length; ++i) {
  //    const item = items[i];
  //    if (item.kind === 'file' && item.type.startswitch('image/')) {
  //      const file = item.getAsFile();
  //      // process file
  //    }
  //  }
  //}

  insertNewLine = () => {
    const caretNode = this.state.caretNode;
    const offset = this.state.caretOffset;
    if (offset === 0) {
      this._prependLine(caretNode);
    } else if (offset === caretNode.nodeValue.length) {
      this._appendLine(caretNode);
    } else {
      this._splitLine(caretNode, offset);
    }
  }

  _handleInputModeKeyDown = (ev) => {
    const {alt, ctrl, shift, modified} = this._getModifiers(ev);
    let preventDefault = false;
    let stopPropagation = false;
    if (!modified) {
      switch (ev.key) {
        case 'Enter':
          this.insertNewLine();
          preventDefault = stopPropagation = true;
          break;
        default:  // input text
          stopPropagation = true;
          break;
      }
    } else if (ctrl) {
      switch (ev.key) {
        case 'k':  // ctrl-k from i-mode to n-mode
          this.doEscape();
          preventDefault = stopPropagation = true;
          break;
        default:
          break;
      }
    }
    if (preventDefault) ev.preventDefault();
    if (stopPropagation) ev.stopPropagation()
  }

  _handleInputModeKeyUp = (ev) => {
    //const {alt, ctrl, shift, modified} = this._getModifiers(ev);
    //let preventDefault = false;
    //let stopPropagation = false;
    //if (!modified) {
    //  switch (ev.key) {
    //    default:
    //      break;
    //  }
    //} else if (ctrl) {
    //  switch (ev.key) {
    //    default:
    //      break;
    //  }
    //}
    //if (preventDefault) ev.preventDefault();
    //if (stopPropagation) ev.stopPropagation()
  }

  _handleNormalModeKeyDown = async (ev) => {
    const {alt, ctrl, shift, modified} = this._getModifiers(ev);
    let preventDefault = false;
    let stopPropagation = false;
    if (!modified) {
      switch (ev.key) {
        case 'i':
          this.switchToInputMode();
          preventDefault = stopPropagation = true;
          break;
        case 'a':
          this.setState({
            caretOffset: this.state.caretOffset + 1
          }, this.switchToInputMode);
          preventDefault = stopPropagation = true;
          break;
        case 'Enter':
          this.insertNewLine();
          preventDefault = stopPropagation = true;
          break;
        case 'Escape':
          console.log('escape');
          break;
        default:  // input text
          preventDefault = stopPropagation = true;
          break;
      }
    } else if (ctrl) {
      switch (ev.key) {
        case 'k':  // ctrl-k do nothing
          preventDefault = stopPropagation = true;
          break;
        default:
          break;
      }
    }
    if (preventDefault) ev.preventDefault();
    if (stopPropagation) ev.stopPropagation()
  }

  _handleNormalModeKeyUp = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
  }

  _setCaretNode = async (node, offset) => {
    if (!node.nodeValue) {
      window.t = node;
      console.log(node);
      return;
    }
    let offsetMax = node.nodeValue.length;
    if (this.inNormalMode() && offsetMax) {
      --offsetMax;
    }
    offset = Math.max(0, Math.min(offset, offsetMax));
    if (node.nodeType === Node.TEXT_NODE) {
      if ($(node.parentNode).hasClass('dummy')) {
        offset = 0;
      }
      await this._update({
        caretNode: node,
        caretOffset: offset,
      });
      this._updateCaret();
    } else {
      console.log('todo');
    }
  }

  _takeInputValue = async () => {
    const caretNode = this.state.caretNode;
    let inputValue = this.input.value;
    let offset = this.state.caretOffset;

    if (caretNode.nodeType === Node.TEXT_NODE) {
      const parentNode = $(caretNode.parentNode);
      if (parentNode.hasClass('dummy')) {
        caretNode.deleteData(0, 1);
        parentNode.removeClass('dummy');
      }
      caretNode.insertData(offset, inputValue);
      offset += inputValue.length;
      this.input.value = '';

      await this._update({caretOffset: offset});
      this._updateCaret();
    } else {
      console.log('todo');
    }
  }

  _updateCaret = () => {
    const caretNode = this.state.caretNode;
    const offset = this.state.caretOffset;

    const range = new Range();
    range.setStart(caretNode, offset);
    range.setEnd(caretNode, offset);
    const {left, top} = range.getClientRects()[0];

    $(this.input).css({left: left, top: top});
    $(this.caret).css({left: left, top: top});
  }

  _getModifiers = (ev) => {
    const alt = ev.getModifierState('Alt');
    const ctrl = ev.getModifierState('Control');
    const shift = ev.getModifierState('Shift');
    return {
      alt: alt,
      ctrl: ctrl,
      shift: shift,
      modified: alt || ctrl || shift,
    };
  }

  _update = async (delta) => {
    return new Promise((resolve) => {
      this.setState(delta, resolve);
    });
  }

  _shouldShowCaret = () => {
    return _.includes([Mode.Input, Mode.Normal], this.state.mode);
  }

  _caretClass = () => {
    let visible = (
      this.state.focused
      && !this._isSelecting()
      && !this._hasSelection()
    );
    const ret = [];
    if (visible) {
      switch (this.state.mode) {
        case Mode.Normal:
          ret.push('block', 'visible');
          break;
        case Mode.Input:
          ret.push('line', 'visible');
          break;
        default:
          break;
      }
    }
    return ret.join(' ');
  }

  _getEditorClassName = () => {
    const ret = [
      'editor',
      \`{this.state.mode}-mode\`,
    ];
    if (this.state.focused) ret.push('focused');
    return ret.join(' ');
  }

  _isSelecting = () => {
    return this.state.selectionAnchorRange;
  }

  _hasSelection = () => {
    return !window.getSelection().isCollapsed;
  }

  _startSelection = (range) => {
    this._update({selectionAnchorRange: range});
  }

  _stopSelection = () => {
    this._update({selectionAnchorRange: null});
  }

  _doSelection = (ev) => {
    const anchorRange = this.state.selectionAnchorRange;
    const anchorNode = anchorRange.startContainer;
    const anchorOffset = anchorRange.startOffset;

    const pointRange = document.caretRangeFromPoint(ev.clientX, ev.clientY);
    const pointNode = pointRange.startContainer;
    const pointOffset = pointRange.startOffset;

    if (pointNode.nodeType === Node.TEXT_NODE) {
      const selRange = new Range();
      if (pointRange.comparePoint(anchorNode, anchorOffset) > 0) {
        selRange.setStart(pointNode, pointOffset);
        selRange.setEnd(anchorNode, anchorOffset);
      } else {
        selRange.setStart(anchorNode, anchorOffset);
        selRange.setEnd(pointNode, pointOffset);
      }

      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(selRange);
    }
  }

  _createNewLine = () => {
    const placeholder = this._hasSelection() ? '' : ' ';
    const span = $(\`<span class="dummy">{placeholder}</span>\`);
    return {
      span: span,
      br: $('<br>'),
    };
  }

  _prependLine = (caretNode) => {
    const {br, span} = this._createNewLine();
    $(caretNode.parentNode).before(br);
    br.before(span);
    this._updateCaret();
  }

  _appendLine = (caretNode) => {
    const {br, span} = this._createNewLine();
    $(caretNode.parentNode).after(br);
    br.after(span);
    this._setCaretNode(span.get(0).firstChild, 0);
  }

  _splitLine = (caretNode, offset) => {
    console.log('_splitLine', {
      caretNode: caretNode,
      offset: offset,
    });
    const br = $('<br>');
    const newCaretNode = caretNode.splitText(offset);
    $(caretNode.parentNode).after(br);
    this._setCaretNode(newCaretNode, 0);
  }
};

function renderContent(content) {
  const components = [];
  content.forEach((line, i) => {
    if (components.length) {
      components.push(<br key={'br-' + i}/>);
    }
    components.push(renderLine(line, i));
  });
  return components;
}

function renderLine(line, key) {
  return (
    <span className="line" key={key}>
      {line.map((elem, i) => renderElem(elem, i))}
    </span>
  );
}

function renderElem(elem, key) {
  switch (elem.type) {
    case 'formula':
      const html = katex.renderToString(elem.value);
      return <span dangerouslySetInnerHTML={{__html: html}} key={key}/>
    default:
      const props = _.extend(elem.attrs, {key: key});
      return React.createElement(elem.type, props, elem.children);
  }
}

//function getTextNode
`.trim().split('\n');
