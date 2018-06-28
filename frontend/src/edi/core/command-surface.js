import Surface from './surface';
import { noop } from './utils';

export default class CommandSurface extends Surface {
  constructor(editor, props) {
    super(editor, props);
    this.onCommandChange = props.onCommandChange || noop;
  }

  feedText(text) {
    super.feedText(text);
    this.onCommandChange(this.content.text());
  }
}
