import Surface from './surface';
import ContentSurface from './content-surface';
import CommandSurface from './command-surface';
import Record from './record';
import { Mode, Feed, HELP } from './constants';

export default class Editor {
  constructor(text, updateUI) {
    this.updateUI = updateUI || (() => null);

    this.contentSurface = new ContentSurface(text, this);
    this.commandSurface = new CommandSurface(this, {
      onCommandChange: this.onCommandChange,
    });
    this.editingMeta = false;

    this.bufferSurfaces = [['content', this.contentSurface]];
    this.bufferIndex = 0;
    this.surfaces = [
      this.contentSurface,
      this.commandSurface,
    ];

    this.record = new Record(this);

    this.mode = null;
    this.activeSurface = null;
    this.switchToNormalMode();
  }

  open(fname, text) {
    const bufferSurfaces = this.bufferSurfaces;
    bufferSurfaces.push([fname, new ContentSurface(text, this)]);
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

  nextBuffer() {
    const bufferSurfaces = this.bufferSurfaces;
    let i = this.bufferIndex;
    i = (i + 1) % bufferSurfaces.length;
    this.bufferIndex = i;
    this.contentSurface = bufferSurfaces[i][1];
    this.activateSurface(this.contentSurface);
    this.updateUI();
    return Feed.Handled;
  }

  prepareCommand = (text) => {
    if (text === ':' && this.contentSurface.hasSelection()) {
      text = ":'<,'>";
    }
    this.switchToCommandMode(text);
    return Feed.Handled;
  }

  buffersForSave() {
    const buffers = {};
    for (const [fname, surface] of this.bufferSurfaces) {
      buffers[fname] = surface.content.text();
    }
    return buffers;
  }

  save() {
    if (this.onSave) this.onSave(this.buffersForSave());
    return Feed.Handled;
  }

  saveAndQuit() {
    if (this.onSaveAndQuit) this.onSaveAndQuit(this.buffersForSave());
    return Feed.Handled;
  }

  quit() {
    if (this.onQuit) this.onQuit();
    return Feed.Handled;
  }

  preview() {
    const contentSurface = this.contentSurface;
    const content = contentSurface.content;
    const [row, col] = contentSurface.caret.rowcol();
    const pre = content.text(0, 0, row, col);
    const aft = content.text(row, col);
    const text = pre + aft;
    if (this.onPreview) this.onPreview(text, pre, aft);
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
    switch (cmd) {
      default:
        if ('help'.startsWith(cmd)) {
          alert(HELP);
          return;
        }
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
