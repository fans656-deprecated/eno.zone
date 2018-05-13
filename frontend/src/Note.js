import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import IconEdit from 'react-icons/lib/md/mode-edit'
import IconLink from 'react-icons/lib/md/link'
import qs from 'qs'
import $ from 'jquery'

import Comments from './Comments'
import Gallery from './Gallery'
import LeetcodeStatistics from './LeetcodeStatistics'
import { Icon } from './common';
import { getNote } from './util';

export default class Note extends Component {
  constructor(props) {
    super(props);
    this.state = {
      note: props.note,
    };
  }

  parse = note => {
    if (note.leetcode) {
      let leetcode;
      try {
        leetcode = JSON.parse(note.leetcode);
      } catch (e) {
        console.log(e);
        return;
      }
      const title = $(`<a href="${leetcode.url}"/>`)
        .append($(`<h2>Leetcode ${leetcode.title}</h2>`));
      const description = $(leetcode.description);
      this.preContent = title;
      this.afterContent = $('<div/>')
        .append($(`<a href="${leetcode.url}"><h2>Original Problem:</h2></a>`))
        .append(description);
    } else if (note.content.substring(0, 2) === '{\n') {
      const lines = note.content.split('\n');
      const iJsonEndLine = lines.indexOf('}');
      if (iJsonEndLine === -1) {
        return;
      }
      const jsonStr = lines.slice(0, iJsonEndLine + 1).join('\n');
      const json = JSON.parse(jsonStr);
      const content = lines.slice(iJsonEndLine + 1, lines.length).join('\n');
      if (json.type === 'gallery') {
        this.setState({
          replaceContent: (
            <div>
              <Gallery json={json}
                viewtype={this.props.isSingleView ? 'page' : 'item'}
                blogURL={note.custom_url || '/note/' + note.id}
              />
              <ReactMarkdown className="blog-content"
                source={content}
              />
            </div>
          ),
          replaceAll: this.props.isSingleView,
        });
      } else if (json.type === 'only-single-view') {
        if (this.props.isSingleView) {
          this.setState({
            replaceContent: (
              <ReactMarkdown className="blog-content"
                source={content}
              />
            ),
          });
        } else {
          this.setState({
            replaceContent: (
              <ReactMarkdown className="blog-content"
                source={json.placeholder}
              />
            ),
          });
        }
      } else if (json.type === 'leetcode-statistics') {
        this.setState({
          replaceContent: <div>
            <ReactMarkdown className="blog-content"
              source={content}
            />
            <LeetcodeStatistics
              title={json.title}
              content={content}
              isSingleView={this.props.isSingleView}
            />
          </div>
        });
      }
    }
  }

  async componentDidMount() {
    if (!this.state.note) {
      const note = await getNote({owner: this.props.owner, id: this.props.id});
      this.setState({note: note});
    }
  }

  render() {
    const note = this.state.note;
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    console.log(note);
    if (!note || !note.content) {
      return <h1>Invalid</h1>;
    }
    //this.parse(note);
    //$(`.blog#${note.id} .pre-content`).append(this.preContent);
    //$(`.blog#${note.id} .after-content`).append(this.afterContent);

    //if (this.state.replaceAll) {
    //  return this.state.replaceContent;
    //}
    const className = this.props.isSingleView ? 'single-blog-view' : ''
    return <div className={'blog ' + className} id={note.id}>
      <Title className="title" text={note.title}/>
      <div className="pre-content"/>
      {this.state.replaceContent ? this.state.replaceContent :
      <ReactMarkdown className="blog-content" source={note.content}/>
      }
      <div className="after-content"/>
      <Footer
        note={note}
        visitor={this.props.visitor}
        commentsVisible={this.props.commentsVisible || this.props.isSingleView}
        isSingleView={this.props.isSingleView}
      />
    </div>
  }
}

const Title = (props) => (
  props.text ? <h2>{props.text}</h2> : null
);

class Footer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      commentsVisible: this.props.commentsVisible || false,
      numComments: this.props.note.n_comments || 0,
    };
  }

  onCommentsChange = (comments) => {
    if (this.state.numComments !== comments.length) {
      this.setState({numComments: comments.length});
    }
    //this.setState(prevState => {
    //  if (prevState.numComments != comments.length) {
    //    return {numComments: comments.length};
    //  } else {
    //    return null;
    //  }
    //});
  }

  toggleCommentsVisible = () => {
    this.setState(prevState => ({
      commentsVisible: !prevState.commentsVisible
    }))
  }

  render() {
    const note = this.props.note;
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
              numComments={this.state.numComments}
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
            {this.props.visitor.isOwner() &&
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
        <Comments
          visible={this.state.commentsVisible}
          visitor={this.props.visitor}
          note={this.props.note}
          onChange={this.onCommentsChange}
        />
      </div>
    )
  }
}

class CommentsToggle extends Component {
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
