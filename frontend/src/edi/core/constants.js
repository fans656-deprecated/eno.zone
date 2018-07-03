export const Mode = {
  Input: 'Input',
  Normal: 'Normal',
  Command: 'Command',
};

export const Feed = {
  Handled: 'Handled',
  Continue: 'Continue',
};

export const Visual = {
  Char: 'Char',
  Line: 'Line',
  Block: 'Block',
};

export const Insert = {
  Default: 'Default',
  Block: 'Block',
};

export const INDENT = '    ';

export const HELP = `
Normal:
  <c-m>   Replay record
  ;j      Next buffer
Input:
  <c-o>   Indent
  <c-d>   Unindent
  <c-l>   Caret right
====================================
Note meta sample
  tag: foo bar => tags: ['foo', 'bar']
  url: z.cn => urls: ['z.cn']
====================================
Normal:
  :       Enter command
  /       Search next
  ?       Search prev
Input:
  <c-k>   Escape
Command:
  :w      Save
  :q      Save and quit
`.trim();
