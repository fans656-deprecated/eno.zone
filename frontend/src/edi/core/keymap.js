import { Feed } from './constants';

export default class KeyMap {
  constructor(defaultCallback) {
    this.defaultCallback = defaultCallback;
    this.root = new Node();
    this.node = null;
    this.reset();
  }

  reset = () => {
    this.node = this.root;
  }

  feed = (key) => {
    const node = this._getNode(this.node, [key]);
    if (node) {
      let handled = Feed.Continue;
      node.callbacks.forEach((callback) => {
        const callbackHandled = callback();
        if (callbackHandled) {
          handled = callbackHandled;
        }
      });
      if (!handled || handled !== Feed.Continue) {
        this.reset();
      } else {
        this.node = node;
      }
      return handled;
    } else if (this.defaultCallback) {
      return this.defaultCallback(key);
    }
  }

  add = (keys, func) => {
    if (typeof(keys) === 'string') {
      if (keys.startsWith('<')) {
        keys = [keys];
      } else {
        keys = keys.split('');
      }
    }
    if (keys.length) {
      const node = this._getNode(this.root, keys, {create: true});
      node.callbacks.push(func);
    }
  }

  _getNode = (root, keys, config) => {
    config = config || {};
    let node = root;
    for (let i = 0; i < keys.length; ++i) {
      const key = keys[i];
      if (!(key in node.children)) {
        if (config.create) {
          node.children[key] = new Node();
        } else {
          return null;
        }
      }
      node = node.children[key];
      if (config.callback) {
        config.callback(node);
      }
    }
    return node;
  }
};

class Node {
  constructor() {
    this.children = {};
    this.callbacks = [];
  }
}
