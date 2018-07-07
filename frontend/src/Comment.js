import React from 'react';
import IconDelete from 'react-icons/lib/md/delete';

import { Icon } from './common';
import { deleteComment } from './util';

export default class Comment extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      avatarURL: '/file/anonymous.png',
    };
    const comment = props.comment;
    if (!comment.is_visitor) {
      //fetchData('GET', `/profile/${comment.username}/avatar`, res => {
      //  this.setState({avatarURL: res.avatar_url});
      //});
    }
  }

  doDelete = async () => {
    await deleteComment(this.props.note_id, this.props.comment.id);
    this.props.onDelete();
  }

  render() {
    const comment = this.props.comment;
    const ctime = new Date(comment.ctime);
    return (
      <div className="comment"
        style={{
          paddingBottom: '1em',
          display: 'block',
        }}
      >
        <div className="comment-header" style={{
          display: 'flex',
        }}>
          <div className="user" style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '.2em',
          }}>
            <img
              alt={comment.username}
              src={this.state.avatarURL}
              style={{
                width: 24, height: 24,
                borderRadius: '16px',
                marginRight: '.5em',
              }}
            />
            <span style={{
              position: 'relative',
              top: '.2em',
            }}>
              {comment.username}
            </span>
          </div>
          <span className="info" style={{marginLeft: 'auto',}}>
            <span className="datetime filter">
              {ctime.toLocaleString()}
            </span>
            {this.props.visitor.isOwner() &&
              <a className="hover-action delete-comment filter"
                style={{
                  position: 'relative',
                  top: '-0.1rem',
                  left: '0.5rem',
                }}
                onClick={ev => {
                  ev.preventDefault();
                  this.doDelete();
                }}
                title={`Delete comment ${comment.id}`}
              >
                <Icon type={IconDelete} size="small"/>
              </a>
            }
          </span>
        </div>
        <div className="comment-content">
          {comment.content.split('\n').map((line, i) =>
            <p key={i} style={{margin: '0'}}>{line}</p>)
          }
        </div>
      </div>
    )
  }
}
