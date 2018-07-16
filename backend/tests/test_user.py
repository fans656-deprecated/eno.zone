# coding: utf-8
import json
from pprint import pprint

from . import util
from user import User


def run():
    print 'test invalid logins'

    # username and password must be present
    r = util.post('/api/login')
    assert r.status_code != 200

    # password must be present
    r = util.post('/api/login', {'username': ''})
    assert r.status_code != 200

    # username must be present
    r = util.post('/api/login', {'password': ''})
    assert r.status_code != 200

    # username can't be empty
    r = util.post('/api/login', {'username': '', 'password': ''})
    assert r.status_code != 200

    test_user = User.get_user('test_user')
    if test_user:
        test_user.delete()

    # non-exist user can't login
    r = util.post('/api/login', {'username': 'test_user', 'password': ''})
    assert r.status_code != 200

    print 'test invalid sign up'

    # "root" is a reserved username
    r = util.post('/api/signup', {'username': 'root', 'password': ''})
    assert r.status_code != 200

    # "admin" is a reserved username
    r = util.post('/api/signup', {'username': 'admin', 'password': ''})
    assert r.status_code != 200

    # username can't be empty
    r = util.post('/api/signup', {'username': '', 'password': ''})
    assert r.status_code != 200

    # username can't be too long
    r = util.post('/api/signup', {'username': 'a' * 256, 'password': ''})
    assert r.status_code != 200

    # password can't be too long
    r = util.post('/api/signup', {'username': 'a' * 256, 'password': 'a' * 256})
    assert r.status_code != 200

    # username must be valid
    invalid_usernames = (
        '*', '?', 'hello, you', '+++', '\0\1',
        u'中文',
    )
    for invalid_username in invalid_usernames:
        r = util.post('/api/signup', {
            'username': invalid_username, 'password': 'a' * 256
        })
        assert r.status_code != 200

    print 'test sign up'

    # normal sign up
    r = util.post('/api/signup', {'username': 'test_user', 'password': ''})
    assert r.status_code == 200

    # normal log in
    r = util.post('/api/login', {'username': 'test_user', 'password': ''})
    assert r.status_code == 200

    print 'test user info query'

    # normal user info query
    r = util.get('/api/user/test_user')
    assert r.status_code == 200

    # query non-exist user info
    r = util.get('/api/user/asdf')
    assert r.status_code != 200

    print 'test user info change'

    # one can't change other's user info
    r = util.put('/api/user/test_user', {
        'avatar_url': '/foo.jpg'
    })
    assert r.status_code != 200

    # normal change user info
    user = User.get_user('test_user')
    r = util.put('/api/user/test_user', {
        'foo': 'bar'
    }, cookies={'token': user.token})
    assert r.status_code == 200

    # assert the change is done
    r = util.get('/api/user/test_user')
    assert 'foo' in json.loads(r.text)

    # delete field in user info
    r = util.put('/api/user/test_user', {
        'foo': None
    }, cookies={'token': user.token})
    assert r.status_code == 200

    # assert the change is done
    r = util.get('/api/user/test_user')
    assert 'foo' not in json.loads(r.text)

    # clean up
    test_user = User.get_user('test_user')
    if test_user:
        test_user.delete()
