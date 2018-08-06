import db
import util


def get_note(note_id):
    """
    return note with id == <note_id>
    if not found, return None

    Example:

        get_note(328)
        => {'content': 'test', 'id': 328, 'ctime': '2018-05-09 22:25:34 UTC'}
    """
    return db.getdb().note.find_one({'id': note_id}, {'_id': False})


def get_notes(q):
    """
    get_notes({
        'skip': 0,
        'size': 20,
        'qs': [{'$not': {'tag': '.'}}]
    })
    """
    q = q or {}

    skip = max(int(q.get('skip', 0)), 0)
    size = max(float(q.get('size', float('inf'))), 0)
    queries = q.get('qs', [{}])

    results = []
    i_beg = skip
    i_end = i_beg + size
    i_cur = 0
    total = 0
    # TODO: this can be optimized
    for query in queries:
        r = dbfind(query)
        total += r.count()
        for item in r:
            if i_cur < i_beg:
                pass
            elif i_cur < i_end:
                results.append(item)
            else:
                break
            i_cur += 1
    return {
        'notes': results,
        'skip': skip,
        'total': total,
    }


def put_note(note):
    """
    insert or update note
    if 'id' is absent, create a new one
    'ctime' will be added to the note if not present
    return the added note

    Example:

        put_note({'content': 'test'})
        => {'content': 'test', 'id': 1, 'ctime': '2018-05-09 22:02:17 UTC'}
    """
    if 'id' not in note:
        note['id'] = new_note_id()
    if 'ctime' not in note:
        note['ctime'] = util.utcnow_as_str()
    db.getdb().note.update({'id': note['id']}, note, upsert=True)
    return note


def delete_note(note_id):
    r = db.getdb().note.remove({'id': note_id})
    return r['n'] == 1


def post_comment(note_id, comment):
    note = get_note(note_id)
    if not note:
        return False
    if 'comments' not in note:
        note['comments'] = []
    comment['id'] = max([c['id'] for c in note['comments']] + [0]) + 1
    comment['ctime'] = util.utcnow_as_str()
    note['comments'].append(comment)
    return put_note(note)


def delete_comment(note_id, comment_id):
    note = get_note(note_id)
    if not note or 'comments' not in note:
        return False
    try:
        i = next(i for i, c in enumerate(note['comments']) if c['id'] == comment_id)
        del note['comments'][i]
        return put_note(note)
    except Exception:
        return False


def dbfind(query):
    return db.getdb().note.find(query, {'_id': False}).sort([
        ('ctime', -1),
        ('id', -1),
    ])


def new_note_id():
    r = db.getdb().note.find().sort([('id', -1)]).limit(1)[0]
    if r:
        return r['id'] + 1
    else:
        return 1
