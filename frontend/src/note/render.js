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

export default class Render {
  constructor(note, props) {
    Object.assign(this, props);
    this.note = note;
  }

  render() {
    const note = this.note;
    if (!note || !note.content) {
      return null;
    }

    const isSingleView = this.isSingleView;
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
          note={this}
          visitor={this.visitor}
          commentsVisible={
            this.commentsVisible || this.isSingleView
          }
          isSingleView={this.isSingleView}
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
                viewtype={this.isSingleView ? 'page' : 'item'}
                blogURL={note.custom_url || '/note/' + note.id}
              />
              <ReactMarkdown className="blog-content"
                source={content}
              />
            </div>
          ),
          replaceAll: this.isSingleView,
        });
      } else if (json.type === 'only-single-view') {
        if (this.isSingleView) {
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
              isSingleView={this.isSingleView}
            />
          </div>
        });
      }
    }
  }

  renderApp(note) {
    const app = apps[note.type];
    return React.createElement(app, {
      key: this.key,
      note: note,
      env: {
        display: this.isSingleView ? Display.Single : Display.InList,
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
}
