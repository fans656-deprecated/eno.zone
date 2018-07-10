import React from 'react';
import ReactEcharts from 'echarts-for-react';
import _ from 'lodash';
import 'jquery-ui-bundle';
import 'jquery-ui-bundle/jquery-ui.css';

import App from '../app';
import { Button } from '../../common';
import { Display } from '../../constants';
import Balance from './balance';
import './style.css';
import { interlace } from '../../util';

export default class BalanceComponent extends App {
  constructor(props) {
    super(props);

    const note = this.note.note;
    this.balance = new Balance(null, {
      tagTree: note.app ? note.app.tag : {}
    });

    if (this.env.display === Display.Single) {
      this.load();
    }
  }

  load() {
    const note = this.note;
    let data = note.data();
    if (1 || data == null || note.isContentDirty()) {
      data = this.balance.parse(note.content());
      note.setData(data);
      note.hashContent();
      note.save();
    }
    this.balance.load(data);
    this.itemsStack = [this.balance.items];
  }

  onPieClick = (data) => {
    const tag = data.data.tag;
    const items = _.last(this.itemsStack);
    const subItems = items.sub[tag];
    if (subItems) {
      this.itemsStack.push(subItems);
      this.update();
    }
  }

  back() {
    this.itemsStack.pop();
    this.update();
  }

  renderSingle() {
    const balance = this.balance;
    const dayComps = balance.rangeDays().map(this.renderDay);
    const detailItems = interlace(dayComps, (_, i) => (
      <div key={'sep' + i} className="separator"/>
    ));

    const rangesAll = [{first: 0, last: balance.nDays - 1, label: 'All'}];
    const pieData = [];
    const items = _.last(this.itemsStack);  // TODO: sub-items
    for (const tag in items.sub) {
      const subItems = items.sub[tag];
      const percent = (subItems.total / items.total * 100).toFixed(0);
      const value = subItems.total;
      pieData.push({
        value: value,
        name: `${tag} ${formatHuman(value)} (${percent}%)`,
        tag: tag,
      });
    }
    pieData.sort((x, y) => y.value - x.value);

    let i = 0;
    const colors = ['#393939','#f5b031','#fad797','#59ccf7','#c3b4df'];
    return (
      <div className="balance-container" ref={ref => this.container = ref}>
        <h1 className="total">Total: <span>{items.total.toFixed(0)}</span></h1>
        <div className="pie-tops">
          <div className="pie-chart">
            {
              this.itemsStack.length > 1 &&
                <Button
                  className="pie-back"
                  onClick={() => this.back()}
                >
                  Back
                </Button>
            }
            <ReactEcharts
              className="main-pie"
              option={{
                series: [{
                  type: 'pie',
                  data: pieData,
                  itemStyle: {
                    normal: {
                      color: (data) => {
                        const tag = data.data.tag;
                        const color = TAG_TO_COLOR[tag];
                        if (color) return color;
                        i = (i + 1) % colors.length;
                        return colors[i];
                      },
                    },
                  },
                }]
              }}
              style={{width: '600px', height: '400px'}}
              onEvents={{
                click: this.onPieClick,
              }}
            />
          </div>
          <div className="tops">
            <h2>Top 10</h2>
            <ul>{items.top(10).map(this.renderItem)}</ul>
          </div>
        </div>
        <div className="control">
          {this.rangesComp(rangesAll.concat(balance.years))}
          {this.rangesComp(balance.months)}
        </div>
        <div className="details">
          <h2>Details</h2>
          <ul>{detailItems}</ul>
        </div>
      </div>
    );
  }

  renderDay = (day, key) => {
    return (
      <div className="day" key={key}>
        <span className="date">{day.dateStr}</span>
        <ul>{day.items.map(this.renderItem)}</ul>
      </div>
    );
  }

  renderItem = (item, key) => {
    return (
      <li className="expense-item" key={key}>
        <span className="value"
          style={{
            width: '5em',
            display: 'inline-block',
            textAlign: 'right',
            paddingRight: '1em',
          }}
        >{item.value}</span>
        <span className="desc">{item.desc}</span>
        <span className="tags"
          style={{
            paddingLeft: '1em',
          }}
        >
          {item.tags.map((tag, i) => (
            <span
              key={i}
              className="tag"
              style={{
                paddingRight: '.5em',
              }}
            >{tag}</span>
          ))}
        </span>
      </li>
    );
  }

  setRange(first, last) {
    this.balance.setRange(first, last);
    this.itemsStack = [this.balance.items];
    this.update();
  }

  rangesComp = (ranges) => {
    const buttons = ranges.map(({first, last, label}) => (
      <Button
        key={label}
        onClick={() => this.setRange(first, last)}
      >
        {label}
      </Button>
    ));
    return <div className="ranges">{buttons}</div>;
  }

  update() {
    this.setState({});
  }
}

const TAG_TO_COLOR = {
  'rent': '#000000',
  'invest': '#2F922A',
  'parent': '#4959A8',
  'her': '#E185E4',
  'daily': '#E87352',
  'other': '#cccccc',

  'health': '#D9D9D9',
  'social': '#50BABA',

  'eat': '#E87352',
};

function formatHuman(value) {
  value = Math.abs(value);
  if (value >= 10000) {
    return value = (value / 10000).toFixed(1) + 'W';
  } else if (value >= 1000) {
    return value = (value / 1000).toFixed(1) + 'K';
  } else {
    return value.toFixed(0);
  }
}
