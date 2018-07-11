# coding: utf-8
import os
import json
import random
import functools
import traceback
import inspect
import datetime
import functools

import jwt
import flask
from flask import request
import jwt
from flask import request, redirect, jsonify
from dateutil.parser import parse as parse_datetime

import errors
import conf
import auther


def guarded(viewfunc):
    @functools.wraps(viewfunc)
    def wrapper(*args, **kwargs):
        try:
            res = viewfunc(*args, **kwargs)
            if isinstance(res, dict):
                res = json.dumps(res)
            return res
        except Exception as e:
            return error_response(e)
    return wrapper


def success_response(data=None):
    if data is None:
        data = {}
    elif isinstance(data, (str, unicode)):
        data = {'detail': data}
    return jsonify(**data)


def error_response(detail, status_code=400):
    if isinstance(detail, dict):
        data = detail
        detail = detail.get('detail', '')
    elif isinstance(detail, Exception):
        detail = traceback.format_exc(detail)
        print detail
        data = {}
    else:
        data = {}
    data.update({
        'errno': status_code,
        'detail': detail,
    })
    resp = jsonify(**data)
    resp.status_code = status_code
    return resp


def send_from_directory(*paths):
    fpath = os.path.join(*paths)
    fpath = os.path.abspath(fpath)
    if not fpath.startswith(paths[0]):
        raise errors.NotAllowed('are you up to something?')
    dirname = os.path.dirname(fpath)
    fname = os.path.basename(fpath)
    return flask.send_from_directory(
        dirname.encode('utf8'),
        fname.encode('utf8'))


def rooted_path(*paths):
    fpath = os.path.join(*paths)
    fpath = os.path.abspath(fpath)
    if not fpath.startswith(paths[0]):
        raise errors.NotAllowed('are you up to something?')
    return fpath


def utcnow_as_str():
    return datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')


def parse_query_string(s):
    if s.startswith('['):
        return [part.strip() for part in s[1:-1].split(',')]
    else:
        return s


def get_visitor():
    try:
        token = request.cookies.get('token')
        user = jwt.decode(token, conf.auth_pubkey, algorithm='RS512')
        return user
    except Exception:
        return None


def get_owner():
    # currently the site is only for me
    return {
        'username': 'fans656'
    }
    #domain = request.host.split(':')[0]
    #labels = domain.split('.')
    #if len(labels) > 2:
    #    username = labels[0]
    #    return {
    #        'username': username,
    #    }
    #else:
    #    return None


def is_owner(visitor, owner):
    return visitor and owner and visitor['username'] == owner['username']


def is_visitor_owner():
    return is_owner(get_visitor(), get_owner())


def require_owner_login(viewfunc):
    @functools.wraps(viewfunc)
    def wrapper(*args, **kwargs):
        visitor = get_visitor()
        owner = get_owner()
        if not visitor or visitor['username'] != owner['username']:
            return util.error_response(
                'you are not "{}"'.format(conf.owner), 403)
        return viewfunc(*args, **kwargs)
    return wrapper


def require_admin_login(viewfunc):
    @functools.wraps(viewfunc)
    def wrapper(*args, **kwargs):
        visitor = get_visitor()
        # TODO: check if visitor is in 'root' group
        if visitor['username'] != 'fans656':
            return error_response('you are not admin', 401)
        return viewfunc(*args, **kwargs)
    return wrapper


if __name__ == '__main__':
    def foo():
        logger('hi')

    foo()
