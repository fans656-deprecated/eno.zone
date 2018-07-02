const r = {};

// line elements
r.H1 = '(^# (?<h1>.*))';
r.H2 = '(^## (?<h2>.*))';
r.H3 = '(^### (?<h3>.*))';
r.H4 = '(^#### (?<h4>.*))';
r.H5 = '(^##### (?<h5>.*))';
r.H6 = '(^###### (?<h6>.*))';
r.HR = '(^(?<hr>---+.*))';
r.quote = '(^\\s*\\> (?<quote>.*)$)';

r.blockCodeBeg = '(^(?<_indent>\\s*)(?<blockCodeBeg>```(?<_lang>.*))$)';
r.blockCodeEnd = '(^\\s*(?<blockCodeEnd>```)$)';

r.htmlBeg = '(^(?<htmlBeg><div>)$)';
r.htmlEnd = '(^(?<htmlEnd></div>)$)';

r.appBeg = '(^(?<appBeg>\\{\\{)$)';
r.appEnd = '(^(?<appEnd>\\}\\})$)';

r.lineElement = [
  r.H1, r.H2, r.H3, r.H4, r.H5, r.H6, r.HR,
  r.quote,
  r.blockCodeBeg,
  r.htmlBeg,
  r.appBeg,
].join('|');

// chars
r.lb = '\\[';
r.rb = '\\]';
r.nb = '[^\\[\\]]';
r.nsp = '[^\\|\\]]';

r.int = '\\d+';
r.imgw = `(?<width>${r.int})`;
r.imgh = `(?<height>${r.int})`;

r.refid = `${r.lb}(?<id>${r.nb}+)${r.rb}: `;
r.label = `(?<label>${r.nb}+): `;
r.value = `(?<value>${r.nsp}+)`;
r.attrs = ` \\| (?<attrs>${r.nb}+)`;

r.code = '`(?<code>[^`]+)`';
r.formula = '``(?<formula>[^`]+)``';
r.res = `${r.lb}(?<res>(${r.label})?${r.value}(${r.attrs})?)${r.rb}`;

export const R = {};

R.quote = new RegExp(r.quote);
R.blockCodeBeg = new RegExp(r.blockCodeBeg);
R.blockCodeEnd = new RegExp(r.blockCodeEnd);
R.htmlEnd = new RegExp(r.htmlEnd);
R.appEnd = new RegExp(r.appEnd);

R.lineElement = new RegExp(r.lineElement);

//

R.indent = new RegExp('^ +');
R.ext = /\.([^.]+)$/;
R.imageSizeAttr = new RegExp(`${r.int}|${r.int}x|x${r.int}|${r.int}x${r.int}`);
R.imageSize = new RegExp(`${r.imgw}?x?${r.imgh}?`);

R.code = new RegExp(r.code);
R.formula = new RegExp(r.formula);
R.res = new RegExp(r.res);

R.elem = new RegExp(`${r.res}|${r.code}|${r.formula}`);

export const TYPE_STR_TO_TYPE = {
  'img': 'image',
  'audio': 'audio',
  'video': 'video',
  'link': 'link',
};

const TYPE_TO_EXTS = {
  image: ['jpg', 'jpeg', 'png'],
  audio: ['mp3'],
  video: ['m3u8', 'mp4', 'ogg'],
};

export const EXT_TO_TYPE = {};
for (const type in TYPE_TO_EXTS) {
  const exts = TYPE_TO_EXTS[type];
  for (const ext of exts) {
    EXT_TO_TYPE[ext] = type;
  }
}

export default R;
