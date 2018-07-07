import React from 'react';
import _ from 'lodash';
import { TextElem, NewLine } from './elem'

export default class Block {
  constructor() {
    this.elems = [];
  }

  addElem = (elem) => {
    this.elems.push(elem);
  }

  addElems = (elems) => {
    const lastElem = this.lastElem();
    if (lastElem && !lastElem.isBlock) {
      this.addElem(new NewLine());
    }
    this.elems = this.elems.concat(elems);
  }

  addLine = (line) => {
    this.addElems([new TextElem(line), new NewLine()]);
  }

  addRef = (ref) => {
    this.refs[ref.id] = ref;
  }

  plainText = () => {
    return this.elems.map(e => e.plainText()).join('');
  }

  json = () => {
    return this;
  }

  render() {
    const comps = this.elems.map((e, i) => {
      return e.setKey(i).render();
    });
    return <div className="note-content">{comps}</div>;
  }

  html = () => {
    return this.elems.map(e => e.html()).join('');
  }

  lastElem() {
    const elems = this.elems;
    return elems.length ? _.last(elems) : null;
  }
}
