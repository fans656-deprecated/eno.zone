export default class InputChange {
  constructor(surface) {
    this.surface = surface;
    this.reset();
  }

  beforeInput = () => {
    this.rowcolBeforeInput = this.surface.rowcol();
  }

  whenInput = () => {
    this.rowcolWhenInput = this.surface.rowcol();
  }

  reset = () => {
    this.rowcolBeforeInput = null;
    this.rowcolWhenInput = null;
    this.chars = [];
    this.preChars = [];
    this.aftChars = [];
    this.backspaceCount = 0;
    this.delCount = 0;
  }

  text = () => {
    return this.chars.join('');
  }

  preText = () => {
    return this.preChars.slice().reverse().join('');
  }

  aftText = () => {
    return this.aftChars.join('');
  }

  pushText = (text) => {
    this.chars.push(...text.split(''));
  }

  pushBackspace = (deletedChar) => {
    if (this.chars.length) {
      this.chars.pop();
    } else {
      this.preChars.push(deletedChar);
      ++this.backspaceCount;
    }
  }

  pushDel = (deletedChar) => {
    this.aftChars.push(deletedChar);
    ++this.delCount;
  }
}
