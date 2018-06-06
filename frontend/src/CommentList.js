import React, { Component } from 'react'
//import { Link } from 'react-router-dom'
//import IconDelete from 'react-icons/lib/md/delete'

import Comment from './Comment';
import CommentEdit from './CommentEdit';
//import User from './User';
//import { Icon, Textarea } from './common'
//import { fetchData } from './utils'

export default class CommentList extends Component {
  render() {
    if (!this.props.visible) {
      return null;
    }
    const comments = this.props.comments.map((comment, i) => {
      return <Comment
        key={i}
        comment={comment}
        visitor={this.props.visitor}
        note_id={this.props.note_id}
        onDelete={this.props.onChange}
      />
    });
    return <div className="comments-content">
      {comments}
      <CommentEdit
        visitor={this.props.visitor}
        note_id={this.props.note_id}
        onChange={this.props.onChange}
      />
    </div>
  }
}
