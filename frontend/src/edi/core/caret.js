import { Mode } from './constants';

export default class Caret {
  constructor(surface, row, col) {
    this.surface = surface;
    this.content = surface.content;
    this.row = row;
    this.col = col;
    this.hintCol = col;
  }

  toFirstRow = () => {
    this.setRow(0);
  }

  toLastRow = () => {
    this.setRow(this.normalizedRow(this.content.rows() - 1));
  }

  toLastCol = () => {
    this.setCol(this.normalizedCol(this._cols()));
  }

  toFirstNonSpaceCol = () => {
    const line = this.content.line(this.row);
    const match = line.text().match(/^\s*/);
    this.setCol(this.normalizedCol(match[0].length));
  }

  setRow = (row, noUpdate) => {
    this.row = this.normalizedRow(row);
    this.col = this.normalizedCol(this.hintCol);
    if (!noUpdate) {
      this.updateUI();
    }
    return this;
  }

  setCol = (col, forceHint, noUpdate) => {
    this.col = col = this.normalizedCol(col);
    this.hintCol = forceHint ? col : Math.max(col, this.hintCol);
    if (!noUpdate) {
      this.updateUI();
    }
    return this;
  }

  setRowCol = (row, col, noUpdate) => {
    this.setRow(row, true);
    this.setCol(col, true, true);
    if (!noUpdate) {
      this.updateUI();
    }
    return this;
  }

  incRow = (count, noUpdate) => this.changeRow(count, noUpdate)
  decRow = (count, noUpdate) => this.changeRow(-count, noUpdate)
  incCol = (count, noUpdate) => this.changeCol(count, noUpdate)
  decCol = (count, noUpdate) => this.changeCol(-count, true, noUpdate)

  changeRow = (diff, noUpdate) => {
    this.setRow(this.row + diff, noUpdate);
    return this;
  }

  changeCol = (diff, forceHint, noUpdate) => {
    this.setCol(this.col + diff, forceHint, noUpdate);
    return this;
  }

  normalizedRow = (row) => {
    return Math.max(0, Math.min(this.content.lastRow(), row));
  }

  normalizedCol = (col) => {
    let maxCol = this._cols();
    if (!this.surface.isIn(Mode.Input)) --maxCol;
    return Math.max(0, Math.min(maxCol, col));
  }

  _cols = () => {
    return this.content.line(this.row).cols();
  }

  updateUI = () => {
    this.surface.updateUI();
  }
}
