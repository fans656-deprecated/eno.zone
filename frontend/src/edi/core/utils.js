export const noop = () => null

export function defaultIfNull(val, def) {
  return val == null ? def : val;
}

export function caretBefore(row0, col0, row1, col1) {
  return row0 === row1 ? col0 < col1 : row0 < row1 ;
}

export function split(text, ...cols) {
  const res = [];
  let beg = 0;
  cols.push(text.length);
  for (const col of cols) {
    res.push(text.substring(beg, col));
    beg = col;
  }
  return res;
}

export function insertTextAt(originalText, text, col) {
  return originalText.substring(0, col) + text + originalText.substring(col);
}

export function searchAll(pattern, lines) {
  const re = new RegExp(pattern, 'ig');
  const matches = [];
  let row = 0;
  lines.forEach((line, i) => {
    while (true) {
      const match = re.exec(line);
      if (!match) {
        break;
      }
      match.row = row + i;
      match.begCol = match.index;
      match.endCol = match.index + match[0].length;
      matches.push(match);
    }
  });
  return matches;
}

export function isDigit(s) {
  return !isNaN(parseInt(s, 10));
}

export function loop(count, func) {
  count = count == null ? 1 : count;
  for (let i = 0; i < count; ++i) {
    func();
  }
}

export function groupby(xs, getkey) {
  const xss = [];
  const cur = {key: undefined, xs: []};
  for (const x of xs) {
    const key = getkey(x);
    if (cur.xs.length === 0) {
      cur.key = key;
      cur.xs.push(x);
    } else if (cur.key === key) {
      cur.xs.push(x);
    } else {
      xss.push(cur.xs);
      cur.key = key;
      cur.xs = [x];
    }
  }
  if (cur.xs.length) {
    xss.push(cur.xs);
  }
  return xss;
}

export function getWord(line, col) {
  col = Math.max(0, col);
  if (line.length === 0) {
    return {
      col: col,
      word: '',
      pre: '',
      aft: '',
      preSpaces: '',
      aftSpaces: '', 
      beg: col,
      end: col,
      spaceBeg: col,
      spaceEnd: col,
    };
  }
  const pre = line.substring(0, col);
  const aft = line.substring(col);

  let preWord, preSpaces, aftWord, aftSpaces;
  let preMatch, aftMatch;
  if (isWordChar(line[col])) {
    preMatch = pre.match(/(?<spaces>\s*)(?<word>\w*)$/)
    aftMatch = aft.match(/^(?<word>\w*)(?<spaces>\s*)/);
  } else {
    preMatch = pre.match(/(?<spaces>\s*)(?<word>[^\s\w]*)$/);
    aftMatch = aft.match(/^(?<word>[^\s\w]*)(?<spaces>\s*)/);
  }
  preWord = preMatch.groups.word;
  aftWord = aftMatch.groups.word;
  preSpaces = preMatch.groups.spaces;
  aftSpaces = aftMatch.groups.spaces;
  const beg = col - preWord.length;
  const spaceBeg = beg - preSpaces.length;
  const end = col + aftWord.length;
  const spaceEnd = end + aftSpaces.length;
  return {
    col: col,
    word: preWord + aftWord,
    pre: preWord,
    aft: aftWord,
    preSpaces: preSpaces,
    aftSpaces: aftSpaces, 
    beg: beg,
    end: end,
    spaceBeg: spaceBeg,
    spaceEnd: spaceEnd,
  };
}

function isWordChar(ch) {
  return ch.match(/\w/);
}
