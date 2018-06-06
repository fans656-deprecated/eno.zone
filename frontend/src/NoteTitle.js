import React from 'react';

const NoteTitle = (props) => (
  props.text ? <h2>{props.text}</h2> : null
);

export default NoteTitle;
