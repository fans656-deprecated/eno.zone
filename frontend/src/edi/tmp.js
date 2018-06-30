const text = String.raw`
me 'food' feard that feed
me (
paren paren
) that
"paren paren" that
[paren paren] that
{paren paren} that
`.trim()
+ '\n`paren paren` that';

`
import $ from 'jquery';
import Content from './content';
import Surface from './surface';
export default class View extends React.Component {
and etc etc, like void
  constructor(props) {
    super(props);
    this.surface = props.surface;
  }

  activate = () => {
    this._takeInput();
  }

  deactivate = () => {
    this.hideCaret();
  }

  showCaret = () => {
    this.caret.show();
  }

  hideCaret = () => {
    this.caret.hide();
  }
`.trim();
`
if (foo.bar == /^and$/) {
hello world

  setCaretType = () => {
  }

  componentDidMount = () => {
  }

  render() {
    return (
      <div
        className={['view', this.props.className].join(' ')}
        ref={ref => this.viewDiv = ref}
      >
        <div
          className="text"
          ref={ref => this.textDiv = ref}
        >
          {this._renderContent(this.surface.content)}
        </div>
        <Caret ref={ref => this.caret = ref}/>
      </div>
    );
  }

  _renderContent = (content) => {
    const lineComponents = [];
    content.lines.forEach((line, iLine) => {
      if (lineComponents.length) {
        lineComponents.push(<br key={'br' + iLine}/>);
      }
      lineComponents.push(this._renderLine(line, iLine));
    });
    return lineComponents;
  }

  _renderLine = (line, iLine) => {
    if (line.text.length === 0) {
      return this._renderDummyLine(iLine);
    } else {
      return (
        <span className="line" key={iLine}>
          {this._renderElem(line.text, 0)}
        </span>
`.trim();

export default text;
