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
    row = Math.max(0, Math.min(this.rows() - 1, row));
    return this.lines[row];
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
    const lines = text.split('\n');
    if (lines.length === 0) {
      lines.push('');
    }
    this.lines = lines.map((lineText) => new Line(lineText));
  }

  insertText = (row, col, text) => {
    if (text.length === 0) {
      return;
    }
    const texts = text.split('\n');
    const rows = texts.length - 1;
    const cols = texts[texts.length - 1].length;

    // split the first line, insert first text
    const parts = this.line(row).split(col);
    this.lines.splice(row, 1, ...parts);
    this.line(row).insert(col, texts[0]);

    // insert remaining lines
    this.lines.splice(
      row + 1, 0, ...texts.slice(1).map(text => new Line(text))
    );
    this.joinLines(row + rows, 1);
    return [rows, cols];
  }

  joinLines = (row, count) => {
    const line = this.line(row);
    for (let i = 0; i < count; ++i) {
      line.join(this.line(row + i + 1));
    }
    this.lines.splice(row, count + 1, line);
  }

  deleteText = (begRow, begCol, endRow, endCol, saveToPaste) => {
    saveToPaste = saveToPaste == null ? true : saveToPaste;
    this.textToPaste = this.text(begRow, begCol, endRow, endCol);
    if (begRow === endRow - 1) {
      this.line(begRow).deleteCols(begCol, endCol);
    } else {
      this.line(begRow).deleteCols(begCol, this.line(begRow).cols());
      for (let row = 1; row < endRow - 1; ++row) {
        this.deleteLine(row);
      }
      this.line(endRow).deleteCols(endRow - 1, 0, endCol);
    }
  }

  deleteLine = (row) => {
    this.lines.splice(row, 1);
  }

  search = (pattern) => {
    const lines = this.lines.map(line => line.text())
    return searchAll(pattern, lines);
  }
}
