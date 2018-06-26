import _ from 'lodash';
import Span from './span';

export default class Spans {
  constructor(...args) {
    if (args.length === 1) {
      this._spans = args[0];
    } else {
      const [text, attrs] = args;
      this._spans = [new Span(text, attrs)];
    }
  }

  map = (...args) => this._spans.map(...args)

  insertText = (col, text, attrs) => {
    if (this._spans.length === 0) {
      this._spans.push(new Span(text, attrs));
    } else {
      const i = this._splitSpan(col) + 1;
      this._spans.splice(i, 0, new Span(text, attrs));
    }
    this._normalize();
  }

  deleteText = (begCol, endCol) => {
    if (this._spans.length === 0) return;
    const iFirst = this._splitSpan(begCol) + 1;
    const iLast = this._splitSpan(endCol);
    this._spans.splice(iFirst, iLast - iFirst + 1);
    this._normalize();
  }

  split = (col) => {
    const left = [];
    const right = [];

    let takingLeft = true;
    let spanBeg = 0;
    this._spans.forEach((span, i) => {
      if (takingLeft) {
        const spanEnd = spanBeg + span.text.length;
        if (spanEnd <= col) {
          left.push(span);
        } else if (spanBeg === col) {
          right.push(span);
          takingLeft = false;
        } else {
          const [l, r] = span.split(col - spanBeg);
          left.push(l);
          right.push(r);
          takingLeft = false;
        }
        spanBeg = spanEnd;
      } else {
        right.push(span);
      }
    });
    return [
      new Spans(_normalized(left)),
      new Spans(_normalized(right)),
    ];
  }

  join = (...spansArray) => {
    this._spans = this._spans.concat(...spansArray.map(spans => spans._spans));
  }

  setAttrs = (begCol, endCol, attrs) => {
    if (this._spans.length === 0) return;
    if (begCol >= endCol) return;
    let [iFirst, spans] = this._splice(begCol, endCol);
    spans.forEach(span => Object.assign(span.attrs, attrs));
    this._spans.splice(iFirst, 0, ...spans);
    this._normalize();
  }

  _splice = (begCol, endCol) => {
    const iFirst = this._splitSpan(begCol) + 1;
    const iLast = this._splitSpan(endCol);
    return [iFirst, this._spans.splice(iFirst, iLast - iFirst + 1)];
  }

  _splitSpan = (col) => {
    const spans = this._spans;
    let spanBeg = 0;
    for (let i = 0; i < spans.length; ++i) {
      const span = spans[i];
      const spanEnd = spanBeg + span.text.length;
      if (spanBeg <= col && col < spanEnd) {
        spans.splice(i, 1, ...span.split(col - spanBeg));
        return i;
      }
      spanBeg = spanEnd;
    }
    const span = spans[spans.length - 1];
    const iLast = spans.length - 1;
    spans.splice(iLast, 1, ...span.split(span.text.length));
    return iLast;
  }

  _normalize = () => {
    this._spans = _normalized(this._spans);
  }
}

function _normalized(spans) {
  if (spans.length === 0) return spans;
  return _compact(spans.filter(span => span.text.length));
}

function _compact(spans) {
  if (spans.length === 0) return spans;
  const res = [spans.shift()];
  for (let cur of spans) {
    const last = res[res.length - 1];
    if (_.isEqual(cur.attrs, last.attrs)) {
      last.text += cur.text;
    } else {
      res.push(cur);
    }
  }
  return res;
}
