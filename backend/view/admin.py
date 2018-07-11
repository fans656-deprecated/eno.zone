import db
import util

@util.require_admin_login
def get_users():
    r = db.getdb().user.find({}, {'_id': False})
    return {
        'users': list(r)
    }
