import Content from './content';
import Normal from './normal';
import Caret from './caret';
import History from './history';
import InputChange from './inputchange';
import { Mode, Feed } from './constants';
import { loop } from './utils';

export default class Surface {
  constructor(editor, props) {
    props = props || {};
    this.editor = editor;
    this.content = props.content || new Content();
    this.mode = props.mode || Mode.Input;
    this.normal = new Normal(this);
    this.caret = new Caret(this, 0, 0);
    this.history = new History();
    this.inputChange = new InputChange(this);
    this.active = false;
  }

  map = (key, func) => {
    this.normal.keymap.add(key, func);
  }

  activate = () => {
    this.active = true;
  }

  deactivate = () => {
    this.active = false;
  }

  rowcol = () => {
    const {row, col} = this.caret;
    return [row, col];
  }

  setText = (text) => {
    this.content.setText(text);
  }

  doDeleteText = (firstRow, begCol, lastRow, endCol) => {
    const deletedText = this.content.text(firstRow, begCol, lastRow, endCol);
    this.history.push({
      redo: () => {
        this.content.deleteText(firstRow, begCol, lastRow, endCol);
        this.caret.setRowCol(firstRow, begCol);
      },
      undo: () => {
        this.content.insertText(firstRow, begCol, deletedText);
        this.caret.setRowCol(firstRow, begCol);
      }
    });
  }

  isIn = (mode) => this.mode === mode

  switchToInputMode = (callback) => {
    this.mode = Mode.Input;
    if (callback) callback();
    this.editor.updateUI();
  }

  switchToNormalMode = (callback) => {
    if (this.isIn(Mode.Input)) {
      this.caret.decCol(1);
    }
    this.mode = Mode.Normal;
    if (callback) callback();
    this.editor.updateUI();
  }

  inAnyVisualMode = () => {
    return false;
  }

  _inputAtCaret = () => {
    this._switchToInputMode();
  }

  _inputAtLineHead = () => {
    this._switchToInputMode(this.caret.toFirstNonSpaceCol);
  }

  _inputAfterCaret = () => {
    this._switchToInputMode(() => this.caret.incCol(1));
  }

  _inputAtLineEnd = () => {
    this._switchToInputMode(this.caret.toLastCol);
  }

  _switchToInputMode = (callback) => {
    const inputChange = this.inputChange;
    inputChange.beforeInput();
    this.switchToInputMode(() => {
      if (callback) callback();
      inputChange.whenInput();
    });
  }

  escape = () => {
    if (this.editor.escape()) {
      return;
    }
    switch (this.mode) {
      case Mode.Input:
        this.saveInputChangeHistory();
        this.switchToNormalMode();
        break;
      default:
        break;
    }
  }

  saveInputChangeHistory = () => {
    const [finishRow, finishCol] = this.rowcol();
    const inputChange = this.inputChange;
    const text = inputChange.text();
    const preText = inputChange.preText();
    const aftText = inputChange.aftText();
    const rowcolBeforeInput = inputChange.rowcolBeforeInput;
    const rowcolWhenInput = inputChange.rowcolWhenInput;
    const backspaceCount = inputChange.backspaceCount;
    const delCount = inputChange.delCount;
    inputChange.reset();
    this.history.push({
      redo: () => {
        this.caret.setRowCol(...rowcolBeforeInput);
        this.switchToInputMode(() => {
          this.caret.setRowCol(...rowcolWhenInput);
        });
        for (let i = 0; i < backspaceCount; ++i) {
          this.feedKey('<bs>');
        }
        this.feedText(text);
        for (let i = 0; i < delCount; ++i) {
          this.feedKey('<del>');
        }
        this.switchToNormalMode(() => inputChange.reset());
      },
      undo: () => {
        this.switchToInputMode(() => {
          this.caret.setRowCol(finishRow, finishCol);
        });
        for (let i = 0; i < text.length; ++i) {
          this.feedKey('<bs>');
        }
        this.feedText(preText + aftText);
        this.switchToNormalMode(() => {
          this.caret.setRowCol(...rowcolBeforeInput);
          inputChange.reset();
        });
      },
      executeRedo: false,
    });
  }

  feedKey = (key) => {
    switch (key) {
      case '<c-k>':
        this.escape();
        return Feed.Handled;
      default:
        break;
    }
    if (this.mode === Mode.Input) {
      return this.handleInputKeyFeed(key);
    } else {
      return this.normal.feed(key);
    }
    return Feed.Handled;
  }

