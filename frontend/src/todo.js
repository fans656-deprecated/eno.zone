import React from 'react';

const todo = `\
Edi
  ciw caw cw
  yiw yaw yw
  yy
  dd
  cc
  C
  D
  di' da' (single quote / double quote / back tick)

  custom normal cmd
    ;d ;u(upload)
  backspace to delete
    ctrl-h ctrl-m ctrl-j

  search (highlight)
  find character
    f F \
  macro (qq)
  normal cmd
    J
  tab (ctrl-i)
  vim selection mode
    v - visual
    V - visual line
    ctrl-v - visual block
  indent/unindent
    >> <<
  paste clipboard (ctrl-shift-v?)
  bug: block caret width on Chinese characters
  bug: highlight multiple occurences in same line
    lineNode.html() overwrite previous highlight
  bug: searched word under caret is not highlighted

Rich text edit

  paste clipboard image
  insert audio/video
  write math formula

  add a toolbar dropdown for multiple type
    markdown
    raw
    edi
  
  https://github.com/quilljs/awesome-quill

Move all files to stome
  files/...
  sina images
  xiami music
  youku video

Multi user stome access

Custom url

Custom domain name

Custom theme

jizhang

gallery

music

videos

books

leetcode statistics (react-echarts)
`;

const Todo = () => (
  <div style={{margin: '2em'}}>
    <pre>
      {todo}
    </pre>
  </div>
);

export default Todo;
