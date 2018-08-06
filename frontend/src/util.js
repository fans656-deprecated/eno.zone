import MD5 from 'js-md5'
import jwt_decode from 'jwt-decode';
import Cookies from 'js-cookie';
import qs from 'query-string';

import conf from './conf';
import User from './User';

export function info(message, ...args) {
  console.log('INFO: ' + message, ...args);
}

export function warn(message, ...args) {
  console.log('WARNING: ' + message, ...args);
}

export function error(message, ...args) {
  console.log('ERROR: ' + message, ...args);
}

export function _debug(message, ...args) {
  console.log('DEBUG: ' + message, ...args);
}

export let debug;
const DEBUG_ON = false;
if (DEBUG_ON) {
  debug = {
    warn: warn,
    error: error,
    debug: _debug,
    info: info,
  };
} else {
  debug = {
    warn: () => warn,
    error: () => error,
    debug: () => null,
    info: info,
  };
}
export const logger = debug;

export async function fetchData(method, url, data) {
  let options;
  [url, options] = prepareFetch(method, url, data);
  const resp = await fetch(url, options);
  if (resp.status === 200) {
    return await resp.text();
  } else {
    return null;
  }
}

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
    url = conf.origin + url;
  }
  data = data || {};

  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  headers.append('Accept', 'application/json');
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

export async function postComment(note_id, comment) {
  return await fetchJSON('POST', `/api/note/${note_id}/comment`, comment);
}

export async function deleteComment(note_id, comment_id) {
  const path = `/api/note/${note_id}/comment/${comment_id}`;
  return await fetchJSON('DELETE', path);
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

export function calcMD5(data) {
  return MD5.create().update(data).hex();
}

export function groupby(xs, getkey) {
  const xss = [];
  const cur = {key: undefined, xs: []};
  for (let i = 0; i < xs.length; ++i) {
    const x = xs[i];
    const key = getkey(x, i);
    if (cur.xs.length === 0) {
      cur.key = key;
      cur.xs.push(x);
    } else if (cur.key === key) {
      cur.xs.push(x);
    } else {
      xss.push(cur.xs);
      cur.key = key;
      cur.xs = [x];
    }
  }
  if (cur.xs.length) {
    xss.push(cur.xs);
  }
  return xss;
}

export function groupbyLeading(xs, pred) {
  const gs = [];
  let g = null;
  for (const x of xs) {
    if (pred(x)) {
      if (g) {
        gs.push(g);
      }
      g = [];
    }
    g.push(x);
  }
  gs.push(g);
  return gs;
}

export function interlace(xs, gen) {
  const ys = [];
  xs.forEach((x, i) => {
    if (ys.length) {
      ys.push(gen(x, i));
    }
    ys.push(x);
  });
  return ys;
}

export function isEditing() {
  const search = window.location.search;
  let editing = false;
  if (search.length) {
    const params = qs.parse(search.substring(1));
    editing = 'edit' in params;
  }
  return editing;
}
