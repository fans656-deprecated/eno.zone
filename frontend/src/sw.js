//eslint-disable-next-line
const globalScope = self;
const location = globalScope.location;

globalScope.addEventListener('install', (ev) => {
  ev.waitUntil(globalScope.skipWaiting());
});

globalScope.addEventListener('activate', (ev) => {
  ev.waitUntil(globalScope.clients.claim());
});

globalScope.addEventListener('message', (ev) => {
  console.log('message', ev);
  const msg = ev.data;
  const op = msg.op;
  if (op === 'add-download-config') {
    //const meta = msg.meta;
    //const urlAndConfig = getClientDownloadConfig(meta, msg.origin);
    //if (urlAndConfig) {
    //  const {url, config} = urlAndConfig;
    //  url2config[url] = config;
    //}
  }
  const port = ev.ports[0];
  if (port) {
    port.postMessage(true);
  }
});

globalScope.addEventListener('fetch', async (ev) => {
  const request = ev.request;
  const url = new URL(request.url);
  let intercept = true;
  if (url.host !== location.host) {
    intercept = false;
  } else if (!url.pathname.startsWith('/res/')) {
    intercept = false;
  }
  if (intercept) {
    console.log('intercept', url);
  }
  //if (maybeFileDownload(request)) {
  //  const method = request.method;
  //  const url = request.url;
  //  console.log('sw: ' + method + ' ' + url);
  //  let url = decodeURI(request.url);
  //  ev.respondWith(new Promise(async (resolve) => {
  //    let res = null;
  //    if (url in url2config) {
  //      const {meta, content} = url2config[url];
  //      res = getResponse(meta, content);
  //    } else {
  //      const path = getNodePath(url);
  //      try {
  //        res = await getResponseByPath(path);
  //      } catch (e) {
  //        res = fetch(url, {
  //          headers: {'X-Pass-Through-Service-Worker': true}
  //        });
  //      }
  //    }
  //    resolve(res);
  //  }));
  //}
});
