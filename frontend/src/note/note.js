import React from 'react';
import $ from 'jquery';
import yaml from 'js-yaml';

import {
  getNote, putNote, postNote, deleteNote, calcMD5,
} from '../util';
import Component from './component';

export default class Note {
  constructor(note) {
    this.setNote(note);
  }

  async fetch(owner, id) {
    const note = await getNote({
      owner: owner, id: id
    });
    this.setNote(note);
    return this;
  }

  href() {
    return `/note/${this.id()}`;
  }

  type() {
    return this.note.type;
  }

  update = async () => {
    await this.fetch(this.note.owner, this.note.id);
  }

  id() {
    return this.note.id;
  }

  setNote(note) {
    this.note = note;
  }

  valid() {
    return this.note != null;
  }

  invalid() {
    return !this.valid();
  }

  content() {
    return this.note.content;
  }

  setContent(content) {
    this.note.content = content;
  }

  metaContent() {
    return this.note.metaContent;
  }

  comments() {
    return this.note.comments;
  }

  ctime() {
    return this.note.ctime;
  }

  setMetaContent(metaContent) {
    this.note.metaContent = metaContent;
  }

  data() {
    return this.note.data;
  }

  setData(data) {
    if (jsonifiable(data)) {
      this.note.data = data;
      return true;
    } else {
      return false;
    }
  }

  setOwner(username) {
    this.note.owner = username;
  }

  async save() {
    const note = this.note;
    if (note.metaContent) {
      if (!this.extractMetaContent()) {
        return;
      }
    }
    if (note.id) {
      await putNote(note);
    } else {
      await postNote(note);
    }
  }

  async delete() {
    await deleteNote(this.note.id);
  }

  extractMetaContent() {
    try {
      const note = this.note;
      const notemeta = yaml.safeLoad(note.metaContent);
      const meta = parseNoteMeta(notemeta);
      Object.assign(note, meta);
      for (const key in note) {
        if (note[key] == null) {
          delete note[key];
        }
      }
      return true;
    } catch (e) {
      alert('Error in meta: ' + e);
      return false;
    }
  }

  isContentDirty() {
    const note = this.note;
    return this._isDirty(note.content, note.__contentHash);
  }

  hashContent() {
    const note = this.note;
    note.__contentHash = calcMD5(note.content);
  }

  _isDirty(data, hash) {
    if (hash == null) return true;
    return hash !== calcMD5(data);
  }

  render(props) {
    return <Component {...props} note={this}/>
  }
}

function jsonifiable(data) {
  try {
    JSON.stringify(data);
    return true;
  } catch (e) {
    return false;
  }
}

function parseNoteMeta(notemeta) {
  const meta = {};

  // these are not allowed to edit
  delete notemeta.id;
  delete notemeta.owner;
  delete notemeta.content;
  delete notemeta.metaContent;

  // tag: foo bar => tags: ['foo', 'bar']
  let tags = notemeta.tags || [];
  const _tag = notemeta.tag;
  if (_tag) {
    delete notemeta.tag;
    tags.push(..._tag.split(/\s+/));
  }
  if (tags) {
    meta.tags = tags;
  }

  // url: foo/bar => urls: ['foo/bar']
  const urls = notemeta.urls || [];
  const _url = notemeta.url;
  if (_url) {
    delete notemeta.url;
    urls.push(_url);
  }
  if (urls) {
    meta.urls = urls;
  }

  $.extend(meta, notemeta);
  if (typeof(meta.tags) === 'string') {
    meta.tags = meta.tags.split(' ');
  }
  return meta;
}

