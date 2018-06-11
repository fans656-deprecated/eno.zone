import {R, TYPE_STR_TO_TYPE, EXT_TO_TYPE} from './constants'
import {TextElem, RefDef, ELEM_TYPE_TO_CLASS} from './elem'

export function parseRefDef(line) {
  const match = line.match(R.refdef);
  if (!match) return null;
  const groups = match.groups;
  const id = groups.id;
  const elem = parseRes(match);
  return new RefDef({
    id: id,
    elem: elem,
    text: line,
  });
}

export function parseElems(line) {
  const elems = [];
  while (line.length) {
    const match = line.match(R.elem);
    if (!match) break;
    const beg = match.index;
    const end = beg + match[0].length;
    const pre = line.substring(0, beg);
    line = line.substring(end);
    if (pre.length) elems.push(new TextElem(pre));
    const elem = parseElem(match);
    elems.push(elem);
  }
  if (line) elems.push(new TextElem(line));
  return elems;
}

export function makeInstance(elem) {
  return new ELEM_TYPE_TO_CLASS[elem.type](elem);
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
