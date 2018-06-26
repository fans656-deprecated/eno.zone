import _ from 'lodash';
import { split } from './utils';

export default class Spans {
  constructor(text, attrs) {
    if (typeof(text) === 'object') {
      this._spans = text;
    } else {
      this._spans = [{
        text: text,
        attrs: attrs,
      }];
    }
  }

  setAttrs = (beg, end, attrs) => {
    if (beg === end) {
      return;
    }
    let spans = this.get(beg, end);
    const firstSpan = spans[0];
    spans.splice(0, 1, ...splitSpan(firstSpan, beg));
    const iLast = spans.length - 1;
    const lastSpan = spans[iLast];
    spans.splice(iLast, 1, ...splitSpan(lastSpan, end));
    for (let i = 1; i < spans.length - 1; ++i) {
      Object.assign(spans[i].span.attrs, attrs);
    }
    spans = spans.filter((span) => span.beg !== span.end);
    spans = compact(spans);
    this._spans = spans.map(span => span.span);
    console.log(this._spans);
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

  split = (col) => {
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
  const newSpans = [];
  for (let span of spans) {
    if (newSpans.length) {
      const lastSpan = newSpans[newSpans.length - 1];
      if (_.isEqual(span.span.attrs, lastSpan.span.attrs)) {
        Object.assign(lastSpan.span, {
          text: lastSpan.span.text + span.span.text
        });
      } else {
        newSpans.push(span);
      }
    } else {
      newSpans.push(span);
    }
  }
  return newSpans;
}
