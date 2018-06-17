import React from 'react'
import $ from 'jquery'
import _ from 'lodash'
import clone from 'clone'

import './edi.css'

import vimrc from './vimrc'
import History from './history'
import {
  Mode, NormalOperation, NormalOperand,
} from './constants'
import {
  Editor, Content, Lines, Caret, Input, CommandBar,
} from './components'
import {
  insertTextAt, searchAll, isDigit, getWord,
} from './utils'

import { lines } from './tmp'

export default class Edi extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      _lines: lines.slice(0, 30),
      _row: 0,
      _col: 0,
      keymaps: vimrc.install(this),
      focused: false,
      mode: Mode.Input,
      inIME: false,  // for e.g. input Chinese
      selectionAnchorRange: null,  // for mouse selection
    };
    this.history = new History();

    // for input mode history
    this.caretWhenEnterInputMode = null;
    this.takenInputValues = [];  
    this.inputModeChanges = [];

    this.resetNormalCmd();
    window.e = this;
  }

  componentDidMount = () => {
    this.caretOwner = this.linesDiv;
    this._updateCaret();
  }

  componentDidUpdate = () => {
    this._updateCaret();
  }

  render() {
    return (
      <Editor editor={this}>
        <Content editor={this}>
          <Lines editor={this}/>
          <Caret editor={this}/>
          <Input editor={this}/>
          <CommandBar editor={this}/>
        </Content>
      </Editor>
    );
  }

  row = () => {
    return this.state._row;
  }

  col = () => {
    return this.state._col;
  }

  caret = (row, col) => {
    row = row == null ? this.row() : row;
    col = col == null ? this.col() : col;
    return [row, col];
  }

  savedRow = () => {
    return this.savedRowCol.row;
  }

  savedCol = () => {
    return this.savedRowCol.col;
  }

  lastRow = () => {
    return this.lines().length - 1;
  }

  nonspaceCol = (row) => {
    row = row == null ? this.row() : row;
    return this.line(row).search(/\S|$/);
  }

  endCol = (row) => {
    return Math.max(0, this.line(row).length - 1);
  }

  line = (row) => {
    row = row == null ? this.row() : row;
    return this.lines()[row];
  }

  lines = () => {
    return this.state._lines;
  }

  textInLine = (row, beg, end) => {
    const line = this.line(row);
    return line.substring(beg, end);
  }

  word = (row, col) => {
    row = row == null ? this.row() : row;
    col = col == null ? this.col() : col;
    const word = getWord(this.line(row), col);
    word.row = row;
    return word;
  }

  linesAfter = (row, col) => {
    row = row == null ? 0 : row;
    col = col == null ? 0 : col;
    const partial = this.lineText(row, col);
    return [partial, ...this.lines().slice(row + 1)];
  }

  linesBefore = (row, col) => {
    col = col == null ? 0 : col;
    const partial = this.lineTextBefore(row, col)
    return [...this.lines().slice(0, row), partial];
  }

  lineText = (row, col) => {
    row = row == null ? 0 : row;
    col = col == null ? 0 : col;
    const line = this.line(row);
    return line.substring(col);
  }

  lineTextBefore = (row, col) => {
    row = row == null ? 0 : row;
    col = col == null ? 0 : col;
    const line = this.line(row);
    return line.substring(0, col);
  }

  mode = () => {
    return this.state.mode;
  }

  inInputMode = () => {
    return this.state.mode === Mode.Input;
  }

  inNormalMode = () => {
    return this.state.mode === Mode.Normal;
  }

  inCommandMode = () => {
    return this.state.mode === Mode.Command;
  }

  caretAtLineBeg = () => {
    return this.col() === 0;
  }

  caretAtLineEnd = () => {
    return this.col() === this.line().length;
  }

  setCaret = async (row, col) => {
    if (col == null) {
      this._setHintedCol(this.col());
    } else if (col !== this.col()) {
      this._setHintedCol(col, true);
    }
    row = row == null ? this.row() : row;
    row = Math.max(0, Math.min(row, this.lines().length - 1));
    col = col == null ? this._getHintedCol() : col;
    col = Math.max(0, Math.min(col, this._getColMax(row)));
    if (!this.inInputMode() && col === this.line(row).length) {
      --col;
    }
    if (this._isDummyLine(row)) {
      col = 0;
    }
    await this._setCaret(row, col);
    this._updateCaret(row, col);
  }

  selectAll = () => {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(this.linesDiv);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  onPaste = (ev) => {
    const clipboardData = ev.clipboardData;
    const items = clipboardData.items;
    for (let i = 0; i < items.length; ++i) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        // process file
        console.log(file);
        this.insertText(this.row(), this.col(), '[screenshot.png]');
      }
    }
  }

  escape = async () => {
    switch (this.state.mode) {
      case Mode.Input:
        this._prepareNewInputModeChange();
        await this._pushInputModeHistory();
        await this.switchToNormalMode();
        break;
      case Mode.Command:
        await this.switchToNormalMode();
        break;
      default:
        break;
    }
  }

  upload = () => {
    console.log('upload');
    this.props.onUpload();
  }

  preview = () => {
    console.log('preview');
  }

  _pushInputModeHistory = async () => {
    const inputModeChanges = clone(this.inputModeChanges);
    this.inputModeChanges = [];
    await this.history.push({
      redo: async () => {
        for (const {row, col, text} of inputModeChanges) {
          await this.insertText(row, col, text);
        };
      },
      undo: async () => {
        let changes = clone(inputModeChanges);
        changes.reverse();
        for (const {row, col, text} of changes) {
          const lines = text.split('\n');
          const endRow = row + lines.length;
          const endCol = col + lines[lines.length - 1].length;
          await this.deleteText(row, col, endRow, endCol);
        };
      },
      executeRedo: false,
    });
  }


  gotoFirstRow = async () => {
    await this.gotoRow(0);
  }

  gotoLastRow = async () => {
    await this.gotoRow(this.lines().length - 1);
  }

  gotoRow = async (row) => {
    if (row == null) {
      row = this.hasNormalCmdCount() ? this.normalCmdCount() - 1 : this.lastRow();
    }
    await this.setCaret(row);
  }

  search = (pattern, row, col) => {
    console.log('search', '|' + pattern + '|');
    this.clearHighlights();
    if (pattern.length === 0) {
      return;
    }
    row = row == null ? this.savedRow() : row;
    col = col == null ? this.savedCol() : col;
    const aftMatches = searchAll(pattern, this.linesAfter(row, col), row);
    const preMatches = searchAll(pattern, this.linesBefore(row, col), 0);
    const matches = aftMatches.concat(preMatches);
    for (const match of matches) {
      this.highlight(match);
    }
  }

  rsearch = (pattern, row, col) => {
  }

  insertText = async (row, col, text) => {
    const lines = text.split('\n');
    const firstLineText = lines.shift();
    this._insertTextInLine(row, col, firstLineText);
    if (lines.length) {
      this.lines().splice(row + 1, 0, ...lines);
      const lastLine = lines[lines.length - 1];
      await this._setCaret(row + lines.length, lastLine.length - 1);
    } else {
      await this._setCaret(row, col + firstLineText.length);
    }
  }

  insertTextInLine = async (row, col, text) => {
    this._insertTextInLine(row, col, text);
    await this._setCaret(row, col);
  }

  doDeleteLine = async () => {
    const row = this.row();
    const line = this.line();
    await this.history.push({
      redo: async () => {
        await this.deleteLine(row);
      },
      undo: async () => {
        await this.insertLine(row, line);
      }
    });
  }

  doChangeLine = async () => {
    // TODO: undo
    const row = this.row();
    await this.changeLine(row);
  }

  deleteLine = async (row) => {
    this.lines().splice(row, 1);
    await this._setCaret(row, this.col());
  }

  insertLine = async (row, line) => {
    this.lines().splice(row, 0, line);
    await this._setCaret(row, this._getHintedCol());
  }

  changeLine = async (row) => {
    this.lines()[row] = '';
    await this._setCaret(row, 0);
    await this.switchToInputMode();
  }

  _insertTextInLine = (row, col, text) => {
    let line = this.line(row);
    line = line.substring(0, col) + text + line.substring(col);
    this.lines()[row] = line;
  }

  deleteChar = async (row, col) => {
    row = row == null ? this.row() : row;
    col = col == null ? this.col() : col;
    const begCol = col;
    const endCol = begCol + this.normalCmdCount();
    await this.doDeleteTextInLine(row, begCol, endCol);
  }

  doDeleteTextInLine = async (row, begCol, endCol) => {
    const text = this.textInLine(row, begCol, endCol);
    await this.history.push({
      undo: async () => {
        this.insertTextInLine(row, begCol, text);
      },
      redo: async () => {
        await this.deleteTextInLine(row, begCol, endCol);
      }
    });
  }

  deleteText = async (begRow, begCol, endRow, endCol) => {
    if (begRow + 1 === endRow) {
      await this.deleteTextInLine(begRow, begCol, endCol);
    } else {
      const firstLine = this.line(begRow);
      this._deleteTextInLine(begRow, begCol, firstLine.length);
      this.lines().splice(begRow + 1, endRow - begRow - 1);
      await this._setCaret(begRow, begCol - 1);
    }
  }

  deleteTextInLine = async (row, begCol, endCol) => {
    this._deleteTextInLine(row, begCol, endCol);
    await this._setCaret(row, Math.min(begCol, this.line(row).length - 1));
  }

  _deleteTextInLine = async (row, begCol, endCol) => {
    let line = this.line(row);
    line = line.substring(0, begCol) + line.substring(endCol);
    this.lines()[row] = line;
  }

  undo = async () => {
    await this.history.undo();
  }

  redo = async () => {
    await this.history.redo();
  }

  highlight = (match) => {
    const {row, colBeg, colEnd} = match;
    const lineNode = this._getLineNode(row, this.linesDiv);
    const text = lineNode.text();
    const pre = text.substring(0, colBeg);
    const mid = text.substring(colBeg, colEnd);
    const aft = text.substring(colEnd);
    lineNode.html(
      (pre && `<span>${pre}</span>`)
      + `<span class="highlight">${mid}</span>`
      + (aft && `<span>${aft}</span>`)
    );
  }

  clearHighlights = () => {
    const node = $('.highlight').parent();
    node.text((i, text) => {
      return text;
    });
  }

  feedNormalCommand = (key) => {
    if (this.normalCmd.type) {
      // e.g. d[d]
      return this._handleNormalOperand(key);
    } else {
      // e.g. [d]d [d]iw
      return this._changeNormalCmdType(key);
    }
  }

  resetNormalCmd = () => {
    this.normalCmd = {
      digits: [],
    };
    return true;
  }

  normalCmdCount = (keep) => {
    const digits = this.normalCmd.digits;
    let ret;
    if (digits.length) {
      ret = parseInt(digits.join(''), 10);
    } else {
      ret = 1;
    }
    if (!keep) {
      this.normalCmd.digits = [];
    }
    return ret;
  }

  hasNormalCmdCount = () => {
    return this.normalCmd.digits.length > 0;
  }

  _changeNormalCmdType = (key) => {
    switch (key) {
      case 'd':
        return this._changeNormalOperationType(NormalOperation.Deletion);
      case 'c':
        return this._changeNormalOperationType(NormalOperation.Change);
      case 'y':
        return this._changeNormalOperationType(NormalOperation.Yank);
      case 'g':
        return this._changeNormalOperationType(NormalOperation.Goto);
      default:
        if (isDigit(key)) {
          this.normalCmd.digits.push(key);
        } else {
          this.resetNormalCmd();
        }
        return true;
    }
  }

  _changeNormalOperationType = (type) => {
    const normalCmd = this.normalCmd;
    normalCmd.type = type;
    normalCmd.op = {};
    return null;
  }

  _handleNormalOperand = (key) => {
    const type = this.normalCmd.type;
    const op = this.normalCmd.op;
    switch (key) {
      case 'w':
        return this._handleWordOperation(type, op);
      case '(':
        if (op.type) {
          console.log(`============= ${this.normalCmd.type} ${op.type} ()`);
        }
        return this.resetNormalCmd();
      case '[':
        if (op.type) {
          console.log(`============= ${this.normalCmd.type} ${op.type} []`);
        }
        return this.resetNormalCmd();
      case '{':
        if (op.type) {
          console.log(`============= ${this.normalCmd.type} ${op.type} {}`);
        }
        return this.resetNormalCmd();
      case 'd':  // dd
        if (type === NormalOperation.Deletion) {
          this.doDeleteLine();
        }
        return this.resetNormalCmd()
      case 'c':  // cc
        if (type === NormalOperation.Change) {
          this.doChangeLine();
        }
        return this.resetNormalCmd()
      case 'y':  // yy
        if (type === NormalOperation.Yank) {
          console.log(`============= ${this.normalCmd.type} line`);
        }
        return this.resetNormalCmd()
      case 'g':  // gg
        if (type === NormalOperation.Goto) {
          this.gotoRow(0);
        }
        return this.resetNormalCmd()
      case 'G':
        if (type === NormalOperation.Goto) {
          this.gotoRow(this.lines().length - 1);
        }
        return this.resetNormalCmd()
      default:
        return this._changeNormalOperandType(key);
    }
  }

  _handleWordOperation = (type, op) => {
    console.log(`============= ${type} ${op.type} word`);
    const word = this.word();
    const row = this.row();
    switch (type) {
      case NormalOperation.Deletion:
        switch (op.type) {
          case NormalOperand.Inside:
            this.doDeleteTextInLine(row, word.beg, word.end);
            break;
          case NormalOperand.Around:
            this.doDeleteTextInLine(row, word.spaceBeg, word.spaceEnd);
            break;
          default:
            this.doDeleteTextInLine(row, word.col, word.spaceEnd);
            break;
        }
        break;
      default:
        break;
    }
    return this.resetNormalCmd()
  }

  _changeNormalOperandType = (key) => {
    const op = this.normalCmd.op;
    switch (key) {
      case 'i':
        op.type = NormalOperand.Inside;
        return null;
      case 'a':
        op.type = NormalOperand.Around;
        return null;
      default:
        this.resetNormalCmd();
        return true;
    }
  }

  noop = () => {
  }

  caretLeft = async () => {
    await this.setCaret(null, this.col() - this.normalCmdCount());
  }

  caretRight = async () => {
    await this.setCaret(null, this.col() + this.normalCmdCount());
  }

  caretUp = async () => {
    await this.setCaret(this.row() - this.normalCmdCount());
  }

  caretDown = async () => {
    await this.setCaret(this.row() + this.normalCmdCount());
  }

  caretHead = () => {
    this.setCaret(null, this.nonspaceCol());
    this.contentDiv.scrollLeft = 0;
  }

  caretTail = () => {
    this.setCaret(null, this.endCol());
  }

  wordLeft = async () => {
    let row = this.row();
    let col = this.col();
    let word;
    const count = this.normalCmdCount();
    for (let i = 0; i < count; ++i) {
      word = this.word(row, col);
      const toPrevWord = word.beg === word.col;
      if (toPrevWord) {
        const toPrevLine = word.spaceBeg === 0;
        if (toPrevLine) {
          if (word.row) {
            const prevRow = word.row - 1;
            const line = this.line(prevRow).trimRight();
            word = this.word(prevRow, line.length - 1);
          } else {
            break;
          }
        } else {
          word = this.word(word.row, word.spaceBeg - 1);
        }
      }
      row = word.row;
      col = word.beg;
    }
    await this.setCaret(word.row, word.beg);
  }

  wordRight = async () => {
    let row = this.row();
    let col = this.col();
    let word;
    const count = this.normalCmdCount();
    for (let i = 0; i < count; ++i) {
      word = this.word(row, col);
      const line = this.line(row);
      const toNextLine = word.spaceEnd === line.length;
      if (toNextLine) {
        if (word.row < this.lines().length) {
          const nextRow = word.row + 1;
          const line = this.line(nextRow);
          word = this.word(nextRow, line.length - line.trimLeft().length);
        } else {
          return;
        }
      } else {
        word = this.word(word.row, word.spaceEnd);
      }
      row = word.row;
      col = word.beg;
    }
    await this.setCaret(word.row, word.beg);
  }

  wordTail = async () => {
    let row = this.row();
    let col = this.col();
    let word;
    const count = this.normalCmdCount();
    for (let i = 0; i < count; ++i) {
      word = this.word(row, col);
      const line = this.line(row);
      if (word.col >= word.end - 1) {
        const toNextLine = word.spaceEnd === line.length;
        if (toNextLine) {
          if (word.row < this.lines().length) {
            const nextRow = word.row + 1;
            const line = this.line(nextRow);
            word = this.word(nextRow, line.length - line.trimLeft().length);
          } else {
            return;
          }
        } else {
          word = this.word(word.row, word.spaceEnd);
        }
      }
      row = word.row;
      col = word.end - 1;
    }
    await this.setCaret(word.row, word.end - 1);
  }

  press = (key) => {
    const keymap = this.state.keymaps[this.state.mode];
    if (keymap) {
      const handled = keymap.feed(key);
      if (handled === true || handled == null) {
        return true;
      }
    }
    return false;
  }

  insertToInputMode = async () => {
    this.switchToInputMode();
  }

  insertHeadToInputMode = () => {
    this.switchToInputMode(async () => {
      await this._setCaret(this.row(), 0);
    });
  }

  appendToInputMode = () => {
    this.switchToInputMode(() => {
      this.setCaret(null, this.col() + 1);
    });
  }

  appendTailToInputMode = () => {
    this.switchToInputMode(() => {
      this.setCaret(null, this.line().length);
    });
  }

  appendLineToInputMode = () => {
    this.switchToInputMode(() => {
      const row = this.row();
      this._insertLine(row + 1);
      this._setCaret(row + 1, 0);
    });
  }
  
  prependLineToInputMode = () => {
    this.switchToInputMode(() => {
      const row = this.row();
      this._insertLine(row);
      this._setCaret(row, 0);
    });
  }

  pressEnter = async (row, col) => {
    this.takenInputValues.push('\n');
    [row, col] = this.caret(row, col);
    if (col === 0) {
      this._insertLine(row);
      await this._setCaret(row + 1, 0);
    } else if (col === this.line().length) {
      this._insertLine(row + 1);
      await this._setCaret(row + 1, 0);
    } else {
      this._splitLine(row, col);
      await this._setCaret(row + 1, 0);
    }
  }

  pressBackspace = async () => {
    if (this.takenInputValues.length) {
      const text = this.takenInputValues.pop();
      if (text.length > 1) {
        this.takenInputValues.push(text.substring(0, text.length - 1));
      }
    }
    const [row, col] = this.caret();
    if (row === 0 && col === 0) {
      return;
    } else if (col === 0) {
      const line = this.line(row - 1);
      this.joinLines(row - 1, row);
      await this._setCaret(row - 1, line.length);
    } else {
      await this._deleteTextInLine(row, col - 1, col);
      await this._setCaret(row, col - 1);
    }
  }

  pressDel = async () => {
    // TODO: del history
    const [row, col] = this.caret();
    let line = this.line();
    if (row === this.lines().length - 1 && col === line.length) {
      return;
    } else if (col === line.length) {
      const line = this.line(row + 1);
      this.joinLines(row, row + 1);
      await this._setCaret(row, col);
    } else {
      await this._deleteTextInLine(row, col, col + 1);
      await this._setCaret(row, col);
    }
  }

  joinLines = (...rows) => {
    const row = rows[0];
    const line = rows.map(row => this.line(row)).join('');
    this.lines().splice(row, rows.length, line);
  }

  _splitLine = (row, col) => {
    const line = this.line(row);
    const pre = line.substring(0, col);
    const aft = line.substring(col);
    this.lines().splice(row, 1, pre, aft);
  }

  _insertLine = (row) => {
    this.lines().splice(row, 0, '');
  }

  switchToNormalMode = async () => {
    const prevMode = this.state.mode;
    await this._update({
      mode: Mode.Normal,
    });
    if (prevMode === Mode.Input && !this.caretAtLineBeg()) {
      await this.setCaret(null, this.col() - 1);
    }
  }

  switchToInputMode = async (callback) => {
    await this._update({
      mode: Mode.Input,
    });
    if (callback) {
      await callback();
    }
    this._prepareNewInputModeChange();
    this.input.focus();
  }

  searchToCommandMode = async () => {
    await this.switchToCommandMode('/');
  }

  rsearchToCommandMode = async () => {
    await this.switchToCommandMode('?');
  }

  switchToCommandMode = async (text) => {
    text = text == null ? ':' : text;
    $('.command-text').text(text);
    this.savedRowCol = {
      row: this.row(),
      col: this.col(),
    };
    await this._update({_row: 0, _col: text.length});
    this.caretOwner = this.commandDiv;
    await this._update({
      mode: Mode.Command,
    });
    this.contentDiv.scrollLeft = 0;
  }

  escapeFromCommandMode = async () => {
    this.caretOwner = this.contentDiv;
    await this._update({
      _row: this.savedRowCol.row,
      _col: this.savedRowCol.col,
    });
    await this.escape();
  }

  executeCommand = async (cmd) => {
    cmd = cmd || this._getCurrentCommand();
    switch (cmd[0]) {
      case '/':
        this.search(cmd.substring(1), this.savedRow(), this.savedCol());
        break;
      case '?':
        this.rsearch(cmd.substring(1), this.savedRow(), this.savedCol());
        break;
      default:
        break;
    }
    await this.escapeFromCommandMode();
  }

  focus = async () => {
    await this.setState({focused: true});
    setTimeout(() => this.input.focus(), 100);
  }

  blur = () => {
    this.setState({focused: false});
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

  onDragStart = (ev) => {
    ev.preventDefault();
  }

  onKeyDown = (ev) => {
    const modifiers = this._getModifiers(ev);
    let key;
    if (!modifiers.modified || modifiers.shiftOnly) {
      switch (ev.key) {
        case 'Shift':
          return;
        case 'Enter':
          key = '<cr>';
          break;
        case 'Backspace':
          key = '<bs>';
          break;
        case 'Delete':
          key = '<del>';
          break;
        default:  // input text
          key = ev.key;
      }
    } else if (modifiers.ctrlOnly) {
      key = `<c-${ev.key}>`;
    } else if (modifiers.altOnly) {
      key = `<m-${ev.key}>`;
    }
    const handled = this.press(key);
    if (handled) {
      ev.preventDefault();
      ev.stopPropagation()
    }
  }

  onFocus = (ev) => {
    this.focus();
  }

  onBlur = (ev) => {
    this.blur();
  }

  onInputChange = (ev) => {
    if (this.inInputMode() || this.inCommandMode()) {
      if (!this.state.inIME) {
        this._takeInputValue();
      }
    }
    let clear = false;
    switch (this.state.mode) {
      case Mode.Normal:
        clear = true;
        break;
      default:
        break;
    }
    if (clear) {
      this.input.value = '';
    }
  }

  onCompositionStart = (ev) => {
    this.setState({inIME: true})
  }

  onCompositionEnd = async (ev) => {
    await this.setState({inIME: false});
    this._takeInputValue();
  }

  onCommandChange = (cmd) => {
    console.log('onCommandChange', cmd);
    switch (cmd[0]) {
      case '/':
        this.search(cmd.substring(1), this.savedRow(), this.savedCol());
        break;
      case '?':
        this.rsearch(cmd.substring(1), this.savedRow(), this.savedCol());
        break;
      default:
        break;
    }
  }

  onClick = async (ev) => {
    const {clientX, clientY} = ev;
    if (this.inCommandMode()) {
      await this.escapeFromCommandMode();
    }
    const range = document.caretRangeFromPoint(clientX, clientY);
    const node = range.startContainer;
    if ($(node.parentNode).hasClass('caret')) {
      return;  // we only set caret when click on text
    }
    let lineNode = $(node.parentNode);
    while (!lineNode.hasClass('line')) {
      lineNode = lineNode.parent();
    }
    const row = Math.floor(lineNode.prevAll().length / 2);
    const offset = range.startOffset;
    let col;
    if (lineNode.contents().length > 1) {
      const preSiblings = $(node.parentNode).prevAll().toArray();
      const preTextLength = _.sum(preSiblings.map(n => $(n).text().length));
      col = preTextLength + offset;
    } else {
      col = offset;
    }
    await this.setCaret(row, col);

    // for input mode history
    if (this.inInputMode()) {
      this._prepareNewInputModeChange();
    }
  }

  _prepareNewInputModeChange = () => {
    if (this.takenInputValues.length) {
      const change = {
        row: this.caretWhenEnterInputMode.row,
        col: this.caretWhenEnterInputMode.col,
        text: this.takenInputValues.join(''),
      };
      this.inputModeChanges.push(change);
    }
    this.caretWhenEnterInputMode = {
      row: this.row(),
      col: this.col(),
    };
    this.takenInputValues = [];
  }

  _takeInputValue = async () => {
    let text = this.input.value;
    if (text.length === 0) {
      // IME cancel
      return;
    }

    const row = this.row();
    let col = this.col();

    if (this.inInputMode()) {
      const lines = this.lines();
      const line = this.line();
      lines[row] = insertTextAt(line, text, col);
      this.takenInputValues.push(text);
    }

    const lineNode = this._getLineNode();
    if (lineNode.hasClass('dummy')) {
      lineNode.empty();
      lineNode.removeClass('dummy');
    }
    lineNode.text(insertTextAt(lineNode.text(), text, col));
    col += text.length;
    this.input.value = '';
    await this._setCaret(row, col);
    if (this.inCommandMode()) {
      this.onCommandChange(this._getCurrentCommand());
    }
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
      altOnly: alt && !(ctrl || shift),
      ctrlOnly: ctrl && !(alt || shift),
      shiftOnly: shift && !(alt || ctrl),
    };
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
        case Mode.Command:
          ret.push('block', 'visible', 'blink');
          break;
        case Mode.Input:
          ret.push('line', 'visible', 'blink');
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
      `${this.state.mode}-mode`,
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

  _startSelection = async (range) => {
    await this._update({selectionAnchorRange: range});
  }

  _stopSelection = async () => {
    await this._update({selectionAnchorRange: null});
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

  _updateCaret = (row, col) => {
    const range = this._getCaretRange(row, col);
    const rangeRect = range.getClientRects()[0];
    const contentDiv = this.contentDiv;
    const contentDivRect= contentDiv.getClientRects()[0];
    const left = rangeRect.left - contentDivRect.left + contentDiv.scrollLeft;
    const top = rangeRect.top - contentDivRect.top + contentDiv.scrollTop;
    $(this.input).css({left: left, top: top});
    $(this.caretDiv).css({left: left, top: top});

    this.caretDiv.scrollIntoViewIfNeeded(false);
  }

  _update = async (delta) => {
    return new Promise((resolve) => {
      this.setState(delta, resolve);
    });
  }

  _getCaretRange = (row, col) => {
    row = row == null ? this.row() : row;
    col = col == null ? this.col() : col;
    const range = new Range();
    const lineNode = this._getLineNode(row).get(0);
    let textNode = null;
    let beg = 0;
    let offset;
    for (let child of lineNode.childNodes) {
      const text = $(child).text();
      const end = beg + text.length;
      if (beg <= col && col <= end) {
        if (child.nodeType !== Node.TEXT_NODE) {
          child = child.firstChild;
        }
        textNode = child;
        offset = col - beg;
        break;
      } else {
        beg = end;
      }
    }
    range.setStart(textNode, offset);
    range.setEnd(textNode, offset);
    return range;
  }

  _getLineNode = (row, caretOwner) => {
    row = row == null ? this.row() : row;
    if (caretOwner == null) {
      caretOwner = this.caretOwner;
    }
    return $(caretOwner).find(`span.line:nth-child(${row * 2 + 1})`);
  }

  _isDummyLine = (row) => {
    return this._getLineNode(row).hasClass('dummy');
  }

  _getColMax = (row) => {
    let col = this.line(row).length;
    if (!this.inInputMode()) {
      --col;
    }
    return col;
  }

  _setCaret = async (row, col) => {
    row = Math.max(0, Math.min(row, this.lines().length));
    col = Math.max(0, Math.min(col, this.line(row).length));
    if (!this.inInputMode() && col && col === this.line(row).length) {
      --col;
    }
    await this._update({_row: row, _col: col});
  }

  _getCurrentCommand = () => {
    return $('.command').text();
  }

  _setHintedCol = (col, force) => {
    if (this._hintedCol == null) {
      this._hintedCol = col;
    } else if (force) {
      this._hintedCol = col;
    } else {
      this._hintedCol = Math.max(col, this._hintedCol);
    }
  }

  _getHintedCol = () => {
    return this._hintedCol == null ? this.col() : this._hintedCol;
  }
};
