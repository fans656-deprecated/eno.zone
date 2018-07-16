import requests

import conf


domain = 'https://localhost:{}'.format(conf.port)
requests.packages.urllib3.disable_warnings()


def post(path, data=None, **kwargs):
    return requests.post(domain + path, json=data, verify=False, **kwargs)


def put(path, data=None, **kwargs):
    return requests.put(domain + path, json=data, verify=False, **kwargs)


def get(path, **kwargs):
    return requests.get(domain + path, verify=False, **kwargs)
