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

  firstRow = () => {
    return 0;
  }

  lastRow = () => {
    return Math.max(0, this.rows() - 1);
  }

  line = (row) => {
    return this.lines[this.normalizedRow(row)];
  }

  text = (begRow, begCol, endRow, endCol) => {
    begRow = begRow == null ? 0 : begRow;
    begCol = begCol == null ? 0 : begCol;
    endRow = endRow == null ? this.rows() : endRow;
    endCol = endCol == null ? this.line(endRow - 1).cols() : endCol;
    if (begRow === endRow - 1) {
      return this.line(begRow).text(begCol, endCol);
    } else {
      const firstLine = this.line(begRow).text(begCol);
      const middleLines = this.lines.slice(begRow + 1, endRow - 1);
      const lastLine = this.line(endRow - 1).text(0, endCol);
      return [firstLine, ...middleLines, lastLine].join('\n');
    }
  }

  setText = (text) => {
    const texts = text.split('\n');
    if (texts.length === 0) {
      texts.push('');
    }
    this.lines = texts.map(text => new Line(text));
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
      left.insert(col, texts.shift());
      right.insert(0, texts.pop());
      this.lines.splice(row, 1, left, right);
      this.lines.splice(row + 1, 0, ...texts.map(text => new Line(text)));
      return [addedRows, lastAddedCols];
    }
  }

  deleteText = (begRow, begCol, endRow, endCol) => {
    if (begRow === endRow - 1) {
      this.line(begRow).deleteText(begCol, endCol);
    } else {
      this.line(begRow).deleteText(begCol);
      for (let row = 1; row < endRow - 1; ++row) {
        this.deleteLine(row);
      }
      this.line(endRow).deleteText(endRow - 1, 0, endCol);
    }
  }

  deleteLine = (row) => {
    this.lines.splice(row, 1);
  }

  search = (pattern) => {
    const lines = this.lines.map(line => line.text())
    return searchAll(pattern, lines);
  }

  normalizedRow = (row) => {
    return Math.max(this.firstRow(), Math.min(this.lastRow(), row));
  }
}
