class Note(object):

    @staticmethod
    def get_note(owner, note_id):
        return get_note(owner, note_id)

    @staticmethod
    def get_notes(query):
        return get_notes(query)

    def __init__(self):
        pass

    @property
    def type(self):
        pass

    @property
    def owner(self):
        pass

    def delete(self):
        pass


def get_note(owner, note_id):
    pass


def get_notes(query):
    pass
