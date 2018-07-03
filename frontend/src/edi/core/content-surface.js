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
    this.map('<c-e>', () => this.editor.preview());
    this.map(';j', () => this.editor.nextBuffer());
    this.map('<c-j>', () => this.scrollDown());
    this.map('<c-k>', () => this.scrollUp());
    this.map('<c-f>', () => this.pageDown());
    this.map('<c-d>', () => this.pageUp());
    this.map('zt', () => this.putTop());
    this.map('zz', () => this.putCenter());
    this.map('zb', () => this.putBottom());
  }

  scrollDown() {
    this.onScrollDown();
    return Feed.Handled;
  }

  scrollUp() {
    this.onScrollUp();
    return Feed.Handled;
  }

  pageDown() {
    this.onPageDown();
    return Feed.Handled;
  }

  pageUp() {
    this.onPageUp();
    return Feed.Handled;
  }

  putTop() {
    this.onPutTop();
    return Feed.Handled;
  }

  putCenter() {
    this.onPutCenter();
    return Feed.Handled;
  }

  putBottom() {
    this.onPutBottom();
    return Feed.Handled;
  }
}
