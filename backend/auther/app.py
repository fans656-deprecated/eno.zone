from flask import *

import auther


app = Flask(__name__)


@app.after_request
def after_request(r):
    r.headers['Cache-Control'] = 'no-cache'
    return r


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/get-token', methods=['POST'])
def get_token():
    login_info = request.json
    username = login_info['username']
    password = login_info['password']
    return auther.get_token(username, password)


@app.route('/user', methods=['POST'])
def create_user():
    user = request.json
    if not user or 'username' not in user:
        return 'bad argument', 400
    if auther.is_user_exists(user['username']):
        return 'conflict', 409
    if auther.create_user(user):
        return 'ok'
    else:
        return 'error', 400


@app.route('/user/<username>', methods=['DELETE'])
def delete_user(username):
    if auther.delete_user(username):
        return 'ok'
    else:
        return 'delete failed', 400


@app.route('/user')
def get_users():
    return json.dumps({
        'users': auther.get_users()
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True, debug=True)
