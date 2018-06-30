export default class Operand {
  constructor(surface, op) {
    this.surface = surface;
    this.op = op;
    switch (op.target) {
      case 'w':
        this.parseWord();
        break;
      case '(': case '[': case '{':
      case '`': case '"': case "'":
        const ch = op.target;
        this.parseClosingChars(ch, RIGHT_CLOSING_CHAR[ch]);
        break;
      default:
        break;
    }
    this.clear();
  }

  parseWord() {
    const surface = this.surface;
    const caret = surface.caret;
    const words = surface.currentLine().words();
    const [row, col] = caret.rowcol();
    for (let i = 0; i < words.length - 1; ++i) {
      const word = words[i];
      if (word.outBeg <= col && col < word.outEnd) {
        this.firstRow = this.lastRow = row;
        this.outBeg = word.outBeg;
        this.outEnd = word.outEnd;
        this.beg = word.beg;
        this.end = word.end;
        this.type = 'word';
        return;
      }
    }
  }

  parseClosingChars(leftChar, rightChar) {
    const surface = this.surface;
    const content = surface.content;
    const caret = surface.caret;
    let [row, col] = caret.rowcol();
    const [firstRow, firstCol] = content.findBefore(row, col, leftChar);
    if (leftChar === rightChar && col === firstCol) {
      // delete at right quote may need special handling
      // currently it's not working
      // this is for handle delete at left quote
      col = firstCol + 1;
    }
    const [lastRow, lastCol] = content.findAfter(row, col, rightChar);
    if (firstRow == null || lastRow === null) {
      return;
    }
    this.firstRow = firstRow;
    this.lastRow = lastRow;
    this.outBeg = firstCol;
    let outEndDiff = 0;
    if (leftChar === rightChar) {
      const text = content.line(lastRow)._text.substring(lastCol + 1);
      outEndDiff = text.match(/\s*/).length;
    }
    this.outEnd = lastCol + 1 + outEndDiff;
    this.beg = firstCol + 1;
    this.end = lastCol;
    this.found = true;
  }

  clear() {
    delete this.op;
    delete this.surface;
  }
}

const RIGHT_CLOSING_CHAR = {
  '(': ')',
  '[': ']',
  '{': '}',
  '`': '`',
  '"': '"',
  "'": "'",
};
