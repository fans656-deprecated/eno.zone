import noter
import pymongo

r = noter.get_notes({
})
notes = r['notes']
print notes[0]


#print noter.get_note(0)



#db = pymongo.MongoClient().enozone
#r = db.note.find({
#    'owner': 'foo'
#})
#print r.count()
