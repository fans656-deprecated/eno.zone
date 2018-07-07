import React from 'react';
import ReactMarkdown from 'react-markdown';
import $ from 'jquery';

import NoteTitle from '../NoteTitle';
import NoteFooter from '../NoteFooter';
import Gallery from '../Gallery';
import LeetcodeStatistics from '../LeetcodeStatistics';
import apps from '../apps';
import { Display } from '../constants';
import { parse as parseEno } from '../eno/parse';

export default class NoteComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      note: props.note,
    };
  }

  render() {
    const note = this.state.note.note;
    if (!note || !note.content) {
      return null;
    }

    const isSingleView = this.props.isSingleView;
    let comp;
    switch (note.type) {
      case 'eno':
        comp = this.renderEno(note);
        break;
      case 'markdown':
        comp = this.renderMarkdown(note);
        break;
      default:
        if (note.type in apps) {
          comp = this.renderApp(note);
          if (note.display === 'full' && isSingleView) {
            return comp;
          }
        } else {
          comp = this.renderUnknown(note);
        }
        break;
    }
    const className = isSingleView ? 'single-blog-view' : '';
    return (
      <div
        className={'blog ' + className}
        id={note.id}
      >
        <NoteTitle className="title" text={note.title}/>
        {comp}
        <NoteFooter
          note={note}
          visitor={this.props.visitor}
          commentsVisible={
            this.props.commentsVisible || this.props.isSingleView
          }
          isSingleView={this.props.isSingleView}
          onChange={this.onChange}
        />
      </div>
    );
  }

  renderEno(note) {
    let text = note.content;
    let eno = parseEno(text);
    return eno.render();
  }

  // legacy format
  renderMarkdown(note) {
    this.parseMarkdown(note);
    $(`.blog#${note.id} .pre-content`).append(this.preContent);
    $(`.blog#${note.id} .after-content`).append(this.afterContent);
    if (this.replaceAll) {
      return this.replaceContent;
    }
    return (
      <div>
        <div className="pre-content"/>
        <ReactMarkdown className="blog-content" source={note.content}/>
        <div className="after-content"/>
      </div>
    );
  }

  parseMarkdown(note) {
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
        Object.assign(this, {
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
          Object.assign(this, {
            replaceContent: (
              <ReactMarkdown className="blog-content"
                source={content}
              />
            ),
          });
        } else {
          Object.assign(this, {
            replaceContent: (
              <ReactMarkdown className="blog-content"
                source={json.placeholder}
              />
            ),
          });
        }
      } else if (json.type === 'leetcode-statistics') {
        Object.assign(this, {
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

  renderApp(note) {
    const app = apps[note.type];
    return React.createElement(app, {
      key: this.props.key,
      note: this.state.note,
      env: {
        display: this.props.isSingleView ? Display.Single : Display.InList,
      },
    });
  }

  renderUnknown(note) {
    return (
      <div>
        <h1>UNKNOWN NOTE TYPE "{note.type}"</h1>
        <pre>{JSON.stringify(note, null, 2)}</pre>
      </div>
    );
  }

  onChange = async () => {
    await this.state.note.update();
    console.log('onChange', this.state.note);
    this.setState({note: this.state.note});
  }
}
