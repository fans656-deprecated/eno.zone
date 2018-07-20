import React from 'react';
import qs from 'query-string';

import { getPagedNotes } from './util';
import NoteComp from './Note';
import Note from './note';
import OperationPanel from './OperationPanel';
import Pagination from './Pagination';
import './css/NoteList.css';

class NoteList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      pagedNotes: {
        notes: [],
        skip: 0,
        total: 0,
        pagination: {
          page: 1,
          size: 20,
          nPages: 0,
        }
      },
    };
  }

  async componentDidMount() {
    await this.load(this.props);
  }

  async componentWillReceiveProps(props) {
    await this.load(props);
  }

  async load(props) {
    const q = qs.parse(window.location.search);
    let pagedNotes;
    if (props.notes) {
      pagedNotes = props.notes;
    } else {
      pagedNotes = await getPagedNotes({
        owner: window.owner,
        page: q.page,
        size: q.size,
      });
    }
    pagedNotes.notes = pagedNotes.notes.map(note => new Note(note));
    this.setState({pagedNotes: pagedNotes, loading: false});
  }

  render() {
    if (this.state.loading) {
      return null;
    }
    const notes = this.state.pagedNotes.notes.map(note => (
      <NoteComp
        key={note.id()}
        note={note}
        id={note.id()}
        visitor={window.visitor}
      />
    ));
    if (notes.length === 0) {
      return <div style={{
        color: '#999',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <p>It seems nothing is here</p>
      </div>
    }
    return (
      <div className="note-list">
        <div className="notes">
          {notes}
        </div>
        <Pagination {...this.state.pagedNotes.pagination} tags={[]}/>
        <OperationPanel user={window.visitor}/>
      </div>
    );
  }
}

export default NoteList;
