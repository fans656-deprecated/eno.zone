export default class Book {
  constructor(bookData) {
    this.bookData = bookData;
    this.iLine = 0;
    this.iCharInLine = 0;
    this.lines = bookData.data.lines;
  }

  atEnd = () => {
    return this.iLine >= this.lines.length;
  }

  position = (pos) => {
    if (pos == null) {
      pos = {};
    }
    let { iLine, iCharInLine } = pos;
    if (iLine != null) {
      this.iLine = iLine;
    }
    if (iCharInLine != null) {
      this.iCharInLine = iCharInLine;
    }
    return {
      iLine: this.iLine,
      iCharInLine: this.iCharInLine,
    };
  }

  line = (iLine) => {
    const lines = this.lines;
    return (iLine < 0 || iLine >= lines.length) ? '' : lines[iLine];
  }

  linesAfter = (count) => {
    let {iLine, iCharInLine} = this.position();
    const lines = [];
    for (let i = 0; i < count && iLine < this.lines.length; ++i) {
      let line = this.line(iLine++);
      if (i === 0 && iCharInLine) {
        line = line.substring(iCharInLine);
      }
      lines.push(line);
    }
    return lines;
  }

  linesBefore = (count) => {
    let {iLine, iCharInLine} = this.position();
    const lines = [];
    for (let i = 0; i < count && iLine >= 0; ++i) {
      let line = this.line(--iLine);
      if (i === 0 && iCharInLine) {
        line = line.substring(0, iCharInLine);
      }
      lines.unshift(line);
    }
    return lines;
  }

  isPartialLineAfter = () => {
    return this.iCharInLine !== 0;
  }

  isPartialLineBefore = () => {
    return this.iCharInLine !== 0;
  }
}
