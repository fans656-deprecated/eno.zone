const content = `
# Special notes

### Header links
Edit this [note: /header?edit] to change links in header

### Collections
Collections like "Blog" / "Diary" can be edited like [/diary?edit]
When a note has meta \`collections: ["diary"]\` then it will be in collection "Diary"

# Note Type

\`type: eno\`
\`type: markdown\`

## book
\`type: book\`
\`file: /res/book/雍正王朝.txt\`

Supported file types: txt, pdf

## balance
\`type: balance\`
\`type: stock\`
\`type: collection\`
\`type: nav\`

# Note Attrs

display: client / full

# Note Elements

## Image

\`[/res/img/girl.jpg]\`

## Inline code

## Block code

## Video

# Edi

<c-o>     Indent
<c-d>     Unindent
`.trim();

export const helpNote = {
  owner: 'fans656',
  id: '0',
  ctime: '2018-07-18 23:36:16 UTC',
  type: 'eno',
  content: content,
};
