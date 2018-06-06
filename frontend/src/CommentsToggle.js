import React from 'react'
//import { Link } from 'react-router-dom'
//import ReactMarkdown from 'react-markdown'
//import IconEdit from 'react-icons/lib/md/mode-edit'
//import IconLink from 'react-icons/lib/md/link'
//import qs from 'qs'
import $ from 'jquery'

//import NoteTitle from './NoteTitle';
//import CommentList from './CommentList';

export default class CommentsToggle extends React.Component {
  componentDidMount() {
    this.syncCommentsToggleState(this.props);
  }

  componentWillReceiveProps(props) {
    this.syncCommentsToggleState(props);
  }

  syncCommentsToggleState = props => {
    if (props.isSingleView || props.commentsVisible) {
      $('.comments.toggle').addClass('toggled');
    } else {
      $('.comments.toggle').removeClass('toggled');
    }
  }

  render() {
    return (
      <div>
        <div className="comments toggle filter">
          <div className="clickable"
            onClick={this.props.onClick}
          >
            <a href="#number-of-comments" className="number"
              onClick={ev => ev.preventDefault()}
            >
              {this.props.numComments}&nbsp;
            </a>
            <span>Comments</span>
          </div>
        </div>
      </div>
    )
  }
}
