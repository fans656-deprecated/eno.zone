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
    this.inputChange = new InputChange();
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

  insertText = (row, col, text, before) => {
    if (text.length === 0) {
      return;
    }
    const caret = this.caret;
    caret.setRowCol(row, col, true);
    if (this.isIn(Mode.Normal) && !before && this.content.line(row).cols()) {
      ++col;
    }
    const [rows, cols] = this.content.insertText(row, col, text);
    if (rows === 0) {
      caret.incCol(cols);
    } else {
      caret.incRow(rows, true).setCol(cols);
    }
  }

  doDeleteChar = (row, col) => {
    this.doDeleteText(row, col, row, col + 1);
  }

  doDeleteText = (begRow, begCol, endRow, endCol) => {
    const deletedText = this.content.text(begRow, begCol, endRow, endCol);
    this.history.push({
      redo: () => {
        this.deleteText(begRow, begCol, endRow, endCol);
        // TODO: where to put caret?
        this.caret.setRowCol(begRow, begCol - 1);
      },
      undo: () => {
        this.insertText(begRow, begCol, deletedText);
        this.caret.setRowCol(begRow, begCol);
      }
    });
  }

  deleteText = (begRow, begCol, endRow, endCol) => {
    this.content.deleteText(begRow, begCol, endRow, endCol);
  }

  isIn = (mode) => this.mode === mode

  switchToInputMode = (callback) => {
    this.mode = Mode.Input;
    if (callback) callback();
    this.editor.updateUI();
  }

  switchToNormalMode = () => {
    this.mode = Mode.Normal;
    this.editor.updateUI();
  }

  inAnyVisualMode = () => {
    return false;
  }

  escape = () => {
    if (this.editor.escape()) {
      return;
    }
    switch (this.mode) {
      case Mode.Input:
        this.caret.decCol(1);
        this.switchToNormalMode();
        break;
      default:
        break;
    }
  }

  feedKey = (key) => {
    switch (key) {
      case '<c-k>':
        this.escape();
        return Feed.Handled;
      default:
        break;
    }
    if (this.mode !== Mode.Input) {
      this.normal.feed(key);
      return Feed.Handled;
    } else {
      switch (key) {
        case '<cr>':
          //this.content.insertText();
          break;
        case '<bs>':
          this.caret.backspace();
          break;
        case '<del>':
          this.caret.del();
          break;
        default:
          break;
      }
    }
  }

  feedText = (text) => {
    this.insertText(...this.rowcol(), text);
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
        this.doDeleteChar(...this.rowcol());
        break;
      case 'i':
        this.switchToInputMode();
        break;
      case 'I':
        this.switchToInputMode(() => this.caret.toFirstNonSpaceCol());
        break;
      case 'a':
        this.switchToInputMode(() => this.caret.incCol(1));
        break;
      case 'A':
        this.switchToInputMode(() => this.caret.toLastCol());
        break;
      case 's':
        this.doDeleteChar(...this.rowcol());
        this.switchToInputMode();
        break;
      case 'S':
        this.switchToInputMode(() => this.caret.toLastCol());
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

  update = () => {
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
