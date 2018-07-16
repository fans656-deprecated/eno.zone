import os
import hashlib
import binascii

import jwt

import db
import conf
import util
from errors import Error


class User(object):

    @staticmethod
    def create(username, password):
        if not username:
            raise Error('username can not be empty')
        if username in conf.reserved_usernames:
            raise Error('username "{}" is reserved'.format(username))
        if len(username) > conf.username_max_length:
            raise Error('username too long')
        if len(password) > conf.password_max_length:
            raise Error('password too long')
        if not conf.valid_username_regex.match(username):
            raise Error('invalid username')
        salt = generate_salt()
        hashed_password = hash_password(password, salt)
        ctime = util.utcnow_as_str()
        if not db.create_user({
            'username': username,
            'salt': salt,
            'hashed_password': hashed_password,
            'ctime': ctime,
        }):
            raise Exception('create user failed')
        return User.get_user(username)

    @staticmethod
    def get_user(username):
        user_dict = db.get_user(username)
        if user_dict is None:
            return None
        return User(user_dict)

    def __init__(self, user_dict):
        if not isinstance(user_dict, dict):
            raise Exception
        self._user_dict = user_dict or {}

    @property
    def exists(self):
        return bool(db.get_user(self.username))

    @property
    def username(self):
        return self['username']

    @property
    def avatar_url(self):
        return self['avatar_url'] or conf.default_avatar_url

    @property
    def hashed_password(self):
        return self['hashed_password']

    @property
    def salt(self):
        return self['salt']

    @property
    def token(self):
        token_dict = {
            'username': self.username
        }
        return jwt.encode(token_dict, conf.auth_prikey, algorithm='RS512')

    @property
    def user_dict(self):
        ret = dict(self._user_dict)
        ret.update({
            'avatar_url': self.avatar_url,
        })
        return ret

    def update(self, dict_patch):
        dict_patch.pop('hashed_password', None)
        dict_patch.pop('salt', None)
        dict_patch.pop('ctime', None)
        self._user_dict.update(dict_patch)
        for key, val in self._user_dict.items():
            if val is None:
                del self._user_dict[key]
        return db.update_user(self._user_dict)

    def is_password_correct(self, password):
        hashed_password = hash_password(password, self.salt)
        return hashed_password == self.hashed_password

    def delete(self):
        return db.delete_user(self.username)

    def __getitem__(self, key):
        return self._user_dict.get(key, '')

    def __iter__(self):
        return iter(self._user_dict)


def generate_salt():
    return binascii.hexlify(os.urandom(32))


def hash_password(password, salt, iterations=100000):
    hashed_pwd = hashlib.pbkdf2_hmac('sha256', password, salt, iterations)
    return binascii.hexlify(hashed_pwd)
