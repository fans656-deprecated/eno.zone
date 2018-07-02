import React from 'react';

export default class Balance extends React.Component {
  constructor(props) {
    super(props);
    const attrs = props.attrs;
    const content = props.content;
    const env = attrs.env;
    this.parse(content);
  }

  parse(content) {
    const lines = content.split('\n');
    const days = [];
    let day = null;
    for (const line of lines) {
      if (line.match(/^\d+.*/)) {
        if (!day) {
          day = {
            items: [],
          };
        } else {
          days.push(day);
          day = {
            items: [],
          };
        }
        day.date = line.trim();
      } else {
        day.items.push(line.trim());
      }
    }
    if (day) {
      days.push(day);
    }
    console.log(days);
    this.days = days;
  }

  render() {
    const days = this.days;
    const comps = days.map(day => {
      const items = day.items.map((item, i) => {
        return <li key={i}>{item}</li>;
      });
      return (
        <div key={day.date}>
          <h1>{day.date}</h1>
          <ul>
            {items}
          </ul>
        </div>
      );
    });
    return (
      <div>
        {comps}
      </div>
    );
  }
}
