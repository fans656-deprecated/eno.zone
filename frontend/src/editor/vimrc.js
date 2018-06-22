import { Mode } from './constants'
import KeyMap from './keymap'

function install(editor) {
  // visual
  const visual = new KeyMap();

  visual.add('v', editor.toggleVisualMode);
  visual.add('h', editor.caretLeft);
  visual.add('l', editor.caretRight);
  visual.add('j', editor.caretDown);
  visual.add('k', editor.caretUp);

  visual.add('w', editor.wordRight);
  visual.add('b', editor.wordLeft);
  visual.add('e', editor.wordTail);

  visual.add('H', editor.caretHead);
  visual.add('L', editor.caretTail);

  visual.add('<c-k>', editor.escape);

  visual.add('', editor.feedVisualCommand);

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

  // visual
  normal.add('v', editor.doToggleVisual);
  normal.add('V', editor.doToggleLineVisual);
  normal.add('<c-v>', editor.doToggleBlockVisual);

  // misc
  normal.add('/', editor.searchToCommandMode);
  normal.add('?', editor.rsearchToCommandMode);
  normal.add(':', editor.switchToCommandMode);
  normal.add('<c-k>', editor.scrollUp);
  normal.add('<c-j>', editor.scrollDown);
  normal.add('<c-d>', editor.previewAtCaret);

  // custom
  normal.add(';w', editor.save);
  normal.add(';x', editor.quit);
  normal.add(';q', editor.saveAndQuit);
  normal.add(';u', editor.upload);
  normal.add(';v', editor.preview);

  // dynamic (gg, diw, etc..)
  normal.add('', editor.feedNormalCommand);

  const input = new KeyMap();
  input.add('<c-k>', editor.escape);

  input.add('<cr>', editor.pressEnter);
  input.add('<c-m>', editor.pressEnter);
  input.add('<c-j>', editor.pressEnter);

  input.add('<bs>', editor.pressBackspace);
  input.add('<c-h>', editor.pressBackspace);

  input.add('<del>', editor.pressDel);
  input.add('<c-e>', editor.pressDel);

  input.add('<c-a>', editor.selectAll);

  const command = new KeyMap();
  command.add('<c-k>', editor.escapeFromCommandMode);
  command.add('<c-j>', editor.executeCommand);

  return {
    [Mode.Normal]: normal,
    [Mode.Input]: input,
    [Mode.Command]: command,
    [Mode.Visual]: visual,
  }
}

export default {
  install: install,
};
