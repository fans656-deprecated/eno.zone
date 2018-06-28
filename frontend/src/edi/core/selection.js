import { Visual } from './constants';
import { caretBefore } from './utils';

export default class Selection {
  constructor(surface) {
    this.surface = surface;
    this.content = surface.content;
    this.active = false;
    this.anchor = null;
    this.point = null;
  }

  toggle(type) {
    if (this.active) {
      this.select(false);
      this.active = false;
    } else {
      this.type = type || Visual.Char;
      this.anchor = this.point = this.surface.caret.rowcol();
      this.select(true);
      this.active = true;
    }
    this.surface.updateUI();
  }

  updateCaret(caret) {
    this.select(false);
    this.point = caret.rowcol();
    this.select(true);
  }

  headtail() {
    const anchor = this.anchor;
    const point = this.point;
    if (caretBefore(...anchor, ...point)) {
      return [anchor, point];
    } else {
      return [point, anchor];
    }
  }

  blockRect() {
    const [head, tail] = this.headtail();
    let [top, left] = head;
    let [bottom, right] = tail;
    if (right < left) {
      ([left, right] = [right, left]);
    }
    return [left, top, right, bottom];
  }

  headtailRows() {
    const [head, tail] = this.headtail();
    return [head[0], tail[0]];
  }

  select(selected) {
    switch (this.type) {
      case Visual.Char:
        this.charTypeSelect(selected);
        break;
      case Visual.Line:
        this.lineTypeSelect(selected);
        break;
      case Visual.Block:
        this.blockTypeSelect(selected);
        break;
      default:
        break;
    }
  }

  charTypeSelect(selected) {
    const [head, tail] = this.headtail();
    this.content.select(...head, ...tail, selected);
  }

  lineTypeSelect(selected) {
    const [firstRow, lastRow] = this.headtailRows();
    this.content.select(firstRow, 0, lastRow, null, selected);
  }

  blockTypeSelect(selected) {
    const [left, top, right, bottom] = this.blockRect();
    for (let row = top; row <= bottom; ++row) {
      this.content.select(row, left, row, right, selected);
    }
  }
}
