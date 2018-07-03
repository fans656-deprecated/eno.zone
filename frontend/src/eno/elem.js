import React from 'react';
import _ from 'lodash';
import katex from 'katex'
import 'katex/dist/katex.min.css'
import hljs from 'highlightjs'
import 'highlightjs/styles/atom-one-light.css'
import yaml from 'js-yaml';

import apps from '../apps';
import { R } from './constants';
import './elem.css'

export class Elem {
  constructor(elem) {
    for (const key in elem) {
      this[key] = elem[key];
    }
  }

  setKey(key) {
    this.key = key;
    return this;
  }

  plainText = () => {
    return this.text;
  }

  render() {
    return <pre key={this.key}>{JSON.stringify(this)}</pre>;
  }
}

export class TextElem extends Elem {
  constructor(text) {
    super({type: 'text', text: text});
  }

  render() {
    return <span key={this.key}>{this.text}</span>;
  }
}

export class NewLine extends Elem {
  constructor(text) {
    super({type: 'newline'});
  }

  plainText = () => {
    return '\n';
  }

  render() {
    return <br key={this.key}/>
  }
}

export class Link extends Elem {
  render() {
    const label = this.label || this.value;
    return <a key={this.key} href={this.value}>{label}</a>;
  }
}

export class Header extends Elem {
  constructor(text) {
    super({
      type: 'header',
      text: text,
      isBlock: true,
    });
  }
}

export class H1 extends Header {
  render() {
    return <h1 key={this.key}>{this.text}</h1>;
  }
}

export class H2 extends Header {
  render() {
    return <h2 key={this.key}>{this.text}</h2>;
  }
}

export class H3 extends Header {
  render() {
    return <h3 key={this.key}>{this.text}</h3>;
  }
}

export class H4 extends Header {
  render() {
    return <h4 key={this.key}>{this.text}</h4>;
  }
}

export class H5 extends Header {
  render() {
    return <h5 key={this.key}>{this.text}</h5>;
  }
}

export class H6 extends Header {
  render() {
    return <h6 key={this.key}>{this.text}</h6>;
  }
}

export class Quote extends Elem {
  constructor() {
    super({
      lines: [],
      isBlock: true,
    });
  }

  addLine(line) {
    this.lines.push(line);
  }

  render() {
    const comps = [];
    this.lines.forEach((line, i) => {
      if (comps.length) {
        comps.push(<br key={'br-' + i}/>);
      }
      comps.push(<span key={i}>{line}</span>);
    });
    return <blockquote key={this.key}>{comps}</blockquote>;
  }
}

export class BlockCode extends Elem {
  constructor() {
    super({
      lines: [],
      isBlock: true,
    });
  }

  addLine(line) {
    this.lines.push(line);
  }

  render() {
    const lines = this.lines;
    let text = lines.join('\n');
    const lang = this.lang || 'python';
    text = hljs.highlight(lang, text, true).value;
    return (
      <pre key={this.key} className="code hljs">
        <code className="${lang}" dangerouslySetInnerHTML={{__html: text}}/>
      </pre>
    );
  }
}

export class HTML extends Elem {
  constructor() {
    super({
      lines: [],
      isBlock: true,
    });
  }

  addLine(line) {
    this.lines.push(line);
  }

  render() {
    const lines = this.lines;
    const text = lines.join('\n');
    return <div key={this.key} dangerouslySetInnerHTML={{__html: text}}></div>
  }
}

export class Image extends Elem {
  render() {
    const attrs = {
      src: this.value,
    };
    if (this.width) attrs.width = this.width;
    if (this.height) attrs.height = this.height;
    return (
      <a key={this.key} href={this.value} target="_blank">
        <img {...attrs}/>
      </a>
    );
  }
}

export class Audio extends Elem {
  render() {
    return <audio key={this.key} controls><source src={this.value}/></audio>;
  }
}

export class Video extends Elem {
  render() {
    return <video key={this.key} controls><source src={this.value}/></video>;
  }
}

export class InlineCode extends Elem {
  render() {
    return <code key={this.key} className="inline-code">{this.value}</code>;
  }
}

export class InlineFormula extends Elem {
  render() {
    const str = katex.renderToString(this.value, {
      displayMode: true,
    });
    return (
      <code
        key={this.key}
        className="formula"
        dangerouslySetInnerHTML={{__html: str}}
      />
    );
  }
}

export class App extends Elem {
  constructor() {
    super({
      type: 'app',
      lines: [],
      isBlock: true,
    });
  }

  addLine(line) {
    this.lines.push(line);
  }

  finish() {
    const lines = this.lines;
    const yamlLines = _.takeWhile(lines, line => !line.startsWith('---'));
    let attrs;
    try {
      attrs = yaml.safeLoad(yamlLines.join('\n'));
      this.attrs = attrs;
    } catch (e) {
      this.attrs = {};
    }
  }

  render() {
    try {
      const attrs = this.attrs;
      const app = apps[attrs.app];
      const content = this.lines.join('\n');
      if (app) {
        return React.createElement(app, {
          attrs: Object.assign(attrs, {
            key: this.key,
          }),
          content: this.content,
        });
      } else {
        return (
          <pre
            key={this.key}
            style={{
              background: '#f5f5f5',
              padding: '1em',
              fontSize: '.8em'
            }}
          >
            <code>
              <h2 style={{color: 'red'}}>WARNING: unknown app</h2>
              <span>{content}</span>
            </code>
          </pre>
        );
      }
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}

export function makeInstance(elem) {
  return new ELEM_TYPE_TO_CLASS[elem.type](elem);
}

const ELEM_TYPE_TO_CLASS = {
  newline: NewLine,
  text: Text,
  link: Link,
  image: Image,
  audio: Audio,
  video: Video,
  inline_code: InlineCode,
  inline_formula: InlineFormula,
};
