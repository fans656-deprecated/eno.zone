import Surface from './surface';
import { Feed } from './constants';
import { noop } from './utils';

export default class CommandSurface extends Surface {
  constructor(editor, props) {
    super(editor, props);
    this.onCommandChange = props.onCommandChange || noop;
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
      case '<c-m>':
      case '<cr>':
        this.execute();
        return Feed.Handled;
    }
    return super.handleInputKeyFeed(key);
  }

  execute() {
    this.editor.executeCommand(this.content.text());
  }
}
