export function maybeFileDownload(request) {
  return true;
  if (request.headers.hasOwnProperty('X-Pass-Through-Service-Worker')) {
    return false;
  }
  if (request.method !== 'GET') return false;
  const url = request.url;
  if (url.indexOf('?') !== -1) return false;
  const path = getNodePath(url);
  if (path.startsWith('/static/')) return false;
  return true;
}

export function getClientDownloadConfig(meta, origin) {
  const content = meta.contents.find(
    c => c.type === 'qiniu' && c.status === 'done'
  );
  if (content) {
    return {
      url: origin + meta.path,
      config: {meta: meta, content, content},
    };
  }
}

export async function getResponseByPath(path) {
  const meta = await getNodeMeta(path);
  const content = await getQiniuContent(meta);
  return getResponse(meta, content);
}

export function getResponse(meta, content) {
  return new Response(getStream(content), {
    headers: {
      'Content-Type': meta.mimetype,
      'Content-Length': meta.size,
    }
  });
}

export function getNodePath(url) {
  return '/' + url.split('/').slice(3).join('/').split('?')[0];
}

export async function getNodeMeta(path) {
  const res = await fetch(api_origin + path + '?op=meta');
  return await res.json();
}

export async function getQiniuContent(meta) {
  return meta.contents.find(c => c.type === 'qiniu');
}

export function getStream(content) {
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

export async function getDownloadUrl(content, chunk) {
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

export async function enqueueChunkData(controller, url) {
  const res = await fetch(url);
  const reader = res.body.getReader();
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    invertBytes(value);
    controller.enqueue(value);
  }
}

export function makeFetchHeaders() {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  return headers;
}

export function invertBytes(bytes) {
  for (let i = 0; i < bytes.length; ++i) {
    bytes[i] = ~bytes[i];
  }
}
