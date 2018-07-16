from __future__ import absolute_import
from flask import request

import util
from user import User
from errors import Error, NotFound


def post_login():
    if request.json is None:
        return util.error_response('username and password required')
    username = request.json.get('username', '')
    password = request.json.get('password', '')
    user = User.get_user(username)
    if user is None:
        return util.error_response('user "{}" does not exist'.format(username))
    if not user.is_password_correct(password):
        return util.error_response('incorrect password')
    return _token_response(user.token)


def post_signup():
    if request.json is None:
        return util.error_response('username and password required')
    username = request.json.get('username', '')
    password = request.json.get('password', '')
    user = User.create(username, password)
    return _token_response(user.token)


def get_logout():
    return _token_response('')


def get_user(username):
    user = User.get_user(username)
    if user is None:
        raise NotFound(username)
    user_dict = user.user_dict
    del user_dict['hashed_password']
    del user_dict['salt']
    return user_dict


def put_user_info(username):
    visitor = util.get_visitor()
    if not visitor or visitor['username'] != username:
        raise Error('you are not {}'.format(username))
    user = User.get_user(username)
    if user is None:
        raise NotFound(username)
    user_dict_patch = request.json
    if not user_dict_patch:
        raise Error('empty update')
    if user.update(user_dict_patch):
        return util.success_response()
    else:
        raise Error('update failed')


@util.require_admin_login
def delete_user(username):
    user = User.get_user(username)
    if user is None:
        raise NotFound(username)
    if user.delete():
        return util.success_response()
    else:
        raise Exception('deletion failed')


@util.require_admin_login
def get_users():
    users = db.get_users()
    return {'users': users}


def _token_response(token):
    r = util.success_response({'token': token})
    # cookie should for eno.zone when user visiting e.g. fans656.eno.zone
    r.set_cookie('token', token, domain=get_primary_domain())
    return r


def get_primary_domain():
    host = request.host
    domain = host.split(':')[0]
    parts = domain.split('.')
    primary_domain = '.'.join(parts[-2:])
    return primary_domain
