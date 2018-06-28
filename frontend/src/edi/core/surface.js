import Content from './content';
import Normal from './normal';
import Caret from './caret';
import History from './history';
import Selection from './selection';
import InputChange from './inputchange';
import { Mode, Feed, Visual, Insert } from './constants';
import { loop, defaultIfNull } from './utils';

export default class Surface {
  constructor(editor, props) {
    props = props || {};
    this.editor = editor;
    this.content = props.content || new Content();
    this.mode = props.mode || Mode.Input;
    this.selection = new Selection(this);
    this.insertType = Insert.Default;
    this.normal = new Normal(this);
    this.caret = new Caret(this, 0, 0);
    this.history = new History(this);
    this.inputChange = new InputChange(this);
    this.active = false;
    this.op = null;
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

  normalDeleteChar = () => {
    const [row, col] = this.rowcol();
    this.doDeleteText(row, col, row, col + this.op.count);
  }

  currentLine() {
    return this.content.line(this.caret.row);
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

  inputAtCaret = () => {
    this._switchToInputMode();
  }

  inputAtLineHead = () => {
    if (this.selection.active) {
      switch (this.selection.type) {
        case Visual.Block:
          this.blockInsert();
          break;
        default:
          console.log('visual insert not handled');
          break;
      }
    } else {
      this._switchToInputMode({
        whenInput: this.caret.toFirstNonSpaceCol,
      });
    }
  }

  inputAfterCaret = () => {
    this._switchToInputMode({
      whenInput: () => this.caret.incCol(1),
    });
  }

  inputAtLineEnd = () => {
    this._switchToInputMode({
      whenInput: this.caret.toLastCol,
    });
  }

  deleteCharAndInput() {
    this._switchToInputMode({
      beforeInput: this.normalDeleteChar,
    });
  }

  _switchToInputMode = (props) => {
    props = props || {};
    const inputChange = this.inputChange;
    inputChange.repeatCount = this.op.repeatCount;
    this.history.squashOn = true;
    inputChange.beforeInput();
    if (props.beforeInput) {
      props.beforeInput();
    }
    this.switchToInputMode(() => {
      if (props.whenInput) {
        props.whenInput();
      }
      this.history.squashOn = false;
      inputChange.whenInput();
    });
  }

  escape = () => {
    if (this.editor.escape()) {
      return;
    }
    switch (this.mode) {
      case Mode.Input:
        if (this.insertType === Insert.Block) {
          this.finishBlockInsert();
        }
        this.saveInputChangeHistory();
        this.switchToNormalMode();
        break;
      case Mode.Normal:
        this.selection.toggle(false);
        break;
      default:
        break;
    }
  }

  saveInputChangeHistory = () => {
    const inputChange = this.inputChange;
    const text = inputChange.text();
    const repeatCount = inputChange.repeatCount;
    for (let i = 1; i < repeatCount; ++i) {
      this.feedText(text);
    }
    const preText = inputChange.preText();
    const aftText = inputChange.aftText();
    const rowcolBeforeInput = inputChange.rowcolBeforeInput;
    const rowcolWhenInput = inputChange.rowcolWhenInput;
    const backspaceCount = inputChange.backspaceCount;
    const delCount = inputChange.delCount;
    const [finishRow, finishCol] = this.rowcol();
    inputChange.reset();
    this.history.push({
      executeRedo: false,
      squashable: true,
      redo: () => {
        this.caret.setRowCol(...rowcolBeforeInput);
        this.switchToInputMode(() => {
          this.caret.setRowCol(...rowcolWhenInput);
        });
        for (let i = 0; i < backspaceCount; ++i) {
          this.feedKey('<bs>');
        }
        for (let i = 0; i < repeatCount; ++i) {
          this.feedText(text);
        }
        for (let i = 0; i < delCount; ++i) {
          this.feedKey('<del>');
        }
        this.switchToNormalMode(() => inputChange.reset());
      },
      undo: () => {
        this.switchToInputMode(() => {
          this.caret.setRowCol(finishRow, finishCol);
        });
        for (let i = 0; i < text.length * repeatCount; ++i) {
          this.feedKey('<bs>');
        }
        this.feedText(preText + aftText);
        this.switchToNormalMode(() => {
          this.caret.setRowCol(...rowcolBeforeInput);
          inputChange.reset();
        });
      },
    });
    this.history.squash();
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
  }

  handleInputKeyFeed = (key) => {
    switch (key) {
      case '<cr>':
      case '<c-m>':
        this.inputModeInsert('\n');
        return Feed.Handled;
      case '<bs>':
      case '<c-h>':
        this.inputModeBackspace();
        return Feed.Handled;
      case '<del>':
      case '<c-e>':
        this.inputModeDel();
        return Feed.Handled;
      case '<c-j>':
        // TODO: input without break current line
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

  feedText(text) {
    if (text.length) {
      this.inputModeInsert(text);
    }
  }

  execNormal = (op) => {
    this.op = op;
    if (op.operation) {
      this.execNormalOperation(op);
    } else if (op.move) {
      this.execNormalMove(op);
    } else if (op.target) {
      this.execNormalTarget(op);
    }
    this.op = null;
  }

  execNormalOperation = (op) => {
    switch (op.operation) {
      case 'x':
        this.normalDeleteChar();
        break;
      case 'i':
        this.inputAtCaret();
        break;
      case 'I':
        this.inputAtLineHead();
        break;
      case 'a':
        this.inputAfterCaret();
        break;
      case 'A':
        this.inputAtLineEnd();
        break;
      case 's':
        this.deleteCharAndInput();
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
          this.editor.startRecord();
        } else {
          this.editor.finishRecord();
        }
        break;
      case 'v':
        this.selection.toggle(Visual.Char);
        break;
      case 'V':
        this.selection.toggle(Visual.Line);
        break;
      case '<c-v>':
        this.selection.toggle(Visual.Block);
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

  execNormalTarget(op) {
    switch (op.target) {
      case 'w':
        loop(op.count, this.caret.wordForward);
        break;
      case 'b':
        loop(op.count, this.caret.wordBackward);
        break;
      case 'e':
        loop(op.count, this.caret.wordEnd);
        break;
      default:
        break;
    }
  }

  blockInsert() {
    const selection = this.selection;
    selection.toggle(false);
    this.insertType = Insert.Block;
    this._switchToInputMode({
      whenInput: () => {
        this.caret.setRowCol(...selection.head());
      }
    });
  }

  finishBlockInsert() {
    this.insertType = Insert.Default;
    const inputChange = this.inputChange;
    const text = inputChange.text();
    if (text.indexOf('\n') === -1) {
      const [left, top, right, bottom] = this.selection.blockRect();
      this.history.push({
        squashable: true,
        redo: () => {
          for (let row = top + 1; row <= bottom; ++row) {
            this.content.insertText(row, left, text);
          }
        },
        undo: () => {
          for (let row = top + 1; row <= bottom; ++row) {
            this.content.deleteText(row, left, row, left + text.length);
          }
        }
      });
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
