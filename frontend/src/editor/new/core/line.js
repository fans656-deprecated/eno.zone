import Spans from './spans';
import { split } from './utils';

export default class Line {
  constructor(text, spans) {
    this._text = text;
    this.spans = spans || new Spans(text, {
      highlight: false,
      selection: false,
    });
  }

  cols = () => {
    return this.text().length;
  }

  text = (beg, end) => {
    [beg, end] = this.normalizedRange(beg, end);
    return this._text.substring(beg, end);
  }

  insertText = (col, text) => {
    const [pre, aft] = split(this._text, col);
    const newText = pre + text + aft;
    this._text = newText;
    const {span} = this.spans.at(col);
    span.text = newText;
    span.highlight = false;
  }

  deleteText = (beg, end) => {
    [beg, end] = this.normalizedRange(beg, end);
    const [pre, mid, aft] = split(this.text(), beg, end);
    this._text = pre + aft;
    this._spans.deleteCols(beg, end);
    return mid;
  }

  split = (col) => {
    const [pre, aft] = split(this._text, col);
    const [preSpans, aftSpans] = this.spans.splitAtCol(col);
    return [
      new Line(pre, preSpans),
      new Line(aft, aftSpans),
    ];
  }

  join = (line) => {
    this._text += line._text;
    this.spans.join(line.spans);
  }

  lastCol = () => {
    return Math.max(0, this.cols() - 1);
  }

  highlight = (beg, end) => {
    this.spans.setAttrs(beg, end, {highlight: true});
  }

  select = (beg, end) => {
    this.spans.setAttrs(beg, end, {select: true});
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
