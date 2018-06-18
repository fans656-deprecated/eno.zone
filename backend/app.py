import os
import json

from flask import *

import conf
import util
import stome
from endpoints import endpoints, stome_endpoints


app = Flask(__name__)


@app.route('/sw.js')
def get_service_worker():
    return send_from_directory('../frontend/public', 'sw.js')


for method, path, viewfunc in endpoints:
    viewfunc = util.handle_exceptions(viewfunc)
    app.route(path, methods=[method])(viewfunc)
for viewfunc, method_paths in stome_endpoints.items():
    routed = viewfunc
    for method, path in method_paths:
        routed = app.route(path, methods=[method])(routed)


@app.route('/', methods=['OPTIONS'])
@app.route('/<path:path>', methods=['OPTIONS'])
def options(path=''):
    return ''


@app.after_request
def after_request(r):
    r.headers['Cache-Control'] = 'no-cache'
    r.headers.add('Access-Control-Allow-Origin', request.host_url)
    r.headers.add('Access-Control-Allow-Credentials', 'true')
    r.headers.add('Access-Control-Allow-Headers', '*')
    r.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    return r


if __name__ == '__main__':
    if os.system('systemctl is-active --quiet mongod'):
        #logger.info('try start database(mongodb)')
        os.system('sudo service mongod start')
    if not stome.filesystem.initialized():
        stome.filesystem.initialize()
    app.run(
        host='0.0.0.0',
        port=conf.port,
        threaded=True,
        debug=True,
        ssl_context='adhoc',
    )
