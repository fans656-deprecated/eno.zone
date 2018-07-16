import Cookies from 'js-cookie';
import { fetchJSON } from './util';

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

  logout = async () => {
    //Cookies.remove('token');
    await fetchJSON('GET', '/api/logout');
    window.location.href = '/';
  }
}
