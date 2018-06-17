export default class KeyMap {
  constructor(callback) {
    this.root = {};
    this.current = this.root;
    this.defaultCallback = callback;
  }

  add = (keysStr, callback) => {
    if (keysStr.length === 0) {
      this.defaultCallback = callback;
    } else {
      if (keysStr.startsWith('<')) {
        this._add([keysStr], callback);
      } else {
        this._add(keysStr.split(''), callback);
      }
    }
  }

  reset = () => {
    this.current = this.root;
  }

  feed = (key) => {
    if (this.current.hasOwnProperty(key)) {
      this.current = this.current[key];
      if (this.current == null) {
        this.reset();
        return false;
      }
      if (typeof(this.current) === 'function') {
        this.current();
        this.current = this.root;
      }
      return true;
    } else if (this.defaultCallback) {
      const handled = this.defaultCallback(key);
      if (handled != null) {
        this.reset();
      } else {
        this.current = {};  // still use default next time
      }
      return handled;
    } else {
      this.reset();
      return false;
    }
  }

  _add = (keys, callback) => {
    let node = this.root;
    for (let i = 0; i < keys.length; ++i) {
      const key = keys[i];
      if (i === keys.length - 1) {
        node[key] = callback;
      } else {
        if (!node.hasOwnProperty(key)) {
          node[key] = {};
        }
        node = node[key];
      }
    }
  }
}
