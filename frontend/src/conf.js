//eslint-disable-next-line
const origin = self.location.origin;;

const conf = {
  owner: 'fans656',
  origin: origin,
  backend_origin: origin,
  default: {
    nav: [
      {name: 'Home', url: '/'},
      {name: 'Blog', url: '/'},
      {name: 'Diary', url: '/'},
      {name: 'Leetcode', url: '/'},
      {name: 'Books', url: '/'},
      {name: 'Music', url: '/'},
      {name: 'Videos', url: '/'},
      {name: 'More', url: '/'},
    ]
  },
};

export default conf;
