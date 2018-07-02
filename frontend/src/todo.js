import React from 'react';

const todo = `\
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
