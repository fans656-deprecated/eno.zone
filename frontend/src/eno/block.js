import hljs from 'highlightjs'
import 'highlightjs/styles/solarized-dark.css'
import katex from 'katex'
import 'katex/dist/katex.min.css'

import {TextElem, NewLine} from './elem'
import {R} from './constants'

export default class Block {
  constructor() {
    this.type = 'block';
    this.blockType = undefined;
    this.elems = [];
    this.refs = {};
  }

  detectType = (line) => {
    this.blockType = '';
    if (line.match(R.langPythonLine)) {
      this.blockType = 'python';
    } else if (line.match(R.langCLine)) {
      this.blockType = 'c';
    } else if (line.indexOf('`') === -1 && line.match(R.formulaLine)) {
      this.blockType = 'formula';
    }
  }

  updateRefs = (refs) => {
    this.refs = Object.assign(refs, this.refs);
  }

  addElem = (elem) => {
    this.elems.push(elem);
  }

  addElems = (elems) => {
    this.elems = this.elems.concat(elems);
  }

  addLine = (line) => {
    this.addElems([new TextElem(line), new NewLine()]);
  }

  addRef = (ref) => {
    this.refs[ref.id] = ref;
  }

  plainText = () => {
    return this.elems.map(e => e.plainText()).join('');
  }

  json = () => {
    return this;
  }

  html = () => {
    let type = '';
    let codeType = null;
    switch (this.blockType) {
      case 'python':
        type = 'code';
        codeType = 'python';
        break;
      case 'c':
        type = 'code';
        codeType = 'c';
        break;
      case 'formula':
        type = 'formula';
        break;
    }
    if (type === 'code') {
      let elems = this.elems;
      elems = elems.slice(0, elems.length - 2);
      let a = [];
      for (const elem of elems) {
        if (elem.type === 'text') {
          a.push(elem.text.substring(4));
        } else {
          a.push(elem.plainText());
        }
      }
      let str = a.join('');
      str = hljs.highlight(this.blockType, str, true).value;
      return (
        `<pre class="code hljs">`
        + `<code class="${this.blockType}">${str}</code>`
        + `</pre>`
      );
    } else if (type === 'formula'){
      let elems = this.elems;
      elems = elems.slice(0, elems.length - 2);
      let a = [];
      for (const elem of elems) {
        if (elem.type === 'text') {
          a.push(katex.renderToString(elem.text));
        } else {
          a.push('<br>');
        }
      }
      return `<div class="formula">${a.join('')}</div>`;
    } else {
      const a = [];
      const elems = this.elems;
      for (let i = 0; i < elems.length; ++i) {
        const elem = elems[i];
        const nextElem = i + 1 < elems.length ? elems[i + 1] : null;
        if (nextElem && nextElem.type === 'block' && nextElem.blockType.length) {
          continue;
        }
        a.push(elem.html());
      }
      return a.join('');
    }
  }
}
