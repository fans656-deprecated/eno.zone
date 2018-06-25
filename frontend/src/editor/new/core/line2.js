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

  text = (begCol, endCol) => {
    const text = this._text;
    begCol = begCol == null ? 0 : begCol;
    endCol = endCol == null ? text.length : endCol;
    return text.substring(begCol, endCol);
  }

  insert = (col, text) => {
    const [pre, aft] = split(this._text, col);
    const newText = pre + text + aft;
    this._text = newText;
    const {span} = this.spans.at(col);
    span.text = newText;
    span.highlight = false;
  }

  split = (col) => {
    const [pre, aft] = split(this._text, col);
    const [preSpans, aftSpans] = this.spans.split(col);
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

  deleteCols = (begCol, endCol) => {
    const text = this.text();
    const pre = text.substring(0, begCol);
    const aft = text.substring(endCol, text.length);
    this._text = pre + aft;
  }

  highlight = (beg, end) => {
    this.spans.setAttrs(beg, end, {highlight: true});
  }

  select = (beg, end) => {
    this.spans.setAttrs(beg, end, {select: true});
  }
}
