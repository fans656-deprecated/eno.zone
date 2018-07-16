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
    const usd_initial_total = 5976.31;
    const usd_each_person = usd_initial_total / 3;

    const hkd_per_usd_hi_7_9 = 7.8492;
    const hkd_per_usd_lo_7_9 = 7.8475;
    const hkd_per_usd_1 = (hkd_per_usd_hi_7_9 + hkd_per_usd_lo_7_9) / 2;
    const hkd_per_usd_2 = hkd_per_usd_1;

    const hkd_per_usd_hi_7_11 = 7.8493;
    const hkd_per_usd_lo_7_11 = 7.8468;
    const hkd_per_usd_3 = (hkd_per_usd_hi_7_11 + hkd_per_usd_lo_7_11) / 2;

    const n_stocks_1 = 1800;
    const n_stocks_2 = 600;
    const n_stocks_3 = 200;

    const hkd_per_stock_1 = 16.52;
    const hkd_per_stock_2 = 16.56;
    const hkd_per_stock_3 = 19.58;

    const usd_used_1 = n_stocks_1 * hkd_per_stock_1 / hkd_per_usd_1;
    const usd_used_2 = n_stocks_2 * hkd_per_stock_2 / hkd_per_usd_2;
    const usd_used_3 = n_stocks_3 * hkd_per_stock_3 / hkd_per_usd_3;

    const datetime_1 = '2018-07-09 09:30:56';
    const datetime_2 = '2018-07-09 09:38:35';
    const datetime_3 = '2018-07-11 10:25:49';

    const lwl_expected_frac = 1;
    const tyn_expected_frac = 2;
    const twi_expected_frac = 3;

    const lwl_expected_use_1 = usd_each_person;
    const tyn_expected_use_1 = usd_each_person / 2;
    const twi_expected_use_1 = usd_each_person / 4;
    const total_expected_use_1 = (
      lwl_expected_use_1 + tyn_expected_use_1 + twi_expected_use_1
    );

    const diff_1 = usd_used_1 - total_expected_use_1;

    const lwl_actual_use_1 = lwl_expected_use_1;

    const tyn_twi_total_1 = tyn_expected_use_1 + twi_expected_use_1;
    const tyn_perc_1 = tyn_expected_use_1 / tyn_twi_total_1;
    const twi_perc_1 = twi_expected_use_1 / tyn_twi_total_1;
    const tyn_diff_share_1 = diff_1 * tyn_perc_1;
    const twi_diff_share_1 = diff_1 * twi_perc_1;

    const tyn_actual_use_1 = tyn_expected_use_1 + tyn_diff_share_1;
    const twi_actual_use_1 = twi_expected_use_1 + twi_diff_share_1;

    const lwl_stock_perc_1 = lwl_actual_use_1 / usd_used_1;
    const tyn_stock_perc_1 = tyn_actual_use_1 / usd_used_1;
    const twi_stock_perc_1 = twi_actual_use_1 / usd_used_1;

    const lwl_stocks_1 = n_stocks_1 * lwl_stock_perc_1;
    const tyn_stocks_1 = n_stocks_1 * tyn_stock_perc_1;
    const twi_stocks_1 = n_stocks_1 * twi_stock_perc_1;

    const lwl_account_stocks_1 = lwl_stocks_1;
    const tyn_account_stocks_1 = tyn_stocks_1;
    const twi_account_stocks_1 = twi_stocks_1;

    const lwl_account_usd_1 = usd_each_person - lwl_actual_use_1;
    const tyn_account_usd_1 = usd_each_person - tyn_actual_use_1;
    const twi_account_usd_1 = usd_each_person - twi_actual_use_1;

    /////////////////////////////////

    const twi_use_2 = 500;
    const tyn_use_2 = usd_used_2 - twi_use_2;

    const tyn_stock_perc_2 = tyn_use_2 / usd_used_2;
    const twi_stock_perc_2 = twi_use_2 / usd_used_2;

    const tyn_stocks_2 = n_stocks_2 * tyn_stock_perc_2;
    const twi_stocks_2 = n_stocks_2 * twi_stock_perc_2;

    const tyn_account_stocks_2 = tyn_account_stocks_1 + tyn_stocks_2;
    const twi_account_stocks_2 = twi_account_stocks_1 + twi_stocks_2;

    const tyn_account_usd_2 = tyn_account_usd_1 - tyn_use_2;
    const twi_account_usd_2 = twi_account_usd_1 - twi_use_2;

    /////////////////////////////////

    const tyn_use_3 = tyn_account_usd_2;
    const twi_use_3 = usd_used_3 - tyn_use_3;

    const tyn_stock_perc_3 = tyn_use_3 / usd_used_3;
    const twi_stock_perc_3 = twi_use_3 / usd_used_3;

    const tyn_stocks_3 = n_stocks_3 * tyn_stock_perc_3;
    const twi_stocks_3 = n_stocks_3 * twi_stock_perc_3;

    const tyn_account_stocks_3 = tyn_account_stocks_2 + tyn_stocks_3;
    const twi_account_stocks_3 = twi_account_stocks_2 + twi_stocks_3;

    const tyn_account_usd_3 = tyn_account_usd_2 - tyn_use_3;
    const twi_account_usd_3 = twi_account_usd_2 - twi_use_3;

    const lwl_account_stocks_3 = lwl_account_stocks_1;
    const lwl_account_usd_3 = lwl_account_usd_1;

    const lwl_sell_to_twi_stocks_4 = lwl_account_stocks_3 - 900;
    const tyn_sell_to_twi_stocks_4 = tyn_account_stocks_3 - 900;

    // 按股价17港币算，以符合我们三只蚂蚱的名号
    const hkd_per_stock_4 = 17;
    const hkd_per_usd_4 = hkd_per_usd_3;
    const usd_per_stock_4 = hkd_per_stock_4 / hkd_per_usd_4;

    const lwl_sell_to_twi_gain_usd = (
      lwl_sell_to_twi_stocks_4 * hkd_per_stock_4 / hkd_per_usd_4
    );
    const tyn_sell_to_twi_gain_usd = (
      tyn_sell_to_twi_stocks_4 * hkd_per_stock_4 / hkd_per_usd_4
    );
    const twi_got_stocks_4 = lwl_sell_to_twi_stocks_4 + tyn_sell_to_twi_stocks_4;
    const twi_use_usd_4 = twi_got_stocks_4 * hkd_per_stock_4 / hkd_per_usd_4;

    const lwl_account_stocks_4 = lwl_account_stocks_3 - lwl_sell_to_twi_stocks_4;
    const tyn_account_stocks_4 = tyn_account_stocks_3 - tyn_sell_to_twi_stocks_4;
    const twi_account_stocks_4 = twi_account_stocks_3 + twi_got_stocks_4;

    const lwl_account_usd_4 = lwl_account_usd_3 + lwl_sell_to_twi_gain_usd;
    const tyn_account_usd_4 = tyn_account_usd_3 + tyn_sell_to_twi_gain_usd;
    const twi_account_usd_4 = twi_account_usd_3 - twi_use_usd_4;

    ////////////////////////////////
    const lwl_account_stocks_5 = lwl_account_stocks_4;
    const tyn_account_stocks_5 = tyn_account_stocks_4;
    const twi_account_stocks_5 = twi_account_stocks_4;

    const twi_withdraw_5 = twi_account_usd_4;

    const lwl_account_usd_5 = lwl_account_usd_4;
    const tyn_account_usd_5 = tyn_account_usd_4 + twi_withdraw_5;
    const twi_account_usd_5 = twi_account_usd_4 - twi_withdraw_5;

    const cyn_per_usd_5 = 6.6720;  // just around days of 2018-07-09
    const tyn_pay_5 = twi_withdraw_5 * cyn_per_usd_5;

    return (
      <div className="stock">
        <p>初始总资金：<USD val={usd_initial_total}/></p>
        <p>初始各资金：<USD val={usd_each_person}/></p>
        <br/>
        <p>
          {datetime_1}
          <br/>
          买入 <STK val={n_stocks_1}/>
          ，每股 <HKD val={hkd_per_stock_1}/>，
          总价 <USD val={usd_used_1}/>
        </p>

        <div className="buy-detail">
          <p><USD val={lwl_expected_use_1}/> (lwl预期使用)
            &lt;= <USD val={usd_each_person}/> * 100%
          </p>
          <p><USD val={tyn_expected_use_1}/> (tyn预期使用)
            &lt;= <USD val={usd_each_person}/> * 50%
          </p>
          <p><USD val={twi_expected_use_1}/> (twi预期使用)
            &lt;= <USD val={usd_each_person}/> * 25%
          </p>
          <hr/>
          <p><USD val={total_expected_use_1}/> (共预期使用)</p>
          <p><USD val={usd_used_1}/> (实际使用) 超额<USD val={diff_1}/>
            &nbsp;(此部分tyn与twi按比例2:1划分)
          </p>
          <hr/>
          <p><USD val={lwl_actual_use_1}/> (lwl实际使用)</p>
          <p><USD val={tyn_actual_use_1}/> (tyn实际使用)
            = <USD val={tyn_expected_use_1}/> + <USD val={tyn_diff_share_1}/>
          </p>
          <p><USD val={twi_actual_use_1}/> (twi实际使用)
            = <USD val={twi_expected_use_1}/> + <USD val={twi_diff_share_1}/>
          </p>
          <hr/>
          <p>兑换到股票</p>
          <p>lwl增加<STK val={lwl_stocks_1}/> 
            &nbsp;({(lwl_stock_perc_1 * 100).toFixed(2)}%)
            &nbsp; => 账面
            <STK val={lwl_account_stocks_1}/>
            <USD val={lwl_account_usd_1}/>
          </p>
          <p>tyn增加<STK val={tyn_stocks_1}/> 
            &nbsp;({(tyn_stock_perc_1 * 100).toFixed(2)}%)
            &nbsp; => 账面
            <STK val={tyn_account_stocks_1}/>
            <USD val={tyn_account_usd_1}/>
          </p>
          <p>twi增加<STK val={twi_stocks_1}/> 
            &nbsp;({(twi_stock_perc_1 * 100).toFixed(2)}%)
            &nbsp; => 账面
            <STK val={twi_account_stocks_1}/>
            <USD val={twi_account_usd_1}/>
          </p>
        </div>

        <p>
          {datetime_2}
          <br/>
          买入 <STK val={n_stocks_2}/>
          ，每股 <HKD val={hkd_per_stock_2}/>，
          总价 <USD val={usd_used_2}/>
        </p>

        <div className="buy-detail">
          <p><USD val={tyn_use_2}/> (tyn使用)
            &lt;= <USD val={usd_used_2}/> - <USD val={twi_use_2}/>
          </p>
          <p><USD val={twi_use_2}/> (twi使用)
          </p>
          <hr/>
          <p><USD val={usd_used_2}/> (共使用)
          </p>
          <hr/>
          <p>tyn增加<STK val={tyn_stocks_2}/> 
            &nbsp;({(tyn_stock_perc_2 * 100).toFixed(2)}%)
            &nbsp; => 账面
            <STK val={tyn_account_stocks_2}/>
            <USD val={tyn_account_usd_2}/>
          </p>
          <p>twi增加<STK val={twi_stocks_2}/> 
            &nbsp;({(twi_stock_perc_2 * 100).toFixed(2)}%)
            &nbsp; => 账面
            <STK val={twi_account_stocks_2}/>
            <USD val={twi_account_usd_2}/>
          </p>
        </div>

        <p>
          {datetime_3}
          <br/>
          买入 <STK val={n_stocks_3}/>
          ，每股 <HKD val={hkd_per_stock_3}/>，
          总价 <USD val={usd_used_3}/>
        </p>

        <div className="buy-detail">
          <p><USD val={tyn_use_3}/> (tyn使用)
          </p>
          <p><USD val={twi_use_3}/> (twi使用)
          </p>
          <hr/>
          <p><USD val={usd_used_3}/> (共使用)
          </p>
          <hr/>
          <p>tyn增加<STK val={tyn_stocks_3}/> 
            &nbsp;( {(tyn_stock_perc_3 * 100).toFixed(2)}%)
            &nbsp; => 账面
            <STK val={tyn_account_stocks_3}/>
            <USD val={tyn_account_usd_3}/>
          </p>
          <p>twi增加<STK val={twi_stocks_3}/> 
            &nbsp;({(twi_stock_perc_3 * 100).toFixed(2)}%)
            &nbsp; => 账面
            <STK val={twi_account_stocks_3}/>
            <USD val={twi_account_usd_3}/>
          </p>
        </div>

        <div style={{fontFamily: 'Consolas'}}>
          <p>
            lwl
            <STK val={lwl_account_stocks_1}/>
            <USD val={lwl_account_usd_1}/>
          </p>
          <p>
            tyn
            <STK val={tyn_account_stocks_3}/>
            <USD val={tyn_account_usd_3}/>
          </p>
          <p>
            twi
            <STK val={twi_account_stocks_3}/>
            <USD val={twi_account_usd_3}/>
            &nbsp; 折合人民币 <CNY val={twi_account_usd_3 * 6.6720}/>
          </p>
        </div>

        <div className="buy-detail">
          <p>2018-07-12 09:25:22</p>
          <p>lwl tyn按股价<HKD val={hkd_per_stock_4}/> / <USD val={usd_per_stock_4}/>
            &nbsp;USD/HKD汇率(07-09){hkd_per_usd_4.toFixed(2)} 卖给twi
          </p>
          <hr/>
          <p>lwl减少<STK val={lwl_sell_to_twi_stocks_4}/> 
            增加<USD val={lwl_sell_to_twi_gain_usd}/>
            &nbsp; => 账面
            <STK val={lwl_account_stocks_4}/>
            <USD val={lwl_account_usd_4}/>
          </p>
          <p>tyn减少<STK val={tyn_sell_to_twi_stocks_4}/> 
            增加<USD val={tyn_sell_to_twi_gain_usd}/>
            &nbsp; => 账面
            <STK val={tyn_account_stocks_4}/>
            <USD val={tyn_account_usd_4}/>
          </p>
          <p>twi增加<STK val={twi_got_stocks_4}/> 
            减少<USD val={twi_use_usd_4}/>
            &nbsp; => 账面
            <STK val={twi_account_stocks_4}/>
            <USD val={twi_account_usd_4}/>
          </p>
          <div style={{
            textAlign: 'right',
            color: '#999',
          }}>
            <p>显示只精确到小数点后两位，实际计算以最大精度进行</p>
            <p>汇率 {hkd_per_usd_4}</p>
            <p>股数 {twi_got_stocks_4}</p>
          </div>
        </div>

        <div style={{fontFamily: 'Consolas'}}>
          <p>
            lwl
            <STK val={lwl_account_stocks_4}/>
            <USD val={lwl_account_usd_4}/>
          </p>
          <p>
            tyn
            <STK val={tyn_account_stocks_4}/>
            <USD val={tyn_account_usd_4}/>
          </p>
          <p>
            twi
            <STK val={twi_account_stocks_4}/>
            <USD val={twi_account_usd_4}/>
            &nbsp; 折合人民币 <CNY val={twi_account_usd_4 * 6.6720}/>
          </p>
        </div>

        <div className="buy-detail">
          <p>2018-07-12 09:25:22</p>
          <p>twi提现 <USD val={twi_withdraw_5}/></p>
          <p>tyn支付 <CNY val={tyn_pay_5}/> (零头抹去，实付1500)</p>
        </div>

        <div style={{fontFamily: 'Consolas'}}>
          <p>
            lwl
            <STK val={lwl_account_stocks_5}/>
            <USD val={lwl_account_usd_5}/>
          </p>
          <p>
            tyn
            <STK val={tyn_account_stocks_5}/>
            <USD val={tyn_account_usd_5}/>
          </p>
          <p>
            twi
            <STK val={twi_account_stocks_5}/>
            <USD val={twi_account_usd_5}/>
          </p>
        </div>
      </div>
    );
  }

  render2() {
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
        {val.toFixed(2)}
      </span>
      <span> {unit}</span>
    </span>
  );
}

const HKD = ({val}) => <Money val={val} unit="港币"/>
const USD = ({val}) => <Money val={val} unit="美元"/>
const CNY = ({val}) => <Money val={val} unit="元"/>
const STK = ({val}) => <Money val={val} unit="股"/>

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
