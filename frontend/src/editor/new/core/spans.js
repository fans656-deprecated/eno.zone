import _ from 'lodash';
import Span from './span';
import { split } from './utils';

export default class Spans {
  constructor(...args) {
    if (args.length === 1) {
      this._spans = args[0];
    } else {
      const [text, attrs] = args;
      this._spans = [new Span({
        text: text,
        attrs: attrs,
      })];
    }
  }

  setAttrs = (beg, end, attrs) => {
    if (beg <= end) return;
    const spans = this.atColRange(beg, end);
    spans.splice(0, 1, ...spans.first().split(beg));
    spans.splice(-1, 1, ...spans.last().split(end));
    spans.slice(1, -1).forEach(span => Object.assign(span.attrs, attrs));
    spans.filter().compact();
  }

  atColRange = (beg, end) => {
  }

  get = (beg, end) => {
    const spans = [];
    const n = this._spans.length;
    let i = 0;
    let spanBeg = 0;
    for (; i < n; ++i) {
      const span = this._spans[i];
      const spanEnd = spanBeg + span.text.length;
      if (spanBeg <= beg && beg < spanEnd) {
        spans.push({
          i: i,
          beg: spanBeg,
          end: spanEnd,
          span: span,
        });
        break;
      }
      spanBeg = spanEnd;
    }
    for (++i; i < n; ++i) {
      const span = this._spans[i];
      const spanEnd = spanBeg + span.text.length;
      spans.push({
        i: i,
        beg: spanBeg,
        end: spanEnd,
        span: span
      });
      if (spanBeg <= end && end <= spanEnd) {
        break;
      }
      spanBeg = spanEnd;
    }
    if (spans.length) {
      return spans;
    } else {
      const span = this._spans[this._spans.length - 1];
      const text = span.text;
      const beg = spanBeg - text.length;
      const end = beg + text.length;
      return [{
        i: n - 1,
        beg: beg,
        end: end,
        span: span,
      }];
    }
  }

  at = (col) => {
    return this.get(col, col + 1)[0];
  }

  map = (...args) => this._spans.map(...args)

  splitAtCol = (col) => {
    const tspan = this.at(col);
    const spans = this._spans;
    spans.splice(tspan.i, 1, ...splitSpan(tspan, col).map(({span}) => span));
    return [
      new Spans(spans.slice(0, tspan.i + 1)),
      new Spans(spans.slice(tspan.i + 1)),
    ];
  }

  join = (spans) => {
    this._spans = this._spans.concat(spans._spans);
  }
}

const splitSpan = (tspan, col) => {
  const span = tspan.span;
  const [pre, aft] = split(span.text, col - tspan.beg);
  return [
    {
      beg: tspan.beg,
      end: col,
      span: {
        text: pre,
        attrs: Object.assign({}, span.attrs),
      }
    },
    {
      beg: col,
      end: tspan.end,
      span: {
        text: aft,
        attrs: Object.assign({}, span.attrs),
      }
    },
  ];
}

function compact(spans) {
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
