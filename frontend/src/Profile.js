import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'

import User from './User';
import { fetchData } from './utils'

class Profile extends Component {
  render() {
    const visitor = this.props.visitor;
    const user = new User({username: this.props.username});
    const isSelf = visitor['username'] == user['username'];
    return (
      <div className="profile center narrow center-children">
        {user && <div className="center-children">
          <h1>{this.props.username}</h1>
          <Avatar user={user}/>
        </div>}
        {isSelf && <button onClick={visitor.logout}>Logout</button>}
      </div>
    );
  }
}
export default Profile = withRouter(Profile);

class Avatar extends Component {
  changeAvatar = ({target}) => {
    const file = target.files[0];
    if (!file) {
      return;
    }
    if (!file.type.match(/^image/)) {
      alert('Unsupported file type');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      alert('File too large');
      return;
    }
    console.log(file);
    const reader = new FileReader();
    const user = this.props.user;
    reader.onload = ({target}) => {
      this.fileInput.value = null;
      const data = target.result;
      fetchData('POST', `/profile/${user.username}/avatar`, {
        'data': data,
      }, (data) => {
        this.img.src = data.avatar_url;
        user.avatar_url = data.avatar_url;
        user.onChange();
      });
    }
    reader.readAsDataURL(file);
  }

  render() {
    const user = this.props.user;
    return (
      <div className="avatar">
        <img
          className="large avatar"
          alt="Click to change"
          width="200" height="200"
          title="Click to change"
          src={user.avatar_url}
          style={{
            border: 'none',
            outline: 'none',
            margin: '1em',
            textAlign: 'center',
          }}
          onClick={() => this.fileInput.click()}
          ref={ref => this.img = ref}
        />
        <input type="file" style={{display: 'none'}}
          accept="image/*"
          ref={ref => this.fileInput = ref}
          onChange={this.changeAvatar}
        />
      </div>
    );
  }
}
