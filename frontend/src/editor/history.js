export default class History {
  constructor() {
    this.index = -1;
    this.ops = [];
  }

  push = async ({undo, redo}) => {
    let i = this.index;
    const ops = this.ops;
    const n = ops.length;
    i = ++this.index;
    if (i < n) {
      ops.splice(i);
    }
    this.ops.push({undo: undo, redo: redo});
    await redo();
  }

  pop = () => {
    if (this.index < 0) {
      return null;
    }
    return this.ops[this.index--];
  }

  undo = async () => {
    if (this.index < 0) {
      return false;
    }
    const {undo} = this.pop();
    await undo();
    return true;
  }

  redo = async () => {
    if (this.index === this.ops.length - 1) {
      return false;
    }
    const {redo} = this.ops[++this.index];
    await redo();
    return true;
  }
}
