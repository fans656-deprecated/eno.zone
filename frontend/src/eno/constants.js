const r = {};
r.lb = '\\[';
r.rb = '\\]';
r.nb = '[^\\[\\]]';
r.nsp = '[^\\|]';
r.code = '`(?<code>[^`]+)`';
r.formula = '``(?<formula>[^`]+)``';

r.int = '\\d+';
r.imgw = `(?<width>${r.int})`;
r.imgh = `(?<height>${r.int})`;

r.refid = `${r.lb}(?<id>${r.nb}+)${r.rb}: `;
r.label = `(?<label>${r.nb}+): `;
r.value = `(?<value>${r.nsp}+)`;
r.attrs = ` \\| (?<attrs>${r.nb}+)`;

r.res = `${r.lb}(?<res>(${r.label})?${r.value}(${r.attrs})?)${r.rb}`;

export const R = {};
R.indent = new RegExp('^ +');
R.ext = /\.([^.]+)$/;
R.imageSizeAttr = new RegExp(`${r.int}|${r.int}x|x${r.int}|${r.int}x${r.int}`);
R.imageSize = new RegExp(`${r.imgw}?x?${r.imgh}?`);
R.code = new RegExp(r.code);
R.formula = new RegExp(r.formula);
R.res = new RegExp(r.res);
R.refdef = new RegExp(`^${r.refid}${r.value}(${r.attrs})?$`);
R.elem = new RegExp(`${r.res}|${r.code}|${r.formula}`);

R.langPythonLine = /def \w+\(.*\):|class \w+:/;
R.langCLine = /(const )?(void|int|long|float|double|char) .+\{/;
R.formulaLine = /\^|\\\w+/;

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
