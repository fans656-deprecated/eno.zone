import React from 'react';

import { renderContent } from './utils';

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

export const Content = ({editor, children}) => (
  <div
    className="content"
    tabIndex="0"
    ref={ref => editor.contentDiv = ref}
    onFocus={editor.onFocus}
    onBlur={editor.onBlur}
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

export const Editor = ({editor, children}) => (
  <div
    className={editor._getEditorClassName()}
    ref={ref => editor.editor = ref}
  >
    {children}
  </div>
)
