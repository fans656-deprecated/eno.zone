import Content from './content';
import Surface from './surface';
import CommandSurface from './command-surface';
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

    this.surfaces = [
      this.contentSurface,
      this.commandSurface,
    ];

    this.record = new Record(this);

    this.mode = null;
    this.activeSurface = null;
    this.switchToNormalMode();
  }

  isIn = (mode) => this.mode === mode

  isRecording = () => this.record.recording
  isReplaying = () => this.record.playing

  feedKey = (key) => {
    if (this.isRecording() && !this.isReplaying()) {
      this.record.feedKey(key);
    }
    return this.activeSurface.feedKey(key);
  }

  feedText = (text) => {
    if (this.isRecording() && !this.isReplaying()) {
      this.record.feedText(text);
    }
    this.activeSurface.feedText(text);
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

  startRecord = () => {
    this.record.start();
    this.updateUI();
  }

  finishRecord = () => {
    this.record.finish();
    this._squashHistory();
    this.updateUI();
  }

  replay = () => {
    this.record.play();
    this._squashHistory();
  }

  onCommandChange = (text) => {
    if (text.startsWith('/')) {
      const pattern = text.substring(1);
      console.log(`about to search |${pattern}|`);
      //this.contentSurface.search(text.substring(1));
    }
  }

  _squashHistory = () => {
    this.surfaces.forEach(surface => surface.history.squash());
  }
}
