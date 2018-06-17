import React from 'react';

const todo = `\
Edi
  preview all (;v)
  preview at caret (ctrl-d)
    image / formula
  upload (;u)
  paste image (ctrl-shift-v?)
  insert timestamp (;d)

  yy
  C
  D
  di' da' (single quote / double quote / back tick)
  ciw caw cw
  yiw yaw yw
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
  ctrl-j (newline without break current)

  bug: block caret width on Chinese characters
  bug: highlight multiple occurences in same line
    lineNode.html() overwrite previous highlight
  bug: searched word under caret is not highlighted
  bug: backspace/delete history

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
