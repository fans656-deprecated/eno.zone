import Cookies from 'js-cookie';

export default class User {
  constructor(user) {
    Object.assign(this, user);
  }

  valid() {
    return this.username.length > 0;
  }

  isLoggedIn() {
    return this.valid();
  }

  isOwner() {
    return this.username === this.owner.username;
  }

  isAdmin() {
    // TODO: check if in 'root' group instead
    return this.username === 'fans656';
  }

  logout = () => {
    Cookies.remove('token');
    window.location.href = '/';
  }
}
