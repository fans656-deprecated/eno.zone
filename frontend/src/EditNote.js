import React from 'react'
import { withRouter } from 'react-router-dom'
import qs from 'query-string'

import Edi from './editor/edi'
import { DangerButton } from './common'
import { getNote, putNote, postNote, deleteNote } from './util'

import './EditNote.css'
import {parse, render} from './eno/parse'

class EditNote extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      note: null,
      viewingRaw: true,
      viewingMeta: false,
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

    this.rawEditor.quill.setText(note.content);
    this.richEditor.quill.setContents(parseContent(note.content));
  }

  render() {
    if (!this.props.visitor.isOwner()) {
      return <h1>You are not owner</h1>;
    }
    const note = this.state.note;
    if (!note) {
      return null;
    }
    console.log(note);
    return (
      <div
        className="edit-blog"
        onKeyUp={this.onKeyUp}
      >
        {this.renderRichEditor(note)}
        {this.renderRawEditor(note)}
        {this.renderMetaEditor(note)}
        <div className="buttons">
          <DangerButton id="delete" onClick={this.doDelete}>
            Delete
          </DangerButton>
          <button id="submit" className="eno-button primary" onClick={this.doPost}>
            Post
          </button>
        </div>
      </div>
    );
  }

  renderRichEditor = (note) => {
    const visible = !(this.state.viewingRaw || this.state.viewingMeta);
    return (
      <Edi
        ref={ref => this.richEditor = ref}
        type="rich"
        visible={visible}
        content={note.content}
        buttons={this.getCustomToolbarButtons({raw: false, meta: false})}
      />
    );
  }

  renderRawEditor = (note) => {
    const visible = !this.state.viewingMeta && this.state.viewingRaw;
    return (
      <Edi
        ref={ref => this.rawEditor = ref}
        type="raw"
        visible={visible}
        content={note.content}
        buttons={this.getCustomToolbarButtons({raw: true, meta: false})}
      />
    );
  }

  renderMetaEditor = (note) => {
    const visible = this.state.viewingMeta;
    return (
      <Edi
        ref={ref => this.metaEditor = ref}
        type="raw"
        visible={visible}
        content={JSON.stringify(this.extractMeta(note), null, 2)}
        buttons={this.getCustomToolbarButtons({raw: true, meta: true})}
      />
    );
  }

  getCustomToolbarButtons = ({raw, meta}) => {
    const buttons = [];
    if (!meta) {
      buttons.push(
        <button
          key="raw"
          className={raw ? 'toggled' : ''}
          onClick={this.toggleRawView}
        >
          Raw
        </button>
      );
    }
    buttons.push(
      <button
        key="meta"
        className={meta ? 'toggled' : ''}
        onClick={this.toggleMetaView}
      >
        Meta
      </button>
    );
    return buttons;
  }

  toggleRawView = () => {
    let note = this.state.note;
    if (this.state.viewingRaw) {
      const content = this.rawEditor.getRawContent();
      note.content = content;
    } else {
      const {ops} = this.richEditor.getRichContent();
      let content = '';
      for (let op of ops) {
        const data = op.insert;
        if (typeof(data) === 'string') {
          content += data;
        } else if (data instanceof Object) {
          if ('formula' in data) {
            const formula = data.formula;
            content += `\\math{${formula}}`;
          }
        }
      }
      note.content = content;
    }
    console.log(note);
    this.setState({
      note: note,
      viewingRaw: !this.state.viewingRaw,
    });
  }

  toggleMetaView = () => {
    let note = null;
    if (this.state.viewingMeta) {
      const meta = JSON.parse(this.metaEditor.getRawContent());
      note = Object.assign(this.state.note, meta);
    }
    this.setState(state => ({
      note: note ? note : this.state.note,
      viewingMeta: !state.viewingMeta,
    }));
  }

  onKeyUp = (ev) => {
    if (ev.getModifierState('Alt')) {
      switch (ev.key) {
        case 'r':
          this.toggleRawView();
          break;
        case 'm':
          this.toggleMetaView();
          break;
      }
    }
    if (ev.getModifierState('Control')) {
      console.log(this.richEditor.getRichContent());
    }
  }

  doPost = async () => {
    let note = this.state.note;
    note.content = this.rawEditor.getRawContent();
    if (note.id) {
      await putNote(note);
    } else {
      note.owner = this.props.owner.username;
      note = await postNote(note);
      console.log('note', note);
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

function parseContent(content) {
  const ops = [];

  let s = content;
  let i = 0;
  //while (true) {
  //  let escapeIndex = s.indexOf('\\');
  //  if (content.substring(escapeIndex).startsWith('\\\\')) {
  //    continue;
  //  }
  //}

  ops.push({
    insert: content,
  });
  return {
    ops: ops,
  };
}

class EnoParser {
  constructor(text) {
    this.text = text;
    this.i = 0;
  }

  parse = () => {
  }

  nextToken = () => {
    let i = this.i;
    const s = this.text.substring(i);
    let token = null;
    if (s.startsWith('\\') && !s.startsWith('\\\\')) {
    } else {
    }
    this.i = i;
    return token;
  }
}

function testEnoRender() {
  const s = `
test indent   
    test code \`materials\` and formula \`\`e=mc^2\`\`
        more
        more more
    more more more

test block formula

    f(x) = \\int_{-\\infty}^\\infty g(x)

test block code (python)

    def run():
        return [img video]

test block code (c)

    void main() {
        printf("hello wolrd\\n");
    }

test link [google me: https://goo.gl]
[google me: https://goo.gl] test link
 test
  test space
test link [t.flv]

test image [https://ub:5000/walle.jpg | 32 center]

test image with width [https://ub:5000/fans656.jpg | 128]
test image with height [https://ub:5000/cheetah-cub.png | x64]
test image with size [https://ub:5000/walle.jpg | 128x64]
test audio
[t.mp3]
test video
[https://www.w3schools.com/html/mov_bbb.mp4]
test ref [this is label: google]

test ref def

[google]: https://google.com
    `.trim();
  const b = render(s);
  return <div dangerouslySetInnerHTML={{__html: b}}></div>
}
