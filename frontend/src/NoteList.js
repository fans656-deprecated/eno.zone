import React from 'react';
import qs from 'query-string';

import { getPagedNotes } from './util';
import Note from './Note';
import OperationPanel from './OperationPanel';
import Pagination from './Pagination';
import './css/NoteList.css';

class NoteList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
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
    const q = qs.parse(window.location.search);
    const pagedNotes = await getPagedNotes({
      owner: this.props.owner,
      page: q.page,
      size: q.size,
    });
    console.log(pagedNotes);
    this.setState({pagedNotes: pagedNotes});
  }

  render() {
    const notes = this.state.pagedNotes.notes.map(note => (
      <Note key={note.id} note={note} id={note.id} visitor={this.props.visitor}/>
    ));
    return (
      <div className="note-list">
        <div className="notes">
          {notes}
        </div>
        <Pagination {...this.state.pagedNotes.pagination} tags={[]}/>
        <OperationPanel user={this.props.visitor}/>
      </div>
    );
  }
}

export default NoteList;
