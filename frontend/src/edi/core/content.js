import Line from './line';
import { searchAll, defaultIfNull } from './utils';

export default class Content {
  constructor(text) {
    this.lines = null;
    this.setText(text || '');
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

  findBefore(row, col, pattern) {
    const text = this.line(row)._text.substring(0, col + 1);
    const foundCol = text.lastIndexOf(pattern);
    if (foundCol !== -1) {
      return [row, foundCol];
    }
    for (let i = row - 1; i >= 0; --i) {
      const foundCol = this.line(i)._text.lastIndexOf(pattern);
      if (foundCol === -1) continue;
      return [i, foundCol];
    }
    return [null, null];
  }

  findAfter(row, col, pattern) {
    const text = this.line(row)._text.substring(col);
    const foundCol = text.indexOf(pattern);
    if (foundCol !== -1) {
      return [row, col + foundCol];
    }
    for (let i = row + 1; i <= this.rows(); ++i) {
      const foundCol = this.line(i)._text.indexOf(pattern);
      if (foundCol === -1) continue;
      return [i, foundCol];
    }
    return [null, null];
  }

  findInLine(ch, props) {
    const row = props.row;
    let col = props.col;
    let count = props.count;
    const reverse = props.reverse;
    const line = this.line(row);
    let text;
    if (reverse) {
      text = line._text.substring(0, col);
      let foundCol = -1;
      while (count--) {
        foundCol = text.lastIndexOf(ch);
        if (foundCol === -1) {
          return -1;
        }
        text = text.substring(0, foundCol);
      }
      return foundCol;
    } else {
      text = line._text;
      let foundCol = -1;
      while (count--) {
        foundCol = text.indexOf(ch, col + 1);
        if (foundCol === -1) {
          return -1;
        }
        col = foundCol;
      }
      return foundCol;
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
    col = defaultIfNull(col, this.line(row).cols());
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

  deleteLine = (row, count) => {
    count = defaultIfNull(count, 1);
    this.lines.splice(row, count);
    if (this.lines.length === 0) {
      this.setText('');
    }
  }

  deleteText = (firstRow, begCol, lastRow, endCol) => {
    const deletedText = this.text(firstRow, begCol, lastRow, endCol);
    if (firstRow === lastRow) {
      this.line(firstRow).deleteText(begCol, endCol);
    } else {
      let wholeDeletionBegRow = firstRow;
      let wholeDeletionRows = lastRow - firstRow - 1;
      let firstLineDeleted = false;
      if (begCol <= 0) {
        ++wholeDeletionRows;
        firstLineDeleted = true;
      } else {
        this.line(firstRow).deleteText(begCol);
        ++wholeDeletionBegRow;
      }
      const lastLine = this.line(lastRow);
      // lastLine.cols() is necessary for delete until empty line beg
      if (endCol >= lastLine.cols() && lastLine.cols()) {
        ++wholeDeletionRows;
      } else {
        lastLine.deleteText(0, endCol);
      }
      this.lines.splice(wholeDeletionBegRow, wholeDeletionRows);
      if (firstRow !== lastRow && !firstLineDeleted) {
        this.joinLines(firstRow, 1);
      }
    }
    if (this.lines.length === 0) {
      this.setText('');
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

  findAll(src) {
    const founds = [];
    const lines = this.lines;
    for (let i = 0; i < lines.length; ++i) {
      const line = lines[i];
      const lineFounds = line.findAll(src);
      if (lineFounds.length) {
        founds.push([i, lineFounds]);
      }
    }
    return founds;
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
