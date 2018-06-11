import React from 'react'
import $ from 'jquery'
import katex from 'katex'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

import './edi.css'
import 'katex/dist/katex.min.css'

window.katex = katex;

export default class Edi extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      content: props.content || '',
    };
  }

  componentWillReceiveProps = (props) => {
    //this.setContent(props.content);
    $('.ql-editor')[0].onpaste = this.onPaste;
  }

  componentDidMount = () => {
    this.quill = new Quill(this.editor, {
      theme: 'snow',
      modules: {
        formula: true,
        toolbar: this.toolbar,
      },
    });
  }

  render() {
    return (
      <div
        className="editor"
        style={{display: this.props.visible ? 'block' : 'none'}}
      >
        {this.renderToolbar()}
        <div
          ref={ref => this.editor = ref}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
        />
      </div>
    );
  }

  getRichContent = () => {
    return this.quill.getContents();
  }

  getRawContent = () => {
    return this.quill.getText();
  }

  renderToolbar = () => {
    const rich = this.props.type === 'rich';
    return (
      <div
        className="toolbar buttons horizontal"
        ref={ref => this.toolbar = ref}
      >
        <div style={{visibility: rich && this.props.visible ? 'visible' : 'hidden'}}>
          <select className="ql-size" defaultValue="">
            <option value="small"></option>
            <option></option>
            <option value="large"></option>
            <option value="huge"></option>
          </select>
          <button className="ql-bold"></button>
          <button className="ql-script" value="sub"></button>
          <button className="ql-script" value="super"></button>
          <button className="ql-formula" value="super"></button>
        </div>
        <div className="right">
          {this.props.buttons}
        </div>
      </div>
    );
  }

  onPaste = (ev) => {
    const clipboardData = ev.clipboardData;
    const items = clipboardData.items;
    for (let i = 0; i < items.length; ++i) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        this.insertImage(file);
      }
    }
  }

  insertImage = (file, index) => {
    console.log('insert', file);
    const quill = this.quill;
    if (index == null) {
      const range = quill.getSelection(true);
      index = range ? range.index : 0;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target.result;
      quill.insertEmbed(index++, 'image', data);
      quill.insertText(index++, '\n');
      quill.setSelection(index);
    };
    reader.readAsDataURL(file);
  }

  setContent = (content) => {
    this.setState({content: content}, () => {
      this.quill.setContents(parseContent(content));
    });
  }

  onFocus = () => {
    $('.editor').addClass('focus');
  }

  onBlur = () => {
    $('.editor').removeClass('focus');
  }
};

const reMarkdownImage = /!\[.*\]\((.*)\)/;

function parseContent(content) {
  const ops = [];
  if (content.startsWith('![')) {
    ops.push({
      insert: {
        image: content.match(reMarkdownImage)[1],
      }
    });
  } else {
    ops.push({
      insert: content,
    });
  }
  const delta = {
    ops: ops,
  };
  //console.log(JSON.stringify(delta, null, 2));
  return delta;
}
