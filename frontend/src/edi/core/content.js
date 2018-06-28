import Line from './line';
import { searchAll } from './utils';

export default class Content {
  constructor(text) {
    this.lines = null;
    this.setText(text || '');

    this.textToPaste = '';
  }

  rows = () => {
    return this.lines.length;
  }

  lastRow = () => {
    return Math.max(0, this.rows() - 1);
  }

  line = (row) => {
    return this.lines[this.normalizedRow(row)];
  }

  lastLine = () => {
    return this.lines[this.lastRow()];
  }

  text = (firstRow, begCol, lastRow, endCol) => {
    firstRow = firstRow == null ? 0 : firstRow;
    begCol = begCol == null ? 0 : begCol;
    lastRow = lastRow == null ? this.lastRow() : lastRow;
    endCol = endCol == null ? this.line(lastRow).cols() : endCol;
    if (firstRow === lastRow) {
      return this.line(firstRow).text(begCol, endCol);
    } else {
      const pre = this.line(firstRow).text(begCol);
      const midLines = this.lines.slice(firstRow + 1, lastRow);
      const aft = this.line(lastRow).text(0, endCol);
      const mid = midLines.map(line => line._text);
      return [pre, ...mid, aft].join('\n');
    }
  }

  setText = (text) => {
    const texts = text.split('\n');
    if (texts.length === 0) {
      texts.push('');
    }
    this.lines = texts.map(text => new Line(text));
  }

  insertChar = (row, col, ch) => {
    this.insertText(row, col, ch);
  }

  insertLine = (row, text) => {
    this.lines.splice(row, 0, new Line(text));
  }

  insertText = (row, col, text) => {
    if (text.length === 0) {
      return;
    }
    const texts = text.split('\n');
    if (texts.length === 1) {
      this.line(row).insertText(col, text);
      return [0, text.length];
    } else {
      const addedRows = texts.length - 1;
      const lastAddedCols = texts[texts.length - 1].length;
      const [left, right] = this.line(row).split(col);
      left.insertText(col, texts.shift());
      right.insertText(0, texts.pop());
      this.lines.splice(row, 1, left, right);
      this.lines.splice(row + 1, 0, ...texts.map(text => new Line(text)));
      return [addedRows, lastAddedCols];
    }
  }

  deleteLine = (row) => {
    this.lines.splice(row, 1);
  }

  deleteText = (firstRow, begCol, lastRow, endCol) => {
    const deletedText = this.text(firstRow, begCol, lastRow, endCol);
    if (firstRow === lastRow) {
      this.line(firstRow).deleteText(begCol, endCol);
    } else {
      let wholeDeletionBegRow = firstRow;
      let wholeDeletionRows = lastRow - firstRow - 1;
      if (begCol <= 0) {
        ++wholeDeletionRows;
      } else {
        this.line(firstRow).deleteText(begCol);
        ++wholeDeletionBegRow;
      }
      const lastLine = this.line(lastRow);
      if (endCol >= lastLine.cols()) {
        ++wholeDeletionRows;
      } else {
        lastLine.deleteText(0, endCol);
      }
      this.lines.splice(wholeDeletionBegRow, wholeDeletionRows);
      this.joinLines(firstRow, 1);
    }
    return deletedText;
  }

  joinLines = (row, count) => {
    count = Math.max(0, Math.min(this.lastRow() - row, count));
    if (count) {
      this.line(row).join(...this.lines.splice(row + 1, count));
    }
  }

  search = (pattern) => {
    const lines = this.lines.map(line => line.text())
    return searchAll(pattern, lines);
  }

  select(firstRow, firstCol, lastRow, lastCol, selected) {
    if (firstRow === lastRow) {
      this.line(firstRow).select(firstCol, lastCol, selected);
    } else {
      this.line(firstRow).select(firstCol, null, selected);
      for (let row = firstRow + 1; row < lastRow; ++row) {
        this.line(row).select(null, null, selected);
      }
      this.line(lastRow).select(0, lastCol, selected);
    }
  }

  normalizedRow = (row) => {
    return Math.max(0, Math.min(this.lastRow(), row));
  }
}
