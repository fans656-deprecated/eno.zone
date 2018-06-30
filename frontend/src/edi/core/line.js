import Spans from './spans';
import { split, defaultIfNull } from './utils';

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
    if (beg >= end) return;
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

  highlight = (firstCol, lastCol, highlighted) => {
    firstCol = defaultIfNull(firstCol, 0);
    lastCol = defaultIfNull(lastCol, this.lastCol());
    highlighted = defaultIfNull(highlighted, true);
    this.spans.setAttrs(firstCol, lastCol + 1, {highlighted: highlighted});
  }

  select = (firstCol, lastCol, selected) => {
    firstCol = defaultIfNull(firstCol, 0);
    lastCol = defaultIfNull(lastCol, this.lastCol());
    selected = defaultIfNull(selected, true);
    this.spans.setAttrs(firstCol, lastCol + 1, {selected: selected});
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
      this.normalizedCol(beg, true),  // beg at end
      this.normalizedCol(end, true),
    ];
  }

  words() {
    const words = [];
    const re = /(?<word>(\w+)|([^\s\w]+)) ?/g;
    while (true) {
      const match = re.exec(this._text);
      if (!match) break;
      const text = match.groups.word;
      const beg = match.index;
      const end = beg + text.length;
      words.push({
        beg: beg,
        end: end,
        text: text,
      });
    }
    for (let i = 0; i < words.length - 1; ++i) {
      words[i].outEnd = words[i + 1].beg;
    }
    for (let i = words.length - 1; i > 0; --i) {
      words[i].outBeg = words[i - 1].outEnd;
    }
    if (words.length) {
      words[0].outBeg = 0;
      words[words.length - 1].outEnd = this.cols();
    }
    return words;
  }
}

const _defaultAttrs = () => {
  return {
    highlighted: false,
    selected: false,
  };
};
