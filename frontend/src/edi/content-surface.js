import React from 'react';
import Surface from './surface';

export default class ContentSurface extends Surface {
  renderContent = (content) => {
    const currentRow = this.surface.caret.row + 1;
    const rows = this.surface.content.rows();
    const rowsDigits = Math.log10(rows);
    const lineComponents = [];
    content.lines.forEach((line, iLine) => {
      if (lineComponents.length) {
        lineComponents.push(<br key={'br' + iLine}/>);
      }
      const lineComp = this.renderLine(line, iLine);
      const row = iLine + 1;
      let lineNumber;
      const isCurrent = row === currentRow;
      if (isCurrent) {
        lineNumber = row;
      } else {
        lineNumber = Math.abs(row - currentRow);
      }
      lineComponents.push(
        <span key={iLine}>
          <span className="line-number" style={{
            display: 'inline-block',
            color: isCurrent ? '#888' : '#ccc',
            fontSize: '.9em',
            width: (rowsDigits * 0.8) + 'em',
            marginRight: '1em',
            textAlign: 'right',
          }}>{lineNumber}</span>
          <span>{lineComp}</span>
        </span>
      );
    });
    return lineComponents;
  }
}
