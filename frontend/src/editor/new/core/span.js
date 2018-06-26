import clone from 'clone';
import { split } from './utils';

export default class Span {
  constructor(text, attrs) {
    this.text = text;
    this.attrs = attrs;
  }

  split = (offset) => {
    if (offset === 0) {
      return [new Span('', {}), this];
    }
    const text = this.text;
    if (offset === text.length) {
      return [this, new Span('', {})];
    }
    const [pre, aft] = split(text, offset);
    const attrs = this.attrs;
    return [
      new Span(pre, clone(attrs)),
      new Span(aft, clone(attrs)),
    ];
  }
}
