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
    if (text === ':' && this.contentSurface.hasSelection()) {
      text = ":'<,'>";
    }
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
    this.contentSurface.saveCaret();
    this.commandSurface.setText(text);
    this.activateSurface(this.commandSurface);
    this.updateUI();
    this.commandSurface.caret.toLastCol();
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

  onCommandChange = (cmd) => {
    if (cmd.startsWith('/') || cmd.startsWith('?')) {
      this._executeCommand(cmd);
    }
  }

  executeCommand(cmd) {
    this._executeCommand(cmd);
    this.switchToNormalMode();
  }

  _executeCommand(cmd) {
    if (cmd.length === 0) return;
    const type = cmd[0];
    cmd = cmd.substring(1);
    switch (type) {
      case '/':
        this.contentSurface.search(cmd);
        break;
      case '?':
        this.contentSurface.search(cmd, true);
        break;
      case ':':
        this._executeCommaCommand(cmd);
        break;
      default:
        break;
    }
  }

  _executeCommaCommand(cmd) {
    console.log('_executeCommaCommand', cmd);
    switch (cmd) {
      case 'w':
        console.log('write');
        return;
      case 'q':
        console.log('quite');
        return;
      default:
        break;
    }
    cmd = parseCommaCommand(cmd);
    if (!cmd.valid) return;
    switch (cmd.op) {
      case 's':
        this._executeReplace(cmd);
        return;
      default:
        break;
    }
  }

  _executeReplace(cmd) {
    if (cmd.selection) {
    } else {
      const {src, dst} = cmd;
      this.contentSurface.replace(src, dst);
    }
  }

  _squashHistory = () => {
    this.surfaces.forEach(surface => surface.history.squash());
  }
}

function parseCommaCommand(cmd) {
  const ret = {};
  if (cmd.startsWith(SELECTION_PREFIX)) {
    ret.selection = true;
    cmd = cmd.substring(SELECTION_PREFIX.length);
  } else {
    ret.selection = false;
  }
  if (cmd.startsWith(GLOBAL_PREFIX)) {
    ret.global = true;
    cmd = cmd.substring(GLOBAL_PREFIX.length);
  } else {
    ret.global = false;
  }
  if (cmd.length) {
    const op = cmd[0];
    switch (op) {
      case 's':
        ret.op = 's';
        parseReplaceCommand(ret, cmd.substring(1));
        break;
    }
  }
  ret.valid = true;
  return ret;
}

function parseReplaceCommand(ret, cmd) {
  if (cmd.length === 0) return;
  const sep = cmd[0];
  const parts = cmd.substring(1).split(sep);
  let src, dst, global;
  if (parts.length === 2) {
    ([src, dst] = parts);
  } else if (parts.length === 3) {
    ([src, dst, global] = parts);
  }
  ret.src = src;
  ret.dst = dst;
  ret.global = global === 'g';
}

const SELECTION_PREFIX = "'<,'>";
const GLOBAL_PREFIX = '%';
