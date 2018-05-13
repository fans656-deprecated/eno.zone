#import view_user, view_misc
#import view_read, view_gallery, view_leetcode
import view

endpoints = [
    # login
    ('POST', '/api/login', view.user.post_login),
    ('POST', '/api/signup', view.user.post_signup),

    # profile
    #('POST', '/profile/<username>/avatar', view_user.post_avatar),

    # -------------------------------------------------- view_blog

    # note
    ('GET', '/api/note/<int:note_id>', view.note.get_note),
    ('GET', '/api/note', view.note.get_notes),
    ('POST', '/api/note', view.note.post_note),
    ('PUT', '/api/note/<int:note_id>', view.note.put_note),
    ('DELETE', '/api/note/<int:note_id>', view.note.delete_note),

    ## comment
    #('GET', '/api/blog/<int:blog_id>/comment', view_blog.get_comments),
    #('POST', '/api/blog/<int:blog_id>/comment', view_blog.post_comment),
    #('DELETE', '/api/blog/<int:doc_id>/comment/<int:comment_id>', view_blog.delete_comment),

    ## --------------------------------------------------

    ## read
    #('GET', '/api/read/<int:blog_id>', view_read.get_read),

    ## gallery
    #('POST', '/api/get-gallery', view_gallery.get_gallery),

    ## leetcode-statistics
    #('GET', '/api/leetcode-statistics', view_leetcode.get_statistics),

    ## misc
    #('GET', '/api/custom-url/<path:path>', view_misc.get_custom_url),
    #('GET', '/api/<path:path>', view_misc.no_such_api),

    #('GET', '/static/<path:path>', view_misc.get_static),
    #('GET', '/file/<path:path>', view_misc.get_file),
]
