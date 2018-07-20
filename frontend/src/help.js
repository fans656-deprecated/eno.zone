const content = `
## Special notes

### Header links
Edit this [note: /header?edit] to change links in header

### Collections
Collections like "Blog" / "Diary" can be edited like [/diary?edit]
When a note has meta \`collections: ["diary"]\` then it will be in collection "Diary"

## Note Type

\`type: eno\`
\`type: markdown\`
\`type: book\`
\`type: balance\`
\`type: stock\`
\`type: collection\`
\`type: nav\`

## Note Elements

### Image

\`[/res/img/girl.jpg]\`

### Inline code

### Block code

### Video
`.trim();

export const helpNote = {
  owner: 'fans656',
  id: '0',
  ctime: '2018-07-18 23:36:16 UTC',
  type: 'eno',
  content: content,
};
