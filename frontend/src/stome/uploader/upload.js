import * as qiniu from 'qiniu-js';

import api from '../api';
import { splitBaseName, calcMD5 } from '../util';

export const upload = async (path, file, config) => {
  config = config || {
    overwrite: false,
  };
  if (config.overwrite) {
    await api.delete_(path);
  }
  const md5 = await calcMD5(file);
  const meta = await api.post(path, {
    op: 'touch',
    md5: md5,
    size: file.size,
    mimetype: file.type,
  });
  const [dirpath, name] = splitBaseName(path);
  const qiniuConfig = {
    path: path,
    dirpath: dirpath,
    name: name,
    md5: md5,
    file: file,
    meta: meta,
  };
  const contents = meta.contents;
  if (contents.some(c => c.type === 'qiniu')) {
    qiniuUpload(qiniuConfig);
  }
}

async function qiniuUpload(config) {
  await new QiniuUpload(config).start();
}

class QiniuUpload {
  constructor(config) {
    this.content = config.meta.contents.find(c => c.type === 'qiniu');
    this.storage_id = this.content.storage_id;
    this.md5 = config.md5;
    this.file = config.file;
  }

  start = async () => {
    const {chunks} = await this.getUploadConfig();
    let loaded = 0;
    const onNewLoaded = (newLoaded) => {
      loaded += newLoaded;
    };
    for (let chunk of chunks) {
      chunk.loaded = 0;
      chunk.blob = await this.getEncryptedBlob(chunk);
      chunk.token = await this.getUploadToken(chunk);
      await this.doUpload(chunk, onNewLoaded);
    }
    this.finishUpload();
  }

  getUploadConfig = async () => {
    return await api.contentQuery(this, {
      'op': 'prepare-upload',
      'size': this.file.size,
    });
  }

  getEncryptedBlob = async (chunk) => {
    const blob = this.file.slice(chunk.offset, chunk.offset + chunk.size);
    const reader = new FileReader();
    const data = await new Promise((resolve) => {
      reader.onload = () => {
        resolve(reader.result);
      }
      reader.readAsArrayBuffer(blob);
    });
    const a = new Uint8Array(data);
    for (let i = 0; i < a.length; ++i) {
      a[i] = ~a[i];
    }
    return new Blob([a], {
      size: a.length,
      type: 'application/octet-stream',
    });
  }

  getUploadToken = async (chunk) => {
    const {token} = await api.contentQuery(this, {
      'op': 'get-upload-token',
      'path': chunk.path,
    });
    return token;
  }

  doUpload = async (chunk, onNewLoaded) => {
    await new Promise(resolve => {
      const observable = qiniu.upload(
        chunk.blob, chunk.path, chunk.token, {}, {}
      );
      observable.subscribe({
        next: ({total}) => {
          // qiniu upload chunk total is larger than actual blob size
          const loaded = (chunk.size * total.percent / 100).toFixed(0);
          const diff = loaded - chunk.loaded;
          chunk.loaded = total.loaded;
          onNewLoaded(diff);
        },
        error: (err) => {
          console.log('error', {
            'chunk': chunk,
            'err': err,
          });
          resolve(err);
        },
        complete: (res) => {
          resolve(res);
        },
      });
    });
  }

  finishUpload = async () => {
    await api.put('/?content', null, {
      'md5': this.md5,
      'storage_id': this.storage_id,
      'status': 'done',
    });
    console.log('finish upload');
  }
}
