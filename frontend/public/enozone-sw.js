const api_origin = 'https://ub:6001';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('fetch', (ev) => {
  const request = ev.request;
  const url = request.url;
  const parsedUrl = parseUrl(url);
  let path = parsedUrl.path;
  if (path.startsWith('/res/')) {
    path = path.slice(4);
    ev.respondWith(new Promise(async (resolve) => {
      try {
        const res = await getResponseByPath(path);
        resolve(res);
      } catch (e) {
        console.log(e);
        resolve(new Response('', {status: 404, statusText: 'not found'}));
      }
    }));
  }
});

function parseUrl(url) {
  const parts = url.split('/');
  const originParts = parts.slice(0, 3);
  const pathParts = parts.slice(3);
  return {
    origin: originParts.join('/'),
    path: '/' + pathParts.join('/'),
  };
}

async function getResponseByPath(path) {
  const meta = await getNodeMeta(path);
  const content = await getQiniuContent(meta);
  return getResponse(meta, content);
}

async function getNodeMeta(path) {
  const res = await fetch(api_origin + path + '?op=meta');
  return await res.json();
}

async function getQiniuContent(meta) {
  return meta.contents.find(c => c.type === 'qiniu');
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
    api_origin + '/?op=content-query', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        op: 'get-download-url',
        md5: content.md5,
        storage_id: content.storage_id,
        path: chunk.path,
      })
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
