const origin = window.location.origin;

const conf = {
  owner: 'fans656',
  origin: origin,
  backend_origin: origin,
  default: {
    nav: [
      {name: 'TODO', url: '/todo'},
      {name: 'Home', url: '/'},
    ]
  }
};

export default conf;
