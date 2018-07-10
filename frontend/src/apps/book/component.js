import React from 'react';

import App from '../app';

export default class Book extends App {
  constructor(props) {
    super(props);

    const note = this.note;
    console.log(note);
  }

  renderSingle() {
    const content = this.note.content();
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          background: 'white',
          width: '100%',
          color: '#aaa',
          background: '#222',
        }}
      >
        <div
          style={{
            maxWidth: '35em',
            margin: '0 auto',
          }}
        >
          <h1>雍正王朝</h1>
          <pre
            style={{
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              fontSize: '1.05rem',
              fontWeight: 100,
              lineHeight: 2,
              letterSpacing: '.1em',
              fontFamily: 'Microsoft YaHei',
            }}
          >
            {content}
          </pre>
        </div>
      </div>
    );
  }
}
