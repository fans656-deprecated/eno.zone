import React from 'react';
import { withRouter } from 'react-router-dom';
import qs from 'query-string';

import Note from './note';
import Edi from './edi';
import { Button, DangerButton } from './common';
import { getNote } from './util';

import './EditNote.css';
//import { parse as parseEno } from './eno/parse';

class EditNote extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      note: null,
      editingMeta: false,
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
      note: new Note(note),
    }, () => {
      const note = this.state.note;
      const metaContent = note.metaContent() || '';
      this.edi.open('meta', metaContent);
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
          ref={ref => this.edi = ref}
          className="note"
          content={note.content()}
          onSave={this.onSave}
          onQuit={this.onQuit}
          onSaveAndQuit={this.onSaveAndQuit}
          onPreview={this.onPreview}
        />
        <div className="buttons horizontal">
          <div className="left">
          </div>
          <div className="right">
            <DangerButton id="delete" onClick={this.doDelete}>
              Delete
            </DangerButton>
            <Button primary="true" onClick={this.doPost}>
              Post
            </Button>
          </div>
        </div>
        <input
          ref={ref => this.fileInput = ref}
          type="file"
          style={{display: 'none'}}
        />
      </div>
    );
  }

  onSave = async (fnameToBuffer) => {
    const content = fnameToBuffer['content'];
    const metaContent = fnameToBuffer['meta'];
    let note = this.state.note;
    note.setContent(content);
    note.setMetaContent(metaContent);
    if (note.id() == null) {
      note.setOwner(this.props.owner.username);
    }
    await note.save();
  }

  onQuit = async () => {
    this.navigateBack();
  }

  onSaveAndQuit = async (text) => {
    await this.onSave(text);
    this.setState({note: this.state.note}, this.navigateBack);
  }

  onPreview(text, pre, aft) {
    console.log('onPreview');
    console.log({
      text: text,
      pre: pre,
      aft: aft,
    });
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
    await this.onSaveAndQuit(this.edi.text());
  }

  doDelete = async () => {
    await this.state.note.delete();
    window.location.href = '/';
  }

  navigateBack = () => {
    if (qs.parse(window.location.search).back) {
      this.props.history.push(`/note/${this.state.note.id()}`);
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
