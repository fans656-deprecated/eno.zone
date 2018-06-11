import os
import json

from flask import *

import conf
import util
from endpoints import endpoints


app = Flask(__name__)


@app.route('/sw.js')
def get_service_worker():
    return send_from_directory('../frontend/public', 'sw.js')


for method, path, viewfunc in endpoints:
    viewfunc = util.handle_exceptions(viewfunc)
    app.route(path, methods=[method])(viewfunc)


@app.route('/', methods=['OPTIONS'])
@app.route('/<path:path>', methods=['OPTIONS'])
def options(path=''):
    return ''


@app.after_request
def after_request(r):
    r.headers.add('Access-Control-Allow-Origin', request.host_url)
    r.headers.add('Access-Control-Allow-Credentials', 'true')
    r.headers.add('Access-Control-Allow-Headers', '*')
    r.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    return r


if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=conf.port,
        threaded=True,
        debug=True,
        ssl_context='adhoc',
    )
