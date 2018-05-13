from flask import request

from util import success_response, error_response
import auther


def post_login():
    username = request.json.get('username', '')
    password = request.json.get('password', '')
    r = token_response(username, password)
    if r:
        return r
    else:
        return error_response('invalid login', 400)


def post_signup():
    username = request.json.get('username', '')
    password = request.json.get('password', '')
    if auther.create_user({'username': username, 'password': password}):
        return token_response(username, password)
    else:
        return error_response('signup error')


def token_response(username, password):
    token = auther.get_token(username, password)
    if token:
        r = success_response()
        r.set_cookie('token', token)
        return r
    else:
        return None
