import _ from 'lodash';

import { groupby, groupbyLeading } from '../../util';

export default class Balance {
  constructor(data_or_content, {tagTree}) {
    Balance.tagToParentTag = parseReversedTree(tagTree);
    if (data_or_content == null) return;
    if (typeof(data_or_content) === 'string') {
      this.parse(data_or_content);
    } else {
      this.load(data_or_content);
    }
  }

  setRange(first, last) {
    first = first == null ? 0 : first;
    last = last == null ? this.nDays - 1 : last;
    this.first = first;
    this.last = last;
    this.calcStat();
  }

  load(data) {
    Object.assign(this, data);
    this.setRange();
  }

  parse(content) {
    const lines = content.split('\n');
    const groups = groupbyLeading(lines, line => line.match(R.date));
    const days = groups.map((group) => {
      const dateLine = group[0];
      const itemLines = group.slice(1);
      return new Day(dateLine, itemLines);
    });

    const months = this.parseMonths(days);
    const years = this.parseYears(months);

    return {
      nDays: days.length,
      days: days,
      months: months,
      years: years,
    };
  }

  parseMonths(days) {
    const months = [];
    const daysByMonth = groupby(days, day => day.yearMonth);
    let beg = 0;
    for (const days of daysByMonth) {
      months.push({
        first: beg,
        last: beg + days.length - 1,
        label: days[0].yearMonth,
      });
      beg += days.length;
    }
    return months;
  }

  parseYears(months) {
    const years = [];
    const monthsByYear = groupby(months, month => month.label.substring(0, 4));
    let beg = 0;
    for (const months of monthsByYear) {
      const n = _.sum(months.map(month => month.last - month.first + 1));
      years.push({
        first: beg,
        last: beg + n - 1,
        label: months[0].label.substring(0, 4),
      });
      beg += n;
    }
    return years;
  }

  rangeDays() {
    return this.days.slice(this.first, this.last + 1);
  }

  calcStat() {
    const days = this.rangeDays();
    this.total = _.sum(days.map(day => day.value)).toFixed(0);

    const items = [].concat(...days.map(day => day.items));
    this.items = new Items(items);
    this.items.categorize();

    const tops = new Array(...items);
    this._tops = tops.sort((x, y) => x.value - y.value).slice(0, 10);
  }

  currentCategories() {
    return this.categories;
  }

  tops() {
    return this._tops;
  }
}

class Day {
  constructor(dateLine, itemLines) {
    this.dateStr = dateLine;
    this.date = new Date(dateLine);
    this.items = itemLines.map(line => new Item(line));
    this.value = _.sum(this.items.map(item => item.value));

    const date = this.date;
    this.yearMonth = `${date.getFullYear()}-${date.getMonth() + 1}`;
  }
}

class Item {
  constructor(line) {
    this.item = line;
    const match = line.match(R.item);
    if (!match) {
      this.value = 0;
      this.desc = line;
      this.tags = [];
    } else {
      const groups = match.groups;
      this.value = parseValue(groups.value);
      this.desc = groups.desc;
      this.tags = parseTags(groups.tags);
    }
  }
}

class Items {
  constructor(items) {
    if (items == null) items = [];
    this.items = items;
    this.total = _.sum(items.map(item => item.value));
    this.sub = {};
    this._tops = items.sort((x, y) => x.value - y.value);
  }

  top(n) {
    if (n == null) n = 10;
    return this._tops.slice(0, n);
  }

  categorize(level) {
    if (level == null) level = 0;
    for (const item of this.items) {
      const tag = this.getTag(item, level);
      if (!(tag in this.sub)) {
        this.sub[tag] = new Items();
      }
      this.sub[tag].addItem(item);
    }
    if (Object.keys(this.sub).length > 1) {
      for (const tag in this.sub) {
        this.sub[tag].categorize(level + 1);
      }
    }
  }

  addItem(item) {
    this.items.push(item);
    this.total += item.value;
  }

  getTag(item, level) {
    const tagToParentTag = Balance.tagToParentTag;
    const tags = item.tags;
    let tag = tags.length ? tags[0] : 'other';
    const tagHierachy = [tag];
    while (tag in tagToParentTag) {
      tag = tagToParentTag[tag];
      tagHierachy.push(tag);
    }
    const i = Math.max(0, tagHierachy.length - 1 - level);
    return tagHierachy[i];
  }
}

function parseValue(s) {
  const match = s.match(R.validValue);
  if (match) {
    return parseFloat(match.groups.value);
  } else {
    return 0.0;
  }
}

function parseTags(s) {
  if (s == null) return [];
  return s.split(':');
}

function parseReversedTree(tree, parentTag, d) {
  if (d == null) d = {};
  for (const tag in tree) {
    const child = tree[tag];
    if (parentTag) {
      d[tag] = parentTag;
    }
    if (child) {
      parseReversedTree(child, tag, d);
    }
  }
  return d;
}

const R = {};

R.date = /^(?<date>\d{4}-\d{2}-\d{2}).*$/;
R.item = /(?<value>[-+][-+]?\d+(\.\d+)?)\S* (?<desc>[^{]+)(\{(?<tags>.+)\})?/;
R.validValue = /(?<value>[-+]\d+(\.\d+)?)/;
