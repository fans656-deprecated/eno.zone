import Surface from './surface';
import { Feed } from './constants';
import { noop } from './utils';

export default class CommandSurface extends Surface {
  constructor(editor, props) {
    super(editor, props);
    this.onCommandChange = props.onCommandChange || noop;
    this.lastExecutedCommand = '';
    this.history = new CommandHistory();
  }

  escape() {
    this.history.reset();
    super.escape();
  }

  feedKey(key) {
    const ret = super.feedKey(key);
    if (this.content.text().length === 0) {
      this.execute();
    }
    return ret;
  }

  feedText(text) {
    super.feedText(text);
    this.onCommandChange(this.content.text());
  }

  handleInputKeyFeed(key) {
    switch (key) {
      case '<c-j>':
      case '<cr>':
        this.execute();
        return Feed.Handled;
      case '<c-p>':
        if (!this.history.empty()) {
          this.content.setText(this.history.prev());
          this.caret.ensureValid();
        }
        return Feed.Handled;
      case '<c-m>':
        if (!this.history.empty()) {
          this.content.setText(this.history.next());
          this.caret.ensureValid();
        }
        return Feed.Handled;
      default:
        break;
    }
    return super.handleInputKeyFeed(key);
  }

  execute() {
    const cmd = this.content.text();
    this.history.push(cmd);
    this.editor.executeCommand(cmd);
  }
}

class CommandHistory {
  constructor() {
    this.cmds = [];
    this.index = 0;
  }

  push(cmd) {
    this.cmds.push(cmd);
    this.reset();
  }

  reset() {
    this.index = 0;
  }

  prev() {
    if (this.empty()) {
      return '';
    }
    const cmds = this.cmds;
    this.index = (this.index + cmds.length - 1) % cmds.length;
    const cmd = cmds[this.index];
    return cmd;
  }

  next() {
    if (this.empty()) {
      return '';
    }
    const cmds = this.cmds;
    this.index = (this.index + 1) % cmds.length;
    const cmd = cmds[this.index];
    return cmd;
  }

  empty() {
    return this.cmds.length === 0;
  }
}
