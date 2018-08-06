from __future__ import absolute_import
from flask import request

import db
import util
import conf
import noter
from user import User
from errors import NotFound


def get_note(note_id):
    note = noter.get_note(note_id)
    if '.' in note.get('tags', []) and not util.is_visitor_owner():
        return util.error_response('Unauthorized')
    return util.success_response(note)


def query_note():
    query = request.json
    if not query:
        return util.error_response('bad request')
    if 'url' in query:
        note = db.get_note_with_url(query['url'])
        return util.success_response({'note': note})
    if 'alias' in query:
        note = db.get_note_with_alias(query['alias'])
        return util.success_response({'note': note})
    if 'type' in query:
        notes = db.query_notes_by_type(query['type'])
        return util.success_response({'notes': notes})
    else:
        return util.error_response('bad request')


def query_notes():
    query = request.json
    if query:
        collection_name = query.get('collection')
        if collection_name and isinstance(collection_name, (str, unicode)):
            return get_notes({
                'collections': collection_name
            })
    return get_notes()


def get_notes(q=None):
    page = max(int(request.args.get('page', 1)), 1)
    size = max(int(request.args.get('size', 20)), 1)

    #owner_username = request.args.get('owner')
    owner_username = conf.owner
    owner = User.get_user(owner_username)

    if owner:
        visitor = util.get_visitor()
        q = q or {}
        q.update({
            'owner': owner['username'],
        })
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
    print note
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


def post_comment(note_id):
    comment = request.json
    if noter.post_comment(note_id, comment):
        return util.success_response()
    else:
        return util.error_response('post comment error')


@util.require_owner_login
def delete_comment(note_id, comment_id):
    if noter.delete_comment(note_id, comment_id):
        return util.success_response()
    else:
        return util.error_response('delete comment error')
