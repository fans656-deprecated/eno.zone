import { Mode } from './constants'
import KeyMap from './keymap'

function install(editor) {
  const normal = new KeyMap();

  // navigation
  normal.add('h', editor.caretLeft);
  normal.add('l', editor.caretRight);
  normal.add('j', editor.caretDown);
  normal.add('k', editor.caretUp);

  normal.add('w', editor.wordRight);
  normal.add('b', editor.wordLeft);
  normal.add('e', editor.wordTail);

  normal.add('H', editor.caretHead);
  normal.add('L', editor.caretTail);

  normal.add('M', editor.toMatchedParen);
  normal.add('G', editor.gotoRow);

  // insert
  normal.add('i', editor.insertToInputMode);
  normal.add('I', editor.insertHeadToInputMode);

  normal.add('a', editor.appendToInputMode);
  normal.add('A', editor.appendTailToInputMode);

  normal.add('o', editor.appendLineToInputMode);
  normal.add('O', editor.prependLineToInputMode);

  // delete
  normal.add('x', editor.deleteChar);

  // history
  normal.add('u', editor.undo);
  normal.add('<c-r>', editor.redo);

  // misc
  normal.add('/', editor.searchToCommandMode);
  normal.add('?', editor.rsearchToCommandMode);
  normal.add(':', editor.switchToCommandMode);
  normal.add('<c-k>', editor.noop);

  // dynamic (gg, diw, etc..)
  normal.add('', editor.feedNormalCommand);

  const input = new KeyMap();
  input.add('<c-k>', editor.escape);
  input.add('<cr>', editor.insertLine);

  const command = new KeyMap();
  command.add('<c-k>', editor.escapeFromCommandMode);
  command.add('<c-j>', editor.executeCommand);

  return {
    [Mode.Normal]: normal,
    [Mode.Input]: input,
    [Mode.Command]: command,
  }
}

export default {
  install: install,
};
