import Surface from './surface';

export default class CommandSurface extends Surface {
  feedText = (text) => {
    super.feedText(text);
    if (this.onCommandChange) {
      this.onCommandChange(this.content.text());
    }
  }
}
