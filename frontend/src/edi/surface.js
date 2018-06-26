import React from 'react';
import $ from 'jquery';
import Caret from './caret';
import { Mode } from './core/constants';

export default class Surface extends React.Component {
  constructor(props) {
    super(props);
    this.surface = props.surface;
  }

  activate = () => {
    this.updateCaretPosition();
    this.caret.show();
  }

  deactivate = () => {
    this.caret.hide();
  }

  componentDidUpdate = () => {
    this.updateCaretPosition();
  }

  render() {
    const classes = [this.props.className];
    if (this.surface.active) classes.push('active');
    return (
      <div
        className={['view', ...classes].join(' ')}
        ref={ref => this.viewDiv = ref}
      >
        <div
          className="text"
          ref={ref => this.textDiv = ref}
        >
          {this.renderContent(this.surface.content)}
        </div>
        <Caret ref={ref => this.caret = ref}/>
      </div>
    );
  }

  renderContent = (content) => {
    const lineComponents = [];
    content.lines.forEach((line, iLine) => {
      if (lineComponents.length) {
        lineComponents.push(<br key={'br' + iLine}/>);
      }
      lineComponents.push(this.renderLine(line, iLine));
    });
    return lineComponents;
  }

  renderLine = (line, iLine) => {
    if (line.text().length === 0) {
      return this.renderDummyLine(iLine);
    } else {
      const spans = line.spans.map(this.renderElem);
      return (
        <span className="line" key={iLine}>
          {spans}
        </span>
      );
    }
  }

  renderDummyLine = (iLine) => {
    return (
      <span className="line dummy" key={iLine}>
        {this.renderDummyElem()}
      </span>
    );
  }

  renderElem = (span, iElem) => {
    const classes = [];
    if (span.attrs.highlight) {
      classes.push('highlight');
    }
    if (span.attrs.selection) {
      classes.push('selection');
    }
    return (
      <span
        className={['elem', ...classes].join(' ')}
        key={iElem}
      >
        {span.text}
      </span>
    );
  }

  renderDummyElem = (iElem) => {
    return <span className="elem dummy" key={iElem}> </span>;
  }

  updateCaretPosition = () => {
    const rect = this.getCharRect(this.surface.caret);
    const caret = this.caret;
    let caretWidth;
    if (this.surface.isIn(Mode.Input)) {
      caretWidth = 1;
      caret.setBlock(false);
      caret.setBlink(true);
    } else {
      caretWidth = rect.width;
      caret.setBlock(true);
      caret.setBlink(false);
    }
    caret.setPosition(rect.left, rect.top);
    caret.setWidth(caretWidth);
    $(this.props.input).css({
      left: rect.x,
      top: rect.y,
    });
    caret.ensureVisible();
    if (this.surface.caret.row === 0) {
      this.viewDiv.scrollTop = 0;
    }
  }

  getCharRect = ({row, col}) => {
    const lineNode = $(this.textDiv).find('.line').get(row);
    const elemNodes = lineNode.children;
    let begCol = 0;
    let elemNode, textNode, offset;
    for (let i = 0; i < elemNodes.length; ++i) {
      elemNode = elemNodes[i];
      offset = col - begCol;
      textNode = elemNode.firstChild;
      const elemText = $(elemNode).text();
      const endCol = begCol + elemText.length;
      if (begCol <= col && col < endCol) {
        return this.getTextNodeRect(textNode, offset, offset + 1);
      }
      begCol = endCol;
    };
    return this.getTextNodeRect(textNode, offset, offset);
  }

  getTextNodeRect = (textNode, beg, end) => {
    const viewDiv = this.viewDiv;
    const viewRect = viewDiv.getBoundingClientRect();
    const range = new Range();
    range.setStart(textNode, beg);
    range.setEnd(textNode, end);
    const charRect = range.getBoundingClientRect();
    const x = charRect.x - viewRect.x;
    const y = charRect.y - viewRect.y;
    return {
      x: viewDiv.offsetLeft + x,
      y: viewDiv.offsetTop + y,
      left: x + viewDiv.scrollLeft,
      top: y + viewDiv.scrollTop,
      right: x + charRect.width,
      bottom: y + charRect.height,
      width: charRect.width,
      height: charRect.height,
    };
  }
}
