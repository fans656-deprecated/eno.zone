import React from 'react';
import qs from 'query-string';

import { fetchJSON } from './util'
import NoteComp from './Note';
import Note from './note';
import EditNote from './EditNote';

export default class CustomUrlPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      note: null,
    };
  }

  async componentDidMount() {
    const url = this.props.url;
    const res = await fetchJSON('POST', '/api/query-note', {
      url: url,
    });
    if (res.note) {
      this.setState({note: res.note});
    }
  }

  //componentWillReceiveProps(props) {
  //  const path = props.match.url;
  //  const setState = res => this.setState({res: res});
  //  if (path) {
  //    fetchData('GET', '/api/custom-url' + path, setState, setState);
  //  }
  //}

  render() {
    let note = this.state.note;
    if (!note) return null;
    note = new Note(note);

    const search = window.location.search;
    let editing = false;
    if (search.length) {
      const params = qs.parse(search.substring(1));
      editing = 'edit' in params;
    }
    if (editing) {
      return <EditNote note={note}/>
    } else {
      return <NoteComp note={note} isSingleView={true}/>
    }
  }
}
