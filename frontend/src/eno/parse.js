import Reader from './reader'
import Block from './block'
import {NewLine} from './elem'
import {parseRefDef, parseElems} from './parse_line'

export function parse(text) {
  const reader = new Reader(text);
  const block = parseBlock(reader, 0);
  block.elems.pop();  // remove trailing newline
  return block;
}

export function render(text) {
  return parse(text).html();
}

function parseBlock(reader, indent) {
  const block = new Block();
  if (block.blockType === undefined) {
    if (indent) {
      block.detectType(reader.line);
    } else {
      block.blockType = '';
    }
  }
  while (reader.line !== null) {
    if (reader.isPrevLineEmpty()) {
      if (reader.indent > indent) {
        const childBlock = parseBlock(reader, reader.indent);
        block.addElem(childBlock);
      } else if (reader.indent < indent) {
        break;
      }
    }
    if (reader.line !== null) {
      if (block.blockType.length) {
        block.addLine(reader.line);
      } else {
        const ref = parseRefDef(reader.line);
        if (ref) {
          block.addRef(ref);
        } else {
          const elems = parseElems(reader.line);
          block.addElems(elems.concat([new NewLine()]));
        }
      }
      reader.nextLine();
    }
  }
  for (const elem of block.elems) {
    if (elem.type === 'ref') {
      elem.refs = block.refs;
    } else if (elem.type === 'block') {
      elem.updateRefs(block.refs);
    }
  }
  return block;
}
