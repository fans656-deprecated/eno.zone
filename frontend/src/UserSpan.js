import React from 'react';
import { Link } from 'react-router-dom';

const UserSpan = ({user}) => (
  <span>
    {
      user.valid() ? <UserName user={user}/> : <Link to="/login">Login</Link>
    }
  </span>
);

const UserName = ({user}) => (
  <Link className="username" to={'/profile/' + user.username}>
    <div style={{
      display: 'inline-flex',
      alignItems: 'center', }}>
      <img className="avatar" src={user.avatar_url} height="28" style={{
        marginRight: 10,
        borderRadius: 16,
      }} alt=""/>
      <span>{user.username}</span>
    </div>
  </Link>
);

export default UserSpan;
