import React from 'react';

import { fetchJSON } from './utils';

export default class Signup extends React.Component {
  doSignup = async (ev) => {
    ev.preventDefault();
    const username = this.username.value;
    const password = this.password.value;
    const confirmPassword = this.confirmPassword.value;
    if (!username.match(/[-_a-zA-Z0-9]+/)) {
      alert('Invalid username!');
      return;
    }
    if (username.length === 0) {
      alert('Username required!');
      return;
    }
    if (username.length > 255) {
      alert('Username too long!');
      return;
    }
    if (password.length === 0) {
      alert('Password required!');
      return;
    }
    if (password.value !== confirmPassword.value) {
      alert('Password mismatch!');
      return;
    }
    const res = await fetchJSON('POST', '/api/signup', {
      username: username,
      password: password,
    });
    if (res.errno) {
      alert(res.detail);
    } else {
      window.location.href = '/';
    }
  }

  render() {
    return (
      <div className="login-page">
        <form className="dialog" onSubmit={this.doSignup}>
          <h1>Sign up</h1>
          <input
            type="text"
            name="username"
            placeholder="Username"
            ref={input => this.username = input}
          />
          <input
            id="password"
            type="password"
            placeholder="Password" 
            ref={input => this.password = input}
          />
          <input
            id="confirm"
            type="password"
            placeholder="Confirm password" 
            ref={input => this.confirmPassword = input}
          />
          <button onClick={this.doSignup} className="primary">Sign up</button>
          <input style={{display: 'none'}} type="submit"/>
        </form>
      </div>
    );
  }
}
