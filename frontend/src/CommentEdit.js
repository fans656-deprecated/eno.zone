import React from 'react'
import { Link } from 'react-router-dom'
//import IconDelete from 'react-icons/lib/md/delete'

import { Button, Textarea } from './common';
import { postComment } from './util';

export default class CommentEdit extends React.Component {
  doPost = async () => {
    const content = this.textarea.val();
    if (content.length === 0) {
      alert('Empty?');
      return;
    }
    let comment = {
      content: content,
    };
    const visitor = this.props.visitor;
    if (visitor.isLoggedIn()) {
      comment.username = visitor.username;
    } else {
      comment.username = this.nameInput.value;
    }

    await postComment(this.props.note_id, comment);
    this.props.onChange();
    this.textarea.clear();
  }

  render() {
    const visitor = this.props.visitor;
    return (
      <div>
        <Textarea
          className="comment-edit"
          placeholder="Write your comment here..."
          submit={this.doPost}
          onKeyUp={({target}) => {
            target.style.height = '5px';
            target.style.height = target.scrollHeight + 15 + 'px';
          }}
          style={{
            boxSizing: 'border-box',
          }}
          ref={ref => this.textarea = ref}
        >
        </Textarea>
        <div style={{
          display: 'flex',
          //justifyContent: 'flex-end',
          width: '100%',
        }}>
          {!visitor.isLoggedIn() &&
            <div className="vistor-name-input-and-post-button">
              <input className="visitor-name"
                style={{
                  padding: '0 .4rem',
                }}
                type="text"
                placeholder="Who are you?"
                ref={ref => this.nameInput = ref}
              />
              <div style={{
                display: 'inline',
                fontSize: '.8em',
                color: '#aaa',
              }}>
                <span>&nbsp;or&nbsp;</span>
                <Link to="/register" style={{
                  color: '#777',
                }}>
                  Register
                </Link>
                <span>&nbsp;/&nbsp;</span>
                <Link to="/login" style={{
                  color: '#777',
                }}>
                  Login
                </Link>
              </div>
            </div>
          }
          <Button
            style={{
              marginLeft: 'auto',
              marginRight: '1px',
              boxShadow: '0 0 2px #aaa',
            }}
            onClick={this.doPost}>
            Post
          </Button>
        </div>
      </div>
    )
  }
}
