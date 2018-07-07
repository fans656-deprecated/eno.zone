import Reader from './reader';
import Block from './block';
import { R, TYPE_STR_TO_TYPE, EXT_TO_TYPE } from './constants';
import {
  H1, H2, H3, H4, H5, H6, 
  Quote, BlockCode, HTML, App, TextElem,
  makeInstance,
} from './elem';

export function parse(text) {
  const reader = new Reader(text);
  const block = new Block();
  while (reader.line !== null) {
    const line = reader.line;
    const match = line.match(R.lineElement);
    if (match) {
      const [type, value] = getLineElem(match);
      let elem;
      switch (type) {
        case 'h1': elem = new H1(value); break;
        case 'h2': elem = new H2(value); break;
        case 'h3': elem = new H3(value); break;
        case 'h4': elem = new H4(value); break;
        case 'h5': elem = new H5(value); break;
        case 'h6': elem = new H6(value); break;
        case 'quote': elem = parseQuote(reader); break;
        case 'blockCodeBeg': elem = parseBlockCode(reader); break;
        case 'htmlBeg': elem = parseHTML(reader); break;
        case 'appBeg': elem = parseApp(reader); break;
        default: break;
      }
      if (elem) {
        block.addElem(elem);
      }
    } else {
      const elems = parseLine(reader.line);
      block.addElems(elems);
    }
    reader.nextLine();
  }
  return block;
}

function getLineElem(match) {
  const groups = match.groups;
  let type, value;
  for (type in groups) {
    if (type.startsWith('_')) continue;
    value = groups[type];
    if (value) break;
  }
  return [type, value];
}

function parseQuote(reader) {
  const quote = new Quote();
  while (reader.line !== null) {
    const line = reader.line;
    const match = line.match(R.quote);
    if (!match) {
      reader.pushback();
      break;
    }
    quote.addLine(match.groups.quote);
    reader.nextLine();
  }
  return quote;
}

function parseBlockCode(reader) {
  const code = new BlockCode();

  const line = reader.line;
  const match = line.match(R.blockCodeBeg);
  const groups = match.groups;
  const indent = groups._indent.length;
  code.lang = groups._lang;
  reader.nextLine();

  while (reader.line !== null) {
    const line = reader.line;
    const match = line.match(R.blockCodeEnd);
    if (match) {
      break;
    }
    code.addLine(line.substring(indent));
    reader.nextLine();
  }
  return code;
}

function parseHTML(reader) {
  const html = new HTML();
  reader.nextLine();
  while (reader.line !== null) {
    const line = reader.line;
    const match = line.match(R.htmlEnd);
    if (match) {
      break;
    }
    html.addLine(line);
    reader.nextLine();
  }
  return html;
}

function parseApp(reader) {
  const app = new App();
  reader.nextLine();
  while (reader.line !== null) {
    const line = reader.line;
    const match = line.match(R.appEnd);
    if (match) {
      break;
    }
    app.addLine(line);
    reader.nextLine();
  }
  app.finish();
  return app;
}

function parseLine(line) {
  const elems = [];
  let col = 0;
  while (line.length) {
    const match = line.match(R.elem);
    if (!match) break;
    const beg = match.index;
    const end = beg + match[0].length;
    const pre = line.substring(0, beg);
    line = line.substring(end);
    if (pre.length) {
      elems.push(new TextElem(pre));
      col += pre.length;
    }
    const elem = parseElem(match);
    elem.beg = col;
    elem.end = col + end - beg;
    col += end - beg;
    elems.push(elem);
  }
  if (line) elems.push(new TextElem(line));
  return elems;
}

function parseElem(match) {
  let elem = {type: 'text', 'text': match[0]};
  const groups = match.groups;
  const res = groups.res;
  const code = groups.code;
  const formula = groups.formula;
  if (res) {
    elem = Object.assign(elem, parseRes(match));
  } else if (code) {
    elem = Object.assign(elem, {type: 'inline_code', value: code});
  } else if (formula) {
    elem = Object.assign(elem, {type: 'inline_formula', value: formula});
  }
  return makeInstance(elem);
}

function parseRes(match) {
  const groups = match.groups;
  const label = groups.label;
  let value = groups.value;
  const attrs = groups.attrs;
  let elem = {};
  const typeAndValue = extractType(value);
  let type = typeAndValue.type;
  value = typeAndValue.value;
  if (label && !type) type = 'ref';
  if (type) {
    elem.type = type;
    elem.value = value;
    if (label) elem.label = label;
    if (attrs) parseAttrs(elem, attrs);
  }
  return elem;
}

function parseAttrs(elem, attrs) {
  if (elem.type === 'image') {
    parseImageAttrs(elem, attrs);
  }
}

function parseImageAttrs(elem, attrs) {
  for (const attr of attrs.split(' ')) {
    if (attr.match(R.imageSizeAttr)) {
      const {groups} = attr.match(R.imageSize);
      const width = groups.width;
      const height = groups.height;
      if (width) elem.width = width;
      if (height) elem.height = height;
    }
  }
}

function extractType(text) {
  if (text.indexOf(' ') !== -1) {
    const parts = text.split(' ');
    const typestr = parts[0];
    const value = parts.slice(1).join(' ');
    const type = TYPE_STR_TO_TYPE[typestr];
    if (type) {
      return {type: type, value: value};
    }
  }
  return {type: guessType(text), value: text};
}

function guessType(text) {
  const match = text.match(R.ext);
  if (match) {
    const ext = match[1];
    const type = EXT_TO_TYPE[ext];
    return type || 'link';
  } else if (text.indexOf('.') !== -1 || text.indexOf('/') !== -1) {
    return 'link';
  }
}
