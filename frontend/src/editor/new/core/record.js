export default class Record {
  constructor() {
    this.ops = [];
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
