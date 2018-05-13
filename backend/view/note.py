from flask import request

import util
import noter
import auther


def get_note(note_id):
    return util.success_response(noter.get_note(note_id))


def get_notes():
    page = max(int(request.args.get('page', 1)), 1)
    size = max(int(request.args.get('size', 20)), 1)

    owner_username = request.args.get('owner')
    owner = auther.get_user(owner_username)

    if owner:
        visitor = util.get_visitor()
        q = {
            'owner': owner['username'],
        }
        if not util.is_owner(visitor, owner):
            q.update({
                'tags': {'$not': {'$eq': '.'}}
            })
        r = noter.get_notes({
            'skip': (page - 1) * size,
            'size': size,
            'qs': [q],
        })
        return util.success_response({
            'notes': r['notes'],
            'skip': r['skip'],
            'total': r['total'],
            'pagination': {
                'page': page,
                'size': size,
                'nPages': (r['total'] + size - 1) / size,
            }
        })
    else:
        return util.success_response({
            'notes': [],
            'skip': 0,
            'total': 0,
            'pagination': {
                'page': page,
                'size': size,
                'nPages': 0,
            }
        })


@util.require_owner_login
def put_note(note_id):
    note = request.json
    note['id'] = note_id
    if noter.put_note(note):
        return util.success_response()
    else:
        return util.error_response('put error')


@util.require_owner_login
def post_note():
    note = request.json
    note = noter.put_note(note)
    return util.success_response(note)


@util.require_owner_login
def delete_note(note_id):
    if noter.delete_note(note_id):
        return util.success_response()
    else:
        return util.error_response('delete error')
