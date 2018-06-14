import Quill from 'quill'

const Embed = Quill.import('blots/inline');

class Img extends Embed {
  static create(elem) {
    const node = super.create(elem);
    node.setAttribute('src', elem.src);
    console.log(node);
    //if (elem.width) node.setAttribute('width', elem.width);
    //if (elem.height) node.setAttribute('height', elem.height);
    //console.log('quill create', elem, node);
    return node;
  }
}

Img.blotName = 'img';
Img.tagName = 'img';

Quill.register(Img);
