import katex from 'katex'
import 'katex/dist/katex.min.css'

import {makeInstance} from './parse_line'

export class Elem {
  constructor(elem) {
    for (const key in elem) {
      this[key] = elem[key];
    }
  }

  plainText = () => {
    return this.text;
  }

  html = () => {
    return JSON.stringify(this)
  }
}

export class RefDef extends Elem {
}

export class TextElem extends Elem {
  constructor(text) {
    super({type: 'text', text: text});
  }

  html = () => {
    return `<span>${this.text.replace(/ /g, '&nbsp;')}</span>`;
  }
}

export class NewLine extends Elem {
  constructor(text) {
    super({type: 'newline'});
  }

  plainText = () => {
    return '\n';
  }

  html = () => {
    return '<br>';
  }
}

export class Link extends Elem {
  html = () => {
    return (
      `<a href="${this.value}" style="color: steelblue">`
      + `${this.label || this.value}`
      + `</a>`
    );
  }
}

export class Ref extends Elem {
  html = () => {
    const label = this.label;
    const ref = this.refs[this.value];
    if (!ref) return `<span>${this.text}</span>`;
    let elem = Object.assign(ref.elem, {label: this.label});
    elem = makeInstance(elem);
    return elem.html();
  }
}

export class Image extends Elem {
  html = () => {
    let attrs = {src: this.value};
    if (this.width) attrs.width = this.width;
    if (this.height) attrs.height = this.height;
    attrs = Object.keys(attrs).map(key => {
      return `${key}="${attrs[key]}"`;
    });
    return `<img ${attrs.join(' ')}>`;
  }
}

export class Audio extends Elem {
  html = () => {
    return `<audio controls><source src=${this.value}></audio>`;
  }
}

export class Video extends Elem {
  html = () => {
    return `<video controls><source src=${this.value}></video>`;
  }
}

export class InlineCode extends Elem {
  html = () => {
    return `<code>${this.value}</code>`;
  }
}

export class InlineFormula extends Elem {
  html = () => {
    const str = katex.renderToString(this.value);
    return `<code>${str}</code>`;
  }
}

export const ELEM_TYPE_TO_CLASS = {
  newline: NewLine,
  refdef: RefDef,
  text: Text,
  link: Link,
  ref: Ref,
  image: Image,
  audio: Audio,
  video: Video,
  inline_code: InlineCode,
  inline_formula: InlineFormula,
};
