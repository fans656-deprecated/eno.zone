import React from 'react';
import $ from 'jquery';
import 'jquery-ui-bundle';
import 'jquery-ui-bundle/jquery-ui.css';

import { fetchJSON } from './util';
import './admin.css';

export default class Admin extends React.Component {
  async componentDidMount() {
    if (!this.props.visitor.isAdmin()) {
      return;
    }
    let res = await fetchJSON('GET', '/api/admin/users');
    if (!res) return;
    this.users = res.users;

    this.loaded = true;
    this.setState({}, () => {
      $('.admin').tabs();
    });
  }

  render() {
    if (!this.props.visitor.isAdmin()) {
      return <h1>You're not admin</h1>;
    }
    if (!this.loaded) {
      return <h1>Loading...</h1>;
    }
    const userComps = this.users.map(this.renderUser);
    return (
      <div className="admin">
        <ul>
          <li><a href="#users">Users</a></li>
        </ul>
        <div id="users">
          <div className="users">{userComps}</div>
        </div>
      </div>
    );
  }

  renderUser(user, key) {
    return (
      <div key={key} className="user">
        <Field name="username" value={user.username} readonly={true}/>
        <Field name="hashed_password" value={user.hashed_password} readonly={true}/>
        <Field name="salt" value={user.salt} readonly={true}/>
        <Field name="ctime" value={user.ctime} readonly={true}/>
        <Field name="groups" value={user.groups}/>
        {user.avatar_url &&
            <Field name="avatar_url" value={user.avatar_url}/>
        }
      </div>
    );
  }
}

const Field = (props) => {
  const name = props.name;
  const value = props.value;
  const readonly = props.readonly;
  return (
    <div
      style={{
        fontSize: '.8em',
      }}
    >
      <span
        style={{
          width: '8em',
          display: 'inline-block',
          textAlign: 'right',
        }}
      >{name}</span>&nbsp;
      <input
        defaultValue={value}
        readOnly={readonly}
        style={{
          width: '40em',
        }}
      />
    </div>
  );
}
