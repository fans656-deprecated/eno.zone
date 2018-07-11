import qs from 'query-string';

import { debug } from './util';
import conf from './stome/conf';

//eslint-disable-next-line
const globalScope = self;
const location = globalScope.location;
const origin = location.origin;
conf.origin = origin;

const urlToDownloadConfig = {};

globalScope.addEventListener('install', (ev) => {
  ev.waitUntil(globalScope.skipWaiting());
});

globalScope.addEventListener('activate', (ev) => {
  ev.waitUntil(globalScope.clients.claim());
});

globalScope.addEventListener('message', (ev) => {
  const message = ev.data;
  const op = message.op;
  if (!op) {
    debug.error('service worker received invalid message: no `op` specified', message);
    return;
  }
  // used in ./stome/Explorer.js
  // when double click on file, meta is already known
  // so no need to request backend for it
  // instead add it here then following url request can use
  if (op === 'add-download-config') {
    addDownloadConfig(message);
  }
  const port = ev.ports[0];
  if (port) {
    port.postMessage(true);
  }
});

globalScope.addEventListener('fetch', async (ev) => {
  const request = ev.request;
  const method = request.method;
  if (method !== 'GET') {
    // only handle request like GET /res/img/girl.jpg?width=32
    debug.debug('GET request is pass through', request);
    return;
  }
  const url = new URL(request.url);
  if (url.host !== location.host) {
    // only handle same host
    debug.debug('Other origin request is pass through', request);
    return;
  } else if (!url.pathname.startsWith(conf.stomePrefixWithSlash)) {
    // only handle path starts with '/res/'
    // this leave '/res' to stome UI
    debug.debug('Non res request is pass through', request);
    return;
  }
  const params = qs.parse(url.search.substring(1));
  if ('op' in params) {
    // leave request like /res/img?op=ls
    debug.debug('Request with op is pass through', request);
    return;
  }
  if ('no-sw' in params) {
    debug.debug('Request with no-sw is pass through', request);
    return;
  }
  const downloadConfig = urlToDownloadConfig[url];
  if (downloadConfig) {
    debug.debug('has downloadConfig', downloadConfig);
    const {meta, content} = downloadConfig;
    ev.respondWith(new Promise(async (resolve) => {
      const res = await getResponse(meta, content);
      resolve(res);
    }));
  } else {
    debug.debug('no downloadConfig', request);
    const path = url.pathname.substring(conf.stomePrefix.length);
    ev.respondWith(new Promise(async (resolve) => {
      const meta = await getNodeMeta(path);
      if (meta.errno) {
        const res = new Response('', {
          status: 404,
          statusText: 'Not found',
        });
        resolve(res);
      } else {
        if (meta.listable) {
          // e.g. /res/home
          const rewrittenUrl = url + ('?' in url ? '&no-sw' : '?no-sw');
          resolve(await fetch(rewrittenUrl));
        } else {
          const content = await getQiniuContent(meta);
          const res = getResponse(meta, content);
          resolve(res);
        }
      }
    }));
  }
});

function addDownloadConfig(message) {
  const meta = message.meta;
  const config = getClientDownloadConfig(meta);
  if (config) {
    urlToDownloadConfig[config.url] = config;
  }
}

function getClientDownloadConfig(meta) {
  const content = meta.contents.find(
    c => c.type === 'qiniu' && c.status === 'done'
  );
  if (content) {
    return {
        url: encodeURI(conf.origin + conf.stomePrefix + meta.path),
        meta: meta,
        content: content,
    };
  }
}

function getResponse(meta, content) {
  return new Response(getStream(content), {
    headers: {
      'Content-Type': meta.mimetype,
      'Content-Length': meta.size,
    }
  });
}

function getStream(content) {
  const stream = new ReadableStream({
    start: async (controller) => {
      for (let chunk of content.chunks) {
        const url = await getDownloadUrl(content, chunk);
        await enqueueChunkData(controller, url);
      }
      controller.close();
    }
  });
  return stream;
}

async function getDownloadUrl(content, chunk) {
  const headers = makeFetchHeaders();
  const res = await fetch(
    conf.stomePrefix + '/?op=content-query', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        op: 'get-download-url',
        md5: content.md5,
        storage_id: content.storage_id,
        path: chunk.path,
      }),
      credentials: 'include',
    }
  );
  return (await res.json()).url;
}

async function enqueueChunkData(controller, url) {
  const res = await fetch(url);
  const reader = res.body.getReader();
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    invertBytes(value);
    controller.enqueue(value);
  }
}

function makeFetchHeaders() {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  return headers;
}

function invertBytes(bytes) {
  for (let i = 0; i < bytes.length; ++i) {
    bytes[i] = ~bytes[i];
  }
}

async function getNodeMeta(path) {
  const res = await fetch(conf.stomePrefix + path + '?op=meta');
  return await res.json();
}

async function getQiniuContent(meta) {
  return meta.contents.find(c => c.type === 'qiniu');
}