  handleInputKeyFeed = (key) => {
    switch (key) {
      case '<cr>':
        this.inputModeInsert('\n');
        return Feed.Handled;
      case '<bs>':
        this.inputModeBackspace();
        return Feed.Handled;
      case '<del>':
        this.inputModeDel();
        return Feed.Handled;
      default:
        break;
    }
  }

  inputModeInsert = (text) => {
    this.inputChange.pushText(text);
    const [r, c] = this.content.insertText(...this.rowcol(), text);
    if (r) {
      this.caret.incRow(r).setCol(c);
    } else {
      this.caret.incCol(c);
    }
  }

  inputModeBackspace = () => {
    let [row, col] = this.rowcol();
    if (row === 0 && col === 0) return;
    const content = this.content;
    const caret = this.caret;
    const inputChange = this.inputChange;
    if (col === 0) {
      inputChange.pushBackspace('\n');
      --row;
      col = content.line(row).cols();
      content.joinLines(row, 1);
      caret.setRowCol(row, col);
    } else {
      const ch = content.deleteText(row, col - 1, row, col);
      inputChange.pushBackspace(ch);
      caret.decCol(1);
    }
  }

  inputModeDel = () => {
    let [row, col] = this.rowcol();
    const content = this.content;
    const line = content.line(row);
    if (row === content.lastRow() && col === line.cols()) return;
    const inputChange = this.inputChange;
    if (col === line.cols()) {
      inputChange.pushDel('\n');
      content.joinLines(row, 1);
    } else {
      const ch = content.deleteText(row, col, row, col + 1);
      inputChange.pushDel(ch);
    }
    this.updateUI();
  }

  feedText = (text) => {
    if (text.length) {
      this.inputModeInsert(text);
    }
  }

  execNormal = (op) => {
    if (op.operation) {
      this.execNormalOperation(op);
    } else if (op.move) {
      this.execNormalMove(op);
    }
  }

  execNormalOperation = (op) => {
    switch (op.operation) {
      case 'x':
        const [row, col] = this.rowcol();
        this.doDeleteText(row, col, row, col + op.count);
        break;
      case 'i':
        this._inputAtCaret();
        break;
      case 'I':
        this._inputAtLineHead();
        break;
      case 'a':
        this._inputAfterCaret();
        break;
      case 'A':
        this._inputAtLineEnd();
        break;
      case 's':
        // TODO: input change
        this.doDeleteChar(...this.rowcol());
        this.switchToInputMode();
        break;
      case 'S':
        // TODO: input change
        this.switchToInputMode(() => this.caret.toLastCol());
        break;
      case 'o':
      case 'O':
        // TODO
        break;
      case 'u':
        loop(op.count, this.history.undo);
        break;
      case '<c-r>':
        loop(op.count, this.history.redo);
        break;
      case '<c-m>':
        loop(op.count, this.editor.replay);
        break;
      case 'q':
        if (op.target === 'q') {
          this.editor.startRecording();
        } else {
          this.editor.finishRecording();
        }
        break;
      default:
        break;
    }
  }

  execNormalMove = (op) => {
    const count = op.count
    switch (op.move) {
      case 'h':
        this.caret.decCol(count);
        break;
      case 'l':
        this.caret.incCol(count);
        break;
      case 'j':
        this.caret.incRow(count);
        break;
      case 'k':
        this.caret.decRow(count);
        break;
      case 'H':
        this.caret.toFirstNonSpaceCol();
        break;
      case '^':
        this.caret.setCol(0);
        break;
      case 'L':
        this.caret.toLastCol();
        break;
      case 'G':
        if (count === 1) {
          this.caret.toLastRow();
        } else {
          this.caret.setRow(count - 1);
        }
        break;
      case 'g': 
        if (op.target === 'g') {
          this.caret.toFirstRow();
        }
        break;
      default:
        break;
    }
  }

  updateUI = () => {
    this.editor.updateUI();
  }

  search = (pattern) => {
    console.log('search', '|' + pattern + '|');
    if (pattern.length === 0) {
      return;
    }
    const matches = this.content.search(pattern);
    for (const match of matches) {
      this._highlight(match);
    }
    this.editor.updateUI();
  }

  _highlight = (match) => {
    this.content.line(match.row).highlight(match.begCol, match.endCol);
  }
}
