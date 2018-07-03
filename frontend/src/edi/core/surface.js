import Content from './content';
import Normal from './normal';
import Caret from './caret';
import History from './history';
import Selection from './selection';
import InputChange from './inputchange';
import Paste from './paste';
import Operand from './operand';
import { Mode, Feed, Visual, Insert, INDENT } from './constants';
import { loop, defaultIfNull, warn, caretBefore } from './utils';

export default class Surface {
  constructor(editor, props) {
    props = props || {};
    this.editor = editor;
    this.content = props.content || new Content();
    this.mode = props.mode || Mode.Input;
    this.selection = new Selection(this);
    this.insertType = Insert.Default;
    this.paste = new Paste(this);
    this.normal = new Normal(this);
    this.caret = new Caret(this, 0, 0);
    this.history = new History(this);
    this.inputChange = new InputChange(this);
    this.active = false;
    this.op = null;
    this.lastOp = null;  // used in search & find in line
    this.savedRowCol = null;  // for search caret restore
  }

  map = (key, func) => {
    this.normal.keymap.add(key, func);
  }

  hasSelection() {
    return this.selection.active;
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

  normalDeleteChar() {
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

  handleInputModeSwitch(op) {
    switch (op.operation) {
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
      case 'o':
        this.inputBelow();
        break;
      case 'O':
        this.inputAbove();
        break;
      case 's':
        this.deleteCharAndInput();
        break;
      default:
        break;
    }
  }

  handleHistory(op) {
    switch (op.operation) {
      case 'u':
        loop(op.count, this.history.undo);
        break;
      case '<c-r>':
        loop(op.count, this.history.redo);
        break;
      case '<c-m>':
        loop(op.count, this.editor.replay);
        break;
      default:
        break;
    }
  }

  handleRecord(op) {
    if (op.target === 'q') {
      this.editor.startRecord();
    } else {
      this.editor.finishRecord();
    }
  }

  handleVisual(op) {
    const selection = this.selection;
    switch (op.operation) {
      case 'v':
        selection.toggle(Visual.Char);
        break;
      case 'V':
        selection.toggle(Visual.Line);
        break;
      case '<c-v>':
        selection.toggle(Visual.Block);
        break;
      default:
        break;
    }
  }

  handleNormalXDelete() {
    if (this.selection.active) {
      this.deleteSelectedText();
    } else {
      this.normalDeleteChar();
    }
  }

  handleNormalDDelete() {
    if (this.hasSelection()) {
      this.deleteSelectedText(true);
    } else {
      const op = this.op;
      if (op.operation === 'D') {  // D
        this.deleteLineTillEnd();
      } else if (op.target === 'd') {  // dd
        this.deleteLine(op.count);
      } else if (op.move || op.target) {
        this.deleteNavigation(op);
        this.caret.ensureValid();
      }
    }
  }

  joinNextLine() {
    const content = this.content;
    const caret = this.caret;
    const [row, col] = caret.rowcol();
    if (row === content.lastRow()) return;
    const line = content.line(row);
    const cols = line.cols();
    this.history.push({
      redo: () => {
        content.insertText(row, cols, ' ');
        content.joinLines(row, 1);
        caret.setCol(cols);
      },
      undo: () => {
        content.deleteText(row, cols, row, cols + 1);
        content.insertText(row, cols, '\n');
        caret.setRowCol(row, col);
      }
    });
  }

  copyToClipboard() {
    if (this.hasSelection()) {
      const text = this.selection.text();
      navigator.clipboard.writeText(text);
    }
  }

  handleChangeThenInput() {
    if (this.hasSelection()) {
      this.deleteCharAndInput();
      return;
    }
    this.history.squashOn = true;
    const op = this.op;
    if (op.operation === 'C') {  // C
      const [row, col] = this.rowcol();
      const text = this.content.text(row, col, row, null);
      this.history.push({
        redo: () => {
          this.content.deleteText(row, col, row, null);
          this.caret.incCol(1, true).ensureValid();
        },
        undo: () => {
          this.content.insertText(row, col, text);
          this.caret.ensureValid();
        }
      });
      this._switchToInputMode({
        whenInput: () => {
          this.caret.incCol(1, false);
        }
      });
    } else if (op.target === 'c') {  // cc
      this.caret.setCol(0);
      this.deleteLine(op.count);
      this.inputAbove();
      this._switchToInputMode();
    } else if (op.move || op.target) {
      this.history.squashOn = true;
      this.deleteNavigation(op, {changing: true});
      this.history.squashOn = false;
      this._switchToInputMode();
    }
    this.history.squashOn = false;
  }

  handleYank() {
    this.paste.yank();
    if (this.hasSelection()) {
      this.selection.off();
      this.updateUI();
    }
  }

  deleteLine(repeatCount) {
    const [row, col] = this.rowcol();
    const isLastRow = row === this.content.lastRow();
    const textRow = row + isLastRow;
    const lines = this.content.lines.slice(textRow, textRow + repeatCount);
    const text = lines.map(line => line._text).join('\n');
    this.history.push({
      redo: () => {
        this.content.deleteLine(row, repeatCount);
        this.caret.setRowCol(row, col).ensureValid();
      },
      undo: () => {
        if (isLastRow) {
          this.content.insertText(row + 1, null, '\n' + text);
        } else {
          this.content.insertText(row, 0, text + '\n');
        }
        this.caret.setRowCol(row, col).ensureValid();
      }
    });
  }

  deleteLineTillEnd() {
    const [row, col] = this.rowcol();
    const text = this.content.text(row, col, row, null);
    this.history.push({
      redo: () => {
        this.content.deleteText(row, col, row, null);
        this.caret.ensureValid();
      },
      undo: () => {
        this.content.insertText(row, col, text);
        this.caret.setRowCol(row, col);
      }
    });
  }

  deleteNavigation(op, props) {
    const [head, tail] = this.getOperationRange(op, props);
    if (head == null) return;
    const text = this.content.text(...head, ...tail);
    const [row, col] = this.rowcol();
    this.history.push({
      redo: () => {
        this.content.deleteText(...head, ...tail);
        this.caret.setRowCol(...head);
      },
      undo: () => {
        this.content.insertText(...head, text);
        this.caret.setRowCol(row, col);
      }
    });
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

  inputAbove() {
    this._switchToInputMode({
      beforeInput: () => {
        const row = this.caret.row;
        this.history.push({
          redo: () => {
            this.content.insertText(row, 0, '\n');
            this.caret.ensureValid();
          },
          undo: () => {
            this.content.deleteLine(row);
            this.caret.ensureValid();
          }
        });
      }
    });
  }

  inputBelow() {
    this._switchToInputMode({
      beforeInput: () => {
        const row = this.caret.row;
        this.history.push({
          redo: () => {
            this.content.insertText(row, null, '\n');
            this.caret.incRow(1);
          },
          undo: () => {
            this.content.deleteLine(row + 1);
            this.caret.setRow(row);
          }
        });
      }
    });
  }

  deleteCharAndInput() {
    this._switchToInputMode({
      beforeInput: () => {
        if (this.hasSelection()) {
          this.deleteSelectedText(true);
        } else {
          this.normalDeleteChar();
          if (this.caret.atTail()) {
            this.caret.incCol(1, false);
          }
        }
      }
    });
  }

  pasteAfter() {
    this._paste(false);
  }

  pasteBefore() {
    this._paste(true);
  }

  findInLine(op) {
    const content = this.content;
    const [row, col] = this.caret.rowcol();
    op = op || this.op;
    let foundCol;
    switch (op.move) {
      case 'f':
        foundCol = content.findInLine(op.target, {
          row: row, 
          col: col,
          count: op.count
        });
        if (foundCol !== -1) {
          this.caret.setCol(foundCol);
        }
        break;
      case 'F':
        foundCol = content.findInLine(op.target, {
          row: row,
          col: col,
          count: op.count,
          reverse: true,
        });
        if (foundCol !== -1) {
          this.caret.setCol(foundCol);
        }
        break;
      case 't':
        foundCol = content.findInLine(op.target, {
          row: row, 
          col: col,
          count: op.count
        });
        if (foundCol !== -1) {
          this.caret.setCol(foundCol - 1);
        }
        break;
    }
  }

  _paste(before) {
    switch (this.paste.type) {
      case Visual.Char:
        this.paste.pasteChars(before);
        break;
      case Visual.Line:
        this.paste.pasteLines(before);
        break;
      default:
        break;
    }
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

  escape() {
    this.normal.reset();
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
        this.selection.off();
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

  feedKey(key) {
    if (this.mode === Mode.Input) {
      return this.handleInputKeyFeed(key);
    } else {
      return this.normal.feed(key);
    }
  }

  handleInputKeyFeed(key) {
    switch (key) {
      case '<c-k>':
        this.escape();
        return Feed.Handled;
      case '<cr>':
      case '<c-m>':
        this.inputModeInsert('\n');
        return Feed.Handled;
      case '<c-j>':
        this.caret.toLastCol();
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
      case '<c-u>':
        this.inputModeBackspaceToHead();
        return Feed.Handled;
      case '<c-o>':
        this.indentLine();
        return Feed.Handled;
      case '<c-d>':
        this.indentLine(true);
        return Feed.Handled;
      case '<c-l>':
        this.caret.incCol(1);
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

  inputModeBackspaceToHead() {
    const [row, col] = this.rowcol();
    const text = this.content.text(row, 0, row, col);
    for (const _ of text) {
      this.feedKey('<bs>');
    }
    this.updateUI();
  }

  indentLine(unindent) {
    const content = this.content;
    const caret = this.caret;
    const [row, col] = caret.rowcol();
    let redo = () => {
      content.insertText(row, 0, INDENT);
      caret.incCol(INDENT.length);
    };
    let undo = () => {
      const line = content.line(row);
      if (line._text.startsWith(INDENT)) {
        content.deleteText(row, 0, row, INDENT.length);
        caret.decCol(INDENT.length);
      }
    };
    if (unindent) {
      ([redo, undo] = [undo, redo]);
    }
    this.history.push({
      redo: redo,
      undo: undo,
    });
  }

  feedText(text) {
    if (!this.isIn(Mode.Input)) return;
    if (text.length) {
      this.inputModeInsert(text);
    }
  }

  execNormal = (op) => {
    this.op = op;
    if (op.operation) {
      this.execNormalOperation(op);
    } else if (op.move || op.target) {
      this.execNormalNavigation(op);
    }
    this.op = null;
  }

  execNormalOperation = (op) => {
    switch (op.operation) {
      case 'x':
        this.handleNormalXDelete();
        break;
      case 'd':
      case 'D':
        this.handleNormalDDelete();
        break;
      case 'J':
        this.joinNextLine();
        break;
      case '<c-C>':
        this.copyToClipboard();
        break;
      case 'c':
      case 'C':
        this.handleChangeThenInput(op);
        break;
      case 'y':
        this.handleYank();
        break;
      case 'p':
        this.pasteAfter();
        break;
      case 'P':
        this.pasteBefore();
        break;
      case '\\':
        this.findInLine(this.lastOp);
        break;
      case 'n':
        this.searchNext();
        break;
      case 'N':
        this.searchNext(true);
        break;
      case 's':
      case 'i': case 'I':
      case 'a': case 'A':
      case 'o': case 'O':
        this.handleInputModeSwitch(op);
        break;
      case 'u': case '<c-r>': case '<c-m>':
        this.handleHistory(op);
        break;
      case 'q':
        this.handleRecord(op);
        break;
      case 'v': case 'V': case '<c-v>':
        this.handleVisual(op);
        break;
      default:
        break;
    }
  }

  execNormalNavigation(op) {
    if (op.move) {
      this.execNormalMove(op);
    } else if (op.target) {
      this.execNormalTarget(op);
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
      case 'f': case 'F': case 't':
        this.findInLine();
        this.lastOp = op;
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
    selection.off();
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
      const [left, top, _, bottom] = this.selection.blockRect();
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

  deleteSelectedText(reserveLastBlankLine) {
    reserveLastBlankLine = defaultIfNull(reserveLastBlankLine, false);
    const selection = this.selection;
    const [head, tail] = selection.headtail();
    const [firstRow, firstCol] = head;
    const [lastRow, lastCol] = tail;
    switch (selection.type) {
      case Visual.Char:
        this.doDeleteText(firstRow, firstCol, lastRow, lastCol + 1);
        break;
      case Visual.Line:
        if (false) {
          this.doDeleteText(firstRow, 0, lastRow, null);
        } else {
          this.doDeleteText(firstRow, 0, lastRow + 1, 0);
        }
        break;
      case Visual.Block:
        const [left, top, right, bottom] = selection.blockRect();
        this.history.squashOn = true;
        for (let row = top; row <= bottom; ++row) {
          this.doDeleteText(row, left, row, right + 1);
        }
        this.history.squash();
        this.history.squashOn = false;
        break;
      default:
        break;
    }
    selection.off();
  }

  updateUI = () => {
    this.editor.updateUI();
  }

  getOperationRange(op, props) {
    if (op.move === 'i' || op.move === 'a') {
      return this.getOperandRange(op, props);
    } else {
      return this.getNavigatedRange(op, props);
    }
  }

  getNavigatedRange(op, props) {
    props = props || {};

    let tailRowDiff = 0;
    let tailColDiff = 0;

    if (op.move === 'G' || (op.move === 'g' && op.target === 'g')) {
      tailRowDiff = 1;
    } else if (op.move === 'L') {
      tailColDiff = 1;
    }

    if (!op.move && (op.target === 'w' || op.target === 'e')) {
      if (op.operation === 'c') {
        op.target = 'e';
        tailColDiff = 1;
      }
    } else if (op.move === 'f' || op.move === 't') {
      tailColDiff = 1;
    }
    if (this.caret.atTail() && (op.target === 'w' || op.target === 'e')) {
      op = null;
    }

    const anchor = this.rowcol();
    if (op) {
      this.execNormalNavigation(op);
    }
    const point = this.rowcol();

    this.caret.setRowCol(...anchor);
    let head, tail;
    if (caretBefore(...anchor, ...point)) {
      head = anchor;
      tail = point;
    } else {
      head = point;
      tail = anchor;
    }

    if (tailRowDiff) {
      tail[0] += tailRowDiff;
    }
    if (tailColDiff) {
      tail[1] += tailColDiff;
    }

    return [head, tail];
  }

  getOperandRange(op, props) {
    const operand = new Operand(this, op);
    if (!operand.found) {
      return [null, null];
    }
    if (op.move === 'i') {
      return [
        [operand.firstRow, operand.beg],
        [operand.lastRow, operand.end],
      ];
    } else if (op.move === 'a') {
      return [
        [operand.firstRow, operand.outBeg],
        [operand.lastRow, operand.outEnd],
      ];
    }
    return [this.rowcol(), this.rowcol()];
  }

  saveCaret() {
    this.savedRowCol = this.caret.rowcol();
  }

  restoreCaret() {
    this.caret.setRowCol(...this.savedRowCol);
  }

  search = (pattern, reversed) => {
    this.clearHighlights();
    if (pattern.length === 0) {
      return;
    }
    const matches = this.content.search(pattern);
    if (matches.length === 0) return;
    if (reversed) { 
      matches.reverse();
    }
    for (const match of matches) {
      this._highlight(match);
    }
    this.lastSearch = {
      matches: matches,
      reversed: reversed,
    };
    const [row, col] = this.caret.rowcol();
    let found = false;
    let i = 0;
    let matchRow, matchCol;
    for (; i < matches.length; ++i) {
      const match = matches[i];
      matchRow = match.row;
      matchCol = match.begCol;
      if (reversed) {
        if (matchRow <= row) {
          if (matchRow < row || (matchRow === row && matchCol <= col)) {
            found = true;
            break;
          }
        }
      } else {
        if (matchRow >= row) {
          if (matchRow > row || (matchRow === row && matchCol >= col)) {
            found = true;
            break;
          }
        }
      }
    }
    if (found) {
      this.lastSearch.index = i;
      this.caret.setRowCol(matchRow, matchCol);
    } else {
      this.editor.updateUI();
    }
  }

  searchNext(reversed) {
    const lastSearch = this.lastSearch;
    if (!lastSearch) return;
    const matches = lastSearch.matches;
    let i = lastSearch.index;
    if (reversed) {
      i = (i + matches.length - 1) % matches.length;
    } else {
      i = (i + 1) % matches.length;
    }
    this.lastSearch.index = i;
    const match = matches[i];
    this.caret.setRowCol(match.row, match.begCol);
  }

  clearHighlights() {
    if (!this.lastSearch) return;
    for (const match of this.lastSearch.matches) {
      this._highlight(match, false);
    }
  }

  replace(src, dst) {
    const founds = this.content.findAll(src);
    this.history.push({
      redo: () => {
        for (const [row, lineFounds, _] of founds) {
          let col = 0;
          const line = this.content.line(row);
          for (const [beg, end] of lineFounds) {
            line.deleteText(beg + col, end + col);
            line.insertText(beg + col, dst);
            col -= end - beg;
            col += dst.length;
          }
        }
        this.caret.ensureValid();
      },
      undo: () => {
        for (const [row, lineFounds] of founds) {
          const line = this.content.line(row);
          for (const [beg, end, text] of lineFounds) {
            line.deleteText(beg, beg + dst.length);
            line.insertText(beg, text);
          }
        }
        this.caret.ensureValid();
      }
    });
  }

  _highlight = (match, highlighted) => {
    const line = this.content.line(match.row);
    line.highlight(match.begCol, match.endCol - 1, highlighted);
  }
}
