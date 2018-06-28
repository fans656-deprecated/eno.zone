import { Mode } from './constants';

export default class Caret {
  constructor(surface, row, col) {
    this.surface = surface;
    this.content = surface.content;
    this.selection = surface.selection;
    this.row = row;
    this.col = col;
    this.hintCol = col;
  }

  rowcol() {
    return [this.row, this.col];
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
    this.setCol(this.normalizedCol(match[0].length), true);
  }

  wordForward = () => {
    const words = this.surface.currentLine().words();
    const [row, col] = this.rowcol();
    for (let i = 0; i < words.length - 1; ++i) {
      const word = words[i];
      if (word.outBeg <= col && col < word.beg) {
        this.setCol(words[i].beg);
        return;
      }
      if (word.beg <= col && col < word.outEnd) {
        this.setCol(word.outEnd);
        return;
      }
    }
    if (row === this.content.lastRow()) {
      this.toLastCol();
    } else {
      this.incRow(1).toFirstNonSpaceCol();
    }
  }

  wordBackward = () => {
    const words = this.surface.currentLine().words();
    const [row, col] = this.rowcol();
    for (let i = words.length - 1; i >= 0; --i) {
      const word = words[i];
      if (word.beg < col && col < word.outEnd) {
        this.setCol(word.beg);
        return;
      }
      if (word.beg === col && i !== 0) {
        this.setCol(words[i - 1].beg);
        return;
      }
    }
    if (row === 0) {
      this.setCol(0);
    } else {
      const words = this.surface.content.line(this.row - 1).words();
      this.decRow(1);
      if (words.length) {
        this.setCol(words[words.length - 1].beg);
      } else {
        this.toLastCol();
      }
    }
  }

  wordEnd = () => {
    const words = this.surface.currentLine().words();
    const [row, col] = this.rowcol();
    for (let i = 0; i < words.length; ++i) {
      const word = words[i];
      if (word.outBeg <= col && col < word.end - 1) {
        this.setCol(words[i].end - 1);
        return;
      }
      if (col === word.end - 1) {
        if (i !== words.length - 1) {
          this.setCol(words[i + 1].end - 1);
          return;
        }
      }
    }
    if (row === this.content.lastRow()) {
      this.toLastCol();
    } else {
      const words = this.surface.content.line(this.row + 1).words();
      this.incRow(1);
      if (words.length) {
        this.setCol(words[0].end - 1);
      } else {
        this.toLastCol();
      }
    }
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

  setRow = (row, noUpdate) => {
    this.row = this.normalizedRow(row);
    this.col = this.normalizedCol(this.hintCol);
    if (this.selection.active) {
      this.selection.updateCaret(this);
    }
    if (!noUpdate) {
      this.updateUI();
    }
    return this;
  }

  setCol = (col, forceHint, noUpdate) => {
    this.col = col = this.normalizedCol(col);
    this.hintCol = forceHint ? col : Math.max(col, this.hintCol);
    if (this.selection.active) {
      this.selection.updateCaret(this);
    }
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
