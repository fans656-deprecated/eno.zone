import React from 'react'
import { withRouter } from 'react-router-dom'
import qs from 'query-string'

import Edi from './editor/edi'
import { DangerButton } from './common'
import { getNote, putNote, postNote, deleteNote } from './util'

import './EditNote.css'
//import { parse as parseEno } from './eno/parse'

class EditNote extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      note: null,
      editingMeta: false,
      previewing: false,
    };
  }

  async componentDidMount() {
    let note = {
      owner: this.props.owner.username,
      id: this.props.id,
      content: '\n',
      type: 'eno',
      tags: [],
    };
    if (this.props.id) {
      note = await getNote(note);
    }
    this.setState({
      note: note,
    });
  }

  render() {
    if (!this.props.visitor.isOwner()) {
      return <h1>You are not owner</h1>;
    }
    const note = this.state.note;
    if (!note) {
      return null;
    }
    return (
      <div
        className="edit-blog"
        onKeyUp={this.onKeyUp}
      >
        <Edi
          onUpload={this.onUpload}
        />
        <div className="buttons horizontal">
          <div className="left">
          </div>
          <div className="right">
            <DangerButton id="delete" onClick={this.doDelete}>
              Delete
            </DangerButton>
            <button id="submit" className="eno-button primary" onClick={this.doPost}>
              Post
            </button>
          </div>
        </div>
        <input ref={ref => this.fileInput = ref} type="file" style={{display: 'none'}}/>
      </div>
    );
  }

  onUpload = () => {
    this.fileInput.click();
  }

  onKeyUp = (ev) => {
    if (ev.getModifierState('Alt')) {
      switch (ev.key) {
        case 'r':
          break;
        case 'm':
          break;
        case 'n':
          break;
        default:
          break;
      }
    }
    if (ev.getModifierState('Control')) {
      //console.log(this.richEditor.getRichContent());
    }
  }

  doPost = async () => {
    let note = this.state.note;
    if (note.id) {
      await putNote(note);
    } else {
      note.owner = this.props.owner.username;
      note = await postNote(note);
    }
    this.setState({
      note: note
    }, this.navigateBack);
  }

  doDelete = async () => {
    await deleteNote(this.state.note.id);
    window.location.href = '/';
  }

  navigateBack = () => {
    if (qs.parse(window.location.search).back) {
      this.props.history.push(`/note/${this.state.note.id}`);
    } else {
      this.props.history.push('/');
    }
  }

  extractMeta = (note) => {
    const meta = Object.assign({}, note);
    delete meta.id;
    delete meta.owner;
    delete meta.content;
    delete meta.ctime;
    return meta;
  }
}

EditNote = withRouter(EditNote);
export default EditNote;

//function parseAsDelta(text) {
//  const ops = [];
//  const block = parseEno(text);
//  console.log(block);
//  parseElem(ops, block);
//  return {
//    ops: ops,
//  };
//}

function parseElem(ops, elem) {
  switch (elem.type) {
    case 'block':
      parseBlock(ops, elem);
      break;
    case 'text':
      ops.push({insert: elem.text});
      break;
    case 'newline':
      ops.push({insert: '\n'});
      break;
    case 'inline_formula':
      ops.push({insert: {formula: elem.value}});
      break;
    case 'inline_code':
      ops.push({insert: elem.value, attributes: {code: true}});
      break;
    case 'link':
      ops.push({insert: elem.value, attributes: {link: elem.label || elem.value}});
      break;
    case 'image':
      ops.push({insert: {img: {src: elem.value}}});
      break;
      //ops.push({
      //  insert: {
      //    img: {
      //      src: elem.value,
      //      width: elem.width,
      //      height: elem.height,
      //    }
      //  }
      //});
    default:
      ops.push({
        insert: '\n' + JSON.stringify(elem) + '\n',
      });
      break;
  }
}

function parseBlock(ops, block) {
  if (block.blockType === 'formula') {
    for (const elem of block.elems) {
      if (elem.type === 'text') {
        ops.push({insert: {formula: elem.text}})
      } else if (elem.type === 'newline') {
        ops.push({insert: '\n'})
      }
    }
  } else if (block.blockType === 'python' || block.blockType === 'c') {
    for (const elem of block.elems) {
      if (elem.type === 'text') {
        ops.push({insert: elem.text, attributes: {code: true}})
      } else if (elem.type === 'newline') {
        ops.push({insert: '\n'})
      }
    }
  } else {
    for (const elem of block.elems) {
      parseElem(ops, elem);
    }
  }
}

//function parseText(ops, elem) {
//  ops.push({insert: elem.text});
//}
//
//function unparseOps(segments, ops) {
//  for (const op of ops) {
//    unparseOp(segments, op);
//  }
//}
//
//function unparseOp(segments, op) {
//  const segment = op.insert;
//  if (!segment) {
//    segments.push(JSON.stringify(op));
//    return;
//  }
//  if (typeof(segment) === 'string') {
//    segments.push(segment);
//  } else if (segment.hasOwnProperty('formula')) {
//    segments.push('``' + segment.formula + '``');
//  }
//  console.log(op);
//}
//
//  const s = `
//test indent   
//    test code \`materials\` and formula \`\`e=mc^2\`\`
//        more
//        more more
//    more more more
//
//test block formula
//
//    f(x) = \\int_{-\\infty}^\\infty g(x)
//
//test block code (python)
//
//    def run():
//        return [img video]
//
//test block code (c)
//
//    void main() {
//        printf("hello wolrd\\n");
//    }
//
//test link [google me: https://goo.gl]
//[google me: https://goo.gl] test link
// test
//  test space
//test link [t.flv]
//
//test image [https://ub:5000/walle.jpg | 32 center]
//
//test image with width [https://ub:5000/fans656.jpg | 128]
//test image with height [https://ub:5000/cheetah-cub.png | x64]
//test image with size [https://ub:5000/walle.jpg | 128x64]
//test audio
//[t.mp3]
//test video
//[https://www.w3schools.com/html/mov_bbb.mp4]
//test ref [this is label: google]
//
//test ref def
//
//[google]: https://google.com
//    `.trim();
//
////function testEnoRender() {
////  const b = render(s);
////  return <div dangerouslySetInnerHTML={{__html: b}}></div>
////}
