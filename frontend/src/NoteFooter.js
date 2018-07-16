import React from 'react'
import { Link } from 'react-router-dom'
//import ReactMarkdown from 'react-markdown'
import IconEdit from 'react-icons/lib/md/mode-edit'
import IconLink from 'react-icons/lib/md/link'
import qs from 'qs'
//import $ from 'jquery'

//import NoteTitle from './NoteTitle';
import CommentList from './CommentList';
import CommentsToggle from './CommentsToggle';
//import Gallery from './Gallery';
//import LeetcodeStatistics from './LeetcodeStatistics';
import { Icon } from './common';
//import { getNote } from './util';

class NoteFooter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      note: this.props.note,
      commentsVisible: this.props.commentsVisible || false,
    };
  }

  toggleCommentsVisible = () => {
    this.setState(prevState => ({
      commentsVisible: !prevState.commentsVisible
    }))
  }

  render() {
    const note = this.props.note;
    const comments = note.comments || [];
    const ctime = new Date(note.ctime).toLocaleDateString()
    const tags = (note.tags || []).map((tag, i) => {
      let url = `/note?${qs.stringify({tags: [tag]})}`;
      return <a className="tag info"
        key={i}
        href={url}
      >
        {tag}
      </a>
    });

    return (
      <div className="footer">
        <div className="info-row info">
          <div className="column left">
            <CommentsToggle
              commentsVisible={this.state.commentsVisible}
              onClick={this.toggleCommentsVisible}
              numComments={comments.length}
              isSingleView={this.props.isSingleView}
            />
            {note.custom_url &&
              <a className="custom-url filter"
                href={note.custom_url}
                title={`Custom URL ${window.location.origin}${note.custom_url}`}
              >
                <Icon type={IconLink} size="small"/>
              </a>
            }
          </div>
          <div className="column right">
            <div className="tags filter" style={{marginRight: '1em'}}>
              {tags}
            </div>
            <div className="ctime datetime filter">
              <Link
                to={`/note/${note.id}`}
                title={new Date(note.ctime).toLocaleString()}
              >{ctime}</Link>
            </div>
            {window.visitor.isOwner() &&
                <a
                  className="edit-blog-link filter"
                  href={`/note/${note.id}/edit`
                      + (this.props.isSingleView ? '?back=true' : '')
                  }
                  title={`Edit note ${note.id}`}
                >
                  <Icon type={IconEdit} size="small"
                    className="blog-edit-icon"
                  />
                </a>
            }
          </div>
        </div>
        <CommentList
          visible={this.state.commentsVisible}
          visitor={window.visitor}
          comments={note.comments || []}
          note_id={note.id}
          onChange={this.props.onChange}
        />
      </div>
    )
  }
}

export default NoteFooter;
