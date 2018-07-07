import React from 'react'

import Note from './note';

export default class NoteComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      note: props.note || null,
    };
  }

  componentDidMount() {
    const note = this.state.note;
    if (!note || note.invalid()) {
      this.getNote();
    }
  }

  getNote = async () => {
    const note = new Note();
    await note.fetch(this.props.owner, this.props.id);
    this.setState({note: note});
  }

  render() {
    const note = this.state.note;
    if (note) {
      return this.state.note.render(this.props);
    } else {
      return null;
    }
  }
}
