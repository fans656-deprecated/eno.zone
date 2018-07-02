import React, { Component } from 'react'
//import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
//import IconEdit from 'react-icons/lib/md/mode-edit'
//import IconLink from 'react-icons/lib/md/link'
//import qs from 'qs'
//import MarkdownIt from 'markdown-it'
//import hljs from 'highlightjs'
import $ from 'jquery'

import NoteTitle from './NoteTitle';
import NoteFooter from './NoteFooter';
import Gallery from './Gallery';
import LeetcodeStatistics from './LeetcodeStatistics';
//import { Icon } from './common';
import { getNote, extractYamlText } from './util';
import { parse as parseEno } from './eno/parse';

export default class Note extends Component {
  constructor(props) {
    super(props);
    this.state = {
      note: props.note || {},
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

  componentDidMount() {
    if (!this.state.note.content) {
      this.getNote();
    }
  }

  getNote = async () => {
    const note = await getNote({
      owner: this.props.owner, id: this.props.id
    });


    this.setState({note: note});
  }

  render() {
    const note = this.state.note;
    if (!note || !note.content) {
      return null;
    }

    const className = this.props.isSingleView ? 'single-blog-view' : ''

    let eno;
    if (note.type === 'eno') {
      let text = note.content;
      ({text} = extractYamlText(text));
      eno = parseEno(text);
      let app;
      const firstElem = eno.elems.length ? eno.elems[0] : null;
      eno.elems.forEach(elem => {
        if (elem.type === 'app') {
          elem.attrs.env = {
            isSingleView: this.props.isSingleView,
          };
        }
      });
      if (firstElem && firstElem.type === 'app') {
        app = firstElem;
        app.content = eno.elems.slice(1).map(e => e.plainText()).join('');
      }
      if (app && app.attrs.own === 'content') {
        eno = app;
      }
      if (app && app.attrs.display === 'client' && this.props.isSingleView) {
        return app.render();
      } else {
        return (
          <div className={'blog ' + className} id={note.id}>
            <NoteTitle className="title" text={note.title}/>
            {eno.render()}
            <NoteFooter
              note={note}
              visitor={this.props.visitor}
              commentsVisible={
                this.props.commentsVisible || this.props.isSingleView
              }
              isSingleView={this.props.isSingleView}
              onChange={this.getNote}
            />
          </div>
        );
      }
    } else {
      this.parse(note);
      $(`.blog#${note.id} .pre-content`).append(this.preContent);
      $(`.blog#${note.id} .after-content`).append(this.afterContent);
      if (this.state.replaceAll) {
        return this.state.replaceContent;
      }
      return (
        <div className={'blog ' + className} id={note.id}>
          <NoteTitle className="title" text={note.title}/>
          <div className="pre-content"/>
          {this.renderOld(note)}
          <div className="after-content"/>
          <NoteFooter
            note={note}
            visitor={this.props.visitor}
            commentsVisible={this.props.commentsVisible || this.props.isSingleView}
            isSingleView={this.props.isSingleView}
            onChange={this.getNote}
          />
        </div>
      );
    }
  }

  renderOld = (note) => {
    return <ReactMarkdown className="blog-content" source={note.content}/>;
  }
}
