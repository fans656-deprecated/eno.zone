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

  deleteChar = (row, col) => {
    this.deleteText(row, col, row + 1, col + 1);
  }

  deleteLine = (row) => {
    this.lines.splice(row, 1);
  }

  deleteText = (firstRow, begCol, lastRow, endCol) => {
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
      console.log(wholeDeletionBegRow, wholeDeletionRows);
      this.lines.splice(wholeDeletionBegRow, wholeDeletionRows);
    }
  }

  search = (pattern) => {
    const lines = this.lines.map(line => line.text())
    return searchAll(pattern, lines);
  }

  normalizedRow = (row) => {
    return Math.max(this.firstRow(), Math.min(this.lastRow(), row));
  }
}
