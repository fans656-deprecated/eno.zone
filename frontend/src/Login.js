import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import { fetchJSON } from './utils';

import './css/dialog.css';
import './css/Login.css';

class Login extends Component {
  render() {
    return (
      <div className="login-page">
        <form className="dialog" onSubmit={this.doLogin}>
          <h1>Login</h1>
          <input
            type="text"
            name="username"
            placeholder="Username"
            ref={input => this.username = input}
          />
          <input
            type="password"
            name="password"
            placeholder="Password" 
            ref={input => this.password = input}
          />
          <div>
            <button onClick={this.doLogin} className="primary">
              Login
            </button>
            <Link to="/signup" style={{float: 'left'}}>
              <button className="secondary">
                  Sign up
              </button>
            </Link>
          </div>
          <input style={{display: 'none'}} type="submit"/>
        </form>
      </div>
    );
  }

  doLogin = async (ev) => {
    ev.preventDefault();
    await fetchJSON('POST', '/api/login', {
      username: this.username.value,
      password: this.password.value,
    });
    window.location.href = '/';
  }
}

export default Login;
