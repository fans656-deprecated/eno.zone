import React from 'react';

import App from '../app';
import NoteList from '../../NoteList';
import { fetchJSON } from '../../util';
import { Display } from '../../constants';

export default class Collection extends App {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      notes: null,
    };
  }

  async componentDidMount() {
    if (this.env.display !== Display.Single) return;

    const note = this.note;
    const res = await fetchJSON('POST', '/api/query-notes', {
      collection: note.note.name,
    });
    this.setState({
      loading: false,
      notes: res,
    });
  }

  renderSingle() {
    if (this.state.loading) return <div/>;
    return <NoteList notes={this.state.notes}/>
  }
}
