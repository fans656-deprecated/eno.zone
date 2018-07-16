import db
import util

@util.require_admin_login
def get_users():
    return {
        'users': db.get_users()
    }
