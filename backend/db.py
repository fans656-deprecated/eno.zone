import pymongo


def getdb(g={}):
    if 'db' not in g:
        g['db'] = pymongo.MongoClient().enozone
    return g['db']


if __name__ == '__main__':
    db = getdb()

    r = db.user.find({})
    for user in r:
        del user['_id']
        print user
