export default class Record {
  constructor() {
    this.ops = [];
    this.recording = false;
  }

  start = () => {
    this.ops = [];
    this.recording = true;
  }

  finish = () => {
    this.recording = false;
  }

  feedKey = (key) => {
    this.ops.push({
      type: 'key',
      value: key,
    });
  }

  feedText = (text) => {
    this.ops.push({
      type: 'text',
      value: text,
    });
  }
}
