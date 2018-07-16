class InvalidAuth(Exception): pass
class Interval(Exception): pass
class NotAllowed(Exception): pass
class Existed(Exception): pass
class BadRequest(Exception): pass
class ServerError(Exception): pass

BadRequest_400 = 400
Forbidden_403 = 403
Conflict_409 = 409
InternalServerError_500 = 500

class Error(Exception):

    def __init__(self, msg):
        super(Error, self).__init__(msg)
        self.status_code = 400

class NotFound(Error):

    def __init__(self, res):
        msg = '{} not found'.format(res)
        super(NotFound, self).__init__(msg)
        self.status_code = 404
