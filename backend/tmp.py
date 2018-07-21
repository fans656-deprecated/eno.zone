import pymongo


db = pymongo.MongoClient().enozone
r = db.node.find({})
for t in r:
    print t
