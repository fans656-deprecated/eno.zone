import os
import json
import hashlib

from .. import db
from .. import conf
from . import storage as mod_storage


class Content(object):

    def __init__(self, meta, exists):
        self._meta = meta
        self.exists = exists

    @property
    def meta(self):
        storage = mod_storage.get(self.storage_id)
        meta = dict(self._meta)
        del meta['_id']
        meta.update({
            'type': storage.type,
        })
        return meta

    @property
    def md5(self):
        return self._meta['md5']

    @property
    def storage_id(self):
        return self._meta['storage_id']

    @property
    def status(self):
        return self._meta['status']

    @property
    def ref_count(self):
        return self._meta['ref_count']

    @ref_count.setter
    def ref_count(self, count):
        if count:
            self.update_meta({'ref_count': count})
        else:
            self.delete()

    @property
    def id(self):
        return self._meta['_id']

    @property
    def storage(self):
        return mod_storage.get(self.storage_id)

    def create(self):
        db.getdb().content.insert_one(self._meta)

    def delete(self):
        self.delete_content()
        db.getdb().content.remove({'_id': self.id})

    def update_meta(self, meta):
        self._meta.update(meta)
        self.serialize()

    def serialize(self):
        db.getdb().content.update({'_id': self.id}, self._meta)

    def __nonzero__(self):
        return self.exists

    def init_extra(self):
        pass

    def query(self, args):
        pass

    def delete_content(self):
        pass
