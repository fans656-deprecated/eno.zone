import pymongo


def getdb(g={}):
    if 'db' not in g:
        g['db'] = pymongo.MongoClient().enozone
    return g['db']


if __name__ == '__main__':
    db = getdb()

    r = db.note.find({})
    a = list(r)
    for note in a:
        if note['type'] != 'markdown':
            print note
            break
