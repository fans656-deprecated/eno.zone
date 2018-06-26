import Spans from './spans';
import { split } from './utils';

export default class Line {
  constructor(text, spans) {
    this._text = text;
    this.spans = spans || new Spans(text, _defaultAttrs());
  }

  cols = () => {
    return this._text.length;
  }

  lastCol = () => {
    return this.normalizedCol(this.cols() - 1);
  }

  text = (beg, end) => {
    [beg, end] = this.normalizedRange(beg, end);
    return this._text.substring(beg, end);
  }

  insertText = (col, text) => {
    const [pre, aft] = split(this._text, col);
    this._text = pre + text + aft;
    this.spans.insertText(col, text, _defaultAttrs());
  }

  deleteText = (beg, end) => {
    [beg, end] = this.normalizedRange(beg, end);
    if (beg === end) return;
    const [pre, mid, aft] = split(this.text(), beg, end);
    this._text = pre + aft;
    this.spans.deleteText(beg, end);
    return mid;
  }

  split = (col) => {
    const [pre, aft] = split(this._text, col);
    const [preSpans, aftSpans] = this.spans.split(col);
    return [
      new Line(pre, preSpans),
      new Line(aft, aftSpans),
    ];
  }

  join = (...lines) => {
    this._text += lines.map(line => line._text).join('');
    this.spans.join(...lines.map(line => line.spans));
  }

  highlight = (beg, end) => {
    this.spans.setAttrs(beg, end, {highlighted: true});
  }

  select = (beg, end) => {
    this.spans.setAttrs(beg, end, {selected: true});
  }

  normalizedCol = (col, allowTail) => {
    let colMax = this.cols() - 1;
    if (allowTail) ++colMax;
    return Math.max(0, Math.min(colMax, col));
  }

  normalizedRange = (beg, end) => {
    beg = beg == null ? 0 : beg;
    end = end == null ? this._text.length : end;
    return [
      this.normalizedCol(beg),
      this.normalizedCol(end, true),
    ];
  }
}

const _defaultAttrs = () => {
  return {
    highlighted: false,
    selected: false,
  };
};
