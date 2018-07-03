import Content from './content';
import Surface from './surface';
import { Mode, Feed } from './constants';

export default class ContentSurface extends Surface {
  constructor(text, editor, props) {
    super(editor, Object.assign(props || {}, {
      content: new Content(text || ''),
      mode: Mode.Normal,
    }));
    this.map(':', () => this.editor.prepareCommand(':'));
    this.map('/', () => this.editor.prepareCommand('/'));
    this.map('?', () => this.editor.prepareCommand('?'));
    this.map(';w', () => this.editor.save());
    this.map(';q', () => this.editor.saveAndQuit());
    this.map(';x', () => this.editor.quit());
    this.map('<c-d>', () => this.editor.preview());
    this.map(';j', () => this.editor.nextBuffer());
    this.map('<c-j>', () => this.scrollDown());
    this.map('<c-k>', () => this.scrollUp());
  }

  scrollDown() {
    this.onScrollDown();
    return Feed.Handled;
  }

  scrollUp() {
    this.onScrollUp();
    return Feed.Handled;
  }
}
