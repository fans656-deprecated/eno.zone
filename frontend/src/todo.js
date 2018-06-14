import React from 'react';

const todo = `\
Edi
  select text (mouse)
  backspace to delete
  tab
  vim selection mode
    v - visual
    V - visual line
    ctrl-v - visual block

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
