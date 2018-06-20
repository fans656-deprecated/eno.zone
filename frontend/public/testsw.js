//eslint-disable-next-line
self.addEventListener('install', (ev) => {
  //eslint-disable-next-line
  self.skipWaiting();
  console.log(self);
});

//eslint-disable-next-line
self.addEventListener('message', (ev) => {
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
