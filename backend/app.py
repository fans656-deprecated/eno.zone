import os
import json

from flask import *
from flask_cors import CORS

import conf
import util
from endpoints import endpoints


app = Flask(__name__)
CORS(app)


for method, path, viewfunc in endpoints:
    viewfunc = util.handle_exceptions(viewfunc)
    app.route(path, methods=[method])(viewfunc)


@app.after_request
def after_request(r):
    r.headers.add('Access-Control-Allow-Origin', '*')
    r.headers.add('Access-Control-Allow-Methods', '*')
    return r


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=conf.port, threaded=True, debug=True)
