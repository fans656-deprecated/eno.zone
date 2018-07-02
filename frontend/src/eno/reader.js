import {R} from './constants'

export default class Reader {
  constructor(text) {
    this.lines = text.split('\n');
    this.i = 0;
    this.nextLine();
  }

  pushback() {
    --this.i;
  }

  nextLine = () => {
    if (this.i >= this.lines.length) {
      this.line = null;
      return;
    }
    this.prevLine = this.line;
    this.line = this.lines[this.i++];
    this.indent = getIndent(this.line);
  }

  consumeNextBlankLine() {
    this.nextLine();
    if (this.line.length) {
      this.pushback();
    }
  }

  isPrevLineEmpty = () => {
    return this.prevLine != null && this.prevLine.length === 0;
  }
}

function getIndent(line) {
  const match = line.match(R.indent);
  if (match) {
    return match[0].length;
  } else {
    return 0;
  }
}
