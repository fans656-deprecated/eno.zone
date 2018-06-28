import clone from 'clone';

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
    const ops = clone(this.ops);
    for (const op of ops) {
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
