import Content from './content';
import Surface from './surface';
import CommandSurface from './CommandSurface';
import Record from './record';
import { Mode, Feed } from './constants';

export default class Editor {
  constructor(text, updateUI) {
    this.updateUI = updateUI || (() => null);

    this.contentSurface = new Surface(this, {
      content: new Content(text),
      mode: Mode.Normal,
    });
    this.contentSurface.map(':', () => this.prepareCommand(':'));
    this.contentSurface.map('/', () => this.prepareCommand('/'));
    this.contentSurface.map('?', () => this.prepareCommand('?'));

    this.commandSurface = new CommandSurface(this, {
      onCommandChange: this.onCommandChange,
    });

    this.record = new Record();

    this.mode = null;
    this.activeSurface = null;
    this.switchToNormalMode();
  }

  isIn = (mode) => this.mode === mode

  isRecording = () => this.record.recording

  feedKey = (key) => {
    if (this.isRecording()) {
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
    this.record.start();
    this.updateUI();
  }

  finishRecording = () => {
    this.record.ops.pop();  // pop last 'q'
    this.record.finish();
    this.updateUI();
  }

  replay = () => {
    for (const op of this.record.ops) {
      if (op.type === 'key') {
        this.feedKey(op.value);
      } else {
        this.feedText(op.value);
      }
    };
  }

  onCommandChange = (text) => {
    //if (text.startsWith('/')) {
    //  const pattern = text.substring(1);
    //  console.log(`about to search |${pattern}|`);
    //  //this.contentSurface.search(text.substring(1));
    //}
  }
}
