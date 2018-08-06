import React from 'react';
import qs from 'query-string';
import $ from 'jquery';

import App from '../app';
import { Display } from '../../constants';
import { info, warn, fetchJSON } from '../../util';
import './style.css';

export default class BookComp extends App {
  constructor(props) {
    super(props);
    this.state = {
      books: [],
    };
  }

  componentDidMount = async () => {
    if (this.env.display !== Display.Single) {
      return;
    }
    const res = await fetchJSON('POST', '/api/query-note', {
      type: 'book',
    });
    let books = res.notes;
    const note = this.note.note;
    const subtype = note.subtype;
    switch (subtype) {
      case 'read':
        books = this.filterRead(books);
        break;
      default:
        break;
    }
    this.setState({
      books: res.notes,
    });
  }

  renderSingle() {
    let books = this.state.books;
    console.log(books);
    books = books.filter(book => {
      return book.name;
    });
    const readBooks = this.filterRead(books);
    return (
      <div
        className="book-shelf"
        style={{
          margin: '0 auto',
        }}
      >
        <div>
          <h1>在读的书</h1>
          {this.renderBookComps(this.filterReading(books))}
        </div>
        <div>
          <h1>想读的书</h1>
          {this.renderBookComps(this.filterWanna(books))}
        </div>
        <div>
          <h1>读过的书 (<span>{readBooks.length}</span>)</h1>
          {this.renderBookComps(readBooks)}
        </div>
      </div>
    );
  }

  renderBookComps = (books) => {
    books.sort((a, b) => {
      if (!a.begdate && !a.enddate) return b.id - a.id;
      if (!a.enddate) return 1;
      if (!b.enddate) return -1;
      if (new Date(a.enddate) > new Date(b.enddate)) {
        return -1;
      } else {
        return 1;
      }
    });
    return books.map((book, key) => {
      return (
        <div key={key}>
            <p
              style={{
              }}
            >
              <a href={`/note/${book.id}`}>
                <span className="author">{book.author}</span>
                <span className="name">{book.name}</span>
                <span className="beg date">{book.begdate}</span>
                <span className="end date">{book.enddate}</span>
              </a>
            </p>
        </div>
      );
    });
  }

  filterReading = (books) => {
    return books.filter(book => {
      if (book.begdate && !book.enddate) return true;
      return book.status && book.status.startsWith('reading');
    });
  }

  filterWanna = (books) => {
    return books.filter(book => {
      return (
        book.status === 'wanna'
        || (book.status || '').startsWith('want')
      );
    });
  }

  filterRead = (books) => {
    books = books.filter(book => {
      if (book.begdate && !book.enddate) return false;
      return (
        book.status === 'read'
        || book.status == null
      );
    });
    books.sort((a, b) => {
      if (a.id < b.id) return 1;
      return -11;
    });
    console.log(books);
    return books;
  }
}
