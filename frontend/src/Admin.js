import React from 'react';

import { fetchJSON } from './util';

export default class Admin extends React.Component {
  async componentDidMount() {
    if (!this.props.visitor.isAdmin()) {
      return;
    }
    let res = await fetchJSON('GET', '/api/admin/users');
    if (!res) return;
    this.users = res.users;

    this.loaded = true;
    this.setState({});
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
      <div>
        <h1>this is the admin page</h1>
        <div className="users">{userComps}</div>
      </div>
    );
  }

  renderUser(user, key) {
    return (
      <div key={key}>
        <pre>
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
    );
  }
}
