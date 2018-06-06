import React from 'react'
import { withRouter } from 'react-router-dom';
import qs from 'query-string';

import { DangerButton, Textarea, Input } from './common';
import { getNote, putNote, postNote, deleteNote } from './util';

class EditNote extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      note: {},
      content: '',
      tags: [],
    };
  }

  async componentDidMount() {
    if (this.props.id) {
      const note = await getNote({
        owner: this.props.owner,
        id: this.props.id,
      });
      this.setState({
        note: note,
        content: note.content,
        tags: note.tags,
      });
    }
  }

  onEditorTextChange = ({target}) => {
    this.setState({content: target.value});
  }

  doPost = async () => {
    let note = this.state.note;
    note.content = this.state.content;
    note.tags = this.state.tags;
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

  render() {
    if (!this.props.visitor.isOwner()) {
      return <h1>You are not owner</h1>;
    }
    const note = this.state.note;
    if (!note) {
      return <h1>Invalid</h1>
    }
    return <div className="edit-blog">
      <Textarea
        className="content-edit"
        id="editor"
        value={this.state.content}
        onChange={this.onEditorTextChange}
        submit={this.doPost}
        ref={(editor) => this.editor = editor}
      ></Textarea>
      <Input className="tags"
        placeholder="Tags"
        type="text"
        value={this.state.tags.join(' ')}
        onChange={({target}) => {
          this.setState({tags: target.value.split(' ')});
        }}
        submit={this.doPost}
      />
      <div className="buttons">
        <DangerButton id="delete" onClick={this.doDelete}>
          Delete
        </DangerButton>
        <button id="submit" className="primary" onClick={this.doPost}>
          Post
        </button>
      </div>
    </div>
  }
}
EditNote = withRouter(EditNote);
export default EditNote;
