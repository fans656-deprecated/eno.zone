import jwt_decode from 'jwt-decode';
import Cookies from 'js-cookie';
import qs from 'query-string';

import conf from './conf';
import User from './User';

export async function fetchJSON(method, url, data) {
  let options;
  [url, options] = prepareFetch(method, url, data);
  const resp = await fetch(url, options);
  if (resp.status === 200) {
    return resp.json();
  } else {
    return null;
  }
}

function prepareFetch(method, url, data) {
  if (!url.startsWith('http')) {
    url = conf.backend_origin + url;
  }
  data = data || {};

  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  headers.append('Accept', 'application/json');
  if (conf.backend_origin.slice(5) !== 'https') {
    headers.append('Cache-Control', 'no-cache');
  }
  const options = {
    method: method,
    headers: headers,
    credentials: 'include',
  }

  if (method === 'POST' || method === 'PUT') {
    Object.assign(options, {
      body: JSON.stringify(data)
    });
  } else if ((method === 'GET' && data) || method === 'DELETE') {
    let args = [];
    Object.keys(data).forEach((key) => {
      let value = data[key];
      if (value !== undefined && value !== null) {
        if (value instanceof Array) {
          value = `[${value.map(encodeURIComponent).join(',')}]`;
        }
        const arg = encodeURIComponent(key) + '=' + encodeURIComponent(value);
        args.push(arg);
      }
    });
    if (args.length > 0) {
      url += '?' + args.join('&');
    }
  }
  return [url, options];
}

export async function getNote({owner, id}) {
  return await fetchJSON('GET', '/api/note/' + id);
}

export async function getPagedNotes({owner, page, size}) {
  return await fetchJSON('GET', '/api/note', {
    owner: owner.username,
    page: page,
    size: size,
  });
}

export async function putNote(note) {
  return await fetchJSON('PUT', `/api/note/${note.id}`, note);
}

export async function postNote(note) {
  return await fetchJSON('POST', '/api/note', note);
}

export async function deleteNote(note_id) {
  return await fetchJSON('DELETE', `/api/note/${note_id}`);
}

export function getVisitor() {
  const token = Cookies.get('token');
  if (token) {
    const user = jwt_decode(token);
    return new User(user);
  } else {
    return new User({username: ''});
  }
}

export function getOwner() {
  const domain = window.location.host.split(':')[0];
  const labels = domain.split('.');
  if (labels.length > 2) {
    return new User({username: labels[0]});
  } else {
    return new User({username: ''});
  }
}
