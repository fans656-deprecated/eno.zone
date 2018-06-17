import React from 'react'

export function insertTextAt(originalText, text, col) {
  return originalText.substring(0, col) + text + originalText.substring(col);
}

export function renderContent(content) {
  const components = [];
  content.forEach((line, i) => {
    if (components.length) {
      components.push(<br key={'br-' + i}/>);
    }
    components.push(renderLine(line, i));
  });
  return components;
}

function renderLine(line, index) {
  let comp;
  if (line.length) {
    comp = <span className="line">{line}</span>;
  } else {
    comp = <span className="dummy line"> </span>;
  }
  return React.cloneElement(comp, {
    key: index,
  });
}

export function searchAll(pattern, lines, row) {
  const re = new RegExp(pattern, 'ig');
  const matches = [];
  lines.forEach((line, i) => {
    while (true) {
      const match = re.exec(line);
      if (!match) {
        break;
      }
      match.row = row + i;
      match.colBeg = match.index;
      match.colEnd = match.index + match[0].length;
      matches.push(match);
    }
  });
  return matches;
}

export function isDigit(s) {
  return !isNaN(parseInt(s, 10));
}

export function lastIndexOf(s, re) {
  re = new RegExp(re, 'g');
  const matches = [];
  while (true) {
    const match = re.exec(s);
    if (!match) {
      break;
    }
    matches.pop();
    matches.push(match);
  }
  return matches.length ? matches[matches.length - 1].index : -1;
}
window.lastIndexOf = lastIndexOf;

export function indexOf(s, re) {
  const match = s.match(re);
  return match ? match.index : -1;
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
