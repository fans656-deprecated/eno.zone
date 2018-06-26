export default class History {
  constructor() {
    this.index = -1;
    this.ops = [];
  }

  push = async ({undo, redo, executeRedo}) => {
    let i = this.index;
    const ops = this.ops;
    const n = ops.length;
    i = ++this.index;
    if (i < n) {
      ops.splice(i);
    }
    this.ops.push({undo: undo, redo: redo});
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
