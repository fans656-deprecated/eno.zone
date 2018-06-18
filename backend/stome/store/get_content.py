from .. import db
from . import storage as mod_storage
from . import storages as mod_storages


def get(md5, storage_id):
    storage = mod_storage.get(storage_id)
    storage_type = storage.type
    module = getattr(mod_storages, storage_type)
    Content = getattr(module, 'Content')

    content_id = make_id(md5, storage_id)
    meta = db.getdb().content.find_one({'_id': content_id})
    if meta:
        content = Content(meta, True)
    else:
        meta = {
            'md5': md5,
            'storage_id': storage_id,
            'status': 'init',
            'ref_count': 1,
            '_id': content_id,
        }
        content = Content(meta, False)
    content.init_extra()
    return content


def make_id(md5, storage_id):
    return md5 + '-' + storage_id
