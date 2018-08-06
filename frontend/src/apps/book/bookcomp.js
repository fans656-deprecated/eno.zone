import React from 'react';
import zango from 'zangodb';
import qs from 'query-string';
import $ from 'jquery';

import App from '../app';
import Book from './book';
import { Display } from '../../constants';
import { info, warn, fetchData } from '../../util';
import './style.css';

const MAX_PAGE_LINE_COUNT = 500;

export default class BookComp extends App {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      error: false,
      book: null,
    };
  }

  componentDidMount = async () => {
    if (this.env.display !== Display.Single) {
      return;
    }
    $('header').remove();
    $('footer').remove();

    const note = this.note;
    const file = note.note.file;
    if (!file) {
      this.setState({error: true});
      return;
    }
    const book = await this.getBook(file);
    window.book = book;

    this.setState({
      book: book,
      loading: false,

      fontSize: 16,
      lineHeight: 1.8,
      letterSpacing: 2,
    });
    window.on('keydown', this.onKeyDown);
  }

  componentDidUpdate() {
    if (this.env.display !== Display.Single) {
      return;
    }

    const book = this.state.book;

    const { fontSize, lineHeight, letterSpacing } = this.state;
    this.paginizeBook(book, this.hiddenPageDiv,
      fontSize, lineHeight, letterSpacing
    );
  }

  renderInList() {
    const note = this.note.note;
    return (
      <div>
        <p>《{note.name}》</p>
        <p>{note.content}</p>
      </div>
    );
  }

  renderSingle() {
    if (this.state.error) {
      return <h1>Error loading</h1>;
    }
    if (this.state.loading) {
      return <h1>Loading...</h1>;
    }

    const body = $('body');
    const windowWidth = body.width();
    const windowHeight = body.height();

    const book = this.state.book;
    if (!book) return;

    const fontSize = this.state.fontSize;
    const lineHeight = this.state.lineHeight;
    const letterSpacing = this.state.letterSpacing;
    const lineHeightInPixel = fontSize * lineHeight;
    const nLines = (windowHeight * 0.9 / lineHeightInPixel).toFixed(0);
    const pageHeight = nLines * lineHeightInPixel;
    const pageDivStyle = {
      position: 'relative',
      font: `${fontSize}px Consolas`,
      width: 450,
      height: pageHeight,
      padding: 0,
      lineHeight: lineHeight,
      letterSpacing: letterSpacing,
      overflowY: 'hidden',
    };

    return (
      <div
        style={{
          background: '#222',
          color: '#ccc',
          height: '100vh',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
        >
          <div className="page-container"
            style={{
              padding: '.8em',
              background: '#eeeeee',
              color: '#222',
            }}
          >
            <div
              className="book-content"
              ref={ref => this.pageDiv = ref}
              style={pageDivStyle}
            />
            <div
              className="book-content"
              ref={ref => this.hiddenPageDiv = ref}
              style={Object.assign({}, pageDivStyle, {
                visibility: 'hidden',
                position: 'absolute',
                left: 0,
                top: 0,
              })}
            />
          </div>
        </div>
      </div>
    );
  }

  getDB = () => {
    return new zango.Db('enozone', {
      book: {
        file: true,
        content: true,
        data: true,
      },
    });
  }

  getBook = async (file) => {
    const query = qs.parse(window.location.search.substring(1));
    const bookCollection = this.getDB().collection('book');

    let bookData = await bookCollection.findOne({file: file});
    if (!bookData || !bookData.content || 'reload' in query) {
      const content = await fetchData('GET', file);
      if (!content) {
        this.setState({error: true});
        return;
      }
      bookData = await this.makeBookData(bookCollection, file, content);
    }

    if (!bookData.data || 'make' in query) {
      bookData = await this.makeBookData(bookCollection, file, bookData.content);
    }
    return new Book(bookData);
  }

  makeBookData = async (bookCollection, file, content) => {
    const data = this.processContent(content);
    const bookData = {
      _id: file,
      file: file,
      content: content,
      data: data,
    };
    await bookCollection.remove({_id: file});
    await bookCollection.insert([bookData]);
    return bookData;
  }

  processContent = (content) => {
    content = content.replace(/(\r\n)+/g, '\n');
    const lines = content.split('\n');
    return {
      processedContent: content,
      lines: lines,
    };
  }

  onKeyDown = (ev) => {
    switch (ev.key) {
      case 'j':
        this.nextPage();
        break;
      case 'k':
        this.prevPage();
        break;
      default:
        break;
    }
  }

  nextPage = () => {
    const book = this.state.book;
    //debug('nextPage', book.position());
    let loLinesCount = 0;
    let hiLinesCount = MAX_PAGE_LINE_COUNT;
    while (true) {
      const linesCount = ((loLinesCount + hiLinesCount) / 2).toFixed(0);
      const lines = book.linesAfter(linesCount);
      if (lines.length < linesCount) {
        break;  // at book end
      }
      const {usedLinesCount, lastLineUsedCharsCount} = this.populateLines(
        lines, book.isPartialLineAfter(),
      );
      const position = book.position();
      position.iLine += usedLinesCount;
      position.iCharInLine = lastLineUsedCharsCount;
      book.position(position);
      break;
    }
  }

  prevPage = () => {
    //this.state.book.prevPage();
    this.setState({});
  }

  populateLines = (lines, isPartialLineAfter) => {
    const pageDiv = $(this.pageDiv);
    const pageHeight = this.pageDiv.offsetHeight;

    pageDiv.empty();

    let linesCount = 0;
    let charsCount = 0;

    for (let i = 0; i < lines.length; ++i) {
      const line = lines[i];
      const paraSpan = $(`<span class="paragraph">${line}</span>`);
      if (i === 0 && isPartialLineAfter) {
        paraSpan.addClass('partial');
      } else {
        paraSpan.addClass('full');
      }
      pageDiv.append(paraSpan);
      pageDiv.append($('<br/>'));
      const paraElem = paraSpan[0];
      const paraTop = paraElem.offsetTop;
      const paraBottom = paraTop + paraElem.offsetHeight;
      ++linesCount;
      if (paraBottom > pageHeight) {
        if (paraTop < pageHeight) {
          // last paragraph is truncated, find out where
          //info('last paragraph truncated');
          --linesCount;
          let text = paraSpan.text();
          let reducedCharsCount = 0;
          while (text.length) {
            text = text.substring(0, text.length - 1);
            paraSpan.text(text);
            ++reducedCharsCount;
            const paraElem = paraSpan[0];
            const paraBottom = paraElem.offsetTop + paraElem.offsetHeight;
            if (paraBottom <= pageHeight) {
              break;
            }
          }
          charsCount = lines[linesCount].length - reducedCharsCount;
        } else {
          //info('whole line out of page');
          --linesCount;
          charsCount = 0;
        }
        break;
      }
    }
    return {
      usedLinesCount: linesCount,
      lastLineUsedCharsCount: charsCount,
    };
  }

  paginizeBook = (book, pageDiv, fontSize, lineHeight, letterSpacing) => {
    const pageWidth = pageDiv.offsetWidth;
    const pageHeight = pageDiv.offsetHeight;
    const pageConfig = {
      pageWidth: pageWidth,
      pageHeight: pageHeight,
      // font family
      // font weight
      fontSize: fontSize,
      lineHeight: lineHeight,
      letterSpacing: letterSpacing,
    };

    //const savedPosition = book.position();

    info('paginizeBook');
    book.position({iLine: 0, iCharInLine: 0});
    const nLines = book.lines.length;
    //while (!book.atEnd()) {
    for (let i = 0; i < 1; ++i) {
      const position = book.position();
      const iLine = position.iLine;
      console.log(((iLine + 1) / nLines).toFixed(2) * 100 + '%');
      this.nextPage();
    }

    //book.position(savedPosition);
  }
}
