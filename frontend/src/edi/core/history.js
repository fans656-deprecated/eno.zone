import { groupby } from './utils';

export default class History {
  constructor(surface) {
    this.surface = surface;
    this.index = -1;
    this.ops = [];
    this.squashOn = false;
  }

  push = async ({undo, redo, executeRedo, squashable}) => {
    let i = this.index;
    const ops = this.ops;
    const n = ops.length;
    i = ++this.index;
    if (i < n) {
      ops.splice(i);
    }
    const editor = this.surface.editor;
    squashable = squashable == null
      ? editor.isRecording() || editor.isReplaying()
      : squashable;
    this.ops.push({
      undo: undo,
      redo: redo,
      squashable: squashable || this.squashOn,
    });
    if (executeRedo !== false) {
      await redo();
    }
  }

  pop = () => {
    if (this.index < 0) {
      return null;
    }
    return this.ops[this.index--];
  }

  squash = () => {
    const ops = this.ops;
    if (ops.length === 0) return;
    const groups = groupby(ops, op => op.squashable);
    this.ops = [];
    for (const group of groups) {
      if (group[0].squashable) {
        this.ops.push({
          undo: () => {
            group.slice().reverse().forEach(op => op.undo());
          },
          redo: () => {
            group.forEach(op => op.redo());
          },
          squashable: false,
        });
      } else {
        this.ops.push(...group);
      }
    }
    this.index = Math.min(this.ops.length - 1, this.index);
  }

  undo = () => {
    if (this.index < 0) {
      return false;
    }
    const {undo} = this.pop();
    undo();
    return true;
  }

  redo = () => {
    if (this.index === this.ops.length - 1) {
      return false;
    }
    const {redo} = this.ops[++this.index];
    redo();
    return true;
  }
}
