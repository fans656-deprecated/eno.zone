import { Visual } from './constants';
import { warn } from './utils';

export default class Paste {
  constructor(surface) {
    this.surface = surface;
    this.target = null;
    this.type = Visual.Char;
  }

  yank() {
    const surface = this.surface;
    const content = surface.content;
    if (surface.hasSelection()) {
      this.yankSelectedText();
    } else {
      const range = this.getOperationTargetRange();
      if (range) {
        const text = content.text(...range);
        this.set(text, Visual.Line);
      }
    }
  }

  yankSelectedText() {
    const surface = this.surface;
    const content = surface.content;
    const selection = surface.selection;
    const [head, tail] = selection.headtail();
    const [firstRow, firstCol] = head;
    const [lastRow, lastCol] = tail;
    let text = null;
    switch (selection.type) {
      case Visual.Char:
        text = content.text(firstRow, firstCol, lastRow, lastCol + 1);
        this.set(text, Visual.Char);
        break;
      case Visual.Line:
        text = content.text(firstRow, 0, lastRow, null);
        this.set(text, Visual.Line);
        break;
      case Visual.Block:
        warn('block yank not handled');
        break;
      default:
        break;
    }
  }

  set(target, type) {
    this.target = target;
    this.type = type;
  }

  getOperationTargetRange() {
    const op = this.surface.op;
    const [row, col] = this.surface.rowcol();
    switch (op.target) {
      case 'y': case 'c': case 'd':
        return [row, 0, row, null];
      case 'w':
        break;
      default:
        break;
    }
  }

  pasteLines(before) {
    const surface = this.surface;
    const content = surface.content;
    const caret = surface.caret;
    const [row, col] = surface.rowcol();
    const op = surface.op;
    const repeatCount = op.count;
    let text = this.target;
    const rows = text.split('\n').length * repeatCount;
    const lines = new Array(repeatCount).fill(text);
    text = lines.join('\n');
    if (before) {
      text = text + '\n';
    } else {
      text = '\n' + text;
    }
    const undoRow = before ? row : row + 1;
    const redoCol = before ? 0 : null;
    surface.history.push({
      redo: () => {
        const [addedRows, _] = content.insertText(row, redoCol, text);
        if (before) {
          caret.toFirstNonSpaceCol();
        } else {
          caret.incRow(addedRows).toFirstNonSpaceCol();
        }
      },
      undo: () => {
        content.deleteLine(undoRow, rows);
        caret.setRowCol(row, col);
      }
    });
  }

  pasteChars(before) {
    const surface = this.surface;
    const content = surface.content;
    const caret = surface.caret;
    const [row, col] = surface.rowcol();
    const op = surface.op;
    const repeatCount = op.count;
    const text = new Array(repeatCount).fill(this.target).join('');
    const lines = text.split('\n');
    const rows = lines.length;
    const addedRows = rows - 1;
    const insertCol = before ? col : col + 1;
    const lastLine = lines[lines.length - 1];
    const firstRow = row;
    const lastRow = firstRow + addedRows;
    let firstCol, endCol;
    if (addedRows) {
      firstCol = before ? col : insertCol;
      endCol = lastLine.length;
    } else {
      firstCol = insertCol;
      endCol = insertCol + lastLine.length;
    }
    surface.history.push({
      redo: () => {
        content.insertText(row, insertCol, text);
        if (before) {
          surface.updateUI();
        } else {
          if (addedRows) {
            caret.incRow(addedRows).setCol(lastLine.length - 1);
          } else {
            caret.incCol(text.length);
          }
        }
      },
      undo: () => {
        content.deleteText(firstRow, firstCol, lastRow, endCol);
        caret.setRowCol(row, col);
      }
    });
  }
}
