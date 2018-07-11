import os
import re
import json
import hashlib
import binascii
import datetime

import jwt
import pymongo

import db
import conf


DATETIME_FORMAT = '%Y-%m-%d %H:%M:%S UTC'
USERNAME_REGEX = re.compile('[-_a-zA-Z0-9]+')


def get_token(username, password):
    user = get_user(username)
    if not user:
        return None
    hashed_password = get_hashed_password(password, user['salt'])
    if not hashed_password == user['hashed_password']:
        return None
    del user['salt']
    del user['hashed_password']
    return jwt.encode(user, conf.prikey, algorithm='RS512')


def create_user(user):
    if not is_valid(user):
        return False
    return db.getdb().user.insert_one(normalized(user)).acknowledged


def get_users():
    return list(db.getdb().user.find({}, {'_id': False}))


def delete_user(username):
    return db.getdb().user.remove({'username': username})['n'] == 1


def is_user_exists(username):
    return bool(get_user(username))


def get_user(username):
    user = db.getdb().user.find_one({'username': username})
    if user:
        del user['_id']
    return user


def populate_db():
    with open('users.json') as f:
        users = json.load(f)['users']
    for user in users:
        db.user.update(
            {'username': user['username']},
            user,
            upsert=True
        )


def is_valid(user):
    try:
        username = user['username']
        assert USERNAME_REGEX.match(username)
        return True
    except Exception:
        return False


def normalized(user):
    if 'password' in user:
        password = user['password']
        del user['password']
        user['salt'] = salt = gen_salt()
        user['hashed_password'] = get_hashed_password(password, salt)
    if 'ctime' not in user:
        user['ctime'] = datetime.datetime.utcnow().strftime(DATETIME_FORMAT)
    return user


def gen_salt():
    return binascii.hexlify(os.urandom(32))


def get_hashed_password(password, salt, iterations=100000):
    hashed_pwd = hashlib.pbkdf2_hmac('sha256', password, salt, iterations)
    return binascii.hexlify(hashed_pwd)
