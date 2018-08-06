# coding: utf-8
import pymongo


def getdb(g={}):
    if 'db' not in g:
        g['db'] = pymongo.MongoClient().enozone
    return g['db']


def get_user(username):
    """
    Args:
        username (str/unicode)
    Returns:
        `dict` representing user info if the user with `username` exist, like:
            {
                u'username': u'fans656',
                u'hashed_password': u'ty72b3...',
                u'salt': u'4112a0...',
                u'ctime': u'2017-06-30 09:20:20.412087 UTC',
                u'avatar_url': u'/res/site/avatar/fans656.jpg',
            }
        or `None` if user with `username` does not exist
    """
    return getdb().user.find_one({'username': username}, {'_id': False})


def get_users():
    r = getdb().user.find({}, {'_id': False})
    return list(r)


def delete_user(username):
    return getdb().user.remove({'username': username})['n'] == 1


def create_user(user_dict):
    return getdb().user.insert_one(user_dict).acknowledged


def update_user(user_dict):
    return getdb().user.update({'username': user_dict['username']}, user_dict)


def get_note_with_url(url):
    notes = list(getdb().note.find({'urls': url}, {'_id': False}))
    return notes[0] if notes else None


def get_note_with_alias(alias):
    notes = list(getdb().note.find({'alias': alias}, {'_id': False}))
    return notes[0] if notes else None


def query_notes_by_type(type):
    notes = list(getdb().note.find({'type': type}, {'_id': False}))
    return notes


if __name__ == '__main__':
    from yaml import load
    from noter import noter
    notes = list(getdb().note.find({}))
    #getdb().note.remove({'id': {'$gt': 1277}})
    note = notes[-1]
    print note
    exit()

    with open(u'../../t.txt') as f:
        books = load(f)
    print '\n' * 10
    for book in books:
        metaContent = ''
        metaContent += u'type: book\n'
        metaContent += u'name: {}\n'.format(book['name'])
        metaContent += u'status: read\n'

        note = {
            'type': 'book',
            'name': book['name'],
            'owner': 'fans656',
        }

        if book.get('date'):
            metaContent += 'enddate: {}\n'.format(book['date'])
            note['enddate'] = str(book['date'])
        if book.get('begdate'):
            metaContent += 'begdate: {}\n'.format(book['begdate'])
            note['begdate'] = str(book['begdate'])
        if book.get('author'):
            metaContent += u'author: {}\n'.format(book['author'])
            note['author'] = book['author']
        note['content'] = book.get('comment', '')
        note['metaContent'] = metaContent
        print note
        noter.put_note(note)
    #print list(notes)[-1]
