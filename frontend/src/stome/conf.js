import {MB} from './constant'

//eslint-disable-next-line
const origin = self.location.origin;
const api_port = 3002;
const parts = origin.split(':');
if (parts.length > 2) parts.pop();
parts.push('' + api_port);
const api_origin = parts.join(':');

const conf = {
  origin: origin,
  api_origin: api_origin + '/res',
  chunk_size: 1 * MB,
  api_port: api_port,
  stomePrefix: '/res',
};
conf.stomePrefixWithSlash = conf.stomePrefix + '/';

export default conf;
