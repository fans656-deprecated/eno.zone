import React from 'react';
import _ from 'lodash';

import App from './app';
import './style.css';

class People {
  constructor(name) {
    this.name = name;
    this.usd = 0;
    this.stocks = 0;
  }

  take_share(perc) {
    this.deposit(this.account.usd * perc);
  }

  deposit(usd) {
    this.usd += usd;
  }

  withdraw(usd) {
  }

  buy(usd) {
  }
}

class Account {
  constructor() {
    this.usd = 0;
    this.stocks = 0;
    this.history = [];
  }

  deposit(usd) {
    this.usd += usd;
    this.save();
  }

  save() {
    this.history.push({
      type: 'state',
      usd: this.usd,
      stocks: this.stocks,
    });
  }

  buy(datetime, n_stocks, hkd_per_stock, hkd_per_usd, people_buys) {
    const hkd_used = n_stocks * hkd_per_stock;
    const usd_used = hkd_used / hkd_per_usd;
    this.usd -= usd_used;
    this.stocks += n_stocks;

    const p_total_use = _.sum(people_buys.map(p => p.use));
    people_buys.forEach(buy => {
      const people = buy.people;
      const perc = buy.use / p_total_use;
      const buy_stocks = n_stocks * perc;
      const actual_used_usd = usd_used * perc;
      people.stocks += buy_stocks;
      people.usd -= actual_used_usd;
      people.buy_stocks = buy_stocks;
      buy.actual_used_usd = actual_used_usd;
    });

    this.history.push({
      type: 'buy',
      datetime: datetime,
      n_stocks: n_stocks,
      hkd_per_stock: hkd_per_stock,
      hkd_per_usd: hkd_per_usd,
      hkd_used: hkd_used,
      usd_used: usd_used,
      people_states: people_buys.map(p => {
        const people = p.people;
        return {
          name: people.name,
          usd: people.usd,
          stocks: people.stocks,
          buy_stocks: people.buy_stocks,
          actual_used_usd: p.actual_used_usd,
        };
      }),
    });
    this.save();
  }
}

export default class Stock extends App {
  constructor(props) {
    super(props);

    this.account = new Account();

    const hkd_per_usd_hi_7_9 = 7.8492;
    const hkd_per_usd_lo_7_9 = 7.8475;
    const hkd_per_usd_7_9 = (hkd_per_usd_hi_7_9 + hkd_per_usd_lo_7_9) / 2;

    const account = this.account;

    const lwl = new People('lwl');
    const tyn = new People('tyn');
    const twi = new People('twi');

    const initial = 5976.31;

    account.deposit(initial);
    lwl.deposit(initial / 3);
    tyn.deposit(initial / 3);
    twi.deposit(initial / 3);

    account.buy('2018-07-09 09:30:56', 1800, 16.52, hkd_per_usd_7_9, [
      {people: lwl, use: lwl.usd * 1.0},
      {people: tyn, use: tyn.usd * 0.5},
      {people: twi, use: twi.usd * 0.5},
    ]);

    account.buy('2018-07-09 09:38:35', 600, 16.56, hkd_per_usd_7_9, [
      {people: lwl, use: lwl.usd * 0.0},
      {people: tyn, use: tyn.usd * 1.0},
      {people: twi, use: twi.usd * 1.0},
    ]);

    account.buy('2018-??-??', 200, 18, hkd_per_usd_7_9, [
      {people: lwl, use: lwl.usd * 0.0},
      {people: tyn, use: tyn.usd * 1.0},
      {people: twi, use: twi.usd * 1.0},
    ]);
  }

  render() {
    const comps = this.account.history.map(obj => {
      switch (obj.type) {
        case 'state':
          return this.renderState(obj);
        case 'buy':
          return this.renderBuy(obj);
        default:
          return <div>Unknown <pre>{JSON.stringify(obj, null, 2)}</pre></div>;
      }
    });

    return (
      <div className="stock" style={{
        fontFamily: 'Consolas',
      }}>
        {comps}
      </div>
    );
  }

  renderState(state) {
    return <div style={{
      border: '1px solid #222',
      padding: '1em',
    }}>
      <span>余额：<USD val={state.usd}/></span><br/>
      <span>股票：<STK val={state.stocks}/></span>
    </div>
  }

  renderBuy(buy) {
    const comps = buy.people_states.map(p => {
      return (
        <div>
          <p>{p.name} 以
            <USD val={p.actual_used_usd}/> 买入 <STK val={p.buy_stocks}/>
            &nbsp; | &nbsp;现有<USD val={p.usd}/> <STK val={p.stocks}/></p>
        </div>
      );
    });
    return <div
      style={{
        margin: '2em 1em',
      }}
    >
      <p><span>{buy.datetime}</span> (USD/HKD {buy.hkd_per_usd})</p>
      <p>买入 {buy.n_stocks} 股，每股 {buy.hkd_per_stock} 港币</p>
      <p>
        共计 <USD val={buy.usd_used}/> (
        <span style={{fontSize: '.8em'}}><HKD val={buy.hkd_used}/></span>)
        ，其中：
      </p>
      <div style={{fontSize: '.8em'}}>
        {comps}
      </div>
    </div>
  }
}

const Money = (props) => {
  const val = props.val;
  const unit = props.unit;
  let points = props.points;
  if (points == null) {
    points = 2;
  }
  return (
    <span className="money">
      <span
        style={{
          width: '5em',
          display: 'inline-block',
          textAlign: 'right',
          color: '#2C8E3B',
          fontSize: '1.2em',
        }}
      >
        {val.toFixed(points)}
      </span>
      <span> {unit}</span>
    </span>
  );
}

const HKD = ({val}) => <Money val={val} unit="港币"/>
const USD = ({val}) => <Money val={val} unit="美元"/>
const STK = ({val}) => <Money val={val} unit="股" points={2}/>

const MoneyDesc = (desc, money) => {
  return (
    <div>
    <span>
      <span
        style={{
          display: 'inline-block',
          width: '10em',
        }}
      >{desc}: </span>
      {money}
    </span>
  </div>
  );
}

const Buy = ({buy}) => {
  const total_hkd = buy.n_stocks * buy.hkd_per_stock;
  const total_usd = total_hkd / buy.hkd_per_usd;
  return (
    <div
      style={{
        border: '1px solid #222',
        padding: '1em',
        marginBottom: '1em',
      }}
    >
      <p>
        <span>{buy.datetime}</span>
        &nbsp;
        <span>买入</span>
        &nbsp;
        <span>(USD/HKD {buy.hkd_per_usd})</span>
      </p>
      <p>
        <span style={{
          width: '4em',
          display: 'inline-block',
          textAlign: 'right',
        }}>{buy.n_stocks}</span>股
        <span> x </span>
        <HKD val={buy.hkd_per_stock}/>
        <span> = </span>
        <HKD val={total_hkd}/>
        <span> = </span>
        <USD val={total_usd}/>
      </p>
    </div>
  );
}
