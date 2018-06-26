import React from 'react';
import $ from 'jquery';
import { withRouter } from 'react-router-dom';
import qs from 'query-string';
import yaml from 'js-yaml';

import Edi from './edi';
import { Button, DangerButton } from './common';
import {
  getNote, putNote, postNote, deleteNote, parseNoteMeta,
  extractYamlText,
} from './util';

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
        {true ? null : <Edi
          ref={ref => this.edi = ref}
          content={this.state.note.content}
          onSave={this.onSave}
          onQuit={this.onQuit}
          onSaveAndQuit={this.onSaveAndQuit}
          onUpload={this.onUpload}
        />}
        <Edi className="note"/>
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

  onSave = async (text) => {
    let note = this.state.note;
    note.content = text;
    const {yamltext} = extractYamlText(text);
    if (yamltext) {
      try {
        const notemeta = yaml.safeLoad(yamltext);
        const meta = parseNoteMeta(notemeta);
        $.extend(note, meta);
        for (const key in note) {
          if (note[key] == null) {
            delete note[key];
          }
        }
      } catch (e) {
        alert('Invalid meta\n(You may wanna remove the leading blank line?)');
        return;
      }
    }
    console.log(note);
    if (note.id) {
      await putNote(note);
    } else {
      note.owner = this.props.owner.username;
      note = await postNote(note);
    }
  }

  onQuit = async () => {
    this.navigateBack();
  }

  onSaveAndQuit = async (text) => {
    await this.onSave(text);
    this.setState({note: this.state.note}, this.navigateBack);
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
