import React from 'react';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

import { renderContent } from './utils';

export const Editor = ({editor, children}) => (
  <div
    className={editor._getEditorClassName()}
    ref={ref => editor.editor = ref}
  >
    {children}
  </div>
)

export const Content = ({editor, children}) => (
  <div
    className="content"
    tabIndex="0"
    ref={ref => editor.contentDiv = ref}
    onFocus={editor.onFocus}
    onClick={editor.onClick}
    onMouseDown={editor.onMouseDown}
    onMouseUp={editor.onMouseUp}
    onMouseMove={editor.onMouseMove}
    onMouseLeave={editor.onMouseLeave}
    onDragStart={editor.onDragStart}
    onPaste={editor.onPaste}
  >
    {children}
  </div>
)

export const Lines = ({editor}) => (
  <div className="lines" ref={ref => editor.linesDiv = ref}>
    {renderContent(editor.state._lines)}
  </div>
)

export const Caret = ({editor}) => (
  <div
    className={'caret ' + editor._caretClass()}
    ref={ref => editor.caretDiv = ref}
  >
    &nbsp;
  </div>
)

export const Input = ({editor}) => (
  <input
    className="input"

    ref={ref => editor.input = ref}
    onBlur={editor.onBlur}

    onKeyDown={editor.onKeyDown}

    onChange={editor.onInputChange}
    onCompositionStart={editor.onCompositionStart}
    onCompositionEnd={editor.onCompositionEnd}
  />
)

export const CommandBar = ({editor}) => (
  <div
    ref={ref => editor.commandDiv = ref}
    className={`command ${editor.inCommandMode() ? 'visible' : ''}`}
  >
    <span className="line command-text">:</span>
  </div>
)

export class Preview extends React.Component {
  render = () => {
    const editor = this.props.editor;
    const elem = editor.state.previewElem;
    if (!elem) {
      return null;
    }
    let component;
    switch (elem.type) {
      case 'image':
        component = <PreviewImage elem={elem}/>;
        break;
      case 'inline_formula':
        component = <PreviewFormula elem={elem}/>;
        break;
      default:
        return null;
    }
    return (
      <div className="preview">
        {component}
      </div>
    );
  }
}

class PreviewImage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: true,
    };
  }
  
  render = () => {
    const elem = this.props.elem;
    if (!this.state.loaded) {
      console.log('img load failed');
      return (
        <p className="img">Failed to load image</p>
      );
    }
    return (
      <img
        className="img"
        src={elem.value}
        alt={elem.value}
        onLoad={() => this.setState({loaded: true})}
        onError={() => this.setState({loaded: false})}
      />
    );
  }
}

const PreviewFormula = ({elem}) => {
  return (
    <div className="formula preview">
      <BlockMath>{elem.value}</BlockMath>
    </div>
  );
}
