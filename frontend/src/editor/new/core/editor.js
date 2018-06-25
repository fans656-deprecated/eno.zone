import clone from 'clone';
import Content from './content';
import Surface from './surface';
import Record from './record';
import { Mode, Feed } from './constants';

export default class Editor {
  constructor(text, updateUI) {
    this.content = new Content(text);
    this.updateUI = updateUI || (() => null);

    this.record = null;
    this.lastRecord = null;

    this.contentSurface = new Surface(this, this.content, {mode: Mode.Normal});
    this.contentSurface.map(':', () => this.prepareCommand(':'));
    this.contentSurface.map('/', () => this.prepareCommand('/'));
    this.contentSurface.map('?', () => this.prepareCommand('?'));

    this.commandSurface = new Surface(this);
    this.commandSurface.onInputChange = this.onCommandChange;

    this.mode = null;
    this.activeSurface = null;
    this.switchToNormalMode();
  }

  isIn = (mode) => this.mode === mode

  feedKey = (key) => {
    if (this.record) {
      this.record.feedKey(key);
    }
    return this.activeSurface.feedKey(key);
  }

  feedText = (text) => {
    this.activeSurface.feedText(text);
    if (this.record) {
      this.record.feedText(text);
    }
  }

  prepareCommand = (text) => {
    this.switchToCommandMode(text);
    return Feed.Handled;
  }

  switchToInputMode = () => {
    this.mode = Mode.Input;
    this.contentSurface.switchToInputMode();
    this.activateSurface(this.contentSurface);
    this.updateUI();
  }

  switchToNormalMode = () => {
    this.mode = Mode.Normal;
    this.contentSurface.switchToNormalMode();
    this.activateSurface(this.contentSurface);
    this.updateUI();
  }

  switchToCommandMode = (text) => {
    this.mode = Mode.Command;
    this.commandSurface.setText(text);
    this.commandSurface.caret.toLastCol();
    this.activateSurface(this.commandSurface);
    this.updateUI();
  }

  activateSurface = (surface) => {
    if (this.activeSurface) {
      this.activeSurface.deactivate();
    }
    surface.activate();
    this.activeSurface = surface;
  }

  escape = () => {
    switch (this.mode) {
      case Mode.Command:
        this.switchToNormalMode();
        // prevent command surface escaping to normal mode
        return true;  
      case Mode.Input:
        this.switchToNormalMode();
        break;
      default:
        break;
    }
  }

  startRecording = () => {
    this.record = new Record();
    this.updateUI();
  }

  finishRecording = () => {
    this.record.ops.pop();  // pop last 'q'
    this.lastRecord = clone(this.record);
    this.record = null;
    this.updateUI();
  }

  replay = () => {
    if (this.lastRecord) {
      const ops = this.lastRecord.ops;
      for (const op of ops) {
        if (op.type === 'key') {
          this.feedKey(op.value);
        } else {
          this.feedText(op.value);
        }
      };
    }
  }

  onCommandChange = (text) => {
    //if (text.startsWith('/')) {
    //  const pattern = text.substring(1);
    //  console.log(`about to search |${pattern}|`);
    //  //this.contentSurface.search(text.substring(1));
    //}
  }
}
