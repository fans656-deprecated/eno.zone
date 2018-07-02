import KeyMap from './keymap';
import { Feed } from './constants';
import { isDigit } from './utils';

export default class Normal {
  constructor(surface, keymap) {
    this.surface = surface;
    this.reset();
    this.keymap = keymap || new KeyMap();
  }

  reset = () => {
    this.operationDigits = [];
    this.operandDigits = [];
    this.operation = null;
    this.move = null;
    this.target = null;
    this.state = State.OperationCount;
  }

  feed = (key) => {
    if (this.state === State.OperationCount) {
      const handled = this.tryHandleCustomKey(key);
      if (handled) {
        return handled;
      }
    }
    switch (this.state) {
      case State.OperationCount:
        if (this.parseOperationCount(key)) {
          return Feed.Handled;
        }
        // falls through
      case State.Operation:
        if (this.parseOperation(key)) {
          return Feed.Handled;
        }
        // falls through
      case State.OperandCount:
        if (this.parseOperandCount(key)) {
          return Feed.Handled;
        }
        // falls through
      case State.Move:
        if (this.parseMove(key)) {
          return Feed.Handled;
        }
        // falls through
      case State.Target:
        if (this.parseTarget(key)) {
          return Feed.Handled;
        }
        // falls through
      default:
        this.reset();
        break;
    }
  }

  tryHandleCustomKey = (key) => {
    if (this.keymap) {
      const handleState = this.keymap.feed(key);
      if (handleState) {
        this.state = State.Custom;
        if (handleState !== 'continue') {
          this.reset();
        }
        return Feed.Handled;
      }
    }
  }

  execute = () => {
    const operationCount = digitsToCount(this.operationDigits);
    const operandCount = digitsToCount(this.operandDigits);
    const operation = this.operation;
    const move = this.move;
    const target = this.target;

    // must reset before execNormal, otherwise will be recursive
    this.reset();

    this.surface.execNormal({
      operationCount: operationCount,
      operandCount: operandCount,
      operation: operation,
      move: move,
      target: target,
      count: operationCount * operandCount,
    });
  }

  parseOperationCount = (key) => {
    if (this.parseCount(key, this.operationDigits)) {
      return Feed.Handled;
    } else {
      this.state = State.Operation;
      return false;
    }
  }

  parseOperation = (key) => {
    switch (key) {
      case 'p': case 'P':
      case 'i': case 'I':
      case 'a': case 'A':
      case 'o': case 'O':
      case 's': case 'S':
      case 'D': case 'C': case 'Y':
      case 'x': case 'r': case '~': case 'u':
      case 'v': case 'V': case '<c-v>':
      case '<c-r>': case '<c-k>':
      case '\\':
      case 'n': case 'N':
      case 'J':
      case '<c-C>':
        this.operation = key;
        this.execute();
        return Feed.Handled;
      case '<c-m>':
        this.operation = key;
        if (this.surface.editor.isRecording()) {
          console.log('warning: nested replay');
          this.reset();
        } else {
          this.execute();
        }
        return Feed.Handled;
      case 'd': case 'c': case 'y':
        this.operation = key;
        if (this.surface.hasSelection()) {
          this.execute();
          return Feed.Handled;
        }
        this.state = State.OperandCount;
        return Feed.Handled;
      case 'q':
        this.operation = key;
        if (this.surface.editor.isRecording()) {
          this.execute();
        } else {
          this.state = State.Target;
        }
        return Feed.Handled;
      default:
        break;
    }
  }

  parseOperandCount = (key) => {
    if (this.parseCount(key, this.operandDigits)) {
      return Feed.Handled;
    } else {
      this.state = State.Move;
      return false;
    }
  }

  parseMove = (key) => {
    switch (key) {
      case 'g':
        this.move = key;
        this.state = State.Target;
        return Feed.Handled;
      case 'f': case 'F': case 't':
        this.move = key;
        this.state = State.Target;
        return Feed.Handled;
      case 'h': case 'l': case 'j': case 'k':
      case 'H': case 'L': case 'G': case '^':
        this.move = key;
        this.execute();
        return Feed.Handled;
      default:
        break;
    }
    if (this.operation) {
      switch (key) {
        case 'i': case 'a':
          this.move = key;
          this.state = State.Target;
          return Feed.Handled;
        default:
          break;
      }
    }
  }

  parseTarget = (key) => {
    switch (key) {
      case 'w': case 'e': case 'b': case 'g':
        this.target = key;
        this.execute();
        return Feed.Handled;
      default:
        if (this.move === 'f' || this.move === 'F' || this.move === 't') {
          this.target = key;
          this.execute();
          return Feed.Handled;
        }
        break;
    }
    if (this.operation && key === this.operation && !this.move) {
      switch (key) {
        case 'd': case 'c': case 'y': case 'q':
          this.target = key;
          this.execute();
          return Feed.Handled;
        default:
          break;
      }
    }
    if (this.move === 't') {
      this.target = key;
      this.execute();
      return Feed.Handled;
    } else if (this.move === 'i' || this.move === 'a') {
      switch (key) {
        case '(': case '[': case '{': case '<':
        case '"': case "'": case '`':
          this.target = key;
          this.execute();
          return Feed.Handled;
        default:
          break;
      }
    }
  }

  parseCount = (key, digits) => {
    if (isDigit(key)) {
      digits.push(key);
      return Feed.Handled;
    } else {
      return false;
    }
  }
}

function digitsToCount(digits) {
  if (digits.length) {
    return parseInt(digits.join(''), 10);
  } else {
    return 1;
  }
}

const State = {
  OperationCount: 'operation-count',
  Operation: 'operation',
  OperandCount: 'operand-count',
  Move: 'move',
  Target: 'target',
  Custom: 'custom',
};
