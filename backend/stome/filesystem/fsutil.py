import os

from .. import db
from .. import util
from .. import store
from ..user import root_user
from .access import get_node
from .node import make_node_by_meta


def initialized():
    return get_node(root_user, '/').exists


def initialize():
    print 'First erase everything, are you sure?'
    if not raw_input().strip():
        return 'bye'
    erase_everything()
    print 'Init storages...'
    storages = init_storages()
    if not storages:
        raise 'No storages, bye'
    print 'Creating root dir...'
    create_root_dir([s.id for s in storages])


def init_storages():
    templates = store.storages.get_templates()
    storages = []
    for template in templates:
        print 'Init storage from template', template
        storage = store.storage.get(None)
        storage.update(template)
        storages.append(storage)
    return storages


def erase_everything():
    db.getdb().node.remove()
    db.getdb().storage.remove()
    db.getdb().content.remove()


def create_root_dir(storage_ids):
    now = util.utc_now_str()
    meta = {
        'type': 'dir',
        'path': '/',
        'name': '',
        'parent_path': '',
        'owner': 'root',
        'group': 'root',
        'ctime': now,
        'mtime': now,
        'access': 0775,
        'storage_ids': storage_ids,
        'size': 0,
    }
    make_node_by_meta(meta)
    return get_node(root_user, '/')


def create_public_dir(path):
    node = get_node(root_user, path)
    node.create_as_dir()
    node.chmod(0777)
    return node


def create_home_dir_for(user):
    node = get_node(root_user, user.home_path)
    node.create_as_dir()
    username = user.username
    node.chown(username)
    node.chgrp(username)
    return node


def create_dir_under_home(user, path):
    node = get_node(user, os.path.join(user.home_path, path))
    node.create_as_dir()
    return node
