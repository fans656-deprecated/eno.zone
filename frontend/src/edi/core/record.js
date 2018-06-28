export default class Record {
  constructor(editor) {
    this.editor = editor;
    this.ops = [];
    this.recording = false;
    this.playing = false;
  }

  start = () => {
    this.ops = [];
    this.recording = true;
  }

  finish = () => {
    this.ops.pop();  // pop last 'q'
    this.recording = false;
  }

  play = () => {
    this.playing = true;
    for (const op of this.ops) {
      if (op.type === 'key') {
        this.editor.feedKey(op.value);
      } else {
        this.editor.feedText(op.value);
      }
    };
    this.playing = false;
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
