import React from 'react';

const todo = `\
Edi
  paste image
    upload to specific dir (/note-imgs/20180620231957-1251.png)
    upload progress
    stome user home dir
    make stome show uploaded file
  yy
  C
  D
  di' da' (single quote / double quote / back tick)
  ciw caw cw
  yiw yaw yw
  change until char (ct<)
  delete until char (dt<)
  normal cmd
    J
  vim selection mode
    v - visual
    V - visual line
    ctrl-v - visual block

  upload (;u)
  insert timestamp (;d)
  scroll without change cursor (<c-j> <c-k>)
  preview all (;v)

  search (highlight)
  find character
    f F \
  macro (qq)
  tab (ctrl-i)
  indent/unindent
    >> <<
  ctrl-j (newline without break current)

  bug: block caret width on Chinese characters
  bug: highlight multiple occurences in same line
    lineNode.html() overwrite previous highlight
  bug: searched word under caret is not highlighted
  bug: backspace/delete history
  bug: ctrl-x
  bug: ctrl-v multiple lines
  bug: mouse selection hover out
  bug: unloaded in preview image

Eno
  bug: code block at last line

stome
  sized image

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
