import React, { Component } from 'react';

import { ViewBlog } from './Blogs';
import { fetchData } from './utils'

export default class CustomUrlPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      res: null,
    };
  }

  componentWillReceiveProps(props) {
    const path = props.match.url;
    const setState = res => this.setState({res: res});
    if (path) {
      fetchData('GET', '/api/custom-url' + path, setState, setState);
    }
  }

  render() {
    if (!this.state.res) {
      return null;
    } else {
      const res = this.state.res;
      if (res.errno) {
        return <div style={{
          fontSize: '1em',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '70vh',
        }}>
          <div style={{textAlign: 'center'}}>
            <h1>{res.errno}</h1>
            <p>{res.detail}</p>
          </div>
        </div>
      } else if (res.type === 'blog') {
        return (
          <ViewBlog blog={res.blog} user={this.props.user}
            registerConsoleHandler={this.props.registerConsoleHandler}
          />
        )
      } else {
        return <pre>{res.detail}</pre>
      }
    }
  }
}
